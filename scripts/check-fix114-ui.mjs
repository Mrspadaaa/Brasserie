// Contrôle visuel de #114 dans la vraie App, sur fixtures : serveur Vite de dev
// déjà lancé (`--base`, `?dev-local`), stock levure injecté dans le navigateur,
// réseau hors localhost bloqué (polices Google seules permises). Rien n'est
// enregistré : les formulaires s'ouvrent puis se ferment.
//
//   node scripts/check-fix114-ui.mjs --phase=avant|apres [--base=http://127.0.0.1:5184] [--widths=390,1280] [--recap-only]
//
// Mesures par vue : position du +, case ou flottement, bande de pied, dernier
// contrôle de la page atteignable au-dessus du + (et touché à sa place),
// pastille de levure (nom lisible), action principale du + sur Bord et Finances.
import puppeteer from 'puppeteer-core';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const arg = (name, fallback) => process.argv.find(a => a.startsWith(`--${name}=`))?.slice(name.length + 3) ?? fallback;
const phase = arg('phase', 'apres');
const base = arg('base', 'http://127.0.0.1:5184');
const widths = arg('widths', '390,1280').split(',').map(Number);
const origin = new URL(base).origin;
const out = resolve('work/finalisation-tickets-2026-10-08/validations/114', phase);
await mkdir(out, { recursive: true });

const sleep = ms => new Promise(done => setTimeout(done, ms));
const report = { phase, base, startedAt: new Date().toISOString(), views: [], errors: [], blocked: [] };

const LAUNCHER = 'button[aria-label^="Actions rapides"]';

async function openPage(browser, width, query = '') {
  const context = await browser.createBrowserContext();
  const page = await context.newPage();
  const phone = width < 640;
  page.on('pageerror', error => report.errors.push(`${width}: ${error.message}`));
  await page.setRequestInterception(true);
  page.on('request', request => {
    const url = new URL(request.url());
    if (url.origin === origin || ['data:', 'blob:'].includes(url.protocol) ||
      ['fonts.googleapis.com', 'fonts.gstatic.com'].includes(url.hostname)) return request.continue();
    report.blocked.push(url.origin);
    return request.abort();
  });
  // La largeur d'abord, puis le chargement.
  await page.setViewport({ width, height: phone ? 844 : 900, deviceScaleFactor: 1, isMobile: phone, hasTouch: phone });
  await page.goto(`${base}/?dev-local${query}`, { waitUntil: 'networkidle0', timeout: 60000 });
  await page.waitForSelector(LAUNCHER, { timeout: 30000 });
  await page.evaluate(async () => {
    const { StorageService } = await import('/src/services/storage.ts');
    const { FirestoreRepo } = await import('/src/services/firestoreRepo.ts');
    FirestoreRepo.startSync();
    const yeast = (ref, name, extra) => ({ id: `fix114-${ref}`, ref, name, category: 'Levure', unit: 'g',
      currentStock: 11.5, minStock: 0, reorder: false, ...extra });
    // Détail long synthétique : labo, code avec ®, réf. et quantité (retour de l'humain, 17.10).
    StorageService.addStockItem('rawMaterials', yeast('LEV-2026-0412-B', 'American West Coast Ale', {
      favorite: true, supplier: 'Brauerei-Bedarf Zürich', yeastLab: 'Fermentis by Lesaffre',
      yeastStrain: 'SafAle™ US-05®', yeastForm: 'sèche' }));
    StorageService.addStockItem('rawMaterials', yeast('LEV-K97', 'K-97', { unit: 'sachet', currentStock: 2,
      yeastLab: 'Fermentis', yeastStrain: 'K-97' }));
  });
  await sleep(500);
  return { page, context };
}

