import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/shadcn/button';
import { CheckCircle, XCircle, AlertTriangle, Info } from 'lucide-react';
import { cn } from '@/utils/shadcn';
import { nanoid } from 'nanoid';

interface Toast {
  id: string;
  message: string;
  description?: string;
  type: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
  persistent?: boolean;
  animationState?: 'entering' | 'visible' | 'exiting';
  actions?: {
    label: string;
    onClick: () => void;
  }[];
}

interface ToastOptions {
  description?: string;
  duration?: number;
  persistent?: boolean;
  actions?: {
    label: string;
    onClick: () => void;
  }[];
}

const TOAST_BACKGROUNDS = {
  success: 'bg-gradient-to-r from-[#2476F0] via-[#A83DDA] to-[#C88D58]',
  error: 'bg-chart-4',
  warning: 'bg-chart-3',
  info: 'bg-chart-1',
} as const;

const ICON_CONFIG = {
  success: { Icon: CheckCircle, color: 'text-green-500' },
  error: { Icon: XCircle, color: 'text-destructive' },
  warning: { Icon: AlertTriangle, color: 'text-yellow-500' },
  info: { Icon: Info, color: 'text-blue-500' },
} as const;

const DEFAULT_DURATION = 3000;

class ToastManager {
  private toasts: Toast[] = [];
  private listeners = new Set<(toasts: Toast[]) => void>();

  subscribe(listener: (toasts: Toast[]) => void) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.listeners.forEach(listener => listener([...this.toasts]));
  }

  private addToast(toast: Toast) {
    const toastWithAnimation = { ...toast, animationState: 'entering' as const };
    this.toasts.push(toastWithAnimation);
    this.notify();

    setTimeout(() => {
      const index = this.toasts.findIndex(t => t.id === toast.id);
      if (index !== -1) {
        this.toasts[index] = { ...this.toasts[index], animationState: 'visible' };
        this.notify();
      }
    }, 50);
  }

  dismiss(id: string) {
    const index = this.toasts.findIndex(t => t.id === id);
    if (index !== -1) {
      this.toasts[index] = { ...this.toasts[index], animationState: 'exiting' };
      this.notify();

      setTimeout(() => {
        this.toasts = this.toasts.filter(t => t.id !== id);
        this.notify();
      }, 200);
    }
  }

  dismissAll() {
    this.toasts = this.toasts.map(toast => ({ ...toast, animationState: 'exiting' as const }));
    this.notify();

    setTimeout(() => {
      this.toasts = [];
      this.notify();
    }, 200);
  }

  private createToast(message: string, type: Toast['type'], options: ToastOptions = {}): string {
    const id = nanoid();
    const toast: Toast = {
      id,
      message,
      type,
      description: options.description,
      duration: options.duration,
      persistent: options.persistent,
      animationState: 'entering',
      actions: options.actions,
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
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [isHovered, setIsHovered] = useState(false);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startTimer = useCallback(
    (duration: number) => {
      clearTimer();
      if (!isHovered && !t.persistent) {
        timerRef.current = setTimeout(() => {
          if (!isHovered) onDismiss(t.id);
        }, duration);
      }
    },
    [t.id, t.persistent, onDismiss, isHovered, clearTimer]
  );

  useEffect(() => {
    if (!t.persistent && t.animationState === 'visible') {
      startTimer(t.duration || DEFAULT_DURATION);
    }
    return clearTimer;
  }, [t.id, t.persistent, t.duration, t.animationState, startTimer, clearTimer]);

  const handleMouseEnter = () => {
    if (!t.persistent && !isHovered) {
      clearTimer();
      setIsHovered(true);
    }
  };

  const handleMouseLeave = () => {
    if (!t.persistent && isHovered) {
      setIsHovered(false);
      startTimer(t.duration || DEFAULT_DURATION);
    }
  };

  const renderIcon = () => {
    const config = ICON_CONFIG[t.type];
    const { Icon, color } = config;
    return <Icon className={`h-6 w-6 shrink-0 ${color}`} />;
  };

  const backgroundClass = TOAST_BACKGROUNDS[t.type];
  const isSingleAction = t.actions?.length === 1;

  // Animation classes based on state
  const getAnimationClasses = () => {
    switch (t.animationState) {
      case 'entering':
        return 'translate-x-full opacity-0';
      case 'visible':
        return 'translate-x-0 opacity-100';
      case 'exiting':
        return 'translate-x-full opacity-0';
      default:
        return 'translate-x-0 opacity-100';
    }
  };

  return (
    <div
      className={cn(
        'w-80 rounded-2xl p-[1px] transition-all duration-300 ease-out',
        backgroundClass,
        getAnimationClasses()
      )}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="bg-background rounded-2xl p-4 flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 shrink-0">{renderIcon()}</div>
          <div className="flex-1 min-w-0">
            <div className="text-foreground font-bold text-base truncate">{t.message}</div>
            {t.description && (
              <div className="text-muted-foreground text-sm line-clamp-2 break-all">
                {t.description}
              </div>
            )}
          </div>
        </div>

        {t.actions && t.actions.length > 0 && (
          <div className="grid grid-cols-2 gap-3">
            {t.actions.map((action, index) => (
              <Button
                key={`${t.id}-action-${index}`}
                variant="secondary"
                size="sm"
                onClick={action.onClick}
                className={cn(
                  'bg-card text-muted-foreground hover:bg-muted border-0 rounded-xl h-8 text-sm font-normal tracking-tight',
                  isSingleAction && 'col-span-2'
                )}
              >
                {action.label}
              </Button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const unsubscribe = toastManager.subscribe(setToasts);
    return unsubscribe;
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
