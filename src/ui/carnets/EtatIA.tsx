/**
 * Carnet d'idées (port du 17.11, lot C) : formes lues par les vues, provenance et état de l'IA.
 *
 * Les vues du carnet sont contrôlées par props : elles ne lisent aucun magasin. Les formes ci-dessous reprennent
 * le document `type: 'carnet'` et le message `type: 'carnet-message'` de MISSION.md § Données (champ par champ), sans
 * en dépendre : `CarnetsVue.tsx` (lot D) passe ce que `lireCarnet` et `lireMessage` (lot A) rendent.
 * Règles tenues ici : une valeur inconnue est absente, jamais 0 ; le simulé dit « exemple » ; le calcul local porte
 * son picto, jamais le ✻ de l'IA (Q19).
 */
import React, { useEffect, useRef } from 'react';
import { Calculator, Check, Link2, WifiOff, X } from 'lucide-react';
import './carnets.css';
import './carnets-fil.css';

export type Origine = 'vous' | 'ia' | 'page' | 'locale' | 'exemple';
export type Sens = 'plus' | 'moins' | 'oui-non' | 'texte';
export type GenreNote = 'a-acheter' | 'a-faire' | 'question' | 'conseil' | 'note';
export type StatutCarnet = 'idea' | 'research' | 'validated';

export interface CaracteristiqueV { nom: string; unite?: string; sens: Sens }
export interface CritereV { id: string; texte: string; raison?: string; caracteristique?: CaracteristiqueV; origine: Origine; messageId?: string; source?: 'phrase' | 'ia' }
export interface FaconV { id: string; nom: string; etat: 'ouverte' | 'retenue' | 'ecartee'; raison?: string; origine: Origine; messageId?: string }
export interface ValeurV { valeur: number | string | boolean; unite?: string; origine: Origine; luLe?: string }
export interface VeilleV { active: boolean; depuis: string; releveLe?: string }
export interface ArticleV {
  id: string; url?: string; domaine?: string; nom?: string; prixCentimes?: number; prixDes?: true; devise?: string; vendeur?: string; pays?: string;
  dispo?: string; photo?: string; faconId?: string; valeurs: Record<string, ValeurV>;
  /** D446, D447 : toutes les photos de la page, le prix HT ou TTC, le port vers la Suisse lu, le cours du jour (BCE) ; absents quand la page ne les donne pas. */
  photos?: string[]; taxe?: 'ht' | 'ttc'; prixTTCCentimes?: number;
  livraison?: { prixCentimes?: number; devise?: string; gratuite?: true; refusee?: true }; change?: { taux: number; date: string; source: 'BCE' };
  /** PX (R39 à R41), R48 et R49 : la quantité du prix, les conditionnements publiés et le prix à l'unité avec ses paliers (types du modèle). */
  conditionnement?: import('../../domain/carnets/modele').ConditionnementArticle; prixUnite?: import('../../domain/carnets/modele').PrixUniteArticle; offres?: import('../../domain/carnets/modele').OffreArticle[];
  lecture: 'a-lire' | 'en-cours' | 'lue' | 'illisible' | 'introuvable'; veille?: VeilleV; messageId?: string; origine?: Origine; ajouteLe?: string;
  /** N2 : ce que ses notes disent de cet article (« dispo douteuse · ta note, 24 nov. »). */
  notesSur?: import('../../domain/carnets/modele').NoteSurArticle[];
}
export interface NoteV { id: string; texte: string; genre: GenreNote; le?: string; modifieeLe?: string; messageId?: string; groupe?: { id: string; libelle: string }; fusionDe?: string[] }
export interface PhotoV { id: string; jpeg: string; messageId?: string; le?: string }
export interface ChoixV { articleId: string; faconId?: string; pourquoi: string; ecartes: { articleId: string; raison: string }[]; aRevoirSi?: string; le: string; remplaces: ChoixV[]; /** R63 (C67B-1) : la quantité cochée au choix (1 kg) et son prix en centimes */ quantite?: { kg: number; libelle: string }; prixCentimes?: number }
export interface ContenuCarnetV {
  creeLe: string; phrase: string; criteres: CritereV[]; facons: FaconV[]; articles: ArticleV[]; notes: NoteV[]; photos: PhotoV[];
  choix?: ChoixV; sortie?: SortieV; archive?: { le: string; raison: string };
}
/** La sortie vers À venir ; `etat` et `realiseLe` posés par la vue d'après `etatSortie` (critique 7, n° 5). */
export interface SortieV { planId?: string; le: string; etat?: 'a-venir' | 'realise' | 'archive' | 'supprime'; realiseLe?: string; sansAchat?: true }
/**
 * « Dans À venir depuis le 15 nov. », ou, plan payé, « Réalisé, payé le 16 nov. » : une seule règle pour la liste, la fiche et Choisir.
 * L-12 : marqué réalisé sans achat, « Réalisé, sans achat » ; archivé dans À venir, « Plan archivé dans À venir » ; supprimé, « Plan
 * supprimé d'À venir » : jamais « Dans À venir » pour un plan qui n'y est plus.
 */
