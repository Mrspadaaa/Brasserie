// Voie f9 : ce que les scripts f9-* partagent. Sa vraie recette (neipa v3), les six houblons qu'il attend, les quatre combinaisons, la table de typicité.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { CATALOGUE, chargerCataloguePlein } from '../../src/domain/hopIndex/v4/data';
import { creerMoteur } from '../../src/domain/hopIndex/v4/moteur';
import type { FamilyId } from '../../src/domain/hopIndex/v4/families';
import type { Recipe, MomentId } from '../../src/domain/hopIndex/v4/recipe';
import type { Voie, VoieResult } from '../../src/domain/hopIndex/v4/voies';
import { compareVoies } from '../../src/domain/hopIndex/v4/voies';
import { poserTypicite, type TableTypicite } from '../../src/domain/hopIndex/v4/typicite';

/** Ses six houblons (D191, 27.10). */
export const SES_SIX = ['el-dorado', 'mosaic', 'mandarina-bavaria', 'calypso', 'pacific-jade', 'idaho-7'];
/** Sa vraie recette (voies/f9-intensite-typicite/recette-neipa-v3.txt) : Double IPA 22A, 24 L, OG 1,081, Verdant IPA, Lotus 84 g à 15 % α, 40 min d'ébullition.
 * Le moteur n'a pas de moment à 40′ : le plus proche est 30′ (`b30`, 10 min d'écart ; 60′ en est à 20). L'α du lot (15 %) n'est pas porté par la recette du moteur : il lit la plage de la variété. */
export const R22A: Recipe = { name: 'neipa v3 (22A Double IPA)', styleCode: '22A', volumeL: 24, og: 1.081, boilMin: 60, yeastId: 'lalbrew-verdant-ipa', ebc: 7,
  additions: [{ id: 'a1', hopKey: 'beermaverick-lotus', moment: 'b30', grams: 84 }] };
export const VISEES: [string, FamilyId][] = [['plus d’agrumes', 'citrus'], ['plus de tropicaux', 'tropical']];
export const MOMENTS_DRY: [string, MomentId][] = [['dry hop actif', 'dryActive'], ['dry hop après', 'dryPost']];
export const MOMENTS_CHAUDS: [string, MomentId][] = [['whirlpool', 'wp'], ['10′', 'b10']];
export type Combinaison = { nom: string; intensite: boolean; typicite: boolean };
export const COMBINAISONS: Combinaison[] = [
  { nom: 'actuel', intensite: false, typicite: false }, { nom: 'A3', intensite: true, typicite: false },
  { nom: 'typicité', intensite: false, typicite: true }, { nom: 'A3 + typicité', intensite: true, typicite: true },
];
export const idCourt = (hopKey: string) => hopKey.replace(/^beermaverick-/, '').replace(/:cryo$/, '');

/** Charge la table de typicité du fichier (hors page : pas d'import dynamique). */
export function chargerTable(): TableTypicite {
  const t = JSON.parse(readFileSync(join(process.cwd(), 'src', 'data', 'hopV4', 'typicite-styles.json'), 'utf8')) as TableTypicite;
  poserTypicite(t);
  return t;
}
export async function moteurPlein(plein: boolean) { return creerMoteur({ catalogue: plein ? await chargerCataloguePlein() : CATALOGUE, stock: [] }); }

/** Les houblons distincts d'une liste de voies (une voie d'ajout par houblon, dans l'ordre), pour un moment. */
export function houblonsDe(voies: Voie[]): string[] {
  const out: string[] = [];
  for (const v of voies) { const id = idCourt(v.actions[0].hopKey); if (!out.includes(id)) out.push(id); }
  return out;
}
/** La liste principale de Suggérer pour un moment : les voies d'ajout seul à ce moment, rangées comme à l'écran. */
export const listePrincipale = (res: VoieResult, moment: MomentId): Voie[] =>
  res.voies.filter((v) => v.type === 'ajouter' && v.actions.length === 1 && v.actions[0].moment === moment).sort(compareVoies);
export const rangs = (houblons: string[]) => SES_SIX.map((s) => `${s} ${houblons.indexOf(s) + 1 || '–'}`).join(', ');
