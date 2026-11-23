import {
  Fermentable,
  HopIngredient,
  YeastSpec,
  TempStep,
  FermentationStep,
  WaterIons,
  SaltId,
  AcidId,
  AdjunctIngredient,
  Recipe
} from '../types';
import { recipeReimportLines, RECIPE_TEXT_HEADER_V3 } from './recipeTransfer';
import type { YeastTechnicalFact } from '../../functions/src/yeastTechnicalFacts';
import { normalizeRecipeImport } from './recipeImport';
import { readYeastRecipeDesign, yeastRecipeDesignChanged, YEAST_RECIPE_GOAL_LABELS, YEAST_STYLE_FAMILIES } from './yeastRecipeDesign';
import { HOP_STAGE } from './hopStage';
import { SALTS, ACIDS, ION_SYMBOL_SHORT } from './water';
import { Units } from '../services/units';

/**
 * La recette en TEXTE BRUT, prête à coller n'importe où.
 *
 * ⚠️ Demandé ainsi : « à la fin de la recette une fois terminé je veux pouvoir
 * les extraire au format texte ».
 *
 * Ce que ça sert, et pourquoi le texte plutôt qu'un format d'échange : une
 * recette se partage sur un forum, dans un message, par courriel, se relit sur
 * un téléphone sans réseau, s'imprime et se punaise au-dessus de la cuve. Un
 * BeerXML fait aucune de ces choses. Le texte les fait toutes, et c'est aussi
 * ce qu'on recolle dans l'import de l'application ou dans un modèle de langage.
 *
 * TROIS RÈGLES D'ÉCRITURE :
 *
 *   1. **Tout ce qui a servi à brasser y est**, y compris l'eau — c'est la
 *      moitié qu'aucun partage de recette ne transmet jamais, et sans laquelle
 *      la même facture de grain donne une autre bière.
 *   2. **Rien d'inventé.** Une valeur absente ne s'écrit pas, elle disparaît
 *      avec sa ligne. Mieux vaut une fiche courte qu'une fiche fausse.
 *   3. **Ça se relit à l'œil nu.** Pas d'accolades, pas de balises : des
 *      sections titrées et des lignes courtes.
 */

export interface RecipeTextInput {
  /** Saved business fields are the authority for a complete, lossless copy. */
  recipe?: Recipe;
  name: string;
  style: string;
  volumeL: number;
  boilMin: number;

  og?: number | null;
  fg?: number | null;
  abv?: number | null;
  ibu?: number | null;
  ebc?: number | null;
  efficiencyPct?: number | null;
  carboTarget?: string;
  mashRatioLPerKg?: number;
  spargeType?: string;
  adjuncts?: AdjunctIngredient[];

  fermentables: Fermentable[];
  totalGristKg: number;
  hops: HopIngredient[];
  /** IBU d'un ajout, calculé par l'appelant — ce module ne calcule rien. */
  hopIbu?: (h: HopIngredient) => number | null;
  yeast: YeastSpec;
  mashSteps: TempStep[];
  fermentation: FermentationStep[];

  water?: {
    sourceName: string;
    styleName: string;
    mashWaterL: number;
    spargeWaterL: number;
    mashOsmoseeL: number;
    spargeOsmoseeL: number;
    wortIons?: WaterIons;
    sourceIons?: WaterIons;
    startIons?: WaterIons;
    mashIons?: WaterIons;
    spargeIons?: WaterIons;
    style?: {
      ions: Record<keyof WaterIons, { min: number; max: number }>;
      ratio: { min: number; max: number };
    };
    split?: { mash: Partial<Record<SaltId, number>>; sparge: Partial<Record<SaltId, number>> };
    raBefore?: number;
    doses: Partial<Record<SaltId, number>>;
    acidId: AcidId;
    mashAcid: { amount: number; unit: string };
    spargeAcid: { amount: number; unit: string };
    ra?: number;
    mashPh?: number;
  };

  notes?: string;
}

/** Un nombre lisible : pas de « 4.1000000000000005 » dans une fiche. */
const n = (v: number, dec = 1) =>
  Number.isFinite(v) ? String(Math.round(v * 10 ** dec) / 10 ** dec) : '—';

