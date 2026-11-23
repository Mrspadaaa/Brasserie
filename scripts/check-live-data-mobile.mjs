// Real mobile Chrome, isolated in-memory data. External API requests (including AI) are blocked.
import puppeteer from 'puppeteer-core';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const origin = 'http://127.0.0.1:3007';
const out = resolve('.codex-remote-attachments/live-data-mobile');
await mkdir(out, { recursive: true });
const browser = await puppeteer.launch({
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: true, args: ['--mute-audio']
});
const errors = [], report = [];
try {
  for (const width of [390, 320]) {
    const page = await browser.newPage();
    page.on('pageerror', error => errors.push(error.message));
    await page.setViewport({ width, height: 844, isMobile: true, hasTouch: true });
    await page.setRequestInterception(true);
    page.on('request', request => {
      const url = new URL(request.url());
      return url.origin === origin || ['fonts.googleapis.com', 'fonts.gstatic.com'].includes(url.hostname)
        ? request.continue() : request.abort();
    });
    await page.goto(`${origin}/?preview=design&dev-local`, { waitUntil: 'networkidle0' });
    await page.evaluate(async () => {
      const { default: React } = await import('/node_modules/.vite/deps/react.js');
      const { default: ReactDOM } = await import('/node_modules/.vite/deps/react-dom_client.js');
      const { ProductionTab } = await import('/src/components/tabs/ProductionTab.tsx');
      const { StocksTab } = await import('/src/components/tabs/StocksTab.tsx');
      const { useStorageValue } = await import('/src/hooks/useLiveData.ts');
      const { StorageService, defaultConfig } = await import('/src/services/storage.ts');
      const { FirestoreRepo } = await import('/src/services/firestoreRepo.ts');
      const { fullRecipe } = await import('/tests/fixtures/fullRecipe.ts');
      const recipe = { ...fullRecipe, id: 'REC-sync', name: 'Brassin de septembre' };
      const batch = { id: 'B-sync', name: 'Brassin de septembre', style: 'Stout', volumeL: 30,
        status: 'planifie', brewDate: '07.09.2026' };
      const stock = { id: 'stock-sync', ref: 'M-sync', name: 'Malt de septembre', category: 'Malt',
        unit: 'kg', currentStock: 15, minStock: 3, reorder: false, supplier: 'Malterie' };
      FirestoreRepo.startSync();
      StorageService.addRecipe(recipe);
      StorageService.addBatch(batch);
      StorageService.addStockItem('rawMaterials', stock);
      window.liveDataCheck = {
        batch: () => StorageService.updateBatch({ ...StorageService.getBatches()[0], name: 'Stout · recette ajustée', volumeL: 24 }),
        stock: () => StorageService.updateStockItem('rawMaterials', { ...StorageService.getStocks().rawMaterials[0], name: 'Malt · fiche actualisée', currentStock: 12 }),
        recipe: () => StorageService.updateRecipe({ ...recipe, fermentables: recipe.fermentables.map((f, i) => i ? f : { ...f, name: 'Malt substitué par le compagnon' }) })
      };
      function Harness() {
        const recipes = useStorageValue(StorageService.getRecipes);
        const batches = useStorageValue(StorageService.getBatches);
        const stocks = useStorageValue(StorageService.getStocks);
        const [area, setArea] = React.useState('batches');
        window.liveDataCheck.show = setArea;
        return React.createElement('main', { className: 'bg-cave-950 text-cave-200 min-h-screen px-3 pt-4 max-w-2xl mx-auto' },
          area === 'stock' ? React.createElement(StocksTab, { stocks, batches, onOpenQuickAction: () => {} }) :
          React.createElement(ProductionTab, { recipes, batches, targetSubTab: area,
            brewhouses: defaultConfig.brewhouses, activeBrewhouseId: defaultConfig.activeBrewhouseId,
            globalTimeFilter: 'all', onOpenCreateBatch: () => {}, onOpenQuickAction: () => {},
            onOpenRecipe: () => {}, onOpenBrewDay: () => {} }));
      }
      document.getElementById('root').style.display = 'none';
      const fixture = document.createElement('div');
      document.body.append(fixture);
      ReactDOM.createRoot(fixture).render(React.createElement(Harness));
    });
    await page.waitForSelector('[title="Modifier la fiche"]');
    await page.click('[title="Modifier la fiche"]');
    await page.waitForSelector('[name="batch_sheet_og"]');
    await page.type('[name="batch_sheet_og"]', '1.054');
    await page.evaluate(() => window.liveDataCheck.batch());
    await page.waitForFunction(() => document.querySelector('[role="dialog"]')?.textContent.includes('Stout · recette ajustée'));
    assert.equal(await page.$eval('[name="batch_sheet_og"]', input => input.value), '1.054');
    assert.ok(await page.$eval('[role="dialog"]', e => e.textContent.includes('24 L')));
    await page.screenshot({ path: resolve(out, `batch-live-${width}.png`) });
    await page.keyboard.press('Escape');
    await page.waitForFunction(() => !document.querySelector('[role="dialog"]'));
    await page.evaluate(() => window.liveDataCheck.show('scaler'));
    await page.waitForSelector('[name="production_scale_recipe_select"]');
    await page.evaluate(() => window.liveDataCheck.recipe());
    await page.waitForFunction(() => document.body.textContent.includes('Malt substitué par le compagnon'));
    await page.screenshot({ path: resolve(out, `scaler-live-${width}.png`) });
    await page.evaluate(() => window.liveDataCheck.show('stock'));
    const stockButton = await page.waitForSelector('button ::-p-text(Malt de septembre)');
    await stockButton.click();
    await page.waitForSelector('[role="dialog"]');
    // A field in progress must survive both a remote stock movement and a renamed item.
    const name = await page.waitForSelector('[role="dialog"] #stock-label');
    await name.click();
    await page.keyboard.down('Control');
    await page.keyboard.press('A');
    await page.keyboard.up('Control');
    await page.keyboard.type('Mon nom en cours');
    await page.evaluate(() => window.liveDataCheck.stock());
    await page.waitForFunction(() => document.querySelector('[role="dialog"]')?.textContent.includes('Malt · fiche actualisée'));
    assert.equal(await name.evaluate(input => input.value ?? input.textContent), 'Mon nom en cours');
    assert.ok(await page.$eval('[role="dialog"]', e => e.textContent.includes('12')));
    await page.screenshot({ path: resolve(out, `stock-live-${width}.png`) });
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1);
    assert.equal(overflow, false);
    report.push({ width, batchLive: true, scalerLive: true, stockLive: true, draftPreserved: true });
    await page.close();
  }
  assert.deepEqual(errors, []);
  await writeFile(resolve(out, 'report.json'), JSON.stringify(report, null, 2));
  console.log('✓ Live batch, stock and recipe scaler at 390/320px; drafts preserved; no external API calls.');
} finally { await browser.close(); }
