// Contrôle CAL-GESTE-BRUIT (17.11) : « Trop d'info quand on bouge qqch, ça devient illisible... »
// À 390 × 844 tactile : joue le décalage de la Blonde (f6-b, trois semaines à droite, promesse en conflit) sur une page neuve, puis sur une
// autre page le déplacement f1-a (malt, une semaine à gauche) suivi de f6-b (les messages ne s'empilent pas). Après chaque geste :
//  1. messages visibles (alertes, bandeaux, cartes, toasts : .as-al, .as-toast, [role=alert], [role=status]) : 1 au plus ;
//  2. le texte d'un message, hors boutons, tient en 2 lignes au plus ;
//  3. aucun texte visible n'en chevauche un autre (rectangles des nœuds texte, recouvrement > 40 % de la hauteur, coupés par leurs conteneurs ; un texte caché derrière
//     l'en-tête, la barre d'onglets ou un panneau fixe ne compte pas) ;
//  4. le fantôme (.as-fant) ne recouvre aucun texte (test au point : avec pointer-events forcés, le fantôme est dessus).
// Passe 8 (CRITIQUE7 n° 3 et RECONTROLE6 n° 1) :
//  5. après un geste sans alerte, le message ne pousse aucune rangée (titres des rangées à la même place dans la page, 2 px près) et ne couvre pas
//     la barre d'onglets ;
//  6. deux ventes neuves la même semaine (S49, par le + de Ventes) : aucune pastille de Ventes n'en recouvre une autre (posées comme neuves),
//     et chaque pastille neuve porte son nom.
// node scripts/agents/controle-geste-bruit.mjs <page.html> [...]  → BRUIT OK | BRUIT ECHEC
import { createRequire } from 'module'; import path from 'path'; import { pathToFileURL } from 'url';
const req = createRequire('C:/Users/mrspa/Documents/Brasserie/.claude/worktrees/optimistic-ptolemy-2d1278/package.json');
const puppeteer = req('puppeteer-core');
const fichiers = process.argv.slice(2).filter(a => !a.startsWith('--')); if (!fichiers.length) { console.log('usage : <page.html>'); process.exit(2); }
const nav = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new' });
const wait = ms => new Promise(r => setTimeout(r, ms));
async function ouvrir(f) {
  const p = await nav.newPage(); await p.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 1 });
  p.errs = []; p.on('pageerror', e => p.errs.push(e.message));
  await p.goto(pathToFileURL(path.resolve(f)).href, { waitUntil: 'load' }); await wait(400); p.cdp = await p.target().createCDPSession(); return p;
}
const T = (p, type, x, y) => p.cdp.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x, y, id: 1 }] });
async function glisser(p, sel, fx, dx) {
  const r = await p.evaluate(s => { const e = document.querySelector(s); window.scrollTo({ top: 0, behavior: 'instant' }); e.scrollIntoView({ block: 'center' }); const b = e.getBoundingClientRect(); return { x: b.left, w: b.width, cy: b.top + b.height / 2 }; }, sel);
  const x = Math.min(r.x + r.w * fx, 360); await wait(150);
  await T(p, 'touchStart', x, r.cy); await wait(60);
  for (let k = 1; k <= 14; k++) { await T(p, 'touchMove', x + dx * k / 14, r.cy); await wait(25); }
  await wait(120); await T(p, 'touchEnd'); await wait(900);
}
function mesure() {
  const vis = e => { if (!e || !e.getClientRects().length) return false; if (e.checkVisibility && !e.checkVisibility({ opacityProperty: true, visibilityProperty: true })) return false; const b = e.getBoundingClientRect(); return b.width > 1 && b.height > 1 && b.bottom > 0 && b.top < innerHeight; };
  const inter = (a, b) => ({ l: Math.max(a.l, b.l), t: Math.max(a.t, b.t), r: Math.min(a.r, b.r), b: Math.min(a.b, b.b) });
  const R = b => ({ l: b.left, t: b.top, r: b.right, b: b.bottom });
  const nomTxt = n => n.textContent.replace(/\s+/g, ' ').trim().slice(0, 28);
  // 1-2. messages
  let msg = [...document.querySelectorAll('.as-al,.as-toast,[role=alert],[role=status]')].filter(vis);
  msg = msg.filter(m => !msg.some(o => o !== m && o.contains(m)));
  const lignes = m => { const tops = []; const w = document.createTreeWalker(m, NodeFilter.SHOW_TEXT);
    for (let n; (n = w.nextNode());) { if (!n.textContent.trim() || n.parentElement.closest('button') || !vis(n.parentElement)) continue; const g = document.createRange(); g.selectNodeContents(n);
      for (const b of g.getClientRects()) if (b.width > 1 && !tops.some(t => Math.abs(t - b.top) < 6)) tops.push(b.top); } return tops.length; };
  const messages = msg.map(m => ({ txt: m.textContent.replace(/\s+/g, ' ').trim().slice(0, 70), lignes: lignes(m) }));
  // 3. textes visibles (coupés par overflow, cachés derrière un élément fixe ou collant qui ne les contient pas)
  const fixes = [...document.querySelectorAll('body *')].filter(e => { const p = getComputedStyle(e).position; return (p === 'fixed' || p === 'sticky') && vis(e); }).map(e => ({ e, r: R(e.getBoundingClientRect()) }));
  const textes = []; const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let n; (n = w.nextNode());) {
    const pe = n.parentElement; if (!n.textContent.trim() || !pe || !vis(pe) || pe.closest('script,style,title,defs,symbol')) continue;
    const g = document.createRange(); g.selectNodeContents(n);
    for (const b of g.getClientRects()) {
      let r = R(b); if (r.r - r.l < 2 || r.b - r.t < 2) continue;
      for (let a = pe; a && a !== document.body; a = a.parentElement) { const cs = getComputedStyle(a); if (cs.overflowX !== 'visible' || cs.overflowY !== 'visible') r = inter(r, R(a.getBoundingClientRect())); }
      r = inter(r, { l: 0, t: 0, r: innerWidth, b: innerHeight }); if (r.r - r.l < 2 || r.b - r.t < 2) continue;
      const cache = fixes.some(f => !f.e.contains(pe) && !pe.contains(f.e) && f.r.l <= (r.l + r.r) / 2 && f.r.r >= (r.l + r.r) / 2 && f.r.t <= (r.t + r.b) / 2 && f.r.b >= (r.t + r.b) / 2 && getComputedStyle(f.e).zIndex !== 'auto');
      if (!cache) textes.push({ n, pe, r });
    }
  }
  const chev = [];
  for (let i = 0; i < textes.length; i++) for (let j = i + 1; j < textes.length; j++) {
    const a = textes[i], b = textes[j]; if (a.n === b.n) continue; const x = inter(a.r, b.r);
    if (x.r - x.l > 2 && x.b - x.t > Math.max(4, 0.4 * Math.min(a.r.b - a.r.t, b.r.b - b.r.t))) chev.push(nomTxt(a.n) + ' × ' + nomTxt(b.n));
  }
  // 4. fantôme dessus un texte
  const st = document.createElement('style'); st.textContent = '*{pointer-events:auto!important}'; document.head.appendChild(st);
  const fants = [...document.querySelectorAll('.as-fant')].filter(vis); const sousFant = [];
  for (const f of fants) { const fr = R(f.getBoundingClientRect());
    for (const t of textes) { const x = inter(fr, t.r); if (x.r - x.l < 2 || x.b - x.t < 2) continue;
      for (const [u, v] of [[.5, .5], [.2, .5], [.8, .5]]) { const e = document.elementFromPoint(x.l + (x.r - x.l) * u, x.t + (x.b - x.t) * v); if (e && (e === f || f.contains(e))) { sousFant.push(nomTxt(t.n)); break; } } } }
  st.remove();
  const nv = document.querySelector('nav.bot'), nr = nv && vis(nv) ? nv.getBoundingClientRect() : null;
  const surNav = nr ? msg.filter(m => m.getBoundingClientRect().bottom > nr.top + 1).map(m => m.textContent.trim().slice(0, 40)) : [];
  const alerte = [...document.querySelectorAll('.as-al')].some(vis);
  const pins = [...document.querySelectorAll('.lane[data-voie="vente"] .k17-p')].filter(vis).map(e => ({ r: R(e.getBoundingClientRect()), t: e.textContent.replace(/\s+/g, ' ').trim(), neuf: e.classList.contains('as-nouv') }));
  const pinsChev = []; for (let i = 0; i < pins.length; i++) for (let j = i + 1; j < pins.length; j++) { const x = inter(pins[i].r, pins[j].r); if (x.r - x.l > 2 && x.b - x.t > 2) pinsChev.push(pins[i].t + ' × ' + pins[j].t); }
  return { messages, chev: [...new Set(chev)], sousFant: [...new Set(sousFant)], fant: fants.length, surNav, alerte, pins, pinsChev };
}
let ko = 0;
for (const f of fichiers) {
  const jeux = [
    { nom: 'f6-b', pas: [['f6-b', '.bar[data-chose="b-01"]', .45, 183]] },
    { nom: 'f1-a puis f6-b', pas: [['f1-a', '.bar[data-chose="a-04"]', .5, -61], ['f6-b', '.bar[data-chose="b-01"]', .45, 183]] }
  ];
  for (const j of jeux) {
    const p = await ouvrir(f);
    for (const [g, sel, fx, dx] of j.pas) {
      const rangs = () => p.evaluate(() => [...document.querySelectorAll('#fb .lane > .lt')].map(e => Math.round(e.getBoundingClientRect().top + scrollY)));
      await p.evaluate(s => { window.scrollTo({ top: 0, behavior: 'instant' }); document.querySelector(s).scrollIntoView({ block: 'center' }); }, sel); await wait(150);
      const al0 = await p.evaluate(() => !!document.querySelector('.as-al')), r0 = await rangs();
      await glisser(p, sel, fx, dx); const m = await p.evaluate(mesure); const r1 = await rangs();
      const fautes = [];
      const pousse = r0.map((t, k) => r1[k] - t).filter(d => Math.abs(d) > 2);
      if (!al0 && !m.alerte && pousse.length) fautes.push('rangées poussées de ' + [...new Set(pousse)].join(', ') + ' px');
      if (m.surNav.length) fautes.push('message sur la barre d’onglets : ' + m.surNav.join(' | '));
      if (m.messages.length > 1) fautes.push(`${m.messages.length} messages`);
      m.messages.filter(x => x.lignes > 2).forEach(x => fautes.push(`message sur ${x.lignes} lignes « ${x.txt} »`));
      if (m.chev.length) fautes.push(`${m.chev.length} chevauchement(s) : ${m.chev.slice(0, 6).join(' ; ')}`);
      if (m.sousFant.length) fautes.push(`fantôme sur : ${m.sousFant.join(', ')}`);
      if (p.errs.length) fautes.push('erreurs : ' + p.errs.join(' | '));
      if (fautes.length) ko++;
      console.log(`${fautes.length ? 'KO' : 'ok'} ${path.basename(f)} ${j.nom}, après ${g} : messages ${m.messages.map(x => `[${x.lignes} l.] ${x.txt}`).join(' | ') || 'aucun'}${fautes.length ? ' → ' + fautes.join(' ; ') : ''}`);
    }
    await p.close();
  }
  // 6. deux ventes neuves en S49
  { const p = await ouvrir(f); const fautes = []; const noms = ['Bar du Lac', 'Épicerie Rolle']; let m = null;
    for (const [n, mt] of [[noms[0], '200'], [noms[1], '150']]) {
      const r = await p.evaluate(async (n, mt) => { const w = ms => new Promise(r => setTimeout(r, ms)), q = s => document.querySelector(s);
        const c = q('.lane[data-voie="vente"] .g2-c'); if (!c) return 'pas de + Ventes'; c.click(); await w(300);
        const nm = q('.as-fn input'), m = q('.as-fm input'); if (!nm) return 'pas de feuille'; nm.value = n; nm.dispatchEvent(new Event('input', { bubbles: true })); m.value = mt; m.dispatchEvent(new Event('input', { bubbles: true }));
        const se = q('.as-se[data-i="2"]'); if (se) se.click(); await w(80); const ok = q('.as-sh-ok'); if (!ok || ok.disabled) return 'Ajouter inactif'; ok.click(); await w(600); return 'ok'; }, n, mt);
      if (r !== 'ok') fautes.push(n + ' : ' + r);
      await p.evaluate(() => { const e = [...document.querySelectorAll('.lane[data-voie="vente"] .k17-p.as-nouv')].pop(); if (e) e.scrollIntoView({ block: 'center' }); }); await wait(300);
      m = await p.evaluate(mesure);
    }
    if (m.pinsChev.length) fautes.push('pastilles l’une sur l’autre : ' + m.pinsChev.join(' ; '));
    const neufs = m.pins.filter(x => x.neuf); noms.forEach(n => { if (!neufs.some(x => x.t.includes(n.slice(0, 8)))) fautes.push('pastille sans nom : ' + n); });
    if (m.chev.length) fautes.push(m.chev.length + ' chevauchement(s) : ' + m.chev.slice(0, 6).join(' ; '));
    if (m.surNav.length) fautes.push('message sur la barre d’onglets');
    if (p.errs.length) fautes.push('erreurs : ' + p.errs.join(' | '));
    if (fautes.length) ko++;
    console.log(`${fautes.length ? 'KO' : 'ok'} ${path.basename(f)} deux ventes en S49 : pastilles ${m.pins.map(x => '« ' + x.t + ' »').join(' ')}${fautes.length ? ' → ' + fautes.join(' ; ') : ''}`);
    await p.close(); }
}
// Passe 9 (CRITIQUE8 n° 1, 3, 5) :
//  7. une vente posée par le + de Ventes : le message ne couvre pas la pastille qu'il annonce ; puis on défile pendant le message, par pas de 30 px jusqu’à 450 px :
//     il ne reste sur aucun + de rangée ni aucun texte de la frise (rectangles) ;
//  8. dans la vue en largeur (<nom>-paysage.html, 844 × 390) : la Blonde décalée de 3 semaines, aucune étiquette de barre (hors « dans la barre ») ne
//     touche une autre barre de sa ligne ; la Blonde tirée d'une semaine, aucun point des jours actifs ne tombe sur son texte « J0 / … ».
const sous = () => { const vis = e => e && e.getClientRects().length && getComputedStyle(e).visibility !== 'hidden'; const R = e => e.getBoundingClientRect();
  const x = (a, b) => Math.min(a.right, b.right) - Math.max(a.left, b.left) > 2 && Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 2;
  const t = [...document.querySelectorAll('.as-toast')].find(vis); if (!t) return { toast: null, plus: [], textes: [] }; const tr = R(t);
  const plus = [...document.querySelectorAll('#fb .lane .g2-c')].filter(e => vis(e) && x(R(e), tr)).map(e => e.closest('.lane').dataset.nom);
  const textes = [...document.querySelectorAll('#fb .lt>*, #fb .bar .lbl, #fb .k17-p, #fb .k12-jg em')].filter(e => vis(e) && x(R(e), tr)).map(e => e.textContent.replace(/\s+/g, ' ').trim().slice(0, 30));
  return { toast: t.textContent.replace(/\s+/g, ' ').trim().slice(0, 50), plus, textes }; };
