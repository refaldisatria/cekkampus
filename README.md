# StudyNook

Sistem pemesanan ruang belajar kelompok kampus (mobile-first).
Next.js 14 (App Router) · Tailwind · Prisma + PostgreSQL · NextAuth · qrcode.react

## Menjalankan di localhost

```bash
cp .env.example .env            # sudah disediakan .env default
docker compose up -d            # PostgreSQL (atau pakai Postgres sendiri)
npm install
npx prisma migrate dev --name init
npm run db:seed                 # 1 gedung, 10 ruangan, 3 user
npm run dev                     # http://localhost:3000
```

## Akun demo (login simulasi SSO, tanpa password)

| Role | Email |
|---|---|
| Mahasiswa | rafi.pratama@mail.ac.id |
| Mahasiswa | nadia.savitri@mail.ac.id |
| Staf | bambang@staff.ac.id |

## Uji check-in pintu (QR)

```bash
curl -X POST http://localhost:3000/api/checkin \
  -H "Content-Type: application/json" -H "x-door-key: rahasia-scanner-pintu" \
  -d '{"token":"<ISI_QR_TOKEN>"}'
```

## Aturan bisnis
- Maks. 2 jam per sesi, anti double-booking (transaksi Serializable).
- Check-in wajib <= 15 menit setelah jadwal mulai, jika tidak status PENDING -> CANCELLED
  (dijalankan lazily lewat `syncBookingStatuses()` di `src/lib/bookings.ts`).
- Staf: toggle MAINTENANCE/AVAILABLE, blokir jadwal manual, check-in manual.

## Deploy
Set env `DATABASE_URL`, `NEXTAUTH_URL`, `NEXTAUTH_SECRET`, `DOOR_API_KEY`, `TZ=Asia/Jakarta`,
lalu `npm run db:deploy && npm run build && npm start`. Untuk produksi tambahkan cron
yang memanggil `syncBookingStatuses()` sebagai penyapu berkala dan ganti provider Credentials dengan SSO kampus.
