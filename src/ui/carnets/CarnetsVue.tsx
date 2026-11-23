/**
 * Carnet d'idées — le conteneur (lot D). Il tient le magasin, le rangement (le fil : un champ, l'IA met en forme et range), la navigation
 * interne (liste ↔ carnet ↔ article ↔ comparer ↔ choisir), Annuler et l'état du réseau. Les vues (lot C) sont contrôlées par props :
 * elles ne lisent aucun magasin. Les calculs viennent du lot A (`comparer.ts`, `operations.ts`, `rattacher.ts`, `doublons.ts`) ; l'IA du
 * lot B (`rangement.ts`, `config/carnetIA.ts`). Rien n'est écrit hors de `creativeItems`, sauf le plan d'À venir créé par « Envoyer dans
 * À venir » (le service des plans existant, une fois : clé idempotente).
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { FinancialPlan } from '../../domain/finance/types';
import { estLienSeul, lireCarnets, lireMessages, nouvelIdCarnet, titreDePhrase, type CarnetDoc } from '../../domain/carnets/modele';
import { liensDe, modifierNote, ranger, renommer, type Destination, type EcritureCarnet, type Journal, type LigneARanger, type Resultat } from '../../domain/carnets/operations';
import { tableau as tableauDe } from '../../domain/carnets/comparer';
import { analyserTexte, type LigneLocale, type RubriqueVaDans } from '../../domain/carnets/analyseLocale';
import { nommeLeCarnet, rattacher } from '../../domain/carnets/rattacher';
import type { LigneCarnet } from '../../domain/carnets/ia';
import type { EtatRangement, Rangement as Envoi } from './rangement';
import type { LienV } from './CarnetOuvert';
import { titreProposeDe } from './RenommerCarnet';
import { CARNET_NEUF, destinationDans, majusculeFr, plusieursLignes, rappelVers, sansAutreSujet } from './envoiRegles';
import { AVIS_IA, PLIER_APRES_MS } from './lignesRegles';
import type { Annonce, AvisIA, CarnetsVueProps, Jointe, Retour, RetourNeuf, Vue } from './carnetsTypes';
import { useDonneesCarnets } from './useDonneesCarnets';
import { useNavigationCarnet } from './useNavigationCarnet';
import { retourDeMessage } from './retourCarnet';
import { creerRangementCarnets } from './rangementCarnets';
import { actionsCarnet } from './actionsCarnet';
import { bandeauxCarnet } from './bandeauxCarnet';
import { apercuCarnet } from './apercuCarnet';
import { ecranCarnet } from './ecransCarnet';
import { reduirePhoto } from './photo';
import './carnets.css';
import './carnets-fil.css';

export type { CarnetsVueProps, FinancesCarnet } from './carnetsTypes';
export { autreObjet, CARNET_NEUF, destinationDans, genreSousNote, ligneBrute, morceauxPerdus, rappelVers, sansAutreSujet } from './envoiRegles';
export { AVIS_IA, depuisIA, depuisLocale, detailDe, libelleProposee, pucesDuCarnet, rangDuLien, typerVrac, versRubrique } from './lignesRegles';

export function CarnetsVue(p: CarnetsVueProps) {
  const { magasin, items, finances, achatsPasses, mode, aides, maintenant, enLigne, carnets, tous, messages, faitsPlanning, anciennes, tauxEur, poserTaux } = useDonneesCarnets(p);
  const [vue, setVue] = useState<Vue>({ sorte: 'liste' });
  const idOuvert = vue.sorte === 'liste' ? null : vue.id;
  const ouvert = idOuvert ? tous.find(c => c.id === idOuvert) ?? null : null;
  const [texte, setTexte] = useState(p.texteInitial ?? '');
  const [etatR, setEtatR] = useState<EtatRangement<LigneLocale>>({ etape: 'repos' });
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
  const [aReprendre, setAReprendre] = useState<{ messageId: string; texte: string; echec?: true }[]>([]);
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
  const retourDe = useCallback((messageId: string, txt: string, depuisM: string | null, inverse: EcritureCarnet[], lignesIA?: readonly LigneCarnet[], titresIA?: readonly (string | undefined)[]): RetourNeuf | null =>
    retourDeMessage(magasin.lire(), messageId, txt, depuisM, inverse, lignesIA, titresIA), [magasin]);

  /** P22 : l'avis de l'IA (éteinte, hors ligne, en échec) se pose sur le retour de ce message, affiché ou tenu en réserve. */
  const poserAvis = useCallback((messageId: string, sorte: AvisIA['sorte'], enReserve?: RetourNeuf | null) => {
    const avis: AvisIA = { sorte, texte: AVIS_IA[sorte] };
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
  const rangement = useMemo(() => creerRangementCarnets({ p, mode, depuis, enLigne, magasin, appliquer, maintenant, retourDe, setRetour, poserRetourEtat, poserAvis, setEtatR,
    setRangeEnCours, setEnTete, setVientDEtreCree, setVue, setAReprendre, attente, annonces, aForcer, forcee, destEnvoi, titreNeufEnvoi, carnetChoisi, gardeAPartRef, aidesRef,
    retourRef, vueRef, neDeListe }), [mode, depuis, enLigne, magasin, appliquer, maintenant, p.appels, retourDe, setRetour, poserRetourEtat, poserAvis]); // eslint-disable-line react-hooks/exhaustive-deps

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
  const rangerMaintenant = async (seul?: string) => {
    const liste = seul ? aReprendre.filter(x => x.messageId === seul) : aReprendre;
    setAReprendre(l => l.filter(x => !liste.includes(x)));
    setIaManquee(m => Object.fromEntries(Object.entries(m).filter(([, s]) => s !== 'echec' || !liste.some(x => x.echec))));
    setIaManquee(m => Object.fromEntries(Object.entries(m).filter(([, s]) => s !== 'hors-ligne')));
    for (const m of liste) {
      const msg = lireMessages(magasin.lire()).find(x => x.id === m.messageId);
      if (!msg) continue;
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
    if (!depuis && dest.carnetNeuf) { setEnTete(dest.carnetNeuf.id); setVientDEtreCree(dest.carnetNeuf.id); setVue({ sorte: 'carnet', id: dest.carnetNeuf.id }); }
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
  const { sortieV, planSuivi, sortieFinie, enV, prixDuCarnet, ecrirePlanLie, planSuitLeChoix, voirSortie, ajouterEnFacon, ajouterAuSuggere, retirerCriteres, dater,
    auCalendrier, placer, supprimerAvecPlan, envoyerAVenir } = actionsCarnet({ p, finances, magasin, appliquer, annuler, maintenant, setTexte, setVue, setRetour, setEnTete,
    setVientDEtreCree, setSupprime });
  /* R26 : le tableau vient de `comparer.ts`, passé tel quel aux vues ; `null` à 0 ou 1 article. */
  const tableauV = ouvert ? tableauDe(ouvert) : null;

  const { repriseNode, rangee, fixe, bandeauIci, proposeesNode } = bandeauxCarnet({ enLigne, aReprendre, retour, etatR, rangerMaintenant, ouvert, vue, idOuvert, depuis,
    messages, tous, carnets, tableauV, retourRef, attente, annonces, neDeListe, couperEnvoi, annuler, appliquer, magasin, aides, setRetour, poserRetourEtat, setEnTete,
    setVientDEtreCree, setVue, setRangeEnCours, ajouterAuSuggere, ecartees, setEcartees });
  const { cadre, champ } = apercuCarnet({ ouvert, vue, setVue, retour, etatR, edition, feuille, lignesApercu, texte, setTexte, carnets, tous, messages, corrigeCarnet,
    setCorrigeCarnet, corrige, setCorrige, envoiActif, depuis, couperEnvoi, aides, annonces, mode, enLigne, focusListe, setFocusListe, supprime, rangement, champRef,
    ajouterEnFacon, aPart, setAPart, titreEdite, setTitreEdite, renommerOuvert, envoyer, vientDEtreCree, plierApresToucher, photo, jointe, retirerJointe, pliage, presse,
    setPresse });
  const ecran = ecranCarnet({ p, ouvert, vue, setVue, carnets, faitsPlanning, anciennes, enTete, retour, setRetour, supprime, setSupprime, annuler, repriseNode, bandeauIci,
    proposeesNode, rangee, cadre, champRef, setTexte, rangement, rangeEnCours, tableauV, appliquer, magasin, maintenant, tauxEur, poserTaux, feuille, setFeuille, edition,
    setEdition, finances, aides, titreEdite, renommerOuvert, ouvrirRenommer, propositionTitre, iaManquee, mode, enLigne, liens, vientDEtreCree, setVientDEtreCree,
    noteSupprimee, setNoteSupprimee, annulerSuppressionNote, autresPour, achatsPasses, enV, ecrirePlanLie, voirSortie, planSuitLeChoix, sortieV, envoyerAVenir, sortieFinie,
    placer, supprimerAvecPlan, retirerCriteres, dater, auCalendrier, prixDuCarnet, planSuivi });

  return (
    <div className={`cn ${p.className ?? ''}`} data-carnets data-vue={vue.sorte} style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      {/* f13 tour 3 (critique n° 1) : nommée pour que, sous la bande du carnet tout juste créé, elle s'élargisse aux bords de l'écran (carnets.css) */}
      <div className="cn-defile" style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>{fixe}{ecran}</div>
      {champ}
    </div>
  );
}
