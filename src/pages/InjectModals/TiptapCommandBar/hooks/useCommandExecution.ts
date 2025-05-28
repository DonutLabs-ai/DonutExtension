import { useCallback } from 'react';
import { getTokenOperationsService } from '@/services/tokenOperationsService';
import { toast } from '@/components/ToastProvider';
import { TokenInfo, useCommandHistoryStore } from '@/stores';
import { SuggestionType, useTiptapCommandBarStore } from '../store/tiptapStore';
import { CommandIdType } from '../utils/commandData';
import { enhanceParameters } from '../utils/tokenParamUtils';
import { getDocVisualContent } from '../utils/editorUtils';

// Types
interface OperationResult {
  success: boolean;
  message: string;
  description?: string;
  actions?: { label: string; onClick: () => void }[];
}

interface EnhancedParams {
  fromToken?: TokenInfo;
  toToken?: TokenInfo;
  token?: TokenInfo;
  amount?: string;
  address?: string;
  [key: string]: any;
}

// Constants
const USER_REJECTION_KEYWORDS = [
  'User rejected',
  'Popup closed without action',
  'canceled',
  'cancelled',
  'rejected',
] as const;

// Utility functions
const checkIsUserRejection = (errorMessage: string): boolean => {
  return USER_REJECTION_KEYWORDS.some(keyword => errorMessage.includes(keyword));
};

const validateSwapParams = (params: EnhancedParams): { isValid: boolean; error?: string } => {
  const { fromToken, toToken, amount } = params;

  if (!fromToken || !toToken || !amount) {
    return { isValid: false, error: 'Invalid command parameters' };
  }

  const fromMint = typeof fromToken === 'object' ? fromToken.mint : null;
  const toMint = typeof toToken === 'object' ? toToken.mint : null;

  if (!fromMint || !toMint) {
    return { isValid: false, error: 'Token mint not found' };
  }

  return { isValid: true };
};

const validateSendParams = (params: EnhancedParams): { isValid: boolean; error?: string } => {
  const { token, amount, address } = params;

  if (!token || !amount || !address) {
    return { isValid: false, error: 'Invalid command parameters' };
  }

  const mint = typeof token === 'object' ? token.mint : null;

  if (!mint) {
    return { isValid: false, error: 'Token mint not found' };
  }

  return { isValid: true };
};

