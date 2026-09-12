const mysql = require('mysql2/promise');
const { db } = require('./env');

const pool = mysql.createPool({
  host: db.host,
  port: db.port,
  user: db.user,
  password: db.password,
  database: db.database,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  dateStrings: true,
  // ⚠️ SSL wajib untuk Railway MySQL di production
  ...(process.env.NODE_ENV === 'production' && {
    ssl: { rejectUnauthorized: false }
  })
});

async function testConnection() {
  const connection = await pool.getConnection();
  await connection.ping();
  connection.release();
}

module.exports = { pool, testConnection };