// w1 : le worker du build de PRODUCTION (dist/) démarre-t-il et répond-il dans Chrome ? Sert dist/ en HTTP (une page vide en plus, pas l'app : ses données réelles ne sont pas lues),
// crée le worker avec les mêmes options que l'app (clientWorker.ts : `new Worker(url, { type: 'module' })`), lui envoie un message « donnees » puis un calcul réel (`leviers`, `proposerRapide`).
// Usage (racine) : node <ce fichier> [--dist=dist]. Sortie attendue : « WORKER PROD OK ».
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import puppeteer from 'puppeteer-core';

const dist = path.resolve(process.argv.find((a) => a.startsWith('--dist='))?.slice(7) ?? 'dist');
const assets = path.join(dist, 'assets');
const fichiers = fs.readdirSync(assets);
const worker = fichiers.find((f) => /^calcul\.worker-.*\.js$/.test(f));
const etape = fichiers.find((f) => /^EtapeHoublons-.*\.js$/.test(f));
const echecs = [];
if (!worker) echecs.push('dist/assets ne contient aucun calcul.worker-*.js : Vite n\'a pas produit le worker');
if (!etape) echecs.push('dist/assets ne contient aucun EtapeHoublons-*.js');
if (worker && etape) {
  const src = fs.readFileSync(path.join(assets, etape), 'utf8');
  if (!src.includes(worker)) echecs.push(`le chunk ${etape} ne référence pas ${worker}`);
}
const TYPES = { '.js': 'text/javascript; charset=utf-8', '.json': 'application/json', '.css': 'text/css' };
const serveur = http.createServer((req, rep) => {
  const url = decodeURIComponent((req.url ?? '/').split('?')[0]);
  if (url === '/__w1.html') { rep.writeHead(200, { 'content-type': 'text/html' }); rep.end('<!doctype html><title>w1</title>'); return; }
  const f = path.join(dist, url);
  if (!f.startsWith(dist) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { rep.writeHead(404); rep.end(); return; }
  rep.writeHead(200, { 'content-type': TYPES[path.extname(f)] ?? 'application/octet-stream' }); rep.end(fs.readFileSync(f));
});
await new Promise((ok) => serveur.listen(0, '127.0.0.1', ok));
const port = serveur.address().port;
const browser = await puppeteer.launch({ executablePath: process.env.CHROME_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true, args: ['--host-resolver-rules=MAP * ~NOTFOUND, EXCLUDE localhost, EXCLUDE 127.0.0.1'] });
let sortie = null;
try {
  const page = await browser.newPage();
  const erreurs = [];
  page.on('pageerror', (e) => erreurs.push(String(e).slice(0, 200)));
  await page.goto(`http://127.0.0.1:${port}/__w1.html`);
  if (worker) {
    sortie = await page.evaluate((nom) => new Promise((ok) => {
      const t0 = performance.now();
      const w = new Worker(new URL(`/assets/${nom}`, location.href), { type: 'module' });
      w.onerror = (e) => ok({ erreur: `worker en erreur : ${e.message}` });
      const recette = { styleCode: '16D', volumeL: 20, og: 1.066, boilMin: 60, yeastId: 'fermentis-us05', ebc: 70, additions: [{ id: 'a1', hopKey: 'beermaverick-nugget', moment: 'b60', grams: 46 }] };
      const reponses = {};
      w.onmessage = (e) => {
        const m = e.data; reponses[m.id] = { type: m.type, nom: m.nom, ms: Math.round(performance.now() - t0), voies: m.valeur && m.valeur.voies ? m.valeur.voies.length : undefined, message: m.message };
        if (reponses[1] && reponses[2]) ok({ reponses });
      };
      w.postMessage({ type: 'donnees', donnees: {} });
      w.postMessage({ id: 1, type: 'calcul', nom: 'leviers', args: [recette, { floral: 1 }] });
      w.postMessage({ id: 2, type: 'prechauffer', nom: 'proposerRapide', args: [recette, { floral: 1 }] });
      setTimeout(() => ok({ erreur: 'aucune réponse en 60 s', reponses }), 60000);
    }), worker);
    if (sortie.erreur) echecs.push(sortie.erreur);
    else for (const [id, r] of Object.entries(sortie.reponses)) if (r.type !== 'resultat') echecs.push(`réponse ${id} : ${r.type} ${r.message ?? ''}`);
  }
  if (erreurs.length) echecs.push('erreurs de page : ' + erreurs.join(' ; '));
} finally {
  await browser.close();
  serveur.close();
}
const taille = worker ? fs.statSync(path.join(assets, worker)).size : null;
console.log(JSON.stringify({ dist: path.relative(process.cwd(), dist), worker, octets: taille, reponses: sortie?.reponses ?? null, echecs }));
console.log(echecs.length ? 'WORKER PROD ECHEC' : 'WORKER PROD OK');
process.exit(echecs.length ? 1 : 0);
