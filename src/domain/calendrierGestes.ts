import type { Batch } from '../types';
import type { FinancialPlan } from './finance/types';
import { isoDate } from './finance/ledger';
import { plannedBrewDate, rescheduleBatchPatch } from './batchSchedule';
import {
  ajouterJours, dimancheDe, dureeBrassin, dureePasBrassee, ecartJours, etiquetteS, finDeBrassin, idChoseArgent, jalonsBrassin, jourLisible, lundiDe,
  type ChoseCalendrier, type CibleOuverture, type JalonId
} from './calendrier';
import {
  courbeAvec, courbeAvecMise, courbeDecalee, courbeSans, effetCaisse,
  type CourbeCaisse, type EffetCaisse, type MiseDeCote, type MouvementCaisse
} from './calendrierCaisse';
import { enregistrementIdee } from './calendrierAjout';

/**
 * Rattache chaque mouvement de la courbe à la chose qui le porte (`chose.mouvements`) : l'id d'une chose est stable après un déplacement
 * (`idChoseArgent`), et les caddies d'un brassin regroupés portent les mouvements de leurs lignes. L'aperçu du glisser, l'effet d'un geste
 * et l'étoile suivent ainsi la bonne chose. Pure ; les montants ne changent pas.
 */
export function alignerCourbe(courbe: CourbeCaisse | null, choses: readonly ChoseCalendrier[]): CourbeCaisse | null {
  if (!courbe) return courbe;
  const par = new Map<string, string>();
  for (const c of choses) for (const m of c.mouvements ?? []) par.set(m, c.id);
  if (!par.size) return courbe;
  const fixer = <T extends { id: string; choseId?: string }>(m: T): T => { const id = par.get(m.id); return id && id !== m.choseId ? { ...m, choseId: id } : m; };
  return { ...courbe, mouvements: courbe.mouvements.map(fixer), semaines: courbe.semaines.map(s => ({ ...s, mouvements: s.mouvements.map(fixer) })) };
}

/**
 * Les gestes du calendrier (E25, E28 à E33), en fonctions pures : une intention (déplacer, allonger, dupliquer, retirer, livrer, mettre de côté,
 * accepter, fait, lier, noter une idée) rend soit les écritures à faire (`Ecriture[]`, appliquées par `ui/calendrier/ecritures.ts`, qui sait aussi
 * les défaire), un message court et l'effet sur la caisse ; soit un REFUS avec sa raison, qui nomme l'écran où régler la chose.
 *
 * Règle de fond (L33) : on ne supprime jamais et on ne cascade jamais. Retirer enlève la date d'une chose (elle reste dans sa source, sans date,
 * dans la poche « Sans date ») ou passe un plan manuel à `cancelled` (il reste dans Finances). Aucun geste ne consomme de stock (P8).
 */

export type Collection = 'batches' | 'creativeItems' | 'financialPlans';

/** Une écriture dans la source. `undefined` dans un patch = « retirer le champ ». */
export type Ecriture =
  | { op: 'patch'; collection: Collection; id: string; patch: Record<string, unknown> }
  | { op: 'creer'; collection: Collection; document: { id: string } & Record<string, unknown>; /** Brassin : la recette dont on fige la version. */ recetteId?: string }
  | { op: 'supprimer'; collection: Collection; id: string };

export interface Message {
  texte: string;
  action?: 'Annuler';
  lien?: { texte: string; ancre: 'sans-date' | 'finances' | 'brassin'; cible?: CibleOuverture };
  /** Ce que l'écran lit en entier : « Retirée de S51 · Sans date › · Annuler ». Au plus deux lignes (E33). */
  lecture: string;
}

/** Une promesse touchée (E32) : « 3 fûts promis le 15 déc. · prête le 4 janv. », avec [Livrer le 5 janv.] [Annuler]. */
export interface Promesse {
  planId: string; titre: string;
  jourPromis: string; preteLe: string; livrerLe: string;
  texte: string;
  clientId?: string;
}

export type Resolution =
  | { ok: true; ecritures: Ecriture[]; message: Message; effet: EffetCaisse | null; promesse: Promesse | null; courbeApres: CourbeCaisse | null }
  | { ok: false; raison: string; ouvrir?: CibleOuverture; message: Message };

