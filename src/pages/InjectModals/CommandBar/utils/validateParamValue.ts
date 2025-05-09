import { ParamType } from '../store/commandDefinitions';
import { getTokens } from '@/store/tokenStore';

/**
 * Enhanced parameter value validation function
 * Used to validate whether user input parameter values meet the requirements of specific types
 *
 * @param value Parameter value
 * @param paramType Parameter type
 * @returns Whether valid
 */
export function validateParamValue(value: string, paramType: ParamType): boolean {
  // Empty value validation
  if (!value || value.trim() === '') return false;

  // Clean value (remove leading/trailing spaces)
  const cleanValue = value.trim();

  switch (paramType) {
    case ParamType.Amount: {
      // Validate if it's a valid number and positive
      // Enhanced: support various number formats, including scientific notation
      if (!/^((\d+(\.\d*)?)|(\.\d+))([eE][+-]?\d+)?$/.test(cleanValue)) return false;

      const numValue = parseFloat(cleanValue);
      // Number must be positive and not NaN or Infinity
      return !isNaN(numValue) && isFinite(numValue) && numValue > 0;
    }

    case ParamType.Token: {
      // Loose matching: if the input is a complete token name (case insensitive), consider it valid
      return getTokens().some(
        token =>
          // Exact match of symbol (case insensitive)
          token.symbol.toLowerCase() === cleanValue.toLowerCase() ||
          // Or exact match of name (case insensitive)
          token.name.toLowerCase() === cleanValue.toLowerCase()
      );
    }

    case ParamType.Address: {
      // Solana wallet address validation

      // Solana address characteristics:
      // 1. Uses Base58 encoding
      // 2. Usually 44 characters long (allow a range of lengths for manual input)
      // 3. Contains only numbers and letters, no special characters
      // 4. Does not include easily confused characters like "0", "O", "I", and "l"

      // Base58 character set: 123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz
      const base58Regex = /^[123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz]+$/;

      // Verify it only contains Base58 character set and has reasonable length (about 40-45 characters)
      return base58Regex.test(cleanValue) && cleanValue.length >= 32 && cleanValue.length <= 50;
    }

    case ParamType.Text:
      // Text parameters must be non-empty and have reasonable length
      return cleanValue.length > 0 && cleanValue.length <= 1000;

    default:
      // Unrecognized parameter type, default to true
      return true;
  }
}
