// Critique B1 n° 14 : vrai chemin (tableau de bord → Actions rapides → Créer une recette → étape Malts/sucres), une ligne ajoutée, puis rechargement de la page
// (même URL) : l'app retombait sur le tableau de bord. Attendu : le wizard rouvre le brouillon À SON ÉTAPE, avec la ligne.
// Garde : sans brouillon (aucune modification), un rechargement ne rouvre pas de wizard vide.
// Usage : node controle-14-reprise.mjs <build> [<capture.png>] [clair|cave]   → REPRISE OK | REPRISE ECHEC <raisons>
import { ouvrir, dormir, verdict, capturer } from './banc.mjs';
const [construit, capture, theme = 'clair'] = process.argv.slice(2);
const raisons = [];
const { nav, p } = await ouvrir(construit, { url: '/?dev-local', theme });
const cliquerTexte = async (re) => {
  const h = await p.evaluateHandle((s) => [...document.querySelectorAll('button, [role=menuitem], a')].find((b) => new RegExp(s, 'i').test((b.textContent ?? '').replace(/\s+/g, ' '))), re.source);
  const e = h.asElement();
  if (!e) throw new Error('introuvable : ' + re);
  await e.tap(); await dormir(700);
};
const etape = () => p.evaluate(() => ({
  fer: !!document.querySelector('[data-etape="fermentescibles"]'),
  noms: [...document.querySelectorAll('[data-etape="fermentescibles"] [data-role="nom"]')].map((e) => e.textContent.trim()),
  texte: document.body.innerText.replace(/\s+/g, ' ').slice(0, 140),
}));
await dormir(2500);
await (await p.$('[aria-label^="Actions rapides"]')).tap(); await dormir(600);
await cliquerTexte(/^Créer une recette/);
await dormir(1500);
// Garde : sans modification, rechargement → pas de wizard vide rouvert.
await p.reload({ waitUntil: 'networkidle0' }); await dormir(2500);
const sansBrouillon = await p.evaluate(() => !!document.querySelector('[data-page-shell] [aria-label="Étapes"], nav[aria-label="Étapes"]'));
// Rouvrir et jouer le chemin jusqu'à la ligne.
if (sansBrouillon) raisons.push('un wizard sans brouillon est rouvert après rechargement');
if (!(await p.$('[aria-label^="Actions rapides"]'))) throw new Error('pas de bouton Actions rapides après rechargement');
await (await p.$('[aria-label^="Actions rapides"]')).tap(); await dormir(600);
await cliquerTexte(/^Créer une recette/);
await dormir(1500);
await cliquerTexte(/^Malts\/sucres/);
await p.waitForSelector('[data-etape="fermentescibles"] [data-role="ajout"]', { timeout: 20000 });
await (await p.$('[data-role="ajout"]')).tap(); await dormir(300);
await p.keyboard.type('Pilsner essai', { delay: 10 }); await p.keyboard.press('Enter'); await dormir(1500);
const avant = await etape();
if (!avant.noms.includes('Pilsner essai')) raisons.push(`la ligne n'a pas été ajoutée avant le rechargement (${avant.noms.join(' | ') || 'aucune'})`);
await p.reload({ waitUntil: 'networkidle0' }); await dormir(3500);
const apres = await etape();
if (capture) await capturer(p, capture);
if (!apres.fer) raisons.push(`après rechargement, l'étape Malts/sucres n'est pas rouverte (page : « ${apres.texte} »)`);
else if (!apres.noms.includes('Pilsner essai')) raisons.push(`étape rouverte sans la ligne (${apres.noms.join(' | ') || 'aucune'})`);
await verdict(nav, 'REPRISE', raisons, { sansBrouillon, avant: avant.noms, apres: apres.noms, texte: apres.texte });
