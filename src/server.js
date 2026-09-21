const express = require('express');
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
app.get('/', (req, res) => res.json({ success: true, name: 'Azzid Rental API', version: '1.0.0', status: 'online' }));
app.use('/api/health', require('./routes/health'));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/vehicles', require('./routes/vehicles'));
app.use('/api/drivers', require('./routes/drivers'));
app.use('/api/customers', require('./routes/customers'));
app.use('/api/bookings', require('./routes/bookings'));
app.use(notFound);
app.use(errorHandler);

app.listen(port, async () => {
  console.log(`Azzid Rental API berjalan pada port ${port}`);
  try { await testConnection(); await ensureAuthSchema(); console.log('MySQL database terhubung'); console.log('Auth schema siap (users + password_resets)'); }
  catch (e) { console.error('MySQL belum terhubung / schema auth gagal:', e.message); }
});
