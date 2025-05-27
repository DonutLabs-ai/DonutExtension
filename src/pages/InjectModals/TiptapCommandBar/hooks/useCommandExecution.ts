import { useState } from 'react';
import { getTokenOperationsService } from '@/services/tokenOperationsService';
import { toast } from '@/components/ToastProvider';
import { useCommandHistoryStore } from '@/stores';
import { SuggestionType, useTiptapCommandBarStore } from '../store/tiptapStore';
import { CommandIdType } from '../utils/commandData';
import { enhanceParameters } from '../utils/tokenParamUtils';
import { getDocVisualContent } from '../utils/editorUtils';

const checkIsUserRejection = (errorMessage: string) => {
  return (
    errorMessage.includes('User rejected') ||
    errorMessage.includes('Popup closed without action') ||
    errorMessage.includes('canceled') ||
    errorMessage.includes('cancelled') ||
    errorMessage.includes('rejected')
  );
};

/**
 * Custom hook for handling Tiptap command execution and result display
 */
export const useCommandExecution = () => {
  const {
    parsedCommand,
    editor,
    setParsedCommand,
    setSelectedCommand,
    setActiveSuggestion,
    isExecuting,
    setIsExecuting,
  } = useTiptapCommandBarStore();
  const { addRecord } = useCommandHistoryStore();

  const clearEditorContent = () => {
    if (!editor) return;
    editor.commands.clearContent();

    // Reset command state
    setParsedCommand(null);
    setSelectedCommand(null);
    setActiveSuggestion(SuggestionType.None);
  };

  const executeSwapOperation = async (
    enhancedParams: any,
    commandText: string,
    commandId: CommandIdType
  ): Promise<{
    success: boolean;
    message: string;
    description?: string;
    actions?: { label: string; onClick: () => void }[];
  }> => {
    try {
      const fromTokenInfo = enhancedParams.fromToken;
      const toTokenInfo = enhancedParams.toToken;
      const amount = enhancedParams.amount || '';

      if (!fromTokenInfo || !toTokenInfo || !amount) {
        return {
          success: false,
          message: 'Swap failed',
          description: 'Invalid command parameters',
        };
      }

      // Get mint addresses
      const fromMint = typeof fromTokenInfo === 'object' ? fromTokenInfo.mint : null;
      const toMint = typeof toTokenInfo === 'object' ? toTokenInfo.mint : null;

      if (!fromMint || !toMint) {
        return {
          success: false,
          message: 'Swap failed',
          description: 'Token mint not found',
        };
      }

      const tokenOperationsService = getTokenOperationsService();
      const sig = await tokenOperationsService.executeSwap({
        inputMint: fromMint,
        outputMint: toMint,
        amount,
      });

      // Add to history
      addRecord(commandText, commandId);

      return {
        success: true,
        message: `Swap submitted`,
        description: `Tx: ${sig}`,
        actions: [
          {
            label: 'View Transaction',
            onClick: () => {
              window.open(`https://solscan.io/tx/${sig}`, '_blank');
            },
          },
          {
            label: 'Swap again',
            onClick: async () => {
              const result = await executeSwapOperation(enhancedParams, commandText, commandId);
              if (result.success) {
                toast.success(result.message, {
                  description: result.description,
                  actions: result.actions,
                });
              } else {
                if (!checkIsUserRejection(result.description || '')) {
                  toast.error(result.message, {
                    description: result.description,
                    actions: result.actions,
                  });
                }
              }
            },
          },
        ],
      };
    } catch (err: any) {
      return {
        success: false,
        message: 'Swap failed',
        description: err?.message,
        actions: [
          {
            label: 'Try again',
            onClick: async () => {
              const result = await executeSwapOperation(enhancedParams, commandText, commandId);
              if (result.success) {
                toast.success(result.message, {
                  description: result.description,
                  actions: result.actions,
                });
              } else {
                if (!checkIsUserRejection(result.description || '')) {
                  toast.error(result.message, {
                    description: result.description,
                    actions: result.actions,
                  });
                }
              }
            },
          },
        ],
      };
    }
  };

  const executeSendOperation = async (
    enhancedParams: any,
    commandText: string,
    commandId: CommandIdType
  ): Promise<{
    success: boolean;
    message: string;
    description?: string;
    actions?: { label: string; onClick: () => void }[];
  }> => {
    try {
      const tokenInfo = enhancedParams.token;
      const amount = enhancedParams.amount || '';
      const address = enhancedParams.address || '';

      if (!tokenInfo || !amount || !address) {
        return {
          success: false,
          message: 'Send failed',
          description: 'Invalid command parameters',
        };
      }

      // Get mint address
      const mint = typeof tokenInfo === 'object' ? tokenInfo.mint : null;

      if (!mint) {
        return {
          success: false,
          message: 'Send failed',
          description: 'Token mint not found',
        };
      }

      const tokenOperationsService = getTokenOperationsService();
      const sig = await tokenOperationsService.executeTransfer({
        to: address,
        amount,
        mint,
      });

      // Add to history
      addRecord(commandText, commandId);

      return {
        success: true,
        message: `Send submitted`,
        description: `Tx: ${sig}`,
        actions: [
          {
            label: 'View Transaction',
            onClick: () => {
              window.open(`https://solscan.io/tx/${sig}`, '_blank');
            },
          },
          {
            label: 'Send again',
            onClick: async () => {
              const result = await executeSendOperation(enhancedParams, commandText, commandId);
              if (result.success) {
                toast.success(result.message, {
                  description: result.description,
                  actions: result.actions,
                });
              } else {
                if (!checkIsUserRejection(result.description || '')) {
                  toast.error(result.message, {
                    description: result.description,
                    actions: result.actions,
                  });
                }
              }
            },
          },
        ],
      };
    } catch (err: any) {
      return {
        success: false,
        message: 'Send failed',
        description: err?.message,
        actions: [
          {
            label: 'Try again',
            onClick: async () => {
              const result = await executeSendOperation(enhancedParams, commandText, commandId);
              if (result.success) {
                toast.success(result.message, {
                  description: result.description,
                  actions: result.actions,
                });
              } else {
                if (!checkIsUserRejection(result.description || '')) {
                  toast.error(result.message, {
                    description: result.description,
                    actions: result.actions,
                  });
                }
              }
            },
          },
        ],
      };
    }
  };

  const executeCommand = async (): Promise<{
    success: boolean;
    message: string;
    description?: string;
    actions?: {
      label: string;
      onClick: () => void;
    }[];
  }> => {
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
            executeSwapOperation(enhancedParams, commandText, commandId).then(resolve);
            break;
          }
          case CommandIdType.Send: {
            executeSendOperation(enhancedParams, commandText, commandId).then(resolve);
            break;
          }
          default: {
            resolve({
              success: false,
              message: 'Command execution failed',
              description: 'Unsupported command type',
            });
          }
        }
      } catch (err: any) {
        resolve({
          success: false,
          message: 'Command execution failed',
          description: err?.message,
        });
      }
    });
  };

  /**
   * Main function to execute current command
   */
  const executeCurrentCommand = async () => {
    if (!parsedCommand?.commandId) {
      toast.error('Please enter a valid command');
      return;
    }

    if (!parsedCommand.isComplete) {
      toast.error('Command incomplete, please provide all required parameters');
      return;
    }

    if (![CommandIdType.Swap, CommandIdType.Send].includes(parsedCommand.commandId)) {
      return;
    }

    try {
      setIsExecuting(true);

      const result = await executeCommand();

      if (result.success) {
        toast.success(result.message, {
          description: result.description,
          actions: result.actions,
        });
        // Clear editor content
        clearEditorContent();
      } else {
        if (checkIsUserRejection(result.description || '')) return;
        toast.error(result.message || 'Command execution failed', {
          description: result.description,
          actions: result.actions,
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (checkIsUserRejection(errorMessage)) return;
      toast.error('Command execution failed', {
        description: errorMessage,
      });
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
