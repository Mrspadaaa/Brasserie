// 16.11, ses mots : « un peu au dessus des Tab » (à droite). Mesure, sur chaque écran, à 390×844 et 844×390 tactiles :
// écart = haut de la barre d'onglets − bas du + (attendu 4 à 24 px), marge droite, et ce que le + recouvre (texte ou bouton dessous).
import fs from 'node:fs';
import { lancer, ouvrir, ECRANS, allerEcran, ouvrirPlus, dormir } from '../port-integration/lib.mjs';

const OUT = new URL('./fab-hauteur/', import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1');
fs.mkdirSync(OUT, { recursive: true });
const MODES = [{ id: '390', w: 390, h: 844, t: true, dpr: 2 }, { id: '844', w: 844, h: 390, t: true, dpr: 2 }];
const lignes = [], fautes = [];
const mesurer = p => p.evaluate(() => {
  const b = [...document.querySelectorAll('button')].find(x => /^Actions rapides/.test(x.getAttribute('aria-label') || '') && x.offsetParent !== null);
  const navEl = document.querySelector('nav[aria-label="Navigation principale"]');
  if (!b || !navEl) return { absent: true };
  const r = b.getBoundingClientRect(), n = navEl.getBoundingClientRect();
  const dessous = new Set();
  for (const [fx, fy] of [[0.15, 0.15], [0.85, 0.15], [0.5, 0.5], [0.15, 0.85], [0.85, 0.85]]) {
    for (const e of document.elementsFromPoint(r.left + r.width * fx, r.top + r.height * fy)) {
      if (b.contains(e) || e.contains(b)) continue;
      const own = [...e.childNodes].some(c => c.nodeType === 3 && c.textContent.trim());
      if ((own || /^(BUTTON|A|INPUT)$/.test(e.tagName)) && getComputedStyle(e).visibility !== 'hidden') { dessous.add((e.innerText || e.getAttribute('aria-label') || e.tagName).trim().slice(0, 30)); break; }
    }
  }
  return { ecart: Math.round(n.top - r.bottom), droite: Math.round(innerWidth - r.right), taille: Math.round(r.width), dessous: [...dessous] };
});
const nav = await lancer();
for (const m of MODES) {
  const p = await ouvrir(nav, m);
  for (const [id, tab, sous] of ECRANS) {
    await allerEcran(p, tab, sous); await dormir(400);
    const x = await mesurer(p);
    lignes.push(`${m.id} ${id} : écart ${x.ecart} px, droite ${x.droite} px, ${x.taille} px${x.dessous?.length ? `, recouvre ${x.dessous.join(' / ')}` : ''}`);
    if (x.absent) fautes.push(`${m.id} ${id} : + absent`);
    else if (x.ecart < 4 || x.ecart > 24) fautes.push(`${m.id} ${id} : écart ${x.ecart} px hors 4–24`);
    await p.screenshot({ path: `${OUT}${m.id}-${id}.png` });
    // Défilé en bas : la dernière ligne de la liste doit rester lisible à côté du +.
    await p.evaluate(() => { document.querySelectorAll('main, [data-scroll], .overflow-y-auto').forEach(e => { e.scrollTop = e.scrollHeight; }); scrollTo(0, document.body.scrollHeight); });
    await dormir(300);
    const y = await mesurer(p);
    if (y.dessous?.length) lignes.push(`${m.id} ${id} (en bas) : recouvre ${y.dessous.join(' / ')}`);
    await p.screenshot({ path: `${OUT}${m.id}-${id}-bas.png` });
  }
  await allerEcran(p, ECRANS[2][1], ECRANS[2][2]); await ouvrirPlus(p); await dormir(400);
  await p.screenshot({ path: `${OUT}${m.id}-pile.png` });
  await p.close();
}
await nav.close();
fs.writeFileSync(`${OUT}mesures.txt`, lignes.join('\n') + '\n');
console.log(lignes.join('\n'));
console.log(fautes.length ? `FAB-HAUTEUR ECHEC (${fautes.length})\n${fautes.join('\n')}` : 'FAB-HAUTEUR OK');
