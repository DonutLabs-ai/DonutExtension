import { useState } from 'react';
import { useCommandInputStore } from '../store/commandInputStore';
import { executeCommand } from '../utils/commandParser';

/**
 * Custom hook for handling command execution and result display
 */
export const useCommandExecution = () => {
  const [resultMessage, setResultMessage] = useState<string | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);

  const { parsedCommand, resetInput } = useCommandInputStore();

  // Execute current command
  const executeCurrentCommand = async () => {
    if (!parsedCommand?.commandId) {
      setResultMessage('Please enter a valid command');
      return;
    }

    if (!parsedCommand.isComplete) {
      setResultMessage('Command incomplete, please provide all required parameters');
      return;
    }

    try {
      setIsExecuting(true);
      setResultMessage('Executing...');

      const result = await executeCommand(parsedCommand);

      if (result.success) {
        setResultMessage(result.message || 'Command executed successfully');
        // Reset input after successful execution
        setTimeout(() => {
          resetInput();
          setResultMessage(null);
        }, 1500);
      } else {
        setResultMessage(result.message || 'Command execution failed');
      }
    } catch (error) {
      console.error('Command execution error:', error);
      setResultMessage(error instanceof Error ? error.message : 'Error occurred during execution');
    } finally {
      setIsExecuting(false);
    }
  };

  // Clear result message
  const clearResultMessage = () => {
    setResultMessage(null);
  };

  return {
    executeCurrentCommand,
    resultMessage,
    setResultMessage,
    clearResultMessage,
    isExecuting,
  };
};
