import { WaterIons, IonBand, SaltId } from '../../types';

export type MineralTargetMode = 'minimum' | 'target' | 'modest' | 'balanced';
/** The alkali goal is distinct from the conservative band used to dose acid. */
export function alkalineSaltGoal(band?: IonBand, gristCeiling?: number | null) {
  const target = band
    ? Math.min(band.min, gristCeiling != null && Number.isFinite(gristCeiling) ? gristCeiling : Infinity)
    : -Infinity;
  return { target, limitedByGrist: !!band && band.min >= 0 && target < band.min - 5 };
}

/** Policy stays explicit and independent of the numerical optimizer. */
export function mineralTarget(target: WaterIons, ranges: Record<keyof WaterIons, IonBand>, mode: MineralTargetMode): WaterIons {
  if (mode === 'target' || mode === 'balanced') return { ...target };
  const chosen = { ...target };
  for (const ion of ['mg', 'na'] as const) {
    const minimum = Number.isFinite(ranges?.[ion]?.min) ? Math.max(0, ranges[ion].min) : 0;
    chosen[ion] = mode === 'minimum' ? Math.min(target[ion], minimum) : Math.max(minimum, Math.min(target[ion], ion === 'mg' ? 10 : 20));
  }
  return chosen;
}
import { SALT_IDS, SALTS } from './substances';

/**
 * À quelle fraction d'un seuil son avertissement commence à valoir.
 *
 * 0.8 : la dernière marche avant la faute. Assez tôt pour reculer d'un demi-
 * gramme, assez tard pour ne pas crier au loup — 120 ppm de sodium sur un
 * seuil de 150, c'est le moment où la question se pose vraiment.
 */
export const CAUTION_APPROACH = 0.8;

export interface SaltCaution {
  id: SaltId;
  /** La phrase à afficher, valeur atteinte comprise quand il y a un seuil. */
  text: string;
  /** Vrai quand le seuil est franchi, pas seulement approché. */
  franchi: boolean;
}

/**
 * Les avertissements de sel qui ont lieu d'être, ici et maintenant.
 *
 * ⚠️ C'est une décision de DOMAINE, pas d'affichage : « ce sodium-là est-il
 * assez haut pour qu'on en parle » se teste, et se testait mal dans du JSX.
 * L'écran n'a plus qu'à rendre la liste.
 *
 * Trois conditions pour qu'un avertissement paraisse : le sel est pesé, il
 * n'est pas écarté, et — s'il annonce un seuil — ce seuil est approché. Un fait
 * de manipulation (l'hydratation du CaCl₂, l'insolubilité de la craie) n'a pas
 * de seuil : il vaut dès le premier gramme.
 */
export function saltCautions(
  doses: Partial<Record<SaltId, number>> | undefined,
  disabled: SaltId[] | undefined,
  wort: WaterIons,
  totalWaterL: number
): SaltCaution[] {
  const off = new Set(disabled ?? []);
  const out: SaltCaution[] = [];

  SALT_IDS.forEach((id) => {
    const def = SALTS[id];
    if (!def.caution || off.has(id)) return;
    const grams = doses?.[id] ?? 0;
    if (!Number.isFinite(grams) || grams <= 0) return;

    const seuil = def.cautionThreshold;
    if (!seuil) {
      out.push({ id, text: def.caution, franchi: false });
      return;
    }

    /*
     * L'ion non suivi ne vit que dans la dose : `WaterIons` ne lui a pas de
     * champ, c'est tout l'objet de `untracked`.
     */
    const atteint =
      seuil.ion === 'untracked'
        ? totalWaterL > 0 && def.untracked
          ? (grams * def.untracked.ppmPerGramPerLitre) / totalWaterL
          : 0
        : (wort?.[seuil.ion] ?? 0);

    if (!Number.isFinite(atteint) || atteint < seuil.ppm * CAUTION_APPROACH) return;
    out.push({
      id,
      text: `${seuil.label} à ${Math.round(atteint)} ppm — ${def.caution}`,
      franchi: atteint > seuil.ppm
    });
  });

  return out;
}

/** AR maximale que le solveur prête à la craie, en ppm de CaCO₃ (voir étape 6). */
export const CHALK_RA_CAP_PPM = 75;
