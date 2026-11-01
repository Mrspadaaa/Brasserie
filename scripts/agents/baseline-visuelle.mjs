#!/usr/bin/env node
// Baseline visuelle (voie e1, mission 2026-10-31-systeme-ecrans) : une capture de référence par écran choisi et par état, puis une
// comparaison automatique. Elle complète les `controle-*.mjs` (qui mesurent des gestes et des formes) ; elle ne remplace jamais le
// regard (L12) : un écart se SIGNALE, puis on l'OUVRE.
//
// Les écrans et leurs états vivent dans `scripts/agents/baseline-cas.json` (lisible, un état = des gestes déclaratifs).
// Les références vont dans `work/refonte-frontend/v4/choix/baselines/<ecran>/<etat>.png`, avec `MANIFESTE.json`.
//
// Le diff de pixels se fait DANS CHROME : les deux PNG sont chargés dans un canvas, les données comparées là. Aucune dépendance
// neuve (ni pixelmatch ni pngjs).
//
// Usage (racine de l'arbre principal ; le serveur tourne dans la copie de production, jamais dans l'arbre principal) :
//   node scripts/with_server.mjs --server "cd <copie> && npm run dev -- --port 5601 --strictPort" --port 5601 \
//        --env VITE_HOP_V4=on --env VITE_FIREBASE_API_KEY=fake ... -- node scripts/agents/baseline-visuelle.mjs --prendre|--comparer
//   ou, avec un serveur déjà lancé :  node scripts/agents/baseline-visuelle.mjs --comparer --url=http://localhost:5601
// Options :
//   --prendre | --comparer | --lister
//   --cas=ecran[/etat],…      limite aux écrans ou états nommés
//   --copie=<dossier>         copie dont on note le commit (défaut : atelier-ecrans)
//   --tol-pixel=<0-255>       écart de canal à partir duquel un pixel « diffère » (défaut du manifeste, sinon 12)
//   --tol-image=<part>        part d'image qui peut différer (défaut 0.0005 = 0,05 %)
//   --tol-bloc=<part>         part d'un bloc de 16 px (CSS) qui peut différer (défaut 0.25) : attrape un petit défaut local
//   --decaler=<sélecteur>     TÉMOIN NÉGATIF (comparer seulement) : décale ce bloc de 8 px par une CSS injectée, aucun fichier changé
//   --css=<règles>            idem, CSS libre
//   --forcer                  prendre même si la copie a des fichiers suivis modifiés
// Sortie : « BASELINE OK » ou « BASELINE ECHEC n » (code 1). Les écarts : baselines/_ecarts/<ecran>/<etat>.{actuel,diff}.png.
import { execFileSync } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const RACINE = path.resolve(import.meta.dirname, '..', '..');
const { ouvrir } = await import(pathToFileURL(path.join(RACINE, '.claude/skills/webapp-testing/examples/_lanceur.mjs')).href);

const argv = process.argv.slice(2);
const drapeau = (n) => argv.includes(`--${n}`);
const valeur = (n) => argv.find((a) => a.startsWith(`--${n}=`))?.slice(n.length + 3);
const dormir = (ms) => new Promise((r) => setTimeout(r, ms));

const MODE = drapeau('prendre') ? 'prendre' : drapeau('comparer') ? 'comparer' : drapeau('lister') ? 'lister' : null;
if (!MODE) { console.log('Usage : baseline-visuelle.mjs --prendre | --comparer | --lister [--cas=ecran/etat,…] (voir l’en-tête du fichier)'); process.exit(2); }

const FICHIER_CAS = path.join(RACINE, 'scripts/agents/baseline-cas.json');
const DOSSIER = path.join(RACINE, 'work/refonte-frontend/v4/choix/baselines');
const ECARTS = path.join(DOSSIER, '_ecarts');
const MANIFESTE = path.join(DOSSIER, 'MANIFESTE.json');
const cas = JSON.parse(fs.readFileSync(FICHIER_CAS, 'utf8'));
const COPIE = valeur('copie') ?? cas.copieParDefaut ?? 'C:/Users/mrspa/AppData/Local/Temp/atelier-ecrans';

