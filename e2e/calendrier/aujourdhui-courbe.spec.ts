// CAL-AUJOURDHUI-COURBE (23.11) : « on voit plus quel moment on est sur le graph, on voit toujours en bleu notre semaine sur le calendrier,
// mais sur le graph, plus d'indications ». À chaque durée : un trait « aujourd'hui » sur la courbe, à son jour (dans la semaine courante de la
// bande, et sur le chiffre du jour quand la bande dit les jours) ; la fenêtre partie dans l'avenir : « ‹ auj. » au bord. Rouge sur le tour 15.
import { expect, test, type Page } from '@playwright/test';
import { Doigt } from '../outils/doigt';
import { boiteCadre, choisirPeriode, ouvrirCalendrier, poserFixture } from '../outils/calendrier';

const lire = (page: Page) => page.evaluate(() => {
  const m = document.querySelector('.ent-cb [data-aujourdhui]');
  const r = m?.getBoundingClientRect();
  const sem = document.querySelector('[data-bande-semaines] [data-courant]')?.getBoundingClientRect();
  const jour = document.querySelector('[data-bande-semaines] [data-auj]')?.getBoundingClientRect();
  const boite = (sel: string) => { const b = document.querySelector(sel)?.getBoundingClientRect(); return b && b.width > 0 ? { l: b.left, r: b.right } : null; };
  /* D442 (son choix B) : la colonne bleue, la même sur la courbe, la bande et les rangées */
  const colonnes = { courbe: boite('.ent-cb [data-aujourdhui="dans"]'), bande: boite('[data-auj-bande]'), rangees: boite('[data-frise] [data-col-now]') };
  const hors = { bord: document.querySelector('[data-frise] [data-auj-bord]')?.getAttribute('data-auj-bord') ?? null, bande: (document.querySelector('[data-auj-bande]')?.textContent ?? '').trim() };
  return { colonnes, hors, cote: m?.getAttribute('data-aujourdhui') ?? null, x: r ? r.left + r.width / 2 : null, visible: !!r && r.width > 0 && r.height > 0,
    sem: sem ? { l: sem.left, r: sem.right } : null, jour: jour ? jour.left + jour.width / 2 : null };
});

test('CAL-AUJOURDHUI-COURBE : le trait d\'aujourd\'hui à chaque durée, et sa direction quand il sort de la vue', async ({ page }) => {
  await poserFixture(page);
  await ouvrirCalendrier(page);
  for (const nom of ['2 sem.', '6 sem.', '3 mois', '6 mois', 'An']) {
    await choisirPeriode(page, nom);
    const a = await lire(page);
    expect(a.cote, `${nom} : un repère d'aujourd'hui sur la courbe`).toBe('dans');
    expect(a.visible, `${nom} : visible`).toBe(true);
    if (a.sem) expect(a.x! >= a.sem.l - 1 && a.x! <= a.sem.r + 1, `${nom} : le trait (${a.x}) dans la semaine courante de la bande (${a.sem.l}–${a.sem.r})`).toBe(true);
    if (a.jour !== null) expect(Math.abs(a.x! - a.jour), `${nom} : le trait sur le chiffre du jour`).toBeLessThan(4);
    const { courbe, bande, rangees } = a.colonnes;
    expect(courbe && bande && rangees, `${nom} : D442, la colonne bleue sur la courbe, la bande et les rangées`).toBeTruthy();
    for (const c of [bande!, rangees!]) expect(Math.abs(c.l - courbe!.l) + Math.abs(c.r - courbe!.r), `${nom} : D442, une seule colonne (${JSON.stringify(a.colonnes)})`).toBeLessThan(3);
  }
  await choisirPeriode(page, '6 sem.');
  const doigt = await Doigt.sur(page);
  for (let k = 0; k < 4 && (await lire(page)).cote === 'dans'; k++) {
    const g = (await boiteCadre(page))!, x0 = (g.l + g.r) / 2;
    await doigt.glisser({ x: x0, y: g.y }, { x: x0 + 120, y: g.y });
    await page.waitForTimeout(500);
  }
  const b = await lire(page);
  expect(b.cote, 'fenêtre partie dans l\'avenir : la direction d\'aujourd\'hui au bord').toBe('gauche');
  expect(b.visible).toBe(true);
  expect(b.hors, 'D442 hors de la vue : le dégradé au bord des rangées et « ‹ auj. » sur la bande').toEqual({ bord: 'gauche', bande: '‹ auj.' });
});

// CAL-POINT-BLEU-MUET (23.11) : « la pastille bleu, on comprend pas à quoi ça sert » (40sem-0937). Aucun point sur le creux de la petite courbe,
// à chaque durée ; la pastille du creux le dit. Rouge sur le tour 18 (un point à chaque durée).
test('CAL-POINT-BLEU-MUET : aucun point bleu du creux sur la courbe, à chaque durée', async ({ page }) => {
  await poserFixture(page);
  await ouvrirCalendrier(page);
  for (const nom of ['2 sem.', '6 sem.', '3 mois', '6 mois', 'An']) {
    await choisirPeriode(page, nom);
    expect(await page.locator('.ent-cb .ent-creux-pt').count(), `${nom} : aucun point du creux`).toBe(0);
  }
});
