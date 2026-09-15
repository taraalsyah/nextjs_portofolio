export type DatePreset =
  | "TODAY"
  | "YESTERDAY"
  | "TOMORROW"
  | "THIS_WEEK"
  | "LAST_WEEK"
  | "THIS_MONTH"
  | "LAST_MONTH";

export interface DateRangeBounds {
  start: Date;
  end: Date;
  timezone: string;
}

export interface CurrentDateTimeInfo {
  date: string;
  time: string;
  timezone: string;
  iso: string;
}

/**
 * Gets current runtime date, time, and ISO string in Asia/Jakarta timezone.
 */
export function getCurrentDateTime(
  timezone: string = "Asia/Jakarta",
  now: Date = new Date()
): CurrentDateTimeInfo {
  const JAKARTA_OFFSET_MS = 7 * 60 * 60 * 1000;
  const jakartaNow = new Date(now.getTime() + JAKARTA_OFFSET_MS);

  const year = jakartaNow.getUTCFullYear();
  const month = String(jakartaNow.getUTCMonth() + 1).padStart(2, "0");
  const date = String(jakartaNow.getUTCDate()).padStart(2, "0");
  const hours = String(jakartaNow.getUTCHours()).padStart(2, "0");
  const minutes = String(jakartaNow.getUTCMinutes()).padStart(2, "0");
  const seconds = String(jakartaNow.getUTCSeconds()).padStart(2, "0");

  const dateStr = `${year}-${month}-${date}`;
  const timeStr = `${hours}:${minutes}:${seconds}`;
  const isoStr = `${dateStr}T${timeStr}+07:00`;

  return {
    date: dateStr,
    time: timeStr,
    timezone: timezone || "Asia/Jakarta",
    iso: isoStr,
  };
}

/**
 * Resolves a date preset into exclusive UTC Date bounds using Asia/Jakarta (UTC+7) timezone.
 * Asia/Jakarta is UTC+7 (420 minutes offset).
 */
export function resolveDatePreset(
  preset: DatePreset,
  now: Date = new Date()
): DateRangeBounds {
  const JAKARTA_OFFSET_MS = 7 * 60 * 60 * 1000;
  const jakartaNow = new Date(now.getTime() + JAKARTA_OFFSET_MS);

  const year = jakartaNow.getUTCFullYear();
  const month = jakartaNow.getUTCMonth();
  const date = jakartaNow.getUTCDate();
  const dayOfWeek = jakartaNow.getUTCDay(); // 0 = Sunday, 1 = Monday, ...

  let startLocalUtcMs = 0;
  let endLocalUtcMs = 0;

  const cleanPreset = String(preset).toUpperCase() as DatePreset;

  switch (cleanPreset) {
    case "TODAY":
      startLocalUtcMs = Date.UTC(year, month, date, 0, 0, 0, 0);
      endLocalUtcMs = Date.UTC(year, month, date + 1, 0, 0, 0, 0);
      break;

    case "YESTERDAY":
      startLocalUtcMs = Date.UTC(year, month, date - 1, 0, 0, 0, 0);
      endLocalUtcMs = Date.UTC(year, month, date, 0, 0, 0, 0);
      break;

    case "TOMORROW":
      startLocalUtcMs = Date.UTC(year, month, date + 1, 0, 0, 0, 0);
      endLocalUtcMs = Date.UTC(year, month, date + 2, 0, 0, 0, 0);
      break;

    case "THIS_WEEK": {
      // Monday as first day of week
      const diffToMonday = (dayOfWeek + 6) % 7;
      startLocalUtcMs = Date.UTC(year, month, date - diffToMonday, 0, 0, 0, 0);
      endLocalUtcMs = Date.UTC(year, month, date - diffToMonday + 7, 0, 0, 0, 0);
      break;
    }

    case "LAST_WEEK": {
      const diffToMonday = (dayOfWeek + 6) % 7;
      startLocalUtcMs = Date.UTC(year, month, date - diffToMonday - 7, 0, 0, 0, 0);
      endLocalUtcMs = Date.UTC(year, month, date - diffToMonday, 0, 0, 0, 0);
      break;
    }

    case "THIS_MONTH":
      startLocalUtcMs = Date.UTC(year, month, 1, 0, 0, 0, 0);
      endLocalUtcMs = Date.UTC(year, month + 1, 1, 0, 0, 0, 0);
      break;

    case "LAST_MONTH":
      startLocalUtcMs = Date.UTC(year, month - 1, 1, 0, 0, 0, 0);
      endLocalUtcMs = Date.UTC(year, month, 1, 0, 0, 0, 0);
      break;

    default:
      startLocalUtcMs = Date.UTC(year, month, date, 0, 0, 0, 0);
      endLocalUtcMs = Date.UTC(year, month, date + 1, 0, 0, 0, 0);
      break;
  }

  // Convert Asia/Jakarta local times back to true UTC
  return {
    start: new Date(startLocalUtcMs - JAKARTA_OFFSET_MS),
    end: new Date(endLocalUtcMs - JAKARTA_OFFSET_MS),
    timezone: "Asia/Jakarta",
  };
}

export function getTodayRange(now: Date = new Date()): DateRangeBounds {
  return resolveDatePreset("TODAY", now);
}

export function getYesterdayRange(now: Date = new Date()): DateRangeBounds {
  return resolveDatePreset("YESTERDAY", now);
}

export function getTomorrowRange(now: Date = new Date()): DateRangeBounds {
  return resolveDatePreset("TOMORROW", now);
}

export function getThisWeekRange(now: Date = new Date()): DateRangeBounds {
  return resolveDatePreset("THIS_WEEK", now);
}

export function getLastWeekRange(now: Date = new Date()): DateRangeBounds {
  return resolveDatePreset("LAST_WEEK", now);
}

export function getThisMonthRange(now: Date = new Date()): DateRangeBounds {
  return resolveDatePreset("THIS_MONTH", now);
}

export function getLastMonthRange(now: Date = new Date()): DateRangeBounds {
  return resolveDatePreset("LAST_MONTH", now);
}
