"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Shield,
  Download,
  Upload,
  Trash2,
  Bell,
  BellOff,
  ChevronRight,
  Check,
  AlertTriangle,
  BellRing,
} from "lucide-react";
import { useStore } from "@/store";
import { eksportujDane, importujDane, wyczyscBaze } from "@/lib/db";
import type { Ustawienia, Protokol } from "@/types";

// ============================================================
// Sekcja Powiadomień Web
// ============================================================

type StatusPowiadomien =
  | "nieznany"
  | "niedostepne"
  | "odmowa"
  | "oczekuje"
  | "przyznano";

function SekcjaPowiadomien({
  ustawienia,
  onChange,
}: {
  ustawienia: Ustawienia;
  onChange: (u: Ustawienia) => void;
}) {
  const [status, setStatus] = useState<StatusPowiadomien>("nieznany");

  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      setStatus("niedostepne");
      return;
    }
    setStatus(
      Notification.permission === "granted"
        ? "przyznano"
        : Notification.permission === "denied"
          ? "odmowa"
          : "oczekuje",
    );
  }, []);

  const prosOUprawnienia = useCallback(async () => {
    if (!("Notification" in window)) return;
    const perm = await Notification.requestPermission();
    setStatus(
      perm === "granted"
        ? "przyznano"
        : perm === "denied"
          ? "odmowa"
          : "oczekuje",
    );
    if (perm === "granted") {
      onChange({ ...ustawienia, powiadomieniaWlaczone: true });
      // Powitalne powiadomienie testowe
      new Notification("MikroDziennik 🌿", {
        body: "Powiadomienia włączone! Będziesz otrzymywać przypomnienia o ankietach.",
        icon: "/icons/icon-192.svg",
      });
    }
  }, [ustawienia, onChange]);

  const testPowiadomienie = useCallback(() => {
    if (Notification.permission !== "granted") return;
    new Notification("MikroDziennik – test 🌿", {
      body: `Przypomnienie: czas na ankietę wieczorną! (${new Date().toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" })})`,
      icon: "/icons/icon-192.svg",
    });
  }, []);

  const toggle = useCallback(async () => {
    if (!ustawienia.powiadomieniaWlaczone) {
      if (status === "przyznano") {
        onChange({ ...ustawienia, powiadomieniaWlaczone: true });
      } else {
        await prosOUprawnienia();
      }
    } else {
      onChange({ ...ustawienia, powiadomieniaWlaczone: false });
    }
  }, [ustawienia, onChange, status, prosOUprawnienia]);

  const wlaczone = ustawienia.powiadomieniaWlaczone && status === "przyznano";

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
      {/* Toggle główny */}
      <button
        onClick={toggle}
        className="w-full flex items-center gap-4 px-4 py-4 hover:bg-slate-800/50 active:bg-slate-800 transition-colors text-left"
      >
        <div className="shrink-0 text-slate-400">
          {wlaczone ? (
            <Bell size={18} className="text-emerald-400" />
          ) : (
            <BellOff size={18} />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-slate-200">
            {wlaczone ? "Powiadomienia włączone" : "Powiadomienia wyłączone"}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">
            {status === "niedostepne" &&
              "Przeglądarka nie obsługuje powiadomień"}
            {status === "odmowa" &&
              "Dostęp zablokowany – zmień w ustawieniach przeglądarki"}
            {status === "oczekuje" && "Tapnij, aby przyznać uprawnienia"}
            {status === "przyznano" && !wlaczone && "Tapnij, aby włączyć"}
            {wlaczone && "Będziesz otrzymywać przypomnienia o ankietach"}
          </p>
        </div>
        <div
          className={`w-10 h-6 rounded-full transition-colors relative shrink-0 ${
            wlaczone ? "bg-emerald-500" : "bg-slate-700"
          }`}
        >
          <div
            className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
              wlaczone ? "translate-x-4" : "translate-x-0.5"
            }`}
          />
        </div>
      </button>

      {/* Godziny — widoczne gdy włączone */}
      {wlaczone && (
        <>
          <div className="px-4 py-3 border-t border-slate-800 flex flex-col gap-1.5">
            <label className="text-xs text-slate-400">
              🌅 Przypomnienie poranne
            </label>
            <input
              type="time"
              value={ustawienia.godzinaRannaPowiadomienie}
              onChange={(e) =>
                onChange({
                  ...ustawienia,
                  godzinaRannaPowiadomienie: e.target.value,
                })
              }
              className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-emerald-600"
            />
          </div>
          <div className="px-4 py-3 border-t border-slate-800 flex flex-col gap-1.5">
            <label className="text-xs text-slate-400">
              🌙 Przypomnienie wieczorne
            </label>
            <input
              type="time"
              value={ustawienia.godzinaWieczornaPowiadomienie}
              onChange={(e) =>
                onChange({
                  ...ustawienia,
                  godzinaWieczornaPowiadomienie: e.target.value,
                })
              }
              className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-emerald-600"
            />
          </div>
          <div className="px-4 py-3 border-t border-slate-800">
            <p className="text-xs text-slate-500 mb-2">
              Powiadomienia działają gdy aplikacja jest otwarta w przeglądarce.
            </p>
            <button
              onClick={testPowiadomienie}
              className="flex items-center gap-2 text-xs text-emerald-400 hover:text-emerald-300 font-medium transition-colors"
            >
              <BellRing size={13} />
              Wyślij testowe powiadomienie
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ============================================================
// Sekcja UI
// ============================================================

function Sekcja({
  tytul,
  children,
}: {
  tytul: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-1 mb-1">
        {tytul}
      </p>
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        {children}
      </div>
    </div>
  );
}

function WierszUstawien({
  ikona,
  etykieta,
  opis,
  prawy,
  onClick,
  niebezpieczny,
}: {
  ikona: React.ReactNode;
  etykieta: string;
  opis?: string;
  prawy?: React.ReactNode;
  onClick?: () => void;
  niebezpieczny?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-4 px-4 py-4 hover:bg-slate-800/50 active:bg-slate-800 transition-colors text-left [&:not(:last-child)]:border-b [&:not(:last-child)]:border-slate-800 ${
        niebezpieczny ? "text-rose-400" : "text-slate-200"
      }`}
    >
      <div
        className={`shrink-0 ${niebezpieczny ? "text-rose-400" : "text-slate-400"}`}
      >
        {ikona}
      </div>
      <div className="flex-1 min-w-0">
        <p
          className={`text-sm font-medium ${niebezpieczny ? "text-rose-400" : "text-slate-200"}`}
        >
          {etykieta}
        </p>
        {opis && <p className="text-xs text-slate-500 mt-0.5">{opis}</p>}
      </div>
      <div className="shrink-0 text-slate-500">
        {prawy ?? (onClick && <ChevronRight size={16} />)}
      </div>
    </button>
  );
}

