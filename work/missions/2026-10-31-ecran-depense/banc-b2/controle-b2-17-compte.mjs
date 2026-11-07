// B2 n° 17 : après une lecture échouée (états `5` et `difficile`), « Articles, stock et matériel · 1 » annonçait un article alors qu'aucune ligne n'avait été lue
// (c'était la ligne vide du formulaire manuel).
// Attendu, 390 et 1280, clair et cave : le résumé de la section ne porte aucun compte (ni « · 1 », ni « · 0 ») tant que la ligne est vide ; une fois un libellé tapé dans
// la ligne, le compte est « · 1 » (le compte reste vrai pour une saisie à la main).
// Usage : node controle-b2-17-compte.mjs [<build>] [<dossier captures>]   → COMPTE OK | COMPTE ECHEC <raisons>
import { demarrer, dormir } from './aide-b2.mjs';
const { ouvrir, raisons, cap, verdict } = await demarrer();
const infos = [];
const resume = p => p.evaluate(() => document.querySelector('details[data-purchase-lines] > summary')?.innerText.replace(/\s+/g, ' ').trim() ?? null);
for (const etat of ['5', 'difficile']) for (const [mode, theme] of [['t390', 'clair'], ['t390', 'cave'], ['pc1280', 'clair'], ['pc1280', 'cave']]) {
  const p = await ouvrir(etat, mode, theme);
  const t = await resume(p);
  infos.push({ etat, mode, theme, t });
  if (t === null) raisons.push(`${etat} ${mode} ${theme} : section « Articles » introuvable`);
  else if (/·\s*\d+/.test(t)) raisons.push(`${etat} ${mode} ${theme} : « ${t} » annonce un compte alors qu'aucune ligne n'est lue`);
  await cap(p, `17-compte-${etat}-${mode}-${theme}`);
  if (etat === 'difficile' && mode === 't390' && theme === 'clair') {
    // La saisie à la main garde un compte vrai.
    await p.evaluate(() => { const d = document.querySelector('details[data-purchase-lines]'); d.open = true; }); await dormir(300);
    const champ = await p.$('details[data-purchase-lines] [aria-label^="Libellé ligne"]');
    if (champ) { await champ.click(); await p.keyboard.type('Malt fictif', { delay: 10 }); await p.keyboard.press('Tab'); await dormir(400); const t2 = await resume(p); if (!/·\s*1\b/.test(t2 ?? '')) raisons.push(`difficile : après un libellé tapé, le résumé dit « ${t2} » au lieu de « … · 1 »`); infos.push({ apresSaisie: t2 }); }
  }
  await p.close();
}
await verdict('COMPTE', infos);
