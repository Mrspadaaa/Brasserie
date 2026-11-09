// Audit du bouton + (BX-4) : chaque écran, 390 tactile et 1280 ; place, ce qu'il couvre, menu. Banc local ?dev-local (serveur sur 3010).
import { createRequire } from 'node:module';
import fs from 'node:fs';
const require = createRequire('C:/Users/mrspa/AppData/Local/Temp/deploy-bc70/package.json');
const puppeteer = require('puppeteer-core');
const OUT = new URL('./captures/', import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1');
const dormir = ms => new Promise(r => setTimeout(r, ms));
const ECRANS = [
  ['bord', 'Bord', null], ['finances', 'Finances', null],
  ['brassins', 'Brassins', 'Brassins'], ['recettes', 'Brassins', 'Recettes'], ['atelier', 'Brassins', 'Atelier'], ['volumes', 'Brassins', 'Volumes'],
  ['stock', 'Stocks', 'Stock'], ['courses', 'Stocks', 'Courses'], ['futs', 'Stocks', 'Fûts'], ['materiel', 'Stocks', 'Matériel'], ['houblons', 'Stocks', 'Houblons'],
  ['clients', 'Clients', 'Clients'], ['impot', 'Clients', /Impôt/], ['tarifs', 'Clients', /Prix et marges|Tarifs/],
];
const ATTENDU = { bord: /^Nouvelle écriture/, finances: /^Nouvelle écriture/, brassins: /^Nouveau brassin/, recettes: /^Nouvelle recette/, atelier: /^Nouvelle idée/, volumes: /^Compagnon/, stock: /^Nouvel article/, courses: /^Copier la liste/, futs: /^Nouveau fût/, materiel: /^Nouveau matériel/, houblons: /^Nouvelle variété/, clients: /^Nouveau client/, impot: /^Compagnon/, tarifs: /^Nouveau tarif/, 'retour-recettes': /^Nouvelle recette/ };
const DOUBLONS = [[/^Nouvelle écriture/, /^Entrer une facture/], [/^Nouvelle recette/, /^Créer une recette/], [/^Nouveau brassin/, /^Lancer un brassin/]];
const fautes = [];
const MODES = [{ id: '390', w: 390, h: 844, t: true }, { id: '1280', w: 1280, h: 800, t: false }];
const nav = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new' });
const res = [];
async function mesurer(p) {
  return p.evaluate(() => {
    const fab = [...document.querySelectorAll('button')].find(b => /^Actions rapides/.test(b.getAttribute('aria-label') || '') && b.offsetParent !== null);
    if (!fab) return { fab: null };
    const r = fab.getBoundingClientRect();
    const couvre = new Set();
    for (const [x, y] of [[r.left + 4, r.top + 4], [r.right - 4, r.top + 4], [r.left + 4, r.bottom - 4], [r.right - 4, r.bottom - 4], [r.left + r.width / 2, r.top + r.height / 2]]) {
      for (const el of document.elementsFromPoint(x, y)) {
        if (fab.contains(el) || el.contains(fab)) continue;
        const i = el.closest('button,a,input,select,textarea,[role=button],[role=tab],summary');
        if (i && !i.closest('nav[aria-label="Navigation principale"]') && i.offsetParent !== null) couvre.add((i.getAttribute('aria-label') || i.textContent || i.tagName).trim().slice(0, 40));
      }
    }
    return { fab: { x: Math.round(r.left), y: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height), dr: Math.round(innerWidth - r.right), db: Math.round(innerHeight - r.bottom), label: fab.getAttribute('aria-label'), txt: fab.textContent.trim().slice(0, 30) }, couvre: [...couvre] };
  });
}
async function menu(p) {
  const ok = await p.evaluate(() => { const f = [...document.querySelectorAll('button')].find(b => /^Actions rapides/.test(b.getAttribute('aria-label') || '') && b.offsetParent !== null); if (!f) return false; f.click(); return true; });
  if (!ok) return null; await dormir(500);
  const items = await p.evaluate(() => [...document.querySelectorAll('[role=menuitem]')].filter(e => e.offsetParent !== null).map(e => e.innerText.replace(/\s+/g, ' ').trim().slice(0, 60)));
  return items;
}
async function fermerMenu(p) { await p.keyboard.press('Escape'); await dormir(300); }
async function cliquerTexte(p, txt, dans) {
  return p.evaluate((src, flags, dans) => { const re = new RegExp(src, flags); const horsNav = dans === 'main'; const zone = (dans && !horsNav && document.querySelector(dans)) || document;
    const el = [...zone.querySelectorAll('button,a,[role=tab]')].find(b => b.offsetParent !== null && !(horsNav && b.closest('nav[aria-label="Navigation principale"]')) && re.test((b.innerText || b.getAttribute('aria-label') || '').trim())); if (el) { el.click(); return true; } return false; }, txt.source, txt.flags, dans);
}
for (const m of MODES) {
  const p = await nav.newPage();
  await p.setViewport({ width: m.w, height: m.h, isMobile: m.t, hasTouch: m.t, deviceScaleFactor: 1 });
  for (let i = 0; i < 3; i++) { try { await p.goto('http://localhost:3010/?dev-local', { waitUntil: 'domcontentloaded' }); await p.waitForFunction(() => document.querySelector('nav[aria-label="Navigation principale"]'), { timeout: 60000 }); break; } catch { } }
  await dormir(2500);
  for (const [id, tab, sous] of ECRANS) {
    const o = { mode: m.id, ecran: id };
    o.nav = await cliquerTexte(p, new RegExp('^' + tab + '$'), 'nav[aria-label="Navigation principale"]'); await dormir(900);
    if (sous) { o.sous = await cliquerTexte(p, sous instanceof RegExp ? sous : new RegExp('^' + sous + String.raw`(\s|\(|$)`), 'main'); await dormir(900); }
    Object.assign(o, await mesurer(p));
    await p.screenshot({ path: `${OUT}${m.id}-${id}.png` });
    o.menu = await menu(p); if (o.menu) { await p.screenshot({ path: `${OUT}${m.id}-${id}-menu.png` }); await fermerMenu(p); }
    res.push(o); console.error(m.id, id, JSON.stringify(o.fab), o.couvre, (o.menu || []).slice(0, 2));
  }
  { await cliquerTexte(p, /^Brassins$/, 'nav[aria-label="Navigation principale"]'); await dormir(600); await cliquerTexte(p, /^Recettes(\s|\(|$)/, 'main'); await dormir(600);
    await cliquerTexte(p, /^Stocks$/, 'nav[aria-label="Navigation principale"]'); await dormir(600); await cliquerTexte(p, /^Brassins$/, 'nav[aria-label="Navigation principale"]'); await dormir(600); await cliquerTexte(p, /^Brassins$/, 'nav[aria-label="Navigation principale"]'); await dormir(600);
    const o = { mode: m.id, ecran: 'retour-recettes', ...(await mesurer(p)) }; o.menu = await menu(p); if (o.menu) await fermerMenu(p); res.push(o); }
  // Étapes de l'assistant de recette
  await menu(p); await cliquerTexte(p, /^(Créer une recette|Nouvelle recette)/); await dormir(2500);
  if (!(await p.evaluate(() => /Identité/.test(document.body.innerText) && /Malts\/sucres/.test(document.body.innerText)))) fautes.push(`${m.id} : l’assistant ne s’ouvre pas depuis le +`);
  for (const etape of ['Identité', 'Malts', 'Houblons', 'Levure', 'Paliers', 'Eau', 'Récap']) {
    await p.evaluate(e => { const b = [...document.querySelectorAll('button,[role=tab]')].find(x => x.offsetParent && (x.innerText || '').trim().startsWith(e) && !x.closest('nav[aria-label="Navigation principale"]')); b?.click(); }, etape); await dormir(1200);
    /* Page plein écran : le + flotte (#114), il passe sur ce qui défile ; la page lui réserve sa place en fin de contenu. Au repos : noté ; en bas de défilement : il ne couvre rien. */
    const repos = await mesurer(p);
    await p.evaluate(() => { for (const el of document.querySelectorAll('*')) if (el.scrollHeight > el.clientHeight + 4 && /(auto|scroll)/.test(getComputedStyle(el).overflowY)) el.scrollTop = el.scrollHeight; window.scrollTo(0, document.body.scrollHeight); }); await dormir(500);
    const o = { mode: m.id, ecran: 'assistant-' + etape, page: true, couvreRepos: repos.couvre, ...(await mesurer(p)) }; await p.screenshot({ path: `${OUT}${m.id}-assistant-${etape}.png` }); o.menu = await menu(p); if (o.menu) await fermerMenu(p); res.push(o); console.error(m.id, o.ecran, JSON.stringify(o.fab), o.couvre);
  }
  // Pages plein écran : fiche recette, assistant, jour de brassage
  await cliquerTexte(p, /^Brassins$/, 'nav[aria-label="Navigation principale"]'); await dormir(700); await cliquerTexte(p, /^Recettes(\s|$)/, 'main'); await dormir(900);
  const fiche = await p.evaluate(() => { const b = [...document.querySelectorAll('button,a,summary')].find(e => /Détails et actions/.test(e.innerText || '') && e.offsetParent); if (b) { b.click(); return true; } return false; }); await dormir(900);
  const ouvrir = await cliquerTexte(p, /^(Ouvrir|Voir la fiche|Fiche)/); await dormir(1500);
  if (fiche && ouvrir) { const o = { mode: m.id, ecran: 'page-recette', page: true, ...(await mesurer(p)) }; await p.screenshot({ path: `${OUT}${m.id}-page-recette.png` }); o.menu = await menu(p); if (o.menu) await fermerMenu(p); res.push(o); console.error(m.id, 'page-recette', JSON.stringify(o.fab), o.couvre); }
  await p.goto('http://localhost:3010/?dev-local', { waitUntil: 'domcontentloaded' }); await p.waitForFunction(() => document.querySelector('nav[aria-label="Navigation principale"]'), { timeout: 60000 }); await dormir(2000);
  await menu(p); await cliquerTexte(p, /^Créer une recette/); await dormir(2500);
  { const o = { mode: m.id, ecran: 'assistant', ...(await mesurer(p)) }; await p.screenshot({ path: `${OUT}${m.id}-assistant.png` }); o.menu = await menu(p); if (o.menu) { await p.screenshot({ path: `${OUT}${m.id}-assistant-menu.png` }); await fermerMenu(p); } res.push(o); console.error(m.id, 'assistant', JSON.stringify(o.fab), o.couvre); }
  await p.close();
}
for (const m of MODES) {
  const tabs = res.filter(o => o.mode === m.id && !o.page && o.fab);
  const ref = tabs[0]?.fab;
  for (const o of res.filter(o => o.mode === m.id)) {
    if (!o.fab) { if (!/assistant-Houblons/.test(o.ecran)) fautes.push(`${m.id} ${o.ecran} : pas de bouton +`); continue; }
    if (o.fab.w !== 64 || o.fab.h !== 40) fautes.push(`${m.id} ${o.ecran} : taille ${o.fab.w}×${o.fab.h} (attendu 64×40)`);
    if (!o.page && ref && (o.fab.x !== ref.x || o.fab.y !== ref.y)) fautes.push(`${m.id} ${o.ecran} : place ${o.fab.x},${o.fab.y} (onglets : ${ref.x},${ref.y})`);
    if (o.page && o.fab.dr !== ref?.dr) fautes.push(`${m.id} ${o.ecran} : ${o.fab.dr} px du bord droit (onglets : ${ref?.dr})`);
    if (o.couvre?.length) fautes.push(`${m.id} ${o.ecran} : couvre ${o.couvre.join(', ')}`);
    const att = ATTENDU[o.ecran]; if (att && !(o.menu && att.test(o.menu[0] || ''))) fautes.push(`${m.id} ${o.ecran} : 1re action « ${o.menu?.[0]} » (attendu ${att})`);
    for (const [a, b] of DOUBLONS) if (o.menu?.some(x => a.test(x)) && o.menu?.some(x => b.test(x))) fautes.push(`${m.id} ${o.ecran} : doublon ${a} / ${b}`);
  }
}
console.log(fautes.length ? 'PLUS ECHEC\n' + fautes.join('\n') : 'PLUS OK — ' + res.length + ' écrans');
fs.writeFileSync(new URL('./audit-plus.json', import.meta.url), JSON.stringify(res, null, 1));
await nav.close(); process.exit(fautes.length ? 1 : 0);
