import {
  MaltIngredient,
  HopIngredient,
  HopStage,
  AdjunctIngredient,
  YeastSpec,
  TempStep,
  FermentationStep
} from '../types';
import { Units } from './units';

/**
 * Lecture d'une recette collée depuis un site, un forum ou un livre.
 *
 * ⚠️ Ce que règle cette réécriture : la version précédente **inventait** dès
 * qu'elle échouait — un alpha de 10 % sur tout houblon sans pourcentage, deux
 * malts fictifs quand elle n'en trouvait aucun, « Houblon Aromatique » comme
 * nom de repli, un poids de 1 kg par défaut. Un brasseur qui collait une
 * recette repartait avec des chiffres crédibles et faux.
 *
 * Règle désormais absolue : **ce qui n'est pas lu reste vide.** Une liste vide
 * se voit et se corrige ; un alpha inventé se propage jusque dans l'IBU.
 *
 * Les recettes anglophones donnent presque toujours les deux systèmes —
 * « 9 lbs. (4.1 kg) ». On prend alors la valeur métrique entre parenthèses,
 * qui est la mesure d'origine du malteur, et on ne convertit que si elle
 * manque.
 */

export interface ParsedRecipeResult {
  name: string;
  style: string;
  volumeL: number | null;
  ogTarget: number | null;
  fgTarget: number | null;
  abvTarget: number | null;
  ibuTarget: number | null;
  /** Couleur annoncée par la recette (SRM converti en EBC), si elle en donne une. */
  colorEbc: number | null;
  boilMin: number | null;
  malts: MaltIngredient[];
  hops: HopIngredient[];
  adjuncts: AdjunctIngredient[];
  yeast: YeastSpec | null;
  mashSteps: TempStep[];
  fermentation: FermentationStep[];
  /** Eau d'empâtage annoncée par le déroulé, en litres. */
  mashWaterL: number | null;
  /** Eau de rinçage annoncée par le déroulé, en litres. */
  spargeWaterL: number | null;
  /** Volume de moût AVANT ébullition — « until 6.5 gallons (25 L) collected ». */
  preBoilL: number | null;
  /** Carbonatation visée, en volumes de CO2. */
  carboVolumes: number | null;
  /**
   * Traitement d'eau, en toutes lettres.
   *
   * ⚠️ PAS de conversion en grammes : la recette dose en cuillères à café
   * (« 3/4 tsp. calcium chloride »), dont la masse dépend du sel et du tassement.
   * L'atelier de l'eau se règle en grammes ; recopier une cuillère en gramme
   * serait exactement le genre de chiffre crédible et faux qu'on s'interdit.
   */
  waterNote: string | null;
  /** Le calendrier de houblonnage à cru, quand il est décrit en prose. */
  dryHopNote: string | null;
  /** Le déroulé, recopié tel quel. */
  instructions: string;
  rawText: string;
  /** Ce que la lecture n'a pas su déterminer — affiché à l'utilisateur. */
  warnings: string[];
}

const NUM = String.raw`\d+(?:[.,]\d+)?`;

function toNumber(raw: string | undefined): number | null {
  if (!raw) return null;
  const n = parseFloat(raw.replace(',', '.'));
  return Number.isFinite(n) ? n : null;
}

/**
 * « 3⁄4 » ➔ 0.75. Les recettes américaines dosent en fractions, avec la barre
 * de fraction typographique aussi bien que la barre oblique.
 */
function readFraction(raw: string): number | null {
  const f = /^(\d+)\s*[⁄/]\s*(\d+)$/.exec(raw.trim());
  if (f) return Number(f[2]) === 0 ? null : Number(f[1]) / Number(f[2]);
  return toNumber(raw);
}

/**
 * Masse d'une ligne, en grammes.
 *
 * Préfère la valeur métrique entre parenthèses — « 9 lbs. (4.1 kg) » vaut
 * 4100 g, pas la conversion approchée de 9 livres.
 */
