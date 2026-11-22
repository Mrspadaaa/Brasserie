// D275 : les options imprimées dans le nom d'une ligne lue (état du malt, supplément, mélange…), lues, traduites en français et sorties du nom.
// Module pur : aucun React, aucun service, aucun réseau. Il ne recalcule aucun prix (le supplément est déjà compris dans le prix unitaire lu)
// et ne devine jamais un état : « concassé » ou « grain entier » n'existent que si un mot de la pièce le dit (allemand, anglais, français, italien).
//
// Cas de la commande en ligne (doc14) : nom « CARABELGE®, Kg », variante « Mischung: Einzelprodukt, Schrotung: geschrotet [+CHF 0.10] »
//  → base « CARABELGE® », état concassé, supplément 0,10 CHF, aucune autre option. L'état du malt n'est pas un produit : il ne crée pas d'article.

export interface EtatLu { cle: 'concasse' | 'grain'; texte: 'concassé' | 'grain entier' }
export interface SupplementLu { montant: number; devise: string }
export interface OptionLue { cle: string; texte: string }
export interface OptionsLues {
  /** Le nom propre de la ligne : sans options, sans le suffixe d'unité qui double la colonne. Marque et reste du nom tels qu'imprimés. */
  base: string;
  /** Le suffixe d'unité retiré du nom QUAND la colonne d'unité est vide (« Kg », « 1 Kg », tel qu'imprimé) : l'unité n'est pas devinée, mais ce qui était imprimé n'est pas perdu. */
  uniteDuNom?: string;
  /** L'état du produit, seulement s'il est imprimé (et sans contradiction). */
  etat?: EtatLu;
  /** Le supplément par unité imprimé ; déjà compris dans le prix unitaire lu. */
  supplement?: SupplementLu;
  /** La clé de l'option qui porte le supplément (« concasse » pour « Schrotung: geschrotet [+CHF 0.10] »), si on la connaît. */
  supplementPour?: string;
  /** Les autres options comprises, en français. */
  options: OptionLue[];
  /** Ce qui n'est pas compris, tel qu'imprimé : rien ne se perd. */
  restes: string[];
}

const ETAT_CONCASSE: EtatLu = { cle: 'concasse', texte: 'concassé' };
const ETAT_GRAIN: EtatLu = { cle: 'grain', texte: 'grain entier' };

// Les noms de champ connus (regex en minuscules/accents tolérés). Une clé suivie de « : » ouvre une option.
const K_MOUTURE = String.raw`schrotung|schrot|mahlung|mahlgrad|crush(?:ing)?|grind(?:ing)?|milling|mouture|macinatura|macinazione|molitura`;
const K_MELANGE = String.raw`mischung|mixtur|mixture|mix|m[ée]lange|miscela`;
const K_COULEUR = String.raw`farbe|colou?r|couleur|colore`;
const K_TAILLE = String.raw`gr(?:ö|oe|o)(?:ß|ss)e|size|taille|misura|grandezza`;
const K_POIDS = String.raw`gewicht|weight|poids|peso`;
const K_RECOLTE = String.raw`erntejahr|ernte|crop|r[ée]colte|raccolto|jahrgang|vintage|mill[ée]sime|annata`;
const TOUTES = [K_MOUTURE, K_MELANGE, K_COULEUR, K_TAILLE, K_POIDS, K_RECOLTE].join('|');
const AVANT = String.raw`(?<![\p{L}\p{N}])`;
const CUT_RE = new RegExp(String.raw`${AVANT}(?:${TOUTES})\s*:`, 'iu');
const SPLIT_RE = new RegExp(String.raw`\n|;|·|\||\s\/\s|,(?!\d)|(?=${AVANT}(?:${TOUTES})\s*:)`, 'iu');
const CLE_RE = new RegExp(String.raw`^(?:(${K_MOUTURE})|(${K_MELANGE})|(${K_COULEUR})|(${K_TAILLE})|(${K_POIDS})|(${K_RECOLTE}))(?![\p{L}\p{N}])\s*:?\s*(.*)$`, 'iu');
const AUTRES: Array<[string, string]> = [['couleur', 'couleur'], ['taille', 'taille'], ['poids', 'poids'], ['recolte', 'récolte']];

