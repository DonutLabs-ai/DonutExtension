import React from 'react';
import { ParsedCommand } from '../../../utils/commandParser';

interface SwapPreviewProps {
  parsedCommand: ParsedCommand;
  executeCommand: () => void;
  isExecuting: boolean;
}

/**
 * Swap command preview component
 * Displays exchange amount, source token, target token and other information
 */
const SwapPreview: React.FC<SwapPreviewProps> = ({
  parsedCommand,
  executeCommand,
  isExecuting,
}) => {
  // Extract information from command parameters
  const amount = parsedCommand.params.amount?.value || '';
  const fromToken = parsedCommand.params.fromToken?.value || '';
  const toToken = parsedCommand.params.toToken?.value || '';

  // Simulated exchange rate data
  const exchangeRate = 118.62;
  const estimatedResult = parseFloat(amount) * exchangeRate;

  // Simulated fee data
  const slippage = 0.000015;
  const priorityFee = 0.00008;
  const slippagePercent = 2;
  const priorityFeePercent = 0.3;

  return (
    <div className="bg-white rounded-lg p-3">
      {/* Exchange area */}
      <div className="flex items-center justify-between mb-4">
        {/* Sell area */}
        <div className="bg-gray-100 rounded-lg p-3 w-5/12">
          <div className="text-sm text-gray-500 mb-2">Selling</div>
          <div className="flex items-center justify-between">
            <div className="text-xl font-medium">{amount}</div>
            <div className="flex items-center space-x-1 bg-gray-200 rounded-full py-1 px-2 w-fit">
              <span className="font-medium">{fromToken}</span>
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

        {/* Exchange icon */}
        <div className="flex-shrink-0">
          <svg
            width="14"
            height="17"
            viewBox="0 0 14 17"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M13.7063 5.20469C14.0969 4.81406 14.0969 4.17969 13.7063 3.78906L10.7063 0.789062C10.3156 0.398438 9.68125 0.398438 9.29062 0.789062C8.9 1.17969 8.9 1.81406 9.29062 2.20469L10.5844 3.49844H1C0.446875 3.49844 0 3.94531 0 4.49844C0 5.05156 0.446875 5.49844 1 5.49844H10.5844L9.29062 6.79219C8.9 7.18281 8.9 7.81719 9.29062 8.20781C9.68125 8.59844 10.3156 8.59844 10.7063 8.20781L13.7063 5.20781V5.20469ZM3.29063 16.2047C3.68125 16.5953 4.31563 16.5953 4.70625 16.2047C5.09688 15.8141 5.09688 15.1797 4.70625 14.7891L3.41563 13.4984H13C13.5531 13.4984 14 13.0516 14 12.4984C14 11.9453 13.5531 11.4984 13 11.4984H3.41563L4.70937 10.2047C5.1 9.81406 5.1 9.17969 4.70937 8.78906C4.31875 8.39844 3.68438 8.39844 3.29375 8.78906L0.29375 11.7891C-0.096875 12.1797 -0.096875 12.8141 0.29375 13.2047L3.29375 16.2047H3.29063Z"
              fill="black"
            />
          </svg>
        </div>

        {/* Buy area */}
        <div className="bg-gray-100 rounded-lg p-3 w-5/12">
          <div className="text-sm text-gray-500 mb-2">Buying</div>
          <div className="flex items-center justify-between">
            <div className="text-xl font-medium">{estimatedResult.toFixed(2)}</div>
            <div className="flex items-center space-x-1 bg-gray-200 rounded-full py-1 px-2 w-fit">
              {toToken === 'USDT' && (
                <span className="w-5 h-5 rounded-full bg-teal-500 flex items-center justify-center text-white text-xs mr-1">
                  $
                </span>
              )}
              <span className="font-medium">{toToken}</span>
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
      </div>

      {/* Transaction information */}
      <div className="flex flex-col space-y-1 mb-4 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-500">Slippage</span>
          <span className="text-gray-700">
            ~{slippagePercent}% ({slippage} {fromToken})
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Priority Fee</span>
          <span className="text-gray-700 flex items-center">
            ~{priorityFeePercent}% ({priorityFee} {fromToken})
            <span className="ml-1 text-yellow-500">⚡</span>
          </span>
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-gray-500"></span>
          <span className="text-gray-500">
            1{fromToken} ≈ ${exchangeRate} {toToken}
          </span>
        </div>
      </div>

      {/* Confirm button */}
      <div>
        <button
          onClick={executeCommand}
          disabled={isExecuting}
          className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg font-medium transition-colors duration-200 hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed"
        >
          {isExecuting ? 'Processing...' : 'Confirm Swap'}
        </button>
      </div>
    </div>
  );
};

export default SwapPreview;
