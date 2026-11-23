// Contrôle CAL-PLUS-MORT (17.11) : « Les boutons+ (général) et ajout fonctionne pas »
// À 390 × 844 tactile, chaque + du calendrier se touche (page neuve à chaque fois) : le + volant (#fab, .fab), puis le + du carré de
// chaque rangée (.lane .g2-c). OK seulement si le toucher ouvre un ajout visible : une feuille ou un dialogue ([role=dialog], dialog[open],
// [aria-modal=true]) qui porte un champ (input, select, textarea) ou au moins deux choix (boutons), ou un élément nouveau posé dans la rangée
// (.bar de plus, visible). Pour le + d'une rangée, la feuille est déjà sur sa rangée (le choix pressé nomme la rangée).
// Refus R2 de son registre (« Rangées ou cases de pose dédiées au + ») : aucune série de cases « + » dans les rangées (hors carré du titre).
// node scripts/agents/controle-plus-agit.mjs <page.html> [...]  → PLUS-AGIT OK | PLUS-AGIT ECHEC
import { createRequire } from 'module'; import path from 'path'; import { pathToFileURL } from 'url';
const req = createRequire('C:/Users/mrspa/Documents/Brasserie/.claude/worktrees/optimistic-ptolemy-2d1278/package.json');
const puppeteer = req('puppeteer-core');
const fichiers = process.argv.slice(2).filter(a => !a.startsWith('--')); if (!fichiers.length) { console.log('usage : <page.html>'); process.exit(2); }
const nav = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new' });
const wait = ms => new Promise(r => setTimeout(r, ms));
const SING = { Brassins: 'Brassin', 'Fêtes': 'Fête', Ventes: 'Vente', Achats: 'Achat', Travaux: 'Travaux', 'Activités': 'Activité', Papiers: 'Papier' };
async function ouvrir(f) {
  const p = await nav.newPage(); await p.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 1 });
  p.errs = []; p.on('pageerror', e => p.errs.push(e.message));
  await p.goto(pathToFileURL(path.resolve(f)).href, { waitUntil: 'load' }); await wait(400); p.cdp = await p.target().createCDPSession(); return p;
}
async function toucher(p, sel, k) {
  const r = await p.evaluate((s, k) => { const e = document.querySelectorAll(s)[k]; if (!e) return null; e.scrollIntoView({ block: 'center' }); const b = e.getBoundingClientRect(); return { x: b.left + b.width / 2, y: b.top + b.height / 2 }; }, sel, k);
  if (!r) return false; await wait(200);
  await p.cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: r.x, y: r.y, id: 1 }] }); await wait(60);
  await p.cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); await wait(500); return true;
}
const etat = (lane) => {
  const vis = e => { if (!e || !e.getClientRects().length) return false; const b = e.getBoundingClientRect(); if (b.width < 2 || b.height < 2) return false;
    if (e.checkVisibility && !e.checkVisibility({ opacityProperty: true, visibilityProperty: true })) return false; return b.bottom > 0 && b.top < innerHeight && b.right > 0 && b.left < innerWidth; };
  const dlg = [...document.querySelectorAll('[role=dialog],dialog[open],[aria-modal=true]')].filter(vis).map(d => ({
    champs: [...d.querySelectorAll('input,select,textarea')].filter(vis).length, choix: [...d.querySelectorAll('button,[role=radio],[role=option]')].filter(vis).length,
    presse: [...d.querySelectorAll('[aria-pressed=true],[aria-checked=true],[aria-selected=true]')].filter(vis).map(x => x.textContent.replace(/\s+/g, ' ').trim()) }));
  const L = lane ? [...document.querySelectorAll('#fb .lane')].find(l => l.dataset.nom === lane) : null;
  const bars = L ? [...L.querySelectorAll('.bar')].filter(vis).length : 0;
  const cases = [...document.querySelectorAll('#fb .lane use[href="#i-plus"], #fb .lane .ps i')].filter(u => !u.closest('.lt')).map(u => u.closest('i,button,div') || u).filter(vis).length;
  return { dlg, bars, cases };
};
let ko = 0;
for (const f of fichiers) {
  const p0 = await ouvrir(f);
  const lanes = await p0.evaluate(() => [...document.querySelectorAll('#fb .lane')].filter(l => { const c = l.querySelector('.g2-c'); return c && c.getClientRects().length; }).map(l => l.dataset.nom));
  await p0.close();
  const essais = [{ nom: '+ volant', sel: '#fab, .fab', k: 0, lane: null }].concat(lanes.map((n, k) => ({ nom: '+ ' + n, sel: '#fb .lane .g2-c', k, lane: n })));
  for (const t of essais) {
    const p = await ouvrir(f); const av = await p.evaluate(etat, t.lane);
    const fait = await toucher(p, t.sel, t.k); const ap = await p.evaluate(etat, t.lane);
    const feuille = ap.dlg.find(d => d.champs >= 1 || d.choix >= 2);
    const surRangee = !t.lane || !feuille || feuille.presse.some(x => x.startsWith(SING[t.lane] || t.lane) || x.startsWith(t.lane));
    const pose = t.lane && ap.bars > av.bars;
    const bon = fait && (feuille ? surRangee : pose) && ap.cases === 0 && !p.errs.length;
    if (!bon) ko++;
    console.log(`${bon ? 'ok' : 'KO'} ${path.basename(f)} ${t.nom} : ${!fait ? 'introuvable' : feuille ? `feuille (${feuille.champs} champ(s), ${feuille.choix} choix, pressé « ${feuille.presse.join(' / ') || 'rien'} »${surRangee ? '' : ', pas sur sa rangée'})` : pose ? 'élément posé' : 'rien d’ouvert ni de posé'} ; cases « + » visibles : ${ap.cases}${p.errs.length ? ' ; erreurs : ' + p.errs.join(' | ') : ''}`);
    await p.close();
  }
}
// Passe 9 (CRITIQUE8 n° 2, 4, 6) :
//  - + Ventes : nom et montant s'ouvrent vides (la vente probable reste une puce) ; 200 130 CHF ne se pose pas sans alerte dans la feuille ;
//  - + Brassins en S52 (bord de la vue en hauteur) : la barre posée écrit « prête » ;
//  - en 844 × 390 (la page et <nom>-paysage.html) : la feuille Vente tient dans sa largeur (scrollWidth ≤ clientWidth) et ne glisse pas quand on touche le montant.
for (const f of fichiers) {
  { const p = await ouvrir(f); const r = await p.evaluate(async () => { const w = ms => new Promise(r => setTimeout(r, ms)), q = s => document.querySelector(s);
      q('.lane[data-voie="vente"] .g2-c').click(); await w(300); const nm = q('.as-fn input'), m = q('.as-fm input'); if (!nm) return { err: 'pas de feuille' };
      const v0 = [nm.value, m.value]; nm.value = 'Bar du Lac'; nm.dispatchEvent(new Event('input', { bubbles: true })); m.value = '200130'; m.dispatchEvent(new Event('input', { bubbles: true })); await w(50);
      q('.as-sh-ok').click(); await w(400); const sh = q('.as-sh'); return { v0, ouverte: !!sh, alerte: sh ? ((sh.querySelector('[role=alert]') || {}).textContent || '') : '' }; });
    const bon = !r.err && !r.v0[0] && !r.v0[1] && r.ouverte && r.alerte; if (!bon) ko++;
    console.log(`${bon ? 'ok' : 'KO'} ${path.basename(f)} feuille Vente : champs à l’ouverture « ${r.v0 ? r.v0.join(' / ') : r.err} », 200 130 CHF → ${r.ouverte ? 'feuille gardée, alerte « ' + (r.alerte || 'aucune').trim().slice(0, 60) + ' »' : 'posée sans alerte'}`);
    await p.close(); }
  { const p = await ouvrir(f); const r = await p.evaluate(async () => { const w = ms => new Promise(r => setTimeout(r, ms)), q = s => document.querySelector(s);
      q('.lane[data-voie="brassage"] .g2-c').click(); await w(300); const nm = q('.as-fn input'); nm.value = 'Saison'; nm.dispatchEvent(new Event('input', { bubbles: true }));
      const se = [...document.querySelectorAll('.as-se')].find(b => b.textContent.startsWith('S52')); if (!se) return 'pas de S52'; se.click(); await w(60); q('.as-sh-ok').click(); await w(600);
      const b = [...document.querySelectorAll('#fb .bar.as-nouv')].pop(); return b ? b.textContent.replace(/\s+/g, ' ').trim() : 'rien de posé'; });
    const bon = /prête \d/.test(r); if (!bon) ko++; console.log(`${bon ? 'ok' : 'KO'} ${path.basename(f)} brassin posé en S52 : « ${r} »`); await p.close(); }
  const fl = f.replace(/\.html$/, '-paysage.html'); const liste = [f]; try { (await import('fs')).accessSync(fl); if (fl !== f) liste.push(fl); } catch {}
  for (const g of liste) { const p = await nav.newPage(); await p.setViewport({ width: 844, height: 390, isMobile: true, hasTouch: true, deviceScaleFactor: 1, isLandscape: true });
    p.errs = []; p.on('pageerror', e => p.errs.push(e.message)); await p.goto(pathToFileURL(path.resolve(g)).href, { waitUntil: 'load' }); await wait(400);
    const r = await p.evaluate(async () => { const w = ms => new Promise(r => setTimeout(r, ms)), q = s => document.querySelector(s); const fab = q('#fab, .fab'); if (!fab) return null; fab.click(); await w(300);
      const ty = q('.as-ty[data-v="vente"]'); if (!ty) return null; ty.click(); await w(250); const sh = q('.as-sh'); const a = { sw: sh.scrollWidth, cw: sh.clientWidth };
      const m = q('.as-fm input'); m.focus(); await w(300); const ti = q('#as-sh-ti').getBoundingClientRect(), sr = sh.getBoundingClientRect(), mr = m.getBoundingClientRect();
      return { ...a, sl: sh.scrollLeft, titre: ti.left >= sr.left - 1, montant: mr.right <= sr.right + 1 && mr.right <= innerWidth }; });
    const bon = r && r.sw <= r.cw + 1 && !r.sl && r.titre && r.montant && !p.errs.length; if (!bon) ko++;
    console.log(`${bon ? 'ok' : 'KO'} ${path.basename(g)} 844 × 390, feuille Vente : ${r ? `largeur ${r.sw} pour ${r.cw}, glisse ${r.sl} px, titre ${r.titre ? 'entier' : 'coupé'}, montant ${r.montant ? 'dans l’écran' : 'hors de l’écran'}` : 'introuvable'}${p.errs.length ? ' ; erreurs : ' + p.errs.join(' | ') : ''}`);
    await p.close(); }
}
await nav.close(); console.log(ko ? 'PLUS-AGIT ECHEC' : 'PLUS-AGIT OK'); process.exit(ko ? 1 : 0);
