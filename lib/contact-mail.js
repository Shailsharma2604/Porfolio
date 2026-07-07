/**
 * Send portfolio contact form messages via Resend (https://resend.com).
 * Requires RESEND_API_KEY in env. Without it, submissions are logged only.
 */

const DEFAULT_TO = 'shail020604@gmail.com';
const DEFAULT_FROM = 'onboarding@resend.dev';

function isLocalDev() {
  if (process.env.VERCEL === '1') return process.env.VERCEL_ENV === 'development';
  return true;
}

function buildContactMailto({ name, email, message }) {
  const to = (process.env.CONTACT_TO_EMAIL || DEFAULT_TO).trim();
  const subject = `Portfolio contact from ${name.trim()}`;
  const body = `Hi Shail,\n\n${message.trim()}\n\n— ${name.trim()} (${email.trim()})`;
  return `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

function escapeHtml(value) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function parseResendError(status, bodyText) {
  try {
    const parsed = JSON.parse(bodyText);
    const message = parsed?.message || parsed?.error || bodyText;
    if (status === 403 && /only send.*verified/i.test(message)) {
      return `Resend sandbox: ${message} Set CONTACT_TO_EMAIL to your verified Resend account email.`;
    }
    if (status === 422) {
      return `Resend rejected the email: ${message}`;
    }
    return `Resend ${status}: ${message}`;
  } catch {
    return `Resend ${status}: ${bodyText.slice(0, 200)}`;
  }
}

async function sendContactEmail({ name, email, message }) {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const to = (process.env.CONTACT_TO_EMAIL || DEFAULT_TO).trim();
  const from = (process.env.RESEND_FROM_EMAIL || process.env.CONTACT_FROM_EMAIL || DEFAULT_FROM).trim();
  const trimmedName = name.trim();
  const trimmedEmail = email.trim();
  const trimmedMessage = message.trim();

  if (!apiKey) {
    console.warn('[contact] RESEND_API_KEY not set — logged only (not emailed):', {
      name: trimmedName,
      email: trimmedEmail,
      message: trimmedMessage.slice(0, 500),
    });
    return { delivered: false, reason: 'not_configured' };
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: [to],
      reply_to: trimmedEmail,
      subject: `Portfolio inquiry from ${trimmedName}`,
      html: [
        '<h2>New portfolio contact</h2>',
        `<p><strong>Name:</strong> ${escapeHtml(trimmedName)}</p>`,
        `<p><strong>Email:</strong> <a href="mailto:${escapeHtml(trimmedEmail)}">${escapeHtml(trimmedEmail)}</a></p>`,
        '<p><strong>Message:</strong></p>',
        `<p style="white-space:pre-wrap">${escapeHtml(trimmedMessage)}</p>`,
        `<hr><p style="color:#666;font-size:14px">Reply directly to reach ${escapeHtml(trimmedName)}.</p>`,
      ].join('\n'),
      text: `${trimmedMessage}\n\n— ${trimmedName} (${trimmedEmail})`,
    }),
  });

  const bodyText = await res.text();

  if (!res.ok) {
    throw new Error(parseResendError(res.status, bodyText));
  }

  let emailId = null;
  try {
    emailId = JSON.parse(bodyText)?.id || null;
  } catch {
    /* ignore */
  }

  console.log('[contact] emailed to', to, 'from', trimmedEmail, emailId ? `(id: ${emailId})` : '');
  return { delivered: true, emailId };
}

module.exports = { sendContactEmail, buildContactMailto, isLocalDev };
