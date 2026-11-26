// Aturan keluhan fasilitas.
export const CATEGORIES = ["AC", "PROYEKTOR", "WHITEBOARD", "LISTRIK", "TV", "KEBERSIHAN", "LAINNYA"] as const;
export const STATUSES = ["BARU", "DIPROSES", "SELESAI", "DITOLAK"] as const;
export const OPEN_STATUSES = ["BARU", "DIPROSES"];
export const MIN_DESC = 10;
export const MAX_DESC = 1000;
export const MAX_OPEN_PER_USER_ROOM = 3; // cegah spam: maks 3 keluhan terbuka per orang per lokasi

// Perubahan status yang diizinkan staf.
export const TRANSITIONS: Record<string, string[]> = {
  BARU: ["DIPROSES", "DITOLAK", "SELESAI"],
  DIPROSES: ["SELESAI", "DITOLAK"],
  SELESAI: [],
  DITOLAK: [],
};
