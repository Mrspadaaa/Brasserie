// Rejoue une liste de gestes au doigt sur le build de test PRODUIRE (fixture « ZZ TEST », 21.11).
// Usage : `node pas.mjs <fichier-de-pas> [nom-de-sortie]`, avec CPU=4 pour le processeur ralenti ×4 (CDP).
// Une ligne par pas : `t=TEXTE` (exact), `c=TEXTE` (contient), `p=TEXTE` (préfixe), `w=REGEX` (attendre),
// `d` (texte et boutons visibles), `cap=NOM` (capture), `inp` (INP et durées d'interaction), `#` commentaire.
// Un pas en échec est noté ECHEC et le suivant continue. Chaque exécution repart d'une fixture neuve.
import path from 'node:path'; import fs from 'node:fs';
import { lancer, sleep } from '../acheter/banc.mjs';
import { fixtureProduire } from './fixture-produire.mjs';
const ICI = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1'));
const nom = process.argv[3] || 'pas';
const out = path.join(ICI, 'captures', nom); fs.mkdirSync(out, { recursive: true });
const etapes = fs.readFileSync(process.argv[2], 'utf8').split('\n').map((l) => l.trim()).filter((l) => l && !l.startsWith('#'));
const build = 'C:/Users/mrspa/AppData/Local/Temp/wf-produire/distf';
const auj = new Date().toISOString().slice(0, 10);
const b = await lancer({ build, fixture: fixtureProduire(auj).entrees, sortie: out });
const log = (...a) => console.log(...a);
const cpu = Number(process.env.CPU || 1);
await b.cdp.send('Emulation.setCPUThrottlingRate', { rate: cpu });
log(`[${nom}] CPU ×${cpu} ; ouvrir ms`, await b.ouvrir());
await b.p.evaluate(() => { window.__inp = []; try { new PerformanceObserver((l) => { for (const e of l.getEntries()) if (e.interactionId) window.__inp.push(Math.round(e.duration)); }).observe({ type: 'event', durationThreshold: 16 }); } catch { /* sans support */ } });
b.p.on('pageerror', (e) => log('  PAGEERROR', String(e.stack || e).replace(/\s+/g, ' ').slice(0, 700)));
b.p.on('console', async (m) => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) { const pile = await m.args()[0]?.evaluate((e) => (e && e.stack) ? String(e.stack) : '').catch(() => ''); log('  CONSOLE', m.text().slice(0, 200), '| PILE', String(pile).replace(/\s+/g, ' ').slice(0, 500)); } });
const t0 = Date.now(); const bilan = [];
for (const ligne of etapes) {
  const i = ligne.indexOf('='); const k = i < 0 ? ligne : ligne.slice(0, i); const v = i < 0 ? '' : ligne.slice(i + 1);
  const tt = Date.now();
  try {
    if (k === 't') await b.toucher(v);
    else if (k === 'c') await b.toucher(v, { contient: true });
    else if (k === 'p') await b.toucher(v, { prefixe: true });
    else if (k === 'w') { const ok = await b.p.waitForFunction((s) => new RegExp(s, 'i').test(document.body.innerText), { timeout: 20000 }, v).then(() => true, () => false); if (!ok) throw new Error(`jamais vu : ${v}`); }
    else if (k === 'd') { log('  TXT', (await b.texte()).replace(/\n+/g, ' | ').slice(0, 900)); log('  BTN', (await b.boutons()).filter((x) => !/Retour au tableau|Période|Rechercher|Plus : saisie|Brassins \(|Recettes \(/.test(x)).slice(0, 26).join(' ¦ ').slice(0, 1100)); }
    else if (k === 'cap') await b.cap(v);
    else if (k === 'inp') { const r = await b.p.evaluate(() => window.__inp.slice()); log('  INP', r.length ? `max ${Math.max(...r)} ms, ${r.length} interactions, ${r.join(',')}` : 'aucune interaction notée'); }
    else throw new Error(`pas inconnu : ${ligne}`);
    bilan.push(`${ligne} ${Date.now() - tt}ms`);
    log(`  ok ${ligne} (${Date.now() - tt} ms)`);
  } catch (e) { bilan.push(`ECHEC ${ligne}`); log(`  ECHEC ${ligne} : ${e.message.slice(0, 160)}`); await b.cap(`echec`).catch(() => {}); }
}
log(`[${nom}] gestes ${b.gestes()} ; durée ${Date.now() - t0} ms ; erreurs page ${b.journal.erreurs.length} ; hors localhost bloquées ${b.journal.bloquees.length}`);
log('  erreurs', b.journal.erreurs.slice(0, 4).join(' || ').slice(0, 500));
log('  tâches longues', JSON.stringify(b.traces.map((t) => [t.geste, t.calmeMs, t.ms])).slice(0, 700));
await b.fin();
