// Métriques du banc d'évaluation Substituer / Suggérer (#181, voie e1-banc-eval). Pures : aucune donnée du moteur ici.
// Une observation = un houblon cible et, pour chaque substitut de référence (Beer Maverick), son rang dans le classement du
// moteur (1 = premier ; une valeur fractionnaire est le rang moyen d'un groupe d'ex æquo ; null = absent du classement).

export interface Obs { rangs: (number | null)[] }

/** Part des attendus classés dans les k premiers (rang ≤ k). Un attendu absent compte comme manqué. */
export function rappelA(o: Obs, k: number): number {
  return o.rangs.length ? o.rangs.filter((r) => r !== null && r <= k).length / o.rangs.length : 0;
}
/** Meilleur rang parmi les attendus, ou null si aucun n'est classé. */
export function premierRang(o: Obs): number | null {
  const r = o.rangs.filter((x): x is number => x !== null);
  return r.length ? Math.min(...r) : null;
}
/** Rang réciproque du premier attendu (0 s'il n'est pas classé). */
export const rangReciproque = (o: Obs): number => { const r = premierRang(o); return r === null ? 0 : 1 / r; };
export function mediane(xs: number[]): number | null {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b), k = Math.floor(s.length / 2);
  return s.length % 2 ? s[k] : (s[k - 1] + s[k]) / 2;
}
export const moyenne = (xs: number[]): number | null => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);
export const arrondi = (x: number | null, n = 3): number | null => (x === null ? null : Math.round(x * 10 ** n) / 10 ** n);

export interface Resume {
  /** Houblons évalués. */ n: number;
  /** Moyenne, sur les houblons, de la part des substituts dans les 5 puis 10 premiers. */ rappel5: number | null; rappel10: number | null;
  /** Part des houblons dont au moins un substitut est dans les 10 premiers. */ touche10: number | null;
  /** Médiane du rang du premier substitut, sur les houblons où il est classé. */ rangMedian: number | null;
  /** Moyenne des rangs réciproques du premier substitut (MRR). */ mrr: number | null;
  /** Houblons dont aucun substitut n'est classé. */ sansRang: number;
}
export function resume(obs: Obs[]): Resume {
  const premiers = obs.map(premierRang).filter((x): x is number => x !== null);
  return {
    n: obs.length,
    rappel5: arrondi(moyenne(obs.map((o) => rappelA(o, 5)))), rappel10: arrondi(moyenne(obs.map((o) => rappelA(o, 10)))),
    touche10: arrondi(obs.length ? obs.filter((o) => { const r = premierRang(o); return r !== null && r <= 10; }).length / obs.length : null),
    rangMedian: mediane(premiers), mrr: arrondi(moyenne(obs.map(rangReciproque))), sansRang: obs.length - premiers.length,
  };
}

/** Générateur pseudo-aléatoire déterministe (mulberry32). */
export function mulberry32(graine: number): () => number {
  let a = graine >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
/** Mélange de Fisher-Yates déterministe (copie). */
export function melanger<T>(xs: readonly T[], graine: number): T[] {
  const rnd = mulberry32(graine), a = [...xs];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}
/** Échantillon fixe : les ids triés, mélangés avec la graine, les n premiers. */
export const echantillon = (ids: readonly string[], graine: number, n: number): string[] => melanger([...ids].sort(), graine).slice(0, n);

/** Rang moyen d'un groupe d'ex æquo : `rang` est le premier rang du groupe, `taille` le nombre de membres. */
export const rangMoyenGroupe = (rang: number, taille: number): number => rang + (taille - 1) / 2;
