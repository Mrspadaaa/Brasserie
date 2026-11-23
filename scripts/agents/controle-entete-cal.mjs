// Contrôle CAL-GRAPH-PETIT (16.11) : « Graph trop petit donné date trop présente. Mais l'idée est bonne »
// En-tête du calendrier : la courbe (plus grand svg au-dessus de la frise) fait au moins 80 px de haut,
// et la bande des semaines (#fh : semaines, soldes, mouvements) au plus 40 px, sans disparaître (l'idée est bonne).
// CAL-INFO-TROP (16.11 nuit) : « trop peu de place pour la frise, trop d'info inutile sur le graph, juste quel info avec date c'est tout » :
// en-tête (tout ce qui est au-dessus de la frise) ≤ 180 px en portrait et ≤ 120 px en paysage. Le plafond de textes (12, 14) est retiré le 17.11 :
// « graph » visait la bande des semaines, pas la courbe (« le graph avec toutes les infos était beaucoup mieux ») ; la bande se contrôle par controle-bande-semaine.mjs.
// node scripts/agents/controle-entete-cal.mjs <page.html> [--paysage] [...]  → ENTETE OK | ENTETE ECHEC
import { createRequire } from 'module'; import path from 'path'; import { pathToFileURL } from 'url';
const req = createRequire('C:/Users/mrspa/Documents/Brasserie/.claude/worktrees/optimistic-ptolemy-2d1278/package.json');
const puppeteer = req('puppeteer-core');
const args = process.argv.slice(2); const pays = args.includes('--paysage'); const fichiers = args.filter((a) => !a.startsWith('--'));
if (!fichiers.length) { console.log('usage : <page.html> [--paysage]'); process.exit(2); }
const COURBE_MIN = pays ? 70 : 80, BANDE_MAX = 40;
const nav = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new' });
let ko = 0;
for (const f of fichiers) {
  const p = await nav.newPage(); await p.setViewport(pays ? { width: 844, height: 390 } : { width: 390, height: 844 });
  await p.goto(pathToFileURL(path.resolve(f)).href, { waitUntil: 'load' }); await new Promise((r) => setTimeout(r, 500));
  const m = await p.evaluate(() => {
    const frise = document.querySelector('#fb') || document.querySelector('.frise');
    const haut = frise ? frise.getBoundingClientRect().top : innerHeight / 2;
    const svgs = [...document.querySelectorAll('svg')].filter((s) => s.getBoundingClientRect().bottom <= haut + 1 && s.getBoundingClientRect().width > 150);
    const traces = svgs.flatMap((s) => [...s.querySelectorAll('path, polyline, polygon')]).map((e) => e.getBoundingClientRect()).filter((r) => r.width > 150);
    const courbe = Math.max(0, ...traces.map((r) => Math.round(r.height)));
    const fh = document.querySelector('#fh, [data-bande-semaines]'); const vis = fh && fh.offsetParent !== null && fh.getBoundingClientRect().height > 0;
    const MOIS = /^(janv|févr|mars|avr|mai|juin|juil|août|sept|oct|nov|déc).?$/; let ecart = 999;
    if (vis) { const top = fh.getBoundingClientRect().top; const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT); let n; while ((n = w.nextNode())) { const t = n.textContent.trim(); if (!MOIS.test(t) || fh.contains(n.parentElement)) continue; const r = document.createRange(); r.selectNodeContents(n); const b = r.getBoundingClientRect(); if (b.height && b.bottom <= top + 1 && b.bottom > top - 60) ecart = Math.min(ecart, Math.round(top - b.bottom)); } }
    const w2 = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT); let n2, items = 0; while ((n2 = w2.nextNode())) { const t2 = n2.textContent.trim(); if (!t2) continue; const r2 = document.createRange(); r2.selectNodeContents(n2); const b2 = r2.getBoundingClientRect(); if (b2.height && b2.top >= 0 && b2.bottom <= haut && !(fh && fh.contains(n2.parentElement))) items++; }
    return { items, courbe, bande: vis ? Math.round(fh.getBoundingClientRect().height) : 0, existe: !!vis, tete: Math.round(haut), ecart };
  });
  const TETE_MAX = pays ? 120 : 180, ITEMS_MAX = pays ? 14 : 12;
  const bon = m.tete <= TETE_MAX && m.ecart >= 12 && m.courbe >= COURBE_MIN && ((pays && !m.existe) || (m.existe && m.bande <= BANDE_MAX)); if (!bon) ko++;
  console.log(`${bon ? 'ok' : 'KO'} ${path.basename(f)} : courbe ${m.courbe} px (min ${COURBE_MIN}), bande des semaines ${m.existe ? m.bande + ' px' : 'absente'} (max ${BANDE_MAX}, présente), en-tête ${m.tete} px (max ${TETE_MAX}), ${m.items} textes (max ${ITEMS_MAX}), mois → bande ${m.ecart === 999 ? "sans mois au-dessus" : m.ecart + " px (min 12)"}`);
  await p.close();
}
await nav.close(); console.log(ko ? 'ENTETE ECHEC' : 'ENTETE OK'); process.exit(ko ? 1 : 0);
