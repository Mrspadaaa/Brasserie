import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const ARTIFACT_DIR = 'C:\\Users\\mrspa\\.gemini\\antigravity\\brain\\b4ee6eb4-eb35-4841-86e9-4801dc45b05c';
const BASE_URL = 'http://localhost:5199';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const VIEWPORTS = {
  mobile: { width: 390, height: 844, isMobile: true, hasTouch: true },
  tablet: { width: 768, height: 1024, isMobile: false, hasTouch: true },
  desktop: { width: 1440, height: 900, isMobile: false, hasTouch: false }
};

const results = {
  timestamp: new Date().toISOString(),
  journeys: [],
  summary: { total: 0, passed: 0, failed: 0, anomalies: 0, consoleErrors: 0 }
};

async function run() {
  console.log('🚀 Démarrage de la suite complète de UI Testing (Best Practices)...');
  
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-web-security',
      '--disable-features=IsolateOrigins,site-per-process'
    ]
  });

  const page = await browser.newPage();
  
  const consoleLogs = [];
  const pageErrors = [];

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleLogs.push({ type: 'error', text: msg.text() });
    }
  });

  page.on('pageerror', (err) => {
    pageErrors.push(err.toString());
  });

  // Helper de validation de texte DOM (zéro anomalie)
  async function checkDomIntegrity(contextName) {
    const textAnomalies = await page.evaluate(() => {
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      const anomalies = [];
      while (walker.nextNode()) {
        const text = walker.currentNode.nodeValue || '';
        if (/\bNaN\b/.test(text)) anomalies.push(`NaN trouvé dans: "${text.trim().slice(0, 80)}"`);
        if (/\bundefined\b/.test(text) && !text.includes('typeof undefined')) anomalies.push(`undefined trouvé dans: "${text.trim().slice(0, 80)}"`);
        if (/\bInfinity\b/.test(text)) anomalies.push(`Infinity trouvé dans: "${text.trim().slice(0, 80)}"`);
        if (/\[object Object\]/.test(text)) anomalies.push(`[object Object] trouvé dans: "${text.trim().slice(0, 80)}"`);
      }
      return anomalies;
    });

    const overflowBug = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth;
    });

    return { textAnomalies, overflowBug };
  }

  async function takeScreenshot(name) {
    const filePath = path.join(ARTIFACT_DIR, `${name}.png`);
    await page.screenshot({ path: filePath, fullPage: false });
    console.log(`📸 Capture enregistrée : ${name}.png`);
    return filePath;
  }

  async function testJourney(journeyName, url, viewport, runner) {
    results.summary.total++;
    console.log(`\n▶️ Test Journey: [${journeyName}] sur ${viewport}`);
    await page.setViewport(VIEWPORTS[viewport]);
    
    try {
      await page.goto(`${BASE_URL}${url}`, { waitUntil: 'domcontentloaded', timeout: 15000 });
      await sleep(1000);
      
      const beforeErrors = pageErrors.length;
      const beforeLogs = consoleLogs.length;

      await runner(page);
      await sleep(500);

      const integrity = await checkDomIntegrity(journeyName);
      const newErrors = pageErrors.slice(beforeErrors);
      const newLogs = consoleLogs.slice(beforeLogs);

      const passed = integrity.textAnomalies.length === 0 && !integrity.overflowBug && newErrors.length === 0;
      
      if (passed) {
        results.summary.passed++;
        console.log(`✅ [${journeyName}] RÉUSSI`);
      } else {
        results.summary.failed++;
        console.log(`❌ [${journeyName}] ÉCHEC :`, {
          anomalies: integrity.textAnomalies,
          overflow: integrity.overflowBug,
          errors: newErrors
        });
      }

      results.journeys.push({
        name: journeyName,
        viewport,
        passed,
        anomalies: integrity.textAnomalies,
        overflow: integrity.overflowBug,
        errors: newErrors,
        consoleErrors: newLogs
      });

    } catch (e) {
      results.summary.failed++;
      console.error(`💥 Erreur inattendue dans [${journeyName}]:`, e.message);
      results.journeys.push({
        name: journeyName,
        viewport,
        passed: false,
        exception: e.message
      });
    }
  }

  // --- JOURNEY 1 : Atelier de l'Eau (Water Wizard) ---
  await testJourney('Atelier de l Eau - Mobile', '/?preview=brew&view=eau', 'mobile', async (p) => {
    await sleep(800);
    await p.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const dublinBtn = buttons.find(b => b.textContent?.includes('Dublin') || b.textContent?.includes('Pilsen') || b.textContent?.includes('NEIPA'));
      if (dublinBtn) dublinBtn.click();
    });
    await sleep(500);

    await p.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const selsTab = buttons.find(b => b.textContent?.includes('2. Sels') || b.textContent?.includes('Sels'));
      if (selsTab) selsTab.click();
    });
    await sleep(500);

    await p.evaluate(() => {
      const switches = Array.from(document.querySelectorAll('[role="switch"]'));
      if (switches.length > 0) switches[0].click();
    });
    await sleep(500);

    await takeScreenshot('ui_test_01_water_wizard_mobile');
  });

  // --- JOURNEY 2 : Assistant de Recette 5 Étapes ---
  await testJourney('Assistant de Recette - Mobile', '/?preview=brew&view=assistant', 'mobile', async (p) => {
    await sleep(1000);
    await p.evaluate(() => {
      const nextBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent?.includes('Suivant') || b.textContent?.includes('Malts'));
      if (nextBtn) nextBtn.click();
    });
    await sleep(600);

    await takeScreenshot('ui_test_02_brew_wizard_step2');

    await p.evaluate(() => {
      const nextBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent?.includes('Suivant') || b.textContent?.includes('Houblons'));
      if (nextBtn) nextBtn.click();
    });
    await sleep(600);

    await takeScreenshot('ui_test_03_brew_wizard_step3');

    await p.evaluate(() => {
      const nextBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent?.includes('Suivant') || b.textContent?.includes('Eau'));
      if (nextBtn) nextBtn.click();
    });
    await sleep(600);

    await takeScreenshot('ui_test_04_brew_wizard_step4');
  });

  // --- JOURNEY 3 : Fiche Recette & Mise à l'Échelle ---
  await testJourney('Fiche Recette - Desktop', '/?preview=brew&view=recette', 'desktop', async (p) => {
    await sleep(1000);
    const waterVerification = await p.evaluate(() => {
      const text = document.body.textContent || '';
      const hasWaterSection = text.includes('Eau et sels');
      const hasMashSparge = text.includes('Empâtage') && text.includes('Rinçage');
      const hasOsmosisDetails = text.includes('osmosée') && text.includes('réseau');
      return { hasWaterSection, hasMashSparge, hasOsmosisDetails };
    });
    console.log(`  Vérification section Eau & Sels :`, waterVerification);
    if (!waterVerification.hasWaterSection || !waterVerification.hasMashSparge || !waterVerification.hasOsmosisDetails) {
      throw new Error(`Détails d'eau manquants sur la fiche recette : ${JSON.stringify(waterVerification)}`);
    }
    await takeScreenshot('ui_test_05_recipe_sheet_desktop');
  });

  // --- JOURNEY 4 : Jour de Brassage Minuté (Live Brew Day) ---
  await testJourney('Jour de Brassage - Mobile', '/?preview=brew&view=brassage', 'mobile', async (p) => {
    await sleep(1000);
    const brewVerification = await p.evaluate(() => {
      const text = document.body.textContent || '';
      const hasWaterStep = text.includes('Eau et sels');
      const hasMashDetails = text.includes('empâtage') && (text.includes('réseau') || text.includes('osmosée'));
      const hasSpargeDetails = text.includes('rinçage');
      return { hasWaterStep, hasMashDetails, hasSpargeDetails };
    });
    console.log(`  Vérification minuteur jour de brassage :`, brewVerification);
    if (!brewVerification.hasWaterStep || !brewVerification.hasMashDetails) {
      throw new Error(`Détails eau & sels manquants dans le déroulé de brassage : ${JSON.stringify(brewVerification)}`);
    }

    await p.evaluate(() => {
      const startBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent?.includes('Démarrer') || b.textContent?.includes('Valider') || b.textContent?.includes('Suivante'));
      if (startBtn) startBtn.click();
    });
    await sleep(600);

    await takeScreenshot('ui_test_06_live_brew_day_mobile');
  });

  // --- JOURNEY 5 : Live App - Dashboard ---
  await testJourney('Live Dashboard - Desktop', '/?dev-local', 'desktop', async (p) => {
    await sleep(1000);
    await takeScreenshot('ui_test_07_live_dashboard_desktop');
  });

  // --- JOURNEY 6 : Live App - Finances ---
  await testJourney('Live Finances - Desktop', '/?dev-local', 'desktop', async (p) => {
    await sleep(600);
    await p.evaluate(() => {
      const tabs = Array.from(document.querySelectorAll('button, a'));
      const financesTab = tabs.find(t => t.textContent?.includes('Finances'));
      if (financesTab) financesTab.click();
    });
    await sleep(1000);
    await takeScreenshot('ui_test_08_live_finances_desktop');
  });

  // --- JOURNEY 7 : Live App - Production (Brassins & Recettes) ---
  await testJourney('Live Production - Tablet', '/?dev-local', 'tablet', async (p) => {
    await sleep(600);
    await p.evaluate(() => {
      const tabs = Array.from(document.querySelectorAll('button, a'));
      const prodTab = tabs.find(t => t.textContent?.includes('Production'));
      if (prodTab) prodTab.click();
    });
    await sleep(1000);
    await takeScreenshot('ui_test_09_live_production_tablet');
  });

  // --- JOURNEY 8 : Live App - Stocks & Fûts ---
  await testJourney('Live Stocks - Mobile', '/?dev-local', 'mobile', async (p) => {
    await sleep(600);
    await p.evaluate(() => {
      const tabs = Array.from(document.querySelectorAll('button, a'));
      const stockTab = tabs.find(t => t.textContent?.includes('Stocks'));
      if (stockTab) stockTab.click();
    });
    await sleep(1000);
    await takeScreenshot('ui_test_10_live_stocks_mobile');
  });

  // --- JOURNEY 9 : Live App - Clients & Facturation ---
  await testJourney('Live Clients - Desktop', '/?dev-local', 'desktop', async (p) => {
    await sleep(600);
    await p.evaluate(() => {
      const tabs = Array.from(document.querySelectorAll('button, a'));
      const clientsTab = tabs.find(t => t.textContent?.includes('Clients'));
      if (clientsTab) clientsTab.click();
    });
    await sleep(1000);
    await takeScreenshot('ui_test_11_live_clients_desktop');
  });

  // --- JOURNEY 10 : Bottom Sheet d'Ajout de Stock & Accessibilité Clavier ---
  await testJourney('Stock Sheet & A11y - Mobile', '/?preview=stock', 'mobile', async (p) => {
    await sleep(800);
    await p.evaluate(() => {
      const addBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent?.includes('Entrée') || b.textContent?.includes('Ajouter'));
      if (addBtn) addBtn.click();
    });
    await sleep(600);

    await p.keyboard.press('Escape');
    await sleep(400);

    await takeScreenshot('ui_test_12_stock_sheet_interaction');
  });

  await browser.close();

  const reportPath = path.join(ARTIFACT_DIR, 'ui_test_full_report.json');
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
  console.log(`\n📋 Rapport complet enregistré : ${reportPath}`);
  console.log(`\n=============================================`);
  console.log(`🏁 RÉSULTATS GLOBAUX :`);
  console.log(`Total tests : ${results.summary.total}`);
  console.log(`Réussis     : ${results.summary.passed}`);
  console.log(`Échoués     : ${results.summary.failed}`);
  console.log(`=============================================`);
}

run().catch((e) => {
  console.error('Fatal test error:', e);
  process.exit(1);
});
