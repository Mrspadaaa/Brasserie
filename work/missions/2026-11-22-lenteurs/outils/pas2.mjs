// Passe 2 (21.11) : rejoue une liste de gestes AU DOIGT (touchscreen.tap) sur le build de test de port-carnet (copie de HEAD
// dans os.tmpdir(), jamais l'arbre de travail), fixture « ZZ TEST » de la passe 2, 390×844 tactile, réseau externe coupé, aucun Gemini.
// Usage : node pas2.mjs <fichier-de-pas> [nom] ; CPU=4 (défaut) ralentit le processeur ×4 (CDP). BUILD=<dossier> pour un autre build.
// Pas : t=TEXTE (exact) · c=TEXTE (contient) · p=TEXTE (préfixe) · ci=N|TEXTE (contient, N-ième ; -1 = dernier) · w=REGEX (attendre)
// e=SELECTEUR|VALEUR (toucher le champ puis taper) · k=Touche · xy=X,Y · drag=X1,Y1,X2,Y2 · scroll=PX · z=MS · esc · reload
// off / on (hors ligne réseau + aiTask) · d (texte + boutons) · dd (texte long) · s=collection|champ,champ (magasin) · cap=NOM · inp
// Chaque geste : temps jusqu'au DOM calme et INP de ses interactions. Un pas en échec est noté ECHEC, le suivant continue.
import path from 'node:path'; import fs from 'node:fs';
import { lancer, sleep } from './banc.mjs';
import { fixturePasse2 } from './fixture-passe2.mjs';
const ICI = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1'));
const nom = process.argv[3] || 'pas';
const out = path.join(process.env.OUT || path.join(process.env.TEMP || '.', 'lenteurs-pas'), nom); fs.mkdirSync(out, { recursive: true });
const etapes = fs.readFileSync(process.argv[2], 'utf8').split('\n').map((l) => l.trim()).filter((l) => l && !l.startsWith('#'));
const build = process.env.BUILD || 'C:/Users/mrspa/AppData/Local/Temp/wf2-dist';
const auj = new Date().toISOString().slice(0, 10);
const b = await lancer({ build, fixture: fixturePasse2(auj).entrees, sortie: out });
const log = (...a) => console.log(...a);
const cpu = Number(process.env.CPU || 4);
await b.cdp.send('Emulation.setCPUThrottlingRate', { rate: cpu });
await b.p.evaluateOnNewDocument(() => { window.__inp = []; try { new PerformanceObserver((l) => { for (const e of l.getEntries()) if (e.interactionId) window.__inp.push(Math.round(e.duration)); }).observe({ type: 'event', durationThreshold: 16 }); } catch { /* sans support */ } });
b.p.on('pageerror', (e) => log('  PAGEERROR', String(e.stack || e).replace(/\s+/g, ' ').slice(0, 400)));
log(`[${nom}] CPU ×${cpu} ; ouvrir ms`, await b.ouvrir());
const inpLu = () => b.p.evaluate(() => (window.__inp || []).slice()).catch(() => []);
const toucherCoord = async (x, y) => { await b.p.touchscreen.tap(x, y); await b.calme(); };
const glisser = async (x1, y1, x2, y2) => {
  const pt = (x, y) => [{ x, y, id: 1 }];
  await b.cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: pt(x1, y1) });
  for (let i = 1; i <= 12; i++) { await b.cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: pt(x1 + (x2 - x1) * i / 12, y1 + (y2 - y1) * i / 12) }); await sleep(16); }
  await b.cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); await b.calme();
};
const RACINE = () => { const ds = [...document.querySelectorAll('[role=dialog],[aria-modal=true]')].filter((e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0; }); return ds.at(-1) || document.body; };
const vue = () => b.p.evaluate((src) => { const z = (0, eval)(src)(); return (z.matches('[role=dialog],[aria-modal=true]') ? '[FEUILLE] ' : '') + z.innerText.replace(/[ \t]+/g, ' ').replace(/\n+/g, ' | '); }, `(${RACINE})`);
const btns = () => b.p.evaluate((src) => { const z = (0, eval)(src)(); return [...z.querySelectorAll('button,[role=button],[role=tab],[role=option],[role=radio],[role=switch],a,input,select,textarea')].filter((e) => { const q = e.getBoundingClientRect(); return q.width > 0 && q.height > 0; }).map((e) => { const q = e.getBoundingClientRect(); const t = e.tagName === 'BUTTON' ? '' : e.tagName.toLowerCase() + (e.type ? ':' + e.type : '') + ' '; return t + '«' + (e.getAttribute('aria-label') || e.innerText || e.placeholder || e.name || '').replace(/\s+/g, ' ').trim().slice(0, 44) + '» ' + Math.round(q.width) + '×' + Math.round(q.height) + '@' + Math.round(q.y); }); }, `(${RACINE})`);
const t0 = Date.now(); let gestesSup = 0;
const demarrerProfil = async () => { await b.cdp.send('Profiler.enable'); await b.cdp.send('Profiler.setSamplingInterval', { interval: 200 }); await b.cdp.send('Profiler.start'); };
if (process.env.PROFIL && !etapes.includes('prof')) await demarrerProfil();
for (const ligne of etapes) {
  const i = ligne.indexOf('='); const k = i < 0 ? ligne : ligne.slice(0, i); const v = i < 0 ? '' : ligne.slice(i + 1);
  const tt = Date.now(); const avant = (await inpLu()).length; const nt = b.traces.length;
  try {
    if (k === 't') await b.toucher(v);
    else if (k === 'c') await b.toucher(v, { contient: true });
    else if (k === 'p') await b.toucher(v, { prefixe: true });
    else if (k === 'ci') { const [n, txt] = [Number(v.split('|')[0]), v.slice(v.indexOf('|') + 1)]; if (n < 0) { const all = await b.p.evaluate((t) => [...document.querySelectorAll('button,[role=button],[role=tab],[role=menuitem],[role=option],[role=radio],a,label,summary,[role=switch],[role=checkbox]')].filter((e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && ((e.getAttribute('aria-label') || '') + ' ' + e.innerText).includes(t); }).length, txt); await b.toucher(txt, { contient: true, i: all + n }); } else await b.toucher(txt, { contient: true, i: n }); }
    else if (k === 'w') { const ok = await b.p.waitForFunction((s) => new RegExp(s, 'i').test(document.body.innerText), { timeout: 15000 }, v).then(() => true, () => false); if (!ok) throw new Error(`jamais vu : ${v}`); }
    else if (k === 'e') { const [sel, val] = [v.slice(0, v.indexOf('|')), v.slice(v.indexOf('|') + 1)]; await b.taper(sel, val); }
    else if (k === 'k') { await b.p.keyboard.press(v); await b.calme(); }
    else if (k === 'xy') { const [x, y] = v.split(',').map(Number); await toucherCoord(x, y); gestesSup++; }
    else if (k === 'drag') { const [x1, y1, x2, y2] = v.split(',').map(Number); await glisser(x1, y1, x2, y2); gestesSup++; }
    else if (k === 'scroll') await b.p.evaluate((px) => { const s = [...document.querySelectorAll('*')].filter((e) => e.scrollHeight > e.clientHeight + 20 && /auto|scroll/.test(getComputedStyle(e).overflowY)).sort((a, c) => c.clientHeight - a.clientHeight)[0]; (s || document.scrollingElement).scrollBy(0, px); window.scrollBy(0, px); }, Number(v));
    else if (k === 'z') await sleep(Number(v));
    else if (k === 'type') { await b.p.keyboard.type(v, { delay: 30 }); await b.calme(); }
    else if (k === 'esc') { await b.p.keyboard.press('Escape'); await b.calme(); }
    else if (k === 'reload') { await b.p.reload({ waitUntil: 'load' }); await b.p.waitForSelector('nav button', { timeout: 60000 }); await b.calme(5000); }
    else if (k === 'off') { await b.cdp.send('Network.enable'); await b.cdp.send('Network.emulateNetworkConditions', { offline: true, latency: 0, downloadThroughput: 0, uploadThroughput: 0 }); await b.p.evaluate(() => { window.__horsLigne = true; }); }
    else if (k === 'on') { await b.cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 0, downloadThroughput: -1, uploadThroughput: -1 }); await b.p.evaluate(() => { window.__horsLigne = false; }); }
    else if (k === 'd') { log('  TXT', (await vue()).slice(0, 800)); log('  BTN', (await btns()).slice(0, 30).join(' ¦ ').slice(0, 950)); }
    else if (k === 'dd') log('  TXT', (await vue()).slice(0, 3500));
    else if (k === 's') { const [col, ch] = v.split('|'); const r = await b.p.evaluate((c) => JSON.parse(localStorage.getItem('parcours-calendrier:cache') || '[]').filter((e) => e.name === c).map((e) => e.data), col); log(`  STORE ${col} (${r.length})`, JSON.stringify(ch ? r.map((x) => Object.fromEntries(['id', ...ch.split(',')].map((f) => [f, x[f]]))) : r).slice(0, 1500)); }
    else if (k === 'cap') await b.cap(v);
    else if (k === 'prof') { if (process.env.PROFIL) await demarrerProfil(); if (process.env.TRACE) await b.p.tracing.start({ path: path.join(out, 'trace.json'), screenshots: false, categories: ['devtools.timeline', 'disabled-by-default-devtools.timeline'] }); }
    else if (k === 'inp') { const r = await inpLu(); log('  INP', r.length ? `max ${Math.max(...r)} ms, ${r.length} interactions` : 'aucune'); }
    else throw new Error(`pas inconnu : ${ligne}`);
    const nouv = (await inpLu()).slice(avant); const tr = b.traces[nt];
    if (/^(t|c|p|ci|e|xy|drag|k|esc)$/.test(k)) log(`  ok ${ligne.slice(0, 70)} | ${Date.now() - tt} ms${tr ? ` calme ${tr.calmeMs} cible ${tr.cible}` : ''}${nouv.length ? ` INP ${Math.max(...nouv)}` : ''}`);
  } catch (e) { log(`  ECHEC ${ligne.slice(0, 80)} : ${e.message.slice(0, 220)}`); await b.cap(`echec`).catch(() => {}); }
}
if (process.env.PROFIL) { const { profile } = await b.cdp.send('Profiler.stop'); fs.writeFileSync(path.join(out, `${nom}.cpuprofile`), JSON.stringify(profile)); }
if (process.env.TRACE) await b.p.tracing.stop();
const tous = await inpLu();
log(`[${nom}] gestes ${b.gestes() + gestesSup} ; durée ${Date.now() - t0} ms ; INP max ${tous.length ? Math.max(...tous) : '-'} (${tous.length}) ; erreurs ${b.journal.erreurs.length} ; ${b.journal.erreurs.slice(0, 3).join(' || ').slice(0, 400)}`);
await b.fin();
