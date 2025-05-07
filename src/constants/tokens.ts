export interface Token {
  symbol: string;
  name: string;
  value: string;
}

export const tokens: Token[] = [
  { symbol: 'SOL', name: 'Solana', value: 'SOL' },
  { symbol: 'USDC', name: 'USD Coin', value: 'USDC' },
  { symbol: 'ETH', name: 'Ethereum', value: 'ETH' },
  { symbol: 'BTC', name: 'Bitcoin', value: 'BTC' },
];
