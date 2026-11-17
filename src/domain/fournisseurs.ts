/*
 * Fiche fournisseur (maquette fournisseur/v1 « les prix d'abord », choisie le 16.11). Règles pures : aucune écriture.
 *
 * Le fournisseur n'est pas une entité de l'app : c'est un nom écrit sur les dépenses (`finance.vendor`, ou « Fournisseur : X » des écritures
 * d'avant) et sur les articles du stock (`supplier`). Cette fiche les regroupe, sans toucher à une dépense : « Les factures gardent leur nom
 * d'origine » (maquette). Réunir deux noms écrit seulement un renvoi (nom absorbé → nom gardé) dans les réglages de l'appareil ; l'annuler l'efface.
 *
 * Ce qui n'est pas dans les données reste inconnu : le délai de livraison (aucune date de commande n'est notée), le pays. Jamais 0.
 *
 * État de l'art (L29) : rapprocher des noms d'entreprise est un problème de résolution d'entités. Base déjà dans l'app : `vendorKey` (casse, accents,
 * ponctuation, forme juridique finale). On y ajoute deux règles exactes, lisibles et chacune dite à l'écran comme preuve : « un mot en plus »
 * (les mots du nom court sont tous dans le nom long) et « adresse web » (brouwland.com). Pas de distance d'édition : une faute de frappe proche n'est
 * pas une preuve qu'on sache expliquer ; le brasseur réunit à la main, et chaque case reste à décocher.
 */
import type { StockItem, Transaction } from '../types';
import { isActiveTransaction, isExpense, isoDate, transactionAmount, transactionVendor } from './finance/ledger';
import { vendorKey } from './finance/duplicates';
import type { FinanceTransaction } from './finance/types';

const jourCourt = new Intl.DateTimeFormat('fr-CH', { day: 'numeric', month: 'short', year: 'numeric' });
/** « 8 nov. 2026 » ; une date illisible reste dite, jamais inventée. */
const dateFiche = (date?: string): string => { const iso = isoDate(date); return iso ? jourCourt.format(new Date(iso + 'T12:00:00')) : 'Date à vérifier'; };

export const RAISONS = ['moins cher', 'plus proche', 'livre vite', 'qualité constante', 'franco de port', 'SAV en Suisse'] as const;

/** Les réglages de la fiche, propres à l'appareil (pas de schéma Firestore). Clés = `vendorKey`. */
export interface ReglagesFournisseurs {
  /** Nom absorbé → nom gardé. */
  reunis: Record<string, string>;
  /** « Tes choix ici » : pourquoi on l'a pris (raisons touchées), le jour (AAAA-MM-JJ), et en trois mots écrits à la main pour quoi, qui on a écarté, quand le revoir. */
  raisons: Record<string, ChoixFournisseur>;
  /** « Pas maintenant » : la proposition de réunir se range en une ligne. */
  plusTard: string[];
  /** « Nouveau fournisseur » : ajoutés à la main (nom, pays, site), avant toute facture. */
  ajoutes: FournisseurAjoute[];
  /** « Commande passée » : le jour de la commande, puis celui de la réception ; l'écart est le délai appris. Clés = `vendorKey`. */
  commandes: Record<string, CommandePassee[]>;
}
export interface ChoixFournisseur { raisons: string[]; le: string; pour?: string; ecartes?: string; revoir?: string }
export interface FournisseurAjoute { nom: string; pays?: string; site?: string }
export interface CommandePassee { le: string; recue?: string }
export const REGLAGES_VIDES: ReglagesFournisseurs = { reunis: {}, raisons: {}, plusTard: [], ajoutes: [], commandes: {} };

