// Le parcours entier de la maquette, joué d'un bout à l'autre dans une seule session de navigateur par format :
// 390 × 844 au doigt (événements tactiles), puis 1280 × 800 à la souris (le survol long ouvre la fiche).
// Usage (depuis la racine du dépôt) :
//   node prototypes/houblons-v4/parcours/outils/parcours-complet.mjs --captures <dossier>
//   → PARCOURS OK (n gestes à 390, m à 1280, recalcul médian x ms)   ou   PARCOURS ECHEC + la liste
// Options : --sans-construire (réutiliser les pages déjà construites), --largeur=390|1280 (un seul format),
//           --dossier=<pages construites> (défaut : la sortie par défaut de construire.mjs).
// Le parcours (MISSION.md, voie p5) : Ma bière (appui long sur Nugget) → « + floral » → Suggérer (cocher trois
// houblons) → « Comparer les 3 » → Comparer (retenir Idaho 7, « Placer Idaho 7 ») → Dryhopper (60′, dry hop actif,
// 2 jours) → « Puis la levure » → Levure (changer, revenir à US-05) → « Ajouter à ma bière » → Ma bière recalculée →
// Nugget → Substituer → « Remplacer » → « ‹ » qui abandonne un brouillon → « Recommencer ».
// Après chaque geste : aucune erreur de page, aucun défilement horizontal, l'écran attendu (data-ecran), l'état
// attendu (window.__parcours), et ce qui change se lit à l'écran (L12). Le temps du recalcul est gardé.
// Les gestes de jouer-parcours.mjs (un script qui joue à l'import, sans export) ne se réutilisent pas par import :
// ses attentes (ponts, état) sont reprises ici, en doigt réel et avec les vérifications à l'écran.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ici = path.dirname(fileURLToPath(import.meta.url));
const parcours = path.resolve(ici, '..');
const depot = path.resolve(parcours, '..', '..', '..');
const require = createRequire(path.join(depot, 'package.json'));
const puppeteer = require('puppeteer-core');
const CHROME = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';

const argv = process.argv.slice(2);
const opt = (nom) => {
  const egal = argv.find((a) => a.startsWith(`--${nom}=`));
  if (egal) return egal.slice(nom.length + 3);
  const i = argv.indexOf(`--${nom}`);
  return i >= 0 && argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : i >= 0 ? true : null;
};
const dossier = path.resolve(depot, typeof opt('dossier') === 'string' ? opt('dossier') : 'prototypes/houblons-v4/maquettes/parcours');
const capturesDir = typeof opt('captures') === 'string' ? path.resolve(depot, opt('captures')) : null;
const seule = typeof opt('largeur') === 'string' ? Number(opt('largeur')) : null;
if (capturesDir) fs.mkdirSync(capturesDir, { recursive: true });

// 1. Construire dans la sortie par défaut, puis partir de index.html.
if (!opt('sans-construire')) {
  try {
    const sortie = execFileSync(process.execPath, [path.join(ici, 'construire.mjs')], { cwd: depot, encoding: 'utf8' });
    if (!/CONSTRUIT OK/.test(sortie)) { console.log(`PARCOURS ECHEC\n- construction : ${sortie.trim().split('\n').at(-1)}`); process.exit(1); }
  } catch (e) { console.log(`PARCOURS ECHEC\n- construction : ${String(e.stdout ?? e.message).trim().split('\n').at(-1)}`); process.exit(1); }
}
if (!fs.existsSync(path.join(dossier, 'index.html'))) { console.log(`PARCOURS ECHEC\n- ${path.relative(depot, dossier)}/index.html absent`); process.exit(1); }

const FORMATS = [
  { largeur: 390, viewport: { width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true }, doigt: true },
  { largeur: 1280, viewport: { width: 1280, height: 800, deviceScaleFactor: 1, isMobile: false, hasTouch: false }, doigt: false },
].filter((f) => !seule || f.largeur === seule);

const pause = (ms) => new Promise((r) => setTimeout(r, ms));
const nav = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--disable-gpu'] });
const echecs = [];
const resume = { gestes: {}, recalculs: [], parGeste: {} };
const notes = [];

