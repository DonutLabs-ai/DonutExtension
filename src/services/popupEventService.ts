import { defineProxyService } from '@webext-core/proxy-service';
import { PopupEvent, PopupEventType, usePopupEventStore } from '@/stores/popupEventStore';
import PopupManager from '@/utils/popupManager';
import { focusWindow } from '@/utils/extension';

export interface TransactionSignData {
  transaction: string; // Base64 encoded transaction
  description?: string;
}

class PopupEventService {
  private popupManager: PopupManager;
  private isProcessing = false;
  private popupListenerAdded = false;

  constructor() {
    this.popupManager = PopupManager.getInstance();
    this.setupListener();
  }

  private setupListener() {
    if (this.popupListenerAdded) return;

    // Listen for store changes to process new events
    usePopupEventStore.subscribe(state => {
      const popupId = this.popupManager.popupId;
      if (popupId) focusWindow(popupId);

      setBadgeNum(state.events.length);

      if (!this.isProcessing && state.events.some(e => e.status === 'pending')) {
        this.processNextEvent();
      }
    });

    this.popupListenerAdded = true;
  }

  // Request transaction signing
  async requestTransactionSign(data: TransactionSignData): Promise<string> {
    return usePopupEventStore
      .getState()
      .enqueueEvent<string>(PopupEventType.TRANSACTION_SIGN, data);
  }

  // Request wallet connection
  async requestWalletConnect(): Promise<string> {
    return usePopupEventStore.getState().enqueueEvent<string>(PopupEventType.WALLET_CONNECT);
  }

  // Generic method to add events of any type
  async addEvent<T>(type: PopupEventType, data?: any): Promise<T> {
    return usePopupEventStore.getState().enqueueEvent<T>(type, data);
  }

  // Process the next pending event
  private async processNextEvent() {
    if (this.isProcessing) return;

    this.isProcessing = true;

    try {
      const store = usePopupEventStore.getState();
      const event = store.dequeueEvent();

      if (!event) {
        this.isProcessing = false;
        return;
      }

      // Get the appropriate popup URL based on event type
      const popupUrl = this.getPopupUrlForEvent(event);

      // Pass the URL to the popup manager
      await this.popupManager.showPopup(this.handlePopupClosed, popupUrl);
    } catch (error) {
      console.error('Error showing popup:', error);
      this.isProcessing = false;
      this.processNextEvent(); // Try the next event
    }
  }

  // Helper method to check if there are pending events
  private hasPendingEvents(): boolean {
    return usePopupEventStore.getState().events.some(e => e.status === 'pending');
  }

  // Load the next event in the current popup without closing it
  private async loadNextEventInCurrentPopup() {
    try {
      const store = usePopupEventStore.getState();
      const nextEvent = store.dequeueEvent();

      if (!nextEvent) {
        // No more events to process, close the popup
        await this.popupManager.closePopup();
        this.isProcessing = false;
        return;
      }

      // Get the appropriate URL for the next event
      const nextUrl = this.getPopupUrlForEvent(nextEvent);

      // Update the existing popup's URL
      // We can use window.location.replace in the popup, so we need to
      // communicate this via a message or by updating the URL
      const popupId = this.popupManager.popupId;
      if (popupId) {
        // Use browser.tabs API to update the URL of the popup
        const tabs = await browser.tabs.query({ windowId: popupId });
        if (tabs && tabs.length > 0) {
          await browser.tabs.update(tabs[0].id!, { url: nextUrl });
        }
      }
    } catch (error) {
      console.error('Error loading next event in current popup:', error);
      // If we fail to update the current popup, close it and start fresh
      await this.popupManager.closePopup();
      this.isProcessing = false;
      this.processNextEvent();
    }
  }

  // Callback when popup is closed
  private handlePopupClosed = () => {
    const activeEventId = usePopupEventStore.getState().activeEventId;

    if (activeEventId) {
      usePopupEventStore
        .getState()
        .rejectEvent(activeEventId, new Error('Popup closed without action'));
    }

    // Continue processing next event
    this.isProcessing = false;
    this.processNextEvent();
  };

  // Get the appropriate popup URL based on event type
  private getPopupUrlForEvent(event: PopupEvent): string {
    // Use popup.html with a hash parameter for react-router
    const baseUrl = browser.runtime.getURL('/popup.html');
    const params = new URLSearchParams();
    params.append('eventId', event.id);
    params.append('type', event.type);

    // Fix: Format the URL to ensure the query params are correctly passed to the React Router route
    // The correct format for a HashRouter route is: baseUrl#/route?params
    return `${baseUrl}#/event?${params.toString()}`;
  }

  // Called from the popup UI when the user approves an event
  async approveEvent(eventId: string, result: any) {
    try {
      const store = usePopupEventStore.getState();
      store.resolveEvent(eventId, result);

      // Check if there are more pending events
      if (this.hasPendingEvents()) {
        // Load the next event in the current popup
        await this.loadNextEventInCurrentPopup();
      } else {
        // No more events, close the popup
        await this.popupManager.closePopup();
        this.isProcessing = false;
      }
    } catch (error) {
      console.error('Error approving event:', error);
      // On error, close popup and reset processing state
      await this.popupManager.closePopup();
      this.isProcessing = false;
      this.processNextEvent(); // Try next event with a new popup
    }
  }

  // Called from the popup UI when the user rejects an event
  async rejectEvent(eventId: string, reason?: string) {
    try {
      const store = usePopupEventStore.getState();
      store.rejectEvent(eventId, new Error(reason || 'User rejected'));

      // Check if there are more pending events
      if (this.hasPendingEvents()) {
        // Load the next event in the current popup
        await this.loadNextEventInCurrentPopup();
      } else {
        // No more events, close the popup
        await this.popupManager.closePopup();
        this.isProcessing = false;
      }
    } catch (error) {
      console.error('Error rejecting event:', error);
      // On error, close popup and reset processing state
      await this.popupManager.closePopup();
      this.isProcessing = false;
      this.processNextEvent(); // Try next event with a new popup
    }
  }
}

// Export proxied service for cross-environment usage
export const [registerPopupEventService, getPopupEventService] = defineProxyService(
  'popupEventService',
  () => new PopupEventService()
);
