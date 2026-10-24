// Joue la maquette dans Chrome au format téléphone (390 × 844, échelle 2, tactile), sur les pages construites.
// Usage (depuis la racine du dépôt) :
//   node prototypes/houblons-v4/parcours/outils/jouer-parcours.mjs --routes            → ROUTES OK (7/7)
//   node prototypes/houblons-v4/parcours/outils/jouer-parcours.mjs --ponts             → PONTS OK (n gestes, recalcul médian x ms)
//   node prototypes/houblons-v4/parcours/outils/jouer-parcours.mjs --etape=<écran>     → ETAPE OK (<écran>)
// Options : --dossier=<dossier> (pages construites ; défaut prototypes/houblons-v4/maquettes/parcours),
//           --captures <dossier> (une capture par geste, nommée par étape).
// L'état se lit dans window.__parcours (maquette seulement). Un écran sous un autre est inerte (PageShell) :
// chaque cible est cherchée parmi les éléments visibles et hors [inert].
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ici = path.dirname(fileURLToPath(import.meta.url));
const parcours = path.resolve(ici, '..');
const depot = path.resolve(parcours, '..', '..', '..');
const require = createRequire(path.join(depot, 'package.json'));
const puppeteer = require('puppeteer-core');
const CHROME = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
import { ROUTES } from './routes-pages.mjs';

const argv = process.argv.slice(2);
const opt = (nom) => {
  const egal = argv.find((a) => a.startsWith(`--${nom}=`));
  if (egal) return egal.slice(nom.length + 3);
  const i = argv.indexOf(`--${nom}`);
  return i >= 0 && argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : i >= 0 ? true : null;
};
const dossier = path.resolve(depot, typeof opt('dossier') === 'string' ? opt('dossier') : 'prototypes/houblons-v4/maquettes/parcours');
const capturesDir = typeof opt('captures') === 'string' ? path.resolve(depot, opt('captures')) : null;
const etapes = argv.filter((a) => a.startsWith('--etape=')).map((a) => a.slice('--etape='.length)).filter(Boolean);
const mode = opt('routes') ? 'routes' : opt('ponts') ? 'ponts' : etapes.length ? 'etape' : null;
if (!mode) { console.log('JOUER ECHEC : --routes, --ponts ou --etape=<écran>'); process.exit(1); }
if (!fs.existsSync(path.join(dossier, 'index.html'))) { console.log(`JOUER ECHEC : ${path.relative(depot, dossier)}/index.html absent (lancer construire.mjs)`); process.exit(1); }
if (capturesDir) fs.mkdirSync(capturesDir, { recursive: true });
const url = (p) => pathToFileURL(path.join(dossier, p)).href;

