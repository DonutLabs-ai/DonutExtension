import { defineExtensionMessaging } from '@webext-core/messaging';
import type { TokenInfo } from '@/store/tokenStore';

interface TokenMessageMap {
  'token/tokensUpdated': TokenInfo[];
  'token/balanceUpdated': Record<string, { balance: string; uiBalance: number }>;
  'token/priceUpdated': Record<string, number>;
}

export const { sendMessage: sendTokenMessage, onMessage: onTokenMessage } =
  defineExtensionMessaging<TokenMessageMap>();
