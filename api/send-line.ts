/**
 * Vercel Serverless: ส่งข้อความ LINE (ข้อความธรรมดา)
 * ใช้ตัวแปรสภาพแวดล้อม: LINE_CHANNEL_ACCESS_TOKEN, LINE_GROUP_ID
 */
export default async function handler(req: { method?: string; body?: unknown }, res: { setHeader: (k: string, v: string) => void; status: (n: number) => { end: () => void; json: (x: unknown) => void }; end?: () => void }) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  const defaultGroupId = process.env.LINE_GROUP_ID;

  if (!token) {
    console.error('LINE_CHANNEL_ACCESS_TOKEN is not set');
    return res.status(500).json({ error: 'LINE not configured. Set LINE_CHANNEL_ACCESS_TOKEN in environment.' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const { to = defaultGroupId, messages } = body || {};

    if (!to || !messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Missing required fields: to (or LINE_GROUP_ID), messages' });
    }

    const response = await fetch('https://api.line.me/v2/bot/message/push', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ to, messages }),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error('LINE API error:', response.status, text);
      return res.status(response.status).json({ error: text || 'Failed to send LINE message' });
    }

    return res.status(200).json({ message: 'LINE sent' });
  } catch (e) {
    console.error('send-line error:', e);
    return res.status(500).json({ error: String(e) });
  }
}