const plat = (s: string) => s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();

// ─── L'état du produit ────────────────────────────────────────────────────────
// Les mots de l'état, comparés sans accent ni casse ni ponctuation. La négation passe d'abord : « ungeschrotet » ne finit jamais « concassé ».
const GRAIN_RE = /^(?:un(?:geschrotet\w*|gemahlen\w*|crushed|milled|ground)|nicht (?:fein |grob )?(?:geschrotet\w*|gemahlen\w*)|not (?:crushed|milled|ground)|non[ ]?(?:concasse\w*|moulu\w*|macinat\w*|frantumat\w*)|whole(?: grain| malt)?|ganz\w*(?: korn| koerner)?|grains? entiers?|entiers?|inter[oai]|in grani|sans mouture)$/;
const CONCASSE_RE = /^(?:(fein|fine|fin|grob|coarse|gros) )?(?:geschrotet\w*|gemahlen\w*|crushed|milled|ground|cracked|concasse\w*|moulu\w*|macinat\w*|frantumat\w*)(?: malt)?$/;
const FINESSE: Record<string, string> = { fein: 'fin', fine: 'fin', fin: 'fin', grob: 'gros', coarse: 'gros', gros: 'gros' };

function lireEtat(valeur: string): { etat: EtatLu; finesse?: string } | null {
  const v = plat(valeur);
  if (!v) return null;
  if (GRAIN_RE.test(v)) return { etat: ETAT_GRAIN };
  const m = CONCASSE_RE.exec(v);
  return m ? { etat: ETAT_CONCASSE, ...(m[1] ? { finesse: FINESSE[m[1]] } : {}) } : null;
}

// ─── Le supplément « [+CHF 0.10] » ────────────────────────────────────────────
const MONNAIE = String.raw`[A-Za-z]{3}|€|\$|Fr\.?`;
const NOMBRE = String.raw`\d+(?:[.,]\d+)?`;
const SUPP_RE = new RegExp(String.raw`[\[(]\s*(?:\+\s*)?(?:(${MONNAIE})\s*(?:\+\s*)?(${NOMBRE})|(${NOMBRE})\s*(${MONNAIE}))\s*[\])]`);
const DEVISES: Record<string, string> = { '€': 'EUR', '$': 'USD', 'FR': 'CHF', 'FR.': 'CHF' };

function lireSupplement(brut: string): { reste: string; supplement?: SupplementLu } {
  const m = SUPP_RE.exec(brut);
  if (!m) return { reste: brut };
  const montant = Number((m[2] ?? m[3]).replace(',', '.'));
  const monnaie = (m[1] ?? m[4]).toUpperCase();
  if (!Number.isFinite(montant)) return { reste: brut };
  return { reste: (brut.slice(0, m.index) + ' ' + brut.slice(m.index + m[0].length)).replace(/\s{2,}/g, ' ').trim(), supplement: { montant, devise: DEVISES[monnaie] ?? monnaie } };
}

// ─── Les morceaux ─────────────────────────────────────────────────────────────
const SEUL_RE = /^(?:einzelprodukt|einzeln\w*|single(?: product)?|produit (?:seul|unique|simple)|prodotto (?:singolo|unico|semplice)|singolo|seul|unique)$/;
type Analyse =
  | { genre: 'rien'; supplement?: SupplementLu }
  | { genre: 'etat'; etat: EtatLu; finesse?: string; supplement?: SupplementLu }
  | { genre: 'option'; option: OptionLue; supplement?: SupplementLu };

