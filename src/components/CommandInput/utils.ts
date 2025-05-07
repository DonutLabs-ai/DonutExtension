import { TriggerContext, TriggerType } from '@/stores/commandInputStore';

/**
 * Parse trigger context based on text and cursor index.
 */
export function parseTrigger(text: string, cursorIndex: number): TriggerContext | null {
  if (cursorIndex === 0) return null;
  // Case 1: '/' trigger at index 0
  if (text.startsWith('/')) {
    const query = text.slice(1, cursorIndex);
    return { type: '/' as TriggerType, start: 0, query };
  }
  // Case 2: '$' trigger anywhere before cursor
  const slice = text.slice(0, cursorIndex);
  const dollarIndex = slice.lastIndexOf('$');
  if (dollarIndex !== -1) {
    const query = slice.slice(dollarIndex + 1);
    return { type: '$', start: dollarIndex, query };
  }
  return null;
}
