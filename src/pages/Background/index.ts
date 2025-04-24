let actions = [];
let newtaburl = "";

const getCurrentTab = async () => {
  const queryOptions = { active: true, currentWindow: true };
  const [tab] = await chrome.tabs.query(queryOptions);
  return tab;
};

// Check when the extension button is clicked
chrome.action.onClicked.addListener((tab) => {
  const tabId = tab.id;
  if (tabId) {
    chrome.tabs.sendMessage(tabId, { request: "open-donut" });
  }
});

// Listen for the open donut shortcut
chrome.commands.onCommand.addListener((command) => {
  if (command === "open-donut") {
    getCurrentTab().then((response) => {
      const respId = response.id;
      if (respId) {
        if (
          !response.url?.includes("chrome://") &&
          !response.url?.includes("chrome.google.com")
        ) {
          chrome.tabs.sendMessage(respId, { request: "open-donut" });
        } else {
          chrome.tabs
            .create({
              url: "./popup.html",
            })
            .then(() => {
              newtaburl = respId.toString();
              chrome.tabs.remove(respId);
            });
        }
      }
    });
  }
});

console.log("background script");

export {};
