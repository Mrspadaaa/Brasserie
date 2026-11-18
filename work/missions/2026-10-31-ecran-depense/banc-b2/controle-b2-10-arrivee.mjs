// B2 n° 10 (D378 : « rien ne se cache à l'arrivée ») : l'état `renovation` arrivait avec « Plié » allumé et ses quatre sous-familles fermées (13 lignes sur 16 cachées).
// Attendu, 390 (clair et cave) et 1280, à l'arrivée sans geste : états renovation, commande, 3 : toutes les rangées visibles, aucune ligne de sous-famille fermée, « Déplié » allumé et « Plié »
// éteint ; puis « Plié » replie tout, un toucher sur une sous-famille la rouvre.
// Usage : node controle-b2-10-arrivee.mjs [<build>] [<dossier captures>]   → ARRIVEE OK | ARRIVEE ECHEC <raisons>
import { demarrer, dormir } from './aide-b2.mjs';
const { ouvrir, raisons, cap, verdict } = await demarrer();
const infos = [];
const lire = p => p.evaluate(() => {
  // Le tiroir du port (« dont port 9,90 », replié par son propre geste) n'est pas une famille repliée : hors du contrôle.
  const lignes = [...document.querySelectorAll('[data-dp-ligne]')].filter(a => !a.hidden && !a.closest('[data-dp="port-tiroir"]'));
  return { total: lignes.length, visibles: lignes.filter(a => a.offsetParent !== null).length, sgFermes: [...document.querySelectorAll('[data-dp-sg-ligne][aria-expanded="false"]')].length, sg: document.querySelectorAll('[data-dp-sg-ligne]').length,
    plie: document.querySelector('[data-dp-plier-bouton="plie"]')?.getAttribute('aria-pressed'), deplie: document.querySelector('[data-dp-plier-bouton="deplie"]')?.getAttribute('aria-pressed') };
});
for (const [etat, mode, theme] of [['renovation', 't390', 'clair'], ['renovation', 't390', 'cave'], ['renovation', 'pc1280', 'clair'], ['commande', 't390', 'clair'], ['3', 't390', 'clair']]) {
  const p = await ouvrir(etat, mode, theme);
  const a = await lire(p); infos.push({ etat, mode, theme, ...a });
  const ou = `${etat} ${mode} ${theme}`;
  if (a.visibles < a.total) raisons.push(`${ou} : ${a.total - a.visibles} ligne(s) sur ${a.total} cachée(s) à l'arrivée`);
  if (a.sgFermes) raisons.push(`${ou} : ${a.sgFermes} sous-famille(s) fermée(s) sur ${a.sg} à l'arrivée`);
  if (a.plie === 'true' || a.deplie !== 'true') raisons.push(`${ou} : segment « Plié » ${a.plie}, « Déplié » ${a.deplie} à l'arrivée`);
  if (etat === 'renovation') {
    await cap(p, `10-arrivee-${mode}-${theme}`);
    if (mode === 't390' && theme === 'clair') {
      await p.evaluate(() => document.querySelector('[data-dp-plier-bouton="plie"]').click()); await dormir(400);
      const b = await lire(p);
      if (b.sgFermes !== b.sg) raisons.push(`${ou} : « Plié » : ${b.sgFermes} sous-familles fermées sur ${b.sg}`);
      await p.evaluate(() => document.querySelector('[data-dp-sg-ligne]').click()); await dormir(300);
      const c = await lire(p);
      if (c.sgFermes !== b.sg - 1) raisons.push(`${ou} : un toucher sur une sous-famille : ${c.sgFermes} fermées au lieu de ${b.sg - 1}`);
    }
  }
  await p.close();
}
await verdict('ARRIVEE', infos);
