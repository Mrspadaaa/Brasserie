// Essai du rendu réel de PDF (`loadPdfRenderer`, celui du recadreur de Zv) sur doc9 : combien de textes QR par page ? Aucune valeur, aucun appel.
//   npx vite-node --config vitest.config.ts work/missions/2026-11-01-banc-lecture/voies/k5-vision/essai-pdf.ts
import { readFileSync } from 'node:fs';
import { loadPdfRenderer, loadQrReader } from '../../../../../scripts/banc-lecture-bandes';

const bytes = readFileSync('work/finalisation-tickets-2026-10-08/H13-reels/doc9-facture-pdf-686863.pdf');
const renderer = await loadPdfRenderer(), reader = await loadQrReader();
const pages = await renderer.pages(bytes);
const counts: number[] = [];
for (let page = 1; page <= pages; page++) counts.push((await reader(await renderer.render(bytes, page, 3))).length);
console.log('pages', pages, '; textes QR par page', counts.join(','));
