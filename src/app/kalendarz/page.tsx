"use client";

import { useState, useEffect, useCallback } from "react";
import {
  ChevronLeft,
  ChevronRight,
  X,
  Moon,
  Sun,
  PenLine,
  Search,
} from "lucide-react";
import { useStore } from "@/store";
import AnkietaModal from "@/components/AnkietaModal";
import { TagiLista } from "@/components/ChmurkaTagow";
import { OcenaBadge } from "@/components/OcenaKropki";
import { useHaptic } from "@/hooks/useHaptic";
import {
  dniMiesiaca,
  obliczTypDnia,
  dzisiaj,
  nazwaMiesiaca,
  formatujDatePL,
  formatujDawke,
  krotkaNazwaDnia,
} from "@/lib/protokol";
import { pobierzWpisyZakresu } from "@/lib/db";
import type { WpisDnia, FiltrKalendarza } from "@/types";

const NAZWY_DNI = ["Pn", "Wt", "Śr", "Cz", "Pt", "Sb", "Nd"];

// ============================================================
// Heatmapa — kolor tła komórki wg nastroju porannego
// ============================================================

function kolorHeatmapy(nastrojPoranny: number | undefined): string {
  if (nastrojPoranny === undefined) return "";
  // 0–2.5: rose, 2.5–5: amber, 5–7.5: emerald słaby, 7.5–10: emerald mocny
  if (nastrojPoranny >= 8) return "bg-emerald-900/50";
  if (nastrojPoranny >= 6) return "bg-emerald-900/25";
  if (nastrojPoranny >= 4) return "bg-amber-900/25";
  return "bg-rose-900/25";
}

// ============================================================
// Panel szczegółów dnia (bottom sheet)
// ============================================================

