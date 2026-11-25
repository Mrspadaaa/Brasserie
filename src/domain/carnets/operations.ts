/**
 * Carnet d'idées : les intentions (patron Commande, comme `ui/calendrier/ecritures.ts`).
 *
 * Chaque intention lit l'état (les documents `creativeItems` du carnet) et rend `{ ecritures, inverse, avis }` : les écritures document par
 * document (jamais `saveCreativeItems`), et leur inverse (copie du document d'avant, ou retrait du document créé) pour Annuler (Q18).
 * Appliquer puis appliquer l'inverse redonne l'état identique (A2). Un refus rend `{ ok: false, raison }` et n'écrit rien.
 * Aucune écriture hors de `creativeItems` : le type `EcritureCarnet` n'en connaît pas d'autre (D-47, L33 : jamais de cascade).
 * `veille.releveLe` n'est écrit par aucune intention (R31 : relève sous accord).
 */
import { estDomaine, type DomaineCarnet } from './domaines';
import type { PageLue as PageLueV } from '../../../functions/src/carnetIA';
import type { CreativeItem } from '../../types';
import type { FinanceTransaction, FinancialPayment, FinancialPlan } from '../finance/types';
import { dateFacture, estRealise } from '../finance/upgradeRing';
import { upgradeBudget, upgradeDetails } from '../finance/upgrades';
import { avecArticleTypo, statutApres } from './comparer';
import { memeTexte } from './doublons';
import { lienCanonique } from './lien';
import { quantiteArticle } from './prixUnitaire';
import { prixCentimesDuChoix } from './prixChoisi';
import { douteDePage } from './manques';
import { critereMesurable, jetons, normaliser, quantitesDe } from './analyseLocale';
import {
  lireCarnet, lireMessage, nouvelIdCarnet, sansIndefinis, donneesVides, titreDePhrase, ajouterEvenement, PHOTOS_CARNET_MAX, VERSION_CARNET,
  type Article, type CarnetDoc, type Caracteristique, type CibleEffet, type Choix, type Critere, type EffetMessage, type EtatFacon, type Facon,
  type Etiquette, type GenreNote, type MessageDoc, type Note, type Origine, type PropositionCritere, type PropositionSuivi, type Rangement, type Rattache, type Valeur
} from './modele';

export type EcritureCarnet = { op: 'put'; doc: CreativeItem } | { op: 'remove'; id: string };

export interface Journal { action: 'Suppression' | 'Archivage'; entityId: string; resume: string }

export type Resultat =
  | { ok: true; ecritures: EcritureCarnet[]; inverse: EcritureCarnet[]; avis: string; avant?: string; journal?: Journal }
  | { ok: false; raison: string };

export type Etat = readonly CreativeItem[];

/* D451 : `copie`, `refus`, `Brouillon` et `poser` sont partagés avec `suivi.ts` (les intentions du suivi, même patron). */
export const copie = <T>(v: T): T => JSON.parse(JSON.stringify(v)) as T;
export const refus = (raison: string): Resultat => ({ ok: false, raison });

/** Un brouillon de changements : documents lus, modifiés, créés, retirés ; produit écritures et inverse. */
export class Brouillon {
  private readonly origine = new Map<string, CreativeItem | undefined>();
  private readonly courant = new Map<string, CreativeItem | null>();
  constructor(private readonly etat: Etat) {}
  private premier(id: string): CreativeItem | undefined { return this.etat.find(d => d.id === id); }
  lire(id: string): CreativeItem | undefined {
    if (this.courant.has(id)) return this.courant.get(id) ?? undefined;
    return this.premier(id);
  }
  private noter(id: string) { if (!this.origine.has(id)) this.origine.set(id, this.premier(id) ? copie(this.premier(id)) : undefined); }
  ecrire(doc: CreativeItem) { this.noter(doc.id); this.courant.set(doc.id, copie(doc)); }
  retirer(id: string) { this.noter(id); this.courant.set(id, null); }
  carnet(id: string): CarnetDoc | null { const c = lireCarnet(this.lire(id)); return c ? copie(c) : null; }
  messages(): MessageDoc[] {
    const ids = new Set([...this.etat.map(d => d.id), ...this.courant.keys()]);
    return [...ids].map(id => lireMessage(this.lire(id))).filter((m): m is MessageDoc => !!m).map(copie);
  }
  resultat(avis: string, extra: { avant?: string; journal?: Journal } = {}): Resultat {
    const ecritures: EcritureCarnet[] = [], inverse: EcritureCarnet[] = [];
    for (const [id, apres] of this.courant) {
      const avant = this.origine.get(id);
      if (apres === null) {
        if (!avant) continue;
        ecritures.push({ op: 'remove', id });
        inverse.unshift({ op: 'put', doc: avant });
      } else {
        if (avant && JSON.stringify(avant) === JSON.stringify(apres)) continue;
        ecritures.push({ op: 'put', doc: apres });
        inverse.unshift(avant ? { op: 'put', doc: avant } : { op: 'remove', id });
      }
    }
    return { ok: true, ecritures, inverse, avis, ...extra };
  }
}

/** Met le statut d'après le contenu (Choisi reste Choisi) et écrit. */
export function poser(b: Brouillon, c: CarnetDoc) {
  c.status = statutApres(c.status, c);
  b.ecrire(c);
}

/** Change, dans tous les messages, la cible d'un effet (déplacé, changé de sorte). */
function suivreEffet(b: Brouillon, de: { carnetId: string; cible: CibleEffet; id: string }, vers: Partial<EffetMessage>) {
  for (const m of b.messages()) {
    let change = false;
    const effets = m.carnetMessage.effets.map(e => {
      if (e.carnetId === de.carnetId && e.cible === de.cible && e.id === de.id) { change = true; return { ...e, ...vers }; }
      return e;
    });
    if (change) b.ecrire({ ...m, carnetMessage: { ...m.carnetMessage, effets } });
  }
}

/* ---------- ranger des lignes (créer, ajouter) ---------- */

/** Où va une ligne : un carnet connu, ou un carnet neuf (créé une fois par id). */
/** `carnetNeuf.phrase` (critique 6, n° 1) : la phrase du carnet neuf, quand ce n'est pas le message entier (ses lignes d'une note en vrac). */
export type Destination = { carnetId: string; carnetNeuf?: undefined } | { carnetNeuf: { id: string; titre: string; phrase?: string; domaine?: DomaineCarnet }; carnetId?: undefined };

export type LigneARanger = Destination & (
  /** `propose` (P10, P23) : un critère que l'IA propose ; `ranger` ne l'écrit pas, il reste sur le message (`propositions`). */
  | { sorte: 'critere'; id?: string; texte: string; raison?: string; caracteristique?: Caracteristique; origine: Origine; propose?: true; source?: 'phrase' | 'ia' }
  | { sorte: 'facon'; id?: string; nom: string; etat?: EtatFacon; raison?: string; origine: Origine }
  | {
    sorte: 'article'; id?: string; url?: string; domaine?: string; nom?: string; prixCentimes?: number; prixDes?: true; doute?: string; conditionnement?: Article['conditionnement']; prixUnite?: Article['prixUnite']; offres?: Article['offres']; devise?: string; vendeur?: string; pays?: string;
    dispo?: string; photo?: string; photos?: string[]; taxe?: Article['taxe']; prixTTCCentimes?: number; livraison?: Article['livraison']; change?: Article['change'];
    faconId?: string; valeurs?: Record<string, Valeur>; lecture?: Article['lecture']; origine?: Origine
  }
  | { sorte: 'note'; id?: string; texte: string; genre?: GenreNote }
  | { sorte: 'photo'; id?: string; jpeg: string }
  | { sorte: 'idee' }
);

/**
 * `etiquettes`, `rattache`, `propositionsSuivi` (D451) : ce que l'IA ou le repli local pose sur le message ; rien n'est appliqué à un carnet
 * par eux (les propositions restent à son geste). `rattache.citation` doit être une sous-chaîne exacte du texte, sinon le rangement est refusé.
 */
export interface MessageARanger {
  id: string; texte: string; le: string; depuis: 'liste' | string; rangement: Rangement; titrePropose?: { carnetId: string; titre: string };
  etiquettes?: readonly Etiquette[]; rattache?: Rattache; propositionsSuivi?: readonly PropositionSuivi[];
}

