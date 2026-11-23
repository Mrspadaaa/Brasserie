/**
 * Cours du jour vers le franc (D447, 23.11) : « frais de douane, port, export, envoie, ECT.. indiqué quand c'est pas en chf de base ».
 *
 * État de l'art : la conversion d'un prix affiché se fait au cours de référence publié par une banque centrale ; la BCE publie chaque
 * jour ouvré ses cours (EUR contre ~30 devises, dont CHF, GBP, USD, AUD). Frankfurter (api.frankfurter.dev, logiciel libre, sans compte
 * ni clé) sert ces mêmes cours en JSON et calcule les croisés (AUD→CHF). Cache en mémoire de l'instance, 6 h : un cours par devise et par
 * demi-journée, jamais un appel par lien. Une panne rend `null` : le prix reste dans sa devise, sans conversion inventée.
 */
export type Cours = (devise: string, signal?: AbortSignal) => Promise<{ taux: number; date: string } | null>;

const DUREE_MS = 6 * 3600_000;
const cache = new Map<string, { taux: number; date: string; le: number }>();

export const coursVersChf: Cours = async (devise, signal) => {
  const d = devise.toUpperCase();
  if (!/^[A-Z]{3}$/.test(d) || d === 'CHF') return null;
  const deja = cache.get(d);
  if (deja && Date.now() - deja.le < DUREE_MS) return { taux: deja.taux, date: deja.date };
  try {
    const r = await fetch(`https://api.frankfurter.dev/v1/latest?base=${d}&symbols=CHF`, { signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(3000)]) : AbortSignal.timeout(3000) });
    if (!r.ok) return null;
    const j = await r.json() as { date?: string; rates?: { CHF?: number } };
    const taux = j.rates?.CHF;
    if (typeof taux !== 'number' || !(taux > 0.01 && taux < 100) || typeof j.date !== 'string') return null;
    cache.set(d, { taux, date: j.date, le: Date.now() });
    return { taux, date: j.date };
  } catch { return null; }
};
