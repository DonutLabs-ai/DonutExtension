import SwapPreview from './SwapPreview';
import SendPreview from './SendPreview';
import { useTiptapCommandBarStore } from '../../../store/tiptapStore';

const CommandPreview = () => {
  const { parsedCommand } = useTiptapCommandBarStore();

  // If no parsed command or command is not complete, don't show preview
  if (!parsedCommand?.isComplete || !parsedCommand?.commandId) {
    return null;
  }

  return (
    <div className="w-full py-6 px-[30px] text-foreground">
      {parsedCommand.commandId === 'swap' && <SwapPreview parsedCommand={parsedCommand} />}

      {parsedCommand.commandId === 'send' && <SendPreview parsedCommand={parsedCommand} />}

      {parsedCommand.commandId !== 'swap' && parsedCommand.commandId !== 'send' && (
        <div className="p-4 rounded-lg text-center">
          Preview not supported for this command type
        </div>
      )}
    </div>
  );
};

export default CommandPreview;
