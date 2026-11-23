/**
 * Le carnet ouvert (R03, figés p2:h05-3 et p2:i06-4, **sans** la rangée « Ajouter à … : quoi ? », D-114 ; R12 base g5:v03-6 :
 * ✎ près du titre, ··· par note, un seul champ en bas).
 * De haut en bas : « ‹ Carnets », l'état (« Idée · 15 nov. », « À comparer », « Choisi le … »), ···, le titre et son ✎ (G28),
 * sa phrase citée (R25), les pastilles « lié à » (R33, R47), le bandeau et le cadre du geste en cours (slots), Ce qui compte (G5).
 * Tout juste créé (R11, g5:v04-4) : en tête « ●○○○ idée », l'encadré « Idée · 17 nov. / Ensuite : l'IA cherche les façons », et
 * chaque rubrique dit qui agit, Photos comprise (« Photos · aucune », seulement dans cet état).
 * Façons et articles (P5, P38 ; figé h05-3) : dès le 2e article, le tableau du carnet range les articles **dans leur façon** : chaque
 * façon a son nom, ses prix et sa pastille sur le critère (« capte la buée » / « ne capte pas la buée ») ; chaque ligne a son rang, sa
 * vignette (photo ou picto), son nom sur 2 lignes au plus, son origine et son délai (« CH · sur commande »), l'œil de la veille ; les
 * colonnes sont la valeur qui classe et le prix, en-têtes courts avec l'unité. Un lien dont la page n'est pas lue n'est jamais classé :
 * ligne « ? Lien sans aperçu · à relire · Ouvrir ↗ » sous le tableau (P6, `Tableau.aRelire`). Puis la conclusion « Le critère sépare
 * les deux façons : … · Retenir la hotte », de l'IA si elle l'a dite (`separe`), sinon calculée sur place avec `passe()` (picto local).
 * Toucher « Articles » ouvre la feuille des cartes (P12, figé h03-5) : photo, valeur du critère en gros, réglette, « Veiller ».
 * Avant le 2e article : les façons en cartes et l'article en carte. Notes : chaque note porte son genre et son picto (G22).
 */
import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { normaliser } from '../../domain/carnets/analyseLocale';
import { comptesCarnet, pluriel } from '../../domain/carnets/comptes';
import { estLienSeul, sourceDuCritere } from '../../domain/carnets/modele';
import { CalendarCheck, CalendarDays, ChevronDown, ChevronLeft, ChevronRight, Ellipsis, ExternalLink, Eye, FileText, GitFork, Image as ImageIcon, Lightbulb, Link2, ListTodo, Pencil, ShoppingBasket, Tag, Target, X } from 'lucide-react';
import { Bandeau } from './Bandeau';
import { CarteArticle, CarteClassee, estExemple, nombreValeur } from './CarteArticle';
import { colonnesVue, estMesure, meilleursDe, moinsBienQueDe, sansApercu, texteCellule, type ColonneVue, type TableauV } from './Comparer';
import { avecArticle, domaineEtChemin, libelleCaracteristique, libelleEcarte, passe, texteMoinsBienQue } from '../../domain/carnets/comparer';
/** f7 n° 7 : une raison d'écart sans son préfixe « écarté : », pour comparer celle d'un article à celle de sa façon. */
const sansEcarte = (r: string) => r.trim().replace(/^écartée?s*:s*/i, '').trim().toLowerCase();
import { uniquesParTexte } from '../../domain/carnets/doublons';
import { dateCourte, GENRE_LIBELLE, montant, Provenance, STATUT_LIBELLE, texteSortie, type AidesV, type ArticleV, type CarnetV, type ContenuCarnetV, type CritereV, type FaconV, type GenreNote, type NoteV } from './EtatIA';
import { LigneRangee } from './LigneRangee';
import { phraseEnTitre } from './ListeCarnets';
import { PREFIXE_PLANNING } from '../../domain/carnets/anciens';
import { Photos } from './Photos';
import { titreAffiche } from './titre';
import { VignetteObjet } from './pictos';
import { Horizons } from '../saisie/Horizons';
import { ORDRES_DE_GRANDEUR, texteIntention } from '../../domain/horizons';

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
  onDater?: (lundi: string | null) => void;
  /** K2 (côté Carnet) : « Au calendrier › », la chose posée à aujourd'hui si elle n'a pas de date, puis la bascule au Calendrier. */
  onAuCalendrier?: () => void;
  /** D2 : le prix du projet (`estimatedCost`, centimes ici) et le dernier achat semblable proposé ; `semblable: null` = rien, D1. */
  prix?: { centimes?: number; semblable?: { centimes: number; source: string } | null };
  onPrix?: (centimes: number) => void;
  /**
   * L-20 (23.11, M3-1) : retirer un critère (`supprimerLigne`, cible `critere`), par ⋯ de la ligne Critère. Absent : pas de ⋯ (rien
   * qui ne fasse rien). Branché par la vue des carnets.
   */
  onRetirerCritere?: (critereId: string) => void;
  /** Le jour (ISO) ; défaut : aujourd'hui (local). Injecté par le banc et les tests. */
  aujourdhui?: string;
}

function etiquetteStatut(c: CarnetV): string {
  /* CRN-8 (vision au doigt, 21.11) : un projet fait au Planning n'est pas une « Idée » ; la date d'archivage est celle de la migration,
     elle ne se dit pas comme la date du fait */
  if (c.carnet.archive) return /planning/i.test(c.carnet.archive.raison) ? 'Fait au Planning' : `Archivé${dateCourte(c.carnet.archive.le) ? ` le ${dateCourte(c.carnet.archive.le)}` : ''}`;
  if (c.status === 'idea') { const d = dateCourte(c.carnet.creeLe); return d ? `Idée · ${d}` : 'Idée'; }
  /* tour 3, PCN-151 : réalisé (plan payé), la pastille le dit comme la ligne de sortie */
  if (c.status === 'validated' && c.carnet.sortie?.etat === 'realise') { const d = dateCourte(c.carnet.sortie.realiseLe); return d ? `Réalisé le ${d}` : 'Réalisé'; }
  if (c.status === 'validated') { const d = dateCourte(c.carnet.choix?.le); return d ? `Choisi le ${d}` : 'Choisi'; }
  return STATUT_LIBELLE.research;
}

function etendue(centimes: number[]): string | null {
  if (!centimes.length) return null;
  const min = montant(Math.min(...centimes)), max = montant(Math.max(...centimes));
  return min === max ? `${min} CHF` : `${min} à ${max} CHF`; // virgule-ok : min et max sortent de montant(), déjà formaté
}

/**
 * D'où vient un critère, en mots (critique 5, n° 1) : « de votre phrase » seulement pour ce qu'il a écrit (`vous`, ou `phrase` si le
 * lot A le nomme ainsi) ; le calcul local et la page se disent tels quels ; l'IA (et l'exemple simulé du banc) : « proposé par l'IA ».
 */
export function provenanceCritere(cr: Pick<CritereV, 'origine' | 'source'>): string {
  const o = String(cr.origine);
  if (o === 'phrase') return 'de votre phrase';
  if (o === 'locale' && !cr.source) return 'calculé sur place';
  if (o === 'page' && !cr.source) return 'lu sur la page';
  /* l'exemple du banc sans source dite : proposé (simulé) par l'IA, comme h05-3 */
  if (o === 'exemple' && !cr.source) return "proposé par l'IA";
  /* Critique 6, point 13 : la source réelle du critère se lit par `sourceDuCritere` (lot A, modele.ts) : `phrase` = tiré de ses mots,
     même quand l'IA l'a mis en forme ; `ia` = proposé par l'IA. */
  return sourceDuCritere(cr as Parameters<typeof sourceDuCritere>[0]) === 'phrase' ? 'de votre phrase' : "proposé par l'IA";
}

/**
 * « moins bien que la 3e sur tout » (critique 5, n° 23) : le rang du dominant comme Comparer le calcule (`moinsBienQueDe`, qui lit
 * `moinsBienQue` du lot A), dit par `texteMoinsBienQue` (comparer.ts, lot A) ; `null` si personne ne le domine.
 */
export function texteMoinsBien(t: TableauV, l: Ligne): string | null {
  if (l.ecarte) return null;
  const par = moinsBienQueDe(t as never, l as never);
  return par === null ? null : texteMoinsBienQue(par);
}

/* ---------- la conclusion sur place (P5, h05-3) ---------- */

