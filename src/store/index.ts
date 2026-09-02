'use client';

import { create } from 'zustand';
import type { WpisDnia, Ustawienia, ModalTyp } from '@/types';
import {
  pobierzUstawienia,
  zapiszUstawienia,
  pobierzWpisDnia,
  zapiszWpisDnia,
  pobierzWpisyZakresu,
  dodajSzybkaMysl,
} from '@/lib/db';
import { dzisiaj, obliczTypDnia } from '@/lib/protokol';

// ============================================================
// Stan aplikacji
// ============================================================

interface StanAplikacji {
  // Dane bieżącego dnia
  wpisDzisiaj: WpisDnia | null;
  ladowanieWpisu: boolean;

  // Ustawienia
  ustawienia: Ustawienia | null;
  ladowanieUstawien: boolean;

  // Historia wpisów (dla kalendarza / statystyk)
  historia: WpisDnia[];
  ladowanieHistorii: boolean;

  // UI – aktywny modal
  aktywnyModal: ModalTyp;

  // UI – wybrany dzień w kalendarzu
  wybranyDzienKalendarza: string | null;

  // Akcje
  inicjalizuj: () => Promise<void>;
  odswiez: () => Promise<void>;
  ustawModal: (modal: ModalTyp) => void;
  ustawWybranyDzien: (data: string | null) => void;

  zapiszAnkietePoranna: (
    data: string,
    ankieta: WpisDnia['poranna'],
    godzinaWziecia?: string
  ) => Promise<void>;

  zapiszAnkieteWieczorna: (
    data: string,
    ankieta: WpisDnia['wieczorna']
  ) => Promise<void>;

  dodajMySl: (data: string, tresc: string) => Promise<void>;

  zaktualizujUstawienia: (ustawienia: Ustawienia) => Promise<void>;

  pobierzHistorie: (dataOd: string, dataDo: string) => Promise<WpisDnia[]>;
}

// ============================================================
// Sklep Zustand
// ============================================================

export const useStore = create<StanAplikacji>((set, get) => ({
  wpisDzisiaj: null,
  ladowanieWpisu: false,
  ustawienia: null,
  ladowanieUstawien: false,
  historia: [],
  ladowanieHistorii: false,
  aktywnyModal: null,
  wybranyDzienKalendarza: null,

  inicjalizuj: async () => {
    set({ ladowanieUstawien: true, ladowanieWpisu: true });
    try {
      const ustawienia = await pobierzUstawienia();
      const dzien = dzisiaj();

      // Pobierz lub utwórz wpis dzisiejszego dnia
      let wpisDzisiaj = await pobierzWpisDnia(dzien);

      if (!wpisDzisiaj) {
        const typDnia = obliczTypDnia(dzien, ustawienia);
        wpisDzisiaj = await zapiszWpisDnia({ data: dzien, typDnia, szybkieMysli: [] });
      } else if (wpisDzisiaj.typDnia === 'nieznany') {
        const typDnia = obliczTypDnia(dzien, ustawienia);
        wpisDzisiaj = await zapiszWpisDnia({ ...wpisDzisiaj, typDnia });
      }

      set({ ustawienia, wpisDzisiaj });
    } catch (err) {
      console.error('Błąd inicjalizacji:', err);
    } finally {
      set({ ladowanieUstawien: false, ladowanieWpisu: false });
    }
  },

  odswiez: async () => {
    const { ustawienia } = get();
    if (!ustawienia) return;

    const dzien = dzisiaj();
    const wpisDzisiaj = await pobierzWpisDnia(dzien);
    set({ wpisDzisiaj: wpisDzisiaj ?? null });
  },

  ustawModal: (modal) => set({ aktywnyModal: modal }),

  ustawWybranyDzien: (data) => set({ wybranyDzienKalendarza: data }),

  zapiszAnkietePoranna: async (data, ankieta, godzinaWziecia) => {
    const { ustawienia } = get();
    if (!ustawienia) return;

    const typDnia = obliczTypDnia(data, ustawienia);
    const wpis = await pobierzWpisDnia(data);

    const zaktualizowany = await zapiszWpisDnia({
      ...wpis,
      data,
      typDnia,
      poranna: ankieta,
      godzinaWziecia,
      szybkieMysli: wpis?.szybkieMysli ?? [],
    });

    // Aktualizuj stan jeśli to dzisiaj
    if (data === dzisiaj()) {
      set({ wpisDzisiaj: zaktualizowany });
    }
  },

  zapiszAnkieteWieczorna: async (data, ankieta) => {
    const wpis = await pobierzWpisDnia(data);

    const zaktualizowany = await zapiszWpisDnia({
      ...wpis,
      data,
      wieczorna: ankieta,
      szybkieMysli: wpis?.szybkieMysli ?? [],
    });

    if (data === dzisiaj()) {
      set({ wpisDzisiaj: zaktualizowany });
    }
  },

  dodajMySl: async (data, tresc) => {
    const zaktualizowany = await dodajSzybkaMysl(data, tresc);

    if (data === dzisiaj()) {
      set({ wpisDzisiaj: zaktualizowany });
    }
  },

  zaktualizujUstawienia: async (ustawienia) => {
    await zapiszUstawienia(ustawienia);
    set({ ustawienia });

    // Przelicz typ dnia dla dzisiaj
    const dzien = dzisiaj();
    const typDnia = obliczTypDnia(dzien, ustawienia);
    const wpis = await pobierzWpisDnia(dzien);
    if (wpis) {
      const zaktualizowany = await zapiszWpisDnia({ ...wpis, typDnia });
      set({ wpisDzisiaj: zaktualizowany });
    }
  },

  pobierzHistorie: async (dataOd, dataDo) => {
    set({ ladowanieHistorii: true });
    try {
      const historia = await pobierzWpisyZakresu(dataOd, dataDo);
      set({ historia });
      return historia;
    } finally {
      set({ ladowanieHistorii: false });
    }
  },
}));
