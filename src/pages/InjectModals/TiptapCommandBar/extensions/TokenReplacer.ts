import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from 'prosemirror-state';
import { getTokens } from '@/stores/tokenStore';
import { useTiptapCommandBarStore } from '../store/tiptapStore';

export const TokenReplacer = Extension.create({
  name: 'tokenReplacer',

  addProseMirrorPlugins() {
    const editor = this.editor;

    return [
      new Plugin({
        key: new PluginKey('tokenReplacer'),
        appendTransaction(transactions, oldState, newState) {
          // 基本检查：如果没有变化或编辑器不可用，直接返回
          if (!transactions.some(tr => tr.docChanged) || !editor) {
            return null;
          }

          // 获取所有可用token
          const tokens = getTokens();
          if (!tokens.length) return null;

          // 创建token查找索引（转为小写以便不区分大小写查找）
          const tokenLookup = new Map();
          tokens.forEach(token => {
            tokenLookup.set(token.symbol.toLowerCase(), token);
          });

          // 获取TokenNode类型
          const { schema } = newState;
          const tokenNodeType = schema.nodes.tokenNode;
          if (!tokenNodeType) {
            return null;
          }

          // 获取当前命令解析结果
          const { parsedCommand } = useTiptapCommandBarStore.getState();
          if (!parsedCommand?.commandConfirmed || !parsedCommand?.command) {
            return null;
          }

          // 创建变更事务
          const tr = newState.tr;
          let changed = false;

          // 检测触发条件：空格输入或内容粘贴
          const hasPastedContent = transactions.some(tr => {
            const newText = tr.doc.textBetween(0, tr.doc.content.size, '', '');
            const oldText = oldState.doc.textBetween(0, oldState.doc.content.size, '', '');
            return newText.length > oldText.length + 10; // 粘贴操作通常会增加大量文本
          });

          const hasTypedSpace = transactions.some(tr => {
            const newText = tr.doc.textBetween(0, tr.doc.content.size, '', '');
            const oldText = oldState.doc.textBetween(0, oldState.doc.content.size, '', '');
            return (
              (newText.match(/[\s\u00A0]/g) || []).length >
              (oldText.match(/[\s\u00A0]/g) || []).length
            );
          });

          // 如果没有触发条件，直接返回
          if (!hasTypedSpace && !hasPastedContent) {
            return null;
          }

          try {
            // 收集所有要替换的token
            const tokensToReplace = collectTokensToReplace(newState, tokenLookup, hasPastedContent);

            // 如果没有找到token，直接返回
            if (tokensToReplace.length === 0) {
              return null;
            }

            // 从后向前替换token，避免位置变化影响
            tokensToReplace.sort((a, b) => b.end - a.end);

            // 执行替换
            for (const { word, start, end, tokenInfo } of tokensToReplace) {
              try {
                // 替换文本为token节点
                tr.delete(start, end);
                tr.insert(
                  start,
                  tokenNodeType.create({
                    symbol: tokenInfo.symbol,
                    mint: tokenInfo.mint,
                  })
                );
                changed = true;
              } catch (error) {
                console.error(`Failed to replace token "${word}":`, error);
              }
            }

            return changed ? tr : null;
          } catch (error) {
            console.error('Error in TokenReplacer:', error);
            return null;
          }

          // 收集需要替换的所有token的辅助函数
          function collectTokensToReplace(
            state: any,
            tokenMap: Map<string, any>,
            isPasteOperation: boolean
          ): { word: string; start: number; end: number; tokenInfo: any }[] {
            const result: { word: string; start: number; end: number; tokenInfo: any }[] = [];

            // 匹配整个单词的正则表达式
            // 匹配前后有空格（或文本开头/结尾）的完整单词
            const wordRegex = /(?:^|[\s\u00A0])([^\s\u00A0]+)(?=[\s\u00A0]|$)/g;

            // 遍历所有文本节点
            state.doc.descendants((node: any, pos: number) => {
              if (!node.isText) return;

              const text = node.text || '';
              if (!text.trim()) return;

              // 重置正则表达式
              wordRegex.lastIndex = 0;
              let match;

              // 查找所有单词
              while ((match = wordRegex.exec(text)) !== null) {
                const word = match[1];
                if (!word?.trim()) continue;

                // 计算单词在文本中的位置
                const wordStartOffset = match.index + match[0].length - word.length;
                const wordEndOffset = wordStartOffset + word.length;

                // 检查单词是否确认（后面有空格或是最后一个单词）
                const isConfirmed =
                  (wordEndOffset < text.length &&
                    (text[wordEndOffset] === ' ' || text[wordEndOffset] === '\u00A0')) ||
                  (isPasteOperation && wordEndOffset === text.length);

                // 只处理已确认的单词
                if (!isConfirmed) continue;

                // 查找匹配的token
                const tokenInfo = tokenMap.get(word.toLowerCase());
                if (!tokenInfo) continue;

                // 计算绝对位置
                const start = pos + wordStartOffset;
                const end = pos + wordEndOffset;

                // 检查位置是否在文档范围内
                if (start < 0 || end > state.doc.content.size) {
                  console.warn('Token position out of range:', { word, start, end });
                  continue;
                }

                // 添加到结果列表
                result.push({
                  word,
                  start,
                  end,
                  tokenInfo,
                });
              }
            });

            return result;
          }
        },
      }),
    ];
  },
});
