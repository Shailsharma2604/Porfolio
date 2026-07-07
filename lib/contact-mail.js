/**
 * Send portfolio contact form messages via Resend (https://resend.com).
 * Requires RESEND_API_KEY in env. Without it, submissions are logged only.
 */

/** Resend account owner email — sandbox/testing only delivers here until a domain is verified. */
const RESEND_SANDBOX_OWNER_EMAIL = 'shailsharma020604@gmail.com';
/** Public portfolio contact email shown in UI and mailto fallbacks. */
const PUBLIC_CONTACT_EMAIL = 'shail020604@gmail.com';
const MAILTO_FALLBACK_MESSAGE = 'Tap below to send via your email app.';

const DEFAULT_TO = RESEND_SANDBOX_OWNER_EMAIL;
const DEFAULT_FROM = 'onboarding@resend.dev';

function normalizeEmail(email) {
  return (email || '').trim().toLowerCase();
}

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

function isSandboxDeliverable(to) {
  return normalizeEmail(to) === normalizeEmail(RESEND_SANDBOX_OWNER_EMAIL);
}

function resolveDeliveryTo() {
  const configured = (process.env.CONTACT_TO_EMAIL || DEFAULT_TO).trim();
  const from = getFromAddress();
  const sandbox = isSandboxFrom(from);

  if (sandbox) {
    const rerouted = !isSandboxDeliverable(configured);
    if (rerouted) {
      console.warn(
        `[contact] CONTACT_TO_EMAIL (${configured}) cannot receive Resend sandbox mail. ` +
          `Using ${RESEND_SANDBOX_OWNER_EMAIL} until a domain is verified at resend.com/domains.`
      );
    }
    return {
      to: RESEND_SANDBOX_OWNER_EMAIL,
      rerouted,
      configuredTo: configured,
      sandbox: true,
    };
  }

  return { to: configured, rerouted: false, configuredTo: configured, sandbox: false };
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
      error: `Resend sandbox limit: ${message}`,
      detail: message,
    };
  }

  if (status === 422) {
    return {
      reason: 'send_failed',
      code: 'resend_rejected',
      status,
      error: `Resend rejected the email: ${message}`,
      detail: message,
    };
  }

  return {
    reason: 'send_failed',
    code: 'send_failed',
    status,
    error: `Resend ${status}: ${message}`,
    detail: message,
  };
}

function buildEmailPayload({ from, to, name, email, message }) {
  const trimmedName = name.trim();
  const trimmedEmail = email.trim();
  const trimmedMessage = message.trim();

  return {
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
  };
}

async function postToResend(apiKey, payload) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
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

  return { delivered: true, emailId };
}

function shouldSkipResendCall({ from, to, apiKey }) {
  if (!apiKey) {
    return { skip: true, result: { delivered: false, reason: 'not_configured' } };
  }

  if (isSandboxFrom(from) && !isSandboxDeliverable(to)) {
    console.warn(
      `[contact] Skipping Resend — sandbox sender only delivers to ${RESEND_SANDBOX_OWNER_EMAIL}.`
    );
    return {
      skip: true,
      result: { delivered: false, reason: 'mailto_fallback', code: 'mailto_fallback' },
    };
  }

  return { skip: false };
}

function toMailtoFallbackResult(result) {
  return {
    delivered: false,
    reason: 'mailto_fallback',
    code: result.code || 'mailto_fallback',
    detail: result.detail,
  };
}

async function sendContactEmail({ name, email, message }) {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  let { to, rerouted } = resolveDeliveryTo();
  let from = getFromAddress();
  const trimmedName = name.trim();
  const trimmedEmail = email.trim();

  const preflight = shouldSkipResendCall({ from, to, apiKey });
  if (preflight.skip) {
    if (preflight.result.reason === 'not_configured') {
      console.warn('[contact] RESEND_API_KEY not set — logged only (not emailed):', {
        name: trimmedName,
        email: trimmedEmail,
        message: message.trim().slice(0, 500),
      });
    }
    return preflight.result;
  }

  let result = await postToResend(apiKey, buildEmailPayload({ from, to, name, email, message }));

  if (
    !result.delivered &&
    result.code === 'resend_sandbox_limit' &&
    (!isSandboxFrom(from) || !isSandboxDeliverable(to))
  ) {
    console.warn(
      '[contact] Retrying via Resend sandbox (onboarding@resend.dev → owner email). ' +
        'Set RESEND_FROM_EMAIL=onboarding@resend.dev and CONTACT_TO_EMAIL=' +
        `${RESEND_SANDBOX_OWNER_EMAIL} in env.`
    );
    from = DEFAULT_FROM;
    to = RESEND_SANDBOX_OWNER_EMAIL;
    rerouted = true;
    result = await postToResend(apiKey, buildEmailPayload({ from, to, name, email, message }));
  }

  if (result.delivered) {
    console.log(
      '[contact] emailed to',
      to,
      rerouted ? `(rerouted from ${process.env.CONTACT_TO_EMAIL})` : '',
      'from',
      trimmedEmail,
      result.emailId ? `(id: ${result.emailId})` : ''
    );
    return { delivered: true, emailId: result.emailId, rerouted: rerouted || undefined };
  }

  if (
    result.code === 'resend_sandbox_limit' ||
    result.code === 'resend_rejected' ||
    result.reason === 'send_failed'
  ) {
    console.warn('[contact] Resend unavailable — offering mailto fallback:', result.detail || result.error);
    return toMailtoFallbackResult(result);
  }

  return result;
}

function buildContactHandlerResponse({ name, email, message }, result) {
  const mailto = buildContactMailto({ name, email, message });

  if (result.delivered) {
    return {
      status: 200,
      body: {
        ok: true,
        message: "Message sent — I'll get back to you soon.",
        id: result.emailId || undefined,
      },
    };
  }

  if (result.reason === 'not_configured') {
    if (isLocalDev()) {
      return {
        status: 200,
        body: {
          ok: true,
          message: 'Message logged locally (RESEND_API_KEY not set — not emailed)',
          dev: true,
        },
      };
    }
    return {
      status: 200,
      body: {
        ok: true,
        fallback: 'mailto',
        mailto,
        message: MAILTO_FALLBACK_MESSAGE,
        contactEmail: PUBLIC_CONTACT_EMAIL,
      },
    };
  }

  if (result.reason === 'mailto_fallback') {
    return {
      status: 200,
      body: {
        ok: true,
        fallback: 'mailto',
        mailto,
        message: MAILTO_FALLBACK_MESSAGE,
        contactEmail: PUBLIC_CONTACT_EMAIL,
      },
    };
  }

  return {
    status: 200,
    body: {
      ok: true,
      fallback: 'mailto',
      mailto,
      message: MAILTO_FALLBACK_MESSAGE,
      contactEmail: PUBLIC_CONTACT_EMAIL,
    },
  };
}

module.exports = {
  sendContactEmail,
  buildContactMailto,
  buildContactHandlerResponse,
  isLocalDev,
  PUBLIC_CONTACT_EMAIL,
  RESEND_SANDBOX_OWNER_EMAIL,
  MAILTO_FALLBACK_MESSAGE,
};