// ---------- Sélection des cas ----------
const filtres = (valeur('cas') ?? '').split(',').map((s) => s.trim()).filter(Boolean);
const choisi = (ecran, etat) => !filtres.length || filtres.some((f) => f === ecran || f === `${ecran}/${etat}`);
const liste = [];
for (const e of cas.ecrans) for (const s of e.etats) if (choisi(e.ecran, s.etat)) liste.push({ ecran: e, etat: s });
if (MODE === 'lister') {
  for (const { ecran, etat } of liste) console.log(`${ecran.ecran}/${etat.etat} — ${etat.quoi ?? ''}`);
  console.log(`${liste.length} état(s)`);
  process.exit(0);
}
if (!liste.length) { console.log('BASELINE ECHEC 1\n  - aucun cas ne correspond à --cas'); process.exit(1); }

// ---------- Tolérances ----------
let manifeste = fs.existsSync(MANIFESTE) ? JSON.parse(fs.readFileSync(MANIFESTE, 'utf8')) : null;
const num = (n, d) => (valeur(n) !== undefined ? Number(valeur(n)) : d);
const memeTol = manifeste?.tolerance ?? {};
const TOL = {
  pixel: num('tol-pixel', MODE === 'comparer' ? (memeTol.pixel ?? cas.tolerance.pixel) : cas.tolerance.pixel),
  image: num('tol-image', MODE === 'comparer' ? (memeTol.image ?? cas.tolerance.image) : cas.tolerance.image),
  bloc: num('tol-bloc', MODE === 'comparer' ? (memeTol.bloc ?? cas.tolerance.bloc) : cas.tolerance.bloc),
  blocCss: cas.tolerance.blocCss,
};
const VP = cas.viewport;

// ---------- Serveur ----------
const url = (valeur('url') ?? `http://localhost:${(process.env.WITH_SERVER_PORTS ?? '').split(',')[0]}`).replace(/\/$/, '');
if (/localhost:$/.test(url)) { console.log('BASELINE ECHEC 1\n  - pas de serveur : lance-le par scripts/with_server.mjs (WITH_SERVER_PORTS) ou passe --url='); process.exit(1); }

// ---------- La copie ----------
function gitCopie(...args) {
  try { return execFileSync('git', ['-C', COPIE, ...args], { encoding: 'utf8' }).trim(); } catch { return null; }
}
const commit = gitCopie('rev-parse', '--short=8', 'HEAD');
const modifies = (gitCopie('status', '--porcelain', '--untracked-files=no') ?? '').split('\n').filter(Boolean);
if (MODE === 'prendre' && modifies.length && !drapeau('forcer')) {
  console.log(`BASELINE ECHEC 1\n  - la copie ${COPIE} a des fichiers suivis modifiés (${modifies.slice(0, 3).join(' ; ')}) : une référence ne se prend que sur un commit propre (--forcer pour passer outre)`);
  process.exit(1);
}
if ((valeur('css') || valeur('decaler')) && MODE === 'prendre') { console.log('BASELINE ECHEC 1\n  - --css / --decaler sont des témoins négatifs : jamais avec --prendre'); process.exit(1); }

const CSS_STABLE = '*,*::before,*::after{animation:none!important;transition:none!important;scroll-behavior:auto!important;caret-color:transparent!important}';
const CSS_TEMOIN = [valeur('css'), valeur('decaler') ? `${valeur('decaler')}{position:relative!important;top:8px!important}` : null].filter(Boolean).join('\n');

// ---------- Préparations nommées (fixtures, comme les contrôles existants) ----------
const CLE = 'laffinee_recipe_draft_v1:dev-local:apercu-etape-houblons';
const PREPARATIONS = {
  // Recette de m5 (controle-froid-dryhopper.mjs) : Nugget 20 g à 60′, Cascade 80 g au dry hop, style 21C. Ajout du dry hop : « a2 ».
  async 'dryhop-nugget-cascade'(page) {
    await page.goto(`${url}/?dev-local&etape=houblons`, { waitUntil: 'networkidle0' });
    await page.waitForSelector('[data-ecran="ma-biere"]', { timeout: 150000 });
    await page.click('[data-role="dose-plus"]');
    await dormir(1500);
    await page.evaluate((cle) => {
      const e = JSON.parse(localStorage.getItem(cle));
      const hops = [{ name: 'Nugget', alpha: 13, weightG: 20, stage: 'boil', timeMin: 60 }, { name: 'Cascade', alpha: 6, weightG: 80, stage: 'dryHop', aromaTiming: 'fermentation', aromaContactHours: 72 }];
      for (const r of [e.draft.recipe, e.draft.details]) Object.assign(r, { name: 'Hazy du jeudi', style: '21C', hops, ogTarget: 1.058, colorEbc: 8 });
      e.draft.step = 'houblons'; e.draft.recipe.id = e.draft.details.id = 'REC-A2';
      localStorage.setItem(cle.replace('apercu-etape-houblons', 'new'), JSON.stringify(e));
    }, CLE);
    await page.goto(`${url}/?dev-local&etape=houblons&recette=vide`, { waitUntil: 'networkidle0' });
    await page.waitForSelector('[data-role="ligne-houblon"]', { timeout: 150000 });
    await dormir(1500);
  },
};

