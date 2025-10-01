// hooks/useAdDrawer.ts
import { useState, useCallback } from 'react';

interface UseAdDrawerProps {
  defaultOpen?: boolean;
  autoOpenDelay?: number;
}

export const useAdDrawer = ({ defaultOpen = false, autoOpenDelay }: UseAdDrawerProps = {}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen(prev => !prev), []);

  // Auto-open functionality
  useState(() => {
    if (autoOpenDelay) {
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, autoOpenDelay);

      return () => clearTimeout(timer);
    }
  });

  return {
    isOpen,
    open,
    close,
    toggle,
  };
};
