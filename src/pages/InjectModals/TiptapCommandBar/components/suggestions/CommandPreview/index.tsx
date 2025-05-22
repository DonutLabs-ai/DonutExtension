import SwapPreview from './SwapPreview';
import SendPreview from './SendPreview';
import RugCheck from './RugCheck';
import PriceChart from './PriceChart';
import { useTiptapCommandBarStore } from '../../../store/tiptapStore';
import { CommandIdType } from '../../../utils/commandData';

const CommandPreview = () => {
  const { parsedCommand } = useTiptapCommandBarStore();

  // If no parsed command or command is not complete, don't show preview
  if (!parsedCommand?.isComplete || !parsedCommand?.commandId) {
    return null;
  }

  return (
    <div className="w-full py-6 px-[30px] text-foreground">
      {parsedCommand.commandId === CommandIdType.Swap && (
        <SwapPreview parsedCommand={parsedCommand} />
      )}

      {parsedCommand.commandId === CommandIdType.Send && (
        <SendPreview parsedCommand={parsedCommand} />
      )}

      {parsedCommand.commandId === CommandIdType.RugCheck && (
        <RugCheck parsedCommand={parsedCommand} />
      )}

      {parsedCommand.commandId === CommandIdType.Chart && (
        <PriceChart parsedCommand={parsedCommand} />
      )}
    </div>
  );
};

export default CommandPreview;
