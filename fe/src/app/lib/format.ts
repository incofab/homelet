import { env } from "./env";

export const formatMoney = (amount?: number | null) => {
  if (amount === null || amount === undefined || Number.isNaN(amount)) return "—";
  const normalized = env.moneyInKobo ? amount / 100 : amount;
  return new Intl.NumberFormat(env.defaultLocale, {
    style: "currency",
    currency: env.defaultCurrency,
    maximumFractionDigits: 2,
  }).format(normalized);
};

export const formatDate = (value?: string | number | Date | null) => {
  if (!value) return "—";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat(env.defaultLocale, {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
};

export const formatStatusLabel = (value?: string | null) => {
  if (!value) return "—";
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (match) => match.toUpperCase());
};

export const formatPercent = (value?: number | null) => {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return `${Math.round(value)}%`;
};
