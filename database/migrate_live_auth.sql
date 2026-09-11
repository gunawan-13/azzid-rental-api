USE azzid_rental;

ALTER TABLE users
  ADD COLUMN auth_provider ENUM('password','google') NOT NULL DEFAULT 'password' AFTER status,
  ADD COLUMN google_id VARCHAR(255) NULL AFTER auth_provider;

CREATE UNIQUE INDEX uq_users_google_id ON users (google_id);

CREATE TABLE password_resets (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  token_hash CHAR(64) NOT NULL UNIQUE,
  expires_at DATETIME NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_password_resets_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_password_resets_user (user_id),
  INDEX idx_password_resets_expiry (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
