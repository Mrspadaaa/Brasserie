import type { StockItem } from '../types';
import type { AiResponse } from './aiClient';
import type { IngredientFacts } from '../domain/ingredientFacts';
import type { CatalogueHop } from '../domain/hopIndex/v4/data';
import type { ModuleCatalogues, RechercheFiche } from './enrichissement';
import { StorageService } from './storage';
import { FirestoreRepo, isConfirmedWriteRejection } from './firestoreRepo';
import { ficheLaPlusProche } from '../domain/stock/fiche';
import { ficheLevureDe, type FicheLevure, type ReferenceLevure } from '../domain/stock/ficheLevure';
import { cleDeLArticle, cleFiche, generique, lireCle, memeProduitDeFiche, type Parente } from '../domain/stock/ficheCle';
import { ficheDe, patchDeTrous, rempliDe, trousDe, type ChampFiche, type Lien, type ParFiche, type ResultatPatch } from '../domain/stock/ficheValeurs';
import type { EtatTravail, MagasinFiches, TravailFiche } from './enrichissementStore';
import { identifiable, requeteDe } from './enrichissementRequete';
import {
  ATTENTE_ARTICLE_MS, ECART_ESSAIS_MS, JOURS_ECHEC, PLAFOND_JOUR, PLAFOND_TENTATIVES, REESSAI_INTROUVABLE_MS, SUITE_ECHEC,
  classerEchec, iaPermise,
} from './enrichissementReglages';

/**
 * Le travail de la procédure d'enrichissement (voie f4-enrichir, PLAN § 3.4 à § 4.3), importé par `import()` depuis `enrichissement.ts` au premier
 * tour de la file : il ne pèse pas dans le paquet de démarrage (PLAN § 7). Portes, rapprochement (catalogue, fiches retenues), recherche, écriture.
 */

// ─── Le travail ──────────────────────────────────────────────────────────────────────────────

const ETATS_FINAUX: ReadonlySet<EtatTravail> = new Set(['fait', 'aControler', 'introuvable', 'aSaisir', 'echec', 'abandonne', 'iaEteinte', 'plafond']);
/** Une vie de page : deux essais d'un même travail y sont espacés de 30 minutes au moins. */
const VIE = `vie-${Math.random().toString(36).slice(2)}-${Date.now().toString(36)}`;

/** Ce que la façade prête au travail : l'exécutant de recherche (injecté en test) et le chargeur des catalogues. */
export interface EnvTravail { executant: () => RechercheFiche; catalogues: () => Promise<ModuleCatalogues> }
export interface Tour {
  env: EnvTravail;
  ms: number; le: string; jour: string; store: MagasinFiches;
  /** Les articles écrits pendant ce tour : le cache de Firestore ne les rend qu'au prochain instantané. */
  ecrits: Map<string, StockItem>;
  cat?: ModuleCatalogues;
  levures?: ReferenceLevure[];
  houblons?: CatalogueHop[];
}

function finir(t: TravailFiche, tour: Tour, etat: EtatTravail, extra: Partial<TravailFiche> = {}): TravailFiche {
  const out: TravailFiche = { ...t, ...extra, etat };
  if (etat === 'attend') return out;
  if (ETATS_FINAUX.has(etat)) { out.finiLe = tour.le; out.annonce = false; }
  return out;
}
const enAttente = (t: TravailFiche, extra: Partial<TravailFiche> = {}): TravailFiche => ({ ...t, ...extra, etat: 'attend' });

function stockDuTour(tour: Tour): StockItem[] {
  const s = StorageService.getStocks();
  const base = [...s.rawMaterials, ...s.cleaning];
  const vus = new Set(base.map(i => i.ref));
  return [...base.map(i => tour.ecrits.get(i.ref) ?? i), ...[...tour.ecrits.values()].filter(i => !vus.has(i.ref))];
}
function articleDuTour(ref: string, tour: Tour): StockItem | undefined {
  const s = StorageService.getStocks();
  const lu = [...s.rawMaterials, ...s.cleaning].find(i => i.ref === ref);
  if (!lu) return undefined;
  const ecrit = tour.ecrits.get(ref);
  return ecrit ? { ...lu, ...ecrit, fiche: ecrit.fiche ?? lu.fiche } : lu;
}

