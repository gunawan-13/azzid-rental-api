const bcrypt = require('bcryptjs');
const { pool } = require('../config/db');
const { ok, error } = require('../utils/response');

function publicUser(row) {
  return {
    id: row.id, name: row.name, email: row.email, phone: row.phone,
    role: row.role, status: row.status,
    created_at: row.created_at, updated_at: row.updated_at
  };
}

exports.list = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT id,name,email,phone,role,status,created_at,updated_at
       FROM users ORDER BY id DESC`
    );
    return ok(res, rows);
  } catch (err) {
    console.error('users.list:', err);
    return error(res, 500, 'Gagal mengambil data user');
  }
};

exports.get = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT id,name,email,phone,role,status,created_at,updated_at
       FROM users WHERE id=? LIMIT 1`,
      [req.params.id]
    );
    if (!rows.length) return error(res, 404, 'User tidak ditemukan');
    return ok(res, publicUser(rows[0]));
  } catch (err) {
    console.error('users.get:', err);
    return error(res, 500, 'Gagal mengambil data user');
  }
};

exports.updateRoleStatus = async (req, res) => {
  try {
    const role = req.body.role;
    const status = req.body.status;
    if (role !== undefined && !['admin', 'user'].includes(role)) {
      return error(res, 400, 'role harus admin atau user');
    }
    if (status !== undefined && !['Active', 'Inactive'].includes(status)) {
      return error(res, 400, 'status harus Active atau Inactive');
    }
    if (String(req.params.id) === String(req.user.id) && role === 'user') {
      return error(res, 400, 'Admin tidak dapat menurunkan role dirinya sendiri');
    }

    const fields = [];
    const values = [];
    if (role !== undefined) { fields.push('role=?'); values.push(role); }
    if (status !== undefined) { fields.push('status=?'); values.push(status); }
    if (!fields.length) return error(res, 400, 'Tidak ada data untuk diperbarui');

    values.push(req.params.id);
    const [result] = await pool.query(
      `UPDATE users SET ${fields.join(',')} WHERE id=?`,
      values
    );
    if (!result.affectedRows) return error(res, 404, 'User tidak ditemukan');

    const [rows] = await pool.query(
      `SELECT id,name,email,phone,role,status,created_at,updated_at
       FROM users WHERE id=? LIMIT 1`,
      [req.params.id]
    );
    return ok(res, publicUser(rows[0]), 'Data user diperbarui');
  } catch (err) {
    console.error('users.updateRoleStatus:', err);
    return error(res, 500, 'Gagal memperbarui user');
  }
};

exports.changePassword = async (req, res) => {
  try {
    const currentPassword = String(req.body.currentPassword || '');
    const newPassword = String(req.body.newPassword || '');
    if (!currentPassword || !newPassword) {
      return error(res, 400, 'currentPassword dan newPassword wajib diisi');
    }
    if (newPassword.length < 8) return error(res, 400, 'Password baru minimal 8 karakter');

    const [rows] = await pool.query(
      'SELECT password_hash FROM users WHERE id=? LIMIT 1',
      [req.user.id]
    );
    if (!rows.length) return error(res, 404, 'User tidak ditemukan');

    const valid = await bcrypt.compare(currentPassword, rows[0].password_hash);
    if (!valid) return error(res, 401, 'Password saat ini salah');

    const hash = await bcrypt.hash(newPassword, 12);
    await pool.query('UPDATE users SET password_hash=? WHERE id=?', [hash, req.user.id]);
    return ok(res, null, 'Password berhasil diubah. Silakan login kembali.');
  } catch (err) {
    console.error('users.changePassword:', err);
    return error(res, 500, 'Gagal mengubah password');
  }
};
