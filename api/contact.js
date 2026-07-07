const { sendContactEmail, buildContactMailto, isLocalDev } = require('../lib/contact-mail');

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
      if (isLocalDev()) {
        res.status(200).json({
          ok: true,
          message: 'Message logged locally (RESEND_API_KEY not set — not emailed)',
          dev: true,
        });
        return;
      }
      res.status(503).json({
        error: 'Email delivery is not configured on this deployment.',
        code: 'not_configured',
        mailto: buildContactMailto({ name, email, message }),
        contactEmail: (process.env.CONTACT_TO_EMAIL || 'shail020604@gmail.com').trim(),
      });
      return;
    }
    res.status(200).json({ ok: true, message: 'Message sent', id: result.emailId || undefined });
  } catch (err) {
    console.error('[contact]', err.message);
    res.status(502).json({
      error: err.message || 'Could not send message. Please try again or email directly.',
      code: 'send_failed',
      mailto: buildContactMailto({ name, email, message }),
      contactEmail: (process.env.CONTACT_TO_EMAIL || 'shail020604@gmail.com').trim(),
    });
  }
};
