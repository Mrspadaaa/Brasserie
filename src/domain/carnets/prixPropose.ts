/**
 * Q-1b B (D435, 23.11) : « Prix estimé ? » propose en tête, avant ses ordres de grandeur, le prix que le carnet connaît déjà : le prix lu
 * dans un lien (un article lu, en francs, le plus bas), sinon le budget de son critère (« Budget du Planning : 400 CHF »). Rien sinon :
 * jamais un chiffre inventé, jamais un prix en euros dit en francs.
 */
import { prixLus } from './modele';

export interface PrixPropose { centimes: number; source: 'lu' | 'budget' }

export interface CarnetPourPrix {
  carnet: { criteres: readonly { texte: string }[]; articles: readonly { prixCentimes?: number; devise?: string; url?: string; lecture?: string }[] };
}

export function prixPropose(c: CarnetPourPrix): PrixPropose | null {
  const lus = c.carnet.articles
    .filter(a => !!a.url && a.lecture === 'lue' && typeof a.prixCentimes === 'number' && Number.isFinite(a.prixCentimes) && a.prixCentimes > 0 && (a.devise ?? 'CHF') === 'CHF')
    .map(a => a.prixCentimes!);
  if (lus.length) return { centimes: Math.min(...lus), source: 'lu' };
  for (const k of c.carnet.criteres) {
    if (!/^\s*budget\b/i.test(k.texte)) continue;
    const p = prixLus(k.texte).find(x => x.devise === 'CHF');
    if (p && p.centimes > 0) return { centimes: p.centimes, source: 'budget' };
  }
  return null;
}