// ---------- Les gestes déclaratifs ----------
async function jouer(page, geste) {
  const [verbe] = Object.keys(geste);
  const v = geste[verbe];
  switch (verbe) {
    case 'cliquer': { // clic DOM : le premier élément visible du sélecteur (ou le n-ième, `rang`, parmi les visibles)
      const ok = await page.evaluate((s, rang) => { const tous = [...document.querySelectorAll(s)]; const vus = tous.filter((x) => x.getClientRects().length); const e = (vus.length ? vus : tous)[rang]; if (!e) return false; e.click(); return true; }, v, geste.rang ?? 0);
      if (!ok) throw new Error(`cliquer : « ${v} » est introuvable`);
      break;
    }
    case 'toucher': { await page.waitForSelector(v, { timeout: 30000 }); await page.click(v); break; }
    case 'attendre': { await page.waitForSelector(v, { timeout: geste.delai ?? 150000 }); break; }
    case 'absent': { await page.waitForSelector(v, { hidden: true, timeout: 30000 }); break; }
    case 'pause': { await dormir(v); break; }
    case 'ouvrir': { await page.evaluate((r) => window.__hopPile.open(r), v); break; }
    case 'fermer': { await page.evaluate(() => window.__hopPile.close()); break; }
    case 'aller': { await page.goto(`${url}${v}`, { waitUntil: 'networkidle0' }); break; }
    case 'preparer': { await PREPARATIONS[v](page); break; }
    case 'appui-long': {
      const h = await page.waitForSelector(v, { timeout: 30000 });
      await h.evaluate((e) => e.scrollIntoView({ block: 'center' }));
      const b = await h.boundingBox();
      await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2);
      await page.mouse.down();
      await dormir(geste.ms ?? 750);
      await page.mouse.up();
      await page.mouse.move(1, 1); // le pointeur quitte l'écran ouvert : sinon une infobulle de survol (« Agrumes : 5/10 fiches ») entre dans la référence
      break;
    }
    case 'defiler': { // vers un élément (bloc : start|center|end), ou « fin » : tout ce qui défile va en bas
      if (v === 'fin') {
        await page.evaluate(() => {
          for (const e of [document.scrollingElement, ...document.querySelectorAll('*')]) {
            if (e && e.scrollHeight > e.clientHeight + 8 && (e === document.scrollingElement || /auto|scroll/.test(getComputedStyle(e).overflowY))) e.scrollTop = e.scrollHeight;
          }
        });
      } else {
        const ok = await page.evaluate((s, bloc) => { const e = document.querySelector(s); if (!e) return false; e.scrollIntoView({ block: bloc }); return true; }, v, geste.bloc ?? 'start');
        if (!ok) throw new Error(`defiler : « ${v} » est introuvable`);
      }
      break;
    }
    case 'saisir': { // pose une valeur dans un champ contrôlé par React
      await page.waitForSelector(v, { timeout: 30000 });
      await page.focus(v);
      await page.keyboard.type(String(geste.texte), { delay: 15 });
      break;
    }
    default: throw new Error(`geste inconnu : ${verbe}`);
  }
  await dormir(geste.apres ?? 350);
}

/** Pose un aplat gris sur chaque élément masqué (heure, compteur…) : même aplat à la prise et à la comparaison. */
async function masquer(page, selecteurs) {
  return page.evaluate((sels) => {
    let n = 0;
    for (const s of sels) {
      for (const e of document.querySelectorAll(s)) {
        const r = e.getBoundingClientRect();
        if (!r.width || !r.height) continue;
        const d = document.createElement('div');
        d.setAttribute('data-baseline-masque', s);
        Object.assign(d.style, { position: 'fixed', left: `${r.left}px`, top: `${r.top}px`, width: `${r.width}px`, height: `${r.height}px`, background: '#808080', zIndex: '2147483647', pointerEvents: 'none' });
        document.body.appendChild(d);
        n++;
      }
    }
    return n;
  }, selecteurs);
}

