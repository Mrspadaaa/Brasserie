// Les huit routes de la maquette (biere : l'onglet Ma bière de la base v4.10, D105), chacune construite en page <route>/etat.html (sans dépendance : lu aussi
// par vite.config.ts et les outils).
export const ROUTES_PAGES = ['ma-biere', 'biere', 'fiche', 'suggerer', 'comparer', 'dryhopper', 'levure', 'substituer'] as const;
export type RoutePage = (typeof ROUTES_PAGES)[number];
