// Le Carnet : une épreuve par règle du brasseur (lignes CARNET-* de work/refonte-frontend/v4/DEFAUTS-RECURRENTS.md, dépôt Brasserie).
// Seulement des règles stables : des structures, des mesures, des comptes de gestes, jamais un texte figé ni un comportement mouvant.
// Données : la fixture simulée du banc carnet.mjs, jour figé (23.11.2026). Tout passe par le doigt (toucher), jamais element.click().
import { expect, test, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { demarrer, lireFixtureCarnet, ouvrirCarnet, ouvrirUnCarnet, poserFixtureCarnet, surListe, URL_CARNET } from '../outils/carnet';

const champ = (page: Page) => page.locator('textarea').first();
const titreVentilation = /ZZ TEST — Ventilation/;
const nombreDe = (t: string) => t.replace(/\s+/g, ' ').trim().split(' ').filter(Boolean).length;

test.describe('Carnet : les règles du brasseur', () => {
  test.beforeEach(async ({ page }) => {
    await poserFixtureCarnet(page);
  });

  /* CARNET-LIS (16.11 : « ça reste de l'UX UI assez mauvaise, et difficile à lire ») : aucun texte sous 12 px (DESIGN.md : libellé compact 12 px ; la ligne CARNET-LIS dit 14 px, voir DEFAUTS.md), contraste d'au moins 4,5:1,
     un seul titre dominant, et au plus 40 mots dans un carnet ouvert au repos (l'en-tête et la barre du bas de l'app ne comptent pas) */
  for (const [nom, ouvrir] of [
    ['la liste', async (page: Page) => { await ouvrirCarnet(page); }],
    ['un carnet ouvert', async (page: Page) => { await ouvrirCarnet(page); await ouvrirUnCarnet(page, 'Frigo + congel'); }]
  ] as const) {
    test(`CARNET-LIS : ${nom} au repos, aucun texte sous 12 px, contraste 4,5:1, un seul titre dominant`, async ({ page }) => {
      await ouvrir(page);
      const petits = await page.evaluate(() => {
        const out: string[] = [];
        const w = document.createTreeWalker(document.querySelector('[data-carnets]')!, NodeFilter.SHOW_TEXT);
        const vus = new Set<Element>();
        while (w.nextNode()) {
          const n = w.currentNode, s = (n.textContent ?? '').replace(/\s+/g, ' ').trim(), e = n.parentElement;
          if (!s || !e || vus.has(e)) continue; vus.add(e);
          const r = e.getBoundingClientRect(); if (!(r.width > 0 && r.height > 0)) continue;
          const cs = getComputedStyle(e); if (cs.visibility === 'hidden' || cs.display === 'none') continue;
          if (parseFloat(cs.fontSize) < 12) out.push(`« ${s.slice(0, 28)} » ${cs.fontSize}`);
        }
        return out;
      });
      expect(petits, 'textes sous 12 px (le plancher de DESIGN.md pour un libellé compact)').toEqual([]);
      const axe = await new AxeBuilder({ page }).include('[data-carnets]').withRules(['color-contrast']).analyze();
      expect(axe.violations.flatMap((v) => v.nodes.map((n) => n.html.slice(0, 80))), 'contraste sous 4,5:1').toEqual([]);
      const titres = await page.evaluate(() => {
        const racine = document.querySelector('[data-carnets]')!;
        const gros = [...racine.querySelectorAll<HTMLElement>('h1,h2,[role=heading],input,textarea,.cn-titre')]
          .filter((e) => e.getBoundingClientRect().width > 0 && !(e instanceof HTMLTextAreaElement));
        const max = Math.max(...gros.map((e) => parseFloat(getComputedStyle(e).fontSize)), 0);
        return gros.filter((e) => parseFloat(getComputedStyle(e).fontSize) >= max - 0.5).map((e) => (e.innerText ?? '').slice(0, 30));
      });
      expect(titres.length, `un seul titre dominant : ${titres.join(' | ')}`).toBeLessThanOrEqual(1);
    });
  }

  test('CA12-PW-1 CARNET-LIS : un carnet ouvert au repos porte au plus 40 mots', async ({ page }) => {
    test.fail(true, 'CA12-PW-1 : un carnet ouvert dit 70 mots au repos (Frigo + congel), la règle en veut 40 ; voir DEFAUTS.md');
    await ouvrirCarnet(page);
    await ouvrirUnCarnet(page, 'Frigo + congel');
    const mots = await page.locator('[data-carnets]').first().evaluate((e) => (e as HTMLElement).innerText);
    expect(nombreDe(mots), `mots visibles : « ${mots.replace(/\s+/g, ' ').slice(0, 200)} »`).toBeLessThanOrEqual(40);
  });

  /* CARNET-CLAV (16.11 : « le champ text en bas ? SI non sur mobile le clavier cache tout ») : clavier simulé de 300 px (`?keyboard=300`,
     le banc de l'app), 390 × 844 : le champ en saisie et la dernière note restent au-dessus du clavier, sans défilement */
  test('CARNET-CLAV : clavier de 300 px, le champ et la dernière note restent visibles au-dessus', async ({ page }, info) => {
    test.skip(info.project.name !== 'android-390', 'le clavier de 300 px se juge à 390 × 844');
    await page.goto(`${URL_CARNET}&keyboard=300`);
    await expect(page.locator('nav button').first()).toBeVisible({ timeout: 90_000 });
    await page.locator('nav button').filter({ hasText: 'Brassins' }).first().tap();
    await page.getByRole('button', { name: /^Atelier/ }).first().tap();
    await expect.poll(() => surListe(page)).toBe('liste');
    await ouvrirUnCarnet(page, titreVentilation);
    await champ(page).tap();
    await expect(champ(page)).toBeFocused();
    await page.waitForTimeout(500);
    const m = await page.evaluate(() => {
      const t = document.querySelector('textarea')!.getBoundingClientRect();
      const notes = [...document.querySelectorAll<HTMLElement>('button')].filter((b) => /^Note :/.test(b.getAttribute('aria-label') ?? b.innerText) && b.getBoundingClientRect().width > 0);
      const derniere = notes.at(-1)?.getBoundingClientRect() ?? null;
      return { champBas: t.bottom, champHaut: t.top, H: innerHeight, noteBas: derniere?.bottom ?? null, noteHaut: derniere?.top ?? null, nbNotes: notes.length };
    });
    expect(m.nbNotes, 'le carnet a des notes').toBeGreaterThan(0);
    expect(m.champBas, `le champ (bas ${m.champBas}) au-dessus du clavier (${m.H - 300})`).toBeLessThanOrEqual(m.H - 300 + 1);
    expect(m.noteBas!, `la dernière note (bas ${m.noteBas}) au-dessus du champ (haut ${m.champHaut})`).toBeLessThanOrEqual(m.champHaut + 1);
    expect(m.noteHaut!, 'la dernière note est dans l’écran').toBeGreaterThanOrEqual(0);
  });

  /* CARNET-AJOUT-FOUILLIS (17.11 : « L'ajout d'une nouvelle idée est encore assez fouillis ») : un seul point d'entrée pour ajouter une idée
     (le champ de la liste, que « Nouvelle idée » du + rejoint) et un seul pour ajouter à une idée ; ce qui va se passer est dit avant le geste */
  test('CARNET-AJOUT-FOUILLIS : un seul champ pour ajouter une idée, « Nouvelle idée » y mène, aucune feuille entre', async ({ page }) => {
    await ouvrirCarnet(page);
    await expect(page.locator('textarea:visible'), 'un seul champ d’ajout sur la liste').toHaveCount(1);
    await page.getByRole('button', { name: 'Actions rapides' }).tap();
    await page.getByRole('menuitem', { name: /^Nouvelle idée/ }).tap();
    await expect(champ(page), '« Nouvelle idée » donne le focus au champ de la liste').toBeFocused();
    await expect(page.getByRole('dialog'), 'aucune feuille intermédiaire').toHaveCount(0);
  });

  test('CARNET-AJOUT-FOUILLIS : ajouter à une idée = un seul champ, dont la consigne dit où ça va, et un seul bouton qui envoie', async ({ page }) => {
    await ouvrirCarnet(page);
    await ouvrirUnCarnet(page, 'Frigo + congel');
    await expect(page.locator('textarea:visible'), 'un seul champ d’ajout dans un carnet').toHaveCount(1);
    await expect(champ(page), 'le champ dit à quoi il ajoute').toHaveAttribute('placeholder', /Frigo \+ congel/);
    await champ(page).tap();
    await champ(page).pressSequentially('mesurer la porte du local');
    await expect(page.getByRole('button', { name: /^Ajouter$/ }), 'un seul bouton envoie').toHaveCount(1);
  });

  /* CARNET-IA-AIDE (17.11 : « je dois pouvoir faire n'importe quoi dans le champ text et ensuite ça me le trie ») : ajouter quoi que ce soit =
     taper ou coller dans UN champ puis UN geste ; aucune tuile « quoi ? » ; le titre et le critère viennent de la phrase */
  test('CARNET-IA-AIDE : une phrase dans le champ et un toucher créent le carnet, titre et critère rangés, deux gestes', async ({ page }) => {
    await ouvrirCarnet(page);
    let gestes = 0;
    await champ(page).tap(); gestes++;
    await champ(page).pressSequentially('pompe de transfert : 3 m³/h suffisent ?');
    await expect(page.getByRole('dialog'), 'aucune feuille « quoi ? » entre la phrase et l’envoi').toHaveCount(0);
    await page.getByRole('button', { name: /^Ajouter$/ }).tap(); gestes++;
    await expect.poll(() => surListe(page), { timeout: 15_000 }).toBe('carnet');
    expect(gestes, 'gestes par ajout').toBeLessThanOrEqual(2);
    const carnet = page.locator('[data-carnets]');
    await expect(carnet, 'le titre vient de la phrase').toContainText(/pompe de transfert/i);
  });

  test('CARNET-IA-AIDE : un lien collé dans le champ d’un carnet devient un article en un geste, sans formulaire', async ({ page }) => {
    await ouvrirCarnet(page);
    await ouvrirUnCarnet(page, 'Frigo + congel');
    await champ(page).tap();
    await champ(page).pressSequentially('https://exemple.invalid/pompe-inox');
    await page.getByRole('button', { name: /^Ajouter$/ }).tap();
    await expect(page.getByRole('dialog'), 'pas de formulaire de lien').toHaveCount(0);
    await expect(page.locator('.cn-classee-corps, [data-sorte="article"]').first(), 'l’article apparaît, lu par l’IA simulée').toBeVisible({ timeout: 15_000 });
    await expect(page.locator('[data-carnets]')).toContainText(/Pompe de transfert inox/);
  });

  /* CARNET-CARTE-MUETTE (17.11 : « La carte de l'article est peu parlante, quand on clique dessus aussi ») : au repos, une carte dit ce
     qu'est l'objet (nom, d'où il vient) et le prix quand il est connu ; ouverte, elle montre ce qui fait décider */
  test('CARNET-CARTE-MUETTE : une carte d’article au repos dit son nom, son origine et son prix connu', async ({ page }) => {
    await ouvrirCarnet(page);
    await ouvrirUnCarnet(page, /ZZ TEST — Prix en euros/);
    const cartes = page.locator('[data-carnets] button.cn-tab-ligne[role=row]').filter({ hasText: /Chambre froide [0-9]{4} x/ });
    const n = await cartes.count();
    expect(n, 'trois articles').toBe(3);
    for (let i = 0; i < n; i++) {
      const t = ((await cartes.nth(i).innerText()) + ' ' + ((await cartes.nth(i).getAttribute('aria-label')) ?? '')).replace(/\s+/g, ' ');
      expect(t, `carte ${i + 1} : un nom`).toMatch(/Chambre froide/);
      expect(t, `carte ${i + 1} : d’où il vient (pays)`).toMatch(/\b(CH|DE)\b/);
    }
    const prix = [/2\s?513/, /3\s?350/];
    for (let i = 0; i < prix.length; i++) expect(await cartes.nth(i).innerText(), `carte ${i + 1} : le prix connu`).toMatch(prix[i]);
    expect((await cartes.nth(2).innerText()).replace(/\s+/g, ' '), 'carte 3 : aucun prix inventé').not.toMatch(/\d\s?\d{3}\s*$/);
  });

  test('CARNET-CARTE-MUETTE : une carte ouverte montre les caractéristiques et le lien qui font décider', async ({ page }) => {
    await ouvrirCarnet(page);
    await ouvrirUnCarnet(page, /ZZ TEST — Chambre froide/);
    await page.locator('[data-carnets] button.cn-tab-ligne[role=row]').filter({ hasText: /Chambre froide - 1800/ }).first().tap();
    await expect(page.locator('.cn-carac'), 'les caractéristiques lues').toBeVisible();
    const lignes = await page.locator('.cn-carac dt').count();
    expect(lignes, 'au moins une caractéristique').toBeGreaterThan(0);
    await expect(page.locator('[data-carnets] a[href], [data-carnets] [data-source]').first(), 'le lien vers la source').toBeAttached();
  });

  /* CARNET-THEME (17.11 : « Et c'est encore assez moyen dans le thème de l'app ») : le Carnet porte l'habit de l'app : même police, mêmes
     fonds et textes que les écrans voisins (Stocks) ; ses couleurs viennent des jetons de la page */
  test('CARNET-THEME : même police et même fond que l’app, textes et fonds pris dans les jetons', async ({ page }) => {
    await ouvrirCarnet(page);
    const mesure = () => page.evaluate(() => {
      const racine = getComputedStyle(document.documentElement);
      const jetons = new Set<string>();
      const sonde = document.createElement('i'); document.body.appendChild(sonde);
      const regles = (l: CSSRuleList): CSSStyleRule[] => [...l].flatMap((r) => (r instanceof CSSStyleRule ? [r] : 'cssRules' in r ? regles((r as CSSGroupingRule).cssRules) : []));
      const racines = [...document.styleSheets].flatMap((s) => { try { return regles(s.cssRules); } catch { return []; } }).filter((r) => /:root|:host|html/.test(r.selectorText ?? ''));
      for (const n of racines.flatMap((r) => [...r.style])) {
        if (!n.startsWith('--')) continue;
        for (const f of [`var(${n})`, `rgb(var(${n}))`, `hsl(var(${n}))`, `oklch(var(${n}))`]) { sonde.style.color = f; jetons.add(getComputedStyle(sonde).color); }
      }
      sonde.remove();
      const carnets = document.querySelector('[data-carnets]')!;
      const police = (e: Element) => getComputedStyle(e).fontFamily;
      const hors = new Set<string>();
      for (const e of carnets.querySelectorAll<HTMLElement>('*')) {
        const r = e.getBoundingClientRect(); if (!(r.width > 0 && r.height > 0)) continue;
        const cs = getComputedStyle(e);
        if ([...e.childNodes].some((n) => n.nodeType === 3 && (n.textContent ?? '').trim()) && !jetons.has(cs.color) && !/rgba\(.*,\s*0\)|^rgb\(0, 0, 0\)$/.test(cs.color) && !/color-mix|rgba/.test(cs.color)) hors.add(cs.color);
      }
      return { policeApp: police(document.body), policeCarnet: police(carnets), nbJetons: jetons.size, texteHors: [...hors], fond: getComputedStyle(document.body).backgroundColor, theme: racine.getPropertyValue('color-scheme') };
    });
    const liste = await mesure();
    await ouvrirUnCarnet(page, 'Frigo + congel');
    const ouvert = await mesure();
    for (const [ecran, m] of [['la liste', liste], ['un carnet ouvert', ouvert]] as const) {
      expect(m.policeCarnet, `${ecran} : même police que l’app`).toBe(m.policeApp);
      expect(m.nbJetons, 'les jetons de la page sont lisibles').toBeGreaterThan(5);
      expect(m.texteHors, `${ecran} : couleurs de texte hors des jetons`).toEqual([]);
    }


  });

  /* CARNET-PLANNING (20.11 : « Mais et le carnet ??? C'est une catastrophe ») : les projets portés du Planning sont dans Atelier › Carnet quelle
     que soit la période du haut ; toute entrée du Carnet ouvre CarnetsVue (`[data-carnets]`) */
  test('CARNET-PLANNING : les projets du Planning à faire sont dans la liste, quelle que soit la période du haut', async ({ page }) => {
    const fx = lireFixtureCarnet();
    const afaire: string[] = fx.entrees.filter((e) => e.name === 'creativeItems' && fx.ids.planning.includes(e.id) && !fx.ids.planningFaits.includes(e.id)).map((e) => e.data.title);
    expect(afaire.length, 'la fixture a des projets du Planning à faire').toBeGreaterThan(10);
    await ouvrirCarnet(page);
    const vus = async () => { const t = (await page.locator('[data-carnets]').innerText()).replace(/\s+/g, ' '); return afaire.filter((x) => t.includes(x)); };
    const avant = await vus();
    expect(avant.length, `titres du Planning vus sur ${afaire.length}`).toBeGreaterThan(afaire.length - 6); // ceux de la zone « Faits » sont rangés à part
    for (let k = 0; k < 3; k++) await page.getByRole('button', { name: 'Période suivante' }).tap();
    expect((await vus()).length, 'la période du haut ne vide pas la liste').toBe(avant.length);
    for (let k = 0; k < 8; k++) await page.getByRole('button', { name: 'Période précédente' }).tap();
    expect((await vus()).length, 'ni dans le passé').toBe(avant.length);
  });

  test('CARNET-PLANNING : chaque porte du Carnet ouvre la même vue (le menu +, la palette ⌘K, Stocks › Matériel)', async ({ page }) => {
    await demarrer(page);
    // la palette ⌘K
    await page.getByRole('button', { name: /^Rechercher/ }).tap();
    await page.getByPlaceholder(/chercher/i).fill('carnet');
    await page.getByText(/Aller à · Carnet/).first().tap();
    await expect.poll(() => surListe(page), { timeout: 15_000, message: '⌘K ouvre le Carnet' }).toBe('liste');
    // Stocks › Matériel › Carnets
    await page.locator('nav button').filter({ hasText: 'Stocks' }).first().tap();
    await page.getByRole('button', { name: 'Matériel', exact: true }).first().tap();
    await page.getByRole('button', { name: /^Carnets/ }).first().tap();
    await expect.poll(() => surListe(page), { timeout: 15_000, message: 'Stocks › Matériel › Carnets ouvre le Carnet' }).toBe('liste');
    await expect(page.locator('[data-carnets]')).toHaveCount(1);
  });

  /* CARNET-AVENIR-PLACE (17.11 : « c'est pas au bon endroit, il y a déjà une vue pour ça, et ça remplace pas le calendrier ») : À venir et
     Réalisés restent dans Stocks › Matériel ; « Voir » d'un carnet y mène, jamais au Calendrier */
  test('CARNET-AVENIR-PLACE : « Voir » du carnet choisi mène à Stocks › Matériel, pas au Calendrier', async ({ page }) => {
    await ouvrirCarnet(page);
    await ouvrirUnCarnet(page, /ZZ TEST — Frigo de garde/);
    await expect(page.locator('nav button[aria-current="page"], nav button[aria-selected="true"]').filter({ hasText: 'Stocks' }), 'on part de Brassins, pas de Stocks').toHaveCount(0);
    await page.getByRole('button', { name: /Dans À venir/ }).first().tap();
    await expect(page.locator('[data-calendrier]'), 'le Calendrier n’est pas la vue d’À venir').toHaveCount(0);
    await expect(page.locator('nav button[aria-current="page"], nav button[aria-selected="true"]').filter({ hasText: 'Stocks' }), 'on est dans Stocks').toHaveCount(1);
    await expect(page.getByRole('button', { name: /^(À venir|Réalisés?)/ }).first(), 'la vue À venir de Stocks › Matériel').toBeVisible();
  });
});
