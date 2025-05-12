export const openExtensionInBrowser = (route?: string | null, queryString?: string | null) => {
  let extensionURL = browser.runtime.getURL('/popup.html');

  if (route) extensionURL += `#${route}`;

  if (queryString) extensionURL += `?${queryString}`;

  openNewTab(extensionURL);
};

export const openNewTab = async (url: string) => {
  const newTab = await browser.tabs.create({ url });
  return newTab;
};

export const openWindow = async (createData: Browser.windows.CreateData) => {
  const newWindow = await browser.windows.create(createData);
  return newWindow;
};

export const focusWindow = async (windowId: number) => {
  await browser.windows.update(windowId, { focused: true });
};

export const getAllWindows = async () => {
  const windows = await browser.windows.getAll();
  return windows;
};

export const closeWindow = async (windowId: number) => {
  await browser.windows.remove(windowId);
};

export const closeCurrentWindow = async () => {
  const currentWindow = await browser.windows.getCurrent();
  if (currentWindow?.id) await closeWindow(currentWindow.id);
};

export const addOnRemovedListener = (listener: (windowId: number) => void) => {
  browser.windows.onRemoved.addListener(listener);
};

export const getLastFocusedWindow = async () => {
  const windowObject = await browser.windows.getLastFocused();
  return windowObject;
};

export const updateWindowPosition = async (windowId: number, left: number, top: number) => {
  await browser.windows.update(windowId, { left, top });
};

export const setBadgeNum = (num: number) => {
  browser.action.setBadgeText({ text: num > 0 ? num.toString() : '' });
  // browser.browserAction.setBadgeTextColor({ color: '#ffffff' });
  // browser.browserAction.setBadgeBackgroundColor({ color: '#000000' });
};

export const getCurrentActiveTab = async () => {
  const tabs = await browser.tabs.query({ active: true, currentWindow: true });
  return tabs[0];
};