export interface ContexteGestes {
  aujourdhui: string;
  batches: readonly Batch[];
  plans: readonly FinancialPlan[];
  courbe: CourbeCaisse | null;
  nouvelId?: (prefixe: string) => string;
  idBrassin?: () => string;
  maintenant?: string;
}

const annuler = (texte: string, lien?: Message['lien']): Message => ({ texte, action: 'Annuler', ...(lien ? { lien } : {}), lecture: `${texte}${lien ? ` · ${lien.texte}` : ''} · Annuler` });
const refus = (raison: string, ouvrir?: CibleOuverture, lien?: Message['lien']): Resolution => ({ ok: false, raison, ...(ouvrir ? { ouvrir } : {}), message: { texte: raison, ...(lien ? { lien } : {}), lecture: `${raison}${lien ? ` · ${lien.texte}` : ''}` } });
const nouvelId = (ctx: ContexteGestes, p: string) => (ctx.nouvelId ?? ((x: string) => `${x}-${globalThis.crypto.randomUUID()}`))(p);
const SEMAINE = 7;

/** E28 : peut-on déplacer cette chose ? Sinon, la raison nomme l'écran où la régler. */
export function peutDeplacer(chose: ChoseCalendrier): { ok: true } | { ok: false; raison: string; ouvrir: CibleOuverture } {
  return chose.deplacable === true ? { ok: true } : { ok: false, raison: chose.deplacable.raison, ouvrir: chose.ouvre };
}

/**
 * Une promesse est touchée quand « prête le » dépasse sa date : un `FinancialPlan` `in` lié au brassin (`batchId`), pas annulé. La première (la
 * plus proche) l'est. « Livrer le » vaut le lendemain de « prête ». Une vente sans `batchId` ne déclenche aucune alerte.
 */
export function promesseTouchee(plans: readonly FinancialPlan[], batchId: string, preteLe: string | null | undefined): Promesse | null {
  if (!preteLe) return null;
  const touchees = plans
    .filter(p => p.direction === 'in' && p.batchId === batchId && p.status !== 'cancelled' && p.status !== 'completed')
    .flatMap(p => { const jour = isoDate(p.date); return jour && preteLe > jour ? [{ p, jour }] : []; })
    .sort((a, b) => a.jour.localeCompare(b.jour) || a.p.id.localeCompare(b.p.id));
  const premiere = touchees[0];
  if (!premiere) return null;
  return {
    planId: premiere.p.id, titre: premiere.p.title, jourPromis: premiere.jour, preteLe, livrerLe: ajouterJours(preteLe, 1),
    texte: `${premiere.p.title} promis le ${jourLisible(premiere.jour)} · prête le ${jourLisible(preteLe)}`, ...(premiere.p.clientId ? { clientId: premiere.p.clientId } : {})
  };
}

const batchDe = (chose: ChoseCalendrier, ctx: ContexteGestes) => (chose.source.genre === 'batch' ? ctx.batches.find(b => b.id === (chose.source as { id: string }).id) : undefined);
const planDe = (chose: ChoseCalendrier, ctx: ContexteGestes) => (chose.source.genre === 'plan' ? ctx.plans.find(p => p.id === (chose.source as { id: string }).id) : undefined);

const decale = (iso: string, jours: number) => ajouterJours(iso, jours);
const fenetreDecalee = (f: { du: string; au: string; joursActifs?: number; miseDeCote?: boolean } | undefined, jours: number) => (f ? { ...f, du: decale(f.du, jours), au: decale(f.au, jours) } : undefined);

/**
 * f1-a (E28) : déplacer de `semaines` (négatif : vers le passé), la longueur reste. Brassin planifié : `plannedBrewDate` par
 * `rescheduleBatchPatch` ; ses jalons suivent (ce sont des écarts), `finPrevue` aussi si elle est écrite. Avec un `jalon` : le jalon de fin écrit
 * `{ finPrevue }` ; un jalon intermédiaire ne se déplace pas seul (il suit la recette) ; en cuve, le jour de brassage ne bouge pas.
 */
