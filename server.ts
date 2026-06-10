import express from "express";
import { createServer as createViteServer } from "vite";
import * as path from "path";
import cors from "cors";

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
