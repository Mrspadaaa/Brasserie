import type { Transaction } from '../../types';

/**
 * Les prix de vente pratiqués, client par client, ramenés au litre (frise kxc, Atelier › Tarifs).
 *
 * Source unique : les lignes de vente de la caisse (`FinanceLine.sourceReference` = `vente:<brassin|->:<format>:<litres>`, voir
 * `ui/vente/ligneVente.ts`), le client étant `finance.vendor`. Le prix d'une unité = montant de la ligne ÷ quantité (comme `prixReels`).
 * Pour un même client, une même bière et un même format, seul le prix le plus récent compte : c'est le prix pratiqué aujourd'hui.
 * Rien n'est deviné : sans client, « Sans client » ; sans brassin, bière `null` ; un montant nul ou négatif (offert, avoir) n'est pas un prix.
 * Pur : le décodage de ligne et le nom de bière d'un brassin sont passés par l'appelant.
 */

/** Le genre de client que l'app connaît : `Client.type` (Pro ou Privé). Bistrot, cave, épicerie ou endroit n'existent pas dans la fiche. */
export type GenreClient = 'pro' | 'prive' | 'inconnu';

export interface VenteAuLitre {
  /** Client · bière · format : une vente par clé. */
  cle: string;
  qui: string;
  genre: GenreClient;
  biere: string | null;
  formatId: string;
  litresUnite: number;
  /** Prix d'une unité, CHF, base de la ligne. */
  prix: number;
  /** CHF le litre. */
  litre: number;
  /** Quantité de la ligne (« 10 » bouteilles) et son montant en CHF, tels que saisis : la raison d'un « à vérifier » s'écrit avec eux. */
  quantite: number;
  montantLigne: number;
  /** JJ.MM.AAAA, celle de la vente. */
  date: string;
  transactionId: string;
  /** Donnée d'exemple (id DEMO-…) : l'écran le dit. */
  demo: boolean;
}

/**
 * Plage plausible d'un prix de vente, CHF le litre (garde-fou de lecture, pas une règle de prix) : une bière se vend de quelques francs le
 * litre (fût) à quelques dizaines (bouteille). Hors de [1 ; 100], le prix est lu comme « à vérifier » (montant saisi à tort, test d'un autre,
 * quantité fausse) : il n'est jamais tracé sur l'axe, où il tirerait l'échelle (jeu en ligne 16.11 : 759,33 CHF le litre, soit 5 695 CHF
 * pour 10 bouteilles de 75 cl). Les bornes viennent de la voie fix-carnet (100) et de l'auteur (1) : à valider par le brasseur.
 */
export const PLAGE_LITRE_PLAUSIBLE = [1, 100] as const;

/** Vrai si le prix au litre sort de la plage plausible. Un prix inconnu ou non fini n'est pas plausible non plus. */
export const hors = (litre: number): boolean =>
  !Number.isFinite(litre) || litre < PLAGE_LITRE_PLAUSIBLE[0] || litre > PLAGE_LITRE_PLAUSIBLE[1];

/** Les ventes sûres (sur l'axe) et celles « à vérifier » (montrées à part, jamais sur l'axe). */
export function separerAVerifier<T extends { litre: number }>(ventes: readonly T[]): { sures: T[]; aVerifier: T[] } {
  const sures: T[] = [], aVerifier: T[] = [];
  for (const v of ventes) (hors(v.litre) ? aVerifier : sures).push(v);
  return { sures, aVerifier };
}

const COURT_FORMAT: Record<string, string> = { '33cl': '33 cl', '75cl': '75 cl' };
const UNITE_FORMAT: Record<string, string> = { '33cl': 'la bouteille', '75cl': 'la bouteille', fut: 'le fût', growler: 'le growler', carton: 'le carton', verre: 'le verre' };
const mFr = new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/**
 * La raison d'un « à vérifier », en une ligne, tirée de la ligne de la vente : « 10 × 75 cl à 5 695,00 : 569,50 la bouteille ».
 * Le brasseur y lit tout de suite si c'est la quantité ou le montant qui est faux. Rien n'est ajouté à ce que la ligne dit.
 */
export function raisonAVerifier(v: Pick<VenteAuLitre, 'quantite' | 'montantLigne' | 'prix' | 'formatId' | 'litresUnite'>): string {
  const fmt = COURT_FORMAT[v.formatId] ?? nomFormat(v.formatId, v.litresUnite).replace(/^./, (c) => c.toLowerCase());
  const unite = UNITE_FORMAT[v.formatId] ?? 'l’unité';
  return `${String(Number(v.quantite.toFixed(3))).replace('.', ',')} × ${fmt} à ${mFr.format(v.montantLigne)} : ${mFr.format(v.prix)} ${unite}`;
}

export interface LigneDecodee { batchId: string | undefined; formatId: string; litresUnite: number }
export interface ClientConnu { name: string; type: 'Pro' | 'Privé' }

const iso = (d: string) => { const m = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(d ?? ''); return m ? `${m[3]}-${m[2]}-${m[1]}` : String(d ?? ''); };
const norm = (t: string) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ').trim().toLowerCase();
export const SANS_CLIENT = 'Sans client';

