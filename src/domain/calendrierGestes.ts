import type { Batch } from '../types';
import type { FinancialPlan } from './finance/types';
import { isoDate } from './finance/ledger';
import { plannedBrewDate, rescheduleBatchPatch } from './batchSchedule';
import { datesSortiesBrassin } from './finance/brewForecast';
import {
  EFFET_HORS_COURBE, ajouterJours, brassagePoseAuPasse, dimancheDe, dureeBrassin, dureePasBrassee, ecartJours, etiquetteS, finDeBrassin, francs, idChoseArgent, jalonsBrassin, jourLisible, lundiDe, preteAuPlusTot,
  type ChoseCalendrier, type CibleOuverture, type JalonId
} from './calendrier';
import {
  courbeAvec, courbeAvecMise, courbeDecalee, courbeSans, creuxDepuis, effetCaisse,
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
  | {
    ok: true; ecritures: Ecriture[]; message: Message; effet: EffetCaisse | null; promesse: Promesse | null; courbeApres: CourbeCaisse | null;
    /** L'effet dit en mots quand il n'a pas de chiffre (« coût à venir », Dupliquer un brassin sans budget) : pour le libellé du menu (E31). */
    effetMots?: string;
  }
  | { ok: false; raison: string; ouvrir?: CibleOuverture; message: Message };

export interface ContexteGestes {
  aujourdhui: string;
  batches: readonly Batch[];
  plans: readonly FinancialPlan[];
  courbe: CourbeCaisse | null;
  nouvelId?: (prefixe: string) => string;
  idBrassin?: () => string;
  maintenant?: string;
  /** CAL-PASSE : le lundi de la première semaine montrée ; avant, une date n'a pas de place sur la frise (refusée). Absent : aucune borne. */
  debutHorizon?: string;
}

const annuler = (texte: string, lien?: Message['lien']): Message => ({ texte, action: 'Annuler', ...(lien ? { lien } : {}), lecture: `${texte}${lien ? ` · ${lien.texte}` : ''} · Annuler` });
const refus = (raison: string, ouvrir?: CibleOuverture, lien?: Message['lien']): Resolution => ({ ok: false, raison, ...(ouvrir ? { ouvrir } : {}), message: { texte: raison, ...(lien ? { lien } : {}), lecture: `${raison}${lien ? ` · ${lien.texte}` : ''}` } });
const nouvelId = (ctx: ContexteGestes, p: string) => (ctx.nouvelId ?? ((x: string) => `${x}-${globalThis.crypto.randomUUID()}`))(p);
const SEMAINE = 7;

/**
 * Test en ligne 1, n° 4 (18.11) : glisser l'achat « ZZ TEST » de S48 en S50 disait « S48 : −672 → −660 », un gain de 12 en apparence, alors
 * que le chiffre clé restait −672 et que son creux passait en S50. Le message d'un glissé dit l'effet sur le chiffre clé (« à dépenser sans
 * passer sous 0 », `creuxDepuis` sur toute la courbe, comme l'en-tête) : sa valeur et sa semaine, avant → après, chaque morceau inchangé dit
 * une seule fois (« À dépenser −672 : creux S48 → S50 »). `null` : courbe inconnue, ou rien ne bouge dans la caisse (le message garde alors le
 * nom et le trajet).
 */
export function texteEffetCreux(avant: CourbeCaisse | null, apres: CourbeCaisse | null, effet: EffetCaisse | null, titre?: string): string | null {
  const dit = texteEffetCreuxSansNom(avant, apres, effet, !!titre);
  /* PC-155 (critique 19.11 c1 n° 17, c3 n° 8) : « à dépenser reste −6 417 · S49 : 1 113 → 2 013 » ne disait pas QUELLE chose avait bougé ; le nom
     passe en tête, il cède le premier (points de suite) et l'effet chiffré reste entier (`separerEffet`). */
  return dit !== null && titre ? `${titre} · ${dit}` : dit;
}

function texteEffetCreuxSansNom(avant: CourbeCaisse | null, apres: CourbeCaisse | null, effet: EffetCaisse | null, nomme: boolean): string | null {
  if (!avant || !apres || !effet) return null;
  const a = creuxDepuis(avant), b = creuxDepuis(apres);
  if (!a || !b) return null;
  const va = francs(a.centimes), vb = francs(b.centimes), sa = `S${a.numero}`, sb = `S${b.numero}`;
  /* le chiffre clé ne bouge pas : la semaine qui change (la forme de f1-a, as-gestes.js), et le chiffre clé AVEC sa valeur, qui reste.
     Test en ligne du paquet E : « à dépenser inchangé · S50 : −660 → −659 » se lisait comme un chiffre clé qui bouge. « à dépenser reste −660 »
     nomme le chiffre qui ne bouge pas, à côté du solde de la semaine qui, lui, bouge ; court, il tient à 390 (le nom du message cède le premier). */
  /* PC-155 : nommé, le message n'a plus besoin de « à dépenser reste −6 417 » (le chiffre clé de l'en-tête, qui ne bouge pas, prenait la place du nom
     et se coupait en « reste −… » à 390) : « Hotte · S49 : 1 113 → 2 013 » ne se lit pas comme un chiffre clé qui bouge */
  if (va === vb && sa === sb) return nomme ? effet.texte : `${effet.texte} · à dépenser reste ${va}`;
  if (va === vb) return `À dépenser ${va} : creux ${sa} → ${sb}`;
  if (sa === sb) return `À dépenser : ${va} → ${vb} · ${sa}`;
  return `À dépenser : ${va} · ${sa} → ${vb} · ${sb}`;
}

/**
 * PC-155 (critique 19.11 c3 n° 8) : « Le dry hop suit la recette du brassin » ne disait pas de quel brassin. Le refus d'un jalon nomme sa chose :
 * « Blonde d'automne : le dry hop suit la recette du brassin » (déjà nommée, la raison reste telle quelle).
 */
export function raisonNommee(titre: string, raison: string): string {
  if (!titre || raison.includes(titre)) return raison;
  return `${titre} : ${raison.charAt(0).toLowerCase()}${raison.slice(1)}`;
}

/**
 * PC-145 (critique 19.11 c1 n° 1) : la courbe que montre l'aperçu d'un glissé est celle que le geste écrira, la même fonction. L'aperçu rebâtissait
 * `courbeDecalee` (toutes les sorties de la Saison décalées du même écart : « S47 3 268 → 3 361 », +92) quand le geste, lui, replace chaque sortie
 * à SA date et rien avant aujourd'hui (`courbeBrassin` : « 3 268 → 3 292 », +24). `semaines` ou `jours` : `auJour` dit lequel. `null` quand le
 * geste serait refusé (rien à annoncer) ou que la courbe est inconnue.
 */
export function courbeDuGlisse(chose: ChoseCalendrier, ecart: number, ctx: ContexteGestes, auJour: boolean): CourbeCaisse | null {
  if (!ctx.courbe || ecart === 0) return null;
  const res = auJour ? deplacerJours(chose, ecart, ctx) : deplacer(chose, ecart, ctx);
  return res.ok ? res.courbeApres : null;
}

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

type PosteSortie = 'achats' | 'frais' | 'emballage' | 'impot';
const POSTES: readonly PosteSortie[] = ['achats', 'frais', 'emballage', 'impot'];
/** Le poste d'une sortie de brassin, lu dans l'id stable de la prévision (`brew:<lot>:achats|frais|emballage|impot`, `brewForecast.ts`). */
const posteDe = (id: string): PosteSortie | null => { const s = id.slice(id.lastIndexOf(':') + 1) as PosteSortie; return id.startsWith('brew:') && POSTES.includes(s) ? s : null; };

/**
 * CRITIQUE-9 n° 6 et n° 8 (E28, E31, A2) : les mouvements d'un brassin tels qu'ils seront si le brassin `avant` devient `apres` (glissé,
 * allongé, dupliqué). Chaque sortie suit SA date, par la règle de la prévision (`datesSortiesBrassin` : courses à J − 7, frais à J, emballage au
 * conditionnement − 7, impôt au trimestre ; rien avant aujourd'hui) : un brassin en retard, ramené à aujourd'hui, ne glisse pas d'un bloc. Une
 * ligne dont le poste est inconnu bouge de `repli` jours. Pure ; les montants ne changent pas.
 */
export function mouvementsBrassinApres(mouvements: readonly MouvementCaisse[], avant: Batch, apres: Batch, aujourdhui: string, repli: number): MouvementCaisse[] {
  const da = datesSortiesBrassin(avant, aujourdhui), db = datesSortiesBrassin(apres, aujourdhui);
  return mouvements.map(m => {
    const poste = posteDe(m.id);
    const jours = poste && da && db ? ecartJours(da[poste], db[poste]) : repli;
    const jour = decale(m.jour, jours);
    return { ...m, jour: jour < aujourdhui ? aujourdhui : jour };
  });
}

/** Les sorties d'un brassin en mots de brasseur (CRITIQUE-10 n° 5) : « courses », « frais de brassage », « emballage », « impôt ». */
const MOTS_POSTE: Record<PosteSortie, string> = { achats: 'courses', frais: 'frais de brassage', emballage: 'emballage', impot: 'impôt' };
/** Ce qui, parmi les sorties d'un brassin, tombe dans la semaine du lundi `lundi` : « courses », « courses et frais de brassage » ; `null` si rien de connu. */
function causeDansSemaine(mouvements: readonly MouvementCaisse[], lundi: string): string | null {
  const dimanche = ajouterJours(lundi, 6);
  const postes = [...new Set(mouvements.filter(m => m.jour >= lundi && m.jour <= dimanche).map(m => posteDe(m.id)))];
  if (!postes.length || postes.includes(null)) return null;
  return postes.map(p => MOTS_POSTE[p as PosteSortie]).join(' et ');
}

/** La courbe après qu'un brassin a changé de dates : les mouvements de sa chose suivent (`mouvementsBrassinApres`). */
function courbeBrassin(courbe: CourbeCaisse | null, choseId: string, avant: Batch, apres: Batch, aujourdhui: string, repli: number): CourbeCaisse | null {
  if (!courbe) return null;
  const siens = courbe.mouvements.filter(m => m.choseId === choseId);
  if (!siens.length) return courbe;
  /* un brassin n'a pas de mise de côté : retirer ses mouvements puis les remettre à leurs nouvelles dates ne touche rien d'autre */
  return courbeAvec(courbeSans(courbe, choseId), mouvementsBrassinApres(siens, avant, apres, aujourdhui, repli));
}
const fenetreDecalee = (f: { du: string; au: string; joursActifs?: number; miseDeCote?: boolean } | undefined, jours: number) => (f ? { ...f, du: decale(f.du, jours), au: decale(f.au, jours) } : undefined);

/**
 * f1-a (E28) : déplacer de `semaines` (négatif : vers le passé), la longueur reste. Brassin planifié : `plannedBrewDate` par
 * `rescheduleBatchPatch` ; ses jalons suivent (ce sont des écarts), `finPrevue` aussi si elle est écrite. Avec un `jalon` : le jalon de fin écrit
 * `{ finPrevue }` ; un jalon intermédiaire ne se déplace pas seul (il suit la recette) ; en cuve, le jour de brassage ne bouge pas.
 */
export function deplacer(chose: ChoseCalendrier, semaines: number, ctx: ContexteGestes, jalon?: JalonId): Resolution {
  if (!Number.isInteger(semaines) || semaines === 0) return refus('Rien ne bouge : choisis une autre semaine.');
  return deplacerDe(chose, semaines * SEMAINE, ctx, jalon, false);
}

/**
 * D385 : le glisser au jour (vue Jour, semaine dépliée). Même écriture que `deplacer`, l'écart compté en jours ; un brassin pas brassé part de
 * son jour affiché (aujourd'hui), pas de son lundi, et une cible avant aujourd'hui est refusée. Le message dit les jours (« 18 nov. → 20 nov. »).
 */
export function deplacerJours(chose: ChoseCalendrier, jours: number, ctx: ContexteGestes, jalon?: JalonId): Resolution {
  if (!Number.isInteger(jours) || jours === 0) return refus('Rien ne bouge : choisis un autre jour.');
  return deplacerDe(chose, jours, ctx, jalon, true);
}

function deplacerDe(chose: ChoseCalendrier, jours: number, ctx: ContexteGestes, jalon: JalonId | undefined, auJour: boolean): Resolution {
  const reperes = auJour ? jourLisible : etiquetteS;
  const source = chose.source;
  if (jalon) {
    const j = chose.jalons?.find(x => x.id === jalon);
    if (!j) return refus('Ce jalon n’existe pas sur ce brassin.', chose.ouvre);
    if (j.glissable === false) return refus(raisonNommee(chose.titre, j.raison ?? j.libelle), chose.ouvre,{ texte: 'Ouvrir le brassin ›', ancre: 'brassin', cible: chose.ouvre });
    if (j.glissable === 'fin') return allongerBrassin(chose, jours, ctx, true);
  }
  if (source.genre === 'batch') {
    const batch = batchDe(chose, ctx);
    if (!batch) return refus('Ce brassin n’existe plus. Rouvre la liste des brassins.');
    if (chose.deplacable !== true) return refus(chose.deplacable.raison, chose.ouvre);
    const prevu = isoDate(plannedBrewDate(batch));
    if (!prevu) return refus('Ce brassin n’a pas de date prévue : choisis-la dans sa fiche (Brassins).', chose.ouvre);
    /*
     * CRITIQUE-10 n° 1 (E28, D-46, D-189) : un brassin pas brassé dont le jour prévu est passé est affiché depuis aujourd'hui (CRITIQUE-7 n° 2).
     * Le doigt compte les colonnes depuis CETTE colonne : la date écrite est le lundi de la colonne affichée + n semaines, celle que la bulle
     * annonce (« S48 · 23 nov. · lâcher ici »), jamais le jour prévu passé + n (qui retombait dans le passé et ramenait la barre à aujourd'hui).
     * Planifié dans le futur : jour prévu + n semaines, son jour de la semaine gardé. Une cible avant la semaine courante est refusée.
     */
    /* CAL-PASSE (20.11) : seul le jour prévu passé dans la semaine COURANTE se dessine depuis aujourd'hui ; plus loin dans le passé, la barre est à sa date */
    const ancre = chose.pasBrassee && !brassagePoseAuPasse(prevu, ctx.aujourdhui);
    const depart = ancre ? (auJour ? chose.debut : lundiDe(chose.debut)) : prevu;
    const nouveau = decale(depart, jours);
    /* le passé se replanifie (décision du pilote, 20.11) ; seule borne : la frise n'a pas de colonne avant sa première semaine */
    if (ctx.debutHorizon && lundiDe(nouveau) < ctx.debutHorizon) return refus(`Avant ${etiquetteS(ctx.debutHorizon)}, la frise n’a pas de semaine : choisis ${etiquetteS(ctx.debutHorizon)} ou plus tard.`);
    /* le vrai décalage du jour de brassage : `finPrevue` écrite et les sorties sans poste le suivent, la longueur reste */
    const ecart = ecartJours(prevu, nouveau);
    let patch: Record<string, unknown>;
    try { patch = { ...rescheduleBatchPatch(batch, nouveau) }; } catch { return refus('Brassin en cuve : le jour de brassage ne bouge pas.', chose.ouvre); }
    const finEcrite = isoDate(batch.finPrevue || undefined);
    if (finEcrite) patch.finPrevue = decale(finEcrite, ecart);
    /* CRITIQUE-6 n° 2 : replanifié encore dans le passé sans brassage, il reste prêt au plus tôt aujourd'hui + cycle */
    const deplace = { ...batch, ...patch } as Batch;
    const apres = preteAuPlusTot(deplace, ctx.aujourdhui);
    const promesse = promesseTouchee(ctx.plans, batch.id, apres);
    /*
     * CRITIQUE-9 n° 6 (E28, D-46, A6) : comme f1-a choisi (as-gestes.js l. 254) et comme les autres choses, le message dit l'effet sur la caisse,
     * « S50 : 5 064 → 4 524 », dès que le libre bouge ; le nom et le trajet seulement si rien ne change (brassin sans budget, ou effet nul).
     */
    const courbeApres = courbeBrassin(ctx.courbe, chose.id, batch, deplace, ctx.aujourdhui, ecart);
    const effet = effetCaisse(ctx.courbe, courbeApres);
    /* le trajet part de la semaine AFFICHÉE (S47 → S48), jamais du jour prévu passé (S46) */
    return {
      ok: true, ecritures: [{ op: 'patch', collection: 'batches', id: batch.id, patch }], effet, promesse, courbeApres,
      message: annuler(texteEffetCreux(ctx.courbe, courbeApres, effet, chose.titre) ??`${chose.titre} : ${reperes(depart)} → ${reperes(nouveau)}`)
    };
  }
  if (chose.deplacable !== true) return refus(chose.deplacable.raison, chose.ouvre);
  const avant = ctx.courbe, apres = avant ? courbeDecalee(avant, chose.id, jours) : null;
  const effet = effetCaisse(avant, apres);
  const message = annuler(texteEffetCreux(avant, apres, effet, chose.titre) ??`${chose.titre} : ${reperes(chose.debut)} → ${reperes(decale(chose.debut, jours))}`);
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
  /*
   * CRITIQUE-6 n° 2 : pas brassé, jour prévu passé. `finPrevue` reste « jour prévu + cycle » (comme pour tout brassin planifié : glisser la barre
   * la décale avec lui) ; ce qu'on DIT est « prête le » au plus tôt, max(jour prévu, aujourd'hui) + cycle (`preteAuPlusTot`), la même date que la
   * barre, qui part de la semaine courante.
   */
  /*
   * CRITIQUE-7 n° 2 : sa barre court d'aujourd'hui à « prête ». Sans cycle connu (ni recette datée ni `finPrevue`), rien ne dit sa durée en
   * cuve : le bord refuse avec sa raison (comme le dry hop), jamais un geste sans effet ni une fin inventée.
   */
  const finCycle = pasBrassee ? finDeBrassin(batch)?.jour : null;
  if (pasBrassee && (!finCycle || !chose.pretePrevue)) {
    return refus('Sa recette ne dit pas combien de jours il reste en cuve : sa fin se règle dans la fiche du brassin.', chose.ouvre, { texte: 'Ouvrir le brassin ›', ancre: 'brassin', cible: chose.ouvre });
  }
  const prevu = pasBrassee ? isoDate(plannedBrewDate(batch)) ?? debut : debut;
  const ecrite = pasBrassee ? (finCycle as string) : (chose.preteLe ?? chose.fin);
  const nouvelle = decale(ecrite, jours);
  const dite = pasBrassee ? preteAuPlusTot({ ...batch, finPrevue: nouvelle } as Batch, ctx.aujourdhui) ?? nouvelle : nouvelle;
  if (nouvelle <= prevu || (pasBrassee && !brassagePoseAuPasse(prevu, ctx.aujourdhui) && dite <= ctx.aujourdhui)) return refus('Un brassin dure au moins un jour : tire moins loin.');
  const promesse = promesseTouchee(ctx.plans, batch.id, dite);
  const duree = pasBrassee ? dureePasBrassee(dite) : dureeBrassin(debut, nouvelle, ctx.aujourdhui) ?? `prête ${jourLisible(nouvelle)}`;
  /* CRITIQUE-9 n° 4 : l'emballage et l'impôt suivent « prête » ; leur effet est rendu (courbe, détail), le message garde « prête le … » (f2-a) */
  const courbeApres = courbeBrassin(ctx.courbe, chose.id, batch, { ...batch, finPrevue: nouvelle } as Batch, ctx.aujourdhui, jours);
  return {
    ok: true, ecritures: [{ op: 'patch', collection: 'batches', id: batch.id, patch: { finPrevue: nouvelle } }], effet: effetCaisse(ctx.courbe, courbeApres), promesse, courbeApres,
    message: annuler(parJalon ? `${chose.titre} : ${pasBrassee ? 'pas brassée · ' : ''}prête le ${jourLisible(dite)}` : `${chose.titre} : ${duree}`)
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
    /* CRITIQUE-7 n° 2 : la barre court d'aujourd'hui à « prête » ; tirer de n jours repousse les deux d'autant. Sans cycle connu : rien ne bouge (le geste refuse) */
    if (!chose.pretePrevue) return chose;
    const prete = decale(chose.pretePrevue, jours);
    const plancher = brassagePoseAuPasse(chose.brassagePrevu ?? chose.debut, aujourdhui) || aujourdhui <= chose.debut ? chose.debut : aujourdhui;
    if (prete <= plancher) return chose;
    return { ...chose, fin: prete, pretePrevue: prete, duree: dureePasBrassee(prete) };
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
  /*
   * CRITIQUE-9 n° 6 (A6, « même règle pour tout geste ») : mise de côté, la réserve s'étale sur la nouvelle fenêtre et un plan manuel se paie à sa
   * nouvelle fin ; le libre bouge, le message dit l'effet. Sans mise de côté, rien ne change dans la caisse : le nom et le trajet.
   */
  let courbeApres = ctx.courbe;
  if (courbeApres && fenetre.miseDeCote && chose.centimes) {
    if (source.genre === 'plan') courbeApres = courbeDecalee(courbeApres, chose.id, ecartJours(chose.fenetre?.au ?? chose.fin, au));
    courbeApres = courbeAvecMise(courbeApres, miseDe(chose, fenetre), chose.id);
  }
  const effet = effetCaisse(ctx.courbe, courbeApres);
  const message = annuler(effet ? `${chose.titre} · ${effet.texte}` : `${chose.titre} : ${etiquetteS(chose.debut)} → ${etiquetteS(au)}`);
  if (source.genre === 'creative') return { ok: true, ecritures: [{ op: 'patch', collection: 'creativeItems', id: source.id, patch: { fenetre } }], effet, promesse: null, courbeApres, message };
  const plan = planDe(chose, ctx);
  if (!plan) return refus('Cette prévision n’existe plus.', { ecran: 'finances' });
  return { ok: true, ecritures: [{ op: 'patch', collection: 'financialPlans', id: plan.id, patch: { fenetre, ...(fenetre.miseDeCote ? { date: au } : {}) } }], effet, promesse: null, courbeApres, message };
}

/** « Livrer le 5 janv. » (E32) : la vente promise prend la nouvelle date. */
export function livrer(promesse: Promesse, ctx: ContexteGestes): Resolution {
  const plan = ctx.plans.find(p => p.id === promesse.planId);
  if (!plan) return refus('Cette vente n’existe plus. Ouvre Finances.', { ecran: 'finances' });
  const date = isoDate(plan.date) ?? promesse.jourPromis;
  const jours = ecartJours(date, promesse.livrerLe);
  const avant = ctx.courbe, apres = avant ? courbeDecalee(avant, idChoseArgent({ id: `${plan.id}:${date}`, source: plan.recurrence ? 'recurring' : 'plan', planId: plan.id }), jours) : null;
  const effet = effetCaisse(avant, apres);
  /*
   * CRITIQUE-11 n° 5 (E32, D-193) : « 29 déc. · S52 : 1 754 → 854 » laissait croire que le 29 déc. tombe en S52 ; S52 est la semaine que la
   * vente quitte. Quand la semaine de la date livrée n'est pas celle de l'effet, la date porte la sienne : « 29 déc. (S53) · S52 : … ». Même
   * semaine : elle n'est dite qu'une fois (A6).
   */
  const jour = jourLisible(promesse.livrerLe);
  const dite = effet && lundiDe(promesse.livrerLe) !== effet.lundi ? `${jour} (${etiquetteS(promesse.livrerLe)})` : jour;
  return {
    ok: true, ecritures: [{ op: 'patch', collection: 'financialPlans', id: plan.id, patch: { date: promesse.livrerLe, ...(plan.fenetre ? { fenetre: fenetreDecalee(plan.fenetre, jours) } : {}) } }],
    effet, promesse: null, courbeApres: apres, message: annuler(`${plan.title} : ${dite}${effet ? ` · ${effet.texte}` : ''}`)
  };
}

/**
 * CRITIQUE-11 n° 4 (E31 « Dupliquer en S51 avec son effet… Retirer avec son effet », D-48, D-192). Quand la courbe ne bouge pas, l'effet se dit
 * en mots, sans flèche ni 0 inventés. Une fête ou une activité du carnet n'entre pas dans la prévision de Finances (`buildForecast` ne lit que
 * les plans, les pièces et les brassins) : son montant estimé est dit tel quel ; sans montant, « sans montant ». Une chose que la courbe compte
 * (un mouvement ou une mise de côté à elle) et dont l'effet arrondi est nul : rien n'est dit.
 * CRITIQUE-12 n° 2 (E31, D-192, E23) : l’ancien « hors … prévision » se lisait mal à côté de la pastille « +1 180 confirmé » (« Il compte ou pas, mon
 * marché ? »). L'effet est dit en clair : « recette estimée 1 180 · ne change pas la courbe (pas dans Finances) » ; sans courbe (solde de
 * départ inconnu), « recette estimée 1 180 · pas dans Finances ». La même règle marque la chose `horsCourbe` (`choseHorsCourbe`), que la
 * pastille de sa rangée dit « estimé », jamais « confirmé ».
 */
function effetEnMots(chose: ChoseCalendrier, ctx: ContexteGestes): string | undefined {
  if (chose.centimes === undefined || chose.centimes === 0) return 'sans montant';
  const comptee = !!ctx.courbe && (ctx.courbe.mouvements.some(m => m.choseId === chose.id) || ctx.courbe.mises.some(m => m.id === chose.id));
  if (comptee) return undefined;
  const montant = `${chose.centimes > 0 ? 'recette estimée' : 'coût estimé'} ${francs(Math.abs(chose.centimes))}`;
  return `${montant} · ${ctx.courbe ? EFFET_HORS_COURBE : 'pas dans Finances'}`;
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
    /*
     * CRITIQUE-9 n° 8 (E31 « Dupliquer en S51 avec son effet », D-48, D-192) : le budget du brassin d'origine entre dans la courbe aux dates de la
     * copie (courses à J − 7, frais à J, emballage et impôt après « prête », règle de `datesSortiesBrassin`). Seul un brassin pas commencé porte
     * tout son budget dans la prévision ; commencé, ses courses sont déjà payées : le coût de la copie n'est pas connu ici. Budget inconnu :
     * « coût à venir », en mots, jamais 0 ni une flèche inventée (la prévision le chiffrera une fois la copie posée).
     */
    const copie = document as unknown as Batch;
    const pasCommence = datesSortiesBrassin(batch, ctx.aujourdhui)?.commence === false;
    const siens = pasCommence ? (ctx.courbe?.mouvements.filter(m => m.choseId === chose.id) ?? []) : [];
    const auxDates = siens.length ? mouvementsBrassinApres(siens, batch, copie, ctx.aujourdhui, delta) : [];
    const copies = auxDates.map(m => ({ ...m, id: `${m.id}~copie`, choseId: `${chose.id}~copie` }));
    const courbeApres = ctx.courbe && copies.length ? courbeAvec(ctx.courbe, copies) : ctx.courbe;
    const effet = effetCaisse(ctx.courbe, courbeApres);
    /*
     * CRITIQUE-10 n° 5 (E31, A6) : « Dupliquer en S48 · S47 : 3 268 → 3 200 » se lisait comme une erreur de semaine. Quand la première semaine
     * qui change n'est pas celle de la copie (les courses à J − 7, ramenées à aujourd'hui si elles tombent dans le passé), l'effet nomme sa
     * cause : « courses S47 : 3 268 → 3 200 ». Dans la semaine de la copie, l'effet seul (la semaine n'est dite qu'une fois).
     */
    const cause = effet && effet.lundi !== cible ? causeDansSemaine(auxDates, effet.lundi) : null;
    const effetMots = effet ? (cause ? `${cause} ${effet.texte}` : effet.texte) : ctx.courbe ? 'coût à venir' : undefined;
    return {
      ok: true, ecritures: [{ op: 'creer', collection: 'batches', document, ...(batch.recipeRef ? { recetteId: batch.recipeRef } : {}) }], effet, ...(effetMots ? { effetMots } : {}), promesse: null, courbeApres,
      message: annuler(effet && !cause ? `Dupliquée · ${effet.texte}` : `Dupliquée en ${etiquetteS(cible)}${effetMots ? ` · ${effetMots}` : ''}`)
    };
  }
  if (chose.deplacable !== true && source.genre !== 'creative') return refus(`Une copie se crée dans sa source. ${chose.deplacable.raison}`.trim(), chose.ouvre);
  const decaleMouvements: MouvementCaisse[] = ctx.courbe ? ctx.courbe.mouvements.filter(m => m.choseId === chose.id).map(m => ({ ...m, id: `${m.id}~copie`, choseId: `${chose.id}~copie`, jour: decale(m.jour, delta) })) : [];
  const mise = (chose.miseDeCote && chose.centimes && chose.fenetre) ? [{ id: `${chose.id}~copie`, titre: chose.titre, du: decale(chose.fenetre.du, delta), au: decale(chose.fenetre.au, delta), centimes: Math.abs(chose.centimes) }] : [];
  const apres = ctx.courbe ? courbeAvec(ctx.courbe, decaleMouvements, mise) : null;
  const effet = effetCaisse(ctx.courbe, apres);
  /* CRITIQUE-11 n° 4, CRITIQUE-12 n° 2 : sans effet sur la courbe, l'effet en mots (« recette estimée 1 180 · ne change pas la courbe (pas dans Finances) », « sans montant ») */
  const effetMots = effet ? undefined : effetEnMots(chose, ctx);
  const message = annuler(effet ? `Dupliquée · ${effet.texte}` : `Dupliquée en ${etiquetteS(cible)}`);
  if (source.genre === 'creative') {
    const document = { id: nouvelId(ctx, 'CR'), type: source.type, title: chose.titre, status: 'todo', date: decale(chose.debut, delta), ...(chose.rangee === 'activites' && source.type === 'event' ? { activite: true } : {}), ...(chose.fenetre ? { fenetre: fenetreDecalee(chose.fenetre, delta) } : {}), ...(chose.liens ? { liens: chose.liens } : {}) };
    return { ok: true, ecritures: [{ op: 'creer', collection: 'creativeItems', document }], effet, ...(effetMots ? { effetMots } : {}), promesse: null, courbeApres: apres, message };
  }
  const plan = planDe(chose, ctx);
  if (!plan || plan.source !== 'manual') return refus('Cette prévision se copie dans Finances.', { ecran: 'finances' });
  const date = isoDate(plan.date) ?? chose.debut;
  const document = {
    ...plan, id: nouvelId(ctx, 'PLAN'), date: decale(date, delta), status: plan.status === 'draft' ? 'draft' : 'active', createdAt: ctx.maintenant ?? `${ctx.aujourdhui}T12:00:00.000Z`,
    ...(plan.fenetre ? { fenetre: fenetreDecalee(plan.fenetre, delta) } : {})
  } as unknown as { id: string } & Record<string, unknown>;
  delete document.updatedAt;
  return { ok: true, ecritures: [{ op: 'creer', collection: 'financialPlans', document }], effet, ...(effetMots ? { effetMots } : {}), promesse: null, courbeApres: apres, message };
}

/**
 * f5-a (D-113, L33) : Retirer n'efface rien. Une fête ou une activité perd sa date (elle reste dans sa source, dans la poche « Sans date ») ;
 * un plan manuel passe à `cancelled` (il reste dans Finances). Un brassin, une facture, une charge fixe : refus, avec l'écran où le faire.
 */
/**
 * Paquet F n° 2 (PC-138, décision du pilote, 19.11) : « Retirer » avait deux sens (une fête part dans Sans date, une vente est marquée annulée).
 * Le libellé dit ce que fait le geste, et le message le redit : « Ranger sans date » / « Rangée sans date » ; « Annuler la vente » / « Vente
 * annulée ». Une prévision d'une autre rangée se nomme de même par ce qu'elle est.
 */
const ANNULATION_DE_RANGEE: Partial<Record<ChoseCalendrier['rangee'], { libelle: string; fait: string }>> = {
  ventes: { libelle: 'Annuler la vente', fait: 'Vente annulée' },
  achats: { libelle: 'Annuler l’achat', fait: 'Achat annulé' },
  travaux: { libelle: 'Annuler les travaux', fait: 'Travaux annulés' },
  papiers: { libelle: 'Annuler le papier', fait: 'Papier annulé' }
};
const ANNULATION_PAR_DEFAUT = { libelle: 'Annuler la prévision', fait: 'Prévision annulée' };

/** Le libellé du geste Retirer pour cette chose : ce qu'il fait, jamais « Retirer » seul. */
export function libelleRetirer(chose: Pick<ChoseCalendrier, 'source' | 'rangee'>): string {
  if (chose.source.genre === 'creative') return 'Ranger sans date';
  return (ANNULATION_DE_RANGEE[chose.rangee] ?? ANNULATION_PAR_DEFAUT).libelle;
}

export function retirer(chose: ChoseCalendrier, ctx: ContexteGestes): Resolution {
  const source = chose.source;
  /* CRITIQUE-11 n° 4 (E31, D-192) : comme Dupliquer, Retirer dit son effet ; sans effet sur la courbe, en mots (`effetEnMots`) */
  if (source.genre === 'creative') {
    const apres = ctx.courbe ? courbeSans(ctx.courbe, chose.id) : null;
    const effet = effetCaisse(ctx.courbe, apres);
    const effetMots = effet ? undefined : effetEnMots(chose, ctx);
    return {
      ok: true, ecritures: [{ op: 'patch', collection: 'creativeItems', id: source.id, patch: { date: '' } }], effet, ...(effetMots ? { effetMots } : {}), promesse: null, courbeApres: apres,
      message: annuler(`Rangée sans date, plus en ${etiquetteS(chose.debut)}`, { texte: 'Sans date ›', ancre: 'sans-date' })
    };
  }
  if (source.genre === 'plan' && source.origine === 'manual') {
    const apres = ctx.courbe ? courbeSans(ctx.courbe, chose.id) : null;
    const effet = effetCaisse(ctx.courbe, apres);
    const effetMots = effet ? undefined : effetEnMots(chose, ctx);
    const { fait: annule } = ANNULATION_DE_RANGEE[chose.rangee] ?? ANNULATION_PAR_DEFAUT;
    return {
      ok: true, ecritures: [{ op: 'patch', collection: 'financialPlans', id: source.id, patch: { status: 'cancelled' } }], effet, ...(effetMots ? { effetMots } : {}), promesse: null, courbeApres: apres,
      message: annuler(`${annule}${effet ? ` · ${effet.texte}` : ''}`, { texte: 'dans Finances ›', ancre: 'finances', cible: { ecran: 'finances' } })
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

/**
 * Paquet F n° 1 (PC-142) : une chose de la poche « Sans date » se supprime pour de vrai (le document de la source est effacé), sans dialogue :
 * le message dit « Supprimée : … · Annuler » le temps du message, et Annuler recrée le document d'avant (`appliquer`, inverse d'un `supprimer`).
 * Seule la poche le propose : une chose datée se range sans date ou s'annule (L33 : rien d'ancien ne s'efface d'un geste de la frise).
 */
export function supprimerSansDate(chose: ChoseCalendrier): Resolution {
  if (!chose.sansDate || chose.source.genre !== 'creative') return refus('Seule une chose sans date se supprime d’ici.', chose.ouvre);
  return { ok: true, ecritures: [{ op: 'supprimer', collection: 'creativeItems', id: chose.source.id }], effet: null, promesse: null, courbeApres: null, message: annuler(`Supprimée : ${chose.titre}`) };
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
export function lier(chose: ChoseCalendrier, liens: { batchId?: string; clientId?: string; evenementId?: string }, ctx: ContexteGestes, nom?: string): Resolution {
  const source = chose.source;
  /* PC-NOTE-7 (lot B-C) : « Liée » pour un achat se lisait faux ; l'accord suit la chose : une vente, une fête, une activité « liée », un achat,
     un papier « lié », des travaux « liés » */
  const accord = chose.rangee === 'achats' || chose.rangee === 'papiers' || chose.rangee === 'brassins' ? 'Lié' : chose.rangee === 'travaux' ? 'Liés' : 'Liée';
  const texte = nom?.trim() ? `${accord} à ${nom.trim()}` : accord;
  if (source.genre === 'creative') return { ok: true, ecritures: [{ op: 'patch', collection: 'creativeItems', id: source.id, patch: { liens: { ...chose.liens, ...liens } } }], effet: null, promesse: null, courbeApres: ctx.courbe, message: annuler(texte) };
  const plan = planDe(chose, ctx);
  if (!plan || plan.source !== 'manual') return refus('Un lien se pose sur une prévision manuelle ou une chose du carnet.', chose.ouvre);
  return { ok: true, ecritures: [{ op: 'patch', collection: 'financialPlans', id: plan.id, patch: { ...(liens.batchId ? { batchId: liens.batchId } : {}), ...(liens.clientId ? { clientId: liens.clientId } : {}), ...(liens.evenementId ? { evenementId: liens.evenementId } : {}) } }], effet: null, promesse: null, courbeApres: ctx.courbe, message: annuler(texte) };
}

/**
 * Lot C (test en ligne, n° 5) : délier une chose de tout ce à quoi elle est liée (brassin, client, fête). Le même chemin qu'Annuler de `lier` :
 * un champ `undefined` s'efface de la source. Refusé hors d'une prévision manuelle ou d'une chose du carnet, comme `lier`.
 */
export function delier(chose: ChoseCalendrier, ctx: ContexteGestes, nom?: string): Resolution {
  const source = chose.source;
  const texte = nom?.trim() ? `Déliée de ${nom.trim()}` : 'Déliée';
  if (source.genre === 'creative') return { ok: true, ecritures: [{ op: 'patch', collection: 'creativeItems', id: source.id, patch: { liens: undefined } }], effet: null, promesse: null, courbeApres: ctx.courbe, message: annuler(texte) };
  const plan = planDe(chose, ctx);
  if (!plan || plan.source !== 'manual') return refus('Un lien se retire d’une prévision manuelle ou d’une chose du carnet.', chose.ouvre);
  const cles = (['batchId', 'clientId', 'evenementId'] as const).filter(k => plan[k]);
  return { ok: true, ecritures: [{ op: 'patch', collection: 'financialPlans', id: plan.id, patch: Object.fromEntries(cles.map(k => [k, undefined])) }], effet: null, promesse: null, courbeApres: ctx.courbe, message: annuler(texte) };
}

/** L1 a et b (E36) : une idée datée envoyée au carnet. Elle n'a ni rangée, ni case, ni bouton : elle se montre en icône dans la bande. */
export function noterIdee(titre: string, lundi: string, ctx: Pick<ContexteGestes, 'nouvelId'>): Resolution {
  const r = enregistrementIdee(titre, lundi, ctx);
  if ('raison' in r) return refus(r.raison);
  const e = r.enregistrement;
  return { ok: true, ecritures: [{ op: 'creer', collection: e.collection, document: e.document as unknown as { id: string } & Record<string, unknown> }], effet: null, promesse: null, courbeApres: null, message: annuler(`Idée notée en ${etiquetteS(lundi)}`) };
}

/**
 * CAL-PASSE (décision du pilote, 20.11) : une idée de bière hors carnet (`recipe-idea` datée, icône de sa semaine) se modifie sur place, dans sa
 * feuille, comme une fête ; son icône n'envoie plus dans le Carnet général, qui ne la montre pas. Le titre et la semaine s'écrivent ; le jour
 * déjà posé dans la semaine choisie est gardé. Annuler remet l'idée d'avant.
 */
export function modifierIdee(id: string, titre: string, lundi: string, jourActuel: string | null | undefined): Resolution {
  const t = titre.trim();
  if (!t) return refus('Dis l’idée en quelques mots.');
  const garde = jourActuel && lundiDe(jourActuel) === lundiDe(lundi) ? jourActuel : lundiDe(lundi);
  return { ok: true, ecritures: [{ op: 'patch', collection: 'creativeItems', id, patch: { title: t, date: garde } }], effet: null, promesse: null, courbeApres: null, message: annuler(`Idée modifiée · ${etiquetteS(lundi)}`) };
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
  | { genre: 'lier'; chose: ChoseCalendrier; liens: { batchId?: string; clientId?: string; evenementId?: string } }
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
