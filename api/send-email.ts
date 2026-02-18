/**
 * Vercel Serverless: ส่งอีเมลผ่าน Resend
 * ใช้ตัวแปรสภาพแวดล้อม: RESEND_API_KEY, FROM_EMAIL
 */
export default async function handler(req: { method?: string; body?: unknown }, res: { setHeader: (k: string, v: string) => void; status: (n: number) => { end: () => void; json: (x: unknown) => void }; end?: () => void }) {
  // CORS: ให้ frontend (localhost + Vercel) เรียกได้
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.FROM_EMAIL || 'onboarding@resend.dev';

  if (!apiKey) {
    console.error('RESEND_API_KEY is not set');
    return res.status(500).json({ error: 'Email not configured. Set RESEND_API_KEY in environment.' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const { from = fromEmail, to, subject, html } = body || {};

    if (!to || !subject || !html) {
      return res.status(400).json({ error: 'Missing required fields: to, subject, html' });
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: from || fromEmail,
        to: Array.isArray(to) ? to : [to],
        subject,
        html,
      }),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      console.error('Resend API error:', response.status, data);
      return res.status(response.status).json({ error: data.message || 'Failed to send email' });
    }

    return res.status(200).json({ id: data.id, message: 'Email sent' });
  } catch (e) {
    console.error('send-email error:', e);
    return res.status(500).json({ error: String(e) });
  }
}
