import { describe, expect, it } from 'vitest';
import { formatDaysDuration, formatMoney } from '../../../app/lib/format';

describe('formatMoney', () => {
  it('omits decimals for whole amounts', () => {
    expect(formatMoney(1000)).not.toContain('.');
  });

  it('keeps decimals for fractional amounts', () => {
    expect(formatMoney(1000.5)).toContain('.50');
  });
});

describe('formatDaysDuration', () => {
  it('formats day counts into friendly duration parts', () => {
    expect(formatDaysDuration(60)).toBe('2 months');
    expect(formatDaysDuration(21)).toBe('3 weeks');
    expect(formatDaysDuration(45)).toBe('1 month, 2 weeks, 1 day');
  });

  it('handles empty and zero values', () => {
    expect(formatDaysDuration(null)).toBe('—');
    expect(formatDaysDuration(0)).toBe('0 days');
  });
});
