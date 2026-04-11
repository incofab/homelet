import { env } from './env';

export const formatMoney = (amount?: number | null) => {
  if (amount === null || amount === undefined || Number.isNaN(amount))
    return '—';
  const normalized = env.moneyInKobo ? amount / 100 : amount;
  const hasFraction = Math.abs(normalized % 1) > Number.EPSILON;
  return new Intl.NumberFormat(env.defaultLocale, {
    style: 'currency',
    currency: env.defaultCurrency,
    minimumFractionDigits: hasFraction ? 2 : 0,
    maximumFractionDigits: hasFraction ? 2 : 0,
  }).format(normalized);
};

export const formatDate = (value?: string | number | Date | null) => {
  if (!value) return '—';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat(env.defaultLocale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);
};

export const formatChatTimestamp = (value?: string | number | Date | null) => {
  if (!value) return '—';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '—';

  const now = new Date();
  const isSameDay =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();

  return new Intl.DateTimeFormat(
    env.defaultLocale,
    isSameDay
      ? {
          hour: 'numeric',
          minute: '2-digit',
        }
      : {
          month: 'short',
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
        },
  ).format(date);
};

export const getInitials = (value?: string | null) => {
  if (!value) return '?';

  const parts = value.trim().split(/\s+/).filter(Boolean).slice(0, 2);

  if (parts.length === 0) return '?';

  return parts.map((part) => part[0]?.toUpperCase() ?? '').join('');
};

export const formatStatusLabel = (value?: string | null) => {
  if (!value) return '—';
  return value
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (match) => match.toUpperCase());
};

export const formatPercent = (value?: number | null) => {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  return `${Math.round(value)}%`;
};

export const formatDaysDuration = (value?: number | null) => {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';

  const totalDays = Math.max(0, Math.round(Math.abs(value)));
  if (totalDays === 0) return '0 days';

  const units = [
    { label: 'year', days: 365 },
    { label: 'month', days: 30 },
    { label: 'week', days: 7 },
    { label: 'day', days: 1 },
  ];
  let remainingDays = totalDays;
  const parts: string[] = [];

  units.forEach((unit) => {
    const count = Math.floor(remainingDays / unit.days);
    if (count === 0) return;

    parts.push(`${count} ${unit.label}${count === 1 ? '' : 's'}`);
    remainingDays -= count * unit.days;
  });

  return parts.join(', ');
};