/** Ajoute une ligne dans son carnet (déjà lu dans le brouillon) ; rend l'effet. L'article naît sans veille (R31). */
function ajouterLigne(c: CarnetDoc, l: LigneARanger, messageId: string): EffetMessage | null {
  const d = c.carnet;
  switch (l.sorte) {
    case 'idee': return null;
    case 'critere': {
      /* Critique 5, n° 24 : le titre de l'idée n'est jamais un critère, ni la phrase entière quand elle porte plus que son titre (« Moulin à
         malt : 2 cylindres, 150 kg/h ») ; aucun effet, le message garde la phrase (R25). */
      if (estTitreOuPhrase(c, l.texte)) return null;
      /* P11 : un critère au même texte normalisé n'ajoute pas de ligne. Le critère déjà là reste la source (son id, son `messageId`) ;
         il reçoit seulement ce qui lui manque (raison, caractéristique). Son effet est un renvoi (`fusion`) : annuler ce message ne
         retire pas l'ancien. */
      const deja = d.criteres.find(x => memeTexte(x.texte, l.texte));
      if (deja) {
        if (!deja.raison && l.raison) deja.raison = l.raison;
        if (!deja.caracteristique && l.caracteristique) deja.caracteristique = copie(l.caracteristique);
        /* reprise chir8 (c) : la ligne est rangée, là où elle était déjà ; l'effet la montre (« 3 lignes rangées », pas 2) sans la
           posséder : `fusion` garde son texte, son origine et son message, que `remplacerRangement` lui rend tels quels. */
        return { carnetId: c.id, cible: 'critere', id: deja.id, fusion: sansIndefinis({ texte: deja.texte, origine: deja.origine, messageId: deja.messageId }) };
      }
      /* P7 : un critère qui précise une caractéristique déjà là (même nom et unité, ou même unité lue dans la phrase) se fond dans le critère
         existant, s'il n'est pas de ses mots à lui (`origine: 'vous'` reste intact). L'effet garde le critère d'avant. */
      const cible = critereAPreciser(d.criteres, l) ?? critereARemplacer(d.criteres, l);
      if (cible) {
        /* critique 6, n° 3 (D-53, D-113, D-122) : sa valeur, sur le même axe que le critère proposé par l'IA, le remplace et passe en tête */
        if (critereARemplacer([cible], l)) {
          d.criteres.splice(d.criteres.indexOf(cible), 1);
          d.criteres.unshift(cible);
          if (l.caracteristique) cible.caracteristique = axeLu(d.articles, cible.caracteristique, l.caracteristique);
        }
        const fusion = sansIndefinis({ texte: cible.texte, origine: cible.origine, messageId: cible.messageId });
        cible.texte = l.texte; cible.origine = l.origine; cible.messageId = messageId;
        if (l.source) cible.source = l.source; else delete cible.source;
        if (!cible.raison && l.raison) cible.raison = l.raison;
        return { carnetId: c.id, cible: 'critere', id: cible.id, fusion };
      }
      const k: Critere = sansIndefinis({ id: l.id ?? nouvelIdCarnet('CRIT'), texte: l.texte, raison: l.raison, caracteristique: l.caracteristique, origine: l.origine, messageId, source: l.source });
      d.criteres.push(k); return { carnetId: c.id, cible: 'critere', id: k.id };
    }
    case 'facon': {
      const f: Facon = sansIndefinis({ id: l.id ?? nouvelIdCarnet('FACON'), nom: l.nom, etat: l.etat ?? 'ouverte', raison: l.raison, origine: l.origine, messageId });
      d.facons.push(f); return { carnetId: c.id, cible: 'facon', id: f.id };
    }
    case 'article': {
      /* T25-5 : le même lien (adresse canonique) déjà dans ce carnet n'ajoute rien ; l'effet renvoie à l'article qui y est, que défaire ce
         message ne retire pas (`existant`). Un article sans lien, ou dans un autre carnet, reste libre. */
      const canon = l.url ? lienCanonique(l.url) : null;
      const deja = canon ? d.articles.find(x => x.url && lienCanonique(x.url) === canon) : undefined;
      if (deja) return { carnetId: c.id, cible: 'article', id: deja.id, existant: true };
      const a: Article = sansIndefinis({
        id: l.id ?? nouvelIdCarnet('ART'), url: l.url, domaine: l.domaine, nom: l.nom,
        prixCentimes: typeof l.prixCentimes === 'number' && Number.isFinite(l.prixCentimes) && l.prixCentimes >= 0 ? Math.round(l.prixCentimes) : undefined,
        prixDes: l.prixDes === true && typeof l.prixCentimes === 'number' ? true : undefined, doute: l.doute,
        ...(typeof l.prixCentimes === 'number' ? { conditionnement: l.conditionnement ? { ...l.conditionnement } : undefined, prixUnite: l.prixUnite ? copie(l.prixUnite) : undefined, offres: l.offres?.length ? copie(l.offres) : undefined } : {}),
        devise: l.devise, vendeur: l.vendeur, pays: l.pays, dispo: l.dispo, photo: l.photo, photos: l.photos?.length ? [...l.photos] : undefined,
        taxe: l.taxe, prixTTCCentimes: l.prixTTCCentimes, livraison: l.livraison ? { ...l.livraison } : undefined, change: l.change ? { ...l.change } : undefined,
        faconId: l.faconId && d.facons.some(f => f.id === l.faconId) ? l.faconId : undefined,
        valeurs: l.valeurs ? copie(l.valeurs) : {}, lecture: l.lecture ?? (l.url ? 'a-lire' : 'lue'), messageId
      });
      d.articles.push(a); return { carnetId: c.id, cible: 'article', id: a.id };
    }
    case 'note': {
      const n: Note = { id: l.id ?? nouvelIdCarnet('NOTE'), texte: l.texte, genre: l.genre ?? 'note', messageId };
      d.notes.push(n); return { carnetId: c.id, cible: 'note', id: n.id };
    }
    case 'photo': {
      const p = { id: l.id ?? nouvelIdCarnet('PHOTO'), jpeg: l.jpeg, messageId };
      d.photos.push(p); return { carnetId: c.id, cible: 'photo', id: p.id };
    }
  }
}

/**
 * Critique 8, n° 2 : un seuil tapé sur le même axe (même unité) qu'un critère déjà là garde le nom sous lequel les articles portent leurs
 * valeurs. « hotte murale à 1 200 m³/h au moins » sur un carnet dont les articles disent « débit » (m³/h) reste sur « débit » : les
 * valeurs lues ne s'effacent pas et le rang se calcule sur elles. Le sens (plus, moins) vient du seuil tapé. Aucun article ne porte l'un
 * ou l'autre nom : la caractéristique tapée.
 */
function axeLu(articles: readonly Article[], avant: Caracteristique | undefined, tapee: Caracteristique): Caracteristique {
  const porte = (nom: string) => articles.some(a => Object.keys(a.valeurs).some(k => nomNormal(k) === nomNormal(nom)));
  if (!avant || nomNormal(avant.nom) === nomNormal(tapee.nom) || porte(tapee.nom) || !porte(avant.nom)) return copie(tapee);
  if (avant.unite && tapee.unite && avant.unite !== tapee.unite) return copie(tapee);
  return sansIndefinis({ nom: avant.nom, unite: avant.unite ?? tapee.unite, sens: tapee.sens });
}

/** Les unités écrites dans un texte (« 1 200 m³/h » → m³/h), liste fermée de `analyseLocale`. */
const unitesDe = (texte: string): Set<string> => new Set(quantitesDe(texte).map(q => q.unite));
const nomNormal = (t: string) => normaliser(t);

const sansPrefixeTest = (t: string) => t.replace(/^\s*ZZ TEST\s*[—–-]\s*/i, '');
/** Critique 5, n° 24 : le texte est le titre de l'idée, ou sa phrase entière quand la phrase dit plus que le titre. */
function estTitreOuPhrase(c: CarnetDoc, texte: string): boolean {
  const t = sansPrefixeTest(texte);
  /* C55-2 (R24) : un critère qui nomme une grandeur mesurable (« Marmite de brassage 50 L » : le volume) n'est pas écarté parce que le titre,
     tiré de la même phrase, le répète : l'aperçu l'a promis (« Ce qui compte · … »), et c'est le seul endroit où la mesure classe. */
  if (memeTexte(t, sansPrefixeTest(c.title))) return !critereMesurable(t);
  const phrase = sansPrefixeTest(c.carnet.phrase);
  return memeTexte(t, phrase) && !memeTexte(sansPrefixeTest(titreDePhrase(c.carnet.phrase)), phrase);
}

/**
 * Un critère vague : ses mots ne disent que le nom de sa caractéristique (« le débit » pour débit). Lui seul se laisse préciser (P7) ;
 * « assez profond pour un fût » dit un usage et reste (critique 5, n° 4).
 */
const estVague = (k: Critere): boolean => {
  const nom = new Set(jetons(k.caracteristique?.nom ?? ''));
  return jetons(k.texte).every(m => nom.has(m));
};

/** P7 : le critère qu'une ligne précise (même caractéristique), hors des critères qu'il a écrits lui-même ; sinon `undefined`. */
function critereAPreciser(criteres: readonly Critere[], l: Extract<LigneARanger, { sorte: 'critere' }>): Critere | undefined {
  const libres = criteres.filter(k => k.caracteristique?.unite && k.origine !== 'vous' && estVague(k));
  if (l.caracteristique?.unite) {
    const nom = nomNormal(l.caracteristique.nom);
    return libres.find(k => k.caracteristique!.unite === l.caracteristique!.unite && nomNormal(k.caracteristique!.nom) === nom);
  }
  if (l.caracteristique) return undefined;
  const unites = unitesDe(l.texte);
  return unites.size === 1 ? libres.find(k => unites.has(k.caracteristique!.unite!)) : undefined;
}

/** Un critère qui vient de sa phrase : écrit par lui, lu sur place dans ses mots, ou tiré de ses mots par l'IA (`source: 'phrase'`). */
const deSaPhrase = (l: { origine: Origine; source?: 'phrase' | 'ia' }): boolean => l.origine === 'vous' || l.origine === 'locale' || l.source === 'phrase';
/** L'axe d'un critère : sa caractéristique (nom normalisé) et son unité, lue sur la caractéristique ou dans le texte. */
const axeDe = (k: { texte: string; caracteristique?: Caracteristique }): { nom?: string; unites: Set<string> } => ({
  ...(k.caracteristique?.nom ? { nom: nomNormal(k.caracteristique.nom) } : {}),
  unites: k.caracteristique?.unite ? new Set([k.caracteristique.unite]) : unitesDe(k.texte)
});

/**
 * Critique 6, n° 3 (D-53, D-113, D-122) : le critère proposé par l'IA (`origine` ia ou exemple, `source` ia) que la valeur qu'il tape remplace,
 * sur le même axe : même caractéristique, ou même unité (« fond de bac, 38 cm au moins » remplace « assez profond pour un fût », fond de bac
 * en cm). Un critère de ses mots n'est jamais remplacé ; une ligne de l'IA seule ne remplace rien.
 */
function critereARemplacer(criteres: readonly Critere[], l: Extract<LigneARanger, { sorte: 'critere' }>): Critere | undefined {
  if (!deSaPhrase(l)) return undefined;
  const a = axeDe(l);
  if (!a.nom && !a.unites.size) return undefined;
  return criteres.find(k => {
    if (k.origine === 'vous' || k.origine === 'locale' || k.source === 'phrase') return false;
    const b = axeDe(k);
    return (!!a.nom && a.nom === b.nom) || [...a.unites].some(u => b.unites.has(u));
  });
}

