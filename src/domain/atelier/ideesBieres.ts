/**
 * Atelier › Carnet › Bières (kb3) : ce que la ligne ouverte lit et écrit, sans interface.
 *
 * Champs : `CreativeItem` (src/types/index.ts) n'est pas ouvert à la voie ; style, couleur, moment et saison vivent donc ici (`IdeeBiere`),
 * optionnels et rétrocompatibles, comme `noteId` dans rangerNote.ts. Aucune valeur n'est devinée : une idée sans style, sans couleur, sans
 * moment ni saison les montre « à choisir ». « En recette » ne s'écrit pas : c'est lu, une recette de ce nom existe (jamais deux sources).
 */
import type { CreativeItem, Recipe } from '../../types';

export type CouleurId = 'paille' | 'ambre' | 'cuivre' | 'brun' | 'noir';
export type MomentId = 'ebullition' | 'whirlpool' | 'dryhop' | 'garde';
export type SaisonId = 'ete' | 'automne' | 'hiver';

/** Les cinq pastilles de la maquette kb3 (teintes de bière, pas des jetons d'interface : elles ne changent pas avec le thème). */
export const COULEURS: ReadonlyArray<{ id: CouleurId; nom: string; teinte: string }> = [
  { id: 'paille', nom: 'Paille', teinte: '#f3d36b' }, { id: 'ambre', nom: 'Ambrée', teinte: '#d9902a' }, { id: 'cuivre', nom: 'Cuivrée', teinte: '#c06a24' },
  { id: 'brun', nom: 'Brune', teinte: '#7a3b1c' }, { id: 'noir', nom: 'Noire', teinte: '#2a1a12' }
];
export const MOMENTS: ReadonlyArray<{ id: MomentId; court: string; nom: string }> = [
  { id: 'ebullition', court: 'Ébull.', nom: 'Ébullition' }, { id: 'whirlpool', court: 'Whirlpool', nom: 'Whirlpool' },
  { id: 'dryhop', court: 'Dry hop', nom: 'Dry hop' }, { id: 'garde', court: 'Garde', nom: 'Garde' }
];
export const SAISONS: ReadonlyArray<{ id: SaisonId; nom: string }> = [{ id: 'ete', nom: 'Été' }, { id: 'automne', nom: 'Automne' }, { id: 'hiver', nom: 'Hiver' }];
/** Les styles à un toucher du compositeur ; « … » ouvre un champ libre. */
export const STYLES_RAPIDES = ['Pils', 'IPA', 'Saison', 'Stout'] as const;

export type IdeeBiere = CreativeItem & { style?: string; couleur?: CouleurId; moment?: MomentId; saison?: SaisonId };

export const teinteDe = (id: CouleurId | undefined): string | undefined => COULEURS.find((c) => c.id === id)?.teinte;

/** Pour comparer un titre d'idée à un nom de recette : sans accents, casse ni espaces en trop. */
export const normaliser = (s: string): string => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ').trim().toLowerCase();

/** La recette qui porte le nom de l'idée (l'assistant de recette reprend le titre de l'idée) ; `undefined` : l'idée reste à essayer. */
export const recetteDeLIdee = (idee: Pick<CreativeItem, 'title'>, recettes: readonly Pick<Recipe, 'id' | 'name'>[]): Pick<Recipe, 'id' | 'name'> | undefined => {
  const nom = normaliser(idee.title);
  return nom ? recettes.find((r) => normaliser(r.name) === nom) : undefined;
};

export type EtatIdee = 'essayer' | 'recette';
export function repartir(idees: readonly CreativeItem[], recettes: readonly Pick<Recipe, 'id' | 'name'>[]): Record<EtatIdee, CreativeItem[]> {
  const out: Record<EtatIdee, CreativeItem[]> = { essayer: [], recette: [] };
  for (const i of idees) out[recetteDeLIdee(i, recettes) ? 'recette' : 'essayer'].push(i);
  return out;
}

/** Une idée neuve, écrite sur place : seul le titre est obligatoire ; style et couleur absents restent absents. */
export function nouvelleIdee(titre: string, style: string, couleur: CouleurId | undefined, id: string): CreativeItem | null {
  const t = titre.trim();
  if (!t) return null;
  const s = style.trim();
  const idee: IdeeBiere = { id, type: 'recipe-idea', title: t, status: 'idea', ...(s ? { style: s } : {}), ...(couleur ? { couleur } : {}) };
  return idee as CreativeItem;
}

/** Réécrit un champ ; une valeur vide efface le champ (« à choisir »), elle n'écrit jamais 0 ni un texte vide. */
export function avecChamp<K extends 'style' | 'couleur' | 'moment' | 'saison'>(idee: CreativeItem, champ: K, valeur: IdeeBiere[K] | ''): CreativeItem {
  const { [champ]: _ancien, ...reste } = idee as IdeeBiere;
  void _ancien;
  const v = typeof valeur === 'string' ? valeur.trim() : valeur;
  return (v ? { ...reste, [champ]: v } : reste) as CreativeItem;
}
