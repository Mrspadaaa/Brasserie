// Test en ligne n° 5/6 (lot 5, décision du pilote, option A) : l'OG du bandeau est la même à chaque étape, et c'est la cible retenue de la recette quand elle existe.
// Fixture : « Stout export » avec grains (`?dev-local&etape=houblons&recette=identite`) : ogTarget 1,066, calcul en direct différent ; entrées inchangées → la cible gagne.
// Attendu : à Identité, Malts/sucres, Houblons, Levure, Récapitulatif : le bandeau dit « 1,066 » (virgule, 3 décimales, jamais « 1.0xx » ni « — ») ; si le calcul
// diffère, une ligne courte le dit : « retenue 1,066 · calculée 1,0xx ».
// Usage : node controle-og-bandeau.mjs <build> [<capture.png>] [clair|cave] [largeur]   → OG OK | OG ECHEC <raisons>
import { ouvrir, dormir, capturer } from '../2026-10-31-ecran-fermentescibles/banc-critique/banc.mjs';
const [construit, capture, theme = 'clair', l = '390'] = process.argv.slice(2);
const raisons = [];
const { nav, p } = await ouvrir(construit, { theme, largeur: Number(l), url: '/?dev-local&etape=houblons&recette=identite' });
await dormir(3000);
const lire = () => p.evaluate(() => {
  const band = document.querySelector('.recipe-metrics');
  const vis = band && band.getBoundingClientRect().height > 0 && getComputedStyle(band).display !== 'none';
  const og = vis ? [...band.querySelectorAll('span')].find((s) => s.textContent.trim() === 'OG')?.nextElementSibling?.textContent.trim() : null;
  const ecart = document.querySelector('[data-role="ecart-og"]')?.textContent.replace(/\s+/g, ' ').trim() ?? null;
  const etape = document.querySelector('nav[aria-label="Étapes"] [aria-current="step"]')?.getAttribute('aria-label');
  return { etape, og, ecart };
});
const aller = async (nom) => {
  await p.evaluate((n) => { [...document.querySelectorAll('nav[aria-label="Étapes"] button')].find((b) => b.getAttribute('aria-label') === n)?.click(); }, nom);
  await dormir(1800);
};
const vues = {};
for (const nom of ['Identité', 'Fermentescibles', 'Houblons', 'Levure', 'Récapitulatif']) {
  await aller(nom);
  vues[nom] = await lire();
  if (capture && nom === 'Levure') await capturer(p, capture);
}
const valeurs = Object.entries(vues).filter(([, v]) => v.og != null);
for (const [nom, v] of Object.entries(vues)) {
  if (v.og == null) { if (nom !== 'Eau') raisons.push(`${nom} : pas de bandeau OG visible`); continue; }
  if (!/^1,\d{3}$/.test(v.og)) raisons.push(`${nom} : OG « ${v.og} » (virgule et 3 décimales attendues)`);
}
const distinctes = [...new Set(valeurs.map(([, v]) => v.og))];
if (distinctes.length > 1) raisons.push(`l'OG change d'une étape à l'autre : ${valeurs.map(([n, v]) => `${n} ${v.og}`).join(' ; ')}`);
if (distinctes.length === 1 && distinctes[0] !== '1,066') raisons.push(`l'OG affichée (${distinctes[0]}) n'est pas la cible retenue 1,066`);
console.log(JSON.stringify(vues));
await nav.close();
console.log(raisons.length ? `OG ECHEC ${raisons.join(' ; ')}` : 'OG OK');
