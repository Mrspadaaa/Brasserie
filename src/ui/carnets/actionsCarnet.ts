/** Les gestes sur un carnet qui touchent aussi À venir et le Calendrier (dater, Au calendrier, Placer, Envoyer dans À venir, supprimer avec
 *  son plan), la sortie lue sur les finances, et les gestes de la liste (façon, carnet suggéré, critères retirés) ; sortis de CarnetsVue.tsx. */
import type { FinancialPlan } from '../../domain/finance/types';
import { FinanceService } from '../../services/financeService';
import { StorageService } from '../../services/storage';
import type { MagasinCarnets } from '../../services/carnetsStore';
import { lireCarnets, nouvelIdCarnet, type CarnetDoc } from '../../domain/carnets/modele';
import { avecPrixEstime, deplacer, etatSortie, idPlanDuCarnet, planAuCalendrier, planDepuisChoix, planOuvertDuCarnet, planRepris, planSuitCarnet, planSuitChoix, planSuiviDuCarnet, poserSortie, ranger,
  supprimerCarnet, supprimerLigne, type CibleLigne, type EcritureCarnet, type Resultat } from '../../domain/carnets/operations';
import { EVENEMENT_CALENDRIER } from '../calendrier/LienSection';
import { montant, type CarnetV } from './EtatIA';
import { majusculeFr } from './envoiRegles';
import { jourIso, lundiIso } from './lignesRegles';
import type { Appliquer, CarnetsVueProps, Etat, FinancesCarnet, Retour, RetourNeuf, Supprime, Vue } from './carnetsTypes';

const versV = (c: CarnetDoc): CarnetV => c as unknown as CarnetV;

export interface ActionsV {
  p: CarnetsVueProps; finances: FinancesCarnet; magasin: MagasinCarnets; appliquer: Appliquer; annuler: (inverse: EcritureCarnet[]) => void; maintenant: () => Date;
  setTexte: Etat<string>; setVue: Etat<Vue>; setRetour: (r: RetourNeuf | null) => void; setEnTete: Etat<string | undefined>; setVientDEtreCree: Etat<string | null>;
  setSupprime: Etat<Supprime | null>;
}

