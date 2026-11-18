// B2 n° 8 (D374 : « « Garder » referme ») : sur Pilsner Malz (article proposé), un toucher sur « Garder » laissait la ligne ouverte.
// Attendu, 390 clair et cave, puis 1280 clair : après « Garder », le plateau de la ligne est fermé, le lien n'est plus « proposé » (niveau sûr) et les autres lignes ne bougent pas.
// Usage : node controle-b2-8-garder.mjs [<build>] [<dossier captures>]   → GARDER OK | GARDER ECHEC <raisons>
import { demarrer, ouvrirLigne, dormir } from './aide-b2.mjs';
const { ouvrir, raisons, cap, verdict } = await demarrer();
const infos = [];
for (const [mode, theme] of [['t390', 'clair'], ['t390', 'cave'], ['pc1280', 'clair']]) {
  const p = await ouvrir('3', mode, theme);
  await ouvrirLigne(p, 'Pilsner Malz');
  const lire = () => p.evaluate(() => { const a = [...document.querySelectorAll('[data-dp-ligne]')].find(a => a.querySelector('summary')?.innerText.includes('Pilsner Malz')); return { ouverte: a.querySelector('details').open, lien: a.querySelector('[data-dp-lien]')?.dataset.dpNiveau ?? 'sur', autres: [...document.querySelectorAll('[data-dp-ligne] details[open]')].length }; });
  const avant = await lire();
  const ok = await p.evaluate(() => { const a = [...document.querySelectorAll('[data-dp-ligne]')].find(a => a.querySelector('summary')?.innerText.includes('Pilsner Malz')); const b = [...a.querySelectorAll('button')].find(b => /^Garder/.test(b.getAttribute('aria-label') || b.innerText)); b?.click(); return !!b; });
  await dormir(500);
  const apres = await lire();
  infos.push({ mode, theme, avant, apres });
  if (!ok) raisons.push(`${mode} ${theme} : bouton « Garder » absent`);
  else {
    if (apres.ouverte) raisons.push(`${mode} ${theme} : la ligne reste ouverte après « Garder »`);
    if (apres.lien !== 'sur') raisons.push(`${mode} ${theme} : le lien reste « ${apres.lien} » après « Garder »`);
    if (apres.autres !== 0) raisons.push(`${mode} ${theme} : ${apres.autres} plateau(x) ouvert(s) après « Garder »`);
  }
  await cap(p, `8-garder-${mode}-${theme}`);
  await p.close();
}
await verdict('GARDER', infos);
