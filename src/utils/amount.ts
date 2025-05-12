import Decimal from 'decimal.js';

/**
 * Convert a human-readable decimal amount string to raw integer string based on decimals.
 * Example: ('1.23', 6) => '1230000'
 */
export function toRawAmount(amount: string, decimals: number): string {
  if (!amount || isNaN(Number(amount))) return '0';

  try {
    const decimalAmount = new Decimal(amount);
    const multiplier = new Decimal(10).pow(decimals);
    return decimalAmount.mul(multiplier).toFixed(0);
  } catch (e) {
    console.error('Error converting to raw amount:', e);
    return '0';
  }
}

/**
 * Convert raw integer string to human-readable using decimals.
 * Example: ('1230000', 6) => '1.23'
 */
export function toUiAmount(raw: string, decimals: number): string {
  if (!raw) return '0';

  try {
    const rawDecimal = new Decimal(raw);
    const divisor = new Decimal(10).pow(decimals);
    // Format to remove trailing zeros but keep necessary decimal places
    return rawDecimal.div(divisor).toFixed();
  } catch (e) {
    console.error('Error converting to UI amount:', e);
    return '0';
  }
}
