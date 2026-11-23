// p3 / 1C : le poids d'un sachet de levure et la dose qu'il fait, sans rien inventer.
//  - le poids ne vient que du catalogue (`yeastSupplyBootstrap.json` : `format`, avec sa source datée) ; sans produit sûr, `null` ;
//  - le produit se retrouve par `pitching.product`, puis `hopIndexId` + forme (un seul), puis le nom de la levure (un seul) ;
//  - un format qui n'est pas en grammes (Activator en mL) ne donne pas de poids ;
//  - l'inconnu n'est jamais 0 : volume absent, unité inconnue, pas de plage → `null`.

export interface ProduitCatalogue {
  id: string;
  referenceId?: string;
  label: string;
  manufacturer?: string;
  form?: string;
  format?: { amount?: number; unit?: string; label?: string; source?: { title?: string; checkedAt?: string } };
  dose?: { range?: { min: number; max: number }; unit?: string };
}

export interface LevureNommee {
  name: string;
  hopIndexId?: string;
  form?: string;
  pitching?: { product?: { id?: string } };
}

export interface Sachet {
  produitId: string;
  /** Poids d'un sachet, en grammes, tel que le catalogue le donne. */
  grammes: number;
  fabricant?: string;
  /** Date de vérification de la source (AAAA-MM-JJ). */
  verifieLe?: string;
  /** Plage de dose du fabricant, en g/hL, quand le catalogue la donne. */
  plageGHl?: { min: number; max: number };
}

export type StatutDose = 'sous' | 'dans' | 'au-dessus';

const normaliser = (t: string) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const tete = (label: string) => normaliser(label.split(/\s[—–-]\s/)[0] ?? label);

function trouverProduit(yeast: LevureNommee, produits: readonly ProduitCatalogue[]): ProduitCatalogue | undefined {
  const parForme = (p: ProduitCatalogue) => !yeast.form || !p.form || p.form === yeast.form;
  const id = yeast.pitching?.product?.id;
  if (id) {
    const exact = produits.find((p) => p.id === id);
    if (exact) return exact;
  }
  if (yeast.hopIndexId) {
    const parRef = produits.filter((p) => p.referenceId === yeast.hopIndexId && parForme(p));
    if (parRef.length === 1) return parRef[0];
  }
  const nom = normaliser(yeast.name ?? '');
  if (!nom) return undefined;
  const parNom = produits.filter((p) => {
    if (!parForme(p)) return false;
    const t = tete(p.label);
    return t === nom || t.endsWith(` ${nom}`) || nom.endsWith(` ${t}`);
  });
  return parNom.length === 1 ? parNom[0] : undefined;
}

/** Le sachet du catalogue pour cette levure, ou `null` : sans produit sûr, ou sans poids en grammes, rien n'est dit. */
export function sachetDeLaLevure(yeast: LevureNommee | undefined, produits: readonly ProduitCatalogue[]): Sachet | null {
  if (!yeast) return null;
  const produit = trouverProduit(yeast, produits);
  const format = produit?.format;
  if (!produit || !format || format.unit !== 'g' || !(typeof format.amount === 'number' && format.amount > 0)) return null;
  const range = produit.dose?.unit === 'g/hL' ? produit.dose.range : undefined;
  const plage = range && range.min > 0 && range.max >= range.min ? { min: range.min, max: range.max } : undefined;
  return {
    produitId: produit.id,
    grammes: format.amount,
    fabricant: produit.manufacturer,
    verifieLe: format.source?.checkedAt,
    ...(plage ? { plageGHl: plage } : {})
  };
}

const virgule = (n: number) => String(n).replace('.', ',');

/** « sachet 11,5 g · Fermentis · vu le 27.09.2026 » : le poids et sa source, en petit. */
export function libelleSource(s: Sachet): string {
  const date = s.verifieLe && /^(\d{4})-(\d{2})-(\d{2})$/.test(s.verifieLe) ? s.verifieLe.split('-').reverse().join('.') : undefined;
  return [`sachet ${virgule(s.grammes)} g`, s.fabricant, date ? `vu le ${date}` : undefined].filter(Boolean).join(' · ');
}

/** Les grammes de la quantité choisie : des sachets × poids du catalogue, ou des grammes tels quels ; sinon `null`. */
export function grammesDuChoix(choix: { amount?: number; unit?: string } | undefined, sachet: Sachet | null): number | null {
  if (!choix || !(typeof choix.amount === 'number' && choix.amount > 0)) return null;
  if (choix.unit === 'g') return choix.amount;
  if (choix.unit === 'sachet' && sachet) return choix.amount * sachet.grammes;
  return null;
}

/** g/hL = g ÷ (L / 100) ; volume absent ou nul → `null`. */
export function gParHl(grammes: number | null, volumeL: number | undefined | null): number | null {
  if (grammes == null || !(typeof volumeL === 'number' && volumeL > 0)) return null;
  return grammes / (volumeL / 100);
}

export function statutDose(gHl: number | null, plage: { min: number; max: number } | undefined): StatutDose | null {
  if (gHl == null || !plage) return null;
  return gHl < plage.min ? 'sous' : gHl > plage.max ? 'au-dessus' : 'dans';
}

/** La plage du fabricant ramenée au volume : de g/hL à grammes. */
export function fourchetteG(plage: { min: number; max: number } | undefined, volumeL: number | undefined | null): { min: number; max: number } | null {
  if (!plage || !(typeof volumeL === 'number' && volumeL > 0)) return null;
  return { min: (plage.min * volumeL) / 100, max: (plage.max * volumeL) / 100 };
}

/** Le haut de l'échelle de la jauge : la plage ×1,6 ou le choix ×1,1, arrondi au 5 g supérieur. */
export function echelleMaxG(fourchette: { min: number; max: number } | null, grammes: number | null): number {
  const base = Math.max(fourchette ? fourchette.max * 1.6 : 0, grammes != null ? grammes * 1.1 : 0, 5);
  return Math.ceil(base / 5 - 1e-9) * 5;
}