/**
 * Une valeur connue : ni absente, ni NaN. Un champ vidé dans l'assistant vaut NaN (`emptyValue`), et `!= null` le laisse passer :
 * le texte copié disait « NaN j » (monkey, graine 11, x2). Inconnu s'écrit « inconnu », jamais NaN ni 0.
 */
const fini = (v: number | null | undefined): v is number => typeof v === 'number' && Number.isFinite(v);

/**
 * Les masses passent par `Units`, jamais par une unité écrite à la main.
 *
 * ⚠️ `scripts/check-units.mjs` a refusé ma première version, et il avait
 * raison : j'y avais écrit `${Math.round(h.weightG)} g`. Une unité en dur est
 * exactement ce qui fait dériver un affichage du reste de l'application le jour
 * où la conversion change — et c'est invisible en relecture, puisque le texte
 * produit reste plausible.
 */
const grammes = (g: number) => Units.format(Math.round(g), 'g');

/** Les grammes sous le kilo, les kilos au-delà — comme on pèse. */
const masse = (kg: number) =>
  kg < 1
    ? Units.format(Math.round(kg * 1000), 'g')
    : Units.format(Math.round(kg * 100) / 100, 'kg');

/** Un titre de section, souligné — c'est ce qui rend la fiche parcourable. */
const titre = (t: string) => [``, t.toUpperCase(), '─'.repeat(t.length)];

/** A copy-time reading aid. The versioned snapshot and current recipe stay authoritative. */
export function recipeYeastIntentText(recipe: Recipe): string | undefined {
  if (recipe.yeastDesign === undefined) return undefined;
  const snapshot = readYeastRecipeDesign(recipe);
  if (!snapshot) throw new Error('Scénario de levure invalide : vérifier la recette avant de la copier.');
  const family = YEAST_STYLE_FAMILIES.find(style => style.id === snapshot.styleId)!.label;
  const pressure = snapshot.pressureBar === undefined ? 'pression inconnue'
    : `pression de fermentation ${n(snapshot.pressureBar, 3)} bar`;
  const changed = yeastRecipeDesignChanged(recipe, snapshot);
  return `${family} · ${snapshot.goalExplicit === false ? 'aucun objectif exprimé' : `objectif ${YEAST_RECIPE_GOAL_LABELS[snapshot.goal]}`} · ${pressure}. ` +
    (changed ? 'Scénario ancien : réglages modifiés depuis son adoption ; les consignes actuelles figurent dans la recette.'
      : snapshot.goalExplicit === false ? 'Conduite enregistrée ; les consignes figurent dans Levure, Empâtage et Fermentation.'
        : 'Intention adoptée ; les consignes figurent dans Levure, Empâtage et Fermentation.') +
    (snapshot.goalExplicit === false ? ' Aucun objectif aromatique n’est déduit du style.' : ' L’objectif aromatique ne prédit pas une intensité de goût.');
}

/** Un fait de levure par clé : les sources se fondent en une plage (74–80, 75–82, 76–80 → 74–82), sans fournisseur ni lien. */
const yeastFacts = (y: YeastSpec): YeastTechnicalFact[] => [
  ...(y.technicalFacts ?? []), ...(y.adoptedDocumentary?.technicalFacts ?? []), ...(y.localDocumentary?.technicalFacts ?? [])
];
const mergedRange = (facts: YeastTechnicalFact[], key: YeastTechnicalFact['key'], unit: string) => {
  const ranges = facts.filter(f => f.key === key && f.range && f.unit === unit).map(f => f.range!);
  return ranges.length
    ? { min: Math.min(...ranges.map(x => x.min)), max: Math.max(...ranges.map(x => x.max)) } : undefined;
};
const plage = (r: { min: number; max: number }, unit: string) =>
  `${r.min === r.max ? n(r.min) : `${n(r.min)}–${n(r.max)}`} ${unit}`;