/** Un morceau (« Schrotung: geschrotet [+CHF 0.10] », « geschrotet », « Mischung: Einzelprodukt »…), ou null s'il n'est pas compris. */
function analyser(brut: string): Analyse | null {
  const { reste, supplement } = lireSupplement(brut.trim());
  const t = reste.replace(/^[\s,;·|\-–:]+|[\s,;·|\-–:]+$/g, '');
  const avec = supplement ? { supplement } : {};
  if (!t) return supplement ? { genre: 'rien', ...avec } : null;
  const cle = CLE_RE.exec(t);
  if (cle) {
    const valeur = (cle[7] ?? '').trim();
    if (!valeur) return null;
    if (cle[1]) { const e = lireEtat(valeur); return e ? { genre: 'etat', ...e, ...avec } : null; }
    if (cle[2]) return SEUL_RE.test(plat(valeur)) ? { genre: 'rien', ...avec } : { genre: 'option', option: { cle: 'melange', texte: `mélange : ${valeur}` }, ...avec };
    const i = [3, 4, 5, 6].find(n => cle[n]);
    const [c, libelle] = AUTRES[(i ?? 3) - 3];
    return { genre: 'option', option: { cle: c, texte: `${libelle} : ${valeur}` }, ...avec };
  }
  const e = lireEtat(t);
  return e ? { genre: 'etat', ...e, ...avec } : null;
}

// ─── Le suffixe d'unité qui double la colonne ────────────────────────────────
const UNITES: Array<[string, string]> = [
  ['kg', 'kg|kilo|kilos|kilogramm|kilogramme|kilogrammes|kilogram|kilograms|chilo|chilogrammo|chilogrammi'],
  ['g', 'g|gr|gramm|gramme|grammes|gram|grams|grammo|grammi'],
  ['l', 'l|lt|liter|litre|litres|litri|litro'],
  ['ml', 'ml|milliliter|millilitre'], ['cl', 'cl|zentiliter|centilitre'], ['dl', 'dl|deziliter|decilitre'],
  ['stk', 'stk|stuck|stueck|st|pce|pc|pcs|piece|pieces|pezzo|pezzi'],
  ['pck', 'pck|pack|packung|paquet|pk'],
];
const groupeUnite = (u: string): string | undefined => { const n = plat(u); return UNITES.find(([, mots]) => new RegExp(`^(?:${mots})$`).test(n))?.[0]; };
const mots = (g: string) => UNITES.find(([k]) => k === g)![1];

/** Le groupe d'unité d'un morceau qui n'est que « Kg », « Gramm » ou « 1 Kg » (un seul de l'unité, jamais « 5 Kg » : c'est une contenance). */
function groupeDuMorceau(morceau: string): string | undefined {
  const sansAccent = morceau.trim().normalize('NFD').replace(/\p{Diacritic}/gu, '');
  return UNITES.find(([g]) => new RegExp(String.raw`^(?:1(?:[.,]0+)?\s*)?(?:${mots(g)})\.?$`, 'i').test(sansAccent))?.[0];
}
/** Le suffixe « 1 Kg » collé au bout d'un nom sans virgule (« Laktose 1 Kg »), s'il y en a un. */
function suffixeFinal(nom: string): { groupe: string; debut: number; texte: string } | undefined {
  for (const [g] of UNITES) {
    const m = new RegExp(String.raw`\s+(1(?:[.,]0+)?\s*(?:${mots(g)})\.?)$`, 'i').exec(nom);
    if (m) return { groupe: g, debut: m.index, texte: m[1] };
  }
  return undefined;
}