const JOUR_ISO = /^\d{4}-\d{2}-\d{2}$/;
const estTexte = (v: unknown): v is string => typeof v === 'string' && v.length > 0;
/** Ce que le stockage rend, validé : une valeur abîmée donne des réglages vides, jamais une erreur. */
export function reglagesValides(v: unknown): ReglagesFournisseurs {
  if (!v || typeof v !== 'object') return REGLAGES_VIDES;
  const o = v as Record<string, unknown>;
  const reunis: Record<string, string> = {};
  if (o.reunis && typeof o.reunis === 'object') for (const [a, b] of Object.entries(o.reunis)) if (estTexte(a) && estTexte(b) && a !== b) reunis[a] = b;
  const raisons: ReglagesFournisseurs['raisons'] = {};
  if (o.raisons && typeof o.raisons === 'object') {
    for (const [k, r] of Object.entries(o.raisons as Record<string, unknown>)) {
      const x = r as { raisons?: unknown; le?: unknown };
      if (Array.isArray(x?.raisons) && x.raisons.every(estTexte) && typeof x.le === 'string') {
        const y = r as ChoixFournisseur;
        raisons[k] = { raisons: x.raisons as string[], le: x.le, ...(estTexte(y.pour) ? { pour: y.pour } : {}), ...(estTexte(y.ecartes) ? { ecartes: y.ecartes } : {}), ...(estTexte(y.revoir) ? { revoir: y.revoir } : {}) };
      }
    }
  }
  const plusTard = Array.isArray(o.plusTard) ? o.plusTard.filter(estTexte) : [];
  const ajoutes: FournisseurAjoute[] = Array.isArray(o.ajoutes)
    ? o.ajoutes.flatMap((a): FournisseurAjoute[] => {
      const x = a as Partial<FournisseurAjoute>;
      return estTexte(x?.nom) ? [{ nom: x.nom, ...(estTexte(x.pays) ? { pays: x.pays } : {}), ...(estTexte(x.site) ? { site: x.site } : {}) }] : [];
    })
    : [];
  const commandes: Record<string, CommandePassee[]> = {};
  if (o.commandes && typeof o.commandes === 'object') {
    for (const [k, l] of Object.entries(o.commandes as Record<string, unknown>)) {
      if (!Array.isArray(l)) continue;
      const ok = l.flatMap((c): CommandePassee[] => {
        const x = c as Partial<CommandePassee>;
        return typeof x?.le === 'string' && JOUR_ISO.test(x.le) ? [{ le: x.le, ...(typeof x.recue === 'string' && JOUR_ISO.test(x.recue) ? { recue: x.recue } : {}) }] : [];
      });
      if (ok.length) commandes[k] = ok;
    }
  }
  return { reunis, raisons, plusTard, ajoutes, commandes };
}

const MS_JOUR = 86_400_000;
const jourUtc = (iso: string) => Date.parse(`${iso}T12:00:00Z`);
/** Le délai appris : la médiane des jours entre une commande et sa réception ; `null` tant qu'aucune commande n'est reçue (jamais 0). */
export function delaiAppris(commandes: CommandePassee[] | undefined): { jours: number; sur: number } | null {
  const ecarts = (commandes ?? []).flatMap(c => c.recue ? [Math.round((jourUtc(c.recue) - jourUtc(c.le)) / MS_JOUR)] : []).filter(n => Number.isFinite(n) && n >= 0).sort((a, b) => a - b);
  if (!ecarts.length) return null;
  const m = ecarts.length >> 1;
  return { jours: ecarts.length % 2 ? ecarts[m] : Math.round((ecarts[m - 1] + ecarts[m]) / 2), sur: ecarts.length };
}

/** Réunir des noms sous un nom gardé : les noms déjà réunis sous un nom absorbé le suivent. */
export function reunir(r: ReglagesFournisseurs, garde: string, absorbes: string[]): ReglagesFournisseurs {
  const reunis = { ...r.reunis };
  for (const a of absorbes) {
    if (a === garde) continue;
    for (const [k, v] of Object.entries(reunis)) if (v === a) reunis[k] = garde;
    reunis[a] = garde;
  }
  return { ...r, reunis, plusTard: r.plusTard.filter(k => k !== garde) };
}