export function texteSortie(s: SortieV): string {
  if (s.etat === 'realise' && s.sansAchat) return 'Réalisé, sans achat';
  if (s.etat === 'realise') { const d = dateCourte(s.realiseLe); return `Réalisé, payé${d ? ` le ${d}` : ''}`; }
  if (s.etat === 'archive') return 'Plan archivé dans À venir';
  if (s.etat === 'supprime') return 'Plan supprimé d’À venir';
  const d = dateCourte(s.le);
  return `Dans À venir${d ? ` depuis le ${d}` : ''}`;
}
/** Le document Firestore tel quel (`title`, `status`, `date?`, `carnet`), ce que rend `lireCarnet`. */
export interface CarnetV { id: string; title: string; status: StatutCarnet; date?: string; precision?: 'semaine' | 'mois'; carnet: ContenuCarnetV }
export interface MessageV { id: string; texte: string; le: string; depuis: 'liste' | string; rangement: 'ia' | 'locale' | 'simulee' | 'brut' }

/** Réglage des aides de l'IA (`aidesCarnet`, lot B), lu par `CarnetsVue.tsx` et passé tel quel. */
export interface AidesV { doublon: boolean; noteEnCritere: boolean; consequence: boolean; regrouper: boolean; renommerPropose: boolean }
export const AIDES_ETEINTES: AidesV = { doublon: false, noteEnCritere: false, consequence: false, regrouper: false, renommerPropose: false };

export const STATUT_LIBELLE: Record<StatutCarnet, string> = { idea: 'Idée', research: 'À comparer', validated: 'Choisi' };
export const GENRE_LIBELLE: Record<GenreNote, string> = { 'a-acheter': 'à acheter', 'a-faire': 'à faire', question: 'question', conseil: 'conseil', note: 'note' };

