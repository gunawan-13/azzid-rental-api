const express = require('express');
const path = require('path');
const cors = require('cors');
const morgan = require('morgan');
const { port, corsOrigin, nodeEnv } = require('./config/env');
const { testConnection, pool } = require('./config/db');
const notFound = require('./middleware/notFound');
const errorHandler = require('./middleware/errorHandler');
const app = express();

async function ensureAuthSchema() {
  const [columns] = await pool.query(`SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='users' AND COLUMN_NAME IN ('auth_provider','google_id')`);
  const names = new Set(columns.map(x => x.COLUMN_NAME));
  if (!names.has('auth_provider')) await pool.query("ALTER TABLE users ADD COLUMN auth_provider ENUM('password','google') NOT NULL DEFAULT 'password' AFTER status");
  if (!names.has('google_id')) await pool.query("ALTER TABLE users ADD COLUMN google_id VARCHAR(255) NULL AFTER auth_provider");
  const [resetTables] = await pool.query("SHOW TABLES LIKE 'password_resets'");
  if (!resetTables.length) await pool.query(`CREATE TABLE password_resets (id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,user_id INT UNSIGNED NOT NULL,token_hash CHAR(64) NOT NULL UNIQUE,expires_at DATETIME NOT NULL,created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,CONSTRAINT fk_password_resets_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,INDEX idx_password_resets_user (user_id),INDEX idx_password_resets_expiry (expires_at)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);
}



async function ensureBusinessSchema() {
  const alterations = [
    ["vehicles","bag","ALTER TABLE vehicles MODIFY COLUMN bag VARCHAR(80) NULL"],
    ["customers","ktp_number","ALTER TABLE customers ADD COLUMN ktp_number VARCHAR(80) NULL"],
    ["customers","birth_date","ALTER TABLE customers ADD COLUMN birth_date DATE NULL"],
    ["customers","purpose","ALTER TABLE customers ADD COLUMN purpose VARCHAR(255) NULL"],
    ["customers","notes","ALTER TABLE customers ADD COLUMN notes TEXT NULL"],
    ["bookings","subtotal","ALTER TABLE bookings ADD COLUMN subtotal DECIMAL(14,2) NOT NULL DEFAULT 0 AFTER dropoff_location"],
    ["bookings","driver_amount","ALTER TABLE bookings ADD COLUMN driver_amount DECIMAL(14,2) NOT NULL DEFAULT 0 AFTER subtotal"],
    ["bookings","discount_amount","ALTER TABLE bookings ADD COLUMN discount_amount DECIMAL(14,2) NOT NULL DEFAULT 0 AFTER driver_amount"],
    ["bookings","payment_method","ALTER TABLE bookings ADD COLUMN payment_method VARCHAR(80) NULL AFTER payment_status"],
    ["bookings","transaction_id","ALTER TABLE bookings ADD COLUMN transaction_id VARCHAR(120) NULL AFTER payment_method"],
    ["bookings","paid_at","ALTER TABLE bookings ADD COLUMN paid_at DATETIME NULL AFTER transaction_id"],
    ["bookings","user_email","ALTER TABLE bookings ADD COLUMN user_email VARCHAR(160) NULL AFTER paid_at"],
    ["bookings","notes","ALTER TABLE bookings ADD COLUMN notes TEXT NULL AFTER user_email"],
    ["drivers","license_no","ALTER TABLE drivers ADD COLUMN license_no VARCHAR(80) NULL"],
    ["drivers","license_expiry","ALTER TABLE drivers ADD COLUMN license_expiry DATE NULL"],
    ["drivers","rating","ALTER TABLE drivers ADD COLUMN rating DECIMAL(3,2) NOT NULL DEFAULT 0"],
    ["drivers","trips","ALTER TABLE drivers ADD COLUMN trips INT UNSIGNED NOT NULL DEFAULT 0"],
    ["drivers","notes","ALTER TABLE drivers ADD COLUMN notes TEXT NULL"]
  ];
  for (const [table,col,sql] of alterations) {
    const [rows]=await pool.query(`SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME=? AND COLUMN_NAME=?`,[table,col]);
    if(!rows.length) await pool.query(sql);
  }
  await pool.query(`ALTER TABLE drivers MODIFY COLUMN status ENUM('Available','Assigned','On Trip','Off Duty','Inactive') DEFAULT 'Available'`);
  await pool.query(`CREATE TABLE IF NOT EXISTS business_settings (
    id TINYINT UNSIGNED PRIMARY KEY,business_name VARCHAR(160) NOT NULL DEFAULT '',email VARCHAR(160) NULL,phone VARCHAR(50) NULL,whatsapp VARCHAR(50) NULL,address TEXT NULL,
    hero_title VARCHAR(255) NULL,hero_subtitle TEXT NULL,announcement TEXT NULL,updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP)`);
  await pool.query(`CREATE TABLE IF NOT EXISTS payment_accounts (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,method VARCHAR(60) NOT NULL,provider VARCHAR(80) NULL,account_name VARCHAR(160) NULL,
    account_number VARCHAR(120) NULL,instructions TEXT NULL,active TINYINT(1) NOT NULL DEFAULT 1,created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP)`);
}

const allowedOrigins = corsOrigin.split(',').map(x => x.trim()).filter(Boolean);
const corsOptions = {
  credentials: true,
  origin(origin, callback) {
    if (!origin) return callback(null, true); // Postman/curl
    if (nodeEnv !== 'production' && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) return callback(null, true);
    if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error(`CORS origin tidak diizinkan: ${origin}`));
  }
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));
const frontendDir = path.join(__dirname, '../../frontend');
app.use(express.static(frontendDir));
app.get('/', (req,res) => {
  if ((req.headers.accept||'').includes('text/html')) return res.sendFile(path.join(frontendDir,'index.html'));
  res.json({ success:true,name:'Azzid Rental API',version:'1.0.0',status:'online' });
});
app.use('/api/health', require('./routes/health'));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/vehicles', require('./routes/vehicles'));
app.use('/api/customers', require('./routes/customers'));
app.use('/api/bookings', require('./routes/bookings'));
app.use('/api/drivers', require('./routes/drivers'));
app.use('/api/settings', require('./routes/settings'));
app.use('/api/promos', require('./routes/promos'));
app.use(notFound);
app.use(errorHandler);

app.listen(port, async () => {
  console.log(`Azzid Rental API berjalan pada port ${port}`);
  try { await testConnection(); await ensureAuthSchema(); await ensureBusinessSchema(); console.log('MySQL database terhubung'); console.log('Auth + business schema siap'); }
  catch (e) { console.error('MySQL belum terhubung / schema auth gagal:', e.message); }
});
