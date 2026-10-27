// t2 (D120) : le worker du build de PRODUCTION reçoit-il la table de typicité dans le message `donnees` et la lit-il ? Même serveur et même worker que w1/fumee-worker-prod.mjs.
// Deux workers : A sans table (typicité inconnue : ordre de k3k1, les achats de S1 commencent par Loral), B avec la table envoyée dans le message `donnees` (East Kent Goldings d'abord).
// Usage (racine) : node <ce fichier> --dist=<dossier du build>. Sortie attendue : « TYPICITE WORKER OK ».
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import puppeteer from 'puppeteer-core';

const dist = path.resolve(process.argv.find((a) => a.startsWith('--dist='))?.slice(7) ?? 'dist');
const assets = path.join(dist, 'assets');
const worker = fs.readdirSync(assets).find((f) => /^calcul\.worker-.*\.js$/.test(f));
const table = JSON.parse(fs.readFileSync(path.resolve('src/data/hopV4/typicite-styles.json'), 'utf8'));
const echecs = [];
const TYPES = { '.js': 'text/javascript; charset=utf-8', '.json': 'application/json', '.css': 'text/css' };
const serveur = http.createServer((req, rep) => {
  const url = decodeURIComponent((req.url ?? '/').split('?')[0]);
  if (url === '/__t2.html') { rep.writeHead(200, { 'content-type': 'text/html' }); rep.end('<!doctype html><title>t2</title>'); return; }
  const f = path.join(dist, url);
  if (!f.startsWith(dist) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { rep.writeHead(404); rep.end(); return; }
  rep.writeHead(200, { 'content-type': TYPES[path.extname(f)] ?? 'application/octet-stream' }); rep.end(fs.readFileSync(f));
});
await new Promise((ok) => serveur.listen(0, '127.0.0.1', ok));
const port = serveur.address().port;
const browser = await puppeteer.launch({ executablePath: process.env.CHROME_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
let achats = null;
try {
  const page = await browser.newPage();
  const erreurs = [];
  page.on('pageerror', (e) => erreurs.push(String(e).slice(0, 200)));
  await page.goto(`http://127.0.0.1:${port}/__t2.html`);
  achats = await page.evaluate((nom, t) => {
    const recette = { styleCode: '16D', volumeL: 20, og: 1.066, boilMin: 60, yeastId: 'fermentis-us05', ebc: 70, additions: [{ id: 'a1', hopKey: 'beermaverick-nugget', moment: 'b60', grams: 46 }] };
    const lancer = (donnees) => new Promise((ok) => {
      const w = new Worker(new URL(`/assets/${nom}`, location.href), { type: 'module' });
      w.onerror = (e) => ok({ erreur: `worker en erreur : ${e.message}` });
      w.onmessage = (e) => {
        const m = e.data;
        if (m.type === 'panne') { ok({ erreur: `panne : ${m.message}` }); return; }
        if (m.id !== 1) return;
        if (m.type !== 'resultat') { ok({ erreur: `${m.type} ${m.message ?? ''}` }); return; }
        ok({ achats: m.valeur.voies.filter((v) => v.stock && v.stock.status === 'à acheter').slice(0, 4).map((v) => v.label) });
      };
      w.postMessage({ type: 'donnees', donnees });
      w.postMessage({ id: 1, type: 'prechauffer', nom: 'proposerRapide', args: [recette, { floral: 1, resin: -1 }] });
      setTimeout(() => ok({ erreur: 'aucune réponse en 60 s' }), 60000);
    });
    return Promise.all([lancer({}), lancer({ typicite: t })]).then(([sans, avec]) => ({ sans, avec }));
  }, worker, table);
  if (erreurs.length) echecs.push('erreurs de page : ' + erreurs.join(' ; '));
} finally {
  await browser.close();
  serveur.close();
}
if (!worker) echecs.push('aucun calcul.worker-*.js dans le build');
else if (achats.sans.erreur || achats.avec.erreur) echecs.push(achats.sans.erreur ?? achats.avec.erreur);
else {
  if (!/^Ajouter Loral/.test(achats.sans.achats[0] ?? '')) echecs.push(`sans table, le premier achat devrait être Loral : ${achats.sans.achats[0]}`);
  if (!/^Ajouter East Kent Goldings/.test(achats.avec.achats[0] ?? '')) echecs.push(`avec la table, le premier achat devrait être East Kent Goldings : ${achats.avec.achats[0]}`);
}
console.log(JSON.stringify({ worker, achats, echecs }));
console.log(echecs.length ? 'TYPICITE WORKER ECHEC' : 'TYPICITE WORKER OK');
process.exit(echecs.length ? 1 : 0);
