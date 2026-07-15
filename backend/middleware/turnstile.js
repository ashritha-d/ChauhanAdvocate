const https = require('https');

function cfVerify(secret, token, remoteip) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ secret, response: token, remoteip });
    const options = {
      hostname: 'challenges.cloudflare.com',
      path: '/turnstile/v0/siteverify',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
      },
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch { reject(new Error('Invalid Turnstile response')); }
      });
    });
    req.on('error', reject);
    req.setTimeout(5000, () => { req.destroy(new Error('Turnstile timeout')); });
    req.write(body);
    req.end();
  });
}

module.exports = async function verifyTurnstile(req, res, next) {
  const secret = process.env.TURNSTILE_SECRET_KEY;

  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      // Hard fail in production — missing key is a misconfiguration, not a bypass
      return res.status(503).json({ success: false, message: 'Security configuration error. Please contact support.' });
    }
    console.warn('[Turnstile] TURNSTILE_SECRET_KEY not set — skipping verification in development');
    return next();
  }

  const token = req.body?.turnstileToken || req.body?.['cf-turnstile-response'];
  if (!token) {
    return res.status(400).json({ success: false, message: 'Please complete the security check before submitting.' });
  }

  try {
    const result = await cfVerify(secret, token, req.ip || '');
    if (!result.success) {
      try {
        const securityLogger = require('../services/securityLogger');
        await securityLogger.warn('CAPTCHA_FAILED', { codes: result['error-codes'] }, req);
      } catch { }
      return res.status(400).json({ success: false, message: 'Security check failed. Please refresh and try again.' });
    }
    next();
  } catch (err) {
    console.error('[Turnstile] Verification error:', err.message);
    // Fail-open unless TURNSTILE_STRICT=true — avoids blocking users during Cloudflare outages
    if (process.env.TURNSTILE_STRICT === 'true') {
      return res.status(503).json({ success: false, message: 'Security check unavailable. Please try again shortly.' });
    }
    next();
  }
};
