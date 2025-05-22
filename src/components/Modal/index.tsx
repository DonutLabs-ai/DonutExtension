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
  const modalRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

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

  // Close when clicking on the overlay
  useEffect(() => {
    const handleOverlayClick = (event: MouseEvent) => {
      // Only the modal box is closed when the overlay element itself is clicked.
      if (overlayRef.current && event.target === overlayRef.current) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleOverlayClick);
    }

    return () => {
      document.removeEventListener('mousedown', handleOverlayClick);
    };
  }, [isOpen, onClose]);

  // Prevent scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  // Use shadow root container if available, otherwise use document.body
  const portalContainer = container || getShadowRootContainer() || document.body;

  const modal = (
    <div className={cn('fixed inset-0 z-50', className)}>
      {/* Overlay */}
      <div
        ref={overlayRef}
        className={cn('fixed inset-0 transition-opacity', overlayClassName)}
        onClick={onClose}
      />

      {/* Modal content */}
      <div
        className={cn(
          'fixed top-[30%] left-[50%] w-full max-w-[calc(100%-2rem)] translate-x-[-50%]',
          'animate-in fade-in-0 zoom-in-95 duration-200',
          contentClassName
        )}
        ref={modalRef}
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
