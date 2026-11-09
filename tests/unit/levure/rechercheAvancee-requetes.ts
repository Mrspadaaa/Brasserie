// Le jeu de requêtes de l'identité levure (voie r2, 2026-11-09-levure-retours) : la recherche de la levure, rendue générique
// (`src/domain/rechercheAvancee`), doit rendre la même liste et les mêmes comptes que le moteur d'avant, figé dans
// `rechercheAvancee-identite.json` (produit sur HEAD par work/missions/2026-11-09-levure-retours/voies/r2/gen-identite.ts).
import type { EtatFiltres, ReperesRecette, ResultatRecherche } from '../../../src/domain/levure/contrat';
import type { YeastReference } from '../../../src/domain/yeastReferences';

export interface Requete { nom: string; texte: string; filtres: EtatFiltres; reperes?: ReperesRecette; stockIds?: string[] }
const R19: ReperesRecette = { temperatureC: 19, abvVise: 7 };

export const REQUETES: Requete[] = [
  { nom: 'repos', texte: '', filtres: {} },
  { nom: 'repos-reperes', texte: '', filtres: {}, reperes: R19 },
  { nom: '1056', texte: '1056', filtres: {}, reperes: R19 },
  { nom: 'us-05', texte: 'us-05', filtres: {} },
  { nom: 'lallemand-seche', texte: 'lallemand', filtres: { forme: ['seche'] } },
  { nom: 'tolerance-famille', texte: '', filtres: { tolerance: { min: 12, max: 99 }, famille: ['ale'] }, reperes: R19 },
  { nom: 'sans-sta1', texte: '', filtres: { sansSta1: true } },
  { nom: 'effets-cumul', texte: '', filtres: { effets: ['esters:plus', 'phenols:moins'] } },
  { nom: 'temperature-ici', texte: '', filtres: { temperature: { min: 18, max: 22 }, disponibilite: ['ici'] }, reperes: R19 },
  { nom: 'stock', texte: '', filtres: { stock: true }, stockIds: ['fermentis-us05', 'lallemand-verdant-ipa'] },
  { nom: 'cidre', texte: '', filtres: { boisson: ['cidre'] } },
  { nom: 'trois-filtres', texte: '', filtres: { attenuation: { min: 75, max: 85 }, clarte: ['eleve'], labo: ['Fermentis'] } },
];

/** FNV-1a 32 bits : l'empreinte de la liste entière (l'ordre compris), sans figer 1 700 ids dans le dépôt. */
export function empreinte(ids: string[]): string {
  let h = 0x811c9dc5;
  for (const c of ids.join('|')) { h ^= c.charCodeAt(0); h = Math.imul(h, 0x01000193) >>> 0; }
  return h.toString(16).padStart(8, '0');
}

export function resume(r: ResultatRecherche & { tapee?: YeastReference }) {
  const ids = r.liste.map((l) => l.id);
  return { total: r.total, resume: r.resume, tapee: r.tapee?.id ?? null, n: ids.length, tete: ids.slice(0, 25), empreinte: empreinte(ids), comptes: r.comptes };
}