/** « la hotte », « l'extracteur », « le frigo » : le premier mot du nom d'une façon, avec son article. */
export function nomCourt(nom: string): { texte: string; feminin: boolean } {
  const mot = nom.trim().split(/\s+/)[0] ?? nom;
  const bas = mot.charAt(0).toLowerCase() + mot.slice(1);
  if (/^h/i.test(mot)) { const f = /e$/i.test(mot); return { texte: `${f ? 'la' : 'le'} ${bas}`, feminin: f }; }
  const t = avecArticle(bas);
  const feminin = t.startsWith('la ') || (t.startsWith("l'") && /(tion|sion|ure|ence|ance|ite|ette|elle|ise|ade|ude|iere|ine|ille)$/i.test(mot));
  return { texte: t, feminin };
}

/** k1d (h05-3 « capte la buée ») : une pastille dit le critère en minuscule ; « Tient 2 °C » (mis en forme par l'IA) → « tient 2 °C ».
 *  Un sigle (« CO2 », « SAV ») garde sa majuscule : seule une initiale suivie d'une minuscule baisse. */
export function enMinuscule(t: string): string {
  return /^\p{Lu}\p{Ll}/u.test(t) ? t.charAt(0).toLocaleLowerCase('fr') + t.slice(1) : t;
}

/** « tient 80 °C » → « ne tient pas 80 °C » ; « aspire … » → « n'aspire pas … » (un critère oui-non se dit par un verbe). */
export function nier(texte: string): string {
  const t = enMinuscule(texte.trim());
  const m = /^(\S+)(\s.*)?$/.exec(t);
  if (!m) return `pas : ${t}`;
  return `${/^[aeiouyéèêàâîôû]/i.test(m[1]) ? "n'" : 'ne '}${m[1]} pas${m[2] ?? ''}`;
}

export interface Separation { critere: CritereV; retenue: FaconV; texte: string; retenir: string; verdicts: Record<string, boolean | null> }

/** Le verdict d'une façon sur un critère : vrai si l'un de ses articles lus le passe ; faux si tous ceux qu'on connaît échouent. */
function verdictFacon(k: ContenuCarnetV, f: FaconV, cr: CritereV): boolean | null {
  const v = k.articles.filter(a => a.faconId === f.id && a.lecture === 'lue').map(a => passe(a as never, cr as never));
  if (v.some(x => x === true)) return true;
  return v.some(x => x === false) ? false : null;
}

/**
 * Le premier critère (dans leur ordre) qui sépare les façons en lice : une seule le passe, toutes les autres échouent. `null` sinon.
 * Calcul local, sans IA : chaque mot vient du carnet (noms, critère).
 */
export function separationDe(k: ContenuCarnetV): Separation | null {
  const facons = k.facons.filter(f => f.etat !== 'ecartee');
  if (facons.length < 2) return null;
  for (const cr of k.criteres) {
    if (!cr.caracteristique) continue;
    const verdicts = Object.fromEntries(facons.map(f => [f.id, verdictFacon(k, f, cr)]));
    const vals = Object.values(verdicts);
    if (vals.filter(x => x === true).length !== 1 || vals.some(x => x === null)) continue;
    const retenue = facons.find(f => verdicts[f.id] === true)!;
    const court = nomCourt(retenue.nom);
    const positif = cr.caracteristique.sens === 'oui-non' ? cr.texte : `passe : ${cr.texte}`;
    const texte = `Le critère sépare ${facons.length === 2 ? 'les deux façons' : 'les façons'} : ${court.feminin ? 'seule' : 'seul'} ${court.texte} ${positif}.`;
    return { critere: cr, retenue, texte, retenir: court.texte, verdicts };
  }
  return null;
}

/** La pastille d'une façon sur le critère qui sépare (ou le 1er critère oui-non connu) : « capte la buée » / « ne capte pas la buée ». */
function pastilleFacon(k: ContenuCarnetV, f: FaconV, sep: Separation | null): { texte: string; passe: boolean | null } | null {
  if (f.etat === 'ecartee') return f.raison ? { texte: f.raison, passe: false } : null;
  const cr = sep?.critere ?? k.criteres.find(c => c.caracteristique?.sens === 'oui-non');
  const v = cr ? (sep ? sep.verdicts[f.id] ?? null : verdictFacon(k, f, cr)) : null;
  if (cr && v !== null) {
    const oui = cr.caracteristique?.sens === 'oui-non';
    return { texte: v ? enMinuscule(cr.texte) : oui ? nier(cr.texte) : 'hors critère', passe: v };
  }
  return f.raison ? { texte: f.raison, passe: f.etat === 'retenue' ? true : null } : null;
}

/* ---------- le carnet ---------- */

/** f13 tour 2 (n° 5) : la bande de l'en-tête du carnet tout juste créé (g5:v04-4) ; inactive, ses enfants seuls. */
function Bande({ active, children }: { active: boolean; children: React.ReactNode }) {
  return active ? <div className="cn-bande">{children}</div> : <>{children}</>;
}