const MOIS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
/** « 16 nov. » ; une date absente ou illisible ne s'invente pas : rien. */
export function dateCourte(iso?: string): string | null {
  if (!iso) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!m) return null;
  const mois = MOIS[Number(m[2]) - 1];
  return mois ? `${Number(m[3])} ${mois}` : null;
}
/** « 11 700 » (espace fine insécable), virgule décimale (DESIGN.md, L-15 : un seul format pour un prix), sans centimes s'ils sont nuls. Prix inconnu : null, jamais 0. */
export function montant(centimes?: number): string | null {
  if (centimes === undefined || centimes === null || !Number.isFinite(centimes)) return null;
  const francs = centimes / 100;
  const entier = Math.trunc(francs);
  const txt = String(Math.abs(entier)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  const reste = Math.round(Math.abs(francs - entier) * 100);
  return `${entier < 0 ? '−' : ''}${txt}${reste ? `,${String(reste).padStart(2, '0')}` : ''}`;
}
/** L-15 : « 1 845 » pour « 1.845 » (point des milliers d'une page allemande), « 0,50 » pour « 0.50 » ; un autre texte reste tel quel. */
function nombreLu(t: string): string {
  if (/^\d{1,3}(\.\d{3})+$/.test(t)) return t.replace(/\./g, ' ');
  if (/^\d+\.\d+$/.test(t)) return t.replace('.', ',');
  return t;
}
/** T25-9 : la taxe que la page dit, avec son espace devant (« 72,50 CHF TTC ») ; la page ne la dit pas : rien. « HT » et « TTC » se disent pareil. */
export const mentionTaxe = (taxe?: 'ht' | 'ttc'): string => (taxe === 'ht' ? ' HT' : taxe === 'ttc' ? ' TTC' : '');
/**
 * T25-6 : un millésime n'est pas une quantité (« Erntejahr 2025 », jamais « 2 025 »). Le nom de la caractéristique le dit (année, Jahr,
 * Ernte, récolte, millésime, vintage) ; une quantité garde son espace des milliers (« 2 500 l »).
 */
const MILLESIME = /ann[ée]e|jahr|ernte|r[ée]colte|mill[ée]sime|vintage|harvest|year/i;
/**
 * E47-4 : une référence (« Réf. du fabricant », « Numéro d'article », EAN, GTIN) est un texte, jamais une quantité : « 109971 », « 40.003 »
 * se recopient tels que la page les écrit (espaces de milliers retirés). `brut` : la valeur d'origine, quand l'appelant l'a.
 */
const IDENTIFIANT = /(?:^|[\s(])(?:r[ée]f(?:[ée]rence)?s?|num[ée]ro|n°|no\.|nr\.?|artikel(?:nummer)?|sku|ean|gtin|upc|mpn|code[- ]barres?|code article)(?=$|[\s.)])/i;
export function texteSelonNom(nom: string, texte: string | null, brut?: string | number | boolean): string | null {
  if (texte !== null && IDENTIFIANT.test(nom)) {
    const source = typeof brut === 'string' || typeof brut === 'number' ? String(brut).trim() : texte;
    return /^\d[\d\s  '’]*$/.test(source) ? source.replace(/[\s  '’]/g, '') : source;
  }
  return texte !== null && MILLESIME.test(nom) && /^\d[\s  ]\d{3}$/.test(texte) ? texte.replace(/[\s  ]/g, '') : texte;
}
/** Une valeur lue : nombre en chiffres, oui-non en mots ; absente : null. */
export function valeurTexte(v?: ValeurV): string | null {
  if (!v) return null;
  if (typeof v.valeur === 'boolean') return v.valeur ? 'oui' : 'non';
  if (typeof v.valeur === 'number') {
    if (!Number.isFinite(v.valeur)) return null;
    const [e, d] = String(Math.abs(v.valeur)).split('.');
    const groupe = e.length > 3 ? e.replace(/\B(?=(\d{3})+(?!\d))/g, ' ') : e;
    return `${v.valeur < 0 ? '−' : ''}${groupe}${d ? `,${d}` : ''}`;
  }
  return nombreLu(v.valeur.trim()) || null;
}
export function rangTexte(n: number): string { return n === 1 ? '1re' : `${n}e`; }
export function pluriel(n: number, un: string, plusieurs: string): string { return `${n} ${n > 1 ? plusieurs : un}`; }

