import { create } from 'zustand';
import { nanoid } from 'nanoid';
import {
  initPegasusZustandStoreBackend,
  pegasusZustandStoreReady,
} from '@webext-pegasus/store-zustand';

// Define the types of events we can handle
export enum PopupEventType {
  TRANSACTION_SIGN = 'TRANSACTION_SIGN',
  WALLET_CONNECT = 'WALLET_CONNECT',
  // Add more event types as needed
}

export interface PopupEvent {
  id: string;
  type: PopupEventType;
  data?: any; // Event-specific data
  createdAt: number;
}

// Internal event type to store Promise handlers
interface InternalPopupEvent extends PopupEvent {
  resolve: (value: any) => void;
  reject: (reason?: any) => void;
}

interface PopupEventStoreState {
  events: PopupEvent[]; // Public events (without resolve/reject)
  eventMap: Record<string, InternalPopupEvent>; // Internal events with promise handlers

  // Actions
  enqueueEvent: <T>(
    type: PopupEventType,
    data?: any
  ) => {
    event: PopupEvent;
    promise: Promise<T>;
  };
  removeEvent: (id: string) => void;
  resolveEvent: (id: string, result: any) => void;
  rejectEvent: (id: string, reason?: any) => void;
  clearEvents: (rejectPending?: boolean) => void;
}

export const usePopupEventStore = create<PopupEventStoreState>((set, get) => ({
  events: [],
  eventMap: {},

  enqueueEvent: <T>(type: PopupEventType, data?: any) => {
    let resolveFn: (value: any) => void;
    let rejectFn: (reason?: any) => void;

    const promise = new Promise<T>((resolve, reject) => {
      resolveFn = resolve;
      rejectFn = reject;
    });

    // Generate event
    const id = nanoid();
    const event: PopupEvent = {
      id,
      type,
      data,
      createdAt: Date.now(),
    };

    const internalEvent: InternalPopupEvent = {
      ...event,
      resolve: resolveFn!,
      reject: rejectFn!,
    };

    // Push into store
    set(state => ({
      events: [...state.events, event],
      eventMap: { ...state.eventMap, [id]: internalEvent },
    }));

    return { event, promise };
  },

  removeEvent: (id: string) => {
    set(state => ({
      events: state.events.filter(e => e.id !== id),
      eventMap: Object.fromEntries(Object.entries(state.eventMap).filter(([key]) => key !== id)),
    }));
  },

  resolveEvent: (id, result) => {
    const state = get();
    const event = state.eventMap[id];
    if (event) {
      event.resolve(result);
      get().removeEvent(id);
    }
  },

  rejectEvent: (id, reason) => {
    const state = get();
    const event = state.eventMap[id];
    if (event) {
      event.reject(reason || new Error('Event rejected'));
      get().removeEvent(id);
    }
  },

  clearEvents: (rejectPending = true) => {
    set(state => {
      if (rejectPending) {
        // Reject all pending events
        Object.values(state.eventMap).forEach(event => {
          event.reject(new Error('Events cleared'));
        });
      }

      return {
        events: rejectPending ? [] : state.events,
        eventMap: {},
      };
    });
  },
}));

// Store name for cross-environment sharing
export const POPUP_EVENT_STORE_NAME = 'donut-popup-event-store';

// Initialize store backend in background
export const initPopupEventStoreBackend = () =>
  initPegasusZustandStoreBackend(POPUP_EVENT_STORE_NAME, usePopupEventStore);

// Wait for store to be ready in other environments
export const popupEventStoreReady = () =>
  pegasusZustandStoreReady(POPUP_EVENT_STORE_NAME, usePopupEventStore);