export function CarnetOuvert(p: CarnetOuvertProps) {
  const c = p.carnet, k = c.carnet;
  /* k1d (h05-3, i06-4) : un projet porté du Planning a pour titre le nom de la tâche, pas sa phrase ; son budget vient du Planning */
  const duPlanning = c.id.startsWith(PREFIXE_PLANNING);
  const provenance = (el: CritereV): string | null =>
    duPlanning && String(el.origine) === 'vous' ? (/Planning/.test(el.texte) ? null : 'repris du Planning') : provenanceCritere(el);
  const avecProv = (el: CritereV) => { const x = provenance(el); return x ? ` · ${x}` : ''; };
  /* tour 3, PCN-109 : la pastille R47 dit le lien vers À venir ; la ligne de sortie sous le choix ne le redit pas */
  const sortieEnPastille = !!k.sortie?.planId && p.liens.some(l => l.id === k.sortie!.planId);
  const [menu, setMenu] = useState(false);
  /* critique 6, n° 22 (R21) : le menu « Renommer / Supprimer l'idée » se ferme dès qu'on choisit (✎ compris), à Échap et au toucher
     ailleurs ; il ne reste jamais au-dessus du cadre de renommage. */
  const refMenu = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!menu) return;
    const touche = (e: KeyboardEvent) => { if (e.key === 'Escape') setMenu(false); };
    const ailleurs = (e: PointerEvent) => {
      const t = e.target as Node | null;
      if (refMenu.current && t && !refMenu.current.contains(t) && !(t instanceof Element && t.closest('[aria-label="Plus"]'))) setMenu(false);
    };
    window.addEventListener('keydown', touche);
    window.addEventListener('pointerdown', ailleurs);
    return () => { window.removeEventListener('keydown', touche); window.removeEventListener('pointerdown', ailleurs); };
  }, [menu]);
  const [cartes, setCartes] = useState(false);
  const [voirCriteres, setVoirCriteres] = useState(false);
  const [gererCriteres, setGererCriteres] = useState(false);
  /* L-21 (23.11, M4-22) : une rubrique Notes vue dans ce carnet ouvert ne disparaît pas quand sa dernière note est rangée ailleurs
     (en critère par l'IA) : elle dit « aucune ». La mise en page ne change pas sous les yeux. */
  const notesVues = useRef<{ id: string; vu: boolean }>({ id: c.id, vu: false });
  if (notesVues.current.id !== c.id) notesVues.current = { id: c.id, vu: false };
  if (k.notes.length > 0) notesVues.current.vu = true;
  const r = p.rangee;
  const critere = k.criteres.find(x => x.caracteristique) ?? k.criteres[0];
  /* critique 6, n° 15 : les comptes viennent de `comptesCarnet`, comme la liste et la suppression */
  const n = comptesCarnet(k);
  const enDouble = new Set(p.aides.doublon ? p.doublons ?? [] : []);
  const question = k.facons.length === 2 ? `${k.facons[0].nom} ou ${k.facons[1].nom} ?` : null;
  const neuf = !!p.vientDEtreCree && c.status === 'idea';
  /* CRN-21 (critique carnet 21.11) : la note qui arrive (carnet neuf, ou note ajoutée) vient au-dessus du champ du bas ; sinon
     « Notes 1 » touche le champ et la note est dessous. 'nearest' : un défilement minimal, rien si elle se voit déjà ;
     scroll-margin (carnets.css, `.cn-notes > *`) lit --cn-champ-h et --cn-clavier, comme le bandeau. */
  const notesRef = useRef<HTMLDivElement>(null);
  const nbNotes = useRef(neuf ? 0 : k.notes.length);
  useEffect(() => {
    const avant = nbNotes.current; nbNotes.current = k.notes.length;
    if (k.notes.length <= avant) return;
    const el = notesRef.current?.lastElementChild as HTMLElement | null | undefined;
    if (!el) return;
    if (typeof requestAnimationFrame !== 'function') { el.scrollIntoView?.({ block: 'nearest' }); return; }
    const id = requestAnimationFrame(() => el.scrollIntoView?.({ block: 'nearest' }));
    return () => cancelAnimationFrame(id);
  }, [k.notes.length]);

  /* P6 : les liens non lus, jamais classés ; le contrat de comparer.ts (`aRelire`), sinon lus sur le carnet */
  const aRelire: ArticleV[] = p.tableau
    ? ((p.tableau as { aRelire?: ArticleV[] }).aRelire ?? k.articles.filter(a => sansApercu(a) && !a.prixCentimes && !Object.keys(a.valeurs).length))
    : [];

  const encadre = (cible: RangeeV['cible'], id: string, noeud: React.ReactNode) =>
    r && r.cible === cible && r.id === id
      ? <LigneRangee key={id} phrase={r.phrase} rangeSur={r.rangeSur} onAnnuler={r.onAnnuler} onVotreTexte={r.onVotreTexte} onDeplacer={r.onDeplacer} onChangerEnNote={r.onChangerEnNote}>{noeud}</LigneRangee>
      : <React.Fragment key={id}>{noeud}</React.Fragment>;

  /* « Ce qui compte » (h05-3 ; critique 5, n° 1 et 22) : **une ligne** « Critère : <ce qui range> · proposé par l'IA ». Ce qui range =
     les critères qui ont une caractéristique, dans leur ordre (« tient 80 °C, puis le débit »), comme Comparer ; sinon le premier
     critère. La provenance dit la vérité de chacun : « de votre phrase » seulement pour ce qui vient de lui. Les autres critères (sans
     valeur à comparer) sont rangés derrière « +1 sans valeur », un toucher les montre ; un critère tout juste rangé (rangée) les ouvre.
     P11 : un critère par texte normalisé. */
  const criteres = uniquesParTexte(k.criteres);
  /* critique 6, n° 14 (g5:v03-8, D-38) : chaque critère est écrit une fois. Le critère tout juste rangé ne se dit que dans sa ligne
     rangée (« ✓ Rangé ici · Annuler »), jamais en plus dans la ligne Critère ni dans une sous-liste de tous les critères. */
  const uRange = r && r.cible === 'critere' ? criteres.find(u => u.ids.includes(r.id)) : undefined;
  const critereRange = !!uRange;
  const autres = uRange ? criteres.filter(u => u !== uRange) : criteres;
  const classants = autres.filter(u => u.el.caracteristique);
  const tete = classants.length ? classants : autres.slice(0, 1);
  const derriere = autres.filter(u => !tete.includes(u));
  const provsTete = [...new Set(tete.map(u => provenance(u.el)))];
  /* n° 34 : « 1 critère sans valeur à comparer ⌄ », compté sans le critère rangé ; pendant que l'IA range (un cadre de geste est
     posé), le compte reste celui d'avant l'envoi : il ne bouge pas sous les yeux. */
  const derriereAvant = useRef(derriere.length);
  if (!p.cadre) derriereAvant.current = derriere.length;
  const nDerriere = p.cadre ? derriereAvant.current : derriere.length;
  const texteTete = (
    <>
      {tete.map((u, i) => (
        <React.Fragment key={u.ids[0]}>
          {i > 0 ? ', puis ' : ''}<b>{u.el.texte}</b>
          {provsTete.length > 1 && avecProv(u.el) && <span className="cn-mut">{avecProv(u.el)}</span>}
        </React.Fragment>
      ))}
      {provsTete.length === 1 && provsTete[0] && <span className="cn-mut"> · {provsTete[0]}</span>}
    </>
  );
  /* La phrase du critère rangé : citée une fois. Si le critère est sa phrase même (normalisée), « · de votre phrase » le dit déjà. */
  const phraseRangee = uRange && r?.phrase && normaliser(r.phrase) !== normaliser(uRange.el.texte) ? r.phrase : undefined;
  /* n° 34 : à la suite de la ligne Critère (h05-3 n'a qu'une ligne : pas une ligne de plus à 390) */
  const plusCriteres = nDerriere > 0 ? (
    <button type="button" className="cn-lien cn-critere-plus" aria-expanded={voirCriteres} onClick={() => setVoirCriteres(v => !v)}>
      {pluriel(nDerriere, 'critère')} sans valeur à comparer <ChevronDown size={15} aria-hidden className={voirCriteres ? 'cn-tourne' : undefined} />
    </button>
  ) : null;
  const rangeeCritere = uRange && r ? (
    <LigneRangee phrase={phraseRangee} rangeSur={r.rangeSur} onAnnuler={r.onAnnuler} onVotreTexte={r.onVotreTexte} onDeplacer={r.onDeplacer} onChangerEnNote={r.onChangerEnNote}>
      <p className="cn-critere cn-critere-court"><b>{uRange.el.texte}</b><span className="cn-mut">{avecProv(uRange.el)}{uRange.el.caracteristique ? '' : ' · sans valeur à comparer'}</span></p>
    </LigneRangee>
  ) : null;
  /* L-20 (23.11, M3-1) : aucun geste ne retirait un critère (appui court, long, ⋯ du carnet : rien). Comme chaque note a son ⋯ (R12),
     la ligne Critère a le sien : il montre chaque critère, une fois, avec « Retirer ». */
  const boutonCriteres = p.onRetirerCritere ? (
    <button type="button" className="cn-ico cn-critere-actions" aria-label="Critères, actions" aria-expanded={gererCriteres} onClick={() => setGererCriteres(v => !v)}><Ellipsis size={22} aria-hidden /></button>
  ) : null;
  const listeCriteres = gererCriteres && p.onRetirerCritere ? (
    <div className="cn-criteres-derriere" role="list" aria-label="Critères">
      {criteres.map(u => (
        <p key={u.ids[0]} className="cn-critere cn-critere-court cn-critere-retirable" role="listitem">
          <span className="cn-sp"><b>{u.el.texte}</b><span className="cn-mut">{avecProv(u.el)}</span></span>
          <button type="button" className="cn-lien" aria-label={`Retirer le critère « ${u.el.texte} »`} onClick={() => { for (const id of u.ids) p.onRetirerCritere!(id); }}>Retirer</button>
        </p>
      ))}
    </div>
  ) : null;
  const ligneCritere = criteres.length > 0 && (
    <section className="cn-critere-bloc" aria-label="Ce qui compte">
      {tete.length > 0 && (
        <p className="cn-critere cn-critere-une">
          <Target size={18} aria-hidden className="cn-vert cn-critere-ico" />
          <span className="cn-sp"><span className="cn-critere-tx">Critère : {texteTete}</span>{plusCriteres && <> <span className="cn-mut" aria-hidden>·</span> {plusCriteres}</>}</span>
          {boutonCriteres}
        </p>
      )}
      {rangeeCritere}
      {tete.length === 0 && plusCriteres}
      {listeCriteres}
      {voirCriteres && !listeCriteres && derriere.length > 0 && (
        <div className="cn-criteres-derriere" role="list" aria-label="Critères sans valeur à comparer">
          {derriere.map(u => (
            <p key={u.ids[0]} className="cn-critere cn-critere-court" role="listitem">
              <b>{u.el.texte}</b>
              <span className="cn-mut">{avecProv(u.el)}{u.el.raison ? ` · ${u.el.raison}` : ''}</span>
            </p>
          ))}
        </div>
      )}
    </section>
  );
  /* n° 19 (h05-3) : la ligne d'état sous le titre, « 2 façons à comparer · attendre l'avis du ferblantier » (le « à faire » du carnet, tel
     qu'il l'a écrit) ; rien d'inventé, rien à 0. */
  /* CRN-7 (vision au doigt, 21.11) : la note des dates d'un projet du Planning (« À faire du … au … (Planning, …) ») est déjà la note
     du carnet ; elle n'est pas redite sous le titre. Archivé, rien n'est plus « à faire » (CRN-8). */
  const notePlanning = (t: string) => duPlanning && /\(Planning[^)]*\)\s*$/.test(t);
  const aFaire = c.carnet.archive ? undefined : k.notes.find(x => x.genre === 'a-faire' && !notePlanning(x.texte))?.texte;
  /* n° 15 et 28 : « 2 façons à comparer » (les façons en lice, comme la liste), sinon « 2 articles à comparer » ; accordés. */
  const etatTete = c.status === 'validated' || neuf ? null
    : p.tableau ? (n.facons >= 2 ? `${pluriel(n.facons, 'façon')} à comparer` : `${pluriel(n.articles, 'article')} à comparer`)
      : n.facons >= 2 ? pluriel(n.facons, 'façon') : null;
  const ligneEtat = (etatTete || (aFaire && !neuf && c.status !== 'validated'))
    ? <p className="cn-ligne-etat">{etatTete && <span>{etatTete}</span>}{etatTete && aFaire ? <span className="cn-mut"> · </span> : null}{aFaire && <span className="cn-mut">{aFaire}</span>}</p>
    : null;
  const ia = !p.iaIndisponible;
  /* tour 3, PCN-113 : créé hors ligne, rien n'est encore rangé : une ligne dit que l'IA le range au retour du réseau, sans rubriques vides */
  const enAttente = neuf && p.iaIndisponible === 'hors-ligne' && !k.criteres.length && !k.facons.length && !k.articles.length && !k.notes.length && !k.photos.length;
  /* tout juste créé, le bandeau cite déjà sa phrase (g5:v04-4 ; n° 39 : jamais deux fois). Critique 6, n° 30 (R25) : la phrase citée
     dit ce qu'elle est, « votre phrase : « … » », jamais des guillemets seuls qui flottent ; n° 14 : pas une seconde fois si la ligne
     rangée la cite déjà. */
  const phraseCitee = k.phrase && !duPlanning && !p.vientDEtreCree && !(r?.phrase && normaliser(r.phrase) === normaliser(k.phrase)) ? (phraseEnTitre(c.title, k.phrase)
    ? <p className="cn-cite" data-en-titre>votre phrase en titre</p>
    : <p className="cn-cite">{estLienSeul(k.phrase) ? 'votre lien' : 'votre phrase'} : « {k.phrase} »</p>) : null; /* f5d n° 11 */

  const articleRange = r?.cible === 'article' ? k.articles.find(a => a.id === r.id) : undefined;
  const faconRange = articleRange?.faconId ? k.facons.find(f => f.id === articleRange.faconId) : undefined;

  const sep = p.tableau ? separationDe(k) : null;
  const conclusion = p.separe
    ? { texte: p.separe.texte, retenir: p.separe.retenir, onRetenir: p.separe.onRetenir, ia: true }
    : sep ? { texte: sep.texte, retenir: sep.retenir, onRetenir: () => (p.onRetenirFacon ? p.onRetenirFacon(sep.retenue.id) : p.onComparer()), ia: false } : null;

  /* f13 tour 2 (n° 6, g5:v04-4) : les rubriques à filet du carnet neuf portent des pictos de 20 px, verts et centrés (carnets.css) */
  const picto = neuf ? 20 : 18;

  return (
    <article className={`cn-page cn-ouvert${p.grise ? ' cn-grise' : ''}`} aria-label={titreAffiche(c.title)}>
      {/* Tour 3, f13 tour 2 (critique n° 5, g5:v04-4) : tout juste créé, en-tête, titre et encadré sur la bande teintée de sa maquette,
          fermée par un filet ; ailleurs, rien ne les enveloppe. */}
      <Bande active={neuf}>
      <div className="cn-tete">
        <button type="button" className="cn-retour" onClick={p.onRetour}><ChevronLeft size={20} aria-hidden /> Carnets</button>
        <span className="cn-sp" />
        {/* critique 6, n° 32 : ailleurs, l'état n'a qu'une forme, la pastille (g05-1 « Idée », h05-3 : la ligne d'état la remplace quand elle
            dit « 2 façons à comparer »). Tour 3, f13 (PCN-27, R11, règle n° 1) : tout juste créé, l'en-tête de sa maquette g5:v04-4,
            « ●○○○ idée » ; la date est dans l'encadré dessous, pas en pastille. */}
        {neuf
          ? <span className="cn-etapes" aria-label="Étape : idée"><span className="cn-etape-on" /><span /><span /><span /><span className="cn-lien-texte">idée</span></span>
          : !(etatTete && c.status === 'research') && <span className={`cn-pastille cn-statut-${c.status}`}>{etiquetteStatut(c)}</span>}
        <button type="button" className="cn-ico" aria-label="Plus" aria-expanded={menu} onClick={() => setMenu(m => !m)}><Ellipsis size={22} aria-hidden /></button>
        {/* tour 3, PCN-154 : le menu flotte sous ···, hors du flux (le titre ne descend plus) */}
        {menu && (
          <div ref={refMenu} className="cn-feuille cn-menu" role="menu">
            <button type="button" role="menuitem" className="cn-feuille-item" onClick={() => { setMenu(false); p.onRenommer(); }}><Pencil size={18} aria-hidden /> Renommer</button>
            <button type="button" role="menuitem" className="cn-feuille-item cn-rouge" onClick={() => { setMenu(false); p.onSupprimer(); }}>
              {/* L-22 (23.11, M2-18, glossaire) : le même mot dans chaque état ; un carnet choisi n'est plus une idée (PCN-189) */}
              Supprimer le carnet</button>
          </div>
        )}
      </div>
      <div className="cn-titre-ligne">
        {/* f13 tour 2 (n° 4) : « Embouteillage », sa majuscule ; le titre stocké ne change pas */}
        <h2 className="cn-titre">{titreAffiche(c.title)}</h2>
        <button type="button" className="cn-ico" aria-label="Renommer" onClick={() => { setMenu(false); p.onRenommer(); }}><Pencil size={20} aria-hidden /></button>
      </div>
      {/* Tour 3, f13 (PCN-27, R11, règle n° 1) : tout juste créé, sa maquette g5:v04-4 telle quelle : l'encadré « Idée · 17 nov. / Ensuite :
          l'IA cherche les façons » entre le titre et le bandeau « ✓ Carnet créé · ↺ Annuler » (la critique 6, n° 16, l'avait retiré contre
          la maquette). Sans IA, la suite ne promet rien d'elle (n° 24) : « Ensuite : collez un lien » ; hors ligne, la ligne « au retour du
          réseau » dit déjà la suite : l'encadré ne garde que l'état. */}
      {neuf && (
        <div className="cn-encadre-idee">
          <b className="cn-att">{etiquetteStatut(c)}</b>
          {!enAttente && <b>Ensuite : {ia && k.facons.length === 0 ? "l'IA cherche les façons" : k.articles.length === 0 ? 'collez un lien' : ia ? "l'IA compare" : 'comparez les articles'}</b>}
        </div>
      )}
      </Bande>
      {/* P9 (vision 1) : la confirmation, le bandeau et le cadre du geste restent juste sous le titre, avant la ligne d'état et le tableau :
          à 390 ils doivent être à l'écran quand on les touche */}
      {p.bandeau}
      {p.cadre}
      {ligneEtat}
      {/* h05-3 : la ligne Critère juste sous la ligne d'état, puis le tableau (n° 1) */}
      {!neuf && ligneCritere}
      {/* L4-5 : titre = phrase (normalisé) → « votre phrase en titre », une fois ; tout juste créé, le bandeau le dit déjà (g5:v04-4).
          Sinon la phrase citée (R25) : sous le titre tant qu'il n'y a pas de tableau ; avec le tableau, sous lui (le tableau monte). */}
      {!p.tableau && phraseCitee}

      {/* tour 3, f4c (PCN-42) : grisé derrière la carte de suppression, le lien est dit par la carte ; la pastille ne le double pas */}
      {/* CRN-9 (g05-1, i06-1) : le lien vers Matériel tient en une ligne, « Dans À venir depuis le 16 nov. · Voir › » ; le titre du
          carnet n'y est pas redit (un seul lien) ; avec plusieurs liens, chacun dit son plan. */}
      {p.liens.length > 0 && !p.grise && (
        <div className="cn-liens">
          {p.liens.slice(0, 3).map(l => {
            const ou = l.sorte === 'a-venir' ? 'À venir' : 'Réalisés';
            const quoi = p.liens.length > 1 ? ` · ${l.libelle}` : '';
            const depuis = dateCourte(l.le) ? ` depuis le ${dateCourte(l.le)}` : '';
            const texte = l.etat === 'supprime' ? `Supprimé côté ${ou}${quoi}` : `Dans ${ou}${depuis}${quoi}`;
            return l.etat === 'present' && p.onOuvrirLien
              ? (
                <button key={`${l.sorte}:${l.id}`} type="button" className="cn-lien-ligne" onClick={() => p.onOuvrirLien!(l)}>
                  <CalendarCheck size={18} aria-hidden /><span className="cn-sp">{texte}</span>
                  <span className="cn-lien">Voir <ChevronRight size={16} aria-hidden /></span>
                </button>
              )
              : <p key={`${l.sorte}:${l.id}`} className="cn-lien-ligne cn-mut"><CalendarCheck size={18} aria-hidden /><span className="cn-sp">{texte}</span></p>;
          })}
          {p.liens.length > 3 && <span className="cn-mut">+{p.liens.length - 3} autres</span>}
        </div>
      )}


      {c.status === 'validated' && k.choix && (
        <div className="cn-choisi-resume">
          <button type="button" className="cn-carte cn-choisi-ligne" onClick={p.onVoirChoix}>
            {(() => { const ch = k.articles.find(a => a.id === k.choix!.articleId); return <VignetteObjet photo={ch?.photo} mots={[ch?.nom, c.title]} classe="cn-vignette-petite" taille={30} />; })()}
            <span className="cn-sp"><b>Choisi : {k.articles.find(a => a.id === k.choix!.articleId)?.nom ?? 'article'}</b><span className="cn-mut">{k.choix.pourquoi}</span></span>
            <span className="cn-lien">Pourquoi <ChevronRight size={16} aria-hidden /></span>
          </button>
          {k.sortie
            ? !sortieEnPastille && <p className="cn-avenir-ligne"><CalendarCheck size={18} aria-hidden /> {texteSortie(k.sortie)}</p>
            : p.onEnvoyerAVenir && <button type="button" className="cn-action" onClick={p.onEnvoyerAVenir}><CalendarCheck size={18} aria-hidden /> Envoyer dans À venir</button>}
        </div>
      )}

      {/* n° 2 (g5:v04-4) : tout juste créé, « Ce qui compte » est une rubrique à filet comme les autres, jamais un encadré ; sans
          critère, « rien encore : l'IA le proposera » (sans promesse quand l'IA manque, n° 24). Ailleurs, la ligne Critère est en haut. */}
      {enAttente && <p className="cn-mut cn-attente" data-attente="hors-ligne">L'IA le range au retour du réseau : ce qui compte, façons, articles. Rien n'est perdu.</p>}
      {!enAttente && neuf && criteres.length > 0 && (
        <section className={`cn-rubrique${neuf ? ' cn-rubrique-ligne' : ''}`} aria-label="Ce qui compte">
          {criteres.length === 0
            ? <p className="cn-rubrique-tete"><Target size={picto} aria-hidden /> <b>Ce qui compte</b> <span className="cn-mut">· rien encore{ia ? " : l'IA le proposera" : ''}</span></p>
            : <>
              <p className="cn-rubrique-tete cn-cqc-ligne"><Target size={18} aria-hidden /> <b>Ce qui compte</b> {tete.length > 0 && <span className="cn-cqc-texte">· {texteTete}</span>}{boutonCriteres}</p>
              {rangeeCritere}
              {listeCriteres}
            </>}
        </section>
      )}

      {/* Sans tableau : les façons en cartes (i06-4). Avec tableau : elles sont dans le tableau, avec leur pastille (h05-3). */}
      {!enAttente && !p.tableau && k.facons.length > 0 && (
        <section className={`cn-rubrique${neuf ? ' cn-rubrique-ligne' : ''}`} aria-label="Façons">
          {k.facons.length === 0 ? (
            <p className="cn-rubrique-tete"><GitFork size={picto} aria-hidden /> <b>Façons</b> <span className="cn-mut">· aucune{ia ? " : l'IA les cherche" : ''}</span></p>
          ) : (
            <>
              <h3 className="cn-rubrique-tete">{question ?? <><GitFork size={18} aria-hidden /> Façons</>}{/* tour 3, f5c n° 5 : une seule façon, sa carte est juste dessous : le compte la redirait */}{k.facons.length >= 2 && <> <span className="cn-mut cn-nowrap">{pluriel(k.facons.length, 'façon')}</span></>}</h3>
              <div className="cn-facons">
                {k.facons.map(f => {
                  const sesArticles = k.articles.filter(a => a.faconId === f.id);
                  const prix = etendue(sesArticles.map(a => a.prixCentimes).filter((x): x is number => typeof x === 'number'));
                  const carte = (
                    <div className={`cn-facon cn-facon-${f.etat}`}>
                      <b>{f.nom}</b>
                      {prix ? <span className="cn-mono">{prix}</span> : <span className="cn-mut">aucun article encore</span>}
                      {f.raison && f.etat === 'ouverte' && <span className="cn-mut">{f.raison}</span>}
                      {f.etat === 'retenue' && f.raison && <span className="cn-pastille cn-pastille-plein">{f.raison}</span>}
                      {f.etat === 'ecartee' && f.raison && <span className="cn-pastille">{f.raison}</span>}
                      {f.etat === 'ouverte' && !sesArticles.length && <span className="cn-pastille">à chercher</span>}
                    </div>
                  );
                  return encadre('facon', f.id, carte);
                })}
              </div>
            </>
          )}
        </section>
      )}

      {!enAttente && <section className={`cn-rubrique${neuf ? ' cn-rubrique-ligne' : ''}`} aria-label="Articles">
        {k.articles.length === 0 ? (
          <p className="cn-rubrique-tete"><Tag size={picto} aria-hidden /> <b>Articles</b> <span className="cn-mut">· collez un lien</span></p>
        ) : (
          <>
            {/* Critique 6, n° 8 (R03, D-99, h05-3) : une seule ligne, « Articles 6 ⌄ · Comparer › ». Le compte est le total de
                `comptesCarnet` (lus et sans aperçu ensemble, n° 15) ; le lien sans aperçu se lit dans le tableau (« Lien sans aperçu ·
                Ouvrir »). P12 (h03-5) : toucher « Articles » ouvre la feuille des cartes. */}
            <div className="cn-rubrique-tete cn-tete-articles">
              {p.tableau ? (
                <button type="button" className="cn-tete-bouton" aria-haspopup="dialog" aria-expanded={cartes} onClick={() => setCartes(true)}>
                  <Tag size={18} aria-hidden /><b>Articles</b>
                  <span className="cn-mut cn-mono cn-compte">{n.articles}</span>
                  <ChevronDown size={16} aria-hidden className="cn-mut" />
                </button>
              ) : (
                <><Tag size={18} aria-hidden /><b>Articles</b><span className="cn-mut cn-mono cn-compte">{n.articles}</span></>
              )}
              {p.tableau && <><span className="cn-mut" aria-hidden>·</span><button type="button" className="cn-lien cn-comparer-lien" onClick={p.onComparer}>Comparer <ChevronRight size={16} aria-hidden /></button></>}
            </div>
            {articleRange && r && !p.tableau && (
              <LigneRangee sorte="article" faconNom={faconRange?.nom} rang={r.rang} phrase={r.phrase}onAnnuler={r.onAnnuler} onDeplacer={r.onDeplacer}>
                <CarteArticle article={articleRange} critere={critere} faconNom={faconRange?.nom} carnetTitre={c.title} variante="complete" luSurPage={r.luSurPage} verdict={r.verdict} onVeille={v => p.onVeille?.(articleRange.id, v)} />
              </LigneRangee>
            )}
            {p.tableau ? (<>
              {/* n° 20 : la conclusion se colle aux façons en lice, avant l'écartée et le lien à relire */}
              <TableauCarnet carnet={k} titre={c.title} tableau={p.tableau} aRelire={aRelire} sep={sep} onOuvrir={p.onOuvrirArticle}
                conclusion={conclusion && (
                  <div className="cn-encart cn-separe" role="note">
                    {/* un nombre ne se sépare pas de son unité (« 80 °C » jamais coupé en fin de ligne) */}
                    <span className="cn-sp"><Provenance origine={conclusion.ia ? 'ia' : 'locale'} /> {conclusion.texte.replace(/(\d) (°C|m³\/h|L\/min|CHF|kg|cm|L)\b/g, (_, n: string, u: string) => `${n} ${u}`)}</span>
                    <button type="button" className="cn-action cn-action-vert" onClick={conclusion.onRetenir}>Retenir {conclusion.retenir}</button>
                  </div>
                )} />
              {/* tour 3, PCN-108 et 132 (G20, g5:v06-11) : au 2e article, le tableau est à l'écran avec l'article déposé dans ses
                  lignes ; « Article rangé ici · 2e · Annuler » dessous, sans carte complète qui pousserait le tableau sous la flottaison */}
              {articleRange && r && (
                <LigneRangee sorte="article" faconNom={faconRange?.nom} rang={r.rang} phrase={r.phrase} onAnnuler={r.onAnnuler} onDeplacer={r.onDeplacer}>{null}</LigneRangee>
              )}
            </>) : (
              <div className="cn-cartes">
                {(() => {
                  /* n° 6 (g5:v06-10) : un seul article lu, la carte complète (valeurs avec unité, « lu sur la page : … », veille) */
                  const reste = k.articles.filter(a => a.id !== articleRange?.id);
                  const seul = !articleRange && reste.length === 1 && reste[0].lecture === 'lue' ? reste[0] : null;
                  if (seul) {
                    return (
                      <div className="cn-carte-complete">
                        <CarteArticle article={seul} critere={critere} faconNom={k.facons.find(f => f.id === seul.faconId)?.nom} carnetTitre={c.title} variante="complete"
                          onOuvrir={() => p.onOuvrirArticle(seul.id)} onVeille={v => p.onVeille?.(seul.id, v)} />
                      </div>
                    );
                  }
                  return reste.map(a => (
                    <CarteArticle key={a.id} article={a} critere={critere} carnetTitre={c.title} faconNom={k.facons.find(f => f.id === a.faconId)?.nom} onOuvrir={() => p.onOuvrirArticle(a.id)} />
                  ));
                })()}
              </div>
            )}
          </>
        )}
      </section>}

      {/* tour 3, v1-neuf 6 : sous le tableau, « votre phrase en titre » flotterait seul, loin du titre : il ne se dit que sous le titre */}
      {p.tableau && !phraseEnTitre(c.title, k.phrase ?? '') && phraseCitee}

      {enAttente || k.photos.length === 0 ? null : <Photos photos={k.photos} />}

      {!enAttente && (k.notes.length > 0 || p.noteSupprimee || notesVues.current.vu) && <section className={`cn-rubrique${neuf ? ' cn-rubrique-ligne' : ''}`} aria-label="Notes">
        {k.notes.length === 0 && !p.noteSupprimee ? (
          <p className="cn-rubrique-tete"><FileText size={picto} aria-hidden /> <b>Notes</b> <span className="cn-mut">· aucune</span></p>
        ) : (
          <>
            <h3 className="cn-rubrique-tete"><FileText size={18} aria-hidden /> Notes <span className="cn-mut cn-mono">{k.notes.length}</span></h3>
            <div className="cn-notes" ref={notesRef}>
              {k.notes.map((n, i) => (
                <React.Fragment key={n.id}>
                  {p.noteSupprimee && i === 0 && !p.noteSupprimee.apres && <Bandeau enLigne bandeau={{ sorte: 'note-supprimee' }} onAnnuler={p.noteSupprimee.onAnnuler} />}
                  {encadre('note', n.id, <LigneNote note={n} doublon={enDouble.has(n.id)} onNote={p.onNote} fait={!!c.carnet.archive} />)}
                  {p.feuille?.noteId === n.id && p.feuille.contenu}
                  {p.noteSupprimee?.apres === n.id && <Bandeau enLigne bandeau={{ sorte: 'note-supprimee' }} onAnnuler={p.noteSupprimee.onAnnuler} />}
                </React.Fragment>
              ))}
              {p.noteSupprimee && k.notes.length === 0 && <Bandeau enLigne bandeau={{ sorte: 'note-supprimee' }} onAnnuler={p.noteSupprimee.onAnnuler} />}
            </div>
          </>
        )}
      </section>}

      {!enAttente && p.onDater && <RubriqueQuand date={c.date} precision={c.precision} aujourdhui={p.aujourdhui ?? jourLocal()} neuf={neuf} picto={picto}
        onDater={p.onDater} onAuCalendrier={p.onAuCalendrier} prix={p.prix} onPrix={p.onPrix} />}

      {p.vientDEtreCree && <p className="cn-mut cn-g6">Le champ en bas range tout ici : une phrase, un lien collé, une photo.</p>}

      {cartes && p.tableau && (
        <FeuilleCartes carnet={k} titre={c.title} tableau={p.tableau} aRelire={aRelire} onFermer={() => setCartes(false)}
          onOuvrir={id => { setCartes(false); p.onOuvrirArticle(id); }} onVeille={p.onVeille} taux={p.taux} onTaux={p.onTaux} />
      )}
    </article>
  );
}

