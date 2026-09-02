'use client';

import { useEffect } from 'react';
import { useStore } from '@/store';

/** Inicjalizuje stan globalny przy starcie aplikacji */
export default function AppProvider({ children }: { children: React.ReactNode }) {
  const inicjalizuj = useStore((s) => s.inicjalizuj);

  useEffect(() => {
    inicjalizuj();
  }, [inicjalizuj]);

  return <>{children}</>;
}
