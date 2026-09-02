'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Calendar, BarChart2, Settings, Plus } from 'lucide-react';
import { useStore } from '@/store';

const nawigacja = [
  { href: '/', ikona: Home, etykieta: 'Dziś' },
  { href: '/kalendarz', ikona: Calendar, etykieta: 'Kalendarz' },
  { href: '/statystyki', ikona: BarChart2, etykieta: 'Statystyki' },
  { href: '/ustawienia', ikona: Settings, etykieta: 'Ustawienia' },
];

export default function BottomNav() {
  const pathname = usePathname();
  const ustawModal = useStore((s) => s.ustawModal);

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 flex justify-center"
      role="navigation"
      aria-label="Nawigacja główna"
    >
      <div
        className="w-full max-w-md bg-slate-900 border-t border-slate-800"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        <div className="flex items-center justify-around h-16 px-2">
          {/* Pierwsze dwie pozycje */}
          {nawigacja.slice(0, 2).map(({ href, ikona: Ikona, etykieta }) => {
            const aktywny = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors ${
                  aktywny
                    ? 'text-emerald-400'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
                aria-current={aktywny ? 'page' : undefined}
              >
                <Ikona size={22} strokeWidth={aktywny ? 2.5 : 2} />
                <span className="text-[10px] font-medium">{etykieta}</span>
              </Link>
            );
          })}

          {/* FAB – centralny przycisk + */}
          <div className="flex flex-col items-center justify-center flex-1">
            <button
              onClick={() => ustawModal('quickAction')}
              className="w-14 h-14 -mt-6 rounded-full bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-900/50 transition-all active:scale-95"
              aria-label="Szybkie akcje"
            >
              <Plus size={26} strokeWidth={2.5} className="text-white" />
            </button>
          </div>

          {/* Ostatnie dwie pozycje */}
          {nawigacja.slice(2).map(({ href, ikona: Ikona, etykieta }) => {
            const aktywny = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors ${
                  aktywny
                    ? 'text-emerald-400'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
                aria-current={aktywny ? 'page' : undefined}
              >
                <Ikona size={22} strokeWidth={aktywny ? 2.5 : 2} />
                <span className="text-[10px] font-medium">{etykieta}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
