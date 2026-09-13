CREATE DATABASE IF NOT EXISTS azzid_rental CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE azzid_rental;

CREATE TABLE IF NOT EXISTS customers (
 id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 name VARCHAR(120) NOT NULL,
 email VARCHAR(160) NULL,
 phone VARCHAR(40) NOT NULL,
 address TEXT NULL,
 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS vehicles (
 id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 name VARCHAR(120) NOT NULL,
 brand VARCHAR(80) NULL,
 model VARCHAR(80) NULL,
 type VARCHAR(80) NULL,
 year SMALLINT UNSIGNED NULL,
 plate VARCHAR(30) NULL,
 transmission VARCHAR(30) NULL,
 seats TINYINT UNSIGNED NULL,
 fuel VARCHAR(30) NULL,
 color VARCHAR(50) NULL,
 doors TINYINT UNSIGNED NULL,
 bag TINYINT UNSIGNED NULL,
 price_lk DECIMAL(14,2) NOT NULL DEFAULT 0,
 price_driver DECIMAL(14,2) NULL,
 image VARCHAR(500) NULL,
 features TEXT NULL,
 description TEXT NULL,
 status ENUM('Available','Booked','Maintenance','Inactive') NOT NULL DEFAULT 'Available',
 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
 INDEX idx_vehicles_status (status),
 INDEX idx_vehicles_brand (brand)
);

CREATE TABLE IF NOT EXISTS drivers (
 id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 name VARCHAR(120) NOT NULL,
 phone VARCHAR(40) NULL,
 status ENUM('Available','Assigned','Inactive') DEFAULT 'Available',
 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS bookings (
 id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 booking_code VARCHAR(50) NOT NULL UNIQUE,
 vehicle_id INT UNSIGNED NOT NULL,
 customer_id INT UNSIGNED NULL,
 driver_id INT UNSIGNED NULL,
 start_date DATE NOT NULL,
 end_date DATE NOT NULL,
 rental_type ENUM('Lepas Kunci','Dengan Driver') NOT NULL DEFAULT 'Lepas Kunci',
 pickup_location VARCHAR(255) NULL,
 dropoff_location VARCHAR(255) NULL,
 total_amount DECIMAL(14,2) NOT NULL DEFAULT 0,
 status ENUM('Pending','Confirmed','Ongoing','Completed','Cancelled') NOT NULL DEFAULT 'Pending',
 payment_status ENUM('Unpaid','Paid','Partial','Refunded') NOT NULL DEFAULT 'Unpaid',
 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
 CONSTRAINT fk_booking_vehicle FOREIGN KEY(vehicle_id) REFERENCES vehicles(id) ON UPDATE CASCADE,
 CONSTRAINT fk_booking_customer FOREIGN KEY(customer_id) REFERENCES customers(id) ON DELETE SET NULL ON UPDATE CASCADE,
 CONSTRAINT fk_booking_driver FOREIGN KEY(driver_id) REFERENCES drivers(id) ON DELETE SET NULL ON UPDATE CASCADE
);

-- Data awal kendaraan. Aman dijalankan berulang kali tanpa menambah duplikat berdasarkan nama.
INSERT INTO vehicles(name,brand,type,transmission,seats,price_lk,price_driver,status)
SELECT 'Toyota Avanza','Toyota','MPV','Automatic',7,350000,500000,'Available'
WHERE NOT EXISTS (SELECT 1 FROM vehicles WHERE name='Toyota Avanza');

INSERT INTO vehicles(name,brand,type,transmission,seats,price_lk,price_driver,status)
SELECT 'Toyota Innova Reborn','Toyota','MPV','Automatic',7,550000,700000,'Available'
WHERE NOT EXISTS (SELECT 1 FROM vehicles WHERE name='Toyota Innova Reborn');

INSERT INTO vehicles(name,brand,type,transmission,seats,price_lk,price_driver,status)
SELECT 'Toyota Hiace','Toyota','Minibus','Manual',15,1000000,1250000,'Available'
WHERE NOT EXISTS (SELECT 1 FROM vehicles WHERE name='Toyota Hiace');

-- Authentication users. Register biasa selalu membuat role user.
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