/** Picto de provenance (Q19) : ✻ pour l'IA, calculette pour le calcul local, maillon pour la page lue. */
export function Provenance({ origine, titre }: { origine: Origine; titre?: string }) {
  if (origine === 'ia') return <span className="cn-prov cn-prov-ia" role="img" aria-label={titre ?? "proposé par l'IA"}>✻</span>;
  if (origine === 'locale') return <span className="cn-prov cn-prov-local" role="img" aria-label={titre ?? 'calculé sur place'} data-picto="local"><Calculator size={14} aria-hidden /></span>;
  if (origine === 'page') return <span className="cn-prov cn-prov-page" role="img" aria-label={titre ?? 'lu sur la page'}><Link2 size={14} aria-hidden /></span>;
  if (origine === 'exemple') return <span className="cn-exemple">exemple</span>;
  return null;
}
/** Picto local seul, pour G8, G26, G35 et G36 (calculés sans IA). */
export function PictoLocal() { return <Provenance origine="locale" />; }

export type EtatRangement = 'apercu' | 'en-cours' | 'range' | 'echec' | 'hors-ligne' | 'eteint';

/**
 * L'état de l'IA pendant un envoi (P10, 40b du tour 3). En cours : « ✻ L'IA range… », sa phrase citée (le fil), un signe d'activité
 * discret (trois points, immobiles sous `prefers-reduced-motion`) et un ✕ « Arrêter l'IA ». Fini : « ✓ Rangé », vert, sans ✻ ni
 * activité : les deux ne se confondent pas (Q19 : ✻ seulement pour l'IA). Échec ou hors ligne : rien n'est perdu. IA éteinte : rangé
 * sur place.
 */
export function EtatIA({ etat, quoi, onAnnuler }: { etat: EtatRangement; quoi?: string; onAnnuler?: () => void }) {
  /* L'état paraît en haut du carnet, le champ est en bas : à son arrivée (en cours, échec, hors ligne), il vient dans la zone visible
     (`scroll-margin`, carnets.css). « ✓ Rangé » ne fait rien défiler : le bandeau voisin peut être sous le doigt (P8). */
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || etat === 'range') return;
    if (typeof requestAnimationFrame !== 'function') { el.scrollIntoView?.({ block: 'nearest' }); return; }
    const id = requestAnimationFrame(() => el.scrollIntoView?.({ block: 'nearest' }));
    return () => cancelAnimationFrame(id);
  }, [etat]);
  if (etat === 'en-cours') {
    return (
      <div ref={ref} className="cn-etat cn-etat-cours" role="status" aria-busy="true" data-etat="en-cours">
        <Provenance origine="ia" titre="IA" />
        <span className="cn-sp cn-etat-texte">
          <b>L'IA range…</b>
          {quoi && <span className="cn-etat-quoi"> « {quoi} »</span>}
        </span>
        <span className="cn-actif" aria-hidden><i /><i /><i /></span>
        {onAnnuler && <button type="button" className="cn-x" aria-label="Arrêter l'IA" title="Arrêter l'IA" onClick={onAnnuler}><X size={18} aria-hidden /></button>}
      </div>
    );
  }
  if (etat === 'range') {
    return (
      <div className="cn-etat cn-etat-fini" role="status" data-etat="range">
        <Check size={18} aria-hidden className="cn-ok" />
        <span><span className="cn-cache">✓ </span>Rangé</span>
      </div>
    );
  }
  /* C59-2 : sous plafond de dépenses, la cause est dite (IA en pause), non « n'a pas répondu » */
  if (etat === 'echec') return <div ref={ref} className="cn-etat" role="status" data-etat="echec"><Calculator size={16} aria-hidden /><span>{quoi && /^IA en pause/.test(quoi) ? 'IA en pause : plafond de dépenses atteint : rangé sur place, rien n\'est perdu.' : 'L\'IA n\'a pas répondu : rangé sur place, rien n\'est perdu.'}</span></div>;
  if (etat === 'hors-ligne') return <div ref={ref} className="cn-etat" role="status" data-etat="hors-ligne"><WifiOff size={16} aria-hidden /><span>Hors ligne : rangé sur place, rien n'est perdu.</span></div>;
  if (etat === 'eteint') return <div className="cn-etat" role="status" data-etat="eteint"><Calculator size={16} aria-hidden /><span>Rangé sur place, sans l'IA.</span></div>;
  return null;
}
