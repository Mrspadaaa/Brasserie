/**
 * Conversion d'unités pour les mouvements de stock.
 *
 * Contexte : une recette exprime les houblons en grammes alors que l'article
 * en stock peut être tenu en `g` OU en `kg`. Deux chemins de code faisaient
 * jusqu'ici la conversion différemment (l'un déduisait `weightG`, l'autre
 * `weightG / 1000` du MÊME stock en grammes), ce qui déstockait 1000 fois trop
 * peu. Toute conversion doit désormais passer par ici.
 */

export type UnitFamily = 'masse' | 'volume' | 'piece';

/** Facteur vers l'unité de base de la famille (g pour la masse, mL pour le volume). */
const TO_BASE: Record<string, { family: UnitFamily; factor: number }> = {
  kg: { family: 'masse', factor: 1000 },
  g: { family: 'masse', factor: 1 },
  mg: { family: 'masse', factor: 0.001 },
  l: { family: 'volume', factor: 1000 },
  ml: { family: 'volume', factor: 1 },
  cl: { family: 'volume', factor: 10 },
  dl: { family: 'volume', factor: 100 },

  // Unités américaines — les recettes de brassage circulent massivement en
  // livres, onces et gallons. On les convertit à la lecture ; l'application
  // ne stocke et n'affiche jamais qu'en métrique.
  lb: { family: 'masse', factor: 453.59237 },
  oz: { family: 'masse', factor: 28.349523 },
  gal: { family: 'volume', factor: 3785.411784 }, // gallon US liquide
  qt: { family: 'volume', factor: 946.352946 },
  floz: { family: 'volume', factor: 29.5735295 }
};

/** Écritures rencontrées dans les recettes, ramenées à la clé du tableau. */
const ALIASES: Record<string, string> = {
  lbs: 'lb',
  livre: 'lb',
  livres: 'lb',
  pound: 'lb',
  pounds: 'lb',
  ounce: 'oz',
  ounces: 'oz',
  once: 'oz',
  onces: 'oz',
  gallon: 'gal',
  gallons: 'gal',
  gals: 'gal',
  quart: 'qt',
  quarts: 'qt',
  'fl oz': 'floz',
  'fl. oz': 'floz',
  'fl.oz': 'floz'
};

function normalizeKey(unit: string): string {
  const k = (unit || '').trim().toLowerCase().replace('litre', 'l');
  return ALIASES[k] ?? k;
}