for (const f of fichiers) {
  { const p = await ouvrir(f); const fautes = [];
    const r = await p.evaluate(async () => { const w = ms => new Promise(r => setTimeout(r, ms)), q = s => document.querySelector(s);
      const c = q('.lane[data-voie="vente"] .g2-c'); if (!c) return 'pas de + Ventes'; c.click(); await w(300);
      const nm = q('.as-fn input'), m = q('.as-fm input'); if (!nm) return 'pas de feuille'; nm.value = 'Bar du Lac'; nm.dispatchEvent(new Event('input', { bubbles: true })); m.value = '200'; m.dispatchEvent(new Event('input', { bubbles: true }));
      const se = q('.as-se[data-i="2"]'); if (se) se.click(); await w(80); const ok = q('.as-sh-ok'); if (!ok || ok.disabled) return 'Ajouter inactif'; ok.click(); await w(500); return 'ok'; });
    if (r !== 'ok') fautes.push(r);
    const a = await p.evaluate(() => { const t = document.querySelector('.as-toast'), n = [...document.querySelectorAll('.lane[data-voie="vente"] .k17-p.as-nouv')].pop(); if (!t || !n) return null;
      const u = t.getBoundingClientRect(), v = n.getBoundingClientRect(); return Math.min(u.right, v.right) - Math.max(u.left, v.left) > 2 && Math.min(u.bottom, v.bottom) - Math.max(u.top, v.top) > 2; });
    if (a) fautes.push('le message couvre la pastille qu’il annonce');
    const avant = await p.evaluate(sous); const ap = { toast: null, plus: [], textes: [] };
    for (let k = 1; k <= 15; k++) { await p.evaluate(() => window.scrollBy({ top: 30, behavior: 'instant' })); await wait(60); const m = await p.evaluate(sous); ap.toast = m.toast; m.plus.forEach(x => ap.plus.includes(x) || ap.plus.push(x)); m.textes.forEach(x => ap.textes.includes(x) || ap.textes.push(x)); }
    if (ap.plus.length) fautes.push('message sur le + de ' + ap.plus.join(', ') + ' en défilant');
    if (ap.textes.length) fautes.push('message sur ' + ap.textes.map(x => '« ' + x + ' »').join(', ') + ' en défilant');
    if (p.errs.length) fautes.push('erreurs : ' + p.errs.join(' | ')); if (fautes.length) ko++;
    console.log(`${fautes.length ? 'KO' : 'ok'} ${path.basename(f)} message puis on défile : avant « ${avant.toast || 'aucun'} », après 450 px « ${ap.toast || 'parti'} »${fautes.length ? ' → ' + fautes.join(' ; ') : ''}`);
    await p.close(); }
  const fl = f.replace(/\.html$/, '-paysage.html'); let existe = false; try { (await import('fs')).accessSync(fl); existe = true; } catch {}
  if (existe && !f.endsWith('-paysage.html')) { const p = await nav.newPage(); await p.setViewport({ width: 844, height: 390, isMobile: true, hasTouch: true, deviceScaleFactor: 1, isLandscape: true });
    p.errs = []; p.on('pageerror', e => p.errs.push(e.message)); await p.goto(pathToFileURL(path.resolve(fl)).href, { waitUntil: 'load' }); await wait(400); p.cdp = await p.target().createCDPSession();
    const fautes = []; const cw = await p.evaluate(() => parseFloat(document.querySelector('#fb .col').style.width));
    const lbls = () => p.evaluate(() => { const o = []; document.querySelectorAll('#fb .bar .lbl').forEach(l => { if (l.classList.contains('in') || !l.getClientRects().length) return; const b = l.closest('.bar'), r = l.getBoundingClientRect();
      b.parentNode.querySelectorAll('.bar').forEach(x => { if (x === b || !x.getClientRects().length || getComputedStyle(x).display === 'none') return; const q = x.getBoundingClientRect();
        if (Math.min(r.right, q.right) - Math.max(r.left, q.left) > 2 && Math.min(r.bottom, q.bottom) - Math.max(r.top, q.top) > 2) o.push('« ' + l.textContent.replace(/\s+/g, ' ').trim().slice(0, 28) + ' » dans ' + ((x.querySelector('.lbl') || {}).textContent || '').replace(/\s+/g, ' ').trim().slice(0, 20)); }); }); return o; });
    await glisser(p, '.bar[data-chose="b-01"]', .3, 3 * cw); const l1 = await lbls(); if (l1.length) fautes.push('étiquette dans une autre barre : ' + l1.join(' ; '));
    const g = await p.evaluate(() => { const e = document.querySelector('.bar[data-chose="b-01"] .grip.g1'); e.scrollIntoView({ block: 'center' }); const b = e.getBoundingClientRect(); return { x: b.left + b.width / 2, y: b.top + b.height / 2 }; });
    await wait(150); await T(p, 'touchStart', g.x, g.y); await wait(60); for (let k = 1; k <= 14; k++) { await T(p, 'touchMove', g.x + cw * k / 14, g.y); await wait(25); } await wait(120); await T(p, 'touchEnd'); await wait(700);
    const pts = await p.evaluate(() => { const b = document.querySelector('.bar[data-chose="b-01"]'), em = b.querySelector('.k12-jg em'), r = em.getBoundingClientRect();
      const d = [...b.querySelectorAll('.as-pts b')].map(x => x.getBoundingClientRect()); return { em: em.textContent, n: d.length, sur: d.filter(q => Math.min(r.right, q.right) - Math.max(r.left, q.left) > 1 && Math.min(r.bottom, q.bottom) - Math.max(r.top, q.top) > 1).length }; });
    if (!pts.n) fautes.push('aucun point des jours actifs'); if (pts.sur) fautes.push(pts.sur + ' point(s) sur « ' + pts.em + ' »');
    const l2 = await lbls(); if (l2.length) fautes.push('après f2-a, étiquette dans une autre barre : ' + l2.join(' ; '));
    if (p.errs.length) fautes.push('erreurs : ' + p.errs.join(' | ')); if (fautes.length) ko++;
    console.log(`${fautes.length ? 'KO' : 'ok'} ${path.basename(fl)} 844 × 390, Blonde décalée puis tirée : « ${pts.em} », ${pts.n} points${fautes.length ? ' → ' + fautes.join(' ; ') : ''}`);
    await p.close(); }
}
await nav.close(); console.log(ko ? 'BRUIT ECHEC' : 'BRUIT OK'); process.exit(ko ? 1 : 0);
