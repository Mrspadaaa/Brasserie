/**
 * Le lancement d'un brassin (uv4, choisie le 14.11) : la recette adaptée au volume, posée en journée de brassage.
 *
 * Fonction pure : elle ne calcule aucune quantité. Chaque nombre vient de la recette déjà adaptée par `scaleBrewBudgetRecipe`
 * (le moteur du lancement) ; ce module ne fait que l'ordonner en étapes. Un nombre absent reste absent, jamais 0.
 *
 * Tout ajout de houblon sort en pastille (nom, α, dose), sous la ligne de son moment : premier moût, minutes d'ébullition, fin
 * d'ébullition, whirlpool, dry hop. Le moment vient du champ `stage` de la recette (et `timeMin`, `tempC`, `dayOffset`), jamais du nom.
 */
import type { BrewhouseProfile, Fermentable, HopIngredient, Recipe } from '../types';
import { scaleBrewBudgetRecipe, scaleBrewRecipeScenario } from './finance/brewBudgetScaling';
import { nombreFr } from './nombreAffiche';

export type MatiereLancement = 'malt' | 'eau' | 'houblon' | 'levure';
export type GroupeLancement = 'brassage' | 'fermentation';

export interface PastilleLancement {
  cle: string;
  nom: string;
  /** Acide alpha en %, absent si inconnu (jamais 0). */
  alpha?: number;
  quantite: number;
  unite: 'kg' | 'g';
  /** Dry hop : jour du programme (« J+n »), seulement s'il existe dans la recette. */
  jour?: number;
}

export interface EtapeLancement {
  id: string;
  titre: string;
  groupe: GroupeLancement;
  matiere: MatiereLancement;
  /** Ce que dit la recette du moment : « 20 min à 82 °C », « 60 min ». Absent si la recette ne le dit pas. */
  detail?: string;
  /** Eau, en litres, pour l'empâtage et le rinçage. */
  eauL?: number;
  pastilles: PastilleLancement[];
  levure?: { nom: string; quantite?: number; unite?: string; arrondir: boolean };
}

const fini = (n: unknown): n is number => typeof n === 'number' && Number.isFinite(n);
/** Une dose de houblon qui ne dit rien (0, négative, absente) ne fait pas de pastille. */
const dose = (h: HopIngredient) => fini(h.weightG) && h.weightG > 0;

/** Unités qui se comptent : 1,58 flacon ne s'ensemence pas. Le grammes et les millilitres, eux, se pèsent au décimal. */
const UNITE_ENTIERE = /^(sachets?|flacons?|packs?|pochettes?|tubes?|fioles?|vials?|pots?)$/i;

export function levureArrondir(quantite: number | undefined, unite: string | undefined): boolean {
  return fini(quantite) && !Number.isInteger(quantite) && !!unite && UNITE_ENTIERE.test(unite.trim());
}

function pastilleHoublon(h: HopIngredient, i: number, avecJour = false): PastilleLancement {
  return {
    cle: `${h.stage}-${i}-${h.name}`,
    nom: h.name,
    ...(fini(h.alpha) && h.alpha > 0 ? { alpha: h.alpha } : {}),
    quantite: h.weightG,
    unite: 'g',
    ...(avecJour && fini(h.dayOffset) ? { jour: h.dayOffset } : {})
  };
}

function pastilleMalt(f: Fermentable, i: number): PastilleLancement {
  return { cle: `malt-${i}-${f.name}`, nom: f.name, quantite: f.weightKg, unite: 'kg' };
}

/** « 20 min à 82 °C », « 60 min », « 82 °C » ; rien si la recette n'en dit rien. */
export function detailMoment(timeMin: number | undefined, tempC: number | undefined): string | undefined {
  const min = fini(timeMin) && timeMin > 0 ? `${nombreFr(timeMin, 0)} min` : '';
  const temp = fini(tempC) ? `${nombreFr(tempC, 0)} °C` : '';
  if (min && temp) return `${min} à ${temp}`;
  return min || temp || undefined;
}

/**
 * Les étapes de la journée, dans l'ordre du brasseur. Une étape sans ingrédient dans la recette n'existe pas.
 * `recette` est la recette ADAPTÉE au volume choisi.
 */
