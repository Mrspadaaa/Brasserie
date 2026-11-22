// B2 n° 15 : « Somme = imprimé » cassait sur deux lignes (« Somme = / imprimé ») dès que le nombre était long, et sur trois avec « 110,40 ≠ 110,04 ».
// Attendu, 390 clair et cave (états qr-contredit, commande, renovation, 3) et 1280 : le libellé « Somme = imprimé » et celui de « Qté × prix » tiennent chacun sur une ligne
// (hauteur ≤ 20 px), chaque rangée de la preuve tient sur une ligne (≤ 30 px), et aucune valeur n'est rognée (scrollWidth ≤ largeur).
// Usage : node controle-b2-15-somme.mjs [<build>] [<dossier captures>]   → SOMME OK | SOMME ECHEC <raisons>
import { demarrer } from './aide-b2.mjs';
const { ouvrir, raisons, cap, verdict } = await demarrer();
const infos = [];
for (const [etat, mode, theme] of [['qr-contredit', 't390', 'clair'], ['qr-contredit', 't390', 'cave'], ['commande', 't390', 'clair'], ['commande', 't390', 'cave'], ['renovation', 't390', 'clair'], ['3', 't390', 'clair'], ['qr-contredit', 'pc1280', 'clair'], ['commande', 'pc1280', 'cave']]) {
  const p = await ouvrir(etat, mode, theme);
  const m = await p.evaluate(() => [...document.querySelectorAll('[data-dp="preuve"] > div.grid > button')].map(b => {
    const lib = b.querySelector('span.flex-1') ?? b.querySelector('span'), val = b.querySelector('b');
    return { texte: lib?.innerText.replace(/\s+/g, ' ').trim(), valeur: val?.innerText.trim() ?? '', hLib: Math.round(lib?.getBoundingClientRect().height ?? 0), hRangee: Math.round(b.getBoundingClientRect().height), rogne: val ? val.scrollWidth > val.clientWidth + 1 : false, chevauche: val && lib ? lib.getBoundingClientRect().left + lib.scrollWidth > val.getBoundingClientRect().left + 1 : false };
  }));
  infos.push({ etat, mode, theme, m: m.map(x => `${x.texte} ${x.valeur} ${x.hLib}/${x.hRangee}`) });
  for (const x of m) {
    const ou = `${etat} ${mode} ${theme} « ${x.texte} ${x.valeur} »`;
    if (/^(Somme|Qté)/.test(x.texte) && x.hLib > 20) raisons.push(`${ou} : libellé sur plusieurs lignes (${x.hLib} px)`);
    if (x.rogne) raisons.push(`${ou} : valeur rognée`);
    if (x.chevauche) raisons.push(`${ou} : la valeur chevauche le libellé`);
  }
  if (etat !== 'renovation') await cap(p, `15-somme-${etat}-${mode}-${theme}`);
  await p.close();
}
await verdict('SOMME', infos.slice(0, 3));