// ============================================================
// Wybór protokołu
// ============================================================

const PROTOKOLY: { id: Protokol; nazwa: string; opis: string; cykl: string }[] =
  [
    {
      id: "fadiman",
      nazwa: "Protokół Fadimana",
      opis: "1 dzień dawki, 2 dni przerwy",
      cykl: "Cykl 3-dniowy",
    },
    {
      id: "stamets",
      nazwa: "Protokół Stametsa",
      opis: "4 dni dawki, 3 dni przerwy",
      cykl: "Cykl 7-dniowy",
    },
    {
      id: "wlasny",
      nazwa: "Własny protokół",
      opis: "Dostosuj cykl do swoich potrzeb",
      cykl: "Własny cykl",
    },
  ];

function SekcjaProtokolU({
  ustawienia,
  onChange,
}: {
  ustawienia: Ustawienia;
  onChange: (u: Ustawienia) => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      {PROTOKOLY.map(({ id, nazwa, opis, cykl }) => {
        const aktywny = ustawienia.protokol === id;
        return (
          <button
            key={id}
            onClick={() => onChange({ ...ustawienia, protokol: id })}
            className={`flex items-center gap-4 p-4 rounded-2xl border text-left transition-all ${
              aktywny
                ? "bg-emerald-950/60 border-emerald-700"
                : "bg-slate-900 border-slate-800 hover:border-slate-700"
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                aktywny
                  ? "border-emerald-500 bg-emerald-500"
                  : "border-slate-600"
              }`}
            >
              {aktywny && (
                <Check size={11} className="text-white" strokeWidth={3} />
              )}
            </div>
            <div className="flex-1">
              <p
                className={`text-sm font-semibold ${aktywny ? "text-emerald-400" : "text-slate-200"}`}
              >
                {nazwa}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">{opis}</p>
            </div>
            <span className="text-[10px] text-slate-600">{cykl}</span>
          </button>
        );
      })}

      {/* Własny protokół – pola */}
      {ustawienia.protokol === "wlasny" && (
        <div className="bg-slate-900 border border-slate-700 rounded-2xl p-4 flex flex-col gap-3 animate-scale-in">
          <p className="text-xs text-slate-400">
            Konfiguracja własnego protokołu
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-slate-400">Dni z dawką</label>
              <input
                type="number"
                min={1}
                max={7}
                value={ustawienia.protokolWlasny.dniDawki}
                onChange={(e) =>
                  onChange({
                    ...ustawienia,
                    protokolWlasny: {
                      ...ustawienia.protokolWlasny,
                      dniDawki: Number(e.target.value),
                    },
                  })
                }
                className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-emerald-600 text-center"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-slate-400">Dni przerwy</label>
              <input
                type="number"
                min={1}
                max={14}
                value={ustawienia.protokolWlasny.dniPrzerwy}
                onChange={(e) =>
                  onChange({
                    ...ustawienia,
                    protokolWlasny: {
                      ...ustawienia.protokolWlasny,
                      dniPrzerwy: Number(e.target.value),
                    },
                  })
                }
                className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-emerald-600 text-center"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// Dialog potwierdzenia
// ============================================================

function DialogPotwierdzenia({
  tytul,
  tresc,
  onPotwierdzenie,
  onAnulowanie,
}: {
  tytul: string;
  tresc: string;
  onPotwierdzenie: () => void;
  onAnulowanie: () => void;
}) {
  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm animate-fade-in"
        onClick={onAnulowanie}
        aria-hidden="true"
      />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
        <div className="w-full max-w-sm bg-slate-900 border border-slate-700 rounded-3xl p-6 flex flex-col gap-4 animate-scale-in">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-rose-950 rounded-xl">
              <AlertTriangle size={18} className="text-rose-400" />
            </div>
            <h3 className="text-base font-semibold text-slate-100">{tytul}</h3>
          </div>
          <p className="text-sm text-slate-400">{tresc}</p>
          <div className="flex gap-3">
            <button
              onClick={onAnulowanie}
              className="flex-1 py-3 bg-slate-800 rounded-xl text-sm font-medium text-slate-300 hover:bg-slate-700 transition-colors"
            >
              Anuluj
            </button>
            <button
              onClick={onPotwierdzenie}
              className="flex-1 py-3 bg-rose-500 rounded-xl text-sm font-semibold text-white hover:bg-rose-400 active:bg-rose-600 transition-colors"
            >
              Tak, usuń
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ============================================================
// Strona Ustawień
// ============================================================

export default function UstawieniaPage() {
  const { ustawienia: globalneUstawienia, zaktualizujUstawienia } = useStore();
  const [lokalne, setLokalne] = useState<Ustawienia | null>(null);
  const [zapisano, setZapisano] = useState(false);
  const [pokazDialogUsuwania, setPokazDialogUsuwania] = useState(false);
  const [komunikat, setKomunikat] = useState<string | null>(null);
  const importRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (globalneUstawienia) {
      setLokalne({ ...globalneUstawienia });
    }
  }, [globalneUstawienia]);

  const handleZapis = async () => {
    if (!lokalne) return;
    await zaktualizujUstawienia(lokalne);
    setZapisano(true);
    setTimeout(() => setZapisano(false), 2000);
  };

  const handleEksport = async () => {
    try {
      const json = await eksportujDane();
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `mikrodawkowanie-backup-${new Date().toISOString().split("T")[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setKomunikat("Dane wyeksportowane pomyślnie");
      setTimeout(() => setKomunikat(null), 3000);
    } catch {
      setKomunikat("Błąd podczas eksportu");
      setTimeout(() => setKomunikat(null), 3000);
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const plik = e.target.files?.[0];
    if (!plik) return;
    try {
      const tekst = await plik.text();
      await importujDane(tekst);
      setKomunikat("Dane zaimportowane pomyślnie – odśwież stronę");
      setTimeout(() => setKomunikat(null), 4000);
    } catch {
      setKomunikat("Błąd – nieprawidłowy plik JSON");
      setTimeout(() => setKomunikat(null), 3000);
    }
    if (importRef.current) importRef.current.value = "";
  };

  const handleWyczysc = async () => {
    await wyczyscBaze();
    setPokazDialogUsuwania(false);
    setKomunikat("Wszystkie dane zostały usunięte");
    setTimeout(() => setKomunikat(null), 3000);
  };

  if (!lokalne) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="w-8 h-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 px-4 pt-8 pb-6">
      {/* Nagłówek */}
      <div>
        <h1 className="text-xl font-bold text-slate-100">Ustawienia</h1>
        <p className="text-sm text-slate-500 mt-1">
          Konfiguracja protokołu i aplikacji
        </p>
      </div>

      {/* Toast komunikat */}
      {komunikat && (
        <div className="bg-emerald-950 border border-emerald-800 rounded-xl px-4 py-3 text-sm text-emerald-400 animate-scale-in">
          {komunikat}
        </div>
      )}

      {/* Protokół */}
      <div className="flex flex-col gap-3">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-1">
          Protokół
        </p>
        <SekcjaProtokolU ustawienia={lokalne} onChange={setLokalne} />
      </div>

      {/* Domyślna dawka */}
      <Sekcja tytul="Dawka">
        <div className="px-4 py-4">
          <p className="text-sm font-medium text-slate-200 mb-3">
            Domyślna dawka (gramy)
          </p>
          <div className="flex items-center gap-2 flex-wrap">
            {[0.05, 0.1, 0.1, 0.15, 0.2, 0.25, 0.3]
              .filter((v, i, arr) => arr.indexOf(v) === i)
              .map((d) => (
                <button
                  key={d}
                  onClick={() => setLokalne({ ...lokalne, domyslnaDawka: d })}
                  className={`px-4 py-2.5 rounded-xl border text-sm font-semibold transition-all ${
                    lokalne.domyslnaDawka === d
                      ? "bg-emerald-500 border-emerald-500 text-white"
                      : "bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600"
                  }`}
                >
                  {d}g
                </button>
              ))}
          </div>
        </div>
      </Sekcja>

      {/* Data rozpoczęcia */}
      <Sekcja tytul="Harmonogram">
        <div className="px-4 py-4 flex flex-col gap-1.5">
          <label className="text-sm font-medium text-slate-200">
            Data rozpoczęcia protokołu
          </label>
          <input
            type="date"
            value={lokalne.dataRozpoczecia}
            onChange={(e) =>
              setLokalne({ ...lokalne, dataRozpoczecia: e.target.value })
            }
            className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-emerald-600 transition-colors w-full"
          />
          <p className="text-xs text-slate-600">
            Od tej daty obliczany jest rytm dawek i przerw
          </p>
        </div>
      </Sekcja>

      {/* Przypomnienia */}
      <div className="flex flex-col gap-1">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-1 mb-1">
          Przypomnienia
        </p>
        <SekcjaPowiadomien ustawienia={lokalne} onChange={setLokalne} />
      </div>

      {/* Przycisk zapisu */}
      <button
        onClick={handleZapis}
        className={`w-full py-4 rounded-2xl font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
          zapisano
            ? "bg-emerald-700 text-white"
            : "bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-white active:scale-[0.98]"
        }`}
      >
        {zapisano ? (
          <>
            <Check size={16} />
            Zapisano!
          </>
        ) : (
          "Zapisz ustawienia"
        )}
      </button>

      {/* Prywatność i dane */}
      <Sekcja tytul="Prywatność i dane">
        <WierszUstawien
          ikona={<Shield size={18} />}
          etykieta="Lokalne przechowywanie"
          opis="Wszystkie dane są tylko na Twoim urządzeniu"
          prawy={
            <span className="text-xs text-emerald-500 font-semibold">
              100% prywatne
            </span>
          }
        />
        <WierszUstawien
          ikona={<Download size={18} />}
          etykieta="Eksportuj dane"
          opis="Pobierz backup w formacie JSON"
          onClick={handleEksport}
        />
        <WierszUstawien
          ikona={<Upload size={18} />}
          etykieta="Importuj dane"
          opis="Przywróć z pliku JSON"
          onClick={() => importRef.current?.click()}
        />
        <WierszUstawien
          ikona={<Trash2 size={18} />}
          etykieta="Wyczyść wszystkie dane"
          opis="Nieodwracalne – usuwa całą historię"
          niebezpieczny
          onClick={() => setPokazDialogUsuwania(true)}
        />
      </Sekcja>

      {/* Ukryty input pliku */}
      <input
        ref={importRef}
        type="file"
        accept=".json"
        className="hidden"
        onChange={handleImport}
        aria-label="Importuj plik JSON"
      />

      {/* Stopka */}
      <div className="text-center">
        <p className="text-xs text-slate-600">MikroDziennik v1.0</p>
        <p className="text-xs text-slate-700 mt-0.5">
          Dane przechowywane lokalnie · Brak chmury · 100% prywatne
        </p>
      </div>

      {/* Dialog potwierdzenia usuwania */}
      {pokazDialogUsuwania && (
        <DialogPotwierdzenia
          tytul="Wyczyścić wszystkie dane?"
          tresc="Ta operacja jest nieodwracalna. Cała historia, ankiety i notatki zostaną trwale usunięte."
          onPotwierdzenie={handleWyczysc}
          onAnulowanie={() => setPokazDialogUsuwania(false)}
        />
      )}
    </div>
  );
}
