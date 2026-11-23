/**
 * Les valeurs d'un lien, dites en français à la suisse (T28-12, T28-13 ; 23.11 soir).
 *
 * Le brasseur lit « 143,5 cm », « 11,4 % », « Acier, MDF », « +2 à +8 °C » : pas « 143.50 cm », « Stahl, MDF » ni « +2 °C bis +8 °C ».
 * Méthode : une table de mots et d'expressions connus (comme `lienLibelles.ts` pour les noms), jamais une traduction automatique qui
 * inventerait un mot ; un mot absent de la table reste tel que la page l'écrit. Les nombres changent d'écriture, jamais de valeur :
 *  - un point décimal devient une virgule (« 143.50 » → « 143,5 ») ;
 *  - un point de milliers (« 1.350 » mm, « 1.760 » kWh/an) disparaît, seulement quand l'unité l'impose (une dimension en mm ne mesure pas
 *    1,35 mm) ; une valeur ambiguë (« 1.500 kg ») reste un décimal : jamais multipliée par mille.
 * Idempotent : repasser sur du français ne change rien.
 */

const cle = (t: string) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/ß/g, 'ss').replace(/[ \s ]+/g, ' ').trim();

/** [clé normalisée, français]. Les expressions les plus longues passent d'abord. La casse de l'initiale suit celle de la page. */
const EXPRESSIONS: ReadonlyArray<readonly [string, string]> = [
  ['kuhlschrank ohne gefrierfach', 'réfrigérateur sans compartiment congélateur'],
  ['kuhlschrank mit gefrierfach', 'réfrigérateur avec compartiment congélateur'],
  ['kuhl-gefrierkombination', 'combiné réfrigérateur-congélateur'],
  ['fresh zone fach', 'compartiment Fresh Zone'],
  ['klappbare glastur', 'porte vitrée rabattable'],
  ['porte vitree rabattable', 'porte vitrée rabattable'],
  ['gastrokuhlschrank', 'réfrigérateur de gastronomie'],
  ['lagerkuhlschrank', 'réfrigérateur de stockage'],
  ['barkuhlschrank', 'réfrigérateur de bar'],
  ['getrankekuhlschrank', 'réfrigérateur à boissons'],
  ['mehrzweckhopfen', 'houblon mixte'],
  ['hopfenpellets', 'pellets'],
  ['typ', 'type'],
  ['aromahopfen', 'houblon aromatique'],
  ['bitterhopfen', 'houblon amérisant'],
  ['normalkuhlung', 'réfrigération normale'],
  ['umluftkuhlung', 'réfrigération à air pulsé'],
  ['umluft', 'air pulsé'],
  ['statische kuhlung', 'froid statique'],
  ['dual purpose', 'houblon mixte'],
  ['stainless steel', 'inox'],
  ['rostfreier stahl', 'inox'],
  ['glastur', 'porte vitrée'],
  ['volltur', 'porte pleine'],
  ['edelstahl', 'inox'],
  ['kunststoff', 'plastique'],
  ['aluminium', 'aluminium'],
  ['stahl', 'acier'],
  ['steel', 'acier'],
  ['holz', 'bois'],
  ['glas', 'verre'],
  ['kupfer', 'cuivre'],
  ['silikon', 'silicone'],
  ['silicone', 'silicone'],
  ['schwarz', 'noir'],
  ['weiss', 'blanc'],
  ['grau', 'gris'],
  ['silber', 'argent'],
  ['rot', 'rouge'],
  ['blau', 'bleu'],
  ['grun', 'vert'],
  ['black', 'noir'],
  ['white', 'blanc'],
  ['silver', 'argent'],
  ['ja', 'oui'],
  ['nein', 'non'],
  ['yes', 'oui']
];
const TABLE_EXPR = new Map(EXPRESSIONS.map(([k, v]) => [k, v] as const));
const LONGUEUR_MAX = Math.max(...EXPRESSIONS.map(([k]) => k.split(' ').length));
const MAJ = (m: string) => m.charAt(0).toUpperCase() + m.slice(1);

/** Remplace, mot à mot puis par expression, ce que la table connaît ; le reste est rendu tel quel. */
function motsFrancais(texte: string): string {
  const jetons = texte.split(/([A-Za-zÀ-ÿß]+(?:[- ][A-Za-zÀ-ÿß]+)*)/);
  return jetons.map((seg) => {
    if (!/^[A-Za-zÀ-ÿß]/.test(seg)) return seg;
    const mots = seg.split(/(?=[- ])|(?<=[- ])/).filter(Boolean);
    const sortie: string[] = [];
    for (let i = 0; i < mots.length;) {
      if (/^[- ]$/.test(mots[i])) { sortie.push(mots[i]); i++; continue; }
      let pris = 0;
      for (let n = Math.min(LONGUEUR_MAX * 2 - 1, mots.length - i); n >= 1 && !pris; n--) {
        const essai = mots.slice(i, i + n).join('').replace(/^[- ]+|[- ]+$/g, '');
        const fr = TABLE_EXPR.get(cle(essai));
        if (fr && cle(essai) !== cle(fr)) {
          /* la majuscule de la page se garde en tête de valeur seulement (« Pellets type 90 », pas « PelletsType ») ; la fin du groupe (espace, tiret) n'est pas mangée */
          const reste = mots.slice(i, i + n).join('').match(/[- ]+$/)?.[0] ?? '';
          sortie.push((i === 0 && /^[A-ZÀ-ß]/.test(essai) && fr !== 'oui' && fr !== 'non' ? MAJ(fr) : fr) + reste);
          pris = n;
        }
      }
      if (pris) i += pris; else { sortie.push(mots[i]); i++; }
    }
    return sortie.join('');
  }).join('');
}

