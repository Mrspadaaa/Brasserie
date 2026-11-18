import type { Batch, Client, KegItem } from '../../types';

/**
 * « Qui a reçu ce lot » (maquette lot/v1, « Les branches », 16.11) : du lot à ses fûts, des fûts à leurs clients.
 *
 * Rien n'est stocké en plus : un fût garde déjà son lot (`batchRef`), son client et son historique
 * (rempli, livré, retour). On relit ces étapes dans l'ordre pour savoir quel lot le fût portait à chaque livraison,
 * même après son retour (le fût vidé perd son lot, pas son historique).
 *
 * Limites dites, jamais comblées par une valeur inventée :
 * - l'historique d'un fût garde 30 étapes ; une livraison plus ancienne a pu en sortir ;
 * - un fût rempli par l'échelle de conditionnement n'écrit pas « rempli » : on le rattache par `packaging.kegIds`
 *   et la date de conditionnement ;
 * - un retour non noté reste « retour non noté », ni chez le client ni rentré à une date inventée.
 */

export type EtatFutDuLot = 'chez-lui' | 'rentre' | 'retour-non-note';

/** Un passage d'un fût chez un client : livré, puis rentré ou encore là. */
export interface PassageFut {
  /** Date de livraison telle que stockée (`JJ.MM.AAAA`) ; absente quand le fût a été livré avant l'historique. */
  livre?: string;
  /** Date du retour (vide ou plein), si elle est notée. */
  rentre?: string;
  etat: EtatFutDuLot;
}

/** Un fût physique chez un client : une seule fois, même livré, rentré puis relivré (le dernier passage dit où il en est). */
export interface FutDuLot extends PassageFut {
  id: string;
  /** Tous ses passages chez ce client, du plus ancien au plus récent (au moins un). */
  passages: PassageFut[];
}

export interface BrancheClient {
  /** Identifiant du client (onglet Clients) ou, à défaut, son nom normalisé. */
  cle: string;
  clientId?: string;
  nom: string;
  /** Un fût par ligne, la livraison la plus récente en premier. */
  futs: FutDuLot[];
  chezLui: number;
  /** Date de la livraison la plus récente. */
  derniereLivraison?: string;
  contact?: string;
  /** Numéro de la fiche client ; absent quand le client n'est pas relié à une fiche ou n'a pas de numéro. */
  tel?: string;
}

export interface QuiARecu {
  branches: BrancheClient[];
  /** Fûts de ce lot encore en cave, prêts à livrer. */
  enCave: string[];
  /** Bouteilles conditionnées (33 cl et 75 cl) ; les ventes à la caisse, comptées en litres, n'en sont pas déduites. 0 : aucune notée. */
  bouteilles: number;
  /** Fûts livrés au moins une fois. */
  livres: number;
  chezEux: number;
}

const SWISS = /^(\d{2})\.(\d{2})\.(\d{4})$/;
const ISO = /^(\d{4})-(\d{2})-(\d{2})$/;

/** Minuit UTC d'une date `JJ.MM.AAAA` ou `AAAA-MM-JJ` ; `undefined` si elle est illisible ou n'existe pas. */
export function jourDe(date?: string): number | undefined {
  const d = (date ?? '').trim();
  const sw = SWISS.exec(d), iso = ISO.exec(d);
  const p = sw ? [+sw[3], +sw[2], +sw[1]] : iso ? [+iso[1], +iso[2], +iso[3]] : undefined;
  if (!p) return undefined;
  const t = Date.UTC(p[0], p[1] - 1, p[2]);
  const b = new Date(t);
  return b.getUTCFullYear() === p[0] && b.getUTCMonth() === p[1] - 1 && b.getUTCDate() === p[2] ? t : undefined;
}

const MOIS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];

/** `11.11.2026` ➔ « 11 nov. » ; l'année s'ajoute quand elle n'est pas celle d'aujourd'hui. Illisible : « date non notée ». */
export function jourCourt(date?: string, aujourdhui?: string): string {
  const t = jourDe(date);
  if (t === undefined) return 'date non notée';
  const d = new Date(t);
  const annee = jourDe(aujourdhui) === undefined ? undefined : new Date(jourDe(aujourdhui)!).getUTCFullYear();
  return `${d.getUTCDate()} ${MOIS[d.getUTCMonth()]}${annee !== undefined && annee !== d.getUTCFullYear() ? ` ${d.getUTCFullYear()}` : ''}`;
}

