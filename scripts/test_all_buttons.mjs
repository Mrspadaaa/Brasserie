import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const ARTIFACT_DIR = 'C:\\Users\\mrspa\\.gemini\\antigravity\\brain\\b4ee6eb4-eb35-4841-86e9-4801dc45b05c';
const BASE_URL = 'http://localhost:5199';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function run() {
  console.log('🔘 Démarrage du test exhaustif de TOUS LES BOUTONS sur l\'app locale...');

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    defaultViewport: { width: 412, height: 915, isMobile: true, hasTouch: true }, // Mobile standard Pixel 7
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  const pageErrors = [];
  const consoleErrors = [];

  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('pageerror', (err) => pageErrors.push(err.message));

  const buttonResults = [];
  let testIndex = 0;

  async function checkDomIntegrity(context) {
    return await page.evaluate((ctx) => {
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
              context: ctx,
              match: text.trim().slice(0, 80),
              pattern: p.toString()
            });
            break;
          }
        }
      }

      const overflow = document.documentElement.scrollWidth > document.documentElement.clientWidth;
      return { anomalies, overflow };
    }, context);
  }

  async function testBtn(name, action, options = {}) {
    testIndex++;
    console.log(`\n[Btn #${testIndex}] Testing: ${name}`);
    const beforePageErrors = pageErrors.length;
    const beforeConsoleErrors = consoleErrors.length;

    try {
      await action(page);
      await sleep(options.waitMs ?? 400);

      const integrity = await checkDomIntegrity(name);
      const newPageErrors = pageErrors.slice(beforePageErrors);
      const newConsoleErrors = consoleErrors.slice(beforeConsoleErrors);

      const success = integrity.anomalies.length === 0 && !integrity.overflow && newPageErrors.length === 0;

      if (options.screenshot) {
        const snapPath = path.join(ARTIFACT_DIR, `btn_test_${String(testIndex).padStart(2, '0')}_${options.screenshot}.png`);
        await page.screenshot({ path: snapPath });
        console.log(`  📸 Capture : btn_test_${String(testIndex).padStart(2, '0')}_${options.screenshot}.png`);
      }

      buttonResults.push({
        index: testIndex,
        name,
        success,
        anomalies: integrity.anomalies,
        overflow: integrity.overflow,
        pageErrors: newPageErrors,
        consoleErrors: newConsoleErrors
      });

      console.log(`  ${success ? '✅' : '❌'} Résultat : ${success ? 'SUCCÈS' : 'ÉCHEC'}`);
    } catch (e) {
      console.error(`  💥 Exception sur [${name}]:`, e.message);
      buttonResults.push({
        index: testIndex,
        name,
        success: false,
        exception: e.message
      });
    }
  }

  // Initial load
  await page.goto(`${BASE_URL}/?dev-local`, { waitUntil: 'networkidle2' });
  await sleep(1500);

  // =========================================================================
  // 1. BOUTONS DU TABLEAU DE BORD (DASHBOARD)
  // =========================================================================
  console.log('\n=============================================');
  console.log('--- 1. BOUTONS DU DASHBOARD ---');
  console.log('=============================================');

  // Filtre 1M
  await testBtn('Filtre Temporel [1M]', async (p) => {
    await p.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const b = btns.find(el => el.textContent?.trim() === '1M' || el.textContent?.includes('1M'));
      if (b) b.click();
    });
  }, { screenshot: 'dashboard_filter_1m' });

  // Filtre 3M
  await testBtn('Filtre Temporel [3M]', async (p) => {
    await p.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const b = btns.find(el => el.textContent?.trim() === '3M' || el.textContent?.includes('3M'));
      if (b) b.click();
    });
  }, { screenshot: 'dashboard_filter_3m' });

  // Filtre 1A (Année)
  await testBtn('Filtre Temporel [1A]', async (p) => {
    await p.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const b = btns.find(el => el.textContent?.trim() === '1A' || el.textContent?.includes('1A'));
      if (b) b.click();
    });
  }, { screenshot: 'dashboard_filter_1a' });

  // Filtre Tout l'historique
  await testBtn('Filtre Temporel [Tout]', async (p) => {
    await p.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const b = btns.find(el => el.textContent?.trim() === 'Tout' || el.textContent?.includes('Tout'));
      if (b) b.click();
    });
  });

  // Bouton "Nouveau Brassin" du Dashboard
  await testBtn('Bouton [+ Nouveau Brassin] (Dashboard)', async (p) => {
    await p.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const b = btns.find(el => el.textContent?.includes('Nouveau') && el.textContent?.includes('Brassin'));
      if (b) b.click();
    });
  }, { screenshot: 'dashboard_modal_nouveau_brassin' });

  // Fermeture modal Nouveau Brassin (via Escape)
  await testBtn('Fermeture Modal Nouveau Brassin [Escape]', async (p) => {
    await p.keyboard.press('Escape');
  });

  // Bouton FAB (+) Action Express
  await testBtn('Bouton Flottant FAB [+] Action Express', async (p) => {
    await p.evaluate(() => {
      const fab = document.querySelector('button.rounded-full');
      if (fab) fab.click();
    });
  }, { screenshot: 'fab_menu_opened' });

  // Bouton "Photographier une facture"
  await testBtn('Action Express : [Photographier une facture]', async (p) => {
    await p.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const b = btns.find(el => el.textContent?.includes('facture'));
      if (b) b.click();
    });
  }, { screenshot: 'fab_modal_facture' });

  // Fermer modal facture
  await testBtn('Fermeture Modal Facture [Escape]', async (p) => {
    await p.keyboard.press('Escape');
  });

  // Ré-ouvrir FAB pour tester "Dépense Express"
  await testBtn('Bouton Flottant FAB [+] (Réouverture)', async (p) => {
    await p.evaluate(() => {
      const fab = document.querySelector('button.rounded-full');
      if (fab) fab.click();
    });
  });

  // Bouton "Dépense Express"
  await testBtn('Action Express : [Dépense Express]', async (p) => {
    await p.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const b = btns.find(el => el.textContent?.includes('Dépense Express'));
      if (b) b.click();
    });
  }, { screenshot: 'fab_modal_depense_express' });

  // Fermer modal dépense
  await testBtn('Fermeture Modal Dépense Express [Escape]', async (p) => {
    await p.keyboard.press('Escape');
  });

  // Ré-ouvrir FAB pour tester "Encaisser une Vente"
  await testBtn('Bouton Flottant FAB [+] (Réouverture 2)', async (p) => {
    await p.evaluate(() => {
      const fab = document.querySelector('button.rounded-full');
      if (fab) fab.click();
    });
  });

  // Bouton "Encaisser une Vente"
  await testBtn('Action Express : [Encaisser une Vente]', async (p) => {
    await p.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const b = btns.find(el => el.textContent?.includes('Encaisser'));
      if (b) b.click();
    });
  }, { screenshot: 'fab_modal_vente' });

  // Fermer modal vente
  await testBtn('Fermeture Modal Vente [Escape]', async (p) => {
    await p.keyboard.press('Escape');
  });

  // =========================================================================
  // 2. BOUTONS DE L'ONGLET STOCKS & INVENTAIRE
  // =========================================================================
  console.log('\n=============================================');
  console.log('--- 2. BOUTONS DE L\'ONGLET STOCKS ---');
  console.log('=============================================');

  // Navigation vers l'onglet Stocks
  await testBtn('Navigation Barre : Onglet [Stocks]', async (p) => {
    await p.evaluate(() => {
      const tabs = Array.from(document.querySelectorAll('button, a'));
      const t = tabs.find(el => el.textContent?.includes('Stocks'));
      if (t) t.click();
    });
  }, { screenshot: 'stocks_main_tab' });

  // Sous-onglet [Courses]
  await testBtn('Sous-onglet Stocks : [Courses]', async (p) => {
    await p.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const b = btns.find(el => el.textContent?.includes('Courses'));
      if (b) b.click();
    });
  }, { screenshot: 'stocks_subtab_courses' });

  // Sous-onglet [Fûts]
  await testBtn('Sous-onglet Stocks : [Fûts]', async (p) => {
    await p.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const b = btns.find(el => el.textContent?.includes('Fûts'));
      if (b) b.click();
    });
  }, { screenshot: 'stocks_subtab_kegs' });

  // Sous-onglet [Matériel]
  await testBtn('Sous-onglet Stocks : [Matériel]', async (p) => {
    await p.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const b = btns.find(el => el.textContent?.includes('Matériel'));
      if (b) b.click();
    });
  }, { screenshot: 'stocks_subtab_materiel' });

  // Retour au sous-onglet [Stock]
  await testBtn('Sous-onglet Stocks : Retour [Stock]', async (p) => {
    await p.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const b = btns.find(el => el.textContent?.includes('Stock'));
      if (b) b.click();
    });
  });

  // Bouton [+ Ajouter un article]
  await testBtn('Bouton [+ Ajouter un article]', async (p) => {
    await p.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const b = btns.find(el => el.textContent?.includes('Ajouter un article'));
      if (b) b.click();
    });
  }, { screenshot: 'stocks_add_sheet_open' });

  // Bouton "Annuler" dans la sheet d'ajout
  await testBtn('Bouton [Annuler] de la Sheet d\'Ajout', async (p) => {
    await p.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const b = btns.find(el => el.textContent?.trim() === 'Annuler');
      if (b) b.click();
    });
  });

  // Bouton "Corriger l'inventaire" sur le premier article de stock
  await testBtn('Bouton [Corriger l\'inventaire] (sur article Maris Otter)', async (p) => {
    await p.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const b = btns.find(el => el.textContent?.includes('Corriger l\'inventaire'));
      if (b) b.click();
    });
  }, { screenshot: 'stocks_inventory_correction_sheet' });

  // Boutons Stepper dans la correction d'inventaire (+1, -1, +5, -5)
  await testBtn('Stepper [+1 kg] Correction Inventaire', async (p) => {
    await p.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const b = btns.find(el => el.textContent?.trim() === '+1' || el.textContent?.trim() === '+1 kg');
      if (b) b.click();
    });
  });

  await testBtn('Stepper [-1 kg] Correction Inventaire', async (p) => {
    await p.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const b = btns.find(el => el.textContent?.trim() === '-1' || el.textContent?.trim() === '-1 kg');
      if (b) b.click();
    });
  });

  // Bouton fermeture sheet inventaire via Escape
  await testBtn('Fermeture Sheet Inventaire [Escape]', async (p) => {
    await p.keyboard.press('Escape');
  });

  // =========================================================================
  // 3. BOUTONS DE L'ONGLET PRODUCTION (BRASSINS & RECETTES)
  // =========================================================================
  console.log('\n=============================================');
  console.log('--- 3. BOUTONS DE L\'ONGLET PRODUCTION ---');
  console.log('=============================================');

  // Navigation vers l'onglet Production
  await testBtn('Navigation Barre : Onglet [Brassins]', async (p) => {
    await p.evaluate(() => {
      const tabs = Array.from(document.querySelectorAll('button, a'));
      const t = tabs.find(el => el.textContent?.includes('Brassins'));
      if (t) t.click();
    });
  }, { screenshot: 'production_main_tab' });

  // Bouton [Assistant] sur le brassin LOT-001 (Milk Stout)
  await testBtn('Bouton [Assistant] sur Brassin LOT-001', async (p) => {
    await p.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const b = btns.find(el => el.textContent?.includes('Assistant'));
      if (b) b.click();
    });
  }, { screenshot: 'production_batch_assistant_opened' });

  // Fermeture assistant / retour
  await testBtn('Fermeture Assistant Brassin [Escape]', async (p) => {
    await p.keyboard.press('Escape');
  });

  // Sous-onglet [Recettes]
  await testBtn('Sous-onglet Production : [Recettes]', async (p) => {
    await p.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const b = btns.find(el => el.textContent?.includes('Recettes'));
      if (b) b.click();
    });
  }, { screenshot: 'production_subtab_recettes' });

  // Bouton Scaler (Balance) sur la première recette
  await testBtn('Bouton [Scaler Recette] (Icône Balance)', async (p) => {
    await p.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const scaleBtn = btns.find(el => el.querySelector('svg.lucide-scale'));
      if (scaleBtn) scaleBtn.click();
    });
  }, { screenshot: 'production_recipe_scaler_opened' });

  // Fermer modal Scaler
  await testBtn('Fermeture Modal Scaler [Escape]', async (p) => {
    await p.keyboard.press('Escape');
  });

  // Sous-onglet [Atelier R&D]
  await testBtn('Sous-onglet Production : [Atelier R&D]', async (p) => {
    await p.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const b = btns.find(el => el.textContent?.includes('Atelier R&D'));
      if (b) b.click();
    });
  }, { screenshot: 'production_subtab_lab' });

  // Sous-onglet [Scaler 30L / 300L]
  await testBtn('Sous-onglet Production : [Scaler 30L / 300L]', async (p) => {
    await p.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const b = btns.find(el => el.textContent?.includes('Scaler 30L') || el.textContent?.includes('Scaler'));
      if (b) b.click();
    });
  }, { screenshot: 'production_subtab_scaler_tab' });

  // =========================================================================
  // 4. BOUTONS DE L'ONGLET FINANCES
  // =========================================================================
  console.log('\n=============================================');
  console.log('--- 4. BOUTONS DE L\'ONGLET FINANCES ---');
  console.log('=============================================');

  // Navigation vers Finances
  await testBtn('Navigation Barre : Onglet [Finances]', async (p) => {
    await p.evaluate(() => {
      const tabs = Array.from(document.querySelectorAll('button, a'));
      const t = tabs.find(el => el.textContent?.includes('Finances'));
      if (t) t.click();
    });
  }, { screenshot: 'finances_main_tab' });

  // Bouton "Masquer Graphiques" / "Afficher Graphiques"
  await testBtn('Bouton Bascule : [Masquer / Afficher Graphiques]', async (p) => {
    await p.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const b = btns.find(el => el.textContent?.includes('Graphiques'));
      if (b) b.click();
    });
  }, { screenshot: 'finances_graphs_hidden' });

  // Réafficher graphiques
  await testBtn('Bouton Bascule : Réafficher Graphiques', async (p) => {
    await p.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const b = btns.find(el => el.textContent?.includes('Graphiques'));
      if (b) b.click();
    });
  });

  // Filtre Vue [Tiers]
  await testBtn('Vue Finances : Bouton [Tiers]', async (p) => {
    await p.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const b = btns.find(el => el.textContent?.trim() === 'Tiers');
      if (b) b.click();
    });
  }, { screenshot: 'finances_view_tiers' });

  // Filtre Vue [Liste]
  await testBtn('Vue Finances : Bouton [Liste]', async (p) => {
    await p.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const b = btns.find(el => el.textContent?.trim() === 'Liste');
      if (b) b.click();
    });
  }, { screenshot: 'finances_view_liste' });

  // Filtre Vue [Mois]
  await testBtn('Vue Finances : Retour Bouton [Mois]', async (p) => {
    await p.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const b = btns.find(el => el.textContent?.trim() === 'Mois');
      if (b) b.click();
    });
  });

  // Boutons Catégories Finances
  const categories = ['Brassage', 'Matériel', 'CIP & Hygiène', 'Charges Fixes', 'Tous flux'];
  for (const cat of categories) {
    await testBtn(`Filtre Catégorie Dépense : [${cat}]`, async (p) => {
      await p.evaluate((categoryName) => {
        const btns = Array.from(document.querySelectorAll('button'));
        const b = btns.find(el => el.textContent?.includes(categoryName));
        if (b) b.click();
      }, cat);
    });
  }

  // =========================================================================
  // 5. BOUTONS DE L'ONGLET CLIENTS & FACTURATION
  // =========================================================================
  console.log('\n=============================================');
  console.log('--- 5. BOUTONS DE L\'ONGLET CLIENTS ---');
  console.log('=============================================');

  // Navigation vers Clients
  await testBtn('Navigation Barre : Onglet [Clients]', async (p) => {
    await p.evaluate(() => {
      const tabs = Array.from(document.querySelectorAll('button, a'));
      const t = tabs.find(el => el.textContent?.includes('Clients'));
      if (t) t.click();
    });
  }, { screenshot: 'clients_main_tab' });

  // Sous-onglet [CH Fiscalité OFDF]
  await testBtn('Sous-onglet Clients : [CH Fiscalité OFDF]', async (p) => {
    await p.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const b = btns.find(el => el.textContent?.includes('Fiscalité OFDF') || el.textContent?.includes('OFDF'));
      if (b) b.click();
    });
  }, { screenshot: 'clients_subtab_ofdf' });

  // Sous-onglet [Prix & Marges]
  await testBtn('Sous-onglet Clients : [Prix & Marges]', async (p) => {
    await p.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const b = btns.find(el => el.textContent?.includes('Prix & Marges'));
      if (b) b.click();
    });
  }, { screenshot: 'clients_subtab_tarifs' });

  // Retour au sous-onglet [Clients CRM]
  await testBtn('Sous-onglet Clients : Retour [Clients CRM]', async (p) => {
    await p.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const b = btns.find(el => el.textContent?.includes('Clients CRM'));
      if (b) b.click();
    });
  });

  // Bouton [Facture QR] sur le premier client
  await testBtn('Bouton [Facture QR] sur Client Restaurant du Lac', async (p) => {
    await p.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const b = btns.find(el => el.textContent?.includes('Facture QR'));
      if (b) b.click();
    });
  }, { screenshot: 'clients_qr_bill_sheet' });

  // Fermer sheet QR Facture
  await testBtn('Fermeture Sheet Facture QR [Escape]', async (p) => {
    await p.keyboard.press('Escape');
  });

  // Bouton Modifier Client (Icône Crayon)
  await testBtn('Bouton [Modifier Client] (Icône Crayon)', async (p) => {
    await p.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const b = btns.find(el => el.querySelector('svg.lucide-pencil'));
      if (b) b.click();
    });
  }, { screenshot: 'clients_edit_modal' });

  // Fermer modal modifier client
  await testBtn('Fermeture Modal Modifier Client [Escape]', async (p) => {
    await p.keyboard.press('Escape');
  });

  // =========================================================================
  // 6. BOUTONS DU BANC D'ESSAI BRASSAGE (EAU, RECETTE, MINUTEUR, ASSISTANT)
  // =========================================================================
  console.log('\n=============================================');
  console.log('--- 6. BOUTONS DU BANC D\'ESSAI BRASSAGE ---');
  console.log('=============================================');

  // Atelier Eau
  await page.goto(`${BASE_URL}/?preview=brew&view=eau`, { waitUntil: 'networkidle2' });
  await sleep(1000);

  // Bouton Preset [Dublin]
  await testBtn('Atelier Eau : Bouton Preset [Dublin]', async (p) => {
    await p.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const b = btns.find(el => el.textContent?.includes('Dublin'));
      if (b) b.click();
    });
  }, { screenshot: 'water_preset_dublin' });

  // Onglet [2. Sels minéraux]
  await testBtn('Atelier Eau : Onglet [2. Sels minéraux]', async (p) => {
    await p.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const b = btns.find(el => el.textContent?.includes('2. Sels') || el.textContent?.includes('Sels'));
      if (b) b.click();
    });
  }, { screenshot: 'water_tab_salts' });

  // Commutateur Sel Gypse
  await testBtn('Atelier Eau : Commutateur [Gypse]', async (p) => {
    await p.evaluate(() => {
      const switches = Array.from(document.querySelectorAll('[role="switch"]'));
      if (switches.length > 0) switches[0].click();
    });
  });

  // Bouton Stepper (+) sur Gypse
  await testBtn('Atelier Eau : Stepper [+] Gypse', async (p) => {
    await p.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const plusBtn = btns.find(el => el.textContent?.trim() === '+');
      if (plusBtn) plusBtn.click();
    });
  });

  // Bouton [Doser]
  await testBtn('Atelier Eau : Bouton [Doser]', async (p) => {
    await p.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const b = btns.find(el => el.textContent?.includes('Doser'));
      if (b) b.click();
    });
  }, { screenshot: 'water_doser_clicked' });

  // Passage à la Fiche Recette
  await page.goto(`${BASE_URL}/?preview=brew&view=recette`, { waitUntil: 'networkidle2' });
  await sleep(1000);

  // Bouton "Lancer un brassin"
  await testBtn('Fiche Recette : Bouton [Lancer un brassin]', async (p) => {
    await p.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const b = btns.find(el => el.textContent?.includes('Lancer un brassin'));
      if (b) b.click();
    });
  }, { screenshot: 'recipe_brew_clicked' });

  // Minuteur jour de brassage
  await page.goto(`${BASE_URL}/?preview=brew&view=brassage`, { waitUntil: 'networkidle2' });
  await sleep(1000);

  // Bouton Type de relevé [Volume]
  await testBtn('Minuteur : Bouton Type Relevé [Volume]', async (p) => {
    await p.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const b = btns.find(el => el.textContent?.trim() === 'Volume');
      if (b) b.click();
    });
  });

  // Bouton Type de relevé [pH]
  await testBtn('Minuteur : Bouton Type Relevé [pH]', async (p) => {
    await p.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const b = btns.find(el => el.textContent?.trim() === 'pH');
      if (b) b.click();
    });
  });

  // Bouton Type de relevé [Temp.]
  await testBtn('Minuteur : Bouton Type Relevé [Temp.]', async (p) => {
    await p.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const b = btns.find(el => el.textContent?.trim() === 'Temp.');
      if (b) b.click();
    });
  });

  // Bouton [Passer à l'étape suivante]
  await testBtn('Minuteur : Bouton [Passer à l\'étape suivante]', async (p) => {
    await p.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const b = btns.find(el => el.textContent?.includes('Passer à l\'étape') || el.textContent?.includes('Suivante'));
      if (b) b.click();
    });
  }, { screenshot: 'brew_day_next_step' });

  await browser.close();

  const totalTests = buttonResults.length;
  const passedTests = buttonResults.filter(r => r.success).length;
  const failedTests = buttonResults.filter(r => !r.success).length;

  const report = {
    timestamp: new Date().toISOString(),
    totalTests,
    passedTests,
    failedTests,
    results: buttonResults
  };

  const reportPath = path.join(ARTIFACT_DIR, 'button_tests_report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

  console.log('\n======================================================');
  console.log('🏁 BILAN DU TEST EXHAUSTIF DES BOUTONS :');
  console.log(`Boutons testés : ${totalTests}`);
  console.log(`Réussis        : ${passedTests}`);
  console.log(`Échoués        : ${failedTests}`);
  console.log('======================================================');
}

run().catch((e) => {
  console.error('Fatal error in button test:', e);
  process.exit(1);
});
