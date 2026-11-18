/**
 * Carnet d'idées — le conteneur (lot D). Il tient le magasin, le rangement (le fil : un champ, l'IA met en forme et range), la navigation
 * interne (liste ↔ carnet ↔ article ↔ comparer ↔ choisir), Annuler et l'état du réseau. Les vues (lot C) sont contrôlées par props :
 * elles ne lisent aucun magasin. Les calculs viennent du lot A (`comparer.ts`, `operations.ts`, `rattacher.ts`, `doublons.ts`) ; l'IA du
 * lot B (`rangement.ts`, `config/carnetIA.ts`). Rien n'est écrit hors de `creativeItems`, sauf le plan d'À venir créé par « Envoyer dans
 * À venir » (le service des plans existant, une fois : clé idempotente).
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { FinanceTransaction, FinancialPayment, FinancialPlan } from '../../domain/finance/types';
import { FinanceService } from '../../services/financeService';
import { StorageService } from '../../services/storage';
import { useStorageValue } from '../../hooks/useLiveData';
import { magasinFirestore, type MagasinCarnets } from '../../services/carnetsStore';
import { estLienSeul, lireCarnets, lireMessages, nomArticle, nouvelIdCarnet, titreDePhrase, type CarnetDoc } from '../../domain/carnets/modele';
import {
  archiverCarnet, basculerVeille, changerSorte, choisir, creerCarnet, detacherPlan, garderAPart, liensDe, liensQuiRetiennent, modifierNote,
  noteEnCritere, planDepuisChoix, poserSortie, ranger, remplacerRangement, renommer, supprimerCarnet, supprimerNote,
  type Destination, type EcritureCarnet, type Journal, type LigneARanger, type Resultat
} from '../../domain/carnets/operations';
import { consequenceApercu, critereQuiTranche, passe, tableau as tableauDe } from '../../domain/carnets/comparer';
import { analyserLigne, analyserTexte, PUCES_VA_DANS, vaDansDe, type LigneLocale, type RubriqueVaDans } from '../../domain/carnets/analyseLocale';
import { rattacher } from '../../domain/carnets/rattacher';
import { notesEnDouble } from '../../domain/carnets/doublons';
import type { CarnetPourIA, LigneCarnet } from '../../domain/carnets/ia';
import { aidesCourantes, comportementSimule, modeCarnet, type AidesCarnet, type ModeCarnetIA } from '../../config/carnetIA';
import { appelsSimules, creerRangement, planVrac, retourDuRangement, versLignesAnnoncees, type AppelsIA, type EtatRangement, type Rangement as Envoi } from './rangement';
import { ListeCarnets } from './ListeCarnets';
import { CarnetOuvert, type LienV, type RangeeV } from './CarnetOuvert';
import { ChampCarnet } from './ChampCarnet';
import { CadreArrivee, type CadreV } from './CadreArrivee';
import { Bandeau, type BandeauV, type TitreDe } from './Bandeau';
import { NoteEnVrac, type LigneVracV } from './NoteEnVrac';
import { FicheArticle } from './FicheArticle';
import { Comparer } from './Comparer';
import { Choisir } from './Choisir';
import { SupprimerCarnet } from './SupprimerCarnet';
import { FeuilleNote } from './FeuilleNote';
import { RenommerCarnet } from './RenommerCarnet';
import { EtatIA, montant, type ArticleV, type CarnetV } from './EtatIA';
import { reduirePhoto } from './photo';
import './carnets.css';

export interface FinancesCarnet { plans: FinancialPlan[]; transactions: FinanceTransaction[]; payments: FinancialPayment[] }

export interface CarnetsVueProps {
  className?: string;
  /** Le magasin ; défaut : Firestore (l'app). Le banc et les tests passent le magasin mémoire. */
  magasin?: MagasinCarnets;
  /** Plans, transactions, paiements (liens, Suppression v2) ; défaut : ceux de l'app. */
  finances?: FinancesCarnet;
  /** Écrit le plan d'À venir ; défaut : `FinanceService.saveUpgrade`. */
  ecrirePlan?: (plan: FinancialPlan) => Promise<void> | void;
  mode?: ModeCarnetIA;
  appels?: AppelsIA;
  aides?: AidesCarnet;
  /** Force hors ligne (banc `&hors-ligne=1`) ; sinon `navigator.onLine`. */
  horsLigne?: boolean;
  /** Ouvrir ce carnet (« Ouvrir le carnet » d'À venir, icône du calendrier) ; une idée archivée se rouvre aussi. */
  ouvrir?: { id: string; at: number } | null;
  /** + « Nouvelle idée » : le champ du bas prend le focus. */
  focusChamp?: number | null;
  onVoirAVenir?: () => void;
  onMessage?: (texte: string) => void;
  maintenant?: () => Date;
}

type Vue =
  | { sorte: 'liste' }
  | { sorte: 'carnet'; id: string }
  | { sorte: 'article'; id: string; articleId: string }
  | { sorte: 'comparer'; id: string }
  | { sorte: 'choisir'; id: string }
  | { sorte: 'renommer'; id: string }
  | { sorte: 'supprimer'; id: string };

interface Retour { bandeau: BandeauV; inverse: EcritureCarnet[]; messageId?: string; carnetId?: string; consequence?: string }

/**
 * Ce que le cadre « pendant » a annoncé, depuis la liste, et que l'envoi tient (vision 2, m390-1, m390-2, d1280-1) :
 * - `cree` : une phrase (pas un lien seul) crée SON carnet, sa phrase en titre (R10, R11 ; g5:v08-3, g5:v04-4). Le carnet proche de la
 *   bulle ne la prend que par « Y ajouter en façon ». L'IA met en forme dans ce carnet ; elle ne le retitre pas (son titre devient un
 *   titre proposé, G29) et ne range pas ailleurs ;
 * - `vrac` : chaque ligne d'une note va dans le carnet annoncé pour elle (R18, R19 ; `planVrac`). L'IA met en forme et type les lignes.
 * Un lien seul n'a pas d'annonce figée : le cadre dit « range le lien dans le carnet qui en parle, sinon dans un nouveau » (G21).
 */
type Annonce =
  | { sorte: 'cree'; carnetId: string; titre: string; phrase: string }
  | { sorte: 'vrac'; lignes: { texte: string; dest: Destination }[] };
const memeTexte = (x: string, y: string) => x.trim().localeCompare(y.trim(), 'fr', { sensitivity: 'base' }) === 0;

