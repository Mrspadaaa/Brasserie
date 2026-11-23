// D444, point 3 (23.11 soir) : quatre défauts de la bande des graduations, chacun un contrôle qui échoue sur l'ancien cœur (tour 22-26).
//   CAL-TOUCHER-GRADUATION : « que du je clique sur une semaine ou mois, ça fasse un focus dessus, genre ça me l'a frize dessus »
//   CAL-ETIQUETTE-GRAIN-AU-DESSUS : « en mode jour, 21dec et 10 janvier ont pas besoin d'être afficher, mais il faudrait mettre les semaines genre S52 2026 - S1 2027 »
//   CAL-GRADUATION-ROGNEE : capture 12:05, « S5? S53 S1 » rognés au bord droit
//   « J A J O » sans année à 3 ans
// Données : la fixture simulée du parcours. 390 en portrait (sa plainte).
import { expect, test, type Page } from '@playwright/test';
import { aujourdhuiZurich, choisirPeriode, ouvrirCalendrier, poserFixture } from '../outils/calendrier';

test.skip(({ viewport }) => (viewport?.width ?? 0) > 500, 'sa plainte : téléphone en portrait (390)');

const cadre = (page: Page) => page.evaluate(() => {
  const e = document.querySelector('[data-cadre-du]');
  return { du: e?.getAttribute('data-cadre-du') ?? '', au: e?.getAttribute('data-cadre-au') ?? '', etiquette: (document.querySelector('[data-cadre-etiquette]')?.textContent ?? '').replace(/\s+/g, ' ').trim() };
});
const plus = (iso: string, n: number) => new Date(Date.parse(`${iso}T00:00:00Z`) + n * 864e5).toISOString().slice(0, 10);

/** Les noms posés sur la bande (semaines, groupes, mois, années, jours) : texte et boîte. */
const nomsBande = (page: Page) => page.evaluate(() => {
  const bande = document.querySelector('[data-bande-semaines][data-sur-courbe]');
  const cb = document.querySelector('.ent-cbz .ent-cb') ?? document.querySelector('.ent-cb');
  if (!bande || !cb) return null;
  const r = cb.getBoundingClientRect();
  const noms = [...bande.querySelectorAll('.ent-sem, .ent-bd-j')].map((n) => {
    const b = n.getBoundingClientRect();
    return { t: (n.textContent ?? '').trim(), l: b.left - r.left, r: b.right - r.left, w: b.width };
  }).filter((n) => n.w > 0);
  return { largeur: r.width, noms, grain: bande.getAttribute('data-grain') };
});

async function plageApp(page: Page, du: string, au: string) {
  await page.locator('[data-periode-pastille] .pr-ce').tap();
  await page.getByLabel('Du (jj.mm)').fill(du);
  await page.getByLabel('Au (jj.mm)').fill(au);
  await page.getByLabel('Au (jj.mm)').blur();
  await page.waitForTimeout(300);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(500);
  if (await page.getByRole('dialog').count()) await page.keyboard.press('Escape');
}

test.beforeEach(async ({ page }) => {
  await poserFixture(page);
  await ouvrirCalendrier(page);
});

test('CAL-TOUCHER-GRADUATION : toucher une semaine, un mois de la bande pose le cadre dessus ; Annuler rend la vue d\'avant', async ({ page }) => {
  await choisirPeriode(page, '3 mois');
  const avant = await cadre(page);
  const sem = page.locator('[data-bande-semaines][data-sur-courbe] .ent-bd-c:has(.ent-sem)').nth(2);
  const lundi = await sem.getAttribute('data-lundi');
  await sem.tap();
  await page.waitForTimeout(500);
  const apres = await cadre(page);
  expect(apres, `semaine ${lundi} touchée`).toMatchObject({ du: lundi!, au: plus(lundi!, 6) });
  await page.getByRole('button', { name: 'Annuler' }).last().tap();
  await page.waitForTimeout(500);
  expect(await cadre(page)).toMatchObject({ du: avant.du, au: avant.au });
  /* un mois : dans l'An, la bande dit les mois */
  await choisirPeriode(page, 'An');
  const mois = page.locator('[data-bande-semaines][data-sur-courbe] .ent-bd-c:has([data-periode])').nth(2);
  const ym = await mois.locator('[data-periode]').getAttribute('data-periode');
  await mois.tap();
  await page.waitForTimeout(500);
  const m = await cadre(page);
  const a = Number(ym!.slice(0, 4)), mo = Number(ym!.slice(5, 7));
  const premier = `${ym}-01`, dernier = plus(mo === 12 ? `${a + 1}-01-01` : `${a}-${String(mo + 1).padStart(2, '0')}-01`, -1);
  expect(m.du <= premier && plus(m.du, 6) >= premier && m.au >= dernier && plus(m.au, -6) <= dernier, `mois ${ym} touché : cadre ${m.du} → ${m.au}`).toBe(true);
});

