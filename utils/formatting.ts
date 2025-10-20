import type { KOLFormData } from '../types';

/**
 * Takes a raw data object and returns a new object with values formatted for display.
 * e.g., formats numbers with commas and adds '%' to percentages.
 */
export const formatDataForDisplay = (data: KOLFormData): KOLFormData => {
  return {
    ...data,
    guaranteedMinimum: formatNumber(data.guaranteedMinimum),
    bonusAmount: formatNumber(data.bonusAmount),
    performanceThreshold: formatNumber(data.performanceThreshold),
    profitShare: formatPercent(data.profitShare),
    profitShareBonus: formatPercent(data.profitShareBonus),
  };
};

/**
 * Unformats a string by removing commas.
 */
export const unformatNumber = (value: string): string => {
  return value.toString().replace(/,/g, '');
};

/**
 * Formats a numeric string with commas. Returns non-numeric strings as is.
 */
export const formatNumber = (value: string): string => {
  if (value === '無' || value === '' || !value) return value || '';
  const cleanValue = unformatNumber(value);
  if (isNaN(parseFloat(cleanValue))) return value; 
  return parseFloat(cleanValue).toLocaleString('en-US');
};

/**
 * Unformats a percentage string by removing '%' and other non-numeric characters.
 */
export const unformatPercent = (value: string): string => {
  if (value.trim() === '無') return '無';
  // Keep the decimal point
  return value.replace(/[^0-9.]/g, '');
};

/**
 * Formats a numeric string into a percentage string.
 */
export const formatPercent = (value: string): string => {
  if (value === '無' || value === '' || !value) return value || '';
  if (isNaN(parseFloat(value))) return value;
  return `${value}%`;
};