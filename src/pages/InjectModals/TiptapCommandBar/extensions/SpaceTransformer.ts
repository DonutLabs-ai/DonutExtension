import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from 'prosemirror-state';

/**
 * SpaceTransformer - 将普通空格转换为非断行空格的扩展
 *
 * 这个扩展会拦截用户输入的普通空格，并将其替换为非断行空格 (&nbsp;)
 * 以防止文本在意外的地方换行
 */
export const SpaceTransformer = Extension.create({
  name: 'spaceTransformer',

  addProseMirrorPlugins() {
    const pluginKey = new PluginKey('space-transformer');

    return [
      new Plugin({
        key: pluginKey,
        props: {
          // 处理用户输入的键盘事件
          handleKeyDown(view, event) {
            // 当用户按下空格键时
            if (event.key === ' ') {
              // 阻止默认空格输入
              event.preventDefault();

              // 在当前光标位置插入非断行空格字符
              const { dispatch } = view;
              const tr = view.state.tr;

              // 如果有文本选中，先删除选中文本
              if (!view.state.selection.empty) {
                tr.deleteSelection();
              }

              // 插入非断行空格
              tr.insertText('\u00A0'); // 使用 Unicode 非断行空格
              dispatch(tr);

              return true; // 事件已处理
            }

            return false; // 让其他处理程序处理其他键
          },

          // 处理粘贴事件，转换粘贴文本中的空格
          handlePaste(view, event, slice) {
            if (event.clipboardData?.getData) {
              // 获取剪贴板文本
              const text = event.clipboardData?.getData('text/plain');

              // 如果有文本且包含空格
              if (text?.includes(' ')) {
                // 替换所有普通空格为非断行空格
                const transformedText = text.replace(/ /g, '\u00A0');

                // 在当前光标位置插入转换后的文本
                const { dispatch } = view;
                const tr = view.state.tr;

                // 如果有选中内容，先删除
                if (!view.state.selection.empty) {
                  tr.deleteSelection();
                }

                tr.insertText(transformedText);
                dispatch(tr);

                return true; // 事件已处理
              }
            }

            return false; // 使用默认粘贴处理
          },
        },

        // 添加一个附加事务以确保所有文本节点中的空格都已转换
        appendTransaction(transactions, oldState, newState) {
          // 如果没有更改或没有文本更改，不做处理
          if (!transactions.some(tr => tr.docChanged)) {
            return null;
          }

          let modified = false;
          const tr = newState.tr;

          // 遍历文档中的所有文本节点
          newState.doc.descendants((node, pos) => {
            if (node.isText && node.text?.includes(' ')) {
              // 替换所有普通空格为非断行空格
              const newText = node.text.replace(/ /g, '\u00A0');
              if (newText !== node.text) {
                tr.replaceWith(pos, pos + node.nodeSize, newState.schema.text(newText));
                modified = true;
              }
            }
          });

          return modified ? tr : null;
        },
      }),
    ];
  },
});