function rangerDans(b: Brouillon, message: MessageARanger, lignes: readonly LigneARanger[]): { effets: EffetMessage[]; carnets: Set<string>; crees: number; propositions: PropositionCritere[] } | string {
  const effets: EffetMessage[] = [];
  const carnets = new Set<string>();
  const propositions: PropositionCritere[] = [];
  let crees = 0;
  for (const l of lignes) {
    /* P10, P23 : un critère proposé n'est pas écrit ; il reste sur le message, à accepter d'un toucher. */
    if (l.sorte === 'critere' && l.propose) {
      /* critique 6, n° 9 (D-35) : aussi pour le carnet neuf que ce message ouvre (les caractéristiques de sa catégorie) */
      const cid = l.carnetId ?? l.carnetNeuf?.id;
      if (cid) propositions.push(sansIndefinis({ carnetId: cid, texte: l.texte, caracteristique: l.caracteristique ? copie(l.caracteristique) : undefined, origine: l.origine }));
      continue;
    }
    let c: CarnetDoc | null;
    if (l.carnetNeuf) {
      c = b.carnet(l.carnetNeuf.id);
      if (!c) {
        /* P1 (vision 3) : le titre garde la phrase, sans ses liens ni ses prix (ils vont à l'article) ; `carnet.phrase` reste entière. */
        const titre = titreDePhrase(l.carnetNeuf.titre) || titreDePhrase(message.texte);
        if (!titre) return 'Un carnet neuf demande un titre.';
        /* critique 6, n° 1 : un carnet né d'une note en vrac garde ses lignes à lui pour phrase, jamais la note entière (« Sol local » ne cite
           pas « 2 sachets de levure ») */
        const phrase = (l.carnetNeuf as { phrase?: string }).phrase;
        c = { id: l.carnetNeuf.id, type: 'carnet', title: titre, status: 'idea', carnet: donneesVides(phrase?.trim() || message.texte, message.le) };
        effets.push({ carnetId: c.id, cible: 'carnet', id: c.id });
        crees += 1;
      }
      /* D437 : l'IA pose le domaine du carnet neuf (créé ici, ou par l'annonce pendant l'attente), comme son titre ; jamais sur le sien */
      const dom = l.carnetNeuf.domaine;
      if (estDomaine(dom) && !c.carnet.domaine) c.carnet.domaine = { valeur: dom, origine: 'ia' };
    } else {
      c = b.carnet(l.carnetId);
      if (!c) return 'Ce carnet n’existe plus.';
    }
    /* D451 (PLAN § Risques 2) : un document Firestore tient 1 Mio ; les photos y sont en ligne (≤ 150 ko) : la 13e est refusée, et l'écran le dit */
    if (l.sorte === 'photo' && c.carnet.photos.length >= PHOTOS_CARNET_MAX) return `Ce carnet garde ${PHOTOS_CARNET_MAX} photos au plus.`;
    const e = ajouterLigne(c, l, message.id);
    if (e) effets.push(e);
    carnets.add(c.id);
    poser(b, c);
  }
  return { effets, carnets, crees, propositions };
}

function avisRangement(lignes: number, carnets: number, crees: number): string {
  if (crees > 0 && lignes <= 1) return '✓ Carnet créé';
  if (carnets <= 1) return lignes > 1 ? `✓ ${lignes} lignes rangées ici` : '✓ Rangé ici';
  return `✓ ${lignes} lignes rangées dans ${carnets} carnets`;
}

/**
 * Créer et ajouter : le message est gardé tel quel (R25) et chaque ligne rangée dans son carnet, connu ou neuf. Une écriture annulable.
 */
export function ranger(etat: Etat, args: { message: MessageARanger; lignes: readonly LigneARanger[] }): Resultat {
  if (!args.message.texte.trim()) return refus('Le message est vide.');
  if (lireMessage(etat.find(d => d.id === args.message.id))) return refus('Ce message est déjà rangé.');
  if (args.message.rattache && !args.message.texte.includes(args.message.rattache.citation)) return refus('La citation n’est pas dans le message.');
  const b = new Brouillon(etat);
  const r = rangerDans(b, args.message, args.lignes);
  if (typeof r === 'string') return refus(r);
  const m = args.message;
  const doc: MessageDoc = {
    id: m.id, type: 'carnet-message', title: m.texte, status: 'done',
    carnetMessage: sansIndefinis({
      texte: m.texte, le: m.le, depuis: m.depuis, rangement: m.rangement, effets: r.effets, titrePropose: m.titrePropose ? { ...m.titrePropose } : undefined,
      propositions: r.propositions.length ? r.propositions : undefined,
      propositionsSuivi: m.propositionsSuivi?.length ? copie([...m.propositionsSuivi]) : undefined, etiquettes: m.etiquettes?.length ? copie([...m.etiquettes]) : undefined,
      rattache: m.rattache ? { ...m.rattache } : undefined
    })
  };
  b.ecrire(doc);
  const nbLignes = args.lignes.filter(l => l.sorte !== 'idee' && !(l.sorte === 'critere' && l.propose)).length;
  return b.resultat(avisRangement(Math.max(nbLignes, 1), r.carnets.size, r.crees));
}

/** Créer une idée d'une phrase (R09 à R11) : une ligne `idee` dans un carnet neuf, et le message. */
export function creerCarnet(etat: Etat, args: { id: string; titre?: string; message: MessageARanger; lignes?: readonly LigneARanger[] }): Resultat {
  const neuf = { id: args.id, titre: args.titre ?? titreDePhrase(args.message.texte) };
  const suite = (args.lignes ?? []).map(l => ({ ...l, carnetNeuf: neuf, carnetId: undefined }) as LigneARanger);
  return ranger(etat, { message: args.message, lignes: [{ sorte: 'idee', carnetNeuf: neuf }, ...suite] });
}

/** Retire d'un carnet l'élément visé par un effet ; rend vrai s'il existait. */
function retirerElement(c: CarnetDoc, cible: CibleEffet, id: string): boolean {
  const d = c.carnet;
  const listes: Partial<Record<CibleEffet, { id: string }[]>> = { critere: d.criteres, facon: d.facons, article: d.articles, note: d.notes, photo: d.photos };
  const l = listes[cible];
  if (!l) return false;
  const i = l.findIndex(x => x.id === id);
  if (i < 0) return false;
  l.splice(i, 1);
  return true;
}

/**
 * Étape 6 du déroulé : les effets locaux d'un message sont remplacés par ceux de l'IA, en une seule écriture annulable. Un carnet que ce
 * message avait créé et qui ne garde rien d'autre est retiré ; s'il garde autre chose, il reste.
 */
export function remplacerRangement(etat: Etat, args: { messageId: string; lignes: readonly LigneARanger[]; rangement: Rangement; titrePropose?: { carnetId: string; titre: string } }): Resultat {
  const m = lireMessage(etat.find(d => d.id === args.messageId));
  if (!m) return refus('Message introuvable.');
  const b = new Brouillon(etat);
  const crees = m.carnetMessage.effets.filter(e => e.cible === 'carnet').map(e => e.carnetId);
  for (const e of m.carnetMessage.effets) {
    if (e.cible === 'carnet') continue;
    const c = b.carnet(e.carnetId);
    if (!c || e.existant) continue;
    /* P7 : un critère précisé par ce message retrouve son texte d'avant ; il n'est pas retiré (il existait avant le message). */
    if (e.fusion) {
      const k = c.carnet.criteres.find(x => x.id === e.id);
      if (k) { Object.assign(k, { texte: e.fusion.texte, origine: e.fusion.origine }); if (e.fusion.messageId) k.messageId = e.fusion.messageId; else delete k.messageId; poser(b, c); }
      continue;
    }
    if (retirerElement(c, e.cible, e.id)) poser(b, c);
  }
  for (const id of crees) {
    const c = b.carnet(id);
    const d = c?.carnet;
    if (d && !d.criteres.length && !d.facons.length && !d.articles.length && !d.notes.length && !d.photos.length && !d.choix && !d.sortie) b.retirer(id);
  }
  const r = rangerDans(b, { id: m.id, texte: m.carnetMessage.texte, le: m.carnetMessage.le, depuis: m.carnetMessage.depuis, rangement: args.rangement }, args.lignes);
  if (typeof r === 'string') return refus(r);
  b.ecrire({ ...m, carnetMessage: sansIndefinis({
    ...m.carnetMessage, rangement: args.rangement, effets: r.effets, titrePropose: args.titrePropose ? { ...args.titrePropose } : m.carnetMessage.titrePropose,
    propositions: r.propositions.length ? r.propositions : undefined
  }) });
  const nb = args.lignes.filter(l => l.sorte !== 'idee' && !(l.sorte === 'critere' && l.propose)).length;
  return b.resultat(avisRangement(Math.max(nb, 1), r.carnets.size, r.crees));
}

/**
 * P10, P23 (D-35) : accepter d'un toucher le critère que l'IA a proposé sur un message. Il est rangé comme une ligne ordinaire (sans
 * `propose`), son effet s'ajoute au message et la proposition le quitte. Une écriture annulable.
 */
export function accepterProposition(etat: Etat, args: { messageId: string; index: number }): Resultat {
  const m = lireMessage(etat.find(d => d.id === args.messageId));
  const p = m?.carnetMessage.propositions?.[args.index];
  if (!m || !p) return refus('Proposition introuvable.');
  const b = new Brouillon(etat);
  const c = b.carnet(p.carnetId);
  if (!c) return refus('Ce carnet n’existe plus.');
  /* tour 3, f4a (v2-neuf 2) : « Comparer sur … » est le verbe de la puce, pas le critère : le critère est la caractéristique (« le débit »,
     comme « tient 80 °C, puis le débit ») */
  const nom = p.caracteristique?.nom;
  const texte = nom && /^\s*comparer sur\b/i.test(p.texte) ? avecArticleTypo(nom) : p.texte; /* f11 (v7-1) : « la température mini » */
  const e = ajouterLigne(c, sansIndefinis({ carnetId: p.carnetId, sorte: 'critere' as const, texte, caracteristique: p.caracteristique ? copie(p.caracteristique) : undefined, origine: p.origine }), m.id);
  poser(b, c);
  const reste = (m.carnetMessage.propositions ?? []).filter((_, i) => i !== args.index);
  b.ecrire({ ...m, carnetMessage: sansIndefinis({ ...m.carnetMessage, effets: e ? [...m.carnetMessage.effets, e] : m.carnetMessage.effets, propositions: reste.length ? reste : undefined }) });
  return b.resultat('✓ Ajouté à Ce qui compte');
}