export function actionsCarnet(x: ActionsV) {
  const { p, finances, magasin, appliquer, annuler, maintenant, setTexte, setVue, setRetour, setEnTete, setVientDEtreCree, setSupprime } = x;
  /* Critique 7, n° 5 : `estRealise` gouverne la liste, la fiche et Choisir ; un plan payé se dit réalisé et « Voir » ouvre Réalisés. */
  const sortieV = (c: CarnetDoc) => {
    const e = etatSortie(c, finances.plans, finances.transactions, finances.payments);
    return e && c.carnet.sortie ? { ...c.carnet.sortie, etat: e.sorte, realiseLe: e.sorte === 'realise' ? e.le : undefined, ...(e.sansAchat ? { sansAchat: true as const } : {}) } : null;
  };
  /** L-11 : le plan d'À venir que le carnet suit (brouillon ou actif) ; sa date et son prix sont ceux que le carnet dit. */
  const planOuvert = (c: CarnetDoc) => planOuvertDuCarnet(c, finances.plans, finances.transactions, finances.payments);
  /** CA13-3 : le plan suivi, ouvert ou archivé ; archivé, sa date et son prix restent ceux que le carnet dit (les derniers posés). */
  const planSuivi = (c: CarnetDoc) => planSuiviDuCarnet(c, finances.plans, finances.transactions, finances.payments);
  /** L-12 : réalisé, le projet ne se pose plus au calendrier ni ne se place. CA13-3 : archivé (mis de côté), il s'y remet. */
  const sortieFinie = (c: CarnetDoc) => sortieV(c)?.etat === 'realise';
  /** L-11 : la date dite par le carnet est celle de son plan (déplacé au Calendrier ou dans À venir), avec sa précision. */
  const avecDateDuPlan = (c: CarnetDoc): CarnetDoc => {
    const pl = planSuivi(c);
    return pl && /^\d{4}-\d{2}-\d{2}/.test(pl.date ?? '') ? { ...c, date: pl.date.slice(0, 10), precision: pl.upgrade?.datePrecision === 'day' ? 'semaine' : 'mois' } : c;
  };
  const enV = (c: CarnetDoc): CarnetV => { const s = sortieV(c); const d = avecDateDuPlan(c); return s ? versV({ ...d, carnet: { ...c.carnet, sortie: s } } as CarnetDoc) : versV(d); };
  /** L-11 : le prix estimé que dit le carnet : le montant de son plan s'il en suit un, sinon le sien. */
  const prixDuCarnet = (c: CarnetDoc): number | undefined => {
    const pl = planSuivi(c);
    if (pl) return pl.amountCents > 0 ? pl.amountCents : undefined;
    return typeof c.estimatedCost === 'number' && c.estimatedCost > 0 ? Math.round(c.estimatedCost * 100) : undefined;
  };
  const ecrirePlanLie = (pl: FinancialPlan) => (p.ecrirePlan ?? ((x: FinancialPlan) => FinanceService.saveUpgrade(x)))(pl);
  /** L-10 : après un choix ou un prix d'article, le plan suivi passe « prix trouvé » et se chiffre s'il n'avait aucun montant (Q-1 attend pour le reste). */
  const planSuitLeChoix = async (c: CarnetDoc) => { const pl = planOuvert(c); if (!pl) return; const n = planSuitChoix(pl, c); if (n !== pl) await ecrirePlanLie(n); };
  const voirSortie = (c: CarnetDoc | undefined) => (c && sortieV(c)?.etat === 'realise' && p.onVoirRealises ? p.onVoirRealises() : p.onVoirAVenir?.());

  /** Lot 11 (L-30) : la phrase tapée sur la liste devient une façon du carnet proche (choix du brasseur : aucune IA ne la déplace). */
  function ajouterEnFacon(brut: string, carnetId: string) {
    const txt = brut.trim();
    if (!txt) return;
    const message = { id: nouvelIdCarnet('MSG'), texte: txt, le: maintenant().toISOString(), depuis: 'liste' as const, rangement: 'locale' as const };
    const r = appliquer(ranger(magasin.lire(), { message, lignes: [{ carnetId, sorte: 'facon', nom: majusculeFr(txt), origine: 'vous' }] }));
    if (!r) return;
    setTexte('');
    setVue({ sorte: 'carnet', id: carnetId });
    setRetour({ bandeau: { sorte: 'range' }, inverse: r.inverse, messageId: message.id, carnetId });
  }
  /**
   * Lot 11 (L-2) : « Y ajouter ? » : ce que la phrase a mis dans son carnet neuf passe dans le carnet que l'IA proposait (la phrase en note si
   * rien d'autre), le carnet neuf vide part ; un seul Annuler rend tout (le carnet neuf et son contenu).
   */
  function ajouterAuSuggere(rt: Retour, versId: string) {
    const neufId = rt.carnetId;
    const c = neufId ? lireCarnets(magasin.lire()).find(x => x.id === neufId) : undefined;
    const vers = lireCarnets(magasin.lire()).find(x => x.id === versId);
    if (!c || !vers) return;
    const inverse: EcritureCarnet[] = [...rt.inverse];
    const pousser = (r: (Resultat & { ok: true }) | null) => { if (r) inverse.unshift(...r.inverse); };
    const elements: [CibleLigne, string][] = [
      ...c.carnet.criteres.map(x => ['critere', x.id] as [CibleLigne, string]), ...c.carnet.facons.map(x => ['facon', x.id] as [CibleLigne, string]),
      ...c.carnet.articles.map(x => ['article', x.id] as [CibleLigne, string]), ...c.carnet.notes.map(x => ['note', x.id] as [CibleLigne, string]),
      ...c.carnet.photos.map(x => ['photo', x.id] as [CibleLigne, string])];
    for (const [cible, id] of elements) pousser(appliquer(deplacer(magasin.lire(), { cible, id, depuis: c.id, vers: versId })));
    const phrase = rt.bandeau.sorte === 'cree' ? rt.bandeau.phrase : c.title;
    if (!elements.length) pousser(appliquer(ranger(magasin.lire(), { message: { id: nouvelIdCarnet('MSG'), texte: phrase, le: maintenant().toISOString(), depuis: 'liste', rangement: 'locale' }, lignes: [{ carnetId: versId, sorte: 'note', texte: phrase }] })));
    pousser(appliquer(supprimerCarnet(magasin.lire(), { carnetId: c.id, plans: finances.plans, transactions: finances.transactions, payments: finances.payments })));
    setEnTete(undefined); setVientDEtreCree(null);
    setVue({ sorte: 'carnet', id: versId });
    setRetour({ bandeau: { sorte: 'ailleurs', carnet: vers.title }, inverse, carnetId: versId });
  }

  /** Lot 11 (L-20, hors lot du lot 3) : « Retirer » un critère (ses doublons compris) ; un seul bandeau « Critère retiré · Annuler » rend tout. */
  function retirerCriteres(c: CarnetDoc, ids: readonly string[]) {
    const texteC = c.carnet.criteres.find(k => k.id === ids[0])?.texte ?? '';
    const inverse: EcritureCarnet[] = [];
    for (const id of ids) { const r = appliquer(supprimerLigne(magasin.lire(), { carnetId: c.id, cible: 'critere', id })); if (r) inverse.unshift(...r.inverse); }
    if (inverse.length) setRetour({ bandeau: { sorte: 'critere-retire', texte: texteC }, inverse, carnetId: c.id });
  }

  /** C1 (D393) : la date d'intention du carnet, un lundi (`null` = plus tard, sans date) ; son icône suit au Calendrier (`iconesIdees`). */
  function dater(c: CarnetDoc, lundi: string | null, precision: 'semaine' | 'mois' = 'mois') {
    const { date: _d, precision: _p, ...reste } = c; void _d; void _p;
    /* un horizon pose un mois (« vers févr. ») ; « Au calendrier › » pose sa semaine (« cette semaine », puis « S48 ») */
    const doc = (lundi ? { ...reste, date: lundi, precision } : reste) as CarnetDoc;
    const r = appliquer({ ok: true, ecritures: [{ op: 'put', doc }], inverse: [{ op: 'put', doc: c }], avis: lundi ? 'Daté' : 'Sans date' });
    /* L-11 : la date posée au carnet est celle de son plan (« Posé sur » d'À venir, la barre du Calendrier) ; « Plus tard » ne le déplace pas */
    const pl = planSuivi(c);
    if (r && pl && lundi) { const n = planSuitCarnet(pl, { date: lundi, precision }); if (n !== pl) void ecrirePlanLie(n); }
    return r;
  }
  /** K2 (« ça l'ajout à la date du jour, ça nous transférer sur le calendrier ») : daté à aujourd'hui s'il ne l'est pas, puis le Calendrier centré sur sa semaine. */
  /*  L-26 (T10-26, « en 1 bouton on a 3 action ») : il pose aussi l'achat prévu du projet (prix connu ou à estimer), et le Calendrier s'ouvre sur lui,
      à déplacer et à chiffrer ; un achat déjà prévu (Placer, À venir) n'est pas refait.
      T11-1 : le prix estimé du projet est porté sur l'achat (posé, ou déjà posé sans montant), et le Calendrier dit le geste avec Annuler, qui
      rend le carnet (date, sortie) et l'achat d'avant (retiré s'il vient d'être posé). */
  async function auCalendrier(c: CarnetDoc) {
    const jour = jourIso(maintenant()), le = maintenant().toISOString();
    const date = c.date && /^\d{4}-\d{2}-\d{2}/.test(c.date) ? c.date.slice(0, 10) : jour;
    const ecrirePlan = p.ecrirePlan ?? ((pl: FinancialPlan) => FinanceService.saveUpgrade(pl));
    /* CA13-3 : le plan déjà lié (sa sortie), même sous une autre clé ou archivé, plutôt qu'un second achat prévu */
    const deja = finances.plans.find(x => x.id === idPlanDuCarnet(c.id)) ?? planSuivi(c);
    if (!c.date && !deja) dater(c, lundiIso(jour), 'semaine');
    /* CA13-3 : un plan archivé est repris (brouillon), sa date et son prix gardés */
    const repris = deja && planRepris(deja);
    const chiffre = repris && repris.status === 'draft' && repris.upgrade?.sourceCarnetId === c.id ? avecPrixEstime(repris, c) : repris;
    /* CA13-3 : le plan lié sans date (« Sans date » d'À venir) se pose à la date du carnet, ou aujourd'hui : Au calendrier le montre */
    const datePosee = chiffre && !/^\d{4}-\d{2}-\d{2}/.test(chiffre.date ?? '') ? { ...chiffre, date, ...(chiffre.upgrade ? { upgrade: { ...chiffre.upgrade, datePrecision: 'day' as const } } : {}) } : chiffre;
    const plan = datePosee ?? planAuCalendrier(c, { le, date });
    if (plan !== deja) await ecrirePlan(plan);
    if (!deja) appliquer(poserSortie(magasin.lire(), { carnetId: c.id, planId: plan.id, le }));
    const change = plan !== deja || !c.date;
    const defaire = change ? async () => {
      if (deja) { if (plan !== deja) await ecrirePlan(deja); } else await (p.retirerPlan ?? ((pl: FinancialPlan) => StorageService.deleteUpgradePlan(pl)))(plan);
      annuler([{ op: 'put', doc: c }]);
    } : undefined;
    const prix = plan.amountCents > 0 ? ` · −${montant(plan.amountCents)} CHF` : '';
    const texte = !change ? '' : deja ? `${plan.title} : ${deja.status === 'cancelled' ? 'remis au calendrier' : plan !== deja ? 'prix estimé porté' : 'au calendrier'}${prix}` : `${plan.title} : achat prévu posé${prix}`;
    window.dispatchEvent(new CustomEvent(EVENEMENT_CALENDRIER, { detail: { date: deja?.date || date, id: plan.id, ...(defaire ? { annuler: defaire, texte } : {}) } }));
  }

  /** D419 « Placer » : le Calendrier s'ouvre sur l'achat prévu du choix (clé `PLAN-CARNET-<id>`), qu'on y déplace ; aucune caisse ici (C4). */
  async function placer(c: CarnetDoc) {
    const le = maintenant().toISOString();
    const plan = planDepuisChoix(c, { le });
    if (!plan) return;
    const existant = finances.plans.find(x => x.id === plan.id);
    /* L-10, L-12 : un plan supprimé d'À venir est reposé ; un plan suivi prend l'étape et le prix du choix (sans montant seulement, Q-1) */
    if (!existant) { await ecrirePlanLie(plan); appliquer(poserSortie(magasin.lire(), { carnetId: c.id, planId: plan.id, le })); }
    else if (existant.status === 'cancelled') await ecrirePlanLie(planRepris(existant));
    else await planSuitLeChoix(c);
    const date = existant?.date || plan.date;
    window.dispatchEvent(new CustomEvent(EVENEMENT_CALENDRIER, { detail: { date, id: plan.id } }));
  }

  /** L-14 (CA12-M1-19, M4-21) : supprimer le carnet ET son plan à venir, sans détour par À venir ; Annuler rend les deux. */
  async function supprimerAvecPlan(c: CarnetDoc, planId: string) {
    const pl = finances.plans.find(x => x.id === planId);
    if (!pl) return;
    const r = appliquer(supprimerCarnet(magasin.lire(), { carnetId: c.id, plans: finances.plans.filter(x => x.id !== planId), transactions: finances.transactions, payments: finances.payments }));
    if (!r) return;
    await (p.retirerPlan ?? ((x: FinancialPlan) => StorageService.deleteUpgradePlan(x)))(pl);
    setSupprime({ titre: c.title, statut: c.status, inverse: r.inverse, plan: pl });
    setVue({ sorte: 'liste' });
  }

  /** « Envoyer dans À venir » (R32) : un seul plan (clé `PLAN-CARNET-<id>`), puis le carnet le retient ; aucun montant ici. */
  async function envoyerAVenir(c: CarnetDoc) {
    const le = maintenant().toISOString();
    const plan = planDepuisChoix(c, { le });
    if (!plan) { p.onMessage?.('Choisissez d’abord un article.'); return; }
    /* L-10 : un plan déjà posé (Au calendrier) n'était jamais réécrit : il reste « à chercher » au prix d'avant ; il suit le choix */
    if (!finances.plans.some(x => x.id === plan.id)) await ecrirePlanLie(plan);
    else await planSuitLeChoix(c);
    const r = appliquer(poserSortie(magasin.lire(), { carnetId: c.id, planId: plan.id, le }));
    if (r) p.onMessage?.('Dans À venir.');
  }
  return { sortieV, planOuvert, planSuivi, sortieFinie, avecDateDuPlan, enV, prixDuCarnet, ecrirePlanLie, planSuitLeChoix, voirSortie, ajouterEnFacon, ajouterAuSuggere,
    retirerCriteres, dater, auCalendrier, placer, supprimerAvecPlan, envoyerAVenir };
}
export type ActionsCarnet = ReturnType<typeof actionsCarnet>;
