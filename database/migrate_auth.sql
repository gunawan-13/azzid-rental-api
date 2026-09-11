USE azzid_rental;

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
);

-- Admin awal untuk development.
-- Password plaintext tidak disimpan di database.
-- Jalankan INSERT ini setelah mengganti HASH_BCRYPT dengan hash bcrypt milik Anda.
-- Contoh pembuatan hash dapat dilakukan melalui script Node.js.
--
-- INSERT INTO users(name,email,password_hash,phone,role,status)
-- VALUES ('Administrator','admin@azzidrental.local','HASH_BCRYPT',NULL,'admin','Active');
