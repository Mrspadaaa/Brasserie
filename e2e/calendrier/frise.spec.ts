// La frise du Calendrier au doigt (Playwright Test), règle par règle de DEFAUTS-RECURRENTS (dépôt Brasserie, work/refonte-frontend/v4) :
// CAL-PERIODE-APP-FIXE, CAL-RETOUR-PASSE, CAL-ECHELLE-COHERENTE, CAL-FRISE-ETIQUETTES, CAL-AN-390, et BUGS.md T9-1, T9-2.
// Chaque test sait échouer : rouge sur en-ligne/2026-11-22-tour9 (et tour10 pour ce que f9cd2cf84 a corrigé après), vert sur l'arbre.
// Données : la fixture simulée des bancs du parcours (jamais seedData.ts, jamais de donnée réelle).
import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { Doigt } from '../outils/doigt';
import {
  ECHELLES, ajouter, attendreCoherence, boiteCadre, choisirPeriode, dateChose, fautesEtiquettes, fautesRangees, fautesTextes,
  lireCoherence, lundis, ouvrirCalendrier, periodeApp, poserFixture, semaineAbsolue
} from '../outils/calendrier';

const slug = (s: string) => s.replace(/\W+/g, '');

async function cadre(page: Page) {
  const g = await boiteCadre(page);
  expect(g, 'le cadre de la courbe est dessiné').not.toBeNull();
  return g!;
}

/** Une fenêtre de 6 semaines qui part de cette semaine : « 2 sem. » ramène la fenêtre locale à aujourd'hui, puis « 6 sem. ». */
async function sixSemainesDepuisAujourdhui(page: Page) {
  await choisirPeriode(page, '2 sem.');
  await choisirPeriode(page, '6 sem.');
}

