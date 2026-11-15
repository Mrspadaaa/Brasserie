// Aide des tests de l'écran Dépense : lire et jouer le plateau pu4d (Plateau.tsx, commit 28c98cba, D350 « aucun menu »).
// Les anciens menus « Stock ligne n », « Nature ligne n », « Unité ligne n » (champ texte) n'existent plus (p-port-pu4d/RESULTAT.md) : leurs gestes sont des boutons.
import { fireEvent, within } from '@testing-library/react';

export type StockAction = 'existing' | 'new' | 'none';

const ligneDe = (n: number): HTMLElement => document.querySelector<HTMLElement>(`[data-dp-ligne="line-${n}"]`)!;

/** L'état du stock d'une ligne, lu sur son plateau : « relié » / « proposé » / « à choisir » = existing, « nouvel article » (ou la sortie « bis » / « Nouvel article » du trio) = new, « hors stock » = none. */
export function stockDe(n: number): StockAction | undefined {
  const l = ligneDe(n);
  const sortie = l.querySelector('[data-dp-sortie][aria-checked="true"]')?.getAttribute('data-dp-sortie');
  if (sortie) return sortie.startsWith('relie') ? 'existing' : 'new'; // p5 : « relie-<ref> » quand plusieurs articles portent le nom
  const t = l.querySelector('[data-dp-stock]')?.textContent ?? '';
  if (/hors stock/.test(t)) return 'none';
  if (/nouvel article/.test(t)) return 'new';
  if (/relié|proposé|à choisir/.test(t)) return 'existing';
  return undefined;
}
/** « Retirer » de la ligne « article » (le stock devient « none »). */
export function retirerStock(n: number) {
  fireEvent.click(within(ligneDe(n)).getByRole('button', { name: `Retirer l’article, ligne ${n}` }));
}
/** « Ajouter au stock » (greffe pa1d) : relie par le nom si l'article existe, sinon nouvel article. */
export function suivreAuStock(n: number) {
  fireEvent.click(within(ligneDe(n)).getByRole('button', { name: `Ajouter au stock, ligne ${n}` }));
}
/** Le segment « Ingrédient | Service | Matériel » d'une ligne : le mot pressé, ou undefined sans segment (une remise). */
export function naturePressee(n: number): string | undefined {
  return [...ligneDe(n).querySelectorAll('[data-dp-nature] button[aria-pressed="true"]')].map(b => b.textContent ?? '')[0];
}
export function toucherNature(n: number, mot: 'Ingrédient' | 'Service' | 'Matériel') {
  fireEvent.click(within(ligneDe(n).querySelector<HTMLElement>('[data-dp-nature]')!).getByRole('button', { name: mot }));
}
/** L'unité allumée au segment d'unité de la ligne (« Kg », « g », « Stk »…), ou undefined quand l'unité manque (cinq cases « Unité à remplir »). */
export function unitePressee(n: number): string | undefined {
  return [...ligneDe(n).querySelectorAll('[data-dp-unite-segments] button[aria-pressed="true"]')].map(b => b.textContent ?? '')[0];
}
/** Un toucher sur une unité : au segment, ou parmi les cinq cases quand l'unité manque. */
export function toucherUnite(n: number, label: string) {
  const l = ligneDe(n);
  const groupe = l.querySelector<HTMLElement>('[data-dp-unite-segments]') ?? l.querySelector<HTMLElement>('[data-dp-cases-unite]')!;
  fireEvent.click(within(groupe).getByText(label, { selector: 'button, b' }));
}