export function etapesLancement(recette: Recipe, eau?: { empatageL?: number; rincageL?: number }): EtapeLancement[] {
  const etapes: EtapeLancement[] = [];
  const fermentables = recette.fermentables ?? [];
  const hops = (recette.hops ?? []).map((h, i) => ({ h, i })).filter(({ h }) => dose(h));

  // Empâtage : l'eau d'empâtage du plan d'eau, et les malts (grains mis à l'empâtage) en pastilles kg.
  const malts = fermentables.map((f, i) => ({ f, i })).filter(({ f }) => (f.use ?? 'empatage') === 'empatage' && fini(f.weightKg) && f.weightKg > 0);
  const eauEmpatage = recette.waterPlan?.mashWaterL ?? eau?.empatageL;
  if (malts.length || (fini(eauEmpatage) && eauEmpatage > 0)) {
    etapes.push({
      id: 'empatage', titre: 'Empâtage', groupe: 'brassage', matiere: 'malt',
      ...(fini(eauEmpatage) && eauEmpatage > 0 ? { eauL: eauEmpatage } : {}),
      pastilles: malts.map(({ f, i }) => pastilleMalt(f, i))
    });
  }
  const eauRincage = recette.waterPlan?.spargeWaterL ?? eau?.rincageL;
  if (fini(eauRincage) && eauRincage > 0) {
    etapes.push({ id: 'rincage', titre: 'Rinçage', groupe: 'brassage', matiere: 'eau', eauL: eauRincage, pastilles: [] });
  }

  // Premier moût : les houblons de stage `firstWort`.
  const premierMout = hops.filter(({ h }) => h.stage === 'firstWort');
  if (premierMout.length) {
    etapes.push({ id: 'premier-mout', titre: 'Premier moût', groupe: 'brassage', matiere: 'houblon', pastilles: premierMout.map(({ h, i }) => pastilleHoublon(h, i)) });
  }

  // Sucres et autres fermentescibles versés à l'ébullition : ils ne sont pas du malt d'empâtage, mais ils se pèsent ce jour-là.
  const sucres = fermentables.map((f, i) => ({ f, i })).filter(({ f }) => f.use === 'ebullition' && fini(f.weightKg) && f.weightKg > 0);
  if (sucres.length) {
    etapes.push({ id: 'sucres-ebullition', titre: 'Ébullition', groupe: 'brassage', matiere: 'malt', pastilles: sucres.map(({ f, i }) => pastilleMalt(f, i)) });
  }

  // Ébullition : un groupe par minute de contact (du plus long au plus court) ; 0 min = fin d'ébullition ; minute inconnue = « Ébullition » seule.
  const bouillants = hops.filter(({ h }) => h.stage === 'boil');
  const parMinute = new Map<number | null, typeof bouillants>();
  for (const x of bouillants) {
    const cle = fini(x.h.timeMin) ? Math.max(0, x.h.timeMin) : null;
    parMinute.set(cle, [...(parMinute.get(cle) ?? []), x]);
  }
  const minutes = [...parMinute.keys()].filter((m): m is number => m !== null && m > 0).sort((a, b) => b - a);
  for (const m of minutes) {
    etapes.push({ id: `ebullition-${m}`, titre: 'Ébullition', groupe: 'brassage', matiere: 'houblon', detail: detailMoment(m, undefined), pastilles: parMinute.get(m)!.map(({ h, i }) => pastilleHoublon(h, i)) });
  }
  if (parMinute.has(null)) {
    etapes.push({ id: 'ebullition', titre: 'Ébullition', groupe: 'brassage', matiere: 'houblon', pastilles: parMinute.get(null)!.map(({ h, i }) => pastilleHoublon(h, i)) });
  }
  if (parMinute.has(0)) {
    etapes.push({ id: 'fin-ebullition', titre: 'Fin d’ébullition', groupe: 'brassage', matiere: 'houblon', pastilles: parMinute.get(0)!.map(({ h, i }) => pastilleHoublon(h, i)) });
  }

  // Whirlpool : un groupe par couple (minutes, température) que la recette porte.
  const whirlpools = hops.filter(({ h }) => h.stage === 'whirlpool');
  const groupes = new Map<string, { timeMin?: number; tempC?: number; items: typeof whirlpools }>();
  for (const x of whirlpools) {
    const cle = `${fini(x.h.timeMin) ? x.h.timeMin : ''}|${fini(x.h.tempC) ? x.h.tempC : ''}`;
    const g = groupes.get(cle) ?? { timeMin: fini(x.h.timeMin) ? x.h.timeMin : undefined, tempC: fini(x.h.tempC) ? x.h.tempC : undefined, items: [] };
    g.items.push(x);
    groupes.set(cle, g);
  }
  [...groupes.values()].forEach((g, n) => {
    etapes.push({ id: groupes.size > 1 ? `whirlpool-${n}` : 'whirlpool', titre: 'Whirlpool', groupe: 'brassage', matiere: 'houblon', detail: detailMoment(g.timeMin, g.tempC), pastilles: g.items.map(({ h, i }) => pastilleHoublon(h, i)) });
  });

  // Levure : nom, quantité et unité de la recette ; « à arrondir » quand le compte n'est pas entier.
  if (recette.yeast?.name) {
    const { name, qty, unit } = recette.yeast;
    etapes.push({
      id: 'levure', titre: 'Levure', groupe: 'brassage', matiere: 'levure', pastilles: [],
      levure: { nom: name, ...(fini(qty) ? { quantite: qty } : {}), ...(unit ? { unite: unit } : {}), arrondir: levureArrondir(qty, unit) }
    });
  }

  // Fermentation : le dry hop, avec son jour quand la recette le donne ; les sucres ajoutés en cours de fermentation.
  const dryHops = hops.filter(({ h }) => h.stage === 'dryHop').sort((a, b) => (a.h.dayOffset ?? Infinity) - (b.h.dayOffset ?? Infinity));
  if (dryHops.length) {
    etapes.push({ id: 'dry-hop', titre: 'Dry hop', groupe: 'fermentation', matiere: 'houblon', pastilles: dryHops.map(({ h, i }) => pastilleHoublon(h, i, true)) });
  }
  const ajoutsFerm = fermentables.map((f, i) => ({ f, i })).filter(({ f }) => f.use === 'fermentation' && fini(f.weightKg) && f.weightKg > 0);
  if (ajoutsFerm.length) {
    etapes.push({ id: 'ajouts-fermentation', titre: 'Ajouts', groupe: 'fermentation', matiere: 'malt', pastilles: ajoutsFerm.map(({ f, i }) => ({ ...pastilleMalt(f, i), ...(fini(f.dayOffset) ? { jour: f.dayOffset } : {}) })) });
  }
  return etapes;
}

