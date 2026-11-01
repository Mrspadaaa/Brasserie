// Voie b1-etiquettes : les empreintes du moteur, avant/après, sur le catalogue plein (317 de base + ajouts).
//   npx vite-node work/missions/2026-10-25-integration-houblons/voies/b1-etiquettes/empreintes.ts -- [--sortie=<fichier.json>]
// À lancer depuis la racine d'un arbre (HEAD en dossier temporaire, puis HEAD + les fichiers de la voie) : les deux sorties doivent être identiques.
// Ce qui est haché : substitutes() (remplaçants, scores, doses, `regle` comprise) pour chaque variété du catalogue plein à 60′ et par défaut,
// proposeVoies() (Suggérer) sur deux recettes, le profil de chaque variété. Le texte d'étiquette de l'α (`from`) n'y entre pas : c'est un libellé.
import { createHash } from 'node:crypto';
import { writeFileSync } from 'node:fs';
import { CATALOGUE, chargerCataloguePlein } from '../../../../../src/domain/hopIndex/v4/data';
import { creerMoteur } from '../../../../../src/domain/hopIndex/v4/moteur';
import type { Recipe } from '../../../../../src/domain/hopIndex/v4/recipe';

const sortie = process.argv.find((a) => a.startsWith('--sortie='))?.slice(9);
const sha = (x: unknown) => createHash('sha256').update(JSON.stringify(x)).digest('hex').slice(0, 16);
const plein = await chargerCataloguePlein();
const m = creerMoteur({ catalogue: plein, stock: [] });
const R21C: Recipe = { name: 'Hazy', styleCode: '21C', volumeL: 20, og: 1.058, boilMin: 60, yeastId: 'fermentis-us05', ebc: 8, additions: [
  { id: 'a1', hopKey: 'beermaverick-nugget', moment: 'b60', grams: 20 }, { id: 'a2', hopKey: 'beermaverick-cascade', moment: 'dryActive', grams: 80 }] };
const R16D: Recipe = { name: 'Stout', styleCode: '16D', volumeL: 24, og: 1.06, boilMin: 60, yeastId: 'fermentis-us05', ebc: 70, additions: [
  { id: 'a1', hopKey: 'beermaverick-nugget', moment: 'b60', grams: 46 }] };

const ids = plein.map((h) => h.id).sort();
const out: Record<string, string> = { variétés: String(ids.length), de_base: String(CATALOGUE.length) };
out.substitutes_defaut = sha(ids.map((id) => m.substitutes(id)));
out.substitutes_60 = sha(ids.map((id) => m.substitutes(id, { moment: 'b60', grams: 20, recipe: { ...R16D, additions: [{ id: 'a1', hopKey: id, moment: 'b60', grams: 20 }] }, limit: 40 })));
out.profils = sha(ids.map((id) => m.hopProfile(id)));
// Le profil recopie l'étiquette de l'α (`from`, profil-simule.ts:421) : « plage variétale (Beer Maverick) » devient « plage variétale (Hopslist) » pour un ajout.
// Sans ce seul libellé, le profil est identique à l'octet près.
const sansEtiquette = (x: unknown) => JSON.stringify(x).replace(/plage variétale \([^)]*\)/g, () => 'plage variétale (·)');
out.profils_hors_etiquette = createHash('sha256').update(sansEtiquette(ids.map((id) => m.hopProfile(id)))).digest('hex').slice(0, 16);
const GRAND = { maxBuy: 400, limit: 400, buyLimit: 400, perHop: 100, assemblages: false } as const;
out.proposer_21C = sha(m.proposeVoies(R21C, { citrus: 1 }, GRAND));
out.proposer_21C_floral = sha(m.proposeVoies(R21C, { floral: 1, resin: -1 }, { ...GRAND, moments: ['b60', 'wp'] }));
out.proposer_16D = sha(m.proposeVoies(R16D, { resin: 1 }, GRAND));
console.log(JSON.stringify(out, null, 1));
if (sortie) writeFileSync(sortie, JSON.stringify(out, null, 1));