export function deplacer(chose: ChoseCalendrier, semaines: number, ctx: ContexteGestes, jalon?: JalonId): Resolution {
  if (!Number.isInteger(semaines) || semaines === 0) return refus('Rien ne bouge : choisis une autre semaine.');
  const jours = semaines * SEMAINE;
  const source = chose.source;
  if (jalon) {
    const j = chose.jalons?.find(x => x.id === jalon);
    if (!j) return refus('Ce jalon n’existe pas sur ce brassin.', chose.ouvre);
    if (j.glissable === false) return refus(j.raison ?? j.libelle, chose.ouvre, { texte: 'Ouvrir le brassin ›', ancre: 'brassin', cible: chose.ouvre });
    if (j.glissable === 'fin') return allongerBrassin(chose, jours, ctx, true);
  }
  if (source.genre === 'batch') {
    const batch = batchDe(chose, ctx);
    if (!batch) return refus('Ce brassin n’existe plus. Rouvre la liste des brassins.');
    if (chose.deplacable !== true) return refus(chose.deplacable.raison, chose.ouvre);
    const prevu = isoDate(plannedBrewDate(batch));
    if (!prevu) return refus('Ce brassin n’a pas de date prévue : choisis-la dans sa fiche (Brassins).', chose.ouvre);
    const nouveau = decale(prevu, jours);
    let patch: Record<string, unknown>;
    try { patch = { ...rescheduleBatchPatch(batch, nouveau) }; } catch { return refus('Brassin en cuve : le jour de brassage ne bouge pas.', chose.ouvre); }
    const finEcrite = isoDate(batch.finPrevue || undefined);
    if (finEcrite) patch.finPrevue = decale(finEcrite, jours);
    const apres = finDeBrassin({ ...batch, ...patch } as Batch);
    const promesse = promesseTouchee(ctx.plans, batch.id, apres?.jour);
    return {
      ok: true, ecritures: [{ op: 'patch', collection: 'batches', id: batch.id, patch }], effet: null, promesse, courbeApres: ctx.courbe,
      message: annuler(`${chose.titre} : ${etiquetteS(prevu)} → ${etiquetteS(nouveau)}`)
    };
  }
  if (chose.deplacable !== true) return refus(chose.deplacable.raison, chose.ouvre);
  const avant = ctx.courbe, apres = avant ? courbeDecalee(avant, chose.id, jours) : null;
  const effet = effetCaisse(avant, apres);
  const message = annuler(effet ? effet.texte : `${chose.titre} : ${etiquetteS(chose.debut)} → ${etiquetteS(decale(chose.debut, jours))}`);
  if (source.genre === 'creative') {
    const item = { date: decale(chose.debut, jours) };
    return { ok: true, ecritures: [{ op: 'patch', collection: 'creativeItems', id: source.id, patch: { ...item, ...(chose.fenetre ? { fenetre: fenetreDecalee(chose.fenetre, jours) } : {}) } }], effet, promesse: null, courbeApres: apres, message };
  }
  const plan = planDe(chose, ctx);
  if (!plan || plan.source !== 'manual') return refus('Cette prévision se règle dans Finances.', { ecran: 'finances' });
  const date = isoDate(plan.date) ?? chose.debut;
  return { ok: true, ecritures: [{ op: 'patch', collection: 'financialPlans', id: plan.id, patch: { date: decale(date, jours), ...(plan.fenetre ? { fenetre: fenetreDecalee(plan.fenetre, jours) } : {}) } }], effet, promesse: null, courbeApres: apres, message };
}

function allongerBrassin(chose: ChoseCalendrier, jours: number, ctx: ContexteGestes, parJalon = false): Resolution {
  const batch = batchDe(chose, ctx);
  if (!batch) return refus('Ce brassin n’existe plus. Rouvre la liste des brassins.');
  if (batch.status === 'conditionne' || batch.status === 'termine' || batch.status === 'annule') return refus(chose.deplacable === true ? 'Ce brassin est fini.' : (chose.deplacable as { raison: string }).raison, chose.ouvre);
  const debut = chose.debut;
  /*
   * CRITIQUE-5 n° 1 : un brassin pas brassé n'a pas de « Jn ». Tirer son bord écrit `finPrevue` = sa fin prévue (finPrevue écrite, sinon jour
   * prévu + cycle de la recette, `pretePrevue`) + l'allongement ; la durée dit « pas brassée · prête le … ».
   */
  const pasBrassee = !!chose.pasBrassee;
  const finActuelle = pasBrassee ? (chose.pretePrevue ?? finDeBrassin(batch)?.jour ?? chose.fin) : (chose.preteLe ?? chose.fin);
  const nouvelle = decale(finActuelle, jours);
  if (nouvelle <= debut) return refus('Un brassin dure au moins un jour : tire moins loin.');
  const promesse = promesseTouchee(ctx.plans, batch.id, nouvelle);
  const duree = pasBrassee ? dureePasBrassee(nouvelle) : dureeBrassin(debut, nouvelle, ctx.aujourdhui) ?? `prête ${jourLisible(nouvelle)}`;
  return {
    ok: true, ecritures: [{ op: 'patch', collection: 'batches', id: batch.id, patch: { finPrevue: nouvelle } }], effet: null, promesse, courbeApres: ctx.courbe,
    message: annuler(parJalon ? `${chose.titre} : prête le ${jourLisible(nouvelle)}` : `${chose.titre} : ${duree}`)
  };
}