type Porte = { go: true } | { go: false; travail: TravailFiche };
/** Portes 3 et 4 (PLAN § 3.1) : la dépense jugée comme `judgeExpense` ; l'article LU du serveur (`unknown` n'est jamais prêt). */
async function portes(t: TravailFiche, tour: Tour): Promise<Porte> {
  if (FirestoreRepo.documentWriteState('transactions', t.transactionId).status === 'rejected') return { go: false, travail: finir(t, tour, 'abandonne', { raison: 'rejet' }) };
  const tx = StorageService.getTransactions().find(x => x.id === t.transactionId) as { finance?: { voidedAt?: string } } | undefined;
  if (!tx) return { go: false, travail: enAttente(t) };
  if (tx.finance?.voidedAt) return { go: false, travail: finir(t, tour, 'abandonne', { raison: 'rejet' }) };
  if (FirestoreRepo.documentWriteState('stockItems', t.ref).status === 'rejected') return { go: false, travail: finir(t, tour, 'abandonne', { raison: 'rejet' }) };
  for (const [nom, id] of [['transactions', t.transactionId], ['stockItems', t.ref]] as const) {
    if (FirestoreRepo.documentWriteState(nom, id).status === 'confirmed') continue;
    if (typeof navigator !== 'undefined' && navigator.onLine === false) return { go: false, travail: enAttente(t) };
    try { await FirestoreRepo.waitForDocument(nom, id, ATTENTE_ARTICLE_MS); }
    catch (error) { return { go: false, travail: isConfirmedWriteRejection(error) ? finir(t, tour, 'abandonne', { raison: 'rejet' }) : enAttente(t) }; }
  }
  return { go: true };
}

interface Ecriture { valeurs: Partial<Record<ChampFiche, unknown>>; par: ParFiche; source: string; url?: string; niveau: 'sur' | 'repris'; deduit?: Partial<Record<ChampFiche, string>> }
interface Options { lien?: Lien; aControler?: boolean; propose?: string | null }
/**
 * L'écriture (PLAN § 3.6) : l'article est relu et le `put` part dans la MÊME tâche synchrone (aucun `await` entre les deux). Article absent → `false`,
 * aucun `put`. Plusieurs groupes de valeurs (sources différentes) s'enchaînent sur l'article relu. Jamais un champ hors liste blanche.
 */
