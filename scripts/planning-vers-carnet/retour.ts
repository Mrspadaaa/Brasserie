/**
 * Décision (a), 20.11 : le Carnet choisi est CarnetsVue. Les 11 « À faire » écrits dans l'ancien carnet de l'Atelier (`CR-PLANNING-*`) sont
 * retirés ; les idées des travaux archivées pour eux (« Porté dans Brassins › Atelier › Carnet (À faire) ») reviennent dans le Carnet, leur
 * date gardée (l'ampoule du Calendrier revient). Les 5 étapes faites restent archivées ; les achats et leur lien À venir ne bougent pas.
 */
import type { CreativeItem } from '../../src/types';
import { lireCarnet } from '../../src/domain/carnets/modele';

export const RAISON_PORT_ATELIER = 'Porté dans Brassins › Atelier › Carnet (À faire)';

export interface PlanRetour { desarchiver: CreativeItem[]; retirer: string[] }

export function planRetour(items: readonly CreativeItem[]): PlanRetour {
  const desarchiver: CreativeItem[] = [];
  for (const d of items) {
    const c = d.id.startsWith('CARNET-PLANNING-') ? lireCarnet(d) : null;
    if (!c || c.carnet.archive?.raison !== RAISON_PORT_ATELIER) continue;
    const copie = JSON.parse(JSON.stringify(d)) as CreativeItem;
    delete (copie.carnet as { archive?: unknown }).archive;
    desarchiver.push(copie);
  }
  const retirer = items.filter(d => /^CR-PLANNING-T-\d+$/.test(d.id) && d.type === 'event').map(d => d.id).sort();
  return { desarchiver, retirer };
}