/** Capture un état dans un Chrome neuf (aucun état partagé : le localStorage de l'état précédent ne compte pas). */
async function capturer(ecran, etat) {
  const { browser, page, journal } = await ouvrir({ largeur: VP.largeur, hauteur: VP.hauteur, echelle: VP.echelle });
  try {
    await page.evaluateOnNewDocument((css) => {
      const poser = () => { const s = document.createElement('style'); s.setAttribute('data-baseline', ''); s.textContent = css; (document.head ?? document.documentElement).appendChild(s); };
      if (document.head) poser(); else document.addEventListener('DOMContentLoaded', poser);
    }, [CSS_STABLE, CSS_TEMOIN].filter(Boolean).join('\n'));
    const gestes = [...(ecran.entree ?? []), ...(etat.gestes ?? [])];
    if (!gestes.some((g) => g.aller || g.preparer)) {
      await page.goto(`${url}${etat.url ?? ecran.url}`, { waitUntil: 'networkidle0' });
      await page.waitForSelector(ecran.pret, { timeout: 150000 });
      await dormir(1200);
    }
    for (const g of gestes) await jouer(page, g);
    await page.evaluate(() => document.fonts.ready);
    await dormir(etat.repos ?? 800);
    const masques = [...(cas.masquesGlobaux ?? []), ...(ecran.masques ?? []), ...(etat.masques ?? [])];
    const nMasques = masques.length ? await masquer(page, masques) : 0;
    if (etat.attend) await page.waitForSelector(etat.attend, { timeout: 20000 });
    const png = await page.screenshot({ type: 'png' });
    const graves = journal.erreurs.filter((e) => !/Firestore|permission/i.test(e));
    return { png, nMasques, erreurs: graves };
  } finally {
    await browser.close();
  }
}

// ---------- Le diff, dans Chrome ----------
/** Deux PNG (base64) → statistiques et image de diff. Tout se fait dans un canvas d'une page vide de Chrome. */
async function compareDansChrome(refPng, curPng) {
  const { browser, page } = await ouvrir({ largeur: 400, hauteur: 400, echelle: 1, mobile: false });
  try {
    await page.goto('about:blank');
    return await page.evaluate(async (refB64, curB64, tol, echelle) => {
      const charger = (b64) => new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => rej(new Error('PNG illisible')); i.src = `data:image/png;base64,${b64}`; });
      const [a, b] = await Promise.all([charger(refB64), charger(curB64)]);
      if (a.width !== b.width || a.height !== b.height) return { taille: { ref: [a.width, a.height], actuel: [b.width, b.height] } };
      const W = a.width, H = a.height;
      const lire = (img) => { const c = document.createElement('canvas'); c.width = W; c.height = H; const x = c.getContext('2d', { willReadFrequently: true }); x.drawImage(img, 0, 0); return x.getImageData(0, 0, W, H).data; };
      const A = lire(a), B = lire(b);
      const cote = Math.max(4, Math.round(tol.blocCss * echelle));
      const cw = Math.ceil(W / cote), ch = Math.ceil(H / cote);
      const cellules = new Uint32Array(cw * ch);
      const sortie = new ImageData(W, H);
      let diff = 0, bruit = 0, maxCanal = 0, x0 = W, y0 = H, x1 = -1, y1 = -1;
      for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
          const i = (y * W + x) * 4;
          const d = Math.max(Math.abs(A[i] - B[i]), Math.abs(A[i + 1] - B[i + 1]), Math.abs(A[i + 2] - B[i + 2]), Math.abs(A[i + 3] - B[i + 3]));
          if (d > maxCanal) maxCanal = d;
          const gris = (A[i] * 0.3 + A[i + 1] * 0.59 + A[i + 2] * 0.11) * 0.3 + 178; // la référence, pâle
          if (d > tol.pixel) {
            diff++;
            cellules[Math.floor(y / cote) * cw + Math.floor(x / cote)]++;
            if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
            sortie.data[i] = 230; sortie.data[i + 1] = 20; sortie.data[i + 2] = 40;
          } else {
            if (d > 0) bruit++;
            sortie.data[i] = sortie.data[i + 1] = sortie.data[i + 2] = gris;
          }
          sortie.data[i + 3] = 255;
        }
      }
      // Les blocs qui dépassent la tolérance locale : encadrés en magenta, et listés.
      const mauvais = [];
      for (let cy = 0; cy < ch; cy++) {
        for (let cx = 0; cx < cw; cx++) {
          const surface = Math.min(cote, W - cx * cote) * Math.min(cote, H - cy * cote);
          const part = cellules[cy * cw + cx] / surface;
          if (part > tol.bloc) mauvais.push({ x: Math.round(cx * cote / echelle), y: Math.round(cy * cote / echelle), part: Math.round(part * 1000) / 1000 });
        }
      }
      const c = document.createElement('canvas'); c.width = W; c.height = H;
      const g = c.getContext('2d');
      g.putImageData(sortie, 0, 0);
      g.strokeStyle = '#ff00ff'; g.lineWidth = Math.max(2, echelle * 1.5);
      for (const m of mauvais) g.strokeRect(m.x * echelle, m.y * echelle, cote, cote);
      if (diff) { g.strokeStyle = '#0050ff'; g.lineWidth = Math.max(2, echelle); g.strokeRect(x0 - 3, y0 - 3, x1 - x0 + 7, y1 - y0 + 7); }
      return {
        largeur: W, hauteur: H, pixels: W * H, diff, part: diff / (W * H), bruit, maxCanal,
        boite: diff ? { x: Math.round(x0 / echelle), y: Math.round(y0 / echelle), l: Math.round((x1 - x0 + 1) / echelle), h: Math.round((y1 - y0 + 1) / echelle) } : null,
        blocs: mauvais.length, pires: mauvais.sort((p, q) => q.part - p.part).slice(0, 4),
        image: c.toDataURL('image/png').split(',')[1],
      };
    }, refPng.toString('base64'), curPng.toString('base64'), TOL, VP.echelle);
  } finally {
    await browser.close();
  }
}

