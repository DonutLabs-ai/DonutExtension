import React, { createContext, useContext, useState, useCallback } from 'react';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  duration?: number; // milliseconds
  persistent?: boolean; // won't auto-dismiss if true
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface ToastContextProps {
  push: (
    message: string,
    type: Toast['type'],
    options?: {
      duration?: number;
      persistent?: boolean;
      action?: Toast['action'];
    }
  ) => string; // returns toast id
  dismiss: (id: string) => void;
  dismissAll: () => void;
}

const ToastContext = createContext<ToastContextProps | null>(null);

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const dismissAll = useCallback(() => {
    setToasts([]);
  }, []);

  const push = useCallback(
    (
      message: string,
      type: Toast['type'] = 'info',
      options?: {
        duration?: number;
        persistent?: boolean;
        action?: Toast['action'];
      }
    ): string => {
      const id = Math.random().toString(36).substring(2);
      const newToast: Toast = {
        id,
        message,
        type,
        duration: options?.duration,
        persistent: options?.persistent,
        action: options?.action,
      };

      setToasts(prev => [...prev, newToast]);

      if (!newToast.persistent) {
        const duration =
          newToast.duration || (type === 'error' ? 6000 : type === 'success' ? 4000 : 3000);

        setTimeout(() => dismiss(id), duration);
      }

      return id;
    },
    [dismiss]
  );

  return (
    <ToastContext.Provider value={{ push, dismiss, dismissAll }}>
      {children}
      <div className="fixed top-4 right-4 flex flex-col gap-2 z-20 max-w-md">
        {toasts.map(t => (
          <div
            key={t.id}
            className={`px-4 py-3 rounded-md shadow-lg text-sm text-white flex justify-between items-center ${
              t.type === 'success'
                ? 'bg-green-600'
                : t.type === 'error'
                  ? 'bg-red-600'
                  : t.type === 'warning'
                    ? 'bg-amber-500'
                    : 'bg-blue-600'
            }`}
          >
            <div className="flex-1">{t.message}</div>

            <div className="flex items-center gap-2">
              {t.action && (
                <button
                  onClick={t.action.onClick}
                  className="text-xs underline hover:no-underline ml-2"
                >
                  {t.action.label}
                </button>
              )}

              <button
                onClick={() => dismiss(t.id)}
                className="ml-2 text-white opacity-70 hover:opacity-100"
              >
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};
