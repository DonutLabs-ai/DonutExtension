import React from 'react';
import { NodeViewProps, NodeViewWrapper } from '@tiptap/react';
import { cn } from '@/utils/shadcn';
import { useTokenStore } from '@/stores/tokenStore';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/shadcn/avatar';

// 从NodeViewProps中提取我们需要的属性
const TokenView: React.FC<NodeViewProps> = props => {
  // 从节点属性中获取token信息
  const symbol = props.node.attrs.symbol as string;
  const mint = props.node.attrs.mint as string;

  // 从token store获取token列表
  const tokens = useTokenStore(state => state.tokens);

  // 首先尝试使用mint查找token（最准确的方式）
  // 如果mint不存在或找不到对应token，再使用symbol查找
  const token = mint
    ? tokens[mint] || Object.values(tokens).find(t => t.mint === mint)
    : Object.values(tokens).find(t => t.symbol.toLowerCase() === symbol.toLowerCase());

  // 通用样式，确保节点始终内联显示且不带换行
  const wrapperStyle: React.CSSProperties = {
    display: 'inline', // 使用inline确保不会产生额外的块元素行为
    whiteSpace: 'nowrap',
    userSelect: 'all',
    verticalAlign: 'middle', // 保持与文本对齐
    position: 'relative', // 用于正确定位
    lineHeight: 'normal', // 防止继承过大的行高
    font: 'inherit', // 继承父元素字体设置
    wordSpacing: 'normal', // 确保单词间距正常
  };

  // Token显示容器的基本样式
  const tokenStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 255, 0.1)',
    borderRadius: '6px',
    padding: '2px 6px',
    margin: '0', // 移除额外间距，由非断行空格控制
    border: '1px solid rgba(0, 0, 255, 0.2)',
    position: 'relative',
    zIndex: 1, // 确保在文本之上
    whiteSpace: 'nowrap', // 防止内部换行
  };

  // 确保所有空格使用非断行空格，防止意外换行
  const formatWithNbsp = (text: string) => {
    return text.replace(/ /g, '\u00A0');
  };

  // 如果找不到token，显示基本样式
  if (!token) {
    return (
      <NodeViewWrapper
        className="token-view-wrapper"
        data-symbol={symbol}
        data-mint={mint || ''}
        style={wrapperStyle}
      >
        <span
          className="token-view"
          style={tokenStyle}
          contentEditable={false} // 确保内容不可编辑
        >
          {formatWithNbsp(symbol)}
        </span>
      </NodeViewWrapper>
    );
  }

  // 如果找到token，显示完整样式（带图标）
  return (
    <NodeViewWrapper
      className="token-view-wrapper"
      data-symbol={symbol}
      data-mint={mint || token.mint || ''}
      style={wrapperStyle}
    >
      <span
        className="token-view"
        style={{
          ...tokenStyle,
          gap: '4px',
        }}
        contentEditable={false} // 确保内容不可编辑
      >
        <Avatar
          className="token-avatar"
          style={{
            width: '16px',
            height: '16px',
            fontSize: '10px',
            flexShrink: 0, // 防止图标缩小
          }}
        >
          <AvatarImage src={token.logoURI} alt={formatWithNbsp(token.symbol)} />
          <AvatarFallback>{token.symbol.charAt(0)}</AvatarFallback>
        </Avatar>
        <span
          className="token-symbol"
          style={{
            fontWeight: 500,
            color: 'hsl(var(--primary))',
            lineHeight: 1, // 确保没有额外行高
            overflow: 'visible', // 防止文本截断
            whiteSpace: 'nowrap', // 防止内部换行
          }}
        >
          {formatWithNbsp(token.symbol)}
        </span>
      </span>
    </NodeViewWrapper>
  );
};

export default TokenView;
