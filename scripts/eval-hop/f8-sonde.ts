// Voie f8 (D118, D190) : ce qu'une forme produit (Citra cryo) reprend de sa variété (Citra). MESURE seulement.
//   npx vite-node scripts/eval-hop/f8-sonde.ts
import { FAMILIES } from '../../src/domain/hopIndex/v4/families';
import { creerMoteur } from '../../src/domain/hopIndex/v4/moteur';
import { citations, describeFamilies, familyWords } from '../../src/domain/hopIndex/v4/hops';
import { hopRef } from '../../src/domain/hopIndex/v4/data';
import { simulerCas } from '../../src/domain/hopIndex/v4/profil-simule';

const m = creerMoteur();
const CLES = ['beermaverick-citra', 'beermaverick-citra:cryo'];
for (const cle of CLES) {
  const h = hopRef(cle)!;
  const d = describeFamilies(h.varietyId), c = citations(h.varietyId);
  console.log('---', cle, '| nom', h.name, '| stock', h.stock?.grams, '| alpha', JSON.stringify(h.alpha));
  console.log('niveaux  ', FAMILIES.map((f) => `${f}:${d[f].level}(${d[f].sources}/${d[f].of})`).join(' '));
  console.log('citations', FAMILIES.filter((f) => c[f].status === 'cité').join(','));
  const w = familyWords(h.varietyId, h.catalogue);
  console.log('mots     ', JSON.stringify(w).slice(0, 160));
  const rep = m.hopRole ? m.hopRole(cle) : null;
  console.log('rôle     ', JSON.stringify(rep));
  const s = simulerCas({ recette: { name: 'x', styleCode: '22A', volumeL: 24, og: 1.081, boilMin: 60, yeastId: 'lallemand-verdant', ebc: 10, additions: [] }, levure: 'lallemand-verdant', ajouts: [{ houblon: cle, moment: 'dryActive', dose_gL: 4, jours: 3 }], complet: false } as never);
  const ap = s.apportsParHoublon[0];
  console.log('apport   ', FAMILIES.map((f) => `${f}:${ap.seul[f]}`).join(' '));
}