/* ---------- Quand et prix (C1, K2, D2 ; 21.11) ---------- */

const jourLocal = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/**
 * « juste, aujourd'hui, dans 1 mois, dans 3 mois… 6m 1 ans » : une rubrique à filet comme les autres (aucun élément neuf : picto, mot,
 * état en gris, puces du carnet). Un toucher date le projet (« vers févr. »), un autre le reporte. Daté, le prix : le dernier achat
 * semblable à garder d'un toucher (« Pompe 2025 : 420 CHF »), sinon les ordres de grandeur ; posé, « estimé » jusqu'à la facture.
 */
function RubriqueQuand(p: { date?: string; precision?: 'semaine' | 'mois'; aujourdhui: string; neuf: boolean; picto: number; onDater: (lundi: string | null) => void; onAuCalendrier?: () => void;
  prix?: CarnetOuvertProps['prix']; onPrix?: (centimes: number) => void }) {
  const quand = texteIntention(p.date, p.aujourdhui, p.precision);
  const [changerPrix, setChangerPrix] = useState(false);
  const pose = p.prix?.centimes;
  const semblable = p.prix?.semblable;
  const garder = (x: number) => { p.onPrix?.(x); setChangerPrix(false); };
  return (
    <section className={`cn-rubrique cn-quand${p.neuf ? ' cn-rubrique-ligne' : ''}`} aria-label="Quand">
      <p className="cn-rubrique-tete"><CalendarDays size={p.picto} aria-hidden /> <b>Quand</b> <span className="cn-mut">· {quand ?? 'pas encore daté'}</span>
        {quand && pose !== undefined && <span className="cn-mut"> · {montant(pose)} CHF estimé</span>}
        {quand && pose !== undefined && p.onPrix && <> <button type="button" className="cn-lien" aria-expanded={changerPrix} onClick={() => setChangerPrix(v => !v)}>Prix</button></>}</p>
      <Horizons date={p.date} aujourdhui={p.aujourdhui} classePuce="cn-puce" className="cn-horizons" onChoisir={(_, lundi) => p.onDater(lundi)} />
      {quand && p.onPrix && (pose === undefined || changerPrix) && (
        <div role="group" aria-label="Prix estimé" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginTop: 8 }}>
          {/* les montants seuls ne disaient pas ce qu'ils sont : le mot en gris, comme l'état d'une rubrique */}
          <span className="cn-mut" aria-hidden>Prix estimé ?</span>
          {semblable
            ? <button type="button" className="cn-puce" onClick={() => garder(semblable.centimes)}>{semblable.source} : {montant(semblable.centimes)} CHF · garder</button>
            : ORDRES_DE_GRANDEUR.map(x => <button key={x} type="button" className="cn-puce" aria-pressed={pose === x} onClick={() => garder(x)}>{montant(x)} CHF</button>)}
        </div>
      )}
      {p.onAuCalendrier && <button type="button" className="cn-second cn-quand-cal" onClick={p.onAuCalendrier}>Au calendrier <ChevronRight size={16} aria-hidden /></button>}
    </section>
  );
}

