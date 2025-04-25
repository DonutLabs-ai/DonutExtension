console.log("Content script works!");
console.log("Must reload extension for modifications to take effect.");

if (typeof chrome !== "undefined") {
  let actions = [];
  let isOpen = false;

  // Recieve messages from background
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.request == "open-donut") {
      if (isOpen) {
        console.log("already open");
      } else {
        chrome.runtime.sendMessage({ request: "open-donut" });
        isOpen = true;
      }
    } else if (message.request == "close-donut") {
      console.log("close donut");
      isOpen = false;
    }
  });
} else {
  console.error("not chromium");
}

export {};
