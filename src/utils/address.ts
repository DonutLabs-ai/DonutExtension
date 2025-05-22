import { PublicKey } from '@solana/web3.js';

export function isAddress(address?: string): boolean {
  if (!address) return false;

  try {
    new PublicKey(address);
    return true;
  } catch (error) {
    return false;
  }
}