function massG(line: string): number | null {
  const metric = new RegExp(String.raw`\((?:[^)]*?[/·]\s*)?(${NUM})\s*(kg|g)\b`, 'i').exec(line);
  if (metric) {
    const value = toNumber(metric[1]);
    if (value !== null) return Units.convertOrSame(value, metric[2], 'g');
  }

  const us = new RegExp(String.raw`(${NUM})\s*(lbs?|oz|kg|g)\b`, 'i').exec(line);
  if (us) {
    const value = toNumber(us[1]);
    if (value !== null) return Units.convertOrSame(value, us[2].replace(/s$/, ''), 'g');
  }
  return null;
}

/** Volume d'une ligne, en litres. Même préférence pour le métrique. */
function volumeL(line: string): number | null {
  const metric = new RegExp(String.raw`(${NUM})\s*(?:L|litres?)\b`).exec(line);
  if (metric) return toNumber(metric[1]);

  const us = new RegExp(String.raw`(${NUM})\s*(?:gal|gallons?)\b`, 'i').exec(line);
  if (us) {
    const value = toNumber(us[1]);
    if (value !== null) return Math.round(Units.convertOrSame(value, 'gal', 'L') * 10) / 10;
  }
  return null;
}

/**
 * Température d'un fragment, en °C. « 152 °F (67 °C) » ➔ 67.
 * Sans parenthèse métrique, le Fahrenheit est converti.
 */
function tempC(fragment: string): number | null {
  const celsius = new RegExp(String.raw`(${NUM})\s*°?\s*C\b`).exec(fragment);
  if (celsius) return toNumber(celsius[1]);

  const fahrenheit = new RegExp(String.raw`(${NUM})\s*°?\s*F\b`).exec(fragment);
  if (fahrenheit) {
    const value = toNumber(fahrenheit[1]);
    if (value !== null) return Units.fToC(value);
  }
  return null;
}

/** Le moment du houblon, lu dans la parenthèse qui suit son nom. */
function hopStage(line: string): { stage: HopStage; timeMin?: number; dayOffset?: number } {
  const s = line.toLowerCase();

  if (s.includes('dry hop') || s.includes('houblonnage à cru') || s.includes('à cru')) {
    const day = new RegExp(String.raw`(?:day|jour|j\+)\s*(\d+)`, 'i').exec(line);
    return { stage: 'dryHop', dayOffset: day ? Number(day[1]) : undefined };
  }
  if (s.includes('first wort') || s.includes('premier moût') || s.includes('fwh')) {
    return { stage: 'firstWort' };
  }
  if (s.includes('hop stand') || s.includes('whirlpool') || s.includes('flame ?out')) {
    const min = new RegExp(String.raw`(${NUM})\s*min`, 'i').exec(line);
    return { stage: 'whirlpool', timeMin: min ? Number(min[1]) : undefined };
  }

  const min = new RegExp(String.raw`(${NUM})\s*min`, 'i').exec(line);
  return { stage: 'boil', timeMin: min ? Number(min[1]) : undefined };
}

/**
 * Nettoyage d'un nom d'ingrédient.
 *
 * L'ordre compte : on retire les parenthèses AVANT les quantités, et les
 * quantités avec leur unité éventuellement orpheline (« 9 lbs. » laisse
 * « lbs. » si on efface le nombre d'abord). Sans ça, le catalogue se remplit
 * de « lbs. US 2-row » et « oz. Citra ».
 */
