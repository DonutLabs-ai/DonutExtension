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
      /**
       * 添加一个token节点
       */
      setTokenNode: (attributes: { symbol: string; mint: string }) => ReturnType;
    };
  }
}

// 添加静态助手方法来检查节点是否是token节点
export const isTokenNode = (node: any): boolean => {
  return node?.type?.name === 'tokenNode';
};

// 从token节点中获取symbol值
export const getTokenSymbol = (node: any): string | null => {
  if (isTokenNode(node)) {
    return node.attrs?.symbol || null;
  }
  return null;
};

// 从token节点中获取mint值（唯一标识符）
export const getTokenMint = (node: any): string | null => {
  if (isTokenNode(node)) {
    return node.attrs?.mint || null;
  }
  return null;
};

/**
 * 获取token节点对应的完整TokenInfo
 */
export const getTokenInfo = (node: any): TokenInfo | null => {
  if (!isTokenNode(node)) return null;

  const mint = getTokenMint(node);
  const symbol = getTokenSymbol(node);

  if (!mint && !symbol) return null;

  // 从store中获取最新的tokens数据
  const tokens = useTokenStore.getState().tokens;

  // 优先使用mint查找（精确匹配）
  if (mint) {
    const tokenByMint = tokens[mint] || Object.values(tokens).find(t => t.mint === mint);
    if (tokenByMint) return tokenByMint;
  }

  // 回退到使用symbol查找（可能有多个token共享同一个symbol）
  if (symbol) {
    return Object.values(tokens).find(t => t.symbol.toLowerCase() === symbol.toLowerCase()) || null;
  }

  return null;
};

export const TokenNode = Node.create<TokenNodeOptions>({
  name: 'tokenNode',

  group: 'inline',

  inline: true,

  atom: true, // 不可分割的单元

  selectable: true, // 确保节点可以被选择

  draggable: false, // 禁用拖拽以避免意外移动

  // 防止插入空白字符
  isolating: false,

  // 允许将光标放在节点前后
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
          if (!attributes.symbol) {
            return {};
          }

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
    // 优先使用mint地址查找token，如果找不到再使用symbol
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
        contenteditable: 'false', // 确保内容不可编辑
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