/**
 * f2-a (E29, CRITIQUE-3 n° 30) : la chose d'un brassin telle qu'elle sera après avoir tiré son bord de `jours` jours : `fin`, `preteLe` et `duree`
 * recalculés (« J7 / 35 · prête 14 déc. »). L'aperçu pendant le geste et le texte après l'écriture disent la même chose. Pure : le jour est un
 * paramètre. Une chose qui n'est pas un brassin revient telle quelle. Un brassin pas brassé (CRITIQUE-5 n° 1) : sa barre s'allonge d'autant
 * (`fin`, jamais avant aujourd'hui), `pretePrevue` aussi, et sa durée dit « pas brassée · prête le … », jamais « Jn ».
 */
export function choseAllongee(chose: ChoseCalendrier, jours: number, aujourdhui: string): ChoseCalendrier {
  if (chose.source.genre !== 'batch' || chose.conditionne || !chose.debut) return chose;
  if (chose.pasBrassee) {
    const prete = decale(chose.pretePrevue ?? chose.fin, jours);
    if (prete <= chose.debut) return chose;
    const fin = decale(chose.fin, jours);
    return { ...chose, fin: fin > aujourdhui ? fin : aujourdhui, pretePrevue: prete, duree: dureePasBrassee(prete) };
  }
  const nouvelle = decale(chose.preteLe ?? chose.fin, jours);
  if (nouvelle <= chose.debut) return chose;
  const duree = dureeBrassin(chose.debut, nouvelle, aujourdhui);
  const { finInconnue: _f, ...reste } = chose;
  void _f;
  return { ...reste, fin: nouvelle, preteLe: nouvelle, ...(duree ? { duree } : {}) };
}

/** Le texte de l'aperçu de f2-a : « J7 / 35 · prête 14 déc. » pour un brassin, « S47 → S50 » pour le reste. */
export function dureeAllongee(chose: ChoseCalendrier, jours: number, aujourdhui: string): string {
  if (chose.source.genre !== 'batch') return `${etiquetteS(chose.debut)} → ${etiquetteS(dimancheDe(decale(chose.fenetre?.au ?? chose.fin, jours)))}`;
  const apres = choseAllongee(chose, jours, aujourdhui);
  return apres.duree ?? (apres.preteLe ? `prête ${jourLisible(apres.preteLe)}` : chose.duree ?? '');
}

/**
 * f2-a (E29) : tirer le bord d'une barre de `jours` jours (négatif : la raccourcir). Brassin : la fin prévue (`finPrevue`) est retenue, la garde
 * s'allonge d'autant. Fête, activité, plan manuel : le dimanche de la fenêtre (`fenetre.au`), jamais avant sa première semaine.
 */
