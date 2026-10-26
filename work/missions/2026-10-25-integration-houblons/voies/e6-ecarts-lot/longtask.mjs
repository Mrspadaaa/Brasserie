// e6 (point 3) : la préchauffe de Suggérer bloque-t-elle le fil principal de l'app ? Tâches longues (> 50 ms) et délai d'un toucher, dans Chrome, processeur ×4.
// Usage (racine) : node scripts/with_server.mjs --server "npm run dev -- --port 5293 --strictPort" --port 5293 --env VITE_HOP_V4=on -- node <ce fichier> --variante=avec [--cpu=4] [--essais=3]
//   --variante=avec  : la préchauffe telle qu'elle est (`prechauffe.ts`), son appel chronométré par le script (module servi modifié à la volée, aucun fichier écrit) ;
//   --variante=sans  : la même page, l'appel de préchauffe retiré (témoin : les tâches longues restantes ne viennent pas de lui).
// Méthode : le repos du navigateur (requestIdleCallback) est tenu jusqu'à ce que l'étape Houblons soit affichée ; le processeur passe alors à ×4, des touchers neutres
// (pointerdown arrêté en capture) partent toutes les 25 ms, puis le repos est libéré : tout ce qui attendait un repos (préchauffe, chargement des ajouts, compléments) tourne sous ×4.
// Le délai d'un toucher = (heure où le gestionnaire s'exécute) − (heure de l'événement) : ce que le doigt attend. Tâche longue = PerformanceObserver « longtask » (> 50 ms).
// Aucune donnée réelle : requêtes hors de cette machine coupées, stockage du banc local.
import fs from 'node:fs';
import path from 'node:path';
import puppeteer from 'puppeteer-core';

const arg = (n, d) => process.argv.find((a) => a.startsWith(`--${n}=`))?.slice(n.length + 3) ?? d;
const variante = arg('variante', 'avec');
const cpu = Number(arg('cpu', '4'));
const essais = Number(arg('essais', '3'));
const sortie = path.resolve(arg('sortie', path.join(import.meta.dirname, 'longtask')));
fs.mkdirSync(sortie, { recursive: true });
const port = (process.env.WITH_SERVER_PORTS ?? '5293').split(',')[0];
const LOCAL = /^(https?|ws)s?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d+)?(\/|$)/i;
const CHROME = process.env.CHROME_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe';
// Vite sert le module transformé par esbuild : guillemets doubles.
const APPEL = 'void calcul().prechauffer("proposerRapide", recette, { ...DIRECTION_DE_CHAUFFE });';
const attendre = (ms) => new Promise((r) => setTimeout(r, ms));
const mediane = (xs) => { const s = [...xs].sort((a, b) => a - b); return s.length ? (s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2) : null; };

