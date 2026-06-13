import { createClient } from '@vercel/kv';

export default async function handler(request, response) {
  // Support Cors
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (request.method === 'OPTIONS') {
    return response.status(200).end();
  }

  // Retrieve environment variables. Priority: KV_REDIS_URL (which might contain REST API url on Vercel),
  // then standard KV_REST_API_URL / KV_REST_API_TOKEN.
  // Note: Vercel KV SDK expects REST credentials.
  const redisUrl = process.env.KV_REST_API_URL || process.env.KV_REDIS_URL;
  const token = process.env.KV_REST_API_TOKEN;

  if (!redisUrl) {
    return response.status(500).json({
      success: false,
      error: 'Environment variable KV_REDIS_URL or KV_REST_API_URL is not set. Please configure Vercel KV.'
    });
  }

  try {
    // Check if the URL is a standard Redis URL (e.g., redis://) or REST URL (https://)
    // Vercel KV SDK requires the REST URL and TOKEN. If KV_REDIS_URL starts with redis://,
    // Vercel KV library might automatically fallback to process.env.KV_REST_API_URL if we use the default exported 'kv' from '@vercel/kv'.
    // Here we'll configure createClient adaptively.
    let kvClient;
    if (redisUrl.startsWith('http://') || redisUrl.startsWith('https://')) {
      kvClient = createClient({
        url: redisUrl,
        token: token || '',
      });
    } else {
      // If it is redis://, we should try using `@vercel/kv` default client which binds to standard env,
      // or if they have custom URL we can use that.
      // For Vercel, the standard export 'kv' automatically connects using KV_REST_API_URL and KV_REST_API_TOKEN.
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