export function allonger(chose: ChoseCalendrier, jours: number, ctx: ContexteGestes): Resolution {
  if (!Number.isInteger(jours) || jours === 0) return refus('Rien ne change : tire le bord plus loin.');
  const source = chose.source;
  if (source.genre === 'batch') return allongerBrassin(chose, jours, ctx);
  if (source.genre !== 'creative' && !(source.genre === 'plan' && source.origine === 'manual')) {
    return refus(chose.deplacable === true ? 'Cette chose ne s’allonge pas d’ici.' : chose.deplacable.raison, chose.ouvre);
  }
  const base = chose.fenetre?.au ?? chose.fin;
  const au = dimancheDe(decale(base, jours));
  if (au < dimancheDe(chose.debut)) return refus('Une chose dure au moins une semaine : tire moins loin.');
  if (au === dimancheDe(base) && chose.fenetre) return refus('Rien ne change : tire jusqu’à une autre semaine.');
  const fenetre = { du: chose.fenetre?.du ?? lundiDe(chose.debut), au, ...(chose.joursActifs ? { joursActifs: chose.joursActifs } : {}), ...(chose.miseDeCote ? { miseDeCote: true } : {}) };
  const message = annuler(`${chose.titre} : ${etiquetteS(chose.debut)} → ${etiquetteS(au)}`);
  if (source.genre === 'creative') return { ok: true, ecritures: [{ op: 'patch', collection: 'creativeItems', id: source.id, patch: { fenetre } }], effet: null, promesse: null, courbeApres: ctx.courbe, message };
  const plan = planDe(chose, ctx);
  if (!plan) return refus('Cette prévision n’existe plus.', { ecran: 'finances' });
  return { ok: true, ecritures: [{ op: 'patch', collection: 'financialPlans', id: plan.id, patch: { fenetre, ...(fenetre.miseDeCote ? { date: au } : {}) } }], effet: null, promesse: null, courbeApres: ctx.courbe, message };
}

/** « Livrer le 5 janv. » (E32) : la vente promise prend la nouvelle date. */
export function livrer(promesse: Promesse, ctx: ContexteGestes): Resolution {
  const plan = ctx.plans.find(p => p.id === promesse.planId);
  if (!plan) return refus('Cette vente n’existe plus. Ouvre Finances.', { ecran: 'finances' });
  const date = isoDate(plan.date) ?? promesse.jourPromis;
  const jours = ecartJours(date, promesse.livrerLe);
  const avant = ctx.courbe, apres = avant ? courbeDecalee(avant, idChoseArgent({ id: `${plan.id}:${date}`, source: plan.recurrence ? 'recurring' : 'plan', planId: plan.id }), jours) : null;
  const effet = effetCaisse(avant, apres);
  return {
    ok: true, ecritures: [{ op: 'patch', collection: 'financialPlans', id: plan.id, patch: { date: promesse.livrerLe, ...(plan.fenetre ? { fenetre: fenetreDecalee(plan.fenetre, jours) } : {}) } }],
    effet, promesse: null, courbeApres: apres, message: annuler(`${plan.title} : ${jourLisible(promesse.livrerLe)}${effet ? ` · ${effet.texte}` : ''}`)
  };
}

/** f5-a : dupliquer en `versLundi`, avec son effet. Un brassin dupliqué est un brassin planifié ; il ne décompte rien avant son brassage (P8). */
export function dupliquer(chose: ChoseCalendrier, versLundi: string, ctx: ContexteGestes): Resolution {
  const cible = lundiDe(versLundi);
  const source = chose.source;
  const delta = ecartJours(lundiDe(chose.debut), cible);
  if (source.genre === 'batch') {
    const batch = batchDe(chose, ctx);
    if (!batch) return refus('Ce brassin n’existe plus. Rouvre la liste des brassins.');
    const document = {
      id: (ctx.idBrassin ?? (() => nouvelId(ctx, 'LOT')))(), brewDate: '', plannedBrewDate: cible, name: batch.name, style: batch.style, volumeL: batch.volumeL, status: 'planifie', stockAccountingVersion: 1,
      ...(batch.recipeRef ? { recipeRef: batch.recipeRef } : {}), ...(batch.recipeSnapshot ? { recipeSnapshot: batch.recipeSnapshot } : {}), gravityLog: []
    };
    return { ok: true, ecritures: [{ op: 'creer', collection: 'batches', document, ...(batch.recipeRef ? { recetteId: batch.recipeRef } : {}) }], effet: null, promesse: null, courbeApres: ctx.courbe, message: annuler(`Dupliquée en ${etiquetteS(cible)}`) };
  }
  if (chose.deplacable !== true && source.genre !== 'creative') return refus(`Une copie se crée dans sa source. ${chose.deplacable.raison}`.trim(), chose.ouvre);
  const decaleMouvements: MouvementCaisse[] = ctx.courbe ? ctx.courbe.mouvements.filter(m => m.choseId === chose.id).map(m => ({ ...m, id: `${m.id}~copie`, choseId: `${chose.id}~copie`, jour: decale(m.jour, delta) })) : [];
  const mise = (chose.miseDeCote && chose.centimes && chose.fenetre) ? [{ id: `${chose.id}~copie`, titre: chose.titre, du: decale(chose.fenetre.du, delta), au: decale(chose.fenetre.au, delta), centimes: Math.abs(chose.centimes) }] : [];
  const apres = ctx.courbe ? courbeAvec(ctx.courbe, decaleMouvements, mise) : null;
  const effet = effetCaisse(ctx.courbe, apres);
  const message = annuler(effet ? `Dupliquée · ${effet.texte}` : `Dupliquée en ${etiquetteS(cible)}`);
  if (source.genre === 'creative') {
    const document = { id: nouvelId(ctx, 'CR'), type: source.type, title: chose.titre, status: 'todo', date: decale(chose.debut, delta), ...(chose.rangee === 'activites' && source.type === 'event' ? { activite: true } : {}), ...(chose.fenetre ? { fenetre: fenetreDecalee(chose.fenetre, delta) } : {}), ...(chose.liens ? { liens: chose.liens } : {}) };
    return { ok: true, ecritures: [{ op: 'creer', collection: 'creativeItems', document }], effet, promesse: null, courbeApres: apres, message };
  }
  const plan = planDe(chose, ctx);
  if (!plan || plan.source !== 'manual') return refus('Cette prévision se copie dans Finances.', { ecran: 'finances' });
  const date = isoDate(plan.date) ?? chose.debut;
  const document = {
    ...plan, id: nouvelId(ctx, 'PLAN'), date: decale(date, delta), status: plan.status === 'draft' ? 'draft' : 'active', createdAt: ctx.maintenant ?? `${ctx.aujourdhui}T12:00:00.000Z`,
    ...(plan.fenetre ? { fenetre: fenetreDecalee(plan.fenetre, delta) } : {})
  } as unknown as { id: string } & Record<string, unknown>;
  delete document.updatedAt;
  return { ok: true, ecritures: [{ op: 'creer', collection: 'financialPlans', document }], effet, promesse: null, courbeApres: apres, message };
}

