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

export function ellipseAddress(address: string, sliceLength = 6, maxLength = sliceLength * 2) {
  if (address && address.length > maxLength) {
    return (
      address.substring(0, sliceLength) + '...' + address.substring(address.length - sliceLength)
    );
  } else {
    return address;
  }
}
