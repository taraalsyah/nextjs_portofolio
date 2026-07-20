import { formatInTimeZone } from 'date-fns-tz';
import { id } from 'date-fns/locale';

export const TIMEZONE_WIB = 'Asia/Jakarta';

/**
 * Returns current UTC Date instance for database persistence.
 */
export function getNowUTC(): Date {
  return new Date();
}

/**
 * Formats any date into Indonesian WIB display string.
 * Example output: "20 Juli 2026 14:35:12 WIB"
 */
export function formatToWIB(
  date: Date | string | number | null | undefined,
  pattern: string = "d MMMM yyyy HH:mm:ss 'WIB'"
): string {
  if (!date) return '-';
  const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '-';
  return formatInTimeZone(d, TIMEZONE_WIB, pattern, { locale: id });
}

/**
 * Standard short WIB format: "20 Jul 2026 14:35 WIB"
 */
export function formatShortWIB(date: Date | string | number | null | undefined): string {
  return formatToWIB(date, "d MMM yyyy HH:mm 'WIB'");
}

/**
 * Standard Activity Log date format: "20 Juli 2026 14:35:12 WIB"
 */
export function formatActivityWIB(date: Date | string | number | null | undefined): string {
  return formatToWIB(date, "d MMMM yyyy HH:mm:ss 'WIB'");
}

/**
 * Calculates a future Date in UTC by adding specified minutes.
 */
export function addMinutesUTC(minutes: number): Date {
  return new Date(Date.now() + minutes * 60 * 1000);
}

/**
 * Calculates a future Date in UTC by adding specified hours.
 */
export function addHoursUTC(hours: number): Date {
  return new Date(Date.now() + hours * 60 * 60 * 1000);
}

/**
 * Returns human-readable remaining time string in Indonesian.
 * Examples: "2 jam 15 menit", "45 menit", "30 detik", "0 menit"
 */
export function getRemainingTimeString(targetDate: Date | string | number): string {
  const target = typeof targetDate === 'string' || typeof targetDate === 'number' ? new Date(targetDate) : targetDate;
  const diffMs = target.getTime() - Date.now();
  if (diffMs <= 0) return '0 menit';

  const totalSeconds = Math.ceil(diffMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.ceil((totalSeconds % 3600) / 60);

  if (hours > 0) {
    return `${hours} jam ${minutes} menit`;
  }
  if (minutes > 0) {
    return `${minutes} menit`;
  }
  return `${totalSeconds} detik`;
}

/**
 * Checks whether a given target date has expired compared to current time.
 */
export function isExpired(targetDate: Date | string | number): boolean {
  const target = typeof targetDate === 'string' || typeof targetDate === 'number' ? new Date(targetDate) : targetDate;
  return target.getTime() <= Date.now();
}

/**
 * Returns seconds elapsed since a given date.
 */
export function getSecondsSince(fromDate: Date | string | number): number {
  const from = typeof fromDate === 'string' || typeof fromDate === 'number' ? new Date(fromDate) : fromDate;
  return Math.floor((Date.now() - from.getTime()) / 1000);
}
