import jupiter from '@/assets/images/jupiter.png';
import solsniffer from '@/assets/images/solsniffer.png';
import logo from '@/assets/images/logo.png';

export enum CommandIdType {
  Swap = 'swap',
  Send = 'send',
  Chart = 'chart',
  RugCheck = 'rugCheck',
}

export enum ParamType {
  Amount = 'amount',
  Token = 'token',
  Address = 'address',
  Text = 'text',
  TokenAddress = 'tokenAddress',
}

export interface CommandParam {
  id: string;
  name: string;
  type: ParamType;
  required: boolean;
  placeholder?: string;
}

export interface CommandOption {
  id: CommandIdType;
  icon: string;
  title: string;
  description?: string;
  shortcut?: string;
  params: CommandParam[];
}

export const commands: CommandOption[] = [
  {
    id: CommandIdType.Swap,
    icon: jupiter,
    title: 'Swap',
    description: 'Swap token on Jupiter',
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
    id: CommandIdType.Send,
    icon: logo,
    title: 'Send',
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
  {
    id: CommandIdType.Chart,
    icon: logo,
    title: 'Chart',
    description: 'Show a price chart',
    params: [
      {
        id: 'token',
        name: 'Token',
        type: ParamType.TokenAddress,
        required: true,
        placeholder: 'Token to chart',
      },
    ],
  },
  {
    id: CommandIdType.RugCheck,
    icon: solsniffer,
    title: 'RugCheck',
    description: 'Analyze sol token on Solsniffer',
    params: [
      {
        id: 'token',
        name: 'Token',
        type: ParamType.TokenAddress,
        required: true,
        placeholder: 'Token address',
      },
    ],
  },
];
