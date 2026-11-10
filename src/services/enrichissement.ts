import type { StockItem } from '../types';
import type { PurchaseDraft, PurchaseLineDraft } from './purchaseEntry';
import type { AiResponse } from './aiClient';
import type { IngredientFacts } from '../domain/ingredientFacts';
import type { Tour } from './enrichissementTravail';
import { StorageService } from './storage';
import { FirestoreRepo } from './firestoreRepo';
import { categorieArticleNeuf, donneesDeLigne, linkUnit, type MembreVirtuel } from './stockLineMatching';
import { isReadableUnit } from './ingredientIdentity';
import { articleNeufDe, ligneDeBrouillon } from '../domain/stock/articleNeuf';
import { nomPropre } from '../domain/stock/donnees';
import { cleFiche, type Famille } from '../domain/stock/ficheCle';
import { ficheDe } from '../domain/stock/ficheValeurs';
import { createDexieFichesStore, type MagasinFiches, type TravailFiche } from './enrichissementStore';
import { REESSAI_INTROUVABLE_MS, enTest, iaPermise, jourDeZurich } from './enrichissementReglages';

/**
 * La procédure d'enrichissement des fiches (voie f4-enrichir, D276, PLAN § 3 et § 4) : après « Confirmer », en arrière-plan, chaque article NEUF de
 * la dépense reçoit sa fiche. Ordre fixe : le catalogue du dépôt (levures comprises), puis les fiches déjà retenues pour le même produit (la clé de
 * fiche, une seule fiche par produit), puis, seulement si rien n'a été trouvé et si c'est permis, la tâche existante `lookupIngredient`.
 * Seuls les trous sont remplis, chaque valeur avec sa trace (`fiche.remplis`, P1) ; un article existant n'est jamais touché.
 * Aucune minuterie : les réveils de `startProofQueue`. Rien ne lève vers l'appelant.
 */

// ─── Injections (tests) ──────────────────────────────────────────────────────────────────────

export type ModuleCatalogues = typeof import('./enrichissementCatalogues');
export interface RequeteFiche { kind: 'malt' | 'levure'; name: string; instruction: string; context: Record<string, unknown> }
/** La forme brute d'`AiClient.run` : l'adaptation (`valeursDeReponse`) est faite ici, et testée. */
export type RechercheFiche = (req: RequeteFiche) => Promise<AiResponse<IngredientFacts>>;

let magasin: MagasinFiches | null | undefined;
let magasinDefaut: MagasinFiches | null | undefined;
let recherche: RechercheFiche | null = null;
let catalogues: (() => Promise<ModuleCatalogues>) | null = null;
let horloge: (() => number) | null = null;
let utilisateur: (() => Promise<string | undefined>) | null = null;

/** `undefined` rend le magasin Dexie ; `null` : aucun magasin (la procédure est sans effet). */
export function setEnrichissementStore(store: MagasinFiches | null | undefined): void { magasin = store; }
export function setRechercheFiche(fn: RechercheFiche | null): void { recherche = fn; }
export function setCataloguesFiche(loader: (() => Promise<ModuleCatalogues>) | null): void { catalogues = loader; }
export function setHorlogeFiche(fn: (() => number) | null): void { horloge = fn; }
export function setUtilisateurFiche(fn: (() => Promise<string | undefined>) | null): void { utilisateur = fn; }

const maintenant = () => (horloge ? horloge() : Date.now());
const isoDe = (ms: number) => new Date(ms).toISOString();
function magasinCourant(): MagasinFiches | null {
  if (magasin !== undefined) return magasin;
  if (magasinDefaut === undefined) magasinDefaut = createDexieFichesStore();
  return magasinDefaut;
}
export const enrichissementDisponible = (): boolean => magasinCourant() !== null;
const chargerCatalogues = (): Promise<ModuleCatalogues> => (catalogues ? catalogues() : import('./enrichissementCatalogues'));
async function uidCourant(): Promise<string | undefined> {
  if (utilisateur) return utilisateur();
  try { return (await import('./firebaseAuth')).FirebaseAuthService.getCurrentUser()?.uid; } catch { return undefined; }
}