// ---------- Chrome ----------
const nav = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--disable-gpu'] });
let page, erreurs = [], nCapture = 0;
async function ouvrir(p) {
  page = await nav.newPage();
  erreurs = [];
  page.on('pageerror', (e) => erreurs.push(`erreur de page : ${e.message}`));
  page.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource|fonts\.g/.test(m.text())) erreurs.push(`console : ${m.text()}`); });
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await page.goto(url(p), { waitUntil: 'load' });
}
const pause = (ms) => new Promise((r) => setTimeout(r, ms));
const calme = () => page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => r()))));
async function capturer(nom) {
  if (!capturesDir) return;
  nCapture += 1;
  await page.screenshot({ path: path.join(capturesDir, `${String(nCapture).padStart(2, '0')}-${nom}.png`) });
}
/** L'élément visible, hors [inert], qui répond au sélecteur (le dernier : l'écran du dessus). */
async function cible(sel, delai = 4000) {
  const fin = Date.now() + delai;
  while (Date.now() < fin) {
    const h = await page.evaluateHandle((s) => {
      const vis = (el) => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 && !el.closest('[inert], [hidden]'); };
      return [...document.querySelectorAll(s)].filter(vis).at(-1) ?? null;
    }, sel);
    if (await h.evaluate((x) => x !== null)) return h.asElement();
    await pause(50);
  }
  throw new Error(`cible introuvable : ${sel}`);
}
const lire = (fn, ...a) => page.evaluate(fn, ...a);
/** Fonction d'un jeu.mjs, jouée dans la page avec window.__parcours (sérialisée : pas de variable du module). */
const jouerDansPage = (fn) => page.evaluate((src) => (0, eval)('(' + src + ')')(window.__parcours), fn.toString());
const etat = () => lire(() => JSON.parse(JSON.stringify(window.__parcours.etat)));
const hash = () => lire(() => location.hash);
async function attendreEcran(ecran) { await cible(`[data-ecran="${ecran}"]`); await calme(); }
async function toucher(sel) { const el = await cible(sel); await el.click(); await calme(); }
async function appuiLong(sel, ms = 650) {
  const el = await cible(sel);
  await el.scrollIntoView();
  const b = await el.boundingBox();
  await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2);
  await page.mouse.down(); await pause(ms); await page.mouse.up(); await calme();
}
/** Glisse le doigt sur la cible, de la fraction `de` à la fraction `a` de sa largeur ; `pendant(i)` s'appelle doigt posé. */
async function glisser(sel, de, a, { pas = 12, pendant } = {}) {
  const el = await cible(sel);
  await el.scrollIntoView();
  const b = await el.boundingBox();
  const y = b.y + b.height / 2, x = (f) => b.x + b.width * f;
  await page.mouse.move(x(de), y); await page.mouse.down();
  for (let i = 1; i <= pas; i++) { await page.mouse.move(x(de + ((a - de) * i) / pas), y); await pause(16); }
  const mesure = pendant ? await pendant() : null;
  await page.mouse.up(); await calme();
  return mesure;
}
async function retourTelephone() { await lire(() => history.back()); await pause(120); await calme(); }
// La croix des outils (D109) ; elle ramène toujours à l'étape Houblons (D118).
async function retourOutil() { await toucher('[data-role="retour"]'); await pause(120); await calme(); }
async function debordement() {
  return lire(() => {
    const d = document.documentElement;
    const zones = [d, ...document.querySelectorAll('[data-page-shell] main')];
    return zones.filter((z) => z.scrollWidth > z.clientWidth + 1).map((z) => `${z.tagName.toLowerCase()} ${z.scrollWidth}>${z.clientWidth}`);
  });
}
async function fin(code, ligne) { console.log(ligne); await nav.close(); process.exit(code); }

// ---------- --routes ----------
async function routes() {
  const ok = [];
  for (const r of ROUTES) {
    await ouvrir(`${r}/etat.html`);
    try { await attendreEcran(r); } catch (e) { erreurs.push(e.message); }
    await pause(150);
    const deb = await debordement();
    if (deb.length) erreurs.push(`défilement horizontal : ${deb.join(', ')}`);
    await capturer(`route-${r}`);
    if (erreurs.length) console.log(`${r} : ${erreurs.join(' ; ')}`); else ok.push(r);
    await page.close();
  }
  return fin(ok.length === ROUTES.length ? 0 : 1, `${ok.length === ROUTES.length ? 'ROUTES OK' : 'ROUTES ECHEC'} (${ok.length}/${ROUTES.length})`);
}

