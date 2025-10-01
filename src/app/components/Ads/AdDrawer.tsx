// components/AdDrawer.tsx
import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface AdDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  position?: 'top' | 'bottom';
  height?: number;
  closeButton?: boolean;
  autoCloseDelay?: number;
}

const AdDrawer: React.FC<AdDrawerProps> = ({
  isOpen,
  onClose,
  children,
  position = 'top',
  height = 300,
  closeButton = true,
  autoCloseDelay,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      // Prevent body scrolling when drawer is open
      document.body.style.overflow = 'hidden';
    } else {
      setIsVisible(false);
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  useEffect(() => {
    if (autoCloseDelay && isOpen) {
      const timer = setTimeout(() => {
        onClose();
      }, autoCloseDelay);

      return () => clearTimeout(timer);
    }
  }, [autoCloseDelay, isOpen, onClose]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const drawerStyles: React.CSSProperties = {
    height: `${height}px`,
    transform: position === 'top' 
      ? `translateY(${isVisible ? '0' : '-100%'})`
      : `translateY(${isVisible ? '0' : '100%'})`,
  };

  if (!isMounted) return null;

  return createPortal(
    <div
      className={`fixed inset-0 z-50 transition-all duration-300 ${
        isOpen ? 'bg-black bg-opacity-50' : 'pointer-events-none'
      }`}
      onClick={handleBackdropClick}
    >
      <div
        className={`absolute w-full bg-white shadow-lg transition-transform duration-300 ease-in-out ${
          position === 'top' ? 'top-0' : 'bottom-0'
        }`}
        style={drawerStyles}
      >
        {closeButton && (
          <button
            onClick={onClose}
            className="absolute right-4 top-4 z-10 rounded-full bg-gray-200 p-1 hover:bg-gray-300"
            aria-label="Close drawer"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
        <div className="h-full overflow-auto">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default AdDrawer;
