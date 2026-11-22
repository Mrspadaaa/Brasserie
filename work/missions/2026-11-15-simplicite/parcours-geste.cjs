// Parcours local de la règle L9 : laver un fût → bandeau (pe1), dose demandée (pe4), Annuler, trace sur la ligne (pe3).
// node work/missions/2026-11-15-simplicite/parcours-geste.cjs [port]  — app locale ?dev-local, aucune donnée réelle.
const puppeteer = require('puppeteer-core');
const path = require('path');
const PORT = process.argv[2] || '3021';
const OUT = path.join(__dirname, 'captures');
const sleep = ms => new Promise(r => setTimeout(r, ms));
const configs = [
  { nom: '390-sombre', w: 390, h: 844, touch: true, theme: 'dark' },
  { nom: '390-clair', w: 390, h: 844, touch: true, theme: 'light' },
  { nom: '1280-sombre', w: 1280, h: 860, touch: false, theme: 'dark' },
  { nom: '1280-clair', w: 1280, h: 860, touch: false, theme: 'light' }
];
const SEL = 'button,[role="radio"],[role="tab"],a,li,[role="button"]';
async function cliquerTexte(page, re, sel = SEL) {
  const ok = await page.evaluate((src, sel) => {
    const r = new RegExp(src);
    const el = [...document.querySelectorAll(sel)].find(e => r.test((e.innerText || e.getAttribute('aria-label') || '').trim()) && e.getClientRects().length > 0);
    if (!el) return false; el.scrollIntoView({ block: 'center' }); el.click(); return true;
  }, re.source, sel);
  if (!ok) {
    const vus = await page.evaluate(sel => [...document.querySelectorAll(sel)].filter(e => e.getClientRects().length)
      .map(e => (e.innerText || e.getAttribute('aria-label') || '').trim().split('\n').join('|')).filter(Boolean).slice(0, 50).join(' ; '), SEL);
    throw new Error('introuvable : ' + re + ' — vus : ' + vus);
  }
  await sleep(350);
}
const bandeau = page => page.evaluate(() => document.querySelector('[data-bandeau-effets]')?.innerText ?? null);
const ouvrirFutALaver = async page => {
  await cliquerTexte(page, /^À laver/);
  const ok = await page.evaluate(() => { const b = [...document.querySelectorAll('.equipment-list button, .equipment-list [role="button"]')].find(e => /F-?\d/.test(e.innerText) && e.getClientRects().length); b?.click(); return !!b; });
  await sleep(500);
  return ok;
};
(async () => {
  const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new' });
  const bilan = [];
  for (const c of configs) {
    const page = await browser.newPage();
    const erreurs = [];
    page.on('pageerror', e => erreurs.push(e.message));
    await page.setViewport({ width: c.w, height: c.h, isMobile: c.touch, hasTouch: c.touch, deviceScaleFactor: 1 });
    await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: c.theme }]);
    await page.goto(`http://localhost:${PORT}/?dev-local`, { waitUntil: 'networkidle2', timeout: 90000 });
    await sleep(2500);
    // Fixture en mémoire (dev-local) : les nettoyants du seed sont à 0 ; on les compte à 5.
    await page.evaluate(async () => { const { StorageService: S } = await import('/src/services/storage.ts'); for (const i of S.getStocks().cleaning) S.adjustInventory('cleaning', i.ref, 5, 'comptage'); });
    await sleep(300);
    // Le bouton dit le thème qu'il pose : « Thème sombre » en clair, « Thème clair » en sombre.
    if (await page.evaluate(want => [...document.querySelectorAll('button')].some(b => (b.getAttribute('aria-label') || b.innerText || '').startsWith(want === 'dark' ? 'Thème sombre' : 'Thème clair')), c.theme)) await cliquerTexte(page, c.theme === 'dark' ? /^Thème sombre/ : /^Thème clair/);
    await cliquerTexte(page, /Stocks$/);
    await cliquerTexte(page, /Fûts/);
    await ouvrirFutALaver(page);
    await cliquerTexte(page, /^Marquer propre/);
    await sleep(500);
    const q1 = await bandeau(page);
    await page.screenshot({ path: path.join(OUT, `geste-${c.nom}-1-question.png`) });
    // Première dose au curseur, puis « Pas maintenant » pour les autres.
    await page.evaluate(() => {
      const r = document.querySelector('[data-effet-question] input[type="range"]');
      const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
      set.call(r, '30'); r.dispatchEvent(new Event('input', { bubbles: true }));
    });
    await sleep(200);
    await cliquerTexte(page, /^Retenir$/);
    for (let i = 0; i < 8 && await page.$('[data-effet-question]'); i++) await cliquerTexte(page, /^Pas maintenant$/);
    const effet = await bandeau(page);
    await page.screenshot({ path: path.join(OUT, `geste-${c.nom}-2-effet.png`) });
    await cliquerTexte(page, /^Annuler$/, '[data-bandeau-effets] button');
    const annule = await bandeau(page);
    await page.screenshot({ path: path.join(OUT, `geste-${c.nom}-3-annule.png`) });
    await cliquerTexte(page, /^OK$/, '[data-bandeau-effets] button');
    // Deuxième fût : la dose est connue ; la trace reste sur la ligne de stock.
    let second = null;
    try {
      if (!await ouvrirFutALaver(page)) throw new Error('aucun');
      await cliquerTexte(page, /^Marquer propre/); await sleep(400);
      second = await bandeau(page);
      for (let i = 0; i < 8 && await page.$('[data-effet-question]'); i++) await cliquerTexte(page, /^Pas maintenant$/);
      await cliquerTexte(page, /^OK$/, '[data-bandeau-effets] button');
    } catch (e) { second = 'pas de 2e fût : ' + e.message.slice(0, 200); }
    await cliquerTexte(page, /^Articles$/);
    await sleep(600);
    // La ligne du nettoyant décompté, par la recherche de la liste.
    await sleep(500);
    let champ = null;
    for (const h of await page.$$('input[placeholder*="article"]')) if (await h.boundingBox()) { champ = h; break; }
    // Au téléphone, la recherche est un bouton qui ouvre le champ.
    if (!champ) {
      const zone = await page.evaluateHandle(() => [...document.querySelectorAll('*')].find(e => e.children.length === 0 && /^Rechercher un article/.test((e.textContent || e.getAttribute('placeholder') || '').trim()) && e.getClientRects().length));
      const el = zone.asElement();
      console.error(c.nom, 'zone', el ? await el.evaluate(e => e.outerHTML.slice(0, 200) + ' parent:' + e.parentElement.outerHTML.slice(0, 300)) : 'aucune');
      if (el) { await el.tap(); await sleep(400); await page.keyboard.type('Soude'); }
    }
    else { if (c.touch) await champ.tap(); else await champ.click(); await sleep(300); await page.keyboard.type('Soude'); }
    await sleep(600);
    await sleep(500);
    await sleep(300);
    const traces = await page.evaluate(() => [...document.querySelectorAll('[data-stock-trace]')].map(e => e.innerText));
    await page.screenshot({ path: path.join(OUT, `geste-${c.nom}-4-trace.png`) });
    bilan.push({ config: c.nom, q1, effet, annule, second, traces, erreurs });
    await page.close();
  }
  await browser.close();
  console.log(JSON.stringify(bilan, null, 1));
})().catch(e => { console.error('ECHEC', e.message); process.exit(1); });
