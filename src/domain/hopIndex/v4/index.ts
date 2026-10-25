// Moteur v4 : l'API (api.ts), liée au moteur par défaut (fixtures du prototype), et la fabrique creerMoteur (moteur.ts),
// qui lie la même API à des données injectées (catalogue des fiches, stock du brasseur). Voir ENGINE.md.
export * from './api';
export { creerMoteur, type Moteur } from './moteur';
export { DONNEES_FIXTURE, type DonneesMoteur } from './data';
export { Lru, borneHoublons } from './lru';
export { nombreFr, formatFr } from './nombres';
