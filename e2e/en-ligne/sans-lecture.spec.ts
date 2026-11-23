// CAL-SANS-LECTURE (D436) EN LIGNE (tour 21) : « On avait dit plus de bulle. Et plus de lecture du graph au doigt. » Même geste que
// e2e/calendrier/sans-lecture.spec.ts, sur l'app en ligne : doigt posé hors du cadre et glissé vers la droite (aucune lecture, la frise va vers
// le passé), puis doigt tenu dans le cadre et glissé (aucune lecture). La durée trouvée est remise. Captures ENTIÈRES.
import { expect, test, type Page } from '@playwright/test';
import { Doigt } from '../outils/doigt';
import { boiteCadre, boutonPeriode, choisirPeriode, lireCoherence, semaineAbsolue } from '../outils/calendrier';
import { calendrierEnLigne, ouvrirEnLigne, paquetEnLigne, ramenerAujourdhui } from './outil';

const DOSSIER = process.env.CAPTURES_EN_LIGNE || 'work/missions/2026-11-23-calendrier-en-ligne/en-ligne';
const LECTURE = '.ent-lit, .ent-lu, .ent-det, [data-curseur]';
const lectures = (page: Page) => page.locator(LECTURE).evaluateAll((l) => l.filter((e) => e.getBoundingClientRect().width > 0).map((e) => (e.textContent || e.getAttribute('class') || '').replace(/\s+/g, ' ').trim().slice(0, 40)));

test('CAL-SANS-LECTURE en ligne : aucune bulle au doigt, hors cadre la frise défile vers le passé', async () => {
  const { page, fermer } = await ouvrirEnLigne();
  try {
    const paquet = await paquetEnLigne(page, process.env.PAQUET);
    await calendrierEnLigne(page);
    const depart = (await boutonPeriode(page).innerText()).trim();
    console.log(`paquet ${paquet} ; durée trouvée « ${depart} »`);
    const ramener = async () => { const d = await Doigt.sur(page); await ramenerAujourdhui(page, choisirPeriode, (a, b) => d.glisser(a, b, { dureeMs: 400 })); };
    await ramener();
    await choisirPeriode(page, '3 mois');
    const doigt = await Doigt.sur(page);
    let g = (await boiteCadre(page))!;
    const c0 = await lireCoherence(page);
    const x0 = Math.max(g.courbeL + 6, g.l - 40);
    let pendant1: string[] = [];
    await doigt.glisser({ x: x0, y: g.y }, { x: x0 + 110, y: g.y }, { dureeMs: 400, avantLeve: async () => { pendant1 = await lectures(page); await page.screenshot({ path: `${DOSSIER}/sans-lecture-hors-cadre-pendant.png` }); } });
    await page.waitForTimeout(600);
    const apres1 = await lectures(page);
    const c1 = await lireCoherence(page);
    console.log(`hors cadre : « ${c0.label} » → « ${c1.label} » ; pendant ${JSON.stringify(pendant1)} ; après ${JSON.stringify(apres1)}`);
    await page.screenshot({ path: `${DOSSIER}/sans-lecture-hors-cadre-apres.png` });
    g = (await boiteCadre(page))!;
    const xc = (g.l + g.r) / 2;
    let pendant2: string[] = [];
    await doigt.glisser({ x: xc, y: g.y }, { x: xc + 30, y: g.y }, { tenirMs: 600, dureeMs: 300, avantLeve: async () => { pendant2 = await lectures(page); await page.screenshot({ path: `${DOSSIER}/sans-lecture-cadre-pendant.png` }); } });
    await page.waitForTimeout(600);
    const apres2 = await lectures(page);
    console.log(`dans le cadre : pendant ${JSON.stringify(pendant2)} ; après ${JSON.stringify(apres2)}`);
    await ramener();
    await page.screenshot({ path: `${DOSSIER}/sans-lecture-laisse.png` });
    if (['2 sem.', '6 sem.', '3 mois', '6 mois', 'An'].includes(depart)) await choisirPeriode(page, depart);
    expect(pendant1, 'hors cadre, doigt posé : aucune lecture').toEqual([]);
    expect(apres1, 'hors cadre, doigt levé : aucune lecture').toEqual([]);
    expect(pendant2, 'dans le cadre, doigt tenu : aucune lecture').toEqual([]);
    expect(apres2, 'dans le cadre, doigt levé : aucune lecture').toEqual([]);
    expect(c0.etiquette && c1.etiquette, 'étiquettes lisibles').toBeTruthy();
    expect(semaineAbsolue(c1.etiquette!), `la frise a défilé vers le passé (« ${c0.label} » → « ${c1.label} »)`).toBeLessThan(semaineAbsolue(c0.etiquette!));
  } finally {
    await fermer();
  }
});