const measure = page => page.evaluate(selector => {
  const box = element => {
    if (!element) return null;
    const b = element.getBoundingClientRect();
    return { x: Math.round(b.left), y: Math.round(b.top), w: Math.round(b.width), h: Math.round(b.height),
      right: Math.round(b.right), bottom: Math.round(b.bottom) };
  };
  const launcher = document.querySelector(selector);
  const root = launcher?.closest('.floating-actions');
  const shell = document.querySelector('[data-page-shell]');
  const footer = shell?.querySelector(':scope > footer');
  const header = shell?.querySelector(':scope > header');
  const main = shell?.querySelector(':scope > main');
  return {
    viewport: { w: innerWidth, h: innerHeight, scrollWidth: document.documentElement.scrollWidth },
    launcher: box(launcher), launcherVisible: !!launcher && getComputedStyle(root).display !== 'none',
    launcherInHeader: !!header && !!launcher && (() => { const h = header.getBoundingClientRect(), l = launcher.getBoundingClientRect();
      return l.top >= h.top - 1 && l.bottom <= h.bottom + 1; })(),
    dock: root?.dataset.floatingActionsDock ?? null, docked: root?.dataset.floatingActionsDocked ?? null,
    tone: root?.dataset.floatingActionsTone ?? null,
    // Bande de pied pour le seul + : marquée avant #114, ou pied sans aucun texte de page.
    footer: footer ? { ...box(footer), dockOnly: footer.hasAttribute('data-action-dock-only') || !footer.textContent.trim(),
      text: footer.textContent.trim().slice(0, 80) } : null,
    header: box(header), main: box(main),
    scroll: main ? { top: Math.round(main.scrollTop), height: main.scrollHeight, client: main.clientHeight } : null,
    padBottom: main ? getComputedStyle(main.firstElementChild).paddingBottom : null
  };
}, LAUNCHER);

/** Bas de page : le dernier contrôle visible dégage le + et reçoit le toucher à sa place. */
const bottomReach = page => page.evaluate(selector => {
  const main = document.querySelector('[data-page-shell] > main');
  main.scrollTop = main.scrollHeight;
  const shown = element => { const b = element.getBoundingClientRect(); return b.width > 0 && b.height > 0; };
  const controls = [...main.querySelectorAll('input:not([type=hidden]), select, textarea, button, [role="combobox"], a[href]')].filter(shown);
  const last = controls.at(-1);
  const launcher = document.querySelector(selector);
  if (!last || !launcher) return { last: null };
  const b = last.getBoundingClientRect(), l = launcher.getBoundingClientRect();
  const overlapX = b.right > l.left && b.left < l.right;
  const x = overlapX ? Math.max(b.left + 2, Math.min(b.right - 3, l.left + l.width / 2)) : b.left + b.width / 2;
  const y = b.top + b.height / 2;
  const hit = document.elementFromPoint(x, y);
  return {
    last: `${last.tagName.toLowerCase()} « ${(last.getAttribute('aria-label') || last.textContent || '').trim().slice(0, 50)} »`,
    lastRect: { x: Math.round(b.left), y: Math.round(b.top), w: Math.round(b.width), h: Math.round(b.height), bottom: Math.round(b.bottom) },
    launcherTop: Math.round(l.top), gapAboveLauncher: Math.round(l.top - b.bottom), overlapX,
    hitPoint: { x: Math.round(x), y: Math.round(y) }, hitIsLast: last.contains(hit), hitIsLauncher: launcher.contains(hit)
  };
}, LAUNCHER);

async function shot(page, name, extra = {}) {
  await sleep(350);
  const file = `${name}.png`;
  await page.screenshot({ path: resolve(out, file) });
  const view = { name, file, ...(await measure(page)), ...extra };
  report.views.push(view);
  console.log(`${name}: + ${JSON.stringify(view.launcher)} dock=${view.dock}/${view.docked} pied=${view.footer ? `${view.footer.h}px${view.footer.dockOnly ? ' (case seule)' : ''}` : 'aucun'}`);
  return view;
}

async function openMenu(page) {
  await page.click(LAUNCHER);
  await page.waitForSelector('[role="menu"][aria-label="Actions rapides"]');
  return page.$$eval('[role="menu"] [role="menuitem"]', items => items.map(item => item.textContent.trim()));
}

async function chooseMenu(page, label) {
  await page.evaluate(text => {
    [...document.querySelectorAll('[role="menu"] [role="menuitem"]')].find(item => item.textContent.trim().startsWith(text))?.click();
  }, label);
}