/** En test, sans exécutant injecté, l'exécutant réel est interdit (P4) : le test échoue, aucun appel ne part. */
export class ExecutantInterdit extends Error { constructor() { super('f4 : exécutant réel interdit en test (setRechercheFiche).'); this.name = 'ExecutantInterdit'; } }
export function executantDeRecherche(): RechercheFiche {
  if (recherche) return recherche;
  if (enTest()) throw new ExecutantInterdit();
  return async req => {
    const { AiClient } = await import('./aiClient');
    return AiClient.run<IngredientFacts>({ task: 'lookupIngredient', tier: 'fast', instruction: req.instruction, context: req.context });
  };
}

const ecouteurs = new Set<() => void>();
export function subscribeEnrichissement(cb: () => void): () => void { ecouteurs.add(cb); return () => { ecouteurs.delete(cb); }; }
function emettre() { for (const cb of ecouteurs) { try { cb(); } catch { /* un écouteur ne casse pas la file */ } } }

// ─── Planifier (P5 : ne lève jamais) ─────────────────────────────────────────────────────────

const FAMILLE_DE_CATEGORIE: Readonly<Record<string, Famille>> = { Houblon: 'houblon', Levure: 'levure', Malt: 'malt', Sucre: 'malt' };
/** Même règle que `uniteEffective` (`purchaseEntry.ts`), recopiée pour ne pas importer `purchaseEntry` (qui importera ce module). */
const uniteDe = (line: Pick<PurchaseLineDraft, 'unit' | 'uniteDeduite'>) =>
  isReadableUnit(line.unit) ? line.unit : line.uniteDeduite && isReadableUnit(line.uniteDeduite.unite) ? line.uniteDeduite.unite : line.unit;
const contexteDeFamille = (f: Famille) => (f === 'houblon' ? 'Houblon' as const : f === 'levure' ? 'Levure' as const : 'Malt' as const);

/**
 * Les travaux d'une saisie, pur : un par ligne `stockAction: 'new'` de houblon, malt, sucre ou levure (ref `MP-<saisie>-<ligne>`). Le verdict de s6
 * est recalculé comme `articlesNeufsDe` (stock sans les articles de cette saisie, membres virtuels dans l'ordre des lignes). La ligne est capturée :
 * tout le rapprochement se fait sur elle, jamais sur l'article relu (il peut l'avoir renommé).
 */
export function travauxDeLaSaisie(draft: PurchaseDraft, stock: readonly StockItem[], uid: string, ms: number): TravailFiche[] {
  const prefixe = `MP-${draft.submissionId}-`;
  const autres = stock.filter(item => !item.ref.startsWith(prefixe));
  const virtuels: MembreVirtuel[] = [];
  const out: TravailFiche[] = [];
  draft.lines.forEach((line, index) => {
    if (line.stockAction !== 'new') return;
    const unit = uniteDe(line);
    const lp = ligneDeBrouillon({ ...line, unit }, draft.vendor);
    const neuf = articleNeufDe(lp, autres, {}, line.articleName, virtuels);
    virtuels.push({ nom: neuf.name });
    if (line.kind === 'cleaning') return;
    const famille = FAMILLE_DE_CATEGORIE[categorieArticleNeuf({ description: line.description, stockCategory: line.stockCategory, reference: line.sourceReference, kind: line.kind })];
    if (!famille) return;
    const lu = isReadableUnit(unit) ? linkUnit(unit) : undefined;
    const nom = famille === 'levure' ? line.description.trim() : nomPropre(line.description, contexteDeFamille(famille), { unit: lu, quantity: line.quantity });
    const r = neuf.regle;
    const donnees = donneesDeLigne(lp).donnees;
    out.push({
      ref: `${prefixe}${index}`, submissionId: draft.submissionId, transactionId: `TX-${draft.submissionId}`, uid, famille,
      ligne: {
        description: line.description.trim(), nomPropre: nom, unit, ...(line.quantity !== undefined ? { quantity: line.quantity } : {}),
        ...(line.sourceReference?.trim() ? { reference: line.sourceReference.trim() } : {}), ...(draft.vendor?.trim() ? { fournisseur: draft.vendor.trim() } : {}),
        ...(line.kind ? { kind: line.kind } : {}), ...(line.stockCategory ? { stockCategory: line.stockCategory } : {}),
        lu: { ...(donnees.alpha !== undefined ? { alpha: donnees.alpha } : {}), ...(donnees.origine !== undefined ? { origine: donnees.origine } : {}), ...(donnees.ebc !== undefined ? { ebc: donnees.ebc } : {}) },
      },
      s6: { cas: r.cas, ...(r.cas === 'neuf' || r.cas === 'incertain' ? { voisinRef: r.voisin.ref } : {}), ...(r.cas === 'neuf' ? { motif: r.motif } : {}) },
      cle: cleFiche(famille, nom), etat: 'attend', essais: { joursEchec: [] }, creeLe: isoDe(ms), annonce: false,
    });
  });
  return out;
}