test('CAL-ETIQUETTE-GRAIN-AU-DESSUS : bande en jours → l\'étiquette dit les semaines avec l\'année ; en semaines → les dates', async ({ page }) => {
  await choisirPeriode(page, '6 sem.');
  expect((await cadre(page)).etiquette, '6 sem. : les dates (D434)').toMatch(/^\d{1,2} [a-zéû]+\.? .*– \d{1,2} [a-zéû]+/i);
  /* trois semaines au plus : la bande passe aux jours ; le cadre posé sur deux semaines par la poignée de fin */
  const h = await page.locator('[data-poignee="fin"]').first().boundingBox();
  const c = await page.locator('.ent-cadre').boundingBox();
  const doigt = await (await import('../outils/doigt')).Doigt.sur(page);
  await doigt.glisser({ x: h!.x + h!.width / 2, y: h!.y + h!.height / 2 }, { x: c!.x + c!.width / 3, y: h!.y + h!.height / 2 }, { dureeMs: 500 });
  await page.waitForTimeout(800);
  const b = await nomsBande(page);
  test.skip(b?.grain !== 'jour', `la bande n'est pas en jours (${b?.grain})`);
  expect((await cadre(page)).etiquette).toMatch(/^S\d{1,2}( \d{4})?( – S\d{1,2})? \d{4}$/);
});

test('CAL-GRADUATION-ROGNEE : aucun nom de la bande rogné au bord ni chevauché, à chaque durée', async ({ page }) => {
  test.setTimeout(420_000);
  const auj = aujourdhuiZurich();
  const moisPlus = (n: number) => { const d = new Date(Date.UTC(Number(auj.slice(0, 4)), Number(auj.slice(5, 7)) - 1 + n, 1)); return `01.${String(d.getUTCMonth() + 1).padStart(2, '0')}.${d.getUTCFullYear()}`; };
  const ans = (n: number) => moisPlus(12 * n);
  const cas: Array<[string, () => Promise<void>]> = [
    ['6 sem.', () => choisirPeriode(page, '6 sem.')], ['3 mois', () => choisirPeriode(page, '3 mois')], ['6 mois', () => choisirPeriode(page, '6 mois')],
    ['An', () => choisirPeriode(page, 'An')], ['20 mois', () => plageApp(page, ans(0), moisPlus(20))],
    ['3 ans', () => plageApp(page, ans(0), ans(3))]
  ];
  const fautes: string[] = [];
  for (const [nom, agir] of cas) {
    await agir();
    for (const decal of [0, 1, 2, 3]) {
      if (decal) { await page.getByRole('button', { name: 'Période suivante' }).first().tap().catch(() => undefined); await page.waitForTimeout(400); }
      const b = await nomsBande(page);
      if (!b) continue;
      for (const n of b.noms) if (n.l < -0.5 || n.r > b.largeur + 0.5) fautes.push(`${nom}+${decal} : « ${n.t} » rogné (${Math.round(n.l)}…${Math.round(n.r)} / ${Math.round(b.largeur)})`);
      const tries = [...b.noms].sort((x, y) => x.l - y.l);
      for (let i = 1; i < tries.length; i++) if (tries[i].l < tries[i - 1].r - 0.5) fautes.push(`${nom}+${decal} : « ${tries[i - 1].t} » et « ${tries[i].t} » se chevauchent`);
    }
  }
  expect(fautes).toEqual([]);
});

test('3 ans : la bande en mois dit les années (jamais « J A J O » seul)', async ({ page }) => {
  const auj = aujourdhuiZurich();
  await plageApp(page, `01.01.${auj.slice(0, 4)}`, `31.12.${Number(auj.slice(0, 4)) + 2}`);
  const b = await nomsBande(page);
  expect(b, 'bande sur la courbe').not.toBeNull();
  const textes = b!.noms.map((n) => n.t);
  expect(textes.some((t) => /^\d{4}$/.test(t)), `noms de la bande à 3 ans : ${textes.join(' ')}`).toBe(true);
});
