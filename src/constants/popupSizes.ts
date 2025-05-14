import { PopupEventType } from '@/stores/popupEventStore';

export interface PopupSize {
  width: number;
  height: number;
}

export const DEFAULT_POPUP_SIZE: PopupSize = {
  width: 360,
  height: 640,
};

export const POPUP_SIZES: Record<PopupEventType, PopupSize> = {
  [PopupEventType.TRANSACTION_SIGN]: {
    width: 300,
    height: 300,
  },
  [PopupEventType.WALLET_CONNECT]: {
    width: 360,
    height: 640,
  },
};
