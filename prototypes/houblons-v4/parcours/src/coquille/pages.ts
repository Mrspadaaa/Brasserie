// Les sept routes de la maquette, chacune construite en page <route>/etat.html (sans dépendance : lu aussi
// par vite.config.ts et les outils).
export const ROUTES_PAGES = ['ma-biere', 'fiche', 'suggerer', 'comparer', 'dryhopper', 'levure', 'substituer'] as const;
export type RoutePage = (typeof ROUTES_PAGES)[number];
