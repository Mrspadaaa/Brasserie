import { ORIGINS, readProductLabel } from '../../services/ingredientIdentity';

/**
 * Les données qu'un libellé de facture et un article du stock portent en commun (voie s6-fiche, D215, D216) : α, origine, récolte, EBC, poids de pièce.
 * Pur : aucun accès au stock, au réseau ni à l'écran. `readProductLabel` ne lit ni l'EBC ni l'origine hors d'un α : ces deux lectures sont ici.
 * Règle de conduite : dans le doute, une donnée est INCONNUE (jamais 0), et une donnée connue d'un seul côté n'est jamais comparée.
 */
export type Ecart = 'alpha' | 'origine' | 'recolte' | 'ebc' | 'poids';
export type Contexte = 'Houblon' | 'Malt' | 'Levure' | 'autre';
/** α : le même seuil que l'appariement de s1. */
export const SEUIL_ALPHA = 0.05;
/** EBC : 1 point (les valeurs imprimées sont entières ; 0,5 refaisait des « bis » à chaque lot, revue Conception 11). */
export const SEUIL_EBC = 1;
export interface DonneesProduit { alpha?: number; origine?: string; recolte?: number; ebc?: number; poids?: string }
/** Une valeur lue et sa place dans le libellé, pour la retirer du nom. */
export interface Empan<T> { value: T; debut: number; fin: number }

const NOMBRE = String.raw`\d+(?:[.,]\d+)?`;
const nombre = (texte: string) => Number(texte.replace(',', '.'));
/** « 15 EBC » : le nombre n'est ni collé à un autre (« 8-12 EBC »), ni le haut d'un intervalle (« 8 à 12 EBC »). */
const EBC_APRES = new RegExp(String.raw`(?<![\w.,-])(${NOMBRE})\s*EBC(?![A-Za-z])`, 'gi');
/** « EBC 15 », « EBC : 15 » ; « EBC 8 à 12 » et « EBC 8-12 » sont des intervalles. */
const EBC_AVANT = new RegExp(String.raw`(?<![A-Za-z])EBC\s*[:=]?\s*(${NOMBRE})(?![\d.,]*\s*(?:-|–|à|bis|to)\s*\d)`, 'gi');
const INTERVALLE_AVANT = new RegExp(String.raw`(?:${NOMBRE})\s*(?:-|–|à|bis|to)\s*$`, 'i');

/** L'EBC imprimé dans un libellé, ou rien : plusieurs valeurs, un intervalle ou une plage ne sont pas lus. */
export function lireEbc(libelle: string): Empan<number> | undefined {
  const texte = (libelle ?? '').normalize('NFC');
  const trouves: Array<Empan<number>> = [];
  for (const m of texte.matchAll(EBC_APRES)) {
    if (INTERVALLE_AVANT.test(texte.slice(0, m.index))) return undefined;
    trouves.push({ value: nombre(m[1]), debut: m.index!, fin: m.index! + m[0].length });
  }
  for (const m of texte.matchAll(EBC_AVANT)) trouves.push({ value: nombre(m[1]), debut: m.index!, fin: m.index! + m[0].length });
  if (trouves.length !== 1 || !Number.isFinite(trouves[0].value) || !(trouves[0].value > 0)) return undefined;
  return trouves[0];
}

/** Les morceaux qui peuvent suivre l'origine : α, année de récolte, EBC, conditionnement (« , 1 Kg »), ponctuation. */
const QUEUE = [
  new RegExp(String.raw`[\s,;·]+$`),
  new RegExp(String.raw`\s*${NOMBRE}\s*%\s*$`),
  new RegExp(String.raw`\s+20[0-3]\d\s*$`),
  new RegExp(String.raw`\s*${NOMBRE}\s*EBC\s*$`, 'i'),
  new RegExp(String.raw`\s*EBC\s*${NOMBRE}\s*$`, 'i'),
  new RegExp(String.raw`[\s,;·]+${NOMBRE}\s*(?:kg|g|mg|l|ml|cl|dl)\.?\s*$`, 'i'),
  new RegExp(String.raw`[\s,;·]+(?:kg|g|l)\.?\s*$`, 'i'),
];
const CODE_FINAL = /(?:^|[\s(])([A-Z]{2})\)?$/;

/**
 * Le code pays écrit en queue d'un libellé de houblon ou de malt : en capitales, dernier mot une fois α, récolte, EBC et conditionnement retirés
 * (« Hallertauer Blanc 9.5% CH », « Cascade US », « Hallertauer Blanc DE 9.5% »). Jamais dans « Safale US-05 », jamais pour une levure ou un autre produit,
 * jamais un code hors d'`ORIGINS` (« CHE », « ES » : inconnus), jamais un libellé réduit à son code.
 */
