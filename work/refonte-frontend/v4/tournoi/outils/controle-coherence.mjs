// D39 (18.10, soir), sur la planche « Comparer » du lot 4 radars : « Je m'attendais plus à qqch
// du genre mais plus cohérent. » Chaque radar avait son style (tailles, traits, libellés,
// séries en tirets et pointillés, petits multiples trop petits). Désormais UN style de radar
// pour toute la variante : les trois parties et la fiche.
// Usage : node work/refonte-frontend/v4/tournoi/outils/controle-coherence.mjs <dossier> [ids…]
// Mesure, sur toutes les pages de chaque variante qui contiennent un svg[data-radar] (à 390) :
//   (a) libellés des radars : au plus 2 tailles de texte sur toute la variante ;
//   (b) traits des séries (data-serie, hors zone) : au plus 2 épaisseurs, et pas de tirets
//       (stroke-dasharray) pour distinguer les séries : on les distingue par le remplissage
//       ou un repère nommé, pas par un motif de trait illisible en petit ;
//   (c) remplissages des séries : au plus 3 opacités distinctes sur la variante ;
//   (d) petits multiples : sur une même page, tous les radars hors radar principal ont la
//       même largeur (± 6 %), et chacun ≥ 42 % de l'écran (rayon lisible).
// Imprime COHERENCE OK si tout passe, sinon COHERENCE ECHEC et la liste.
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import puppeteer from 'puppeteer-core';

const dir = path.resolve(process.argv[2] || '.');
const only = process.argv.slice(3).filter((a) => !a.startsWith('--'));
const ids = fs.readdirSync(dir).filter((d) => /^p\d+$|^consolide$|^version-/.test(d) && fs.existsSync(path.join(dir, d, 'index.html')))
  .filter((d) => !only.length || only.includes(d)).sort();
const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const problems = [];
for (const id of ids) {
  const p = (m) => problems.push(id + ' : ' + m);
  const tailles = new Set(), traits = new Set(), opacites = new Set();
  let tirets = 0;
  for (const f of fs.readdirSync(path.join(dir, id)).filter((x) => x.endsWith('.html')).sort()) {
    const page = await browser.newPage();
    await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
    await page.goto(pathToFileURL(path.join(dir, id, f)).href, { waitUntil: 'networkidle0', timeout: 30000 });
    await new Promise((r) => setTimeout(r, 300));
    const m = await page.evaluate(() => {
      const svgs = [...document.querySelectorAll('svg[data-radar]')].filter((s) => s.getBoundingClientRect().width > 0);
      const out = { n: svgs.length, tailles: [], traits: [], opacites: [], tirets: 0, larges: [] };
      for (const s of svgs) {
        out.larges.push(s.getBoundingClientRect().width / innerWidth);
        for (const t of s.querySelectorAll('text')) if (t.textContent.trim()) out.tailles.push(Math.round(parseFloat(getComputedStyle(t).fontSize)));
        for (const e of s.querySelectorAll('[data-serie]')) {
          if (e.getAttribute('data-serie') === 'zone') continue;
          for (const x of [e, ...e.querySelectorAll('path,polygon,polyline')]) {
            const cs = getComputedStyle(x);
            if (cs.stroke !== 'none' && parseFloat(cs.strokeWidth) > 0) out.traits.push(Math.round(parseFloat(cs.strokeWidth) * 2) / 2);
            if (cs.strokeDasharray && cs.strokeDasharray !== 'none') out.tirets++;
            if (cs.fill !== 'none' && !/rgba\(0, 0, 0, 0\)/.test(cs.fill)) out.opacites.push(Math.round(Number(cs.fillOpacity) * Number(cs.opacity) * 20) / 20);
          }
        }
      }
      return out;
    });
    await page.close();
    if (!m.n) continue;
    m.tailles.forEach((x) => tailles.add(x)); m.traits.forEach((x) => traits.add(x)); m.opacites.forEach((x) => opacites.add(x));
    tirets += m.tirets;
    // (d) petits multiples : tous sauf le plus grand.
    if (m.larges.length > 1) {
      const tri = [...m.larges].sort((a, b) => b - a);
      const petits = tri[0] - tri[1] > 0.1 ? tri.slice(1) : tri;
      if (petits.length > 1 && Math.max(...petits) - Math.min(...petits) > 0.06) p(f + ' : petits multiples de tailles différentes (' + petits.map((x) => Math.round(x * 100) + ' %').join(', ') + ')');
      if (Math.min(...petits) < 0.42) p(f + ' : petit multiple de ' + Math.round(Math.min(...petits) * 100) + ' % de la largeur (≥ 42 %)');
    }
  }
  if (tailles.size > 2) p(tailles.size + ' tailles de libellés de radar sur la variante (' + [...tailles].sort((a, b) => a - b).join(', ') + ' px ; ≤ 2)');
  if (traits.size > 2) p(traits.size + ' épaisseurs de trait de série (' + [...traits].sort((a, b) => a - b).join(', ') + ' ; ≤ 2)');
  if (opacites.size > 3) p(opacites.size + ' opacités de remplissage de série (' + [...opacites].sort((a, b) => a - b).join(', ') + ' ; ≤ 3)');
  if (tirets) p(tirets + ' série(s) distinguée(s) par un trait en tirets ou pointillés');
  console.log(id + ' · cohérence des radars contrôlée');
}
await browser.close();
// Audit du 23.10 (a1-audit-defauts) : sur une page au format actuel, ce contrôle ne lisait rien et sortait « COHERENCE OK 0/0 ». Un contrôle qui ne lit rien n'est pas un OK.
if (ids.length === 0) problems.push('aucune maquette lue : 0 page au format attendu ; ce contrôle ne garde rien ici (voir portee-defauts.json)');
if (problems.length === 0) console.log('COHERENCE OK ' + ids.length + '/' + ids.length);
else { console.log('COHERENCE ECHEC ' + problems.length + ' problème(s)'); for (const x of problems) console.log('  ' + x); process.exitCode = 1; }
