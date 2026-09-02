"use client";

import { useState } from "react";
import { X, Sun, Moon, Check } from "lucide-react";
import { useStore } from "@/store";
import { dzisiaj } from "@/lib/protokol";
import { useHaptic } from "@/hooks/useHaptic";
import OcenaKropki from "./OcenaKropki";
import ChmurkaTagow from "./ChmurkaTagow";
import { ocenaNaWartosc, wartoscNaOcene } from "@/types";
import type { AnkietaPoranna, AnkietaWieczorna, Ocena, Tag } from "@/types";

// ============================================================
// Ankieta Poranna
// ============================================================

function AnkietaPorannaModal({ onZamknij }: { onZamknij: () => void }) {
  const { zapiszAnkietePoranna, wpisDzisiaj, ustawienia } = useStore();
  const haptic = useHaptic();

  const domyslnaDawka = ustawienia?.domyslnaDawka ?? 0.15;

  const [wzieto, setWzieto] = useState(wpisDzisiaj?.poranna?.wzieto ?? false);
  const [dawka, setDawka] = useState(
    wpisDzisiaj?.poranna?.dawka ?? domyslnaDawka,
  );
  const [jakoscSnu, setJakoscSnu] = useState<Ocena>(
    wartoscNaOcene(wpisDzisiaj?.poranna?.jakoscSnu ?? 7),
  );
  const [nastrojPoranny, setNastrojPoranny] = useState<Ocena>(
    wartoscNaOcene(wpisDzisiaj?.poranna?.nastrojPoPobudzeniu ?? 7),
  );
  const [intencja, setIntencja] = useState(
    wpisDzisiaj?.poranna?.intencja ?? "",
  );
  const [zapisywanie, setZapisywanie] = useState(false);
  const [zapisano, setZapisano] = useState(false);

  const handleWzieto = (val: boolean) => {
    haptic.select();
    setWzieto(val);
  };

  const handleDawka = (d: number) => {
    haptic.tap();
    setDawka(d);
  };

  const handleZapis = async () => {
    setZapisywanie(true);
    try {
      const teraz = new Date();
      const godz = wzieto
        ? `${teraz.getHours().toString().padStart(2, "0")}:${teraz
            .getMinutes()
            .toString()
            .padStart(2, "0")}`
        : undefined;

      const ankieta: AnkietaPoranna = {
        wzieto,
        dawka,
        jakoscSnu: ocenaNaWartosc(jakoscSnu),
        nastrojPoPobudzeniu: ocenaNaWartosc(nastrojPoranny),
        intencja,
      };

      await zapiszAnkietePoranna(dzisiaj(), ankieta, godz);
      haptic.success();
      setZapisano(true);
      setTimeout(() => onZamknij(), 600);
    } finally {
      setZapisywanie(false);
    }
  };

  return (
    <FormularzModal
      tytul="Ankieta poranna"
      ikona={<Sun size={18} className="text-amber-400" />}
      onZamknij={onZamknij}
      onZapis={handleZapis}
      zapisywanie={zapisywanie}
      zapisano={zapisano}
    >
      {/* Czy wzięto dawkę */}
      <div className="flex flex-col gap-3">
        <p className="text-sm font-medium text-slate-300">
          Czy wziąłeś/wzięłaś dawkę?
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => handleWzieto(true)}
            className={`flex-1 py-3.5 rounded-2xl border text-sm font-semibold transition-all active:scale-95 ${
              wzieto
                ? "bg-emerald-500 border-emerald-400 text-white shadow-lg shadow-emerald-900/40"
                : "bg-slate-800 border-slate-700 text-slate-400"
            }`}
          >
            ✓ Tak
          </button>
          <button
            onClick={() => handleWzieto(false)}
            className={`flex-1 py-3.5 rounded-2xl border text-sm font-semibold transition-all active:scale-95 ${
              !wzieto
                ? "bg-slate-600 border-slate-500 text-white"
                : "bg-slate-800 border-slate-700 text-slate-400"
            }`}
          >
            ✗ Nie
          </button>
        </div>

        {/* Dobór dawki — widoczny tylko gdy wzięto */}
        {wzieto && (
          <div className="flex flex-col gap-2 animate-fade-in">
            <div className="flex items-center justify-between">
              <label className="text-xs text-slate-400">Dawka (gramy)</label>
              <span className="text-sm font-bold text-emerald-400">
                {dawka}g
              </span>
            </div>
            <div className="flex gap-1.5">
              {[0.05, 0.1, 0.15, 0.2, 0.25, 0.3].map((d) => (
                <button
                  key={d}
                  onClick={() => handleDawka(d)}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-bold border transition-all active:scale-95 ${
                    dawka === d
                      ? "bg-emerald-500 border-emerald-400 text-white"
                      : "bg-slate-800 border-slate-700 text-slate-500"
                  }`}
                >
                  {d}g
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="h-px bg-slate-800" />

      {/* Oceny 1–5 */}
      <OcenaKropki
        etykieta="💤 Jakość snu"
        wartosc={jakoscSnu}
        onChange={setJakoscSnu}
      />

      <OcenaKropki
        etykieta="😊 Nastrój po przebudzeniu"
        wartosc={nastrojPoranny}
        onChange={setNastrojPoranny}
      />

      <div className="h-px bg-slate-800" />

      {/* Intencja */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-slate-300">
          Intencja na dzisiaj{" "}
          <span className="text-slate-600 font-normal">(opcjonalnie)</span>
        </label>
        <textarea
          value={intencja}
          onChange={(e) => setIntencja(e.target.value)}
          placeholder="Czego chcę dziś doświadczyć lub osiągnąć?"
          rows={3}
          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-600 resize-none focus:outline-none focus:border-emerald-600 transition-colors"
        />
      </div>
    </FormularzModal>
  );
}

// ============================================================
// Ankieta Wieczorna
// ============================================================

function AnkietaWieczornaModal({ onZamknij }: { onZamknij: () => void }) {
  const { zapiszAnkieteWieczorna, wpisDzisiaj } = useStore();
  const haptic = useHaptic();

  const [focus, setFocus] = useState<Ocena>(
    wartoscNaOcene(wpisDzisiaj?.wieczorna?.focus ?? 7),
  );
  const [energia, setEnergia] = useState<Ocena>(
    wartoscNaOcene(wpisDzisiaj?.wieczorna?.energia ?? 7),
  );
  const [spokoj, setSpokoj] = useState<Ocena>(
    wartoscNaOcene(wpisDzisiaj?.wieczorna?.spokoj ?? 7),
  );
  const [tagi, setTagi] = useState<Tag[]>(wpisDzisiaj?.wieczorna?.tagi ?? []);
  const [refleksje, setRefleksje] = useState(
    wpisDzisiaj?.wieczorna?.refleksje ?? "",
  );
  const [zapisywanie, setZapisywanie] = useState(false);
  const [zapisano, setZapisano] = useState(false);

  const handleZapis = async () => {
    setZapisywanie(true);
    try {
      const ankieta: AnkietaWieczorna = {
        focus: ocenaNaWartosc(focus),
        energia: ocenaNaWartosc(energia),
        spokoj: ocenaNaWartosc(spokoj),
        tagi,
        refleksje,
      };
      await zapiszAnkieteWieczorna(dzisiaj(), ankieta);
      haptic.success();
      setZapisano(true);
      setTimeout(() => onZamknij(), 600);
    } finally {
      setZapisywanie(false);
    }
  };

  return (
    <FormularzModal
      tytul="Ankieta wieczorna"
      ikona={<Moon size={18} className="text-blue-400" />}
      onZamknij={onZamknij}
      onZapis={handleZapis}
      zapisywanie={zapisywanie}
      zapisano={zapisano}
    >
      {/* Oceny 1–5 */}
      <OcenaKropki
        etykieta="🎯 Focus / Skupienie"
        wartosc={focus}
        onChange={setFocus}
      />
      <OcenaKropki
        etykieta="⚡ Poziom energii"
        wartosc={energia}
        onChange={setEnergia}
      />
      <OcenaKropki
        etykieta="🕊️ Spokój / Brak lęku"
        wartosc={spokoj}
        onChange={setSpokoj}
      />

      <div className="h-px bg-slate-800" />

      {/* Tagi */}
      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium text-slate-300">
          Jak minął dzień?{" "}
          <span className="text-slate-600 font-normal">(wybierz tagi)</span>
        </p>
        <ChmurkaTagow wybrane={tagi} onChange={setTagi} />
      </div>

      <div className="h-px bg-slate-800" />

      {/* Refleksje */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-slate-300">
          Refleksje i wglądy{" "}
          <span className="text-slate-600 font-normal">(opcjonalnie)</span>
        </label>
        <textarea
          value={refleksje}
          onChange={(e) => setRefleksje(e.target.value)}
          placeholder="Co ciekawego zaobserwowałeś/łaś dziś? Jakie myśli lub uczucia się pojawiły?"
          rows={4}
          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-600 resize-none focus:outline-none focus:border-blue-600 transition-colors"
        />
      </div>
    </FormularzModal>
  );
}

// ============================================================
// Szybka myśl
// ============================================================

function SzybkaMyslModal({ onZamknij }: { onZamknij: () => void }) {
  const { dodajMySl } = useStore();
  const haptic = useHaptic();
  const [tresc, setTresc] = useState("");
  const [zapisywanie, setZapisywanie] = useState(false);
  const [zapisano, setZapisano] = useState(false);

  const handleZapis = async () => {
    if (!tresc.trim()) return;
    setZapisywanie(true);
    try {
      await dodajMySl(dzisiaj(), tresc.trim());
      haptic.success();
      setZapisano(true);
      setTimeout(() => onZamknij(), 600);
    } finally {
      setZapisywanie(false);
    }
  };

  return (
    <FormularzModal
      tytul="Szybka myśl"
      ikona={<span className="text-violet-400 text-base">✍️</span>}
      onZamknij={onZamknij}
      onZapis={handleZapis}
      zapisywanie={zapisywanie}
      zapisano={zapisano}
      disabled={!tresc.trim()}
    >
      <textarea
        value={tresc}
        onChange={(e) => setTresc(e.target.value)}
        placeholder="Co teraz czujesz lub myślisz?"
        rows={5}
        autoFocus
        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-600 resize-none focus:outline-none focus:border-violet-600 transition-colors"
      />
    </FormularzModal>
  );
}

// ============================================================
// Wspólny wrapper
// ============================================================

interface FormularzModalProps {
  tytul: string;
  ikona: React.ReactNode;
  onZamknij: () => void;
  onZapis: () => void;
  zapisywanie: boolean;
  zapisano: boolean;
  disabled?: boolean;
  children: React.ReactNode;
}

function FormularzModal({
  tytul,
  ikona,
  onZamknij,
  onZapis,
  zapisywanie,
  zapisano,
  disabled = false,
  children,
}: FormularzModalProps) {
  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm animate-fade-in"
        onClick={onZamknij}
        aria-hidden="true"
      />
      <div
        className="fixed bottom-0 left-0 right-0 z-50 flex justify-center"
        role="dialog"
        aria-modal="true"
        aria-label={tytul}
      >
        <div
          className="w-full max-w-md bg-slate-900 rounded-t-3xl border-t border-slate-700 animate-slide-up max-h-[92dvh] flex flex-col"
          style={{ paddingBottom: "env(safe-area-inset-bottom, 16px)" }}
        >
          <div className="flex justify-center pt-3 shrink-0">
            <div className="w-10 h-1 rounded-full bg-slate-700" />
          </div>

          <div className="flex items-center justify-between px-5 py-4 shrink-0">
            <div className="flex items-center gap-2">
              {ikona}
              <h2 className="text-base font-semibold text-slate-100">
                {tytul}
              </h2>
            </div>
            <button
              onClick={onZamknij}
              className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-200 transition-colors"
              aria-label="Zamknij"
            >
              <X size={16} />
            </button>
          </div>

          <div className="overflow-y-auto flex-1 px-5 flex flex-col gap-5 pb-2">
            {children}
          </div>

          <div className="px-5 pt-4 pb-2 shrink-0">
            <button
              onClick={onZapis}
              disabled={zapisywanie || disabled || zapisano}
              className={`w-full py-4 rounded-2xl font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
                zapisano
                  ? "bg-emerald-700 text-white"
                  : disabled
                    ? "bg-slate-800 text-slate-600 cursor-not-allowed"
                    : "bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-white active:scale-[0.98]"
              }`}
            >
              {zapisano ? (
                <>
                  <Check size={16} />
                  Zapisano!
                </>
              ) : zapisywanie ? (
                "Zapisywanie…"
              ) : (
                "Zapisz"
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ============================================================
// Router modalów
// ============================================================

export default function AnkietaModal() {
  const { aktywnyModal, ustawModal } = useStore();
  const zamknij = () => ustawModal(null);

  if (aktywnyModal === "ankietaPoranna")
    return <AnkietaPorannaModal onZamknij={zamknij} />;
  if (aktywnyModal === "ankietaWieczorna")
    return <AnkietaWieczornaModal onZamknij={zamknij} />;
  if (aktywnyModal === "szybkaMysl")
    return <SzybkaMyslModal onZamknij={zamknij} />;
  return null;
}
