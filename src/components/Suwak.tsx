'use client';

interface SuwakProps {
  etykieta: string;
  wartosc: number;
  onChange: (val: number) => void;
  min?: number;
  max?: number;
  lewyOpis?: string;
  prawyOpis?: string;
  kolor?: string;
}

export default function Suwak({
  etykieta,
  wartosc,
  onChange,
  min = 0,
  max = 10,
  lewyOpis = 'Słabo',
  prawyOpis = 'Świetnie',
  kolor = '#10b981',
}: SuwakProps) {
  const procent = ((wartosc - min) / (max - min)) * 100;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-slate-300">{etykieta}</label>
        <span
          className="text-lg font-bold min-w-[2rem] text-right"
          style={{ color: kolor }}
        >
          {wartosc}
        </span>
      </div>

      <div className="relative">
        <input
          type="range"
          min={min}
          max={max}
          value={wartosc}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full"
          style={{
            background: `linear-gradient(to right, ${kolor} ${procent}%, #334155 ${procent}%)`,
          }}
          aria-label={etykieta}
          aria-valuenow={wartosc}
          aria-valuemin={min}
          aria-valuemax={max}
        />
      </div>

      <div className="flex justify-between text-[10px] text-slate-600">
        <span>{lewyOpis}</span>
        <span>{prawyOpis}</span>
      </div>
    </div>
  );
}
