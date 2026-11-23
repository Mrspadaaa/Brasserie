// CAL-SECTIONS-VIDES-COMPACTES (23.11, « Il y a de la parte d'espace » : Achats « 2 choses cachées », Travaux vide, Activités vide, Papiers
// « 4 choses cachées », une ligne pleine chacune). Décision du pilote, conforme à CAL-VIDES-EN-LIGNE (21.11, « les mettre en vertical pas les
// entassés à l'horizontal ») : les rangées vides OU toutes cachées restent l'une sous l'autre, chacune en ligne basse (≤ 32 px), sans piste ni
// grille sous elles. Données : la fixture simulée ; une rangée pleine masquée par son œil. Rouge sur le tour 21.
import { expect, test } from '@playwright/test';
import { choisirPeriode, ouvrirCalendrier, poserFixture } from '../outils/calendrier';

test('CAL-SECTIONS-VIDES-COMPACTES : rangées vides ou cachées en lignes basses, sans grille sous elles', async ({ page }, info) => {
  test.skip((page.viewportSize()?.width ?? 0) > 500, 'sa plainte : téléphone en portrait (390)');
  await poserFixture(page);
  await ouvrirCalendrier(page);
  await choisirPeriode(page, '6 sem.');
  /* une rangée qui a des choses, masquée par son œil : « n choses cachées » */
  const pleine = await page.evaluate(() => [...document.querySelectorAll('[data-rangee]')].find((r) => r.tagName === 'SECTION' && r.querySelector('[data-chose]') && r.getAttribute('data-rangee') !== 'brassins')?.getAttribute('data-rangee') ?? null);
  expect(pleine, 'une rangée pleine (hors Brassins) à masquer').not.toBeNull();
  await page.locator(`section[data-rangee="${pleine}"] .cal-oeil`).tap();
  await expect(page.locator(`section[data-rangee="${pleine}"] .cal-cachees`)).toBeVisible();
  await page.waitForTimeout(400);
  const vue = await page.screenshot({ fullPage: true, path: info.outputPath('sections.png') });
  await info.attach('sections', { body: vue, contentType: 'image/png' });
  const rangees = await page.evaluate(() => [...document.querySelectorAll('section[data-rangee]')].map((r) => {
    const b = r.getBoundingClientRect();
    const sansRien = ![...r.querySelectorAll('[data-chose]')].some((c) => c.getBoundingClientRect().width > 0);
    const groupe = r.closest('.cal-vides') as HTMLElement | null;
    const fond = groupe ? getComputedStyle(groupe).backgroundColor : '';
    const opaque = /^rgb\(/.test(fond) || /, 1\)$/.test(fond);
    return { id: r.getAttribute('data-rangee'), h: Math.round(b.height), sansRien, groupe: !!groupe, opaque, piste: !!r.querySelector('.cal-lane') };
  }));
  const vides = rangees.filter((r) => r.sansRien);
  expect(vides.map((r) => r.id), 'la rangée masquée est parmi les rangées sans chose visible').toContain(pleine);
  for (const r of vides) {
    expect(r.h, `${r.id} : ligne basse (≤ 32 px)`).toBeLessThanOrEqual(32);
    expect(r.piste, `${r.id} : aucune piste vide sous elle`).toBe(false);
    expect(r.groupe && r.opaque, `${r.id} : dans le groupe des lignes basses, qui cache la grille`).toBe(true);
  }
  /* vertical (21.11) : chacune sur sa ligne, l'une sous l'autre */
  const tops = await page.evaluate(() => [...document.querySelectorAll('.cal-vides > section[data-rangee]')].map((r) => Math.round(r.getBoundingClientRect().top)));
  expect(new Set(tops).size, 'les lignes basses sont l\'une sous l\'autre, jamais côte à côte').toBe(tops.length);
});
