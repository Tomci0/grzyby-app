"use client";

import { useState, useEffect } from "react";
import { TrendingUp, TrendingDown, Minus, Lightbulb } from "lucide-react";
import { useStore } from "@/store";
import { dzisiaj, przesunDate, obliczTypDnia } from "@/lib/protokol";
import { pobierzWpisyZakresu } from "@/lib/db";
import { TagiLista } from "@/components/ChmurkaTagow";
import type { WpisDnia, Ustawienia, Tag } from "@/types";

// ============================================================
// Wykres liniowy SVG
// ============================================================

interface PunktWykresu {
  data: string;
  wartosc: number | undefined;
}

function WykresLiniowy({
  punkty,
  kolor,
  wysokosc = 80,
}: {
  punkty: PunktWykresu[];
  kolor: string;
  wysokosc?: number;
}) {
  const szerokoscSVG = 300;
  const wartosci = punkty
    .map((p) => p.wartosc)
    .filter((v): v is number => v !== undefined);

  if (wartosci.length < 2) {
    return (
      <div
        className="w-full flex items-center justify-center text-slate-600 text-xs"
        style={{ height: wysokosc }}
      >
        Za mało danych
      </div>
    );
  }

  const min = 0;
  const max = 10;
  const pad = 8;
  const szerkosc = szerokoscSVG - pad * 2;
  const wys = wysokosc - pad * 2;
  const xDla = (i: number) => pad + (i / (punkty.length - 1)) * szerkosc;
  const yDla = (v: number) => pad + wys - ((v - min) / (max - min)) * wys;

  const segmenty: string[] = [];
  let ostatniPunkt: { x: number; y: number } | null = null;
  punkty.forEach((p, i) => {
    if (p.wartosc === undefined) {
      ostatniPunkt = null;
      return;
    }
    const x = xDla(i);
    const y = yDla(p.wartosc);
    if (!ostatniPunkt) {
      segmenty.push(`M ${x} ${y}`);
    } else {
      const cx = (ostatniPunkt.x + x) / 2;
      segmenty.push(`C ${cx} ${ostatniPunkt.y}, ${cx} ${y}, ${x} ${y}`);
    }
    ostatniPunkt = { x, y };
  });

  const sciezka = segmenty.join(" ");
  const pierwszyX = xDla(punkty.findIndex((p) => p.wartosc !== undefined));
  const ostatniX = xDla(
    punkty.length -
      1 -
      [...punkty].reverse().findIndex((p) => p.wartosc !== undefined),
  );
  const obszar =
    sciezka + ` L ${ostatniX} ${wysokosc} L ${pierwszyX} ${wysokosc} Z`;

  return (
    <svg
      viewBox={`0 0 ${szerokoscSVG} ${wysokosc}`}
      className="w-full"
      style={{ height: wysokosc }}
      aria-hidden="true"
    >
      {[2, 5, 8].map((v) => (
        <line
          key={v}
          x1={pad}
          y1={yDla(v)}
          x2={szerokoscSVG - pad}
          y2={yDla(v)}
          stroke="#1e293b"
          strokeWidth="1"
        />
      ))}
      <path d={obszar} fill={kolor} fillOpacity="0.1" />
      <path
        d={sciezka}
        fill="none"
        stroke={kolor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {punkty.map((p, i) =>
        p.wartosc === undefined ? null : (
          <circle
            key={i}
            cx={xDla(i)}
            cy={yDla(p.wartosc)}
            r="3"
            fill={kolor}
            stroke="#0f172a"
            strokeWidth="1.5"
          />
        ),
      )}
    </svg>
  );
}

// ============================================================
// Karta wykresu
// ============================================================

function KartaWykresu({
  tytul,
  ikona,
  punkty,
  kolor,
  aktualnaWartosc,
  trend,
}: {
  tytul: string;
  ikona: string;
  punkty: PunktWykresu[];
  kolor: string;
  aktualnaWartosc: number | undefined;
  trend: "up" | "down" | "flat";
}) {
  const TrendIkona =
    trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;
  const trendKolor =
    trend === "up"
      ? "text-emerald-400"
      : trend === "down"
        ? "text-rose-400"
        : "text-slate-500";
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-base">{ikona}</span>
          <span className="text-sm font-semibold text-slate-200">{tytul}</span>
        </div>
        <div className="flex items-center gap-1.5">
          {aktualnaWartosc !== undefined && (
            <span className="text-lg font-bold" style={{ color: kolor }}>
              {aktualnaWartosc.toFixed(1)}
            </span>
          )}
          <TrendIkona size={14} className={trendKolor} />
        </div>
      </div>
      <WykresLiniowy punkty={punkty} kolor={kolor} />
    </div>
  );
}

