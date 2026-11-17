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
import { lireCarnets, lireMessages, nouvelIdCarnet, titreDePhrase, type CarnetDoc } from '../../domain/carnets/modele';
import {
  archiverCarnet, basculerVeille, changerSorte, choisir, creerCarnet, detacherPlan, garderAPart, liensDe, liensQuiRetiennent, modifierNote,
  noteEnCritere, planDepuisChoix, poserSortie, ranger, remplacerRangement, renommer, supprimerCarnet, supprimerNote,
  type Destination, type EcritureCarnet, type Journal, type LigneARanger, type Resultat
} from '../../domain/carnets/operations';
import { consequenceApercu, critereQuiTranche, tableau as tableauDe } from '../../domain/carnets/comparer';
import { analyserLigne, analyserTexte, type LigneLocale } from '../../domain/carnets/analyseLocale';
import { rattacher } from '../../domain/carnets/rattacher';
import { notesEnDouble } from '../../domain/carnets/doublons';
import type { CarnetPourIA, LigneCarnet } from '../../domain/carnets/ia';
import { aidesCourantes, comportementSimule, modeCarnet, type AidesCarnet, type ModeCarnetIA } from '../../config/carnetIA';
import { appelsSimules, creerRangement, type AppelsIA, type EtatRangement } from './rangement';
import { ListeCarnets } from './ListeCarnets';
import { CarnetOuvert, type LienV } from './CarnetOuvert';
import { ChampCarnet } from './ChampCarnet';
import { CadreArrivee, type CadreV } from './CadreArrivee';
import { Bandeau, type BandeauV } from './Bandeau';
import { NoteEnVrac, type LigneVracV } from './NoteEnVrac';
import { FicheArticle } from './FicheArticle';
import { Comparer } from './Comparer';
import { Choisir } from './Choisir';
import { SupprimerCarnet } from './SupprimerCarnet';
import { FeuilleNote } from './FeuilleNote';
import { RenommerCarnet } from './RenommerCarnet';
import { EtatIA, type ArticleV, type CarnetV } from './EtatIA';
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