/**
 * f5-a (D-113, L33) : Retirer n'efface rien. Une fête ou une activité perd sa date (elle reste dans sa source, dans la poche « Sans date ») ;
 * un plan manuel passe à `cancelled` (il reste dans Finances). Un brassin, une facture, une charge fixe : refus, avec l'écran où le faire.
 */
export function retirer(chose: ChoseCalendrier, ctx: ContexteGestes): Resolution {
  const source = chose.source;
  if (source.genre === 'creative') {
    const apres = ctx.courbe ? courbeSans(ctx.courbe, chose.id) : null;
    return {
      ok: true, ecritures: [{ op: 'patch', collection: 'creativeItems', id: source.id, patch: { date: '' } }], effet: effetCaisse(ctx.courbe, apres), promesse: null, courbeApres: apres,
      message: annuler(`Retirée de ${etiquetteS(chose.debut)}`, { texte: 'Sans date ›', ancre: 'sans-date' })
    };
  }
  if (source.genre === 'plan' && source.origine === 'manual') {
    const apres = ctx.courbe ? courbeSans(ctx.courbe, chose.id) : null;
    const effet = effetCaisse(ctx.courbe, apres);
    return {
      ok: true, ecritures: [{ op: 'patch', collection: 'financialPlans', id: source.id, patch: { status: 'cancelled' } }], effet, promesse: null, courbeApres: apres,
      message: annuler(`Annulé${effet ? ` · ${effet.texte}` : ''}`, { texte: 'dans Finances ›', ancre: 'finances', cible: { ecran: 'finances' } })
    };
  }
  if (source.genre === 'batch') return refus('Un brassin ne se retire pas d’ici : on ne supprime rien. Ouvre le brassin pour l’annuler (Brassins).', chose.ouvre, { texte: 'Ouvrir le brassin ›', ancre: 'brassin', cible: chose.ouvre });
  return refus(chose.deplacable === true ? 'Cette chose se retire dans sa source.' : chose.deplacable.raison, chose.ouvre);
}

const miseDe = (chose: ChoseCalendrier, fenetre: { du: string; au: string }): MiseDeCote => ({ id: chose.id, titre: chose.titre, du: fenetre.du, au: fenetre.au, centimes: Math.abs(chose.centimes as number) });

