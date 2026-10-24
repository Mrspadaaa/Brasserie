// Lot 21 · série a · les deux exigences obligatoires de la v0 (pilote, 19.10, 23 h 20), sur toute la page :
//   HONNETE  H1 chaque vraie valeur visible [data-nature="mesure"] a une data-source non vide ;
//            H2 chaque valeur simulée visible [data-nature="simule"] porte « ~ », « ≈ », « simulé » ou
//               « estimé » (dans son texte, ou en tête de sa [data-role="simulation"]) ;
//            H3 toute plage de plus de ×100 écrite « ×a–b » a, dans sa ligne, une bande
//               [data-role="incertitude"] d'au moins 120 px ;
//            H4 une famille « rien de simulé » ne s'affiche jamais en zéro : aucune valeur simulée « ~0 »
//               dans une ligne ou une colonne marquée rien (inconnu ≠ zéro).
//   DOIGT    D1 pas de défilement horizontal à 390 px ;
//            D2 chaque réglage visible offre une cible d'au moins 24 × 24 px (le réglage ou son étiquette) ;
//            D3 toucher les réglages un à un fait bouger le simulé (au moins un) ; aucune erreur de page.
// Usage : node a1/controle-a.mjs [a1 a2 …] ; imprime HONNETE OK, DOIGT OK, ou leurs échecs.
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
const require = createRequire('C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie/package.json');
const puppeteer = require('puppeteer-core');
const D = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ids = process.argv.slice(2).length ? process.argv.slice(2) : ['a1', 'a2', 'a3', 'a4', 'a5', 'a6'];
const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const H = [], Dg = [];
const releve = () => {
  const vis = (e) => { if (!e || e.closest('[hidden]')) return false; const b = e.getBoundingClientRect(); const cs = getComputedStyle(e); return b.width > 0 && b.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none'; };
  const mes = [...document.querySelectorAll('[data-nature="mesure"]')].filter(vis);
  const sim = [...document.querySelectorAll('[data-nature="simule"]')].filter(vis);
  const muets = sim.filter((s) => !/~|≈|simul|estim/i.test((s.textContent || '') + ' ' + (s.getAttribute('aria-label') || '') + ' ' + (s.closest('[data-role="simulation"]') ? s.closest('[data-role="simulation"]').innerText.slice(0, 200) : '')));
  const larges = [];
  const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let n = w.nextNode(); n; n = w.nextNode()) {
    const el = n.parentElement; if (!el || el.closest('script, style') || !vis(el)) continue;
    for (const f of n.textContent.matchAll(/×\s*(\d+(?:[,.]\d+)?)\s*[–-]\s*(\d+(?:[,.]\d+)?)/g)) {
      const a = parseFloat(f[1].replace(',', '.')), b = parseFloat(f[2].replace(',', '.')); if (!(a > 0 && b / a > 100)) continue;
      let l = el, ok = false;
      for (; l && l !== document.body && l.getBoundingClientRect().height <= 140; l = l.parentElement) if ([...l.querySelectorAll('[data-role="incertitude"]')].some((x) => vis(x) && x.getBoundingClientRect().width >= 120)) { ok = true; break; }
      if (!ok) larges.push(f[0]);
    }
  }
  const zeros = [...document.querySelectorAll('.hl, .vb, .pr, .mc')].filter(vis).filter((r) => /rien/.test(r.innerText) && [...r.querySelectorAll('[data-nature="simule"]')].some((s) => /^~?0$/.test(s.textContent.trim())));
  const regs = [...document.querySelectorAll('[data-role="reglage"]')].filter(vis).map((e) => { const t = e.closest('label, .ch, .pl-s') || e; const b = t.getBoundingClientRect(); return { w: Math.round(b.width), h: Math.round(b.height), t: (e.getAttribute('aria-label') || e.textContent || '').trim().slice(0, 24) }; });
  return { mes: mes.length, sansSource: mes.filter((m) => !(m.dataset.source || '').trim()).length, sim: sim.length, muets: muets.length, larges, zeros: zeros.length, sw: document.documentElement.scrollWidth, regs,
    empreinte: sim.map((v) => v.textContent.trim() + '@' + Math.round(v.getBoundingClientRect().width)).join('|') };
};
for (const id of ids) {
  const page = await browser.newPage();
  const err = []; page.on('pageerror', (e) => err.push(e.message));
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
  await page.goto(pathToFileURL(path.join(D, id, 'etat.html')).href, { waitUntil: 'networkidle0', timeout: 60000 });
  await new Promise((r) => setTimeout(r, 300));
  const a = await page.evaluate(releve);
  if (!a.mes) H.push(id + ' H1 aucune vraie valeur'); if (a.sansSource) H.push(id + ' H1 ' + a.sansSource + ' vraie(s) valeur(s) sans source');
  if (a.muets) H.push(id + ' H2 ' + a.muets + ' valeur(s) simulée(s) sans signe');
  if (a.larges.length) H.push(id + ' H3 plage(s) sans bande : ' + a.larges.join(' ; '));
  if (a.zeros) H.push(id + ' H4 ' + a.zeros + ' famille(s) « rien » affichée(s) en zéro');
  if (a.sw > 390) Dg.push(id + ' D1 défilement horizontal : ' + a.sw + ' px');
  const petits = a.regs.filter((r) => r.w < 24 || r.h < 24); if (petits.length) Dg.push(id + ' D2 ' + petits.length + ' réglage(s) sous 24 px : ' + petits.slice(0, 3).map((r) => r.t + ' ' + r.w + '×' + r.h).join(', '));
  // D3 : chaque réglage touché (ou changé), le simulé bouge au moins une fois.
  let bouge = 0, essais = 0;
  const hs = await page.$$('[data-role="reglage"]');
  for (const h of hs) {
    const info = await h.evaluate((e) => { const r = e.getBoundingClientRect(); return { tag: e.tagName.toLowerCase(), type: e.type || '', vis: r.width > 0 && r.height > 0, dis: e.getAttribute('aria-disabled') === 'true' || e.disabled }; });
    if (!info.vis || info.dis) continue;
    essais++;
    const avant = (await page.evaluate(releve)).empreinte;
    await h.evaluate((e) => e.scrollIntoView({ block: 'center' }));
    if (info.tag === 'select') await h.evaluate((e) => { e.selectedIndex = (e.selectedIndex + 1) % e.options.length; e.dispatchEvent(new Event('change', { bubbles: true })); });
    else if (info.tag === 'input') await h.evaluate((e) => { e.value = String(Number(e.value) < Number(e.max) ? Number(e.value) + 1 : e.min); e.dispatchEvent(new Event('input', { bubbles: true })); });
    else { try { await h.tap(); } catch { await h.click(); } }
    await new Promise((r) => setTimeout(r, 250));
    if ((await page.evaluate(releve)).empreinte !== avant) bouge++;
    if (essais >= 14) break;
  }
  if (!bouge) Dg.push(id + ' D3 aucun réglage ne fait bouger le simulé');
  if (err.length) Dg.push(id + ' D3 erreur de page : ' + err[0]);
  console.log(id + ' · ' + a.mes + ' vraies valeurs · ' + a.sim + ' simulées · ' + a.regs.length + ' réglages · ' + bouge + '/' + essais + ' réglages font bouger le simulé · largeur ' + a.sw + ' px');
  await page.close();
}
await browser.close();
console.log(H.length ? 'HONNETE ECHEC\n  ' + H.join('\n  ') : 'HONNETE OK');
console.log(Dg.length ? 'DOIGT ECHEC\n  ' + Dg.join('\n  ') : 'DOIGT OK');
process.exit(H.length || Dg.length ? 1 : 0);
