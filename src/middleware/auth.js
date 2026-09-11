const jwt = require('jsonwebtoken');
const { jwtSecret } = require('../config/env');
const { error } = require('../utils/response');

function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const [scheme, bearerToken] = header.split(' ');
  const cookieToken = String(req.headers.cookie || '').split(';').map(x => x.trim()).find(x => x.startsWith('azzid_token='));
  const token = scheme === 'Bearer' && bearerToken ? bearerToken : (cookieToken ? decodeURIComponent(cookieToken.slice('azzid_token='.length)) : '');

  if (!token) {
    return error(res, 401, 'Token autentikasi diperlukan');
  }

  try {
    req.user = jwt.verify(token, jwtSecret);
    next();
  } catch (err) {
    return error(res, 401, 'Token tidak valid atau sudah kedaluwarsa');
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return error(res, 403, 'Anda tidak memiliki izin untuk mengakses resource ini');
    }
    next();
  };
}

module.exports = { requireAuth, requireRole };