const createViewTransactionAction = (sig: string) => ({
  label: 'View Transaction',
  onClick: () => window.open(`https://solscan.io/tx/${sig}`, '_blank'),
});

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

  const clearEditorContent = useCallback(() => {
    if (!editor) return;
    editor.commands.clearContent();
    setParsedCommand(null);
    setSelectedCommand(null);
    setActiveSuggestion(SuggestionType.None);
  }, [editor, setParsedCommand, setSelectedCommand, setActiveSuggestion]);

  const handleOperationResult = useCallback((result: OperationResult) => {
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
  }, []);

  const createRetryAction = useCallback(
    (
      operationFn: (
        params: EnhancedParams,
        commandText: string,
        commandId: CommandIdType
      ) => Promise<OperationResult>,
      params: EnhancedParams,
      commandText: string,
      commandId: CommandIdType,
      label: string
    ) => ({
      label,
      onClick: async () => {
        const result = await operationFn(params, commandText, commandId);
        handleOperationResult(result);
      },
    }),
    [handleOperationResult]
  );

  const executeSwapOperation = useCallback(
    async (
      enhancedParams: EnhancedParams,
      commandText: string,
      commandId: CommandIdType
    ): Promise<OperationResult> => {
      try {
        const validation = validateSwapParams(enhancedParams);
        if (!validation.isValid) {
          return {
            success: false,
            message: 'Swap failed',
            description: validation.error,
          };
        }

        const { fromToken, toToken, amount } = enhancedParams;
        const tokenOperationsService = getTokenOperationsService();
        const { signature, outputAmount } = await tokenOperationsService.executeSwap({
          inputMint: fromToken!.mint,
          outputMint: toToken!.mint,
          amount: amount!,
        });

        addRecord(commandText, commandId);

        return {
          success: true,
          message: 'Swap submitted',
          description: `${amount} ${fromToken!.symbol} → ${outputAmount} ${toToken!.symbol}`,
          actions: [
            createViewTransactionAction(signature),
            createRetryAction(
              executeSwapOperation,
              enhancedParams,
              commandText,
              commandId,
              'Swap again'
            ),
          ],
        };
      } catch (err: any) {
        return {
          success: false,
          message: 'Swap failed',
          description: err?.message,
          actions: [
            createRetryAction(
              executeSwapOperation,
              enhancedParams,
              commandText,
              commandId,
              'Try again'
            ),
          ],
        };
      }
    },
    [addRecord, createRetryAction]
  );

  const executeSendOperation = useCallback(
    async (
      enhancedParams: EnhancedParams,
      commandText: string,
      commandId: CommandIdType
    ): Promise<OperationResult> => {
      try {
        const validation = validateSendParams(enhancedParams);
        if (!validation.isValid) {
          return {
            success: false,
            message: 'Send failed',
            description: validation.error,
          };
        }

        const { token, amount, address } = enhancedParams;
        const tokenOperationsService = getTokenOperationsService();
        const sig = await tokenOperationsService.executeTransfer({
          to: address!,
          amount: amount!,
          mint: token!.mint,
        });

        addRecord(commandText, commandId);

        return {
          success: true,
          message: 'Send submitted',
          description: `${amount} ${token!.symbol} → ${address}`,
          actions: [
            createViewTransactionAction(sig),
            createRetryAction(
              executeSendOperation,
              enhancedParams,
              commandText,
              commandId,
              'Send again'
            ),
          ],
        };
      } catch (err: any) {
        return {
          success: false,
          message: 'Send failed',
          description: err?.message,
          actions: [
            createRetryAction(
              executeSendOperation,
              enhancedParams,
              commandText,
              commandId,
              'Try again'
            ),
          ],
        };
      }
    },
    [addRecord, createRetryAction]
  );

  const executeCommand = useCallback(async (): Promise<OperationResult> => {
    if (
      !parsedCommand?.command ||
      !parsedCommand.isComplete ||
      !editor ||
      !parsedCommand.commandId
    ) {
      return { success: false, message: 'Command incomplete or invalid' };
    }

    try {
      const commandText = getDocVisualContent(editor.state.doc);
      const commandId = parsedCommand.commandId;
      const enhancedParams = enhanceParameters(
        parsedCommand.command,
        parsedCommand.parameters || {},
        parsedCommand.parsedParams
      );

      switch (commandId) {
        case CommandIdType.Swap:
          return await executeSwapOperation(enhancedParams, commandText, commandId);
        case CommandIdType.Send:
          return await executeSendOperation(enhancedParams, commandText, commandId);
        default:
          return {
            success: false,
            message: 'Command execution failed',
            description: 'Unsupported command type',
          };
      }
    } catch (err: any) {
      return {
        success: false,
        message: 'Command execution failed',
        description: err?.message,
      };
    }
  }, [parsedCommand, editor, executeSwapOperation, executeSendOperation]);

  const executeCurrentCommand = useCallback(async () => {
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
        clearEditorContent();
      } else {
        if (!checkIsUserRejection(result.description || '')) {
          toast.error(result.message || 'Command execution failed', {
            description: result.description,
            actions: result.actions,
          });
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (!checkIsUserRejection(errorMessage)) {
        toast.error('Command execution failed', {
          description: errorMessage,
        });
      }
    } finally {
      setIsExecuting(false);
    }
  }, [parsedCommand, executeCommand, clearEditorContent, setIsExecuting]);

  return {
    executeCurrentCommand,
    isExecuting,
  };
};

export default useCommandExecution;
