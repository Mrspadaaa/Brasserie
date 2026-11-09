/**
 * Les 12 axes et les 18 filtres de l'étape Levure : UNE liste, tirée des champs de la fiche (DEFAUTS LV-1).
 * Un axe sert quatre fois : un filtre dans Chercher, une rangée dans Comparer, un − / + dans Suggérer, une jauge dans l'étape.
 */
import type { Axe, DefFiltre, GroupeAxe, IdAxe, Niveau } from './contrat';

export const AXES: readonly Axe[] = [
  { id: 'esters', groupe: 'aromes', libelle: 'Esters · fruité' },
  { id: 'phenols', groupe: 'aromes', libelle: 'Phénols · épicé' },
  { id: 'thiols', groupe: 'aromes', libelle: 'Thiols' },
  { id: 'terpenes', groupe: 'aromes', libelle: 'Terpènes' },
  { id: 'attenuation', groupe: 'corps', libelle: 'Atténuation', unite: '%' },
  { id: 'clarte', groupe: 'corps', libelle: 'Clarté · floculation' },
  { id: 'tolerance', groupe: 'corps', libelle: 'Tolérance à l’alcool', unite: '% vol' },
  { id: 'rondeur', groupe: 'corps', libelle: 'Rondeur · sucres restants', unite: 'g/L' },
  { id: 'temperature', groupe: 'conduite', libelle: 'Température', unite: '°C' },
  { id: 'vitesse', groupe: 'conduite', libelle: 'Vitesse' },
  { id: 'soufre', groupe: 'conduite', libelle: 'Soufre' },
  { id: 'nutriments', groupe: 'conduite', libelle: 'Nutriments' }
];

export const GROUPES: ReadonlyArray<{ id: GroupeAxe; libelle: string }> = [
  { id: 'aromes', libelle: 'Arômes' },
  { id: 'corps', libelle: 'Corps' },
  { id: 'conduite', libelle: 'Conduite' }
];

export const axeParId = (id: IdAxe): Axe => AXES.find((a) => a.id === id)!;
export const ID_AXES: readonly IdAxe[] = AXES.map((a) => a.id);
export const AXES_AROMES: readonly IdAxe[] = ['esters', 'phenols', 'thiols', 'terpenes'];
/** Les axes qui se lisent en plage numérique plutôt qu'en niveau. */
export const AXES_NUMERIQUES: readonly IdAxe[] = ['attenuation', 'tolerance', 'rondeur', 'temperature'];

/** Premier rang : 11 filtres toujours visibles ; « Plus de filtres » : 7. L'ordre est celui de l'index de c6b. */
export const FILTRES: readonly DefFiltre[] = [
  { id: 'boisson', libelle: 'Boisson', rang: 'premier', genre: 'choix' },
  { id: 'famille', libelle: 'Famille', rang: 'premier', genre: 'choix' },
  { id: 'style', libelle: 'Style', rang: 'premier', genre: 'choix' },
  { id: 'temperature', libelle: 'Température', rang: 'premier', genre: 'plage' },
  { id: 'attenuation', libelle: 'Atténuation', rang: 'premier', genre: 'plage' },
  { id: 'tolerance', libelle: 'Tolérance à l’alcool', rang: 'premier', genre: 'plage' },
  { id: 'effets', libelle: 'Effets', rang: 'premier', genre: 'choix' },
  { id: 'clarte', libelle: 'Floculation', rang: 'premier', genre: 'choix' },
  { id: 'forme', libelle: 'Forme', rang: 'premier', genre: 'choix' },
  { id: 'disponibilite', libelle: 'Disponibilité', rang: 'premier', genre: 'choix' },
  { id: 'stock', libelle: 'En stock chez moi', rang: 'premier', genre: 'bascule' },
  { id: 'sansSta1', libelle: 'Sans STA1', rang: 'plus', genre: 'bascule' },
  { id: 'labo', libelle: 'Laboratoire', rang: 'plus', genre: 'choix' },
  { id: 'vitesse', libelle: 'Vitesse', rang: 'plus', genre: 'choix' },
  { id: 'rondeur', libelle: 'Rondeur', rang: 'plus', genre: 'choix' },
  { id: 'soufre', libelle: 'Soufre', rang: 'plus', genre: 'choix' },
  { id: 'nutriments', libelle: 'Nutriments', rang: 'plus', genre: 'choix' },
  { id: 'sansAlcool', libelle: 'Sans alcool', rang: 'plus', genre: 'bascule' }
];

export const NIVEAUX: ReadonlyArray<{ valeur: Niveau; libelle: string }> = [
  { valeur: 'faible', libelle: 'faible' },
  { valeur: 'moyen', libelle: 'moyen' },
  { valeur: 'eleve', libelle: 'élevé' }
];

export const BOISSONS = [
  { valeur: 'biere', libelle: 'bière' },
  { valeur: 'vin', libelle: 'vin' },
  { valeur: 'cidre', libelle: 'cidre · hydromel' },
  { valeur: 'distillerie', libelle: 'distillerie' },
  { valeur: 'autre', libelle: 'autre' }
] as const;
export type Boisson = (typeof BOISSONS)[number]['valeur'];

export const FAMILLES = [
  { valeur: 'ale', libelle: 'ale US · neutre' },
  { valeur: 'anglaise', libelle: 'anglaise' },
  { valeur: 'belge', libelle: 'belge' },
  { valeur: 'saison', libelle: 'saison' },
  { valeur: 'ble', libelle: 'blé' },
  { valeur: 'lager', libelle: 'lager' },
  { valeur: 'kveik', libelle: 'kveik' },
  { valeur: 'brett', libelle: 'Brett' },
  { valeur: 'bacteries', libelle: 'bactéries' },
  { valeur: 'melange', libelle: 'mélange' }
] as const;
export type Famille = (typeof FAMILLES)[number]['valeur'];
