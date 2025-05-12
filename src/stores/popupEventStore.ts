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

export type PopupEventStatus = 'pending' | 'processing';

export interface PopupEvent {
  id: string;
  type: PopupEventType;
  data?: any; // Event-specific data
  createdAt: number;
  status: PopupEventStatus;
}

// Internal event type to store Promise handlers
interface InternalPopupEvent extends PopupEvent {
  resolve: (value: any) => void;
  reject: (reason?: any) => void;
}

interface PopupEventStoreState {
  events: PopupEvent[]; // Public events (without resolve/reject)
  eventMap: Record<string, InternalPopupEvent>; // Internal events with promise handlers
  activeEventId: string | null;

  // Actions
  enqueueEvent: <T>(type: PopupEventType, data?: any) => Promise<T>;
  dequeueEvent: () => PopupEvent | null;
  setEventStatus: (id: string, status: PopupEventStatus) => void;
  removeEvent: (id: string) => void;
  resolveEvent: (id: string, result: any) => void;
  rejectEvent: (id: string, reason?: any) => void;
  clearEvents: (rejectPending?: boolean) => void;
}

export const usePopupEventStore = create<PopupEventStoreState>((set, get) => ({
  events: [],
  eventMap: {},
  activeEventId: null,

  enqueueEvent: <T>(type: PopupEventType, data?: any): Promise<T> => {
    return new Promise<T>((resolve, reject) => {
      const id = nanoid();
      const event: PopupEvent = {
        id,
        type,
        data,
        createdAt: Date.now(),
        status: 'pending',
      };

      const internalEvent: InternalPopupEvent = {
        ...event,
        resolve,
        reject,
      };

      set(state => ({
        events: [...state.events, event],
        eventMap: { ...state.eventMap, [id]: internalEvent },
      }));
    });
  },

  dequeueEvent: () => {
    const state = get();
    const nextEvent = state.events.find(e => e.status === 'pending');

    if (!nextEvent) return null;

    set(state => ({
      activeEventId: nextEvent.id,
      events: state.events.map(e => (e.id === nextEvent.id ? { ...e, status: 'processing' } : e)),
    }));

    return nextEvent;
  },

  removeEvent: (id: string) => {
    set(state => ({
      events: state.events.filter(e => e.id !== id),
      eventMap: Object.fromEntries(Object.entries(state.eventMap).filter(([key]) => key !== id)),
    }));
  },

  setEventStatus: (id, status) => {
    set(state => ({
      events: state.events.map(e => (e.id === id ? { ...e, status } : e)),
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
        // Reject only pending events
        Object.values(state.eventMap).forEach(event => {
          event.reject(new Error('Events cleared'));
        });
      }

      return {
        events: rejectPending ? [] : state.events.filter(e => e.status !== 'pending'),
        eventMap: {},
        activeEventId: null,
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
