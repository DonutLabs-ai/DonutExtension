import { create } from 'zustand';

export enum CommandInputType {
  Command = 'command_select',
  Amount = 'amount_input',
  Token = 'token_select',
  Normal = 'normal_input',
}

export interface CommandInput {
  id: string;
  type: CommandInputType;
  value: string;
  className?: string;
  placeholder?: string;
  skipKeyEnter?: boolean;
  onComplete?: () => void;
  onDelete?: () => void;
  prefixComponent?: React.ReactNode;
  suffixComponent?: React.ReactNode;
}

interface CommandInputState {
  activeInputId: string | null;
  changeActiveInputId: (id: string) => void;
  inputStack: CommandInput[];
  pushInput: (currentInputId: string, input: CommandInput) => void;
  popInput: () => void;
  updateInput: (id: string, input: Partial<CommandInput>) => void;
  resetInputStack: () => void;
}

const defaultInput: CommandInput = {
  id: 'command',
  type: CommandInputType.Command,
  value: '',
  placeholder: 'Type / to select command',
  skipKeyEnter: true,
};

export const useCommandInputStore = create<CommandInputState>((set, get) => ({
  activeInputId: defaultInput.id,
  inputStack: [defaultInput],
  changeActiveInputId: (id: string) => {
    set({ activeInputId: id });
  },
  pushInput: (currentInputId: string, input: CommandInput) => {
    const { inputStack } = get();
    if (inputStack[inputStack.length - 1].id === currentInputId) {
      set(state => ({
        inputStack: [...state.inputStack, input],
        activeInputId: input.id,
      }));
    } else {
      set({ activeInputId: input.id });
    }
  },
  popInput: () => {
    const { inputStack } = get();
    if (inputStack.length > 1) {
      set({
        activeInputId: inputStack[inputStack.length - 2].id,
        inputStack: inputStack.slice(0, -1),
      });
    }
  },
  updateInput: (id: string, input: Partial<CommandInput>) => {
    set(state => ({
      inputStack: state.inputStack.map(i => (i.id === id ? { ...i, ...input } : i)),
    }));
  },
  resetInputStack: () => {
    set({ inputStack: [defaultInput], activeInputId: defaultInput.id });
  },
}));