export function lireOrigine(libelle: string, contexte: Contexte): Empan<string> | undefined {
  if (contexte !== 'Houblon' && contexte !== 'Malt') return undefined;
  let texte = (libelle ?? '').normalize('NFC').replace(BIS, '');
  for (let tour = 0; tour < 8; tour++) {
    const avant = texte;
    for (const motif of QUEUE) texte = texte.replace(motif, '');
    if (texte === avant) break;
  }
  const m = CODE_FINAL.exec(texte);
  if (!m || !ORIGINS.has(m[1])) return undefined;
  const debut = texte.length - (m[0].endsWith(')') ? 3 : 2);
  const fin = debut + 2;
  if (!texte.slice(0, debut).replace(/[\s(]+$/, '').trim()) return undefined;
  return { value: m[1], debut, fin };
}

const BIS = /[\s,;·-]+bis(?:\s+\d+)?\s*$/i;
/** Le nom sans `bis` ni `bis N` final (« Target bis 2 » → « Target »), pour retrouver la famille d'un article écrit par S6. */
export const sansBis = (nom: string) => (nom ?? '').replace(BIS, '').trim() || (nom ?? '').trim();
export const porteBis = (nom: string) => BIS.test(nom ?? '') && sansBis(nom) !== (nom ?? '').trim();

/** Le libellé débarrassé de l'EBC, du code d'origine en queue et du `bis N` final : ce qui reste désigne le produit (point 4 du plan). */
export function sansDonneesDeFiche(libelle: string, contexte: Contexte): string {
  let texte = sansBis((libelle ?? '').normalize('NFC'));
  const ebc = lireEbc(texte);
  if (ebc) texte = texte.slice(0, ebc.debut) + ' ' + texte.slice(ebc.fin);
  const origine = lireOrigine(texte, contexte);
  if (origine) texte = texte.slice(0, origine.debut) + ' ' + texte.slice(origine.fin);
  texte = texte.replace(/\(\s*\)/g, ' ');
  return sansBis(texte.replace(/\s+/g, ' ').trim());
}

export interface OptionsNom { unit?: string; quantity?: number; side?: 'line' | 'item' }
/**
 * Le nom propre d'un produit : `readProductLabel(…).name` (sans α, récolte, poids de pièce, conditionnement sûr) sans l'EBC, sans le code d'origine en queue
 * et sans `bis N` final. Il sert à la famille d'un produit ET au nom proposé de l'article neuf. La récolte reste dans le nom (aucun champ ne la garde).
 */
export function nomPropre(libelle: string, contexte: Contexte, o: OptionsNom = {}): string {
  const net = sansDonneesDeFiche(libelle, contexte);
  const lu = readProductLabel(net, { unit: o.unit, quantity: o.quantity, hop: contexte === 'Houblon', yeast: contexte === 'Levure', side: o.side ?? 'line' });
  const annee = lu.harvestYear ? ` ${lu.harvestYear.value}` : '';
  return (lu.name + annee).trim() || net;
}

/** Les données connues des DEUX côtés et différentes. Une donnée connue d'un seul côté n'est jamais un écart. */
export function ecartsEntre(ligne: DonneesProduit, article: DonneesProduit): Ecart[] {
  const out: Ecart[] = [];
  const marge = 1e-9;
  if (ligne.alpha !== undefined && article.alpha !== undefined && Math.abs(ligne.alpha - article.alpha) >= SEUIL_ALPHA - marge) out.push('alpha');
  if (ligne.origine !== undefined && article.origine !== undefined && ligne.origine !== article.origine) out.push('origine');
  if (ligne.recolte !== undefined && article.recolte !== undefined && ligne.recolte !== article.recolte) out.push('recolte');
  if (ligne.ebc !== undefined && article.ebc !== undefined && Math.abs(ligne.ebc - article.ebc) >= SEUIL_EBC - marge) out.push('ebc');
  if (ligne.poids !== undefined && article.poids !== undefined && ligne.poids !== article.poids) out.push('poids');
  return out;
}
/** Les données connues d'un seul côté : la règle ne les compare pas, elle dit « incertain ». */
export function connuesUnSeulCote(ligne: DonneesProduit, article: DonneesProduit): Ecart[] {
  const cles: Array<[Ecart, keyof DonneesProduit]> = [['alpha', 'alpha'], ['origine', 'origine'], ['recolte', 'recolte'], ['ebc', 'ebc'], ['poids', 'poids']];
  return cles.filter(([, k]) => (ligne[k] === undefined) !== (article[k] === undefined)).map(([e]) => e);
}
