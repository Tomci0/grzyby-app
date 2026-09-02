// ============================================================
// Typy danych aplikacji mikrodawkowania
// ============================================================

export type Protokol = "fadiman" | "stamets" | "wlasny";

export interface UstawieniaProtokolWlasny {
  dniDawki: number;
  dniPrzerwy: number;
}

export interface Ustawienia {
  id?: number;
  protokol: Protokol;
  protokolWlasny: UstawieniaProtokolWlasny;
  domyslnaDawka: number; // gramy
  godzinaRannaPowiadomienie: string; // np. "07:30"
  godzinaWieczornaPowiadomienie: string; // np. "21:00"
  dataRozpoczecia: string; // ISO date string "YYYY-MM-DD"
  powiadomieniaWlaczone: boolean;
}

// ============================================================
// Tagi wieczorne
// ============================================================

export const TAGI_POZYTYWNE = [
  "#flow",
  "#spokój",
  "#kreatywność",
  "#głęboki-sen",
  "#energia",
  "#obecność",
  "#wdzięczność",
  "#motywacja",
] as const;

export const TAGI_WYZWANIA = [
  "#mgła-mózgowa",
  "#stres",
  "#bóle-głowy",
  "#zmęczenie",
  "#kofeina",
  "#alkohol",
  "#rozproszenie",
  "#lęk",
] as const;

export type TagPozytywny = (typeof TAGI_POZYTYWNE)[number];
export type TagWyzwanie = (typeof TAGI_WYZWANIA)[number];
export type Tag = TagPozytywny | TagWyzwanie;

// ============================================================
// Oceny 1–5 (zastępują suwaki 0–10 dla szybkości)
// ============================================================

export type Ocena = 1 | 2 | 3 | 4 | 5;

/** Mapuje ocenę 1–5 na wartość 0–10 (dla zachowania kompatybilności danych) */
export function ocenaNaWartosc(o: Ocena): number {
  return (o - 1) * 2.5; // 1→0, 2→2.5, 3→5, 4→7.5, 5→10
}

/** Mapuje wartość 0–10 na ocenę 1–5 */
export function wartoscNaOcene(v: number): Ocena {
  const raw = Math.round(v / 2.5) + 1;
  return Math.min(5, Math.max(1, raw)) as Ocena;
}

// ============================================================
// Ankiety
// ============================================================

export interface AnkietaPoranna {
  wzieto: boolean;
  dawka: number; // gramy
  jakoscSnu: number; // 0–10 (zapisywane jako wartość z oceny 1–5)
  nastrojPoPobudzeniu: number; // 0–10
  intencja: string;
}

export interface AnkietaWieczorna {
  focus: number; // 0–10
  energia: number; // 0–10
  spokoj: number; // 0–10
  refleksje: string;
  tagi: Tag[]; // NOWE: wybrane tagi
}

export interface SzybaMysl {
  id?: number;
  data: string; // "YYYY-MM-DD"
  tresc: string;
  godzina: string; // "HH:MM"
}

export interface WpisDnia {
  id?: number;
  data: string; // "YYYY-MM-DD" – klucz unikalny
  poranna?: AnkietaPoranna;
  godzinaWziecia?: string; // "HH:MM"
  wieczorna?: AnkietaWieczorna;
  szybkieMysli: SzybaMysl[];
  typDnia: "dawka" | "przerwa" | "nieznany";
}

// ============================================================
// Typy pomocnicze UI
// ============================================================

export type ModalTyp =
  | null
  | "ankietaPoranna"
  | "ankietaWieczorna"
  | "szybkaMysl"
  | "quickAction";

export type PoraDnia = "rano" | "poludnie" | "wieczor";

export type FiltrKalendarza = "wszystkie" | "dawka" | "przerwa";

export interface DzienTygodnia {
  data: string;
  etykieta: string;
  numerDnia: number;
  typDnia: "dawka" | "przerwa" | "nieznany";
  maDane: boolean;
  czyDzisiaj: boolean;
}

export interface StatystykiPunkt {
  data: string;
  nastrojPoranny?: number;
  focus?: number;
  energia?: number;
  spokoj?: number;
  wzieto?: boolean;
}
