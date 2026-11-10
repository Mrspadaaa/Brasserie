// D381, banc hors ligne : passe chaque pièce piégée (jpg + masque) dans `harnais.html` (servi par Vite depuis la copie de banc) et compte, pour
// TOUTES les pièces : lignes coupées en silence (doit être 0), lignes coupées mais signalées, lignes perdues ou rognées par le recadrage (doit être 0).
// Usage : node controler.mjs <dossier construit par vite.banc.config.mjs> <dossier de pièces> [<rapport.json>] (aucun serveur : Chrome est servi par interception)
import fs from 'node:fs'; import path from 'node:path'; import { createRequire } from 'node:module';

const [construit, dossier, rapport = path.join(dossier, 'controle.json')] = process.argv.slice(2);
// Les CSP de production (firebase.json : la dernière règle qui correspond gagne, clé par clé), servies telles quelles : le banc refuse ce que l'app refuserait.
const regles = JSON.parse(fs.readFileSync(new URL('../../../../firebase.json', import.meta.url), 'utf8')).hosting.headers;
const motif = glob => {
  let r = '';
  for (let i = 0; i < glob.length; i++) {
    if (glob.startsWith('**/', i)) { r += '(?:.*/)?'; i += 2; }
    else if (glob.startsWith('**', i)) { r += '.*'; i += 1; }
    else if (glob[i] === '*') r += '[^/]*';
    else if (glob.startsWith('@(', i)) { const j = glob.indexOf(')', i); r += '(?:' + glob.slice(i + 2, j) + ')'; i = j; }
    else r += glob[i].replace(/[.+^${}()|[\]\\?]/g, '\\$&');
  }
  return new RegExp('^' + r + '$');
};
const csp = chemin => { let v = null; for (const r of regles) if (motif(r.source).test(chemin)) for (const h of r.headers) if (h.key === 'Content-Security-Policy') v = h.value; return v; };
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.wasm': 'application/wasm' };
const puppeteer = createRequire('C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie/package.json')('puppeteer-core');
const nav = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const page = await nav.newPage();
await page.setRequestInterception(true);
page.on('request', req => {
  const u = new URL(req.url());
  if (u.host !== 'banc.test') return req.abort();
  const f = path.join(construit, decodeURIComponent(u.pathname));
  if (!fs.existsSync(f)) return req.respond({ status: 404, body: '' });
  const politique = csp(decodeURIComponent(u.pathname));
  req.respond({ status: 200, contentType: TYPES[path.extname(f)] ?? 'application/octet-stream', headers: politique ? { 'Content-Security-Policy': politique } : {}, body: fs.readFileSync(f) });
});
await page.goto('http://banc.test/harnais.html', { waitUntil: 'networkidle0' });
await page.waitForFunction(() => window.__pret === true, { timeout: 60_000 });
const pieces = fs.readdirSync(dossier).filter(f => f.endsWith('.jpg')).map(f => f.slice(0, -4)).filter(n => fs.existsSync(path.join(dossier, `${n}.masque.png`)));
const lignes = [];
let silencieuses = 0, signalees = 0, perdues = 0, rognees = 0, sansDecoupe = 0;
for (const nom of pieces) {
  const photo = fs.readFileSync(path.join(dossier, `${nom}.jpg`)).toString('base64'), masque = fs.readFileSync(path.join(dossier, `${nom}.masque.png`)).toString('base64');
  const verite = fs.existsSync(path.join(dossier, `${nom}.verite.json`)) ? JSON.parse(fs.readFileSync(path.join(dossier, `${nom}.verite.json`), 'utf8')) : null;
  const r = await page.evaluate((a, b, v) => window.__controler(a, b, v), photo, masque, verite);
  lignes.push({ nom, ...r });
  if (r.rien) { sansDecoupe++; continue; }
  silencieuses += r.coupeesSilencieuses.length; signalees += r.coupeesSignalees; perdues += r.perdues.length; rognees += r.rognees.length;
  if (r.coupeesSilencieuses.length || r.perdues.length || r.rognees.length)
    console.log(`${nom} : ${r.morceaux} morceaux, angle ${r.angleGeo}, coupées en silence ${r.coupeesSilencieuses.map(x => `${x.ligne}@${x.coupe}`).join(' ') || 0}, perdues ${r.perdues.length}, rognées ${r.rognees.length}`);
}
fs.writeFileSync(rapport, JSON.stringify(lignes, null, 1));
const ms = lignes.filter(l => !l.rien).map(l => l.msPlan).sort((a, b) => a - b);
console.log(`${pieces.length} pièces : sans découpe ${sansDecoupe} ; lignes coupées en silence ${silencieuses} ; coupées signalées ${signalees} ; perdues ${perdues} ; rognées ${rognees} ; plan médian ${ms[Math.floor(ms.length / 2)] ?? '-'} ms, max ${ms.at(-1) ?? '-'} ms`);
console.log(silencieuses === 0 && perdues === 0 && rognees === 0 ? 'DÉCOUPE OK' : 'DÉCOUPE ÉCHEC');
// (c), 08.11 : les pièces que le déclencheur « avant » coupe encore (haute ET plus de LIGNES_ENTIERES lignes), et le bilan sur elles seules.
const coupees = lignes.filter(l => l.avant), somme = (f) => coupees.reduce((s, l) => s + f(l), 0);
console.log(`avant (sans force) : ${coupees.length}/${pieces.length} pièces coupées ; sur elles : silencieuses ${somme(l => l.coupeesSilencieuses.length)}, signalées ${somme(l => l.coupeesSignalees)}, perdues ${somme(l => l.perdues.length)}, rognées ${somme(l => l.rognees.length)} ; lues entières : ${pieces.length - coupees.length} (lignes estimées ${Math.min(...lignes.filter(l => !l.avant && l.lignesTexte).map(l => l.lignesTexte))} à ${Math.max(...lignes.filter(l => !l.avant && l.lignesTexte).map(l => l.lignesTexte))})`);
// (a), 08.11 : la bande de contrôle, lecteur parfait simulé.
const b = { justes: 0, faussesAlertes: 0, montantTranche: 0, doubleAttrape: 0, perteAttrapee: 0, sansMontantTranche: 0 };
for (const l of lignes) if (l.bande) for (const k of Object.keys(b)) b[k] += l.bande[k];
console.log(`bande (toutes coupes, lecteur parfait) : coupes justes ${b.justes}, fausses alertes ${b.faussesAlertes} ; lignes à montant tranchées ${b.montantTranche} : doublées attrapées ${b.doubleAttrape}, perdues attrapées ${b.perteAttrapee} ; lignes sans montant tranchées ${b.sansMontantTranche}`);
await nav.close();
