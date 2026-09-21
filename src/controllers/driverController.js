const { pool } = require('../config/db');
const { ok, created, error } = require('../utils/response');

exports.list = async (req, res) => {
  try {
    const [r] = await pool.query('SELECT * FROM drivers ORDER BY id DESC');
    ok(res, r);
  } catch (e) {
    console.error('drivers.list:', e.message);
    error(res, 500, 'Gagal mengambil driver');
  }
};

exports.get = async (req, res) => {
  try {
    const [r] = await pool.query('SELECT * FROM drivers WHERE id=?', [req.params.id]);
    if (!r.length) return error(res, 404, 'Driver tidak ditemukan');
    ok(res, r[0]);
  } catch (e) {
    error(res, 500, 'Gagal mengambil driver');
  }
};

exports.create = async (req, res) => {
  try {
    const x = req.body || {};
    const name = x.name || x.nama;
    const phone = x.phone || x.wa || null;
    const license_number = x.license_number || x.license_no || x.sim || null;
    const status = x.status || 'Available';

    if (!name) return error(res, 400, 'Nama driver wajib diisi');

    const [r] = await pool.query(
      'INSERT INTO drivers(name, phone, license_number, status) VALUES(?,?,?,?)',
      [name, phone, license_number, status]
    );
    const [rows] = await pool.query('SELECT * FROM drivers WHERE id=?', [r.insertId]);
    created(res, rows[0]);
  } catch (e) {
    console.error('drivers.create:', e.message);
    error(res, 500, 'Gagal menambah driver: ' + e.message);
  }
};

exports.update = async (req, res) => {
  try {
    const allowed = ['name', 'phone', 'license_number', 'status'];
    const x = req.body || {};
    // Map alias frontend → kolom DB
    if (x.wa !== undefined && x.phone === undefined) x.phone = x.wa;
    if (x.sim !== undefined && x.license_number === undefined) x.license_number = x.sim;
    if (x.nama !== undefined && x.name === undefined) x.name = x.nama;

    const f = allowed.filter(k => x[k] !== undefined);
    if (!f.length) return error(res, 400, 'Tidak ada perubahan');

    const [r] = await pool.query(
      `UPDATE drivers SET ${f.map(k => k + '=?').join(',')} WHERE id=?`,
      [...f.map(k => x[k]), req.params.id]
    );
    if (!r.affectedRows) return error(res, 404, 'Driver tidak ditemukan');
    const [rows] = await pool.query('SELECT * FROM drivers WHERE id=?', [req.params.id]);
    ok(res, rows[0]);
  } catch (e) {
    console.error('drivers.update:', e.message);
    error(res, 500, 'Gagal memperbarui driver: ' + e.message);
  }
};

exports.remove = async (req, res) => {
  try {
    const [r] = await pool.query('DELETE FROM drivers WHERE id=?', [req.params.id]);
    if (!r.affectedRows) return error(res, 404, 'Driver tidak ditemukan');
    ok(res, null, 'Driver dihapus');
  } catch (e) {
    error(res, 500, 'Gagal menghapus driver');
  }
};
