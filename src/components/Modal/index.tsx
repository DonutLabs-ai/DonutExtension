import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/utils/shadcn';
import { getShadowRootContainer } from '@/entrypoints/content';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
  overlayClassName?: string;
  contentClassName?: string;
  container?: HTMLElement | null;
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  children,
  className,
  overlayClassName,
  contentClassName,
  container,
}) => {
  // Close on ESC key
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Use shadow root container if available, otherwise use document.body
  const portalContainer = container || getShadowRootContainer() || document.body;

  const modal = (
    <div className={cn('fixed inset-0 z-10', className)}>
      {/* Overlay */}
      <div className={cn('fixed inset-0 transition-opacity', overlayClassName)} onClick={onClose} />

      {/* Modal content */}
      <div
        className={cn(
          'fixed top-[30%] left-[50%] w-full max-w-[calc(100%-32px)] translate-x-[-50%]',
          'animate-in fade-in-0 zoom-in-95 duration-200',
          contentClassName
        )}
        role="dialog"
        aria-modal="true"
      >
        {children}
      </div>
    </div>
  );

  return createPortal(modal, portalContainer);
};

export default Modal;