function cleanName(line: string, extra: RegExp[] = []): string {
  let out = line
    // 1. Parenthèses — elles portent la conversion et le moment d'ajout.
    .replace(new RegExp(String.raw`\((?:[^()]|\([^()]*\))*\)`, 'g'), ' ')
    // 2. Quantités, unité comprise, que le nombre soit encore là ou non.
    .replace(new RegExp(String.raw`(?:${NUM}\s*)?\b(?:lbs?|oz|kg|g|gal|qt|mL|L)\b\.?`, 'gi'), ' ')
    .replace(new RegExp(String.raw`${NUM}\s*AAU\b`, 'gi'), ' ')
    // 3. Numérotation de liste en tête.
    .replace(/^[*\-•\s\d.,/]*/, '')
    .replace(/[®™]/g, '')
    /*
     * ⚠️ « GalaxyTM » : le ™ d'un PDF se recopie souvent en deux lettres
     * ordinaires. Sans ça, l'ingrédient s'appelle « GalaxyTM » et ne se
     * rapproche plus jamais du « Galaxy » du stock.
     */
    .replace(/(?<=[a-zà-ÿ])TM\b/g, '')
    .replace(/\b(?:hops?|houblons?|pellets?|malt(?:s)?|grain(?:s)?)\b\.?/gi, ' ');

  extra.forEach((r) => {
    out = out.replace(r, ' ');
  });

  return out.replace(/\s{2,}/g, ' ').replace(/^[\s.,:;/-]+|[\s.,:;/-]+$/g, '').trim();
}

/**
 * Découpe un déroulé en phrases.
 *
 * ⚠️ Le point d'une ABRÉVIATION n'est pas une fin de phrase. Sans cette garde,
 * « Add 3⁄4 tsp. calcium chloride » se coupait en deux, et la moitié qui portait
 * le sel — « calcium chloride (CaCl2) » — se retrouvait orpheline : la note
 * d'eau perdait le mot « Add » et sa dose.
 */