function PanelSzczegolowDnia({
  data,
  wpis,
  onZamknij,
}: {
  data: string;
  wpis: WpisDnia | undefined;
  onZamknij: () => void;
}) {
  const { ustawModal } = useStore();

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm animate-fade-in"
        onClick={onZamknij}
        aria-hidden="true"
      />
      <div className="fixed bottom-0 left-0 right-0 z-50 flex justify-center">
        <div
          className="w-full max-w-md bg-slate-900 rounded-t-3xl border-t border-slate-700 animate-slide-up"
          style={{ paddingBottom: "env(safe-area-inset-bottom, 16px)" }}
        >
          <div className="flex justify-center pt-3">
            <div className="w-10 h-1 rounded-full bg-slate-700" />
          </div>

          <div className="flex items-center justify-between px-5 py-4">
            <div>
              <p className="text-base font-semibold text-slate-100">
                {formatujDatePL(data)}
              </p>
              <div className="flex items-center gap-2 mt-0.5">
                <p className="text-xs text-slate-500">
                  {krotkaNazwaDnia(data)}
                </p>
                {wpis?.typDnia && (
                  <span
                    className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full border ${
                      wpis.typDnia === "dawka"
                        ? "bg-emerald-950 border-emerald-800 text-emerald-400"
                        : "bg-slate-800 border-slate-700 text-slate-500"
                    }`}
                  >
                    {wpis.typDnia === "dawka" ? "💊 Dawka" : "⏸️ Przerwa"}
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={onZamknij}
              className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-200"
            >
              <X size={16} />
            </button>
          </div>

          <div className="px-5 pb-6 flex flex-col gap-4 max-h-[65dvh] overflow-y-auto">
            {/* Ankieta poranna */}
            {wpis?.poranna ? (
              <div className="bg-slate-800 rounded-2xl p-4 flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <Sun size={14} className="text-amber-400" />
                  <span className="text-xs font-semibold text-amber-400 uppercase tracking-wide">
                    Ankieta poranna
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <MetrykaSzczegol
                    etykieta="Wzięto dawkę"
                    wartosc={
                      wpis.poranna.wzieto
                        ? `Tak – ${formatujDawke(wpis.poranna.dawka)}`
                        : "Nie"
                    }
                  />
                  {wpis.godzinaWziecia && (
                    <MetrykaSzczegol
                      etykieta="Godzina"
                      wartosc={wpis.godzinaWziecia}
                    />
                  )}
                  <MetrykaSzczegol
                    etykieta="Jakość snu"
                    wartosc={<OcenaBadge wartosc={wpis.poranna.jakoscSnu} />}
                  />
                  <MetrykaSzczegol
                    etykieta="Nastrój rano"
                    wartosc={
                      <OcenaBadge wartosc={wpis.poranna.nastrojPoPobudzeniu} />
                    }
                  />
                </div>
                {wpis.poranna.intencja && (
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Intencja</p>
                    <p className="text-sm text-slate-300 italic">
                      „{wpis.poranna.intencja}"
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-slate-800/40 border border-dashed border-slate-700 rounded-2xl p-4 text-center">
                <p className="text-sm text-slate-500">Brak ankiety porannej</p>
                {data === dzisiaj() && (
                  <button
                    onClick={() => {
                      onZamknij();
                      ustawModal("ankietaPoranna");
                    }}
                    className="mt-1.5 text-xs text-emerald-400 hover:text-emerald-300"
                  >
                    Wypełnij teraz →
                  </button>
                )}
              </div>
            )}

            {/* Ankieta wieczorna */}
            {wpis?.wieczorna ? (
              <div className="bg-slate-800 rounded-2xl p-4 flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <Moon size={14} className="text-blue-400" />
                  <span className="text-xs font-semibold text-blue-400 uppercase tracking-wide">
                    Ankieta wieczorna
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <MetrykaSzczegol
                    etykieta="Focus"
                    wartosc={<OcenaBadge wartosc={wpis.wieczorna.focus} />}
                  />
                  <MetrykaSzczegol
                    etykieta="Energia"
                    wartosc={<OcenaBadge wartosc={wpis.wieczorna.energia} />}
                  />
                  <MetrykaSzczegol
                    etykieta="Spokój"
                    wartosc={<OcenaBadge wartosc={wpis.wieczorna.spokoj} />}
                  />
                </div>
                {/* Tagi */}
                {wpis.wieczorna.tagi && wpis.wieczorna.tagi.length > 0 && (
                  <TagiLista tagi={wpis.wieczorna.tagi} />
                )}
                {wpis.wieczorna.refleksje && (
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Refleksje</p>
                    <p className="text-sm text-slate-300 italic">
                      „{wpis.wieczorna.refleksje}"
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-slate-800/40 border border-dashed border-slate-700 rounded-2xl p-4 text-center">
                <p className="text-sm text-slate-500">
                  Brak ankiety wieczornej
                </p>
                {data === dzisiaj() && (
                  <button
                    onClick={() => {
                      onZamknij();
                      ustawModal("ankietaWieczorna");
                    }}
                    className="mt-1.5 text-xs text-blue-400 hover:text-blue-300"
                  >
                    Wypełnij teraz →
                  </button>
                )}
              </div>
            )}

            {/* Szybkie myśli */}
            {(wpis?.szybkieMysli?.length ?? 0) > 0 && (
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <PenLine size={13} className="text-violet-400" />
                  <span className="text-xs font-semibold text-violet-400 uppercase tracking-wide">
                    Myśli
                  </span>
                </div>
                {wpis!.szybkieMysli.map((m, i) => (
                  <div key={i} className="bg-slate-800 rounded-xl px-3 py-2.5">
                    <p className="text-[10px] text-slate-500 mb-0.5">
                      {m.godzina}
                    </p>
                    <p className="text-sm text-slate-200">{m.tresc}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

function MetrykaSzczegol({
  etykieta,
  wartosc,
}: {
  etykieta: string;
  wartosc: string | React.ReactNode;
}) {
  return (
    <div className="bg-slate-900/60 rounded-xl p-2.5">
      <p className="text-[10px] text-slate-500">{etykieta}</p>
      <div className="mt-0.5">
        {typeof wartosc === "string" ? (
          <p className="text-sm font-semibold text-slate-100">{wartosc}</p>
        ) : (
          wartosc
        )}
      </div>
    </div>
  );
}

// ============================================================
// Strona kalendarza
// ============================================================

export default function KalendarzPage() {
  const { ustawienia } = useStore();
  const haptic = useHaptic();
  const teraz = new Date();
  const [rok, setRok] = useState(teraz.getFullYear());
  const [miesiac, setMiesiac] = useState(teraz.getMonth());
  const [wpisy, setWpisy] = useState<Map<string, WpisDnia>>(new Map());
  const [wybranyDzien, setWybranyDzien] = useState<string | null>(null);
  const [filtr, setFiltr] = useState<FiltrKalendarza>("wszystkie");
  const [szukaj, setSzukaj] = useState("");
  const dzien = dzisiaj();

  // Ładuj wpisy miesiąca
  useEffect(() => {
    const dataOd = `${rok}-${String(miesiac + 1).padStart(2, "0")}-01`;
    const ostatniDzien = new Date(rok, miesiac + 1, 0).getDate();
    const dataDo = `${rok}-${String(miesiac + 1).padStart(2, "0")}-${String(ostatniDzien).padStart(2, "0")}`;
    pobierzWpisyZakresu(dataOd, dataDo).then((lista) => {
      const mapa = new Map<string, WpisDnia>();
      lista.forEach((w) => mapa.set(w.data, w));
      setWpisy(mapa);
    });
  }, [rok, miesiac]);

  const dni = dniMiesiaca(rok, miesiac);
  const pierwszyDzien = new Date(rok, miesiac, 1).getDay();
  const offset = pierwszyDzien === 0 ? 6 : pierwszyDzien - 1;

  const poprzedniMiesiac = useCallback(() => {
    haptic.tap();
    if (miesiac === 0) {
      setRok((r) => r - 1);
      setMiesiac(11);
    } else setMiesiac((m) => m - 1);
  }, [miesiac, haptic]);

  const nastepnyMiesiac = useCallback(() => {
    haptic.tap();
    if (miesiac === 11) {
      setRok((r) => r + 1);
      setMiesiac(0);
    } else setMiesiac((m) => m + 1);
  }, [miesiac, haptic]);

  // Czy dzień pasuje do filtrów
  const czyPasuje = useCallback(
    (data: string, typDnia: "dawka" | "przerwa" | "nieznany") => {
      if (filtr === "dawka" && typDnia !== "dawka") return false;
      if (filtr === "przerwa" && typDnia !== "przerwa") return false;
      if (szukaj.trim()) {
        const q = szukaj.toLowerCase();
        const wpis = wpisy.get(data);
        if (!wpis) return false;
        const wIntencji = wpis.poranna?.intencja?.toLowerCase().includes(q);
        const wRefleksjach = wpis.wieczorna?.refleksje
          ?.toLowerCase()
          .includes(q);
        const wTagach = wpis.wieczorna?.tagi?.some((t) =>
          t.toLowerCase().includes(q),
        );
        const wMytslach = wpis.szybkieMysli?.some((m) =>
          m.tresc.toLowerCase().includes(q),
        );
        return !!(wIntencji || wRefleksjach || wTagach || wMytslach);
      }
      return true;
    },
    [filtr, szukaj, wpisy],
  );

  const wybranyWpis = wybranyDzien ? wpisy.get(wybranyDzien) : undefined;

  const FILTRY: { id: FiltrKalendarza; etykieta: string }[] = [
    { id: "wszystkie", etykieta: "Wszystkie" },
    { id: "dawka", etykieta: "💊 Dawka" },
    { id: "przerwa", etykieta: "⏸️ Przerwa" },
  ];

  return (
    <div className="flex flex-col pt-6 pb-4">
      {/* Nagłówek + nawigacja miesięcy */}
      <div className="flex items-center justify-between px-5 pb-4">
        <h1 className="text-xl font-bold text-slate-100">Kalendarz</h1>
        <div className="flex items-center gap-1">
          <button
            onClick={poprzedniMiesiac}
            className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-200 active:bg-slate-700 transition-colors"
            aria-label="Poprzedni miesiąc"
          >
            <ChevronLeft size={18} />
          </button>
          <span className="text-sm font-semibold text-slate-200 min-w-[110px] text-center">
            {nazwaMiesiaca(miesiac)} {rok}
          </span>
          <button
            onClick={nastepnyMiesiac}
            className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-200 active:bg-slate-700 transition-colors"
            aria-label="Następny miesiąc"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* Filtry */}
      <div className="flex gap-2 px-5 pb-3">
        {FILTRY.map(({ id, etykieta }) => (
          <button
            key={id}
            onClick={() => {
              haptic.tap();
              setFiltr(id);
            }}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all active:scale-95 ${
              filtr === id
                ? "bg-emerald-500 border-emerald-400 text-white"
                : "bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600"
            }`}
          >
            {etykieta}
          </button>
        ))}
      </div>

      {/* Wyszukiwarka */}
      <div className="px-5 pb-4">
        <div className="relative">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
          />
          <input
            type="search"
            value={szukaj}
            onChange={(e) => setSzukaj(e.target.value)}
            placeholder="Szukaj w tagach, notatkach, refleksjach…"
            className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-600 transition-colors"
          />
        </div>
        {szukaj && (
          <p className="text-xs text-slate-500 mt-1.5 px-1">
            Wyniki dla: <span className="text-emerald-400">„{szukaj}"</span>
          </p>
        )}
      </div>

      {/* Nagłówki dni tygodnia */}
      <div className="grid grid-cols-7 px-3 mb-1">
        {NAZWY_DNI.map((n) => (
          <div
            key={n}
            className="text-center text-[11px] font-medium text-slate-600 py-1"
          >
            {n}
          </div>
        ))}
      </div>

      {/* Siatka dni */}
      <div className="grid grid-cols-7 px-3 gap-y-1">
        {Array.from({ length: offset }).map((_, i) => (
          <div key={`e-${i}`} />
        ))}

        {dni.map((data) => {
          const d = new Date(data);
          const typDnia = ustawienia
            ? obliczTypDnia(data, ustawienia)
            : "nieznany";
          const wpis = wpisy.get(data);
          const czyDzisiaj = data === dzien;
          const jestPrzyszly = data > dzien;
          const pasuje = !jestPrzyszly && czyPasuje(data, typDnia);
          const nastrojPoranny = wpis?.poranna?.nastrojPoPobudzeniu;
          const wzieta = wpis?.poranna?.wzieto;

          return (
            <button
              key={data}
              onClick={() => {
                if (!jestPrzyszly && pasuje) {
                  haptic.tap();
                  setWybranyDzien(data);
                }
              }}
              disabled={
                jestPrzyszly || (!pasuje && (filtr !== "wszystkie" || !!szukaj))
              }
              className={`relative flex flex-col items-center justify-center gap-0.5 py-1.5 rounded-xl transition-all active:scale-95
                ${jestPrzyszly ? "opacity-20 cursor-default" : ""}
                ${!pasuje && !jestPrzyszly ? "opacity-20" : ""}
                ${pasuje && !jestPrzyszly ? "hover:bg-slate-800/60 cursor-pointer" : ""}
                ${czyDzisiaj ? "ring-1 ring-emerald-500/70" : ""}
                ${kolorHeatmapy(nastrojPoranny)}
              `}
              aria-label={formatujDatePL(data)}
            >
              {/* Numer dnia */}
              <span
                className={`text-xs font-semibold w-7 h-7 rounded-full flex items-center justify-center ${
                  czyDzisiaj
                    ? typDnia === "dawka"
                      ? "bg-emerald-500 text-white"
                      : "bg-slate-600 text-white"
                    : typDnia === "dawka"
                      ? "text-emerald-400"
                      : "text-slate-400"
                }`}
              >
                {d.getDate()}
              </span>

              {/* Wskaźniki */}
              <div className="flex gap-0.5 h-1.5 items-center">
                {!jestPrzyszly && (
                  <>
                    {/* Dawka — zielona (wzięta) lub ciemnozielona (planowana, nie wzięta) */}
                    <div
                      className={`w-1.5 h-1.5 rounded-full ${
                        typDnia === "dawka"
                          ? wzieta
                            ? "bg-emerald-500"
                            : "bg-emerald-900"
                          : "bg-transparent"
                      }`}
                    />
                    {/* Wieczorna */}
                    {wpis?.wieczorna && (
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                    )}
                    {/* Tagi — fioletowa kropka gdy są jakieś tagi */}
                    {(wpis?.wieczorna?.tagi?.length ?? 0) > 0 && (
                      <div className="w-1.5 h-1.5 rounded-full bg-violet-500" />
                    )}
                  </>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Legenda */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 px-5 mt-5">
        <LegendaEl kolor="bg-emerald-500" etykieta="Dawka wzięta" />
        <LegendaEl kolor="bg-emerald-900" etykieta="Planowana (brak wpisu)" />
        <LegendaEl kolor="bg-blue-500" etykieta="Ankieta wieczorna" />
        <LegendaEl kolor="bg-violet-500" etykieta="Tagi" />
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded-md bg-emerald-900/50" />
          <span className="text-[10px] text-slate-500">Heatmapa nastroju</span>
        </div>
      </div>

      {/* Panel szczegółów */}
      {wybranyDzien && (
        <PanelSzczegolowDnia
          data={wybranyDzien}
          wpis={wybranyWpis}
          onZamknij={() => setWybranyDzien(null)}
        />
      )}

      <AnkietaModal />
    </div>
  );
}

function LegendaEl({ kolor, etykieta }: { kolor: string; etykieta: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className={`w-2 h-2 rounded-full ${kolor}`} />
      <span className="text-[10px] text-slate-500">{etykieta}</span>
    </div>
  );
}