/**
 * Après un `savePurchase` réussi. Calcule les travaux tout de suite (le stock de l'instant), puis les range sans attendre. Idempotent : un travail
 * existant est gardé tel quel, sauf `abandonne` pour rejet (rejeu d'une saisie refusée), réarmé. Ne lève jamais.
 */
export function planifierEnrichissement(draft: PurchaseDraft): void {
  try {
    const store = magasinCourant();
    if (!store || !draft?.lines?.some(line => line.stockAction === 'new')) return;
    const ms = maintenant();
    const stocks = StorageService.getStocks();
    const stock = [...stocks.rawMaterials, ...stocks.cleaning];
    const rangement = (async () => {
      const uid = await uidCourant();
      if (!uid) return;
      const travaux = travauxDeLaSaisie(draft, stock, uid, ms);
      if (!travaux.length) return;
      for (const t of travaux) {
        const existant = await store.travaux.get(t.ref);
        if (!existant) await store.travaux.put(t);
        else if (existant.etat === 'abandonne' && existant.raison === 'rejet') {
          const rearme: TravailFiche = { ...existant, etat: 'attend', annonce: false };
          delete rearme.raison; delete rearme.finiLe;
          await store.travaux.put(rearme);
        }
      }
      emettre();
      reveiller('planifier');
    })().catch(() => undefined);
    planifications = Promise.all([planifications, rangement]).then(() => undefined);
  } catch { /* P5 : jamais un lancer dans le `try` de l'enregistrement */ }
}
/**
 * M3 (REVUE-code) : les faits d'une recette pour un produit `proche` d'une fiche f4 (`enrichissementRecette.ts`) : gardés dans un travail « à
 * contrôler » (ref `RECETTE-<clé>`), jamais écrits sur un article. Le travail n'est jamais traité par la file (`aControler` est final) ; l'écran
 * « à contrôler » le montre. Ne lève jamais.
 */
export async function garderFaitsProches(nom: string, categorie: string | undefined, faits: TravailFiche['faits']): Promise<void> {
  try {
    const store = magasinCourant();
    const famille = FAMILLE_DE_CATEGORIE[(categorie ?? '').trim().replace(/^./, c => c.toUpperCase())];
    if (!store || !famille || famille === 'houblon') return;
    const uid = await uidCourant();
    if (!uid) return;
    const cle = cleFiche(famille, nom);
    const ref = `RECETTE-${encodeURIComponent(cle)}`;
    const ancien = await store.travaux.get(ref);
    const le = isoDe(maintenant());
    await store.travaux.put({
      ref, submissionId: '', transactionId: '', uid, famille,
      ligne: { description: nom.trim(), nomPropre: nom.trim(), unit: '', lu: {} }, s6: { cas: 'inconnu' }, cle,
      etat: 'aControler', raison: 'proche', essais: { joursEchec: [] }, creeLe: ancien?.creeLe ?? le, finiLe: le, annonce: false,
      faits: { ...(ancien?.faits ?? {}), ...(faits ?? {}) },
    });
    emettre();
  } catch { /* les faits restent dans la recette ; le journal l'a dit */ }
}

let planifications: Promise<void> = Promise.resolve();
/** Un réveil sans attente : la file ne casse jamais l'application. */
const reveiller = (raison: string) => { void runEnrichissement(raison).catch(() => undefined); };

// ─── Tenir (feuille Dépense montée) ──────────────────────────────────────────────────────────

