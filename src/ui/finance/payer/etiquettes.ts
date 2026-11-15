/**
 * La barre de répartition d'un virement (m5pa-d) : une couleur et une étiquette par pièce touchée (FN-3, FN-4 du jeu en ligne du 15.11).
 * Pas de problème d'école ici : une comparaison de mots et un mélange de teintes (CSS `color-mix`).
 */

const SEPARATEURS = /^[—–\-·:;,|/]+$/;
const mots = (nom: string): string[] => nom.trim().split(/\s+/).filter(Boolean);
const cle = (m: string) => m.toLowerCase();
const coupe = (texte: string, max: number) => texte.length > max ? `${texte.slice(0, max - 1).trimEnd()}…` : texte;
const unique = (liste: string[]) => new Set(liste.map(cle)).size === liste.length;

/**
 * Le nom court de chaque pièce, lisible et distinct des autres :
 *   · si les premiers mots suffisent à les distinguer, le premier mot en minuscules, comme la maquette (« loyer ») ;
 *   · sinon, ce qui reste une fois ôté le début commun (« ZZ TEST — pièce A » et « ZZ TEST — pièce B » : « pièce A », « pièce B »), en élargissant
 *     jusqu'à la distinction ;
 *   · deux noms identiques : le nom, puis son rang (« Loyer 1 », « Loyer 2 »).
 */
export function etiquettesPieces(noms: string[]): string[] {
  if (noms.length <= 1) return noms.map(n => (mots(n)[0] ?? 'pièce').toLowerCase());
  const tous = noms.map(mots);
  const premiers = tous.map(m => (m.find(x => !SEPARATEURS.test(x)) ?? 'pièce').toLowerCase());
  if (unique(premiers)) return premiers;

  // Début commun, mot à mot, jusqu'à la première différence (le dernier mot d'un nom ne compte pas : il reste toujours quelque chose à dire).
  let commun = 0;
  const court = Math.min(...tous.map(m => m.length));
  while (commun < court - 1 && tous.every(m => cle(m[commun]) === cle(tous[0][commun]))) commun++;
  // Un séparateur dans le début commun (« ZZ TEST — pièce A ») : ce qui le suit est ce qui nomme la pièce, même si son premier mot est commun.
  const dernierSeparateur = tous[0].slice(0, commun).map(x => SEPARATEURS.test(x)).lastIndexOf(true);
  if (dernierSeparateur >= 0) commun = dernierSeparateur + 1;
  const restes = tous.map(m => {
    const r = m.slice(commun);
    while (r.length > 1 && SEPARATEURS.test(r[0])) r.shift();
    return r;
  });
  for (const k of [2, 4, 99]) {
    const essai = restes.map(r => r.filter(x => !SEPARATEURS.test(x)).slice(0, k).join(' '));
    if (essai.every(Boolean) && unique(essai)) return essai.map(e => coupe(e, 18));
  }
  return noms.map((n, i) => `${coupe(restes[i].join(' ') || n.trim(), 14)} ${i + 1}`);
}

/**
 * Une couleur par pièce : la teinte de sa catégorie (m5pa-d), le rouge d'une pièce en retard ; deux pièces de même teinte (deux « Autres frais ») reçoivent
 * la même teinte éclaircie, puis assombrie, puis éclaircie davantage : elles ne se confondent plus dans la barre.
 */
export function couleursPieces(bases: string[]): string[] {
  const vues = new Map<string, number>();
  const variante = (base: string, rang: number): string => {
    if (rang === 0) return base;
    const [cible, part] = [['white', 58], ['black', 62], ['white', 34], ['black', 40]][(rang - 1) % 4] as [string, number];
    return `color-mix(in srgb, ${base} ${part}%, ${cible})`;
  };
  return bases.map(base => {
    const n = vues.get(base) ?? 0;
    vues.set(base, n + 1);
    return variante(base, n);
  });
}
