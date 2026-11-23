// CAL-UN-SEUL-AXE (D441, 3e plainte, 23.11) : « Toujours un gros problème entrer l'axe du graph et l'axe du calendrier, 3 ème fois que je le
// dis... » (10sem-0947, 3sem-0947 : la bande suit la fenêtre de la courbe, les rangées étiraient le cadre : « prête 29 déc. » sous S1).
// CAL-GRILLE-SUR-GRADUATIONS (23.11) : « le découpage en section … c'est pas corrélé à l'échelle ça donne aucune information ??? » (grille-0951).
// À chaque durée (menu, ses deux gestes 10 et 3 sem., pendant le tirage) : chaque barre posée commence et finit au x de ses dates sur la bande
// (± 2,5 px) ; chaque ligne des rangées tombe sur une graduation de la bande (± 1 px) et chaque graduation a sa ligne. Rouge sur le tour 18.
import { expect, test, type Page } from '@playwright/test';
import { Doigt } from '../outils/doigt';
import { fautesAxe } from '../outils/axe';
import { CLE_CACHE, CLE_FIXTURE, ajouter, aujourdhuiZurich, choisirPeriode, fenetreDe, fixtureFrise, ouvrirCalendrier } from '../outils/calendrier';

async function poser(page: Page) {
  const auj = aujourdhuiZurich(), e = fixtureFrise(auj);
  const plan = (id: string, du: string, au: string) => e.push({ name: 'financialPlans', id, data: { id, title: id.replace('P-ZZ-', 'ZZ TEST '), date: du, amountCents: 1000, direction: 'out', category: 'renovation', source: 'manual', status: 'active', createdAt: `${ajouter(auj, -30)}T08:00:00.000Z`, fenetre: { du, au, joursActifs: 2 } } });
  const lundi = ajouter(auj, -((new Date(`${auj}T12:00:00Z`).getUTCDay() + 6) % 7));
  plan('P-ZZ-COURT', ajouter(lundi, 2), ajouter(lundi, 4));
  plan('P-ZZ-MOYEN', ajouter(lundi, 15), ajouter(lundi, 43));
  plan('P-ZZ-LONG', ajouter(auj, 21), ajouter(auj, 105));
  plan('P-ZZ-LOIN', ajouter(lundi, 120), ajouter(lundi, 200));
  await page.addInitScript(([kf, j]) => { if (!localStorage.getItem(kf)) localStorage.setItem(kf, j); localStorage.setItem('laffinee.theme', 'clair'); }, [CLE_FIXTURE, JSON.stringify(e)] as const);
}

test('CAL-UN-SEUL-AXE et CAL-GRILLE-SUR-GRADUATIONS : une même date, un même x ; les lignes sur les graduations', async ({ page }) => {
  test.skip((page.viewportSize()?.width ?? 0) > 500, 'sa plainte : téléphone en portrait (390)');
  await poser(page);
  await ouvrirCalendrier(page);
  const doigt = await Doigt.sur(page);
  const fautes: string[] = [];
  for (const nom of ['2 sem.', '6 sem.', '3 mois', '6 mois', 'An']) {
    await choisirPeriode(page, nom); await page.waitForTimeout(500);
    fautes.push(...await fautesAxe(page, nom, CLE_CACHE));
  }
  for (const n of [10, 3]) {
    const vue = await fenetreDe(page, doigt, n, false); await page.waitForTimeout(600);
    fautes.push(...await fautesAxe(page, `geste ${vue}`, CLE_CACHE));
    const h = (await page.locator('[data-poignee="fin"]').first().boundingBox())!, y = h.y + h.height / 2, x = h.x + h.width / 2;
    await doigt.glisser({ x, y }, { x: x - 30, y }, { dureeMs: 500, avantLeve: async () => { await page.waitForTimeout(150); fautes.push(...await fautesAxe(page, `${vue}, poignée tirée, doigt posé`, CLE_CACHE)); } });
    await page.waitForTimeout(600);
    fautes.push(...await fautesAxe(page, `${vue}, poignée lâchée`, CLE_CACHE));
  }
  expect(fautes).toEqual([]);
});
