import React from 'react';

// Import necessary type definitions
interface ParsedCommand {
  commandId?: string;
  command?: any;
  isComplete?: boolean;
  parameters?: Record<string, any>;
  parsedParams?: Record<string, any>;
}

interface SendPreviewProps {
  parsedCommand: ParsedCommand;
}

/**
 * Send command preview component
 * Displays sending amount, token and recipient address information
 */
const SendPreview: React.FC<SendPreviewProps> = ({ parsedCommand }) => {
  // Extract information from parameters
  const amount = parsedCommand.parameters?.amount || '';
  const token = parsedCommand.parameters?.token || '';
  const address = parsedCommand.parameters?.address || '';

  // Format address display
  const shortAddress =
    address.length > 12 ? `${address.slice(0, 6)}...${address.slice(-6)}` : address;

  // Simulate transaction fee
  const transactionFee = 0.001;

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
            {shortAddress}
          </div>
        </div>
      </div>

      {/* Transaction information */}
      <div className="flex flex-col space-y-1 mb-4 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Transaction Fee</span>
          <span className="text-foreground">{transactionFee} SOL</span>
        </div>
      </div>
    </div>
  );
};

export default SendPreview;
