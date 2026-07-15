const SecurityLog = require('../models/SecurityLog');

function getIp(req) {
  return (req?.headers?.['x-forwarded-for'] || req?.socket?.remoteAddress || '').split(',')[0].trim();
}

async function log(event, level, details = {}, req = null) {
  try {
    const { userId, ...rest } = details;
    await SecurityLog.create({
      event,
      level,
      ip: req ? getIp(req) : (details.ip || ''),
      userAgent: req ? (req.headers?.['user-agent'] || '') : '',
      userId: userId || null,
      details: rest,
    });
  } catch (err) {
    console.error('[SecurityLog] Failed to write:', err.message);
  }
}

module.exports = {
  info:     (event, details, req) => log(event, 'info',     details, req),
  warn:     (event, details, req) => log(event, 'warn',     details, req),
  critical: (event, details, req) => log(event, 'critical', details, req),
};