/* ---------- déplacer, changer de genre ou de sorte ---------- */

export type CibleLigne = 'critere' | 'facon' | 'article' | 'note' | 'photo';

/** Déplacer un élément d'un carnet vers un autre (G12 « Déplacer », G21). Un article perd sa façon (elle reste dans l'autre carnet). */
export function deplacer(etat: Etat, args: { cible: CibleLigne; id: string; depuis: string; vers: string }): Resultat {
  if (args.depuis === args.vers) return refus('Déjà dans ce carnet.');
  const b = new Brouillon(etat);
  const de = b.carnet(args.depuis), vers = b.carnet(args.vers);
  if (!de || !vers) return refus('Ce carnet n’existe plus.');
  const listes = (c: CarnetDoc) => ({ critere: c.carnet.criteres, facon: c.carnet.facons, article: c.carnet.articles, note: c.carnet.notes, photo: c.carnet.photos }) as Record<CibleLigne, { id: string }[]>;
  const source = listes(de)[args.cible];
  const i = source.findIndex(x => x.id === args.id);
  if (i < 0) return refus('Élément introuvable.');
  const [el] = source.splice(i, 1);
  if (args.cible === 'article') delete (el as Article).faconId;
  listes(vers)[args.cible].push(el);
  if (args.cible === 'facon') for (const a of de.carnet.articles) if (a.faconId === args.id) delete a.faconId;
  poser(b, de); poser(b, vers);
  suivreEffet(b, { carnetId: args.depuis, cible: args.cible, id: args.id }, { carnetId: args.vers });
  return b.resultat(`Déplacé dans ${vers.title}`);
}

/** G35 : déplacer des articles (ceux en veille) vers un carnet proche ; la veille et sa date `depuis` sont gardées. */
export function deplacerArticles(etat: Etat, args: { depuis: string; vers: string; articleIds: readonly string[] }): Resultat {
  let e: Etat = etat;
  const toutes: EcritureCarnet[] = [];
  const b = new Brouillon(etat);
  const de = b.carnet(args.depuis), vers = b.carnet(args.vers);
  if (!de || !vers || args.depuis === args.vers) return refus('Ce carnet n’existe plus.');
  if (!args.articleIds.length) return refus('Aucun article à déplacer.');
  for (const id of args.articleIds) if (!de.carnet.articles.some(a => a.id === id)) return refus('Article introuvable.');
  for (const id of args.articleIds) {
    const r = deplacer(e, { cible: 'article', id, depuis: args.depuis, vers: args.vers });
    if (!r.ok) return r;
    toutes.push(...r.ecritures);
    e = appliquerEcritures(e, r.ecritures);
  }
  /* une seule écriture par document : l'état final de chacun ; l'inverse remet l'état d'avant */
  const final = new Brouillon(etat);
  for (const w of toutes) { if (w.op === 'put') final.ecrire(e.find(d => d.id === w.doc.id)!); else final.retirer(w.id); }
  const n = args.articleIds.length;
  return final.resultat(`${n} article${n > 1 ? 's' : ''} déplacé${n > 1 ? 's' : ''} dans ${vers.title}`);
}

/** Changer le genre d'une note (à acheter, à faire, question, conseil, note). */
export function changerGenre(etat: Etat, args: { carnetId: string; noteId: string; genre: GenreNote }): Resultat {
  const b = new Brouillon(etat);
  const c = b.carnet(args.carnetId);
  const n = c?.carnet.notes.find(x => x.id === args.noteId);
  if (!c || !n) return refus('Note introuvable.');
  n.genre = args.genre;
  poser(b, c);
  return b.resultat('✓ Genre changé');
}

/** Le texte d'une ligne, quelle que soit sa sorte. */
const texteDe = (x: Critere | Facon | Note): string => ('nom' in x ? x.nom : x.texte);

/**
 * Changer de sorte (G12 « Changer en note », G24 « Changer en façon ou critère », G25) : l'élément garde son id, son texte et son
 * `messageId` ; les effets des messages suivent.
 */
export function changerSorte(etat: Etat, args: { carnetId: string; cible: 'critere' | 'facon' | 'note'; id: string; vers: 'critere' | 'facon' | 'note'; caracteristique?: Caracteristique }): Resultat {
  if (args.cible === args.vers) return refus('Rien à changer.');
  const b = new Brouillon(etat);
  const c = b.carnet(args.carnetId);
  if (!c) return refus('Ce carnet n’existe plus.');
  const d = c.carnet;
  const liste = (s: 'critere' | 'facon' | 'note'): (Critere | Facon | Note)[] => (s === 'critere' ? d.criteres : s === 'facon' ? d.facons : d.notes);
  const source = liste(args.cible);
  const i = source.findIndex(x => x.id === args.id);
  if (i < 0) return refus('Élément introuvable.');
  const [el] = source.splice(i, 1);
  const texte = texteDe(el);
  const messageId = el.messageId;
  const origine: Origine = 'origine' in el ? el.origine : 'vous';
  if (args.vers === 'critere') d.criteres.push(sansIndefinis({ id: el.id, texte, caracteristique: args.caracteristique, origine, messageId }));
  else if (args.vers === 'facon') d.facons.push(sansIndefinis({ id: el.id, nom: texte, etat: 'ouverte' as const, origine, messageId }));
  else d.notes.push(sansIndefinis({ id: el.id, texte, genre: 'note' as const, messageId }));
  if (args.cible === 'facon') for (const a of d.articles) if (a.faconId === args.id) delete a.faconId;
  poser(b, c);
  suivreEffet(b, { carnetId: c.id, cible: args.cible, id: el.id }, { cible: args.vers });
  return b.resultat(args.vers === 'critere' ? '✓ Passé en Ce qui compte' : args.vers === 'facon' ? '✓ Changé en façon' : '✓ Changé en note');
}

/** G25 : la note devient un critère au même texte et au même `messageId` (la note part). */
export const noteEnCritere = (etat: Etat, args: { carnetId: string; noteId: string; caracteristique?: Caracteristique }): Resultat =>
  changerSorte(etat, { carnetId: args.carnetId, cible: 'note', id: args.noteId, vers: 'critere', caracteristique: args.caracteristique });

/* ---------- modifier, supprimer une ligne ---------- */

/** Modifier le texte d'une note, d'un critère ou d'une façon (R20). Une note garde `modifieeLe`. */
export function modifierLigne(etat: Etat, args: { carnetId: string; cible: 'critere' | 'facon' | 'note'; id: string; texte: string; le: string }): Resultat {
  const texte = args.texte.trim();
  if (!texte) return refus('Le texte est vide : pour l’enlever, Supprimer.');
  const b = new Brouillon(etat);
  const c = b.carnet(args.carnetId);
  if (!c) return refus('Ce carnet n’existe plus.');
  const d = c.carnet;
  if (args.cible === 'note') { const n = d.notes.find(x => x.id === args.id); if (!n) return refus('Note introuvable.'); n.texte = texte; n.modifieeLe = args.le; }
  else if (args.cible === 'critere') { const k = d.criteres.find(x => x.id === args.id); if (!k) return refus('Critère introuvable.'); k.texte = texte; }
  else { const f = d.facons.find(x => x.id === args.id); if (!f) return refus('Façon introuvable.'); f.nom = texte; }
  poser(b, c);
  return b.resultat('✓ Modifié');
}

export const modifierNote = (etat: Etat, args: { carnetId: string; noteId: string; texte: string; le: string }): Resultat =>
  modifierLigne(etat, { carnetId: args.carnetId, cible: 'note', id: args.noteId, texte: args.texte, le: args.le });

/** Supprimer une ligne du carnet (R22) ; Annuler dans la page (G32). Le message qui l'a rangée reste. */
export function supprimerLigne(etat: Etat, args: { carnetId: string; cible: CibleLigne; id: string }): Resultat {
  const b = new Brouillon(etat);
  const c = b.carnet(args.carnetId);
  if (!c || !retirerElement(c, args.cible, args.id)) return refus('Élément introuvable.');
  if (args.cible === 'facon') for (const a of c.carnet.articles) if (a.faconId === args.id) delete a.faconId;
  poser(b, c);
  return b.resultat(args.cible === 'note' ? 'Note supprimée' : 'Supprimé');
}

export const supprimerNote = (etat: Etat, args: { carnetId: string; noteId: string }): Resultat =>
  supprimerLigne(etat, { carnetId: args.carnetId, cible: 'note', id: args.noteId });

/* ---------- renommer ---------- */

/** Renommer l'idée (R21) ; `avant` gardé pour G30 ; une proposition G29 (`titrePropose` du message) appliquée est marquée. */
export function renommer(etat: Etat, args: { carnetId: string; titre: string; messageId?: string }): Resultat {
  const titre = args.titre.trim();
  if (!titre) return refus('Le titre est vide.');
  const b = new Brouillon(etat);
  const c = b.carnet(args.carnetId);
  if (!c) return refus('Ce carnet n’existe plus.');
  const avant = c.title;
  if (avant === titre) return refus('Même titre.');
  c.title = titre;
  b.ecrire(c);
  if (args.messageId) {
    const m = lireMessage(b.lire(args.messageId));
    const t = m?.carnetMessage.titrePropose;
    if (m && t && t.carnetId === c.id && t.titre === titre) b.ecrire({ ...m, carnetMessage: { ...m.carnetMessage, titrePropose: { ...t, applique: true } } });
  }
  return b.resultat(`✓ Renommé · avant : ${avant}`, { avant });
}