/* ---------- notes : chaque note porte son genre (G22, P11) ---------- */

const PICTO_GENRE: Record<GenreNote, React.ReactNode> = {
  'a-acheter': <ShoppingBasket size={18} />,
  'a-faire': <ListTodo size={18} />,
  question: <span className="cn-picto-question">?</span>,
  conseil: <Lightbulb size={18} />,
  note: <FileText size={18} />
};

function LigneNote({ note, doublon, onNote, fait }: { note: NoteV; doublon: boolean; onNote: (id: string) => void; fait?: boolean }) {
  const d = dateCourte(note.modifieeLe ?? note.le);
  /* CRN-8 : dans un carnet archivé, ce qui était « à faire » est fait */
  const genreMot = fait && note.genre === 'a-faire' ? 'fait' : null;
  return (
    <div className="cn-note" data-genre={note.genre}>
      <span className={`cn-note-picto cn-genre-${note.genre}`} aria-hidden>{PICTO_GENRE[note.genre] ?? PICTO_GENRE.note}</span>
      <span className="cn-sp cn-note-tx">
        <span>{note.texte}</span>
        <span className="cn-mut">
          <b className={`cn-genre-mot cn-genre-${genreMot ? 'fait' : note.genre}`}>{genreMot ?? GENRE_LIBELLE[note.genre]}</b>{note.modifieeLe ? ' · modifiée' : ''}{d ? ` · ${d}` : ''}{note.groupe ? ` · ${note.groupe.libelle}` : ''}
          {doublon && <span className="cn-doublon"> · <Provenance origine="ia" /> doublon ?</span>}
        </span>
      </span>
      <button type="button" className="cn-ico" aria-label={`Note : ${note.texte}, actions`} onClick={() => onNote(note.id)}><Ellipsis size={22} aria-hidden /></button>
    </div>
  );
}

