import { injectSpeedInsights } from '@vercel/speed-insights';

// The /_vercel/speed-insights/script.js endpoint only exists on Vercel's
// infrastructure — skip injection on localhost/local Express dev server to
// avoid a noisy 404 + MIME-type console error during local development.
const isLocalDev = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname);
if (!isLocalDev) {
  injectSpeedInsights();
}
