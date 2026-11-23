// Lot 4 du Carnet (mission 2026-11-23-carnet-en-ligne, LISTE.md § Lot 4) : Comparer à 390 (L-26), Comparer d'un carnet Choisi (L-27),
// pictos (L-28), photo jointe (L-24), entités des articles anciens (L-25), photo d'article dans Comparer (L-23). Fixture simulée, au doigt.
import { expect, test, type Page } from '@playwright/test';
import { lireFixtureCarnet, ouvrirCarnet, ouvrirUnCarnet, poserFixtureCarnet } from '../outils/carnet';

const IMG = (teinte: string) => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="120" height="90"><rect width="120" height="90" fill="#dfe5ea"/><rect x="30" y="12" width="60" height="70" rx="4" fill="${teinte}"/><rect x="36" y="20" width="22" height="54" fill="#f6f8f9"/><rect x="62" y="20" width="22" height="54" fill="#f6f8f9"/></svg>`)}`;
const LE = '2026-11-21T08:00:00.000Z';
const carnet = (id: string, title: string, status: string, k: Record<string, unknown>) => ({
  name: 'creativeItems', id, data: { id, type: 'carnet', title, status, carnet: { version: 1, creeLe: LE, phrase: title, criteres: [], facons: [], articles: [], notes: [], photos: [], ...k } }
});

/** La fixture du banc, plus : photos et matériau encodé deux fois sur la Chambre froide, un carnet Choisi à un seul article lu, une levure dans « Pompe ». */
function entrees() {
  const fx = lireFixtureCarnet();
  const e = structuredClone(fx.entrees) as any[];
  const cf = e.find(x => x.data?.title === 'ZZ TEST — Chambre froide');
  cf.data.carnet.articles.forEach((a: any, i: number) => {
    a.photo = IMG(i ? '#5b8ec4' : '#9eaab3');
    /* le nom tel que le vrai carnet « Chambre froide » le montre (titre retiré, M4-11) */
    a.nom = String(a.nom).replace(/^Chambre froide - /, '').replace(/ inclus$/, '');
    a.valeurs['Matériau extérieur'] = { valeur: 'T&ocirc;le d&amp;#039;acier galvanis&eacute;e', origine: 'page', luLe: LE };
  });
  e.push(carnet('ZZ-L4-CHOISI', 'ZZ TEST — Fermenteur conique', 'validated', {
    articles: [
      { id: 'ZZ-L4-C1', url: 'https://exemple.invalid/fermenteur-30', domaine: 'exemple.invalid', nom: 'Fermenteur conique inox 30 L', prixCentimes: 39900, devise: 'CHF', lecture: 'lue', origine: 'exemple', valeurs: {} },
      { id: 'ZZ-L4-C2', url: 'https://autre.invalid/a', domaine: 'autre.invalid', lecture: 'illisible', valeurs: {} },
      { id: 'ZZ-L4-C3', url: 'https://troisieme.invalid/b', domaine: 'troisieme.invalid', lecture: 'illisible', valeurs: {} }
    ],
    choix: { articleId: 'ZZ-L4-C1', pourquoi: 'le seul lu', ecartes: [], le: LE, remplaces: [] }
  }));
  e.push(carnet('ZZ-L4-POMPE', 'ZZ TEST — Pompe de transfert', 'idea', {
    articles: [{ id: 'ZZ-L4-P1', url: 'https://exemple.invalid/levure', domaine: 'exemple.invalid', nom: 'Brewferm brewing yeast Lager 6 g', lecture: 'a-lire', valeurs: {} }],
    photos: [{ id: 'ZZ-L4-PH1', jpeg: IMG('#d9a03f') }]
  }));
  return e;
}

const ouvrirComparer = async (page: Page) => {
  await page.getByRole('button', { name: /^Comparer/ }).first().tap();
  await expect(page.locator('.cn-comparer'), 'Comparer s’ouvre').toBeVisible({ timeout: 15_000 });
};

