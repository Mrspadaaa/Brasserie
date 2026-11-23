// Lot 3 du Carnet (LISTE.md du 23.11, « Carnet ouvert : mise en page ») : L-17 (paysage), L-18 (rangée Quand), L-19 (tableau des articles),
// L-22 (menu ⋯). Mesures du DOM sur la fixture, au doigt ; jamais un texte de capture attendu.
import { test, expect, type Page } from '@playwright/test';
import { ouvrirCarnet, ouvrirUnCarnet, poserFixtureCarnet } from '../outils/carnet';

const pause = (p: Page) => p.waitForTimeout(450);

/** Le champ du bas et la barre d'onglets de l'app : le champ doit être entier au-dessus de la barre (L-17). */
function champEtBarre(page: Page) {
  return page.evaluate(() => {
    const champ = document.querySelector<HTMLElement>('[data-carnets] .cn-champ-zone .cn-champ');
    const nav = [...document.querySelectorAll<HTMLElement>('nav')].find(n => { const r = n.getBoundingClientRect(); return r.height > 0 && r.bottom >= innerHeight - 2 && r.top > innerHeight / 2; });
    return { champ: champ?.getBoundingClientRect().toJSON() as DOMRect | undefined, nav: nav?.getBoundingClientRect().toJSON() as DOMRect | undefined, h: innerHeight };
  });
}

/** La rangée Quand : chaque puce entière à l'écran, touchable en son centre, en 14 px au moins (L-18). */
function puncesQuand(page: Page) {
  return page.evaluate(() => {
    const g = document.querySelector<HTMLElement>('.cn-quand [role=group][aria-label="Quand"]');
    if (!g) return { defauts: ['rangée Quand absente'], places: [] as string[], choisi: null as string | null };
    const defauts: string[] = [];
    const places: string[] = [];
    let choisi: string | null = null;
    for (const b of g.querySelectorAll<HTMLButtonElement>('button')) {
      const r = b.getBoundingClientRect(); const t = (b.textContent ?? '').trim();
      if (r.left < -1 || r.right > innerWidth + 1) defauts.push(`« ${t} » hors écran (${Math.round(r.left)}–${Math.round(r.right)})`);
      const e = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
      if (!e || !b.contains(e)) defauts.push(`« ${t} » recouvert par ${e ? `${e.tagName}.${(e as HTMLElement).className}` : 'rien'}`);
      if (b.scrollWidth > b.clientWidth + 1) defauts.push(`« ${t} » rogné`);
      const fs = parseFloat(getComputedStyle(b).fontSize); if (fs < 14) defauts.push(`« ${t} » en ${fs} px`);
      if (b.getAttribute('aria-pressed') === 'true') choisi = t;
      places.push(`${t}@${Math.round(r.left - g.getBoundingClientRect().left)},${Math.round(r.top - g.getBoundingClientRect().top)}`);
    }
    return { defauts, places, choisi };
  });
}

async function montrerQuand(page: Page) {
  await page.locator('.cn-quand').first().evaluate(e => e.scrollIntoView({ block: 'center' }));
  await pause(page);
}

/** Le tableau des articles : aucune valeur rognée, aucune colonne collée à sa voisine (< 4 px), aucun en-tête en double (L-19). */
function tableau(page: Page) {
  return page.evaluate(() => {
    const out: string[] = [];
    const tab = document.querySelector<HTMLElement>('[data-carnets] .cn-tab');
    if (!tab) return ['tableau absent'];
    const ent = [...tab.querySelectorAll<HTMLElement>('.cn-tab-cols [role=columnheader]')].map(e => (e.innerText ?? '').replace(/\s+/g, ' ').trim());
    const vus = new Set<string>(); for (const t of ent) { if (vus.has(t)) out.push(`en-tête « ${t} » deux fois`); vus.add(t); }
    for (const ligne of tab.querySelectorAll<HTMLElement>('.cn-tab-ligne')) {
      const cellules = [...ligne.children] as HTMLElement[];
      const rl = ligne.getBoundingClientRect();
      for (const c of cellules) {
        const r = c.getBoundingClientRect(); const t = (c.innerText ?? '').replace(/\s+/g, ' ').trim().slice(0, 30);
        if (!t) continue;
        if (r.right > rl.right + 1) out.push(`« ${t} » sort de sa ligne (${Math.round(r.right)} > ${Math.round(rl.right)})`);
        for (const s of c.querySelectorAll<HTMLElement>('*')) { const rs = s.getBoundingClientRect(); if (rs.width && (rs.right > r.right + 1 || rs.right > rl.right + 1)) { out.push(`« ${t} » rogné (${Math.round(rs.right)} > ${Math.round(Math.min(r.right, rl.right))})`); break; } }
        if (c.scrollWidth > c.clientWidth + 1) out.push(`« ${t} » déborde de sa cellule`);
      }
      const nums = cellules.filter(c => c.classList.contains('cn-tab-num'));
      const textes = [cellules.find(c => c.classList.contains('cn-tab-nom') || c.classList.contains('cn-tab-rangart')), ...nums].filter(Boolean) as HTMLElement[];
      for (let i = 1; i < textes.length; i++) {
        const a = textes[i - 1], b = textes[i];
        const fa = a.querySelector<HTMLElement>('.cn-mono, span') ?? a; const ra = a.classList.contains('cn-tab-num') ? fa.getBoundingClientRect() : a.getBoundingClientRect();
        const fb = b.querySelector<HTMLElement>('.cn-mono, .cn-inconnu') ?? b; const rb = fb.getBoundingClientRect();
        if (rb.width && ra.width && rb.left - ra.right < 4) out.push(`« ${(a.innerText ?? '').trim().slice(0, 16)} » colle à « ${(b.innerText ?? '').trim().slice(0, 16)} » (${Math.round(rb.left - ra.right)} px)`);
      }
    }
    return out;
  });
}

