/**
 * Point d'entrée paresseux des outils houblons v4 (#167, D65 § Recommandation 3).
 *
 * Ce module est le SEUL à tirer par import statique le moteur v4, ses données (`src/data/hopV4/`, bootstraps V5.5 du
 * moteur) et le client asynchrone : tout cela forme un chunk à part, hors du démarrage. Rien ne l'importe
 * statiquement ; on l'atteint par `chargerOutils()` (import dynamique, mémorisé), à l'ouverture d'une couche
 * d'outil ou au repos (`precharge.ts`). Les écrans portés (T12) passent par là.
 */
export * as moteur from '../../domain/hopIndex/v4';
// c7 : le catalogue plein (505 variétés), chargé au repos ; hors de l'API du moteur (ce ne sont pas des fonctions liées à un contexte).
export { cataloguePleinCharge, siCataloguePleinArrive, chargerAjouts } from '../../domain/hopIndex/v4/data';
