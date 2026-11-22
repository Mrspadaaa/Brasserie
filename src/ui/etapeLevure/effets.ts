// Les effets de fermentation de « Ma levure » (maquette l5b) : une rangée par axe, une pastille de la couleur de sa famille d'arômes
// (la table des houblons, `familyTokens.ts`, jamais recopiée), et à droite :
//  - une jauge de 3 cases (faible · moyen · élevé) seulement quand la source donne un niveau publié ;
//  - un mot quand elle n'en donne pas (« tropical, banane », « présent », « aucun ») ;
//  - un nombre avec sa nature (« 11 g/L · mesure fabricant ») ;
//  - sinon « ⌕ non documenté », qui se touche pour chercher (recherche IA, à confirmer).
// Aucune jauge n'est tirée d'un descripteur : aucune échelle inventée (NOTE.md de l5b).
import type { IdAxe, Niveau, ValeurAxe } from '../../domain/levure/contrat';
import type { YeastReference } from '../../domain/yeastReferences';
import { COULEURS } from '../hopIndex/familyTokens';
import type { FamilyId } from '../../domain/hopIndex/v4/families';
import { valeurAxe } from './domaine';

/** Famille d'arômes des houblons qui donne sa couleur à chaque axe (même table, mêmes jetons que l'outil Houblons). */
export const FAMILLE_DE_L_AXE: Partial<Record<IdAxe, FamilyId>> = {
  esters: 'tropical', phenols: 'spice', thiols: 'melon', terpenes: 'pomeFruit', rondeur: 'earthy',
};
/** Les rangées de l'étape, dans l'ordre de la maquette : les quatre familles d'arômes, puis la rondeur (sucres restants). */
export const AXES_EFFETS: ReadonlyArray<{ id: IdAxe; libelle: string }> = [
  { id: 'esters', libelle: 'esters' }, { id: 'phenols', libelle: 'phénols' }, { id: 'thiols', libelle: 'thiols' },
  { id: 'terpenes', libelle: 'terpènes' }, { id: 'rondeur', libelle: 'sucres restants' },
];
export const NIVEAUX: ReadonlyArray<{ id: Niveau; mot: string }> = [{ id: 'faible', mot: 'faible' }, { id: 'moyen', mot: 'moyen' }, { id: 'eleve', mot: 'élevé' }];

export type LigneEffet =
  | { id: IdAxe; libelle: string; couleur: string; genre: 'jauge'; niveau: Niveau; source?: string }
  | { id: IdAxe; libelle: string; couleur: string; genre: 'mot'; texte: string; estime: boolean; source?: string }
  | { id: IdAxe; libelle: string; couleur: string; genre: 'nombre'; texte: string; nature: string; source?: string }
  | { id: IdAxe; libelle: string; couleur: string; genre: 'inconnu' };

const nombre = (n: number) => n.toLocaleString('fr-FR', { maximumFractionDigits: 1 });
const uniteDe = (id: IdAxe) => (id === 'rondeur' ? 'g/L' : '');

export function couleurDeLAxe(id: IdAxe): string {
  const famille = FAMILLE_DE_L_AXE[id];
  return famille ? COULEURS[famille].base : '#8C8C8C';
}

/** Une rangée depuis la valeur d'un axe : ce que la source dit, ou « non documenté » (jamais 0, jamais une valeur tirée d'ailleurs). */
export function ligneEffet(id: IdAxe, libelle: string, valeur: ValeurAxe | null): LigneEffet {
  const base = { id, libelle, couleur: couleurDeLAxe(id) };
  const source = valeur?.source?.libelle;
  if (valeur?.niveau && !valeur.estime) return { ...base, genre: 'jauge', niveau: valeur.niveau, source };
  if (valeur?.mots?.length) return { ...base, genre: 'mot', texte: valeur.mots.join(', '), estime: !!valeur.estime, source };
  if (valeur?.plage) {
    const { min, max } = valeur.plage, unite = uniteDe(id);
    const texte = `${min === max ? nombre(min) : `${nombre(min)}–${nombre(max)}`}${unite ? ` ${unite}` : ''}`;
    return { ...base, genre: 'nombre', texte, nature: source ? `mesure ${/fermentis|lallemand|danstar|lesaffre|fabricant/i.test(source) ? 'fabricant' : 'publiée'}` : 'publiée', source };
  }
  if (valeur?.niveau) return { ...base, genre: 'mot', texte: NIVEAUX.find(n => n.id === valeur.niveau)!.mot, estime: true, source };
  return { ...base, genre: 'inconnu' };
}

export function lignesEffets(levure: YeastReference): LigneEffet[] {
  return AXES_EFFETS.map(({ id, libelle }) => ligneEffet(id, libelle, valeurAxe(levure, id)));
}

/** Floculation (cellule « floculation » de la bande) : un niveau en jauge, un mot, ou « à chercher ». */
export function ligneFloculation(levure: YeastReference): LigneEffet {
  return ligneEffet('clarte', 'floculation', valeurAxe(levure, 'clarte'));
}
