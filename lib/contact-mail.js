/**
 * Send portfolio contact form messages via Resend (https://resend.com).
 * Requires RESEND_API_KEY in env. Without it, submissions are logged only.
 */

/** Resend account owner email — sandbox/testing only delivers here until a domain is verified. */
const RESEND_SANDBOX_OWNER_EMAIL = 'shailsharma020604@gmail.com';
/** Public portfolio contact email shown in UI and mailto fallbacks. */
const PUBLIC_CONTACT_EMAIL = 'shail020604@gmail.com';

const DEFAULT_TO = RESEND_SANDBOX_OWNER_EMAIL;
const DEFAULT_FROM = 'onboarding@resend.dev';

function isLocalDev() {
  if (process.env.VERCEL === '1') return process.env.VERCEL_ENV === 'development';
  return true;
}

function getFromAddress() {
  return (process.env.RESEND_FROM_EMAIL || process.env.CONTACT_FROM_EMAIL || DEFAULT_FROM).trim();
}

function isSandboxFrom(from) {
  return /onboarding@resend\.dev/i.test(from);
}

function resolveDeliveryTo() {
  const configured = (process.env.CONTACT_TO_EMAIL || DEFAULT_TO).trim();
  const from = getFromAddress();

  if (
    isSandboxFrom(from) &&
    configured.toLowerCase() !== RESEND_SANDBOX_OWNER_EMAIL.toLowerCase()
  ) {
    console.warn(
      `[contact] CONTACT_TO_EMAIL (${configured}) cannot receive Resend sandbox mail. ` +
        `Routing to ${RESEND_SANDBOX_OWNER_EMAIL} until a domain is verified at resend.com/domains.`
    );
    return { to: RESEND_SANDBOX_OWNER_EMAIL, rerouted: true, configuredTo: configured };
  }

  return { to: configured, rerouted: false, configuredTo: configured };
}

function buildContactMailto({ name, email, message }) {
  const subject = `Portfolio contact from ${name.trim()}`;
  const body = `Hi Shail,\n\n${message.trim()}\n\n— ${name.trim()} (${email.trim()})`;
  return `mailto:${PUBLIC_CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

function escapeHtml(value) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function parseResendFailure(status, bodyText) {
  let message = bodyText;
  try {
    const parsed = JSON.parse(bodyText);
    message = parsed?.message || parsed?.error || bodyText;
  } catch {
    /* use raw body */
  }

  if (status === 403 && /only send.*testing|testing emails|verify.*domain/i.test(message)) {
    return {
      reason: 'send_failed',
      code: 'resend_sandbox_limit',
      status,
      error:
        'Resend testing mode can only deliver to your verified account email until you verify a domain.',
      userMessage:
        `Email could not be sent automatically (Resend testing limit). ` +
        `Use the button below to email ${PUBLIC_CONTACT_EMAIL} directly, ` +
        `or verify a domain at resend.com/domains to enable automatic delivery.`,
      detail: message,
    };
  }

  if (status === 422) {
    return {
      reason: 'send_failed',
      code: 'resend_rejected',
      status,
      error: `Resend rejected the email: ${message}`,
      userMessage: `Could not send your message (${message}). Try the email button below.`,
      detail: message,
    };
  }

  return {
    reason: 'send_failed',
    code: 'send_failed',
    status,
    error: `Resend ${status}: ${message}`,
    userMessage: 'Could not send your message. Try the email button below.',
    detail: message,
  };
}

async function sendContactEmail({ name, email, message }) {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const { to, rerouted } = resolveDeliveryTo();
  const from = getFromAddress();
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
    console.error('[contact] Resend error:', res.status, bodyText.slice(0, 300));
    return parseResendFailure(res.status, bodyText);
  }

  let emailId = null;
  try {
    emailId = JSON.parse(bodyText)?.id || null;
  } catch {
    /* ignore */
  }

  console.log(
    '[contact] emailed to',
    to,
    rerouted ? `(rerouted from ${process.env.CONTACT_TO_EMAIL})` : '',
    'from',
    trimmedEmail,
    emailId ? `(id: ${emailId})` : ''
  );
  return { delivered: true, emailId, rerouted: rerouted || undefined };
}

module.exports = {
  sendContactEmail,
  buildContactMailto,
  isLocalDev,
  PUBLIC_CONTACT_EMAIL,
  RESEND_SANDBOX_OWNER_EMAIL,
};
