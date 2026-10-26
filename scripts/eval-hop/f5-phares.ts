// Voie f5-ajouter-corrige (D107, P6) : où la règle d'« Ajouter » met les houblons phares de chaque style (L14).
//   npx vite-node scripts/eval-hop/f5-phares.ts -- --etiquette=avant|apres
// Table des phares : tests/unit/hopIndexV4/pharesParStyle.ts (savoir de brasseur écrit avant la mesure). Recette : Nugget 20 g à 60′, 24 L (comme f3).
// Stock VIDE : les 505 variétés sont des achats, la liste ne montre que la règle de style (le stock ne fait que départager). Rang = position dans la liste.
// Sortie : `phares-<etiquette>.json` et un tableau (par style : meilleur rang, rang médian des phares, le premier phare) ; plus Mosaic dans les achats
// de la 21A avec le stock des fixtures (la capture du brasseur).
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { chargerCataloguePlein, DONNEES_FIXTURE } from '../../src/domain/hopIndex/v4/data';
import { creerMoteur } from '../../src/domain/hopIndex/v4/moteur';
import type { Recipe } from '../../src/domain/hopIndex/v4/recipe';
import { getStyleScale } from '../../src/domain/hopIndex/v4/style/scale';
import { PHARES_PAR_STYLE } from '../../tests/unit/hopIndexV4/pharesParStyle';

const args = process.argv.slice(2);
const opt = (n: string) => args.find((a) => a.startsWith(`--${n}=`))?.slice(n.length + 3);
const ETIQUETTE = opt('etiquette') ?? 'essai';
const SORTIE = resolve(opt('sortie') ?? 'work/missions/2026-10-25-integration-houblons/voies/f5-ajouter-corrige');
const recette = (style: string): Recipe => ({ name: style, styleCode: style, volumeL: 24, og: 1.06, boilMin: 60, yeastId: 'fermentis-us05', ebc: 10, additions: [{ id: 'a1', hopKey: 'beermaverick-nugget', moment: 'b60', grams: 20 }] });
const mediane = (xs: number[]) => { const s = [...xs].sort((a, b) => a - b); const m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
const plein = await chargerCataloguePlein();
const vide = creerMoteur({ catalogue: plein, stock: [] });
const fixtures = creerMoteur({ catalogue: plein, stock: DONNEES_FIXTURE.stock });
const noms = new Map(plein.map((h) => [h.id, h.name]));

const styles = Object.keys(PHARES_PAR_STYLE).map((code) => {
  const q = vide.dans(() => vide.quickAdds(recette(code), getStyleScale(code), null, { catalogueLimit: 10000, aromatique: true }));
  const liste = q.catalogue.map((r) => r.key);
  const rangs = PHARES_PAR_STYLE[code].map((id) => ({ id, nom: noms.get(id) ?? '(absent du catalogue)', rang: liste.indexOf(id) + 1 }));
  const trouves = rangs.filter((r) => r.rang > 0).map((r) => r.rang);
  return { style: code, total: liste.length, meilleur: Math.min(...trouves), mediane: mediane(trouves), absents: rangs.filter((r) => r.rang === 0).map((r) => r.id), rangs };
});
const q21a = fixtures.dans(() => fixtures.quickAdds(recette('21A'), getStyleScale('21A'), null, { catalogueLimit: 10000, aromatique: true }));
const mosaic21A = q21a.catalogue.findIndex((r) => r.key === 'beermaverick-mosaic') + 1;
// D174 : Citra simple (variété) dans les achats de la 21A, avec le stock des fixtures où Citra cryo est au stock (0 = absente : HEAD).
const citra21A = q21a.catalogue.findIndex((r) => r.key === 'beermaverick-citra') + 1;
const resume = {
  etiquette: ETIQUETTE, stylesAvecUnPhareDansLes10: styles.filter((s) => s.meilleur <= 10).length, stylesAvecUnPhareDansLes5: styles.filter((s) => s.meilleur <= 5).length,
  medianeDesMedianes: mediane(styles.map((s) => s.mediane)), mosaic21AAchats: mosaic21A, citraSimple21AAchats: citra21A, tetes21A: q21a.catalogue.slice(0, 5).map((r) => r.name), styles,
};
mkdirSync(SORTIE, { recursive: true });
writeFileSync(join(SORTIE, `phares-${ETIQUETTE}.json`), JSON.stringify(resume, null, 1));
for (const s of styles) console.log(`${s.style} meilleur ${String(s.meilleur).padStart(3)} médiane ${String(s.mediane).padStart(5)}/${s.total}  ${s.rangs.map((r) => `${r.nom} ${r.rang}`).join(' · ')}`);
console.log(`PHARES ${ETIQUETTE} : ${resume.stylesAvecUnPhareDansLes10}/31 styles avec un phare dans les 10, ${resume.stylesAvecUnPhareDansLes5}/31 dans les 5 ; médiane des médianes ${resume.medianeDesMedianes} ; Mosaic, achat n° ${mosaic21A} en 21A ; Citra simple, achat n° ${citra21A} (0 = absente) ; tête 21A : ${resume.tetes21A.join(', ')}`);
