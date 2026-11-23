// CAL-BANDE-JAMAIS-VIDE (23.11, en ligne, tour 22, capture 1215-bande-vide.jpg) : à « 20 mois » (période Tout, 24 nov. 2025 – 11 juil. 2027), la
// bande des graduations était vide : aucun mois ne tenait son initiale entre ses deux traits. « Répare déjà ça. » Rouge sur origin/main 0f6b1ba5c.
import { expect, test, type Page } from '@playwright/test';
import { Doigt } from '../outils/doigt';
import { boutonPeriode, choisirPeriode, ouvrirCalendrier, poserFixture } from '../outils/calendrier';

const enMois = (t: string) => { const m = /^(\d+) (mois|ans)$/.exec(t.trim()); return m ? Number(m[1]) * (m[2] === 'ans' ? 12 : 1) : t.trim() === 'An' ? 12 : 0; };

/** Les noms visibles de la bande (mois, années, semaines, jours) : au moins trois, dans la courbe, aucun sur un autre. */
async function fautesBande(page: Page, quand: string): Promise<string[]> {
  return page.evaluate((quand) => {
    const bande = document.querySelector('[data-bande-semaines]');
    if (!bande) return [`${quand} : pas de bande`];
    const b = bande.getBoundingClientRect();
    const noms = [...bande.querySelectorAll<HTMLElement>('.ent-sem, .ent-bd-j')].map((e) => ({ t: e.textContent ?? '', r: e.getBoundingClientRect() }))
      .filter((n) => n.t.trim() && n.r.width > 0).sort((p, q) => p.r.left - q.r.left);
    const f: string[] = [];
    if (noms.length < 3) f.push(`${quand} : ${noms.length} nom(s) dans la bande : ${noms.map((n) => n.t).join(' ')}`);
    for (const n of noms) if (n.r.left < b.left - 0.5 || n.r.right > b.right + 0.5) f.push(`${quand} : « ${n.t} » rogné (${Math.round(n.r.left)}–${Math.round(n.r.right)})`);
    noms.slice(1).forEach((n, k) => { if (n.r.left < noms[k].r.right - 0.5) f.push(`${quand} : « ${noms[k].t} » et « ${n.t} » se chevauchent`); });
    return f;
  }, quand);
}

test('CAL-BANDE-JAMAIS-VIDE : au-delà de l’An, puis ramenée à 20 mois et 16 mois, la bande garde au moins trois noms lisibles', async ({ page }) => {
  await poserFixture(page);
  await ouvrirCalendrier(page);
  await choisirPeriode(page, 'An');
  const doigt = await Doigt.sur(page);
  const largeur = page.viewportSize()!.width;
  const duree = async () => (await boutonPeriode(page).innerText()).trim();
  const fautes: string[] = [...await fautesBande(page, 'An')];
  // au-delà de 20 mois : la poignée de fin tenue au bord
  for (let essai = 0; essai < 6 && enMois(await duree()) <= 21; essai++) {
    const h = (await page.locator('[data-poignee="fin"]').first().boundingBox())!, y = h.y + h.height / 2;
    await doigt.tenirAuBord({ x: h.x + h.width / 2, y }, { x: largeur - 3, y }, 1500, { mode: 'immobile' });
    await page.waitForTimeout(600);
  }
  const vues: string[] = [await duree()];
  fautes.push(...await fautesBande(page, vues[0]));
  // ramenée à 20 mois (sa capture), puis 16 : la poignée de fin glissée vers la gauche du nombre de semaines voulu
  for (const cible of [20, 16]) {
    for (let essai = 0; essai < 5 && enMois(await duree()) !== cible; essai++) {
      const c = (await page.locator('.ent-cadre').boundingBox())!, pas = c.width / (enMois(await duree()) * 4.348);
      const h = (await page.locator('[data-poignee="fin"]').first().boundingBox())!, x = h.x + h.width / 2, y = h.y + h.height / 2;
      await doigt.glisser({ x, y }, { x: x - (enMois(await duree()) - cible) * 4.348 * pas, y }, { dureeMs: 500 });
      await page.waitForTimeout(600);
    }
    const t = await duree();
    vues.push(t);
    fautes.push(...await fautesBande(page, t));
  }
  expect(vues.map(enMois), `durées vues : ${vues.join(', ')}`).toEqual([expect.any(Number), 20, 16]);
  expect(fautes).toEqual([]);
});
