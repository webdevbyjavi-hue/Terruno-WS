'use strict';

const { Resend }  = require('resend');
const { google }  = require('googleapis');

// ─── Field whitelist & max lengths ───────────────────────────────────────────

const ALLOWED_FIELDS = [
  'name', 'email', 'phone', 'details',
  'pageUrl', 'referrer', 'userAgent', 'language',
  'screenSize', 'timezone', 'timeOnPage', 'visitCount', 'localDateTime',
];

const FIELD_MAX = {
  name: 100, email: 254, phone: 30, details: 2000,
  pageUrl: 500, referrer: 500, userAgent: 300, language: 20,
  screenSize: 20, timezone: 100, timeOnPage: 20, visitCount: 10, localDateTime: 50,
};

// ─── In-memory rate limiter ───────────────────────────────────────────────────
// NOTE: This works within a single warm serverless instance.
// For true cross-instance limiting use Vercel KV or Upstash Redis (see bottom of file).

const RL_WINDOW_MS = 60_000;   // 60 seconds
const RL_MAX       = 20;       // max submissions per window

const _rlWindows = new Map();  // ip → { count, windowStart }

function isRateLimited(ip) {
  const now   = Date.now();
  const entry = _rlWindows.get(ip) || { count: 0, windowStart: now };

  if (now - entry.windowStart > RL_WINDOW_MS) {
    entry.count       = 0;
    entry.windowStart = now;
  }

  entry.count++;
  _rlWindows.set(ip, entry);

  // Evict stale entries occasionally to prevent unbounded growth
  if (_rlWindows.size > 5000) {
    for (const [k, v] of _rlWindows) {
      if (now - v.windowStart > RL_WINDOW_MS) _rlWindows.delete(k);
    }
  }

  return entry.count > RL_MAX;
}

// ─── Sanitize ────────────────────────────────────────────────────────────────

function sanitize(value, maxLen) {
  return String(value ?? '').replace(/<[^>]*>/g, '').trim().slice(0, maxLen);
}

// ─── Google Sheets helper ────────────────────────────────────────────────────

async function appendToSheet(data) {
  const keyJson = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);

  const auth = new google.auth.GoogleAuth({
    credentials: keyJson,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  const sheets = google.sheets({ version: 'v4', auth });

  await sheets.spreadsheets.values.append({
    spreadsheetId: process.env.SHEET_ID,
    range:         'Sheet1!A1',
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [[
        new Date().toISOString(),
        data.name          || '',
        data.email         || '',
        data.phone         || '',
        data.details       || '',
        data.pageUrl       || '',
        data.referrer      || '',
        data.language      || '',
        data.screenSize    || '',
        data.timezone      || '',
        data.userAgent     || '',
        data.timeOnPage    || '',
        data.visitCount    || '',
        data.localDateTime || '',
      ]],
    },
  });
}

// ─── Email template ──────────────────────────────────────────────────────────