async function tabFlow(page, width, tab) {
  if (tab === 'finances') {
    await page.evaluate(() => [...document.querySelectorAll('nav[aria-label="Navigation principale"] button')]
      .find(button => button.textContent.includes('Finances'))?.click());
    await sleep(800);
  }
  const items = await openMenu(page);
  const view = await shot(page, `${width}-${tab}-menu`, { menu: items, first: items[0] });
  if (!/^Nouvelle écriture/.test(items[0] ?? '')) {
    await page.keyboard.press('Escape');
    return view;
  }
  await chooseMenu(page, 'Nouvelle écriture');
  await page.waitForFunction(() => [...document.querySelectorAll('[role="dialog"]')].some(dialog => dialog.textContent.includes('Nouvelle dépense')), { timeout: 20000 });
  const title = await page.evaluate(() => [...document.querySelectorAll('[role="dialog"] h2')].map(h => h.textContent.trim()).join(' | '));
  await shot(page, `${width}-${tab}-ecriture`, { dialogTitle: title });
  // Fermer sans enregistrer.
  await page.evaluate(() => [...document.querySelectorAll('[role="dialog"] button[aria-label="Fermer"]')].at(-1)?.click());
  await page.waitForFunction(() => !document.querySelector('[role="dialog"]'), { timeout: 10000 }).catch(() => {});
  return view;
}

async function openWizard(page) {
  await openMenu(page);
  await chooseMenu(page, 'Créer une recette');
  await page.waitForSelector('.recipe-wizard nav[aria-label="Étapes"]', { timeout: 30000 });
  await sleep(600);
}

/** Récapitulatif : la page montre son pied d'actions ; le + flotte au-dessus, sans second aplat paille. */
async function recapFlow(page, width) {
  await page.evaluate(() => [...document.querySelectorAll('.recipe-wizard nav[aria-label="Étapes"] button[aria-label="Récapitulatif"]')]
    .find(button => button.getBoundingClientRect().width > 0)?.click());
  await page.waitForSelector('[data-page-shell] > footer', { timeout: 30000 });
  await shot(page, `${width}-recap-pied`, { reach: await bottomReach(page) });
}

async function wizardFlow(browser, width) {
  if (process.argv.includes('--recap-only')) {
    const { page, context } = await openPage(browser, width);
    await openWizard(page);
    await recapFlow(page, width);
    await context.close();
    return;
  }
  const { page, context } = await openPage(browser, width);
  await openWizard(page);
  await shot(page, `${width}-createur-haut`);
  // Milieu de page : le + passe au-dessus du contenu ; bas de page : le dernier contrôle remonte au-dessus de lui.
  await page.evaluate(() => { const main = document.querySelector('[data-page-shell] > main'); main.scrollTop = (main.scrollHeight - main.clientHeight) / 2; });
  await shot(page, `${width}-milieu-page`);
  await shot(page, `${width}-createur-bas`, { reach: await bottomReach(page) });
  await shot(page, `${width}-bas-page`, { reach: await bottomReach(page) });
  // Deux rails (en-tête téléphone, en-tête ordinateur) : seul l'un est rendu.
  await page.evaluate(() => [...document.querySelectorAll('.recipe-wizard nav[aria-label="Étapes"] button[aria-label="Levure"]')]
    .find(button => button.getBoundingClientRect().width > 0)?.click());
  await page.waitForSelector('.yc-stock-quick button', { timeout: 30000 });
  await page.evaluate(() => document.querySelector('.yc-stock-quick').scrollIntoView({ block: 'center' }));
  const chip = await page.evaluate(() => {
    const button = document.querySelector('.yc-stock-quick button');
    const name = button.querySelector('span'), detail = button.querySelector('small');
    const box = e => { const b = e.getBoundingClientRect(); return { x: Math.round(b.left), y: Math.round(b.top), w: Math.round(b.width), h: Math.round(b.height) }; };
    const line = parseFloat(getComputedStyle(name).lineHeight) || parseFloat(getComputedStyle(name).fontSize) * 1.2;
    const n = box(name);
    return { text: button.textContent.trim(), chip: box(button), name: n, detail: box(detail), lineHeight: line,
      nameLines: Math.round(n.h / line), readable: n.w >= 80 && n.h <= 2 * line + 2 };
  });
  await shot(page, `${width}-levure-disponibles`, { chip });
  await shot(page, `${width}-levure-bas`, { reach: await bottomReach(page) });
  await recapFlow(page, width);
  await context.close();

  // Clavier ouvert : téléphone avec clavier simulé (`?keyboard=320`, dev seulement) ;
  // ordinateur : champ focalisé, sans clavier virtuel.
  const keyboard = await openPage(browser, width, width < 640 ? '&keyboard=320' : '');
  await openWizard(keyboard.page);
  await keyboard.page.evaluate(() => {
    const field = document.querySelector('[data-page-shell] > main input[type="text"], [data-page-shell] > main input:not([type])');
    field?.focus();
  });
  await keyboard.page.keyboard.type('Saison');
  await shot(keyboard.page, `${width}-createur-clavier-haut`, { focused: await keyboard.page.evaluate(() => document.activeElement?.getAttribute('aria-label') || document.activeElement?.name || document.activeElement?.tagName) });
  await keyboard.page.evaluate(() => {
    const main = document.querySelector('[data-page-shell] > main');
    const fields = [...main.querySelectorAll('input[type="text"], input:not([type]), textarea')].filter(e => e.getBoundingClientRect().height > 0);
    fields.at(-1)?.focus();
    main.scrollTop = main.scrollHeight;
  });
  await shot(keyboard.page, `${width}-createur-clavier-bas`, { reach: await bottomReach(keyboard.page),
    focused: await keyboard.page.evaluate(() => document.activeElement?.getAttribute('aria-label') || document.activeElement?.name || document.activeElement?.tagName) });
  await keyboard.context.close();
}

