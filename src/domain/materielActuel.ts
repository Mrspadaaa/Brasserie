/**
 * AM-47 (08.11) : un brassin repris d'une recette garde le volume de la recette. Si ce volume ne tient plus sur le matériel ACTUEL
 * (cuve, fermenteur), le brasseur le sait avant de créer le brassin, avec un volume qui tiendrait. Rien n'est refusé ni changé seul.
 * L'inconnu (matériel non renseigné) n'est jamais une alerte.
 */
import type { BrewhouseProfile, Recipe } from '../types';
import { BrewingMath, kettleHopGrams } from '../services/brewingMath';
import { nombreFr } from './nombreAffiche';

export interface AvertissementMateriel {
  /** La phrase à montrer. */
  message: string;
  /** Le plus grand volume (par pas de 0,5 L) qui tient sur le matériel actuel ; absent si aucun ne tient. */
  adaptationL?: number;
}

type RecetteLue = Pick<Recipe, 'volumeL' | 'fermentables' | 'hops' | 'boilMin' | 'mash'>;

function problemes(recette: RecetteLue, volumeL: number, profil: BrewhouseProfile): string[] {
  const rapport = recette.volumeL > 0 ? volumeL / recette.volumeL : 1;
  const grain = (recette.fermentables ?? [])
    .filter((f) => f.kind === 'grain' && (f.use ?? 'empatage') === 'empatage')
    .reduce((somme, f) => somme + f.weightKg * rapport, 0);
  const houblons = (recette.hops ?? []).map((h) => ({ ...h, weightG: h.weightG * rapport }));
  const e = profil.equipment!;
  const issues: string[] = [];
  if (volumeL >= e.fermenterCapacityL) issues.push(`Le fermenteur (${nombreFr(e.fermenterCapacityL, 1)} L) est plein avant ${nombreFr(volumeL, 1)} L.`);
  if (grain > 0) {
    const eau = BrewingMath.waterVolumes(grain, volumeL, profil, recette.mash?.spargeType ?? 'batch', recette.boilMin ?? 60, kettleHopGrams(houblons));
    // Le moteur redit le fermenteur et conseille « Réduis le volume » : la première phrase l'a déjà dit, et le bouton propose le volume.
    if (eau.planningStatus === 'impossible') for (const m of eau.issues) if (!issues.includes(m) && !(issues.length && /fermenteur/.test(m))) issues.push(m.replace(/ Réduis le volume du brassin\.$/, ''));
  }
  return issues;
}

export function avertissementMaterielActuel(recette: RecetteLue, volumeL: number, profil?: BrewhouseProfile): AvertissementMateriel | undefined {
  if (!profil?.equipment || !(volumeL > 0) || !Number.isFinite(volumeL)) return undefined;
  let trouves: string[];
  try { trouves = problemes(recette, volumeL, profil); } catch { return undefined; }
  if (!trouves.length) return undefined;
  let adaptationL: number | undefined;
  for (let v = Math.floor(volumeL * 2) / 2 - 0.5; v >= 1; v -= 0.5) {
    try { if (!problemes(recette, v, profil).length) { adaptationL = v; break; } } catch { break; }
  }
  return { message: `Sur ton matériel actuel (${profil.name}) : ${trouves.slice(0, 2).join(' ')}`, ...(adaptationL ? { adaptationL } : {}) };
}
