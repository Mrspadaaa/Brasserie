/**
 * Les catégories de floculation de l'app, en français, et les mots publiés qui en sont la traduction (« High » = « Élevée »).
 * Le banc payant du 08.11 (D378) : la recherche en ligne rend tantôt « moyenne », tantôt « Very High » ; une fiche se lit dans une seule langue.
 */
export const FLOCCULATION_CATEGORIES = ['Faible', 'Faible à moyenne', 'Moyenne', 'Moyenne à élevée', 'Élevée', 'Très élevée'] as const;
const FLOCCULATION_WORDS: Record<string, string> = {
  low: 'Faible', faible: 'Faible', basse: 'Faible', 'low-medium': 'Faible à moyenne', 'medium-low': 'Faible à moyenne', 'faible a moyenne': 'Faible à moyenne',
  medium: 'Moyenne', moyenne: 'Moyenne', moyen: 'Moyenne', 'medium-high': 'Moyenne à élevée', 'moyenne a elevee': 'Moyenne à élevée',
  high: 'Élevée', elevee: 'Élevée', haute: 'Élevée', 'very high': 'Très élevée', 'tres elevee': 'Très élevée', 'tres haute': 'Très élevée',
};
const fold = (text: string) => text.normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();
/** La clé d'un mot publié : sa catégorie française s'il en traduit une, sinon le mot replié tel quel. */
export const yeastCategoryKey = (text: string) => { const key = fold(text).replace(/\s*-\s*/g, '-'); return FLOCCULATION_WORDS[key] ?? key; };
/** Le mot publié en catégorie française quand il en est une traduction ; tout autre libellé reste tel que publié. */
export const floculationFrancaise = (text: string): string => {
  const key = yeastCategoryKey(text);
  return (FLOCCULATION_CATEGORIES as readonly string[]).includes(key) ? key : text.trim();
};