export function ventesAuLitre(input: {
  transactions: readonly Transaction[];
  clients: readonly ClientConnu[];
  decoder: (ref: string | undefined) => LigneDecodee | null;
  biereDuLot: (batchId: string | undefined) => string | null;
  estDemo: (id: string) => boolean;
}): VenteAuLitre[] {
  const parNom = new Map(input.clients.map((c) => [norm(c.name), c]));
  const recentes = [...input.transactions].sort((a, b) => iso(b.date).localeCompare(iso(a.date)));
  const vues = new Map<string, VenteAuLitre>();
  for (const t of recentes) {
    const f = t.finance;
    if (f?.kind !== 'income' || f.voidedAt) continue;
    const nom = f.vendor?.trim() || '';
    const client = nom ? parNom.get(norm(nom)) : undefined;
    const genre: GenreClient = client ? (client.type === 'Privé' ? 'prive' : 'pro') : 'inconnu';
    for (const l of f.lines) {
      const lue = input.decoder(l.sourceReference);
      const q = Number(l.quantity);
      if (!lue || !(q > 0) || !Number.isFinite(l.amountCents) || l.amountCents <= 0) continue;
      const prix = Math.round(l.amountCents / q) / 100;
      const biere = input.biereDuLot(lue.batchId ?? f.batchId);
      const qui = client?.name ?? (nom || SANS_CLIENT);
      // Une vente sans client n'est pas « le même client » qu'une autre : chacune garde son prix (le plus récent ne remplace que le même client nommé).
      const cle = `${norm(qui)}|${biere ?? ''}|${lue.formatId}|${lue.litresUnite}${nom ? '' : `|${t.id}|${l.id}`}`;
      if (vues.has(cle)) continue;
      vues.set(cle, { cle, qui, genre, biere, formatId: lue.formatId, litresUnite: lue.litresUnite, prix, litre: prix / lue.litresUnite,
        quantite: q, montantLigne: l.amountCents / 100, date: t.date, transactionId: t.id, demo: input.estDemo(t.id) });
    }
  }
  return [...vues.values()];
}

const fr = (n: number) => String(Number(n.toFixed(3))).replace('.', ',');
/** Le nom d'un format (« Fût 20 L », « Bouteille 33 cl ») ; un format inconnu garde son id et ses litres. */
export function nomFormat(formatId: string, litres: number): string {
  switch (formatId) {
    case '33cl': return 'Bouteille 33 cl';
    case '75cl': return 'Bouteille 75 cl';
    case 'fut': return `Fût ${fr(litres)} L`;
    case 'growler': return `Growler ${fr(litres)} L`;
    case 'carton': return Math.abs(litres - 3.96) < 0.005 ? 'Carton 12 × 33 cl' : `Carton ${fr(litres)} L`;
    case 'verre': return `Verre ${fr(litres * 10)} dl`;
    default: return `${formatId} · ${fr(litres)} L`;
  }
}

export interface GroupeFormat {
  /** formatId:litres — un fût de 20 L et un de 30 L sont deux couloirs. */
  cle: string;
  formatId: string;
  litresUnite: number;
  nom: string;
  ventes: VenteAuLitre[];
  /** Médiane, min et max au litre ; min et max du prix d'une unité. */
  mediane: number;
  min: number;
  max: number;
  pmin: number;
  pmax: number;
}

const mediane = (a: number[]) => { const s = [...a].sort((p, q) => p - q); const m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };

/** Les couloirs d'une bière (`null` : toutes), du moins cher au plus cher au litre (médiane). */
export function groupesParFormat(ventes: readonly VenteAuLitre[], biere: string | null): GroupeFormat[] {
  const par = new Map<string, VenteAuLitre[]>();
  for (const v of ventes) {
    if (biere !== null && v.biere !== biere) continue;
    const k = `${v.formatId}:${v.litresUnite}`;
    par.set(k, [...(par.get(k) ?? []), v]);
  }
  return [...par.entries()].map(([cle, vs]) => {
    const ls = vs.map((v) => v.litre), ps = vs.map((v) => v.prix);
    return { cle, formatId: vs[0].formatId, litresUnite: vs[0].litresUnite, nom: nomFormat(vs[0].formatId, vs[0].litresUnite),
      ventes: [...vs].sort((a, b) => a.litre - b.litre || a.qui.localeCompare(b.qui, 'fr')),
      mediane: mediane(ls), min: Math.min(...ls), max: Math.max(...ls), pmin: Math.min(...ps), pmax: Math.max(...ps) };
  }).sort((a, b) => a.mediane - b.mediane);
}

/** Les bières des ventes, la plus vendue (en nombre de clients) d'abord ; sans bière connue : à la fin, absente des puces. */
export function bieresDesVentes(ventes: readonly VenteAuLitre[]): string[] {
  const n = new Map<string, number>();
  for (const v of ventes) if (v.biere) n.set(v.biere, (n.get(v.biere) ?? 0) + 1);
  return [...n.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'fr')).map(([b]) => b);
}
