// B2 n° 7 (lot 2) : Weizenmalz hell (2 Kg) a sa mouture « Zuschlag Schrotung 2 Kg × 0,10 = 0,20 » rattachée (« Rattacher les 5 ») ; la quantité du malt passe à 3 : la mouture quittait la rangée
// en silence (« ✓ 1,65/Kg ✓ 0,20 » perdu, badge « +4 », ligne dans une bande « Services · 2 Kg »).
// Attendu, 390 clair et cave : après quantité 3, puis après Kg → g, puis retour Kg : la rangée garde sa pastille « ✓ » de mouture, le badge de la bande Malts reste « +5 », aucune bande « Services »
// n'apparaît, et la mouture suit (3 Kg × 0,10 = 0,30 ; en g : montant inchangé).
// Usage : node controle-b2-7-mouture.mjs [<build>] [<dossier captures>]   → MOUTURE OK | MOUTURE ECHEC <raisons>
import { demarrer, ouvrirLigne, numeroLigne, saisir, uniteChoisir, dormir } from './aide-b2.mjs';
const { ouvrir, raisons, cap, verdict } = await demarrer();
const infos = [];
for (const theme of ['clair', 'cave']) {
  const p = await ouvrir('3', 't390', theme);
  await p.evaluate(() => document.querySelector('[data-dp-mouture-tous]')?.click()); await dormir(500);
  await ouvrirLigne(p, 'Weizenmalz'); const n = await numeroLigne(p, 'Weizenmalz');
  const lire = () => p.evaluate(() => {
    const a = [...document.querySelectorAll('[data-dp-ligne]')].find(a => a.querySelector('summary')?.innerText.includes('Weizenmalz'));
    const pastille = a.querySelector('summary [data-dp-mouture]');
    return { liee: !!pastille && /✓/.test(pastille.innerText), montant: pastille?.innerText.replace(/\s+/g, ' ').trim() ?? null, badge: document.querySelector('[data-dp-bande="malt"] [data-dp-bande-compte]')?.innerText.replace(/\s+/g, ' '), services: !!document.querySelector('[data-dp-bande="autres"], [data-dp-bande="service"]'), bandes: [...document.querySelectorAll('[data-dp-bande-entete] strong')].map(e => e.innerText).join(',') };
  });
  const etapes = [['début', null]];
  const avant = await lire(); infos.push({ theme, avant });
  if (!avant.liee) raisons.push(`${theme} : la mouture n'est pas rattachée au départ (« Rattacher les 5 » sans effet) : ${JSON.stringify(avant)}`);
  await saisir(p, `[aria-label="Quantité ligne ${n}"]`, '3');
  const q3 = await lire(); infos.push({ q3 });
  if (!q3.liee) raisons.push(`${theme} : quantité 3 : la mouture a quitté la rangée (${JSON.stringify(q3)})`);
  else if (!/0,30/.test(q3.montant ?? '')) raisons.push(`${theme} : quantité 3 : la mouture dit « ${q3.montant} » au lieu de 0,30`);
  if (/Services|Autres/.test(q3.bandes)) raisons.push(`${theme} : quantité 3 : une bande ${q3.bandes} est apparue`);
  if (q3.badge !== avant.badge) raisons.push(`${theme} : quantité 3 : badge « ${q3.badge} » au lieu de « ${avant.badge} »`);
  await cap(p, `7-mouture-q3-${theme}`);
  await uniteChoisir(p, 'Weizenmalz', 'g');
  const g = await lire(); infos.push({ g });
  if (!g.liee) raisons.push(`${theme} : Kg → g : la mouture a quitté la rangée (${JSON.stringify(g)})`);
  else if (!/0,30/.test(g.montant ?? '')) raisons.push(`${theme} : Kg → g : la mouture dit « ${g.montant} » au lieu de 0,30`);
  if (/Services|Autres/.test(g.bandes)) raisons.push(`${theme} : Kg → g : une bande ${g.bandes} est apparue`);
  await uniteChoisir(p, 'Weizenmalz', 'Kg');
  const r = await lire(); infos.push({ r });
  if (!r.liee || !/0,30/.test(r.montant ?? '')) raisons.push(`${theme} : g → Kg : mouture « ${r.montant} », liée : ${r.liee}`);
  await p.close();
}
// La mouture seulement PROPOSÉE (état d'arrivée, rien rattaché) : Kg → g ne la perd pas (même valeur, autre écriture) ; une quantité qui change n'y touche pas (rien n'est confirmé).
for (const theme of ['clair', 'cave']) {
  const p = await ouvrir('3', 't390', theme);
  await ouvrirLigne(p, 'Weizenmalz');
  const badge = () => p.evaluate(() => document.querySelector('[data-dp-bande="malt"] [data-dp-bande-compte]')?.innerText.replace(/\s+/g, ' '));
  const avant = await badge();
  await uniteChoisir(p, 'Weizenmalz', 'g');
  const g = await badge();
  const pastille = await p.evaluate(() => [...document.querySelectorAll('[data-dp-ligne]')].find(a => a.querySelector('summary')?.innerText.includes('Weizenmalz'))?.querySelector('summary [data-dp-mouture]')?.innerText.replace(/\s+/g, ' ') ?? null);
  infos.push({ theme, propose: { avant, g, pastille } });
  if (g !== avant) raisons.push(`${theme} proposée : Kg → g : badge « ${g} » au lieu de « ${avant} » (la mouture proposée a quitté la rangée)`);
  if (!pastille || !/0,20/.test(pastille)) raisons.push(`${theme} proposée : Kg → g : pastille « ${pastille} » au lieu de « 0,20 »`);
  await cap(p, `7-mouture-proposee-g-${theme}`);
  await p.close();
}
await verdict('MOUTURE', infos.slice(0, 3));
