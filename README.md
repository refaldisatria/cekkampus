# StudyNook — Sistem Pemesanan Ruang Belajar Kampus

Backend lengkap (Next.js 14 App Router + TypeScript + Prisma) dan prototipe UI klik-klik.

**Status jujur:** logika server (aturan booking, check-in, auto-release, staf) sudah ditulis, tetapi
**belum dijalankan/diuji end-to-end** dan **UI React belum terhubung ke API**. Tampilan yang bisa dicoba
sekarang adalah `public/prototype.html` (data di browser, tanpa server).

## Menjalankan (lokal)

```bash
npm install
cp .env.example .env
npx prisma db push      # buat database SQLite
npm run db:seed         # 10 ruang contoh
npm run dev             # http://localhost:3000  (membuka /prototype.html)
```

Akun pengguna dibuat lewat impor CSV atau login Google/Microsoft, lihat bagian "Login" di bawah.

## Endpoint

| Method | Path | Fungsi |
|---|---|---|
| GET/POST | `/api/auth/*` | NextAuth: halaman `/api/auth/signin`, Google, Microsoft, dan NIM/email + password |
| POST | `/api/auth/register` | Daftar mandiri (mati kecuali `ALLOW_REGISTER=true`) |
| GET | `/api/me` | Pengguna saat ini |
| GET | `/api/rooms?date=&slot=&minCapacity=&maxCapacity=&facilities=&building=` | Ruang + status tiap slot 2 jam |
| GET/POST | `/api/bookings` | Pemesanan saya / buat pemesanan `{roomId, start}` |
| POST | `/api/checkin` | Pembaca pintu: `{bookingId, roomToken}` |
| GET | `/api/cron/release` | Lepas booking yang lewat 15 menit (opsional) |
| GET/POST | `/api/staff/bookings` | Daftar penggunaan harian / jadwal manual |
| DELETE | `/api/staff/bookings/:id` | Override (batalkan) |
| PATCH | `/api/staff/rooms/:id` | Tutup/buka ruang `{closed, note}` |

## Aturan bisnis (lib/rules.ts)

- Slot tepat 2 jam, 08:00-20:00 WIB (server dihitung dengan zona WIB, bukan zona server).
- Tidak ada double booking ruang maupun pengguna di jam yang sama.
- Check-in dibuka 10 menit sebelum mulai dan ditutup 15 menit setelah mulai; lewat itu status jadi `RELEASED`.
- Auto-release berjalan setiap kali data dibaca (lazy), jadi tidak wajib memakai cron.

## Deploy ke Vercel

1. SQLite tidak cocok di Vercel. Buat database Postgres (Neon / Supabase / Vercel Postgres).
2. Di `prisma/schema.prisma` ubah `provider = "sqlite"` menjadi `"postgresql"`.
3. Set env `DATABASE_URL`, `NEXTAUTH_URL` (domain produksi), `NEXTAUTH_SECRET`, `ALLOWED_EMAIL_DOMAINS`, dan kredensial Google/Microsoft.
4. Jalankan `npx prisma db push` dan `npm run db:seed` terhadap database tersebut, lalu deploy repo.

## Yang belum ada

- Antarmuka React yang memanggil API (port dari `public/prototype.html`).
- Halaman login React (sementara memakai halaman bawaan NextAuth di `/api/auth/signin`).
- Pembaca QR di pintu (API `/api/checkin` siap dipanggil perangkat pintu).
- Constraint database anti-balapan untuk double booking, notifikasi, dan test otomatis.

## Login

Dua cara masuk, bisa dipakai bersamaan (NextAuth, sesi JWT):

1. **Google / Microsoft kampus**: isi `GOOGLE_CLIENT_*` dan/atau `AZURE_AD_*` di `.env`. Hanya email dengan domain di
   `ALLOWED_EMAIL_DOMAINS` yang diterima. Redirect URI: `http://localhost:3000/api/auth/callback/google` dan
   `.../callback/azure-ad` (ganti dengan domain produksi saat deploy). Untuk Microsoft, tambahkan klaim opsional `email`
   di aplikasi Entra jika email tidak terbaca.
2. **NIM/email + password** di Postgres (hash bcrypt). Buat akun dengan impor CSV:
   `copy users.sample.csv users.csv`, isi data, lalu `npm run user:import -- users.csv`.

Peran `STAFF` hanya bisa diberikan admin (kolom `role` di CSV atau SQL `UPDATE "User" SET role='STAFF' WHERE ...`).
Daftar mandiri (`ALLOW_REGISTER=true`) tidak memverifikasi kepemilikan email, jadi biarkan mati untuk uji coba;
pakai impor CSV atau login Google/Microsoft.
