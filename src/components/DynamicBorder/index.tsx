import React from 'react';
import { cn } from '@/utils/shadcn';
import './styles.css';

interface DynamicBorderProps {
  children: React.ReactNode;
  borderWidth?: number;
  borderRadius?: number;
  background?: string;
  animated?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

const DynamicBorder: React.FC<DynamicBorderProps> = ({
  children,
  borderWidth = 1,
  borderRadius = 44,
  background = 'linear-gradient(90deg, #0D9EFF 0%, #AF00F3 100%)',
  animated = false,
  className = '',
  style = {},
}) => {
  const cssVariables = {
    '--border-width': `${borderWidth}px`,
    '--border-radius': `${borderRadius}px`,
    '--background-gradient': background,
    ...style,
  } as React.CSSProperties;

  return (
    <div
      className={cn(
        'dynamic-border',
        animated ? 'dynamic-border--animated' : 'dynamic-border--static',
        className
      )}
      style={cssVariables}
    >
      {animated && <div className="dynamic-border__main" />}

      {animated && <div className="dynamic-border__glow" />}

      <div className="dynamic-border__content">{children}</div>
    </div>
  );
};

export default DynamicBorder;
