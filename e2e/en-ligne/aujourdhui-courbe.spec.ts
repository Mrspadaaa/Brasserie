// CAL-AUJOURDHUI-COURBE EN LIGNE (tour 18) : « On voit toujours pas sur le graph où est le moment présent » (capture 40sem-0937). Sur l'app en
// ligne, au doigt, le cadre tiré à 1, 6, 40 et 51 sem. depuis l'An : un trait « aujourd'hui » visible sur la courbe, dans la semaine courante
// de la bande (sur le chiffre du jour quand elle dit les jours). Une capture par durée, regardée.
import { expect, test, type Page } from '@playwright/test';
import { Doigt } from '../outils/doigt';
import { boutonPeriode, choisirPeriode, fenetreDe } from '../outils/calendrier';
import { calendrierEnLigne, ouvrirEnLigne, paquetEnLigne } from './outil';

const DOSSIER = process.env.CAPTURES_EN_LIGNE || 'work/missions/2026-11-23-calendrier-en-ligne/en-ligne';

export const lireAujourdhui = (page: Page) => page.evaluate(() => {
  const m = document.querySelector('.ent-cb [data-aujourdhui]');
  const r = m?.getBoundingClientRect();
  const sem = document.querySelector('[data-bande-semaines] [data-courant]')?.getBoundingClientRect();
  const jour = document.querySelector('[data-bande-semaines] [data-auj]')?.getBoundingClientRect();
  return { cote: m?.getAttribute('data-aujourdhui') ?? null, x: r ? r.left + r.width / 2 : null, visible: !!r && r.width > 0 && r.height > 0,
    sem: sem ? { l: sem.left, r: sem.right } : null, jour: jour ? jour.left + jour.width / 2 : null,
    creuxPt: document.querySelectorAll('.ent-cb .ent-creux-pt').length };
});

test('CAL-AUJOURDHUI-COURBE en ligne : 1, 6, 40, 51 sem.', async () => {
  const { page, fermer } = await ouvrirEnLigne();
  try {
    const paquet = await paquetEnLigne(page, process.env.PAQUET);
    await calendrierEnLigne(page);
    const depart = (await boutonPeriode(page).innerText()).trim();
    const doigt = await Doigt.sur(page);
    console.log(`paquet ${paquet} ; durée trouvée « ${depart} »`);
    for (const n of [1, 6, 40, 51]) {
      const vue = await fenetreDe(page, doigt, n, false);
      await page.waitForTimeout(700);
      const a = await lireAujourdhui(page);
      console.log(`${vue} : ${JSON.stringify(a)}`);
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.screenshot({ path: `${DOSSIER}/auj-${n}sem.png`, clip: { x: 0, y: 0, width: 390, height: 300 } });
      expect.soft(a.cote, `${vue} : un trait d'aujourd'hui sur la courbe`).toBe('dans');
      expect.soft(a.visible, `${vue} : visible`).toBe(true);
      if (a.sem && a.x !== null) expect.soft(a.x >= a.sem.l - 1 && a.x <= a.sem.r + 1, `${vue} : le trait (${a.x}) dans la semaine courante (${a.sem.l}–${a.sem.r})`).toBe(true);
      if (a.jour !== null && a.x !== null) expect.soft(Math.abs(a.x - a.jour), `${vue} : sur le chiffre du jour`).toBeLessThan(4);
      if (process.env.SANS_POINT_BLEU) expect.soft(a.creuxPt, `${vue} : aucun point bleu du creux`).toBe(0);
    }
    if (['2 sem.', '6 sem.', '3 mois', '6 mois', 'An'].includes(depart)) await choisirPeriode(page, depart);
  } finally {
    await fermer();
  }
});
