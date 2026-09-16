const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { pool } = require('../config/db');
const { jwtSecret, jwtExpiresIn, googleClientId, frontendUrl, resendApiKey, mailFrom } = require('../config/env');
const { ok, created, error } = require('../utils/response');

function publicUser(row) {
  return { id: row.id, name: row.name, email: row.email, phone: row.phone, role: row.role, status: row.status, auth_provider: row.auth_provider || 'password', created_at: row.created_at, updated_at: row.updated_at };
}
function signUser(row) { return jwt.sign({ id: row.id, email: row.email, role: row.role, name: row.name }, jwtSecret, { expiresIn: jwtExpiresIn }); }
function setAuthCookie(res, token) {
  const production = process.env.NODE_ENV === 'production';
  const sameSite = production ? 'None' : 'Lax';
  const secure = production ? '; Secure' : '';
  res.setHeader('Set-Cookie', `azzid_token=${encodeURIComponent(token)}; HttpOnly; Path=/; Max-Age=86400; SameSite=${sameSite}${secure}`);
}
function clearAuthCookie(res) {
  const production = process.env.NODE_ENV === 'production';
  const sameSite = production ? 'None' : 'Lax';
  const secure = production ? '; Secure' : '';
  res.setHeader('Set-Cookie', `azzid_token=; HttpOnly; Path=/; Max-Age=0; SameSite=${sameSite}${secure}`);
}
async function findUserByEmail(email) { const [rows] = await pool.query('SELECT * FROM users WHERE email=? LIMIT 1', [email]); return rows[0] || null; }

exports.register = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body || {};
    if (!name || !email || !password) return error(res, 400, 'name, email dan password wajib diisi');
    if (String(password).length < 6) return error(res, 400, 'Password minimal 6 karakter');
    const normalizedEmail = String(email).trim().toLowerCase();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(normalizedEmail)) return error(res, 400, 'Format email tidak valid');
    const existing = await findUserByEmail(normalizedEmail);
    if (existing) return error(res, 409, 'Email sudah terdaftar. Silakan masuk.');
    const passwordHash = await bcrypt.hash(String(password), 12);
    const [result] = await pool.query(`INSERT INTO users(name,email,password_hash,phone,role,status,auth_provider) VALUES(?,?,?,?, 'user','Active','password')`, [String(name).trim(), normalizedEmail, passwordHash, phone || null]);
    const [rows] = await pool.query('SELECT id,name,email,phone,role,status,auth_provider,created_at,updated_at FROM users WHERE id=?', [result.insertId]);
    const user = rows[0]; setAuthCookie(res, signUser(user));
    return created(res, { user: publicUser(user) }, 'Registrasi berhasil');
  } catch (err) { console.error('auth.register:', err); return error(res, 500, 'Gagal melakukan registrasi'); }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return error(res, 400, 'email dan password wajib diisi');
    const user = await findUserByEmail(String(email).trim().toLowerCase());
    if (!user) return error(res, 401, 'Email atau password salah');
    if (user.status !== 'Active') return error(res, 403, 'Akun tidak aktif');
    const valid = user.password_hash ? await bcrypt.compare(String(password), user.password_hash) : false;
    if (!valid) return error(res, 401, 'Email atau password salah');
    setAuthCookie(res, signUser(user));
    return ok(res, { user: publicUser(user) }, 'Login berhasil');
  } catch (err) { console.error('auth.login:', err); return error(res, 500, 'Gagal melakukan login'); }
};

exports.googleLogin = async (req, res) => {
  try {
    if (!googleClientId) return error(res, 503, 'Login Google belum dikonfigurasi. Isi GOOGLE_CLIENT_ID di .env.');
    const credential = req.body?.credential;
    if (!credential) return error(res, 400, 'Credential Google wajib diisi');
    const verifyUrl = `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`;
    const r = await fetch(verifyUrl);
    const google = await r.json();
    if (!r.ok || google.aud !== googleClientId || google.email_verified !== 'true' || !google.email) return error(res, 401, 'Akun Google tidak dapat diverifikasi');
    const email = String(google.email).trim().toLowerCase();
    let user = await findUserByEmail(email);
    if (user) {
      if (user.status !== 'Active') return error(res, 403, 'Akun tidak aktif');
      if (!user.google_id) await pool.query('UPDATE users SET google_id=?, auth_provider=? WHERE id=?', [google.sub, user.auth_provider === 'password' ? 'google' : 'google', user.id]);
      user = await findUserByEmail(email);
    } else {
      const randomHash = await bcrypt.hash(crypto.randomBytes(32).toString('hex'), 12);
      const [result] = await pool.query(`INSERT INTO users(name,email,password_hash,phone,role,status,auth_provider,google_id) VALUES(?,?,?,NULL,'user','Active','google',?)`, [google.name || email.split('@')[0], email, randomHash, google.sub]);
      user = await findUserByEmail(email);
      if (!user) return error(res, 500, 'Gagal membuat akun Google');
    }
    setAuthCookie(res, signUser(user));
    return ok(res, { user: publicUser(user) }, 'Login Google berhasil');
  } catch (err) { console.error('auth.googleLogin:', err); return error(res, 500, 'Gagal melakukan login dengan Google'); }
};

