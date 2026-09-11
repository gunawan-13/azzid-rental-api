require('dotenv').config();
const readline = require('readline');
const bcrypt = require('bcryptjs');
const { pool } = require('../src/config/db');

function arg(name) {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

function ask(question, hidden = false) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

    if (!hidden || !process.stdin.isTTY) {
      rl.question(question, (answer) => {
        rl.close();
        resolve(answer.trim());
      });
      return;
    }

    process.stdout.write(question);
    let value = '';
    process.stdin.setRawMode(true);
    process.stdin.resume();

    const onData = (data) => {
      const key = data.toString('utf8');
      if (key === '\u0003') {
        process.stdout.write('\n');
        process.stdin.setRawMode(false);
        process.stdin.off('data', onData);
        rl.close();
        process.exit(130);
      }
      if (key === '\r' || key === '\n') {
        process.stdout.write('\n');
        process.stdin.setRawMode(false);
        process.stdin.off('data', onData);
        rl.close();
        resolve(value);
        return;
      }
      if (key === '\u007f' || key === '\b') {
        if (value.length) value = value.slice(0, -1);
        return;
      }
      value += key;
    };

    process.stdin.on('data', onData);
  });
}

async function ensureUsersTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(120) NOT NULL,
      email VARCHAR(160) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      phone VARCHAR(40) NULL,
      role ENUM('admin','user') NOT NULL DEFAULT 'user',
      status ENUM('Active','Inactive') NOT NULL DEFAULT 'Active',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_users_role (role),
      INDEX idx_users_status (status)
    )
  `);
}

async function main() {
  let name = arg('name');
  let email = arg('email');
  let password = arg('password');

  if (!name) name = await ask('Nama Admin: ');
  if (!email) email = await ask('Email Admin: ');
  if (!password) password = await ask('Password Admin (min. 6 karakter): ', true);

  name = String(name || '').trim();
  email = String(email || '').trim().toLowerCase();
  password = String(password || '');

  if (!name || !email || !password) throw new Error('Nama, email, dan password wajib diisi.');
  if (password.length < 6) throw new Error('Password minimal 6 karakter.');

  await ensureUsersTable();

  const [existing] = await pool.query('SELECT id, role, status FROM users WHERE email=? LIMIT 1', [email]);
  const passwordHash = await bcrypt.hash(password, 12);

  if (existing.length) {
    await pool.query(
      `UPDATE users
       SET name=?, password_hash=?, role='admin', status='Active'
       WHERE id=?`,
      [name, passwordHash, existing[0].id]
    );
    console.log(`Admin berhasil diperbarui: ${email} (id=${existing[0].id})`);
  } else {
    const [result] = await pool.query(
      `INSERT INTO users(name,email,password_hash,role,status)
       VALUES(?,?,?,'admin','Active')`,
      [name, email, passwordHash]
    );
    console.log(`Admin berhasil dibuat: ${email} (id=${result.insertId})`);
  }

  console.log('Role: admin');
  console.log('Password tersimpan sebagai bcrypt hash, bukan plaintext.');
}

main()
  .catch((err) => {
    console.error('Gagal membuat admin:', err.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    try { await pool.end(); } catch (_) {}
  });
