import {
  Fermentable,
  HopIngredient,
  YeastSpec,
  TempStep,
  FermentationStep,
  WaterIons,
  SaltId,
  AcidId
} from '../types';
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
  kg < 1 ? Units.format(Math.round(kg * 1000), 'g') : Units.format(Math.round(kg * 100) / 100, 'kg');

/** Un titre de section, souligné — c'est ce qui rend la fiche parcourable. */
const titre = (t: string) => [``, t.toUpperCase(), '─'.repeat(t.length)];

export function recipeToText(r: RecipeTextInput, date = new Date()): string {
  const l: string[] = [];

  l.push(`${r.name || 'Recette sans nom'}${r.style ? ` — ${r.style}` : ''}`);
  l.push(
    `${n(r.volumeL)} L en fermenteur · ébullition ${r.boilMin} min · ${date.toLocaleDateString('fr-CH')}`
  );

  /*
   * Les cibles d'abord : c'est ce qu'on regarde pour décider si la recette
   * ressemble à ce qu'on cherche, avant même de lire les ingrédients.
   */
  const cibles = [
    r.og != null ? `OG ${r.og.toFixed(3)}` : null,
    r.fg != null ? `FG ${r.fg.toFixed(3)}` : null,
    r.abv != null ? `ABV ${n(r.abv)} %` : null,
    r.ibu != null ? `IBU ${Math.round(r.ibu)}` : null,
    r.ebc != null ? `EBC ${n(r.ebc)}` : null,
    r.efficiencyPct != null ? `rendement ${Math.round(r.efficiencyPct)} %` : null
  ].filter(Boolean);
  if (cibles.length) l.push(cibles.join(' · '));

  // --- Grain ---------------------------------------------------------------
  if (r.fermentables.length) {
    l.push(...titre(`Fermentescibles — ${masse(r.totalGristKg)}`));
    r.fermentables.forEach((f) => {
      const part =
        r.totalGristKg > 0 && f.kind === 'grain'
          ? `${Math.round((f.weightKg / r.totalGristKg) * 100)} %`
          : null;
      const detail = [
        part,
        f.colorEbc != null ? `${f.colorEbc} EBC` : null,
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
          ? h.dayOffset != null
            ? `J+${h.dayOffset}`
            : null
          : h.timeMin != null
            ? `${h.timeMin} min${h.tempC != null ? ` à ${h.tempC} °C` : ''}`
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
    const y = r.yeast;
    l.push(`  ${[y.lab, y.name].filter(Boolean).join(' ')} — ${y.qty} ${y.unit} (${y.form})`);
    const cond = [
      y.pitchTempC != null ? `ensemencement ${n(y.pitchTempC)} °C` : null,
      y.fermTempMinC != null && y.fermTempMaxC != null
        ? `fermentation ${n(y.fermTempMinC)}–${n(y.fermTempMaxC)} °C`
        : null,
      y.attenuationPct != null ? `atténuation ${Math.round(y.attenuationPct)} %` : null
    ].filter(Boolean);
    if (cond.length) l.push(`  ${cond.join(' · ')}`);
  }

  // --- Empâtage ------------------------------------------------------------
  if (r.mashSteps.length) {
    l.push(...titre('Empâtage'));
    r.mashSteps.forEach((s) =>
      l.push(`  ${`${n(s.tempC)} °C`.padEnd(9)} ${s.durationMin} min — ${s.name}`)
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
      l.push(`  Moût : ${ions} (ppm)`);
    }
    if (w.ra != null) l.push(`  Alcalinité résiduelle : ${Math.round(w.ra)} ppm`);

    const sels = (Object.entries(w.doses) as Array<[SaltId, number]>).filter(([, g]) => g > 0);
    if (sels.length) {
      l.push(`  Sels :`);
      sels.forEach(([id, g]) => l.push(`    ${`${n(g, 2)} g`.padEnd(9)} ${SALTS[id].name}`));
    }

    const acides = [
      w.mashAcid.amount > 0
        ? `${n(w.mashAcid.amount, 2)} ${w.mashAcid.unit} à l’empâtage`
        : null,
      w.spargeAcid.amount > 0
        ? `${n(w.spargeAcid.amount, 2)} ${w.spargeAcid.unit} au rinçage`
        : null
    ].filter(Boolean);
    if (acides.length) l.push(`  ${ACIDS[w.acidId].name} : ${acides.join(' · ')}`);
    if (w.mashPh != null) l.push(`  pH d’empâtage relevé : ${n(w.mashPh, 2)}`);
  }

  // --- Fermentation --------------------------------------------------------
  if (r.fermentation.length) {
    l.push(...titre('Fermentation'));
    r.fermentation.forEach((s) =>
      l.push(`  ${`${n(s.tempC)} °C`.padEnd(9)} ${s.days} j — ${s.name}`)
    );
  }

  if (r.notes?.trim()) {
    l.push(...titre('Notes'));
    r.notes
      .trim()
      .split('\n')
      .forEach((ligne) => l.push(`  ${ligne}`));
  }

  return l.join('\n');
}
