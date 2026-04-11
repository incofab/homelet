const padDatePart = (value: number) => String(value).padStart(2, "0");

const parseDateParts = (value: string) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  if (
    Number.isNaN(year) ||
    Number.isNaN(month) ||
    Number.isNaN(day) ||
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > 31
  ) {
    return null;
  }

  return { year, month, day };
};

export const addDaysToDate = (value: string | undefined, days: number) => {
  if (!value) {
    return "";
  }

  const parts = parseDateParts(value);
  if (!parts) {
    return "";
  }

  const date = new Date(Date.UTC(parts.year, parts.month - 1, parts.day));
  date.setUTCDate(date.getUTCDate() + days);

  return [
    date.getUTCFullYear(),
    padDatePart(date.getUTCMonth() + 1),
    padDatePart(date.getUTCDate()),
  ].join("-");
};

export const addMonthsNoOverflow = (value: string | undefined, months: number) => {
  if (!value || !Number.isFinite(months)) {
    return "";
  }

  const parts = parseDateParts(value);
  if (!parts) {
    return "";
  }

  const monthIndex = parts.month - 1 + months;
  const year = parts.year + Math.floor(monthIndex / 12);
  const normalizedMonthIndex = ((monthIndex % 12) + 12) % 12;
  const lastDayOfMonth = new Date(Date.UTC(year, normalizedMonthIndex + 1, 0)).getUTCDate();
  const day = Math.min(parts.day, lastDayOfMonth);

  return [
    year,
    padDatePart(normalizedMonthIndex + 1),
    padDatePart(day),
  ].join("-");
};