/* ---------- le tableau du carnet (h05-3) ---------- */

type Ligne = TableauV['lignes'][number];

const DEVISES = new Set(['CHF', 'EUR', '€', 'Fr.', 'USD', '$']);

/**
 * Les colonnes du tableau du carnet : la 1re valeur qui classe (plus ou moins), puis le prix ; le reste vit dans Comparer.
 * L-19 (23.11 ; M1-14, M4-7) : une colonne de valeur est une MESURE lue sur un article au moins. Une colonne en monnaie à côté du prix
 * redisait « CHF » (deux en-têtes, la 1re vide), un mot (« avec groupe frigorifique ») ne classe pas et se rognait en mono : ni l'un ni
 * l'autre ici.
 */
export function colonnesCarnet(t: TableauV): ColonneVue[] {
  const toutes = colonnesVue(t);
  const prix = toutes.find(c => c.cle === '__prix');
  const mesures = toutes.filter(c => c.cle !== '__prix' && c.sens !== 'oui-non' && !(prix && c.unite && DEVISES.has(c.unite))
    && t.lignes.some(l => { const v = texteCellule(l, c); return !!v && estMesure(v); }));
  const valeur = mesures.find(c => c.sens === 'plus' || c.sens === 'moins') ?? mesures[0];
  /* L-19 (prix en francs et en euros, « Prix en euros ») : l'en-tête disait « EUR » au-dessus de 3 350 CHF. Monnaies mêlées : l'en-tête
     dit CHF, chaque prix d'une autre monnaie dit la sienne (TableauCarnet). */
  const devises = new Set(t.lignes.filter(l => l.prixCentimes !== undefined).map(l => l.devise ?? 'CHF'));
  const prixVu = prix && devises.size > 1 ? { ...prix, unite: 'CHF' } : prix;
  return [valeur, prixVu].filter((x): x is ColonneVue => !!x);
}

