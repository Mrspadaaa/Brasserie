import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const ARTIFACT_DIR = 'C:\\Users\\mrspa\\.gemini\\antigravity\\brain\\b4ee6eb4-eb35-4841-86e9-4801dc45b05c';
const BASE_URL = 'http://localhost:5199';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function run() {
  console.log('🔘 Lancement du test approfondi de tous les boutons et formulaires...');

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    defaultViewport: { width: 412, height: 915, isMobile: true, hasTouch: true },
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  const pageErrors = [];
  const consoleErrors = [];

  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('pageerror', (err) => pageErrors.push(err.message));

  const results = [];
  let testNum = 0;

  async function checkDom(ctx) {
    return await page.evaluate((context) => {
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
              context,
              match: text.trim().slice(0, 80),
              pattern: p.toString()
            });
            break;
          }
        }
      }

      const overflow = document.documentElement.scrollWidth > document.documentElement.clientWidth;
      return { anomalies, overflow };
    }, ctx);
  }

  async function testAction(name, action, options = {}) {
    testNum++;
    console.log(`\n[Action #${testNum}] ${name}`);
    const beforePageErrors = pageErrors.length;
    const beforeConsoleErrors = consoleErrors.length;

    try {
      await action(page);
      await sleep(options.waitMs ?? 350);

      const dom = await checkDom(name);
      const newPageErrors = pageErrors.slice(beforePageErrors);
      const newConsoleErrors = consoleErrors.slice(beforeConsoleErrors);

      const ok = dom.anomalies.length === 0 && !dom.overflow && newPageErrors.length === 0;

      if (options.snap) {
        const snapPath = path.join(ARTIFACT_DIR, `deep_btn_${String(testNum).padStart(2, '0')}_${options.snap}.png`);
        await page.screenshot({ path: snapPath });
        console.log(`  📸 Screenshot: deep_btn_${String(testNum).padStart(2, '0')}_${options.snap}.png`);
      }

      results.push({
        num: testNum,
        name,
        ok,
        anomalies: dom.anomalies,
        overflow: dom.overflow,
        pageErrors: newPageErrors,
        consoleErrors: newConsoleErrors
      });

      console.log(`  ${ok ? '✅' : '❌'} ${ok ? 'OK' : 'FAIL'}`);
    } catch (err) {
      console.error(`  💥 ERROR on [${name}]:`, err.message);
      results.push({
        num: testNum,
        name,
        ok: false,
        exception: err.message
      });
    }
  }

  // --- START TESTS ---
  console.log('Ouverture de l\'application locale...');
  await page.goto(`${BASE_URL}/?dev-local`, { waitUntil: 'networkidle0', timeout: 15000 });
  // Attendre la disparition du toast d'initialisation (qui dure ~3s)
  await sleep(3500);

  // 1. HEADER INTERACTIONS
  await testAction('Header: Home Button Click', async (p) => {
    const homeBtn = await p.$('button[aria-label="Retour au tableau de bord"]');
    if (!homeBtn) throw new Error('Home button not found');
    await homeBtn.click();
  }, { snap: 'header_home' });

  await testAction('Header: Open Period Selector Dropdown', async (p) => {
    // Bouton de période dans le header
    const periodBtn = await p.evaluateHandle(() => {
      const header = document.querySelector('header');
      const btns = header ? Array.from(header.querySelectorAll('button')) : [];
      return btns.find((b) => b.textContent.includes('historique') || b.textContent.includes('mois') || b.textContent.includes('Exercice'));
    });
    if (!periodBtn) throw new Error('Period dropdown button not found in header');
    await periodBtn.click();
  }, { snap: 'header_period_open', waitMs: 500 });

  await testAction('Header: Select Period [Ce mois]', async (p) => {
    const periodOptions = await p.$$('header div.relative div.absolute button');
    let target = null;
    for (const b of periodOptions) {
      const txt = await p.evaluate((el) => el.textContent.trim(), b);
      if (txt.includes('Ce mois')) { target = b; break; }
    }
    if (!target) {
      // Si pas encore trouvé dans le conteneur absolu, chercher parmi tous les boutons
      const allBtns = await p.$$('button');
      for (const b of allBtns) {
        const txt = await p.evaluate((el) => el.textContent.trim(), b);
        if (txt.includes('Ce mois')) { target = b; break; }
      }
    }
    if (!target) throw new Error('Period option [Ce mois] not found');
    await target.click();
  }, { snap: 'header_period_this_month', waitMs: 500 });

  await testAction('Header: Restore Period [Tout l\'historique]', async (p) => {
    const periodBtn = await p.evaluateHandle(() => {
      const header = document.querySelector('header');
      const btns = header ? Array.from(header.querySelectorAll('button')) : [];
      return btns.find((b) => b.textContent.includes('mois') || b.textContent.includes('historique'));
    });
    await periodBtn.click();
    await sleep(300);
    const options = await p.$$('header div.relative div.absolute button');
    for (const b of options) {
      const txt = await p.evaluate((el) => el.textContent.trim(), b);
      if (txt.includes('Tout l\'historique')) {
        await b.click();
        break;
      }
    }
  }, { snap: 'header_period_restored', waitMs: 500 });

  await testAction('Header: Open Universal Search (⌘K Loupe)', async (p) => {
    const searchBtn = await p.$('button[aria-label="Rechercher (⌘K)"]');
    if (!searchBtn) throw new Error('Search button not found');
    await searchBtn.click();
  }, { snap: 'command_palette_open' });

  await testAction('Header: Search in Command Palette [Stout]', async (p) => {
    const input = await p.$('input[placeholder*="Chercher"]');
    if (input) {
      await input.type('Stout', { delay: 40 });
    }
  }, { snap: 'command_palette_stout' });

  await testAction('Header: Close Command Palette via Escape', async (p) => {
    await p.keyboard.press('Escape');
  }, { snap: 'command_palette_closed' });

  await testAction('Header: Open Menu (MoreVertical)', async (p) => {
    const menuBtn = await p.$('button[aria-label="Menu"]');
    if (!menuBtn) throw new Error('Menu button not found');
    await menuBtn.click();
  }, { snap: 'header_menu_open' });

  await testAction('Header: Toggle User (Gaëtan -> Aricia)', async (p) => {
    const buttons = await p.$$('button');
    for (const b of buttons) {
      const txt = await p.evaluate((el) => el.textContent.trim(), b);
      if (txt.includes('Saisie au nom de')) {
        await b.click();
        break;
      }
    }
  }, { snap: 'header_user_toggled_aricia' });

  await testAction('Header: Toggle User Back (Aricia -> Gaëtan)', async (p) => {
    const menuBtn = await p.$('button[aria-label="Menu"]');
    await menuBtn.click();
    await sleep(200);
    const buttons = await p.$$('button');
    for (const b of buttons) {
      const txt = await p.evaluate((el) => el.textContent.trim(), b);
      if (txt.includes('Saisie au nom de')) {
        await b.click();
        break;
      }
    }
  }, { snap: 'header_user_toggled_gaetan' });

  await testAction('Header: Open Audit Log Modal', async (p) => {
    const menuBtn = await p.$('button[aria-label="Menu"]');
    await menuBtn.click();
    await sleep(200);
    const buttons = await p.$$('button');
    for (const b of buttons) {
      const txt = await p.evaluate((el) => el.textContent.trim(), b);
      if (txt.includes('Journal des modifications')) {
        await b.click();
        break;
      }
    }
  }, { snap: 'modal_audit_logs_open' });

  await testAction('Header: Close Audit Log Modal via Escape', async (p) => {
    await p.keyboard.press('Escape');
  }, { snap: 'modal_audit_logs_closed' });

  await testAction('Header: Open Cloud & IA Config Modal', async (p) => {
    const menuBtn = await p.$('button[aria-label="Menu"]');
    await menuBtn.click();
    await sleep(200);
    const buttons = await p.$$('button');
    for (const b of buttons) {
      const txt = await p.evaluate((el) => el.textContent.trim(), b);
      if (txt.includes('Connexions cloud et IA')) {
        await b.click();
        break;
      }
    }
  }, { snap: 'modal_cloud_config_open' });

  await testAction('Header: Close Cloud Config Modal via Escape', async (p) => {
    await p.keyboard.press('Escape');
  }, { snap: 'modal_cloud_config_closed' });

  await testAction('Header: Open Settings Modal', async (p) => {
    const menuBtn = await p.$('button[aria-label="Menu"]');
    await menuBtn.click();
    await sleep(200);
    const buttons = await p.$$('button');
    for (const b of buttons) {
      const txt = await p.evaluate((el) => el.textContent.trim(), b);
      if (txt.includes('Réglages')) {
        await b.click();
        break;
      }
    }
  }, { snap: 'modal_settings_open' });

  await testAction('Settings: Switch to Tab [Salle de Brassage]', async (p) => {
    const tabs = await p.$$('button');
    for (const t of tabs) {
      const txt = await p.evaluate((el) => el.textContent.trim(), t);
      if (txt.includes('Salle de Brassage') || txt.includes('Brassage')) {
        await t.click();
        break;
      }
    }
  }, { snap: 'modal_settings_brewhouse' });

  await testAction('Settings: Switch to Tab [Sauvegarde & Export]', async (p) => {
    const tabs = await p.$$('button');
    for (const t of tabs) {
      const txt = await p.evaluate((el) => el.textContent.trim(), t);
      if (txt.includes('Sauvegarde')) {
        await t.click();
        break;
      }
    }
  }, { snap: 'modal_settings_backup' });

  await testAction('Settings: Close Settings via Escape', async (p) => {
    await p.keyboard.press('Escape');
  }, { snap: 'modal_settings_closed' });

  // 2. STOCKS DEEP INTERACTIONS
  await testAction('Stocks: Navigate to Tab Stocks', async (p) => {
    const navButtons = await p.$$('nav button');
    let target = null;
    for (const b of navButtons) {
      const txt = await p.evaluate((el) => el.textContent.trim(), b);
      if (txt.includes('Stocks')) { target = b; break; }
    }
    if (!target) throw new Error('Stocks nav button not found');
    await target.click();
  }, { snap: 'stocks_main' });

  await testAction('Stocks: Switch to Subtab [Courses]', async (p) => {
    const pills = await p.$$('button');
    for (const btn of pills) {
      const txt = await p.evaluate((el) => el.textContent.trim(), btn);
      if (txt === 'Courses' || txt.includes('Courses')) {
        await btn.click();
        break;
      }
    }
  }, { snap: 'stocks_subtab_courses' });

  await testAction('Stocks: Switch to Subtab [Fûts]', async (p) => {
    const pills = await p.$$('button');
    for (const btn of pills) {
      const txt = await p.evaluate((el) => el.textContent.trim(), btn);
      if (txt === 'Fûts' || txt.includes('Fûts')) {
        await btn.click();
        break;
      }
    }
  }, { snap: 'stocks_subtab_kegs' });

  await testAction('Stocks: Switch to Subtab [Matériel]', async (p) => {
    const pills = await p.$$('button');
    for (const btn of pills) {
      const txt = await p.evaluate((el) => el.textContent.trim(), btn);
      if (txt === 'Matériel' || txt.includes('Matériel')) {
        await btn.click();
        break;
      }
    }
  }, { snap: 'stocks_subtab_equipment' });

  await testAction('Stocks: Click Equipment Item [Cuve empâtage] to open sheet', async (p) => {
    const eqArticles = await p.$$('article[role="button"]');
    if (eqArticles.length > 0) {
      await eqArticles[0].click();
    }
  }, { snap: 'stocks_equipment_sheet_opened' });

  await testAction('Stocks: Close Equipment Sheet via Escape', async (p) => {
    await p.keyboard.press('Escape');
  }, { snap: 'stocks_equipment_sheet_closed' });

  await testAction('Stocks: Switch to Subtab [Stock]', async (p) => {
    const pills = await p.$$('button');
    for (const btn of pills) {
      const txt = await p.evaluate((el) => el.textContent.trim(), btn);
      if (txt === 'Stock' || txt.includes('Stock')) {
        await btn.click();
        break;
      }
    }
  }, { snap: 'stocks_subtab_stock' });

  await testAction('Stocks: Click Item [Malt Maris Otter] to open Sheet', async (p) => {
    const items = await p.$$('li article');
    if (items.length > 0) {
      await items[0].click();
    }
  }, { snap: 'stocks_detail_sheet_opened' });

  await testAction('Stocks: Stepper +1 on StockDetailSheet', async (p) => {
    const plusBtn = await p.$('button[aria-label*="plus"], button[aria-label*="Augmenter"]');
    if (plusBtn) {
      await plusBtn.click();
    }
  }, { snap: 'stocks_detail_stepper_plus' });

  await testAction('Stocks: Stepper -1 on StockDetailSheet', async (p) => {
    const minusBtn = await p.$('button[aria-label*="moins"], button[aria-label*="Diminuer"]');
    if (minusBtn) {
      await minusBtn.click();
    }
  }, { snap: 'stocks_detail_stepper_minus' });

  await testAction('Stocks: Click [Corriger l\'inventaire]', async (p) => {
    const buttons = await p.$$('button');
    for (const b of buttons) {
      const txt = await p.evaluate((el) => el.textContent.trim(), b);
      if (txt.includes('inventaire')) {
        await b.click();
        break;
      }
    }
  }, { snap: 'stocks_inventory_correction_sheet' });

  await testAction('Stocks: Close Inventory Correction Sheet via Escape', async (p) => {
    await p.keyboard.press('Escape');
  }, { snap: 'stocks_inventory_correction_closed' });

  // 3. PRODUCTION DEEP INTERACTIONS
  await testAction('Production: Navigate to Tab Production', async (p) => {
    const navButtons = await p.$$('nav button');
    for (const b of navButtons) {
      const txt = await p.evaluate((el) => el.textContent.trim(), b);
      if (txt.includes('Production')) {
        await b.click();
        break;
      }
    }
  }, { snap: 'production_main' });

  await testAction('Production: Click Edit on Batch [LOT-001 Milk Stout]', async (p) => {
    const editBtns = await p.$$('button[title*="Modifier"]');
    if (editBtns.length > 0) {
      await editBtns[0].click();
    }
  }, { snap: 'production_batch_edit_sheet' });

  await testAction('Production: Close Batch Detail Sheet via Fermer button', async (p) => {
    const buttons = await p.$$('button');
    for (const b of buttons) {
      const txt = await p.evaluate((el) => el.textContent.trim(), b);
      if (txt === 'Fermer') {
        await b.click();
        break;
      }
    }
  }, { snap: 'production_batch_edit_closed' });

  await testAction('Production: Switch to Subtab [Recettes]', async (p) => {
    const pills = await p.$$('button');
    for (const btn of pills) {
      const txt = await p.evaluate((el) => el.textContent.trim(), btn);
      if (txt.includes('Recettes')) {
        await btn.click();
        break;
      }
    }
  }, { snap: 'production_subtab_recipes' });

  await testAction('Production: Click Scale (Balance) icon on Recipe', async (p) => {
    const scaleBtns = await p.$$('button[title*="échelle"], button[title*="echelle"]');
    if (scaleBtns.length > 0) {
      await scaleBtns[0].click();
    }
  }, { snap: 'production_recipe_scaler_modal' });

  await testAction('Production: Close Scaler Modal via Escape', async (p) => {
    await p.keyboard.press('Escape');
  }, { snap: 'production_recipe_scaler_closed' });

  await testAction('Production: Switch to Subtab [Atelier R&D]', async (p) => {
    const pills = await p.$$('button');
    for (const btn of pills) {
      const txt = await p.evaluate((el) => el.textContent.trim(), btn);
      if (txt.includes('Atelier') || txt.includes('R&D')) {
        await btn.click();
        break;
      }
    }
  }, { snap: 'production_subtab_rd_lab' });

  await testAction('Creative Lab: Switch Section to [Simulateur de Prix & Marges]', async (p) => {
    const buttons = await p.$$('button');
    for (const b of buttons) {
      const txt = await p.evaluate((el) => el.textContent.trim(), b);
      if (txt.includes('Prix & Marges') || txt.includes('Marges')) {
        await b.click();
        break;
      }
    }
  }, { snap: 'rd_lab_pricing_section' });

  await testAction('Creative Lab: Select Format [33cl] in Pricing Simulator', async (p) => {
    const buttons = await p.$$('button');
    for (const b of buttons) {
      const txt = await p.evaluate((el) => el.textContent.trim(), b);
      if (txt === '33cl') {
        await b.click();
        break;
      }
    }
  }, { snap: 'rd_lab_pricing_33cl' });

  await testAction('Creative Lab: Select Format [Fût 30L] in Pricing Simulator', async (p) => {
    const buttons = await p.$$('button');
    for (const b of buttons) {
      const txt = await p.evaluate((el) => el.textContent.trim(), b);
      if (txt.includes('30L')) {
        await b.click();
        break;
      }
    }
  }, { snap: 'rd_lab_pricing_keg30l' });

  // 4. FINANCES DEEP INTERACTIONS
  await testAction('Finances: Navigate to Tab Finances', async (p) => {
    const navButtons = await p.$$('nav button');
    for (const b of navButtons) {
      const txt = await p.evaluate((el) => el.textContent.trim(), b);
      if (txt.includes('Finances')) {
        await b.click();
        break;
      }
    }
  }, { snap: 'finances_main' });

  await testAction('Finances: Toggle Hide Charts', async (p) => {
    const buttons = await p.$$('button');
    for (const b of buttons) {
      const txt = await p.evaluate((el) => el.textContent.trim(), b);
      if (txt.includes('Masquer Graphiques')) {
        await b.click();
        break;
      }
    }
  }, { snap: 'finances_charts_hidden' });

  await testAction('Finances: Toggle Show Charts Back', async (p) => {
    const buttons = await p.$$('button');
    for (const b of buttons) {
      const txt = await p.evaluate((el) => el.textContent.trim(), b);
      if (txt.includes('Afficher Graphiques')) {
        await b.click();
        break;
      }
    }
  }, { snap: 'finances_charts_shown' });

  await testAction('Finances: Switch View Mode [Tiers]', async (p) => {
    const buttons = await p.$$('button');
    for (const b of buttons) {
      const txt = await p.evaluate((el) => el.textContent.trim(), b);
      if (txt === 'Tiers') {
        await b.click();
        break;
      }
    }
  }, { snap: 'finances_view_tiers' });

  await testAction('Finances: Switch View Mode [Liste]', async (p) => {
    const buttons = await p.$$('button');
    for (const b of buttons) {
      const txt = await p.evaluate((el) => el.textContent.trim(), b);
      if (txt === 'Liste') {
        await b.click();
        break;
      }
    }
  }, { snap: 'finances_view_liste' });

  await testAction('Finances: Switch View Mode Back to [Mois]', async (p) => {
    const buttons = await p.$$('button');
    for (const b of buttons) {
      const txt = await p.evaluate((el) => el.textContent.trim(), b);
      if (txt === 'Mois') {
        await b.click();
        break;
      }
    }
  }, { snap: 'finances_view_mois' });

  await testAction('Finances: Filter Category [Charges Fixes]', async (p) => {
    const pills = await p.$$('button');
    for (const b of pills) {
      const txt = await p.evaluate((el) => el.textContent.trim(), b);
      if (txt.includes('Charges Fixes')) {
        await b.click();
        break;
      }
    }
  }, { snap: 'finances_cat_charges_fixes' });

  await testAction('Finances: Filter Category [Local & Rénov]', async (p) => {
    const pills = await p.$$('button');
    for (const b of pills) {
      const txt = await p.evaluate((el) => el.textContent.trim(), b);
      if (txt.includes('Local') || txt.includes('Rénov')) {
        await b.click();
        break;
      }
    }
  }, { snap: 'finances_cat_renovation' });

  await testAction('Finances: Restore Category [Tous flux]', async (p) => {
    const pills = await p.$$('button');
    for (const b of pills) {
      const txt = await p.evaluate((el) => el.textContent.trim(), b);
      if (txt.includes('Tous flux')) {
        await b.click();
        break;
      }
    }
  }, { snap: 'finances_cat_all' });

  // 5. CLIENTS DEEP INTERACTIONS
  await testAction('Clients: Navigate to Tab Clients', async (p) => {
    const navButtons = await p.$$('nav button');
    for (const b of navButtons) {
      const txt = await p.evaluate((el) => el.textContent.trim(), b);
      if (txt.includes('Clients')) {
        await b.click();
        break;
      }
    }
  }, { snap: 'clients_main' });

  await testAction('Clients: Switch to Subtab [CH Fiscalité OFDF]', async (p) => {
    const pills = await p.$$('button');
    for (const b of pills) {
      const txt = await p.evaluate((el) => el.textContent.trim(), b);
      if (txt.includes('OFDF')) {
        await b.click();
        break;
      }
    }
  }, { snap: 'clients_subtab_ofdf' });

  await testAction('Clients: Click [Copier les valeurs OFDF]', async (p) => {
    const buttons = await p.$$('button');
    for (const b of buttons) {
      const txt = await p.evaluate((el) => el.textContent.trim(), b);
      if (txt.includes('Copier les valeurs OFDF') || txt.includes('OFDF')) {
        await b.click();
        break;
      }
    }
  }, { snap: 'clients_ofdf_copied' });

  await testAction('Clients: Switch to Subtab [Tarifs & Marges]', async (p) => {
    const pills = await p.$$('button');
    for (const b of pills) {
      const txt = await p.evaluate((el) => el.textContent.trim(), b);
      if (txt.includes('Tarifs') || txt.includes('Marges')) {
        await b.click();
        break;
      }
    }
  }, { snap: 'clients_subtab_tarifs' });

  await testAction('Clients: Switch to Subtab [Clients CRM]', async (p) => {
    const pills = await p.$$('button');
    for (const b of pills) {
      const txt = await p.evaluate((el) => el.textContent.trim(), b);
      if (txt.includes('CRM') || txt.includes('Clients')) {
        await b.click();
        break;
      }
    }
  }, { snap: 'clients_subtab_crm' });

  await testAction('Clients: Click Facture QR on Restaurant du Lac', async (p) => {
    const qrBtns = await p.$$('button[title*="QR"], button[title*="Facture"]');
    if (qrBtns.length > 0) {
      await qrBtns[0].click();
    }
  }, { snap: 'clients_qr_sheet_opened' });

  await testAction('Clients: Close Facture QR Sheet via Escape', async (p) => {
    await p.keyboard.press('Escape');
  }, { snap: 'clients_qr_sheet_closed' });

  await testAction('Clients: Click Edit on Client [Restaurant du Lac]', async (p) => {
    const editBtns = await p.$$('button[title*="Modifier"]');
    if (editBtns.length > 0) {
      await editBtns[0].click();
    }
  }, { snap: 'clients_edit_modal_opened' });

  await testAction('Clients: Close Edit Client Modal via Escape', async (p) => {
    await p.keyboard.press('Escape');
  }, { snap: 'clients_edit_modal_closed' });

  // 6. BREW DAY TIMELINE & TIMER CONTROLS
  await testAction('Brew Day: Open Brew Day Assistant from Production', async (p) => {
    const navButtons = await p.$$('nav button');
    for (const b of navButtons) {
      const txt = await p.evaluate((el) => el.textContent.trim(), b);
      if (txt.includes('Production')) {
        await b.click();
        break;
      }
    }
    await sleep(300);
    const assistBtns = await p.$$('button');
    for (const b of assistBtns) {
      const txt = await p.evaluate((el) => el.textContent.trim(), b);
      if (txt.includes('Assistant')) {
        await b.click();
        break;
      }
    }
  }, { snap: 'brew_day_page_opened', waitMs: 600 });

  await testAction('Brew Day: Toggle Sound Alert', async (p) => {
    const buttons = await p.$$('button');
    for (const b of buttons) {
      const txt = await p.evaluate((el) => el.textContent.trim(), b);
      if (txt.includes('Sonore') || txt.includes('Alarme')) {
        await b.click();
        break;
      }
    }
  }, { snap: 'brew_day_sound_toggled' });

  await testAction('Brew Day: Advance to Next Step [Étape suivante]', async (p) => {
    const buttons = await p.$$('button');
    for (const b of buttons) {
      const txt = await p.evaluate((el) => el.textContent.trim(), b);
      if (txt.includes('suivante') || txt.includes('Suivante')) {
        await b.click();
        break;
      }
    }
  }, { snap: 'brew_day_step_advanced' });

  await testAction('Brew Day: Close Brew Day Page via Retour', async (p) => {
    const backBtn = await p.$('button[aria-label="Retour"]');
    if (backBtn) {
      await backBtn.click();
    } else {
      await p.keyboard.press('Escape');
    }
  }, { snap: 'brew_day_closed' });

  await browser.close();

  const passedCount = results.filter((r) => r.ok).length;
  const failedCount = results.length - passedCount;
  const reportPath = path.join(ARTIFACT_DIR, 'deep_button_matrix_report.json');

  const reportData = {
    timestamp: new Date().toISOString(),
    totalTests: results.length,
    passedTests: passedCount,
    failedTests: failedCount,
    results
  };

  fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2), 'utf-8');
  console.log(`\n======================================================`);
  console.log(`📊 BILAN DU TEST APPROFONDI : ${passedCount}/${results.length} RÉUSSIS (${failedCount} ÉCHECS)`);
  console.log(`Rapport généré : ${reportPath}`);
  console.log(`======================================================\n`);
}

run().catch((e) => {
  console.error('Fatal execution error:', e);
  process.exit(1);
});