const browser = await puppeteer.launch({
  executablePath: process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: true, args: ['--mute-audio', '--no-first-run']
});
try {
  for (const width of widths) {
    if (!process.argv.includes('--recap-only')) {
      const { page, context } = await openPage(browser, width);
      await shot(page, `${width}-bord`);
      await tabFlow(page, width, 'bord');
      await tabFlow(page, width, 'finances');
      await context.close();
    }
    await wizardFlow(browser, width);
  }
} catch (error) {
  report.errors.push(`script: ${error.stack ?? error.message}`);
  console.error(error);
  process.exitCode = 1;
} finally {
  await browser.close();
  report.blocked = [...new Set(report.blocked)];
  // Critères #114 (phase « après ») : un écart fait échouer le contrôle.
  report.failures = phase === 'apres' ? report.views.flatMap(view => {
    const fail = [];
    const page = /createur|levure|milieu|bas-page|recap/.test(view.name);
    if (view.reach && !view.reach.hitIsLast) fail.push('dernier contrôle couvert par le +');
    if (view.reach && view.reach.overlapX && view.reach.gapAboveLauncher < 0 && !view.launcherInHeader) fail.push('dernier contrôle sous le +');
    if (view.chip && !view.chip.readable) fail.push('nom de levure illisible');
    if (view.footer?.dockOnly) fail.push('bande de pied pour le seul +');
    if (/-menu$/.test(view.name) && !/^Nouvelle écriture/.test(view.first ?? '')) fail.push('« Nouvelle écriture » pas en tête');
    if (/-ecriture$/.test(view.name) && !/Nouvelle dépense/.test(view.dialogTitle ?? '')) fail.push('formulaire d’écriture non ouvert');
    if (page && view.docked === 'false') {
      if (view.viewport.w - view.launcher.right !== 16) fail.push(`+ à ${view.viewport.w - view.launcher.right} px du bord droit`);
      if (!view.footer && view.viewport.h - view.launcher.bottom !== 16) fail.push(`+ à ${view.viewport.h - view.launcher.bottom} px du bas`);
    }
    return fail.map(reason => `${view.name} : ${reason}`);
  }) : [];
  if (report.failures.length) process.exitCode = 1;
  report.finishedAt = new Date().toISOString();
  await writeFile(resolve(out, process.argv.includes('--recap-only') ? 'rapport-recap.json' : 'rapport.json'), JSON.stringify(report, null, 2));
  console.log(`erreurs page : ${report.errors.length} · origines bloquées : ${report.blocked.join(', ') || 'aucune'}`);
  console.log(report.failures.length ? `ÉCHECS #114 :\n${report.failures.join('\n')}` : (phase === 'apres' ? 'critères #114 : tous tenus' : ''));
}
