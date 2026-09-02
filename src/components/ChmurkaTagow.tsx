'use client';

import { useHaptic } from '@/hooks/useHaptic';
import { TAGI_POZYTYWNE, TAGI_WYZWANIA, type Tag } from '@/types';

interface ChmurkaTagowProps {
  wybrane: Tag[];
  onChange: (tagi: Tag[]) => void;
}

const KOLORY_POZYTYWNE: Record<string, string> = {
  '#flow':         'bg-emerald-950 border-emerald-700 text-emerald-300',
  '#spokój':       'bg-teal-950 border-teal-700 text-teal-300',
  '#kreatywność':  'bg-violet-950 border-violet-700 text-violet-300',
  '#głęboki-sen':  'bg-blue-950 border-blue-700 text-blue-300',
  '#energia':      'bg-amber-950 border-amber-700 text-amber-300',
  '#obecność':     'bg-cyan-950 border-cyan-700 text-cyan-300',
  '#wdzięczność':  'bg-pink-950 border-pink-700 text-pink-300',
  '#motywacja':    'bg-orange-950 border-orange-700 text-orange-300',
};

const KOLORY_WYZWANIA: Record<string, string> = {
  '#mgła-mózgowa': 'bg-slate-800 border-slate-600 text-slate-400',
  '#stres':        'bg-rose-950 border-rose-800 text-rose-400',
  '#bóle-głowy':   'bg-red-950 border-red-800 text-red-400',
  '#zmęczenie':    'bg-slate-800 border-slate-600 text-slate-400',
  '#kofeina':      'bg-yellow-950 border-yellow-800 text-yellow-400',
  '#alkohol':      'bg-orange-950 border-orange-800 text-orange-400',
  '#rozproszenie': 'bg-purple-950 border-purple-800 text-purple-400',
  '#lęk':          'bg-rose-950 border-rose-800 text-rose-400',
};

const KOLORY_AKTYWNE: Record<string, string> = {
  '#flow':         'bg-emerald-500 border-emerald-400 text-white',
  '#spokój':       'bg-teal-500 border-teal-400 text-white',
  '#kreatywność':  'bg-violet-500 border-violet-400 text-white',
  '#głęboki-sen':  'bg-blue-500 border-blue-400 text-white',
  '#energia':      'bg-amber-500 border-amber-400 text-white',
  '#obecność':     'bg-cyan-500 border-cyan-400 text-white',
  '#wdzięczność':  'bg-pink-500 border-pink-400 text-white',
  '#motywacja':    'bg-orange-500 border-orange-400 text-white',
  '#mgła-mózgowa': 'bg-slate-600 border-slate-500 text-white',
  '#stres':        'bg-rose-600 border-rose-500 text-white',
  '#bóle-głowy':   'bg-red-600 border-red-500 text-white',
  '#zmęczenie':    'bg-slate-600 border-slate-500 text-white',
  '#kofeina':      'bg-yellow-600 border-yellow-500 text-white',
  '#alkohol':      'bg-orange-600 border-orange-500 text-white',
  '#rozproszenie': 'bg-purple-600 border-purple-500 text-white',
  '#lęk':          'bg-rose-600 border-rose-500 text-white',
};

function TagButton({
  tag,
  aktywny,
  klasyNieaktywny,
  onToggle,
}: {
  tag: Tag;
  aktywny: boolean;
  klasyNieaktywny: string;
  onToggle: (t: Tag) => void;
}) {
  const haptic = useHaptic();
  return (
    <button
      onClick={() => { haptic.tap(); onToggle(tag); }}
      aria-pressed={aktywny}
      className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all active:scale-95 ${
        aktywny ? KOLORY_AKTYWNE[tag] : klasyNieaktywny
      }`}
    >
      {tag}
    </button>
  );
}

export default function ChmurkaTagow({ wybrane, onChange }: ChmurkaTagowProps) {
  const toggle = (tag: Tag) => {
    if (wybrane.includes(tag)) {
      onChange(wybrane.filter((t) => t !== tag));
    } else {
      onChange([...wybrane, tag]);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Pozytywne */}
      <div className="flex flex-col gap-1.5">
        <p className="text-xs font-semibold text-emerald-500 uppercase tracking-wider">
          ✨ Pozytywne
        </p>
        <div className="flex flex-wrap gap-2">
          {TAGI_POZYTYWNE.map((tag) => (
            <TagButton
              key={tag}
              tag={tag}
              aktywny={wybrane.includes(tag)}
              klasyNieaktywny={KOLORY_POZYTYWNE[tag]}
              onToggle={toggle}
            />
          ))}
        </div>
      </div>

      {/* Wyzwania */}
      <div className="flex flex-col gap-1.5">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          ⚡ Wyzwania
        </p>
        <div className="flex flex-wrap gap-2">
          {TAGI_WYZWANIA.map((tag) => (
            <TagButton
              key={tag}
              tag={tag}
              aktywny={wybrane.includes(tag)}
              klasyNieaktywny={KOLORY_WYZWANIA[tag]}
              onToggle={toggle}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

/** Wersja read-only do wyświetlania tagów w panelach */
export function TagiLista({ tagi }: { tagi: Tag[] }) {
  if (!tagi || tagi.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {tagi.map((tag) => {
        const czyPozytywny = (TAGI_POZYTYWNE as readonly string[]).includes(tag);
        return (
          <span
            key={tag}
            className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${
              czyPozytywny
                ? KOLORY_POZYTYWNE[tag] ?? 'bg-emerald-950 border-emerald-800 text-emerald-300'
                : KOLORY_WYZWANIA[tag] ?? 'bg-rose-950 border-rose-800 text-rose-400'
            }`}
          >
            {tag}
          </span>
        );
      })}
    </div>
  );
}
