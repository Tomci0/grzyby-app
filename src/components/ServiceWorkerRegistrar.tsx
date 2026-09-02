'use client';

import { useEffect } from 'react';

export default function ServiceWorkerRegistrar() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => console.log('SW zarejestrowany:', reg.scope))
        .catch((err) => console.warn('SW – błąd rejestracji:', err));
    }
  }, []);

  return null;
}
