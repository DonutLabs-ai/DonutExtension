import { commands } from '@/constants/commands';
import { tokens } from '@/constants/tokens';

export function filterCommands(query: string) {
  const lower = query.toLowerCase();
  return commands.filter(c => c.label.toLowerCase().includes(lower));
}

export function filterTokens(query: string) {
  const lower = query.toLowerCase();
  return tokens.filter(
    t => t.symbol.toLowerCase().includes(lower) || t.name.toLowerCase().includes(lower)
  );
}
