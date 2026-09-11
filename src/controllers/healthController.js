const { pool } = require('../config/db');
const { ok, error } = require('../utils/response');

exports.health = async (req, res) => {
  try {
    await pool.query('SELECT 1');
    ok(res, { api: 'online', database: 'connected' }, 'Azzid Rental API berjalan');
  } catch (err) {
    error(res, 503, 'API online tetapi database tidak terhubung');
  }
};