/** La levure en lignes lisibles : nom, laboratoire, dose, puis atténuation, température, floculation, chacune une fois. */
function yeastLines(y: YeastSpec, intent?: string): string[] {
  const out: string[] = [];
  const facts = yeastFacts(y);
  const dose = Number.isFinite(y.qty) ? `${n(y.qty, 3)} ${y.unit || '(unité inconnue)'}` : 'quantité inconnue';
  const lab = y.lab && !y.name.toLowerCase().startsWith(y.lab.toLowerCase()) ? y.lab : undefined;
  out.push(`  ${[lab, y.name].filter(Boolean).join(' ')} — ${dose}${y.form ? ` (${y.form})` : ' · forme inconnue'}`);
  const documentaryAtt = mergedRange(facts, 'attenuation', '%');
  const documentaryTemp = mergedRange(facts, 'temperature', '°C');
  const same = (a?: { min: number; max: number }, b?: { min: number; max: number }) => !!a && !!b && a.min === b.min && a.max === b.max;
  const attenuation = y.attenuationPct != null
    ? `atténuation ${n(y.attenuationPct)} %${documentaryAtt && !same(documentaryAtt, { min: y.attenuationPct, max: y.attenuationPct }) ? ` (fiches ${plage(documentaryAtt, '%')})` : ''}`
    : documentaryAtt ? `atténuation ${plage(documentaryAtt, '%')}` : null;
  const ownTemp = y.fermTempMinC != null && y.fermTempMaxC != null ? { min: y.fermTempMinC, max: y.fermTempMaxC } : undefined;
  const temperature = ownTemp
    ? `fermentation ${plage(ownTemp, '°C')}${documentaryTemp && !same(documentaryTemp, ownTemp) ? ` (fiches ${plage(documentaryTemp, '°C')})` : ''}`
    : documentaryTemp ? `fermentation ${plage(documentaryTemp, '°C')}` : null;
  const bare = (s: string) => s.trim().replace(/^floculation\s*:?\s*/i, '');
  const reported = [...new Set(facts.filter(f => f.key === 'flocculation').map(f => bare(f.reported)).filter(Boolean))];
  const flocculation = y.flocculation?.trim() ? `floculation ${bare(y.flocculation)}`
    : reported.length ? `floculation ${reported.join(' / ').slice(0, 80)}` : null;
  const cond = [
    y.pitchTempC != null ? `ensemencement ${n(y.pitchTempC)} °C` : null,
    temperature, attenuation, flocculation,
    y.alcoholTolerancePct != null ? `tolérance ${n(y.alcoholTolerancePct)} % alc.` : null
  ].filter(Boolean);
  if (cond.length) out.push(`  ${cond.join(' · ')}`);
  if (intent) out.push(`  Intention levure à la copie : ${intent}`);
  return out;
}

/**
 * L'export concis (D184). Le texte lisible vient des champs enregistrés de la recette (`recipe`), jamais de la projection
 * de l'assistant, sauf pour ce qui se calcule (OG, FG, IBU, eau). Ce que l'import relit vit dans un seul bloc final.
 */
export function recipeToText(r: RecipeTextInput, date = new Date()): string {
  if (r.recipe) {
    // Check for rejected yeast/contact data before the writer can omit it.
    // The original business fields, not the normalized copy, are exported.
    normalizeRecipeImport(r.recipe, 'local', true);
    const rec = r.recipe;
    const saved: RecipeTextInput = {
      ...r, name: rec.name, style: rec.style ?? '', volumeL: rec.volumeL, boilMin: rec.boilMin,
      carboTarget: rec.carboTarget, adjuncts: rec.adjuncts,
      fermentables: rec.fermentables, totalGristKg: rec.totalGristKg, hops: rec.hops, yeast: rec.yeast,
      mashSteps: rec.mash?.steps ?? [], fermentation: rec.fermentation ?? [],
      mashRatioLPerKg: r.mashRatioLPerKg ?? rec.mash?.ratioLPerKg, spargeType: r.spargeType ?? rec.mash?.spargeType,
      notes: r.notes ?? (rec.notes ?? []).filter(x => x.trim()).join('\n')
    };
    return [
      RECIPE_TEXT_HEADER_V3,
      ...readableLines(saved, date, recipeYeastIntentText(rec)),
      '',
      ...recipeReimportLines(rec)
    ].join('\n');
  }
  return readableLines(r, date).join('\n');
}

