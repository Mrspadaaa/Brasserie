// B2 n° 19 (D364 : le champ « Famille » sous « plus », seule exception à D350) : le <select> natif « Famille » était visible d'emblée dans le pied du plateau ouvert.
// Attendu, état 3, plateau Weizenmalz ouvert, 390 clair et cave puis 1280 : aucun <select> visible au repos du plateau ; un bouton « plus » (data-dp-voir-famille, aria-expanded) ; un toucher le montre
// (select « Famille, ligne N » visible) ; le choisir ranger la ligne dans la bande voulue ; un second toucher sur « plus » le cache.
// Usage : node controle-b2-19-famille.mjs [<build>] [<dossier captures>]   → FAMILLE OK | FAMILLE ECHEC <raisons>
import { demarrer, ouvrirLigne, dormir } from './aide-b2.mjs';
const { ouvrir, raisons, cap, verdict } = await demarrer();
const infos = [];
for (const [mode, theme] of [['t390', 'clair'], ['t390', 'cave'], ['pc1280', 'clair']]) {
  const p = await ouvrir('3', mode, theme);
  await ouvrirLigne(p, 'Weizenmalz');
  const ou = `${mode} ${theme}`;
  const visible = () => p.evaluate(() => [...document.querySelectorAll('[data-dp-ligne] details[open] select')].filter(s => s.offsetParent !== null).length);
  const plus = () => p.evaluate(() => { const b = document.querySelector('[data-dp-ligne] details[open] [data-dp-voir-famille]'); return b ? b.getAttribute('aria-expanded') : null; });
  const v0 = await visible(), pl = await plus(); infos.push({ ou, selectsVisibles: v0, plus: pl });
  if (v0 > 0) raisons.push(`${ou} : ${v0} <select> visible(s) au repos du plateau (Famille hors de « plus »)`);
  if (pl === null) { raisons.push(`${ou} : aucun bouton « plus » dans le plateau`); await p.close(); continue; }
  await cap(p, `19-repos-${mode}-${theme}`);
  await p.evaluate(() => document.querySelector('[data-dp-ligne] details[open] [data-dp-voir-famille]').click()); await dormir(300);
  if ((await visible()) !== 1 || (await plus()) !== 'true') raisons.push(`${ou} : « plus » ne montre pas le champ Famille (${await visible()} select, aria-expanded ${await plus()})`);
  await cap(p, `19-plus-${mode}-${theme}`);
  if (mode === 't390' && theme === 'clair') {
    const choix = await p.evaluate(() => { const s = document.querySelector('[data-dp-ligne] details[open] select[data-dp-famille]'); const o = [...s.options].find(o => o.value !== s.value); return o?.value ?? null; });
    if (choix) {
      await p.select('[data-dp-ligne] details[open] select[data-dp-famille]', choix); await dormir(500);
      const bande = await p.evaluate(() => [...document.querySelectorAll('[data-dp-ligne]')].find(a => a.querySelector('summary')?.innerText.includes('Weizenmalz'))?.closest('[data-dp-bande]')?.dataset.dpBande);
      if (!bande || bande === 'malt') raisons.push(`${ou} : choisir la famille « ${choix} » n'a pas rangé la ligne (bande ${bande})`);
    }
  }
  await p.close();
}
await verdict('FAMILLE', infos);
