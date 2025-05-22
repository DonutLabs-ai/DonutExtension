import { isAddress } from '@/utils/address';
import { ParamType } from './commandData';
import { getTokens } from '@/stores/tokenStore';

/**
 * Parameter value validation function
 * Used to validate whether a user input parameter value meets the requirements of a specific type
 *
 * @param value Parameter value
 * @param paramType Parameter type
 * @returns Whether valid
 */
export function validateParamValue(value: string, paramType: ParamType): boolean {
  // Empty value validation
  if (!value || value.trim() === '') return false;

  // Clean value (remove leading/trailing whitespace)
  const cleanValue = value.trim();

  switch (paramType) {
    case ParamType.Amount: {
      // Validate if it's a valid number and positive
      // Support various number formats, including scientific notation
      if (!/^((\d+(\.\d*)?)|(\.\d+))([eE][+-]?\d+)?$/.test(cleanValue)) return false;

      const numValue = parseFloat(cleanValue);
      // Number must be positive and not NaN or Infinity
      return !isNaN(numValue) && isFinite(numValue) && numValue > 0;
    }

    case ParamType.Token: {
      // Loose matching: If input is the complete token name (case insensitive), considered valid

      // Check if it's a special format token mint marker (from TokenNode)
      // Format: @TOKEN:{mint}@
      if (cleanValue.startsWith('@TOKEN:') && cleanValue.endsWith('@')) {
        // If it's a special marker format inserted by TokenNode, return true directly
        // We no longer validate if the mint is in the list, as this could cause issues (e.g., list updates, network issues, etc.)
        return true;
      }

      // Regular matching: Check symbol or name
      return getTokens().some(
        token =>
          // Symbol exact match (case insensitive)
          token.symbol.toLowerCase() === cleanValue.toLowerCase() ||
          // Or name exact match (case insensitive)
          token.name.toLowerCase() === cleanValue.toLowerCase()
      );
    }

    case ParamType.TokenAddress: {
      // Check if it's a special format token mint marker (from TokenNode)
      // Format: @TOKEN:{mint}@
      if (cleanValue.startsWith('@TOKEN:') && cleanValue.endsWith('@')) {
        // If it's a special marker format inserted by TokenNode, return true directly
        // We no longer validate if the mint is in the list, as this could cause issues (e.g., list updates, network issues, etc.)
        return true;
      }

      // Otherwise check if it's address-like
      return isAddress(cleanValue);
    }

    case ParamType.Address: {
      // Solana wallet address validation
      return isAddress(cleanValue);
    }

    case ParamType.Text:
      // Text parameters must be non-empty and have reasonable length
      return cleanValue.length > 0 && cleanValue.length <= 1000;

    default:
      // Unrecognized parameter type, default to true
      return true;
  }
}

/**
 * Checks if a parameter appears to be of a specific type
 * Not as strict as the validation function, this function checks if a parameter "looks like" a certain type
 *
 * @param value Parameter value
 * @param paramType Parameter type
 * @returns Whether it looks like this type
 */
export function isLikelyParamType(value: string, paramType: ParamType): boolean {
  if (!value || value.trim() === '') return false;

  // Base58 character set pattern (for Solana addresses)
  const base58Pattern = /^[123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz]+$/;

  switch (paramType) {
    case ParamType.Amount:
      // Number or string with decimal point, or mixed string starting with a number
      return (/^\d*\.?\d*$/.test(value) && value !== '.') || /^\d+/.test(value);

    case ParamType.Token:
      // Smart token matching:
      // 1. Exact match with any token symbol (case insensitive)
      // 2. Token symbol contains or is contained by the word (case insensitive)
      // 3. Matches the beginning of token name (case insensitive)
      return getTokens().some(token => {
        const w = value.toLowerCase();
        const sym = token.symbol.toLowerCase();
        const name = token.name.toLowerCase();

        // Symbol exact match definitely qualifies
        if (sym === w) return true;

        return sym.includes(w) || w.includes(sym) || name.startsWith(w);
      });

    case ParamType.TokenAddress: {
      // TokenAddress can be either a token-like value or an address-like value
      // First check if it's token-like
      const isTokenLike = getTokens().some(token => {
        const w = value.toLowerCase();
        const sym = token.symbol.toLowerCase();
        const name = token.name.toLowerCase();

        if (sym === w) return true;
        return sym.includes(w) || w.includes(sym) || name.startsWith(w);
      });

      // If it looks like a token, return true
      if (isTokenLike) return true;

      // Otherwise check if it's address-like
      return isAddress(value);
    }

    case ParamType.Address:
      return isAddress(value);

    case ParamType.Text:
      // Any non-empty string can be a text parameter
      return value.length > 0;

    default:
      // If unsure, could be any type
      return true;
  }
}
