// Test en ligne n° 27 : « Calcul incomplet : Galaxy : durée d'ébullition · Citra : durée d'ébullition · … » alors que chaque ajout a sa durée.
// La donnée manquante est la durée d'ébullition de LA RECETTE (Identité), pas celle des ajouts : le message le dit, une seule fois, sans accuser chaque houblon.
// Cas : recette dont `boilMin` est le TEXTE « 60 » (donnée importée : Number.isFinite('60') est faux, donc « durée d'ébullition » manque pour chaque houblon), trois houblons avec leur durée propre ; fiche enregistrée par le vrai parcours ; section « Potentiel aromatique » dépliée.
// Attendu : le message « Calcul incomplet » nomme « la recette » et ne répète pas la durée par houblon.
// Usage : node controle-27.mjs <build> <dossier captures> [clair|cave] [390|1280]   → CALCUL OK | CALCUL ECHEC <raisons>
import fs from 'node:fs';
import { ouvrirAmorce, jusquALaFiche } from './amorce.mjs';
import { dormir } from '../../2026-10-31-ecran-fermentescibles/banc-critique/banc.mjs';
const [construit, sortie, theme = 'clair', l = '390'] = process.argv.slice(2);
fs.mkdirSync(sortie, { recursive: true });
const raisons = [];
const { nav, p } = await ouvrirAmorce(construit, {
  theme, largeur: Number(l),
  transformer: `recipe.boilMin = '60';
    recipe.hops = [
      { name: 'Galaxy', alpha: 14, weightG: 20, stage: 'boil', timeMin: 20 },
      { name: 'Citra', alpha: 12, weightG: 20, stage: 'boil', timeMin: 60 },
      { name: 'Nelson Sauvin', alpha: 12, weightG: 20, stage: 'boil', timeMin: 20 }];`,
});
await jusquALaFiche(p, sortie, `c27-${theme}-${l}`);
await p.evaluate(() => { const b = [...document.querySelectorAll('button, summary')].find((x) => /^Potentiel aromatique/.test(x.textContent.trim())); b?.click(); });
await dormir(3500);
const texte = await p.evaluate(() => document.body.innerText.replace(/\s+/g, ' '));
const msg = texte.match(/Calcul incomplet[^.]*\./)?.[0] ?? null;
await p.screenshot({ path: `${sortie}/c27-${theme}-${l}.png`, fullPage: true });
console.log(JSON.stringify({ msg }));
if (!msg) raisons.push('aucun message « Calcul incomplet » (cas non reproduit : la recette de test calcule son IBU)');
else {
  const parHoublon = (msg.match(/(Galaxy|Citra|Nelson Sauvin) : durée d.ébullition/g) ?? []).length;
  if (parHoublon > 0) raisons.push(`la durée d'ébullition est reprochée à ${parHoublon} houblon(s) : « ${msg} »`);
  if (!/recette/i.test(msg)) raisons.push('le message ne dit pas que la durée manquante est celle de la recette');
}
await nav.close();
console.log(raisons.length ? `CALCUL ECHEC ${raisons.join(' ; ')}` : 'CALCUL OK');