exports.forgotPassword = async (req, res) => {
  const generic = 'Jika email terdaftar, link reset password telah dikirim.';
  try {
    const email = String(req.body?.email || '').trim().toLowerCase();
    if (!email) return error(res, 400, 'Email wajib diisi');
    const user = await findUserByEmail(email);
    if (!user || user.status !== 'Active') return ok(res, null, generic);
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    await pool.query('DELETE FROM password_resets WHERE user_id=?', [user.id]);
    await pool.query('INSERT INTO password_resets(user_id,token_hash,expires_at) VALUES(?,?,DATE_ADD(NOW(),INTERVAL 30 MINUTE))', [user.id, tokenHash]);
    const resetUrl = `${frontendUrl.replace(/\/$/, '')}/?reset=${rawToken}`;
    if (resendApiKey && mailFrom) {
      const emailResponse = await fetch('https://api.resend.com/emails', { method:'POST', headers:{Authorization:`Bearer ${resendApiKey}`,'Content-Type':'application/json'}, body:JSON.stringify({from:mailFrom,to:[email],subject:'Reset Password Azzid Rentcar',html:`<p>Halo ${user.name},</p><p>Klik tombol berikut untuk membuat password baru. Link berlaku 30 menit.</p><p><a href="${resetUrl}" style="display:inline-block;padding:12px 18px;background:#991b1b;color:#fff;text-decoration:none;border-radius:8px">Reset Password</a></p><p>Jika Anda tidak meminta reset password, abaikan email ini.</p>`})});
      if (!emailResponse.ok) throw new Error(`Resend HTTP ${emailResponse.status}`);
    } else {
      console.log(`[PASSWORD RESET DEV] ${email}: ${resetUrl}`);
    }
    return ok(res, null, generic);
  } catch (err) { console.error('auth.forgotPassword:', err); return ok(res, null, generic); }
};

exports.resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body || {};
    if (!token || !password) return error(res, 400, 'Token dan password baru wajib diisi');
    if (String(password).length < 6) return error(res, 400, 'Password minimal 6 karakter');
    const tokenHash = crypto.createHash('sha256').update(String(token)).digest('hex');
    const [rows] = await pool.query('SELECT pr.id,pr.user_id FROM password_resets pr WHERE pr.token_hash=? AND pr.expires_at>NOW() LIMIT 1', [tokenHash]);
    if (!rows.length) return error(res, 400, 'Link reset password tidak valid atau sudah kedaluwarsa');
    const hash = await bcrypt.hash(String(password), 12);
    await pool.query('UPDATE users SET password_hash=?, auth_provider=IF(auth_provider="google","google","password") WHERE id=?', [hash, rows[0].user_id]);
    await pool.query('DELETE FROM password_resets WHERE id=?', [rows[0].id]);
    return ok(res, null, 'Password berhasil diubah. Silakan masuk.');
  } catch (err) { console.error('auth.resetPassword:', err); return error(res, 500, 'Gagal mengubah password'); }
};

exports.logout = async (req, res) => { clearAuthCookie(res); return ok(res, null, 'Logout berhasil'); };
exports.me = async (req, res) => {
  try { const [rows] = await pool.query('SELECT id,name,email,phone,role,status,auth_provider,created_at,updated_at FROM users WHERE id=? LIMIT 1', [req.user.id]); if (!rows.length) return error(res,404,'User tidak ditemukan'); return ok(res, publicUser(rows[0])); }
  catch (err) { console.error('auth.me:', err); return error(res,500,'Gagal mengambil profil'); }
};