const lireFinances = (): FinancesCarnet => ({
  plans: FinanceService.getPlans(), transactions: StorageService.getTransactions() as unknown as FinanceTransaction[], payments: FinanceService.getPayments()
});
const versV = (c: CarnetDoc): CarnetV => c as unknown as CarnetV;
const titreSansBanc = (t: string) => t.replace(/^ZZ TEST — /, '');
/** G14 : le lien que tient le presse-papier, seulement si c'est un lien seul ; sans permission ou sans API, rien (refus silencieux). */
async function lirePresse(): Promise<string | undefined> {
  try {
    const t = (await navigator.clipboard?.readText?.())?.trim();
    if (!t) return undefined;
    const l = analyserTexte(t);
    return l.length === 1 && l[0].url ? l[0].url : undefined;
  } catch { return undefined; }
}
const plusieursLignes = (t: string) => t.split(/\r?\n/).filter(l => l.trim() !== '').length > 1;

/** Une ligne de l'analyse locale, rangée vers sa destination (picto local, Q19). */
export function depuisLocale(l: LigneLocale, dest: Destination): LigneARanger {
  if (l.sorte === 'article') {
    return { ...dest, sorte: 'article', origine: 'locale', lecture: l.url ? 'a-lire' : 'lue',
      ...(l.url ? { url: l.url, domaine: l.domaine } : { nom: l.texte }), ...(l.prixCentimes !== undefined ? { prixCentimes: l.prixCentimes, devise: l.devise } : {}) } as LigneARanger;
  }
  if (l.sorte === 'critere') return { ...dest, sorte: 'critere', texte: l.texte, origine: 'locale' } as LigneARanger;
  return { ...dest, sorte: 'note', texte: l.texte, genre: l.genre } as LigneARanger;
}

/** Une ligne validée de l'IA (ou de la simulation, « exemple »), rangée vers sa destination. Ce qu'elle ne lit pas reste absent. */
export function depuisIA(l: LigneCarnet, dest: Destination): LigneARanger {
  const origine = l.origine;
  switch (l.sorte) {
    case 'idee': return { ...dest, sorte: 'idee' } as LigneARanger;
    case 'critere': return { ...dest, sorte: 'critere', texte: l.texte, origine, ...(l.caracteristique ? { caracteristique: l.caracteristique } : {}) } as LigneARanger;
    case 'facon': return { ...dest, sorte: 'facon', nom: l.titre ?? l.texte, origine } as LigneARanger;
    case 'article': {
      const p = l.page;
      const lue = p ? p.statut === 'lue' : !l.url;
      const valeurs: Record<string, { valeur: string; unite?: string; origine: 'page' }> = {};
      for (const v of p?.valeurs ?? []) valeurs[v.nom] = { valeur: v.valeur, ...(v.unite ? { unite: v.unite } : {}), origine: 'page' };
      return {
        ...dest, sorte: 'article', origine, lecture: l.url ? (lue ? 'lue' : p ? 'illisible' : 'a-lire') : 'lue',
        ...(l.url ? { url: l.url } : {}), ...(p?.domaine ? { domaine: p.domaine } : {}),
        ...(p?.nom ?? l.titre ? { nom: p?.nom ?? l.titre } : !l.url ? { nom: l.texte } : {}),
        ...(l.prixCentimes !== undefined ? { prixCentimes: l.prixCentimes, devise: l.devise ?? 'CHF' } : {}),
        ...(l.vendeur ? { vendeur: l.vendeur } : {}), ...(p?.photo ? { photo: p.photo } : {}),
        ...(p?.dispo ? { dispo: p.dispo === 'en-stock' ? 'en stock' : 'rupture' } : {}),
        ...(Object.keys(valeurs).length ? { valeurs } : {})
      } as LigneARanger;
    }
    default: return { ...dest, sorte: 'note', texte: l.texte, ...(l.genre ? { genre: l.genre } : {}) } as LigneARanger;
  }
}

/** La forme compacte d'un carnet pour l'IA (au plus 30, les plus récents). */
function pourIA(carnets: readonly CarnetDoc[]): CarnetPourIA[] {
  return carnets.slice(0, 30).map(c => ({
    id: c.id, titre: c.title, criteres: c.carnet.criteres, facons: c.carnet.facons,
    articles: c.carnet.articles.map(a => ({ nom: a.nom, valeurs: a.valeurs })), notes: c.carnet.notes.map(n => ({ id: n.id, texte: n.texte }))
  }));
}