/** Les unités après lesquelles « 1.350 » ne peut être qu'un millier (jamais 1,35 mm, 1,76 kWh/an). */
const UNITES_MILLIERS = /^(?:mm|g|w|kwh\/an|kwh\/a|hz|l\/h|m3\/h|m³\/h)$/i;
const unite = (t: string) => t.replace(/^[\s ]+/, '').match(/^[A-Za-z°³\/]+(?:\/[A-Za-z0-9]+)?/)?.[0] ?? '';

/** Une écriture à la suisse de chaque nombre de la valeur : virgule décimale, milliers sans point quand l'unité l'impose. */
export function nombresSuisses(valeur: string, uniteDuNom?: string): string {
  return valeur.replace(/(?<![\d.,'’])(\d+)\.(\d+)(?![\d.])/g, (tout, e: string, d: string, pos: number, entier: string) => {
    const u = unite(entier.slice(pos + tout.length)) || (uniteDuNom ?? '');
    if (d.length === 3 && e.length <= 3 && UNITES_MILLIERS.test(u)) return `${e}${d}`;
    /* « 1.500 kg », « 9.500 Artikel » : un point suivi de trois chiffres est un millier en allemand, un décimal en anglais ; sans unité
       qui tranche, la valeur reste telle que la page l'écrit (jamais multipliée par mille, jamais divisée). */
    if (d.length === 3 && e.length <= 3 && !e.startsWith('0')) return tout;
    const dec = d.replace(/0+$/, '');
    return dec ? `${e},${dec}` : e;
  }).replace(/(?<![\d.,'’])(\d{1,3}(?:\.\d{3}){2,})(?![\d.])/g, (m) => m.replace(/\./g, ''));
}

/** Les unités collées au nombre reçoivent leur espace (« 0,36kW » → « 0,36 kW », « 11,4% » → « 11,4 % »). */
function espaces(t: string): string {
  return t.replace(/(\d)\s*%/g, (_m, c: string) => `${c} %`)
    .replace(/(?<![A-Za-zÀ-ÿ\d.,])(\d+(?:,\d+)?)(?=(?:kWh|kW|kg|mm|cm|dm|ml|dl|cl|dB|Hz|bar|W|V|L|l|g|m)(?![A-Za-zà-ÿ]))/g, (_m, c: string) => `${c} `);
}

/** « +2 °C bis +8 °C » → « +2 à +8 °C ». */
function plage(t: string): string {
  return t.replace(/([+−-]?\d+(?:,\d+)?)\s*°\s?C\s+(?:bis|to)\s+([+−-]?\d+(?:,\d+)?)\s*°\s?C/gi, (_m, a: string, b: string) => `${a} à ${b} °C`)
    .replace(/([+−-]?\d+(?:,\d+)?)\s+(?:bis|to)\s+([+−-]?\d+(?:,\d+)?)\s*°\s?C/gi, (_m, a: string, b: string) => `${a} à ${b} °C`);
}

/** La valeur d'une caractéristique, en français à la suisse. `uniteDuNom` : l'unité que le nom portait (« Largeur en mm »). */
export function valeurFrancaise(valeur: string, uniteDuNom?: string): string {
  const base = valeur.replace(/[   ]+/g, ' ').trim();
  return plage(espaces(nombresSuisses(motsFrancais(base), uniteDuNom)));
}

/** Les unités qu'un nom peut porter (« Poids net en kg », « Volume [Litres] »), et leur écriture. */
const UNITES_DE_NOM: Record<string, string> = {
  mm: 'mm', cm: 'cm', m: 'm', kg: 'kg', g: 'g', l: 'l', liter: 'l', litre: 'l', litres: 'l', volt: 'V', v: 'V', kw: 'kW', w: 'W',
  'kwh/an': 'kWh/an', 'kwh/a': 'kWh/an', 'c': '°C', '°c': '°C'
};
export const uniteNormalisee = (u: string): string | undefined => UNITES_DE_NOM[cle(u).replace(/\s/g, '')];

/** Un nom qui porte son unité : « Poids net en kg », « Largeur in mm », « Volume [Litres] », « Consommation annuelle (kWh/an) ». */
export function nomEtUnite(nom: string): { base: string; unite: string } | null {
  const fin = nom.match(/^(.*?)\s+(?:en|in)\s+(mm|cm|m|kg|g|volt|kw|w|l|litres?|liter|°\s?c)$/i)
    ?? nom.match(/^(.*?)\s*[\[(]\s*(litres?|liter|l|mm|cm|kg|g|kw|w|volt|kwh\/a(?:n)?|°\s?c)\s*[\])]$/i);
  if (!fin || !fin[1].trim()) return null;
  const u = uniteNormalisee(fin[2].replace(/\s/g, ''));
  return u ? { base: fin[1].trim(), unite: u } : null;
}

/** Un nombre seul (« 82 », « 2.010 », « 0,26 »), sans unité : la valeur d'un nom qui porte son unité. */
export const nombreSeul = (v: string) => /^\d[\d.,'’  ]*$/.test(v.trim());

/** Un montant dit à la suisse : « 72,50 » (deux décimales dès qu'il y en a), « 1 690 » (entier, milliers séparés par une espace). */
export function montantDit(n: number): string {
  if (!Number.isFinite(n)) return '';
  const [e, d] = Math.abs(n).toFixed(Number.isInteger(n) ? 0 : 2).split('.');
  return `${n < 0 ? '−' : ''}${e.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')}${d ? `,${d}` : ''}`;
}