/**
 * T28-3 : « Compléter » sur un lien mort : l'article que le lien avait laissé (« lecture… » à jamais) devient « introuvable » (« ne mène plus
 * à la fiche : rien n'a été lu ») pour que le brasseur le complète à la main (nom, prix) ; il ne reste jamais « en lecture ».
 */
export function marquerIntrouvable(etat: Etat, args: { messageId: string }): Resultat {
  const b = new Brouillon(etat);
  let n = 0;
  for (const d of etat) {
    if (d.type !== 'carnet') continue;
    const c = b.carnet(d.id);
    if (!c) continue;
    let touche = false;
    for (const a of c.carnet.articles) if (a.messageId === args.messageId && a.lecture !== 'lue') { a.lecture = 'introuvable'; touche = true; n += 1; }
    if (touche) poser(b, c);
  }
  if (!n) return refus('Article introuvable.');
  return b.resultat('Article gardé : à compléter');
}

/**
 * T30-2 (test en ligne du tour 30 : « Compléter » sur un lien mort ne donnait qu'un toast « Article introuvable. ») : le brasseur écrit lui-même
 * le nom (et le prix, en francs) de l'article dont le lien ne mène plus à rien. L'article est celui du message ; sinon celui du carnet qui porte
 * déjà cette adresse (un lien collé deux fois ne laisse pas d'article au second message) ; sinon il est créé dans `carnetId`. Il reste « lien
 * introuvable » (sa page ne se lit plus) mais prend nom et prix, de provenance « vous » : il se compte et se classe. Le prix est facultatif.
 */
export function completerLienMort(etat: Etat, args: { messageId: string; url: string; carnetId?: string | null; nom: string; prixCentimes?: number }): Resultat {
  const nom = args.nom.trim();
  if (!nom) return refus('Le nom de l’article est à écrire.');
  if (args.prixCentimes !== undefined && (!Number.isSafeInteger(args.prixCentimes) || args.prixCentimes <= 0)) return refus('Prix illisible.');
  const b = new Brouillon(etat);
  const canon = lienCanonique(args.url);
  const sansLecture = (x: Article) => x.lecture !== 'lue';
  let cible: { c: CarnetDoc; a: Article } | null = null;
  for (const d of etat) {
    if (d.type !== 'carnet') continue;
    const c = b.carnet(d.id);
    const a = c?.carnet.articles.find(x => x.messageId === args.messageId && sansLecture(x)) ?? (canon ? c?.carnet.articles.find(x => x.url && lienCanonique(x.url) === canon && sansLecture(x)) : undefined);
    if (c && a) { cible = { c, a }; break; }
  }
  if (!cible) {
    const c = args.carnetId ? b.carnet(args.carnetId) : null;
    if (!c) return refus('Carnet introuvable.');
    let domaine: string | undefined;
    try { domaine = new URL(args.url).hostname.replace(/^www\./, ''); } catch { domaine = undefined; }
    const a: Article = sansIndefinis({ id: nouvelIdCarnet('ART'), url: args.url, domaine, valeurs: {}, lecture: 'introuvable' as const, messageId: args.messageId });
    c.carnet.articles.push(a);
    cible = { c, a };
  }
  const { c, a } = cible;
  a.nom = nom;
  a.lecture = 'introuvable';
  a.origine = 'vous';
  if (args.prixCentimes !== undefined) { a.prixCentimes = args.prixCentimes; a.devise = 'CHF'; delete a.prixDes; delete a.taxe; delete a.prixTTCCentimes; delete a.change; }
  poser(b, c);
  return b.resultat('Article gardé');
}

/* ---------- veille (R31) ---------- */

/** Allumer ou éteindre la veille d'un article. Allumée : `{ active: true, depuis }`, sans `releveLe` (relève sous accord). Éteinte : retirée. */
export function basculerVeille(etat: Etat, args: { carnetId: string; articleId: string; le: string }): Resultat {
  const b = new Brouillon(etat);
  const c = b.carnet(args.carnetId);
  const a = c?.carnet.articles.find(x => x.id === args.articleId);
  if (!c || !a) return refus('Article introuvable.');
  const allumer = !a.veille?.active;
  if (allumer) a.veille = { active: true, depuis: args.le };
  else delete a.veille;
  poser(b, c);
  return b.resultat(allumer ? 'Veille demandée' : 'Veille arrêtée');
}

/**
 * L-9 (ses mots du 21.11 : « il y a même pas le prix de la chambre froide ?? ») : poser ou corriger le prix d'un article, en CHF, à la main.
 * Le prix lu d'avant (autre devise comprise) est remplacé ; « dès » tombe (le prix posé est celui de l'article).
 */
export function poserPrixArticle(etat: Etat, args: { carnetId: string; articleId: string; centimes: number }): Resultat {
  if (!Number.isSafeInteger(args.centimes) || args.centimes <= 0) return refus('Prix illisible.');
  const b = new Brouillon(etat);
  const c = b.carnet(args.carnetId);
  const a = c?.carnet.articles.find(x => x.id === args.articleId);
  if (!c || !a) return refus('Article introuvable.');
  if (a.prixCentimes === args.centimes && (a.devise ?? 'CHF') === 'CHF' && !a.prixDes) return refus('Même prix.');
  a.prixCentimes = args.centimes;
  a.devise = 'CHF';
  delete a.prixDes;
  /* le prix posé est le sien : ni la taxe, ni le TTC, ni le cours du prix lu d'avant ne lui restent attachés (le port lu reste) */
  delete a.taxe; delete a.prixTTCCentimes; delete a.change;
  poser(b, c);
  return b.resultat('✓ Prix posé');
}

/**
 * C48-1 : « Relire » (geste du brasseur) : la page de l'article relue, ce qu'elle dit de plus entre dans l'article ; rien ne part tout seul.
 * Le prix lu n'entre que si l'article n'a pas le sien (celui que le brasseur a posé ou que la page avait déjà dit ne bouge jamais), avec sa
 * devise, sa taxe, son TTC et son cours ; les caractéristiques lues sur la page se rafraîchissent, celles du brasseur ne sont jamais touchées ;
 * photo, disponibilité et port ne se posent que s'ils manquaient. Rien de plus à lire : refus, rien n'est écrit.
 */
export function relireArticle(etat: Etat, args: { carnetId: string; articleId: string; page: PageRelue; le: string; /** ESCALADER-SUR-MANQUE : la lecture forte remplace un prix douteux */ escalade?: boolean }): Resultat {
  const b = new Brouillon(etat);
  const c = b.carnet(args.carnetId);
  const a = c?.carnet.articles.find(x => x.id === args.articleId);
  if (!c || !a) return refus('Article introuvable.');
  const p = args.page;
  if (p.statut !== 'lue') return refus('La page ne se lit pas.');
  let change = 0;
  /* PX (R42) : un prix « dès » sans quantité (l'ancienne lecture) n'est le prix d'aucun conditionnement : une page qui dit enfin la quantité (ou le prix à l'unité) le remplace ;
     un prix que le brasseur a posé, ou que la page avait déjà dit avec sa quantité, ne bouge jamais. */
  const sansQuantite = (a.prixDes === true && !a.conditionnement && !quantiteArticle({ nom: a.nom ?? '' })) || (args.escalade === true && !!a.doute);
  const pageHonnete = typeof p.prix === 'number' && p.prix > 0 && !!p.devise && (!p.prixDes || !!p.conditionnement || !!quantiteArticle({ nom: a.nom ?? p.nom ?? '' }));
  const attachePage = () => {
    if (p.conditionnement) a.conditionnement = { ...p.conditionnement } as NonNullable<Article['conditionnement']>; else delete a.conditionnement;
    if (p.prixUnite) a.prixUnite = copie(p.prixUnite) as NonNullable<Article['prixUnite']>; else delete a.prixUnite;
    if (p.offres?.length) a.offres = p.offres.map(o => ({ valeur: o.valeur, unite: o.unite, prixCentimes: Math.round(o.prix * 100) })); else delete a.offres;
  };
  if (a.prixCentimes !== undefined && p.devise === (a.devise ?? 'CHF') && typeof p.prix === 'number' && Math.round(p.prix * 100) === a.prixCentimes && !sansQuantite && (p.conditionnement || p.offres?.length) && !a.conditionnement) {
    attachePage(); change++; /* le même prix, désormais dit avec sa quantité */
  } else if ((a.prixCentimes === undefined || (sansQuantite && pageHonnete)) && typeof p.prix === 'number' && p.prix > 0 && p.devise) {
    a.prixCentimes = Math.round(p.prix * 100); a.devise = p.devise; change++;
    delete a.prixDes; delete a.taxe; delete a.prixTTCCentimes; delete a.change;
    attachePage();
    if (p.prixDes && !p.conditionnement) a.prixDes = true;
    if (p.taxe) { a.taxe = p.taxe; if (p.taxe === 'ht' && typeof p.prixTTC === 'number' && p.prixTTC > 0) a.prixTTCCentimes = Math.round(p.prixTTC * 100); }
    if (p.change && p.change.taux > 0 && p.devise !== 'CHF') a.change = { taux: p.change.taux, date: p.change.date, source: p.change.source };
  }
  /* D450 : le doute de la lecture suit la page relue (deux lectures qui s'accordent l'effacent) */
  const doute = douteDePage(p.etapes);
  if (doute !== a.doute) { if (doute) a.doute = doute; else delete a.doute; change++; }
  const luLe = p.luLe > 0 ? new Date(p.luLe).toISOString() : args.le;
  for (const v of p.valeurs ?? []) {
    const deja = a.valeurs[v.nom];
    if (deja && deja.origine !== 'page') continue;
    const neuve: Valeur = { valeur: v.valeur, ...(v.unite ? { unite: v.unite } : {}), origine: 'page', luLe };
    if (!deja || deja.valeur !== neuve.valeur || deja.unite !== neuve.unite) { a.valeurs[v.nom] = neuve; change++; }
  }
  if (!a.photo && p.photos?.length) { a.photo = p.photos[0]; a.photos = [...p.photos]; change++; }
  if (!a.dispo && p.dispo) { a.dispo = p.dispo === 'en-stock' ? 'en stock' : p.dispo === 'retire' ? 'plus disponible' : p.dispo === 'sur-commande' ? ['sur commande', p.dispoDelai].filter(Boolean).join(' · ') : 'rupture'; change++; }
  if (!a.livraison && p.livraison && (p.livraison.gratuite || p.livraison.refusee || (typeof p.livraison.prix === 'number' && p.livraison.prix >= 0))) {
    const l = p.livraison;
    a.livraison = { ...(typeof l.prix === 'number' && l.prix >= 0 && !l.gratuite && !l.refusee ? { prixCentimes: Math.round(l.prix * 100), devise: l.devise ?? p.devise ?? 'CHF' } : {}), ...(l.gratuite ? { gratuite: true as const } : {}), ...(l.refusee ? { refusee: true as const } : {}) };
    change++;
  }
  if (!change) return refus(sansQuantite ? 'Le prix de la page est un « dès » sans quantité (ni conditionnement, ni prix au gramme) : rien de précis à lire. Posez le prix du conditionnement choisi.' : 'Rien de plus à lire sur la page.');
  a.lecture = 'lue';
  poser(b, c);
  return b.resultat('✓ Page relue');
}
/** Ce que `relireArticle` lit d'une page (un `PageLue` du serveur). */
export type PageRelue = Pick<PageLueV, 'statut' | 'nom' | 'conditionnement' | 'prixUnite' | 'offres' | 'prix' | 'devise' | 'prixDes' | 'taxe' | 'prixTTC' | 'change' | 'valeurs' | 'photos' | 'dispo' | 'dispoDelai' | 'livraison' | 'luLe' | 'etapes'>;

