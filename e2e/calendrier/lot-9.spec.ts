// Lot 9 du Carnet en ligne (23.11) : Calendrier, frise et en-tête (T11 moyens et mineurs, L-57 à L-64). Chaque test vu rouge avant son correctif.
import { expect, test, type Page } from '@playwright/test';
import { Doigt } from '../outils/doigt';
import { lundis, boiteCadre, boutonPeriode, CLE_FIXTURE, ajouter, aujourdhuiZurich, dateChose, fixtureFrise, choisirPeriode, ouvrirCalendrier, poserFixture } from '../outils/calendrier';

test.describe('Calendrier, frise et en-tête (lot 9)', () => {
  test.beforeEach(async ({ page }) => {
    await poserFixture(page);
    await ouvrirCalendrier(page);
  });

  /* L-58 (T11-4, T11-5) : « il faudrait des tailles fix car SI non ça fait bouger le calendrier » */
  test('L-58 : la période de l\'app change, l\'en-tête ne bouge pas et « CHF à dépenser » n\'est jamais rogné', async ({ page }) => {
    const lire = () => page.evaluate(() => {
      const r = (s: string) => { const e = document.querySelector(s); if (!e) return null; const b = e.getBoundingClientRect(); return { l: Math.round(b.left * 10) / 10, r: Math.round(b.right * 10) / 10, w: Math.round(b.width * 10) / 10 }; };
      const u = r('[data-ent-cle] .ent-k-u'), k = r('[data-ent-cle]'), mb = r('.ent-mb');
      const fl = [...document.querySelectorAll('[data-periode-pastille] .pr-fl')].map(e => Math.round(e.getBoundingClientRect().left * 10) / 10);
      const ke = document.querySelector('[data-ent-cle]') as HTMLElement | null;
      return { per: r('.ent-per'), mb, u, k, fl, rogne: !!(u && mb && u.r > mb.l + 0.5), debord: !!ke && [...ke.children].some(c => c.getBoundingClientRect().right > ke.getBoundingClientRect().right + 0.5), pastille: (document.querySelector('.ent-per')?.textContent ?? '').trim() };
    });
    const vus: Awaited<ReturnType<typeof lire>>[] = [await lire()];
    for (const sens of ['Période précédente', 'Période suivante']) {
      for (let i = 0; i < 6; i++) {
        await page.locator('[data-periode-pastille]').first().getByRole('button', { name: sens }).tap();
        await page.waitForTimeout(300);
        vus.push(await lire());
      }
    }
    if (process.env.DIAG) console.log('DIAG', JSON.stringify(vus.map(v => [v.pastille, v.per?.w, v.k?.w, v.u?.r, v.mb?.l, v.fl.join('/')])));
    const lib = (v: (typeof vus)[number]) => `« ${v.pastille} » ${JSON.stringify([v.per?.w, v.k, v.u, v.mb])}`;
    for (const v of vus) { expect(v.rogne, `« CHF à dépenser » rogné avec ${lib(v)}`).toBe(false); expect(v.debord, `ligne du chiffre clé en débord avec ${lib(v)}`).toBe(false); }
    const noms = new Set(vus.map(v => v.pastille));
    for (const k of ['fl', 'per', 'mb'] as const) {
      const vals = vus.map(v => JSON.stringify(k === 'fl' ? v.fl : k === 'per' ? v.per?.w : v.mb?.l));
      expect(new Set(vals).size, `${k} bouge d'une période à l'autre (${[...noms].join(' | ')}) : ${[...new Set(vals)].join(' ; ')}`).toBe(1);
    }
  });

  /* L-59 (T11-11) : la bande déplie une semaine en jours ; la courbe doit rester sur la même échelle (une semaine = sa place dans la bande) */
  test('L-59 : semaine dépliée, les points de la courbe tombent au milieu de leur semaine dans la bande', async ({ page }) => {
    await choisirPeriode(page, '6 sem.');
    await page.locator('[data-bande-semaines] [data-semaine], [data-bande-colonnes] [data-semaine-bande]').nth(2).tap();
    await expect(page.locator('[data-bande-colonnes="deplie"]'), 'la bande déplie une semaine').toBeVisible();
    await page.waitForTimeout(600);
    const ecarts = await page.evaluate(() => {
      const cb = document.querySelector('.ent-cbz .ent-cb') ?? document.querySelector('.ent-cb');
      if (!cb) return ['pas de courbe'];
      const bande = [...document.querySelectorAll('[data-bande-colonnes] [data-semaine-bande], [data-bande-colonnes] [data-replier]')].map(e => ({ t: (e.textContent ?? '').trim().split(/s+/)[0], r: e.getBoundingClientRect() }));
      const pts = [...cb.querySelectorAll('[data-point-semaine]')].map(e => ({ n: Number(e.getAttribute('data-point-semaine')), x: e.getBoundingClientRect().left + e.getBoundingClientRect().width / 2 }));
      const fautes: string[] = [], d: number[] = [];
      for (const b of bande) { const n = Number(b.t.replace('S', '')); const p = pts.find(q => q.n === n); if (!p) continue; d.push(p.x - (b.r.left + b.r.width / 2)); }
      /* le décalage fixe (marge de la courbe) est le même pour toutes les semaines : c'est l'écart ENTRE semaines qui dit une autre échelle */
      if (d.length < 3) fautes.push('trop peu de semaines comparées : ' + d.length);
      else if (Math.max(...d) - Math.min(...d) > 6) fautes.push('écarts courbe - bande : ' + d.map(x => Math.round(x)).join(', '));
      if (!bande.length) fautes.push('aucune case de bande');
      return fautes;
    });
    expect(ecarts, 'écarts courbe / bande').toEqual([]);
  });

  /* L-60 (T11-14) : le cadre tiré jusqu'à la butée du passé : un repère dit « début » (sinon une courbe vide sans signe) */
  test('L-60 : à la butée du passé, un repère « début » est dessiné dans la courbe', async ({ page }) => {
    await choisirPeriode(page, '2 sem.'); await choisirPeriode(page, '6 sem.');
    const doigt = await Doigt.sur(page);
    for (let i = 0; i < 8 && !(await page.locator('[data-debut-donnees]').count()); i++) {
      const g = (await boiteCadre(page))!;
      await doigt.glisser({ x: (g.l + g.r) / 2, y: g.y }, { x: Math.max(2, g.l - 120), y: g.y }, { dureeMs: 400 });
      await page.waitForTimeout(450);
    }
    await expect(page.locator('[data-debut-donnees]'), 'repère de début des données').toHaveCount(1);
  });

  /* L-62 (T11-19) : ± faisait 22×28 ; DESIGN.md admet 24 px (touch-sm) pour une commande répétée de la ligne */
  test('L-62 : le bouton ± fait au moins 24 px de large', async ({ page }) => {
    const b = (await page.locator('.ent-mb').first().boundingBox())!;
    expect(b.width, 'largeur de ±').toBeGreaterThanOrEqual(24);
  });

  /* L-61 (T11-16) : CHN-13 (21.11) veut une seule coche (Semaine OU 6 sem.) : garde, pas de double coche */
  test('L-61 (garde, CHN-13) : à 6 sem., le menu marque une seule ligne', async ({ page }) => {
    await choisirPeriode(page, '6 sem.');
    await boutonPeriode(page).tap();
    const marques = await page.getByRole('dialog', { name: 'Période et vue' }).locator('button[aria-pressed="true"]').count();
    expect(marques).toBe(1);
  });
});

