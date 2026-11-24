/** Les contrats du carnet ouvert (lien « lié à », ligne rangée, props), sortis de CarnetOuvert.tsx ; CarnetOuvert les réexporte. */
import type React from 'react';
import type { TableauV } from './Comparer';
import type { AidesV, CarnetV } from './EtatIA';

/** Lien « lié à » (R47), calculé par `liensDe` (lot A) : jamais de montant. */
export interface LienV { sorte: 'a-venir' | 'realise'; id: string; libelle: string; etat: 'present' | 'supprime'; le?: string }

export interface RangeeV {
  cible: 'critere' | 'facon' | 'article' | 'note';
  id: string;
  phrase?: string;
  rangeSur?: string;
  luSurPage?: string[];
  verdict?: string;
  /** Critique 7, n° 7 (G20, R26) : le rang de l'article déposé (`rangDuLien`), dit dans le bandeau « ✓ Article rangé ici · 2e … ». */
  rang?: string;
  onAnnuler: () => void;
  onVotreTexte?: () => void;
  onDeplacer?: () => void;
  onChangerEnNote?: () => void;
  /** BL-1 : « Déplacer vers … ? », le carnet existant que l'IA voyait pour le lien resté ici. */
  versSuggere?: { titre: string; onDeplacer: () => void };
}

export interface CarnetOuvertProps {
  carnet: CarnetV;
  aides: AidesV;
  liens: LienV[];
  /** Le tableau de `comparer.ts` : `null` à 0 ou 1 article (R26). */
  tableau: TableauV | null;
  bandeau?: React.ReactNode;
  cadre?: React.ReactNode;
  rangee?: RangeeV | null;
  /** G6 et G5 : le carnet vient d'être créé. */
  vientDEtreCree?: boolean;
  /** G33 : notes que `notesEnDouble` (lot A) marque, si `aides.doublon`. */
  doublons?: string[];
  /** G32 : la note supprimée, à sa place. */
  noteSupprimee?: { id: string; apres?: string; onAnnuler: () => void } | null;
  /** La feuille ··· ouverte sous sa note (FeuilleNote). */
  feuille?: { noteId: string; contenu: React.ReactNode } | null;
  /** « Le critère sépare les deux façons : … · Retenir … » : texte de l'IA, cité s'il existe ; sinon calculé sur place. */
  separe?: { texte: string; retenir: string; onRetenir: () => void } | null;
  /** Retenir la façon que le critère sépare (conclusion calculée). Sans lui, « Retenir … » ouvre Comparer, où l'on choisit. */
  onRetenirFacon?: (faconId: string) => void;
  /** Page grisée pendant la confirmation de suppression (G34). */
  grise?: boolean;
  /** L'IA ne répond pas (échec), le réseau manque, ou l'IA est éteinte : rien n'annonce « l'IA … » (critique 5, n° 24). Passé par le lot D. */
  iaIndisponible?: 'echec' | 'hors-ligne' | 'eteinte' | null;
  onRetour: () => void;
  onRenommer: () => void;
  onSupprimer: () => void;
  onNote: (noteId: string) => void;
  onOuvrirArticle: (articleId: string) => void;
  onComparer: () => void;
  onVeille?: (articleId: string, active: boolean) => void;
  /** D421 : le taux EUR→CHF (Finances, sinon posé une fois) et sa pose, pour le prix rendu des articles en euros. */
  taux?: number;
  onTaux?: (t: number) => void;
  onVoirChoix?: () => void;
  onEnvoyerAVenir?: () => void;
  onOuvrirLien?: (lien: LienV) => void;
  /**
   * C1 (D393, 21.11) : dater le projet d'un toucher, en horizon (« vers févr. ») ; `lundi` ISO, `null` = plus tard (sans date). Absent :
   * pas de rubrique Quand. La date lue est `carnet.date` (l'icône de sa semaine au Calendrier, `iconesIdees`).
   */
  /** `precision` : « semaine » quand la frise a posé une semaine (D431) ; défaut : le mois d'un horizon. */
  onDater?: (lundi: string | null, precision?: 'semaine' | 'mois') => void;
  /** D437 : un toucher sur la pastille pose le domaine du carnet (son choix passe avant celui de l'IA). */
  onDomaine?: (d: import('../../domain/carnets/domaines').DomaineCarnet) => void;
  /** K2 (côté Carnet) : « Au calendrier › », la chose posée à aujourd'hui si elle n'a pas de date, puis la bascule au Calendrier. */
  onAuCalendrier?: () => void;
  /** D2 : le prix du projet (`estimatedCost`, centimes ici) et le dernier achat semblable proposé ; `semblable: null` = rien, D1. */
  prix?: { centimes?: number; semblable?: { centimes: number; source: string } | null; propose?: import('../../domain/carnets/prixPropose').PrixPropose | null };
  onPrix?: (centimes: number) => void;
  /**
   * L-20 (23.11, M3-1) : retirer un critère (`supprimerLigne`, cible `critere`), par ⋯ de la ligne Critère. Absent : pas de ⋯ (rien
   * qui ne fasse rien). Branché par la vue des carnets.
   */
  /** Un critère affiché peut regrouper plusieurs doublons : tous ses ids, d'un seul geste (un seul Annuler). */
  onRetirerCritere?: (...critereIds: string[]) => void;
  /**
   * BL-3 (banc réel de liens, 23.11) : retirer un article, ou le déplacer vers un autre carnet, par le ⋯ de la ligne Articles (comme
   * « Retirer » des critères, L-20), avec Annuler. `carnetsVers` : les autres carnets. Absent : pas de ⋯.
   */
  onRetirerArticle?: (articleId: string) => void;
  onDeplacerArticle?: (articleId: string, vers: string) => void;
  carnetsVers?: readonly { id: string; titre: string }[];
  /** Le jour (ISO) ; défaut : aujourd'hui (local). Injecté par le banc et les tests. */
  aujourdhui?: string;
}
