'use client';

import { useEffect, useRef } from 'react';
import { Pill, PenLine, Sunrise, Moon, X } from 'lucide-react';
import { useStore } from '@/store';
import { dzisiaj } from '@/lib/protokol';

const akcje = [
  {
    id: 'dawka' as const,
    ikona: Pill,
    etykieta: 'Wziąłem dawkę',
    opis: 'Szybkie oznaczenie',
    kolor: 'text-emerald-400',
    tlo: 'bg-emerald-950',
    ramka: 'border-emerald-800',
  },
  {
    id: 'szybkaMysl' as const,
    ikona: PenLine,
    etykieta: 'Szybka myśl',
    opis: 'Notatka na gorąco',
    kolor: 'text-violet-400',
    tlo: 'bg-violet-950',
    ramka: 'border-violet-800',
  },
  {
    id: 'ankietaPoranna' as const,
    ikona: Sunrise,
    etykieta: 'Ankieta poranna',
    opis: 'Sen, nastrój, intencja',
    kolor: 'text-amber-400',
    tlo: 'bg-amber-950',
    ramka: 'border-amber-800',
  },
  {
    id: 'ankietaWieczorna' as const,
    ikona: Moon,
    etykieta: 'Ankieta wieczorna',
    opis: 'Focus, energia, refleksje',
    kolor: 'text-blue-400',
    tlo: 'bg-blue-950',
    ramka: 'border-blue-800',
  },
];

export default function QuickActionModal() {
  const { aktywnyModal, ustawModal, zapiszAnkietePoranna, wpisDzisiaj } = useStore();
  const backdropRef = useRef<HTMLDivElement>(null);

  const zamknij = () => ustawModal(null);

  // Zamknij na Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') zamknij();
    };
    if (aktywnyModal === 'quickAction') {
      document.addEventListener('keydown', handleKey);
    }
    return () => document.removeEventListener('keydown', handleKey);
  }, [aktywnyModal]);

  if (aktywnyModal !== 'quickAction') return null;

  const handleAkcja = async (id: (typeof akcje)[number]['id']) => {
    if (id === 'dawka') {
      // Szybkie oznaczenie dawki bez ankiety
      const teraz = new Date();
      const godz = `${teraz.getHours().toString().padStart(2, '0')}:${teraz
        .getMinutes()
        .toString()
        .padStart(2, '0')}`;

      const porannaAktualna = wpisDzisiaj?.poranna ?? {
        wzieto: true,
        dawka: 0.15,
        jakoscSnu: 7,
        nastrojPoPobudzeniu: 7,
        intencja: '',
      };

      await zapiszAnkietePoranna(
        dzisiaj(),
        { ...porannaAktualna, wzieto: true },
        godz
      );
      zamknij();
    } else {
      // Otwórz odpowiedni modal
      ustawModal(id);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        ref={backdropRef}
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm animate-fade-in"
        onClick={zamknij}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 flex justify-center"
        role="dialog"
        aria-modal="true"
        aria-label="Szybkie akcje"
      >
        <div className="w-full max-w-md bg-slate-900 rounded-t-3xl border-t border-slate-700 animate-slide-up"
          style={{ paddingBottom: 'env(safe-area-inset-bottom, 16px)' }}
        >
          {/* Uchwyt */}
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 rounded-full bg-slate-700" />
          </div>

          {/* Nagłówek */}
          <div className="flex items-center justify-between px-5 py-3">
            <h2 className="text-base font-semibold text-slate-100">Szybkie akcje</h2>
            <button
              onClick={zamknij}
              className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-200 transition-colors"
              aria-label="Zamknij"
            >
              <X size={16} />
            </button>
          </div>

          {/* Siatka akcji */}
          <div className="grid grid-cols-2 gap-3 px-5 pb-6">
            {akcje.map(({ id, ikona: Ikona, etykieta, opis, kolor, tlo, ramka }) => (
              <button
                key={id}
                onClick={() => handleAkcja(id)}
                className={`flex flex-col items-start gap-2 p-4 rounded-2xl border ${tlo} ${ramka} active:scale-95 transition-transform text-left`}
              >
                <div className={`p-2 rounded-xl bg-black/20`}>
                  <Ikona size={20} className={kolor} strokeWidth={2} />
                </div>
                <div>
                  <p className={`text-sm font-semibold ${kolor}`}>{etykieta}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{opis}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
