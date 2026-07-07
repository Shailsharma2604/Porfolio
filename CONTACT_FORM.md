# Contact form — how it works

Visitors submit the form on your portfolio. The server sends you an **outbound email** via [Resend](https://resend.com). You read messages in **Gmail** — there is no inbox inside Resend or on the site.

## Where messages appear

| Step | What happens |
|------|----------------|
| 1 | Visitor fills out name, email, message on the site |
| 2 | `POST /api/contact` → `lib/contact-mail.js` → Resend **Send** API |
| 3 | Resend delivers email to **`shail020604@gmail.com`** (or `CONTACT_TO_EMAIL`) |
| 4 | You open **Gmail** and reply (Reply uses the visitor's address via `reply_to`) |

**Check your Gmail inbox and spam folder** — not the Resend dashboard.

## What you do *not* need

- **Resend Receiving API** (`Emails.Receiving.list()`, `.get()`, attachments) — that is for **inbound mail to a custom domain** you configure in Resend (e.g. `hello@yourdomain.com`). Your contact form does not use it.
- **Python Resend SDK** — this project is **Node.js**; sending already uses the REST API from `lib/contact-mail.js`.

## Environment variables

Set in `.env` locally and in **Vercel → Project → Settings → Environment Variables**:

| Variable | Purpose |
|----------|---------|
| `RESEND_API_KEY` | Required for email delivery |
| `CONTACT_TO_EMAIL` | Inbox that receives form messages (default: `shail020604@gmail.com`) |
| `CONTACT_FROM_EMAIL` | Sender shown to Gmail (default: `onboarding@resend.dev` for sandbox) |

Without `RESEND_API_KEY`, submissions are **logged only** and the API returns 503.

## Sandbox vs production

- **Sandbox** (`onboarding@resend.dev`): Resend only delivers to the email verified on your Resend account. Use that address as `CONTACT_TO_EMAIL` while testing.
- **Production**: Verify your domain in Resend, then set e.g. `CONTACT_FROM_EMAIL=Portfolio <contact@yourdomain.com>`.

## Security

- Keep `RESEND_API_KEY` in `.env` / Vercel only — **never commit it**.
- If the key was pasted in chat or committed, **rotate it** in the Resend dashboard and update Vercel.

## Test locally

```powershell
npm start
# Submit the contact form, or:
curl -X POST http://localhost:3000/api/contact `
  -H "Content-Type: application/json" `
  -d '{"name":"Test","email":"you@example.com","message":"Hello"}'
```

Expect `{"ok":true,...}` and an email in the `CONTACT_TO_EMAIL` inbox.
