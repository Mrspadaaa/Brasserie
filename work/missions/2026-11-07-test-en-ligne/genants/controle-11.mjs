// Test en ligne n° 11 : la carte d'en-tête de la fiche ne met plus du texte d'aide dans une case de chiffre.
// Cas : malts SANS couleur ni PPG (comme les pastilles de suggestion du NEIPA), enregistrés par le vrai parcours ; fiche ouverte depuis la liste.
// Attendu : chaque cellule de « Repères de la recette » = un libellé + un chiffre ou « — » ; aucune cellule de plus de 14 caractères de valeur ;
// l'explication (pourquoi « — ») tient en UNE ligne sous la carte ; la carte ne déborde pas (scrollWidth ≤ clientWidth).
// Usage : node controle-11.mjs <build> <dossier captures> [clair|cave] [390|1280]   → CARTE OK | CARTE ECHEC <raisons>
import fs from 'node:fs';
import { ouvrirAmorce, jusquALaFiche } from './amorce.mjs';
const [construit, sortie, theme = 'clair', l = '390'] = process.argv.slice(2);
fs.mkdirSync(sortie, { recursive: true });
const raisons = [];
const { nav, p } = await ouvrirAmorce(construit, {
  theme, largeur: Number(l),
  transformer: `recipe.fermentables = [
    { name: 'Pilsner Malz (Weyermann)', kind: 'grain', use: 'empatage', weightKg: 4 },
    { name: 'Weizenmalz hell (Weyermann)', kind: 'grain', use: 'empatage', weightKg: 3 },
    { name: 'Haferflocken (flocons d\\'avoine)', kind: 'grain', use: 'empatage', weightKg: 1 }];
    delete recipe.ogTarget; delete recipe.colorEbc;`,
});
await jusquALaFiche(p, sortie, `c11-${theme}-${l}`);
const carte = await p.evaluate(() => {
  const dl = document.querySelector('dl[aria-label="Repères de la recette"]');
  if (!dl) return null;
  const cellules = [...dl.children].map((c) => ({
    libelle: c.querySelector('dt')?.textContent.trim(),
    valeur: [...c.querySelectorAll('dd')].map((d) => { const k = d.cloneNode(true); k.querySelectorAll('.sr-only').forEach((x) => x.remove()); return k.textContent.replace(/\s+/g, ' ').trim(); }).join(' | '),
  }));
  const apres = dl.parentElement.querySelectorAll('p');
  return { cellules, deborde: dl.scrollWidth > dl.clientWidth + 1, hauteur: Math.round(dl.getBoundingClientRect().height), raisons: document.querySelector('[data-role="raisons-tete"]')?.textContent ?? null, lignesSous: [...apres].map((x) => x.textContent.replace(/\s+/g, ' ').trim()).slice(0, 4) };
});
console.log(JSON.stringify(carte));
if (!carte) raisons.push('carte « Repères de la recette » introuvable');
else {
  for (const c of carte.cellules) {
    if (c.valeur.length > 14) raisons.push(`cellule ${c.libelle} : « ${c.valeur} » (texte d'aide dans une case de chiffre)`);
    if (/renseigne|projection|plage|vérifie|caractériser/i.test(c.valeur)) raisons.push(`cellule ${c.libelle} contient une consigne`);
  }
  if (carte.deborde) raisons.push('la carte déborde');
  if (carte.hauteur > 120) raisons.push(`carte haute de ${carte.hauteur} px`);
}
await p.screenshot({ path: `${sortie}/c11-${theme}-${l}-haut.png` });
await nav.close();
console.log(raisons.length ? `CARTE ECHEC ${raisons.join(' ; ')}` : 'CARTE OK');
