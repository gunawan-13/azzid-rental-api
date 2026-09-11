# Azzid Rental — Live Authentication Setup

## Yang berubah
- Login user/admin memakai `/api/auth/login` dan database MySQL.
- Registrasi user memakai `/api/auth/register` dan database MySQL.
- Password disimpan sebagai bcrypt hash, bukan plaintext.
- Session tidak disimpan di `localStorage`.
- Backend mengirim HttpOnly cookie `azzid_token`.
- `/api/auth/me` memulihkan session dari cookie.
- `/api/auth/logout` menghapus cookie.
- `/api/users` sekarang benar-benar didaftarkan di server dan dilindungi JWT + role admin.

## Buat tabel
Di phpMyAdmin jalankan:

```sql
SOURCE database/migrate_auth.sql;
```

atau buka file `database/migrate_auth.sql` dan jalankan isinya pada database `azzid_rental`.

## Bersihkan akun demo
Jika database Anda pernah memakai akun demo, jalankan `database/cleanup_demo_accounts.sql`.

## Buat akun admin LIVE
Dari folder backend:

```bash
npm install
npm run create-admin
```

Masukkan nama, email, dan password admin milik Anda sendiri. Tidak ada kredensial demo di aplikasi.

## Jalankan API

```bash
npm start
```

API default: `http://localhost:3000`

## Frontend lokal
Jalankan frontend melalui Live Server, contoh:

`http://127.0.0.1:5500`

Pastikan `.env` backend berisi:

```env
CORS_ORIGIN=http://127.0.0.1:5500
```

Jika Live Server Anda menggunakan `http://localhost:5500`, ubah menjadi:

```env
CORS_ORIGIN=http://localhost:5500
```

## Deploy
Untuk frontend Vercel, atur `window.API_BASE_URL` ke URL API production.
Untuk backend production, `CORS_ORIGIN` harus berisi URL frontend production secara tepat, bukan `*`.

Contoh:

```env
NODE_ENV=production
CORS_ORIGIN=https://domain-frontend-anda.vercel.app
JWT_SECRET=ganti-dengan-secret-panjang-dan-acak
JWT_EXPIRES_IN=1d
```

Jangan commit `.env` ke GitHub.

## LIVE Google Login + Lupa Password

### Database
Jalankan `database/migrate_live_auth.sql` sekali di database `azzid_rental`. Ini menambah `auth_provider`, `google_id`, dan tabel `password_resets`.

### Google Login
1. Buat OAuth 2.0 Web Client ID di Google Cloud Console.
2. Tambahkan origin frontend, misalnya `http://localhost:5500` saat lokal dan domain Vercel saat production.
3. Isi `GOOGLE_CLIENT_ID` di backend `.env`.
4. Isi `window.GOOGLE_CLIENT_ID` di frontend `js/config.js` dengan Client ID yang sama.

Google login hanya membuat/menautkan akun `role=user`; admin tetap dibuat melalui `npm run create-admin` dan login password.

### Lupa Password LIVE
Backend mendukung `POST /api/auth/forgot-password` dan `POST /api/auth/reset-password`.
Untuk email production gunakan Resend:
- `RESEND_API_KEY=...`
- `MAIL_FROM=Azzid Rentcar <noreply@domain-anda.com>`
- `FRONTEND_URL=https://domain-frontend-anda`

Tanpa Resend, mode development hanya mencetak link reset di terminal backend agar bisa dites lokal.
