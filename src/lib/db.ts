"use client";

import Dexie, { type EntityTable } from "dexie";
import type { WpisDnia, Ustawienia, SzybaMysl } from "@/types";

// ============================================================
// Definicja bazy danych Dexie.js (IndexedDB)
// ============================================================

class MikrodawkowanieDB extends Dexie {
  wpisy!: EntityTable<WpisDnia, "id">;
  ustawienia!: EntityTable<Ustawienia, "id">;
  szybkieMysli!: EntityTable<SzybaMysl, "id">;

  constructor() {
    super("mikrodawkowanie-db");

    this.version(1).stores({
      wpisy: "++id, data, typDnia",
      ustawienia: "++id",
      szybkieMysli: "++id, data",
    });

    // Wersja 2: brak zmian schematu indeksów, ale upgrade migruje
    // brakujące pole `tagi` w ankietach wieczornych
    this.version(2)
      .stores({
        wpisy: "++id, data, typDnia",
        ustawienia: "++id",
        szybkieMysli: "++id, data",
      })
      .upgrade((tx) => {
        return tx
          .table("wpisy")
          .toCollection()
          .modify((wpis: WpisDnia) => {
            if (wpis.wieczorna && !Array.isArray(wpis.wieczorna.tagi)) {
              wpis.wieczorna.tagi = [];
            }
          });
      });
  }
}

export const db = new MikrodawkowanieDB();

// ============================================================
// Domyślne ustawienia aplikacji
// ============================================================

export const domyslneUstawienia: Omit<Ustawienia, "id"> = {
  protokol: "fadiman",
  protokolWlasny: { dniDawki: 1, dniPrzerwy: 2 },
  domyslnaDawka: 0.15,
  godzinaRannaPowiadomienie: "08:00",
  godzinaWieczornaPowiadomienie: "21:00",
  dataRozpoczecia: new Date().toISOString().split("T")[0],
  powiadomieniaWlaczone: false,
};

// ============================================================
// Helpery bazy danych
// ============================================================

export async function pobierzUstawienia(): Promise<Ustawienia> {
  const wszystkie = await db.ustawienia.toArray();
  if (wszystkie.length > 0) return wszystkie[0];
  const id = await db.ustawienia.add(domyslneUstawienia as Ustawienia);
  return { ...domyslneUstawienia, id };
}

export async function zapiszUstawienia(ustawienia: Ustawienia): Promise<void> {
  if (ustawienia.id) {
    await db.ustawienia.put(ustawienia);
  } else {
    await db.ustawienia.add(ustawienia);
  }
}

export async function pobierzWpisDnia(
  data: string,
): Promise<WpisDnia | undefined> {
  return db.wpisy.where("data").equals(data).first();
}

export async function zapiszWpisDnia(
  wpis: Partial<WpisDnia> & { data: string },
): Promise<WpisDnia> {
  const istniejacy = await pobierzWpisDnia(wpis.data);
  if (istniejacy) {
    const zaktualizowany = { ...istniejacy, ...wpis };
    await db.wpisy.put(zaktualizowany);
    return zaktualizowany;
  }
  const nowy: WpisDnia = { szybkieMysli: [], typDnia: "nieznany", ...wpis };
  const id = await db.wpisy.add(nowy);
  return { ...nowy, id };
}

export async function pobierzWpisyZakresu(
  dataOd: string,
  dataDo: string,
): Promise<WpisDnia[]> {
  return db.wpisy.where("data").between(dataOd, dataDo, true, true).toArray();
}

export async function dodajSzybkaMysl(
  data: string,
  tresc: string,
): Promise<WpisDnia> {
  const teraz = new Date();
  const godzina = `${teraz.getHours().toString().padStart(2, "0")}:${teraz
    .getMinutes()
    .toString()
    .padStart(2, "0")}`;
  const nowaMysl: SzybaMysl = { data, tresc, godzina };
  const wpis = await pobierzWpisDnia(data);
  const szybkieMysli = [...(wpis?.szybkieMysli ?? []), nowaMysl];
  return zapiszWpisDnia({ ...wpis, data, szybkieMysli });
}

export async function eksportujDane(): Promise<string> {
  const [wpisy, ustawienia, szybkieMysli] = await Promise.all([
    db.wpisy.toArray(),
    db.ustawienia.toArray(),
    db.szybkieMysli.toArray(),
  ]);
  return JSON.stringify(
    { wpisy, ustawienia, szybkieMysli, eksportowano: new Date().toISOString() },
    null,
    2,
  );
}

export async function importujDane(json: string): Promise<void> {
  const dane = JSON.parse(json);
  await db.transaction(
    "rw",
    db.wpisy,
    db.ustawienia,
    db.szybkieMysli,
    async () => {
      if (dane.wpisy) {
        await db.wpisy.clear();
        // Zapewnij pole tagi w istniejących danych (spread tagi na końcu, by nie nadpisać)
        const wpisy = dane.wpisy.map((w: WpisDnia) => ({
          ...w,
          wieczorna: w.wieczorna
            ? { ...w.wieczorna, tagi: w.wieczorna.tagi ?? [] }
            : undefined,
        }));
        await db.wpisy.bulkAdd(wpisy);
      }
      if (dane.ustawienia) {
        await db.ustawienia.clear();
        await db.ustawienia.bulkAdd(dane.ustawienia);
      }
      if (dane.szybkieMysli) {
        await db.szybkieMysli.clear();
        await db.szybkieMysli.bulkAdd(dane.szybkieMysli);
      }
    },
  );
}

export async function wyczyscBaze(): Promise<void> {
  await db.transaction(
    "rw",
    db.wpisy,
    db.ustawienia,
    db.szybkieMysli,
    async () => {
      await Promise.all([
        db.wpisy.clear(),
        db.ustawienia.clear(),
        db.szybkieMysli.clear(),
      ]);
    },
  );
}
