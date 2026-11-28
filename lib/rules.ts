// Aturan keluhan fasilitas.
export const CATEGORIES = ["AC", "LAMPU", "PIPA_TOILET", "PROYEKTOR", "MEJA_KURSI", "WIFI", "KEBERSIHAN", "LAINNYA"] as const;
export const STATUSES = ["BARU", "DIPROSES", "SELESAI", "DITOLAK", "BATAL"] as const;
export const OPEN_STATUSES = ["BARU", "DIPROSES"];
export const FINAL_STATUSES = ["SELESAI", "DITOLAK", "BATAL"];
export const MIN_DESC = 10;
export const MAX_DESC = 500;
export const MAX_OPEN_PER_USER_ROOM = 3; // anti-spam
export const SLA_MS = { urgent: 2 * 3600e3, normal: 24 * 3600e3 }; // target penanganan
export const MAX_PHOTO = 700_000; // karakter data URL (~500 KB)

export const isPhoto = (s: unknown): s is string =>
  typeof s === "string" && s.length <= MAX_PHOTO && /^data:image\/(jpeg|png|webp);base64,/.test(s);

// Perubahan status yang diizinkan staf. BATAL hanya oleh pelapor.
export const TRANSITIONS: Record<string, string[]> = {
  BARU: ["DIPROSES", "DITOLAK", "SELESAI"],
  DIPROSES: ["SELESAI", "DITOLAK"],
  SELESAI: [], DITOLAK: [], BATAL: [],
};
