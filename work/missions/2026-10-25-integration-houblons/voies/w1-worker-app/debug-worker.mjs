// w1 : sonde de diagnostic du worker de l'app en développement (console, erreurs, état de la préchauffe réécrite comme dans mesure-w1.mjs). Usage comme mesure-w1.mjs.
import puppeteer from 'puppeteer-core';
const port = (process.env.WITH_SERVER_PORTS ?? '5293').split(',')[0];
const CHROME = process.env.CHROME_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const APPEL = 'void calcul().prechauffer("proposerRapide", recette, { ...DIRECTION_DE_CHAUFFE });';
const cpu = Number(process.argv.find((a) => a.startsWith('--cpu='))?.slice(6) ?? '1');
const browser = await puppeteer.launch({ executablePath: CHROME, headless: true });
const page = await browser.newPage();
await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
page.on('console', (m) => { if (!/vite|DevTools|apple-mobile|Firebase|AppCheck/.test(m.text())) console.log('console', m.type(), m.text().slice(0, 300)); });
page.on('pageerror', (e) => console.log('pageerror', String(e).slice(0, 300)));
page.on('workercreated', (w) => { console.log('workercreated', w.url()); w.on?.('console', (m) => console.log('  [worker console]', m.text().slice(0, 300))); });
page.on('requestfailed', (r) => console.log('requestfailed', r.url(), r.failure()?.errorText));
await page.evaluateOnNewDocument(() => {
  window.__w = [];
  const Natif = window.Worker;
  const t0 = performance.now();
  window.Worker = class extends Natif {
    constructor(...a) {
      super(...a);
      window.__w.push(`${Math.round(performance.now() - t0)} création`);
      this.addEventListener('message', (e) => window.__w.push(`${Math.round(performance.now() - t0)} reçu ${JSON.stringify(e.data).slice(0, 80)}`));
      this.addEventListener('error', (e) => window.__w.push(`${Math.round(performance.now() - t0)} ERREUR ${e.message}`));
      this.addEventListener('messageerror', () => window.__w.push('messageerror'));
    }
    postMessage(m, ...r) { window.__w.push(`${Math.round(performance.now() - t0)} envoi ${m?.type}${m?.nom ? ':' + m.nom : ''} id=${m?.id}`); return super.postMessage(m, ...r); }
  };
});
if (!process.argv.includes('--libre')) await page.setRequestInterception(true);   // --libre : aucune interception de requêtes (la préchauffe n'est alors pas réécrite)
page.on('request', async (r) => {
  if (process.argv.includes('--libre')) return;
  const u = r.url();
  if (/\/suggerer\/prechauffe\.ts(\?|$)/.test(u)) {
    const texte = await (await fetch(u)).text();
    const par = 'const d = performance.now(); const p = calcul().prechauffer("proposerRapide", recette, { ...DIRECTION_DE_CHAUFFE }); window.__chauffe = { debut: d, appelMs: performance.now() - d }; p.then(() => { window.__chauffe.resoluMs = performance.now() - d; }, (e) => { window.__chauffe.erreur = String(e); });';
    return r.respond({ status: 200, contentType: 'text/javascript; charset=utf-8', body: texte.split(APPEL).join(`{ ${par} }`) });
  }
  return r.continue();
});
await page.goto(`http://localhost:${port}/?dev-local&etape=houblons`, { waitUntil: 'networkidle0', timeout: 120000 });
await page.waitForSelector('[data-hop-v4-etape="houblons"]', { timeout: 120000 });
if (cpu > 1) await (await page.createCDPSession()).send('Emulation.setCPUThrottlingRate', { rate: cpu });
for (let i = 0; i < 12; i++) {
  await new Promise((r) => setTimeout(r, 2500));
  console.log(`t+${(i + 1) * 2.5}s`, JSON.stringify(await page.evaluate(() => window.__chauffe ?? null)));
}
console.log((await page.evaluate(() => window.__w)).join('\n'));
for (const w of process.argv.includes('--direct') ? page.workers() : []) {
  const rep = await w.evaluate(() => new Promise((ok) => {
    const vieux = self.postMessage.bind(self);
    self.postMessage = (m) => { try { vieux(m); ok('posté ' + JSON.stringify(m).slice(0, 120)); } catch (e) { ok('ECHEC postMessage : ' + e.name + ' ' + e.message); } };
    const recette = { styleCode: '16D', volumeL: 20, og: 1.066, boilMin: 60, yeastId: 'fermentis-us05', ebc: 70, additions: [{ id: 'a1', hopKey: 'beermaverick-nugget', moment: 'b60', grams: 46 }] };
    try { self.onmessage({ data: { id: 5, type: 'prechauffer', nom: 'proposerRapide', args: [recette, { floral: 1 }] } }); } catch (e) { ok('EXCEPTION ' + e.name + ' ' + e.message); }
    setTimeout(() => ok('pas de réponse en 60 s'), 60000);
  }));
  console.log('direct dans le worker :', rep);
}
await browser.close();