// ---------- Exécution ----------
const echecs = [];
const rapport = [];
const chemin = (ecran, etat) => path.join(DOSSIER, ecran, `${etat}.png`);
const pct = (x) => `${(x * 100).toFixed(4)} %`;
const sha = (b) => crypto.createHash('sha256').update(b).digest('hex').slice(0, 16);

if (MODE === 'prendre') {
  manifeste = {
    avertissement: 'Références de la PRODUCTION (copie au commit indiqué), prises par scripts/agents/baseline-visuelle.mjs --prendre. Un écart se signale, puis se regarde (L12) : ces images ne remplacent ni les contrôles ni le regard.',
    ...(manifeste ?? {}),
    commit, copie: COPIE, date: new Date().toISOString(), viewport: VP, tolerance: { pixel: TOL.pixel, image: TOL.image, bloc: TOL.bloc, blocCss: TOL.blocCss },
    polices: 'les polices externes sont coupées (réseau hors localhost bloqué) : les repli du système rendent le texte ; même poste, même rendu',
    etats: filtres.length ? { ...(manifeste?.etats ?? {}) } : {}, // une prise complète repart de zéro ; une prise partielle garde le reste
  };
}

function ecrireManifeste() {
  manifeste.etats = Object.fromEntries(Object.entries(manifeste.etats).sort(([a], [b]) => a.localeCompare(b)));
  fs.mkdirSync(DOSSIER, { recursive: true });
  fs.writeFileSync(MANIFESTE, `${JSON.stringify(manifeste, null, 1)}\n`);
}

