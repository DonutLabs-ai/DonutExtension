import { registerTokenService, startTokenServiceSchedulers } from '@/services/tokenService';

export default {
  main() {
    // Register the proxy service so it can be called from other contexts
    registerTokenService();
    // Start scheduled refresh tasks
    startTokenServiceSchedulers();

    console.log('Background initialized with TokenService', { id: browser.runtime.id });
  },
};
