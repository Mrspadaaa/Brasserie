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

/**
 * Champs neufs, tous optionnels (passe 3) : `degre` (% vol, posé par le brasseur, jamais lu dans le texte de l'idée), `phare` (l'ingrédient qui
 * fait la bière, texte libre), `recetteId` (la recette-brouillon créée par « Passer dans mes recettes » : le lien se fait par identifiant, plus
 * par le nom), `archivedAt` (ISO : l'idée est rangée, pas supprimée).
 */
export type IdeeBiere = CreativeItem & { style?: string; couleur?: CouleurId; moment?: MomentId; saison?: SaisonId; degre?: number; phare?: string; recetteId?: string; archivedAt?: string };

export const teinteDe = (id: CouleurId | undefined): string | undefined => COULEURS.find((c) => c.id === id)?.teinte;

/** Pour comparer un titre d'idée à un nom de recette : sans accents, casse ni espaces en trop. */
export const normaliser = (s: string): string => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ').trim().toLowerCase();

/**
 * La recette de l'idée : celle que « Passer dans mes recettes » a créée (identifiant, même renommée), sinon celle qui porte le nom de l'idée
 * (une recette écrite à la main sous le même titre) ; `undefined` : l'idée reste à essayer.
 */
export const recetteDeLIdee = (idee: Pick<CreativeItem, 'title'> & { recetteId?: string }, recettes: readonly Pick<Recipe, 'id' | 'name'>[]): Pick<Recipe, 'id' | 'name'> | undefined => {
  const lie = idee.recetteId ? recettes.find((r) => r.id === idee.recetteId) : undefined;
  if (lie) return lie;
  const nom = normaliser(idee.title);
  return nom ? recettes.find((r) => normaliser(r.name) === nom) : undefined;
};

export type EtatIdee = 'essayer' | 'recette';
export type FiltreIdee = EtatIdee | 'archivees';
/** À essayer, En recette ; les idées archivées sont à part (ni comptées, ni perdues). */
export function repartir(idees: readonly CreativeItem[], recettes: readonly Pick<Recipe, 'id' | 'name'>[]): Record<FiltreIdee, CreativeItem[]> {
  const out: Record<FiltreIdee, CreativeItem[]> = { essayer: [], recette: [], archivees: [] };
  for (const i of idees) out[(i as IdeeBiere).archivedAt ? 'archivees' : recetteDeLIdee(i as IdeeBiere, recettes) ? 'recette' : 'essayer'].push(i);
  return out;
}

/** Ranger une idée (réversible) ou la remettre. */
export const archiverIdee = (idee: CreativeItem, quand: string): CreativeItem => ({ ...(idee as IdeeBiere), archivedAt: quand }) as CreativeItem;
export function restaurerIdee(idee: CreativeItem): CreativeItem {
  const { archivedAt: _a, ...reste } = idee as IdeeBiere;
  void _a;
  return reste as CreativeItem;
}

/**
 * Le brouillon de recette d'une idée (« Passer dans mes recettes ») : nom, style, degré visé (si posé) et un mot sur le reste. Ni grain, ni houblon,
 * ni levure : rien de ce que l'idée ne dit n'est deviné. Le volume est celui que l'assistant de recette propose à une recette neuve.
 * La couleur est une classe de bière, pas des EBC : elle reste dans le texte de création.
 */
export function brouillonDeLIdee(idee: CreativeItem, id: string, volumeL: number): Recipe {
  const i = idee as IdeeBiere;
  const couleur = COULEURS.find((c) => c.id === i.couleur)?.nom.toLowerCase();
  const moment = MOMENTS.find((m) => m.id === i.moment)?.nom;
  const saison = SAISONS.find((s) => s.id === i.saison)?.nom.toLowerCase();
  const lignes = [
    'Brouillon créé depuis une idée de l’Atelier : grains, houblons et levure restent à saisir.',
    i.description ? `Idée : ${i.description}` : '',
    couleur ? `Couleur visée : ${couleur}` : '',
    i.phare ? `Ingrédient phare : ${i.phare}${moment ? ` (${moment})` : ''}` : moment ? `Moment visé : ${moment}` : '',
    saison ? `À brasser : ${saison}` : ''
  ].filter(Boolean);
  return { id, version: 1, name: idee.title, style: i.style ?? '', volumeL, ogTarget: null, fgTarget: null, abvTarget: i.degre ?? null,
    fermentables: [], totalGristKg: 0, hops: [], yeast: { name: '' }, steps: [], notes: [], notesCreation: lignes.join('\n') } as Recipe;
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
export function avecChamp<K extends 'style' | 'couleur' | 'moment' | 'saison' | 'phare' | 'degre'>(idee: CreativeItem, champ: K, valeur: IdeeBiere[K] | ''): CreativeItem {
  const { [champ]: _ancien, ...reste } = idee as IdeeBiere;
  void _ancien;
  const v = typeof valeur === 'string' ? valeur.trim() : valeur;
  return (v ? { ...reste, [champ]: v } : reste) as CreativeItem;
}