/**
 * E03, D-117 (écart P7) : mettre de côté n'écrit que `fenetre.miseDeCote` sur la chose. Aucun `FinancialPlan` n'est créé : la caisse ne baisse
 * qu'une fois, à la date du paiement (pas de double compte). Un plan manuel dont le montant tombait au début le fait tomber à la fin (E45).
 */
export function mettreDeCote(chose: ChoseCalendrier, actif: boolean, ctx: ContexteGestes): Resolution {
  const source = chose.source;
  const manuel = source.genre === 'plan' && source.origine === 'manual';
  if (source.genre !== 'creative' && !manuel) return refus(chose.deplacable === true ? 'Cette chose ne se met pas de côté.' : chose.deplacable.raison, chose.ouvre);
  const f = chose.fenetre;
  if (!f || !isoDate(f.du) || !isoDate(f.au)) return refus('Une mise de côté a besoin d’une fenêtre : choisis le début et la fin.');
  if (!chose.centimes) return refus('Une mise de côté a besoin d’un montant : un montant inconnu n’est pas 0.');
  const { miseDeCote: _ancienne, ...reste } = f;
  const fenetre = actif ? { ...reste, miseDeCote: true as const } : reste;
  let apres = ctx.courbe;
  if (apres && manuel) {
    const jours = ecartJours(actif ? f.du : f.au, actif ? f.au : f.du);
    if (jours !== 0 && (!!f.miseDeCote) !== actif) apres = courbeDecalee(apres, chose.id, jours);
  }
  if (apres) apres = courbeAvecMise(apres, actif ? miseDe(chose, fenetre) : null, chose.id);
  const effet = effetCaisse(ctx.courbe, apres);
  const message = annuler(actif ? `Mis de côté · ${effet ? effet.texte : `${etiquetteS(f.du)} → ${etiquetteS(f.au)}`}` : 'Plus mis de côté');
  if (source.genre === 'creative') return { ok: true, ecritures: [{ op: 'patch', collection: 'creativeItems', id: source.id, patch: { fenetre } }], effet, promesse: null, courbeApres: apres, message };
  const plan = planDe(chose, ctx);
  if (!plan) return refus('Cette prévision n’existe plus.', { ecran: 'finances' });
  return { ok: true, ecritures: [{ op: 'patch', collection: 'financialPlans', id: plan.id, patch: { fenetre, date: actif ? fenetre.au : fenetre.du } }], effet, promesse: null, courbeApres: apres, message };
}

/** E26 : une vente probable (plan en brouillon) devient pleine quand on l'accepte d'un toucher. */
export function accepterVente(chose: ChoseCalendrier, ctx: ContexteGestes): Resolution {
  const plan = planDe(chose, ctx);
  if (!plan || chose.source.genre !== 'plan' || plan.status !== 'draft') return refus('Cette vente n’est pas une vente probable.');
  const jour = isoDate(plan.date) ?? chose.debut;
  const mouvement: MouvementCaisse = { id: `${plan.id}:${jour}`, jour, centimes: plan.amountCents, nom: plan.title, choseId: idChoseArgent({ id: `${plan.id}:${jour}`, source: 'plan', planId: plan.id }) };
  const apres = ctx.courbe && plan.amountCents > 0 ? courbeAvec(ctx.courbe, [mouvement]) : ctx.courbe;
  const effet = effetCaisse(ctx.courbe, apres);
  return { ok: true, ecritures: [{ op: 'patch', collection: 'financialPlans', id: plan.id, patch: { status: 'active' } }], effet, promesse: null, courbeApres: apres, message: annuler(effet ? `Vente acceptée · ${effet.texte}` : 'Vente acceptée') };
}

/** E30, E46 : « Fait » pour une activité ou une tâche : elle quitte la frise et la poche. */
export function fait(chose: ChoseCalendrier): Resolution {
  if (chose.source.genre !== 'creative') return refus('Seule une fête, une activité ou une tâche se marque faite.', chose.ouvre);
  return { ok: true, ecritures: [{ op: 'patch', collection: 'creativeItems', id: chose.source.id, patch: { status: 'done' } }], effet: null, promesse: null, courbeApres: null, message: annuler(`${chose.titre} : fait`) };
}

/** f5-a : « Lier à un brassin, un client » (D-113). Un plan porte `batchId` et `clientId` ; une chose du carnet, `liens`. */
/**
 * « Lier à un brassin, un client » (E31, E37, D-126) : le lien s'écrit dans la source (`liens` d'une chose du carnet ; `batchId` ou `clientId`
 * d'un plan manuel), avec son inverse (Annuler). Le message nomme ce qui est lié : « Liée à La Cigogne » (CRITIQUE-4 n° 6).
 */
