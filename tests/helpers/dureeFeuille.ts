import { fireEvent, within } from '@testing-library/react';

/**
 * D404 : les gestes de la feuille d'ajout du Calendrier (celle qui est ouverte). L'horizon pose le début (« 6 mois ») ; la durée s'étire en
 * tenant le bord de fin (frise B : saisie au bord, déplacement d'au moins 6 px, lâcher). La piste n'a pas de mise en page dans jsdom : sa boîte
 * est posée à 366 px, la largeur que la feuille prend sans mesure.
 */
const LARGEUR = 366;

/** La feuille d'ajout ouverte (son dialogue). */
export function feuille(): HTMLElement {
  const corps = document.querySelector('[data-feuille-rangee]');
  const dlg = corps?.closest<HTMLElement>('[role="dialog"]');
  if (!dlg) throw new Error('aucune feuille d’ajout ouverte');
  return dlg;
}

const piste = (): HTMLElement => {
  const el = feuille().querySelector<HTMLElement>('.cal-f-duree-piste');
  if (!el) throw new Error('absente : la piste de durée (D404)');
  el.getBoundingClientRect = () => ({ left: 0, top: 0, right: LARGEUR, bottom: 62, width: LARGEUR, height: 62, x: 0, y: 0, toJSON: () => ({}) }) as DOMRect;
  return el;
};

/** Toucher l'horizon (« 6 mois », « 1 an »…) : il pose le début. */
export function poserHorizon(libelle: string | RegExp): void {
  fireEvent.click(within(within(feuille()).getByRole('group', { name: 'Quand' })).getByRole('button', { name: libelle }));
}

/** Le lundi posé (ISO), dit au-dessus des horizons. */
export const lundiPose = (): string | null => feuille().querySelector('[data-feuille-semaine]')?.getAttribute('data-feuille-semaine') ?? null;

/** La durée lue sur le bord de fin (semaines). */
export const dureeLue = (): number => Number(within(feuille()).getByRole('slider', { name: 'Fin' }).getAttribute('aria-valuenow'));

/** Tenir le bord de fin et le glisser jusqu'à `semaines` semaines (1 : la fenêtre revient à une semaine). Rend la durée lue après le lâcher. */
export function etirerDuree(semaines: number): number {
  const p = piste();
  const x0 = Number(p.dataset.xFin), px = Number(p.dataset.pxSemaine);
  const dx = (semaines - dureeLue()) * px;
  const o = { pointerId: 7, button: 0, clientY: 20 };
  fireEvent.pointerDown(p, { ...o, clientX: x0 });
  fireEvent.pointerMove(p, { ...o, clientX: x0 + Math.sign(dx || 1) * 8 });
  fireEvent.pointerMove(p, { ...o, clientX: x0 + dx });
  fireEvent.pointerUp(p, { ...o, clientX: x0 + dx });
  return dureeLue();
}

/** Ouvrir les jours actifs, repliés sous le choix de période (D404), et rendre leur groupe. */
export function joursActifs() {
  const d = within(feuille());
  if (!d.queryByRole('group', { name: 'Jours actifs' })) fireEvent.click(d.getByRole('button', { name: /^Jours actifs/ }));
  return within(d.getByRole('group', { name: 'Jours actifs' }));
}
