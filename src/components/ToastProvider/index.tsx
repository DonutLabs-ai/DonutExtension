import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/shadcn/button';
import { X, CheckCircle, XCircle, AlertTriangle, Info } from 'lucide-react';
import { cn } from '@/utils/shadcn';

interface Toast {
  id: string;
  message: string;
  description?: string;
  type: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
  persistent?: boolean;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface ToastOptions {
  description?: string;
  duration?: number;
  persistent?: boolean;
  action?: {
    label: string;
    onClick: () => void;
  };
}

class ToastManager {
  private toasts: Toast[] = [];
  private listeners = new Set<(toasts: Toast[]) => void>();

  subscribe(listener: (toasts: Toast[]) => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach(listener => listener([...this.toasts]));
  }

  private addToast(toast: Toast) {
    this.toasts.push(toast);
    this.notify();
  }

  dismiss(id: string) {
    this.toasts = this.toasts.filter(t => t.id !== id);
    this.notify();
  }

  dismissAll() {
    this.toasts = [];
    this.notify();
  }

  private createToast(message: string, type: Toast['type'], options: ToastOptions = {}): string {
    const id = Math.random().toString(36).substring(2);
    const toast: Toast = {
      id,
      message,
      type,
      description: options.description,
      duration: options.duration,
      persistent: options.persistent,
      action: options.action,
    };

    this.addToast(toast);
    return id;
  }

  success(message: string, options?: ToastOptions): string {
    return this.createToast(message, 'success', options);
  }

  error(message: string, options?: ToastOptions): string {
    return this.createToast(message, 'error', options);
  }

  info(message: string, options?: ToastOptions): string {
    return this.createToast(message, 'info', options);
  }

  warning(message: string, options?: ToastOptions): string {
    return this.createToast(message, 'warning', options);
  }
}

const toastManager = new ToastManager();

export const toast = {
  success: (message: string, options?: ToastOptions) => toastManager.success(message, options),
  error: (message: string, options?: ToastOptions) => toastManager.error(message, options),
  info: (message: string, options?: ToastOptions) => toastManager.info(message, options),
  warning: (message: string, options?: ToastOptions) => toastManager.warning(message, options),
  dismiss: (id: string) => toastManager.dismiss(id),
  dismissAll: () => toastManager.dismissAll(),
};

interface ToastItemProps {
  toast: Toast;
  onDismiss: (id: string) => void;
}

const ToastItem: React.FC<ToastItemProps> = ({ toast: t, onDismiss }) => {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isHovered, setIsHovered] = useState(false);

  const startTimer = useCallback(
    (duration: number) => {
      if (timerRef.current) clearTimeout(timerRef.current);

      if (isHovered) return;

      timerRef.current = setTimeout(() => {
        if (!isHovered) {
          onDismiss(t.id);
        }
      }, duration);
    },
    [t.id, onDismiss, isHovered]
  );

  const pauseTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  useEffect(() => {
    if (!t.persistent) {
      const duration = t.duration || 3000;

      if (timerRef.current) clearTimeout(timerRef.current);

      if (!isHovered) {
        timerRef.current = setTimeout(() => {
          if (!isHovered) {
            onDismiss(t.id);
          }
        }, duration);
      }
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [t.id, t.persistent, t.duration, onDismiss, isHovered]);

  const handleMouseEnter = () => {
    if (!t.persistent && !isHovered) {
      pauseTimer();
      setIsHovered(true);
    }
  };

  const handleMouseLeave = () => {
    if (!t.persistent && isHovered) {
      setIsHovered(false);
      const duration = t.duration || 3000;
      startTimer(duration);
    }
  };

  const renderIcon = () => {
    const iconClass = 'h-5 w-5 shrink-0';
    switch (t.type) {
      case 'success':
        return <CheckCircle className={iconClass} />;
      case 'error':
        return <XCircle className={iconClass} />;
      case 'warning':
        return <AlertTriangle className={iconClass} />;
      case 'info':
        return <Info className={iconClass} />;
      default:
        return <Info className={iconClass} />;
    }
  };

  return (
    <div
      className={cn(
        'px-4 py-3 rounded-lg shadow-sm border transition-all duration-200',
        'flex items-start gap-3 min-w-[200px] max-w-[350px]',
        {
          'bg-green-50 border-green-200 text-green-800': t.type === 'success',
          'bg-red-50 border-red-200 text-red-800': t.type === 'error',
          'bg-yellow-50 border-yellow-200 text-yellow-800': t.type === 'warning',
          'bg-blue-50 border-blue-200 text-blue-800': t.type === 'info',
        }
      )}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {renderIcon()}

      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium leading-tight truncate" title={t.message}>
          {t.message}
        </div>
        {t.description && (
          <div
            className="text-xs mt-1 opacity-80 leading-relaxed line-clamp-2"
            title={t.description}
          >
            {t.description}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {t.action && (
          <Button
            variant="outline"
            size="sm"
            onClick={t.action.onClick}
            className="h-7 px-3 text-xs"
          >
            {t.action.label}
          </Button>
        )}

        <Button
          variant="ghost"
          size="icon"
          onClick={() => onDismiss(t.id)}
          className="h-6 w-6 opacity-60 hover:opacity-100"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const unsubscribe = toastManager.subscribe(setToasts);
    return () => {
      unsubscribe();
    };
  }, []);

  return (
    <>
      {children}
      <div className="fixed top-4 right-4 flex flex-col gap-2 z-50">
        {toasts.map(toast => (
          <ToastItem
            key={toast.id}
            toast={toast}
            onDismiss={toastManager.dismiss.bind(toastManager)}
          />
        ))}
      </div>
    </>
  );
};