// ============================================================
// Smart Insights — karta automatycznych wniosków
// ============================================================

function SmartInsights({
  wpisy,
  ustawienia,
}: {
  wpisy: WpisDnia[];
  ustawienia: Ustawienia | null;
}) {
  if (!ustawienia || wpisy.length === 0) return null;

  const dniDawki = wpisy.filter(
    (w) => obliczTypDnia(w.data, ustawienia) === "dawka",
  );
  const dniPrzerwy = wpisy.filter(
    (w) => obliczTypDnia(w.data, ustawienia) === "przerwa",
  );

  const sr = (
    lista: WpisDnia[],
    pole: "nastrojPoPobudzeniu" | "focus" | "energia" | "spokoj",
  ) => {
    const vals = lista.flatMap((w) => {
      const v =
        pole === "nastrojPoPobudzeniu"
          ? w.poranna?.nastrojPoPobudzeniu
          : w.wieczorna?.[pole];
      return v !== undefined ? [v] : [];
    });
    return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
  };

  const srNastrojDawka = sr(dniDawki, "nastrojPoPobudzeniu");
  const srNastrojPrzerwa = sr(dniPrzerwy, "nastrojPoPobudzeniu");
  const srFocusDawka = sr(dniDawki, "focus");
  const srFocusPrzerwa = sr(dniPrzerwy, "focus");

  // Najczęstsze tagi
  const licznikTagow: Record<string, number> = {};
  wpisy.forEach((w) =>
    (w.wieczorna?.tagi ?? []).forEach((t) => {
      licznikTagow[t] = (licznikTagow[t] ?? 0) + 1;
    }),
  );
  const topTagi = Object.entries(licznikTagow)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([tag]) => tag as Tag);

  // Liczba przyjętych dawek
  const wzieteD = dniDawki.filter((w) => w.poranna?.wzieto).length;

  // Wnioski
  const wnioski: { ikona: string; tekst: string; kolor: string }[] = [];

  if (srNastrojDawka !== null && srNastrojPrzerwa !== null) {
    const roznica = srNastrojDawka - srNastrojPrzerwa;
    if (Math.abs(roznica) > 0.5) {
      wnioski.push({
        ikona: roznica > 0 ? "😊" : "🤔",
        tekst:
          roznica > 0
            ? `Twój nastrój w dni z dawką jest średnio o ${roznica.toFixed(1)} pkt wyższy niż w dni przerwy.`
            : `Twój nastrój w dni przerwy jest średnio o ${Math.abs(roznica).toFixed(1)} pkt wyższy niż w dni z dawką.`,
        kolor: roznica > 0 ? "text-emerald-400" : "text-amber-400",
      });
    }
  }

  if (srFocusDawka !== null && srFocusPrzerwa !== null) {
    const roznica = srFocusDawka - srFocusPrzerwa;
    if (Math.abs(roznica) > 0.5) {
      wnioski.push({
        ikona: roznica > 0 ? "🎯" : "💭",
        tekst:
          roznica > 0
            ? `Focus w dniach dawki wyższy średnio o ${roznica.toFixed(1)} pkt — protokół działa na skupienie.`
            : `Focus w dniach przerwy wyższy o ${Math.abs(roznica).toFixed(1)} pkt — warto obserwować dalej.`,
        kolor: roznica > 0 ? "text-blue-400" : "text-slate-400",
      });
    }
  }

  if (dniDawki.length > 0) {
    const procent = Math.round((wzieteD / dniDawki.length) * 100);
    wnioski.push({
      ikona: "💊",
      tekst: `Przyjęto ${wzieteD} z ${dniDawki.length} zaplanowanych dawek (${procent}% zgodność z protokołem).`,
      kolor: procent >= 80 ? "text-emerald-400" : "text-amber-400",
    });
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col gap-4">
      {/* Nagłówek */}
      <div className="flex items-center gap-2">
        <div className="p-1.5 bg-amber-950 rounded-lg">
          <Lightbulb size={15} className="text-amber-400" />
        </div>
        <h3 className="text-sm font-semibold text-slate-200">Smart Insights</h3>
      </div>

      {/* Szybkie metryki */}
      <div className="grid grid-cols-3 gap-2">
        <KartkaInsight
          ikona="💊"
          wartosc={`${wzieteD}/${dniDawki.length}`}
          etykieta="Dawki wzięte"
          kolor="text-emerald-400"
        />
        <KartkaInsight
          ikona="😊"
          wartosc={srNastrojDawka !== null ? srNastrojDawka.toFixed(1) : "–"}
          etykieta="Nastrój (dawka)"
          kolor="text-amber-400"
        />
        <KartkaInsight
          ikona="⏸️"
          wartosc={
            srNastrojPrzerwa !== null ? srNastrojPrzerwa.toFixed(1) : "–"
          }
          etykieta="Nastrój (przerwa)"
          kolor="text-slate-400"
        />
      </div>

      {/* Wnioski tekstowe */}
      {wnioski.length > 0 && (
        <div className="flex flex-col gap-2">
          {wnioski.map((w, i) => (
            <div
              key={i}
              className="flex items-start gap-2.5 bg-slate-800/60 rounded-xl px-3 py-2.5"
            >
              <span className="text-base shrink-0 mt-0.5">{w.ikona}</span>
              <p className={`text-xs leading-relaxed ${w.kolor}`}>{w.tekst}</p>
            </div>
          ))}
        </div>
      )}

      {/* Najczęstsze tagi */}
      {topTagi.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <p className="text-xs text-slate-500">Najczęstsze tagi</p>
          <TagiLista tagi={topTagi} />
        </div>
      )}
    </div>
  );
}

