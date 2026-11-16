// Recette en ligne 15.11 (RL-1 à RL-3) : ce que la page de la recette et le Récap disent d'une levure, sans le répéter.
//  - le catalogue nomme une souche « Wyeast · 1056 American Ale® » : fabricant et code y sont déjà ; les rajouter les double ;
//  - la note « Quantité et conduite à définir pour le moût » est posée au choix de la souche (applyCatalogueYeast) et ne se relit jamais :
//    une fois la quantité ou la conduite saisie, elle ment ;
//  - l'unité proposée suit la forme : une levure liquide se dose en sachet ou en mL, jamais en g.

export interface LevureIdentite {
  name: string;
  lab?: string;
  strain?: string;
}

const norme = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

/** « Wyeast · 1056 American Ale® » seul quand le nom porte déjà le fabricant et le code ; sinon fabricant, nom, code, chacun une fois. */
export function identiteLevure(y: LevureIdentite): string {
  const nom = y.name.trim();
  const dansLeNom = (mot?: string) => {
    const m = mot?.trim();
    return !!m && norme(nom).includes(norme(m));
  };
  const parts = [!dansLeNom(y.lab) ? y.lab?.trim() : undefined, nom, !dansLeNom(y.strain) ? y.strain?.trim() : undefined];
  return parts.filter(Boolean).join(' · ');
}

const NOTE_A_DEFINIR = /\s*Quantité et conduite à définir pour le moût\.?/;

/**
 * La note de la levure telle qu'on la relit : la phrase « à définir » ne garde que ce qui manque encore.
 * Quantité saisie et conduite saisie : la phrase part ; l'un des deux : elle ne nomme plus que l'autre.
 */
export function noteLevureAJour(notes: string | undefined, etat: { quantiteSaisie: boolean; conduiteSaisie: boolean }): string {
  const texte = (notes ?? '').trim();
  if (!NOTE_A_DEFINIR.test(texte)) return texte;
  const reste = !etat.quantiteSaisie && !etat.conduiteSaisie ? 'Quantité et conduite à définir pour le moût.'
    : !etat.quantiteSaisie ? 'Quantité à définir pour le moût.'
    : !etat.conduiteSaisie ? 'Conduite à définir pour le moût.' : '';
  return texte.replace(NOTE_A_DEFINIR, reste ? ` ${reste}` : '').trim();
}

export interface ReglageQuantite {
  /** Unités du sélecteur : celles de la forme, plus l'unité déjà saisie si elle n'en fait pas partie (le sélecteur ne ment jamais). */
  unites: string[];
  min: number;
  max: number;
  step: number;
}

/** L'unité et la plage du curseur de quantité du Récap (maquette m2 : unité 1/2, quantité 2/2), selon la forme et l'unité en place. */
export function reglageQuantiteLevure(form: string | undefined, unit: string | undefined, qty: number | undefined): ReglageQuantite {
  const base = form === 'liquide' || form === 'levain' ? ['sachet', 'mL'] : ['sachet', 'g'];
  const u = (unit ?? '').trim();
  const unites = u && !base.includes(u) ? [...base, u] : base;
  const q = Number.isFinite(qty) && qty! > 0 ? qty! : 0;
  if (u === 'g') return { unites, min: 0, max: Math.max(100, Math.ceil(q)), step: 1 };
  if (u === 'mL') return { unites, min: 0, max: Math.max(500, Math.ceil(q)), step: 5 };
  if (u === 'L') return { unites, min: 0, max: Math.max(2, Math.ceil(q)), step: 0.05 };
  return { unites, min: 0, max: Math.max(6, Math.ceil(q)), step: 0.5 };
}

/** Densité en début d'ébullition : la densité de la cuve avant évaporation (voir `densiteAvantEbullition`, une seule source). */
export { densiteAvantEbullition as densiteDebutEbullition } from '../brewDay';