export const Units = {
  familyOf(unit: string): UnitFamily {
    return TO_BASE[normalizeKey(unit)]?.family ?? 'piece';
  },

  /** Deux unités sont-elles convertibles entre elles ? */
  areCompatible(from: string, to: string): boolean {
    const a = TO_BASE[normalizeKey(from)];
    const b = TO_BASE[normalizeKey(to)];
    // Unités « à la pièce » (sachet, boîte, rouleau, bouteille…) : compatibles
    // seulement si c'est littéralement la même unité.
    if (!a || !b) return normalizeKey(from) === normalizeKey(to);
    return a.family === b.family;
  },

  /**
   * Convertit une quantité d'une unité vers une autre.
   * Renvoie `null` si la conversion n'a pas de sens (ex. `sachet` ➔ `kg`) :
   * l'appelant doit alors refuser le mouvement plutôt que de deviner.
   */
  convert(qty: number, from: string, to: string): number | null {
    const fromKey = normalizeKey(from);
    const toKey = normalizeKey(to);
    if (fromKey === toKey) return qty;

    const a = TO_BASE[fromKey];
    const b = TO_BASE[toKey];
    if (!a || !b || a.family !== b.family) return null;

    return (qty * a.factor) / b.factor;
  },

  /**
   * Convertit vers l'unité de stock, en repliant sur la quantité brute si la
   * conversion est impossible — utile pour l'affichage, JAMAIS pour un
   * mouvement de stock (utilise `convert` et gère le `null`).
   */
  convertOrSame(qty: number, from: string, to: string): number {
    const converted = this.convert(qty, from, to);
    return converted === null ? qty : converted;
  },

  /** Arrondi métier : 3 décimales pour les grammes, 2 sinon. */
  round(qty: number, unit: string): number {
    const key = normalizeKey(unit);
    const decimals = key === 'kg' || key === 'l' ? 3 : 2;
    const f = Math.pow(10, decimals);
    return Math.round(qty * f) / f;
  },

  /** Pas de stepper adapté à l'unité, pour la saisie tactile. */
  stepFor(unit: string): number {
    return this.stepLadder(unit)[0];
  },

  /**
   * Échelle de trois paliers pour l'unité, pensée pour le métier de brasseur.
   *
   * Houblons : +1 g (fin), +5 g (courant), +25 g (dose hop stand / dry hop).
   * Malts : +0.1 kg (spéciaux), +0.5 kg (courant), +1 kg (base).
   * Sels & Acides : +0.5 g/mL, +1 g/mL, +5 g/mL.
   */
  stepLadder(unit: string, categoryOrContext?: string): [number, number, number] {
    const ctx = (categoryOrContext || '').toLowerCase();
    const key = normalizeKey(unit);

    if (key === 'g') {
      if (ctx.includes('houblon') || ctx.includes('hop') || ctx === 'recipe') {
        return [1, 5, 25];
      }
      if (ctx.includes('sel') || ctx.includes('salt') || ctx.includes('eau') || ctx.includes('mineral')) {
        return [0.5, 1, 5];
      }
      return [25, 100, 500];
    }

    if (key === 'kg') {
      if (ctx === 'recipe' || ctx.includes('special') || ctx.includes('cereale') || ctx.includes('malt')) {
        return [0.1, 0.5, 1];
      }
      return [0.5, 1, 5];
    }

    switch (key) {
      case 'mg':
        return [10, 50, 250];
      case 'l':
        return [0.5, 1, 5];
      case 'ml':
        return [0.5, 1, 5];
      case 'cl':
      case 'dl':
        return [1, 5, 10];
      default:
        // sachet, boîte, bouteille, capsule, étiquette, rouleau, pastille…
        return [1, 6, 24];
    }
  },

  /** Affichage compact : 1500 g ➔ « 1.5 kg », 0.25 kg ➔ « 250 g ». */
  format(qty: number, unit: string): string {
    if (!Number.isFinite(qty)) return `— ${unit}`;
    const number = (value: number) => String(value).replace('.', ',');
    const key = normalizeKey(unit);
    if (key === 'g' && Math.abs(qty) >= 1000) {
      return `${number(this.round(qty / 1000, 'kg'))} kg`;
    }
    if (key === 'kg' && Math.abs(qty) > 0 && Math.abs(qty) < 1) {
      return `${number(this.round(qty * 1000, 'g'))} g`;
    }
    return `${number(this.round(qty, unit))} ${unit}`;
  },

  /*
   * Températures. Ce n'est PAS un facteur multiplicatif — l'échelle Fahrenheit
   * a un décalage d'origine —, donc elle ne peut pas rejoindre `TO_BASE` sans
   * fausser toutes les conversions de masse et de volume.
   */

  fToC(f: number): number {
    return Math.round((((f - 32) * 5) / 9) * 10) / 10;
  },

  cToF(c: number): number {
    return Math.round(((c * 9) / 5 + 32) * 10) / 10;
  },

  /**
   * Équivalent américain d'une quantité métrique, pour lecture seulement.
   * Renvoie `null` quand l'unité n'a pas de correspondance utile (les pièces
   * n'en ont pas).
   */
  toUs(qty: number, unit: string): { qty: number; unit: string } | null {
    const family = this.familyOf(unit);
    if (family === 'masse') {
      const g = this.convert(qty, unit, 'g');
      if (g === null) return null;
      // En dessous de 400 g on lit en onces ; au-delà, en livres.
      return g < 400
        ? { qty: Math.round((g / 28.349523) * 10) / 10, unit: 'oz' }
        : { qty: Math.round((g / 453.59237) * 100) / 100, unit: 'lb' };
    }
    if (family === 'volume') {
      const ml = this.convert(qty, unit, 'mL');
      if (ml === null) return null;
      return { qty: Math.round((ml / 3785.411784) * 100) / 100, unit: 'gal' };
    }
    return null;
  },

  /**
   * « 4.1 kg (9 lb) » — le métrique fait foi, l'américain sert de repère pour
   * recouper une recette trouvée sur un site anglophone.
   */
  formatDual(qty: number, unit: string): string {
    const metric = this.format(qty, unit);
    const us = this.toUs(qty, unit);
    return us && Number.isFinite(us.qty) ? `${metric} (${String(us.qty).replace('.', ',')} ${us.unit})` : metric;
  }
};
