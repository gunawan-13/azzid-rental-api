const { error } = require('../utils/response');
module.exports = (req, res) => error(res, 404, `Route tidak ditemukan: ${req.method} ${req.originalUrl}`);
