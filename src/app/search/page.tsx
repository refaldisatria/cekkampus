import AppHeader from "@/components/AppHeader";
import SearchForm from "@/components/SearchForm";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function SearchPage() {
  const buildings = await prisma.building.findMany({ orderBy: { name: "asc" } });
  return (
    <>
      <AppHeader />
      <main className="mx-auto max-w-md space-y-5 p-4">
        <div>
          <h1 className="font-headline text-2xl font-bold text-primary">Cari Ruang Belajar</h1>
          <p className="text-sm text-on-surface-variant">Pilih gedung dan waktu. Maksimal 2 jam per sesi.</p>
        </div>
        <SearchForm buildings={buildings} />
        <p className="rounded-xl bg-surface-container-low p-3 text-xs text-on-surface-variant">
          Check-in QR wajib dalam 15 menit pertama, jika tidak reservasi dibatalkan otomatis.
        </p>
      </main>
    </>
  );
}