function ecrire(t: TravailFiche, tour: Tour, groupes: readonly Ecriture[], options: Options): { ok: boolean; remplis: ChampFiche[] } {
  const lu = articleDuTour(t.ref, tour);
  if (!lu) return { ok: false, remplis: [] };
  let courant = lu;
  const patch: Partial<StockItem> = {};
  const remplis: ChampFiche[] = [];
  const ecarts: ResultatPatch['ecarts'] = [];
  const passes = groupes.length ? groupes : [{ valeurs: {}, par: options.lien?.par ?? 'catalogue', source: '', niveau: 'repris' as const }];
  passes.forEach((g, i) => {
    const r = patchDeTrous(courant, g.valeurs, { par: g.par, source: g.source, ...(g.url ? { url: g.url } : {}), niveau: g.niveau, ...(g.deduit ? { deduit: g.deduit } : {}) }, tour.le,
      { ...(options.lien ? { lien: options.lien } : {}), ...(options.lien || ficheDe(courant) ? { cle: t.cle } : {}), ...(i === 0 && options.aControler !== undefined ? { aControler: options.aControler } : {}), ...(i === 0 && options.propose !== undefined ? { propose: options.propose } : {}) });
    Object.assign(patch, r.patch);
    courant = { ...courant, ...r.patch };
    remplis.push(...r.remplis);
    ecarts.push(...r.ecarts);
  });
  if (Object.keys(patch).length) {
    FirestoreRepo.put('stockItems', t.ref, patch, { merge: true });
    tour.ecrits.set(t.ref, courant);
    const sources = [...new Set(groupes.filter(g => Object.keys(g.valeurs).some(c => remplis.includes(c as ChampFiche))).map(g => g.source))];
    const details = [
      remplis.length ? `Rempli : ${remplis.filter(c => c !== 'technicalSource').join(', ') || 'source'}${sources.length ? ` (source : ${sources.join(' ; ')})` : ''}` : 'Fiche liée',
      ...ecarts.map(e => `Écart non écrit : ${e.champ} lu ${JSON.stringify(e.lue)}, trouvé ${JSON.stringify(e.trouvee)}`),
    ].join(' · ');
    try { StorageService.logAction('Modification', 'Stocks', t.ref, `Fiche de l’article complétée : ${lu.name}`, details); } catch { /* le journal ne bloque pas l'écriture */ }
  } else if (ecarts.length) {
    try { StorageService.logAction('Modification', 'Stocks', t.ref, `Fiche de l’article : valeurs trouvées non écrites (${lu.name})`, ecarts.map(e => `${e.champ} lu ${JSON.stringify(e.lue)}, trouvé ${JSON.stringify(e.trouvee)}`).join(' · ')); } catch { /* idem */ }
  }
  return { ok: true, remplis };
}

/** Les valeurs remplies (encore vivantes) d'un article source, groupées par source : jamais ses valeurs lues. */
function remplisDe(source: StockItem, champs: readonly ChampFiche[], par: ParFiche, niveau: 'sur' | 'repris'): Ecriture[] {
  const groupes = new Map<string, Ecriture>();
  for (const champ of champs) {
    const r = rempliDe(source, champ);
    if (!r) continue;
    const k = `${r.source}\u0000${r.url ?? ''}`;
    const g = groupes.get(k) ?? { valeurs: {}, par, source: r.source, ...(r.url ? { url: r.url } : {}), niveau, deduit: {} };
    g.valeurs[champ] = r.valeur;
    if (r.deduit) g.deduit![champ] = r.deduit;
    groupes.set(k, g);
  }
  return [...groupes.values()];
}

interface Retenue { source: StockItem; parente: Exclude<Parente, 'autre'> }
/** Étape 2 (PLAN § 3.3, § 3.4) : un article du stock qui porte la fiche de ce produit (même clé, ou `proche`). Un `meme` prime sur un `proche`. */
function retenueDe(t: TravailFiche, tour: Tour, cle = t.cle): Retenue | undefined {
  const voulu = lireCle(cle);
  if (!voulu?.mots) return undefined;
  let meme: StockItem | undefined, proche: StockItem | undefined;
  for (const item of stockDuTour(tour)) {
    if (item.ref === t.ref || !item.fiche) continue;
    const p = lireCle(cleDeLArticle(item));
    if (!p || ficheDe(item)?.aControler) continue;
    const parente = memeProduitDeFiche(voulu, p);
    const plusRiche = (a: StockItem | undefined) => !a || Object.keys(ficheDe(item)?.remplis ?? {}).length > Object.keys(ficheDe(a)?.remplis ?? {}).length;
    if (parente === 'meme' && plusRiche(meme)) meme = item;
    else if (parente === 'proche' && plusRiche(proche)) proche = item;
  }
  if (meme) return { source: meme, parente: 'meme' };
  if (proche) return { source: proche, parente: 'proche' };
  return undefined;
}
const lienDeSource = (s: StockItem, par: ParFiche): Lien => ({ id: ficheDe(s)!.id, approchee: ficheDe(s)!.approchee, par });

// La requête et la porte « identifiable » vivent dans enrichissementRequete.ts (pures, partagées avec le banc) ; réexportées ici pour les importeurs.
export { requeteDe } from './enrichissementRequete';