/** L-19 : la largeur d'une colonne, celle de sa plus longue valeur dans la police de sa cellule, entre 44 et 104 px (au-delà, elle passe à la ligne). */
function poserLargeurs(tab: HTMLElement, n: number) {
  const ctx = document.createElement('canvas').getContext('2d');
  if (!ctx) return;
  for (let i = 0; i < n; i++) {
    let w = 0;
    tab.querySelectorAll<HTMLElement>(`[data-col="${i}"] > span`).forEach(s => {
      /* le raccourci `font` est vide quand font-variant-numeric est posé (.cn-mono) : la police se recompose */
      const cs = getComputedStyle(s);
      ctx.font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
      w = Math.max(w, ctx.measureText(s.textContent ?? '').width);
    });
    tab.style.setProperty(`--cn-col${i}`, `${Math.round(Math.min(104, Math.max(44, w + 4)))}px`);
  }
}

/**
 * En-tête court : l'unité si elle suffit (« m³/h », « CHF »), sinon le premier mot du nom. Critique 7, n° 4 (L14) : une température ne
 * se lit jamais à l'unité seule (« °C 43 » sur un frigo) ; elle dit ce qu'elle mesure, en abrégé, au-dessus de l'unité (« amb. max / °C »).
 */
export function enteteCourt(c: Pick<ColonneVue, 'nom' | 'unite'>): string {
  if (c.unite === '°C') {
    const quoi = libelleCaracteristique(c.nom).replace(/^temp[ée]rature\s*/i, '').trim().split(/\s+/).filter(Boolean)
      .map(m => (m.length > 5 ? `${m.slice(0, 3)}.` : m)).join(' ');
    return quoi ? `${quoi} °C` : '°C';
  }
  if (c.unite) return c.unite;
  const mot = c.nom.split(/\s+/)[0] ?? c.nom;
  return mot.length > 9 ? `${mot.slice(0, 8)}.` : mot;
}

/** Les lignes classées sans les liens à relire, rangs recomptés (1, 2, 3… parmi les articles en lice). */
function lignesClassees(t: TableauV, aRelire: ArticleV[], sauf?: string): Ligne[] {
  const relire = new Set(aRelire.map(a => a.id));
  let n = 0;
  return t.lignes.filter(l => !relire.has(l.articleId)).map(l => (l.rang !== null && !l.ecarte ? { ...l, rang: ++n } : l)).filter(l => l.articleId !== sauf);
}