function KartkaInsight({
  ikona,
  wartosc,
  etykieta,
  kolor,
}: {
  ikona: string;
  wartosc: string;
  etykieta: string;
  kolor: string;
}) {
  return (
    <div className="bg-slate-800/60 rounded-xl p-2.5 flex flex-col gap-0.5">
      <span className="text-base">{ikona}</span>
      <span className={`text-base font-bold ${kolor}`}>{wartosc}</span>
      <span className="text-[10px] text-slate-500 leading-tight">
        {etykieta}
      </span>
    </div>
  );
}

// ============================================================
// Porównanie dawka vs przerwa
// ============================================================

function PorownanieDawkaPrzerwa({
  wpisy,
  ustawienia,
}: {
  wpisy: WpisDnia[];
  ustawienia: Ustawienia | null;
}) {
  if (!ustawienia || wpisy.length === 0) return null;

  const dniDawki = wpisy.filter(
    (w) => obliczTypDnia(w.data, ustawienia) === "dawka",
  );
  const dniPrzerwy = wpisy.filter(
    (w) => obliczTypDnia(w.data, ustawienia) === "przerwa",
  );

  const srednia = (
    lista: WpisDnia[],
    pole: "nastrojPoPobudzeniu" | "focus" | "energia" | "spokoj",
  ) => {
    const vals = lista.flatMap((w) => {
      const v =
        pole === "nastrojPoPobudzeniu"
          ? w.poranna?.nastrojPoPobudzeniu
          : w.wieczorna?.[pole];
      return v !== undefined ? [v] : [];
    });
    return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
  };

  const metryki = [
    {
      etykieta: "Nastrój rano",
      pole: "nastrojPoPobudzeniu" as const,
      ikona: "☀️",
    },
    { etykieta: "Focus", pole: "focus" as const, ikona: "🎯" },
    { etykieta: "Energia", pole: "energia" as const, ikona: "⚡" },
    { etykieta: "Spokój", pole: "spokoj" as const, ikona: "🕊️" },
  ];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col gap-4">
      <h3 className="text-sm font-semibold text-slate-200">Dawka vs Przerwa</h3>
      <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-500 font-semibold">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-emerald-500" />
          Dni z dawką ({dniDawki.length})
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-slate-600" />
          Dni przerwy ({dniPrzerwy.length})
        </div>
      </div>
      <div className="flex flex-col gap-3">
        {metryki.map(({ etykieta, pole, ikona }) => {
          const sDawka = srednia(dniDawki, pole);
          const sPrzerwa = srednia(dniPrzerwy, pole);
          if (sDawka === null && sPrzerwa === null) return null;
          return (
            <div key={pole} className="flex flex-col gap-1.5">
              <div className="flex items-center gap-1">
                <span className="text-xs">{ikona}</span>
                <span className="text-xs text-slate-400">{etykieta}</span>
              </div>
              <div className="flex flex-col gap-1">
                <PasekPorownan
                  wartosc={sDawka}
                  max={10}
                  kolor="#10b981"
                  etykieta={sDawka !== null ? sDawka.toFixed(1) : "–"}
                />
                <PasekPorownan
                  wartosc={sPrzerwa}
                  max={10}
                  kolor="#475569"
                  etykieta={sPrzerwa !== null ? sPrzerwa.toFixed(1) : "–"}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PasekPorownan({
  wartosc,
  max,
  kolor,
  etykieta,
}: {
  wartosc: number | null;
  max: number;
  kolor: string;
  etykieta: string;
}) {
  const szerokosc = wartosc !== null ? (wartosc / max) * 100 : 0;
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${szerokosc}%`, backgroundColor: kolor }}
        />
      </div>
      <span
        className="text-xs font-semibold w-6 text-right"
        style={{ color: kolor }}
      >
        {etykieta}
      </span>
    </div>
  );
}

// ============================================================
// Kartki podsumowania
// ============================================================

function KartkiPodsumowania({ wpisy }: { wpisy: WpisDnia[] }) {
  const suma = (
    pole: "nastrojPoPobudzeniu" | "focus" | "energia" | "spokoj",
  ) => {
    const vals = wpisy.flatMap((w) => {
      const v =
        pole === "nastrojPoPobudzeniu"
          ? w.poranna?.nastrojPoPobudzeniu
          : (w.wieczorna?.[pole as keyof typeof w.wieczorna] as
              | number
              | undefined);
      return v !== undefined ? [v] : [];
    });
    return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
  };

  const karty = [
    {
      ikona: "😊",
      etykieta: "Śr. nastrój",
      wartosc: suma("nastrojPoPobudzeniu"),
    },
    { ikona: "🎯", etykieta: "Śr. focus", wartosc: suma("focus") },
    { ikona: "⚡", etykieta: "Śr. energia", wartosc: suma("energia") },
    { ikona: "🕊️", etykieta: "Śr. spokój", wartosc: suma("spokoj") },
  ];

  return (
    <div className="grid grid-cols-2 gap-3">
      {karty.map(({ ikona, etykieta, wartosc }) => (
        <div
          key={etykieta}
          className="bg-slate-900 border border-slate-800 rounded-2xl p-4"
        >
          <p className="text-xl mb-1">{ikona}</p>
          <p className="text-xl font-bold text-slate-100">
            {wartosc !== null ? wartosc.toFixed(1) : "–"}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">{etykieta}</p>
        </div>
      ))}
    </div>
  );
}

function obliczTrend(punkty: PunktWykresu[]): "up" | "down" | "flat" {
  const dane = punkty
    .filter((p) => p.wartosc !== undefined)
    .map((p) => p.wartosc as number);
  if (dane.length < 3) return "flat";
  const polowa = Math.floor(dane.length / 2);
  const pierwsza = dane.slice(0, polowa).reduce((a, b) => a + b, 0) / polowa;
  const druga =
    dane.slice(polowa).reduce((a, b) => a + b, 0) / (dane.length - polowa);
  if (druga - pierwsza > 0.5) return "up";
  if (pierwsza - druga > 0.5) return "down";
  return "flat";
}

// ============================================================
// Strona statystyk
// ============================================================

const ZAKRESY = [
  { etykieta: "14 dni", dni: 14 },
  { etykieta: "30 dni", dni: 30 },
] as const;

export default function StatystykiPage() {
  const { ustawienia } = useStore();
  const [zakres, setZakres] = useState<14 | 30>(14);
  const [wpisy, setWpisy] = useState<WpisDnia[]>([]);
  const [ladowanie, setLadowanie] = useState(true);

  useEffect(() => {
    setLadowanie(true);
    const dataDo = dzisiaj();
    const dataOd = przesunDate(dataDo, -(zakres - 1));
    pobierzWpisyZakresu(dataOd, dataDo)
      .then(setWpisy)
      .finally(() => setLadowanie(false));
  }, [zakres]);

  const dataDo = dzisiaj();
  const dataOd = przesunDate(dataDo, -(zakres - 1));
  const dni: string[] = [];
  for (let i = 0; i < zakres; i++) dni.push(przesunDate(dataOd, i));

  const mapa = new Map(wpisy.map((w) => [w.data, w]));
  const serieNastroj: PunktWykresu[] = dni.map((d) => ({
    data: d,
    wartosc: mapa.get(d)?.poranna?.nastrojPoPobudzeniu,
  }));
  const serieFocus: PunktWykresu[] = dni.map((d) => ({
    data: d,
    wartosc: mapa.get(d)?.wieczorna?.focus,
  }));
  const serieEnergia: PunktWykresu[] = dni.map((d) => ({
    data: d,
    wartosc: mapa.get(d)?.wieczorna?.energia,
  }));
  const serieSpokoj: PunktWykresu[] = dni.map((d) => ({
    data: d,
    wartosc: mapa.get(d)?.wieczorna?.spokoj,
  }));
  const ostatniWpis = wpisy[wpisy.length - 1];

  if (ladowanie) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="w-8 h-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 px-4 pt-8 pb-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-100">Statystyki</h1>
        <div className="flex bg-slate-800 rounded-xl p-1 gap-1">
          {ZAKRESY.map(({ etykieta, dni: d }) => (
            <button
              key={d}
              onClick={() => setZakres(d)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                zakres === d
                  ? "bg-emerald-500 text-white"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {etykieta}
            </button>
          ))}
        </div>
      </div>

      {/* Smart Insights — na górze */}
      <SmartInsights wpisy={wpisy} ustawienia={ustawienia} />

      {/* Karty średnich */}
      <KartkiPodsumowania wpisy={wpisy} />

      {/* Wykresy */}
      <KartaWykresu
        tytul="Nastrój poranny"
        ikona="😊"
        punkty={serieNastroj}
        kolor="#f59e0b"
        aktualnaWartosc={ostatniWpis?.poranna?.nastrojPoPobudzeniu}
        trend={obliczTrend(serieNastroj)}
      />
      <KartaWykresu
        tytul="Focus / Skupienie"
        ikona="🎯"
        punkty={serieFocus}
        kolor="#60a5fa"
        aktualnaWartosc={ostatniWpis?.wieczorna?.focus}
        trend={obliczTrend(serieFocus)}
      />
      <KartaWykresu
        tytul="Poziom energii"
        ikona="⚡"
        punkty={serieEnergia}
        kolor="#f59e0b"
        aktualnaWartosc={ostatniWpis?.wieczorna?.energia}
        trend={obliczTrend(serieEnergia)}
      />
      <KartaWykresu
        tytul="Spokój / Brak lęku"
        ikona="🕊️"
        punkty={serieSpokoj}
        kolor="#10b981"
        aktualnaWartosc={ostatniWpis?.wieczorna?.spokoj}
        trend={obliczTrend(serieSpokoj)}
      />

      {/* Porównanie */}
      <PorownanieDawkaPrzerwa wpisy={wpisy} ustawienia={ustawienia} />
    </div>
  );
}
