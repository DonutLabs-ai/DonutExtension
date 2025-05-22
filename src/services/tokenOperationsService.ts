import { defineProxyService } from '@webext-core/proxy-service';
import { useWalletStore } from '@/stores/walletStore';
import { useTokenStore } from '@/stores/tokenStore';
import { toRawAmount } from '@/utils/amount';
import { getPopupEventService } from '@/services/popupEventService';
import { getMCPService } from './mcpService';

const QUOTE_CACHE_TTL = 8_000; // 8s
const MAX_RETRIES = 2;
const RETRY_DELAY = 500; // ms

interface QuoteParams {
  inputMint: string;
  outputMint: string;
  amount: string;
}

interface QuoteResponse {
  status: string;
  inputToken: string;
  outputToken: string;
  inputAmount: number;
  outputAmount: string;
  message: string;
}

class TokenOperationsService {
  private quoteCache = new Map<string, { expires: number; data: QuoteResponse }>();

  // ---- Public (proxied) APIs ----
  async getQuote(params: QuoteParams, retryCount = 0): Promise<QuoteResponse> {
    const { inputMint, outputMint, amount } = params;
    const key = `${inputMint}|${outputMint}|${amount}`;

    const cached = this.quoteCache.get(key);
    if (cached && cached.expires > Date.now()) {
      return cached.data;
    }

    try {
      const mcpService = getMCPService();
      const mcpQuote = await mcpService.callTool('GET_JUPITER_QUOTE', {
        inputMint,
        outputMint,
        inputAmount: Number(amount),
      });

      let json;
      try {
        const text = mcpQuote.content[0].text;
        if (!text) throw new Error('Failed to get quote');
        json = JSON.parse(text);
        if (json.status !== 'success') throw new Error('Failed to get quote');
      } catch (error) {
        throw new Error('Failed to get quote');
      }

      if (!json?.outputAmount) {
        console.error('Unexpected Jupiter API response structure:', json);
        throw new Error('Invalid route data from Jupiter API');
      }

      // Direct mapping of response to QuoteResponse
      const quote: QuoteResponse = json;

      this.quoteCache.set(key, { expires: Date.now() + QUOTE_CACHE_TTL, data: quote });
      return quote;
    } catch (err) {
      // Retry logic
      if (retryCount < MAX_RETRIES) {
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * (retryCount + 1)));
        return this.getQuote(params, retryCount + 1);
      }
      throw err;
    }
  }

  async buildSwap(quoteResponse: QuoteResponse, userPublicKey: string): Promise<string> {
    try {
      const mcpService = getMCPService();
      const mcpSwap = await mcpService.callTool('GET_JUPITER_UNSIGNED_SWAP', {
        inputMint: quoteResponse.inputToken,
        outputMint: quoteResponse.outputToken,
        inputAmount: quoteResponse.inputAmount,
        publicKey: userPublicKey,
      });

      let json;
      try {
        const text = mcpSwap.content[0].text;
        if (!text) throw new Error('Failed to swap');
        json = JSON.parse(text);
        if (json.status !== 'success') throw new Error('Failed to swap');
      } catch (error) {
        throw new Error('Failed to swap');
      }

      const { swapTransaction } = json;
      if (!swapTransaction) throw new Error('Missing swapTransaction');

      return swapTransaction;
    } catch (err) {
      console.error('Error building swap transaction:', err);
      throw err;
    }
  }

  /**
   * High-level helper: quote → build → sign+send, returns tx signature
   */
  async executeSwap(params: QuoteParams): Promise<string> {
    // Convert human amount to raw units (integer)
    const tokens = useTokenStore.getState().tokens;
    const decimals = tokens[params.inputMint]?.decimals ?? 0;
    const amountRaw = toRawAmount(params.amount, decimals);

    // Get the quote
    const quote = await this.getQuote({
      ...params,
      amount: amountRaw,
    });

    // Check wallet connection
    const walletAddr = useWalletStore.getState().address;
    if (!walletAddr) {
      // Request wallet connection first
      const popupEventService = getPopupEventService();
      const walletAddress = await popupEventService.requestWalletConnect();

      // Update the wallet store with the new address
      useWalletStore.getState().setAddress(walletAddress);
    }

    // Get the updated wallet address (in case it was just connected)
    const currentWalletAddr = useWalletStore.getState().address;
    if (!currentWalletAddr) throw new Error('Wallet not connected');

    // Build the transaction
    const txStr = await this.buildSwap(quote, currentWalletAddr);

    // Request transaction signing via popup
    const popupEventService = getPopupEventService();
    let description = `Swap ${params.amount} tokens`;

    // Try to get token symbols for a better description
    try {
      const inputSymbol = tokens[params.inputMint]?.symbol;
      const outputSymbol = tokens[params.outputMint]?.symbol;
      if (inputSymbol && outputSymbol) {
        description = `Swap ${params.amount} ${inputSymbol} → ${outputSymbol}`;
      }
    } catch (e) {
      console.error('Error creating swap description:', e);
    }

    const signature = await popupEventService.requestTransactionSign({
      transaction: txStr,
      description,
    });

    return signature;
  }
}

export const [registerTokenOperationsService, getTokenOperationsService] = defineProxyService(
  'tokenOperationsService',
  () => new TokenOperationsService()
);
