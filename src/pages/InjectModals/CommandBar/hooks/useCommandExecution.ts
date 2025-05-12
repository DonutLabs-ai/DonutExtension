import { useState } from 'react';
import { useCommandInputStore } from '../store/commandInputStore';
import { useToast } from '@/components/ToastProvider';
import { getSwapService } from '@/services/swapService';
import { getTokens } from '@/stores/tokenStore';

/**
 * Custom hook for handling command execution and result display
 */
export const useCommandExecution = () => {
  const [isExecuting, setIsExecuting] = useState(false);
  const toast = useToast();

  const { parsedCommand, resetInput } = useCommandInputStore();

  function executeCommand(): Promise<{ success: boolean; message: string }> {
    return new Promise(resolve => {
      if (!parsedCommand?.command || !parsedCommand.isComplete) {
        resolve({ success: false, message: 'Command incomplete or invalid' });
        return;
      }

      // Example implementation: Execute different operations based on command
      switch (parsedCommand.commandId) {
        case 'swap': {
          (async () => {
            try {
              const amount = parsedCommand.params.amount?.value || '';
              const fromTokenSym = parsedCommand.params.fromToken?.value || '';
              const toTokenSym = parsedCommand.params.toToken?.value || '';

              if (!amount || !fromTokenSym || !toTokenSym) {
                resolve({ success: false, message: 'Invalid command parameters' });
                return;
              }

              const tokenList = getTokens();
              const fromMint = tokenList.find(
                t => t.symbol.toLowerCase() === fromTokenSym.toLowerCase()
              )?.mint;
              const toMint = tokenList.find(
                t => t.symbol.toLowerCase() === toTokenSym.toLowerCase()
              )?.mint;

              if (!fromMint || !toMint) {
                resolve({ success: false, message: 'Token mint not found' });
                return;
              }

              const swapService = getSwapService();
              const sig = await swapService.executeSwap({
                inputMint: fromMint,
                outputMint: toMint,
                amount,
              });

              resolve({ success: true, message: `Swap submitted. Tx: ${sig}` });
            } catch (err: any) {
              resolve({ success: false, message: err?.message || 'Swap failed' });
            }
          })();
          break;
        }
        case 'send': {
          (async () => {
            try {
              const amount = parsedCommand.params.amount?.value || '';
              const token = parsedCommand.params.token?.value || '';
              const address = parsedCommand.params.address?.value || '';

              const tokenList = getTokens();
              const mint = tokenList.find(
                t => t.symbol.toLowerCase() === token.toLowerCase()
              )?.mint;

              if (!mint) {
                resolve({ success: false, message: 'Token mint not found' });
                return;
              }

              resolve({ success: true, message: `Send submitted. Tx: ${'xxx'}` });
            } catch (err: any) {
              resolve({ success: false, message: err?.message || 'Send failed' });
            }
          })();
          break;
        }
        default:
          resolve({ success: false, message: 'Unknown command' });
      }
    });
  }

  // Execute current command
  const executeCurrentCommand = async () => {
    if (!parsedCommand?.commandId) {
      toast.push('Please enter a valid command', 'error');
      return;
    }

    if (!parsedCommand.isComplete) {
      toast.push('Command incomplete, please provide all required parameters', 'error');
      return;
    }

    try {
      setIsExecuting(true);

      const result = await executeCommand();

      if (result.success) {
        toast.push(result.message || 'Command executed successfully', 'success');
        // Reset input after successful execution
        setTimeout(() => {
          resetInput();
        }, 1500);
      } else {
        throw new Error(result.message || 'Command execution failed');
      }
    } catch (error) {
      console.error('Command execution error:', error);

      const errorMessage = error instanceof Error ? error.message : String(error);
      const isUserRejection =
        errorMessage.includes('User rejected') ||
        errorMessage.includes('Popup closed without action') ||
        errorMessage.includes('canceled') ||
        errorMessage.includes('cancelled') ||
        errorMessage.includes('rejected');

      if (!isUserRejection) {
        toast.push(errorMessage, 'error');
      }
    } finally {
      setIsExecuting(false);
    }
  };

  return {
    executeCurrentCommand,
    isExecuting,
  };
};
