// Exploration de la chaîne PRODUIRE sur la fixture « ZZ TEST » (21.11) : Bord, Brassins, brassin en fermentation.
// `node explore.mjs` ; sortie texte sur la console, captures dans produire/captures/explore.
import path from 'node:path'; import fs from 'node:fs';
import { lancer, sleep } from '../acheter/banc.mjs';
import { fixtureProduire } from './fixture-produire.mjs';
const ICI = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1'));
const out = path.join(ICI, 'captures', 'explore'); fs.mkdirSync(out, { recursive: true });
const build = 'C:/Users/mrspa/AppData/Local/Temp/wf-produire/distf';
const auj = new Date().toISOString().slice(0, 10);
const b = await lancer({ build, fixture: fixtureProduire(auj).entrees, sortie: out });
const log = (...a) => console.log(...a);
try {
  log('ouvrir ms', await b.ouvrir());
  await b.cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
  log('BORD:', (await b.texte()).replace(/\n+/g, ' | ').slice(0, 700));
  log('BTN:', (await b.boutons()).slice(0, 25).join(' ¦ '));
  await b.cap('bord');
  for (const t of ['Brassins']) { log('>', t, await b.toucher(t).then(() => 'ok', (e) => e.message)); }
  log('BRASSINS:', (await b.texte()).replace(/\n+/g, ' | ').slice(0, 900));
  log('BTN:', (await b.boutons()).slice(0, 30).join(' ¦ '));
  await b.cap('brassins');
  log('journal erreurs', b.journal.erreurs.slice(0, 5), 'bloquees', b.journal.bloquees.length);
} catch (e) { log('ERREUR', e.message.slice(0, 300)); await b.cap('erreur'); }
finally { log('gestes', b.gestes(), 'traces', JSON.stringify(b.traces).slice(0, 400)); await b.fin(); }
