import { useState } from 'react';
import { getTokenOperationsService } from '@/services/tokenOperationsService';
import { useToast } from '@/components/ToastProvider';
import { useCommandHistoryStore } from '@/stores';
import { SuggestionType, useTiptapCommandBarStore } from '../store/tiptapStore';
import { CommandIdType } from '../utils/commandData';
import { enhanceParameters } from '../utils/tokenParamUtils';
import { getDocVisualContent } from '../utils/editorUtils';

/**
 * Custom hook for handling Tiptap command execution and result display
 */
export const useCommandExecution = () => {
  const [isExecuting, setIsExecuting] = useState(false);
  const toast = useToast();
  const { parsedCommand, editor, setParsedCommand, setSelectedCommand, setActiveSuggestion } =
    useTiptapCommandBarStore();
  const { addRecord } = useCommandHistoryStore();

  const clearEditorContent = () => {
    if (!editor) return;
    editor.commands.clearContent();

    // Reset command state
    setParsedCommand(null);
    setSelectedCommand(null);
    setActiveSuggestion(SuggestionType.None);
  };

  const executeCommand = async (): Promise<{ success: boolean; message: string }> => {
    return new Promise(resolve => {
      if (
        !parsedCommand?.command ||
        !parsedCommand.isComplete ||
        !editor ||
        !parsedCommand.commandId
      ) {
        resolve({ success: false, message: 'Command incomplete or invalid' });
        return;
      }

      try {
        // Get command text for history record
        const commandText = getDocVisualContent(editor.state.doc);
        const commandId = parsedCommand.commandId;

        // Get enhanced parameters using the shared utility function
        const enhancedParams = enhanceParameters(
          parsedCommand.command,
          parsedCommand.parameters || {},
          parsedCommand.parsedParams
        );

        // Execute different operations based on command type
        switch (commandId) {
          case CommandIdType.Swap: {
            // Use immediately invoked async function to handle swap command
            (async () => {
              try {
                const fromTokenInfo = enhancedParams.fromToken;
                const toTokenInfo = enhancedParams.toToken;
                const amount = enhancedParams.amount || '';

                if (!fromTokenInfo || !toTokenInfo || !amount) {
                  resolve({ success: false, message: 'Invalid command parameters' });
                  return;
                }

                // Get mint addresses
                const fromMint = typeof fromTokenInfo === 'object' ? fromTokenInfo.mint : null;
                const toMint = typeof toTokenInfo === 'object' ? toTokenInfo.mint : null;

                if (!fromMint || !toMint) {
                  resolve({ success: false, message: 'Token mint not found' });
                  return;
                }

                const tokenOperationsService = getTokenOperationsService();
                const sig = await tokenOperationsService.executeSwap({
                  inputMint: fromMint,
                  outputMint: toMint,
                  amount,
                });

                // Add to history
                addRecord(commandText, commandId);

                resolve({ success: true, message: `Swap submitted. Tx: ${sig}` });
              } catch (err: any) {
                resolve({ success: false, message: err?.message || 'Swap failed' });
              }
            })();
            break;
          }
          case CommandIdType.Send: {
            // Use immediately invoked async function to handle send command
            (async () => {
              try {
                const tokenInfo = enhancedParams.token;
                const amount = enhancedParams.amount || '';
                const address = enhancedParams.address || '';

                if (!tokenInfo || !amount || !address) {
                  resolve({ success: false, message: 'Invalid command parameters' });
                  return;
                }

                // Get mint address
                const mint = typeof tokenInfo === 'object' ? tokenInfo.mint : null;

                if (!mint) {
                  resolve({ success: false, message: 'Token mint not found' });
                  return;
                }

                const tokenOperationsService = getTokenOperationsService();
                const sig = await tokenOperationsService.executeTransfer({
                  to: address,
                  amount,
                  mint,
                });

                // Add to history
                addRecord(commandText, commandId);

                // Since there's no actual transaction sent here, we just display a simulated success message
                resolve({ success: true, message: `Send submitted. Tx: ${sig}` });
              } catch (err: any) {
                resolve({ success: false, message: err?.message || 'Send failed' });
              }
            })();
            break;
          }
          default: {
            // Add to history
            addRecord(commandText, commandId);

            resolve({ success: true, message: `Command ${commandId} executed successfully` });
          }
        }
      } catch (err: any) {
        resolve({ success: false, message: err?.message || 'Command execution failed' });
      }
    });
  };

  /**
   * Main function to execute current command
   */
  const executeCurrentCommand = async () => {
    if (!parsedCommand?.commandId) {
      toast.push('Please enter a valid command', 'error');
      return;
    }

    if (!parsedCommand.isComplete) {
      toast.push('Command incomplete, please provide all required parameters', 'error');
      return;
    }

    // No need to trigger execution event
    if ([CommandIdType.RugCheck, CommandIdType.Chart].includes(parsedCommand.commandId)) {
      return;
    }

    try {
      setIsExecuting(true);

      const result = await executeCommand();

      if (result.success) {
        toast.push(result.message || 'Command executed successfully', 'success');
        // Clear editor content
        clearEditorContent();
      } else {
        throw new Error(result.message || 'Command execution failed');
      }
    } catch (error) {
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

export default useCommandExecution;
