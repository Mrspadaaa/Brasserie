import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const ARTIFACT_DIR = 'C:\\Users\\mrspa\\.gemini\\antigravity\\brain\\b4ee6eb4-eb35-4841-86e9-4801dc45b05c';
const BASE_URL = 'http://localhost:5199';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function run() {
  console.log('🐒 Lancement du Manual Monkey Testing sur la vraie application locale...');

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    defaultViewport: { width: 412, height: 915, isMobile: true, hasTouch: true }, // Pixel 7 standard mobile
    args: ['--no-sandbox', '--disable-setuid-sandbox']
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
    pageErrors.push(err.message);
  });

  const screenshotsTaken = [];

  async function snap(name, desc) {
    const filePath = path.join(ARTIFACT_DIR, `${name}.png`);
    await page.screenshot({ path: filePath, fullPage: false });
    console.log(`📸 [${name}] : ${desc}`);
    screenshotsTaken.push({ name, desc, filePath });
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
              match: text.trim().slice(0, 100),
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

  // Helper for chaotic clicking on non-destructive elements
  async function chaoticClicks(selector, count = 5) {
    for (let i = 0; i < count; i++) {
      await page.evaluate((sel) => {
        const elements = Array.from(document.querySelectorAll(sel)).filter((el) => {
          const rect = el.getBoundingClientRect();
          return rect.width > 0 && rect.height > 0 && !el.textContent?.includes('Supprimer') && !el.textContent?.includes('Effacer');
        });
        if (elements.length > 0) {
          const randomEl = elements[Math.floor(Math.random() * elements.length)];
          randomEl.click();
        }
      }, selector);
      await sleep(150);
    }
  }

  const reports = [];

  // ==========================================
  // 1. DASHBOARD & FILTRES TEMPORELS
  // ==========================================
  console.log('\n--- 1. Test Dashboard & Filtres ---');
  await page.goto(`${BASE_URL}/?dev-local`, { waitUntil: 'networkidle2' });
  await sleep(1000);

  // Close Firestore security warning banner if present so we can test clean UI
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const closeBtn = btns.find((b) => b.textContent?.includes('Fermer'));
    if (closeBtn) closeBtn.click();
  });
  await sleep(400);

  await snap('monkey_01_dashboard_initial', 'Dashboard initial avec dev-local');
  reports.push(await checkDom('Dashboard Initial'));

  // Monkey test temporal filters
  console.log('  -> Monkey testing des filtres temporels');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const filterBtns = btns.filter((b) => ['1M', '3M', '6M', '1A', 'Tout', '30j', 'Année'].some((txt) => b.textContent?.includes(txt)));
    if (filterBtns.length > 0) filterBtns[0].click();
  });
  await sleep(400);
  await snap('monkey_02_dashboard_filtered', 'Dashboard après interaction filtres');
  reports.push(await checkDom('Dashboard Filtres'));

  // ==========================================
  // 2. BOUTON D ACTION RAPIDE (FAB & MODALS)
  // ==========================================
  console.log('\n--- 2. Test Menu d Action Rapide (+) ---');
  await page.evaluate(() => {
    // Locate the FAB (+) button
    const fab = document.querySelector('button[class*="rounded-full"], button[aria-label*="action"]') ||
      Array.from(document.querySelectorAll('button')).find(b => b.querySelector('svg') && b.classList.contains('rounded-full'));
    if (fab) fab.click();
  });
  await sleep(500);
  await snap('monkey_03_quick_action_menu', 'Menu d action rapide ouvert');
  reports.push(await checkDom('Menu Action Rapide'));

  // Click outside or press Escape to close FAB menu
  await page.keyboard.press('Escape');
  await sleep(300);

  // ==========================================
  // 3. ONGLET PRODUCTION (BRASSINS & RECETTES)
  // ==========================================
  console.log('\n--- 3. Test Onglet Production ---');
  await page.evaluate(() => {
    const tabs = Array.from(document.querySelectorAll('button, a'));
    const prodTab = tabs.find((t) => t.textContent?.includes('Brassins') || t.textContent?.includes('Production'));
    if (prodTab) prodTab.click();
  });
  await sleep(800);
  await snap('monkey_04_production_brassins', 'Onglet Production - Liste des brassins');
  reports.push(await checkDom('Production Brassins'));

  // Switch to Recettes sub-tab
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const recettesBtn = buttons.find((b) => b.textContent?.includes('Recettes'));
    if (recettesBtn) recettesBtn.click();
  });
  await sleep(600);
  await snap('monkey_05_production_recettes', 'Onglet Production - Sous-onglet Recettes');
  reports.push(await checkDom('Production Recettes'));

  // Chaotic monkey interactions in recipes
  await chaoticClicks('button, input[type="text"]', 6);
  await sleep(400);
  await snap('monkey_06_production_recettes_post_monkey', 'Recettes après actions chaotiques');
  reports.push(await checkDom('Production Recettes Post-Monkey'));

  // ==========================================
  // 4. ONGLET STOCKS & GESTION DU PARC
  // ==========================================
  console.log('\n--- 4. Test Onglet Stocks ---');
  await page.evaluate(() => {
    const tabs = Array.from(document.querySelectorAll('button, a'));
    const stocksTab = tabs.find((t) => t.textContent?.includes('Stocks'));
    if (stocksTab) stocksTab.click();
  });
  await sleep(800);
  await snap('monkey_07_stocks_overview', 'Onglet Stocks - Vue générale');
  reports.push(await checkDom('Stocks Overview'));

  // Open "Ajouter un article" sheet if button present
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const addBtn = btns.find((b) => b.textContent?.includes('Ajouter un article') || b.textContent?.includes('Ajouter'));
    if (addBtn) addBtn.click();
  });
  await sleep(600);
  await snap('monkey_08_stocks_add_sheet', 'Feuille d ajout d article ouverte');
  reports.push(await checkDom('Stocks Add Sheet'));

  // Monkey typing inside sheet
  await page.keyboard.type('Malt Pilsen Bio 2RP');
  await page.keyboard.press('Tab');
  await page.keyboard.type('25.5');
  await sleep(300);
  await snap('monkey_09_stocks_add_sheet_filled', 'Feuille de stock avec saisie');
  reports.push(await checkDom('Stocks Saisie'));

  // Close sheet with Escape
  await page.keyboard.press('Escape');
  await sleep(400);

  // Switch sub-tabs (Courses, Fûts, Matériel)
  const subTabs = ['Courses', 'Fûts', 'Matériel', 'Stock'];
  for (const st of subTabs) {
    await page.evaluate((tabName) => {
      const btns = Array.from(document.querySelectorAll('button'));
      const found = btns.find((b) => b.textContent?.includes(tabName));
      if (found) found.click();
    }, st);
    await sleep(400);
  }
  await snap('monkey_10_stocks_subtabs', 'Onglet Stocks après cycle des sous-onglets');
  reports.push(await checkDom('Stocks Subtabs'));

  // ==========================================
  // 5. ONGLET FINANCES & CALCULS DE MARGES
  // ==========================================
  console.log('\n--- 5. Test Onglet Finances ---');
  await page.evaluate(() => {
    const tabs = Array.from(document.querySelectorAll('button, a'));
    const financesTab = tabs.find((t) => t.textContent?.includes('Finances'));
    if (financesTab) financesTab.click();
  });
  await sleep(800);
  await snap('monkey_11_finances_overview', 'Onglet Finances - Vue générale');
  reports.push(await checkDom('Finances Overview'));

  // Chaotic monkey clicks on finances tabs/buttons
  await chaoticClicks('button', 8);
  await sleep(500);
  await snap('monkey_12_finances_post_monkey', 'Finances après clics rapides');
  reports.push(await checkDom('Finances Post-Monkey'));

  // ==========================================
  // 6. ONGLET CLIENTS & FACTURATION
  // ==========================================
  console.log('\n--- 6. Test Onglet Clients ---');
  await page.evaluate(() => {
    const tabs = Array.from(document.querySelectorAll('button, a'));
    const clientsTab = tabs.find((t) => t.textContent?.includes('Clients'));
    if (clientsTab) clientsTab.click();
  });
  await sleep(800);
  await snap('monkey_13_clients_overview', 'Onglet Clients - Vue générale');
  reports.push(await checkDom('Clients Overview'));

  // Open "Nouveau Client" modal if present
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const newClientBtn = btns.find((b) => b.textContent?.includes('Nouveau client') || b.textContent?.includes('Ajouter'));
    if (newClientBtn) newClientBtn.click();
  });
  await sleep(600);
  await snap('monkey_14_clients_new_modal', 'Modal de création client');
  reports.push(await checkDom('Clients New Modal'));

  // Close modal with Escape
  await page.keyboard.press('Escape');
  await sleep(400);

  // ==========================================
  // 7. DESKTOP VIEWPORT CHECK (1440x900)
  // ==========================================
  console.log('\n--- 7. Test Desktop Viewport (1440x900) ---');
  await page.setViewport({ width: 1440, height: 900, isMobile: false });
  await page.goto(`${BASE_URL}/?dev-local`, { waitUntil: 'networkidle2' });
  await sleep(800);

  // Dismiss banner if present
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const closeBtn = btns.find((b) => b.textContent?.includes('Fermer'));
    if (closeBtn) closeBtn.click();
  });
  await sleep(300);

  await snap('monkey_15_desktop_dashboard', 'Dashboard Desktop 1440px complet');
  reports.push(await checkDom('Desktop Dashboard'));

  // Switch to Production on Desktop
  await page.evaluate(() => {
    const tabs = Array.from(document.querySelectorAll('button, a'));
    const prodTab = tabs.find((t) => t.textContent?.includes('Production') || t.textContent?.includes('Brassins'));
    if (prodTab) prodTab.click();
  });
  await sleep(600);
  await snap('monkey_16_desktop_production', 'Production Desktop 1440px');
  reports.push(await checkDom('Desktop Production'));

  // Switch to Finances on Desktop
  await page.evaluate(() => {
    const tabs = Array.from(document.querySelectorAll('button, a'));
    const finTab = tabs.find((t) => t.textContent?.includes('Finances'));
    if (finTab) finTab.click();
  });
  await sleep(600);
  await snap('monkey_17_desktop_finances', 'Finances Desktop 1440px');
  reports.push(await checkDom('Desktop Finances'));

  await browser.close();

  // Summary Report
  const totalAnomalies = reports.reduce((acc, r) => acc + r.anomalies.length, 0);
  const totalOverflows = reports.filter((r) => r.overflow).length;

  const fullReport = {
    timestamp: new Date().toISOString(),
    screenshots: screenshotsTaken,
    totalSteps: reports.length,
    totalAnomalies,
    totalOverflows,
    pageErrors,
    consoleErrors: consoleLogs,
    reports
  };

  const reportPath = path.join(ARTIFACT_DIR, 'manual_monkey_report.json');
  fs.writeFileSync(reportPath, JSON.stringify(fullReport, null, 2));

  console.log('\n=============================================');
  console.log('🏁 BILAN DU MANUAL MONKEY TESTING :');
  console.log(`Étapes testées : ${reports.length}`);
  console.log(`Captures prises : ${screenshotsTaken.length}`);
  console.log(`Anomalies DOM  : ${totalAnomalies}`);
  console.log(`Débordements   : ${totalOverflows}`);
  console.log(`Erreurs JS     : ${pageErrors.length}`);
  console.log('=============================================');
}

run().catch((e) => {
  console.error('Fatal monkey test error:', e);
  process.exit(1);
});
