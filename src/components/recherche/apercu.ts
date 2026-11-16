import type { StockItem, Recipe, Transaction } from '../../types';
import { Units } from '../../services/units';
import { dateCourte, type TypeResultat } from './modele';

/**
 * L'aperçu d'un article au 1280 : ce que l'app sait, rien d'autre. Un seuil non renseigné, une α inconnue, un achat jamais saisi
 * n'apparaissent pas (l'inconnu n'est jamais 0). Les emplois viennent des recettes enregistrées ; le dernier achat, des lignes d'écriture
 * reliées à l'article.
 */
export interface ApercuArticle {
  sousTitre?: string;
  chiffres: { label: string; valeur: string }[];
  emplois: { texte: string; valeur?: string; type: TypeResultat }[];
}

const EMPLOIS_MAX = 3;

/** « 12,8 % », virgule suisse-française ; une α non finie ou nulle est inconnue. */
export function formaterAlpha(alphaPct: number | undefined): string | undefined {
  if (alphaPct === undefined || !Number.isFinite(alphaPct) || alphaPct <= 0) return undefined;
  return `${alphaPct.toLocaleString('fr-CH', { maximumFractionDigits: 1 })} %`;
}

function nomme(item: StockItem, ing: { stockItemRef?: string; name: string }): boolean {
  if (ing.stockItemRef) return ing.stockItemRef === item.ref;
  return ing.name.trim().toLowerCase() === item.name.trim().toLowerCase();
}

export function recettesQuiEmploient(item: StockItem, recettes: ReadonlyArray<Recipe>): Recipe[] {
  return recettes.filter(r =>
    (r.hops ?? []).some(h => nomme(item, h)) ||
    (r.fermentables ?? r.malts ?? []).some(f => nomme(item, f))
  );
}

export interface AchatLu { date: string; fournisseur?: string; quantite?: number; unite?: string }

/** Le dernier achat de l'article : la plus récente écriture qui a une ligne reliée à lui par sa référence. */
export function dernierAchat(item: StockItem, ecritures: ReadonlyArray<Transaction>): AchatLu | undefined {
  let meilleur: AchatLu | undefined;
  for (const t of ecritures) {
    const ligne = t.finance?.lines?.find(l => l.stockItemRef === item.ref);
    if (!ligne) continue;
    if (!meilleur || String(t.date) > meilleur.date) {
      meilleur = { date: String(t.date), fournisseur: t.finance?.vendor, quantite: ligne.quantity, unite: ligne.unit };
    }
  }
  return meilleur;
}

export function apercuArticle(item: StockItem, recettes: ReadonlyArray<Recipe>, ecritures: ReadonlyArray<Transaction>): ApercuArticle {
  const chiffres: ApercuArticle['chiffres'] = [{ label: 'En stock', valeur: Units.format(item.currentStock, item.unit) }];
  const alpha = formaterAlpha(item.alphaPct);
  if (alpha) chiffres.push({ label: 'α', valeur: alpha });
  if (item.minStock !== undefined && Number.isFinite(item.minStock)) chiffres.push({ label: 'Seuil', valeur: Units.format(item.minStock, item.unit) });

  const emplois: ApercuArticle['emplois'] = recettesQuiEmploient(item, recettes)
    .slice(0, EMPLOIS_MAX)
    .map(r => ({ texte: r.name, valeur: r.style || undefined, type: 'recette' as const }));
  const achat = dernierAchat(item, ecritures);
  if (achat) {
    const qte = achat.quantite !== undefined && achat.unite ? `${Units.format(achat.quantite, achat.unite)} · ` : '';
    emplois.push({ texte: `Dernier achat${achat.fournisseur ? ` · ${achat.fournisseur}` : ''}`, valeur: `${qte}${dateCourte(achat.date)}`, type: 'ecriture' });
  }
  return { sousTitre: [item.category, item.supplier].filter(Boolean).join(' · ') || undefined, chiffres, emplois };
}
