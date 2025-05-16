import BigNumber from 'bignumber.js';

/**
 * Convert a human-readable decimal amount string to raw integer string based on decimals.
 * Example: ('1.23', 6) => '1230000'
 */
export function toRawAmount(amount: string, decimals: number): string {
  if (!amount || isNaN(Number(amount))) return '0';

  try {
    const decimalAmount = new BigNumber(amount);
    const multiplier = new BigNumber(10).pow(decimals);
    return decimalAmount.multipliedBy(multiplier).toFixed(0);
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
    const rawDecimal = new BigNumber(raw);
    const divisor = new BigNumber(10).pow(decimals);
    // Format to remove trailing zeros but keep necessary decimal places
    return rawDecimal.div(divisor).toFixed();
  } catch (e) {
    console.error('Error converting to UI amount:', e);
    return '0';
  }
}

export const commas = (val: string) => {
  if (!val) return '';
  let [int, decimal] = val.split('.');
  int = int.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  decimal = decimal ? '.' + decimal : '';
  return `${int}${decimal}`;
};

interface NumberProps {
  digits?: number;
  prefix?: string;
  suffix?: string;
  roundUp?: 0 | 1;
  thousandSeparated?: boolean;
}

export const numberIndent = (number: number | string | undefined, option?: NumberProps): string => {
  if (Number(number) === 0) return '0';
  if (!number || !Number(number)) return '-';

  let digits = option?.digits || 2;
  const { suffix = '', roundUp = 1, thousandSeparated = true } = option || {};
  // if (Math.abs(Number(number)) < 0.001 && digits <= 3) {
  //   return '<0.001';
  // }
  if (new BigNumber(number).lt(1)) {
    const _match = /\.(0+)/.exec(`${number}`);
    if (_match) {
      const length = _match[0].length - 1;
      if (digits > 0 && length >= Math.min(digits, 3)) {
        digits = length + Math.min(digits, 3);
        return (
          suffix + new BigNumber(number).toFixed(digits, roundUp).replace(_match[0], `.{${length}}`)
        );
      }
    }
    return `${suffix}${new BigNumber(number).toFixed(digits, roundUp).replace(/\.?0+$/, '')}`;
  }

  if (new BigNumber(number).gte(1) && new BigNumber(number).lt(1e4)) {
    const data = new BigNumber(number).toFixed(digits, roundUp).replace(/\.?0+$/, '');
    if (thousandSeparated) return suffix + commas(data);
    return suffix + data;
  }
  const lookup = [
    { shift: 3, symbol: 'K', value: 1e6, type: 'lt' },
    { shift: 6, symbol: 'M', value: 1e9, type: 'lt' },
    { shift: 9, symbol: 'B', value: 1e9, type: 'gte' },
  ];

  let _number: any = new BigNumber(number);
  let symbol = '';
  for (let index = 0; index < lookup.length; index++) {
    const element = lookup[index];
    if (_number[element.type](element.value)) {
      _number = _number.shiftedBy(-element.shift);
      symbol = element.symbol;
      break;
    }
  }
  const formattedNumber = _number.toFixed(digits, roundUp).replace(/\.?0+$/, '');
  if (thousandSeparated) return `${suffix}${commas(formattedNumber)}${symbol}`;
  return `${suffix}${formattedNumber}${symbol}`;
};