const lireFinances = (): FinancesCarnet => ({
  plans: FinanceService.getPlans(), transactions: StorageService.getTransactions() as unknown as FinanceTransaction[], payments: FinanceService.getPayments()
});
const versV = (c: CarnetDoc): CarnetV => c as unknown as CarnetV;
const titreSansBanc = (t: string) => t.replace(/^ZZ TEST — /, '');

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
  const champRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { if (p.ouvrir) { setVue({ sorte: 'carnet', id: p.ouvrir.id }); setRetour(null); } }, [p.ouvrir?.at]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (p.focusChamp) champRef.current?.focus(); }, [p.focusChamp]);
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

  /* ---------- le fil : un champ, l'IA met en forme et range ---------- */
  const depuis = ouvert && vue.sorte !== 'liste' ? ouvert.id : null;
  const rangement = useMemo(() => creerRangement<LigneLocale>({
    mode, depuis,
    carnets: () => pourIA(lireCarnets(magasin.lire())),
    enLigne: () => enLigne,
    analyseLocale: analyserTexte,
    appels: p.appels ?? (mode === 'simule' ? appelsSimules(comportementSimule()) : undefined),
    maintenant,
    surEtat: setEtatR,
    ecrireLocal: (txt, lignes) => {
      const etat = magasin.lire();
      const le = maintenant().toISOString();
      const message = { id: nouvelIdCarnet('MSG'), texte: txt, le, depuis: depuis ?? 'liste', rangement: 'locale' as const };
      let r: Resultat;
      let neuf: string | null = null;
      if (depuis) r = ranger(etat, { message, lignes: lignes.map(l => depuisLocale(l, { carnetId: depuis })) });
      else if (lignes.length <= 1) {
        neuf = nouvelIdCarnet('CARNET');
        r = creerCarnet(etat, { id: neuf, message, lignes: lignes.filter(l => l.sorte !== 'note').map(l => depuisLocale(l, { carnetNeuf: { id: neuf!, titre: titreDePhrase(txt) } })) });
      } else {
        const cs = lireCarnets(etat);
        r = ranger(etat, { message, lignes: lignes.map(l => {
          const proche = rattacher(l.texte, cs);
          return depuisLocale(l, proche ? { carnetId: proche.carnetId } : { carnetNeuf: { id: nouvelIdCarnet('CARNET'), titre: titreDePhrase(l.texte) } });
        }) });
      }
      const fait = appliquer(r);
      if (!fait) throw new Error((r as { raison?: string }).raison ?? 'refus');
      const effets = lireMessages(magasin.lire()).find(m => m.id === message.id)?.carnetMessage.effets ?? [];
      const nbCarnets = new Set(effets.map(e => e.carnetId)).size;
      const nbLignes = effets.filter(e => e.cible !== 'carnet').length;
      const bandeau: BandeauV = neuf ? { sorte: 'cree', phrase: txt } : !depuis && lignes.length > 1 ? { sorte: 'vrac', lignes: Math.max(nbLignes, 1), carnets: nbCarnets } : { sorte: 'range' };
      setRetour({ bandeau, inverse: fait.inverse, messageId: message.id, carnetId: neuf ?? depuis ?? undefined });
      if (neuf) { setEnTete(neuf); setVientDEtreCree(neuf); setVue({ sorte: 'carnet', id: neuf }); }
      return { messageId: message.id };
    },
    ecrireIA: (messageId, lignes, mode2) => {
      const etat = magasin.lire();
      const msg = lireMessages(etat).find(m => m.id === messageId);
      const creePar = msg?.carnetMessage.effets.find(e => e.cible === 'carnet')?.carnetId;
      const neufs = new Map<string, string>();
      const dest = (l: LigneCarnet): Destination => {
        if (l.carnetId) return { carnetId: l.carnetId };
        if (depuis && !l.carnetNeuf) return { carnetId: depuis };
        const titre = l.carnetNeuf ?? l.titre ?? titreDePhrase(l.texte);
        if (!neufs.has(titre)) neufs.set(titre, neufs.size === 0 && creePar ? creePar : nouvelIdCarnet('CARNET'));
        return { carnetNeuf: { id: neufs.get(titre)!, titre } };
      };
      const propose = lignes.find(l => l.titrePropose && l.carnetId);
      const r = remplacerRangement(etat, { messageId, rangement: mode2, lignes: lignes.map(l => depuisIA(l, dest(l))),
        ...(propose ? { titrePropose: { carnetId: propose.carnetId!, titre: propose.titrePropose! } } : {}) });
      const fait = appliquer(r);
      if (!fait) return;
      setRetour(prec => prec && prec.messageId === messageId ? { ...prec, inverse: [...fait.inverse, ...prec.inverse] } : { bandeau: { sorte: 'range' }, inverse: fait.inverse, messageId });
    }
  }), [mode, depuis, enLigne, magasin, appliquer, maintenant, p.appels]);

  const lignesApercu = useMemo(() => (texte.trim() ? analyserTexte(texte) : []), [texte]);
  const envoyer = async () => {
    const txt = texte.trim();
    if (!txt) return;
    if (edition && ouvert) {
      const r = appliquer(modifierNote(magasin.lire(), { carnetId: ouvert.id, noteId: edition, texte: txt, le: maintenant().toISOString() }));
      if (r) setRetour({ bandeau: { sorte: 'modifiee' }, inverse: r.inverse, carnetId: ouvert.id });
      setEdition(null); setTexte(''); return;
    }
    setTexte('');
    try { await rangement.envoyer(txt); } catch { setTexte(txt); }
  };
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
  const liens: LienV[] = ouvert ? liensDe(ouvert, finances.plans, finances.transactions, finances.payments) : [];
  /* R26 : le tableau vient de `comparer.ts`, passé tel quel aux vues ; `null` à 0 ou 1 article. */
  const tableauV = ouvert ? tableauDe(ouvert) : null;

  const cadre = (): React.ReactNode => {
    if (etatR.etape === 'en-cours') {
      if (etatR.lecture) {
        const c: CadreV = { sorte: 'lien', url: etatR.lecture.url, phase: 'lecture', depuisListe: !depuis };
        return <CadreArrivee cadre={c} onAnnuler={() => rangement.annuler()} aides={aides} />;
      }
      return <EtatIA etat="en-cours" quoi={etatR.texte} onAnnuler={() => rangement.annuler()} />;
    }
    if (etatR.etape === 'echec' || etatR.etape === 'hors-ligne') return <EtatIA etat={etatR.etape} quoi={etatR.avis} />;
    if (!texte.trim() || edition) return null;
    if (!depuis) {
      if (lignesApercu.length > 1) {
        const lignes: LigneVracV[] = lignesApercu.map((l, i) => { const pr = rattacher(l.texte, carnets); return { id: String(i), texte: l.texte, genre: l.genre, ...(pr ? { carnetId: pr.carnetId, carnetTitre: titreSansBanc(pr.titre) } : { carnetTitre: titreDePhrase(l.texte), neuf: true }) }; });
        return <NoteEnVrac etat="pendant" lignes={lignes} texteOrigine={texte} origine="locale" onAnnuler={() => setTexte('')} />;
      }
      const pr = rattacher(texte, carnets);
      const critere = lignesApercu.find(l => l.sorte === 'critere');
      const c: CadreV = { sorte: 'creer', titre: titreDePhrase(texte),
        proche: pr ? { titre: titreSansBanc(pr.titre), onAjouter: () => setVue({ sorte: 'carnet', id: pr.carnetId }) } : null,
        ...(pr ? {} : { raisonNeuf: `Aucun de vos ${carnets.length} carnets n’en parle : nouveau carnet, votre phrase en titre` }),
        ...(critere ? { ceQuiCompte: critere.texte } : {}) };
      return <CadreArrivee cadre={c} onAnnuler={() => setTexte('')} aides={aides} />;
    }
    const l0 = lignesApercu[0];
    if (l0?.url) return <CadreArrivee cadre={{ sorte: 'lien', url: l0.url, phase: 'avant' }} onAnnuler={() => setTexte('')} aides={aides} />;
    const rubrique = l0?.sorte === 'critere' ? 'Ce qui compte' : l0?.sorte === 'article' ? 'Articles' : 'Notes';
    return <CadreArrivee cadre={{ sorte: 'texte', rubrique, texte, origine: 'locale' }} onAnnuler={() => setTexte('')} consequence={consequence} aides={aides} />;
  };
  const bandeauNode = retour && (!retour.carnetId || retour.carnetId === idOuvert || vue.sorte === 'liste')
    ? <Bandeau bandeau={retour.bandeau} onAnnuler={() => { annuler(retour.inverse); setRetour(null); if (retour.bandeau.sorte === 'cree') setVue({ sorte: 'liste' }); }} aideConsequence={aides.consequence} />
    : null;

  const champ = (
    <ChampCarnet valeur={texte} inputRef={champRef}
      onChange={t => { setTexte(t); if (!edition) rangement.taper(t); }}
      onEnvoyer={() => void envoyer()}
      {...(ouvert && vue.sorte === 'carnet' ? { titreCarnet: titreSansBanc(ouvert.title), libelleEnvoi: edition ? 'Enregistrer' : 'Ajouter' } : {})}
      onPhoto={f => void photo(f)}
      suggestion={vue.sorte === 'carnet' ? suggestion : null}
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
    ecran = <>
      <CarnetOuvert carnet={versV(c)} aides={aides as never} liens={liens} tableau={tableauV} bandeau={bandeauNode} cadre={cadre()}
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
      {vue.sorte === 'supprimer' && <SupprimerCarnet titre={titreSansBanc(c.title)} contenu={c.carnet as never}
        liens={liensQuiRetiennent(c, finance.plans, finance.transactions, finance.payments)}
        proche={proche ? { titre: titreSansBanc(proche.titre), onDeplacer: () => { void import('../../domain/carnets/operations').then(m => appliquer(m.deplacerArticles(magasin.lire(), { depuis: c.id, vers: proche.carnetId, articleIds: enVeille }))); } } : null}
        onDetacher={() => { appliquer(detacherPlan(magasin.lire(), { carnetId: c.id, ...finance })); }}
        onArchiver={() => { const r = appliquer(archiverCarnet(magasin.lire(), { carnetId: c.id, le: maintenant().toISOString(), raison: 'plan réalisé' })); if (r) { setVue({ sorte: 'liste' }); setRetour({ bandeau: { sorte: 'range' }, inverse: r.inverse }); } }}
        onSupprimer={() => { const r = appliquer(supprimerCarnet(magasin.lire(), { carnetId: c.id, ...finance })); if (r) { setSupprime({ titre: c.title, statut: c.status, inverse: r.inverse }); setVue({ sorte: 'liste' }); } }}
        onGarder={() => setVue({ sorte: 'carnet', id: c.id })} />}
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