/* ---------- choisir (R07, R34) ---------- */

/**
 * Choisir un article avec son pourquoi (ADR). Un choix déjà posé passe dans `remplaces` et reste lisible (choix revu, D-20). La façon de
 * l'article (ou celle donnée) devient retenue.
 */
export function choisir(etat: Etat, args: { carnetId: string; articleId: string; faconId?: string; pourquoi: string; ecartes?: { articleId: string; raison: string }[]; aRevoirSi?: string; le: string; quantite?: { kg: number; libelle: string }; prixCentimes?: number }): Resultat {
  const b = new Brouillon(etat);
  const c = b.carnet(args.carnetId);
  const a = c?.carnet.articles.find(x => x.id === args.articleId);
  if (!c || !a) return refus('Article introuvable.');
  const d = c.carnet;
  const ancien = d.choix;
  const { remplaces: anciensRemplaces = [], ...ancienSeul } = ancien ?? ({} as Partial<Choix>);
  const faconId = args.faconId ?? a.faconId;
  const choix: Choix = sansIndefinis({
    articleId: a.id, faconId, pourquoi: args.pourquoi.trim(), ecartes: (args.ecartes ?? []).filter(e => e.articleId !== a.id && d.articles.some(x => x.id === e.articleId)),
    aRevoirSi: args.aRevoirSi?.trim() || undefined, le: args.le, remplaces: ancien ? [...anciensRemplaces, { ...(ancienSeul as Choix), remplaces: [] }] : [],
    /* R54 : la quantité cochée et son prix (62,20 pour 1 kg) ; l'un sans l'autre ne dit rien */
    ...(args.quantite && args.quantite.kg > 0 && args.quantite.libelle && typeof args.prixCentimes === 'number' && args.prixCentimes > 0 ? { quantite: { kg: args.quantite.kg, libelle: args.quantite.libelle }, prixCentimes: Math.round(args.prixCentimes) } : {})
  });
  d.choix = choix;
  /* Q-1 A (D435) : le choix fait le prix ; un prix en francs remplace l'estimé (un seul chiffre). En autre devise : rien d'inventé. */
  const prixDuChoix = prixCentimesDuChoix(d.choix, a);
  if (prixDuChoix !== undefined) c.estimatedCost = prixDuChoix / 100;
  const f = faconId ? d.facons.find(x => x.id === faconId) : undefined;
  if (f && f.etat !== 'retenue') f.etat = 'retenue';
  /* D451 : un carnet déjà suivi passe à Décidé avec son choix (sinon son état écrit resterait « je cherche » face à un choix posé) ; sans `suivi`, l'état se dérive. */
  if (d.suivi && (d.suivi.etat === 'note' || d.suivi.etat === 'cherche') && !d.archive) {
    ajouterEvenement(d.suivi, { id: nouvelIdCarnet('EVT'), le: args.le, sorte: 'etat', de: d.suivi.etat, vers: 'decide', origine: 'vous' });
    d.suivi.etat = 'decide';
  }
  c.status = 'validated';
  b.ecrire(c);
  return b.resultat(ancien ? '✓ Choix revu' : '✓ Choisi');
}

/** D437 : un toucher sur la pastille du carnet pose son domaine ; son choix passe avant celui de l'IA. Annuler rend l'ancien. */
export function poserDomaine(etat: Etat, args: { carnetId: string; domaine: DomaineCarnet }): Resultat {
  if (!estDomaine(args.domaine)) return refus('Domaine inconnu.');
  const b = new Brouillon(etat);
  const c = b.carnet(args.carnetId);
  if (!c) return refus('Ce carnet n’existe plus.');
  if (c.carnet.domaine?.valeur === args.domaine && c.carnet.domaine.origine === 'vous') return b.resultat('Domaine inchangé');
  c.carnet.domaine = { valeur: args.domaine, origine: 'vous' };
  b.ecrire(c);
  return b.resultat('✓ Domaine posé');
}

/** Revoir un choix : comme choisir, mais seulement s'il en existe un ; l'ancien reste lisible dans `remplaces`. */
export function revoirChoix(etat: Etat, args: Parameters<typeof choisir>[1]): Resultat {
  const c = lireCarnet(etat.find(d => d.id === args.carnetId));
  if (!c?.carnet.choix) return refus('Aucun choix à revoir.');
  return choisir(etat, args);
}

/* ---------- sortie vers À venir (R32, C4) ---------- */

/** L'id du plan d'un carnet : idempotent, un deuxième envoi ne crée pas de doublon. */
export const idPlanDuCarnet = (carnetId: string): string => `PLAN-CARNET-${carnetId}`;

/**
 * Le plan d'À venir tiré du choix (créé par le lot D avec le service des plans ; rien n'est écrit ici). Prix inconnu ou en autre devise :
 * budget inconnu (convention existante d'À venir, `budgetKnown: false`). `null` sans choix.
 */
/** CRW-3 : sans prix ni date, le plan n'existait nulle part ; par défaut le 1er du mois, dans 3 mois (UTC), précision « mois ». */
export function dansTroisMois(le: string): string {
  const d = new Date(le);
  const base = Number.isNaN(d.getTime()) ? new Date() : d;
  const m = base.getUTCMonth() + 3;
  return new Date(Date.UTC(base.getUTCFullYear() + Math.floor(m / 12), m % 12, 1)).toISOString().slice(0, 10);
}

export function planDepuisChoix(c: CarnetDoc, args: { le: string }): FinancialPlan | null {
  const choix = c.carnet.choix;
  const a = choix ? c.carnet.articles.find(x => x.id === choix.articleId) : undefined;
  if (!choix || !a) return null;
  /* R54 : la quantité cochée sur la fiche (1 kg, 62,20) fait le prix de l'entrée À venir, qui la dit en note */
  const prix = prixCentimesDuChoix(choix, a);
  const connu = prix !== undefined;
  return {
    id: idPlanDuCarnet(c.id), title: c.title, date: dansTroisMois(args.le), amountCents: connu ? prix : 0, direction: 'out', category: 'materiel', source: 'equipment',
    status: 'draft', createdAt: args.le, ...(a.vendeur ? { vendor: a.vendeur } : {}), ...(choix.quantite ? { notes: choix.quantite.libelle } : {}),
    upgrade: {
      version: 1, timing: 'soon', stage: connu ? 'ready' : 'research', budgetKnown: connu, datePrecision: 'month', estimateSource: 'estimate',
      ...(connu ? { purchaseCents: prix } : {}), ...(choix.pourquoi ? { purpose: choix.pourquoi } : {}),
      sourceCarnetId: c.id, sourceCarnetTitre: c.title
    }
  };
}

/**
 * L-26 (T10-26 ; ses mots, 20.11 : « petit bouton ajouter calendrier, ça l'ajout à la date du jour, ça nous transférer sur le calendrier pour que on
 * puisse le déplacer facilement, et on peut aussi lui donner ou estimer directement un prix... En 1 bouton on a 3 action ») : « Au calendrier »
 * pose l'achat prévu du projet, « peu importe s'il a un budget ou pas », au jour donné (au jour près : il se déplace au Calendrier). Son prix : celui
 * de l'article choisi s'il est connu, sinon le prix estimé du projet (T11-1 : « Prix estimé » du carnet, `estimatedCost`), sinon à estimer (0,
 * « à l'étude »). Même clé que « Placer » et « Envoyer dans À venir » : un seul plan.
 */
export function planAuCalendrier(c: CarnetDoc, args: { le: string; date: string }): FinancialPlan {
  const base = planDepuisChoix(c, { le: args.le });
  const plan: FinancialPlan = base
    ? { ...base, date: args.date, ...(base.upgrade ? { upgrade: { ...base.upgrade, datePrecision: 'day' as const } } : {}) }
    : {
      id: idPlanDuCarnet(c.id), title: c.title, date: args.date, amountCents: 0, direction: 'out', category: 'materiel', source: 'equipment', status: 'draft', createdAt: args.le,
      upgrade: { version: 1, timing: 'soon', stage: 'research', budgetKnown: false, datePrecision: 'day', estimateSource: 'estimate', sourceCarnetId: c.id, sourceCarnetTitre: c.title }
    };
  return avecPrixEstime(plan, c);
}