/** Le facteur de la recette (× 1,58) ; absent si le volume de la recette est inconnu. */
export function facteurVolume(volumeL: number, recette: Pick<Recipe, 'volumeL'>): number | undefined {
  return fini(volumeL) && volumeL > 0 && fini(recette.volumeL) && recette.volumeL > 0 ? volumeL / recette.volumeL : undefined;
}

/** La contenance de la cuve, seulement si la brasserie la porte ; sinon inconnue (aucune alerte de débordement, le moteur n'en a pas). */
export function contenanceCuveL(profil?: Pick<BrewhouseProfile, 'equipment'>): number | undefined {
  const c = profil?.equipment?.kettleCapacityL;
  return fini(c) && c > 0 ? c : undefined;
}

/** Échelle de la règle : stable pendant le geste (elle ne dépend pas du volume choisi), 60 L au moins. */
export function echelleRegleL(recetteL: number, brassinL?: number): number {
  const base = Math.max(fini(recetteL) ? recetteL : 0, fini(brassinL) ? brassinL : 0);
  return Math.max(60, Math.ceil((base * 2) / 10) * 10);
}

/** Le profil de brasserie du lancement : celui que le brasseur choisit, sinon celui de la recette (figé), sinon l'actif. */
export function profilsDeLancement(recette: Recipe, actif: BrewhouseProfile, choisi?: BrewhouseProfile) {
  const source = recette.brewhouse ?? actif;
  const lancement = choisi ?? actif;
  /* Par défaut, la cible est la source : le moteur du lancement ne change pas. Choisir une autre brasserie l'adapte à celle-là. */
  const cible = choisi && choisi.id !== actif.id ? choisi : source;
  return { source, lancement, cible };
}

/** La recette adaptée au volume, par le moteur du lancement. Lève la même erreur que lui. */
export function recetteAdaptee(recette: Recipe, volumeL: number, actif: BrewhouseProfile, choisi?: BrewhouseProfile): Recipe {
  const { source, cible } = profilsDeLancement(recette, actif, choisi);
  return scaleBrewBudgetRecipe(recette, volumeL, source, cible);
}

export interface ApercuLancement {
  adaptee: Recipe;
  etapes: EtapeLancement[];
}

/**
 * Ce que l'écran montre : la recette adaptée et ses étapes. L'eau vient du plan d'eau de la recette adaptée ;
 * à défaut, du plan de volumes du même moteur (jamais d'un chiffre posé ici). Lève la même erreur que `recetteAdaptee`.
 */
export function apercuLancement(recette: Recipe, volumeL: number, actif: BrewhouseProfile, choisi?: BrewhouseProfile): ApercuLancement {
  const adaptee = recetteAdaptee(recette, volumeL, actif, choisi);
  let eau: { empatageL?: number; rincageL?: number } | undefined;
  if (!adaptee.waterPlan) {
    try {
      const { source, cible } = profilsDeLancement(recette, actif, choisi);
      const plan = scaleBrewRecipeScenario(recette, volumeL, source, cible).waterPlan;
      if (plan.planningStatus !== 'invalid') eau = { empatageL: plan.mashWaterL, rincageL: plan.spargeWaterL };
    } catch { /* eau inconnue : l'étape n'affiche pas de litres */ }
  }
  return { adaptee, etapes: etapesLancement(adaptee, eau) };
}