/** Le nom gardé d'un nom, en suivant les renvois (cinq pas au plus : un cycle ne boucle pas). */
export function resoudre(cle: string, reunis: Record<string, string>): string {
  let c = cle;
  for (let i = 0; i < 5 && reunis[c] && reunis[c] !== cle; i++) c = reunis[c];
  return c;
}

/* ---------- rapprochement des noms ---------- */

const EXTENSIONS_WEB = 'com|ch|be|de|fr|eu|net|org|shop|at|it|nl|uk|swiss|store|bio';
const ADRESSE_WEB = new RegExp(`^(?:https?://)?(?:www\\.)?([a-z0-9-]+)\\.(?:${EXTENSIONS_WEB})(?:/\\S*)?$`, 'i');
/** « brouwland.com » est une adresse web : le nom qu'elle porte est « brouwland ». */
export const nomDeAdresseWeb = (nom: string): string | null => ADRESSE_WEB.exec(nom.trim())?.[1] ?? null;

const mots = (cle: string): string[] => cle.split(' ').filter(Boolean);

/**
 * Pourquoi deux noms semblent désigner le même fournisseur ; `null` : rien ne le dit. Symétrique.
 * `nom` : un nom tel qu'il est écrit sur une facture ; `cle` : son `vendorKey`.
 */
export function preuveMemeNom(a: { cle: string; nom: string }, b: { cle: string; nom: string }): string | null {
  if (a.cle === b.cle) return null;
  const nomA = nomDeAdresseWeb(a.nom), nomB = nomDeAdresseWeb(b.nom);
  if ((nomA && vendorKey(nomA) === b.cle) || (nomB && vendorKey(nomB) === a.cle) || (nomA && nomB && vendorKey(nomA) === vendorKey(nomB))) return 'même nom, écrit comme une adresse web';
  const ma = mots(nomA ? vendorKey(nomA) : a.cle), mb = mots(nomB ? vendorKey(nomB) : b.cle);
  const [court, long] = ma.length <= mb.length ? [ma, mb] : [mb, ma];
  if (court.length === 0 || court.join('').length < 4 || court.length === long.length) return null;
  if (!court.every(m => long.includes(m))) return null;
  const n = long.length - court.length;
  return `même nom, ${n === 1 ? 'un mot' : `${n} mots`} ${ma.length <= mb.length ? 'en plus' : 'de moins'}`;
}

/* ---------- lecture des dépenses ---------- */

export interface FactureFournisseur { id: string; iso: string; date: string; nom: string; cents: number }
export interface PointPrix { iso: string; date: string; cents: number; nom: string }
export interface ArticlePaye {
  cle: string; nom: string; unite: string;
  /** Du plus ancien au plus récent. */
  points: PointPrix[];
  ailleurs: Array<{ fournisseur: string; cents: number; iso: string; date: string }>;
}
export interface Candidat { cle: string; nom: string; factures: number; cents: number; preuve: string }
export interface FicheFournisseur {
  cle: string; nom: string;
  /** « malts, houblons » : les familles des articles reçus sur ses factures ; vide si aucun article n'est relié. */
  familles: string[];
  /** Les autres façons dont son nom est écrit sur les factures réunies ici. */
  aussiEcrit: string[];
  /** Du plus récent au plus ancien. */
  factures: FactureFournisseur[];
  totalCents: number;
  articles: ArticlePaye[];
  /** Articles vus seulement sous les noms proches pas encore réunis. */
  articlesCaches: number;
  candidats: Candidat[];
  /** Vrai : ajouté depuis le stock, aucune facture. */
  sansFacture: boolean;
  /** Le délai de la commande à chez soi, appris des commandes reçues ; `null` tant qu'aucune ne l'est (jamais 0). */
  delaiJours: number | null;
  /** Combien de commandes reçues ont appris ce délai. */
  delaiSur: number;
  /** La commande passée et pas encore reçue (la plus récente), avec son jour. */
  commandeOuverte: { index: number; le: string; date: string } | null;
  /** Ajouté à la main : pays et site, quand il les a donnés. */
  infos: { pays?: string; site?: string };
}
export interface LigneListe {
  cle: string; nom: string; factures: number; noms: number; sansFacture: boolean; delaiJours: number | null;
  /** Le nom plus fourni dont celui-ci semble une autre écriture (jamais caché : le brasseur réunit ou laisse). */
  procheDe?: string;
}

