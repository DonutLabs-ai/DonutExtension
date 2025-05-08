export enum ParamType {
  Amount = 'amount',
  Token = 'token',
  Address = 'address',
  Text = 'text',
}

export interface CommandParam {
  id: string;
  name: string;
  type: ParamType;
  required: boolean;
  placeholder?: string;
}

export interface CommandDefinition {
  id: string;
  name: string;
  description?: string;
  params: CommandParam[];
}

// Define initial supported commands
export const COMMANDS: CommandDefinition[] = [
  {
    id: 'swap',
    name: 'Swap',
    description: 'Swap tokens',
    params: [
      {
        id: 'amount',
        name: 'Amount',
        type: ParamType.Amount,
        required: true,
        placeholder: 'Amount to swap',
      },
      {
        id: 'fromToken',
        name: 'From Token',
        type: ParamType.Token,
        required: true,
        placeholder: 'Token to swap from',
      },
      {
        id: 'toToken',
        name: 'To Token',
        type: ParamType.Token,
        required: true,
        placeholder: 'Token to swap to',
      },
    ],
  },
  // Can add more command definitions
  {
    id: 'send',
    name: 'Send',
    description: 'Send tokens to an address',
    params: [
      {
        id: 'amount',
        name: 'Amount',
        type: ParamType.Amount,
        required: true,
        placeholder: 'Amount to send',
      },
      {
        id: 'token',
        name: 'Token',
        type: ParamType.Token,
        required: true,
        placeholder: 'Token to send',
      },
      {
        id: 'address',
        name: 'Address',
        type: ParamType.Address,
        required: true,
        placeholder: 'Recipient address',
      },
    ],
  },
];
