'use client';

import type { Ustawienia } from '@/types';

// ============================================================
// Logika protokołów mikrodawkowania
// ============================================================

/** Oblicza typ dnia (dawka/przerwa) na podstawie daty i ustawień */
export function obliczTypDnia(
  data: string,
  ustawienia: Ustawienia
): 'dawka' | 'przerwa' {
  const dataRozpoczecia = new Date(ustawienia.dataRozpoczecia);
  const dataDnia = new Date(data);

  // Liczba dni od rozpoczęcia
  const roznica = Math.floor(
    (dataDnia.getTime() - dataRozpoczecia.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (roznica < 0) return 'przerwa';

  let dniDawki: number;
  let dniPrzerwy: number;

  switch (ustawienia.protokol) {
    case 'fadiman':
      // 1 dzień dawki, 2 dni przerwy (cykl 3-dniowy)
      dniDawki = 1;
      dniPrzerwy = 2;
      break;
    case 'stamets':
      // 4 dni dawki, 3 dni przerwy (cykl 7-dniowy)
      dniDawki = 4;
      dniPrzerwy = 3;
      break;
    case 'wlasny':
      dniDawki = ustawienia.protokolWlasny.dniDawki;
      dniPrzerwy = ustawienia.protokolWlasny.dniPrzerwy;
      break;
  }

  const dlugoscCyklu = dniDawki + dniPrzerwy;
  const pozycjaWCyklu = roznica % dlugoscCyklu;

  return pozycjaWCyklu < dniDawki ? 'dawka' : 'przerwa';
}

/** Formatuje datę do postaci "YYYY-MM-DD" */
export function formatujDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

/** Dzisiejsza data w formacie "YYYY-MM-DD" */
export function dzisiaj(): string {
  return formatujDate(new Date());
}

/** Pobiera datę przesunięta o n dni od podanej */
export function przesunDate(data: string, dni: number): string {
  const d = new Date(data);
  d.setDate(d.getDate() + dni);
  return formatujDate(d);
}

/** Zwraca tablicę 7 dat (6 dni temu → dzisiaj) */
export function ostatnie7Dni(): string[] {
  const wynik: string[] = [];
  for (let i = 6; i >= 0; i--) {
    wynik.push(przesunDate(dzisiaj(), -i));
  }
  return wynik;
}

/** Polska nazwa dnia tygodnia (krótka) */
export function krotkaNazwaDnia(data: string): string {
  const nazwy = ['Nd', 'Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'Sb'];
  const d = new Date(data);
  return nazwy[d.getDay()];
}

/** Pora dnia na podstawie godziny */
export function poraDnia(): 'rano' | 'poludnie' | 'wieczor' {
  const h = new Date().getHours();
  if (h < 12) return 'rano';
  if (h < 18) return 'poludnie';
  return 'wieczor';
}

/** Polskie powitanie zależne od pory dnia */
export function powitanie(): string {
  const h = new Date().getHours();
  if (h < 5) return 'Dobranoc';
  if (h < 12) return 'Dzień dobry';
  if (h < 18) return 'Miłego dnia';
  return 'Dobry wieczór';
}

/** Zwraca wszystkie dni danego miesiąca */
export function dniMiesiaca(rok: number, miesiac: number): string[] {
  const wynik: string[] = [];
  const dni = new Date(rok, miesiac + 1, 0).getDate();
  for (let d = 1; d <= dni; d++) {
    const data = `${rok}-${String(miesiac + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    wynik.push(data);
  }
  return wynik;
}

/** Formatuje liczbę gramów do czytelnej postaci */
export function formatujDawke(gramy: number): string {
  return `${gramy}g`;
}

/** Formatuje datę do czytelnej postaci po polsku */
export function formatujDatePL(data: string): string {
  const d = new Date(data);
  const miesiac = [
    'stycznia', 'lutego', 'marca', 'kwietnia', 'maja', 'czerwca',
    'lipca', 'sierpnia', 'września', 'października', 'listopada', 'grudnia',
  ];
  return `${d.getDate()} ${miesiac[d.getMonth()]} ${d.getFullYear()}`;
}

/** Nazwa miesiąca po polsku */
export function nazwaMiesiaca(miesiac: number): string {
  const nazwy = [
    'Styczeń', 'Luty', 'Marzec', 'Kwiecień', 'Maj', 'Czerwiec',
    'Lipiec', 'Sierpień', 'Wrzesień', 'Październik', 'Listopad', 'Grudzień',
  ];
  return nazwy[miesiac];
}
