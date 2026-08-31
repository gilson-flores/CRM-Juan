'use client';

import { useSyncExternalStore, ReactNode } from 'react';
import { createPortal } from 'react-dom';

const emptySubscribe = () => () => {};

interface PortalProps {
  children: ReactNode;
}

export function Portal({ children }: PortalProps) {
  const isClient = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  if (!isClient || typeof document === 'undefined') {
    return null;
  }

  return createPortal(children, document.body);
}