const un = async (n) => {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: true });
  const page = await browser.newPage();
  const echecs = [];
  try {
    await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    page.setDefaultNavigationTimeout(180000);
    await page.setRequestInterception(true);
    page.on('request', async (r) => {
      const u = r.url();
      if (/^(data|blob|about|file):/i.test(u)) return r.continue();
      if (!LOCAL.test(u)) return r.abort('blockedbyclient');
      if (/\/suggerer\/prechauffe\.ts(\?|$)/.test(u)) {
        const texte = await (await fetch(u)).text();
        if (!texte.includes(APPEL)) { echecs.push('appel de préchauffe introuvable dans prechauffe.ts'); return r.continue(); }
        const par = variante === 'sans' ? 'window.__chauffe = { sans: true };'
          : 'const d = performance.now(); const p = calcul().prechauffer(\'proposerRapide\', recette, { ...DIRECTION_DE_CHAUFFE }); window.__chauffe = { debut: d, appelMs: performance.now() - d, fin: performance.now() }; void p;';
        return r.respond({ status: 200, contentType: 'text/javascript; charset=utf-8', body: texte.split(APPEL).join(`{ ${par} }`) });
      }
      return r.continue();
    });
    await page.evaluateOnNewDocument(() => {
      const natif = window.requestIdleCallback?.bind(window);
      window.__tenir = true; window.__file = []; window.__lt = []; window.__touchers = [];
      window.requestIdleCallback = (f, o) => { if (window.__tenir) { window.__file.push(f); return window.__file.length; } return natif ? natif(f, o) : window.setTimeout(f, 1); };
      window.__relacher = () => { window.__tenir = false; const q = window.__file.splice(0); q.forEach((f) => f()); return q.length; };
      try { new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__lt.push({ debut: e.startTime, ms: e.duration }); }).observe({ type: 'longtask', buffered: true }); } catch { /* pas de longtask */ }
      const note = (e) => { window.__touchers.push({ delai: performance.now() - e.timeStamp, t: performance.now() }); e.stopImmediatePropagation(); e.preventDefault(); };
      window.addEventListener('pointerdown', note, true);
      for (const t of ['pointerup', 'click', 'touchstart', 'touchend', 'mousedown', 'mouseup']) window.addEventListener(t, (e) => { e.stopImmediatePropagation(); }, true);
    });
    await page.goto(`http://localhost:${port}/?dev-local&etape=houblons`, { waitUntil: 'networkidle0' });
    await page.waitForSelector('[data-hop-v4-etape="houblons"]', { timeout: 180000 });
    await attendre(1500);
    const enAttente = await page.evaluate(() => window.__file.length);
    const cdp = await page.createCDPSession();
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: cpu });
    const t0 = await page.evaluate(() => { window.__lt.length = 0; window.__touchers.length = 0; return performance.now(); });
    let continuer = true;
    const doigt = (async () => { while (continuer) { await page.touchscreen.tap(195, 420).catch(() => {}); await attendre(25); } })();
    await attendre(300);
    const liberees = await page.evaluate(() => window.__relacher());
    const finChauffe = await page.waitForFunction(() => window.__chauffe && (window.__chauffe.sans || window.__chauffe.fin), { timeout: 60000 }).then(() => true).catch(() => false);
    await attendre(2500); // le reste du repos : chargement des ajouts, compléments
    continuer = false; await doigt;
    const r = await page.evaluate((t) => ({
      chauffe: window.__chauffe ?? null,
      lt: window.__lt.map((x) => ({ debut: Math.round(x.debut - t), ms: Math.round(x.ms) })).filter((x) => x.debut >= -5),
      touchers: window.__touchers.map((x) => ({ t: Math.round(x.t - t), delai: Math.round(x.delai) })),
    }), t0);
    const chauffe = r.chauffe && r.chauffe.debut !== undefined ? { debut: Math.round(r.chauffe.debut - t0), appelMs: Math.round(r.chauffe.appelMs) } : r.chauffe;
    const delais = r.touchers.map((x) => x.delai);
    const longues = r.lt.filter((x) => x.ms > 50);
    const sortieEssai = { essai: n, variante, cpu, enAttente, liberees, finChauffe, chauffe, tachesLongues: longues, plusLongue: longues.reduce((m, x) => Math.max(m, x.ms), 0),
      touchers: { n: delais.length, mediane: mediane(delais), max: delais.length ? Math.max(...delais) : null, au_dessus_de_50: delais.filter((d) => d > 50).length, au_dessus_de_100: delais.filter((d) => d > 100).length }, echecs };
    return sortieEssai;
  } finally {
    await browser.close();
  }
};

const rapport = [];
for (let i = 1; i <= essais; i++) {
  const r = await un(i);
  rapport.push(r);
  console.log(`essai ${i} (${variante}, ×${cpu}) : préchauffe ${r.chauffe ? JSON.stringify(r.chauffe) : 'non vue'} · tâches longues ${JSON.stringify(r.tachesLongues.map((x) => `${x.debut}+${x.ms}`))} · toucher : médiane ${r.touchers.mediane} ms, max ${r.touchers.max} ms, > 50 ms ${r.touchers.au_dessus_de_50}/${r.touchers.n}, > 100 ms ${r.touchers.au_dessus_de_100}/${r.touchers.n}${r.echecs.length ? ' · ECHEC ' + r.echecs.join(' ; ') : ''}`);
}
fs.writeFileSync(path.join(sortie, `${variante}-x${cpu}.json`), JSON.stringify(rapport, null, 1));
console.log(rapport.some((r) => r.echecs.length) ? 'LONGTASK ECHEC' : 'LONGTASK OK');
