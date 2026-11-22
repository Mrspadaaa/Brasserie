// Banc d'actionneurs N4 et N5 : des valeurs hors bornes sont acceptées en silence.
// N4 : « -1 » tapé dans une masse devenait « 1,0 kg » (le signe jeté par la lecture du nombre).
// N5 : fiche technique : PPG « 0 », « 0,004 », « -1 » acceptés et affichés ; couleur « -1 » acceptée.
// Attendu (comme B1 n° 5) : refus visible sur place (aria-invalid), la valeur tapée reste lisible dans le champ, rien n'est retenu ; une valeur bonne l'est.
// Usage : node controle-n4-n5-bornes.mjs <build> [<capture.png>]   → BORNES OK | BORNES ECHEC <raisons>
import { ouvrir, toucher, dormir, verdict, capturer } from './banc.mjs';
const [construit, capture, theme = 'clair'] = process.argv.slice(2);
const { nav, p } = await ouvrir(construit, { etat: 'couleurs', theme });
const raisons = [];
const infos = {};
const vider = async () => { await p.keyboard.down('Control'); await p.keyboard.press('KeyA'); await p.keyboard.up('Control'); await p.keyboard.press('Backspace'); };
const etat = (sel) => p.$eval(sel, (e) => ({ valeur: e.value, invalide: e.getAttribute('aria-invalid') }));

// N4 : la masse de la ligne 0 (5,0 kg), « -1 »
await toucher(p, '[data-role="kg-ligne"][data-kl="0"]');
await vider(); await p.keyboard.type('-1', { delay: 15 });
const n4 = { champ: await etat('[data-role="kg-ligne"][data-kl="0"]'), masse: await p.$eval('[data-mk="0"]', (e) => e.getAttribute('aria-valuenow')) };
infos.n4 = n4;
if (n4.masse !== '5') raisons.push(`N4 : « -1 » change la masse (${n4.masse} kg au lieu de 5)`);
if (n4.champ.invalide !== 'true') raisons.push('N4 : « -1 » n\'est pas marqué invalide');
if (n4.champ.valeur !== '-1') raisons.push(`N4 : la valeur tapée n'est plus lisible (« ${n4.champ.valeur} »)`);
if (capture) await capturer(p, capture.replace('.png', '-n4.png'));
await p.keyboard.press('Escape'); await dormir(300);

// N5 : la fiche de la ligne choisie
await toucher(p, '[data-sel="0"] [data-role="nom"]');
await toucher(p, '[data-role="fiche"]');
const ppg = 'input[aria-label^="Potentiel de"], textarea[aria-label^="Potentiel de"]';
const couleur = 'input[aria-label^="Couleur de"][aria-label$="en EBC"]:not([data-role]), textarea[aria-label^="Couleur de"][aria-label$="en EBC"]:not([data-role])';
const resume = () => p.$eval('[data-role="fiche"]', (e) => e.getAttribute('aria-label'));
const essai = async (sel, texte, nom) => {
  await toucher(p, sel);
  await vider(); await p.keyboard.type(texte, { delay: 15 });
  const e = await etat(sel), r = await resume();
  infos[nom] = { e, r };
  if (e.invalide !== 'true') raisons.push(`N5 : ${nom} « ${texte} » n'est pas marqué invalide`);
  if (e.valeur !== texte) raisons.push(`N5 : ${nom} « ${texte} » : la valeur tapée n'est plus lisible (« ${e.valeur} »)`);
  if (/PPG (0|-|−|0,004)/.test(r) && /PPG (0|-1|−1|0,004)\b/.test(r)) raisons.push(`N5 : ${nom} « ${texte} » retenu : ${r}`);
};
for (const t of ['0', '0,004', '-1']) await essai(ppg, t, `PPG ${t}`);
await essai(couleur, '-1', 'couleur -1');
if (capture) await capturer(p, capture.replace('.png', '-n5.png'));
// une bonne valeur est retenue
await toucher(p, ppg); await vider(); await p.keyboard.type('37', { delay: 15 });
const bon = await etat(ppg), rb = await resume();
infos.bon = { bon, rb };
if (bon.invalide === 'true' || !/PPG 37/.test(rb)) raisons.push(`N5 : PPG 37 refusé ou non retenu (${rb})`);
await verdict(nav, 'BORNES', raisons, infos);
