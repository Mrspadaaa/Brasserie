/**
 * Carnet d'idées — le conteneur (lot D). Il tient le magasin, le rangement (le fil : un champ, l'IA met en forme et range), la navigation
 * interne (liste ↔ carnet ↔ article ↔ comparer ↔ choisir), Annuler et l'état du réseau. Les vues (lot C) sont contrôlées par props :
 * elles ne lisent aucun magasin. Les calculs viennent du lot A (`comparer.ts`, `operations.ts`, `rattacher.ts`, `doublons.ts`) ; l'IA du
 * lot B (`rangement.ts`, `config/carnetIA.ts`). Rien n'est écrit hors de `creativeItems`, sauf le plan d'À venir créé par « Envoyer dans
 * À venir » (le service des plans existant, une fois : clé idempotente).
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { FinancialPlan } from '../../domain/finance/types';
import type { CreativeItem } from '../../types';
import { estLienSeul, lireCarnets, lireMessages, nouvelIdCarnet, titreDePhrase, type CarnetDoc } from '../../domain/carnets/modele';
import { appliquerEcritures, completerLienMort, liensDe, modifierNote, ranger, renommer, type Destination, type EcritureCarnet, type Journal, type LigneARanger, type Resultat } from '../../domain/carnets/operations';
import { tableau as tableauDe } from '../../domain/carnets/comparer';
import { analyserTexte, type LigneLocale, type RubriqueVaDans } from '../../domain/carnets/analyseLocale';
import { nommeLeCarnet, rattacher } from '../../domain/carnets/rattacher';
import type { LigneCarnet } from '../../domain/carnets/ia';
import type { EtatRangement, Rangement as Envoi } from './rangement';
import type { LienV } from './CarnetOuvert';
import { titreProposeDe } from './RenommerCarnet';
import { CARNET_NEUF, destinationDans, majusculeFr, plusieursLignes, rappelVers, sansAutreSujet } from './envoiRegles';
import { AVIS_IA, PLIER_APRES_MS } from './lignesRegles';
import type { Annonce, AReprendre, AvisIA, CarnetsVueProps, Jointe, Retour, RetourNeuf, Vue } from './carnetsTypes';
import { useDonneesCarnets } from './useDonneesCarnets';
import { useNavigationCarnet } from './useNavigationCarnet';
import { retourDeMessage } from './retourCarnet';
import { creerRangementCarnets } from './rangementCarnets';
import { suiviLocal } from '../../domain/carnets/lecture';
import { sansArticleEnLecture } from '../../domain/carnets/comptes';
import { avecBon, carnetAOuvrirDepuisBarre, carteEnBarre, garderBons, lectureIci, lireBons, type Bons } from './lectureRegles';
import type { ArticleV } from './EtatIA';
import type { LectureUi } from './apercuCarnet';
import { actionsCarnet } from './actionsCarnet';
import { bandeauxCarnet } from './bandeauxCarnet';
import { apercuCarnet } from './apercuCarnet';
import { ecranCarnet } from './ecransCarnet';
import { deplacerLesLignesDuMessage, type FiltreOeil, type OngletListe } from './listeRegles';
import { FeuilleRangement, cheminDit, type ModeFeuille } from './FeuilleRangement';
import { accepterPropositionSuivi } from '../../domain/carnets/fil';
import { garderMessageAPart, poserDomaine, rattacherMessage } from '../../domain/carnets/operations';
import { titreCourt } from '../../domain/carnets/titreCourt';
import { poserGenre } from '../../domain/carnets/suivi';
import { reduirePhoto } from './photo';
import { propositionARanger } from './afaireRegles';
import './carnets.css';
import './carnets-fil.css';

export type { CarnetsVueProps, FinancesCarnet } from './carnetsTypes';
export { autreObjet, CARNET_NEUF, destinationDans, genreSousNote, ligneBrute, morceauxPerdus, rappelVers, sansAutreSujet } from './envoiRegles';
export { AVIS_IA, depuisIA, depuisLocale, detailDe, libelleProposee, pucesDuCarnet, rangDuLien, typerVrac, versRubrique } from './lignesRegles';

export function CarnetsVue(p: CarnetsVueProps) {
  const { magasin, items, finances, achatsPasses, mode, aides, maintenant, enLigne, carnets: carnetsBruts, tous: tousBruts, messages, faitsPlanning, anciennes, tauxEur, poserTaux } = useDonneesCarnets(p);
  const [etatR, setEtatR] = useState<EtatRangement<LigneLocale>>({ etape: 'repos' });
  /* T28-11 : l'article écrit en attendant la lecture d'un lien n'est ni compté ni montré avant qu'elle ait abouti */
  const enLecture = etatR.etape === 'en-cours' && etatR.lecture ? etatR.messageId : null;
  const carnets = useMemo(() => sansArticleEnLecture(carnetsBruts, enLecture), [carnetsBruts, enLecture]);
  const tous = useMemo(() => sansArticleEnLecture(tousBruts, enLecture), [tousBruts, enLecture]);
  const [vue, setVue] = useState<Vue>({ sorte: 'liste' });
  /** D451 : la rangée « Arbre · À faire · cloche » et le filtre du coup d'œil ; la recherche de Relecture (le champ du bas) ; `?carnet=v0` rend l'ancienne liste (PLAN, risque 9). */
  const [onglet, setOnglet] = useState<OngletListe>('arbre');
  const [filtre, setFiltre] = useState<FiltreOeil>(null);
  const [requeteRelecture, setRequeteRelecture] = useState('');
  const ancienneListe = useMemo(() => typeof location !== 'undefined' && new URLSearchParams(location.search).get('carnet') === 'v0', []);
  const idOuvert = 'id' in vue ? vue.id : null;
  const ouvert = idOuvert ? tous.find(c => c.id === idOuvert) ?? null : null;
  const [texte, setTexte] = useState(p.texteInitial ?? '');
  /** D448 : la carte des étapes repliée en barre (v01) ; la carte de fin ou d'échec fermée (par son message). */
  const [lectureRepliee, setLectureRepliee] = useState(false);
  const [lectureFermee, setLectureFermee] = useState<string | null>(null);
  /** T30-5 : « C'est le bon » gardé sur l'appareil, par message de lien. */
  const [bonsLectures, setBonsLectures] = useState<Bons>(() => lireBons(typeof localStorage === 'undefined' ? undefined : localStorage));
  /** T26-4 : l'inverse du retrait d'un lien mort, par message (« Compléter » rend l'article). */
  const inversesLiens = useRef(new Map<string, EcritureCarnet[]>());
  /** IA-ETAPES-VISIBLES : les lectures lancées, gardées sur l'appareil jusqu'à leur fin (réouverture). Sans IA : rien. */
  /* R44 (C61-2) : les jetons des lectures lancées dans CETTE session et pas finies. Une lecture vivante est gardée (le suivi garde le jeton jusqu'à sa fin) mais
     elle n'est pas interrompue : seule une lecture gardée que rien ne mène (app fermée avant la fin) se propose dans le bandeau « Reprendre ». */
  const vivantes = useRef(new Set<string>());
  const suivi = useMemo(() => {
    const base = mode === 'eteint' ? undefined : p.suiviLectures ?? suiviLocal();
    return base ? { lister: () => base.lister(), garder: (l: Parameters<typeof base.garder>[0]) => { vivantes.current.add(l.jeton); base.garder(l); }, retirer: (jeton: string) => { vivantes.current.delete(jeton); base.retirer(jeton); } } : undefined;
  }, [mode, p.suiviLectures]);
  const [retour, setRetourEtat] = useState<Retour | null>(null);
  /* D417 : le carnet que l'IA range depuis la liste (aucune fiche provisoire) ; la ligne dit « L'IA range… » */
  const [rangeEnCours, setRangeEnCours] = useState<string | null>(null);
  const neDeListe = useRef<string | null>(null);
  const vueRef = useRef<Vue>(vue);
  vueRef.current = vue;
  /** Le retour tel qu'il est maintenant, lu par Annuler et par la fin de l'IA (une fermeture plus ancienne ne le perd pas). */
  const retourRef = useRef<Retour | null>(null);
  const prochainRetour = useRef(0);
  const poserRetourEtat = useCallback((r: Retour | null) => { retourRef.current = r; setRetourEtat(r); }, []);
  const setRetour = useCallback((r: RetourNeuf | null) => {
    poserRetourEtat(r ? { ...r, id: (prochainRetour.current += 1) } : null);
  }, [poserRetourEtat]);
  const [jointe, setJointe] = useState<Jointe | null>(null);
  const jetonJointe = useRef(0);
  const [enTete, setEnTete] = useState<string | undefined>();
  const [vientDEtreCree, setVientDEtreCree] = useState<string | null>(null);
  const [supprime, setSupprime] = useState<{ titre: string; statut: CarnetDoc['status']; inverse: EcritureCarnet[]; plan?: FinancialPlan } | null>(null);
  const [noteSupprimee, setNoteSupprimee] = useState<{ id: string; inverse: EcritureCarnet[] } | null>(null);
  const [feuille, setFeuille] = useState<string | null>(null);
  const [edition, setEdition] = useState<string | null>(null);
  /** P18 (G11) : « Garder à part » touché pendant la frappe ; la proposition de fusion ne revient pas, l'envoi écrit `garderAPart`. */
  const [aPart, setAPart] = useState(false);
  const gardeAPartRef = useRef(false);
  /** P23 (D-35) : les lignes que l'IA propose, en puces d'un toucher. */
  /** Les puces écartées d'un ✕ pendant la session : rangées derrière, pas supprimées (la proposition reste sur son message). */
  const [ecartees, setEcartees] = useState<ReadonlySet<string>>(() => new Set());
  /** P28 (R09) : le champ de la liste a le focus, vide : « Créer · avant » (g5:v03-2, G1, G2). */
  const [focusListe, setFocusListe] = useState(false);
  /**
   * Test en ligne 2 (bloquant 8) : le toucher sur un carnet retire le focus du champ AVANT son clic. Replier « Créer » aussitôt faisait
   * remonter la liste (~120 px) sous le doigt : le clic tombait à côté. Le cadre se replie après le geste (le clic arrive en ~100 ms).
   */
  const pliage = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const plierApresToucher = useCallback(() => { clearTimeout(pliage.current); pliage.current = setTimeout(() => setFocusListe(false), PLIER_APRES_MS); }, []);
  useEffect(() => () => clearTimeout(pliage.current), []);
  const aidesRef = useRef(aides);
  aidesRef.current = aides;
  /** P5 (R13, G10) : la rubrique corrigée d'un toucher sur les puces « Va dans » ; elle prime sur le choix d'avance, jusqu'à l'envoi. */
  const [corrige, setCorrige] = useState<RubriqueVaDans | null>(null);
  /** La rubrique forcée de l'envoi en cours : lue par `ecrireLocal`, puis `ecrireIA` ne reprend pas ce message (sa correction est un choix). */
  const aForcer = useRef<RubriqueVaDans | null>(null);
  const forcee = useRef<string | null>(null);
  /** Critique 5, n° 3 : le carnet corrigé d'un toucher sur la puce « Va dans » (prime sur le calcul, jusqu'à l'envoi). */
  const [corrigeCarnet, setCorrigeCarnet] = useState<string | null>(null);
  /** Le carnet annoncé de l'envoi en cours, lu par `ecrireLocal` (même calcul que le cadre). */
  const destEnvoi = useRef<string | null>(null);
  /** Critique 8, n° 1 : le titre du carnet neuf annoncé pour une phrase qui parle d'un autre objet. */
  const titreNeufEnvoi = useRef<string | null>(null);
  /** Test en ligne 2 : le carnet de l'envoi en cours a été corrigé d'un toucher (un choix : l'IA ne le change pas). */
  const carnetChoisi = useRef(false);
  /** Critique 5, n° 24 : les carnets dont le dernier envoi n'a pas eu l'IA (échec, hors ligne, éteinte) : passés à CarnetOuvert. */
  const [iaManquee, setIaManquee] = useState<Readonly<Record<string, AvisIA['sorte']>>>({});
  /** Critique 6, n° 24 : les messages rangés hors ligne, tels quels ; au retour du réseau, « Ranger maintenant » les passe à l'IA. */
  const [aReprendre, setAReprendre] = useState<AReprendre[]>([]);
  /** Critique 5, n° 26 : le titre tapé dans le champ du bas pendant « Se renomme ici ». */
  const [titreEdite, setTitreEdite] = useState('');
  /** G14 (R15) : le lien que le presse-papier tient, lu au focus du champ ; refus silencieux. */
  const [presse, setPresse] = useState<string | undefined>();
  const champRef = useRef<HTMLTextAreaElement>(null);
  /** P1, P2 : le retour de l'écriture locale, tenu en réserve tant que l'IA peut la remplacer ; montré seulement si elle échoue ou est coupée. */
  const attente = useRef<{ messageId: string; retour: RetourNeuf; montre?: boolean; neuf?: string } | null>(null);
  /** L'annonce tenue par chaque envoi en cours (créer, note en vrac), lue par `ecrireIA`. */
  const annonces = useRef(new Map<string, Annonce>());
  /** L'envoi en cours : ✕ le coupe même si la vue a changé entre-temps (le carnet neuf ouvert recrée le déroulé). */
  const envoiActif = useRef<{ envoi: Envoi<LigneLocale>; depuis: string | null } | null>(null);

  useNavigationCarnet({ p, items, vue, setVue, setRetour, champRef, edition, setEdition, setTexte, ouvert, idOuvert, setNoteSupprimee, retour });

  /** Applique une intention ; un refus est dit, rien n'est écrit. */
  const appliquer = useCallback((r: Resultat): (Resultat & { ok: true }) | null => {
    if (!r.ok) { p.onMessage?.((r as { raison: string }).raison); return null; }
    magasin.appliquer(r.ecritures, r.journal as Journal | undefined);
    return r;
  }, [magasin, p.onMessage]);
  /** P34 : un écouteur du magasin qui échoue après l'écriture (banc : reflet du cache) ne laisse pas l'écran dans l'état d'avant. */
  const annuler = (inverse: EcritureCarnet[]) => {
    if (!inverse.length) return;
    try { magasin.appliquer(inverse); } catch (e) { p.onMessage?.(`Annuler : ${(e as Error)?.message ?? 'erreur'}`); }
  };

  /** P1, P2 : le retour « après » de ce message, lu dans le magasin tel qu'il est (`retourDeMessage`, retourCarnet.ts). */
  const retourDe = useCallback((messageId: string, txt: string, depuisM: string | null, inverse: EcritureCarnet[], lignesIA?: readonly LigneCarnet[], titresIA?: readonly (string | undefined)[], etat?: CreativeItem[]): RetourNeuf | null =>
    retourDeMessage(etat ?? magasin.lire(), messageId, txt, depuisM, inverse, lignesIA, titresIA), [magasin]);

  /** P22 : l'avis de l'IA (éteinte, hors ligne, en échec) se pose sur le retour de ce message, affiché ou tenu en réserve. */
  const poserAvis = useCallback((messageId: string, sorte: AvisIA['sorte'], enReserve?: RetourNeuf | null, texte?: string) => {
    const avis: AvisIA = { sorte, texte: texte ?? AVIS_IA[sorte] };
    const cur = retourRef.current;
    const vise = cur && cur.messageId === messageId ? cur : enReserve;
    /* n° 24 : le carnet où ce message est rangé sait que l'IA n'y est pas passée (« Ensuite : l'IA cherche… » ne promet plus rien) */
    const carnetVise = vise?.carnetId ?? lireMessages(magasin.lire()).find(m => m.id === messageId)?.carnetMessage.effets[0]?.carnetId;
    if (carnetVise) setIaManquee(m => ({ ...m, [carnetVise]: sorte }));
    if (cur && cur.messageId === messageId) { poserRetourEtat({ ...cur, avis }); return; }
    if (enReserve) setRetour({ ...enReserve, avis });
  }, [poserRetourEtat, setRetour, magasin]);

  /* ---------- le fil : un champ, l'IA met en forme et range ---------- */
  const depuis = ouvert && vue.sorte !== 'liste' ? ouvert.id : null;
  /* D451 (saisie rapide, maquettes3/v01 `saisie`) : une phrase tapée sur la liste qui range dans UN carnet ne l'ouvre plus : la feuille « rangé pour toi » se
     pose sur la liste (OK · Changer · Rattacher à… · Annuler). Un lien, une note en vrac, une photo seule gardent leur parcours. */
  const [feuilleRang, setFeuilleRang] = useState<{ messageId: string; mode: ModeFeuille } | null>(null);
  const envoiListe = useRef(false);
  const setVueRange = useCallback((v: Vue | ((v: Vue) => Vue)) => {
    const msg = neDeListe.current;
    if (envoiListe.current && msg && typeof v !== 'function' && v.sorte === 'carnet' && vueRef.current.sorte === 'liste' && !ancienneListe) {
      setFeuilleRang(f => ({ messageId: msg, mode: f?.messageId === msg ? f.mode : 'carte' }));
      return;
    }
    setVue(v);
  }, [ancienneListe]);
  const rangement = useMemo(() => creerRangementCarnets({ p, mode, depuis, enLigne, magasin, appliquer, maintenant, retourDe, setRetour, poserRetourEtat, poserAvis, setEtatR,
    setRangeEnCours, setEnTete, setVientDEtreCree, setVue: setVueRange, setAReprendre, attente, annonces, aForcer, forcee, destEnvoi, titreNeufEnvoi, carnetChoisi, gardeAPartRef, aidesRef,
    retourRef, vueRef, neDeListe, suivi, inversesLiens }), [mode, depuis, enLigne, magasin, appliquer, maintenant, p.appels, retourDe, setRetour, poserRetourEtat, poserAvis, suivi]); // eslint-disable-line react-hooks/exhaustive-deps

  /* IA-ETAPES-VISIBLES, LE-1 (24.11) : une lecture lancée avant la fermeture de l'app reste gardée ; l'ouvrir ne la rejoue PLUS (regarder n'écrit
     jamais : elle rangeait dans le carnet sans geste). Elle se propose dans le bandeau de reprise, une fois par montage ; « Reprendre » la rejoue
     par son jeton (rangerMaintenant). Un message pas encore lu du fil n'est pas oublié : la liste se relit quand le fil change. */
  const lecturesOffertes = useRef(new Set<string>());
  useEffect(() => {
    if (!suivi) return;
    const neuves = rangement.lecturesEnAttente().filter(l => !lecturesOffertes.current.has(l.messageId) && !vivantes.current.has(l.jeton));
    if (!neuves.length) return;
    for (const l of neuves) lecturesOffertes.current.add(l.messageId);
    setAReprendre(a => [...a, ...neuves.filter(l => !a.some(x => x.messageId === l.messageId)).map(l => ({ messageId: l.messageId, texte: l.texte, lecture: true as const }))]);
  }, [rangement, suivi, messages]);
  /* une lecture neuve (son jeton) se montre dépliée */
  const jetonLecture = etatR.etape === 'en-cours' ? etatR.lecture?.jeton ?? null : null;
  useEffect(() => { if (jetonLecture) { setLectureRepliee(false); setLectureFermee(null); } }, [jetonLecture]);
  const carnetDuMessage = (messageId: string) => {
    const m = lireMessages(magasin.lire()).find(x => x.id === messageId);
    return m?.carnetMessage.effets.find(e => e.cible === 'article')?.carnetId ?? m?.carnetMessage.effets[0]?.carnetId;
  };
  /* T30-1 : la carte entière n'est que dans la vue du lien ; quitter cette vue la replie en barre (v01) sans toucher « Replier » */
  const lectureVue = 'lecture' in etatR && 'messageId' in etatR ? etatR : undefined;
  const lectureIciVue = !lectureVue?.lecture || lectureIci({ carnetDuLien: lectureVue.lecture.carnetId, carnetDuMessage: carnetDuMessage(lectureVue.messageId), idOuvert });
  useEffect(() => { if (!lectureIciVue) setLectureRepliee(true); }, [lectureIciVue]);
  const lectureUi: LectureUi = {
    replie: lectureRepliee, setReplie: setLectureRepliee, ici: lectureIciVue, enBarre: carteEnBarre(lectureRepliee, lectureIciVue), fermee: lectureFermee, setFermee: setLectureFermee, exemple: mode === 'simule',
    onEscalader: (id, t) => { setLectureFermee(null); void rangement.escalader(id, t); },
    /* T28-3 : « Compléter » rend l'article du lien mort (marqué « introuvable », jamais « lecture… ») et ouvre sa fiche : nom, prix à saisir */
    onCompleter: (id, saisie) => {
      /* T30-2 : le brasseur écrit le nom (et le prix) ; l'article du lien mort est retrouvé (son message, sinon la même adresse) ou créé dans le carnet du lien */
      const inv = inversesLiens.current.get(id);
      const avant = magasin.lire();
      const base = inv ? appliquerEcritures(avant, inv) : avant;
      const lien = 'lecture' in etatR ? etatR.lecture : undefined;
      const carnetId = lien?.carnetId ?? carnetDuMessage(id) ?? idOuvert;
      const r = completerLienMort(base, { messageId: id, url: lien?.url ?? '', carnetId, nom: saisie.nom, ...(saisie.prixCentimes !== undefined ? { prixCentimes: saisie.prixCentimes } : {}) });
      if (!r.ok) { p.onMessage?.((r as { raison: string }).raison); return; }
      if (inv) { inversesLiens.current.delete(id); annuler(inv); }
      appliquer(r);
      setLectureFermee(id);
      if (carnetId && carnetId !== idOuvert) setVue({ sorte: 'carnet', id: carnetId });
    },
    bons: id => bonsLectures[id] ?? [],
    marquerBon: (id, cle) => setBonsLectures(b => { const n = avecBon(b, id, cle); if (n !== b) garderBons(typeof localStorage === 'undefined' ? undefined : localStorage, n); return n; }),
    /* T28-2 : la barre repliée touchée depuis un autre carnet ouvre le carnet du lien (celui où il a été collé) */
    deplier: id => {
      const lien = etatR.etape !== 'repos' && etatR.etape !== 'apercu' && 'lecture' in etatR ? etatR.lecture?.carnetId : undefined;
      const cible = carnetAOuvrirDepuisBarre(carnetDuMessage(id) ?? lien, idOuvert);
      if (cible && tous.some(c => c.id === cible)) setVue({ sorte: 'carnet', id: cible });
      setLectureRepliee(false);
    },
    onAutreLien: id => { setLectureFermee(id); setTexte(''); champRef.current?.focus(); },
    articleDe: id => {
      for (const c of lireCarnets(magasin.lire(), { archives: true })) {
        const a = c.carnet.articles.find(x => x.messageId === id);
        if (a) return { article: a as unknown as ArticleV, carnetId: c.id };
      }
      return null;
    },
    titreDe: id => { const cid = carnetDuMessage(id); return cid ? tous.find(c => c.id === cid)?.title : undefined; },
    ouvrirArticle: (carnetId, articleId) => { setLectureFermee(null); setVue({ sorte: 'article', id: carnetId, articleId }); }
  };

  /** PCN-178/182 : où déplacer une note : les autres carnets, le plus proche de la note d'abord. */
  const autresPour = (id: string, texte: string) => {
    const autres = carnets.filter(x => x.id !== id && !x.carnet.archive);
    const proche = rattacher(texte, autres)?.carnetId;
    return [...autres].sort((a, b) => Number(b.id === proche) - Number(a.id === proche)).map(x => ({ id: x.id, titre: x.title }));
  };
  const lignesApercu = useMemo(() => (texte.trim() ? analyserTexte(texte) : []), [texte]);
  const envoyer = async () => {
    let txt = texte.trim();
    /* P7 : la photo jointe et prête part avec l'envoi (seule, ou avant le texte) ; en lecture, elle attend */
    const ph = jointe?.jpeg && !edition ? jointe.jpeg : null;
    if (!txt && !ph) return;
    if (ph) { setJointe(null); rangerPhoto(ph); }
    if (!txt) return;
    if (edition && ouvert) {
      const r = appliquer(modifierNote(magasin.lire(), { carnetId: ouvert.id, noteId: edition, texte: majusculeFr(txt) /* CRN-14 : comme à l'ajout */, le: maintenant().toISOString() }));
      if (r) setRetour({ bandeau: { sorte: 'modifiee' }, inverse: r.inverse, carnetId: ouvert.id });
      setEdition(null); setTexte(''); return;
    }
    /* tour 3, f7 n° 2 : dans la liste, la phrase nomme un carnet existant : le cadre n'annonce que lui (« Ouvrir ce carnet ») ; Ajouter fait
       ce qu'il annonce, ouvre ce carnet, jamais un doublon. Même calcul que le cadre (`rattacher`, `nommeLeCarnet`). */
    if (!depuis && !estLienSeul(txt)) {
      const pr = rattacher(txt, carnets);
      if (pr && nommeLeCarnet(txt, pr.titre)) { setTexte(''); setVue({ sorte: 'carnet', id: pr.carnetId }); return; }
    }
    envoiListe.current = !depuis && !estLienSeul(txt) && !plusieursLignes(txt);
    if (envoiListe.current) setFeuilleRang(null);
    gardeAPartRef.current = aPart && !!depuis; setAPart(false);
    aForcer.current = depuis && !edition ? corrige : null; setCorrige(null); setPresse(undefined);
    /* n° 3 : le carnet que le cadre a annoncé, par le même calcul, ou celui qu'il a choisi d'un toucher */
    const dEnvoi = ouvert && depuis ? destinationDans(txt, ouvert, carnets) : null;
    destEnvoi.current = dEnvoi ? corrigeCarnet ?? dEnvoi.carnetId : null;
    /* tour 3, f5b n° 12 : un lien seul envoyé depuis la liste va dans le carnet que le cadre a annoncé (même `rattacher`) */
    if (!depuis && estLienSeul(txt)) destEnvoi.current = rattacher(txt, carnets)?.carnetId ?? null;
    /* tour 3, f5 (n° 1) : « autre projet, sans rapport : … » envoyé ailleurs : une note, sans la phrase de renvoi (jamais un critère) */
    const horsSujet = ouvert && destEnvoi.current && destEnvoi.current !== ouvert.id ? sansAutreSujet(txt) : null;
    if (horsSujet) { txt = horsSujet; aForcer.current = aForcer.current ?? 'note'; }
    titreNeufEnvoi.current = destEnvoi.current === CARNET_NEUF && dEnvoi ? dEnvoi.titre : null;
    carnetChoisi.current = !!dEnvoi && !!corrigeCarnet;
    /* CRN-6 : le rappel va dans le carnet que le cadre a annoncé, et y reste (l'IA met en forme, elle ne le déplace pas) */
    const rappel = !depuis ? rappelVers(txt, carnets) : null;
    if (rappel) { destEnvoi.current = rappel.carnetId; carnetChoisi.current = true; }
    setCorrigeCarnet(null);
    setTexte('');
    envoiActif.current = { envoi: rangement, depuis };
    try { await rangement.envoyer(txt); } catch { setTexte(txt); }
  };
  const couperEnvoi = () => (envoiActif.current?.envoi ?? rangement).annuler();
  /**
   * Critique 6, n° 24 (D-113, D-142) : de retour en ligne, « Ranger maintenant » : chaque message gardé hors ligne passe à l'IA, dans le
   * carnet où il est (le carnet ouvert d'alors, ou celui qu'il a créé) ; rien ne bouge sans ce toucher.
   */
  const rangerMaintenant = async (seul?: string, ids?: readonly string[]) => {
    /* C59-1 (R35) : le bouton ne reprend que ce que le bandeau annonce (les messages du carnet ouvert, `ids`) ; jamais ceux d'un autre carnet */
    const liste = seul ? aReprendre.filter(x => x.messageId === seul) : ids ? aReprendre.filter(x => ids.includes(x.messageId)) : aReprendre;
    setAReprendre(l => l.filter(x => !liste.includes(x)));
    setIaManquee(m => Object.fromEntries(Object.entries(m).filter(([, s]) => s !== 'echec' || !liste.some(x => x.echec))));
    setIaManquee(m => Object.fromEntries(Object.entries(m).filter(([, s]) => s !== 'hors-ligne')));
    for (const m of liste) {
      const msg = lireMessages(magasin.lire()).find(x => x.id === m.messageId);
      if (!msg) continue;
      /* LE-1 : une lecture gardée repart par SON jeton (la page déjà lue n'est pas relue), au toucher seulement */
      if (m.lecture) { envoiActif.current = { envoi: rangement, depuis }; await rangement.reprendreLectures(m.messageId); continue; }
      const ici = msg.carnetMessage.depuis !== 'liste' ? msg.carnetMessage.depuis : null;
      const cree = msg.carnetMessage.effets.find(e => e.cible === 'carnet')?.carnetId;
      if (ici) annonces.current.set(m.messageId, { sorte: 'ici', carnetId: ici });
      else if (cree && !plusieursLignes(m.texte)) {
        const titre = lireCarnets(magasin.lire(), { archives: true }).find(c => c.id === cree)?.title ?? titreDePhrase(m.texte);
        annonces.current.set(m.messageId, { sorte: 'cree', carnetId: cree, titre, phrase: m.texte });
      }
      envoiActif.current = { envoi: rangement, depuis };
      await rangement.reprendre(m.messageId, m.texte);
    }
  };
  /**
   * P7 (tour 3) : la photo choisie se joint au champ (« photo jointe · lecture… »), avant l'envoi, retirable d'un ✕. Rien n'est
   * rangé avant l'envoi ; une lecture finie après le ✕ est ignorée (jeton).
   */
  const photo = async (fichier: File) => {
    const jeton = (jetonJointe.current += 1);
    setJointe({ jeton });
    const jpeg = await reduirePhoto(fichier);
    if (jetonJointe.current !== jeton) return;
    if (!jpeg) { setJointe(null); p.onMessage?.('Photo illisible : rien n’a été rangé.'); return; }
    setJointe({ jeton, jpeg });
  };
  const retirerJointe = () => { jetonJointe.current += 1; setJointe(null); };
  const rangerPhoto = (jpeg: string) => {
    const etat = magasin.lire();
    const message = { id: nouvelIdCarnet('MSG'), texte: 'photo', le: maintenant().toISOString(), depuis: depuis ?? 'liste', rangement: 'brut' as const };
    const dest: Destination = depuis ? { carnetId: depuis } : { carnetNeuf: { id: nouvelIdCarnet('CARNET'), titre: 'Photo' } };
    const r = appliquer(ranger(etat, { message, lignes: [{ ...dest, sorte: 'photo', jpeg } as LigneARanger] }));
    if (!r) return;
    /* P21 : « ✓ Photo rangée ici · Annuler », là où elle est : le carnet ouvert, ou le carnet neuf qu'elle ouvre depuis la liste */
    setRetour(retourDe(message.id, message.texte, depuis, r.inverse) ?? { bandeau: { sorte: 'photo', ici: true }, inverse: r.inverse, messageId: message.id });
    if (!depuis && dest.carnetNeuf) {
      /* R66 (C67B-4, D451 option B) : une photo seule posée depuis la liste, avec un carnet ouvert à qui la rattacher, reste sur la liste : la carte « Rattacher à … ? » (Oui · Nouveau problème · Laisser)
         est amenée en vue ; l'ouvrir sur l'écran idée « Photo » la laissait tout en bas de l'arbre, hors de vue, sans proposition. Sans carnet à proposer : le carnet neuf s'ouvre comme avant. */
      const neufId = dest.carnetNeuf.id;
      const prop = propositionARanger({ carnetId: neufId, photo: jpeg, le: message.le }, lireCarnets(magasin.lire(), { archives: true }), lireMessages(magasin.lire()), maintenant);
      setEnTete(neufId); setVientDEtreCree(neufId);
      if (prop.sorte === 'rattacher') { setRetour({ bandeau: { sorte: 'photo', ici: false }, inverse: r.inverse, messageId: message.id }); return; }
      setVue({ sorte: 'carnet', id: neufId });
    }
  };
  /**
   * P34 : Annuler une suppression de note : la note revient, et le bandeau « Note supprimée · Annuler » part avec tout retour qui la
   * concernait (une seule vérité à l'écran : elle n'est plus supprimée).
   */
  const annulerSuppressionNote = (ns: { id: string; inverse: EcritureCarnet[] }) => {
    setNoteSupprimee(null);
    annuler(ns.inverse);
    const cur = retourRef.current;
    if (cur && (cur.bandeau.sorte === 'note-supprimee' || cur.bandeau.sorte === 'modifiee')) setRetour(null);
  };

  /**
   * Critique 5, n° 26 (g4:v01-13) : « ✎ Se renomme ici » se pose à la place du titre, le carnet reste à l'écran, et le titre se tape dans
   * le champ du bas (« Renommer », « Annuler · Entrée = renommer »). G29 : prérempli par le titre proposé s'il existe et que l'aide est
   * allumée.
   */
  const propositionTitre = (c: CarnetDoc) => {
    const m = [...messages].reverse().find(x => x.carnetMessage.titrePropose?.carnetId === c.id && !x.carnetMessage.titrePropose.applique);
    return m ? { titre: m.carnetMessage.titrePropose!.titre, phrase: m.carnetMessage.texte, messageId: m.id } : null;
  };
  const ouvrirRenommer = (c: CarnetDoc) => {
    const pr = propositionTitre(c);
    const propose = titreProposeDe({ titre: c.title, aides, proposition: pr });
    setTitreEdite(propose ? propose.titre : c.title);
    setFeuille(null); setEdition(null);
    setVue({ sorte: 'renommer', id: c.id });
    setTimeout(() => champRef.current?.focus(), 0);
  };
  const renommerOuvert = (c: CarnetDoc, titre: string) => {
    const t = titre.trim();
    setVue({ sorte: 'carnet', id: c.id });
    if (!t || t === c.title) return;
    const pr = propositionTitre(c);
    const r = appliquer(renommer(magasin.lire(), { carnetId: c.id, titre: t, ...(pr ? { messageId: pr.messageId } : {}) }));
    if (r) setRetour({ bandeau: { sorte: 'renomme', avant: r.avant ?? c.title }, inverse: r.inverse, carnetId: c.id });
  };

  /* ---------- calculs passés aux vues (R44, R45, R47) ---------- */
  const liens: LienV[] = ouvert ? liensDe(ouvert, finances.plans, finances.transactions, finances.payments) : [];
  const { sortieV, planSuivi, sortieFinie, enV, prixDuCarnet, ecrirePlanLie, planSuitLeChoix, voirSortie, ajouterEnFacon, ajouterAuSuggere, deplacerVersSuggere, retirerCriteres,
    retirerArticle, deplacerArticle, dater, auCalendrier, placer, supprimerAvecPlan, envoyerAVenir, geste, rappelsDe, cocherALaListe, echeanceALaListe, rattacherA, nouveauProbleme } = actionsCarnet({ p, finances, magasin, appliquer, annuler, maintenant, setTexte, setVue, setRetour, setEnTete,
    setVientDEtreCree, setSupprime, champRef });
  /* R26 : le tableau vient de `comparer.ts`, passé tel quel aux vues ; `null` à 0 ou 1 article. */
  const tableauV = ouvert ? tableauDe(ouvert) : null;

  const { repriseNode, rangee, fixe, bandeauIci, proposeesNode } = bandeauxCarnet({ enLigne, aReprendre, retour, etatR, rangerMaintenant, ouvert, vue, idOuvert, depuis,
    messages, tous, carnets, tableauV, retourRef, attente, annonces, neDeListe, couperEnvoi, annuler, appliquer, magasin, aides, setRetour, poserRetourEtat, setEnTete,
    setVientDEtreCree, setVue, setRangeEnCours, ajouterAuSuggere, deplacerVersSuggere, ecartees, setEcartees });
  const { cadre, champ } = apercuCarnet({ ouvert, vue, setVue, retour, etatR, edition, feuille, lignesApercu, texte, setTexte, carnets, tous, messages, corrigeCarnet,
    setCorrigeCarnet, corrige, setCorrige, envoiActif, depuis, couperEnvoi, aides, annonces, mode, enLigne, focusListe, setFocusListe, supprime, rangement, champRef,
    ajouterEnFacon, aPart, setAPart, titreEdite, setTitreEdite, renommerOuvert, envoyer, vientDEtreCree, plierApresToucher, photo, jointe, retirerJointe, pliage, presse,
    setPresse, lectureUi, aReprendre, requeteRelecture, setRequeteRelecture });
  const ecran = ecranCarnet({ messages, tous, onglet, setOnglet, filtre, setFiltre, requeteRelecture, ancienneListe, geste, rappelsDe, cocherALaListe, echeanceALaListe, rattacherA, nouveauProbleme, p, ouvert, vue, setVue, carnets, faitsPlanning, anciennes, enTete, retour, setRetour, supprime, setSupprime, annuler, repriseNode, bandeauIci,
    proposeesNode, rangee, cadre, champRef, setTexte, rangement, rangeEnCours, tableauV, appliquer, magasin, maintenant, tauxEur, poserTaux, feuille, setFeuille, edition,
    setEdition, finances, aides, titreEdite, renommerOuvert, ouvrirRenommer, propositionTitre, iaManquee, mode, enLigne, liens, vientDEtreCree, setVientDEtreCree,
    noteSupprimee, setNoteSupprimee, annulerSuppressionNote, autresPour, achatsPasses, enV, ecrirePlanLie, voirSortie, planSuitLeChoix, sortieV, envoyerAVenir, sortieFinie,
    placer, supprimerAvecPlan, retirerCriteres, retirerArticle, deplacerArticle, dater, auCalendrier, prixDuCarnet, planSuivi });

  /* la feuille « rangé pour toi » : lue dans le magasin (le message, le carnet où il a rangé) ; fermée si le carnet a disparu ou si l'on a quitté la liste */
  const feuilleNode = (() => {
    if (!feuilleRang || vue.sorte !== 'liste') return null;
    const m = messages.find(x => x.id === feuilleRang.messageId);
    const effets = m?.carnetMessage.effets ?? [];
    /* C69-1 : sans carnet neuf (l'IA désigne un carnet existant), la carte nomme ce carnet ; rien n'est écrit avant le geste */
    const enAttente = !effets.length && !!m?.carnetMessage.aRattacher;
    const cid = enAttente ? m!.carnetMessage.aRattacher!.carnetId : (effets.find(e => e.cible === 'carnet') ?? effets.find(e => !e.carnetSupprime))?.carnetId;
    const c = cid ? tous.find(x => x.id === cid) : undefined;
    if (!m || !c) return null;
    const neuf = enAttente || effets.some(e => e.cible === 'carnet' && e.carnetId === c.id);
    const fermer = () => setFeuilleRang(null);
    /* C68-1 : le carnet existant que l'IA désigne (proposition « Rattacher à … ? » du carnet que la phrase vient de créer) */
    const propDeplace = neuf ? (m.carnetMessage.propositionsSuivi ?? []).find(x => x.sorte === 'deplacer' && x.carnetId === c.id && x.versCarnetId) : undefined;
    const vise = enAttente ? c : propDeplace?.versCarnetId ? tous.find(x => x.id === propDeplace.versCarnetId) : undefined;
    const cible = vise ? { id: vise.id, titre: vise.title, chemin: cheminDit(vise) } : undefined;
    /* C68-12 : « OK » pose ce que la carte propose (la tâche), il n'attend pas dans le carnet */
    const poserLaTache = () => {
      const i = (m.carnetMessage.propositionsSuivi ?? []).findIndex(x => x.sorte === 'tache' && x.carnetId === c.id && x.texte);
      if (i >= 0) appliquer(accepterPropositionSuivi(magasin.lire(), { messageId: m.id, index: i, le: maintenant().toISOString() }));
    };
    return <FeuilleRangement message={m} carnet={c} autres={autresPour(c.id, m.carnetMessage.texte)} mode={feuilleRang.mode} onMode={mo => setFeuilleRang({ messageId: m.id, mode: mo })} {...(cible ? { cible } : {})} enAttente={enAttente}
      onGarder={enAttente ? () => { geste(garderMessageAPart(magasin.lire(), { messageId: m.id, id: nouvelIdCarnet('CARNET'), titre: titreCourt(m.carnetMessage.texte) })); fermer(); } : undefined}
      onOK={() => { poserLaTache(); fermer(); }} onFermer={fermer}
      onAnnuler={() => {
        /* en attente, rien n'a été écrit que le message lui-même : Annuler le retire (l'inverse le remet) */
        if (enAttente) { appliquer({ ok: true, ecritures: [{ op: 'remove', id: m.id }], inverse: [{ op: 'put', doc: m as unknown as CreativeItem }], avis: 'Phrase retirée' }); setRetour(null); fermer(); return; }
        const r = retourRef.current; if (r && (!r.messageId || r.messageId === m.id)) annuler(r.inverse); setRetour(null); fermer(); }}
      onRattacher={versId => {
        if (enAttente) geste(rattacherMessage(magasin.lire(), { messageId: m.id, versId }));
        else if (neuf) rattacherA(c.id, versId);
        else geste(deplacerLesLignesDuMessage(magasin.lire(), { messageId: m.id, depuis: c.id, vers: versId }));
        fermer();
      }}
      onDomaine={d => { appliquer(poserDomaine(magasin.lire(), { carnetId: c.id, domaine: d })); }}
      onGenre={g => { appliquer(poserGenre(magasin.lire(), { carnetId: c.id, genre: g, origine: 'vous' })); }}
      onAjouter={() => { fermer(); setVue({ sorte: 'carnet', id: c.id }); setTimeout(() => champRef.current?.focus(), 0); }} />;
  })();

  return (
    <div className={`cn ${p.className ?? ''}`} data-carnets data-vue={vue.sorte} style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      {/* f13 tour 3 (critique n° 1) : nommée pour que, sous la bande du carnet tout juste créé, elle s'élargisse aux bords de l'écran (carnets.css) */}
      <div className="cn-defile" style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>{fixe}{ecran}</div>
      {champ}
      {feuilleNode}
    </div>
  );
}
