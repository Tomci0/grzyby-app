'use client';

import { useHaptic } from '@/hooks/useHaptic';
import type { Ocena } from '@/types';
import { ocenaNaWartosc } from '@/types';

// Emoji i opis dla każdego poziomu
const POZIOMY: Record<Ocena, { emoji: string; opis: string; kolor: string }> = {
  1: { emoji: '😞', opis: 'Słabo',    kolor: '#f43f5e' },
  2: { emoji: '😕', opis: 'Niezbyt',  kolor: '#f97316' },
  3: { emoji: '😐', opis: 'OK',       kolor: '#eab308' },
  4: { emoji: '🙂', opis: 'Dobrze',   kolor: '#34d399' },
  5: { emoji: '😄', opis: 'Świetnie', kolor: '#10b981' },
};

interface OcenaKropkiProps {
  etykieta: string;
  wartosc: Ocena;
  onChange: (val: Ocena) => void;
}

export default function OcenaKropki({ etykieta, wartosc, onChange }: OcenaKropkiProps) {
  const haptic = useHaptic();
  const aktualny = POZIOMY[wartosc];

  const handleClick = (ocena: Ocena) => {
    haptic.select();
    onChange(ocena);
  };

  return (
    <div className="flex flex-col gap-2">
      {/* Nagłówek z aktualną wartością */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-slate-300">{etykieta}</span>
        <div className="flex items-center gap-1.5">
          <span className="text-base leading-none">{aktualny.emoji}</span>
          <span className="text-xs font-semibold" style={{ color: aktualny.kolor }}>
            {aktualny.opis}
          </span>
        </div>
      </div>

      {/* Pięć przycisków */}
      <div className="flex gap-2">
        {([1, 2, 3, 4, 5] as Ocena[]).map((o) => {
          const poziom = POZIOMY[o];
          const aktywny = wartosc === o;
          return (
            <button
              key={o}
              onClick={() => handleClick(o)}
              aria-label={`${etykieta}: ${poziom.opis}`}
              aria-pressed={aktywny}
              className={`flex-1 flex flex-col items-center gap-1 py-2.5 rounded-xl border transition-all active:scale-95 ${
                aktywny
                  ? 'border-transparent scale-105'
                  : 'bg-slate-800 border-slate-700 opacity-50 hover:opacity-75'
              }`}
              style={aktywny ? {
                backgroundColor: `${poziom.kolor}20`,
                borderColor: poziom.kolor,
              } : undefined}
            >
              <span className="text-xl leading-none">{poziom.emoji}</span>
              <span
                className="text-[10px] font-semibold"
                style={{ color: aktywny ? poziom.kolor : '#64748b' }}
              >
                {o}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** Wersja mini — sama liczba w kółku, do wyświetlania w panelu szczegółów */
export function OcenaBadge({ wartosc }: { wartosc: number }) {
  // wartosc 0–10 → konwertuj na 1–5 dla emoji
  const ocena = Math.min(5, Math.max(1, Math.round(wartosc / 2.5) + 1)) as Ocena;
  const poziom = POZIOMY[ocena];
  return (
    <span className="text-base" title={`${wartosc}/10`}>
      {poziom.emoji}
    </span>
  );
}

export { ocenaNaWartosc, type Ocena };