function splitSentences(text: string): string[] {
  return text
    .split(/(?<!\b(?:tsp|tbsp|oz|lbs?|approx|min|max|vol|qt|gal|no|pt|fl)\.)(?<=[.!?])\s+|\n+/i)
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * Ce qui n'est ni malt ni houblon : sucres, clarifiants, épices, fruits.
 * Hissé en constante parce que la détection du houblon s'en sert pour ne pas
 * confondre « Protofloc (15 min) » avec un ajout de houblon.
 */
const ADJUNCT_LINE =
  /\b(?:lactose|sugar|sucre|protofloc|whirlfloc|irish moss|gypse|gypsum|cacl|acide|acid|purée|puree|zeste|vanille|coriandre|cannelle|café|cacao)\b/i;

export const RecipeTextParser = {
  /**
   * Analyse un texte de recette. Anglophone ou francophone, métrique ou
   * américain. Ce qui n'est pas lu est laissé vide et signalé dans `warnings`.
   */
  parse(rawText: string): ParsedRecipeResult {
    const text = rawText.trim();
    const allLines = text.split('\n').map((l) => l.trim());
    const warnings: string[] = [];

    // Le déroulé commence à « Step by Step », « Instructions », « Déroulé »…
    const stepIndex = allLines.findIndex((l) =>
      /^(step ?by ?step|instructions?|d[ée]roul[ée]|proc[ée]dure|mode op[ée]ratoire)(?![a-zà-ÿ])/i.test(l)
    );
    const headLines = (stepIndex >= 0 ? allLines.slice(0, stepIndex) : allLines).filter(Boolean);
    const instructions =
      stepIndex >= 0 ? allLines.slice(stepIndex + 1).join('\n').trim() : '';

    // --- En-tête -----------------------------------------------------------
    // Le titre est la première ligne qui n'est ni une mesure ni un intertitre.
    const name =
      headLines.find(
        (l) =>
          l.length > 2 &&
          l.length < 70 &&
          !/^[(\d]/.test(l) &&
          !/^(ingredients?|ingr[ée]dients?|og|fg|ibu|srm|abv)\b/i.test(l)
      ) ?? '';

    const og = toNumber(new RegExp(String.raw`\bOG\s*[=:]?\s*(${NUM})`, 'i').exec(text)?.[1]);
    const fg = toNumber(new RegExp(String.raw`\bFG\s*[=:]?\s*(${NUM})`, 'i').exec(text)?.[1]);
    const ibu = toNumber(new RegExp(String.raw`\bIBU\s*[=:]?\s*(${NUM})`, 'i').exec(text)?.[1]);
    const abv = toNumber(new RegExp(String.raw`\bABV\s*[=:]?\s*(${NUM})`, 'i').exec(text)?.[1]);
    const srm = toNumber(new RegExp(String.raw`\bSRM\s*[=:]?\s*(${NUM})`, 'i').exec(text)?.[1]);
    const ebcDirect = toNumber(new RegExp(String.raw`\bEBC\s*[=:]?\s*(${NUM})`, 'i').exec(text)?.[1]);

    // Le volume figure d'ordinaire sur la ligne du titre : « (5 gallons/19 L) ».
    let volume: number | null = null;
    for (const line of headLines.slice(0, 6)) {
      volume = volumeL(line);
      if (volume) break;
    }
    if (volume === null) volume = volumeL(text);

    const boilMatch = new RegExp(
      String.raw`(?:boil[^.\n]*?|[ée]bullition[^.\n]*?)(${NUM})\s*(?:min|minutes?)`,
      'i'
    ).exec(text);
    const boilMin = toNumber(boilMatch?.[1]);

    const styleMatch =
      new RegExp(String.raw`(?:style|type|cat[ée]gorie)\s*[:=-]\s*([^\n\r,;]+)`, 'i').exec(text)?.[1] ??
      // Sinon, le style est souvent dans le titre lui-même.
      /\b(NEIPA|IPA|APA|Pale Ale|Stout|Porter|Saison|Lager|Pilsner|Weizen|Witbier|Gose|Sour|Bitter|Amber|Brown Ale|Barleywine|Tripel|Dubbel)\b/i.exec(
        name
      )?.[1];

    // --- Ingrédients -------------------------------------------------------
    const malts: MaltIngredient[] = [];
    const hops: HopIngredient[] = [];
    const adjuncts: AdjunctIngredient[] = [];
    let yeast: YeastSpec | null = null;

    headLines.forEach((line) => {
      const lower = line.toLowerCase();
      if (!line || /^(ingredients?|ingr[ée]dients?)\s*$/i.test(line)) return;
      if (line === name) return;

      // Levure — repérée au laboratoire ou au mot « yeast »/« levure ».
      if (
        !yeast &&
        (/\byeast\b|\blevure\b/i.test(line) ||
          /\b(wlp\d+|gy\d+|s-?\d{2}|us-?05|be-?256|wy\d{4}|omega|lallemand|fermentis|white labs|wyeast|gigayeast)\b/i.test(
            line
          ))
      ) {
        // « GigaYeast GY054 … or White Labs WLP095 … » propose une équivalence,
        // pas deux levures : on retient la première et on garde l'autre en note.
        const [primary, ...alternatives] = line.split(/\s+\b(?:or|ou)\b\s+/i);

        const lab =
          /\b(GigaYeast|White Labs|Wyeast|Lallemand|Fermentis|Omega|Imperial|Mangrove Jack)\b/i.exec(
            primary
          )?.[1];
        const strain = /\b(WLP\d+|GY\d+|WY\d{4}|US-?05|BE-?256|S-?\d{2}|K-?97)\b/i.exec(primary)?.[1];
        const form: YeastSpec['form'] = /liquid|liquide|starter|slurry/i.test(line)
          ? 'liquide'
          : 'sèche';

        /*
         * Le nom commercial d'une levure vit souvent entre parenthèses :
         * « GigaYeast GY054 (Vermont IPA) ». `cleanName` retire les parenthèses
         * — utile pour les conversions d'unités, néfaste ici. On récupère donc
         * le premier groupe purement textuel comme nom, et on retire le
         * laboratoire et la souche du reste : sans ça, l'affichage rendait
         * « GigaYeast GigaYeast GY054 · GY054 ».
         */
        const parenName = /\(([^)\d]{3,40})\)/.exec(primary)?.[1]?.trim();
        const stripped = cleanName(primary, [
          /\byeast\b/gi,
          /\blevure\b/gi,
          ...(lab ? [new RegExp(lab.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi')] : []),
          ...(strain ? [new RegExp(strain.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi')] : [])
        ]);

        yeast = {
          name: parenName || stripped || strain || '',
          lab,
          strain,
          form,
          qty: 1,
          unit: form === 'liquide' ? 'flacon' : 'sachet',
          pitchTempC: tempC(line) ?? undefined,
          notes: alternatives.length
            ? `Équivalence proposée par la recette : ${alternatives.join(' / ').trim()}`
            : undefined
        };
        return;
      }

      /*
       * Houblon — reconnu au mot, à l'AAU, au moment d'ajout… ou à son alpha.
       *
       * ⚠️ Ces deux premières règles sont anglophones. Une recette écrite en
       * français — « 40 g Magnum (60 min) à 12 % AA » — n'en déclenchait
       * aucune : le houblon disparaissait purement et simplement de l'import.
       * Deux marques lèvent le doute sans rien deviner : SEUL un houblon se
       * décrit en pourcentage d'acides alpha, et dans une liste d'ingrédients
       * seul un houblon porte une durée d'ébullition entre parenthèses.
       */
      const hasAlpha = new RegExp(String.raw`(${NUM})\s*%\s*(?:alpha|AA\b)`, 'i').test(line);
      const hasBoilTime = /\(\s*\d+\s*(?:min|minutes?)\b/i.test(line);
      const looksLikeHop =
        /\bhops?\b|\bhoublons?\b|\bAAU\b/i.test(line) ||
        /\b(dry hop|hop stand|whirlpool|first wort)\b/i.test(lower) ||
        /houblonnage|à cru|am[ée]risant|aromatique/i.test(lower) ||
        hasAlpha ||
        (hasBoilTime && !ADJUNCT_LINE.test(lower));

      if (looksLikeHop && !/\bmalt\b|\bgrain\b/i.test(lower)) {
        const weightG = massG(line);
        if (weightG === null) {
          warnings.push(`Poids illisible : « ${line} »`);
          return;
        }
        const { stage, timeMin, dayOffset } = hopStage(line);
        const alpha = toNumber(
          new RegExp(String.raw`(${NUM})\s*%\s*(?:alpha|AA\b)`, 'i').exec(line)?.[1] ??
            new RegExp(String.raw`at\s*(${NUM})\s*%`, 'i').exec(line)?.[1]
        );
        const hopName = cleanName(line, [
          /\b(dry hop|hop stand|whirlpool|first wort hop|first wort|boil)\b/gi,
          /\bat\b/gi,
          /\balpha acids?\b/gi,
          new RegExp(String.raw`${NUM}\s*%`, 'g'),
          /\bmin\b\.?/gi
        ]);

        if (!hopName) {
          warnings.push(`Nom de houblon illisible : « ${line} »`);
          return;
        }
        /*
         * L'avertissement d'alpha manquant n'est PAS émis ici : le même houblon
         * peut porter son alpha sur une autre ligne, et le report a lieu plus
         * bas. Prévenir maintenant produisait « Alpha absent pour Amarillo »
         * alors que la recette le donnait deux lignes plus haut.
         */

        hops.push({
          name: hopName,
          // 0 signale explicitement « inconnu » : `hopIbu` ne compte alors rien,
          // plutôt que d'attribuer une amertume qui n'a pas été mesurée.
          alpha: alpha ?? 0,
          weightG: Math.round(weightG),
          stage,
          ...(timeMin !== undefined ? { timeMin } : {}),
          ...(dayOffset !== undefined ? { dayOffset } : {})
        });
        return;
      }

      // Malt et céréales.
      if (/\bmalt|grain|flaked|floconn?|orge|bl[ée]|avoine|wheat|oats?|rye|seigle|pils|cara|munich|vienna|golden promise|2-?row|marris|maris\b/i.test(lower)) {
        const weightG = massG(line);
        if (weightG === null) return;
        const maltName = cleanName(line);
        if (!maltName) {
          warnings.push(`Nom de malt illisible : « ${line} »`);
          return;
        }
        malts.push({ name: maltName, weightKg: Math.round(weightG) / 1000 });
        return;
      }

      // Additifs : sucres, lactose, clarifiants, épices, fruits.
      if (ADJUNCT_LINE.test(lower)) {
        const g = massG(line);
        const ml = new RegExp(String.raw`(${NUM})\s*(?:mL|ml)\b`).exec(line);
        /*
         * ⚠️ « 3⁄4 cup corn sugar » : le sucre de réamorçage se dose en tasses,
         * les sels en cuillères à café. `massG` ne lit ni l'un ni l'autre, et la
         * ligne disparaissait SANS un mot — on retrouvait une recette sans sucre
         * de réamorçage.
         *
         * On garde la mesure DANS SON UNITÉ. Convertir une tasse en grammes
         * suppose une densité de tassement qu'on ne connaît pas : ce serait
         * exactement le chiffre crédible et faux que ce fichier s'interdit.
         */
        const spoon = new RegExp(
          String.raw`(\d+\s*[⁄/]\s*\d+|${NUM})\s*(cups?|tsp|tbsp|cuill[èe]res?)\b`,
          'i'
        ).exec(line);
        const amount = g ?? toNumber(ml?.[1]) ?? (spoon ? readFraction(spoon[1]) : null);
        const adjName = cleanName(line);
        if (amount === null || !adjName) {
          warnings.push(`Additif non chiffré : « ${line} » — à saisir à la main.`);
          return;
        }
        adjuncts.push({
          name: adjName,
          amount: Math.round(amount * 100) / 100,
          unit: g !== null ? 'g' : ml ? 'mL' : (spoon?.[2] ?? 'g').toLowerCase(),
          step: /ferment|secondaire|priming|embouteillage/i.test(lower)
            ? 'Fermenteur'
            : /whirlpool|flame ?out/i.test(lower)
              ? 'Whirlpool'
              : /mash|empattage|emp[âa]tage/i.test(lower)
                ? 'Empattage'
                : 'Ébullition'
        });
      }
    });

    // --- Empâtage et fermentation, lus dans le déroulé ----------------------
    const mashSteps: TempStep[] = [];
    const fermentation: FermentationStep[] = [];

    if (instructions) {
      // On raisonne PHRASE par phrase plutôt qu'avec une expression qui
      // traverse tout le paragraphe : « mash in … at 67 °C … for 60 minutes »
      // et « raise … to 76 °C to mashout » sont deux phrases distinctes, et une
      // expression gloutonne les confondait.
      const sentences = splitSentences(instructions);

      sentences.forEach((sentence) => {
        const lower = sentence.toLowerCase();
        const t = tempC(sentence);
        if (t === null) return;

        const minutes = toNumber(
          new RegExp(String.raw`(${NUM})\s*(?:min|minutes?)`, 'i').exec(sentence)?.[1]
        );

        if (/\bmash ?out\b/.test(lower)) {
          /*
           * ⚠️ `?? 10` : dix minutes de mashout sortaient de nulle part quand la
           * recette n'en donnait pas — précisément la valeur crédible et fausse
           * que l'en-tête de ce fichier s'interdit. Zéro se voit et se corrige.
           */
          mashSteps.push({ name: 'Mashout', tempC: t, durationMin: minutes ?? 0 });
          if (minutes === null) warnings.push('Durée du mashout absente — à saisir.');
        } else if (/\bmash in\b|\bempât|\bempat/.test(lower) && minutes !== null) {
          mashSteps.push({ name: 'Empâtage', tempC: t, durationMin: minutes });
        } else if (/\bsparge\b|\brin[cç]age\b/.test(lower)) {
          mashSteps.push({ name: 'Rinçage', tempC: t, durationMin: minutes ?? 0 });
        } else if (/ferment/.test(lower) && fermentation.length === 0) {
          const days = toNumber(
            new RegExp(String.raw`(${NUM})\s*(?:days?|jours?)`, 'i').exec(sentence)?.[1]
          );
          fermentation.push({ kind: 'primaire', name: 'Fermentation primaire', tempC: t, days: days ?? 0 });
        }
      });

      /*
       * ⚠️ LE HOP STAND. Sur une NEIPA, c'est la moitié de l'arôme — et il se
       * perdait entièrement. Le moment est écrit sur la ligne d'ingrédient
       * (« (hop stand) »), mais sa TEMPÉRATURE et sa DURÉE vivent dans le
       * déroulé, deux paragraphes plus bas : « allow to cool to 180 °F (82 °C)
       * then add the hop stand hops. Allow to stand for 20 minutes ». Sans les
       * deux, l'IBU du whirlpool ne se calcule pas.
       */
      const standSentence = sentences.find((x) => /hop ?stand|whirlpool/i.test(x));
      const whirlpoolTempC = standSentence ? tempC(standSentence) : null;
      const standMin = toNumber(
        new RegExp(String.raw`stand(?:\s+for)?\s*(${NUM})\s*(?:min|minutes?)`, 'i').exec(
          instructions
        )?.[1] ??
          new RegExp(String.raw`whirlpool[^.]*?(${NUM})\s*(?:min|minutes?)`, 'i').exec(
            instructions
          )?.[1]
      );

      hops.forEach((h) => {
        if (h.stage !== 'whirlpool') return;
        if (h.tempC === undefined && whirlpoolTempC !== null) h.tempC = whirlpoolTempC;
        if (h.timeMin === undefined && standMin !== null) h.timeMin = standMin;
      });

      /*
       * ⚠️ L'ALPHA D'UN MÊME HOUBLON. « 1.5 oz Amarillo at 8.6% alpha » puis
       * « 1.5 oz Amarillo (0 min.) » : c'est le MÊME sachet, et le second ajout
       * repartait à zéro d'amertume. Reporter l'alpha d'un houblon sur lui-même
       * n'invente rien — la recette l'a écrit, une ligne plus haut.
       */
      const alphaByHop = new Map<string, number>();
      hops.forEach((h) => {
        if (h.alpha > 0) alphaByHop.set(h.name.toLowerCase(), h.alpha);
      });
      hops.forEach((h) => {
        const known = alphaByHop.get(h.name.toLowerCase());
        if (!h.alpha && known) h.alpha = known;
      });
    }

    /*
     * Volumes du déroulé. Ils ne remplacent pas le volume de brassin : l'eau
     * d'empâtage et le moût d'avant-ébullition sont deux grandeurs distinctes,
     * et c'est précisément parce qu'on les confondait qu'un rendement se
     * calculait sur le mauvais chiffre.
     */
    const sentenceOf = (re: RegExp) =>
      splitSentences(instructions).find((x) => re.test(x.toLowerCase())) ?? null;

    const mashSentence = sentenceOf(/\bmash in\b|\bempât|\bempat/);
    const mashWaterL = mashSentence ? volumeL(mashSentence) : null;

    // « until X L collected » ou « avant ébullition » = moût avant ébullition (preBoil)
    const collectSentence = sentenceOf(
      /\bcollect|\buntil\b.*(?:collect|wort)|\bmo[uû]t collect[ée]|\bavant [ée]bullition|\bpre-?boil\b/
    );
    const preBoilL = collectSentence ? volumeL(collectSentence) : null;

    // « rinçage » ou « sparge » = eau de rinçage proprement dite (distincte de la collecte de moût)
    const spargeSentence =
      splitSentences(instructions).find((x) => {
        const lower = x.toLowerCase();
        return (
          /\bsparge\b|\brin[cç]age\b|\brincer\b/.test(lower) &&
          !/\buntil\b.*(?:collect|wort)|\bmo[uû]t collect[ée]|\bavant [ée]bullition|\bpre-?boil\b/.test(
            lower
          )
        );
      }) ?? null;
    const spargeWaterL = spargeSentence ? volumeL(spargeSentence) : null;

    const carboVolumes = toNumber(
      new RegExp(String.raw`(${NUM})\s*(?:volumes?|vol\.?)\b`, 'i').exec(instructions)?.[1]
    );

    /*
     * Le traitement d'eau, recopié MOT POUR MOT.
     *
     * ⚠️ On ne le convertit pas en doses de sels. « 3⁄4 tsp. calcium chloride »
     * pèse entre 3 et 5 g selon le sel et son tassement : l'atelier de l'eau
     * raisonne au dixième de gramme, et une cuillère traduite au jugé y
     * entrerait comme une mesure. On donne donc à lire ce que la recette dit, et
     * Gaëtan dose lui-même.
     */
    const waterSentences = splitSentences(instructions)
      .filter((x) =>
        /reverse osmosis|\bRO water\b|osmos|phosphoric|lactic|acide? (?:phosphorique|lactique)|calcium (?:chloride|sulfate)|cacl|caso4|gypsum|gypse|\bpH\b/i.test(
          x
        )
      )
      .map((x) => x.trim());
    const waterNote = waterSentences.length ? waterSentences.join(' ') : null;

    /*
     * Le calendrier de houblonnage à cru est de la PROSE : « divide into three
     * equal portions … after two days of active fermentation … at the end of
     * fermentation … three days after fermentation ends ». En tirer des jours
     * numériques demanderait de connaître la durée de fermentation, que la
     * recette ne donne pas. On le recopie, et on le signale.
     */
    const dryHopSentences = splitSentences(instructions).filter((x) =>
      /dry ?hop|à cru|portion/i.test(x)
    );
    const dryHopNote = dryHopSentences.length ? dryHopSentences.join(' ') : null;

    if (dryHopNote && hops.some((h) => h.stage === 'dryHop' && h.dayOffset === undefined)) {
      warnings.push(
        'Calendrier du houblonnage à cru décrit en toutes lettres — les jours d’ajout restent à fixer.'
      );
    }
    if (hops.some((h) => h.stage === 'whirlpool' && h.tempC === undefined)) {
      warnings.push('Température de hop stand absente — l’IBU du whirlpool sera partiel.');
    }

    /*
     * L'alpha manquant se signale UNE FOIS PAR HOUBLON, et seulement après le
     * report d'une ligne à l'autre. Le houblonnage à cru en est exempté : il
     * n'apporte pas d'amertume, réclamer son alpha n'a aucun sens.
     */
    const stillWithoutAlpha = [
      ...new Set(hops.filter((h) => h.stage !== 'dryHop' && !h.alpha).map((h) => h.name))
    ];
    if (stillWithoutAlpha.length) {
      warnings.push(
        `Alpha absent : ${stillWithoutAlpha.join(', ')} — l’IBU sera partiel tant qu’il manque.`
      );
    }

    // --- Ce qui manque, dit franchement ------------------------------------
    if (malts.length === 0) warnings.push('Aucun malt reconnu.');
    if (hops.length === 0) warnings.push('Aucun houblon reconnu.');
    if (!yeast) warnings.push('Aucune levure reconnue.');
    if (volume === null) warnings.push('Volume introuvable — à saisir à la main.');

    return {
      name,
      style: (styleMatch ?? '').trim(),
      volumeL: volume,
      ogTarget: og,
      fgTarget: fg,
      abvTarget: abv,
      ibuTarget: ibu,
      // Les recettes américaines donnent le SRM ; l'EBC vaut 1.97 fois plus.
      colorEbc: ebcDirect ?? (srm !== null ? Math.round(srm * 1.97 * 10) / 10 : null),
      boilMin,
      malts,
      hops,
      adjuncts,
      yeast,
      mashSteps,
      fermentation,
      mashWaterL,
      spargeWaterL,
      preBoilL,
      carboVolumes,
      waterNote,
      dryHopNote,
      instructions,
      rawText: text,
      warnings
    };
  }
};