/** M1 : un travail qui a levé. L'essai est noté (un jour d'échec, l'heure, la vie de page) ; trois jours → `echec`. La file passe au suivant. */
export function essaiQuiALeve(t: TravailFiche, tour: Pick<Tour, 'ms' | 'le' | 'jour'>): TravailFiche {
  const joursEchec = [...new Set([...t.essais.joursEchec, tour.jour])];
  const avec: TravailFiche = { ...t, etat: 'attend', essais: { ...t.essais, joursEchec, dernier: tour.ms, vie: VIE } };
  return joursEchec.length >= JOURS_ECHEC ? { ...avec, etat: 'echec', raison: 'troisJours', finiLe: tour.le, annonce: false } : avec;
}

async function chargerPour(t: TravailFiche, tour: Tour): Promise<boolean> {
  try {
    tour.cat ??= await tour.env.catalogues();
    // D2 (REVUE-code) : le catalogue des levures (1,4 Mo) n'est chargé que pour un travail de levure.
    if (t.famille === 'levure') tour.levures ??= await tour.cat.referencesLevures();
    if (t.famille === 'houblon') tour.houblons ??= await tour.cat.cataloguePleinHoublons();
    return true;
  } catch { return false; }
}

/** Le lien du catalogue pour une levure sûre ou à contrôler, et ses valeurs (trous seulement). */
async function ecritureLevure(tour: Tour, f: FicheLevure): Promise<{ lien: Lien; groupes: Ecriture[]; aControler: boolean } | undefined> {
  if ((f.cas !== 'sur' && f.cas !== 'aControler') || !f.reference) return undefined;
  const v = await tour.cat!.valeursDeCatalogueLevure(f.reference);
  const aControler = f.cas === 'aControler';
  return {
    lien: { id: `levure:${f.reference.id}`, approchee: false, par: 'catalogue' }, aControler,
    groupes: v ? [{ valeurs: v.valeurs, par: 'catalogue', source: v.source, ...(v.url ? { url: v.url } : {}), niveau: aControler ? 'repris' : 'sur' }] : [],
  };
}

