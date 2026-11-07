// Critique B1 n° 12 : 99999 ramené à 10 000 kg sans rien dire ; 0,004 accepté (bandeau « 20000,004 kg ») ; la piste du plateau à 15 000 noire de graduations.
// Attendu : un message au plafond, une masse au centième de kg (10 g), au plus 60 graduations sur la piste.
// Usage : node controle-12-masse.mjs <build> [<capture.png>]   → MASSE OK | MASSE ECHEC <raisons>
import { ouvrir, toucher, verdict, capturer, dormir } from './banc.mjs';
const [construit, capture] = process.argv.slice(2);
const { nav, p } = await ouvrir(construit, { etat: 'maquette' });
const raisons = [];
const saisir = async (sel, texte) => {
  await toucher(p, sel);
  await p.keyboard.down('Control'); await p.keyboard.press('KeyA'); await p.keyboard.up('Control');
  await p.keyboard.type(texte, { delay: 10 });
  await p.keyboard.press('Enter'); await dormir(400);
};
const valeur = (i) => p.$eval(`[data-mk="${i}"]`, (e) => e.getAttribute('aria-valuenow'));

// 0,004 : au centième
await saisir('[data-role="kg-ligne"][data-kl="1"]', '0,004');
const v004 = await valeur(1);
const decimales = String(v004).split('.')[1]?.length ?? 0;
if (decimales > 2) raisons.push(`0,004 accepté tel quel (masse ${v004}, ${decimales} décimales)`);
const bandeau = await p.evaluate(() => document.querySelector('.recipe-metrics')?.innerText.replace(/\s+/g, ' ') ?? '');
if (/\d,\d{3,}\s*kg/.test(bandeau)) raisons.push(`bandeau à 3 décimales : « ${bandeau.match(/\S*\d,\d{3,}\s*kg/)?.[0]} »`);

// 99999 : plafond dit
await saisir('[data-role="kg-ligne"][data-kl="0"]', '99999');
const alertes = await p.$eval('[data-role="alertes"]', (e) => e.innerText.replace(/\s+/g, ' ').trim());
const v99 = await valeur(0);
if (Number(v99) !== 10000) raisons.push(`99999 : masse ${v99} au lieu du plafond 10000`);
if (!/10[\s  ]?000/.test(alertes)) raisons.push(`99999 ramené à ${v99} sans le dire (alertes : « ${alertes} »)`);

// la piste du plateau (ligne 0 choisie, plage 15 000)
await toucher(p, '[data-sel="0"] [data-role="nom"]');
const graduations = await p.$$eval('[data-role="grad"] i', (els) => els.length);
if (graduations > 60) raisons.push(`piste à ${await p.$eval('[data-role="grad"] span:last-child', (e) => e.textContent)} : ${graduations} graduations (> 60)`);
if (capture) { await p.$eval('[data-role="piste"]', (e) => e.scrollIntoView({ block: 'center' })); await dormir(200); await capturer(p, capture); }
await verdict(nav, 'MASSE', raisons, { v004, v99, alertes, graduations, bandeau: bandeau.slice(0, 120) });