async function jouer(format) {
  const L = format.largeur;
  const page = await nav.newPage();
  let erreurs = [];
  page.on('pageerror', (e) => erreurs.push(`erreur de page : ${e.message}`));
  page.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource|fonts\.g/.test(m.text())) erreurs.push(`console : ${m.text()}`); });
  await page.setViewport(format.viewport);
  await page.goto(pathToFileURL(path.join(dossier, 'index.html')).href, { waitUntil: 'load' });

  let n = 0, etapeNom = '';
  const ev = (fn, ...a) => page.evaluate(fn, ...a);
  const calme = () => ev(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => r()))));
  const etat = () => ev(() => JSON.parse(JSON.stringify(window.__parcours.etat)));
  const hash = () => ev(() => location.hash);
  const verifier = (cond, message) => { if (!cond) throw new Error(message); };

  /** Le dernier élément visible, hors [inert] et [hidden], qui répond au sélecteur (l'écran du dessus). */
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
  /** Amène l'élément à l'écran et rend son centre ; échoue s'il est recouvert (le doigt toucherait autre chose). */
  async function poser(el, sel) {
    await el.evaluate((e) => e.scrollIntoView({ block: 'center', inline: 'center' }));
    await calme();
    const c = await el.evaluate((e) => {
      const r = e.getBoundingClientRect();
      const x = r.left + r.width / 2, y = r.top + r.height / 2;
      const haut = document.elementFromPoint(x, y);
      return { x, y, w: r.width, h: r.height, ok: !!haut && (e === haut || e.contains(haut) || haut.contains(e)), haut: haut ? `${haut.tagName.toLowerCase()}${haut.getAttribute('data-role') ? `[${haut.getAttribute('data-role')}]` : ''}` : 'rien' };
    });
    verifier(c.ok, `${sel} est recouvert au centre par ${c.haut} (le doigt toucherait autre chose)`);
    return c;
  }
  const toucher = async (sel) => {
    const el = await cible(sel);
    const c = await poser(el, sel);
    if (format.doigt) await page.touchscreen.tap(c.x, c.y);
    else { await page.mouse.move(c.x, c.y); await page.mouse.down(); await page.mouse.up(); }
    await calme(); await pause(40);
  };
  /** Le doigt posé 650 ms (fiche) ; à la souris, le survol long du nom (600 ms de seuil dans l'app). */
  const ouvrirFiche = async (sel) => {
    const el = await cible(sel);
    const c = await poser(el, sel);
    if (format.doigt) {
      const t = await page.touchscreen.touchStart(c.x, c.y);
      await pause(650); await t.end();
    } else {
      // Un brasseur ne survole pas un nom 0,4 s après le chargement : l'app ignore le survol pendant ce temps
      // (fermeeA vaut 0 au départ, voir RESULTAT.md). On attend 1,2 s de vie de la page avant le premier survol.
      const age = await ev(() => performance.now());
      if (age < 1200) await pause(1200 - age);
      await page.mouse.move(c.x - 40, c.y - 40); await page.mouse.move(c.x, c.y, { steps: 4 });
      await pause(1000);
    }
    await calme();
  };
  const glisser = async (sel, de, a, pas = 12) => {
    const el = await cible(sel);
    const c = await poser(el, sel);
    const b = await el.boundingBox();
    const y = b.y + b.height / 2, x = (f) => b.x + b.width * f;
    if (format.doigt) {
      const t = await page.touchscreen.touchStart(x(de), y);
      for (let i = 1; i <= pas; i++) { await t.move(x(de + ((a - de) * i) / pas), y); await pause(16); }
      await t.end();
      // Le doigt se lève ; Chrome n'émet pas de « click » pour un toucher posé moins de ~0,2 s après un glissé.
      await pause(350);
    } else {
      await page.mouse.move(x(de), y); await page.mouse.down();
      for (let i = 1; i <= pas; i++) { await page.mouse.move(x(de + ((a - de) * i) / pas), y); await pause(16); }
      await page.mouse.up();
    }
    await calme(); void c;
  };
  const retourTelephone = async () => { await ev(() => history.back()); await pause(150); await calme(); };
  // La croix des outils (D109) ramène toujours à l'étape Houblons (D118), quel que soit le chemin.
  const fermerOutil = () => toucher('[data-role="retour"]');
  const debordement = () => ev(() => {
    const d = document.documentElement;
    // L'élément qui déborde le plus loin est nommé (rôle, élément ou classe, et son texte) : la cause se lit dans le message.
    const qui = (z) => {
      const R = z.getBoundingClientRect().right;
      const t = [...z.querySelectorAll('*')].filter((e) => e.getBoundingClientRect().right > R + 1).sort((a, b) => b.getBoundingClientRect().right - a.getBoundingClientRect().right)[0];
      return t ? ` (${t.getAttribute('data-role') || t.getAttribute('data-element') || t.tagName.toLowerCase() + '.' + String(t.className).split(' ')[0]} « ${(t.textContent || '').trim().slice(0, 40)} »)` : '';
    };
    return [d, ...document.querySelectorAll('[data-page-shell] main')].filter((z) => z.scrollWidth > z.clientWidth + 1).map((z) => `${z.tagName.toLowerCase()} ${z.scrollWidth}>${z.clientWidth}${qui(z)}`);
  });
  // Ma bière défile dans son cadre (le `main` de PageShell) : une seconde capture, « -bas », montre le bas de la page
  // (la ligne ajoutée, la levure), puis la page revient en haut.
  const BAS = /^(ma-biere|recommencer|biere)/;
  const capturer = async (nom) => {
    if (!capturesDir) return;
    const base = path.join(capturesDir, `${String(n).padStart(2, '0')}-${nom}`);
    await page.screenshot({ path: `${base}-${L}.png` });
    if (BAS.test(nom)) {
      const defile = await ev(() => { const m = [...document.querySelectorAll('[data-page-shell] main')].filter((x) => x.getBoundingClientRect().width > 0 && !x.closest('[inert]')).at(-1); if (!m) return false; const d = m.scrollHeight > m.clientHeight + 1; m.scrollTop = m.scrollHeight; return d; });
      if (defile) { await calme(); await page.screenshot({ path: `${base}-bas-${L}.png` }); }
      await ev(() => { for (const m of document.querySelectorAll('[data-page-shell] main')) m.scrollTop = 0; });
      await calme();
    }
  };

  /** Un geste : on le joue, puis erreurs, défilement horizontal, écran attendu, capture ; le recalcul est chronométré. */
  async function geste(etape, ecran, faire, controle) {
    try { await geste1(etape, ecran, faire, controle); } catch (e) {
      if (capturesDir) await page.screenshot({ path: path.join(capturesDir, `echec-${String(n).padStart(2, '0')}-${etape}-${L}.png`) }).catch(() => {});
      throw new Error(`geste ${n} « ${etape} » : ${e.message} (route ${await hash().catch(() => "?")})`);
    }
  }
  async function geste1(etape, ecran, faire, controle) {
    n += 1; etapeNom = etape;
    const k = await ev(() => window.__parcours.mesures().length);
    await faire();
    if (ecran) { await cible(`[data-ecran="${ecran}"]`); await calme(); }
    await pause(60);
    const ms = await ev((i) => window.__parcours.mesures().slice(i).filter((m) => !m.cache && m.nom === 'lireBiere').reduce((s, m) => s + m.ms, 0), k);
    if (ms > 0) (resume.parGeste[L] ??= []).push({ etape, ms });
    if (erreurs.length) throw new Error(erreurs.join(' ; '));
    const deb = await debordement();
    verifier(!deb.length, `défilement horizontal : ${deb.join(', ')}`);
    if (controle) await controle();
    await capturer(etape);
    resume.gestes[L] = n;
  }

  // ---------- lectures de l'écran ----------
  const ibuRendu = (ecran = 'ma-biere') => ev((e) => { const o = document.querySelector(`[data-ecran="${e}"] [data-role="ibu"]`); return o ? { valeur: Number(o.getAttribute('data-valeur')), texte: o.textContent.trim() } : null; }, ecran);
  const ibuMoteur = () => ev(() => window.__parcours.biere().ibu.valeur);
  const floralMoteur = () => ev(() => window.__parcours.biere().profil.floral.valeur?.centre ?? null);
  /** Largeur de la barre « floral » rendue, en fraction de sa piste : ce que le brasseur voit. */
  const floralVu = () => ev(() => {
    // Le point « prévu » de la barre floral, en fraction de sa piste (le rond de la base v4.10, pas un remplissage).
    const b = document.querySelector('[data-ecran="ma-biere"] [data-barre="floral"]');
    const p = b && b.querySelector('[data-role="point"]');
    if (!p) return null;
    const rb = b.getBoundingClientRect(), rp = p.getBoundingClientRect();
    return (rp.left + rp.width / 2 - rb.left) / rb.width;
  });
  const lectureCoherente = async (quoi, ecran = 'ma-biere') => {
    const [r, m] = [await ibuRendu(ecran), await ibuMoteur()];
    verifier(r && Math.abs(r.valeur - m) < 0.01, `${quoi} : IBU affiché ${r?.valeur} ≠ moteur ${m}`);
    verifier(Math.abs(Number(r.texte.replace(',', '.')) - m) < 0.51, `${quoi} : le texte de l'IBU (« ${r.texte} ») ne dit pas ${m.toFixed(1)}`);
    return m;
  };
  /** Inconnu ≠ 0 : une famille que le moteur ne sait pas lire reste hachurée (data-inconnu) dans Ma bière. */
  const inconnusTenus = async (quoi) => {
    const r = await ev(() => {
      const b = window.__parcours.biere(), fautes = [];
      for (const f of Object.keys(b.profil)) {
        const barre = document.querySelector(`[data-ecran="ma-biere"] [data-barre="${f}"]`);
        if (!barre) continue;
        if (b.profil[f].valeur == null && !barre.querySelector('.pq-hachure, [data-inconnu]')) fautes.push(f);
      }
      for (const s of b.nonSimules) if (!document.querySelector(`[data-ecran="ma-biere"] [data-ajout="${s.ajoutId}"] [data-inconnu]`)) fautes.push(`non simulé ${s.ajoutId}`);
      return fautes;
    });
    verifier(!r.length, `${quoi} : inconnu écrit comme une valeur (${r.join(', ')})`);
  };

  // ======================= LE PARCOURS =======================
  await cible('[data-ecran="ma-biere"]'); await calme();
  await ev(() => window.__parcours.viderMesures());
  const depart = await etat();
  const departJson = JSON.stringify(depart.recette);
  let ibu0, floral0, floralVu0;

  // 1. Ma bière : IBU, familles, appui long sur Nugget → fiche → fermer.
  await geste('ma-biere', 'ma-biere', async () => {}, async () => {
    ibu0 = await lectureCoherente('départ');
    verifier(Math.round(ibu0) === 60, `IBU de départ ${ibu0.toFixed(2)} (60 attendus)`);
    floral0 = await floralMoteur(); floralVu0 = await floralVu();
    verifier(floral0 != null && floralVu0 > 0, `floral de départ illisible (moteur ${floral0}, barre ${floralVu0})`);
    const nBarres = await ev(() => document.querySelectorAll('[data-ecran="ma-biere"] [data-barre]').length);
    verifier(nBarres >= 6, `${nBarres} familles seulement dans Ma bière`);
    verifier(await ev(() => /résineu/i.test(document.querySelector('[data-ecran="ma-biere"] [data-role="alerte"]')?.textContent ?? '')), 'l’alerte « trop résineux » (dégustation du 18.10) ne se lit pas');
    verifier(await ev(() => !!document.querySelector('[data-ecran="ma-biere"] [data-voie="a1"] [data-role="alpha"]')), 'α de Nugget absent');
    await inconnusTenus('départ');
    // Ce que le brasseur voit au chargement : ni liseré de focus autour de la page (vu le 23.10 sur Ma bière à 390 et 1280,
    // corrigé dans styles.css), ni « ‹ » inerte sur la page racine (vu à 1280, corrigé de même).
    const obs = await ev(() => {
      const a = document.activeElement, cs = a ? getComputedStyle(a) : null;
      const fermer = [...document.querySelectorAll('[data-page-titlebar] button[aria-label="Fermer"]')].filter((b) => b.getBoundingClientRect().width > 0);
      return { actif: a ? a.tagName.toLowerCase() : null, style: cs ? cs.outlineStyle : null, largeur: cs ? parseFloat(cs.outlineWidth) : null, contour: cs ? `${cs.outlineStyle} ${cs.outlineWidth} ${cs.outlineColor}` : null, fermer: fermer.length };
    });
    verifier(obs.style === 'none' || obs.largeur === 0, `un liseré de focus encadre la page au chargement (${obs.actif}, ${obs.contour})`);
    verifier(!obs.fermer, 'Ma bière (racine) montre un « ‹ » qui ne mène nulle part');
  });
  await geste('fiche-nugget', 'fiche', async () => {
    await ouvrirFiche('[data-role="ouvrir-fiche"][data-houblon="beermaverick-nugget"]');
  }, async () => {
    verifier((await hash()) === '#/fiche/nugget', `route de la fiche : ${await hash()}`);
    verifier(await ev(() => document.querySelector('[data-ecran="fiche"]')?.getAttribute('data-houblon-ouvert') === 'beermaverick-nugget'), 'la fiche ouverte n’est pas celle de Nugget');
    verifier(JSON.stringify((await etat()).recette) === departJson, 'la fiche a changé la recette');
  });
  await geste('fiche-fermee', 'ma-biere', async () => {
    if (format.doigt) await retourTelephone();
    else { await toucher('[data-role="fermer-fiche"]'); await pause(150); }
  }, async () => {
    verifier((await hash()) === '#/ma-biere', `après la fiche : ${await hash()}`);
    verifier(await ev(() => !document.querySelector('[data-ecran="fiche"]')), 'la fiche est restée à l’écran');
    verifier(JSON.stringify((await etat()).recette) === departJson, 'fermer la fiche a changé la recette');
    await lectureCoherente('après la fiche');
  });

  // 2. Onglet Ma bière : la visée « plus » sur Floral, puis « + floral » vers Suggérer.
  await geste('biere', 'biere', async () => { await toucher('[data-role="pont-biere"]'); }, async () => {
    verifier((await hash()) === '#/biere', `route : ${await hash()}`);
    verifier(await ev(() => document.querySelector('[role="tab"][aria-selected="true"]')?.dataset.onglet === 'biere'), 'onglet Ma bière non actif');
    await lectureCoherente('onglet Ma bière', 'biere');
    const lu = await ev(() => {
      const b = window.__parcours.biere(), fs = Object.keys(b.profil);
      const au = fs.filter((f) => b.profil[f].valeur && !b.profil[f].horsStyle).length, non = fs.filter((f) => !b.profil[f].valeur).length;
      return { attendu: `${au} au style · ${non} non située`, texte: document.querySelector('[data-element~="biere-decompte"]')?.textContent ?? '' };
    });
    verifier(lu.texte.startsWith(lu.attendu), `décompte « ${lu.texte} », moteur « ${lu.attendu} »`);
    verifier(JSON.stringify((await etat()).recette) === departJson, 'l’onglet a changé la recette');
  });
  // Au départ, l'onglet porte les demandes de la dégustation en puces au trait (« + floral », « − résineux », « + … ») :
  // comme dans sa base (r2, etat-biere-objectif-floral), une puce pose la visée sans quitter l'onglet, et c'est la ligne
  // « Plus floral : n voies › » écrite dessous (pont-floral) qui ouvre Suggestions. On bannit le floral, puis on le vise
  // en plus, pour que la ligne soit gagnée par un geste et non héritée.
  const puceFloral = () => ev(() => { const b = document.querySelector('[data-role="pont-objectif-floral"]'); return b ? { texte: b.textContent.trim(), posee: b.getAttribute('aria-pressed') === 'true' } : null; });
  const pontFloral = () => ev(() => document.querySelector('[data-role="pont-floral"]')?.textContent.trim() ?? null);
  const p0 = await puceFloral();
  verifier(p0 && /\+ floral/.test(p0.texte) && !p0.posee, `l’onglet Ma bière n’arrive pas avec l’objectif « + floral » au trait (${JSON.stringify(p0)})`);
  verifier((await pontFloral()) === null, 'la ligne « Plus floral › » est là avant toute visée');
  await geste('biere-floral-bannir', 'biere', async () => {
    await toucher('[data-famille-ligne="floral"] > button');
    await toucher('#pq-biere-visee-floral [data-visee="bannir"]');
  }, async () => {
    verifier(await ev(() => document.querySelector('#pq-biere-visee-floral [data-visee="bannir"]')?.getAttribute('aria-pressed') === 'true'), 'la visée « bannir » sur Floral n’est pas posée');
    verifier((await pontFloral()) === null, 'le pont « + floral » reste alors que le floral est banni');
    verifier(await ev(() => /bannir floral/.test(document.querySelector('[data-element~="biere-objectifs"]')?.textContent ?? '')), 'l’objectif « bannir floral » n’apparaît pas');
    verifier(JSON.stringify((await etat()).recette) === departJson, 'viser a changé la recette');
  });
  await geste('biere-floral-plus', 'biere', async () => {
    await toucher('#pq-biere-visee-floral [data-visee="plus"]');
  }, async () => {
    verifier(await ev(() => document.querySelector('#pq-biere-visee-floral [data-visee="plus"]')?.getAttribute('aria-pressed') === 'true'), 'la visée « plus » sur Floral n’est pas posée');
    verifier(/Plus floral/.test((await pontFloral()) ?? ''), `la ligne « Plus floral › » n’apparaît pas (${await pontFloral()})`);
    verifier((await puceFloral())?.posee, 'la puce « + floral » n’est pas pleine (visée posée)');
    verifier(JSON.stringify((await etat()).recette) === departJson, 'viser le floral a changé la recette');
  });

  // 3. Suggérer (q2b) : voies du moteur, deux proposés (Motueka, Nelson Sauvin), « + » sur Galaxy → « Comparer (3) ».
  // DÉCISION r7 (voies/r7-batterie/RESULTAT.md) : q2b et r6a ne changent pas ; sa question de Comparer (« Lequel pour ma
  // stout : Cascade, Idaho 7 ou Galaxy ? », 20.10) entre par Galaxy, coché dans Suggérer, et par Idaho 7, ajouté au « + »
  // de Comparer (colonne +), puis « Placer Idaho 7 › ».
  let propose = [];
  await geste('suggerer', 'suggerer', async () => { await toucher('[data-role="pont-floral"]'); }, async () => {
    verifier((await hash()) === '#/suggerer', `route : ${await hash()}`);
    const lu = await ev(() => {
      // La direction de l'écran (q2b : les objectifs de la visée commune, en crans ; jeu.mjs de Suggérer).
      const P = window.__parcours, r = P.etat.recette, dir = JSON.parse(document.querySelector('[data-libre="houblon"]')?.dataset.direction ?? '{}');
      const vs = P.moteur.proposer(r, dir).voies.filter((v) => ['ajouter', 'assemblage', 'remplacer à IBU égal'].includes(v.type));
      const manque = vs.filter((v) => !document.querySelector(`[data-ecran="suggerer"] [data-voie][data-id="${CSS.escape(v.id)}"]`)).map((v) => v.label);
      const nVoies = document.querySelectorAll('[data-ecran="suggerer"] [data-voie]').length;
      return { manque, nVoies, nMoteur: vs.length };
    });
    verifier(!lu.manque.length, `voies du moteur absentes : ${lu.manque.join(" ; ")}`);
    verifier(lu.nMoteur > 0 && lu.nVoies >= Math.min(lu.nMoteur, 6), `voies : ${lu.nVoies} lignes pour ${lu.nMoteur} du moteur`);
    propose = (await etat()).aComparer;
    verifier(propose.length === 2 && propose.includes('beermaverick-motueka') && propose.includes('beermaverick-nelson-sauvin'), `proposés au départ : ${propose.join(', ')} (q2b : Motueka et Nelson Sauvin)`);
    const pont = await ev(() => document.querySelector('[data-role="pont-comparer"]')?.textContent.trim() ?? null);
    verifier(pont && pont.includes('Comparer (2)'), `pont : « ${pont} »`);
    verifier(JSON.stringify((await etat()).recette) === departJson, 'Suggérer a changé la recette');
  });
  {
    const cle = 'beermaverick-galaxy';
    const plus = `[data-ecran="suggerer"] [data-voie][data-id^="ajouter|${cle}@"] [data-role="ajouter"]`;
    await geste('suggerer-plus-galaxy', 'suggerer', async () => { await toucher(plus); }, async () => {
      const e = await etat();
      verifier(e.aComparer.includes(cle) && e.aComparer.length === propose.length + 1, `« + » sur Galaxy : liste ${e.aComparer.join(', ')}`);
      propose = e.aComparer;
      const pont = await ev(() => document.querySelector('[data-role="pont-comparer"]')?.textContent.trim() ?? null);
      verifier(pont && pont.includes(`Comparer (${propose.length})`), `pont : « ${pont} »`);
      verifier(await ev((s) => document.querySelector(s)?.getAttribute('aria-label')?.startsWith('Retirer'), plus), 'le « + » ne s’est pas changé en ✓');
      verifier(JSON.stringify(e.recette) === departJson, '« + » a changé la recette');
    });
  }
  await geste('comparer', 'comparer', async () => { await toucher('[data-role="pont-comparer"]'); }, async () => {
    const h = await hash();
    const m = h.match(/^#\/comparer\?h=([^&]*)/);
    verifier(m, `route : ${h}`);
    const liste = m[1].split(',').map((x) => 'beermaverick-' + x).sort().join(',');
    verifier(liste === [...propose].sort().join(','), `Comparer avec ${m[1]}, liste ${propose.join(',')}`);
    const lu = await ev(() => ({ cols: document.querySelectorAll('[data-ecran="comparer"] [role="radio"][data-col]').length, series: document.querySelectorAll('[data-ecran="comparer"] svg[data-radar] [data-serie]').length }));
    verifier(lu.cols === propose.length && lu.series === propose.length, `${lu.cols} colonnes, ${lu.series} séries au radar (${propose.length} attendues)`);
    const e = await etat();
    verifier(e.brouillon === null && JSON.stringify(e.recette) === departJson, 'Comparer a changé la recette ou ouvert un brouillon');
  });
  // Le « + » de Comparer (colonne +, p4) : Idaho 7, de son stock, en 4ᵉ colonne ; il est retenu à l'ajout.
  await geste('comparer-plus-idaho-7', 'comparer', async () => {
    await toucher('[data-role="ajouter-colonne"]');
    await toucher('[data-ajouter="beermaverick-idaho-7"]');
  }, async () => {
    const lu = await ev(() => ({ cols: [...document.querySelectorAll('[data-ecran="comparer"] [role="radio"][data-col]')].map((c) => c.dataset.col), series: document.querySelectorAll('[data-ecran="comparer"] svg[data-radar] [data-serie]').length }));
    verifier(lu.cols.length === propose.length + 1 && lu.cols.includes('beermaverick-idaho-7') && lu.series === lu.cols.length, `après « + » : colonnes ${lu.cols.join(', ')}, ${lu.series} séries`);
    verifier(await ev(() => document.querySelector('[role="radio"][data-col="beermaverick-idaho-7"]')?.getAttribute('aria-checked') === 'true'), 'Idaho 7 ajouté mais non retenu');
    verifier(JSON.stringify((await etat()).recette) === departJson, 'le « + » de Comparer a changé la recette');
  });

  // 4. Comparer : retenir Idaho 7, « Placer Idaho 7 ».
  // Idaho 7 est retenu à l'ajout : on en retient un autre d'abord (Galaxy), pour que « retenir Idaho 7 » soit un vrai geste.
  await geste('comparer-galaxy-retenu', 'comparer', async () => { await toucher('[role="radio"][data-col="beermaverick-galaxy"]'); }, async () => {
    verifier(await ev(() => document.querySelector('[role="radio"][data-col="beermaverick-galaxy"]')?.getAttribute('aria-checked') === 'true'), 'Galaxy non retenu');
    verifier(await ev(() => document.querySelector('[role="radio"][data-col="beermaverick-idaho-7"]')?.getAttribute('aria-checked') !== 'true'), 'Idaho 7 reste retenu avec Galaxy');
    const pont = await ev(() => document.querySelector('[data-role="pont-placer"]')?.textContent.trim() ?? null);
    verifier(pont && /Placer Galaxy/.test(pont), `le dock devrait dire « Placer Galaxy » : « ${pont} »`);
  });
  await geste('comparer-idaho-retenu', 'comparer', async () => { await toucher('[role="radio"][data-col="beermaverick-idaho-7"]'); }, async () => {
    verifier(await ev(() => document.querySelector('[role="radio"][data-col="beermaverick-idaho-7"]')?.getAttribute('aria-checked') === 'true'), 'Idaho 7 non retenu');
    const pont = await ev(() => document.querySelector('[data-role="pont-placer"]')?.textContent.trim() ?? null);
    verifier(pont && /Placer Idaho 7/.test(pont), `pont du dock : « ${pont} »`);
  });
  let idI7 = null;
  await geste('dryhopper', 'dryhopper', async () => { await toucher('[data-role="pont-placer"]'); }, async () => {
    const e = await etat();
    verifier(e.brouillon && e.brouillon.outil === 'dryhopper', 'Dryhopper sans brouillon');
    idI7 = e.brouillon.ajoutId;
    verifier(/^idaho-7-\d+$/.test(idI7), `Placer n'a pas placé Idaho 7 (${idI7})`);
    verifier(JSON.stringify(e.recette) === departJson, 'la recette a changé avant « Ajouter à ma bière »');
  });

  // 4. Dryhopper : de 60′ au dry hop actif, 2 jours → « Puis la levure ».
  let a60 = null;
  await geste('dryhopper-60', 'dryhopper', async () => { await glisser('.pq-outil-dryhopper [data-role="frise"]', 0.3, 0.0); }, async () => {
    const e = await etat();
    const a = e.brouillon.recette.additions.find((x) => x.id === idI7);
    verifier(a.moment === 'b60' && a.minutes === 60, `moment ${a.moment} ${a.minutes}′ (60′ attendu)`);
    a60 = await ev(() => {
      const ec = document.querySelector('.pq-outil-dryhopper');
      return { ibu: Number(ec.querySelector('[data-role="ibu-dry"]').getAttribute('data-valeur')), moteur: window.__parcours.brouillonLu().ibu.valeur, fl: Number(ec.querySelector('[data-ligne="floral"] [data-nature="simule"]')?.getAttribute('data-valeur')) };
    });
    verifier(Math.abs(a60.ibu - a60.moteur) < 0.01, `IBU affichée ${a60.ibu} ≠ moteur ${a60.moteur}`);
    verifier(a60.ibu > ibu0 + 20, `à 60′ l'IBU devrait monter fort (${ibu0.toFixed(0)} → ${a60.ibu.toFixed(0)})`);
    verifier(JSON.stringify(e.recette) === departJson, 'glisser a changé la recette (seul le brouillon doit bouger)');
  });
  await geste('dryhopper-dry-hop-actif', 'dryhopper', async () => { await glisser('.pq-outil-dryhopper [data-role="frise"]', 0.02, 0.6); }, async () => {
    const a = (await etat()).brouillon.recette.additions.find((x) => x.id === idI7);
    verifier(a.moment === 'dryActive', `moment ${a.moment} (dry hop actif attendu)`);
    const lu = await ev(() => { const ec = document.querySelector('.pq-outil-dryhopper'); return { ibu: Number(ec.querySelector('[data-role="ibu-dry"]').getAttribute('data-valeur')), fl: Number(ec.querySelector('[data-ligne="floral"] [data-nature="simule"]')?.getAttribute('data-valeur')) }; });
    verifier(lu.ibu < a60.ibu, `IBU sans chute : ${a60.ibu.toFixed(0)} → ${lu.ibu.toFixed(0)}`);
    verifier(lu.fl > a60.fl, `floral sans hausse : ${a60.fl} → ${lu.fl}`);
  });
  await geste('dryhopper-2-jours', 'dryhopper', async () => { await toucher('.pq-outil-dryhopper [data-jour="2"]'); }, async () => {
    verifier(await ev(() => document.querySelector('.pq-outil-dryhopper [role="slider"]').getAttribute('aria-valuetext') === 'actif · 2 j'), 'le rail ne dit pas « actif · 2 j »');
    const a = (await etat()).brouillon.recette.additions.find((x) => x.id === idI7);
    verifier(a.moment === 'dryActive' && a.jours === 2, `moment ${a.moment} ${a.jours} j`);
  });

  // 5. Levure : changer de levure, revenir à US-05 → « Ajouter à ma bière ».
  const simuleLevure = () => ev(() => [...document.querySelectorAll('.pq-outil-levure [data-role="simulation"] [data-nature="simule"]')].map((e) => e.textContent.trim()).join('|'));
  let us05 = null;
  await geste('levure', 'levure', async () => { await toucher('[data-role="pont-levure"]'); }, async () => {
    const e = await etat();
    verifier(e.brouillon?.ajoutId === idI7, 'le brouillon n’a pas suivi vers Levure');
    const a = e.brouillon.recette.additions.find((x) => x.id === idI7);
    verifier(a.moment === 'dryActive' && a.jours === 2, `le moment ne suit pas : ${a.moment} ${a.jours} j`);
    verifier(e.brouillon.recette.yeastId === 'fermentis-us05', `levure au départ : ${e.brouillon.recette.yeastId}`);
    verifier(await ev(() => document.querySelector('[data-levure="fermentis-us05"]')?.getAttribute('aria-checked') === 'true'), 'US-05 non cochée au départ');
    us05 = await simuleLevure();
    verifier(us05.length > 0, 'aucune valeur simulée dans Levure');
  });
  await geste('levure-pomona', 'levure', async () => { await toucher('[data-ecran="levure"] [data-levure="lalbrew-pomona"]'); }, async () => {
    const e = await etat();
    verifier(e.brouillon.recette.yeastId === 'lalbrew-pomona', 'Pomona non choisie dans le brouillon');
    verifier(e.recette.yeastId === 'fermentis-us05', 'la recette a changé de levure avant « Ajouter à ma bière »');
    verifier((await simuleLevure()) !== us05, 'aucune valeur simulée ne bouge avec Pomona');
  });
  await geste('levure-retour-us05', 'levure', async () => { await toucher('[data-ecran="levure"] [data-levure="fermentis-us05"]'); }, async () => {
    verifier((await etat()).brouillon.recette.yeastId === 'fermentis-us05', 'US-05 non rechoisie');
    verifier((await simuleLevure()) === us05, 'revenue à US-05, la simulation n’est pas celle du départ');
  });
  await geste('ma-biere-recalculee', 'ma-biere', async () => { await toucher('[data-role="pont-ajouter"]'); await pause(200); }, async () => {
    const e = await etat();
    verifier((await hash()) === '#/ma-biere', `après Ajouter : ${await hash()}`);
    verifier(e.brouillon === null, 'brouillon resté ouvert après Ajouter');
    const a = e.recette.additions.find((x) => x.id === idI7);
    verifier(a && a.hopKey === 'beermaverick-idaho-7' && a.moment === 'dryActive' && a.jours === 2 && a.grams === 80, `Idaho 7 non inscrit au moment choisi : ${JSON.stringify(a)}`);
    verifier(e.recette.yeastId === 'fermentis-us05', `levure de la recette : ${e.recette.yeastId}`);
    // L12 : ce qui a changé se lit à l'écran, pas seulement dans l'état.
    const ligne = await ev((id) => document.querySelector(`[data-ecran="ma-biere"] [data-ajout="${id}"]`)?.textContent.replace(/\s+/g, ' ').trim() ?? null, idI7);
    verifier(ligne && /Idaho 7/.test(ligne), `la ligne Idaho 7 n'apparaît pas dans Ma bière (${ligne})`);
    verifier(/dry|actif|jour|\bj\b/i.test(ligne), `la ligne Idaho 7 ne dit pas son moment : « ${ligne} »`);
    const levure = await ev(() => document.querySelector('[data-role="pont-etape-levure"]')?.textContent.replace(/\s+/g, ' ').trim() ?? null);
    verifier(levure && /US-05|US05/i.test(levure), `la levure n'est pas lisible dans Ma bière : « ${levure} »`);
    const ibu = await lectureCoherente('après Ajouter');
    verifier(ibu <= ibu0 + 0.5, `l'IBU a monté (${ibu0.toFixed(1)} → ${ibu.toFixed(1)}) pour un dry hop`);
    const floral = await floralMoteur(), vu = await floralVu();
    verifier(floral > floral0, `floral non recalculé (${floral0} → ${floral})`);
    verifier(vu > floralVu0 + 0.01, `la barre floral n'a pas grandi à l'écran (${floralVu0.toFixed(3)} → ${vu.toFixed(3)})`);
    verifier(await ev(() => !!document.querySelector('[data-ecran="ma-biere"] [data-barre="floral"] [data-role="avant"]')), 'le rond « avant » du floral manque : le changement ne se voit pas');
    await inconnusTenus('après Ajouter');
    notes.push(`${L} : après Idaho 7, IBU ${ibu0.toFixed(1)} → ${ibu.toFixed(1)}, floral ${floral0.toFixed(1)} → ${floral.toFixed(1)} (barre ${floralVu0.toFixed(2)} → ${vu.toFixed(2)})`);
  });
  const ibuAvant = await ibuMoteur();
  const avantSubstituer = JSON.stringify((await etat()).recette);

  // 6. Nugget → Substituer → un remplaçant → « Remplacer » → Ma bière.
  await geste('substituer', 'substituer', async () => {
    await toucher('[data-ecran="ma-biere"] [data-role="pont-substituer"][data-houblon="beermaverick-nugget"]');
  }, async () => {
    verifier(await ev(() => /Nugget/.test(document.querySelector('[data-ecran="substituer"] [data-role="epingle"]')?.textContent ?? '')), 'Nugget non épinglé en colonne 1');
    // u4 (r6) : huit remplaçants (les cinq premiers du catalogue, les trois premiers du stock), tous tirés du moteur
    // (substitutes), rangés par le pire cas (bas de plage, data-min) ; plus l'ordre seul du moteur.
    const lu = await ev(() => {
      const montre = [...document.querySelectorAll('[data-ecran="substituer"] [data-remplacant]')].map((e) => ({ cle: e.dataset.remplacant, min: Number(e.dataset.min) }));
      const moteur = window.__parcours.moteur.remplacants(window.__parcours.etat.brouillon.recette, 'a1', 400).map((r) => r.cle);
      return { montre, moteur };
    });
    const hors = lu.montre.filter((x) => !lu.moteur.includes(x.cle)).map((x) => x.cle);
    verifier(lu.montre.length >= 4 && lu.montre.length <= 8 && !hors.length, `remplaçants ${lu.montre.map((x) => x.cle).join(',')} (hors moteur : ${hors.join(',') || 'aucun'})`);
    verifier(lu.montre.every((x, i, t) => i === 0 || x.min <= t[i - 1].min), `remplaçants pas rangés par le pire cas : ${lu.montre.map((x) => x.min).join(',')}`);
  });
  let remplacant = null;
  await geste('substituer-choix', 'substituer', async () => {
    // Un remplaçant est déjà choisi à l'ouverture (la bande cochée) : on en touche un autre de l'échelle, pour que le geste change quelque chose.
    remplacant = await ev(() => {
      const choix = document.querySelector('[data-ecran="substituer"] [role="radio"][data-col][aria-checked="true"]')?.dataset.col;
      return [...document.querySelectorAll('[data-ecran="substituer"] [data-remplacant]')].map((e) => e.dataset.remplacant).find((c) => c !== choix);
    });
    await toucher(`[data-ecran="substituer"] [data-remplacant="${remplacant}"]`);
  }, async () => {
    const lu = await ev((c) => ({ coche: document.querySelector(`[data-ecran="substituer"] [role="radio"][data-col="${c}"]`)?.getAttribute('aria-checked'), dock: document.querySelector('[data-role="choix-dock"]')?.textContent ?? '', nom: document.querySelector(`[data-remplacant="${c}"]`)?.dataset.houblonRang ?? '' }), remplacant);
    verifier(lu.coche === 'true' && lu.nom && lu.dock.includes(lu.nom), `choix non pris (${lu.nom} / ${lu.dock})`);
    verifier(JSON.stringify((await etat()).recette) === avantSubstituer, 'choisir un remplaçant a changé la recette avant « Remplacer »');
  });
  await geste('ma-biere-remplacee', 'ma-biere', async () => { await toucher('[data-role="pont-remplacer"]'); await pause(200); }, async () => {
    const e = await etat();
    const a1 = e.recette.additions.find((x) => x.id === 'a1');
    verifier(a1 && a1.hopKey === remplacant, `Nugget non remplacé par ${remplacant} (${a1?.hopKey})`);
    verifier(e.brouillon === null, 'brouillon resté ouvert après Remplacer');
    verifier(e.recette.additions.some((x) => x.id === idI7), 'Idaho 7 a disparu au remplacement');
    const ibu = await lectureCoherente('après Remplacer');
    verifier(Math.abs(ibu - ibuAvant) <= 0.5, `remplacement hors IBU égal à 0,5 près : ${ibuAvant.toFixed(2)} → ${ibu.toFixed(2)}`);
    const ligne = await ev(() => document.querySelector('[data-ecran="ma-biere"] [data-ajout="a1"]')?.textContent.replace(/\s+/g, ' ').trim() ?? '');
    const nom = await ev((c) => window.__parcours.moteur.houblon(c).nom, remplacant);
    verifier(ligne.includes(nom), `la ligne de a1 ne montre pas ${nom} : « ${ligne} »`);
    verifier(await ev(() => /Nugget/.test(document.querySelector('[data-ecran="ma-biere"] [data-ajout="a1"] [data-role="vient-de-changer"]')?.textContent ?? '')), 'pas de repère « à la place de Nugget »');
    await inconnusTenus('après Remplacer');
    notes.push(`${L} : Nugget → ${nom}, IBU ${ibuAvant.toFixed(2)} → ${ibu.toFixed(2)}`);
  });

  // 7. La croix d'un outil abandonne son brouillon et ramène à l'étape Houblons (D118) ; la recette ne change pas.
  const avantAbandon = JSON.stringify((await etat()).recette);
  await geste('abandon-suggerer', 'suggerer', async () => { await toucher('[data-role="pont-floral"]'); });
  await geste('abandon-comparer', 'comparer', async () => { await toucher('[data-role="pont-comparer"]'); });
  await geste('abandon-dryhopper', 'dryhopper', async () => { await toucher('[data-role="pont-placer"]'); }, async () => {
    verifier((await etat()).brouillon?.outil === 'dryhopper', 'pas de brouillon Dryhopper');
  });
  await geste('abandon-glisser', 'dryhopper', async () => { await glisser('.pq-outil-dryhopper [data-role="frise"]', 0.6, 0.3); }, async () => {
    const e = await etat();
    verifier(e.brouillon !== null, 'le brouillon a disparu pendant le geste');
    verifier(JSON.stringify(e.recette) === avantAbandon, 'glisser dans l’outil a changé la recette');
  });
  await geste('abandon-fermer', 'ma-biere', async () => { await fermerOutil(); await pause(200); }, async () => {
    const e = await etat();
    verifier(e.brouillon === null, 'la croix n’a pas abandonné le brouillon');
    verifier((await hash()) === '#/ma-biere', `la croix ne ramène pas à l’étape Houblons (D118) : ${await hash()}`);
    verifier(JSON.stringify(e.recette) === avantAbandon, 'la croix a changé la recette');
    verifier(await ev(() => document.querySelectorAll('[data-ecran="ma-biere"] [data-ajout]').length) === e.recette.additions.length, 'Ma bière montre un autre nombre de houblons que la recette');
    await lectureCoherente('après l’abandon');
  });

  // 8. « Recommencer » rend la recette du départ.
  await geste('recommencer', 'ma-biere', async () => { await toucher('[data-role="recommencer"]'); await pause(200); }, async () => {
    const e = await etat();
    verifier(JSON.stringify(e.recette) === departJson, 'Recommencer n’a pas rendu la recette du départ');
    verifier(JSON.stringify(e.aComparer) === JSON.stringify(depart.aComparer), `Recommencer garde la liste de comparaison : ${e.aComparer.join(', ')} (départ : ${depart.aComparer.join(', ') || 'vide'})`);
    verifier(e.brouillon === null && (await hash()) === '#/ma-biere', `après Recommencer : brouillon ${e.brouillon}, route ${await hash()}`);
    const ibu = await lectureCoherente('après Recommencer');
    verifier(Math.abs(ibu - ibu0) < 0.01, `IBU ${ibu.toFixed(2)} ≠ départ ${ibu0.toFixed(2)}`);
    verifier(await ev((id) => !document.querySelector(`[data-ecran="ma-biere"] [data-ajout="${id}"]`), idI7), 'la ligne Idaho 7 reste à l’écran');
    verifier(await ev(() => !document.querySelector('[data-ecran="ma-biere"] [data-role="vient-de-changer"]')), 'un repère de changement reste après Recommencer');
    const vu = await floralVu();
    verifier(Math.abs(vu - floralVu0) < 0.005, `la barre floral n'est pas revenue (${floralVu0.toFixed(3)} → ${vu.toFixed(3)})`);
    await inconnusTenus('après Recommencer');
  });

  // Le recalcul : Ma bière relue par le moteur pour un état neuf (lireBiere, cache manqué).
  const ms = await ev(() => window.__parcours.mesures().filter((m) => !m.cache && m.nom === 'lireBiere').map((m) => m.ms));
  resume.recalculs.push(...ms);
  if (erreurs.length) throw new Error(erreurs.join(' ; '));
  await page.close();
  void etapeNom;
}