export function lier(chose: ChoseCalendrier, liens: { batchId?: string; clientId?: string }, ctx: ContexteGestes, nom?: string): Resolution {
  const source = chose.source;
  const texte = nom?.trim() ? `Liée à ${nom.trim()}` : 'Liée';
  if (source.genre === 'creative') return { ok: true, ecritures: [{ op: 'patch', collection: 'creativeItems', id: source.id, patch: { liens: { ...chose.liens, ...liens } } }], effet: null, promesse: null, courbeApres: ctx.courbe, message: annuler(texte) };
  const plan = planDe(chose, ctx);
  if (!plan || plan.source !== 'manual') return refus('Un lien se pose sur une prévision manuelle ou une chose du carnet.', chose.ouvre);
  return { ok: true, ecritures: [{ op: 'patch', collection: 'financialPlans', id: plan.id, patch: { ...(liens.batchId ? { batchId: liens.batchId } : {}), ...(liens.clientId ? { clientId: liens.clientId } : {}) } }], effet: null, promesse: null, courbeApres: ctx.courbe, message: annuler(texte) };
}

/** L1 a et b (E36) : une idée datée envoyée au carnet. Elle n'a ni rangée, ni case, ni bouton : elle se montre en icône dans la bande. */
export function noterIdee(titre: string, lundi: string, ctx: Pick<ContexteGestes, 'nouvelId'>): Resolution {
  const r = enregistrementIdee(titre, lundi, ctx);
  if ('raison' in r) return refus(r.raison);
  const e = r.enregistrement;
  return { ok: true, ecritures: [{ op: 'creer', collection: e.collection, document: e.document as unknown as { id: string } & Record<string, unknown> }], effet: null, promesse: null, courbeApres: null, message: annuler(`Idée notée en ${etiquetteS(lundi)}`) };
}

/** Ce que le doigt demande : un seul vocabulaire pour la frise, le menu d'appui long, l'alerte de promesse et le + volant. */
export type Intention =
  | { genre: 'deplacer'; chose: ChoseCalendrier; semaines: number; jalon?: JalonId }
  | { genre: 'allonger'; chose: ChoseCalendrier; jours: number }
  | { genre: 'dupliquer'; chose: ChoseCalendrier; versLundi: string }
  | { genre: 'retirer'; chose: ChoseCalendrier }
  | { genre: 'livrer'; promesse: Promesse }
  | { genre: 'mettre-de-cote'; chose: ChoseCalendrier; actif: boolean }
  | { genre: 'accepter'; chose: ChoseCalendrier }
  | { genre: 'fait'; chose: ChoseCalendrier }
  | { genre: 'lier'; chose: ChoseCalendrier; liens: { batchId?: string; clientId?: string } }
  | { genre: 'noter-idee'; titre: string; lundi: string };

/** Une intention devient ses écritures, son message et son effet sur la caisse, ou un refus avec sa raison. Rien n'est écrit ici. */
export function resoudre(intention: Intention, ctx: ContexteGestes): Resolution {
  switch (intention.genre) {
    case 'deplacer': return deplacer(intention.chose, intention.semaines, ctx, intention.jalon);
    case 'allonger': return allonger(intention.chose, intention.jours, ctx);
    case 'dupliquer': return dupliquer(intention.chose, intention.versLundi, ctx);
    case 'retirer': return retirer(intention.chose, ctx);
    case 'livrer': return livrer(intention.promesse, ctx);
    case 'mettre-de-cote': return mettreDeCote(intention.chose, intention.actif, ctx);
    case 'accepter': return accepterVente(intention.chose, ctx);
    case 'fait': return fait(intention.chose);
    case 'lier': return lier(intention.chose, intention.liens, ctx);
    case 'noter-idee': return noterIdee(intention.titre, intention.lundi, ctx);
  }
}

export { effetCaisse, type EffetCaisse };

/** Les jalons d'un brassin après un déplacement : les mêmes écarts à la date de brassage (contrôle A9). */
export const ecartsDeJalons = (batch: Batch): number[] => jalonsBrassin(batch).map(j => j.ecart);
