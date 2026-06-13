import express from "express";
import { createServer as createViteServer } from "vite";
import * as path from "path";
import cors from "cors";
import Redis from "ioredis";
import dotenv from "dotenv";

dotenv.config();

let redisClient: Redis | null = null;

function getRedisClient() {
  if (!redisClient) {
    const redisUrl = process.env.KV_REDIS_URL || "redis://default:b8fcXFu8fFBxNYo45phx3ob5sUe69JNi@thatch-caption-side-46195.db.redis.io:10087";
    redisClient = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        const delay = Math.min(times * 100, 2000);
        return delay;
      }
    });
    
    redisClient.on("error", (err) => {
      console.error("Redis client error:", err);
    });
  }
  return redisClient;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // Sync Sessions Memory Store
  const syncSessions = new Map<string, { data?: any; status: 'waiting' | 'ready'; createdAt: number }>();

  // Cleanup old sessions every 5 mins
  setInterval(() => {
    const now = Date.now();
    for (const [id, session] of syncSessions.entries()) {
      if (now - session.createdAt > 10 * 60 * 1000) {
        syncSessions.delete(id);
      }
    }
  }, 5 * 60 * 1000);

  app.post("/api/sync/create", (req, res) => {
    let sessionId;
    do {
      sessionId = Math.floor(1000 + Math.random() * 9000).toString();
    } while (syncSessions.has(sessionId));
    const { data } = req.body;
    syncSessions.set(sessionId, { data, status: data ? 'ready' : 'waiting', createdAt: Date.now() });
    res.json({ sessionId });
  });

  app.get("/api/sync/:id", (req, res) => {
    const session = syncSessions.get(req.params.id);
    if (!session) {
      return res.status(404).json({ error: "Session not found or expired" });
    }
    res.json({ status: session.status, data: session.data });
  });

  app.post("/api/sync/:id", (req, res) => {
    const session = syncSessions.get(req.params.id);
    if (!session) {
      return res.status(404).json({ error: "Session not found or expired" });
    }
    session.data = req.body.data;
    session.status = "ready";
    res.json({ success: true });
  });

  // Vercel KV / Upstash Redis sync endpoints
  app.get("/api/kv", async (req, res) => {
    try {
      const client = getRedisClient();
      const raw = await client.get("app_data");
      if (!raw) {
        return res.json({ state: null });
      }
      res.json(JSON.parse(raw));
    } catch (error: any) {
      console.error("Vercel KV GET error:", error);
      res.status(500).json({ error: error.message || "获取云端数据失败" });
    }
  });

  app.post("/api/kv", async (req, res) => {
    try {
      const client = getRedisClient();
      const stateData = req.body;
      if (!stateData) {
        return res.status(400).json({ error: "数据为空" });
      }
      await client.set("app_data", JSON.stringify(stateData));
      res.json({ success: true });
    } catch (error: any) {
      console.error("Vercel KV POST error:", error);
      res.status(500).json({ error: error.message || "储存云端数据失败" });
    }
  });

  app.get("/raw.txt", (req, res) => {
    const filePath = path.join(process.cwd(), 'dist', 'index.html');
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.sendFile(filePath);
  });

  app.get("/standalone", (req, res) => {
    const filePath = path.join(process.cwd(), 'dist', 'schedule-app-standalone.html');
    res.sendFile(filePath);
  });

  app.get("/download-app", (req, res) => {
    const filePath = path.join(process.cwd(), 'dist', 'schedule-app-standalone.html');
    res.download(filePath, 'schedule-app.html', (err) => {
      if (err) {
        console.error('Error downloading the file:', err);
        res.status(404).send("File not found. Please wait for the build to complete.");
      }
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
