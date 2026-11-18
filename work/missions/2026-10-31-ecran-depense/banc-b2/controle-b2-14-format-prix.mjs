// B2 n° 14 : Target bis, le champ prix du plateau disait « 0,04 » et la rangée « × 0,040 » : même nombre, deux formats (la maquette pu4d-b écrit « 0,098 » aux deux endroits).
// Attendu, 390 clair et cave, 1280 clair, état 3 : pour chaque ligne qui a un prix, le texte du champ « Prix ligne N » est identique à celui de la rangée (`data-dp-prix`) ;
// après avoir tapé 0,04 puis 2,3 dans le champ d'une ligne, le champ et la rangée disent encore la même chose.
// Usage : node controle-b2-14-format-prix.mjs [<build>] [<dossier captures>]   → FORMATPRIX OK | FORMATPRIX ECHEC <raisons>
import { demarrer, ouvrirLigne, numeroLigne, saisir, dormir } from './aide-b2.mjs';
const { ouvrir, raisons, cap, verdict } = await demarrer();
const infos = [];
const compare = p => p.evaluate(() => [...document.querySelectorAll('[data-dp-ligne]')].map(a => {
  const n = a.querySelector('[aria-label^="Prix ligne"]'); const r = a.querySelector('[data-dp-prix]');
  return { nom: a.querySelector('[data-dp-nom]')?.textContent.slice(0, 22), champ: n?.value ?? null, rangee: r?.textContent.trim() ?? '' };
}).filter(x => x.champ !== null && x.rangee && x.rangee !== '—'));
for (const [mode, theme] of [['t390', 'clair'], ['t390', 'cave'], ['pc1280', 'clair']]) {
  const p = await ouvrir('3', mode, theme);
  const tous = await compare(p);
  for (const x of tous) if (x.champ !== x.rangee) raisons.push(`${mode} ${theme} « ${x.nom} » : champ « ${x.champ} » ≠ rangée « ${x.rangee} »`);
  infos.push({ mode, theme, lignes: tous.length });
  await ouvrirLigne(p, 'Target bis'); const n = await numeroLigne(p, 'Target bis');
  for (const v of ['0,04', '2,3', '0,098']) {
    await saisir(p, `[aria-label="Prix ligne ${n}"]`, v);
    const c = (await compare(p)).find(x => x.nom.startsWith('Target bis'));
    if (c && c.champ !== c.rangee) raisons.push(`${mode} ${theme} : prix tapé « ${v} » : champ « ${c.champ} » ≠ rangée « ${c.rangee} »`);
  }
  await cap(p, `14-prix-${mode}-${theme}`);
  await p.close();
}
await verdict('FORMATPRIX', infos);