function readableLines(r: RecipeTextInput, date: Date, intent?: string): string[] {
  const l: string[] = [];

  l.push(`${r.name || 'Recette sans nom'}${r.style ? ` — ${r.style}` : ''}`);
  l.push(
    `${n(r.volumeL)} L en fermenteur · ébullition ${fini(r.boilMin) ? `${r.boilMin} min` : 'durée inconnue'} · ${date.toLocaleDateString('fr-CH')}`
  );
  const house = r.recipe?.brewhouse;
  if (house?.name)
    l.push(`Matériel : ${[house.name, house.volumeL != null ? `${n(house.volumeL)} L visés` : null,
      house.efficiencyPct != null ? `rendement ${n(house.efficiencyPct)} %` : null].filter(Boolean).join(' · ')}`);

  /*
   * Les cibles d'abord : c'est ce qu'on regarde pour décider si la recette
   * ressemble à ce qu'on cherche, avant même de lire les ingrédients.
   */
  const cibles = [
    fini(r.og) ? `OG ${r.og.toFixed(3)}` : null,
    fini(r.fg) ? `FG ${r.fg.toFixed(3)}` : null,
    fini(r.abv) ? `ABV ${n(r.abv)} %` : null,
    fini(r.ibu) ? `IBU ${Math.round(r.ibu)}` : null,
    fini(r.ebc) ? `EBC ${n(r.ebc)}` : null,
    fini(r.efficiencyPct) ? `rendement ${Math.round(r.efficiencyPct)} %` : null
  ].filter(Boolean);
  if (cibles.length) l.push(cibles.join(' · '));

  // --- Grain ---------------------------------------------------------------
  if (r.fermentables.length) {
    l.push(...titre(`Fermentescibles — ${masse(r.totalGristKg)}`));
    r.fermentables.forEach((f) => {
      const part =
        r.totalGristKg > 0 && f.kind === 'grain' && fini(f.weightKg)
          ? `${Math.round((f.weightKg / r.totalGristKg) * 100)} %`
          : null;
      const detail = [
        part,
        fini(f.colorEbc) ? `${f.colorEbc} EBC` : null,
        fini(f.potentialPpg) ? `${f.potentialPpg} PPG` : null,
        f.use,
        fini(f.dayOffset) ? `jour ${f.dayOffset}` : null,
        fini(f.fermentabilityPct) ? `${f.fermentabilityPct} % fermentescible` : null,
        f.kind !== 'grain' ? f.kind : null
      ]
        .filter(Boolean)
        .join(' · ');
      l.push(`  ${masse(f.weightKg).padEnd(9)} ${f.name}${detail ? `  (${detail})` : ''}`);
    });
  }

  // --- Houblons ------------------------------------------------------------
  if (r.hops.length) {
    l.push(...titre('Houblons'));
    /*
     * Groupés par MOMENT et dans l'ordre chronologique de la journée : c'est
     * l'ordre dans lequel on les pèse et dans lequel on les jette. Une liste
     * triée par nom obligerait à la relire trois fois pendant l'ébullition.
     */
    const parMoment = [...r.hops].sort(
      (a, b) => HOP_STAGE[a.stage].order - HOP_STAGE[b.stage].order
    );
    let momentCourant = '';
    parMoment.forEach((h) => {
      const st = HOP_STAGE[h.stage];
      if (st.label !== momentCourant) {
        momentCourant = st.label;
        l.push(`  ${st.label} :`);
      }
      const quand =
        h.stage === 'dryHop'
          ? [fini(h.dayOffset) ? `J+${h.dayOffset}` : null,
              h.timeMin && fini(h.timeMin) ? (h.timeMin >= 60 ? `${n(h.timeMin / 60)} h` : `${h.timeMin} min`) : null]
              .filter(Boolean).join(' · ') || null
          : fini(h.timeMin)
            ? `${h.timeMin} min${fini(h.tempC) ? ` à ${h.tempC} °C` : ''}`
            : null;
      const ibu = r.hopIbu?.(h);
      const detail = [quand, h.alpha ? `${n(h.alpha)} % AA` : null, ibu ? `${n(ibu)} IBU` : null]
        .filter(Boolean)
        .join(' · ');
      l.push(`    ${grammes(h.weightG).padEnd(7)} ${h.name}${detail ? `  (${detail})` : ''}`);
    });
  }

  // --- Levure --------------------------------------------------------------
  if (r.yeast?.name) {
    l.push(...titre('Levure'));
    l.push(...yeastLines(r.yeast, intent));
  }

  // --- Empâtage ------------------------------------------------------------
  if (r.carboTarget) l.push(`  Carbonatation : ${r.carboTarget}`);
  if (r.adjuncts?.length) {
    l.push(...titre('Autres ajouts'));
    r.adjuncts.forEach((a) =>
      l.push(`  ${a.name} — ${fini(a.amount) ? `${a.amount} ${a.unit}` : 'quantité inconnue'} · ${a.step}${a.notes ? ` · ${a.notes.replace(/\s*\n\s*/g, ' ')}` : ''}`)
    );
  }
  if (r.mashSteps.length) {
    l.push(...titre('Empâtage'));
    if (r.mashRatioLPerKg != null) l.push(`  Épaisseur : ${n(r.mashRatioLPerKg, 2)} L/kg`);
    if (r.spargeType)
      l.push(
        `  Rinçage : ${{ batch: 'par lots', fly: 'continu', none: 'aucun' }[r.spargeType] ?? r.spargeType}`
      );
    r.mashSteps.forEach((s) =>
      l.push(`  ${fini(s.tempC) ? `${n(s.tempC)} °C` : 'T° inconnue'}`.padEnd(11) +
        ` ${fini(s.durationMin) ? `${s.durationMin} min` : 'durée inconnue'} — ${s.name}`)
    );
  }

  // --- Eau -----------------------------------------------------------------
  /*
   * ⚠️ LA SECTION QUI MANQUE À TOUTES LES RECETTES PARTAGÉES. Une même facture
   * de grain sur une eau de Burton et sur une eau de Pilsen donne deux bières
   * différentes. Les sels, l'acide et la coupe à l'osmosée sont donc de la
   * recette au même titre que le houblon.
   */
  if (r.water) {
    const w = r.water;
    l.push(...titre('Eau'));
    l.push(`  Source : ${w.sourceName} · profil visé : ${w.styleName}`);
    l.push(
      `  Empâtage ${n(w.mashWaterL)} L` +
        (w.mashOsmoseeL > 0 ? ` (dont ${n(w.mashOsmoseeL)} L osmosée)` : '') +
        (w.spargeWaterL > 0
          ? ` · rinçage ${n(w.spargeWaterL)} L` +
            (w.spargeOsmoseeL > 0 ? ` (dont ${n(w.spargeOsmoseeL)} L osmosée)` : '')
          : ' · sans rinçage')
    );

    if (w.wortIons) {
      const ions = (Object.keys(ION_SYMBOL_SHORT) as Array<keyof WaterIons>)
        .map((i) => `${ION_SYMBOL_SHORT[i]} ${Math.round(w.wortIons![i])}`)
        .join(' · ');
      l.push(
        `  Eau traitée, moyenne pondérée après acide : ${ions} (ppm, avant extraction et ébullition)`
      );
    }
    // Une valeur ne s'écrit qu'une fois : l'alcalinité avant acide n'apparaît que si l'acide la change.
    if (w.ra != null)
      l.push(`  Alcalinité résiduelle après acide : ${Math.round(w.ra)} ppm CaCO3` +
        (w.raBefore != null && Math.round(w.raBefore) !== Math.round(w.ra) ? ` (avant acide : ${Math.round(w.raBefore)})` : ''));
    else if (w.raBefore != null)
      l.push(`  Alcalinité résiduelle avant acide : ${Math.round(w.raBefore)} ppm CaCO3`);
    const ionsLine = (ions: WaterIons) => Object.keys(ION_SYMBOL_SHORT)
      .map((k: keyof WaterIons) => `${ION_SYMBOL_SHORT[k]} ${n(ions[k])}`).join(' · ');
    // L'empâtage et le rinçage après acide ne reviennent que s'ils diffèrent du départ dilué.
    let precedent = '';
    for (const [label, ions] of [
      ['Source non diluée', w.sourceIons],
      ['Départ dilué', w.startIons],
      ['Empâtage après acide', w.mashIons],
      ['Rinçage après acide', w.spargeIons]
    ] as const) {
      if (!ions) continue;
      const ligne = ionsLine(ions);
      if (label.endsWith('après acide') && (ligne === precedent || ligne === (w.startIons ? ionsLine(w.startIons) : ''))) continue;
      l.push(`  ${label} : ${ligne} ppm`);
      precedent = ligne;
    }
    if (w.style) {
      l.push(
        `  Cibles d'eau : ${Object.entries(w.style.ions)
          .map(([k, band]) => `${ION_SYMBOL_SHORT[k]} ${band.min}–${band.max}`)
          .join(' · ')} ppm · SO₄/Cl visé ${w.style.ratio.min}–${w.style.ratio.max}`
      );
    }

    const sels = (Object.entries(w.doses) as Array<[SaltId, number]>).filter(([, g]) => g > 0);
    if (sels.length) {
      l.push(`  Sels :`);
      sels.forEach(([id, g]) =>
        l.push(
          `    ${`${n(g, 2)} g`.padEnd(9)} ${SALTS[id].name}${w.split ? ` — empâtage ${n(w.split.mash[id] ?? 0, 2)} g ; rinçage ${n(w.split.sparge[id] ?? 0, 2)} g` : ''}`
        )
      );
    }

    const acides = [
      w.mashAcid.amount > 0 ? `${n(w.mashAcid.amount, 2)} ${w.mashAcid.unit} à l’empâtage` : null,
      w.spargeAcid.amount > 0
        ? `${n(w.spargeAcid.amount, 2)} ${w.spargeAcid.unit} au rinçage`
        : null
    ].filter(Boolean);
    l.push(
      `  ${ACIDS[w.acidId].name} : ${acides.length ? acides.join(' · ') : 'aucun ajout retenu'}`
    );
    if (w.mashPh != null) l.push(`  pH d’empâtage relevé : ${n(w.mashPh, 2)}`);
  } else if (r.recipe?.waterPlan) {
    // Sans calcul de l'assistant : le traitement enregistré est dans le bloc de réimport, ici seulement son résumé.
    const p = r.recipe.waterPlan;
    const sels = Object.keys(SALTS).map((id) => {
      const g = (p.mash?.[id as SaltId] ?? 0) + (p.sparge?.[id as SaltId] ?? 0);
      return g > 0 ? `${SALTS[id as SaltId].name} ${n(g, 2)} g` : null;
    }).filter(Boolean);
    l.push(...titre('Eau'));
    l.push(`  ${[p.sourceSnapshot?.name ?? p.sourceId, p.targetName ? `profil visé : ${p.targetName}` : null,
      p.mashWaterL != null ? `empâtage ${n(p.mashWaterL)} L` : null, p.spargeWaterL != null ? `rinçage ${n(p.spargeWaterL)} L` : null]
      .filter(Boolean).join(' · ')}`);
    if (sels.length) l.push(`  Sels : ${sels.join(' · ')}`);
  }

  // --- Fermentation --------------------------------------------------------
  if (r.fermentation.length) {
    l.push(...titre('Fermentation'));
    r.fermentation.forEach((s) =>
      l.push(`  ${fini(s.tempC) ? `${n(s.tempC)} °C` : 'T° inconnue'}`.padEnd(11) +
        ` ${fini(s.days) ? `${s.days} j` : 'durée inconnue'} — ${s.name}`)
    );
  }

  if (r.notes?.trim()) {
    l.push(...titre('Notes'));
    r.notes
      .trim()
      .split('\n')
      .forEach((ligne) => l.push(`  ${ligne}`));
  }

  return l;
}