/** Un travail, porte par porte, étape par étape (PLAN § 4.3). Ne lève que l'`ExecutantInterdit` (test). */
export async function traiterTravail(t: TravailFiche, tour: Tour): Promise<TravailFiche> {
  // REVUE-code D1 : hors ligne, rien n'est écrit, même sur une dépense déjà confirmée (avant les portes, qui ne testent le réseau qu'en attente).
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return enAttente(t);
  const porte = await portes(t, tour);
  if ('travail' in porte) return porte.travail;
  if (!articleDuTour(t.ref, tour)) return finir(t, tour, 'abandonne', { raison: 'supprime' });
  if (!(await chargerPour(t, tour))) return enAttente(t);
  const item = articleDuTour(t.ref, tour);
  if (!item) return finir(t, tour, 'abandonne', { raison: 'supprime' });
  const fiche = ficheDe(item);
  const fait = (r: { ok: boolean; remplis: ChampFiche[] }, etat: EtatTravail, extra: Partial<TravailFiche> = {}) =>
    (r.ok ? finir(t, tour, etat, { ...extra, ...(r.remplis.length ? { remplis: [...new Set([...(t.remplis ?? []), ...r.remplis])] } : {}) }) : finir(t, tour, 'abandonne', { raison: 'supprime' }));

  // 1. Catalogue du dépôt.
  if (t.famille === 'houblon') {
    const trouvee = ficheLaPlusProche(t.ligne.nomPropre, 'Houblon', t.ligne.lu.origine, t.ligne.lu.alpha, undefined, { houblons: tour.houblons });
    if (trouvee) {
      if (fiche && fiche.id !== trouvee.id) return fait(ecrire(t, tour, [], { aControler: true, propose: trouvee.id }), 'aControler', { raison: 'propose' });
      return fait(ecrire(t, tour, [], { lien: { id: trouvee.id, approchee: trouvee.approchee, par: 'catalogue' } }), 'fait');
    }
    // Houblon hors catalogue : une fiche retenue, sinon à saisir. Jamais de recherche en ligne, jamais d'α.
    const ret = retenueDe(t, tour);
    if (ret && !fiche) return fait(ecrire(t, tour, [], { lien: lienDeSource(ret.source, 'retenue'), ...(ret.parente === 'proche' ? { aControler: true } : {}) }), ret.parente === 'proche' ? 'aControler' : 'fait', ret.parente === 'proche' ? { raison: 'proche' } : {});
    if (fiche) return fait(ecrire(t, tour, [], {}), 'fait');
    return finir(t, tour, 'aSaisir', { raison: 'horsCatalogue' });
  }

  let levure: FicheLevure | undefined;
  if (t.famille === 'levure') {
    levure = ficheLevureDe(t.ligne.description, tour.levures ?? []);
    if (levure.cas === 'ambigu') return finir(t, tour, 'aControler', { raison: 'ambigu', candidats: levure.candidats.slice(0, 3).map(c => c.id) });
    const e = await ecritureLevure(tour, levure);
    if (e) {
      const id = e.lien.id;
      if (fiche && fiche.id !== id) return fait(ecrire(t, tour, e.groupes, { aControler: true, propose: id }), 'aControler', { raison: 'propose' });
      return fait(ecrire(t, tour, e.groupes, { lien: e.lien, ...(e.aControler ? { aControler: true } : {}) }), e.aControler ? 'aControler' : 'fait');
    }
  }

  // 2. Fiches retenues : un article du même produit, puis la réponse déjà reçue pour cette clé. Aucun appel.
  const trous = trousDe(item, t.famille).filter(c => c !== 'technicalSource');
  const ret = retenueDe(t, tour);
  if (ret) {
    const gen = generique(t.famille, t.ligne.nomPropre);
    const valeursPermises = ret.parente === 'meme' ? (!gen || t.s6.voisinRef === ret.source.ref) : !gen;
    const groupes = valeursPermises ? remplisDe(ret.source, [...trous, 'technicalSource'], 'retenue', 'repris') : [];
    const proche = ret.parente === 'proche';
    const r = ecrire(t, tour, groupes, { lien: lienDeSource(ret.source, 'retenue'), ...(proche ? { aControler: true } : {}) });
    return fait(r, proche ? 'aControler' : 'fait', proche ? { raison: 'proche' } : {});
  }
  const deja = await tour.store.reponses.get(t.cle);
  if (deja?.trouvee) {
    const v = tour.cat!.valeursDeReponse(t.famille, deja.facts);
    if (v) return fait(ecrire(t, tour, [{ valeurs: v.valeurs, par: 'retenue', source: v.source, ...(v.url ? { url: v.url } : {}), niveau: 'repris', deduit: v.deduit }], { lien: { id: `cle:${t.cle}`, approchee: false, par: 'retenue' } }), 'fait');
  }
  if (!trous.length) return fait(fiche ? ecrire(t, tour, [], {}) : { ok: true, remplis: [] }, 'fait');
  if (!identifiable(t, levure)) return finir(t, tour, 'aSaisir', { raison: 'nonIdentifiable' });
  if (deja && !deja.trouvee && tour.ms - Date.parse(deja.le) < REESSAI_INTROUVABLE_MS) return finir(t, tour, 'introuvable');

  // 3. Recherche en ligne, si permise.
  if (!iaPermise()) return finir(t, tour, 'iaEteinte');
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return enAttente(t);
  if (t.essais.vie === VIE && t.essais.dernier !== undefined && tour.ms - t.essais.dernier < ECART_ESSAIS_MS) return enAttente(t);
  const compteur = (await tour.store.compteur.get(tour.jour)) ?? { jour: tour.jour, recherches: 0, tentatives: 0 };
  if (compteur.recherches >= PLAFOND_JOUR || compteur.tentatives >= PLAFOND_TENTATIVES) return finir(t, tour, 'plafond', { plafondLe: tour.jour });
  const executer = tour.env.executant();
  await tour.store.compteur.put({ ...compteur, tentatives: compteur.tentatives + 1 });
  const essais = { ...t.essais, dernier: tour.ms, vie: VIE };
  let reponse: AiResponse<IngredientFacts>;
  try { reponse = await executer(requeteDe(t, trous)); }
  catch (error) { reponse = { ok: false, error: error instanceof Error ? error.message : String(error) }; }
  const apres = (await tour.store.compteur.get(tour.jour)) ?? { ...compteur, tentatives: compteur.tentatives + 1 };

  if (!reponse.ok) {
    const classe = classerEchec(reponse.error);
    const suite = SUITE_ECHEC[classe];
    if (suite.plafond) await tour.store.compteur.put({ ...apres, recherches: apres.recherches + 1 });
    const joursEchec = suite.jour ? [...new Set([...essais.joursEchec, tour.jour])] : essais.joursEchec;
    const avec = { ...t, essais: { ...essais, joursEchec } };
    if (joursEchec.length >= JOURS_ECHEC) return finir(avec, tour, 'echec', { raison: 'troisJours' });
    if (suite.etat === 'echec') return finir(avec, tour, 'echec', { raison: 'refus' });
    if (suite.etat === 'plafond') return finir(avec, tour, 'plafond', { plafondLe: tour.jour });
    if (suite.etat === 'iaEteinte') return finir(avec, tour, 'iaEteinte');
    if (suite.etat === 'introuvable') {
      await tour.store.reponses.put({ cle: t.cle, trouvee: false, le: tour.le });
      return finir(avec, tour, 'introuvable');
    }
    return enAttente(avec);
  }
  await tour.store.compteur.put({ ...apres, recherches: apres.recherches + 1 });
  const avec = { ...t, essais };
  // M1 (REVUE-code) : la réponse payante est gardée AVANT son adaptation : une adaptation qui lève ne la fait jamais redemander.
  const publiee = Boolean(reponse.data?.found && reponse.data?.source?.trim());
  await tour.store.reponses.put({ cle: t.cle, trouvee: publiee, ...(publiee && reponse.data ? { facts: reponse.data } : {}), le: tour.le });
  const v = tour.cat!.valeursDeReponse(t.famille, reponse.data);
  if (!v && publiee) await tour.store.reponses.put({ cle: t.cle, trouvee: false, le: tour.le });
  if (!v) return finir(avec, tour, 'introuvable');
  const enLigne: Ecriture = { valeurs: v.valeurs, par: 'en-ligne', source: v.source, ...(v.url ? { url: v.url } : {}), niveau: 'repris', deduit: v.deduit };

  // 4. Le nom publié repasse par le catalogue et les fiches retenues : les valeurs du catalogue priment.
  if (v.nom) {
    if (t.famille === 'levure') {
      const parNom = await ecritureLevure(tour, ficheLevureDe(v.nom, tour.levures ?? []));
      if (parNom) return fait(ecrire(avec, tour, [...parNom.groupes, enLigne], { lien: parNom.lien, ...(parNom.aControler ? { aControler: true } : {}) }), parNom.aControler ? 'aControler' : 'fait');
    }
    const parNom = retenueDe(avec, tour, cleFiche(t.famille, v.nom));
    if (parNom?.parente === 'meme') {
      return fait(ecrire(avec, tour, [...remplisDe(parNom.source, [...trous, 'technicalSource'], 'retenue', 'repris'), enLigne], { lien: lienDeSource(parNom.source, 'retenue') }), 'fait');
    }
  }
  return fait(ecrire(avec, tour, [enLigne], { lien: { id: `cle:${t.cle}`, approchee: false, par: 'en-ligne' } }), 'fait');
}

