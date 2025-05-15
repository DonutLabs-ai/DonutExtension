import { useWalletStore, useCommandHistoryStore, useTokenStore } from '@/stores';
import { defineProxyService } from '@webext-core/proxy-service';
import { fetchBase } from '@/utils/fetch';
const AI_COMPLETION_URL =
  'https://donut-extension-ai-jackjuns-projects.vercel.app/api/ai/command/complete';

class AICompletionService {
  public async getSuggestion(inputValue: string, commandType: string): Promise<string> {
    if (!inputValue || !commandType) return '';

    const { address } = useWalletStore.getState();
    const { getHistory } = useCommandHistoryStore.getState();
    const { tokens } = useTokenStore.getState();

    const history = getHistory(commandType);
    const balance = Object.values(tokens)
      .filter(token => Number(token.uiBalance) > 0)
      .slice(0, 10)
      .map(token => ({
        symbol: token.symbol,
        balance: token.balance,
        uiBalance: token.uiBalance,
        price: token.price,
      }));
    const trending = Object.values(tokens)
      .filter(token => !token.isUserDiscovered)
      .slice(0, 10)
      .map(token => ({
        symbol: token.symbol,
        price: token.price,
      }));

    try {
      const response = await fetchBase<{ command: string }>(AI_COMPLETION_URL, {
        method: 'POST',
        body: JSON.stringify({ inputValue, address, history, balance, trending }),
      });

      if (!response.command) return '';
      return inputValue + response.command;
    } catch (error) {
      console.error('Error getting AI suggestion:', error);
      return '';
    }
  }
}

export const [registerAICompletionService, getAICompletionService] = defineProxyService(
  'aiCompletionService',
  () => new AICompletionService()
);