for (const { ecran, etat } of liste) {
  const id = `${ecran.ecran}/${etat.etat}`;
  const ref = chemin(ecran.ecran, etat.etat);
  let r;
  try { r = await capturer(ecran, etat); } catch (e) { echecs.push(`${id} : geste en échec — ${String(e.message ?? e).split('\n')[0]}`); console.log(`ECHEC ${id} (geste) ${String(e.message ?? e).split('\n')[0]}`); continue; }
  if (r.erreurs.length) { echecs.push(`${id} : erreurs de page ${r.erreurs.slice(0, 2).join(' ; ')}`); console.log(`ECHEC ${id} (erreurs de page)`); continue; }
  if (MODE === 'prendre') {
    fs.mkdirSync(path.dirname(ref), { recursive: true });
    fs.writeFileSync(ref, r.png);
    manifeste.etats[id] = { fichier: path.relative(DOSSIER, ref).replace(/\\/g, '/'), quoi: etat.quoi ?? '', empreinte: sha(r.png), octets: r.png.length, masques: [...(cas.masquesGlobaux ?? []), ...(ecran.masques ?? []), ...(etat.masques ?? [])], pris: new Date().toISOString() };
    console.log(`PRIS ${id} (${r.png.length} o, ${r.nMasques} masque(s))`);
    ecrireManifeste(); // à chaque état : une prise interrompue garde ce qui est déjà pris
    continue;
  }
  // --comparer
  if (!fs.existsSync(ref)) { echecs.push(`${id} : pas de référence (lance --prendre)`); console.log(`ECHEC ${id} (pas de référence)`); continue; }
  const dossierEcart = path.join(ECARTS, ecran.ecran);
  const chActuel = path.join(dossierEcart, `${etat.etat}.actuel.png`);
  const chDiff = path.join(dossierEcart, `${etat.etat}.diff.png`);
  const c = await compareDansChrome(fs.readFileSync(ref), r.png);
  fs.mkdirSync(dossierEcart, { recursive: true });
  if (c.taille) {
    fs.writeFileSync(chActuel, r.png);
    echecs.push(`${id} : taille différente, référence ${c.taille.ref.join('×')}, actuelle ${c.taille.actuel.join('×')} (${path.relative(RACINE, chActuel)})`);
    console.log(`ECHEC ${id} taille ${c.taille.ref.join('×')} → ${c.taille.actuel.join('×')}`);
    rapport.push({ id, taille: c.taille });
    continue;
  }
  const ok = c.part <= TOL.image && c.blocs === 0;
  const ligne = `${id} : ${c.diff} px (${pct(c.part)}), bruit sous tolérance ${c.bruit} px, écart max ${c.maxCanal}/255, ${c.blocs} bloc(s) hors tolérance`;
  rapport.push({ id, ok, diff: c.diff, part: c.part, bruit: c.bruit, maxCanal: c.maxCanal, blocs: c.blocs });
  if (ok) {
    console.log(`OK    ${ligne}`);
    for (const f of [chActuel, chDiff]) fs.rmSync(f, { force: true });
  } else {
    fs.writeFileSync(chActuel, r.png);
    fs.writeFileSync(chDiff, Buffer.from(c.image, 'base64'));
    const ou = c.boite ? ` ; zone ${c.boite.l}×${c.boite.h} CSS en (${c.boite.x}, ${c.boite.y})` : '';
    echecs.push(`${id} : ${pct(c.part)} des pixels diffèrent (tolérance ${pct(TOL.image)}), ${c.blocs} bloc(s)${ou} — ouvrir ${path.relative(RACINE, chDiff)}`);
    console.log(`ECHEC ${ligne}${ou}\n      diff : ${chDiff}`);
  }
}

if (MODE === 'prendre') {
  ecrireManifeste();
  if (!filtres.length && !echecs.length) { // prise complète réussie : les images d'états disparus du fichier de cas partent
    for (const d of fs.readdirSync(DOSSIER, { withFileTypes: true })) {
      if (!d.isDirectory() || d.name.startsWith('_')) continue;
      for (const f of fs.readdirSync(path.join(DOSSIER, d.name))) {
        if (f.endsWith('.png') && !manifeste.etats[`${d.name}/${f.slice(0, -4)}`]) { fs.rmSync(path.join(DOSSIER, d.name, f)); console.log(`ORPHELINE retirée : ${d.name}/${f}`); }
      }
    }
  }
  console.log(echecs.length ? `BASELINE ECHEC ${echecs.length}` : `BASELINE PRISE (${liste.length} état(s), commit ${commit}, ${path.relative(RACINE, MANIFESTE)})`);
  for (const e of echecs) console.log(`  - ${e}`);
  process.exit(echecs.length ? 1 : 0);
}
if (echecs.length) { console.log(`BASELINE ECHEC ${echecs.length}`); for (const e of echecs) console.log(`  - ${e}`); process.exit(1); }
const pire = rapport.reduce((m, x) => Math.max(m, x.part ?? 0), 0);
console.log(`BASELINE OK (${liste.length} état(s) ; écart le plus grand ${pct(pire)}, tolérance ${pct(TOL.image)} ; commit des références ${manifeste?.commit ?? '?'})`);
