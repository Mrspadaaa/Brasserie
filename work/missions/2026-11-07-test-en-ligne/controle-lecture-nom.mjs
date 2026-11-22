// Lot 6, n° 9 : un houblon saisi « Nuget » est relié à Nugget (nom très proche) ; le brasseur doit VOIR son mot et la lecture (« Nuget · lu comme Nugget »),
// avec un toucher pour confirmer ou refuser. Jamais un nom remplacé en silence.
// Attendu : sur la carte, « Nuget · lu comme Nugget » + « Confirmer » + « Refuser » ; « Refuser » : la ligne reste sans variété (α ?) et la lecture n'est plus proposée ;
// « Confirmer » : la lecture disparaît, la ligne garde le mot « Nuget » (rien n'est renommé), l'α de Nugget est lu.
// Exige un build `VITE_HOP_V4=on`. Usage : node controle-lecture-nom.mjs <build> [<capture.png>] [clair|cave]   → LECTURE OK | LECTURE ECHEC <raisons>
import { ouvrirAmorce, allerEtape } from './genants/amorce.mjs';
import { dormir } from '../2026-10-31-ecran-fermentescibles/banc-critique/banc.mjs';
const [construit, capture, theme = 'clair'] = process.argv.slice(2);
const raisons = [];
const lancer = async (apres) => {
  const { nav, p } = await ouvrirAmorce(construit, { theme, transformer: `recipe.hops = [{ name: 'Nuget', alpha: 13, weightG: 46, stage: 'boil', timeMin: 60 }];` });
  await allerEtape(p, 'Houblons');
  await dormir(2500);
  const lire = () => p.evaluate(() => ({
    lecture: document.querySelector('[data-role="lecture-nom"]')?.textContent.replace(/\s+/g, ' ').trim() ?? null,
    boutons: [...document.querySelectorAll('[data-role="lecture-confirmer"], [data-role="lecture-refuser"]')].map((b) => b.textContent.trim()),
    carte: document.querySelector('[data-element="etape-carte-ajout"]')?.innerText.replace(/\s+/g, ' ').slice(0, 160) ?? null,
  }));
  const avant = await lire();
  let suite = null;
  if (apres) { await p.evaluate((r) => document.querySelector(`[data-role="${r}"]`)?.click(), apres); await dormir(1800); suite = await lire(); }
  return { nav, p, avant, suite };
};
{
  const { nav, p, avant } = await lancer(null);
  if (!avant.lecture) raisons.push(`la lecture n'est pas dite sur la carte (carte : « ${avant.carte} »)`);
  else {
    if (!/Nuget/.test(avant.lecture) || !/lu comme Nugget/.test(avant.lecture)) raisons.push(`lecture « ${avant.lecture} » (attendu : « Nuget · lu comme Nugget »)`);
    if (avant.boutons.join('|') !== 'Confirmer|Refuser') raisons.push(`gestes : ${avant.boutons.join(' | ') || 'aucun'}`);
  }
  if (capture) await p.screenshot({ path: capture });
  await nav.close();
}
if (!raisons.length) {
  const c = await lancer('lecture-confirmer');
  if (c.suite.lecture) raisons.push(`« Confirmer » : la lecture reste (« ${c.suite.lecture} »)`);
  if (!/α\s*\d/.test(c.suite.carte ?? '') ) raisons.push(`« Confirmer » : pas d'α lu (« ${c.suite.carte} »)`);
  await c.nav.close();
  const r = await lancer('lecture-refuser');
  if (r.suite.lecture) raisons.push(`« Refuser » : la lecture est reproposée (« ${r.suite.lecture} »)`);
  await r.nav.close();
}
console.log(raisons.length ? `LECTURE ECHEC ${raisons.join(' ; ')}` : 'LECTURE OK');
