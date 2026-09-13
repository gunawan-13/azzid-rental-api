# AZZID RENTCAR — Production-ready starter

Versi ini merapikan frontend, menghilangkan data demo dari runtime, dan menghubungkan modul utama ke MySQL API.

## Struktur
- `frontend/` — website customer + dashboard admin
- `backend/` — Express API + MySQL
- `backend/database/schema.sql` — schema database
- `backend/.env` — konfigurasi lokal

## Menjalankan lokal
1. Jalankan Apache/MySQL dari XAMPP.
2. Pastikan database `azzid_rental` tersedia.
3. Dari folder `backend`:
   ```bash
   npm install
   npm run dev
   ```
4. Buka `http://localhost:3000/`.
5. Buat admin:
   ```bash
   npm run create-admin
   ```
   Ikuti prompt / gunakan konfigurasi script yang tersedia.
6. Login ke `#/admin`.
7. Masuk ke **Settings** dan isi data bisnis serta **Rekening & Metode Pembayaran** resmi. Tidak ada nomor rekening demo yang dipasang oleh aplikasi.

## Catatan penting
- Data kendaraan, customer, booking, driver, promo, dan payment tidak lagi diambil dari dataset demo frontend.
- Mutasi kendaraan, booking, payment, driver, promo, user, dan settings diarahkan ke API.
- Booking customer dibuat sebagai `Pending / Unpaid`; aplikasi tidak berpura-pura bahwa pembayaran gateway sudah berhasil. Verifikasi pembayaran dilakukan admin sampai gateway nyata dikonfigurasi.
- Jika database kosong, halaman akan menampilkan keadaan kosong, bukan data palsu.
- Google Login dan email reset password tetap membutuhkan kredensial provider di `.env`.
- Untuk production, ganti `JWT_SECRET` dengan secret acak yang panjang dan isi `CORS_ORIGIN`, `FRONTEND_URL`, serta kredensial database sesuai server.

## Endpoint utama
- `GET /api/health`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `GET/POST/PUT/DELETE /api/vehicles`
- `GET/POST /api/customers`
- `GET/POST/PUT/DELETE /api/bookings`
- `GET /api/bookings/track/:code`
- `GET/POST/PUT/DELETE /api/drivers`
- `GET/PUT /api/settings`
- `GET/POST/DELETE /api/settings/payments`
- `GET/POST/PUT/DELETE /api/promos`

## Setelah instalasi
Admin perlu mengisi:
- nama bisnis
- alamat
- telepon & WhatsApp
- email
- headline website
- pengumuman
- bank/provider
- nama pemilik rekening
- nomor rekening/ID pembayaran
- instruksi pembayaran

Ini sengaja tidak diisi dengan data contoh agar website tidak menampilkan informasi palsu.
