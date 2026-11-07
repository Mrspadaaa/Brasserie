// Critique B1 n° 5 : « 3 couleurs à renseigner », taper 2000 (hors 1–1500), Entrée → la valeur disparaît en silence et la chaîne saute à la ligne suivante.
// Attendu : le champ reste sur la même ligne, aria-invalid, rien de retenu ; une valeur bonne (« 5 ») passe ensuite à la suivante.
// Usage : node controle-5-couleur.mjs <build> [<capture.png>]   → COULEUR OK | COULEUR ECHEC <raisons>
import { ouvrir, toucher, verdict, capturer, dormir } from './banc.mjs';
const [construit, capture] = process.argv.slice(2);
const { nav, p } = await ouvrir(construit, { etat: 'maquette' });
const raisons = [];
const champ = () => p.evaluate(() => {
  const e = document.querySelector('input[data-role="couleur-ligne"], textarea[data-role="couleur-ligne"]');
  return e ? { ligne: e.getAttribute('data-ebcl'), invalide: e.getAttribute('aria-invalid'), valeur: e.value, actif: document.activeElement === e } : null;
});
await toucher(p, '[data-role="arens"]');
await dormir(300);
const ouvert = await champ();
if (!ouvert) raisons.push('la saisie de couleur ne s\'ouvre pas');
await p.keyboard.type('2000', { delay: 10 });
await p.keyboard.press('Enter');
await dormir(400);
const apres = await champ();
if (capture) await capturer(p, capture);
if (!apres) raisons.push('2000 : le champ a disparu (valeur avalée, chaîne sautée)');
else {
  if (apres.ligne !== ouvert?.ligne) raisons.push(`2000 : le champ a changé de ligne (${ouvert?.ligne} → ${apres.ligne})`);
  if (apres.invalide !== 'true') raisons.push('2000 : le champ n\'est pas marqué invalide (aria-invalid)');
  if (apres.valeur !== '2000') raisons.push(`2000 : la valeur tapée n'est plus lisible (« ${apres.valeur} »)`);
  // Corriger : « 5 » ↵ est retenu et passe à la ligne suivante.
  await p.keyboard.down('Control'); await p.keyboard.press('KeyA'); await p.keyboard.up('Control'); await p.keyboard.press('Backspace');
  await p.keyboard.type('5', { delay: 10 }); await p.keyboard.press('Enter'); await dormir(400);
  const suite = await champ();
  if (!suite || suite.ligne === apres.ligne) raisons.push('« 5 » ↵ après l\'erreur : la saisie ne passe pas à la ligne suivante');
  else if (suite.invalide === 'true') raisons.push('la ligne suivante hérite de l\'erreur');
}
await verdict(nav, 'COULEUR', raisons, { ouvert, apres });