interface Groupe {
  cle: string;
  /** Écritures du nom : facture → orthographe. */
  ecrits: Map<string, number>;
  txs: FinanceTransaction[];
}

const FAMILLES: Record<string, string> = { Malt: 'malts', Houblon: 'houblons', Levure: 'levures', Sucre: 'sucres', Emballage: 'emballages' };
const LIGNES_PRIX = new Set(['ingredient', 'packaging', 'cleaning']);

const plusFrequent = (m: Map<string, number>): string => [...m.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'fr'))[0]?.[0] ?? '';

export interface Analyse { liste: LigneListe[]; fiches: Map<string, FicheFournisseur> }

export function analyserFournisseurs(transactions: Transaction[], articlesStock: StockItem[], reglages: ReglagesFournisseurs): Analyse {
  const groupes = new Map<string, Groupe>();
  for (const t of transactions as FinanceTransaction[]) {
    if (!isActiveTransaction(t) || !isExpense(t)) continue;
    const nom = transactionVendor(t).trim();
    const cle = nom ? vendorKey(nom) : '';
    if (!cle) continue;
    const g = groupes.get(cle) ?? { cle, ecrits: new Map(), txs: [] };
    g.ecrits.set(nom, (g.ecrits.get(nom) ?? 0) + 1);
    g.txs.push(t);
    groupes.set(cle, g);
  }
  // Les fournisseurs du stock sans facture : une fiche vide, qui s'emplit à la première facture.
  for (const a of articlesStock) {
    const nom = a.supplier?.trim();
    const cle = nom ? vendorKey(nom) : '';
    if (!cle) continue;
    const g = groupes.get(cle) ?? { cle, ecrits: new Map(), txs: [] };
    if (!g.txs.length) g.ecrits.set(nom!, (g.ecrits.get(nom!) ?? 0) + 1);
    groupes.set(cle, g);
  }
  // Les fournisseurs ajoutés à la main : une fiche vide, avec ce qu'il en a dit.
  const infosDe = new Map<string, { pays?: string; site?: string }>();
  for (const a of reglages.ajoutes) {
    const cle = vendorKey(a.nom);
    if (!cle) continue;
    const g = groupes.get(cle) ?? { cle, ecrits: new Map(), txs: [] };
    if (!g.txs.length && !g.ecrits.size) g.ecrits.set(a.nom, 1);
    groupes.set(cle, g);
    infosDe.set(cle, { ...(a.pays ? { pays: a.pays } : {}), ...(a.site ? { site: a.site } : {}) });
  }
  const parRef = new Map(articlesStock.map(a => [a.ref, a]));

  // Les noms gardés : un nom absorbé dont le nom gardé n'existe plus (factures retirées) redevient lui-même.
  const gardeDe = (cle: string) => { const r = resoudre(cle, reglages.reunis); return groupes.has(r) ? r : cle; };
  const reunis = new Map<string, Groupe[]>();
  for (const g of groupes.values()) {
    const r = gardeDe(g.cle);
    reunis.set(r, [...(reunis.get(r) ?? []), g]);
  }
  const nomDe = (g: Groupe) => plusFrequent(g.ecrits);

  interface Vue { cle: string; nom: string; groupes: Groupe[]; txs: FinanceTransaction[] }
  const vues: Vue[] = [...reunis.entries()].map(([cle, gs]) => {
    const principal = gs.find(g => g.cle === cle)!;
    return { cle, nom: nomDe(principal), groupes: gs, txs: gs.flatMap(g => g.txs) };
  });

  const facturesDe = (txs: FinanceTransaction[]): FactureFournisseur[] => txs.map(t => ({
    id: t.id, iso: isoDate(t.date) ?? '', date: dateFiche(t.date), nom: transactionVendor(t).trim(), cents: transactionAmount(t)
  })).sort((a, b) => (b.iso || '').localeCompare(a.iso || ''));

  interface Prix { cle: string; nom: string; ref?: string; unite: string; iso: string; cents: number; ecrit: string }
  const prixDe = (txs: FinanceTransaction[]): Prix[] => txs.flatMap(t => (t.finance?.lines ?? []).flatMap((l): Prix[] => {
    if (!LIGNES_PRIX.has(l.kind) || !Number.isSafeInteger(l.unitPriceCents) || (l.unitPriceCents as number) <= 0 || !l.unit) return [];
    const iso = isoDate(t.date);
    if (!iso) return [];
    const ref = l.stockItemRef;
    const cle = ref ? `r:${ref}` : `d:${l.description.trim().toLowerCase()}`;
    return [{ cle, nom: (ref && parRef.get(ref)?.name) || l.description.trim(), ref, unite: l.unit, iso, cents: l.unitPriceCents as number, ecrit: transactionVendor(t).trim() }];
  }));

  const prixParVue = new Map(vues.map(v => [v.cle, prixDe(v.txs)]));
  const fiches = new Map<string, FicheFournisseur>();
  for (const v of vues) {
    const factures = facturesDe(v.txs);
    const prix = prixParVue.get(v.cle)!;
    const parArticle = new Map<string, Prix[]>();
    for (const p of prix) parArticle.set(`${p.cle}|${p.unite}`, [...(parArticle.get(`${p.cle}|${p.unite}`) ?? []), p]);
    const articles: ArticlePaye[] = [...parArticle.values()].map(ps => {
      const points = [...ps].sort((a, b) => a.iso.localeCompare(b.iso));
      const premier = points[0];
      const ailleurs = premier.ref ? vues.filter(o => o.cle !== v.cle).flatMap(o => {
        const memes = (prixParVue.get(o.cle) ?? []).filter(p => p.ref === premier.ref && p.unite === premier.unite).sort((a, b) => b.iso.localeCompare(a.iso));
        return memes[0] ? [{ fournisseur: o.nom, cents: memes[0].cents, iso: memes[0].iso, date: dateFiche(memes[0].iso) }] : [];
      }).sort((a, b) => b.iso.localeCompare(a.iso)).slice(0, 2) : [];
      return { cle: `${premier.cle}|${premier.unite}`, nom: premier.nom, unite: premier.unite, points: points.map(p => ({ iso: p.iso, date: dateFiche(p.iso), cents: p.cents, nom: p.ecrit })), ailleurs };
    }).sort((a, b) => b.points[b.points.length - 1].iso.localeCompare(a.points[a.points.length - 1].iso) || a.nom.localeCompare(b.nom, 'fr'));

    const familles = [...new Set(prix.flatMap(p => { const c = p.ref ? parRef.get(p.ref)?.category : undefined; return c ? [FAMILLES[c] ?? c.toLowerCase()] : []; }))];
    const ecritsPrincipaux = new Set(v.txs.map(t => transactionVendor(t).trim()));
    const aussiEcrit = [...ecritsPrincipaux].filter(n => n && n !== v.nom).sort((a, b) => a.localeCompare(b, 'fr'));

    // Candidats : les noms pas encore réunis qui semblent le même, avec leur preuve.
    const candidats: Candidat[] = vues.filter(o => o.cle !== v.cle && o.txs.length > 0 && v.txs.length > 0).flatMap(o => {
      const preuve = v.groupes.flatMap(g => o.groupes.map(h => preuveMemeNom({ cle: g.cle, nom: nomDe(g) }, { cle: h.cle, nom: nomDe(h) }))).find(Boolean);
      return preuve ? [{ cle: o.cle, nom: o.nom, factures: o.txs.length, cents: o.txs.reduce((s, t) => s + transactionAmount(t), 0), preuve }] : [];
    }).sort((a, b) => b.factures - a.factures || a.nom.localeCompare(b.nom, 'fr'));

    const vus = new Set(articles.map(a => a.cle));
    const caches = new Set<string>();
    for (const c of candidats) for (const p of prixParVue.get(c.cle) ?? []) if (!vus.has(`${p.cle}|${p.unite}`)) caches.add(`${p.cle}|${p.unite}`);

    // Les commandes de la fiche et des noms réunis sous elle : le délai s'apprend sur toutes.
    const commandes = v.groupes.flatMap(g => reglages.commandes[g.cle] ?? []);
    const appris = delaiAppris(commandes);
    const ouvertes = (reglages.commandes[v.cle] ?? []).map((c, index) => ({ c, index })).filter(x => !x.c.recue).sort((a, b) => b.c.le.localeCompare(a.c.le));
    const commandeOuverte = ouvertes[0] ? { index: ouvertes[0].index, le: ouvertes[0].c.le, date: dateFiche(ouvertes[0].c.le) } : null;
    fiches.set(v.cle, {
      cle: v.cle, nom: v.nom, familles, aussiEcrit, factures, totalCents: factures.reduce((s, f) => s + f.cents, 0),
      articles, articlesCaches: caches.size, candidats, sansFacture: v.txs.length === 0,
      delaiJours: appris?.jours ?? null, delaiSur: appris?.sur ?? 0, commandeOuverte, infos: infosDe.get(v.cle) ?? {}
    });
  }

  const plusFournis = (f: FicheFournisseur): FicheFournisseur | undefined => [...fiches.values()]
    .filter(o => o.candidats.some(c => c.cle === f.cle) && (o.factures.length > f.factures.length || (o.factures.length === f.factures.length && o.nom.localeCompare(f.nom, 'fr') < 0)))
    .sort((a, b) => b.factures.length - a.factures.length)[0];
  // Une ligne par fournisseur : un nom proche d'un plus fourni se lit dans sa fiche (« Écrit de 3 façons »), pas en double ici ; seul un « Pas maintenant » le remet en liste.
  const liste = [...fiches.values()].filter(f => { const o = plusFournis(f); return !o || reglages.plusTard.includes(o.cle); }).map(f => ({
    cle: f.cle, nom: f.nom, factures: f.factures.length, noms: 1 + f.candidats.length, sansFacture: f.sansFacture, delaiJours: f.delaiJours, procheDe: plusFournis(f)?.nom
  })).sort((a, b) => b.factures - a.factures || a.nom.localeCompare(b.nom, 'fr'));
  return { liste, fiches };
}

/* ---------- affichage ---------- */

export type TendancePrix = { sens: 'haut' | 'bas' | 'egal' | 'premier'; centimes: number };
/** Le dernier prix contre le précédent : « +1,10 ↑ » (plus cher, rouge), « −4,70 ↓ » (moins cher, vert), « = même », ou « 1er prix ». */
export function tendance(points: Array<{ cents: number }>): TendancePrix {
  if (points.length < 2) return { sens: 'premier', centimes: 0 };
  const d = points[points.length - 1].cents - points[points.length - 2].cents;
  return { sens: d > 0 ? 'haut' : d < 0 ? 'bas' : 'egal', centimes: Math.abs(d) };
}

/** Le total d'un nom gardé avec les noms cochés : « 1 fiche · 14 factures · 4 812,40 CHF ». */
export function apresReunion(fiche: FicheFournisseur, cochees: string[]): { factures: number; cents: number } {
  const c = fiche.candidats.filter(x => cochees.includes(x.cle));
  return { factures: fiche.factures.length + c.reduce((s, x) => s + x.factures, 0), cents: fiche.totalCents + c.reduce((s, x) => s + x.cents, 0) };
}
