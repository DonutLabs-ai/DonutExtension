import React, { useMemo } from 'react';
import { ellipseAddress } from '@/utils/address';
import { ParsedCommand } from '../../../utils/commandUtils';
import { enhanceParameters } from '../../../utils/tokenParamUtils';

interface SendPreviewProps {
  parsedCommand: ParsedCommand;
  executeCommand: () => void;
}

const SendPreview: React.FC<SendPreviewProps> = ({ parsedCommand, executeCommand }) => {
  // Extract information from parameters
  const amount = parsedCommand.parameters?.amount || '';
  const address = parsedCommand.parameters?.address || '';

  // Enhance tokens using the shared utility function
  const enhancedParams = useMemo(() => {
    if (!parsedCommand.command) return {};
    return enhanceParameters(
      parsedCommand.command,
      parsedCommand.parameters || {},
      parsedCommand.parsedParams
    );
  }, [parsedCommand]);

  // Get token information from enhanced parameters or fallback to symbol
  const tokenInfo = enhancedParams.token;
  const token = tokenInfo?.symbol || parsedCommand.parameters?.token || '';

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Enter' && !event.shiftKey) {
        executeCommand();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [executeCommand]);

  return (
    <div>
      <div className="text-sm font-medium text-foreground mb-3">Send Preview</div>
      {/* Transaction area */}
      <div className="flex items-center justify-between mb-4">
        {/* Sending area */}
        <div className="bg-muted rounded-lg p-3 w-5/12">
          <div className="text-sm text-muted-foreground mb-2">Sending</div>
          <div className="flex items-center justify-between">
            <div className="text-xl font-medium">{amount}</div>
            <div className="flex items-center space-x-1 bg-secondary rounded-full py-1 px-2 w-fit">
              <span className="font-medium">{token}</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Send icon */}
        <div className="flex-shrink-0">
          <div className="w-6 h-6 mx-auto text-muted-foreground">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M14 5l7 7m0 0l-7 7m7-7H3"
              />
            </svg>
          </div>
        </div>

        {/* Recipient area */}
        <div className="bg-muted rounded-lg p-3 w-5/12">
          <div className="text-sm text-muted-foreground mb-2">Recipient</div>
          <div className="font-medium truncate" title={address}>
            {ellipseAddress(address)}
          </div>
        </div>
      </div>

      {/* Transaction information */}
      {/* <div className="flex flex-col space-y-1 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Transaction Fee</span>
          <span className="text-foreground">0.001 SOL</span>
        </div>
      </div> */}
    </div>
  );
};

export default SendPreview;