export function CarnetsVue(p: CarnetsVueProps) {
  const magasin = useMemo(() => p.magasin ?? magasinFirestore(), [p.magasin]);
  const [items, setItems] = useState(() => magasin.lire());
  useEffect(() => { setItems(magasin.lire()); return magasin.ecouter(() => setItems(magasin.lire())); }, [magasin]);
  const financesApp = useStorageValue(lireFinances);
  const finances = p.finances ?? financesApp;
  const mode = p.mode ?? modeCarnet();
  const aides = p.aides ?? aidesCourantes();
  const maintenant = useCallback(() => (p.maintenant ? p.maintenant() : new Date()), [p.maintenant]);
  const [enLigneNav, setEnLigneNav] = useState(() => typeof navigator === 'undefined' || navigator.onLine !== false);
  useEffect(() => {
    const maj = () => setEnLigneNav(navigator.onLine !== false);
    window.addEventListener('online', maj); window.addEventListener('offline', maj);
    return () => { window.removeEventListener('online', maj); window.removeEventListener('offline', maj); };
  }, []);
  const enLigne = !p.horsLigne && enLigneNav;

  const carnets = useMemo(() => lireCarnets(items), [items]);
  const tous = useMemo(() => lireCarnets(items, { archives: true }), [items]);
  const messages = useMemo(() => lireMessages(items), [items]);
  const [vue, setVue] = useState<Vue>({ sorte: 'liste' });
  const idOuvert = vue.sorte === 'liste' ? null : vue.id;
  const ouvert = idOuvert ? tous.find(c => c.id === idOuvert) ?? null : null;
  const [texte, setTexte] = useState('');
  const [etatR, setEtatR] = useState<EtatRangement<LigneLocale>>({ etape: 'repos' });
  const [retour, setRetour] = useState<Retour | null>(null);
  const [enTete, setEnTete] = useState<string | undefined>();
  const [vientDEtreCree, setVientDEtreCree] = useState<string | null>(null);
  const [supprime, setSupprime] = useState<{ titre: string; statut: CarnetDoc['status']; inverse: EcritureCarnet[] } | null>(null);
  const [noteSupprimee, setNoteSupprimee] = useState<{ id: string; inverse: EcritureCarnet[] } | null>(null);
  const [feuille, setFeuille] = useState<string | null>(null);
  const [edition, setEdition] = useState<string | null>(null);
  /** P5 (R13, G10) : la rubrique corrigée d'un toucher sur les puces « Va dans » ; elle prime sur le choix d'avance, jusqu'à l'envoi. */
  const [corrige, setCorrige] = useState<RubriqueVaDans | null>(null);
  /** La rubrique forcée de l'envoi en cours : lue par `ecrireLocal`, puis `ecrireIA` ne reprend pas ce message (sa correction est un choix). */
  const aForcer = useRef<RubriqueVaDans | null>(null);
  const forcee = useRef<string | null>(null);
  /** G14 (R15) : le lien que le presse-papier tient, lu au focus du champ ; refus silencieux. */
  const [presse, setPresse] = useState<string | undefined>();
  const champRef = useRef<HTMLTextAreaElement>(null);
  /** P1, P2 : le retour de l'écriture locale, tenu en réserve tant que l'IA peut la remplacer ; montré seulement si elle échoue ou est coupée. */
  const attente = useRef<{ messageId: string; retour: Retour; montre?: boolean } | null>(null);
  /** L'annonce tenue par chaque envoi en cours (créer, note en vrac), lue par `ecrireIA`. */
  const annonces = useRef(new Map<string, Annonce>());
  /** L'envoi en cours : ✕ le coupe même si la vue a changé entre-temps (le carnet neuf ouvert recrée le déroulé). */
  const envoiActif = useRef<{ envoi: Envoi<LigneLocale>; depuis: string | null } | null>(null);

  useEffect(() => { if (p.ouvrir) { setVue({ sorte: 'carnet', id: p.ouvrir.id }); setRetour(null); } }, [p.ouvrir?.at]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (p.focusChamp) champRef.current?.focus(); }, [p.focusChamp]);
  // P12 : la note en modification a disparu (supprimée, ou autre vue) : le mode se referme et le texte qu'il avait mis dans le champ part.
  useEffect(() => {
    if (edition && !(ouvert && vue.sorte === 'carnet' && ouvert.carnet.notes.some(n => n.id === edition))) { setEdition(null); setTexte(''); }
  }, [edition, ouvert, vue.sorte]);
  // Le carnet ouvert a disparu (supprimé ailleurs) : retour à la liste.
  useEffect(() => { if (idOuvert && !ouvert) setVue({ sorte: 'liste' }); }, [idOuvert, ouvert]);
  // Un retour « ✓ … · Annuler » reste au moins 8 s (Q18 : 5 s au moins), puis s'efface.
  useEffect(() => { if (!retour) return; const t = setTimeout(() => setRetour(null), 8000); return () => clearTimeout(t); }, [retour]);

  /** Applique une intention ; un refus est dit, rien n'est écrit. */
  const appliquer = useCallback((r: Resultat): (Resultat & { ok: true }) | null => {
    if (!r.ok) { p.onMessage?.((r as { raison: string }).raison); return null; }
    magasin.appliquer(r.ecritures, r.journal as Journal | undefined);
    return r;
  }, [magasin, p.onMessage]);
  const annuler = (inverse: EcritureCarnet[]) => { if (inverse.length) magasin.appliquer(inverse); };

  /**
   * P1, P2 : le retour « après » se lit sur les effets du message tels qu'ils sont au bout du compte (magasin), jamais sur l'écriture
   * locale que l'IA a remplacée. Carnet créé (R11, g5:v04-4), rangé ici (R14, g5:v03-8), rangé dans un autre carnet avec le message cité et
   * l'article (G21, g5:v06-14, état 20), ou n lignes dans m carnets (R19, g5:v01-16). `inverse` : tout ce qu'Annuler défait.
   */
  const retourDe = useCallback((messageId: string, txt: string, depuisM: string | null, inverse: EcritureCarnet[], lignesIA?: readonly LigneCarnet[]): Retour | null => {
    const etat = magasin.lire();
    const effets = lireMessages(etat).find(m => m.id === messageId)?.carnetMessage.effets ?? [];
    const rr = retourDuRangement(effets, { depuis: depuisM, plusieursLignes: plusieursLignes(txt) });
    if (!rr) return null;
    if (rr.sorte === 'vrac') return { bandeau: { sorte: 'vrac', lignes: rr.lignes, carnets: rr.carnets }, inverse, messageId };
    if (rr.sorte === 'range') return { bandeau: { sorte: 'range' }, inverse, messageId, carnetId: rr.carnetId };
    const c = lireCarnets(etat, { archives: true }).find(x => x.id === rr.carnetId);
    if (rr.sorte === 'cree') {
      const titre = c?.title ?? '';
      const nomLu = c?.carnet.articles.some(a => a.nom && a.nom === titre);
      /* « Embouteillage » pour « embouteillage » reste sa phrase en titre (g5:v04-4) : casse, accents et espaces ne comptent pas */
      const pareil = (x: string, y: string) => x.trim().localeCompare(y.trim(), 'fr', { sensitivity: 'base' }) === 0;
      const titreDe: TitreDe = pareil(titre, titreDePhrase(txt)) ? (estLienSeul(txt) ? 'site' : 'phrase') : nomLu ? 'page' : 'ia';
      return { bandeau: { sorte: 'cree', phrase: txt, titreDe }, inverse, messageId, carnetId: rr.carnetId };
    }
    const effet = effets.find(e => e.cible === 'article' && e.carnetId === rr.carnetId);
    const a = effet ? c?.carnet.articles.find(x => x.id === effet.id) : undefined;
    const prix = a ? montant(a.prixCentimes) : null;
    const detail = a ? [a.nom ? a.domaine ?? a.vendeur : a.vendeur, a.pays].filter(Boolean).join(' · ') : '';
    const raison = lignesIA?.find(l => l.carnetId === rr.carnetId && l.raisonCarnet)?.raisonCarnet;
    const bandeau: BandeauV = {
      sorte: 'ailleurs', carnet: titreSansBanc(c?.title ?? 'un autre carnet'), cite: txt, ...(raison ? { raison } : {}),
      ...(a ? { article: { nom: nomArticle(a), ...(detail ? { detail } : {}), ...(prix ? { prix: `${prix} ${a.devise ?? 'CHF'}` } : {}), ...(a.origine === 'exemple' ? { exemple: true } : {}) } } : {})
    };
    return { bandeau, inverse, messageId, ...(depuisM ? { carnetId: depuisM } : {}) };
  }, [magasin]);

  /* ---------- le fil : un champ, l'IA met en forme et range ---------- */
  const depuis = ouvert && vue.sorte !== 'liste' ? ouvert.id : null;
  const rangement = useMemo(() => creerRangement<LigneLocale>({
    mode, depuis,
    carnets: () => pourIA(lireCarnets(magasin.lire())),
    enLigne: () => enLigne,
    analyseLocale: analyserTexte,
    appels: p.appels ?? (mode === 'simule' ? appelsSimules(comportementSimule()) : undefined),
    maintenant,
    surEtat: e => {
      setEtatR(e);
      /* l'IA a échoué ou a été coupée : l'écriture locale reste, son retour paraît enfin (avec son Annuler) */
      if ((e.etape === 'echec' || e.etape === 'annule') && attente.current?.messageId === e.messageId) {
        const { retour: local, montre } = attente.current;
        attente.current = null;
        annonces.current.delete(e.messageId);
        if (!montre) setRetour(local);
      }
    },
    ecrireLocal: (txt, lignes, { iaAttendue }) => {
      const etat = magasin.lire();
      const le = maintenant().toISOString();
      const message = { id: nouvelIdCarnet('MSG'), texte: txt, le, depuis: depuis ?? 'liste', rangement: 'locale' as const };
      let r: Resultat;
      let neuf: string | null = null;
      const force = aForcer.current; aForcer.current = null;
      if (depuis && force && lignes.length === 1 && lignes[0].sorte !== 'article') {
        const l0 = lignes[0];
        const ligne: LigneARanger = force === 'critere' ? { carnetId: depuis, sorte: 'critere', texte: l0.texte, origine: 'vous' }
          : force === 'facon' ? { carnetId: depuis, sorte: 'facon', nom: l0.texte, origine: 'vous' }
          : { carnetId: depuis, sorte: 'note', texte: l0.texte, ...(l0.sorte === 'note' ? { genre: l0.genre } : {}) };
        r = ranger(etat, { message, lignes: [ligne] });
        forcee.current = message.id;
      } else if (depuis) r = ranger(etat, { message, lignes: lignes.map(l => depuisLocale(l, { carnetId: depuis })) });
      let annonce: Annonce | null = null;
      if (depuis) { /* rangé ci-dessus */ } else if (lignes.length <= 1) {
        neuf = nouvelIdCarnet('CARNET');
        const titre = titreDePhrase(txt);
        r = creerCarnet(etat, { id: neuf, message, lignes: lignes.filter(l => l.sorte !== 'note').map(l => depuisLocale(l, { carnetNeuf: { id: neuf!, titre } })) });
        if (!estLienSeul(txt)) annonce = { sorte: 'cree', carnetId: neuf, titre, phrase: txt };
      } else {
        /* la découpe annoncée par le cadre (même `planVrac`, mêmes carnets) : chaque ligne là où elle a été annoncée */
        const cs = lireCarnets(etat);
        const plan = planVrac(lignes, t => rattacher(t, cs));
        const neufVrac = plan.titreNeuf ? { id: nouvelIdCarnet('CARNET'), titre: plan.titreNeuf } : null;
        const dests: Destination[] = plan.lignes.map(x => (x.carnetId ? { carnetId: x.carnetId } : { carnetNeuf: neufVrac! }));
        r = ranger(etat, { message, lignes: lignes.map((l, i) => depuisLocale(l, dests[i])) });
        annonce = { sorte: 'vrac', lignes: lignes.map((l, i) => ({ texte: l.texte, dest: dests[i] })) };
      }
      const fait = appliquer(r!);
      if (!fait) throw new Error((r! as { raison?: string }).raison ?? 'refus');
      const local = retourDe(message.id, txt, depuis, fait.inverse) ?? { bandeau: { sorte: 'range' }, inverse: fait.inverse, messageId: message.id };
      /* L'IA va tourner : son rangement peut remplacer celui-ci (P1, P2) ; le retour attend la fin, rien n'est annoncé qui pourrait mentir.
         Sauf quand la cible est annoncée et tenue (créer, note en vrac) : l'IA ne fait que mettre en forme, le retour paraît tout de suite. */
      if (annonce && iaAttendue) annonces.current.set(message.id, annonce);
      const definitif = annonce !== null;
      if (iaAttendue) attente.current = { messageId: message.id, retour: local, montre: definitif };
      if (!iaAttendue || definitif) setRetour(local);
      if (neuf) { setEnTete(neuf); setVientDEtreCree(neuf); setVue({ sorte: 'carnet', id: neuf }); }
      return { messageId: message.id };
    },
    ecrireIA: (messageId, lignes, mode2) => {
      if (forcee.current === messageId) {
        /* sa correction « Va dans » est un choix : l'IA ne la défait pas ; le retour local, tenu en réserve, paraît */
        forcee.current = null;
        const local = attente.current?.messageId === messageId ? attente.current.retour : null;
        attente.current = null;
        if (local) setRetour(local);
        return;
      }
      const etat = magasin.lire();
      const msg = lireMessages(etat).find(m => m.id === messageId);
      const creePar = msg?.carnetMessage.effets.find(e => e.cible === 'carnet')?.carnetId;
      const an = annonces.current.get(messageId);
      annonces.current.delete(messageId);
      const txt = msg?.carnetMessage.texte ?? '';
      let aRanger: LigneARanger[];
      let propose: { carnetId: string; titre: string } | undefined;
      if (an?.sorte === 'cree') {
        /* m390-1, d1280-1, L4-7 : tout reste dans SON carnet, sous sa phrase ; un autre titre de l'IA devient un titre proposé (G29) */
        const dest: Destination = { carnetNeuf: { id: an.carnetId, titre: an.titre } };
        aRanger = [{ ...dest, sorte: 'idee' } as LigneARanger,
          ...lignes.filter(l => l.sorte !== 'idee' && !(l.sorte === 'note' && memeTexte(l.texte, an.phrase))).map(l => depuisIA(l, dest))];
        const titreIA = lignes.find(l => l.sorte === 'idee')?.titre ?? lignes.find(l => l.carnetNeuf)?.carnetNeuf ?? lignes.find(l => l.titrePropose)?.titrePropose;
        if (titreIA && !memeTexte(titreIA, an.titre)) propose = { carnetId: an.carnetId, titre: titreIA };
      } else if (an?.sorte === 'vrac') {
        /* m390-2 : la découpe annoncée est appliquée ligne par ligne ; l'IA type et met en forme, elle ne change pas la cible */
        const utiles = lignes.filter(l => l.sorte !== 'idee');
        const idx = versLignesAnnoncees(utiles.map(l => l.texte), an.lignes.map(x => x.texte));
        aRanger = utiles.map((l, i) => depuisIA(l, an.lignes[idx[i]]?.dest ?? an.lignes[0].dest));
        const neufVrac = an.lignes.find(x => x.dest.carnetNeuf)?.dest.carnetNeuf;
        const titreIA = neufVrac ? utiles.find((l, i) => an.lignes[idx[i]]?.dest.carnetNeuf && l.carnetNeuf)?.carnetNeuf : undefined;
        if (neufVrac && titreIA && !memeTexte(titreIA, neufVrac.titre)) propose = { carnetId: neufVrac.id, titre: titreIA };
      } else {
        const neufs = new Map<string, string>();
        /* un lien seul qui ouvre un carnet : le nom lu sur sa page, sinon son domaine (R16, R17 ; g5:v03-10, g5:v06-10) */
        const pageLue = lignes.find(l => l.sorte === 'article' && l.page)?.page;
        const titreLien = !depuis && estLienSeul(txt) ? (pageLue?.statut === 'lue' && pageLue.nom ? pageLue.nom : titreDePhrase(txt)) : null;
        const dest = (l: LigneCarnet): Destination => {
          if (l.carnetId) return { carnetId: l.carnetId };
          if (depuis && !l.carnetNeuf) return { carnetId: depuis };
          const titre = titreLien ?? l.carnetNeuf ?? l.titre ?? titreDePhrase(l.texte);
          if (!neufs.has(titre)) neufs.set(titre, neufs.size === 0 && creePar ? creePar : nouvelIdCarnet('CARNET'));
          return { carnetNeuf: { id: neufs.get(titre)!, titre } };
        };
        aRanger = lignes.map(l => depuisIA(l, dest(l)));
        const p2 = lignes.find(l => l.titrePropose && l.carnetId);
        if (p2) propose = { carnetId: p2.carnetId!, titre: p2.titrePropose! };
      }
      const r = remplacerRangement(etat, { messageId, rangement: mode2, lignes: aRanger, ...(propose ? { titrePropose: propose } : {}) });
      const fait = appliquer(r);
      const enAttente = attente.current?.messageId === messageId ? attente.current : null;
      const local = enAttente?.retour ?? null;
      attente.current = null;
      if (!fait) { if (local && !enAttente?.montre) setRetour(local); return; }
      /* Annuler défait le rangement réel : l'écriture de l'IA, puis l'écriture locale qu'elle a remplacée. */
      const final = retourDe(messageId, txt, depuis, [...fait.inverse, ...(local?.inverse ?? [])], lignes);
      /* le retour tenu en réserve paraît aussi quand l'IA réussit sans rien d'autre à dire (d1280-1) */
      if (!final) { if (local && !enAttente?.montre) setRetour(local); return; }
      setRetour(final);
      if (final.bandeau.sorte === 'cree' && final.carnetId) {
        setEnTete(final.carnetId); setVientDEtreCree(final.carnetId);
        if (!depuis && !enAttente?.montre) setVue({ sorte: 'carnet', id: final.carnetId });
      } else if (final.bandeau.sorte === 'vrac') {
        /* la note en vrac reste sur la liste, avec ses lignes rangées (g5:v01-16) */
      } else if (!depuis) {
        /* rangé dans un carnet existant (ou en vrac) : le carnet local a disparu ; retour à la liste, sans carte « créée » en tête */
        setEnTete(undefined); setVientDEtreCree(null); setVue({ sorte: 'liste' });
      }
    }
  }), [mode, depuis, enLigne, magasin, appliquer, maintenant, p.appels, retourDe]);

  const lignesApercu = useMemo(() => (texte.trim() ? analyserTexte(texte) : []), [texte]);
  const envoyer = async () => {
    const txt = texte.trim();
    if (!txt) return;
    if (edition && ouvert) {
      const r = appliquer(modifierNote(magasin.lire(), { carnetId: ouvert.id, noteId: edition, texte: txt, le: maintenant().toISOString() }));
      if (r) setRetour({ bandeau: { sorte: 'modifiee' }, inverse: r.inverse, carnetId: ouvert.id });
      setEdition(null); setTexte(''); return;
    }
    aForcer.current = depuis && !edition ? corrige : null; setCorrige(null); setPresse(undefined);
    setTexte('');
    envoiActif.current = { envoi: rangement, depuis };
    try { await rangement.envoyer(txt); } catch { setTexte(txt); }
  };
  const couperEnvoi = () => (envoiActif.current?.envoi ?? rangement).annuler();
  const photo = async (fichier: File) => {
    const jpeg = await reduirePhoto(fichier);
    if (!jpeg) { p.onMessage?.('Photo illisible : rien n’a été rangé.'); return; }
    const etat = magasin.lire();
    const message = { id: nouvelIdCarnet('MSG'), texte: 'photo', le: maintenant().toISOString(), depuis: depuis ?? 'liste', rangement: 'brut' as const };
    const dest: Destination = depuis ? { carnetId: depuis } : { carnetNeuf: { id: nouvelIdCarnet('CARNET'), titre: 'Photo' } };
    const r = appliquer(ranger(etat, { message, lignes: [{ ...dest, sorte: 'photo', jpeg } as LigneARanger] }));
    if (r) setRetour({ bandeau: { sorte: 'range' }, inverse: r.inverse, messageId: message.id });
  };

  /* ---------- calculs passés aux vues (R44, R45, R47) ---------- */
  const tranche = ouvert ? critereQuiTranche(ouvert) : null;
  const suggestion = tranche ? { critere: tranche.critere.texte, a: tranche.entre[0], b: tranche.entre[1] } : null;
  const consequence = ouvert && lignesApercu.length ? consequenceApercu(ouvert, lignesApercu) : null;
  const auto = ouvert && vue.sorte === 'carnet' && !edition ? vaDansDe(texte) : null;
  const rubriqueChoisie = auto ? corrige ?? auto : null;
  const RUBRIQUE_LIBELLE = { critere: 'Ce qui compte', facon: 'Façons', note: 'Notes' } as const;
  const liens: LienV[] = ouvert ? liensDe(ouvert, finances.plans, finances.transactions, finances.payments) : [];
  /* R26 : le tableau vient de `comparer.ts`, passé tel quel aux vues ; `null` à 0 ou 1 article. */
  const tableauV = ouvert ? tableauDe(ouvert) : null;

  const cadre = (): React.ReactNode => {
    if (etatR.etape === 'en-cours') {
      if (etatR.lecture) {
        const c: CadreV = { sorte: 'lien', url: etatR.lecture.url, phase: 'lecture', depuisListe: (envoiActif.current?.depuis ?? depuis) === null };
        return <CadreArrivee cadre={c} onAnnuler={couperEnvoi} aides={aides} />;
      }
      return <EtatIA etat="en-cours" quoi={etatR.texte} onAnnuler={couperEnvoi} />;
    }
    if (etatR.etape === 'echec' || etatR.etape === 'hors-ligne') return <EtatIA etat={etatR.etape} quoi={etatR.avis} />;
    if (edition && ouvert) {
      const fermer = () => { setEdition(null); setTexte(''); };
      return <CadreArrivee cadre={{ sorte: 'modifier', onSupprimer: () => { const r = appliquer(supprimerNote(magasin.lire(), { carnetId: ouvert.id, noteId: edition })); if (r) setNoteSupprimee({ id: edition, inverse: r.inverse }); fermer(); } }} onAnnuler={fermer} aides={aides} />;
    }
    if (!texte.trim()) return null;
    if (!depuis) {
      if (lignesApercu.length > 1) {
        /* la découpe annoncée : celle que l'envoi appliquera (même `planVrac`) ; le compteur compte le carnet neuf une fois */
        const plan = planVrac(lignesApercu, t => rattacher(t, carnets));
        const lignes: LigneVracV[] = plan.lignes.map((x, i) => ({ id: String(i), texte: x.ligne.texte, genre: x.ligne.genre,
          ...(x.carnetId ? { carnetId: x.carnetId, carnetTitre: titreSansBanc(x.titre) } : { carnetTitre: titreSansBanc(x.titre), neuf: true }) }));
        return <NoteEnVrac etat="pendant" lignes={lignes} texteOrigine={texte} origine="locale" nbCarnets={plan.carnets} onAnnuler={() => setTexte('')} />;
      }
      const pr = rattacher(texte, carnets);
      const critere = lignesApercu.find(l => l.sorte === 'critere');
      const c: CadreV = { sorte: 'creer', titre: titreDePhrase(texte),
        proche: pr ? { titre: titreSansBanc(pr.titre), onAjouter: () => setVue({ sorte: 'carnet', id: pr.carnetId }) } : null,
        ...(pr ? {} : { raisonNeuf: !estLienSeul(texte)
          ? `Aucun de vos ${carnets.length} carnets n’en parle : nouveau carnet, votre phrase en titre`
          : mode !== 'eteint' && enLigne
            ? 'L’IA lit la page, puis range le lien dans le carnet qui en parle, sinon dans un nouveau, au nom de la page'
            : `Aucun de vos ${carnets.length} carnets n’en parle : nouveau carnet, le site en titre` }),
        ...(critere ? { ceQuiCompte: critere.texte } : {}) };
      return <CadreArrivee cadre={c} onAnnuler={() => setTexte('')} aides={aides} />;
    }
    const l0 = lignesApercu[0];
    if (l0?.url) return <CadreArrivee cadre={{ sorte: 'lien', url: l0.url, phase: 'avant' }} onAnnuler={() => setTexte('')} aides={aides} />;
    const rubrique = rubriqueChoisie ? RUBRIQUE_LIBELLE[rubriqueChoisie] : l0?.sorte === 'critere' ? 'Ce qui compte' : l0?.sorte === 'article' ? 'Articles' : 'Notes';
    return <CadreArrivee cadre={{ sorte: 'texte', rubrique, texte, origine: 'locale' }} onAnnuler={() => setTexte('')} consequence={consequence} aides={aides} />;
  };
  /**
   * R14, R17, R25 : la ligne qu'un message vient de ranger dans le carnet ouvert s'éclaire à sa place, sa phrase citée dessous ; pour un
   * article lu sur sa page, la carte complète (« lu sur la page : … », « tient 80 °C : oui »). Un seul effet dans ce carnet, sinon le
   * bandeau seul (note en vrac, critère fusionné).
   */
  const rangee: RangeeV | null = (() => {
    if (!retour?.messageId || !ouvert || vue.sorte !== 'carnet' || retour.bandeau.sorte !== 'range') return null;
    const msg = messages.find(m => m.id === retour.messageId);
    const effets = (msg?.carnetMessage.effets ?? []).filter(e => e.carnetId === ouvert.id && e.cible !== 'carnet' && e.cible !== 'photo');
    if (effets.length !== 1) return null;
    const e = effets[0];
    const base = { cible: e.cible as RangeeV['cible'], id: e.id, phrase: msg!.carnetMessage.texte, onAnnuler: () => { annuler(retour.inverse); setRetour(null); } };
    if (e.cible !== 'article') return ['critere', 'facon', 'note'].includes(e.cible) && ouvert.carnet[e.cible === 'critere' ? 'criteres' : e.cible === 'facon' ? 'facons' : 'notes'].some(x => x.id === e.id) ? base : null;
    const a = ouvert.carnet.articles.find(x => x.id === e.id);
    if (!a || a.lecture !== 'lue' || !a.url) return null;
    const luSurPage = [a.nom && 'nom', a.prixCentimes !== undefined && 'prix', a.photo && 'photo', ...Object.keys(a.valeurs)].filter((x): x is string => !!x);
    const k = ouvert.carnet.criteres.find(x => x.caracteristique?.sens === 'oui-non' && passe(a, x) !== null);
    const verdict = k ? `${k.caracteristique!.nom} : ${passe(a, k) ? 'oui' : 'non'}` : undefined;
    return { ...base, luSurPage, ...(verdict ? { verdict } : {}) };
  })();
  /** Annuler un retour : l'IA encore en route pour ce message est coupée d'abord (rien n'est réécrit après), puis tout est défait. */
  const annulerRetour = (rt: Retour) => {
    if (rt.messageId && attente.current?.messageId === rt.messageId) {
      attente.current = null;
      annonces.current.delete(rt.messageId);
      couperEnvoi();
    }
    annuler(rt.inverse); setRetour(null);
    /* le carnet créé n'existe plus : retour à la liste (s'il était ouvert, l'effet « carnet disparu » le fait aussi) */
    if (rt.bandeau.sorte === 'cree') { setEnTete(undefined); setVientDEtreCree(null); if (!depuis || depuis === rt.carnetId) setVue({ sorte: 'liste' }); }
  };
  /**
   * R19 (g5:v01-16) : la note en vrac, après. « ✓ n lignes rangées dans m carnets · Annuler », chaque ligne avec son type et son carnet,
   * « › Texte d'origine ». Lu sur les effets du message tels qu'ils sont (n et m comptés là, les mêmes que pendant quand l'IA a suivi
   * l'annonce).
   */
  const vracApres = (rt: Retour): React.ReactNode => {
    const msg = messages.find(m => m.id === rt.messageId);
    if (!msg) return null;
    const effets = msg.carnetMessage.effets;
    const crees = new Set(effets.filter(e => e.cible === 'carnet').map(e => e.carnetId));
    const lignes: LigneVracV[] = effets.filter(e => e.cible !== 'carnet' && e.cible !== 'photo').flatMap(e => {
      const c = tous.find(x => x.id === e.carnetId);
      if (!c) return [];
      const d = c.carnet;
      const el = e.cible === 'note' ? d.notes.find(x => x.id === e.id) : undefined;
      const texteL = el?.texte ?? (e.cible === 'critere' ? d.criteres.find(x => x.id === e.id)?.texte
        : e.cible === 'facon' ? d.facons.find(x => x.id === e.id)?.nom
          : e.cible === 'article' ? (() => { const a = d.articles.find(x => x.id === e.id); return a ? nomArticle(a) : undefined; })() : undefined);
      if (!texteL) return [];
      const genre = (el?.genre ?? (e.cible === 'article' ? 'a-acheter' : 'note')) as LigneVracV['genre'];
      return [{ id: e.id, texte: texteL, genre, carnetId: c.id, carnetTitre: titreSansBanc(c.title), neuf: crees.has(c.id) }];
    });
    const origine = msg.carnetMessage.rangement === 'ia' ? 'ia' : msg.carnetMessage.rangement === 'simulee' ? 'exemple' : 'locale';
    return <NoteEnVrac etat="apres" lignes={lignes} texteOrigine={msg.carnetMessage.texte} origine={origine}
      nbCarnets={new Set(lignes.map(l => l.carnetId)).size} onAnnuler={() => annulerRetour(rt)} />;
  };
  const bandeauNode = retour && !rangee && (!retour.carnetId || retour.carnetId === idOuvert || vue.sorte === 'liste')
    ? retour.bandeau.sorte === 'vrac' && retour.messageId && vue.sorte === 'liste'
      ? vracApres(retour)
      : <Bandeau bandeau={retour.bandeau} onAnnuler={() => annulerRetour(retour)} aideConsequence={aides.consequence} />
    : null;

  const champ = (
    <ChampCarnet valeur={texte} inputRef={champRef}
      onChange={t => { setTexte(t); if (!t.trim()) setCorrige(null); if (!edition) rangement.taper(t); }}
      onEnvoyer={() => void envoyer()}
      {...(ouvert && vue.sorte === 'carnet' ? { titreCarnet: titreSansBanc(ouvert.title), libelleEnvoi: edition ? 'Enregistrer' : 'Ajouter' } : {})}
      onPhoto={f => void photo(f)}
      suggestion={vue.sorte === 'carnet' ? suggestion : null}
      vaDans={auto ? { options: [...PUCES_VA_DANS], choisi: rubriqueChoisie!, onChoisir: id => setCorrige(id as RubriqueVaDans) } : null}
      coller={presse} onColler={() => { if (presse) { setTexte(presse); rangement.taper(presse); setPresse(undefined); } }}
      onFocusChamp={() => { void lirePresse().then(setPresse); }}
      desactive={vue.sorte === 'supprimer'} />
  );

  /* ---------- écrans ---------- */
  let ecran: React.ReactNode;
  if (!ouvert || vue.sorte === 'liste') {
    ecran = <ListeCarnets carnets={carnets.map(versV)} enTete={enTete}
      supprime={supprime ? { titre: titreSansBanc(supprime.titre), statut: supprime.statut, onAnnuler: () => { annuler(supprime.inverse); setSupprime(null); } } : null}
      enHaut={<>{bandeauNode}{cadre()}</>}
      onOuvrir={id => { setVue({ sorte: 'carnet', id }); setRetour(null); }}
      onCollerLien={id => { setVue({ sorte: 'carnet', id }); setTimeout(() => champRef.current?.focus(), 0); }}
      onVoirAVenir={() => p.onVoirAVenir?.()}
      onExemple={t => { setTexte(t); rangement.taper(t); champRef.current?.focus(); }} />;
  } else if (vue.sorte === 'article') {
    const a = ouvert.carnet.articles.find(x => x.id === vue.articleId);
    const ligne = tableauV?.lignes.find(l => l.articleId === vue.articleId);
    ecran = a ? <FicheArticle article={a as unknown as ArticleV} titreCarnet={titreSansBanc(ouvert.title)} critere={ouvert.carnet.criteres[0]}
      facon={ouvert.carnet.facons.find(f => f.id === a.faconId)} {...(ligne?.rang ? { rang: ligne.rang, sur: tableauV!.lignes.filter(l => !l.ecarte).length } : {})}
      choisi={ouvert.carnet.choix?.articleId === a.id}
      onRetour={() => setVue({ sorte: 'carnet', id: ouvert.id })}
      onVeille={() => { appliquer(basculerVeille(magasin.lire(), { carnetId: ouvert.id, articleId: a.id, le: maintenant().toISOString() })); }}
      onChoisir={() => setVue({ sorte: 'choisir', id: ouvert.id })} /> : null;
  } else if (vue.sorte === 'comparer') {
    ecran = <Comparer titre={titreSansBanc(ouvert.title)} statut={ouvert.status} critere={ouvert.carnet.criteres[0]} tableau={tableauV}
      onRetour={() => setVue({ sorte: 'carnet', id: ouvert.id })} onOuvrirArticle={articleId => setVue({ sorte: 'article', id: ouvert.id, articleId })}
      onChoisir={() => setVue({ sorte: 'choisir', id: ouvert.id })} />;
  } else if (vue.sorte === 'choisir') {
    const choix = ouvert.carnet.choix;
    const nom = (id: string) => { const a = ouvert.carnet.articles.find(x => x.id === id); return a?.nom ?? a?.domaine ?? 'lien'; };
    if (choix) {
      const a = ouvert.carnet.articles.find(x => x.id === choix.articleId)!;
      ecran = <Choisir etape="choisi" titre={titreSansBanc(ouvert.title)} choix={choix as never} article={a as unknown as ArticleV} critere={ouvert.carnet.criteres[0]}
        facon={ouvert.carnet.facons.find(f => f.id === (choix.faconId ?? a?.faconId))} ecartes={choix.ecartes.map(e => ({ nom: nom(e.articleId), raison: e.raison }))}
        remplaces={choix.remplaces.map(r => ({ nom: nom(r.articleId), pourquoi: r.pourquoi, le: r.le }))} sortie={ouvert.carnet.sortie ?? null}
        onRetour={() => setVue({ sorte: 'carnet', id: ouvert.id })} onEnvoyerAVenir={() => void envoyerAVenir(ouvert)} onVoirAVenir={() => p.onVoirAVenir?.()} />;
    } else {
      const rangees = (tableauV?.lignes ?? []).filter(l => !l.ecarte);
      const premier = ouvert.carnet.articles.find(x => x.id === rangees[0]?.articleId) ?? ouvert.carnet.articles[0];
      ecran = premier ? <Choisir etape="choisir" titre={titreSansBanc(ouvert.title)} article={premier as unknown as ArticleV} sur={Math.max(rangees.length, 1)} valeurs={[]}
        autres={rangees.slice(1).map((l, i) => ({ article: ouvert.carnet.articles.find(x => x.id === l.articleId) as unknown as ArticleV, rang: l.rang ?? i + 2 }))}
        onRetour={() => setVue({ sorte: 'carnet', id: ouvert.id })}
        onChoisir={pourquoi => { const r = appliquer(choisir(magasin.lire(), { carnetId: ouvert.id, articleId: premier.id, ...(premier.faconId ? { faconId: premier.faconId } : {}), pourquoi, le: maintenant().toISOString() })); if (r) setRetour({ bandeau: { sorte: 'range' }, inverse: r.inverse, carnetId: ouvert.id }); }}
        onEcarter={() => setVue({ sorte: 'comparer', id: ouvert.id })} /> : null;
    }
  } else if (vue.sorte === 'renommer') {
    const prop = [...messages].reverse().find(m => m.carnetMessage.titrePropose?.carnetId === ouvert.id && !m.carnetMessage.titrePropose.applique);
    ecran = <RenommerCarnet titre={ouvert.title} aides={aides}
      proposition={prop ? { titre: prop.carnetMessage.titrePropose!.titre, phrase: prop.carnetMessage.texte } : null}
      onRenommer={titre => { const r = appliquer(renommer(magasin.lire(), { carnetId: ouvert.id, titre, ...(prop ? { messageId: prop.id } : {}) })); setVue({ sorte: 'carnet', id: ouvert.id }); if (r) setRetour({ bandeau: { sorte: 'renomme', avant: titreSansBanc(r.avant ?? ouvert.title) }, inverse: r.inverse, carnetId: ouvert.id }); }}
      onAnnuler={() => setVue({ sorte: 'carnet', id: ouvert.id })} />;
  } else {
    const c = ouvert;
    const note = feuille ? c.carnet.notes.find(n => n.id === feuille) : undefined;
    const enVeille = c.carnet.articles.filter(a => a.veille?.active).map(a => a.id);
    const proche = vue.sorte === 'supprimer' && enVeille.length ? rattacher(`${c.title} ${c.carnet.phrase}`, carnets.filter(x => x.id !== c.id)) : null;
    const finance = { plans: finances.plans, transactions: finances.transactions, payments: finances.payments };
    /* P9 (g4:v02-18) : la carte de suppression prend la place du bandeau, sous le titre et la phrase, au-dessus de Ce qui compte : à
       l'écran sans défiler ; le reste du carnet est estompé derrière (`.cn-grise`, qui épargne `.cn-supprimer`). */
    const carteSupprimer = vue.sorte !== 'supprimer' ? null : <SupprimerCarnet titre={titreSansBanc(c.title)} contenu={c.carnet as never}
      liens={liensQuiRetiennent(c, finance.plans, finance.transactions, finance.payments)}
      proche={proche ? { titre: titreSansBanc(proche.titre), onDeplacer: () => { void import('../../domain/carnets/operations').then(m => appliquer(m.deplacerArticles(magasin.lire(), { depuis: c.id, vers: proche.carnetId, articleIds: enVeille }))); } } : null}
      onDetacher={() => { appliquer(detacherPlan(magasin.lire(), { carnetId: c.id, ...finance })); }}
      onArchiver={() => { const r = appliquer(archiverCarnet(magasin.lire(), { carnetId: c.id, le: maintenant().toISOString(), raison: 'plan réalisé' })); if (r) { setVue({ sorte: 'liste' }); setRetour({ bandeau: { sorte: 'range' }, inverse: r.inverse }); } }}
      onSupprimer={() => { const r = appliquer(supprimerCarnet(magasin.lire(), { carnetId: c.id, ...finance })); if (r) { setSupprime({ titre: c.title, statut: c.status, inverse: r.inverse }); setVue({ sorte: 'liste' }); } }}
      onGarder={() => setVue({ sorte: 'carnet', id: c.id })} />;
    ecran = <>
      <CarnetOuvert carnet={versV(c)} aides={aides as never} liens={liens} tableau={tableauV} bandeau={carteSupprimer ?? bandeauNode} rangee={carteSupprimer ? null : rangee} cadre={carteSupprimer ? null : cadre()}
        vientDEtreCree={vientDEtreCree === c.id} doublons={aides.doublon ? notesEnDouble(c).flat() : []}
        noteSupprimee={noteSupprimee ? { id: noteSupprimee.id, onAnnuler: () => { annuler(noteSupprimee.inverse); setNoteSupprimee(null); } } : null}
        feuille={note ? { noteId: note.id, contenu: <FeuilleNote note={note as never} aides={aides as never}
          ressembleCritere={aides.noteEnCritere && analyserLigne(note.texte).sorte === 'critere'}
          onPasserCritere={() => { appliquer(noteEnCritere(magasin.lire(), { carnetId: c.id, noteId: note.id })); setFeuille(null); }}
          onModifier={() => { setEdition(note.id); setTexte(note.texte); setFeuille(null); setTimeout(() => champRef.current?.focus(), 0); }}
          onChangerEnFacon={() => { appliquer(changerSorte(magasin.lire(), { carnetId: c.id, cible: 'note', id: note.id, vers: 'facon' })); setFeuille(null); }}
          onChangerEnCritere={() => { appliquer(changerSorte(magasin.lire(), { carnetId: c.id, cible: 'note', id: note.id, vers: 'critere' })); setFeuille(null); }}
          onSupprimer={() => { const r = appliquer(supprimerNote(magasin.lire(), { carnetId: c.id, noteId: note.id })); if (r) setNoteSupprimee({ id: note.id, inverse: r.inverse }); setFeuille(null); }}
          onFermer={() => setFeuille(null)} /> } : null}
        grise={vue.sorte === 'supprimer'}
        onRetour={() => { setVue({ sorte: 'liste' }); setVientDEtreCree(null); }}
        onRenommer={() => setVue({ sorte: 'renommer', id: c.id })}
        onSupprimer={() => setVue({ sorte: 'supprimer', id: c.id })}
        onNote={id => setFeuille(f => (f === id ? null : id))}
        onOuvrirArticle={articleId => setVue({ sorte: 'article', id: c.id, articleId })}
        onComparer={() => setVue({ sorte: 'comparer', id: c.id })}
        onVeille={articleId => { appliquer(basculerVeille(magasin.lire(), { carnetId: c.id, articleId, le: maintenant().toISOString() })); }}
        onVoirChoix={() => setVue({ sorte: 'choisir', id: c.id })}
        onEnvoyerAVenir={() => void envoyerAVenir(c)}
        onOuvrirLien={() => p.onVoirAVenir?.()} />
    </>;
  }

  /** « Envoyer dans À venir » (R32) : un seul plan (clé `PLAN-CARNET-<id>`), puis le carnet le retient ; aucun montant ici. */
  async function envoyerAVenir(c: CarnetDoc) {
    const le = maintenant().toISOString();
    const plan = planDepuisChoix(c, { le });
    if (!plan) { p.onMessage?.('Choisissez d’abord un article.'); return; }
    if (!finances.plans.some(x => x.id === plan.id)) await (p.ecrirePlan ?? ((pl: FinancialPlan) => FinanceService.saveUpgrade(pl)))(plan);
    const r = appliquer(poserSortie(magasin.lire(), { carnetId: c.id, planId: plan.id, le }));
    if (r) p.onMessage?.('Dans À venir.');
  }

  void garderAPart;
  return (
    <div className={`cn ${p.className ?? ''}`} data-carnets data-vue={vue.sorte} style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>{ecran}</div>
      {vue.sorte !== 'renommer' && champ}
    </div>
  );
}