for (const f of FORMATS) {
  try { await jouer(f); } catch (e) {
    echecs.push(`${f.largeur} : ${e.message}`);
  }
}
const pages = await nav.pages();
void pages;
const mediane = (xs) => { const t = [...xs].sort((a, b) => a - b); return t.length ? t[Math.floor(t.length / 2)] : null; };
const fmt = (x) => (x == null ? '?' : x.toFixed(1).replace('.', ','));
for (const L of Object.keys(resume.parGeste)) {
  const xs = resume.parGeste[L].map((g) => g.ms);
  console.log(`recalcul ${L} : ${xs.length} gestes qui recalculent, médiane ${fmt(mediane(xs))} ms, max ${fmt(Math.max(...xs))} ms par geste (${resume.parGeste[L].map((g) => `${g.etape} ${fmt(g.ms)}`).join(' ; ')})`);
}
for (const t of notes) console.log(`note ${t}`);
const g = (L) => resume.gestes[L] ?? 0;
const medRecalcul = mediane(resume.recalculs);
if (echecs.length) {
  console.log(`PARCOURS ECHEC (${echecs.length})`);
  for (const e of echecs) console.log(`- ${e}`);
  await nav.close();
  process.exit(1);
}
console.log(`PARCOURS OK (${g(390)} gestes à 390, ${g(1280)} à 1280, recalcul médian ${fmt(medRecalcul)} ms)`);
await nav.close();
process.exit(0);
