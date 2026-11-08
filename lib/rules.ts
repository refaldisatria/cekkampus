// Business rules. All campus hours are WIB (UTC+7); servers usually run in UTC.
export const WIB_MS = 7 * 3600e3;
export const SLOT_MS = 2 * 3600e3; // max 2 hours per booking
export const GRACE_MS = 15 * 60e3; // check-in window after start
export const EARLY_MS = 10 * 60e3; // door opens 10 min before start
export const SLOT_HOURS = [8, 10, 12, 14, 16, 18]; // operating hours 08:00-20:00
export const LIVE = ["ACTIVE", "CHECKED_IN"];

const pad = (n: number) => String(n).padStart(2, "0");
export const slotStart = (date: string, hour: number) => new Date(`${date}T${pad(hour)}:00:00+07:00`);
export const dayRange = (date: string): [Date, Date] => {
  const s = new Date(`${date}T00:00:00+07:00`);
  return [s, new Date(s.getTime() + 86400e3)];
};
export const todayWib = () => new Date(Date.now() + WIB_MS).toISOString().slice(0, 10);
export function isValidSlot(start: Date) {
  if (isNaN(start.getTime()) || start.getTime() % 3600e3 !== 0) return false;
  const h = new Date(start.getTime() + WIB_MS).getUTCHours();
  return SLOT_HOURS.includes(h);
}
export const isTooLate = (start: Date) => Date.now() > start.getTime() + GRACE_MS;