/** Le prix estimé du projet (CHF, `estimatedCost`) en centimes ; `undefined` sans estimation. */
export const prixEstimeCentimes = (c: Pick<CarnetDoc, 'estimatedCost'>): number | undefined =>
  (typeof c.estimatedCost === 'number' && Number.isFinite(c.estimatedCost) && c.estimatedCost > 0 ? Math.round(c.estimatedCost * 100) : undefined);

/**
 * T11-1 (L-26) : un achat prévu sans montant prend le prix estimé du projet, comme budget estimé (`purchaseCents`, la feuille du projet le dit
 * « Prix estimé TTC ») ; un montant déjà là (prix de l'article choisi, ou chiffré ailleurs) n'est jamais écrasé. Sans estimation : inchangé.
 */
export function avecPrixEstime(plan: FinancialPlan, c: Pick<CarnetDoc, 'estimatedCost'>): FinancialPlan {
  const estime = prixEstimeCentimes(c);
  if (estime === undefined || plan.amountCents > 0 || !plan.upgrade) return plan;
  return { ...plan, amountCents: estime, upgrade: { ...plan.upgrade, budgetKnown: true, purchaseCents: estime, estimateSource: 'estimate' } };
}

/** Le carnet retient le plan créé (« Dans À venir depuis le … · Voir ») ; idempotent. */
export function poserSortie(etat: Etat, args: { carnetId: string; planId: string; le: string }): Resultat {
  const b = new Brouillon(etat);
  const c = b.carnet(args.carnetId);
  if (!c) return refus('Ce carnet n’existe plus.');
  if (c.carnet.sortie?.planId === args.planId) return b.resultat('Déjà dans À venir');
  c.carnet.sortie = { planId: args.planId, le: args.le };
  b.ecrire(c);
  return b.resultat('✓ Dans À venir');
}

/* ---------- liens (R47) et Suppression v2 (R23, D-47b) ---------- */

export interface LienCarnet { sorte: 'a-venir' | 'realise'; id: string; libelle: string; etat: 'present' | 'supprime' }

/** Pastilles « lié à » : le plan de la sortie, à venir ou réalisé ; un plan disparu dit « supprimé ». Aucun montant. */
export function liensDe(c: CarnetDoc, plans: readonly FinancialPlan[], transactions: readonly FinanceTransaction[] = [], payments: readonly FinancialPayment[] = []): LienCarnet[] {
  const s = c.carnet.sortie;
  if (!s) return [];
  const plan = plans.find(p => p.id === s.planId);
  /* le plan a été supprimé côté À venir : son titre n'est plus connu ; aucun nom inventé */
  if (!plan) return [{ sorte: 'a-venir', id: s.planId, libelle: 'plan d’À venir', etat: 'supprime' }];
  /* L-12 : un plan archivé ne se dit pas « Dans À venir » ; la ligne de sortie (`texteSortie`) le dit */
  if (plan.status === 'cancelled') return [];
  return [{ sorte: estRealise(plan, [...transactions], [...payments]) || plan.status === 'completed' ? 'realise' : 'a-venir', id: plan.id, libelle: plan.title, etat: 'present' }];
}

/**
 * Critique 7, n° 5 ; L-12 (CA12-M2-3, M3-6, M3-17) : l'état de la sortie d'un carnet, par la règle même d'À venir et de Réalisés. Plan payé
 * (`estRealise`) : « réalisé », daté de sa dernière facture (aucune date inventée : `le` vide sans facture datée) ; plan marqué réalisé sans
 * achat (`completed`, la vue Réalisés d'À venir le range ainsi) : « réalisé », `sansAchat` ; plan archivé (`cancelled`) : « archivé » ; plan
 * disparu : « supprimé » ; sinon « à venir », daté de l'envoi. Sans sortie : null.
 */
export type SorteSortie = 'a-venir' | 'realise' | 'archive' | 'supprime';
export function etatSortie(c: CarnetDoc, plans: readonly FinancialPlan[], transactions: readonly FinanceTransaction[] = [], payments: readonly FinancialPayment[] = []): { sorte: SorteSortie; le: string; sansAchat?: true } | null {
  const s = c.carnet.sortie;
  if (!s) return null;
  const plan = plans.find(p => p.id === s.planId);
  if (!plan) return { sorte: 'supprime', le: s.le };
  if (estRealise(plan, [...transactions], [...payments])) return { sorte: 'realise', le: dateFacture(plan, [...transactions]) ?? '' };
  if (plan.status === 'completed') return { sorte: 'realise', le: dateFacture(plan, [...transactions]) ?? '', sansAchat: true };
  if (plan.status === 'cancelled') return { sorte: 'archive', le: s.le };
  return { sorte: 'a-venir', le: s.le };
}

/**
 * L-11 : le plan d'À venir que le carnet suit encore (sa sortie, brouillon ou actif, ni réalisé ni archivé, venu de ce carnet). Le carnet,
 * À venir et le Calendrier disent alors la même date et le même prix : ceux de ce plan. `undefined` sinon.
 */
export function planOuvertDuCarnet(c: CarnetDoc, plans: readonly FinancialPlan[], transactions: readonly FinanceTransaction[] = [], payments: readonly FinancialPayment[] = []): FinancialPlan | undefined {
  const e = etatSortie(c, plans, transactions, payments);
  if (e?.sorte !== 'a-venir') return undefined;
  const plan = plans.find(p => p.id === c.carnet.sortie!.planId);
  return plan && (plan.status === 'draft' || plan.status === 'active') && (!plan.upgrade?.sourceCarnetId || plan.upgrade.sourceCarnetId === c.id) ? plan : undefined;
}

/**
 * CA13-3 (tour 13 : archivé, le carnet revenait à « vers mai · 500 CHF », ses valeurs d'avant le Calendrier et À venir) : le plan que le
 * carnet suit, ouvert ou mis de côté (archivé). Archivé, il garde la dernière date et le dernier prix posés, que le carnet dit encore et
 * que « Au calendrier » reprend. Réalisé ou supprimé : `undefined`.
 */
export function planSuiviDuCarnet(c: CarnetDoc, plans: readonly FinancialPlan[], transactions: readonly FinanceTransaction[] = [], payments: readonly FinancialPayment[] = []): FinancialPlan | undefined {
  const ouvert = planOuvertDuCarnet(c, plans, transactions, payments);
  if (ouvert) return ouvert;
  if (etatSortie(c, plans, transactions, payments)?.sorte !== 'archive') return undefined;
  const plan = plans.find(p => p.id === c.carnet.sortie!.planId);
  return plan && (!plan.upgrade?.sourceCarnetId || plan.upgrade.sourceCarnetId === c.id) ? plan : undefined;
}

/** CA13-3 : un plan archivé repris (« Au calendrier », Placer) redevient un brouillon d'À venir, date et prix gardés (comme « Reprendre » des Archives). */
export const planRepris = (plan: FinancialPlan): FinancialPlan => (plan.status === 'cancelled' ? { ...plan, status: 'draft' } : plan);

/**
 * L-11 : un geste du carnet suit sur son plan. Date (un lundi, « mois » ou « semaine ») : la date du plan et sa précision ; sans date
 * (« Plus tard ») le plan garde la sienne. Prix estimé (centimes) : le prix d'achat du plan, livraison et installation gardées, budget connu,
 * « estimé ». Rien ne change : le même objet.
 */
export function planSuitCarnet(plan: FinancialPlan, geste: { date?: string | null; precision?: 'semaine' | 'mois'; centimes?: number }): FinancialPlan {
  let p = plan;
  if (geste.date && p.upgrade) {
    const precision = geste.precision === 'semaine' ? 'day' as const : 'month' as const;
    if (p.date !== geste.date || p.upgrade.datePrecision !== precision) p = { ...p, date: geste.date, upgrade: { ...p.upgrade, datePrecision: precision } };
  }
  if (geste.centimes !== undefined && geste.centimes > 0 && p.upgrade) {
    const d = upgradeDetails(p);
    const parts = { purchaseCents: geste.centimes, deliveryCents: d.deliveryCents, installationCents: d.installationCents };
    const total = upgradeBudget(parts) ?? geste.centimes;
    if (p.amountCents !== total || d.purchaseCents !== geste.centimes || d.budgetKnown !== true)
      p = { ...p, amountCents: total, upgrade: { ...p.upgrade, ...parts, budgetKnown: true, estimateSource: 'estimate' } };
  }
  return p;
}

/**
 * L-10 : le choix d'un article au prix connu (CHF) fait passer le plan à « Prêt à acheter » (le prix est trouvé : plus « à chercher »).
 * Q-1 A (D435, « le choix fait le prix ») : le prix de l'article choisi devient le prix d'achat du plan, l'estimé d'avant compris (À venir,
 * Calendrier et carnet disent le même chiffre) ; livraison et pose restent. Le vendeur manquant est repris. Rien ne change : le même objet.
 */
export function planSuitChoix(plan: FinancialPlan, c: CarnetDoc): FinancialPlan {
  const choix = c.carnet.choix;
  const a = choix ? c.carnet.articles.find(x => x.id === choix.articleId) : undefined;
  const prix = a ? prixCentimesDuChoix(choix, a) : undefined;
  if (!a || !plan.upgrade || prix === undefined) return plan;
  const d = upgradeDetails(plan);
  const parts = { purchaseCents: prix, deliveryCents: d.deliveryCents, installationCents: d.installationCents };
  const total = upgradeBudget(parts) ?? prix;
  const aJour = plan.amountCents === total && d.purchaseCents === prix && d.budgetKnown === true;
  const etape = d.stage === 'idea' || d.stage === 'research' ? 'ready' as const : d.stage;
  if (aJour && etape === d.stage && (plan.vendor || !a.vendeur)) return plan;
  let p: FinancialPlan = { ...plan, ...(!plan.vendor && a.vendeur ? { vendor: a.vendeur } : {}), upgrade: { ...plan.upgrade, stage: etape } };
  if (!aJour) p = { ...p, amountCents: total, upgrade: { ...p.upgrade!, ...parts, budgetKnown: true } };
  return p;
}

