// Moteur v4 : l'API (api.ts), liée au moteur par défaut (fixtures du prototype), et la fabrique creerMoteur (moteur.ts),
// qui lie la même API à des données injectées (catalogue des fiches, stock du brasseur). Voir ENGINE.md.
export * from './api';
export { creerMoteur, type Moteur } from './moteur';
export { DONNEES_FIXTURE, type DonneesMoteur } from './data';
export { Lru, borneHoublons } from './lru';
export { nombreFr, formatFr } from './nombres';
// Interface asynchrone des calculs lourds (#165) : contrat de messages, serveur du fil principal, client et canaux.
export {
  CALCULS_LOURDS, creerClient, servir, servirSurFilPrincipal, verifierCalculs,
  type Calculs, type NomCalcul, type ArgsDe, type ResultatDe, type NomLourd, type RequeteCalcul, type ReponseCalcul, type ServeurCalculs,
  type OptionsFilPrincipal, type Recu, type Canal, type MethodesAsynchrones, type ClientCalculs, type OptionsClient,
} from './client';
