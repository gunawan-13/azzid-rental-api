# AZZID RENTAL API

Backend Node.js + Express + MySQL untuk project Azzid Rentcar.

## Tahap saat ini

Backend sudah memiliki REST API untuk kendaraan, customer, booking, dan health check.
Tahap 1–2 memperbaiki struktur tabel `vehicles` agar sesuai dengan controller kendaraan dan field yang dikirim frontend.
Authentication Admin/User akan dikerjakan pada tahap berikutnya.

## Struktur

```text
Azzid-Rental-B/
├── database/
│   ├── schema.sql
│   └── migrate_vehicle_columns.sql
├── uploads/
├── src/
│   ├── config/
│   │   ├── db.js
│   │   └── env.js
│   ├── controllers/
│   │   ├── bookingController.js
│   │   ├── customerController.js
│   │   ├── healthController.js
│   │   └── vehicleController.js
│   ├── middleware/
│   │   ├── errorHandler.js
│   │   └── notFound.js
│   ├── routes/
│   │   ├── bookings.js
│   │   ├── customers.js
│   │   ├── health.js
│   │   └── vehicles.js
│   ├── utils/
│   │   └── response.js
│   └── server.js
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

## Instalasi di VS Code + XAMPP

1. Buka folder `Azzid-Rental-B` di VS Code.
2. Pastikan XAMPP **Apache tidak wajib**, tetapi **MySQL harus Running**.
3. Jalankan `npm install`.
4. Buat file `.env` dari `.env.example`.
5. Jika database `azzid_rental` masih baru, import `database/schema.sql` melalui phpMyAdmin.
6. Jika database sudah ada dan tabel `vehicles` berasal dari schema lama, import `database/migrate_vehicle_columns.sql` melalui phpMyAdmin.
7. Jalankan `npm run dev`.

Server default: `http://localhost:3000`

## Endpoint

### Health

- GET `/`
- GET `/api/health`

### Vehicles

- GET `/api/vehicles`
- GET `/api/vehicles/:id`
- POST `/api/vehicles`
- PUT `/api/vehicles/:id`
- DELETE `/api/vehicles/:id`

Field kendaraan yang didukung:

```text
name
brand
model
type / cat
year
plate
transmission / trans
seats
fuel
color
doors
bag
price_lk / priceLK
price_driver / priceDrv
image / img
features / feats
description / desc
status
```

### Customers

- GET `/api/customers`
- GET `/api/customers/:id`
- POST `/api/customers`

### Bookings

- GET `/api/bookings`
- GET `/api/bookings/:id`
- POST `/api/bookings`
- PUT `/api/bookings/:id`
- DELETE `/api/bookings/:id`

## Tes CRUD kendaraan

### GET

Buka:

```text
http://localhost:3000/api/vehicles
```

Response yang benar memiliki bentuk:

```json
{
  "success": true,
  "message": "OK",
  "data": []
}
```

### POST

Contoh body JSON:

```json
{
  "name": "Toyota Avanza",
  "brand": "Toyota",
  "model": "Veloz",
  "type": "MPV",
  "year": 2024,
  "plate": "B 1234 ABC",
  "transmission": "Automatic",
  "seats": 7,
  "fuel": "Bensin",
  "color": "Hitam",
  "doors": 4,
  "bag": 3,
  "price_lk": 350000,
  "price_driver": 500000,
  "image": null,
  "features": ["AC", "Bluetooth", "USB"],
  "description": "Toyota Avanza untuk kebutuhan rental",
  "status": "Available"
}
```

Jika berhasil, API mengembalikan HTTP `201` dan data kendaraan yang baru dibuat.

## Catatan penting

Frontend `Azzid-Rental-F` sebelumnya masih dapat menggunakan localStorage sampai tahap integrasi frontend → API dikerjakan.

**Jangan commit file `.env` ke GitHub.** Gunakan `.env.example` sebagai template.

Tahap berikutnya: `users` + register/login + password hashing + JWT + role `admin/user` + proteksi endpoint.


## STEP 3 — Authentication

Backend sekarang memiliki:
- `POST /api/auth/register` — membuat akun role `user`
- `POST /api/auth/login` — login dan mendapatkan JWT
- `GET /api/auth/me` — membaca user dari token
- JWT middleware dengan `Bearer <token>`
- Password di-hash menggunakan bcrypt
- Role `admin` dan `user`
- CRUD kendaraan (`POST/PUT/DELETE /api/vehicles`) hanya dapat dilakukan admin
- GET kendaraan tetap public

### Instalasi dependency

```bash
npm install
```

### Environment

Tambahkan ke `.env`:

```env
JWT_SECRET=ganti-dengan-secret-yang-panjang-dan-acak
JWT_EXPIRES_IN=1d
```

### Database

Jika database lama sudah ada, import:

```text
database/migrate_auth.sql
```

Jika database baru, gunakan `database/schema.sql`.

### Register

```http
POST /api/auth/register
Content-Type: application/json
```

```json
{
  "name": "User Demo",
  "email": "user@example.com",
  "password": "rahasia123",
  "phone": "08123456789"
}
```

### Login

```http
POST /api/auth/login
Content-Type: application/json
```

```json
{
  "email": "user@example.com",
  "password": "rahasia123"
}
```

Simpan `data.token` dari response untuk request berikutnya:

```http
Authorization: Bearer TOKEN_ANDA
```

### Admin

Akun baru selalu dibuat sebagai `user`. Untuk keamanan, role `admin` harus dibuat/diubah langsung di database oleh administrator.

Contoh setelah memiliki user:

```sql
UPDATE users
SET role='admin'
WHERE email='admin@example.com';
```

Jangan menyimpan password plaintext di database.

### Endpoint yang diproteksi

| Endpoint | Public | User | Admin |
|---|---:|---:|---:|
| GET `/api/vehicles` | ✅ | ✅ | ✅ |
| GET `/api/vehicles/:id` | ✅ | ✅ | ✅ |
| POST `/api/vehicles` | ❌ | ❌ | ✅ |
| PUT `/api/vehicles/:id` | ❌ | ❌ | ✅ |
| DELETE `/api/vehicles/:id` | ❌ | ❌ | ✅ |
| POST `/api/auth/register` | ✅ | — | — |
| POST `/api/auth/login` | ✅ | — | — |
| GET `/api/auth/me` | ❌ | ✅ | ✅ |

## STEP 3.1 — Akun Admin resmi

Akun Admin **tidak dibuat dari form register umum**. Endpoint `POST /api/auth/register` selalu membuat role `user`.

Untuk membuat atau memperbarui akun Admin secara aman, jalankan dari folder backend:

```bash
npm run create-admin
```

Script akan meminta:
- Nama Admin
- Email Admin
- Password Admin

Password akan di-hash dengan bcrypt sebelum disimpan ke MySQL. Jika email sudah ada sebagai `user`, script akan mengubah akun tersebut menjadi `admin` dan mengaktifkannya.

Alternatif non-interaktif untuk environment lokal/otomasi:

```bash
npm run create-admin -- --name "Administrator" --email "admin@azzidrentcar.id" --password "GantiPassword123"
```

Setelah admin dibuat, login melalui:

```http
POST http://localhost:3000/api/auth/login
```

```json
{
  "email": "admin@azzidrentcar.id",
  "password": "GantiPassword123"
}
```

Response `data.user.role` harus bernilai `admin` dan `data.token` adalah JWT untuk akses endpoint Admin.
