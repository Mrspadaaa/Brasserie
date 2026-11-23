// CAL-ECHELLE-SUIT-CADRE et CAL-GRAIN-SUIT-DUREE EN LIGNE (D432, D433, D434) : sur l'app en ligne, au doigt, les gestes du brasseur : la durée
// choisie au menu (« 2 sem. », sa capture 2sem-0902), le cadre tiré depuis l'An par sa poignée de fin (14, 3, 1 sem., ses captures 14sem-0757,
// 3sem-0800, 1sem-0759), puis la poignée tirée, lue PENDANT le geste. Même lecture et mêmes fautes que le test sur fixture (e2e/outils/echelle).
import { expect, test } from '@playwright/test';
import { Doigt } from '../outils/doigt';
import { boutonPeriode, choisirPeriode, fenetreDe } from '../outils/calendrier';
import { fautesEchelle, lireEchelle } from '../outils/echelle';
import { calendrierEnLigne, ouvrirEnLigne, paquetEnLigne } from './outil';

const DOSSIER = process.env.CAPTURES_EN_LIGNE || 'work/missions/2026-11-23-calendrier-en-ligne/en-ligne';

test('CAL-ECHELLE-SUIT-CADRE en ligne : menu, poignée, pendant le geste', async () => {
  const { page, fermer } = await ouvrirEnLigne();
  try {
    const paquet = await paquetEnLigne(page, process.env.PAQUET);
    await calendrierEnLigne(page);
    const depart = (await boutonPeriode(page).innerText()).trim();
    const doigt = await Doigt.sur(page);
    const toutes: string[] = [];
    const cap = async (nom: string) => { await page.evaluate(() => window.scrollTo(0, 0)); await page.screenshot({ path: `${DOSSIER}/p2-${nom}.png`, clip: { x: 0, y: 0, width: 390, height: 300 } }); };
    const noter = async (ou: string) => { const l = await lireEchelle(page); const f = fautesEchelle(l, ou); toutes.push(...f); console.log(`${ou} : « ${l.etiquette} », grain ${l.grain}, ${l.grads.filter((g) => !g.hors).map((g) => `S${g.n}`).join(' ')}, pastille « ${l.pastille} »${f.length ? ` → ${f.join(' ; ')}` : ' : OK'}`); };
    console.log(`paquet ${paquet} ; durée trouvée « ${depart} »`);
    await choisirPeriode(page, '2 sem.'); await page.waitForTimeout(600); await noter('menu 2 sem.'); await cap('menu-2sem');
    for (const n of [14, 3, 1]) {
      const vue = await fenetreDe(page, doigt, n, false);
      await page.waitForTimeout(700);
      await noter(vue); await cap(`${n}sem`);
      expect.soft(await page.locator('[data-cadre-tirage]').count(), `${vue} : aucune bulle de tirage après le lâcher`).toBe(0);
    }
    const h = (await page.locator('[data-poignee="fin"]').first().boundingBox())!, y = h.y + h.height / 2, x = h.x + h.width / 2;
    await doigt.glisser({ x, y }, { x: Math.min(380, x + 90), y }, { dureeMs: 600, avantLeve: async () => { await noter('poignée tirée, doigt posé'); await cap('pendant'); } });
    await page.waitForTimeout(700); await noter('poignée lâchée');
    if (['2 sem.', '6 sem.', '3 mois', '6 mois', 'An'].includes(depart)) await choisirPeriode(page, depart);
    expect(toutes.filter((t) => !/doigt posé : .*(étiquette|pastille)/.test(t))).toEqual([]);
  } finally {
    await fermer();
  }
});
