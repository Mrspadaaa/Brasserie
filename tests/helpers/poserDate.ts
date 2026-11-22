import { fireEvent } from '@testing-library/react';

/**
 * GESTE-DATE-PARTOUT (22.11) : poser un jour dans un `ChoixDate` (la frise partagée) comme le fait le clavier : ouvrir la pastille, Page ± 7 jours et flèches ± 1 jour
 * sur le repère, Entrée pour écrire. Le seul chemin des tests : il n'y a plus de `<input type="date">` à `fireEvent.change`.
 * `label` : l'étiquette du champ (« Date de l’achat ») ; `racine` : où chercher (le document par défaut).
 */
const MS_JOUR = 86_400_000;
const entre = (a: string, b: string) => Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / MS_JOUR);
const aujourdhui = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };

export function zoneDate(label: string, racine: ParentNode = document): HTMLElement {
  const pastille = Array.from(racine.querySelectorAll<HTMLElement>('[data-choix-date-pastille]')).find(b => (b.getAttribute('aria-label') ?? '').startsWith(`${label} :`));
  if (!pastille) throw new Error(`pas de choix de date « ${label} »`);
  return pastille.closest<HTMLElement>('[data-choix-date]')!;
}

export function poserDate(label: string, iso: string, racine: ParentNode = document): void {
  const zone = zoneDate(label, racine);
  const pastille = zone.querySelector<HTMLElement>('[data-choix-date-pastille]');
  if (pastille && pastille.getAttribute('aria-expanded') !== 'true') fireEvent.click(pastille);
  const point = () => zone.querySelector<HTMLElement>('[data-date-point]')!;
  let n = entre(zone.getAttribute('data-valeur') || aujourdhui(), iso);
  while (n >= 7) { fireEvent.keyDown(point(), { key: 'PageUp' }); n -= 7; }
  while (n <= -7) { fireEvent.keyDown(point(), { key: 'PageDown' }); n += 7; }
  while (n > 0) { fireEvent.keyDown(point(), { key: 'ArrowRight' }); n -= 1; }
  while (n < 0) { fireEvent.keyDown(point(), { key: 'ArrowLeft' }); n += 1; }
  fireEvent.keyDown(point(), { key: 'Enter' });
}
