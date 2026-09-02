// Generuje ikony PWA jako pliki SVG (przeglądarka akceptuje SVG jako ikony)
import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, '..', 'public', 'icons');

mkdirSync(publicDir, { recursive: true });

function generujSVG(rozmiar) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${rozmiar}" height="${rozmiar}" viewBox="0 0 ${rozmiar} ${rozmiar}">
  <rect width="${rozmiar}" height="${rozmiar}" rx="${rozmiar * 0.22}" fill="#020617"/>
  <rect width="${rozmiar}" height="${rozmiar}" rx="${rozmiar * 0.22}" fill="url(#grad)"/>
  <defs>
    <linearGradient id="grad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#064e3b"/>
      <stop offset="100%" stop-color="#020617"/>
    </linearGradient>
  </defs>
  <!-- Liść / kapsułka -->
  <circle cx="${rozmiar * 0.5}" cy="${rozmiar * 0.42}" r="${rozmiar * 0.22}" fill="#10b981" opacity="0.9"/>
  <circle cx="${rozmiar * 0.5}" cy="${rozmiar * 0.62}" r="${rozmiar * 0.16}" fill="#10b981" opacity="0.6"/>
  <!-- Litera M -->
  <text x="${rozmiar * 0.5}" y="${rozmiar * 0.68}" 
        font-family="system-ui, -apple-system, sans-serif" 
        font-size="${rozmiar * 0.28}" 
        font-weight="700" 
        fill="white" 
        text-anchor="middle" 
        dominant-baseline="middle">M</text>
</svg>`;
}

// Zapisz SVG (używamy ich jako ikon – przeglądarka i Android akceptują SVG)
writeFileSync(join(publicDir, 'icon-192.svg'), generujSVG(192));
writeFileSync(join(publicDir, 'icon-512.svg'), generujSVG(512));

console.log('✓ Ikony SVG wygenerowane w public/icons/');
