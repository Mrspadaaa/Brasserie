// CAL-ECHELLE-SUIT-CADRE (23.11) : « pourquoi quand j'agrandis ou rétrécis l'axe du temps, l'échelle des semaines par exemple de met pas à jour
// avec ?? » (14 sem. : cadre S49–S9 plus étroit que la bande S49…S9 ; 3 sem. : « S49 – S46 2027 » ; 1 sem. : « S52 – S4 2027 »). Ses choix :
// D432 (graduations sur la courbe : le cadre couvre exactement ses semaines, les autres en gris dans les marges), D434 (le cadre dit ses dates),
// D433 (la pastille dit le creux du cadre et le suit). Après chaque durée (1, 3, 6, 14 sem.) et chaque poignée tirée (agrandir, rétrécir).
// 2e refus (tour 15, « Et échelle toujours pas dynamique... ») : le test ne jouait que le tirage depuis l'An et ne lisait qu'au lâcher ; la
// durée choisie au menu (« 2 sem. » : bande des jours sur toute la largeur) et la bande PENDANT le geste n'étaient pas lues. Ajoutés, avec
// CAL-GRAIN-SUIT-DUREE (« si je mets 1 ou 2 ou peut être 3 je devrais voir les jours plutôt que les semaines.. comme les mois pour une année ») :
// jours jusqu'à 3 semaines dans le cadre, semaines au-delà, mois pour un an et plus.
import { expect, test } from '@playwright/test';
import { Doigt } from '../outils/doigt';
import { choisirPeriode, fenetreDe, ouvrirCalendrier, poserFixture } from '../outils/calendrier';
import { fautesEchelle, lireEchelle } from '../outils/echelle';

const lire = lireEchelle, fautes = fautesEchelle;

test('CAL-ECHELLE-SUIT-CADRE : graduations, étiquette et pastille suivent le cadre, à chaque durée et chaque poignée', async ({ page }, info) => {
  test.skip((page.viewportSize()?.width ?? 0) > 500, 'sa plainte : téléphone en portrait (390)');
  await poserFixture(page);
  await ouvrirCalendrier(page);
  const doigt = await Doigt.sur(page);
  const toutes: string[] = [];
  /* les durées du menu (le chemin de sa capture 2sem-0902 : « 2 sem. ») */
  for (const nom of ['2 sem.', '6 sem.', '3 mois']) {
    await choisirPeriode(page, nom);
    await expect.poll(async () => fautes(await lire(page), `menu ${nom}`), { timeout: 3_000, message: nom }).toEqual([]).catch(() => undefined);
    toutes.push(...fautes(await lire(page), `menu ${nom}`));
    await info.attach(`menu-${nom}`, { body: await page.screenshot({ clip: { x: 0, y: 0, width: 390, height: 260 } }), contentType: 'image/png' });
  }
  for (const n of [1, 3, 6, 14]) {
    const vue = await fenetreDe(page, doigt, n);
    await expect.poll(async () => fautes(await lire(page), vue), { timeout: 3_000, message: vue }).toEqual([]).catch(() => undefined);
    toutes.push(...fautes(await lire(page), vue));
    await info.attach(`${n}sem`, { body: await page.screenshot({ clip: { x: 0, y: 0, width: 390, height: 260 } }), contentType: 'image/png' });
    /* agrandir puis rétrécir par la poignée de fin */
    for (const [nom, dx] of [['agrandie', 60], ['rétrécie', -40]] as const) {
      const h = await page.locator('[data-poignee="fin"]').first().boundingBox();
      const x = h!.x + h!.width / 2, y = h!.y + h!.height / 2;
      /* PENDANT le geste (doigt encore posé) : la bande suit déjà le cadre (« dynamique ») */
      await doigt.glisser({ x, y }, { x: Math.max(20, Math.min(380, x + dx)), y }, { dureeMs: 500, avantLeve: async () => { toutes.push(...fautes(await lire(page), `${vue} ${nom}, doigt posé`).filter((t) => !/étiquette|pastille/.test(t))); } });
      await page.waitForTimeout(700);
      toutes.push(...fautes(await lire(page), `${vue} ${nom}`));
      await info.attach(`${n}sem-${nom}`, { body: await page.screenshot({ clip: { x: 0, y: 0, width: 390, height: 260 } }), contentType: 'image/png' });
    }
  }
  expect(toutes).toEqual([]);
});
