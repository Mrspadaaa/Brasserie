import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const ARTIFACT_DIR = 'C:\\Users\\mrspa\\.gemini\\antigravity\\brain\\b4ee6eb4-eb35-4841-86e9-4801dc45b05c';
const BASE_URL = 'http://localhost:5199';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function run() {
  console.log('🍺 Démarrage du UI Testing EN CONDITIONS RÉELLES (Données réelles brasserie, rythme utilisateur, parcours complets)...');

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    defaultViewport: { width: 390, height: 844, isMobile: true, hasTouch: true }, // Mobile standard
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  const consoleErrors = [];
  const pageErrors = [];

  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('pageerror', (err) => pageErrors.push(err.message));

  async function snap(name, desc) {
    const filePath = path.join(ARTIFACT_DIR, `${name}.png`);
    await page.screenshot({ path: filePath, fullPage: false });
    console.log(`📸 [${name}] : ${desc}`);
    return filePath;
  }

  async function checkDom(stepName) {
    return await page.evaluate((step) => {
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      const anomalies = [];
      const badPatterns = [/\bNaN\b/, /\bundefined\b/, /\bInfinity\b/, /\[object Object\]/];

      while (walker.nextNode()) {
        const text = walker.currentNode.textContent || '';
        const parent = walker.currentNode.parentElement;
        if (parent && (parent.tagName === 'SCRIPT' || parent.tagName === 'STYLE')) continue;

        for (const p of badPatterns) {
          if (p.test(text)) {
            anomalies.push({
              step,
              match: text.trim().slice(0, 80),
              pattern: p.toString()
            });
            break;
          }
        }
      }

      const overflow = document.documentElement.scrollWidth > document.documentElement.clientWidth;
      return { anomalies, overflow, step };
    }, stepName);
  }

  const results = [];

  // =========================================================================
  // SCÉNARIO 1 : ACCÈS APP AVEC DONNÉES RÉELLES & DASHBOARD OPÉRATIONNEL
  // =========================================================================
  console.log('\n--- 1. Dashboard avec données réelles ---');
  await page.goto(`${BASE_URL}/?dev-local`, { waitUntil: 'networkidle2' });
  await sleep(1500); // Rythme humain

  await snap('real_01_dashboard_with_data', 'Dashboard mobile avec vraies données brasserie');
  const d1 = await checkDom('Dashboard Réel');
  results.push(d1);

  // Vérification de la présence de vraies données (chiffres réels > 0)
  const dashboardStats = await page.evaluate(() => {
    const text = document.body.innerText;
    const hasGaetan = text.includes('Gaëtan') || text.includes('L\'Affinée');
    const hasExpenses = text.includes('CHF');
    const hasMarché = text.includes('Villars-sur-Glâne');
    return { hasGaetan, hasExpenses, hasMarché };
  });
  console.log('  Données réelles détectées sur le Dashboard :', dashboardStats);

  // Interaction réaliste avec les filtres temporels
  console.log('  Changement du filtre temporel : 1M -> 3M -> Tout l\'historique');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const btn3M = btns.find(b => b.textContent?.includes('3M') || b.textContent?.includes('Mois'));
    if (btn3M) btn3M.click();
  });
  await sleep(1000);
  await snap('real_02_dashboard_filter_3m', 'Dashboard filtré sur 3 mois');
  results.push(await checkDom('Filtre 3M'));

  // =========================================================================
  // SCÉNARIO 2 : GESTION DES STOCKS EN CONDITIONS RÉELLES
  // =========================================================================
  console.log('\n--- 2. Gestion des Stocks en condition réelle ---');
  // Navigation vers l'onglet Stocks
  await page.evaluate(() => {
    const tabs = Array.from(document.querySelectorAll('button, a'));
    const stockTab = tabs.find(t => t.textContent?.includes('Stocks'));
    if (stockTab) stockTab.click();
  });
  await sleep(1200);

  await snap('real_03_stocks_inventory_real', 'Inventaire réel des stocks matières premières');
  results.push(await checkDom('Inventaire Stocks Réel'));

  // Recherche réaliste au clavier : tape 'Citra' lettre par lettre
  console.log('  Recherche interactive au clavier : "Citra"');
  const searchInput = await page.$('input[placeholder*="Chercher"], input[placeholder*="malt"]');
  if (searchInput) {
    await searchInput.click();
    await page.keyboard.type('Citra', { delay: 100 });
    await sleep(800);
    await snap('real_04_stocks_search_citra', 'Résultat de la recherche "Citra"');
    results.push(await checkDom('Recherche Stocks'));
    // Effacement de la recherche
    await page.keyboard.down('Control');
    await page.keyboard.press('KeyA');
    await page.keyboard.up('Control');
    await page.keyboard.press('Backspace');
    await sleep(500);
  }

  // Ouverture de la bottom sheet d'ajout d'article
  console.log('  Ouverture de la feuille d\'ajout d\'article et saisie réaliste');
  await page.evaluate(() => {
    const addBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent?.includes('Ajouter un article') || b.textContent?.includes('Ajouter'));
    if (addBtn) addBtn.click();
  });
  await sleep(800);

  // Saisie réaliste d'un nouvel ingrédient
  await page.keyboard.type('Malt Caramunich III Bio', { delay: 60 });
  await sleep(400);
  await snap('real_05_stocks_sheet_entry', 'Saisie d\'un nouvel article dans la sheet');
  results.push(await checkDom('Saisie Article Stock'));

  // Fermeture de la sheet par la touche Escape
  await page.keyboard.press('Escape');
  await sleep(600);

  // Consultation des Fûts réels
  console.log('  Consultation du parc de fûts');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const kegsBtn = btns.find(b => b.textContent?.includes('Fûts'));
    if (kegsBtn) kegsBtn.click();
  });
  await sleep(800);
  await snap('real_06_stocks_kegs_real', 'Parc de fûts de la brasserie');
  results.push(await checkDom('Stocks Fûts'));

  // =========================================================================
  // SCÉNARIO 3 : PRODUCTION & RECETTES EN CONDITIONS RÉELLES
  // =========================================================================
  console.log('\n--- 3. Production & Recettes en condition réelle ---');
  await page.evaluate(() => {
    const tabs = Array.from(document.querySelectorAll('button, a'));
    const prodTab = tabs.find(t => t.textContent?.includes('Brassins') || t.textContent?.includes('Production'));
    if (prodTab) prodTab.click();
  });
  await sleep(1200);

  await snap('real_07_production_batches_real', 'Liste réelle des brassins');
  results.push(await checkDom('Production Brassins'));

  // Passage aux recettes réelles
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const recipesBtn = btns.find(b => b.textContent?.includes('Recettes'));
    if (recipesBtn) recipesBtn.click();
  });
  await sleep(1000);

  await snap('real_08_production_recipes_real', 'Liste réelle des recettes de la brasserie');
  results.push(await checkDom('Production Recettes'));

  // Ouverture de l'assistant de recette ("Importer / Créer")
  console.log('  Ouverture de l\'assistant de création de recette');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const createBtn = btns.find(b => b.textContent?.includes('Importer') || b.textContent?.includes('Créer') || b.textContent?.includes('Nouvelle'));
    if (createBtn) createBtn.click();
  });
  await sleep(1000);

  // Saisie réaliste du nom et sélection du style
  await page.keyboard.type('Session IPA Fribourgeoise', { delay: 70 });
  await sleep(600);
  await snap('real_09_recipe_wizard_named', 'Assistant de recette avec nom saisi');
  results.push(await checkDom('Assistant Recette Nom'));

  // Fermeture de l'assistant
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const closeBtn = btns.find(b => b.textContent?.includes('Retour') || b.textContent?.includes('Annuler') || b.querySelector('svg.lucide-x'));
    if (closeBtn) closeBtn.click();
    else {
      const xBtn = document.querySelector('button[aria-label*="Fermer"]');
      if (xBtn) xBtn.click();
    }
  });
  await sleep(600);

  // =========================================================================
  // SCÉNARIO 4 : BANC D'ESSAI BRASSAGE COMPLET (FICHE + MINUTEUR LIVE)
  // =========================================================================
  console.log('\n--- 4. Fiche Recette & Minuteur Opérationnel ---');
  // Visite de la fiche recette NEIPA complète
  await page.goto(`${BASE_URL}/?preview=brew&view=recette`, { waitUntil: 'networkidle2' });
  await sleep(1200);

  await snap('real_10_recipe_sheet_complete', 'Fiche Recette NEIPA complète avec calculs IBU/EBC/Eau');
  results.push(await checkDom('Fiche Recette NEIPA'));

  // Défilement vers le bas pour visualiser la section Eau et sels
  await page.evaluate(() => window.scrollBy(0, 700));
  await sleep(600);
  await snap('real_11_recipe_sheet_water_section', 'Section Eau et Sels détaillée (réseau vs osmosée)');
  results.push(await checkDom('Fiche Recette Eau & Sels'));

  // Passage au jour de brassage minuté réel
  console.log('  Lancement du déroulé de brassage minuté');
  await page.goto(`${BASE_URL}/?preview=brew&view=brassage`, { waitUntil: 'networkidle2' });
  await sleep(1200);

  await snap('real_12_brew_day_timer_step1', 'Jour de brassage - Étape 1 Eau & Sels minutée');
  results.push(await checkDom('Jour de Brassage Étape 1'));

  // Saisie d'un relevé réel de densité (1.061 SG)
  console.log('  Saisie d\'un relevé de densité en direct (1.061 SG)');
  const densityInput = await page.$('input[placeholder*="1."], input[type="text"], input[type="number"]');
  if (densityInput) {
    await densityInput.click();
    await page.keyboard.type('1.061', { delay: 80 });
    await sleep(400);
    // Clic sur Ajouter
    await page.evaluate(() => {
      const addBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent?.includes('Ajouter'));
      if (addBtn) addBtn.click();
    });
    await sleep(600);
    await snap('real_13_brew_day_reading_logged', 'Relevé de densité 1.061 SG enregistré dans le journal');
    results.push(await checkDom('Relevé Densité Enregistré'));
  }

  // =========================================================================
  // SCÉNARIO 5 : FINANCES RÉELLES, STRUCTURE DES COÛTS & TVA SUISSE
  // =========================================================================
  console.log('\n--- 5. Finances réelles & Écritures comptables ---');
  await page.goto(`${BASE_URL}/?dev-local`, { waitUntil: 'networkidle2' });
  await sleep(1000);

  // Navigation vers Finances
  await page.evaluate(() => {
    const tabs = Array.from(document.querySelectorAll('button, a'));
    const finTab = tabs.find(t => t.textContent?.includes('Finances'));
    if (finTab) finTab.click();
  });
  await sleep(1200);

  await snap('real_14_finances_real_costs', 'Finances réelles avec charges et trésorerie');
  results.push(await checkDom('Finances Réelles'));

  // Clic sur "Matériel" pour filtrer les dépenses
  console.log('  Filtrage des dépenses réelles par catégorie (Matériel)');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const matBtn = btns.find(b => b.textContent?.includes('Matériel'));
    if (matBtn) matBtn.click();
  });
  await sleep(800);
  await snap('real_15_finances_materiel_filtered', 'Dépenses réelles filtrées sur Matériel');
  results.push(await checkDom('Finances Filtre Matériel'));

  // =========================================================================
  // SCÉNARIO 6 : VUE TABLETTE (768x1024) & DESKTOP (1440x900) EN CONDITION RÉELLE
  // =========================================================================
  console.log('\n--- 6. Test Responsive Tablette & Desktop en condition réelle ---');
  // Tablette
  await page.setViewport({ width: 768, height: 1024, isMobile: false });
  await page.goto(`${BASE_URL}/?dev-local`, { waitUntil: 'networkidle2' });
  await sleep(1000);
  await snap('real_16_tablet_overview_with_data', 'Vue Tablette iPad avec données complètes');
  results.push(await checkDom('Tablette Vue Réelle'));

  // Desktop
  await page.setViewport({ width: 1440, height: 900, isMobile: false });
  await page.goto(`${BASE_URL}/?dev-local`, { waitUntil: 'networkidle2' });
  await sleep(1000);

  // Aller sur l'onglet Clients
  await page.evaluate(() => {
    const tabs = Array.from(document.querySelectorAll('button, a'));
    const clientsTab = tabs.find(t => t.textContent?.includes('Clients'));
    if (clientsTab) clientsTab.click();
  });
  await sleep(1000);
  await snap('real_17_desktop_clients_real', 'Vue Desktop 1440px Carnet Clients');
  results.push(await checkDom('Desktop Clients'));

  await browser.close();

  const totalAnomalies = results.reduce((acc, r) => acc + r.anomalies.length, 0);
  const totalOverflows = results.filter((r) => r.overflow).length;

  const fullReport = {
    timestamp: new Date().toISOString(),
    totalSteps: results.length,
    totalAnomalies,
    totalOverflows,
    pageErrors,
    consoleErrors,
    results
  };

  const reportPath = path.join(ARTIFACT_DIR, 'real_conditions_ui_report.json');
  fs.writeFileSync(reportPath, JSON.stringify(fullReport, null, 2));

  console.log('\n======================================================');
  console.log('🏁 BILAN DU UI TESTING EN CONDITIONS RÉELLES :');
  console.log(`Étapes testées     : ${results.length}`);
  console.log(`Anomalies DOM text : ${totalAnomalies}`);
  console.log(`Débordements horiz : ${totalOverflows}`);
  console.log(`Erreurs JS page    : ${pageErrors.length}`);
  console.log(`Erreurs console    : ${consoleErrors.length}`);
  console.log('======================================================');
}

run().catch((e) => {
  console.error('Fatal error in real conditions UI test:', e);
  process.exit(1);
});
