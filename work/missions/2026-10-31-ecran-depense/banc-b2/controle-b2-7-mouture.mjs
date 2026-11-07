// B2 n° 7 (OBSERVATION, pas un correctif : voir RESULTAT.md) : Weizenmalz hell (2 Kg) a sa mouture « Zuschlag Schrotung 2 Kg × 0,10 = 0,20 » en pastille ; la quantité du malt passe à 3 : la mouture quittait
// la rangée en silence (la règle `millingParentIndex` de `services/purchaseEntry.ts` exige la même quantité) et revenait dans une bande « Services · 2 Kg ».
// Ce script joue le geste, avec la mouture seulement proposée PUIS rattachée (« Rattacher les 5 »), et dit ce qui reste visible. Il n'est pas un critère : il imprime `MOUTURE OBSERVE`.
// Usage : node controle-b2-7-mouture.mjs [<build>] [<dossier captures>]
import { demarrer, ouvrirLigne, numeroLigne, saisir, dormir } from './aide-b2.mjs';
const { ouvrir, cap, verdict } = await demarrer();
const infos = [];
for (const rattache of [false, true]) {
  const p = await ouvrir('3', 't390', 'clair');
  if (rattache) { await p.evaluate(() => document.querySelector('[data-dp-mouture-tous]')?.click()); await dormir(500); }
  await ouvrirLigne(p, 'Weizenmalz'); const n = await numeroLigne(p, 'Weizenmalz');
  const lire = () => p.evaluate(() => { const a = [...document.querySelectorAll('[data-dp-ligne]')].find(a => a.querySelector('summary')?.innerText.includes('Weizenmalz')); return { rangee: a.querySelector('summary').innerText.replace(/\s+/g, ' '), bandes: [...document.querySelectorAll('[data-dp-bande]')].map(b => b.querySelector('[data-dp-bande-entete]').innerText.replace(/\s+/g, ' ')).join(' | '), moutureLigne: !!a.querySelector('[data-dp-mouture-ligne]') }; });
  const avant = await lire();
  await saisir(p, `[aria-label="Quantité ligne ${n}"]`, '3');
  const apres = await lire();
  infos.push({ rattache, avant, apres });
  await cap(p, `7-mouture-${rattache ? 'rattachee' : 'proposee'}`);
  await p.close();
}
await verdict('MOUTURE OBSERVE', infos);