let tenues = 0;
/** Posé par `ExpenseSheet` : tant qu'une feuille est montée, rien n'est traité. Rend la libération (cleanup de `useEffect`). */
export function tenirEnrichissement(): () => void {
  tenues++;
  let rendue = false;
  return () => {
    if (rendue) return;
    rendue = true;
    tenues = Math.max(0, tenues - 1);
    if (!tenues && magasinCourant()) reveiller('libere');
  };
}
export const enrichissementTenu = (): boolean => tenues > 0;

// ─── La file (le travail lui-même : `enrichissementTravail.ts`, importé par `import()`) ─────────

/** Un travail se reprend-il à ce réveil ? (`iaEteinte` si la recherche est permise maintenant, `plafond` le jour suivant, `introuvable` après 30 jours.) */
function aReprendre(t: TravailFiche, ms: number, jour: string): boolean {
  if (t.etat === 'attend') return true;
  if (t.etat === 'iaEteinte') return iaPermise();
  if (t.etat === 'plafond') return t.plafondLe !== jour;
  if (t.etat === 'introuvable') return t.finiLe !== undefined && ms - Date.parse(t.finiLe) >= REESSAI_INTROUVABLE_MS;
  return false;
}

async function runOnce(): Promise<void> {
  if (tenues > 0) return;
  const store = magasinCourant();
  if (!store || !StorageService.isReady()) return;
  const uid = await uidCourant();
  if (!uid) return;
  const ms = maintenant(), jour = jourDeZurich(ms);
  const travaux = (await store.travaux.all()).filter(t => t.uid === uid && aReprendre(t, ms, jour))
    .sort((a, b) => a.creeLe.localeCompare(b.creeLe) || a.ref.localeCompare(b.ref, 'en', { numeric: true }));
  if (!travaux.length) return;
  // Le travail n'est chargé que s'il y a un travail : rien au démarrage d'une page sans dépense neuve. Échec de chargement : le réveil suivant.
  const { traiterTravail, essaiQuiALeve } = await import('./enrichissementTravail');
  const tour: Tour = { env: { executant: executantDeRecherche, catalogues: chargerCatalogues }, ms, le: isoDe(ms), jour, store, ecrits: new Map() };
  for (const t of travaux) {
    if (tenues > 0) break;
    const repris: TravailFiche = t.etat === 'attend' ? t : { ...t, etat: 'attend' };
    let suite: TravailFiche;
    try { suite = await traiterTravail(repris, tour); }
    catch (error) {
      // REVUE-code M1 : un travail qui lève ne bloque plus la file. L'essai est noté (jour d'échec, écart de 30 min), puis le travail suivant.
      // Une réponse payante déjà arrivée est gardée (`reponses`) avant son adaptation : elle n'est pas redemandée.
      if (error instanceof ExecutantInterdit) throw error;
      suite = essaiQuiALeve(repris, tour);
    }
    if (JSON.stringify(suite) !== JSON.stringify(t)) { await store.travaux.put(suite); emettre(); }
  }
}

let enCours: Promise<void> | null = null;
let encore = false;
const VERROU = 'laffinee-file-fiches';
/**
 * Un tour de la file ; un seul travailleur (`navigator.locks`, sinon un drapeau). Pendant un tour, un réveil demande un tour de plus et rend la
 * promesse du tour en cours. Ne lève jamais, sauf l'`ExecutantInterdit` en test.
 */
export function runEnrichissement(_raison: string): Promise<void> {
  if (enCours) { encore = true; return enCours; }
  enCours = boucle().finally(() => { enCours = null; });
  return enCours;
}
/** Pour les tests : attend que les planifications rangées et le tour en cours soient finis. */
export async function enrichissementAuRepos(): Promise<void> {
  for (;;) {
    const p = planifications, r = enCours;
    await p; if (r) await r.catch(() => undefined);
    if (p === planifications && enCours === null) return;
  }
}
async function boucle(): Promise<void> {
  do {
    encore = false;
    const locks = typeof navigator !== 'undefined' ? (navigator as Navigator & { locks?: LockManager }).locks : undefined;
    try {
      if (locks?.request) await locks.request(VERROU, { ifAvailable: true }, async lock => { if (lock) await runOnce(); });
      else await runOnce();
    } catch (error) {
      if (error instanceof ExecutantInterdit) throw error;
      /* la file ne casse jamais l'application ; le réveil suivant réessaie */
    }
  } while (encore);
}

