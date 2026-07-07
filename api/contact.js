const { sendContactEmail, buildContactHandlerResponse } = require('../lib/contact-mail');

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
    const { status, body } = buildContactHandlerResponse({ name, email, message }, result);
    res.status(status).json(body);
  } catch (err) {
    console.error('[contact]', err.message);
    const { status, body } = buildContactHandlerResponse(
      { name, email, message },
      { delivered: false, reason: 'mailto_fallback', code: 'send_failed', detail: err.message }
    );
    res.status(status).json(body);
  }
};
