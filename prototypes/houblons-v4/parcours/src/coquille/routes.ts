// Routes par le hash : #/ma-biere, #/fiche/<houblon>, #/suggerer, #/comparer?h=a,b,c, #/dryhopper/<ajout>,
// #/levure/<ajout>, #/substituer/<houblon>. <houblon> : clé du moteur sans « beermaverick- » (« nugget »).
import type { RoutePage } from './pages';

export type Route =
  | { ecran: 'ma-biere' }
  | { ecran: 'fiche'; houblon: string }
  | { ecran: 'suggerer' }
  | { ecran: 'comparer'; houblons: string[] }
  | { ecran: 'dryhopper'; ajout: string }
  | { ecran: 'levure'; ajout: string }
  | { ecran: 'substituer'; houblon: string };

const PREFIXE = 'beermaverick-';
/** Clé du moteur ↔ segment d'adresse. */
export const cleDe = (segment: string) => (segment.startsWith(PREFIXE) ? segment : PREFIXE + segment);
export const segmentDe = (cle: string) => (cle.startsWith(PREFIXE) ? cle.slice(PREFIXE.length) : cle);

/** La route d'un hash ; null si le hash est vide ou inconnu. */
export function lireRoute(hash: string): Route | null {
  if (!hash || hash === '#' || hash === '#/') return null;
  const [chemin, requete = ''] = hash.replace(/^#\/?/, '').split('?');
  const [ecran, arg] = chemin.split('/').map((s) => decodeURIComponent(s));
  const h = new URLSearchParams(requete).get('h');
  switch (ecran as RoutePage | '') {
    case 'ma-biere': return { ecran: 'ma-biere' };
    case 'suggerer': return { ecran: 'suggerer' };
    case 'comparer': return { ecran: 'comparer', houblons: h ? h.split(',').filter(Boolean).map(cleDe) : [] };
    case 'fiche': return arg ? { ecran: 'fiche', houblon: cleDe(arg) } : null;
    case 'substituer': return arg ? { ecran: 'substituer', houblon: cleDe(arg) } : null;
    case 'dryhopper': return arg ? { ecran: 'dryhopper', ajout: arg } : null;
    case 'levure': return arg ? { ecran: 'levure', ajout: arg } : null;
    default: return null;
  }
}

export function ecrireRoute(r: Route): string {
  switch (r.ecran) {
    case 'ma-biere': case 'suggerer': return `#/${r.ecran}`;
    case 'comparer': return `#/comparer${r.houblons.length ? `?h=${r.houblons.map(segmentDe).join(',')}` : ''}`;
    case 'fiche': case 'substituer': return `#/${r.ecran}/${encodeURIComponent(segmentDe(r.houblon))}`;
    case 'dryhopper': case 'levure': return `#/${r.ecran}/${encodeURIComponent(r.ajout)}`;
  }
}

/** Écran d'avant, quand l'historique n'en a pas (page ouverte directement sur une route). */
export function parent(r: Route, comparerDefaut: string[]): Route {
  switch (r.ecran) {
    case 'ma-biere': case 'fiche': case 'suggerer': case 'substituer': return { ecran: 'ma-biere' };
    case 'comparer': return { ecran: 'suggerer' };
    case 'dryhopper': return { ecran: 'comparer', houblons: comparerDefaut };
    case 'levure': return { ecran: 'dryhopper', ajout: r.ajout };
  }
}

/** Écrans plein écran (outils) : ils s'ouvrent par-dessus Ma bière, comme une route de useFullScreenRoute. */
export const estOutil = (r: Route) => r.ecran !== 'ma-biere' && r.ecran !== 'fiche';
