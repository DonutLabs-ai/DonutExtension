import React from 'react';
import { NodeViewProps, NodeViewWrapper } from '@tiptap/react';
import { useTokenStore } from '@/stores/tokenStore';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/shadcn/avatar';

// Extract the properties we need from NodeViewProps
const TokenView: React.FC<NodeViewProps> = props => {
  // Get token information from node attributes
  const symbol = props.node.attrs.symbol as string;
  const mint = props.node.attrs.mint as string;

  // Get token list from token store
  const tokens = useTokenStore(state => state.tokens);

  // First try to find token using mint (most accurate method)
  // If mint doesn't exist or no corresponding token is found, then use symbol to search
  const token = mint
    ? tokens[mint] || Object.values(tokens).find(t => t.mint === mint)
    : Object.values(tokens).find(t => t.symbol.toLowerCase() === symbol.toLowerCase());

  // Common styles to ensure the node is always displayed inline without line breaks
  const wrapperStyle: React.CSSProperties = {
    display: 'inline', // Use inline to ensure no additional block element behavior
    whiteSpace: 'nowrap',
    userSelect: 'all',
    verticalAlign: 'middle', // Keep aligned with text
    position: 'relative', // For proper positioning
    lineHeight: 'normal', // Prevent inheriting excessive line height
    font: 'inherit', // Inherit parent element font settings
    wordSpacing: 'normal', // Ensure normal word spacing
  };

  // Basic styles for token display container
  const tokenStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 255, 0.1)',
    borderRadius: '6px',
    padding: '2px 6px',
    margin: '0', // Remove extra spacing, controlled by non-breaking spaces
    border: '1px solid rgba(0, 0, 255, 0.2)',
    position: 'relative',
    zIndex: 1, // Ensure it's above text
    whiteSpace: 'nowrap', // Prevent internal line breaks
  };

  // Ensure all spaces use non-breaking spaces to prevent unexpected line breaks
  const formatWithNbsp = (text: string) => {
    return text.replace(/ /g, '\u00A0');
  };

  // If token is not found, display basic style
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
          contentEditable={false} // Ensure content is not editable
        >
          {formatWithNbsp(symbol)}
        </span>
      </NodeViewWrapper>
    );
  }

  // If token is found, display complete style (with icon)
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
        contentEditable={false} // Ensure content is not editable
      >
        <Avatar className="token-avatar">
          <AvatarImage src={token.logoURI} alt={formatWithNbsp(token.symbol)} />
          <AvatarFallback className="text-xs">{token.symbol.charAt(0)}</AvatarFallback>
        </Avatar>
        <span
          className="token-symbol"
          style={{
            fontWeight: 500,
            color: 'hsl(var(--primary))',
            lineHeight: 1, // Ensure no extra line height
            overflow: 'visible', // Prevent text truncation
            whiteSpace: 'nowrap', // Prevent internal line breaks
          }}
        >
          {formatWithNbsp(token.symbol)}
        </span>
      </span>
    </NodeViewWrapper>
  );
};

export default TokenView;
