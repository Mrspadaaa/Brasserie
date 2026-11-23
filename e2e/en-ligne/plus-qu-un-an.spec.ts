// CAL-PLUS-QU-UN-AN EN LIGNE (tour 20) : « je peux toujours avoir que 1 ans ??? ». Depuis l'An, la poignée de fin tenue au bord droit puis celle
// de début tenue au bord gauche : la durée passe au-delà d'un an, le cadre commence avant aujourd'hui (passé compris). Captures ENTIÈRES.
import { expect, test } from '@playwright/test';
import { Doigt } from '../outils/doigt';
import { boutonPeriode, choisirPeriode } from '../outils/calendrier';
import { fautesAxe } from '../outils/axe';
import { calendrierEnLigne, ouvrirEnLigne, paquetEnLigne, ramenerAujourdhui } from './outil';

const DOSSIER = process.env.CAPTURES_EN_LIGNE || 'work/missions/2026-11-23-calendrier-en-ligne/en-ligne';
const enMois = (t: string) => { const m = /^(\d+) (mois|ans)$/.exec(t.trim()); return m ? Number(m[1]) * (m[2] === 'ans' ? 12 : 1) : t.trim() === 'An' ? 12 : 0; };

test('CAL-PLUS-QU-UN-AN en ligne : au-delà de 52 semaines, passé compris', async () => {
  const { page, fermer } = await ouvrirEnLigne();
  try {
    const paquet = await paquetEnLigne(page, process.env.PAQUET);
    await calendrierEnLigne(page);
    const depart = (await boutonPeriode(page).innerText()).trim();
    console.log(`paquet ${paquet} ; durée trouvée « ${depart} »`);
    const ramener = async () => { const d = await Doigt.sur(page); await ramenerAujourdhui(page, choisirPeriode, (a, b) => d.glisser(a, b, { dureeMs: 400 })); };
    await ramener();
    await choisirPeriode(page, 'An');
    const doigt = await Doigt.sur(page);
    const largeur = await page.evaluate(() => window.innerWidth);
    const bande = () => page.evaluate(() => [...document.querySelectorAll('[data-bande-semaines] .ent-sem--pas')].map(e => `${e.textContent}@${Math.round(e.getBoundingClientRect().left + e.getBoundingClientRect().width / 2)}(${e.closest('[data-lundi]')?.getAttribute('data-lundi')})`).join(' '));
    const fautes: string[] = [];
    const lire = async () => ({ duree: (await boutonPeriode(page).innerText()).trim(), etiquette: (await page.locator('[data-cadre-etiquette]').first().innerText()).replace(/\s+/g, ' ') });
    let h = (await page.locator('[data-poignee="fin"]').first().boundingBox())!;
    await doigt.tenirAuBord({ x: h.x + h.width / 2, y: h.y + h.height / 2 }, { x: largeur - 3, y: h.y + h.height / 2 }, 3000, { mode: 'immobile' });
    await page.waitForTimeout(900);
    const fin = await lire(); console.log(`fin tirée : ${JSON.stringify(fin)} ; bande ${await bande()}`); fautes.push(...await fautesAxe(page, 'fin tirée'));
    await page.evaluate(() => window.scrollTo(0, 0)); await page.screenshot({ path: `${DOSSIER}/an-plus-fin.png` });
    h = (await page.locator('[data-poignee="debut"]').first().boundingBox())!;
    await doigt.tenirAuBord({ x: h.x + h.width / 2, y: h.y + h.height / 2 }, { x: 3, y: h.y + h.height / 2 }, 3000, { mode: 'immobile' });
    await page.waitForTimeout(900);
    const deb = await lire(); console.log(`début tiré : ${JSON.stringify(deb)} ; bande ${await bande()}`); fautes.push(...await fautesAxe(page, 'début tiré'));
    const auj = await page.evaluate(() => { const c = document.querySelector('[data-cadre-etiquette]')?.closest('.ent-cadre')?.getBoundingClientRect(); const a = document.querySelector('.ent-cb [data-aujourdhui="dans"]')?.getBoundingClientRect(); return { cadreG: c ? Math.round(c.left) : null, aujG: a ? Math.round(a.left) : null }; });
    console.log(`cadre et aujourd'hui : ${JSON.stringify(auj)}`);
    await page.evaluate(() => window.scrollTo(0, 0)); await page.screenshot({ path: `${DOSSIER}/an-plus-passe.png` });
    await ramener();
    await page.screenshot({ path: `${DOSSIER}/plus-qu-un-an-laisse.png` });
    if (['2 sem.', '6 sem.', '3 mois', '6 mois', 'An'].includes(depart)) await choisirPeriode(page, depart);
    expect(fautes, 'un seul axe (D441) au-delà d’un an').toEqual([]);
    expect(enMois(fin.duree), `durée après la fin tirée : « ${fin.duree} »`).toBeGreaterThan(13);
    expect(enMois(deb.duree), `durée après le début tiré : « ${deb.duree} »`).toBeGreaterThan(enMois(fin.duree));
    expect(auj.aujG !== null && auj.cadreG !== null && auj.cadreG < auj.aujG, 'le cadre commence avant aujourd\'hui (passé compris)').toBe(true);
  } finally {
    await fermer();
  }
});