test.describe('Lot 3 : carnet ouvert, mise en page', () => {
  test('L-17 : en paysage, le champ est entier au-dessus de la barre (liste et carnet ouvert)', async ({ page }, info) => {
    test.skip(info.project.name !== 'paysage-844', 'paysage seulement');
    await poserFixtureCarnet(page);
    await ouvrirCarnet(page); await pause(page);
    for (const ou of ['liste', 'carnet'] as const) {
      if (ou === 'carnet') { await ouvrirUnCarnet(page, /ZZ TEST — Chambre froide/); await pause(page); }
      const { champ, nav } = await champEtBarre(page);
      expect(champ, `${ou} : champ présent`).toBeTruthy();
      expect(nav, `${ou} : barre présente`).toBeTruthy();
      expect(champ!.bottom, `${ou} : bas du champ ${Math.round(champ!.bottom)} au-dessus de la barre ${Math.round(nav!.top)}`).toBeLessThanOrEqual(nav!.top + 1);
      expect(champ!.top, `${ou} : haut du champ à l'écran`).toBeGreaterThanOrEqual(0);
      // M4-1 : un toucher au milieu du champ tombe dans le champ (pas dans la barre), et rien d'autre ne s'y cache dessous
      const sous = await page.evaluate(({ x, y }) => { const e = document.elementFromPoint(x, y); return e?.closest('.cn-champ') ? 'champ' : e?.closest('nav') ? 'barre' : (e as HTMLElement | null)?.className ?? 'rien'; }, { x: champ!.left + 40, y: (champ!.top + champ!.bottom) / 2 });
      expect(sous, `${ou} : sous le doigt au milieu du champ`).toBe('champ');
    }
  });

  for (const titre of [/ZZ TEST — Chambre froide/, 'Frigo + congel']) {
    test(`L-18 : rangée Quand de « ${titre} » : puces entières, touchables, 14 px, même forme après un choix`, async ({ page }, info) => {
      test.skip(info.project.name !== 'android-390', '390 seulement');
      await poserFixtureCarnet(page);
      await ouvrirCarnet(page); await ouvrirUnCarnet(page, titre); await pause(page);
      await montrerQuand(page);
      const avant = await puncesQuand(page);
      expect(avant.defauts, 'au repos').toEqual([]);
      for (const h of ['3 mois', '1 mois']) {
        await page.locator('.cn-quand [role=group][aria-label="Quand"] button').filter({ hasText: h }).first().tap();
        await pause(page); await montrerQuand(page);
        const apres = await puncesQuand(page);
        expect(apres.defauts, `après « ${h} »`).toEqual([]);
        expect(apres.choisi, `le choix « ${h} » se voit`).toBe(h);
        // même forme : chaque puce d'avant reste sur sa rangée, à quelques px près (la puce choisie s'écrit en gras) ; « Plus tard » peut s'ajouter au bout
        const lire = (s: string) => { const m = /^(.*)@(-?\d+),(-?\d+)$/.exec(s)!; return { t: m[1], x: +m[2], y: +m[3] }; };
        avant.places.forEach((s, i) => {
          const a = lire(s), b = lire(apres.places[i] ?? '?@-999,-999');
          expect(`${b.t}@rangée ${b.y}`, `forme après « ${h} »`).toBe(`${a.t}@rangée ${a.y}`);
          expect(Math.abs(b.x - a.x), `« ${a.t} » bouge de ${b.x - a.x} px après « ${h} »`).toBeLessThanOrEqual(8);
        });
      }
    });
  }

  for (const titre of [/ZZ TEST — Chambre froide/, /ZZ TEST — Prix en euros/, /ZZ TEST — Ventilation/]) {
    test(`L-19 : tableau de « ${titre} » : rien de rogné, colonnes séparées, en-têtes uniques`, async ({ page }, info) => {
      test.skip(info.project.name === 'bureau-1280', '390 et paysage');
      await poserFixtureCarnet(page);
      await ouvrirCarnet(page); await ouvrirUnCarnet(page, titre); await pause(page);
      expect(await tableau(page)).toEqual([]);
    });
  }

  test('L-22 : le menu ⋯ dit « Supprimer le carnet », idée comme choisi', async ({ page }, info) => {
    test.skip(info.project.name !== 'android-390', '390 seulement');
    await poserFixtureCarnet(page);
    await ouvrirCarnet(page); await ouvrirUnCarnet(page, 'Frigo + congel'); await pause(page);
    await page.locator('[data-carnets] .cn-tete button[aria-label="Plus"]').tap();
    await expect(page.getByRole('menuitem', { name: 'Supprimer le carnet' })).toBeVisible();
  });
});
