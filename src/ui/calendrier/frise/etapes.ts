import { FlaskConical, Leaf, Package, Snowflake, Wheat } from 'lucide-react';
import type { JalonId } from '../../../domain/calendrier';

export type EtapeBrassin = Exclude<JalonId, 'commander'>;

/**
 * Les étapes d'un brassin, avec le nom que le brasseur emploie (E25), leur picto (celui du détail de la frise) et la couleur de leur procédé
 * (CAL-POINTS-MUETS, 18.11 : « plutot utiliser des mini icone. et une couleur pour le type de procédé ») : le chaud, la fermentation, le
 * houblon à froid, le froid, la bière prête. `couleur` est un jeton du thème (`rgb(var(--…))`), donc juste dans les deux thèmes.
 */
export const ETAPE_BRASSIN: Record<EtapeBrassin, { libelle: string; Icone: typeof Wheat; couleur: string }> = {
  brassage: { libelle: 'Brassage', Icone: Wheat, couleur: 'attention' },
  fermentation: { libelle: 'Fermentation', Icone: FlaskConical, couleur: 'area-agenda' },
  'dry-hop': { libelle: 'Dry hop', Icone: Leaf, couleur: 'hop' },
  garde: { libelle: 'Garde', Icone: Snowflake, couleur: 'water' },
  conditionnement: { libelle: 'Conditionnement', Icone: Package, couleur: 'area-production' }
};

export const estEtape = (id: JalonId): id is EtapeBrassin => id !== 'commander' && id in ETAPE_BRASSIN;
