import { FlaskConical, Leaf, Package, Snowflake, Wheat } from 'lucide-react';
import type { JalonId } from '../../../domain/calendrier';

export type EtapeBrassin = Exclude<JalonId, 'commander'>;

/**
 * Les étapes d'un brassin, avec le nom que le brasseur emploie (E25), leur picto (celui du détail de la frise) et la couleur de leur procédé
 * (CAL-POINTS-MUETS, 18.11 : « plutot utiliser des mini icone. et une couleur pour le type de procédé »).
 * D384 (18.11, jeu C de choix-calendrier/couleurs : « c Par cuve, phases visibles ») : quatre lieux, la salle chaude orange, la cuve bleue
 * (fermentation, puis la garde plus foncée), le houblon vert, le colis noir. `couleur` et `encre` (le picto posé sur la couleur) sont des
 * jetons du thème (`--etape-…` dans themes.css, clair et cave), jamais une valeur en dur.
 */
export const ETAPE_BRASSIN: Record<EtapeBrassin, { libelle: string; Icone: typeof Wheat; couleur: string; encre: string }> = {
  brassage: { libelle: 'Brassage', Icone: Wheat, couleur: 'etape-brassage', encre: 'etape-brassage-encre' },
  fermentation: { libelle: 'Fermentation', Icone: FlaskConical, couleur: 'etape-fermentation', encre: 'etape-fermentation-encre' },
  'dry-hop': { libelle: 'Dry hop', Icone: Leaf, couleur: 'etape-dry-hop', encre: 'etape-dry-hop-encre' },
  garde: { libelle: 'Garde', Icone: Snowflake, couleur: 'etape-garde', encre: 'etape-garde-encre' },
  conditionnement: { libelle: 'Conditionnement', Icone: Package, couleur: 'etape-conditionnement', encre: 'etape-conditionnement-encre' }
};

/** La couleur d'une étape, prête pour le CSS (`rgb(var(--etape-…))`). */
export const couleurEtape = (id: EtapeBrassin): string => `rgb(var(--${ETAPE_BRASSIN[id].couleur}))`;
export const encreEtape = (id: EtapeBrassin): string => `rgb(var(--${ETAPE_BRASSIN[id].encre}))`;

export const estEtape = (id: JalonId): id is EtapeBrassin => id !== 'commander' && id in ETAPE_BRASSIN;
