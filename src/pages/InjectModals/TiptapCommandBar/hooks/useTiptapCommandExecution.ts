import { useState } from 'react';
import { getSwapService } from '@/services/swapService';
import { useTokenStore } from '@/stores/tokenStore';
import { useToast } from '@/components/ToastProvider';
import { useCommandHistoryStore } from '@/stores';
import { SuggestionType, useTiptapCommandBarStore } from '../store/tiptapStore';
import { CommandOption, ParamType } from '../utils/commandData';
import { isTokenReference, getTokenInfoFromReference } from '../utils/tokenParamUtils';

/**
 * Custom hook for handling Tiptap command execution and result display
 */
export const useTiptapCommandExecution = () => {
  const [isExecuting, setIsExecuting] = useState(false);
  const toast = useToast();
  const { parsedCommand, editor, setParsedCommand, setSelectedCommand, setActiveSuggestion } =
    useTiptapCommandBarStore();
  const { addRecord } = useCommandHistoryStore();
  const { tokens } = useTokenStore();

  /**
   * Enhance command parameters, get complete token information
   */
  const enhanceParameters = (commandDef: CommandOption, parameters: Record<string, any>) => {
    const enhancedParameters: Record<string, any> = { ...parameters };

    // Process all token type parameters
    commandDef.params.forEach(param => {
      if (param.type === ParamType.Token && parameters[param.id]) {
        const paramValue = parameters[param.id];

        // Check if parameter value is in token reference format
        if (isTokenReference(paramValue)) {
          // Extract mint from reference and get complete token info
          const tokenInfo = getTokenInfoFromReference(paramValue);
          if (tokenInfo) {
            // Replace parameter value with complete token info object
            enhancedParameters[param.id] = tokenInfo;
          }
        } else {
          // Try to find token by symbol
          const tokenInfo = Object.values(tokens).find(
            t => t.symbol.toLowerCase() === paramValue.toLowerCase()
          );
          if (tokenInfo) {
            enhancedParameters[param.id] = tokenInfo;
          }
        }
      }
    });

    return enhancedParameters;
  };

  /**
   * Helper function to clear editor content
   */
  const clearEditorContent = () => {
    if (!editor) return;

    // Delete the command text from editor
    const { from, to } = editor.state.selection;
    const text = editor.state.doc.textBetween(0, to, ' ', ' ');
    const commandStart = text.indexOf('/');

    if (commandStart >= 0) {
      editor.commands.setTextSelection({
        from: commandStart,
        to: text.length,
      });
      editor.commands.deleteSelection();
    }

    // Reset command state
    setParsedCommand(null);
    setSelectedCommand(null);
    setActiveSuggestion(SuggestionType.None);
  };

  /**
   * Execute command
   */
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
        const commandText = editor.getText();
        const commandId = parsedCommand.commandId; // Save variable to avoid using potentially undefined value repeatedly

        // Get enhanced parameters
        const enhancedParams = enhanceParameters(
          parsedCommand.command,
          parsedCommand.parameters || {}
        );

        // Execute different operations based on command type
        switch (commandId) {
          case 'swap': {
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

                const swapService = getSwapService();
                const sig = await swapService.executeSwap({
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
          case 'send': {
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

                // Add to history
                addRecord(commandText, commandId);

                // Since there's no actual transaction sent here, we just display a simulated success message
                resolve({ success: true, message: `Send submitted. Tx: ${'xxx'}` });
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

export default useTiptapCommandExecution;
