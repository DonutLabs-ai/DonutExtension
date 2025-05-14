import { initBackgroundTransport } from '@/utils/transport';
import { registerTokenService, startTokenServiceSchedulers } from '@/services/tokenService';
import { registerSwapService } from '@/services/swapService';
import { registerPopupEventService } from '@/services/popupEventService';
import { registerMCPService } from '@/services/mcpService';
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

    // Step 4: Start token service schedulers
    startTokenServiceSchedulers();
  },
};