const norme = (s?: string) => (s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();

/** Le lot dit par une étape « rempli » : « Blonde d'automne LOT-014 » ou « LOT-014 ». */
function ditCeLot(detail: string | undefined, id: string): boolean {
  const d = (detail ?? '').trim();
  return d === id || d.endsWith(` ${id}`);
}

interface Livraison { client: string; clientId?: string; livre?: string; rentre?: string; etat: EtatFutDuLot }

/** Les livraisons de ce lot dans un fût, de la plus ancienne à la plus récente. */
export function livraisonsDuFut(keg: KegItem, batch: Pick<Batch, 'id' | 'bottlingDate' | 'packaging'>): Livraison[] {
  const rattache = !!batch.packaging?.kegIds?.includes(keg.id);
  const depuis = jourDe(batch.bottlingDate);
  const sorties: Livraison[] = [];
  let lot: 'ce-lot' | 'autre' | undefined;
  let ouverte: Livraison | undefined;
  // Le rattachement par le conditionnement ne sert qu'une fois : après le premier retour vide, un nouveau remplissage sans « rempli » reste inconnu.
  let rattachable = rattache;
  let parRattachement = false;
  const fermer = (rentre: string, etat: EtatFutDuLot) => { if (ouverte) { ouverte.rentre = rentre; ouverte.etat = etat; ouverte = undefined; } };

  for (const e of keg.historique ?? []) {
    if (e.quoi === 'rempli') { lot = ditCeLot(e.detail, batch.id) ? 'ce-lot' : 'autre'; ouverte = undefined; }
    else if (e.quoi === 'lave' || e.quoi === 'a-laver' || e.quoi === 'ajoute') { lot = undefined; ouverte = undefined; }
    else if (e.quoi === 'livre') {
      // Sans « rempli » : le fût du conditionnement, livré à partir du jour où le lot a été conditionné.
      const viaPaquet = lot === undefined && rattachable && depuis !== undefined && (jourDe(e.date) ?? -1) >= depuis;
      if (lot === 'ce-lot' || viaPaquet) {
        if (viaPaquet) parRattachement = true;
        lot = 'ce-lot'; ouverte = { client: e.detail ?? '', livre: e.date, etat: 'retour-non-note' }; sorties.push(ouverte);
      } else ouverte = undefined;
    } else if (e.quoi === 'retour-vide') { fermer(e.date, 'rentre'); lot = 'autre'; if (parRattachement) rattachable = false; }
    else if (e.quoi === 'retour-plein') fermer(e.date, 'rentre');
  }

  // L'état d'aujourd'hui tranche : un fût livré de ce lot est chez son client actuel.
  if (keg.state === 'livre' && keg.batchRef === batch.id) {
    const actuelle = ouverte ?? { client: keg.clientName ?? '', etat: 'chez-lui' as const };
    if (!ouverte) sorties.push(actuelle);
    actuelle.etat = 'chez-lui';
    actuelle.rentre = undefined;
    if (keg.clientName) actuelle.client = keg.clientName;
    if (keg.clientId) actuelle.clientId = keg.clientId;
    if (keg.deliveryDate) actuelle.livre = keg.deliveryDate;
  }
  return sorties;
}

/** Le client de la fiche qui porte ce nom ou cet identifiant. */
function ficheDe(clients: Client[], clientId: string | undefined, nom: string): Client | undefined {
  return (clientId ? clients.find((c) => c.id === clientId) : undefined) ?? clients.find((c) => norme(c.name) === norme(nom));
}

/** Qui a reçu ce lot : les clients (ceux qui en ont encore en tête), les fûts en cave. */
export function quiARecuLot(batch: Pick<Batch, 'id' | 'bottlingDate' | 'packaging'>, kegs: KegItem[], clients: Client[]): QuiARecu {
  const parCle = new Map<string, BrancheClient>();
  const enCave: string[] = [];
  let livres = 0;

  for (const keg of kegs) {
    if (keg.state === 'plein' && keg.batchRef === batch.id) enCave.push(keg.id);
    for (const l of livraisonsDuFut(keg, batch)) {
      livres += 1;
      const fiche = ficheDe(clients, l.clientId, l.client);
      const nom = fiche?.name ?? (l.client || 'Client non noté');
      const cle = fiche?.id ?? `nom:${norme(nom)}`;
      const b = parCle.get(cle) ?? { cle, clientId: fiche?.id, nom, futs: [], chezLui: 0,
        contact: fiche?.contact?.trim() || undefined, tel: fiche?.phone?.trim() || undefined };
      const passage: PassageFut = { livre: l.livre, rentre: l.rentre, etat: l.etat };
      const dejaLa = b.futs.find((f) => f.id === keg.id);
      if (dejaLa) { dejaLa.passages.push(passage); Object.assign(dejaLa, passage); } else b.futs.push({ id: keg.id, ...passage, passages: [passage] });
      parCle.set(cle, b);
    }
  }

  const branches = [...parCle.values()];
  for (const b of branches) {
    b.futs.sort((x, y) => (jourDe(y.livre) ?? 0) - (jourDe(x.livre) ?? 0) || x.id.localeCompare(y.id, 'fr', { numeric: true }));
    b.chezLui = b.futs.filter((f) => f.etat === 'chez-lui').length;
    b.derniereLivraison = b.futs.find((f) => jourDe(f.livre) !== undefined)?.livre;
  }
  branches.sort((x, y) => y.chezLui - x.chezLui || (jourDe(y.derniereLivraison) ?? 0) - (jourDe(x.derniereLivraison) ?? 0) || x.nom.localeCompare(y.nom, 'fr'));
  enCave.sort((a, b) => a.localeCompare(b, 'fr', { numeric: true }));
  const bouteilles = Math.max(0, batch.packaging?.bottles33 ?? 0) + Math.max(0, batch.packaging?.bottles75 ?? 0);
  return { branches, enCave, bouteilles, livres, chezEux: branches.reduce((n, b) => n + b.chezLui, 0) };
}

/** Le client proposé d'office pour le prochain fût : celui qui a reçu le lot le plus récemment (maquette : « client proposé d'office »). */
export function clientPropose(r: QuiARecu): BrancheClient | undefined {
  return [...r.branches].filter((b) => b.derniereLivraison)
    .sort((x, y) => (jourDe(y.derniereLivraison) ?? 0) - (jourDe(x.derniereLivraison) ?? 0) || y.chezLui - x.chezLui)[0];
}

/** Numéro de lot dit dans le disque de la racine : « LOT-014 » ➔ « 14 » ; sans chiffres, rien (jamais 0). */
export function numeroDuLot(id: string): string | undefined {
  const m = /(\d+)$/.exec(id.trim());
  return m ? String(parseInt(m[1], 10)) : undefined;
}