/** Les réveils (comme `startProofQueue`) : démarrage, `online`, `focus`, `pageshow`, `visibilitychange`, cache prêt. Aucune minuterie. */
export function startEnrichissement(): () => void {
  if (typeof window === 'undefined' || !magasinCourant()) return () => undefined;
  let pret = false;
  const reveil = (raison: string) => () => { if (raison === 'online' || document.visibilityState !== 'hidden') reveiller(raison); };
  const handlers: Array<[EventTarget, string, () => void]> = [
    [window, 'online', reveil('online')], [window, 'focus', reveil('focus')], [window, 'pageshow', reveil('pageshow')], [document, 'visibilitychange', reveil('visible')],
  ];
  for (const [cible, nom, h] of handlers) cible.addEventListener(nom, h);
  const desabonner = FirestoreRepo.subscribe(() => {
    const ready = StorageService.isReady();
    if (ready && !pret) reveiller('ready');
    pret = ready;
  });
  reveiller('start');
  return () => { for (const [cible, nom, h] of handlers) cible.removeEventListener(nom, h); desabonner(); };
}

// ─── Pour l'écran (voie d'interface à venir) ─────────────────────────────────────────────────

export interface ResumeEnrichissement { remplies: number; aControler: number; introuvables: number; aSaisir: number; echecs: number; enAttente: number; plafond: number; iaEteinte: number }
/** Le retour discret d'un réveil : compté sur les travaux finis non encore annoncés, plus ceux qui attendent. */
export async function resumeEnrichissement(): Promise<ResumeEnrichissement> {
  const out: ResumeEnrichissement = { remplies: 0, aControler: 0, introuvables: 0, aSaisir: 0, echecs: 0, enAttente: 0, plafond: 0, iaEteinte: 0 };
  const store = magasinCourant();
  if (!store) return out;
  const uid = await uidCourant();
  for (const t of await store.travaux.all()) {
    if (uid && t.uid !== uid) continue;
    if (t.etat === 'attend') { out.enAttente++; continue; }
    if (t.annonce) continue;
    if (t.etat === 'fait') out.remplies++;
    else if (t.etat === 'aControler') out.aControler++;
    else if (t.etat === 'introuvable') out.introuvables++;
    else if (t.etat === 'aSaisir') out.aSaisir++;
    else if (t.etat === 'echec') out.echecs++;
    else if (t.etat === 'plafond') out.plafond++;
    else if (t.etat === 'iaEteinte') out.iaEteinte++;
  }
  return out;
}
export async function marquerResumeVu(): Promise<void> {
  const store = magasinCourant();
  if (!store) return;
  for (const t of await store.travaux.all()) if (t.etat !== 'attend' && !t.annonce) await store.travaux.put({ ...t, annonce: true });
  emettre();
}
/** « Relancer » une fiche en échec, introuvable, à saisir, plafonnée ou éteinte : elle repasse `attend`, ses jours d'échec effacés. */
export async function relancerFiche(ref: string): Promise<boolean> {
  const store = magasinCourant();
  const t = store ? await store.travaux.get(ref) : undefined;
  // REVUE-code-2 D-a : un travail `RECETTE-…` (faits d'une recette gardés à contrôler, M3) n'a pas de dépense : il ne se relance pas.
  if (!store || !t || ref.startsWith('RECETTE-') || t.etat === 'attend' || t.etat === 'fait' || t.etat === 'abandonne') return false;
  const relance: TravailFiche = { ...t, etat: 'attend', essais: { joursEchec: [] }, annonce: false };
  delete relance.raison; delete relance.finiLe; delete relance.plafondLe;
  await store.travaux.put(relance);
  emettre();
  reveiller('relance');
  return true;
}
/** « Vu » : il a vu la fiche ; les valeurs remplies jusqu'ici deviennent sûres (`le <= vu`). Synchrone, comme toute écriture du stock. */
export function marquerFicheVue(ref: string, ms = maintenant()): boolean {
  const s = StorageService.getStocks();
  const item = [...s.rawMaterials, ...s.cleaning].find(i => i.ref === ref);
  const fiche = item ? ficheDe(item) : undefined;
  if (!item || !fiche) return false;
  FirestoreRepo.put('stockItems', ref, { fiche: { ...fiche, vu: isoDe(ms) } }, { merge: true });
  return true;
}