export interface LienQuiRetient { sorte: 'plan-a-venir' | 'plan-realise'; planId: string; libelle: string; reglage: 'detacher' | 'archiver' }

/**
 * Les liens qui retiennent une idée : seulement le plan de sa sortie, s'il existe encore. Plan à venir → détacher ; plan réalisé (une
 * dépense liée, payée en entier : la facture de CHOIX.md, `estRealise`) → archiver. Pas de sorte « stock » (aucune donnée ne relie le
 * parc au carnet, L19) ni « facture » à part (elle se lit par le plan).
 */
export function liensQuiRetiennent(c: CarnetDoc, plans: readonly FinancialPlan[], transactions: readonly FinanceTransaction[] = [], payments: readonly FinancialPayment[] = []): LienQuiRetient[] {
  const s = c.carnet.sortie;
  const plan = s ? plans.find(p => p.id === s.planId) : undefined;
  /* L-12, L-14 : un plan archivé ne retient plus l'idée ; marqué réalisé (avec ou sans achat), il s'archive avec elle */
  if (!plan || plan.status === 'cancelled') return [];
  return estRealise(plan, [...transactions], [...payments]) || plan.status === 'completed'
    ? [{ sorte: 'plan-realise', planId: plan.id, libelle: plan.title, reglage: 'archiver' }]
    : [{ sorte: 'plan-a-venir', planId: plan.id, libelle: plan.title, reglage: 'detacher' }];
}

/** « 1 lien le retient » / « 2 liens le retiennent ». */
export const texteLiens = (n: number): string => (n <= 1 ? `${n} lien le retient` : `${n} liens le retiennent`);

/** G36 : la vérification dite avant de supprimer, tirée de la même liste (jamais de l'IA). */
export const verificationSuppression = (liens: readonly LienQuiRetient[]): string =>
  (liens.length === 0 ? 'ni dans À venir, ni en commande' : `${texteLiens(liens.length)} : ${liens.map(l => l.libelle).join(', ')}`);

interface Finances { plans: readonly FinancialPlan[]; transactions?: readonly FinanceTransaction[]; payments?: readonly FinancialPayment[] }

/**
 * Critique 8, n° 4 (R23, D-47b) : le lien d'un plan d'À venir à son carnet d'origine. `lie` : le carnet est là et sa sortie pointe ce plan ;
 * `detache` : le carnet est là mais « Garder le plan sans ce carnet » a coupé le lien (la carte dit « du carnet <titre> · détaché ») ;
 * `supprime` : le carnet n'existe plus. `null` : le plan ne vient d'aucun carnet. Carnet présent mais non lu : `lie` (rien d'inventé).
 */
export function lienDuPlan(plan: Pick<FinancialPlan, 'id' | 'upgrade'>, presents: ReadonlySet<string>, docs: readonly CarnetDoc[]): 'lie' | 'detache' | 'supprime' | null {
  const id = plan.upgrade?.sourceCarnetId;
  if (!id) return null;
  if (!presents.has(id)) return 'supprime';
  const doc = docs.find(c => c.id === id);
  return !doc || doc.carnet.sortie?.planId === plan.id ? 'lie' : 'detache';
}

/**
 * Critique 8, n° 4 : les carnets choisis qui attendent « Envoyer dans À venir ». Un carnet dont un plan d'À venir vient déjà (lié ou détaché)
 * n'y est pas : il est dans À venir, sa carte le dit.
 */
export function choisisEnAttente(carnets: readonly CarnetDoc[], plans: readonly Pick<FinancialPlan, 'upgrade'>[]): CarnetDoc[] {
  const envoyes = new Set(plans.flatMap(p => (p.upgrade?.sourceCarnetId ? [p.upgrade.sourceCarnetId] : [])));
  return carnets.filter(c => c.carnet.choix && !c.carnet.sortie && !c.carnet.archive && !envoyes.has(c.id));
}

/** Garder le plan sans ce carnet : le carnet oublie sa sortie ; le plan n'est pas écrit. Refusé sur un plan réalisé (« plan réalisé : archiver »). */
export function detacherPlan(etat: Etat, args: { carnetId: string } & Finances): Resultat {
  const b = new Brouillon(etat);
  const c = b.carnet(args.carnetId);
  if (!c) return refus('Ce carnet n’existe plus.');
  if (!c.carnet.sortie) return refus('Aucun plan lié.');
  const liens = liensQuiRetiennent(c, args.plans, args.transactions, args.payments);
  if (liens.some(l => l.sorte === 'plan-realise')) return refus('plan réalisé : archiver');
  delete c.carnet.sortie;
  b.ecrire(c);
  return b.resultat('Plan gardé sans ce carnet');
}

/**
 * Supprimer une idée (L33) : refusé tant qu'un lien la retient. Son contenu part avec elle (articles et leur veille, notes, façons, photos) ;
 * les messages restent, leurs effets marqués « carnet supprimé ». Aucune écriture dans un autre module. Journalisé.
 */
export function supprimerCarnet(etat: Etat, args: { carnetId: string } & Finances): Resultat {
  const b = new Brouillon(etat);
  const c = b.carnet(args.carnetId);
  if (!c) return refus('Ce carnet n’existe plus.');
  const liens = liensQuiRetiennent(c, args.plans, args.transactions, args.payments);
  if (liens.length) return refus(verificationSuppression(liens));
  b.retirer(c.id);
  /* tour 3, PCN-167 : ses messages partent avec lui (même écriture, même Annuler) ; un message qui a aussi rangé ailleurs reste, marqué */
  for (const m of b.messages()) {
    const effets = m.carnetMessage.effets;
    if (!effets.some(e => e.carnetId === c.id) && m.carnetMessage.depuis !== c.id) continue;
    if (effets.every(e => e.carnetId === c.id)) { b.retirer(m.id); continue; }
    b.ecrire({ ...m, carnetMessage: { ...m.carnetMessage, effets: m.carnetMessage.effets.map(e => (e.carnetId === c.id ? { ...e, carnetSupprime: true as const } : e)) } });
  }
  return b.resultat(`Carnet supprimé · ${c.title}`, { journal: { action: 'Suppression', entityId: c.id, resume: `Carnet d'idées supprimé : ${c.title}` } });
}

/** Archiver (seule issue d'un plan réalisé) : `archive` posé, `sortie` et tout le contenu gardés ; l'idée quitte la liste. */
export function archiverCarnet(etat: Etat, args: { carnetId: string; le: string; raison?: string }): Resultat {
  const b = new Brouillon(etat);
  const c = b.carnet(args.carnetId);
  if (!c) return refus('Ce carnet n’existe plus.');
  if (c.carnet.archive) return refus('Déjà archivé.');
  c.carnet.archive = { le: args.le, raison: args.raison ?? 'plan réalisé' };
  b.ecrire(c);
  return b.resultat(`Carnet archivé · ${c.title}`, { journal: { action: 'Archivage', entityId: c.id, resume: `Carnet d'idées archivé : ${c.title}` } });
}

/* ---------- aides de l'IA (R40) ---------- */

/** G11 : fusionner deux notes ; la première garde le texte donné (ou le sien), `fusionDe` garde les deux textes d'origine. Rien n'est perdu. */
export function fusionnerNotes(etat: Etat, args: { carnetId: string; garderId: string; fusionnerId: string; texte?: string; le: string }): Resultat {
  if (args.garderId === args.fusionnerId) return refus('Même note.');
  const b = new Brouillon(etat);
  const c = b.carnet(args.carnetId);
  const garder = c?.carnet.notes.find(n => n.id === args.garderId), autre = c?.carnet.notes.find(n => n.id === args.fusionnerId);
  if (!c || !garder || !autre) return refus('Note introuvable.');
  garder.fusionDe = [...(garder.fusionDe ?? [garder.texte]), ...(autre.fusionDe ?? [autre.texte])];
  if (args.texte?.trim()) garder.texte = args.texte.trim();
  garder.modifieeLe = args.le;
  c.carnet.notes = c.carnet.notes.filter(n => n.id !== autre.id);
  poser(b, c);
  suivreEffet(b, { carnetId: c.id, cible: 'note', id: autre.id }, { id: garder.id });
  return b.resultat('✓ Notes fusionnées');
}

/** G11 « Garder à part » : n'écrit que le message (la proposition ne revient pas). */
export function garderAPart(etat: Etat, args: { messageId: string }): Resultat {
  const b = new Brouillon(etat);
  const m = lireMessage(b.lire(args.messageId));
  if (!m) return refus('Message introuvable.');
  b.ecrire({ ...m, carnetMessage: { ...m.carnetMessage, gardeAPart: true } });
  return b.resultat('Gardé à part');
}

/** G27 « Regrouper » : un même groupe sur les notes données. */
export function regrouperNotes(etat: Etat, args: { carnetId: string; noteIds: readonly string[]; libelle: string; groupeId?: string }): Resultat {
  if (args.noteIds.length < 2) return refus('Il faut deux notes au moins.');
  const b = new Brouillon(etat);
  const c = b.carnet(args.carnetId);
  if (!c) return refus('Ce carnet n’existe plus.');
  const groupe = { id: args.groupeId ?? nouvelIdCarnet('GROUPE'), libelle: args.libelle.trim() };
  for (const id of args.noteIds) {
    const n = c.carnet.notes.find(x => x.id === id);
    if (!n) return refus('Note introuvable.');
    n.groupe = { ...groupe };
  }
  poser(b, c);
  return b.resultat(`✓ Regroupé : ${groupe.libelle}`);
}

/* ---------- appliquer (mémoire, tests) ---------- */

/** Applique des écritures à un état en mémoire (magasin mémoire, tests). */
export function appliquerEcritures(etat: Etat, ecritures: readonly EcritureCarnet[]): CreativeItem[] {
  const parId = new Map(etat.map(d => [d.id, d] as const));
  for (const w of ecritures) {
    if (w.op === 'put') parId.set(w.doc.id, copie(w.doc));
    else parId.delete(w.id);
  }
  return [...parId.values()].sort((a, b) => a.id.localeCompare(b.id));
}

export { VERSION_CARNET };