function TableauCarnet({ carnet: k, titre, tableau, aRelire, sep, sauf, onOuvrir, conclusion }: { carnet: ContenuCarnetV; titre: string; tableau: TableauV; aRelire: ArticleV[]; sep: Separation | null; sauf?: string; onOuvrir: (id: string) => void; conclusion?: React.ReactNode }) {
  const cols = colonnesCarnet(tableau);
  const meilleurs = new Map(cols.map(c => [c.cle, meilleursDe(tableau, c)]));
  const lignes = lignesClassees(tableau, aRelire, sauf);
  const art = (id: string) => k.articles.find(a => a.id === id);
  /* CRN-18 (critique carnet 21.11) : carnet réalisé ou archivé, la machine est achetée ; la ligne ne dit plus « veille » (la bascule reste dans sa fiche) */
  const fini = k.sortie?.etat === 'realise' || !!k.archive;
  const veille = (a?: ArticleV) => !fini && !!a?.veille?.active;
  /* l'ordre : les façons en lice, les articles sans façon, puis — après la conclusion (n° 20) — les façons écartées */
  const sansFacon = { facon: null as FaconV | null, lignes: lignes.filter(l => { const f = art(l.articleId)?.faconId; return !f || !k.facons.some(x => x.id === f); }) };
  const blocsDe = (fs: FaconV[]) => fs.map(f => ({ facon: f as FaconV | null, lignes: lignes.filter(l => art(l.articleId)?.faconId === f.id) }));
  const enLice = [...blocsDe(k.facons.filter(f => f.etat !== 'ecartee')), sansFacon].filter(b => b.lignes.length || (b.facon && b.facon.etat !== 'ecartee'));
  const ecartees = blocsDe(k.facons.filter(f => f.etat === 'ecartee')).filter(b => b.lignes.length);
  const blocs = [...enLice, ...ecartees];
  const gabarit = { gridTemplateColumns: `var(--cn-rangl, 32px) var(--cn-vignl, 34px) minmax(0, 1fr) ${cols.map((_, i) => `var(--cn-col${i}, var(--cn-col, 54px))`).join(' ')}` } as React.CSSProperties;
  /* L-19 : les lignes sont des grilles séparées ; la largeur de chaque colonne, mesurée, est la même pour toutes (à chaque rendu, puis
     quand les polices sont prêtes) */
  const refTab = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const el = refTab.current;
    if (!el || typeof document === 'undefined' || !document.fonts) return;
    poserLargeurs(el, cols.length);
    let vivant = true;
    void document.fonts.ready.then(() => { if (vivant) poserLargeurs(el, cols.length); });
    return () => { vivant = false; };
  });

  return (
    <div ref={refTab} className="cn-tab" role="table" aria-label="Articles, rangés dans leur façon">
      {blocs.map((b, i) => {
        const prix = etendue(b.lignes.map(l => l.prixCentimes).filter((x): x is number => typeof x === 'number'));
        const pastille = b.facon ? pastilleFacon(k, b.facon, sep) : null;
        return (
          <React.Fragment key={b.facon?.id ?? 'sans'}>
          {i === enLice.length && conclusion}
          <div className={`cn-tab-bloc${b.facon?.etat === 'ecartee' ? ' cn-tab-ecartee' : ''}${sep?.retenue.id === b.facon?.id ? ' cn-tab-retenue' : ''}`} role="rowgroup">
            {b.facon && (
              <div className="cn-tab-facon" role="row">
                <span className="cn-sp" role="rowheader">
                  <b>{b.facon.nom}</b>
                  {prix ? <span className="cn-mono cn-mut cn-tab-etendue">{prix}</span> : <span className="cn-mut">aucun article encore</span>}
                </span>
                {pastille && <span className={`cn-pastille ${pastille.passe ? 'cn-pastille-plein' : 'cn-pastille-neutre'}`}>{pastille.texte}</span>}
              </div>
            )}
            {i === 0 && (
              <div className="cn-tab-ligne cn-tab-cols" style={gabarit} role="row">
                <span className="cn-mut cn-tab-rangart" role="columnheader">rang · article</span>
                {cols.map(c => <span key={c.cle} className="cn-mut cn-tab-num" role="columnheader" title={c.nom} aria-label={c.unite ? `${c.nom}, ${c.unite}` : c.nom}>{enteteCourt(c)}</span>)}
              </div>
            )}
            {b.lignes.map(l => {
              const a = art(l.articleId);
              /* tour 3, f7 n° 7 : la façon écartée porte déjà la raison en pastille ; son article, écarté pour la même raison, dit « écarté » seul */
              const memeRaison = !!l.ecarte && b.facon?.etat === 'ecartee' && !!b.facon.raison && sansEcarte(l.ecarte.raison) === sansEcarte(b.facon.raison);
              const sous = l.ecarte ? (memeRaison ? 'écarté' : libelleEcarte(l.ecarte.raison)) : [a?.pays, a?.dispo?.replace(/\bsemaines?\b/, 'sem.')].filter(Boolean).join(' · ');
              const moinsBien = l.ecarte ? null : texteMoinsBien(tableau, l);
              return (
                <button key={l.articleId} type="button" className={`cn-tab-ligne${l.ecarte ? ' cn-ecarte' : ''}`} style={gabarit} role="row" onClick={() => onOuvrir(l.articleId)}>
                  {l.rang && !l.ecarte ? <span className={`cn-rang${l.rang === 1 ? ' cn-rang-1' : ''}`}>{l.rang}</span> : <span className="cn-rang cn-rang-vide" aria-label="écarté">–</span>}
                  <VignetteObjet photo={a?.photo} mots={[a?.nom ?? l.nom, b.facon?.nom, titre]} classe="cn-vignette-petite" taille={30} />
                  <span className="cn-tab-nom" role="cell">
                    {/* tour 3, f5c n° 9 : le nom entier ; deux articles de même nom se distinguent par leur vendeur (« · Brassage Romandie ») */}
                    <span className="cn-nom-entier">{l.nom}</span>
                    <span className="cn-mut">
                      {sous}
                      {/* h05-3 : « DE · délai 2 sem. · ⊙ veille » (n° 8 : la ligne tient sur 2 lignes au plus à 390) */}
                      {veille(a) && <span className="cn-nowrap" title="veille demandée">{sous ? ' ·' : ''}<Eye size={15} aria-hidden className="cn-inline" /> veille</span>}
                      {!l.ecarte && moinsBien && <span className="cn-att">{sous || veille(a) ? ' · ' : ''}{moinsBien}</span>}
                    </span>
                  </span>
                  {cols.map((c, ci) => {
                    const brut = texteCellule(l, c);
                    const autre = c.cle === '__prix' && brut && (l.devise ?? 'CHF') !== (c.unite ?? 'CHF') ? (l.devise === 'EUR' ? '€' : l.devise) : null;
                    const v = autre ? `${brut} ${autre}` : brut;
                    return <span key={c.cle} role="cell" data-col={ci} className={`cn-tab-num${meilleurs.get(c.cle)?.has(l.articleId) && !l.ecarte ? ' cn-meilleur' : ''}`}>{v ? <span className="cn-mono">{v}</span> : <span className="cn-inconnu" aria-label="inconnu">–</span>}</span>;
                  })}
                </button>
              );
            })}
            {/* critique 6, n° 8 (h05-3) : « ? · Lien sans aperçu · à relire · Ouvrir ↗ » dans le tableau, au pied des façons en lice,
                avant la conclusion ; jamais classé (P6) */}
            {i === enLice.length - 1 && aRelire.map(a => <LigneARelire key={a.id} article={a} />)}
          </div>
          </React.Fragment>
        );
      })}
      {enLice.length === blocs.length && conclusion}
      {enLice.length === 0 && aRelire.length > 0 && (
        <div className="cn-tab-bloc cn-tab-relire" role="rowgroup" aria-label="À relire, hors classement">
          {aRelire.map(a => <LigneARelire key={a.id} article={a} />)}
        </div>
      )}
    </div>
  );
}

/** « ? · Lien sans aperçu · ventil-express.ch · à relire · Ouvrir ↗ » : jamais classé (P6). */
function LigneARelire({ article: a }: { article: ArticleV }) {
  const ap = sansApercu(a);
  const ou = domaineEtChemin(a as never) ?? a.domaine;
  return (
    <div className="cn-tab-ligne cn-tab-relire-ligne" role="row" data-lecture={a.lecture}>
      <span className="cn-rang cn-rang-vide" aria-label="sans rang">?</span>
      <span className="cn-vignette cn-vignette-petite cn-vignette-lien" aria-hidden><Link2 size={20} /></span>
      <span className="cn-tab-nom" role="cell">
        <span>{ap?.enCours ? ap.titre : 'Lien sans aperçu'}</span>
        <span className="cn-mut">{ou ? `${ou} · ` : ''}{ap?.enCours ? 'lecture…' : 'à relire'}</span>
      </span>
      {a.url && <a className="cn-lien cn-tab-ouvrir" href={a.url} target="_blank" rel="noreferrer noopener">Ouvrir <ExternalLink size={16} aria-hidden /></a>}
    </div>
  );
}

/* ---------- la feuille des cartes (R04, h03-5) ---------- */

function FeuilleCartes({ carnet: k, titre, tableau, aRelire, onFermer, onOuvrir, onVeille, taux, onTaux }: { taux?: number; onTaux?: (t: number) => void; carnet: ContenuCarnetV; titre: string; tableau: TableauV; aRelire: ArticleV[]; onFermer: () => void; onOuvrir: (id: string) => void; onVeille?: (id: string, active: boolean) => void }) {
  useEffect(() => {
    const touche = (e: KeyboardEvent) => { if (e.key === 'Escape') onFermer(); };
    window.addEventListener('keydown', touche);
    return () => window.removeEventListener('keydown', touche);
  }, [onFermer]);
  const lignes = lignesClassees(tableau, aRelire);
  const col = colonnesCarnet(tableau).find(c => c.cle !== '__prix');
  const carac = col ? { nom: col.nom, ...(col.unite ? { unite: col.unite } : {}), sens: col.sens } : undefined;
  const art = (id: string) => k.articles.find(a => a.id === id);
  const connues = col ? lignes.filter(l => !l.ecarte).map(l => nombreValeur(art(l.articleId)?.valeurs[col.nom])).filter((x): x is number => x !== null) : [];
  const bornes = connues.length > 1 ? { min: Math.min(...connues), max: Math.max(...connues) } : null;
  const critere = col ? k.criteres.find(cr => cr.caracteristique?.nom === col.nom) : undefined;
  return (
    <div className="cn-voile" onClick={onFermer}>
      <section className="cn-feuille-cartes" role="dialog" aria-modal="true" aria-label={`Articles · ${k.articles.length}`} onClick={e => e.stopPropagation()}>
        <span className="cn-poignee" aria-hidden />
        <div className="cn-feuille-cartes-tete">
          <h3 className="cn-sp"><b>Articles · {k.articles.length}</b> {comptesCarnet(k).facons > 0 && <span className="cn-mut">{pluriel(comptesCarnet(k).facons, 'façon')}</span>}</h3>
          <button type="button" className="cn-lien cn-fermer" onClick={onFermer}><X size={18} aria-hidden /> Fermer</button>
        </div>
        {carac && <p className="cn-mut">Classés par ce qui compte : <b className="cn-encre">{critere?.texte ?? carac.nom}</b></p>}
        <div className="cn-classees">
          {lignes.map(l => {
            const a = art(l.articleId);
            if (!a) return null;
            return <CarteClassee key={a.id} article={a} rang={l.ecarte ? null : l.rang} carac={carac} bornes={bornes} faconNom={k.facons.find(f => f.id === a.faconId)?.nom} carnetTitre={titre}
              {...(l.ecarte ? { ecarte: l.ecarte } : {})} onOuvrir={() => onOuvrir(a.id)} onVeille={v => onVeille?.(a.id, v)} taux={taux} onTaux={onTaux} />;
          })}
          {aRelire.map(a => <div key={a.id} className="cn-classee cn-classee-relire"><LigneARelire article={a} /></div>)}
        </div>
        {k.articles.some(estExemple) && <p className="cn-mut">Vendeurs, prix et valeurs : <Provenance origine="exemple" /></p>}
      </section>
    </div>
  );
}
