import {
  addOnRemovedListener,
  closeWindow,
  focusWindow,
  getLastFocusedWindow,
  openWindow,
  updateWindowPosition,
} from './extension';

const POPUP_WIDTH = 360;
const POPUP_HEIGHT = 640;

export const POPUP_MANAGER_EVENTS = {
  POPUP_CLOSED: 'onPopupClosed',
};

export default class PopupManager {
  static instance: PopupManager;
  constructor() {
    addOnRemovedListener(this._onWindowClosed.bind(this));
  }
  popupId: number | undefined;
  private _winCloseCallback?: (windowId: number) => void;

  static getInstance(): PopupManager {
    return (PopupManager.instance = PopupManager.instance || new PopupManager());
  }

  private createNewPopup = async (url?: string) => {
    // create new popup
    let left = 0;
    let top = 0;
    try {
      const lastFocused = await getLastFocusedWindow();
      // Position window in top right corner of lastFocused window.
      top = lastFocused.top!;
      left = lastFocused.left! + (lastFocused.width! - POPUP_WIDTH);
    } catch (_) {
      // The following properties are more than likely 0, due to being
      // opened from the background chrome process for the extension that
      // has no physical dimensions
      const { screenX, screenY, outerWidth } = window;
      top = Math.max(screenY, 0);
      left = Math.max(screenX + (outerWidth - POPUP_WIDTH), 0);
    }

    // Use provided URL or default to popup.html
    const popupUrl = url || browser.runtime.getURL('/popup.html');

    const popupWindow = await openWindow({
      url: popupUrl,
      type: 'popup',
      width: POPUP_WIDTH,
      height: POPUP_HEIGHT,
      left,
      top,
    });

    // Firefox currently ignores left/top for create, but it works for update
    if (popupWindow.left !== left && popupWindow.state !== 'fullscreen') {
      await updateWindowPosition(popupWindow.id!, left, top);
    }

    return popupWindow.id;
  };

  showPopup = async (onCloseCallback?: (windowId: number) => void, url?: string) => {
    let popupId = this.popupId;
    if (popupId) {
      // bring focus to existing chrome popup
      try {
        await focusWindow(popupId);
      } catch (error) {
        popupId = await this.createNewPopup(url);
      }
    } else {
      popupId = await this.createNewPopup(url);
    }
    this.popupId = popupId;
    this._winCloseCallback = onCloseCallback;
    return popupId;
  };

  focusPopup = async () => {
    if (!this.popupId) return;
    await focusWindow(this.popupId);
  };

  closePopup = async () => {
    if (!this.popupId) return;
    await closeWindow(this.popupId);
    this.popupId = void 0;
  };

  private _onWindowClosed = (windowId: number) => {
    if (windowId === this.popupId) {
      this.popupId = void 0;
      if (this._winCloseCallback) {
        this._winCloseCallback(windowId);
        this._winCloseCallback = void 0;
      }
    }
  };
}
