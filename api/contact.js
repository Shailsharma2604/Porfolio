const { sendContactEmail } = require('../lib/contact-mail');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { name, email, message } = req.body || {};
  if (!name?.trim() || !email?.trim() || !message?.trim()) {
    res.status(400).json({ error: 'Name, email, and message are required' });
    return;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    res.status(400).json({ error: 'Invalid email address' });
    return;
  }

  try {
    const result = await sendContactEmail({ name, email, message });
    if (!result.delivered) {
      res.status(503).json({
        error: 'Contact email is not configured. Set RESEND_API_KEY in Vercel environment variables.',
        code: 'not_configured',
      });
      return;
    }
    res.status(200).json({ ok: true, message: 'Message sent', id: result.emailId || undefined });
  } catch (err) {
    console.error('[contact]', err.message);
    res.status(502).json({
      error: err.message || 'Could not send message. Please try again or email directly.',
      code: 'send_failed',
    });
  }
};
