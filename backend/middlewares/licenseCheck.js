// ============================================================
// 🔥 BA'ASS LICENSE GATEKEEPER
// ============================================================

const crypto = require('crypto');

const CACHE_TTL = 60 * 1000;
const WARNING_DAYS = 30;

const SKIP_ROUTES = new Set([
  '/health',
  '/api/v1/auth/login',
  '/api/v1/auth/register',
  '/api/v1/license/activate',
  '/api/v1/license/register',
]);

let licenseCache = null;
let cacheTimestamp = 0;

function hashFingerprint(data) {
  return crypto
    .createHash('sha256')
    .update(data)
    .digest('hex');
}

async function loadLicense() {
  const now = Date.now();

  if (
    licenseCache &&
    now - cacheTimestamp < CACHE_TTL
  ) {
    return licenseCache;
  }

  const license = await global.db('licenses')
    .where({
      is_active: true,
      is_activated: true,
    })
    .where('expiry_date', '>', new Date())
    .first();

  licenseCache = license || null;
  cacheTimestamp = now;

  return licenseCache;
}

async function validateUserLimit(license) {
  if (!license.max_users) {
    return true;
  }

  const result = await global.db('users')
    .count('* as total')
    .first();

  const total = Number(result.total || 0);

  return total <= license.max_users;
}

function detectSuspiciousRequest(req) {
  const suspiciousPatterns = [
    '../',
    '%2e%2e',
    '<script',
    'union select',
    '--',
    ';drop',
  ];

  const raw =
    `${req.originalUrl} ${JSON.stringify(req.body || {})}`.toLowerCase();

  return suspiciousPatterns.some(pattern =>
    raw.includes(pattern)
  );
}

function attachSecurityHeaders(res) {
  res.setHeader('X-License-Protection', 'ACTIVE');
  res.setHeader('X-Tamper-Protection', 'ENABLED');
  res.setHeader('X-System-Integrity', 'VERIFIED');
}

function generateMachineFingerprint(req) {
  const raw = [
    req.ip,
    req.headers['user-agent'],
    process.platform,
    process.arch,
    process.version,
  ].join('|');

  return hashFingerprint(raw);
}

const licenseCheck = async (req, res, next) => {

  try {

    // ========================================================
    // Skip routes
    // ========================================================

    if (SKIP_ROUTES.has(req.path)) {
      return next();
    }

    // ========================================================
    // Security scan
    // ========================================================

    if (detectSuspiciousRequest(req)) {

      console.warn(
        '🚨 Suspicious request blocked:',
        req.ip,
        req.originalUrl
      );

      return res.status(403).json({
        success: false,
        code: 'SECURITY_VIOLATION',
        message: 'Request blocked.',
      });
    }

    // ========================================================
    // Load license
    // ========================================================

    const license = await loadLicense();

    if (!license) {

      console.error('❌ No active license');

      return res.status(403).json({
        success: false,
        code: 'LICENSE_REQUIRED',
        message: 'No valid license found.',
      });
    }

    // ========================================================
    // Fingerprint validation
    // ========================================================

    const fingerprint =
      generateMachineFingerprint(req);

    if (
      license.machine_fingerprint &&
      license.machine_fingerprint !== fingerprint
    ) {

      console.error('🚨 Fingerprint mismatch');

      return res.status(403).json({
        success: false,
        code: 'FINGERPRINT_MISMATCH',
        message: 'Machine validation failed.',
      });
    }

    // ========================================================
    // User limit
    // ========================================================

    const allowed =
      await validateUserLimit(license);

    if (!allowed) {

      return res.status(403).json({
        success: false,
        code: 'USER_LIMIT_EXCEEDED',
        message: 'License user limit exceeded.',
      });
    }

    // ========================================================
    // Expiry warning
    // ========================================================

    const daysRemaining = Math.ceil(
      (
        new Date(license.expiry_date).getTime() -
        Date.now()
      ) / (1000 * 60 * 60 * 24)
    );

    if (daysRemaining <= WARNING_DAYS) {

      res.setHeader(
        'X-License-Expiry',
        `${daysRemaining}d`
      );
    }

    // ========================================================
    // Security headers
    // ========================================================

    attachSecurityHeaders(res);

    // ========================================================
    // Attach metadata
    // ========================================================

    req.license = {
      id: license.id,
      tier: license.tier,
      expires: license.expiry_date,
    };

    req.systemSecurity = {
      fingerprint,
      validated: true,
    };

    next();

  } catch (error) {

    console.error(
      '🔥 LICENSE GATEKEEPER FAILURE:',
      error
    );

    // FAIL CLOSED
    return res.status(503).json({
      success: false,
      code: 'SYSTEM_LOCKDOWN',
      message: 'License verification unavailable.',
    });
  }
};

module.exports = licenseCheck;
