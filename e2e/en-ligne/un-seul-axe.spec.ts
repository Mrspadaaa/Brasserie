// CAL-UN-SEUL-AXE (D441), CAL-GRILLE-SUR-GRADUATIONS, D442 EN LIGNE : ses deux gestes (10sem-0947, 3sem-0947) : le cadre tiré depuis l'An à 10 puis
// 3 sem., et pendant le tirage. Chaque colonne des rangées au x de sa date sur la bande, chaque ligne sur une graduation ; la colonne bleue
// d'aujourd'hui la même sur courbe, bande et rangées. Captures d'écran ENTIÈRES (leçon du 9:50), regardées.
import { expect, test } from '@playwright/test';
import { Doigt } from '../outils/doigt';
import { boutonPeriode, choisirPeriode, fenetreDe } from '../outils/calendrier';
import { fautesAxe } from '../outils/axe';
import { calendrierEnLigne, ouvrirEnLigne, paquetEnLigne } from './outil';

const DOSSIER = process.env.CAPTURES_EN_LIGNE || 'work/missions/2026-11-23-calendrier-en-ligne/en-ligne';

test('CAL-UN-SEUL-AXE en ligne : 10 et 3 sem., pendant le tirage', async () => {
  const { page, fermer } = await ouvrirEnLigne();
  try {
    const paquet = await paquetEnLigne(page, process.env.PAQUET);
    await calendrierEnLigne(page);
    const depart = (await boutonPeriode(page).innerText()).trim();
    const doigt = await Doigt.sur(page);
    console.log(`paquet ${paquet} ; durée trouvée « ${depart} »`);
    const fautes: string[] = [];
    const colonneAuj = () => page.evaluate(() => { const b = (s: string) => { const r = document.querySelector(s)?.getBoundingClientRect(); return r && r.width > 0 ? [Math.round(r.left), Math.round(r.right)] : null; }; return { courbe: b('.ent-cb [data-aujourdhui="dans"]'), bande: b('[data-auj-bande]'), rangees: b('[data-frise] [data-col-now]') }; });
    for (const n of [10, 3]) {
      const vue = await fenetreDe(page, doigt, n, false); await page.waitForTimeout(800);
      const f = await fautesAxe(page, `${vue}`); fautes.push(...f);
      const c = await colonneAuj(); console.log(`${vue} : ${f.length} faute(s) ; aujourd'hui ${JSON.stringify(c)}`);
      if (c.courbe && (!c.bande || !c.rangees || Math.abs(c.bande[0] - c.courbe[0]) > 2 || Math.abs(c.rangees[0] - c.courbe[0]) > 2)) fautes.push(`${vue} : D442, colonne d'aujourd'hui ${JSON.stringify(c)}`);
      await page.evaluate(() => window.scrollTo(0, 0)); await page.screenshot({ path: `${DOSSIER}/axe-${n}sem.png` });
      const h = (await page.locator('[data-poignee="fin"]').first().boundingBox())!, y = h.y + h.height / 2, x = h.x + h.width / 2;
      await doigt.glisser({ x, y }, { x: x - 30, y }, { dureeMs: 500, avantLeve: async () => { await page.waitForTimeout(200); fautes.push(...await fautesAxe(page, `${vue}, doigt posé`)); await page.screenshot({ path: `${DOSSIER}/axe-${n}sem-pendant.png` }); } });
      await page.waitForTimeout(700);
    }
    if (['2 sem.', '6 sem.', '3 mois', '6 mois', 'An'].includes(depart)) await choisirPeriode(page, depart);
    expect(fautes).toEqual([]);
  } finally {
    await fermer();
  }
});
