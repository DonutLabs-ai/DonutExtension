import jupiter from '@/assets/images/jupiter.png';
import solsniffer from '@/assets/images/solsniffer.png';
import logo from '@/assets/images/logo.png';

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

export interface CommandOption {
  id: string;
  icon: string;
  title: string;
  description?: string;
  category?: string;
  shortcut?: string;
  params: CommandParam[];
}

export const commands: CommandOption[] = [
  {
    id: 'swap',
    icon: jupiter,
    title: 'Swap',
    description: 'Swap token on Jupiter',
    category: 'transaction',
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
  {
    id: 'send',
    icon: logo,
    title: 'Send',
    description: 'Send tokens to an address',
    category: 'transaction',
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
