// Aide commune des exemples : ouvre Chrome (puppeteer-core) à la taille d'un téléphone et branche les journaux.
// Les exemples l'importent ; un test du dépôt peut le faire aussi, ou recopier ces 40 lignes.
import puppeteer from 'puppeteer-core';

export const CHROME = process.env.CHROME_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe';

const LOCAL = /^(https?|ws)s?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d+)?(\/|$)/i;

/**
 * Lance Chrome sans écran et ouvre une page. `journal` se remplit seul : console (avec l'URL de l'émetteur), erreurs de
 * page, requêtes échouées, et `bloquees` : tout ce qui visait hors de cette machine.
 * Par défaut, toute requête hors localhost est COUPÉE (`externe: 'bloquer'`) : un test ne touche jamais Firebase réel,
 * Gemini ni une CDN (CLAUDE.md : aucune donnée réelle). `externe: 'laisser'` pour une page statique qui en a besoin.
 */
export async function ouvrir({ largeur = 390, hauteur = 844, mobile = true, echelle = 2, externe = 'bloquer' } = {}) {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: true }); // toujours sans écran
  const page = await browser.newPage();
  await page.setViewport({ width: largeur, height: hauteur, deviceScaleFactor: echelle, isMobile: mobile, hasTouch: mobile });
  page.setDefaultNavigationTimeout(120000); // premier chargement de Vite à froid : 30 s ne suffisent pas toujours
  const journal = { console: [], erreurs: [], echecsReseau: [], bloquees: [] };
  page.on('console', (m) => journal.console.push({ type: m.type(), texte: m.text(), url: m.location()?.url ?? '' }));
  page.on('pageerror', (e) => journal.erreurs.push(String(e?.message ?? e)));
  page.on('requestfailed', (r) => { if (!journal.bloquees.includes(r.url())) journal.echecsReseau.push(`${r.method()} ${r.url()} : ${r.failure()?.errorText ?? '?'}`); });
  if (externe === 'bloquer') {
    await page.setRequestInterception(true);
    page.on('request', (r) => {
      const u = r.url();
      if (LOCAL.test(u) || /^(data|blob|about|file):/i.test(u)) r.continue();
      else { journal.bloquees.push(u); r.abort('blockedbyclient'); }
    });
  }
  return { browser, page, journal };
}

/** Attend que le réseau soit calme, puis un court repos pour les rendus différés (React, Suspense). */
export async function calme(page, repos = 400) {
  await page.waitForNetworkIdle({ idleTime: 500, timeout: 30000 }).catch(() => {});
  await new Promise((r) => setTimeout(r, repos));
}

/** Clique le premier élément qui porte ce texte visible (sélecteur par texte : stable, lisible, sans classe CSS). */
export async function cliquerTexte(page, texte, { timeout = 10000 } = {}) {
  await page.locator(`::-p-text(${texte})`).setTimeout(timeout).click();
}