// ---------- --ponts ----------
async function ponts() {
  let n = 0;
  const verifier = (cond, message) => { if (!cond) throw new Error(message); };
  const parGeste = [];
  const geste = async (nom, fn) => {
    const k = await lire(() => window.__parcours.mesures().length);
    await fn(); n += 1;
    const ms = await lire((i) => window.__parcours.mesures().slice(i).filter((m) => !m.cache && m.nom === 'lireBiere').reduce((s, m) => s + m.ms, 0), k);
    if (ms > 0) parGeste.push(ms);
    if (erreurs.length) throw new Error(`${nom} : ${erreurs.join(' ; ')}`);
    await capturer(nom);
  };
  const ibuRendu = () => lire(() => Number(document.querySelector('[data-ecran="ma-biere"] [data-role="ibu"]')?.getAttribute('data-valeur')));
  const ibuMoteur = () => lire(() => window.__parcours.biere().ibu.valeur);
  const coherent = async (quoi) => { const [r, m] = [await ibuRendu(), await ibuMoteur()]; verifier(Math.abs(r - m) < 0.01, `${quoi} : IBU affiché ${r} ≠ moteur ${m}`); return m; };

  await ouvrir('index.html');
  await attendreEcran('ma-biere');
  await lire(() => window.__parcours.viderMesures());
  const depart = await etat();
  const ibu0 = await coherent('départ');
  verifier(Math.round(ibu0) === 60, `IBU de départ ${ibu0} (attendu 60, biere.html)`);
  await capturer('ma-biere-depart');

  // 1. Appui long sur Nugget → fiche ; retour du téléphone → Ma bière.
  await geste('fiche-appui-long', async () => { await appuiLong('[data-role="ouvrir-fiche"][data-houblon="beermaverick-nugget"]'); await attendreEcran('fiche'); });
  verifier((await hash()) === '#/fiche/nugget', `route de la fiche : ${await hash()}`);
  await geste('fiche-retour', async () => { await retourTelephone(); });
  verifier((await hash()) === '#/ma-biere', `après retour : ${await hash()}`);

  // 2. + floral → Suggérer (q2b : Motueka et Nelson Sauvin proposés) → « Comparer (2) » → Comparer (r6a) → « + » :
  // Idaho 7, un houblon de sa question (« Lequel pour ma stout : Cascade, Idaho 7 ou Galaxy ? », 20.10) → Placer Idaho 7.
  // DÉCISION r7 : ni q2b ni r6a ne changent ; Idaho 7 entre par la colonne « + » de Comparer (voies/r7-batterie/RESULTAT.md).
  await geste('suggerer', async () => { await toucher('[data-role="pont-floral"]'); await attendreEcran('suggerer'); });
  await geste('comparer', async () => { await toucher('[data-role="pont-comparer"]'); await attendreEcran('comparer'); });
  const h = await hash();
  verifier(/^#\/comparer\?h=/.test(h) && h.includes('motueka') && h.includes('nelson-sauvin'), `Comparer sans les houblons cochés dans Suggérer : ${h}`);
  await geste('comparer-plus-idaho-7', async () => { await toucher('[data-role="ajouter-colonne"]'); await toucher('[data-ajouter="beermaverick-idaho-7"]'); });
  verifier(await lire(() => document.querySelector('[role="radio"][data-col="beermaverick-idaho-7"]')?.getAttribute('aria-checked') === 'true'), 'Comparer sans Idaho 7 retenu après « + »');
  verifier(/Placer Idaho 7/.test(await lire(() => document.querySelector('[data-role="pont-placer"]')?.textContent ?? '')), 'le dock ne dit pas « Placer Idaho 7 »');
  await geste('dryhopper', async () => { await toucher('[data-role="pont-placer"]'); await attendreEcran('dryhopper'); });
  let e = await etat();
  verifier(e.brouillon && e.brouillon.outil === 'dryhopper', 'Dryhopper sans brouillon');
  const idI7 = e.brouillon.ajoutId;
  verifier(/^idaho-7-\d+$/.test(idI7), `Placer n'a pas placé Idaho 7 (${idI7})`);
  verifier(JSON.stringify(e.recette) === JSON.stringify(depart.recette), 'la recette a changé avant « Ajouter à ma bière »');

  // 3. Le moment glissé : vers l'ébullition (l'IBU de l'ajout apparaît), puis vers le dry hop.
  await geste('dryhopper-glisser-ebullition', async () => { await glisser('[data-role="frise"]', 0.5, 0.2); });
  e = await etat();
  const aEb = e.brouillon.recette.additions.find((a) => a.id === idI7);
  verifier(aEb.moment.startsWith('b') && aEb.minutes % 5 === 0, `glisser vers l'ébullition : moment ${aEb.moment} ${aEb.minutes}′`);
  const ibuEb = await lire((id) => window.__parcours.brouillonLu().ibuParAjout[id].ibu?.valeur ?? null, idI7);
  verifier(ibuEb > 0, `IBU de l'ajout à ${aEb.minutes}′ non calculé (${ibuEb})`);
  await geste('dryhopper-glisser-dryhop', async () => { await glisser('[data-role="frise"]', 0.2, 0.62); });
  e = await etat();
  const choisi = e.brouillon.recette.additions.find((a) => a.id === idI7);
  verifier(choisi.moment === 'dryActive' || choisi.moment === 'dryPost', `glisser vers le dry hop : ${choisi.moment}`);

  // Puis la levure → Pomona → Ajouter à ma bière.
  await geste('levure', async () => { await toucher('[data-role="pont-levure"]'); await attendreEcran('levure'); });
  verifier((await etat()).brouillon?.ajoutId === idI7, 'le brouillon n’a pas suivi vers Levure');
  await geste('levure-pomona', async () => {
    const el = await page.evaluateHandle(() => [...document.querySelectorAll('[data-ecran="levure"] [data-role="levures"] [role="radio"], [data-ecran="levure"] [data-levure]')].find((b) => /Pomona/.test(b.textContent ?? '')) ?? null);
    verifier(await el.evaluate((x) => x !== null), 'choix Pomona introuvable');
    await el.asElement().click(); await calme();
  });
  verifier((await etat()).brouillon.recette.yeastId === 'lalbrew-pomona', 'Pomona non choisie dans le brouillon');
  await geste('ajouter-a-ma-biere', async () => { await toucher('[data-role="pont-ajouter"]'); await attendreEcran('ma-biere'); await pause(150); });
  e = await etat();
  verifier((await hash()) === '#/ma-biere', `après Ajouter : ${await hash()}`);
  verifier(e.brouillon === null, 'brouillon resté ouvert après Ajouter');
  const inscrit = e.recette.additions.find((a) => a.id === idI7);
  verifier(inscrit && inscrit.hopKey === 'beermaverick-idaho-7' && inscrit.moment === choisi.moment && inscrit.jours === choisi.jours, `Idaho 7 non inscrit au moment choisi (${JSON.stringify(inscrit)})`);
  verifier(e.recette.yeastId === 'lalbrew-pomona', `levure de la recette : ${e.recette.yeastId}`);
  await coherent('après Ajouter');
  verifier(await lire((id) => !!document.querySelector(`[data-ecran="ma-biere"] [data-ajout="${id}"]`), idI7), 'la ligne Idaho 7 n’apparaît pas dans Ma bière');
  const floral = await lire(() => window.__parcours.biere().profil.floral.valeur?.centre ?? null);
  const floral0 = await lire((r) => window.__parcours.moteur.lireBiere(r).profil.floral.valeur?.centre ?? null, depart.recette);
  verifier(floral != null && floral0 != null && floral > floral0, `floral non recalculé (${floral0} → ${floral})`);

  // 5. Nugget → Substituer → Remplacer → Ma bière recalculée, à IBU égal.
  const ibuAvant = await ibuMoteur();
  await geste('substituer', async () => { await toucher('[data-role="pont-substituer"][data-houblon="beermaverick-nugget"], [data-ajout="a1"] [data-role="pont-substituer"]'); await attendreEcran('substituer'); });
  await geste('remplacer', async () => { await toucher('[data-role="pont-remplacer"]'); await attendreEcran('ma-biere'); await pause(150); });
  e = await etat();
  const a1 = e.recette.additions.find((a) => a.id === 'a1');
  verifier(a1 && a1.hopKey !== 'beermaverick-nugget', 'Nugget non remplacé');
  const ibuApres = await coherent('après Remplacer');
  verifier(Math.abs(ibuApres - ibuAvant) <= 1.5, `remplacement hors IBU égal : ${ibuAvant.toFixed(1)} → ${ibuApres.toFixed(1)}`);

  // La croix abandonne un brouillon : Placer → Dryhopper → glisser → croix → étape Houblons (D118) ; la recette reste intacte.
  const avantAbandon = JSON.stringify(e.recette);
  await geste('abandon-suggerer', async () => { await toucher('[data-role="pont-floral"]'); await attendreEcran('suggerer'); });
  await geste('abandon-comparer', async () => { await toucher('[data-role="pont-comparer"]'); await attendreEcran('comparer'); });
  await geste('abandon-dryhopper', async () => { await toucher('[data-role="pont-placer"]'); await attendreEcran('dryhopper'); });
  await geste('abandon-glisser', async () => { await glisser('[data-role="frise"]', 0.6, 0.3); });
  verifier((await etat()).brouillon !== null, 'pas de brouillon dans Dryhopper');
  await geste('abandon-retour', async () => { await retourOutil(); await attendreEcran('ma-biere'); });
  e = await etat();
  verifier(e.brouillon === null, '« ‹ » n’a pas abandonné le brouillon');
  verifier(JSON.stringify(e.recette) === avantAbandon, '« ‹ » a changé la recette');
  verifier((await hash()) === '#/ma-biere', `la croix ne ramène pas à l’étape Houblons (D118) : ${await hash()}`);

  // Un recalcul = Ma bière recalculée par le moteur pour un état neuf de la recette (lireBiere, cache manqué).
  const med = await lire(() => window.__parcours.medianeRecalcul('lireBiere'));
  const nb = await lire(() => window.__parcours.mesures().filter((m) => !m.cache && m.nom === 'lireBiere').length);
  const tri = [...parGeste].sort((a, b) => a - b), medGeste = tri.length ? tri[Math.floor(tri.length / 2)] : null;
  const max = tri.length ? tri.at(-1) : null;
  const ms = (x) => (x == null ? '?' : x.toFixed(1).replace('.', ','));
  console.log(`recalculs : ${nb} ; gestes qui recalculent : ${tri.length}, médiane ${ms(medGeste)} ms, max ${ms(max)} ms par geste`);
  if (erreurs.length) throw new Error(erreurs.join(' ; '));
  return fin(0, `PONTS OK (${n} gestes, recalcul médian ${ms(med)} ms)`);
}

// ---------- --etape=<écran> ----------
async function etape(ecran) {
  const f = path.join(parcours, 'src', 'ecrans', ecran, 'jeu.mjs');
  if (!fs.existsSync(f)) return { ok: false, ligne: `ETAPE ECHEC (${ecran}) : ${path.relative(depot, f)} absent` };
  const jeu = (await import(pathToFileURL(f).href)).default;
  await ouvrir(`${ecran}/${jeu.page ?? 'etat.html'}`);
  await attendreEcran(ecran);
  let i = 0;
  for (const g of jeu.gestes) {
    i += 1;
    const nom = g.nom ?? `geste ${i}`;
    try {
      let mesure = null;
      switch (g.faire) {
        case 'toucher': await toucher(g.cible); break;
        case 'appui-long': await appuiLong(g.cible, g.ms); break;
        case 'glisser': await glisser(g.cible, g.de ?? 0.5, g.a ?? 0.5, { pas: g.pas }); break;
        // Doigt maintenu : posé, déplacé, puis g.mesurer(window.__parcours) lit les positions rendues (true ou un message), puis relâché.
        case 'maintenir': mesure = await glisser(g.cible, g.de ?? 0.5, g.a ?? 0.5, { pas: g.pas, pendant: g.mesurer ? () => jouerDansPage(g.mesurer) : undefined }); break;
        case 'retour': await retourTelephone(); break;
        case 'fermer': await retourOutil(); break;
        case 'attendre': break;
        default: throw new Error(`geste inconnu : ${g.faire}`);
      }
      if (g.attendre) await cible(g.attendre);
      if (mesure != null && mesure !== true) throw new Error(`mesure doigt posé : ${typeof mesure === 'string' ? mesure : JSON.stringify(mesure)}`);
      if (g.verifier) {
        const r = await jouerDansPage(g.verifier);
        if (r !== true) throw new Error(`vérification : ${r === false ? 'faux' : r}`);
      }
      if (erreurs.length) throw new Error(erreurs.join(' ; '));
      await capturer(`${ecran}-${nom.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}`);
    } catch (e) {
      await page.close();
      return { ok: false, ligne: `ETAPE ECHEC (${ecran}) : ${nom} : ${e.message}` };
    }
  }
  await page.close();
  return { ok: true, ligne: `ETAPE OK (${ecran})` };
}

try {
  if (mode === 'routes') await routes();
  else if (mode === 'ponts') await ponts();
  else {
    let r = null;
    for (const ec of etapes) { r = await etape(ec); if (!r.ok) break; }
    await fin(r.ok ? 0 : 1, r.ligne);
  }
} catch (e) {
  if (page && capturesDir) await capturer('echec').catch(() => {});
  await fin(1, `${mode === 'ponts' ? 'PONTS' : mode === 'routes' ? 'ROUTES' : 'ETAPE'} ECHEC : ${e.message}`);
}
