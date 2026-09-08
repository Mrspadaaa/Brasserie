import puppeteer from 'puppeteer-core';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const origin = process.env.WATER_PREVIEW_URL ?? 'http://127.0.0.1:3008';
const folder = resolve('.codex-remote-attachments/production-catalog');
await mkdir(folder, { recursive: true });
await writeFile(
  resolve(folder, 'index.html'),
  '<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body><div id="root"></div><script type="module" src="./fixture.tsx"></script></body></html>'
);
await writeFile(
  resolve(folder, 'fixture.tsx'),
  `import React from 'react';
import { createRoot } from 'react-dom/client';
import { ProductionTab } from '/src/components/tabs/ProductionTab.tsx';
import { fullRecipe } from '/tests/fixtures/fullRecipe.ts';
import { defaultConfig } from '/src/services/storage.ts';
import { captureSnapshot } from '/src/domain/recipeSnapshot.ts';
import '/src/index.css';
const recipes = [
  { ...fullRecipe, id: 'R-IPA', name: 'Écume du Lac', style: 'IPA', volumeL: 24, abvTarget: 6.2, ibuTarget: 45, brewDate: '08.09.2026', hops: [{ name: 'Citra', weightG: 50, alpha: 12, stage: 'dryHop' }] },
  { ...fullRecipe, id: 'R-STOUT', name: 'Nocturne', style: 'Stout', volumeL: 30, abvTarget: 8.5, ibuTarget: 35, brewDate: '01.08.2026', hops: [{ name: 'Fuggle', weightG: 35, alpha: 5, stage: 'boil', timeMin: 60 }] },
  { ...fullRecipe, id: 'R-IPA-V2', name: 'Écume du Lac', style: 'IPA', volumeL: 40, abvTarget: 5.8, ibuTarget: 40, brewDate: '09.09.2026', version: 2, parentRecipeId: 'R-IPA', favorite: true, hops: [{ name: 'Citra', weightG: 60, alpha: 12, stage: 'dryHop' }, { name: 'Mosaic', weightG: 30, alpha: 12, stage: 'whirlpool' }] }
];
const batches = [
  { id: 'LOT-001', name: 'Écume du Lac', style: 'IPA', volumeL: 24, volumeBrewedL: 23, brewDate: '08.09.2026', status: 'fermentation', og: '1.062', recipeRef: 'R-IPA', recipeSnapshot: captureSnapshot(recipes[0]), gravityLog: [{ date: '10.09.2026', sg: 1.030, tempC: 19 }] },
  { id: 'LOT-002', name: 'Nocturne', style: 'Stout', volumeL: 30, volumeBrewedL: 28, volumePackagedL: 25, brewDate: '01.08.2026', status: 'conditionne', og: '1.080', fg: '1.018', abv: '8.1', recipeRef: 'R-STOUT', recipeSnapshot: captureSnapshot(recipes[1]) },
  { id: 'LOT-003', name: 'Écume du Lac', style: 'IPA', volumeL: 40, brewDate: '09.09.2026', status: 'planifie', recipeRef: 'R-IPA-V2', recipeSnapshot: captureSnapshot(recipes[2]) },
  { id: 'LOT-004', name: 'Essai sans mesures', style: 'Blonde', volumeL: 300, brewDate: '', status: 'annule' }
];
const action = (text: string) => { document.getElementById('notice')!.textContent = text; };
createRoot(document.getElementById('root')!).render(<main className="max-w-5xl mx-auto p-3"><div className="flex items-center justify-between py-2"><span className="text-lg font-semibold">L’Affinée</span><span className="text-sm text-cave-400">Production</span></div><ProductionTab batches={batches} recipes={recipes} brewhouses={defaultConfig.brewhouses} activeBrewhouseId={defaultConfig.activeBrewhouseId} globalTimeFilter="all" targetSubTab={new URLSearchParams(location.search).get('view') === 'recipes' ? 'recipes' : 'batches'} onOpenCreateBatch={() => action('Créer')} onOpenQuickAction={()=>{}} onOpenRecipe={r=>action('Ouvrir '+r.id)} onEditRecipe={r=>action('Modifier '+r.id)} onOpenBrewDay={b=>action('Suivi '+b.id)} onDraftRecipe={()=>{}} /><div role="status" id="notice" /></main>);
`
);
const browser = await puppeteer.launch({
  executablePath:
    process.env.CHROME_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: true
});
const report = [];
const click = (page, label) => page.click(`button[aria-label="${label}"]`);
try {
  for (const width of [320, 390, 768, 1280])
    for (const view of ['recipes', 'batches']) {
      const page = await browser.newPage(),
        errors = [];
      page.on('pageerror', (e) => errors.push(e.message));
      await page.setViewport({ width, height: 844, isMobile: width < 768, hasTouch: width < 768 });
      const network = await page.createCDPSession();
      await network.send('Network.enable');
      await network.send('Network.setBlockedURLs', { urls: ['https://*'] });
      await page.goto(
        `${origin}/.codex-remote-attachments/production-catalog/index.html?view=${view}`,
        { waitUntil: 'networkidle0' }
      );
      await page.evaluate(() => {
        localStorage.removeItem('laffinee_ui_state');
      });
      await page.reload({ waitUntil: 'networkidle0' });
      const noun = view === 'recipes' ? 'recettes' : 'brassins';
      await page.waitForSelector(`[aria-label="Liste des ${noun}"]`);
      assert.equal(
        await page.$$('button[aria-label^="Adapter le volume de"]').then((r) => r.length),
        0
      );
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      await page.screenshot({ path: resolve(folder, `${view}-${width}-list.png`), fullPage: true });
      if (view === 'recipes') {
        await click(page, 'Modifier la recette Nocturne');
        assert.match(await page.$eval('#notice', (e) => e.textContent), /Modifier R-STOUT/);
      }
      await click(page, 'Afficher les analyses');
      await page.waitForSelector(`[aria-label="Analyses des ${noun}"]`);
      await page.screenshot({
        path: resolve(folder, `${view}-${width}-analysis.png`),
        fullPage: true
      });
      await click(
        page,
        view === 'recipes' ? 'Filtrer : Citra, 2 sur 3' : 'Filtrer : Citra, 2 sur 4'
      );
      await page.waitForSelector(`[aria-label="Liste des ${noun}"]`);
      assert.equal(
        await page.$$(`[aria-label="Liste des ${noun}"] article`).then((r) => r.length),
        2
      );
      await page.click('button[aria-label^="Filtres avancés"]');
      await page.waitForSelector('[role="dialog"]');
      await page.screenshot({
        path: resolve(folder, `${view}-${width}-filters.png`),
        fullPage: true
      });
      const fields = await page.$$eval('[role="dialog"] input, [role="dialog"] select', (nodes) =>
        nodes.map((node) => ({
          width: node.getBoundingClientRect().width,
          height: node.getBoundingClientRect().height,
          font: parseFloat(getComputedStyle(node).fontSize)
        }))
      );
      assert.ok(
        fields.every((f) => f.height >= 44 && f.font >= 16),
        'Touch-friendly filter fields'
      );
      await page.select('[aria-label="Filtrer par période"]', 'custom');
      await page.$eval('[aria-label="Date de début"]', (input) => {
        const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
        setter.call(input, '2027-01-01');
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
      });
      await page.evaluate(() =>
        [...document.querySelectorAll('[role="dialog"] button')]
          .find((b) => b.textContent.startsWith('Voir 0'))
          .click()
      );
      await page.waitForFunction(() =>
        document.body.textContent.includes('Aucun résultat pour ces critères')
      );
      assert.equal(
        await page.$$(`[aria-label="Liste des ${noun}"] article`).then((r) => r.length),
        0
      );
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      assert.deepEqual(errors, []);
      report.push({
        width,
        view,
        edit: view === 'recipes',
        filters: true,
        hopDrilldown: true,
        emptyPeriod: true,
        noOverflow: true,
        errors
      });
      await page.close();
    }
  await writeFile(resolve(folder, 'report.json'), JSON.stringify(report, null, 2));
  console.log(
    '✓ Recettes et brassins : 320/390/768/1280 px, édition, analyses, filtre houblon, période vide, contrôles tactiles et aucun débordement.'
  );
} finally {
  await browser.close();
}
