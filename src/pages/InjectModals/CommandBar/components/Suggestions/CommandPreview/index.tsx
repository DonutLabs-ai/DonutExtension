import React from 'react';
import { cn } from '@/utils/shadcn';
import { ParsedCommand } from '../../../utils/commandParser';
import SwapPreview from './SwapPreview';
import SendPreview from './SendPreview';

interface CommandPreviewProps {
  parsedCommand: ParsedCommand;
  executeCommand: () => void;
  isExecuting: boolean;
  className?: string;
}

/**
 * Command preview component, displays transaction preview when command parameters are complete
 * Acts as a type of Suggestion, showing different previews for different commands
 */
const CommandPreview: React.FC<CommandPreviewProps> = ({
  parsedCommand,
  executeCommand,
  isExecuting,
  className,
}) => {
  // If command is not complete or has no commandId, don't show preview
  if (!parsedCommand.isComplete || !parsedCommand.commandId) {
    return null;
  }

  return (
    <div className={cn('w-full px-5 py-3', className)}>
      <div className="text-sm font-medium text-foreground mb-3">Transaction Preview</div>

      {parsedCommand.commandId === 'swap' && (
        <SwapPreview
          parsedCommand={parsedCommand}
          executeCommand={executeCommand}
          isExecuting={isExecuting}
        />
      )}

      {parsedCommand.commandId === 'send' && (
        <SendPreview
          parsedCommand={parsedCommand}
          executeCommand={executeCommand}
          isExecuting={isExecuting}
        />
      )}

      {parsedCommand.commandId !== 'swap' && parsedCommand.commandId !== 'send' && (
        <div className="p-4 bg-muted rounded-lg text-center text-muted-foreground">
          Preview not supported for this command type
        </div>
      )}
    </div>
  );
};

export default CommandPreview;