function buildEmailHtml(data, ts, replyHref) {
  const firstName = (data.name || 'Inquirer').split(' ')[0];

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
</head>
<body style="margin:0;padding:0;background-color:#dedad0;font-family:'Helvetica Neue',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#dedad0;">
<tr><td align="center" style="padding:36px 16px;">
<table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background-color:#f1edde;border-radius:14px;overflow:hidden;box-shadow:0 6px 32px rgba(69,68,17,0.14);">

  <!-- HEADER -->
  <tr><td style="background-color:#454411;padding:0;">
    <table width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
      <td style="padding:30px 32px;">
        <p style="margin:0 0 6px;font-family:'Helvetica Neue',Arial,sans-serif;font-size:9px;font-weight:700;letter-spacing:0.22em;text-transform:uppercase;color:rgba(241,237,222,0.45);">New Contact Submission</p>
        <h1 style="margin:0 0 4px;font-family:Georgia,'Times New Roman',serif;font-size:28px;font-weight:400;color:#f1edde;letter-spacing:0.06em;line-height:1;">TERRUNO<em style="font-style:italic;">-WS</em></h1>
        <p style="margin:0;font-family:'Helvetica Neue',Arial,sans-serif;font-size:10px;letter-spacing:0.1em;color:rgba(241,237,222,0.45);">WINE &amp; SPIRITS</p>
      </td>
      <td align="right" valign="middle" style="padding:30px 32px;">
        <table cellpadding="0" cellspacing="0" border="0" align="right"><tr>
          <td style="background:rgba(241,237,222,0.1);border:1px solid rgba(241,237,222,0.18);border-radius:20px;padding:7px 16px;">
            <span style="font-family:'Helvetica Neue',Arial,sans-serif;font-size:10px;letter-spacing:0.12em;color:rgba(241,237,222,0.6);">NEW INQUIRY</span>
          </td>
        </tr></table>
      </td>
    </tr></table>
  </td></tr>

  <!-- TIMESTAMP -->
  <tr><td style="background:rgba(69,68,17,0.05);padding:10px 32px;border-bottom:1px solid rgba(69,68,17,0.1);">
    <p style="margin:0;font-family:'Helvetica Neue',Arial,sans-serif;font-size:11px;color:#797853;letter-spacing:0.03em;">&#128337;&nbsp; Received ${ts}</p>
  </td></tr>

  <!-- BODY -->
  <tr><td style="padding:28px 32px 0;">

    <!-- Contact Details -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid rgba(69,68,17,0.1);border-radius:10px;overflow:hidden;margin-bottom:20px;">
      <tr><td colspan="2" style="padding:18px 18px 8px;font-family:Georgia,'Times New Roman',serif;font-size:12px;font-style:italic;color:#797853;letter-spacing:0.05em;">Contact Details</td></tr>
      <tr>
        <td style="padding:10px 18px;font-family:'Helvetica Neue',Arial,sans-serif;font-size:10.5px;font-weight:600;letter-spacing:0.09em;text-transform:uppercase;color:#797853;white-space:nowrap;vertical-align:top;border-bottom:1px solid rgba(69,68,17,0.07);width:130px;">Name</td>
        <td style="padding:10px 18px;font-family:'Helvetica Neue',Arial,sans-serif;font-size:13.5px;color:#454411;line-height:1.5;border-bottom:1px solid rgba(69,68,17,0.07);">${data.name || 'N/A'}</td>
      </tr>
      <tr>
        <td style="padding:10px 18px;font-family:'Helvetica Neue',Arial,sans-serif;font-size:10.5px;font-weight:600;letter-spacing:0.09em;text-transform:uppercase;color:#797853;white-space:nowrap;vertical-align:top;border-bottom:1px solid rgba(69,68,17,0.07);width:130px;">Email</td>
        <td style="padding:10px 18px;font-family:'Helvetica Neue',Arial,sans-serif;font-size:13.5px;color:#454411;line-height:1.5;border-bottom:1px solid rgba(69,68,17,0.07);"><a href="mailto:${data.email}" style="color:#454411;text-decoration:none;font-weight:600;">${data.email || 'N/A'}</a></td>
      </tr>
      <tr>
        <td style="padding:10px 18px;font-family:'Helvetica Neue',Arial,sans-serif;font-size:10.5px;font-weight:600;letter-spacing:0.09em;text-transform:uppercase;color:#797853;white-space:nowrap;vertical-align:top;border-bottom:1px solid rgba(69,68,17,0.07);width:130px;">Phone</td>
        <td style="padding:10px 18px;font-family:'Helvetica Neue',Arial,sans-serif;font-size:13.5px;color:#454411;line-height:1.5;border-bottom:1px solid rgba(69,68,17,0.07);">${data.phone || 'N/A'}</td>
      </tr>
      <tr>
        <td style="padding:10px 18px;font-family:'Helvetica Neue',Arial,sans-serif;font-size:10.5px;font-weight:600;letter-spacing:0.09em;text-transform:uppercase;color:#797853;white-space:nowrap;vertical-align:top;width:130px;">Details</td>
        <td style="padding:10px 18px;font-family:'Helvetica Neue',Arial,sans-serif;font-size:13.5px;color:#454411;line-height:1.75;white-space:pre-line;">${data.details || 'N/A'}</td>
      </tr>
    </table>

    <!-- Visitor Metadata -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid rgba(69,68,17,0.1);border-radius:10px;overflow:hidden;margin-bottom:20px;">
      <tr><td colspan="2" style="padding:18px 18px 8px;font-family:Georgia,'Times New Roman',serif;font-size:12px;font-style:italic;color:#797853;letter-spacing:0.05em;border-top:1px solid rgba(69,68,17,0.12);">Visitor Metadata</td></tr>
      <tr>
        <td style="padding:10px 18px;font-family:'Helvetica Neue',Arial,sans-serif;font-size:10.5px;font-weight:600;letter-spacing:0.09em;text-transform:uppercase;color:#797853;white-space:nowrap;border-bottom:1px solid rgba(69,68,17,0.07);width:130px;">Referrer</td>
        <td style="padding:10px 18px;font-family:'Helvetica Neue',Arial,sans-serif;font-size:13px;color:#454411;border-bottom:1px solid rgba(69,68,17,0.07);">${data.referrer || 'Direct'}</td>
      </tr>
      <tr>
        <td style="padding:10px 18px;font-family:'Helvetica Neue',Arial,sans-serif;font-size:10.5px;font-weight:600;letter-spacing:0.09em;text-transform:uppercase;color:#797853;white-space:nowrap;border-bottom:1px solid rgba(69,68,17,0.07);width:130px;">Timezone</td>
        <td style="padding:10px 18px;font-family:'Helvetica Neue',Arial,sans-serif;font-size:13px;color:#454411;border-bottom:1px solid rgba(69,68,17,0.07);">${data.timezone || 'N/A'}</td>
      </tr>
      <tr>
        <td style="padding:10px 18px;font-family:'Helvetica Neue',Arial,sans-serif;font-size:10.5px;font-weight:600;letter-spacing:0.09em;text-transform:uppercase;color:#797853;white-space:nowrap;border-bottom:1px solid rgba(69,68,17,0.07);width:130px;">Language</td>
        <td style="padding:10px 18px;font-family:'Helvetica Neue',Arial,sans-serif;font-size:13px;color:#454411;border-bottom:1px solid rgba(69,68,17,0.07);">${data.language || 'N/A'}</td>
      </tr>
      <tr>
        <td style="padding:10px 18px;font-family:'Helvetica Neue',Arial,sans-serif;font-size:10.5px;font-weight:600;letter-spacing:0.09em;text-transform:uppercase;color:#797853;white-space:nowrap;border-bottom:1px solid rgba(69,68,17,0.07);width:130px;">Screen</td>
        <td style="padding:10px 18px;font-family:'Helvetica Neue',Arial,sans-serif;font-size:13px;color:#454411;border-bottom:1px solid rgba(69,68,17,0.07);">${data.screenSize || 'N/A'}</td>
      </tr>
      <tr>
        <td style="padding:10px 18px;font-family:'Helvetica Neue',Arial,sans-serif;font-size:10.5px;font-weight:600;letter-spacing:0.09em;text-transform:uppercase;color:#797853;white-space:nowrap;border-bottom:1px solid rgba(69,68,17,0.07);width:130px;">Page URL</td>
        <td style="padding:10px 18px;font-family:'Helvetica Neue',Arial,sans-serif;font-size:12px;color:#454411;word-break:break-all;border-bottom:1px solid rgba(69,68,17,0.07);">${data.pageUrl || 'N/A'}</td>
      </tr>
      <tr>
        <td style="padding:10px 18px;font-family:'Helvetica Neue',Arial,sans-serif;font-size:10.5px;font-weight:600;letter-spacing:0.09em;text-transform:uppercase;color:#797853;white-space:nowrap;vertical-align:top;width:130px;">Browser</td>
        <td style="padding:10px 18px;font-family:'Helvetica Neue',Arial,sans-serif;font-size:11px;color:#454411;word-break:break-all;">${data.userAgent || 'N/A'}</td>
      </tr>
    </table>

    <!-- Session Behavior -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid rgba(69,68,17,0.1);border-radius:10px;overflow:hidden;margin-bottom:28px;">
      <tr><td colspan="2" style="padding:18px 18px 8px;font-family:Georgia,'Times New Roman',serif;font-size:12px;font-style:italic;color:#797853;letter-spacing:0.05em;border-top:1px solid rgba(69,68,17,0.12);">Session Behavior</td></tr>
      <tr>
        <td style="padding:10px 18px;font-family:'Helvetica Neue',Arial,sans-serif;font-size:10.5px;font-weight:600;letter-spacing:0.09em;text-transform:uppercase;color:#797853;white-space:nowrap;border-bottom:1px solid rgba(69,68,17,0.07);width:130px;">Time on Page</td>
        <td style="padding:10px 18px;font-family:'Helvetica Neue',Arial,sans-serif;font-size:13px;color:#454411;border-bottom:1px solid rgba(69,68,17,0.07);">${data.timeOnPage || 'N/A'}</td>
      </tr>
      <tr>
        <td style="padding:10px 18px;font-family:'Helvetica Neue',Arial,sans-serif;font-size:10.5px;font-weight:600;letter-spacing:0.09em;text-transform:uppercase;color:#797853;white-space:nowrap;border-bottom:1px solid rgba(69,68,17,0.07);width:130px;">Visit Count</td>
        <td style="padding:10px 18px;font-family:'Helvetica Neue',Arial,sans-serif;font-size:13px;color:#454411;border-bottom:1px solid rgba(69,68,17,0.07);">${data.visitCount || 'N/A'}</td>
      </tr>
      <tr>
        <td style="padding:10px 18px;font-family:'Helvetica Neue',Arial,sans-serif;font-size:10.5px;font-weight:600;letter-spacing:0.09em;text-transform:uppercase;color:#797853;white-space:nowrap;width:130px;">Local Time</td>
        <td style="padding:10px 18px;font-family:'Helvetica Neue',Arial,sans-serif;font-size:13px;color:#454411;">${data.localDateTime || 'N/A'}</td>
      </tr>
    </table>

  </td></tr>

  <!-- CTA BUTTON -->
  <tr><td style="padding:0 32px 32px;">
    <table cellpadding="0" cellspacing="0" border="0"><tr>
      <td style="background-color:#454411;border-radius:24px;">
        <a href="${replyHref}" style="display:inline-block;padding:13px 30px;font-family:'Helvetica Neue',Arial,sans-serif;font-size:10.5px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:#f1edde;text-decoration:none;">Reply to ${firstName} &rarr;</a>
      </td>
    </tr></table>
  </td></tr>

  <!-- DIVIDER -->
  <tr><td style="padding:0 32px;"><hr style="border:none;border-top:1px solid rgba(69,68,17,0.1);margin:0;"/></td></tr>

  <!-- FOOTER -->
  <tr><td style="padding:20px 32px 24px;">
    <p style="margin:0 0 4px;font-family:'Helvetica Neue',Arial,sans-serif;font-size:9.5px;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;color:#797853;">Terruno Wine &amp; Spirits</p>
    <p style="margin:0;font-family:'Helvetica Neue',Arial,sans-serif;font-size:10px;color:rgba(121,120,83,0.65);line-height:1.6;">Hauppauge, New York &nbsp;&middot;&nbsp; New York &amp; Texas<br>This notification was generated automatically from your website contact form.</p>
  </td></tr>

</table>
</td></tr></table>
</body>
</html>`;
}

// ─── Main handler ─────────────────────────────────────────────────────────────

module.exports = async function handler(req, res) {
  // CORS headers — all responses including errors
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Vary', 'Origin');

  // Preflight
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ status: 'error', message: 'Method not allowed' });
  }

  // Rate limiting — use X-Forwarded-For (set by Vercel) then fall back to remoteAddress
  const ip = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown')
    .split(',')[0].trim();

  if (isRateLimited(ip)) {
    return res.status(429).json({ status: 'error', message: 'Rate limit exceeded' });
  }

  try {
    const raw = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;

    // Whitelist fields
    const data = {};
    for (const key of ALLOWED_FIELDS) {
      if (raw[key] !== undefined) {
        data[key] = sanitize(raw[key], FIELD_MAX[key]);
      }
    }

    // Email validation
    if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      return res.status(400).json({ status: 'error', message: 'Invalid email' });
    }

    // Formatted timestamp  e.g. "Wednesday, May 28, 2025 at 02:30 PM CDT"
    const ts = new Date().toLocaleString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
      hour: '2-digit', minute: '2-digit', timeZoneName: 'short',
      timeZone: 'America/New_York',
    }).replace(',', ',').replace(' at ', ' at ');

    const firstName = (data.name || 'Inquirer').split(' ')[0];
    const replyHref =
      'mailto:' + data.email
      + '?subject=Re%3A%20Your%20Terruno%20Inquiry'
      + '&body=Hi%20' + encodeURIComponent(firstName)
      + '%2C%0A%0AThank%20you%20for%20reaching%20out%20to%20Terruno%20Wine%20%26%20Spirits.';

    // Email — required
    await new Resend(process.env.RESEND_API_KEY).emails.send({
      from:    process.env.EMAIL_FROM,
      to:      process.env.EMAIL_TO,
      subject: 'New Contact Form Submission — Terruno Wine & Spirits',
      html:    buildEmailHtml(data, ts, replyHref),
    });

    // Sheets — optional, won't break the form if credentials aren't set yet
    if (process.env.GOOGLE_SERVICE_ACCOUNT_JSON && !process.env.GOOGLE_SERVICE_ACCOUNT_JSON.includes('"..."')) {
      appendToSheet(data).catch(err => console.error('[contact] sheets error:', err));
    }

    return res.status(200).json({ status: 'ok' });

  } catch (err) {
    console.error('[contact] handler error:', err);
    return res.status(500).json({ status: 'error', message: 'Server error' });
  }
};

/*
─── Rate Limiting Options ──────────────────────────────────────────────────────

CURRENT: in-memory Map per serverless instance.
  ✓ Zero extra dependencies, works fine for low-traffic sites.
  ✗ Each cold-started instance has its own Map — a determined spammer hitting
    many parallel instances could exceed the limit before the Map fills up.
    For a boutique importer contact form this is acceptable.

BETTER (production): Vercel KV (Redis-compatible, free tier available).
  1. Enable Vercel KV in your project dashboard.
  2. npm install @vercel/kv
  3. Replace isRateLimited() with:

    const { kv } = require('@vercel/kv');
    async function isRateLimited(ip) {
      const key = `rl:${ip}`;
      const count = await kv.incr(key);
      if (count === 1) await kv.expire(key, 60);
      return count > 20;
    }

ALTERNATIVE: Upstash Redis (free tier, works anywhere).
  npm install @upstash/redis
  Use UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN env vars.
────────────────────────────────────────────────────────────────────────────── */