// ─── Le nom ───────────────────────────────────────────────────────────────────
export function lireOptions(nom: string, variante: string | undefined, unite: string): OptionsLues {
  const groupe = groupeUnite(unite ?? '');
  const etats: Array<{ etat: EtatLu; brut: string }> = [];
  const options: OptionLue[] = [];
  const restes: string[] = [];
  let supplement: SupplementLu | undefined;
  let supplementPour: string | undefined;
  const nomPlat = plat(nom ?? '');

  const prendre = (brut: string, a: Analyse) => {
    if (a.genre === 'etat') {
      etats.push({ etat: a.etat, brut: brut.trim() });
      if (a.finesse) ajouter({ cle: 'finesse', texte: a.finesse });
    } else if (a.genre === 'option') ajouter(a.option);
    if (a.supplement) {
      if (!supplement) { supplement = a.supplement; supplementPour = a.genre === 'etat' ? a.etat.cle : a.genre === 'option' ? a.option.cle : undefined; }
      else if (supplement.montant !== a.supplement.montant || supplement.devise !== a.supplement.devise) restes.push(brut.trim());
    }
  };
  const ajouter = (o: OptionLue) => { if (!options.some(x => x.cle === o.cle && x.texte === o.texte)) options.push(o); };
  const decouper = (texte: string) => texte.split(SPLIT_RE).map(s => s.trim()).filter(Boolean);
  const lireListe = (texte: string, dejaDansLeNom: boolean) => {
    for (const morceau of decouper(texte)) {
      const a = analyser(morceau);
      if (a) prendre(morceau, a);
      else if (!(dejaDansLeNom && nomPlat.includes(plat(morceau)))) restes.push(morceau);
    }
  };

  // 1. Le nom : la tête (avant la première clé « Mischung: »…) garde le nom propre ; la queue est une liste d'options.
  const texte = (nom ?? '').trim();
  const cut = CUT_RE.exec(texte);
  const tete = cut ? texte.slice(0, cut.index) : texte;
  const queue = cut ? texte.slice(cut.index) : '';
  const parts = tete.split(/(\n|;|·|\||,(?!\d))/u);
  // Un suffixe d'unité sort du nom s'il dit la même chose que la colonne. Colonne vide (unité illisible, D214) : il sort aussi du nom
  // (sinon l'article neuf s'appellerait « CARABELGE®, Kg ») mais il est rendu dans `uniteDuNom`, rien ne se perd et aucune unité n'est devinée.
  const colonneVide = !(unite ?? '').trim();
  const doubleLaColonne = (g: string | undefined) => !!g && (g === groupe || colonneVide);
  let uniteDuNom: string | undefined;
  let base = (parts[0] ?? '').trim();
  let touche = false;
  for (let i = 2; i < parts.length; i += 2) {
    const morceau = (parts[i] ?? '').trim();
    if (!morceau) continue;
    const g = groupeDuMorceau(morceau);
    if (doubleLaColonne(g)) { if (colonneVide) uniteDuNom ??= morceau; touche = true; continue; }
    const a = analyser(morceau);
    if (a) { prendre(morceau, a); touche = true; continue; }
    base += `${parts[i - 1] === '\n' ? ',' : parts[i - 1]} ${morceau}`;
  }
  const fin = suffixeFinal(base);
  if (fin && doubleLaColonne(fin.groupe)) { if (colonneVide) uniteDuNom ??= fin.texte; base = base.slice(0, fin.debut); touche = true; }
  base = base.replace(/[\s,;·|\-–:]+$/, '').trim() || texte;
  if (!touche && !queue) base = texte; // rien n'a été reconnu : le nom reste exactement tel qu'imprimé (une description sur plusieurs lignes, par exemple)
  if (queue) lireListe(queue, false);

  // 2. La variante : une liste d'options, ou autre chose (couleur, poids, dates) qui reste telle qu'imprimée.
  if (variante && variante.trim()) lireListe(variante, true);

  // 3. L'état : jamais deviné, jamais tranché entre deux mots contraires.
  const cles = new Set(etats.map(e => e.etat.cle));
  let etat: EtatLu | undefined;
  if (cles.size === 1) etat = etats[0].etat;
  else if (cles.size > 1) for (const e of etats) if (!restes.includes(e.brut)) restes.push(e.brut);

  const pourEtat = supplementPour === 'concasse' || supplementPour === 'grain';
  const pour = supplementPour && (!pourEtat || etat) ? { supplementPour } : {};
  return { base, ...(uniteDuNom ? { uniteDuNom } : {}), ...(etat ? { etat } : {}), ...(supplement ? { supplement, ...pour } : {}), options, restes };
}
