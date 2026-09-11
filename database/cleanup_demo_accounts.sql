USE azzid_rental;

-- Hapus akun demo yang pernah dipakai project lama.
-- Jalankan hanya jika Anda memang ingin membersihkan akun demo tersebut.
DELETE FROM users
WHERE email IN (
  'owner@azzidrentcar.id',
  'admin@azzidrentcar.id',
  'staff@azzidrentcar.id',
  'finance@azzidrentcar.id',
  'penyewa@demo.id'
);
