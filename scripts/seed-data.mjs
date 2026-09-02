/**
 * Skrypt generujący dane testowe dla MikroDziennika.
 * Generuje plik JSON gotowy do importu przez Ustawienia → "Importuj dane".
 *
 * Użycie:
 *   node scripts/seed-data.mjs
 */

import { writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const PROTOKOL = "fadiman";
const DOMYSLNA_DAWKA = 0.15;
const ILE_DNI = 30;
const DATA_START = przesunDate(dzisiaj(), -ILE_DNI + 1);

// ============================================================
// Tagi (muszą pasować do types/index.ts)
// ============================================================

const TAGI_POZ = [
  "#flow",
  "#spokój",
  "#kreatywność",
  "#głęboki-sen",
  "#energia",
  "#obecność",
  "#wdzięczność",
  "#motywacja",
];
const TAGI_WYZ = [
  "#mgła-mózgowa",
  "#stres",
  "#bóle-głowy",
  "#zmęczenie",
  "#kofeina",
  "#alkohol",
  "#rozproszenie",
  "#lęk",
];

// ============================================================
// Helpery
// ============================================================

function dzisiaj() {
  return new Date().toISOString().split("T")[0];
}

function przesunDate(data, dni) {
  const d = new Date(data);
  d.setDate(d.getDate() + dni);
  return d.toISOString().split("T")[0];
}

function obliczTypDnia(data) {
  const start = new Date(DATA_START);
  const cel = new Date(data);
  const diff = Math.floor((cel - start) / 86400000);
  if (diff < 0) return "przerwa";
  return diff % 3 === 0 ? "dawka" : "przerwa";
}

/** Rozkład normalny Box-Muller, zaokrąglony do int w zakresie [0,10] */
function gauss(mean, std) {
  let u = 0,
    v = 0;
  while (!u) u = Math.random();
  while (!v) v = Math.random();
  const n = Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  return Math.min(10, Math.max(0, Math.round(mean + n * std)));
}

/** Ocena 1–5 → wartość 0–10 */
function ocenaNaWartosc(o) {
  return (o - 1) * 2.5;
}

/** Losuj z tablicy */
function losuj(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function losujCzas(hMin, hMax) {
  const h = hMin + Math.floor(Math.random() * (hMax - hMin));
  const m = Math.floor(Math.random() * 60);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

// ============================================================
// Treści
// ============================================================

const INTENCJE = [
  "Być bardziej obecny/a w chwili obecnej",
  "Zauważać piękno w codzienności",
  "Skupić się na jednej rzeczy naraz",
  "Pracować ze skupieniem przez 4 godziny",
  "Obserwować myśli bez przywiązania",
  null,
  null,
];

const REFLEKSJE_DAWKA = [
  "Zauważyłem/am subtelne poczucie lekkości po południu. Praca szła sprawniej niż zwykle.",
  "Myśli były wyraźniejsze, mniej rozproszenia. Udało mi się skończyć zaległy projekt.",
  "Poczucie flow podczas rysowania. Dobry kontakt z ludźmi.",
  "Skupienie na wysokim poziomie przez większość dnia. Satysfakcja wieczorem.",
  "Wyjątkowo dobry kontakt z emocjami. Zauważyłem/am stare wzorce i odpuściłem/am.",
  "Kreatywność wysoka. Myśli płynęły naturalnie.",
];

const REFLEKSJE_PRZERWA = [
  "Dzień przerwy. Trochę ciężej się skupić, ale normalne funkcjonowanie.",
  "Spokojny dzień. Ogólne dobre samopoczucie utrzymuje się.",
  "Zauważam większą reaktywność emocjonalną niż w dni dawki.",
  null,
  null,
  null,
];

const SZYBKIE_MYSLI = [
  [
    "Ciekawe, jak różnie interpretuję tę samą sytuację zależnie od nastroju.",
    "11:30",
  ],
  ["Nie każda myśl jest prawdą.", "14:15"],
  ["Rozmowa z bliską osobą – warto pielęgnować te kontakty.", "19:45"],
  ["Przepiękny zachód słońca. Stałem/am i patrzyłem/am przez chwilę.", "20:00"],
];

// ============================================================
// Generuj dane
// ============================================================

const wpisy = [];
let id = 1;

for (let i = 0; i < ILE_DNI; i++) {
  const data = przesunDate(dzisiaj(), -(ILE_DNI - 1 - i));
  const typDnia = obliczTypDnia(data);
  const dawka = typDnia === "dawka";

  // Trend poprawy: +0 przez pierwsze 10 dni, potem +0–1.5
  const trend = i < 10 ? 0 : Math.min(1.5, (i - 10) * 0.15);

  const bazNastroj = dawka ? 6.5 : 5.5;
  const bazFocus = dawka ? 6.8 : 5.2;
  const bazEnergia = dawka ? 6.3 : 5.8;
  const bazSpokoj = dawka ? 7.0 : 5.5;

  const maP = Math.random() < 0.88;
  const maW = Math.random() < 0.8;

  // Oceny 1–5 → wartości 0–10
  const jakoscSnuOc = Math.min(
    5,
    Math.max(1, Math.round(gauss(6.5, 1.5) / 2.5) + 1),
  );
  const nastrojPorOc = Math.min(
    5,
    Math.max(1, Math.round(gauss(bazNastroj + trend, 1.2) / 2.5) + 1),
  );
  const focusOc = Math.min(
    5,
    Math.max(1, Math.round(gauss(bazFocus + trend, 1.3) / 2.5) + 1),
  );
  const energiaOc = Math.min(
    5,
    Math.max(1, Math.round(gauss(bazEnergia + trend, 1.4) / 2.5) + 1),
  );
  const spokojOc = Math.min(
    5,
    Math.max(1, Math.round(gauss(bazSpokoj + trend, 1.2) / 2.5) + 1),
  );

  // Tagi wieczorne — realistyczne zestawy
  const tagiWieczorne = [];
  if (maW) {
    if (dawka) {
      // Dni dawki: więcej tagów pozytywnych
      if (focusOc >= 4) tagiWieczorne.push("#flow");
      if (spokojOc >= 4) tagiWieczorne.push("#spokój");
      if (energiaOc >= 4) tagiWieczorne.push("#energia");
      if (Math.random() < 0.3) tagiWieczorne.push("#kreatywność");
      if (jakoscSnuOc >= 4 && Math.random() < 0.4)
        tagiWieczorne.push("#głęboki-sen");
    } else {
      // Dni przerwy: czasem wyzwania
      if (focusOc <= 2) tagiWieczorne.push("#mgła-mózgowa");
      if (spokojOc <= 2) tagiWieczorne.push("#lęk");
      if (energiaOc <= 2) tagiWieczorne.push("#zmęczenie");
      if (Math.random() < 0.2) tagiWieczorne.push("#stres");
      if (Math.random() < 0.15) tagiWieczorne.push("#kofeina");
      // Też pozytywne
      if (spokojOc >= 4) tagiWieczorne.push("#spokój");
    }
  }

  const szybkieMysli = [];
  if (Math.random() < 0.28) {
    const [tresc, godzina] = losuj(SZYBKIE_MYSLI);
    szybkieMysli.push({ data, tresc, godzina });
  }

  wpisy.push({
    id: id++,
    data,
    typDnia,
    poranna: maP
      ? {
          wzieto: dawka ? Math.random() < 0.92 : false,
          dawka: dawka ? DOMYSLNA_DAWKA : 0,
          jakoscSnu: ocenaNaWartosc(jakoscSnuOc),
          nastrojPoPobudzeniu: ocenaNaWartosc(nastrojPorOc),
          intencja: losuj(INTENCJE) ?? "",
        }
      : undefined,
    godzinaWziecia:
      maP && dawka && Math.random() < 0.92 ? losujCzas(7, 10) : undefined,
    wieczorna: maW
      ? {
          focus: ocenaNaWartosc(focusOc),
          energia: ocenaNaWartosc(energiaOc),
          spokoj: ocenaNaWartosc(spokojOc),
          tagi: tagiWieczorne,
          refleksje: losuj(dawka ? REFLEKSJE_DAWKA : REFLEKSJE_PRZERWA) ?? "",
        }
      : undefined,
    szybkieMysli,
  });
}

// ============================================================
// Ustawienia
// ============================================================

const ustawienia = [
  {
    id: 1,
    protokol: PROTOKOL,
    protokolWlasny: { dniDawki: 1, dniPrzerwy: 2 },
    domyslnaDawka: DOMYSLNA_DAWKA,
    godzinaRannaPowiadomienie: "08:00",
    godzinaWieczornaPowiadomienie: "21:00",
    dataRozpoczecia: DATA_START,
    powiadomieniaWlaczone: false,
  },
];

// ============================================================
// Zapis
// ============================================================

const nazwaPliku = `seed-${dzisiaj()}.json`;
const sciezka = join(__dirname, "..", "public", nazwaPliku);

writeFileSync(
  sciezka,
  JSON.stringify(
    {
      wpisy,
      ustawienia,
      szybkieMysli: [],
      eksportowano: new Date().toISOString(),
    },
    null,
    2,
  ),
  "utf8",
);

// Statystyki
const dniDawki = wpisy.filter((w) => w.typDnia === "dawka");
const dniPrzerwy = wpisy.filter((w) => w.typDnia === "przerwa");
const wziete = wpisy.filter((w) => w.poranna?.wzieto).length;
const tagLicznik = {};
wpisy.forEach((w) =>
  (w.wieczorna?.tagi ?? []).forEach((t) => {
    tagLicznik[t] = (tagLicznik[t] ?? 0) + 1;
  }),
);
const topTagi = Object.entries(tagLicznik)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 5);

console.log("");
console.log("✓ Dane testowe wygenerowane!");
console.log("");
console.log(`  Plik:             public/${nazwaPliku}`);
console.log(`  Protokół:         Fadiman (1 dawka / 2 przerwy)`);
console.log(
  `  Okres:            ${ILE_DNI} dni (${DATA_START} → ${dzisiaj()})`,
);
console.log(`  Dni z dawką:      ${dniDawki.length} (wziętych: ${wziete})`);
console.log(`  Dni przerwy:      ${dniPrzerwy.length}`);
console.log(
  `  Ankiety poranne:  ${wpisy.filter((w) => w.poranna).length}/${ILE_DNI}`,
);
console.log(
  `  Ankiety wieczorne:${wpisy.filter((w) => w.wieczorna).length}/${ILE_DNI}`,
);
console.log(
  `  Tagi top-5:       ${topTagi.map(([t, n]) => `${t}(${n})`).join(", ")}`,
);
console.log("");
console.log("  Jak zaimportować:");
console.log("  1. npm run dev → http://localhost:3000/ustawienia");
console.log(`  2. Kliknij "Importuj dane" → wybierz public/${nazwaPliku}`);
console.log("  3. Odśwież stronę");
console.log("");
