"use client";

import { useMemo } from "react";
import {
  Pill,
  Sunrise,
  Moon,
  PenLine,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { useStore } from "@/store";
import AnkietaModal from "@/components/AnkietaModal";
import {
  dzisiaj,
  ostatnie7Dni,
  krotkaNazwaDnia,
  powitanie,
  poraDnia,
  formatujDatePL,
  formatujDawke,
  obliczTypDnia,
} from "@/lib/protokol";

// ============================================================
// Pasek 7 dni tygodnia
// ============================================================

function PasekTygodnia() {
  const { wpisDzisiaj, ustawienia } = useStore();
  const dni = ostatnie7Dni();
  const dzien = dzisiaj();

  return (
    <div className="flex justify-between gap-1 px-1">
      {dni.map((data) => {
        const czyDzisiaj = data === dzien;
        const typDnia = ustawienia
          ? obliczTypDnia(data, ustawienia)
          : "nieznany";
        const d = new Date(data);

        return (
          <div key={data} className="flex flex-col items-center gap-1.5 flex-1">
            <span className="text-[10px] text-slate-500 font-medium">
              {krotkaNazwaDnia(data)}
            </span>

            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all ${
                czyDzisiaj
                  ? typDnia === "dawka"
                    ? "bg-emerald-500 text-white ring-2 ring-emerald-400/40"
                    : "bg-slate-700 text-slate-100 ring-2 ring-slate-500/40"
                  : typDnia === "dawka"
                    ? "bg-emerald-900/60 text-emerald-400"
                    : "bg-slate-800/60 text-slate-500"
              }`}
            >
              {d.getDate()}
            </div>

            {/* Kropka statusu */}
            <div
              className={`w-1.5 h-1.5 rounded-full ${
                typDnia === "dawka" ? "bg-emerald-500" : "bg-slate-700"
              }`}
            />
          </div>
        );
      })}
    </div>
  );
}

// ============================================================
// Karta statusu dawki (rano)
// ============================================================

function KartaRano() {
  const { wpisDzisiaj, ustawienia, ustawModal } = useStore();
  const juzWzieto = wpisDzisiaj?.poranna?.wzieto && wpisDzisiaj?.godzinaWziecia;
  const maAnkietePoranną = !!wpisDzisiaj?.poranna;
  const typDnia = ustawienia
    ? obliczTypDnia(dzisiaj(), ustawienia)
    : "nieznany";

  if (juzWzieto) {
    return (
      <div className="bg-emerald-950/60 border border-emerald-800/60 rounded-2xl p-5 flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <CheckCircle2 size={18} className="text-emerald-400" />
          <span className="text-sm font-semibold text-emerald-400">
            Dawka przyjęta
          </span>
        </div>
        <div className="flex items-center gap-4 text-sm text-slate-400">
          <span className="flex items-center gap-1.5">
            <Clock size={13} />
            {wpisDzisiaj.godzinaWziecia}
          </span>
          <span className="flex items-center gap-1.5">
            <Pill size={13} />
            {formatujDawke(wpisDzisiaj.poranna!.dawka)}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-5 flex flex-col gap-4">
      <div className="flex items-start gap-3">
        <div className="p-2 bg-amber-950 rounded-xl">
          <Sunrise size={18} className="text-amber-400" />
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-100">
            Poranek czeka na Ciebie
          </p>
          <p className="text-xs text-slate-500 mt-0.5">
            {typDnia === "dawka"
              ? `Zaplanowano dawkę: ${formatujDawke(ustawienia?.domyslnaDawka ?? 0.15)}`
              : "Dziś dzień przerwy – bez dawki"}
          </p>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => ustawModal("ankietaPoranna")}
          className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 rounded-xl text-sm font-semibold text-white transition-all active:scale-[0.98] flex items-center justify-center gap-1.5"
        >
          <Sunrise size={15} />
          Ankieta poranna
        </button>
      </div>
    </div>
  );
}

// ============================================================
// Karta statusu południe
// ============================================================

function KartaPoludnie() {
  const { wpisDzisiaj, ustawModal } = useStore();

  return (
    <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-5 flex flex-col gap-4">
      {wpisDzisiaj?.poranna ? (
        <div className="flex items-start gap-3">
          <div className="p-2 bg-emerald-950 rounded-xl">
            <CheckCircle2 size={18} className="text-emerald-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-100">
              Ankieta poranna wypełniona
            </p>
            <div className="flex gap-3 mt-1">
              <span className="text-xs text-slate-400">
                💤 Sen:{" "}
                <strong className="text-slate-200">
                  {wpisDzisiaj.poranna.jakoscSnu}/10
                </strong>
              </span>
              <span className="text-xs text-slate-400">
                😊 Nastrój:{" "}
                <strong className="text-slate-200">
                  {wpisDzisiaj.poranna.nastrojPoPobudzeniu}/10
                </strong>
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex items-start gap-3">
          <div className="p-2 bg-amber-950 rounded-xl">
            <Sunrise size={18} className="text-amber-400" />
          </div>
          <p className="text-sm text-slate-400">
            Brak ankiety porannej – możesz ją teraz wypełnić
          </p>
        </div>
      )}

      <button
        onClick={() => ustawModal("szybkaMysl")}
        className="w-full py-3 bg-slate-700 hover:bg-slate-600 active:bg-slate-700 rounded-xl text-sm font-medium text-slate-200 transition-all active:scale-[0.98] flex items-center justify-center gap-1.5"
      >
        <PenLine size={15} />
        Szybka myśl
      </button>
    </div>
  );
}

// ============================================================
// Karta wieczorna
// ============================================================

function KartaWieczor() {
  const { wpisDzisiaj, ustawModal } = useStore();
  const maWieczorna = !!wpisDzisiaj?.wieczorna;

  if (maWieczorna) {
    return (
      <div className="bg-blue-950/60 border border-blue-800/60 rounded-2xl p-5 flex flex-col gap-3">
        <div className="flex items-center gap-2 mb-1">
          <CheckCircle2 size={18} className="text-blue-400" />
          <span className="text-sm font-semibold text-blue-400">
            Dzień zamknięty
          </span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[
            {
              ikona: "🎯",
              etykieta: "Focus",
              wartosc: wpisDzisiaj!.wieczorna!.focus,
            },
            {
              ikona: "⚡",
              etykieta: "Energia",
              wartosc: wpisDzisiaj!.wieczorna!.energia,
            },
            {
              ikona: "🕊️",
              etykieta: "Spokój",
              wartosc: wpisDzisiaj!.wieczorna!.spokoj,
            },
          ].map(({ ikona, etykieta, wartosc }) => (
            <div
              key={etykieta}
              className="bg-slate-900/60 rounded-xl p-2.5 text-center"
            >
              <p className="text-base">{ikona}</p>
              <p className="text-lg font-bold text-slate-100">{wartosc}</p>
              <p className="text-[10px] text-slate-500">{etykieta}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-5 flex flex-col gap-4">
      <div className="flex items-start gap-3">
        <div className="p-2 bg-blue-950 rounded-xl">
          <Moon size={18} className="text-blue-400" />
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-100">
            Czas na podsumowanie dnia
          </p>
          <p className="text-xs text-slate-500 mt-0.5">
            Jak minął dzisiejszy dzień?
          </p>
        </div>
      </div>

      <button
        onClick={() => ustawModal("ankietaWieczorna")}
        className="w-full py-3 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-700/50 active:scale-[0.98] rounded-xl text-sm font-semibold text-blue-300 transition-all flex items-center justify-center gap-1.5"
      >
        <Moon size={15} />
        Ankieta wieczorna
      </button>
    </div>
  );
}

// ============================================================
// Szybkie myśli
// ============================================================

function SzybkieMysli() {
  const { wpisDzisiaj } = useStore();
  const mysli = wpisDzisiaj?.szybkieMysli ?? [];

  if (mysli.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-1">
        Szybkie myśli z dziś
      </h3>
      <div className="flex flex-col gap-2">
        {mysli.map((m, i) => (
          <div
            key={i}
            className="bg-slate-800/60 border border-slate-700 rounded-xl px-4 py-3"
          >
            <p className="text-xs text-slate-500 mb-1">{m.godzina}</p>
            <p className="text-sm text-slate-200">{m.tresc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// Strona Główna
// ============================================================

export default function StronaGlowna() {
  const { wpisDzisiaj, ladowanieWpisu, ustawienia } = useStore();
  const pora = poraDnia();
  const dataFormatowana = formatujDatePL(dzisiaj());
  const typDnia = ustawienia ? obliczTypDnia(dzisiaj(), ustawienia) : null;

  if (ladowanieWpisu) {
    return (
      <div className="flex items-center justify-center min-h-dvh">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
          <p className="text-sm text-slate-500">Ładowanie…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 px-4 pt-8 pb-4">
      {/* Nagłówek */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-2xl font-bold text-slate-100">
              {powitanie()} 👋
            </p>
            <p className="text-sm text-slate-500 mt-0.5">{dataFormatowana}</p>
          </div>

          {/* Badge typu dnia */}
          {typDnia && (
            <div
              className={`px-3 py-1.5 rounded-full text-xs font-semibold ${
                typDnia === "dawka"
                  ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                  : "bg-slate-800 text-slate-400 border border-slate-700"
              }`}
            >
              {typDnia === "dawka" ? "💊 Dawka" : "⏸️ Przerwa"}
            </div>
          )}
        </div>
      </div>

      {/* Pasek 7 dni */}
      <div className="bg-slate-900 rounded-2xl p-4 border border-slate-800">
        <PasekTygodnia />
      </div>

      {/* Dynamiczna karta dnia */}
      {pora === "rano" && <KartaRano />}
      {pora === "poludnie" && <KartaPoludnie />}
      {pora === "wieczor" && (
        <>
          <KartaPoludnie />
          <KartaWieczor />
        </>
      )}

      {/* Szybkie myśli */}
      <SzybkieMysli />

      {/* Modals ankiet */}
      <AnkietaModal />
    </div>
  );
}