test.describe('Carnet, lot 4', () => {
  test.beforeEach(async ({ page }) => {
    page.on('pageerror', e => console.log('PAGEERROR', e.message));
    page.on('console', m => { if (m.type() === 'error') console.log('CONSOLE', m.text().slice(0, 300)); });
    await poserFixtureCarnet(page, 'clair', entrees());
  });

  test('L-26 : Comparer, la 1re valeur haut dans l’écran et les noms en entier ; L-23 : la photo de chaque article ; L-25 : texte décodé', async ({ page }, info) => {
    await ouvrirCarnet(page);
    await ouvrirUnCarnet(page, /ZZ TEST — Chambre froide/);
    await ouvrirComparer(page);
    await expect(page.locator('.cn-tableau-comparer thead img'), 'la photo de chaque article').toHaveCount(2);
    const m = await page.evaluate(() => {
      const lignes = [...document.querySelectorAll<HTMLElement>('.cn-tableau-comparer tbody tr')];
      const noms = [...document.querySelectorAll<HTMLElement>('.cn-tableau-comparer .cn-cmp-nom')];
      return {
        prix: Math.round(lignes[0].getBoundingClientRect().top), valeur: Math.round(lignes[1].getBoundingClientRect().top),
        lignesNom: noms.map(n => Math.round(n.getBoundingClientRect().height / parseFloat(getComputedStyle(n).lineHeight))),
        nomEntier: [...document.querySelectorAll<HTMLElement>('.cn-tableau-comparer .cn-col-tete')].every(b => (b.getAttribute('title') ?? '').length > 20),
        decode: document.querySelector('.cn-tableau-comparer')!.textContent!.includes("Tôle d'acier"),
        brut: document.querySelector('.cn-tableau-comparer')!.textContent!.includes('&#039;')
      };
    });
    await page.screenshot({ path: info.outputPath('comparer.png') });
    info.annotations.push({ type: 'mesure', description: JSON.stringify(m) });
    if (info.project.name === 'android-390') {
      expect(m.prix, `1re ligne du tableau (prix) à ${m.prix} px sur 844`).toBeLessThanOrEqual(415);
      expect(m.valeur, `1re valeur lue à ${m.valeur} px sur 844 (avant : ~520)`).toBeLessThanOrEqual(470);
    }
    expect(Math.max(...m.lignesNom), 'un nom d’article tient sur trois lignes au plus (D-58)').toBeLessThanOrEqual(3);
    expect(m.nomEntier, 'le nom entier reste dit (infobulle ; la fiche au toucher)').toBe(true);
    expect(m.brut, '« &#039; » brut').toBe(false);
    expect(m.decode, '« Tôle d’acier » décodé').toBe(true);
  });

  test('L-27 : Comparer d’un carnet Choisi montre l’article choisi', async ({ page }, info) => {
    await ouvrirCarnet(page);
    await ouvrirUnCarnet(page, /ZZ TEST — Fermenteur conique/);
    await ouvrirComparer(page);
    await page.screenshot({ path: info.outputPath('comparer-choisi.png') });
    await expect(page.locator('.cn-tableau-comparer'), 'le tableau a la colonne de l’article choisi').toContainText('Fermenteur conique inox 30 L');
    await expect(page.locator('.cn-comparer')).not.toContainText(/naît au 2e article/);
  });

  test('L-28 : aucune lettre seule en picto ; la levure du carnet « Pompe » n’a pas le picto de la pompe ; L-24 : la photo s’ouvre', async ({ page }, info) => {
    await ouvrirCarnet(page);
    await page.screenshot({ path: info.outputPath('liste.png'), fullPage: true });
    expect(await page.locator('[data-carnets] svg.cn-picto text').count(), 'pictos en lettre').toBe(0);
    await ouvrirUnCarnet(page, /ZZ TEST — Pompe de transfert/);
    const ligne = page.locator('[data-carnets] [role=row], [data-carnets] .cn-article').filter({ hasText: /Brewferm/ }).first();
    await expect(ligne).toBeVisible();
    expect(await ligne.locator('[data-picto]').first().getAttribute('data-picto'), 'picto de la levure').toBe('sachet');
    await page.screenshot({ path: info.outputPath('carnet-pompe.png') });
    await page.getByRole('button', { name: /^Photo.*non lue/ }).first().tap();
    const feuille = page.getByRole('dialog');
    await expect(feuille.locator('img.cn-photo-grande'), 'la photo en grand').toBeVisible({ timeout: 10_000 });
    await expect(feuille).toContainText(/Pas lue/);
    await expect(feuille.getByText(/Pas lue/), 'l’état de la photo se lit sans défiler').toBeInViewport({ timeout: 5_000 });
    await page.waitForTimeout(600); /* fin de la montée de la feuille, pour la capture */
    await page.screenshot({ path: info.outputPath('photo-ouverte.png') });
  });
});