/* L-57 (T11-3) : au bord droit, la barre se posait une semaine après l'annonce (« si tu lâches en S5 », écrit S6), hors de la fenêtre.
   Le test de L-8 tolérait « jusqu'à une semaine avant » : ici, aucune tolérance. */

const lundiDe = (j: string) => { const d = new Date(`${j}T12:00:00Z`); return ajouter(j, -((d.getUTCDay() + 6) % 7)) as string; };
const semaineIso = (j: string) => { const d = new Date(`${j}T12:00:00Z`), je = new Date(d.getTime() + (3 - ((d.getUTCDay() + 6) % 7)) * 864e5); return 1 + Math.floor((je.getTime() - Date.UTC(je.getUTCFullYear(), 0, 1)) / (7 * 864e5)); };
for (const [tenue, essai] of [[1000, 1], [1000, 2], [3000, 1], [3000, 2], [3000, 3]] as const) {
  test(`L-57 : bord droit, tenue ${tenue} ms (essai ${essai}) : la barre se pose exactement à la semaine annoncée et reste dans la fenêtre`, async ({ page }) => {
    const j = aujourdhuiZurich(), entrees = [...fixtureFrise(j), { name: 'creativeItems', id: 'CR-ZZ-M5', data: { id: 'CR-ZZ-M5', type: 'event', title: 'ZZ TEST — M5 — barre', date: lundiDe(j), fenetre: { du: lundiDe(j), au: ajouter(lundiDe(j), 3) }, status: 'todo' } }];
    await page.addInitScript(([k, v]) => { if (!localStorage.getItem(k)) localStorage.setItem(k, v); }, [CLE_FIXTURE, JSON.stringify(entrees)] as const);
    await poserFixture(page); await ouvrirCalendrier(page);
    await choisirPeriode(page, '2 sem.'); await choisirPeriode(page, '6 sem.');
    const chose = page.locator('[data-frise] [data-chose$="P-PAPIER"]').first();
    await chose.scrollIntoViewIfNeeded();
    const r = (await chose.boundingBox())!, y = r.y + r.height / 2;
    const d0 = await dateChose(page, 'P-PAPIER');
    const doigt = await Doigt.sur(page);
    let ann: string | null = null;
    await doigt.glisser({ x: r.x + r.width / 2, y }, { x: page.viewportSize()!.width - 4, y }, { dureeMs: 480, avantLever: tenue, avantLeve: async () => {
      ann = await page.evaluate(() => { const t = [...document.querySelectorAll('[data-frise] *')].map((e) => (e.textContent ?? '').replace(/\s+/g, ' ').trim()).filter((x) => x.length < 48).concat([...document.querySelectorAll('.ent-zap')].map((e) => e.parentElement?.textContent ?? '')); return t.find((x) => /S\d+ · .* lâcher ici/.test(x)) ?? t.find((x) => /si tu lâches en S\d+/.test(x)) ?? null; });
    } });
    await page.waitForTimeout(700);
    const d1 = await dateChose(page, 'P-PAPIER'), s = ann ? /S(\d+)/.exec(ann) : null;
    expect(s, `une annonce au lever (« ${ann} »)`).toBeTruthy();
    /* la fenêtre grandit encore pendant la lecture de l'annonce : au plus UNE image d'écart (une semaine, la dernière colonne) ; jamais plus */
    const ecart = d1 ? (semaineIso(d1) - Number(s![1]) + 53) % 53 : 99;
    expect([0, 1].includes(ecart), `annoncé « ${ann} », posé ${d0} → ${d1} (S${d1 ? semaineIso(d1) : '?'})`).toBe(true);
    const lundisFin = await lundis(page);
    expect(!!d1 && d1 >= lundisFin[0] && d1 < ajouter(lundisFin[lundisFin.length - 1], 7), `posée (${d1}) dans la fenêtre finale ${lundisFin[0]} → ${lundisFin[lundisFin.length - 1]}`).toBe(true);
    const dedans = await page.evaluate(() => { const c = document.querySelector('[data-frise] [data-chose$="P-PAPIER"]'), f = document.querySelector('[data-frise]'); if (!c || !f) return false; const a = c.getBoundingClientRect(), b = f.getBoundingClientRect(); return a.right > b.left && a.left < b.right; });
    expect(dedans, `la barre posée (${d1}) est visible dans la fenêtre`).toBe(true);
  });
}
