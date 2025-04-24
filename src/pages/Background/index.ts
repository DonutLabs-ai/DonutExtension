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
        chrome.tabs.create({
          url: "./popup.html",
        });
      }
    });
  }
});

console.log("background script");

export {};
