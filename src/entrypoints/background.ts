import { initBackgroundTransport } from '@/utils/transport';
import { registerTokenService } from '@/services/tokenService';
import { registerSwapService } from '@/services/swapService';
import { registerPopupEventService } from '@/services/popupEventService';
import { registerMCPService } from '@/services/mcpService';
import { registerAICompletionService } from '@/services/aiCompletionService';
import { registerCoinGeckoService } from '@/services/coinGeckoService';
import { initStoreBackend } from '@/stores';

export default {
  async main() {
    // Step 1: Initialize transport layer
    initBackgroundTransport();

    // Step 2: Initialize all store backends
    await initStoreBackend();

    // Step 3: Register RPC services
    registerTokenService();
    registerSwapService();
    registerPopupEventService();
    registerMCPService();
    registerAICompletionService();
    registerCoinGeckoService();
  },
};
