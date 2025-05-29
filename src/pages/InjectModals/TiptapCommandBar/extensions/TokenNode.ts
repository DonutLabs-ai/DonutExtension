import { mergeAttributes, Node } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import TokenView from '../components/TokenView';
import { useTokenStore } from '@/stores/tokenStore';
import type { TokenInfo } from '@/stores/tokenStore';

export interface TokenNodeOptions {
  HTMLAttributes: Record<string, any>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    tokenNode: {
      // Add a token node
      setTokenNode: (attributes: { symbol: string; mint: string }) => ReturnType;
    };
  }
}

// Add static helper methods to check if a node is a token node
export const isTokenNode = (node: any): boolean => {
  return node?.type?.name === 'tokenNode';
};

// Get symbol value from token node
export const getTokenSymbol = (node: any): string | null => {
  if (isTokenNode(node)) {
    return node.attrs?.symbol || null;
  }
  return null;
};

// Get mint value (unique identifier) from token node
export const getTokenMint = (node: any): string | null => {
  if (isTokenNode(node)) {
    return node.attrs?.mint || null;
  }
  return null;
};

// Get the complete TokenInfo corresponding to the token node
export const getTokenInfo = (node: any): TokenInfo | null => {
  if (!isTokenNode(node)) return null;

  const mint = getTokenMint(node);
  const symbol = getTokenSymbol(node);

  if (!mint && !symbol) return null;

  // Get the latest tokens data from store
  const tokens = useTokenStore.getState().tokens;

  // Prioritize mint lookup (exact match)
  if (mint) {
    const tokenByMint = tokens[mint] || Object.values(tokens).find(t => t.mint === mint);
    if (tokenByMint) return tokenByMint;
  }

  // Fall back to symbol lookup (multiple tokens may share the same symbol)
  if (symbol) {
    return Object.values(tokens).find(t => t.symbol.toLowerCase() === symbol.toLowerCase()) || null;
  }

  return null;
};

export const TokenNode = Node.create<TokenNodeOptions>({
  name: 'tokenNode',

  group: 'inline',

  inline: true,

  // Indivisible unit
  atom: true,

  // Ensure the node can be selected
  selectable: true,

  // Disable dragging to avoid accidental movement
  draggable: false,

  // Prevent insertion of whitespace characters
  isolating: false,

  // Allow cursor to be placed before and after the node
  allowGapCursor: true,

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  addAttributes() {
    return {
      symbol: {
        default: null,
        parseHTML: element => element.getAttribute('data-symbol'),
        renderHTML: attributes => {
          if (!attributes.symbol) return {};

          return {
            'data-symbol': attributes.symbol,
          };
        },
      },
      mint: {
        default: null,
        parseHTML: element => element.getAttribute('data-mint'),
        renderHTML: attributes => {
          if (!attributes.mint) {
            return {};
          }

          return {
            'data-mint': attributes.mint,
          };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-token-node]',
        getAttrs: element => {
          if (typeof element === 'string') return {};

          const symbol = element.getAttribute('data-symbol');
          const mint = element.getAttribute('data-mint');
          return { symbol, mint };
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    // Prioritize mint address lookup for token, fall back to symbol if not found
    const token = HTMLAttributes.mint
      ? useTokenStore.getState().tokens[HTMLAttributes.mint] ||
        Object.values(useTokenStore.getState().tokens).find(t => t.mint === HTMLAttributes.mint)
      : Object.values(useTokenStore.getState().tokens).find(
          t => t.symbol.toLowerCase() === (HTMLAttributes.symbol || '').toLowerCase()
        );

    const displayName = token ? token.symbol : HTMLAttributes.symbol || '';

    return [
      'span',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        'data-token-node': '',
        'data-mint': HTMLAttributes.mint || '',
        class: 'token-node',
        contenteditable: 'false',
      }),
      displayName,
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(TokenView);
  },

  addCommands() {
    return {
      setTokenNode:
        attributes =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: attributes,
          });
        },
    };
  },
});
