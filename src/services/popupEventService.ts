import { defineProxyService } from '@webext-core/proxy-service';
import { PopupEvent, PopupEventType, usePopupEventStore } from '@/stores/popupEventStore';
import {
  openWindow,
  closeWindow,
  focusWindow,
  addOnRemovedListener,
  setBadgeNum,
  getLastFocusedWindow,
  updateWindowPosition,
} from '@/utils/extension';
import { DEFAULT_POPUP_SIZE, POPUP_SIZES } from '@/constants/popupSizes';

export interface TransactionSignData {
  transaction: string; // Base64 encoded transaction
  description?: string;
}

class PopupEventService {
  /** eventId -> windowId */
  private eventWindowMap = new Map<string, number>();

  constructor() {
    // Keep badge in sync with event count
    usePopupEventStore.subscribe(state => {
      setBadgeNum(state.events.length);
    });

    // Listen for popup windows being closed by the user directly
    addOnRemovedListener(this.handleWindowClosed);
  }

  // Request transaction signing
  async requestTransactionSign(data: TransactionSignData): Promise<string> {
    return this.addEvent<string>(PopupEventType.TRANSACTION_SIGN, data);
  }

  // Request wallet connection
  async requestWalletConnect(): Promise<string> {
    return this.addEvent<string>(PopupEventType.WALLET_CONNECT);
  }

  // Generic method to add events of any type
  async addEvent<T>(type: PopupEventType, data?: any): Promise<T> {
    const { event, promise } = usePopupEventStore.getState().enqueueEvent<T>(type, data);

    // Immediately open a new popup for this event
    const windowId = await this.openPopupForEvent(event);
    this.eventWindowMap.set(event.id, windowId);

    // Focus the newly created window (optional, improves UX)
    await focusWindow(windowId);

    return promise;
  }

  // Called from the popup UI when the user approves an event
  async approveEvent(eventId: string, result: any) {
    const store = usePopupEventStore.getState();
    store.resolveEvent(eventId, result);

    await this.closePopupForEvent(eventId);
  }

  // Called from the popup UI when the user rejects an event
  async rejectEvent(eventId: string, reason?: string) {
    const store = usePopupEventStore.getState();
    store.rejectEvent(eventId, new Error(reason || 'User rejected'));

    await this.closePopupForEvent(eventId);
  }

  private async openPopupForEvent(event: PopupEvent): Promise<number> {
    const size = POPUP_SIZES[event.type] ?? DEFAULT_POPUP_SIZE;
    const url = this.getPopupUrlForEvent(event);

    // Calculate position (top-right corner of the last focused window)
    let left = 0;
    let top = 0;

    try {
      const lastFocused = await getLastFocusedWindow();
      // Position window in top right corner of lastFocused window.
      top = lastFocused.top ?? 0;
      left = (lastFocused.left ?? 0) + ((lastFocused.width ?? size.width) - size.width);
    } catch (_) {
      // Fallback – may occur in background context with no window reference
      // The following properties are more than likely 0, due to being opened
      // from the background chrome process for the extension that has no
      // physical dimensions
      const { screenX, screenY, outerWidth } = window;
      top = Math.max(screenY, 0);
      left = Math.max(screenX + (outerWidth - size.width), 0);
    }

    const popupWindow = await openWindow({
      url,
      type: 'popup',
      width: size.width,
      height: size.height,
      left,
      top,
    });

    // Firefox may ignore left/top on create, update them if needed
    if (popupWindow.left !== left && popupWindow.state !== 'fullscreen') {
      await updateWindowPosition(popupWindow.id!, left, top);
    }

    return popupWindow.id!;
  }

  private async closePopupForEvent(eventId: string) {
    const winId = this.eventWindowMap.get(eventId);
    if (winId) {
      try {
        await closeWindow(winId);
      } catch (_) {
        /* Window might already be closed */
      }
      this.eventWindowMap.delete(eventId);
    }
  }

  private handleWindowClosed = (windowId: number) => {
    for (const [eventId, winId] of this.eventWindowMap) {
      if (winId === windowId) {
        // Window closed without explicit action, reject event
        usePopupEventStore
          .getState()
          .rejectEvent(eventId, new Error('Popup closed without action'));
        this.eventWindowMap.delete(eventId);
        break;
      }
    }
  };

  // Build URL for the popup React route
  private getPopupUrlForEvent(event: PopupEvent): string {
    const baseUrl = browser.runtime.getURL('/popup.html');
    const params = new URLSearchParams();
    params.append('eventId', event.id);
    params.append('type', event.type);

    // HashRouter format: baseUrl#/route?params
    return `${baseUrl}#/event?${params.toString()}`;
  }
}

// Export proxied service for cross-environment usage
export const [registerPopupEventService, getPopupEventService] = defineProxyService(
  'popupEventService',
  () => new PopupEventService()
);
