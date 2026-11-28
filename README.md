# StudyNook — Pelaporan Keluhan Fasilitas Kampus

Fokus aplikasi: **mahasiswa/dosen melaporkan fasilitas yang bermasalah, staf menindaklanjuti.**
Fitur lain (pemesanan ruang, check-in QR, jadwal dosen, dll.) sudah dihapus.

Backend: Next.js 14 App Router + TypeScript + Prisma. Prototipe UI klik-klik: `public/prototype.html`
(sekarang memanggil API; butuh server + database).

**Status jujur:** logika server sudah ditulis tetapi belum dijalankan/diuji end-to-end, dan UI React belum
terhubung ke API.

## Menjalankan (lokal)

```bash
npm install
cp .env.example .env
npx prisma db push
npm run db:seed         # 13 lokasi + 3 pengguna demo
npm run dev             # http://localhost:3000  (membuka /prototype.html)
```

Pengguna demo: mahasiswa `2401234567`, dosen `198001012005011001`, staf `STAFF001`.

## Alur

1. Pelapor memilih lokasi + kategori, menulis deskripsi (10-1000 karakter).
2. Status awal `BARU`. Staf mengubah ke `DIPROSES`, `SELESAI`, atau `DITOLAK` (dengan catatan).
3. Pelapor melihat status dan catatan staf di "Keluhan Saya".

Perubahan status yang diizinkan: BARU -> DIPROSES/SELESAI/DITOLAK, DIPROSES -> SELESAI/DITOLAK. SELESAI dan DITOLAK final.
Batas anti-spam: maks 3 keluhan terbuka per orang per lokasi.

## Endpoint

| Method | Path | Fungsi |
|---|---|---|
| POST | `/api/auth/dummy` | Login simulasi `{campusId, role?}` (cookie `sn_user`, hanya jika `DEMO_LOGIN=true`). Peran STAFF hanya dari database. |
| GET | `/api/me` | Pengguna saat ini |
| POST | `/api/auth/logout` | Hapus cookie sesi |
| GET | `/api/rooms` | Daftar lokasi |
| GET/POST | `/api/complaints` | Keluhan saya / buat keluhan `{roomId, category, description}` |
| GET | `/api/staff/complaints?status=&category=&roomId=` | Semua keluhan (staf) |
| GET | `/api/complaints/:id` | Detail + linimasa + pesan + foto (pelapor/staf) |
| POST | `/api/complaints/:id/messages` | Kirim pesan `{body}` |
| POST | `/api/complaints/:id/cancel` | Pelapor membatalkan (hanya status BARU) |
| PATCH | `/api/staff/complaints/:id` | Ubah status / catatan / foto hasil `{status?, staffNote?, photoAfter?}` (staf) |

Kategori: AC, LAMPU, PIPA_TOILET, PROYEKTOR, MEJA_KURSI, WIFI, KEBERSIHAN, LAINNYA.
Urgent (mengganggu kelas): SLA 2 jam; biasa 24 jam. Foto disimpan sebagai data URL terkompres (maks ~500 KB) di database;
untuk skala besar pindahkan ke object storage. Tidak ada deteksi AI / LiDAR / beacon / barcode aset. (lihat `lib/rules.ts`).

## Deploy ke Vercel

1. SQLite tidak cocok di Vercel. Buat database Postgres (Neon / Supabase / Vercel Postgres).
2. Di `prisma/schema.prisma` ubah `provider = "sqlite"` menjadi `"postgresql"`.
3. Set env `DATABASE_URL` (dan `DEMO_LOGIN=true` selama masih memakai login simulasi).
4. Jalankan `npx prisma db push` dan `npm run db:seed`, lalu deploy.

## Yang belum ada

- UI React yang memanggil API (port dari `public/prototype.html`).
- SSO kampus sungguhan (cookie demo sekarang tidak ditandatangani; jangan dipakai produksi).
- Upload foto keluhan, notifikasi, dan test otomatis.
