import BrowserContext from './background/browser/context';

export default {
  main() {
    console.log('Hello background!', { id: browser.runtime.id });
    const browserContext = new BrowserContext({});

    // Cleanup when tab is closed
    chrome.tabs.onRemoved.addListener(tabId => {
      browserContext.removeAttachedPage(tabId);
    });
  },
};
