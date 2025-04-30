import BrowserContext from './background/browser/context';

export default {
  main() {
    console.log('Hello background!', { id: browser.runtime.id });
    const browserContext = new BrowserContext({});

    chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
      if (tabId && changeInfo.status === 'complete' && tab.url?.startsWith('http')) {
        await injectBuildDomTree(tabId);
      }
    });

    // Cleanup when tab is closed
    chrome.tabs.onRemoved.addListener(tabId => {
      browserContext.removeAttachedPage(tabId);
    });
  },
};

// Function to check if script is already injected
async function isScriptInjected(tabId: number): Promise<boolean> {
  try {
    const results = await chrome.scripting.executeScript({
      target: { tabId },
      func: () => Object.prototype.hasOwnProperty.call(window, 'buildDomTree'),
    });
    return results[0]?.result || false;
  } catch (err) {
    console.error('Failed to check script injection status:', err);
    return false;
  }
}

// // Function to inject the buildDomTree script
async function injectBuildDomTree(tabId: number) {
  try {
    // Check if already injected
    const alreadyInjected = await isScriptInjected(tabId);
    if (alreadyInjected) {
      console.log('Scripts already injected, skipping...');
      return;
    }

    await chrome.scripting.executeScript({
      target: { tabId },
      files: ['buildDomTree.js'],
    });
    console.log('Scripts successfully injected');
  } catch (err) {
    console.error('Failed to inject scripts:', err);
  }
}
