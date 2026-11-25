/**
 * CAL-74 (K73-3). Profil à l'ouverture : `largeurTexte` (Courbe, Marque) mesure des centaines de textes au canevas, et celle de la courbe relit
 * `getComputedStyle(document.body)` à chaque appel (un recalcul de style forcé par texte). Un même texte à la même police a la même largeur :
 * mémoïsation bornée, vidée quand les polices finissent de charger (`document.fonts` `loadingdone` : la largeur change alors).
 */
const LIMITE = 4000;
const memoire = new Map<string, number>();
let familleMemo: string | null = null;
let ecoute = false;
const vider = () => { memoire.clear(); familleMemo = null; };

function surveillerPolices(): void {
  if (ecoute || typeof document === 'undefined') return;
  ecoute = true;
  try { (document as Document & { fonts?: { addEventListener?: (t: string, f: () => void) => void } }).fonts?.addEventListener?.('loadingdone', vider); } catch { /* sans polices : rien à vider */ }
}

/** La largeur mémoïsée de (`police`, `texte`) ; `mesurer` ne s'appelle qu'à la première demande. */
export function largeurMemo(police: string, texte: string, mesurer: () => number): number {
  surveillerPolices();
  const cle = `${police}|${texte}`;
  const deja = memoire.get(cle);
  if (deja !== undefined) return deja;
  const v = mesurer();
  if (memoire.size >= LIMITE) memoire.clear();
  memoire.set(cle, v);
  return v;
}

/** Vide la mémoire (essais). */
export function viderLargeurs(): void { vider(); }

/** La famille de police du corps de page, lue une fois par chargement de polices (`getComputedStyle` force un recalcul de style). */
export function familleCorps(defaut = 'sans-serif'): string {
  surveillerPolices();
  if (familleMemo === null) {
    try { familleMemo = getComputedStyle(document.body).fontFamily || defaut; } catch { familleMemo = defaut; }
  }
  return familleMemo;
}
