// Voie f12 : P-1 (nature d'un acte vétérinaire = Service) et P-2 (barrés sans information) sur reel-doc2.
// Banc v3 (PORT_BANC=5200), réponse enregistrée seulement. Écrit seulement dans ./captures et f12-journal.log.
import { lancer, feuilleDepense, capture, log, toucher, dormir, ecrireJournal } from './outil.mjs';

const COMBOS = [[390, 'clair'], [390, 'cave'], [1280, 'clair'], [1280, 'cave']];
const nav = await lancer();

const releve = (p) => p.evaluate(() => {
  const t = (e) => (e?.innerText ?? '').replace(/[  ]/g, ' ').replace(/\n+/g, ' ¦ ').trim();
  return {
    barres: [...document.querySelectorAll('[data-dp-avant]')].filter((e) => e.getClientRects().length).map(t),
    natures: [...document.querySelectorAll('[data-dp-nature]')].filter((e) => e.getClientRects().length).map((g) => `${g.getAttribute('aria-label')} → ${t(g.querySelector('[aria-pressed="true"]'))}`),
    groupes: [...document.querySelectorAll('[data-purchase-lines] *')].filter((e) => /^(Services|Autres|Matériel)\b/.test((e.innerText ?? '').trim()) && e.children.length < 4).map(t).slice(0, 4),
  };
});

async function doc2(L, th) {
  const q = await feuilleDepense(nav, 'reel-doc2', L, th);
  log(`f12 ${L} ${th} repos : ${JSON.stringify(await releve(q))}`);
  await q.evaluate(() => [...document.querySelectorAll('summary')].find((e) => (e.innerText ?? '').includes('Collerette'))?.scrollIntoView({ block: 'center' }));
  await dormir(300);
  log('  ' + await capture(q, 'f12-doc2-autres'));
  await toucher(q, 'Sedation IM', { ms: 900 });
  log(`f12 ${L} ${th} Sedation ouverte : ${JSON.stringify(await releve(q))}`);
  await q.evaluate(() => document.querySelector('[data-dp-nature]')?.scrollIntoView({ block: 'center' }));
  await dormir(300);
  log('  ' + await capture(q, 'f12-doc2-sedation'));
  await q.close();
}

try {
  for (const [L, th] of COMBOS) {
    try { await doc2(L, th); } catch (e) { log(`ERREUR ${L} ${th} : ${e.message.slice(0, 300)}`); }
  }
} finally { await nav.close(); log('FIN'); ecrireJournal('f12-journal'); }
