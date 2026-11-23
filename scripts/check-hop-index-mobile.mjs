// Real UI, public data packs and explicitly synthetic local fixtures. No Firebase or paid AI request is allowed.
import puppeteer from 'puppeteer-core';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import assert from 'node:assert/strict';
const out = resolve('.codex-remote-attachments/hop-index');
await mkdir(out, { recursive: true });
const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true, args: ['--mute-audio'] });
const reports = [];
const click = async (page, text) => {
  const h = await page.waitForFunction(text => [...document.querySelectorAll('button')].find(b => b.textContent.trim() === text && !b.disabled), {}, text);
  assert(h.asElement(), `Bouton absent : ${text}`); await h.asElement().evaluate(el => el.scrollIntoView({ block: 'center' })); await h.asElement().click(); await h.dispose();
};
const expand = async (page, text) => {
  const h = await page.evaluateHandle(text => [...document.querySelectorAll('summary')].find(s => s.textContent.trim() === text), text);
  assert(h.asElement(), `Section absente : ${text}`); await h.asElement().click(); await h.dispose();
};
const select = async (page, label, value) => {
  await page.waitForFunction(text => [...document.querySelectorAll('label')].some(l => l.textContent.trim() === text && l.htmlFor), {}, label);
  const id = await page.evaluate(text => [...document.querySelectorAll('label')].find(l => l.textContent.trim() === text)?.htmlFor, label);
  assert(id, `Libellé absent : ${label}`); await page.select(`select[id="${id}"]`, value);
};
const fill = async (page, label, value) => {
  await page.waitForFunction(text => [...document.querySelectorAll('label')].some(l => l.textContent.trim() === text && l.htmlFor), {}, label);
  const id = await page.evaluate(text => [...document.querySelectorAll('label')].find(l => l.textContent.trim() === text)?.htmlFor, label);
  assert(id, `Libellé absent : ${label}`); await page.locator(`[id="${id}"]`).fill(value);
};
const showFirstResult = async page => page.evaluate(() => {
  const article = document.querySelector('section[aria-label="Recherche de triplets aromatiques"] article');
  const scroller = article.closest('[data-hop-scroll]');
  scroller.scrollTop += article.getBoundingClientRect().top - scroller.getBoundingClientRect().top - 12;
});
try {
  for (const width of [390, 320, 1280]) {
    const page = await browser.newPage(), errors = [], blocked = [];
    await page.setViewport({ width, height: 900, isMobile: width < 600, hasTouch: width < 600 });
    await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
    page.on('pageerror', e => errors.push(e.message));
    await page.setRequestInterception(true);
    page.on('request', req => {
      if (/^http:\/\/127\.0\.0\.1:3007\//.test(req.url()) || /^(data|blob):/.test(req.url()) || /fonts\.(googleapis|gstatic)\.com/.test(req.url())) return req.continue();
      blocked.push(req.url().split('?')[0]); return req.abort();
    });
    await page.evaluateOnNewDocument(() => localStorage.setItem('laffinee_ui_state', JSON.stringify({ app_active_tab: 'stocks', stocks_subtab: 'hops' })));
    await page.goto('http://127.0.0.1:3007/?dev-local', { waitUntil: 'networkidle0' });
    await page.waitForFunction(() => !document.body.innerText.includes('Base initialisée avec'));
    await click(page, 'Sources et modèles');
    await expand(page, 'Catalogue fabricant · Hopsteiner');
    await click(page, 'Ajouter les fiches Hopsteiner manquantes');
    await page.waitForFunction(() => document.body.innerText.includes('102 fiche(s) ajoutée(s)'));
    await click(page, 'Ajouter les fiches Hopsteiner manquantes');
    await page.waitForFunction(() => document.body.innerText.includes('0 fiche(s) ajoutée(s)'));
    await expand(page, 'Étude disponible · Cascade × Wyeast 1728');
    await click(page, 'Ajouter l’étude Cascade documentée');
    await page.waitForFunction(() => document.body.innerText.includes('20 fiche(s) ajoutée(s)'));
    await click(page, 'Ajouter l’étude Cascade documentée');
    await page.waitForFunction(() => document.body.innerText.includes('0 fiche(s) ajoutée(s)'));
    await expand(page, 'Autres référentiels · comparer les sources');
    for (const [name, count] of [['HopDatabase', 220], ['hops-json', 119], ['Beer Maverick', 318]]) {
      await click(page, `Ajouter ${name}`);
      await page.waitForFunction(count => document.body.innerText.includes(`${count} fiche(s) ajoutée(s)`), {}, count);
      await click(page, `Ajouter ${name}`);
      await page.waitForFunction(() => document.body.innerText.includes('0 fiche(s) ajoutée(s)'));
    }
    await expand(page, 'Bibliothèque scientifique · comprendre les limites');
    await click(page, 'Ajouter les notes sourcées');
    await page.waitForFunction(() => document.body.innerText.includes('34 fiche(s) ajoutée(s)'));
    await click(page, 'Ajouter les levures documentées');
    await page.waitForFunction(() => document.body.innerText.includes('6 fiche(s) ajoutée(s)'));
    await expand(page, 'Analyses de lots publiées · comparer les récoltes');
    await click(page, 'Ajouter les analyses de lots publiées');
    await page.waitForFunction(() => document.body.innerText.includes('16 fiche(s) ajoutée(s)'));
    await click(page, 'Ajouter les analyses de lots publiées');
    await page.waitForFunction(() => document.body.innerText.includes('0 fiche(s) ajoutée(s)'));
    const publicCounts = await page.evaluate(async () => {
      const s = (await import('/src/services/storage.ts')).StorageService;
      return { references: s.getHopVarieties().length, referenceLots: s.getHopLots().filter(l => l.referenceOnly).length, models: s.getHopKnowledge().filter(k => k.kind === 'model').length, notes: s.getHopKnowledge().filter(k => k.kind === 'note').length, yeasts: s.getHopKnowledge().filter(k => k.kind === 'yeast').length };
    });
    assert.deepEqual(publicCounts, { references: 766, referenceLots: 10, models: 1, notes: 34, yeasts: 7 });
    await click(page, 'Variétés et lots');
    await page.screenshot({ path: resolve(out, `catalogue-${width}.png`) });
    await fill(page, 'Rechercher une variété ou un arôme documenté', 'Cascade T90 · étude Samia 2026');
    const sampleButton = await page.evaluateHandle(() => [...document.querySelectorAll('button')].find(b => b.textContent.includes('Cascade T90 · étude Samia 2026')));
    assert(sampleButton.asElement()); await sampleButton.asElement().click(); await sampleButton.dispose();
    await select(page, 'Lot à consulter', 'cascade-t90-samia2026-sample');
    assert(await page.evaluate(() => document.querySelector('[role="dialog"]').innerText.includes('Échantillon publié')));
    assert(await page.evaluate(() => document.querySelector('[role="dialog"]').innerText.includes('équivalents thiol libre')));
    await page.screenshot({ path: resolve(out, `public-sample-${width}.png`) });
    await page.locator('[role="dialog"] button[aria-label="Fermer"]').click();
    await select(page, 'Source du référentiel', 'Beer Maverick');
    await fill(page, 'Rechercher une variété ou un arôme documenté', 'Citra');
    assert(await page.evaluate(() => document.querySelector('[aria-label="Index houblon"]') !== null));
    await page.screenshot({ path: resolve(out, `source-filter-${width}.png`) });
    await select(page, 'Source du référentiel', 'Hopsteiner');
    await fill(page, 'Rechercher une variété ou un arôme documenté', 'Super Galena');
    const varietyButton = await page.evaluateHandle(() => [...document.querySelectorAll('button')].find(b => b.textContent.includes('Super Galena')));
    assert(varietyButton.asElement()); await varietyButton.asElement().click(); await varietyButton.dispose();
    await page.waitForSelector('[role="dialog"]');
    assert(await page.evaluate(() => document.querySelector('[role="dialog"]').innerText.includes('Acides bêta')));
    await page.screenshot({ path: resolve(out, `catalogue-detail-${width}.png`) });
    await page.locator('[role="dialog"] button[aria-label="Fermer"]').click();
    await click(page, 'Profil recherché');
    await select(page, 'Agrumes · panel Lafontaine', 'medium');
    await select(page, 'Partir d’un protocole documenté', 'cascade1728-clarified-lafontaine');
    await click(page, 'Comparer les triplets');
    await page.waitForFunction(() => document.body.innerText.includes('dont 1 quantifiable'));
    await showFirstResult(page);
    await page.screenshot({ path: resolve(out, `published-study-${width}.png`) });
    await click(page, 'Garder cette prédiction');
    const published = await page.evaluate(async () => (await import('/src/services/storage.ts')).StorageService.getHopPredictions()[0]);
    assert.equal(published.prediction.profile['citrus-lafontaine'].confidence, 'low');
    assert(published.prediction.score.range);
    await click(page, 'Variétés et lots');
    await page.evaluate(async () => {
      const { StorageService: s } = await import('/src/services/storage.ts');
      const { testHopData } = await import('/tests/fixtures/hopPrediction.ts');
      const data = testHopData(); data.varieties.forEach(v => s.saveHopVariety(v)); data.lots.forEach(v => s.saveHopLot(v)); data.knowledge.forEach(v => s.saveHopKnowledge(v));
    });
    await fill(page, 'Rechercher une variété ou un arôme documenté', 'Variété témoin');
    await page.waitForFunction(() => document.body.innerText.includes('Variété témoin'));
    await page.screenshot({ path: resolve(out, `index-${width}.png`) });
    await click(page, 'Profil recherché');
    await select(page, 'Agrumes', 'high');
    await select(page, 'Houblon', 'test-variety');
    await select(page, 'Levure du triplet', 'yeast-test');
    await select(page, 'Moment du houblonnage', 'fermentation');
    await fill(page, 'Dose de houblon (g/L)', '4');
    await fill(page, 'Température de contact (°C)', '20');
    await fill(page, 'Durée de contact (h)', '48');
    await fill(page, 'Référence du contexte de bière', 'fixture-beer');
    await click(page, 'Comparer les triplets');
    await page.waitForFunction(() => document.body.innerText.includes('dont 1 quantifiable'));
    await click(page, 'Garder cette prédiction');
    const before = await page.evaluate(async () => (await import('/src/services/storage.ts')).StorageService.getHopPredictions().find(p => p.prediction.triplet.varietyId === 'test-variety').prediction.profile.citrus.range);
    await select(page, 'Lot analysé', 'test-lot'); await click(page, 'Comparer les triplets'); await click(page, 'Garder cette prédiction');
    const frozen = await page.evaluate(async () => (await import('/src/services/storage.ts')).StorageService.getHopPredictions().filter(p => p.prediction.triplet.varietyId === 'test-variety'));
    assert.equal(frozen.length, 2); assert(frozen[1].prediction.profile.citrus.range.max - frozen[1].prediction.profile.citrus.range.min < before.max - before.min);
    await showFirstResult(page);
    await page.screenshot({ path: resolve(out, `search-${width}.png`) });
    await click(page, 'Dégustations'); await click(page, 'Noter une dégustation commerciale');
    await fill(page, 'Bière dégustée', 'Bière de contrôle — fixture'); await select(page, 'Prédiction de référence', frozen[1].id); await select(page, 'Agrumes perçu', 'medium');
    await page.screenshot({ path: resolve(out, `tasting-form-${width}.png`) });
    await click(page, 'Enregistrer la dégustation');
    await page.waitForFunction(() => document.body.innerText.includes('Écart perçu'));
    await page.screenshot({ path: resolve(out, `comparison-${width}.png`) });
    const rows = await page.evaluate(async () => (await import('/src/services/storage.ts')).StorageService.getHopTastings());
    assert.equal(rows.length, 1); assert.equal(rows[0].triplet, null);
    const overflow = await page.evaluate(() => ({ page: document.documentElement.scrollWidth, viewport: innerWidth }));
    assert(overflow.page <= overflow.viewport, `Débordement horizontal : ${JSON.stringify(overflow)}`);
    assert.deepEqual(errors, []);
    reports.push({ width, publicCounts, publishedStudy: { range: published.prediction.profile['citrus-lafontaine'].range, confidence: published.prediction.score.confidence }, fixturePredictions: frozen.length, before, after: frozen[1].prediction.profile.citrus.range, tastings: rows.length, errors, blockedNetworkRequests: [...new Set(blocked)] });
    await page.close();
  }
  await writeFile(resolve(out, 'report.json'), JSON.stringify(reports, null, 2));
  console.log(JSON.stringify(reports, null, 2));
} catch (e) {
  const pages = await browser.pages();
  const page = pages.at(-1);
  if (page) { await page.screenshot({ path: resolve(out, 'ui-failure.png') }); await writeFile(resolve(out, 'ui-failure.txt'), await page.evaluate(() => document.body.innerText)); }
  throw e;
} finally { await browser.close(); }
