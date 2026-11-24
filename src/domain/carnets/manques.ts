/**
 * ESCALADER-SUR-MANQUE (24.11, ses mots : « Et pourquoi il y a pas de bouton pour escaler la lecture ? ») et D450 (« s'ils ne sont pas d'accord, il y a un problème ») :
 * un article lu dont un champ attendu manque, ou dont les deux lectures (données structurées, IA sur la page entière) se contredisent, propose « Escalader »
 * (Neon, D449) à côté de « Relire ». Avant, « Escalader » n'existait que sur un lien mort (échec de lecture).
 *
 * Champs attendus : le prix et le nom. Les caractéristiques ne comptent pas : une fiche de houblon n'en publie légitimement que une ou deux (alpha, origine) ; le seuil des
 * quatre mesures d'un matériel ferait réclamer l'escalade à chaque Citra. Seul un article avec lien, déjà lu, est concerné : un article saisi à la main n'a pas de page.
 */
import type { Article } from './modele';
import type { EtapeLien } from '../../../functions/src/carnetIA';

type PourEscalade = Partial<Pick<Article, 'url' | 'lecture' | 'nom' | 'prixCentimes' | 'doute'>>;

/** Les champs qui manquent (« prix », « nom ») et, quand les deux lectures se contredisent, « doute » ; vide : rien à escalader. */
export function articleAEscalader(a: PourEscalade): string[] {
  if (!a.url || a.lecture !== 'lue') return [];
  const m: string[] = [];
  if (a.prixCentimes === undefined) m.push('prix');
  if (!a.nom?.trim()) m.push('nom');
  if (a.doute) m.push('doute');
  return m;
}

/** Ce que l'escalade dit au brasseur (info-bulle) : « prix manquant », « les deux lectures ne s'accordent pas : … ». */
export function raisonEscalade(a: PourEscalade): string {
  const m = articleAEscalader(a);
  const dits = [m.includes('prix') && 'prix manquant', m.includes('nom') && 'nom manquant', m.includes('doute') && `lecture douteuse : ${a.doute}`].filter(Boolean);
  return dits.join(' ; ') || 'lecture complète';
}

/** Le doute d'une lecture : la première étape « contrôle » ou « ia » douteuse de la page (D450), dite telle quelle ; `undefined` : aucune. */
export function douteDePage(etapes: readonly Pick<EtapeLien, 'nom' | 'statut' | 'detail'>[] | undefined): string | undefined {
  const e = (etapes ?? []).find(x => (x.nom === 'controle' || x.nom === 'ia') && x.statut === 'douteux' && x.detail);
  return e?.detail ? e.detail.slice(0, 240) : undefined;
}
