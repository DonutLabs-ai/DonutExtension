import { defineProxyService } from '@webext-core/proxy-service';
import { useWalletStore } from '@/stores/walletStore';
import { useTokenStore } from '@/stores/tokenStore';
import { toRawAmount } from '@/utils/amount';
import { getPopupEventService } from '@/services/popupEventService';
import { getMCPService } from './mcpService';

// ---- Constants ----
const QUOTE_API = 'https://quote-api.jup.ag/v6/quote';
const SWAP_API = 'https://quote-api.jup.ag/v6/swap';

const QUOTE_CACHE_TTL = 8_000; // 8s
const MAX_RETRIES = 2;
const RETRY_DELAY = 500; // ms

interface QuoteParams {
  inputMint: string;
  outputMint: string;
  amount: string; // human-readable amount (e.g. "1.5")
  slippageBps?: number; // default 50 bps (0.5%)
}

interface SwapInfo {
  ammKey: string;
  label: string;
  inputMint: string;
  outputMint: string;
  inAmount: string;
  outAmount: string;
  feeAmount: string;
  feeMint: string;
}

interface RoutePlan {
  swapInfo: SwapInfo;
  percent: number;
}

interface QuoteResponse {
  // Jupiter API v6 response structure
  inputMint: string;
  outputMint: string;
  inAmount: string;
  outAmount: string;
  otherAmountThreshold: string;
  swapMode: string;
  slippageBps: number;
  platformFee: any;
  priceImpactPct: string;
  routePlan: RoutePlan[];
  scoreReport: any;
  contextSlot: number;
  timeTaken: number;
  swapUsdValue: string;
  simplerRouteUsed: boolean;
  useIncurredSlippageForQuoting: any;
}

class SwapService {
  private quoteCache = new Map<string, { expires: number; data: QuoteResponse }>();

  // ---- Public (proxied) APIs ----
  async getQuote(params: QuoteParams, retryCount = 0): Promise<QuoteResponse> {
    const { inputMint, outputMint, amount, slippageBps = 50 } = params;
    const key = `${inputMint}|${outputMint}|${amount}|${slippageBps}`;

    const cached = this.quoteCache.get(key);
    if (cached && cached.expires > Date.now()) {
      return cached.data;
    }

    try {
      // const mcpService = getMCPService();
      // const mcpQuote = await mcpService.callTool('GET_JUPITER_QUOTE', {
      //   inputMint,
      //   outputMint,
      //   inputAmount: Number(amount),
      // });
      // const text = mcpQuote.content[0].text;
      // if (!text) throw new Error('Failed to get quote');
      // console.log('MCP Quote:', JSON.parse(text));

      const url = `${QUOTE_API}?inputMint=${inputMint}&outputMint=${outputMint}&amount=${amount}&slippageBps=${slippageBps}`;
      const res = await fetch(url);

      if (!res.ok) {
        const errorText = await res.text().catch(() => 'Unknown error');
        throw new Error(`Quote error ${res.status}: ${errorText}`);
      }

      const json = await res.json();
      console.log('Jupiter Quote API response:', json);

      // Jupiter v6 API structure validation
      if (!json?.outAmount) {
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

  async buildSwap(quoteResponse: any, userPublicKey: string): Promise<string> {
    const body = JSON.stringify({
      quoteResponse,
      userPublicKey,
      wrapAndUnwrapSol: true,
    });

    try {
      // const mcpService = getMCPService();
      // const mcpSwap = await mcpService.callTool('GET_JUPITER_UNSIGNED_SWAP', {
      //   inputMint: quoteResponse.inputMint,
      //   outputMint: quoteResponse.outputMint,
      //   inputAmount: Number(quoteResponse.inAmount),
      //   publicKey: userPublicKey,
      // });
      // const text = mcpSwap.content[0].text;
      // if (!text) throw new Error('Failed to get swap');
      // console.log('MCP Swap:', JSON.parse(text));

      const res = await fetch(SWAP_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
      });

      if (!res.ok) {
        const errorText = await res.text().catch(() => 'Unknown error');
        throw new Error(`Swap build error ${res.status}: ${errorText}`);
      }

      const json = await res.json();
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

export const [registerSwapService, getSwapService] = defineProxyService(
  'swapService',
  () => new SwapService()
);
