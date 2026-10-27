/**
 * Clipper runs in Seoul only. Korea has no daylight saving time, so KST is a
 * fixed UTC+9 offset and the wall-clock conversions below are plain arithmetic.
 *
 * Groomer schedules are stored as KST wall-clock strings ("09:00"), while
 * appointments are stored as UTC timestamps. Every comparison between the two
 * has to go through these helpers.
 */

const SEOUL_TIME_ZONE = "Asia/Seoul";
const SEOUL_OFFSET_MS = 9 * 60 * 60 * 1000;

type DateInput = Date | string;

function toDate(value: DateInput): Date {
  return value instanceof Date ? value : new Date(value);
}

/** Shifts an instant so that the UTC getters report KST wall-clock values. */
function toSeoulWallClock(value: DateInput): Date {
  return new Date(toDate(value).getTime() + SEOUL_OFFSET_MS);
}

/** Day of the week in Seoul, 0 (Sunday) through 6 (Saturday). */
export function seoulWeekday(value: DateInput): number {
  return toSeoulWallClock(value).getUTCDay();
}

/** Time of day in Seoul as "HH:MM", comparable with schedule columns. */
export function seoulTimeOfDay(value: DateInput): string {
  const wallClock = toSeoulWallClock(value);

  return formatTimeOfDay(
    wallClock.getUTCHours() * 60 + wallClock.getUTCMinutes(),
  );
}

/** Calendar date in Seoul as "YYYY-MM-DD". */
export function seoulDateKey(value: DateInput): string {
  return toSeoulWallClock(value).toISOString().slice(0, 10);
}

/** A KST wall-clock date and time ("2026-10-27", "09:00") as a UTC instant. */
export function seoulWallClockToUtc(dateKey: string, timeOfDay: string): Date {
  return new Date(`${dateKey}T${timeOfDay}:00+09:00`);
}

/** "HH:MM" as minutes since midnight. */
export function parseTimeOfDay(timeOfDay: string): number {
  const [hours, minutes] = timeOfDay.split(":");

  return Number(hours) * 60 + Number(minutes);
}

/** Minutes since midnight as "HH:MM". */
export function formatTimeOfDay(minutes: number): string {
  const hours = Math.floor(minutes / 60);

  return `${String(hours).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
}

const dateLongFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: SEOUL_TIME_ZONE,
  weekday: "long",
  year: "numeric",
  month: "long",
  day: "numeric",
});

const dateShortFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: SEOUL_TIME_ZONE,
  weekday: "short",
  month: "short",
  day: "numeric",
});

const timeFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: SEOUL_TIME_ZONE,
  hour: "numeric",
  minute: "2-digit",
});

function formatWith(formatter: Intl.DateTimeFormat, value: DateInput | null | undefined, fallback: string) {
  if (value === null || value === undefined || value === "") return fallback;
  const date = toDate(value);
  if (Number.isNaN(date.getTime())) return fallback;

  return formatter.format(date);
}

/** "Friday, August 21, 2026" in Seoul time. */
export function formatSeoulDateLong(value: DateInput | null | undefined, fallback = "Date to be confirmed") {
  return formatWith(dateLongFormatter, value, fallback);
}

/** "Fri, Aug 21" in Seoul time. */
export function formatSeoulDateShort(value: DateInput | null | undefined, fallback = "Date to be confirmed") {
  return formatWith(dateShortFormatter, value, fallback);
}

/** "10:00 AM" in Seoul time. */
export function formatSeoulTime(value: DateInput | null | undefined, fallback = "Time to be confirmed") {
  return formatWith(timeFormatter, value, fallback);
}
