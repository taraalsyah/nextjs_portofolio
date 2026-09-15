import { getCurrentDateTime, CurrentDateTimeInfo } from "../date-utils";

export interface GetCurrentDatetimeInput {
  timezone?: string;
}

export async function executeGetCurrentDatetime(
  input?: GetCurrentDatetimeInput
): Promise<string> {
  const timezone = (input?.timezone || "Asia/Jakarta").trim();
  const info: CurrentDateTimeInfo = getCurrentDateTime(timezone);

  return JSON.stringify(
    {
      success: true,
      date: info.date,
      time: info.time,
      timezone: info.timezone,
      iso: info.iso,
    },
    null,
    2
  );
}
