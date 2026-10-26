// Chronométrage de la voie c6 (L20) : simulerCas, substitutes et proposeVoies, à froid (premier appel du processus) et à chaud (médiane de 15 appels),
// sur le catalogue de démarrage (317) ou sur le catalogue complet (317 + les variétés des sources), même recette (S1, stout 16D, dégustation du 18.10).
// Un processus par jeu : npx vite-node chrono.ts -- --jeu=base | --jeu=plein ; sortie : une ligne JSON.
import * as v4 from '../../../../../src/domain/hopIndex/v4';
import { CATALOGUE, STOCK, chargerCataloguePlein } from '../../../../../src/domain/hopIndex/v4/data';
import * as adapter from '../../../../../prototypes/houblons-v4/parcours/src/moteur/index';
import { DEGUSTATION, H, recetteDegustee } from '../../../../../prototypes/houblons-v4/parcours/src/donnees/cas';

const jeu = process.argv.find((a) => a.startsWith('--jeu='))?.split('=')[1] ?? 'base';
const catalogue = jeu === 'plein' ? await chargerCataloguePlein() : [...CATALOGUE];
const stock = [...STOCK];
const moteur = (v4 as any).creerMoteur({ catalogue, stock });
adapter.configurerDonnees({ fiches: catalogue, catalogue, stock } as never);
const recette = recetteDegustee();
const t = <T,>(f: () => T): [T, number] => { const a = performance.now(); const r = f(); return [r, performance.now() - a]; };
const med = (xs: number[]) => { const s = [...xs].sort((a, b) => a - b); const k = s.length >> 1; return s.length % 2 ? s[k] : (s[k - 1] + s[k]) / 2; };
const ms = (x: number) => Math.round(x * 100) / 100;
const mesure = (f: () => unknown) => { const froid = t(f)[1]; const chauds = Array.from({ length: 15 }, () => t(f)[1]); return { froid: ms(froid), chaud: ms(med(chauds)) }; };

const cas = (complet: boolean) => () => moteur.simulerCas({ id: 'm', titre: 'm', ajouts: [{ id: 'x', houblon: H.idaho7, dose_gL: 4, moment: 'dryPost', jourDebut: 7, jours: 3 }], levure: 'fermentis-us05', recette: recette as never, degustation: DEGUSTATION, complet });
const sub = () => moteur.substitutes(H.nugget, { moment: 'b60', grams: 46, recipe: recette as never, style: adapter.style(recette.styleCode), stockFirst: true, limit: 8 });
const subToutes = () => moteur.substitutes(H.nugget, { moment: 'b60', grams: 46, recipe: recette as never, style: adapter.style(recette.styleCode), stockFirst: true });
const voies = () => adapter.proposer(recette, { floral: 1, resin: -1 } as never);
const out = {
  jeu, catalogue: catalogue.length,
  substitutes8: mesure(sub), substitutesToutes: mesure(subToutes),
  proposeVoies: mesure(voies),
  simulerCasLeger: mesure(cas(false)), simulerCasComplet: mesure(cas(true)),
};
console.log('CHRONO ' + JSON.stringify(out));
