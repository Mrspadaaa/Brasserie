// Entrée d'empaquetage de emulateur.mjs : le vrai code de l'app (plan de correction, contre-paiement, répartition d'un virement), sans le réécrire.
export { planCorrection } from '../../../../../src/domain/finance/correctionMontant';
export { contrePaiement } from '../../../../../src/ui/finance/operations/calculs';
export { repartirVirement } from '../../../../../src/domain/finance/repartition';
export { creanceDeTropPaye, paiementDeCreance } from '../../../../../src/ui/finance/modifier/creance';
