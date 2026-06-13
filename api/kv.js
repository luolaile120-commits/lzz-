import { createClient } from '@vercel/kv';

export default async function handler(request, response) {
  // Support Cors
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (request.method === 'OPTIONS') {
    return response.status(200).end();
  }

  // Retrieve environment variables. Priority: KV_REST_API_URL, then KV_REDIS_URL / KV_URL.
  // Note: Vercel KV/Upstash SDK expects REST credentials (https:// url and token).
  let redisUrl = process.env.KV_REST_API_URL || process.env.KV_REDIS_URL || process.env.KV_URL;
  let token = process.env.KV_REST_API_TOKEN;

  if (redisUrl) {
    redisUrl = redisUrl.trim().replace(/^['"]|['"]$/g, '');
  }
  if (token) {
    token = token.trim().replace(/^['"]|['"]$/g, '');
  }

  if (!redisUrl) {
    return response.status(500).json({
      success: false,
      error: 'Environment variable KV_REDIS_URL, KV_REST_API_URL or KV_URL is not set. Please configure Vercel KV.'
    });
  }

  try {
    let kvClient;
    
    // Parse dynamic redis/rediss connection strings into Upstash REST format
    if (redisUrl.startsWith('redis://') || redisUrl.startsWith('rediss://')) {
      try {
        const parsed = new URL(redisUrl);
        redisUrl = `https://${parsed.hostname}`;
        if (parsed.password) {
          token = parsed.password;
        }
      } catch (err) {
        console.error('Error parsing redis connection URL as Rest URL:', err);
      }
    }

    if (redisUrl.startsWith('http://') || redisUrl.startsWith('https://')) {
      kvClient = createClient({
        url: redisUrl,
        token: token || '',
      });
    } else {
      const m = await import('@vercel/kv');
      kvClient = m.kv;
    }

    if (request.method === 'GET') {
      const dataStr = await kvClient.get('schedule_data');
      // The `@vercel/kv` client might automatically parse JSON into an object,
      // but to ensure strict JSON string compatibility, we'll serialize/return it cleanly.
      let parsedData = null;
      if (dataStr) {
        parsedData = typeof dataStr === 'string' ? JSON.parse(dataStr) : dataStr;
      }
      return response.status(200).json({
        success: true,
        data: parsedData
      });
    } else if (request.method === 'POST') {
      const { data } = request.body;
      if (data === undefined) {
        return response.status(400).json({
          success: false,
          error: 'Missing field "data" in request body'
        });
      }
      
      // Serialize database entry
      const serializedData = typeof data === 'string' ? data : JSON.stringify(data);
      await kvClient.set('schedule_data', serializedData);
      
      return response.status(200).json({
        success: true,
        message: 'Saved successfully'
      });
    } else {
      return response.status(405).json({
        success: false,
        error: 'Method not allowed'
      });
    }
  } catch (error) {
    console.error('KV Storage Error:', error);
    return response.status(500).json({
      success: false,
      error: `Storage interaction failed: ${error.message}`
    });
  }
}