test.describe('Frise du Calendrier', () => {
  test.beforeEach(async ({ page }) => {
    await poserFixture(page);
    await ouvrirCalendrier(page);
  });

  test('CAL-PERIODE-APP-FIXE : aucun geste du Calendrier ne change la période de l\'app', async ({ page }) => {
    const doigt = await Doigt.sur(page);
    const pt0 = await periodeApp(page);
    expect(pt0, 'la pastille de période de l\'app est lisible').toBeTruthy();
    for (const e of ECHELLES) {
      await choisirPeriode(page, e);
      expect.soft(await periodeApp(page), `échelle « ${e} »`).toBe(pt0);
    }
    await choisirPeriode(page, '3 mois');
    const gestes: [string, (g: { l: number; r: number; y: number }) => Promise<void>][] = [
      ['glisser le cadre lentement vers le passé', (g) => doigt.glisserLent({ x: (g.l + g.r) / 2, y: g.y }, { x: (g.l + g.r) / 2 - 90, y: g.y })],
      ['glisser le cadre d\'un coup vers l\'avenir', (g) => doigt.glisserRapide({ x: (g.l + g.r) / 2, y: g.y }, { x: (g.l + g.r) / 2 + 70, y: g.y })],
      ['tirer le début', (g) => doigt.glisser({ x: g.l + 1, y: g.y }, { x: g.l - 40, y: g.y })],
      ['tirer la fin', (g) => doigt.glisser({ x: g.r - 1, y: g.y }, { x: g.r + 40, y: g.y })]
    ];
    for (const [nom, geste] of gestes) {
      await test.step(nom, async () => {
        await geste(await cadre(page));
        await expect.poll(() => periodeApp(page), { message: `après « ${nom} »` }).toBe(pt0);
        expect.soft(await periodeApp(page), `après « ${nom} »`).toBe(pt0);
      });
    }
    const aligner = page.getByRole('button', { name: 'Aligner la courbe sur la frise' });
    if (await aligner.isVisible()) { await aligner.tap(); expect.soft(await periodeApp(page), 'après « Aligner la courbe »').toBe(pt0); }
  });

  /* L-6 (T10-6, tour 10) : après › de l'app, un geste local, puis ‹ : la période revenait, la fenêtre restait celle du geste (la fenêtre locale
     s'écrivait toujours sous la clé de la PREMIÈRE période, `onPeriode` gardant le `setPeriodeLocale` du premier rendu). */
  test('L-6 CAL-PERIODE-APP-FIXE second sens : ›, un geste local, ‹ rendent la période ET la fenêtre de départ', async ({ page }) => {
    const doigt = await Doigt.sur(page);
    const etiquette = () => page.evaluate(() => (document.querySelector('[data-cadre-etiquette]')?.textContent ?? '').replace(/\s+/g, ' ').trim());
    const pastille = page.locator('[data-periode-pastille]').first();
    const p0 = await periodeApp(page);
    /* la fenêtre de référence : celle que la période P0 donne quand on y revient par ‹ sans geste (au chargement, le paysage montre plus large) */
    await pastille.getByRole('button', { name: 'Période suivante' }).tap();
    await expect.poll(() => periodeApp(page)).not.toBe(p0);
    await pastille.getByRole('button', { name: 'Période précédente' }).tap();
    await expect.poll(() => periodeApp(page)).toBe(p0);
    await page.waitForTimeout(350);
    const e0 = await etiquette();
    await pastille.getByRole('button', { name: 'Période suivante' }).tap();
    await expect.poll(() => periodeApp(page)).not.toBe(p0);
    await expect.poll(etiquette, { message: 'la fenêtre suit la période de l\'app' }).not.toBe(e0);
    const e1 = await etiquette(), g = await cadre(page);
    await doigt.glisser({ x: g.l + 1, y: g.y }, { x: g.l + 60, y: g.y });
    await expect.poll(etiquette, { message: 'le début tiré change la fenêtre locale' }).not.toBe(e1);
    await page.waitForTimeout(500); // le rythme d'un doigt : le clic fabriqué au lever d'un geste est avalé 400 ms (DELAI_CLIC_AVALE)
    await pastille.getByRole('button', { name: 'Période précédente' }).tap();
    await expect.poll(() => periodeApp(page), { message: 'la période de l\'app revient' }).toBe(p0);
    await expect.poll(etiquette, { message: `la fenêtre revient à « ${e0} »` }).toBe(e0);
  });

  test('CAL-RETOUR-PASSE : la frise recule de 40 semaines au moins, et le cadre dit ce qu\'il montre', async ({ page }) => {
    const doigt = await Doigt.sur(page);
    const pt0 = undefined; // la période de l'app a son propre test (CAL-PERIODE-APP-FIXE) : un test, une règle
    await choisirPeriode(page, '3 mois');
    let c = await attendreCoherence(page, pt0, 'au départ');
    let recul = 0, prec = c.etiquette?.a ?? null, bloque = 0;
    for (let n = 0; n < 30 && recul < 40 && bloque < 2; n++) {
      const g = await cadre(page), x0 = (g.l + g.r) / 2;
      await doigt.glisser({ x: x0, y: g.y }, { x: x0 - 120, y: g.y });
      c = await attendreCoherence(page, pt0, `glisser le cadre vers le passé n° ${n + 1}`);
      const a = c.etiquette?.a ?? null;
      if (prec !== null && a !== null) { const d = (prec - a + 53) % 53; if (d <= 30) recul += d; bloque = d === 0 ? bloque + 1 : 0; }
      prec = a;
    }
    expect(recul, `semaines de recul (le cadre s'arrête à « ${c.label} »)`).toBeGreaterThanOrEqual(40);
    for (const [nom, x, dx] of [['tirer le début', (g: { l: number; r: number }) => g.l + 1, -60], ['glisser le cadre vers l\'avenir', (g: { l: number; r: number }) => (g.l + g.r) / 2, 80]] as const) {
      const g = await cadre(page), x0 = x(g);
      await doigt.glisser({ x: x0, y: g.y }, { x: x0 + dx, y: g.y });
      await attendreCoherence(page, pt0, nom);
    }
  });

  for (const echelle of ECHELLES) {
    test(`CAL-ECHELLE-COHERENTE ${echelle} : étiquette du cadre = dessin = graduations, au repos et après chaque bord tiré`, async ({ page }) => {
      const doigt = await Doigt.sur(page);
      const pt0 = await periodeApp(page); // la règle compare aussi la pastille de période (fixe depuis CAL-PERIODE-APP-FIXE)
      await choisirPeriode(page, echelle);
      await attendreCoherence(page, pt0, 'au repos');
      let g = await cadre(page);
      await doigt.glisser({ x: g.l + 1, y: g.y }, { x: g.l - 40, y: g.y });
      await attendreCoherence(page, pt0, 'après avoir tiré le début');
      g = await cadre(page);
      await doigt.glisser({ x: g.r - 1, y: g.y }, { x: g.r + 40, y: g.y });
      await attendreCoherence(page, pt0, 'après avoir tiré la fin');
    });
  }

  /* les échelles du menu, et celles qu'aucun menu ne donne : 1 semaine (la fin tirée sur le début), 7 et 30 semaines (la fin tirée plus loin) */
  const ETIQUETTES: [string, string, number | null][] = [...ECHELLES.map((e) => [e, e, null] as [string, string, null]), ['1 sem.', '6 sem.', -1000], ['7 sem.', '6 sem.', 40], ['30 sem.', '6 mois', 70]];
  for (const [nom, depart, dx] of ETIQUETTES) {
    test(`CAL-FRISE-ETIQUETTES ${nom} : aucune étiquette ne croise une poignée ni une autre, la semaine dite une fois`, async ({ page }) => {
      await choisirPeriode(page, depart);
      if (dx !== null) {
        const doigt = await Doigt.sur(page), g = await cadre(page), x1 = g.r - 1;
        await doigt.glisser({ x: x1, y: g.y }, { x: dx < -500 ? g.l - 3 : x1 + dx, y: g.y });
      }
      await expect.poll(() => fautesEtiquettes(page), { timeout: 3_000 }).toEqual([]);
    });
  }

  /* L-3 (T10-3, tour 10, M5) : après un geste du cadre (début tiré, cadre tenu au bord), « Achats −13 » posé deux fois sur la poignée, des noms
     sur l'étiquette du cadre. Chaque état relu 5 fois : un défaut qui ne sort qu'une fois sur cinq reste un défaut. */
  for (const echelle of ['3 mois', '6 mois', 'An'] as const) {
    test(`L-3 CAL-FRISE-ETIQUETTES ${echelle} après chaque geste du cadre : aucun nom sur une poignée, l'étiquette ou un autre nom, aucun doublon`, async ({ page }) => {
      const doigt = await Doigt.sur(page);
      await choisirPeriode(page, echelle);
      const relire = async (quand: string) => {
        for (let n = 0; n < 5; n++) await expect.poll(() => fautesEtiquettes(page), { message: `${quand}, lecture ${n + 1}`, timeout: 3_000 }).toEqual([]);
      };
      await relire('au repos');
      let g = await cadre(page);
      await doigt.glisser({ x: g.l + 1, y: g.y }, { x: g.l - 40, y: g.y });
      await relire('début tiré de 40 px');
      g = await cadre(page);
      await doigt.tenirAuBord({ x: (g.l + g.r) / 2, y: g.y }, { x: Math.max(2, g.courbeL + 4), y: g.y }, 1000, { mode: 'immobile' });
      await relire('cadre tenu 1 s au bord gauche');
      g = await cadre(page);
      await doigt.glisser({ x: g.r - 1, y: g.y }, { x: g.r - 40, y: g.y });
      await relire('fin tirée de −40 px');
    });
  }

  /* T11-2 (L-3, contre-épreuve du tour 11) : période de l'app › trois fois (Févr. 2027, « Févr. · 4 sem. »), « Achats −13 » coupé par la poignée
     de fin. Chaque mois des six suivants, au repos, relu 3 fois : aucun nom de la courbe sous une poignée */
  test('T11-2 CAL-FRISE-ETIQUETTES : période de l’app › mois après mois, aucun nom de la courbe sous une poignée', async ({ page }) => {
    const pastille = page.locator('[data-periode-pastille]').first();
    for (let k = 1; k <= 6; k++) {
      const p0 = await periodeApp(page);
      await pastille.getByRole('button', { name: 'Période suivante' }).tap();
      await expect.poll(() => periodeApp(page)).not.toBe(p0);
      const p = await periodeApp(page);
      for (let n = 0; n < 3; n++) await expect.poll(() => fautesEtiquettes(page), { message: `${p}, lecture ${n + 1}`, timeout: 3_000 }).toEqual([]);
    }
  });

  /* T11-2, le cas vu en ligne et pas sur la fixture (le nom posé là où la courbe croyait la poignée absente) : quelle que soit la cause, une
     poignée DESSINÉE sur un nom le fait taire. La poignée de fin est portée sur le premier nom de la courbe (son dessin seul, comme un écart
     entre la place que la courbe réserve et celle où la poignée se dessine) */
  test('T11-2 CAL-FRISE-ETIQUETTES : un nom sous la poignée dessinée se tait', async ({ page }) => {
    const nom = page.locator('[data-nom-courbe]').first();
    await expect(nom).toBeVisible();
    await expect.poll(() => fautesEtiquettes(page)).toEqual([]);
    await page.evaluate(() => {
      const n = document.querySelector('[data-nom-courbe]')!.getBoundingClientRect();
      const b = document.querySelector('[data-poignee="fin"]')!, i = b.querySelector('i')!, r = b.getBoundingClientRect();
      i.style.left = `${n.left + n.width / 2 - r.left - 3}px`;
      i.style.top = `${n.top + n.height / 2 - r.top}px`;
    });
    await expect.poll(() => fautesEtiquettes(page), { message: 'la poignée posée sur le nom : il se tait', timeout: 3_000 }).toEqual([]);
  });

  for (const duree of ['1 sem.', ...ECHELLES]) {
    test(`CAL-AN-390 ${duree} : aucun texte rogné ni chevauché dans l'en-tête, la frise et la fiche`, async ({ page }, info) => {
      test.skip((page.viewportSize()?.width ?? 0) > 500, 'règle du téléphone en portrait (390)');
      if (duree === '1 sem.') {
        await sixSemainesDepuisAujourdhui(page);
        const doigt = await Doigt.sur(page), g = await cadre(page);
        await doigt.glisser({ x: g.r - 1, y: g.y }, { x: g.l - 3, y: g.y });
      } else await choisirPeriode(page, duree);
      for (const z of ['entete', 'frise'] as const) {
        await expect.poll(() => fautesTextes(page, z), { message: `zone ${z}`, timeout: 3_000 }).toEqual([]);
      }
      expect.soft(await fautesRangees(page), 'rangées : période d\'un bloc, aucun picto sur une autre barre').toEqual([]);
      await info.attach(`an390-${slug(duree)}`, { body: await page.screenshot(), contentType: 'image/png' });
      const barre = page.locator('[data-frise] [data-chose]').filter({ visible: true });
      const b = await barre.evaluateAll((l) => { const e = l.find((x) => { const r = x.getBoundingClientRect(); return r.width > 20 && r.left >= 0 && r.right <= innerWidth && r.top > 0 && r.bottom < innerHeight; }); if (!e) return null; const r = e.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
      expect(b, 'une barre touchable dans la vue').not.toBeNull();
      await page.touchscreen.tap(b!.x, b!.y);
      await expect(page.locator('[data-detail]')).toBeVisible();
      await info.attach(`an390-${slug(duree)}-fiche`, { body: await page.screenshot(), contentType: 'image/png' });
      expect(await fautesTextes(page, 'fiche'), 'fiche ouverte').toEqual([]);
    });
  }

  /* T9-1 (tour 9 en ligne) : « lol » tirée au-delà du bord droit et tenue 2,1 s : la fenêtre grandit (même début) et la chose y reste. */
  const T9_1: [string, 'frotte' | 'tremblant', 'bande' | 'ecran', number][] = [['doigt qui frotte (pas de 100 ms)', 'frotte', 'bande', 100], ['doigt tremblant ±1 px / 8 ms, bord de la frise', 'tremblant', 'bande', 8], ['doigt tremblant ±1 px / 16 ms, bord de l\'écran', 'tremblant', 'ecran', 16]];
  for (const [nom, mode, ou, periodeMs] of T9_1) {
    test(`T9-1 ${nom} : la fenêtre grandit et la chose posée reste dans la vue`, async ({ page }) => {
      const doigt = await Doigt.sur(page);
      await sixSemainesDepuisAujourdhui(page);
      const l0 = await lundis(page), d0 = await dateChose(page, 'P-PAPIER');
      const chose = page.locator('[data-frise] [data-chose$="P-PAPIER"]');
      await chose.scrollIntoViewIfNeeded();
      const r = (await chose.boundingBox())!;
      expect(r, '« lol » est dans la frise').toBeTruthy();
      const fr = await page.locator('[data-frise]').evaluate((f) => { const b = f.getBoundingClientRect(); return Math.min(b.right, innerWidth); });
      const x1 = ou === 'ecran' ? page.viewportSize()!.width - 1 : fr - 6;
      const a = { x: r.x + Math.min(r.width / 2, 12), y: r.y + r.height / 2 };
      await doigt.tenirAuBord(a, { x: x1, y: a.y }, 2100, { mode, periodeMs });
      await expect.poll(async () => (await dateChose(page, 'P-PAPIER')) !== d0, { message: 'la chose a été posée ailleurs' }).toBe(true);
      const l1 = await lundis(page), d1 = await dateChose(page, 'P-PAPIER'), fin = ajouter(l1[l1.length - 1], 6);
      const dit = `${l0[0]}+${l0.length} sem. → ${l1[0]}+${l1.length} sem. ; ${d0} → ${d1}`;
      expect(l1.length, `la fenêtre grandit (${dit})`).toBeGreaterThan(l0.length);
      expect(l1[0] === l0[0] || l1.length >= 26, `même début tant qu'elle grandit (${dit})`).toBe(true);
      expect(d1! >= l1[0] && d1! <= fin, `la chose posée est dans la fenêtre (${dit})`).toBe(true);
      const vu = await chose.evaluate((e) => { const f = document.querySelector('[data-frise]')!.getBoundingClientRect(), r = e.getBoundingClientRect(); return r.width > 0 && r.left >= f.left - 1 && r.left < Math.min(f.right, innerWidth) - 4; });
      expect(vu, `la chose posée est dans la vue (${dit})`).toBe(true);
      await page.getByRole('button', { name: 'Annuler', exact: true }).tap();
      await expect.poll(() => dateChose(page, 'P-PAPIER'), { message: '« Annuler » rend la date' }).toBe(d0);
    });
  }

  /* T9-2 (tour 9 en ligne) : la poignée de début tenue au bord gauche de la courbe recule en UN geste (elle butait sur S47). */
  test('T9-2 début tenu 3,6 s au bord (doigt qui frotte) : 8 à 52 semaines de recul en un geste', async ({ page }) => {
    const doigt = await Doigt.sur(page);
    await sixSemainesDepuisAujourdhui(page);
    const c0 = await lireCoherence(page), g = await cadre(page);
    expect(c0.etiquette, `étiquette du cadre lisible (« ${c0.label} »)`).not.toBeNull();
    await doigt.tenirAuBord({ x: g.l + 1, y: g.y }, { x: Math.max(2, g.courbeL + 2), y: g.y }, 3600, { mode: 'frotte' });
    const c1 = await attendreCoherence(page, undefined,'après le début tenu au bord');
    const recul = semaineAbsolue(c0.etiquette!) - semaineAbsolue(c1.etiquette!);
    expect(recul, `« ${c0.label} » → « ${c1.label} »`).toBeGreaterThanOrEqual(8);
    expect(recul, `« ${c0.label} » → « ${c1.label} »`).toBeLessThanOrEqual(52);
  });

  test('T9-2 début tenu 3 s au bord, doigt IMMOBILE : recule jusqu\'à un an, et l\'étiquette le dit', async ({ page }) => {
    const doigt = await Doigt.sur(page);
    await sixSemainesDepuisAujourdhui(page);
    const c0 = await lireCoherence(page), g = await cadre(page);
    expect(c0.etiquette, `étiquette du cadre lisible (« ${c0.label} »)`).not.toBeNull();
    await doigt.tenirAuBord({ x: g.l + 1, y: g.y }, { x: Math.max(2, g.courbeL + 2), y: g.y }, 3000, { mode: 'immobile' });
    const c1 = await attendreCoherence(page, undefined,'après le début tenu immobile');
    const dit = `« ${c0.label} » (${c0.points.length} sem.) → « ${c1.label} » (${c1.points.length} sem.)`;
    expect(c1.points.length - c0.points.length, `recul sous le doigt immobile : ${dit}`).toBeGreaterThanOrEqual(40);
    expect(c1.points.length, `jamais plus que l'horizon (CAL-PLUS-QU-UN-AN : 5 ans et le passé) : ${dit}`).toBeLessThanOrEqual(5 * 52 + 1 + 52);
    expect(c1.label, `l'étiquette dit la fenêtre reculée : ${dit}`).not.toBe(c0.label);
    if (c1.etiquette && c0.etiquette && c1.etiquette.a > c0.etiquette.a) expect(c1.etiquette.anA, `le début dans l'année d'avant dit son année : ${dit}`).not.toBeNull();
  });

  test('Accessibilité (axe, WCAG 2 A/AA) du Calendrier à 3 mois', async ({ page }, info) => {
    await choisirPeriode(page, '3 mois');
    const r = await new AxeBuilder({ page }).include('[data-calendrier]').withTags(['wcag2a', 'wcag2aa']).analyze();
    await info.attach('axe.json', { body: JSON.stringify(r.violations, null, 2), contentType: 'application/json' });
    const graves = r.violations.filter((v) => v.impact === 'critical' || v.impact === 'serious').map((v) => `${v.id} (${v.impact}, ${v.nodes.length}) : ${v.help}`);
    expect(graves).toEqual([]);
  });
});

/* Captures de référence aux 4 échelles, date figée (horloge de la page et fixture au 25.11.2026) : toute différence au pixel près se voit dans
   le rapport (attendu, reçu, différence). `npx playwright test --update-snapshots` les refait après un changement voulu, regardées avant commit. */
test.describe('Frise du Calendrier : captures de référence', () => {
  const JOUR = '2026-11-25';
  for (const echelle of ECHELLES) {
    test(`capture ${echelle}`, async ({ page }) => {
      await page.clock.setFixedTime(new Date(`${JOUR}T10:00:00+01:00`));
      await poserFixture(page, JOUR);
      await ouvrirCalendrier(page);
      await choisirPeriode(page, echelle);
      await attendreCoherence(page, undefined, echelle);
      await page.evaluate(() => window.scrollTo(0, 0));
      await expect(page).toHaveScreenshot(`calendrier-${slug(echelle)}.png`);
    });
  }
});

