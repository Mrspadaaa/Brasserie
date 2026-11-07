// Test d'écran de l'étape Fermentescibles sur l'instantané servi (port 4319). Hors dépôt : puppeteer-core résolu depuis le package.json du dépôt.
// Sortie : captures/*.png (ce qu'il voit, viewport) et mesures.json (par capture : débordement, textes bruts, pied, console, champs).
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const RACINE = 'C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie';
const require = createRequire(RACINE + '/package.json');
const puppeteer = require('puppeteer-core');
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const BASE = 'http://localhost:4319';
const OUT = 'C:/Users/mrspa/AppData/Local/Temp/affinee-test-ferm/captures';
fs.mkdirSync(OUT, { recursive: true });
const seuls = process.argv.slice(2).filter((a) => !a.startsWith('--'));

const MODES = {
  t390: { l: 390, h: 844, tactile: true, echelle: 2 },
  pc1280: { l: 1280, h: 800, tactile: false, echelle: 1 },
};
const dormir = (ms) => new Promise((r) => setTimeout(r, ms));
const mesures = {};
const local = (u) => /^(https?|ws)s?:\/\/(localhost|127\.0\.0\.1)(:\d+)?(\/|$)/i.test(u) || /^(data|blob|about|file):/i.test(u);

async function ouvrir(navigateur, modeId, theme, url) {
  const m = MODES[modeId];
  const p = await navigateur.newPage();
  await p.setViewport({ width: m.l, height: m.h, isMobile: m.tactile, hasTouch: m.tactile, deviceScaleFactor: m.echelle });
  p.journal = { console: [], erreurs: [], bloquees: [] };
  p.on('console', (c) => { if (['error', 'warning'].includes(c.type())) p.journal.console.push(`${c.type()} : ${c.text().slice(0, 200)}`); });
  p.on('pageerror', (e) => p.journal.erreurs.push(String(e.message).slice(0, 200)));
  await p.setRequestInterception(true);
  p.on('request', (r) => { if (local(r.url())) r.continue(); else { p.journal.bloquees.push(r.url()); r.abort('blockedbyclient'); } });
  await p.evaluateOnNewDocument((t) => { try { localStorage.setItem('laffinee.theme', t); } catch {} }, theme);
  p.setDefaultNavigationTimeout(90000);
  p.mode = m; p.modeId = modeId; p.theme = theme;
  await p.goto(url, { waitUntil: 'networkidle0' });
  return p;
}
async function attendreBanc(p, etat) {
  await p.waitForFunction((e) => document.body.dataset.apercu === (e || 'repos') && document.querySelector('[data-etape="fermentescibles"]'), { timeout: 60000 }, etat);
  await p.evaluate(() => document.fonts.ready);
  await dormir(400);
}
const banc = async (nav, modeId, theme, etat = '') => {
  const p = await ouvrir(nav, modeId, theme, `${BASE}/?dev-local&etape=houblons&recette=vide&malts=${etat || 'maquette'}`);
  await attendreBanc(p, etat);
  return p;
};
const el = async (p, sel) => { const h = await p.$(sel); if (!h) throw new Error('introuvable : ' + sel); return h; };
const toucher = async (p, sel) => { const h = await el(p, sel); if (p.mode.tactile) await h.tap(); else await h.click(); await dormir(350); };
const toucherTexte = async (p, ...textes) => { const h = await p.evaluateHandle((ts) => [...document.querySelectorAll('button, a, [role=button]')].find((b) => ts.includes((b.textContent ?? '').replace(/s+/g, ' ').trim())), textes); const e = h.asElement(); if (!e) throw new Error('texte introuvable : ' + textes.join(' / ')); if (p.mode.tactile) await e.tap(); else await e.click(); await dormir(350); };

async function mesurer(p) {
  return p.evaluate(() => {
    const w = innerWidth, h = innerHeight;
    const larges = [...document.querySelectorAll('body *')].filter((e) => { const r = e.getBoundingClientRect(); return r.width > 0 && (r.right > w + 1 || r.left < -1) && getComputedStyle(e).position !== 'fixed'; })
      .slice(0, 5).map((e) => `${e.tagName.toLowerCase()}.${String(e.className).split(' ')[0]} (${Math.round(e.getBoundingClientRect().left)}→${Math.round(e.getBoundingClientRect().right)})`);
    const texte = document.body.innerText;
    const bruts = (texte.match(/\b(NaN|undefined|Infinity|null)\b/g) ?? []);
    const pied = [...document.querySelectorAll('button')].find((b) => /^Suivant/.test(b.textContent ?? ''));
    const bal = document.querySelector('[data-role="bal"]');
    const act = document.activeElement;
    const nombres = document.querySelectorAll('input[type="number"]').length;
    const main = document.querySelector('main');
    return {
      scrollX: document.scrollingElement.scrollWidth > w + 1 ? document.scrollingElement.scrollWidth : 0,
      larges, bruts: [...new Set(bruts)],
      piedBas: pied ? Math.round(pied.getBoundingClientRect().bottom) : null, h,
      balBas: bal && !bal.hidden ? Math.round(bal.getBoundingClientRect().bottom) : null,
      actif: act ? `${act.tagName.toLowerCase()}[${act.getAttribute('data-role') ?? act.getAttribute('aria-label') ?? ''}]` : '',
      actifBas: act && act !== document.body ? Math.round(act.getBoundingClientRect().bottom) : null,
      inputsNumber: nombres,
      mainDefile: main ? main.scrollHeight - main.clientHeight : null,
      bandeau: document.querySelector('.recipe-metrics')?.innerText.replace(/\s+/g, ' ').trim() ?? null,
      lignes: [...document.querySelectorAll('[data-sel]')].map((li) => li.innerText.replace(/\s+/g, ' ').trim().slice(0, 90)),
      plateau: bal && !bal.hidden ? bal.innerText.replace(/\s+/g, ' ').trim().slice(0, 160) : null,
      alertes: document.querySelector('[data-role="alertes"]')?.innerText.trim() ?? '',
      reps: document.querySelector('[data-role="reps"]')?.innerText.replace(/\s+/g, ' ').trim().slice(0, 120) ?? null,
      tuiles: [...document.querySelectorAll('[data-role="puces"] [data-role="resultat"], [data-role="puces"] [data-role="creer"]')].map((e) => e.innerText.replace(/\s+/g, ' ').trim().slice(0, 50)),
    };
  });
}
async function photo(p, nom, { pleine = false } = {}) {
  const f = `${nom}-${p.modeId}-${p.theme}${pleine ? '-pleine' : ''}.png`;
  await p.screenshot({ path: path.join(OUT, f), fullPage: pleine });
  const m = await mesurer(p);
  mesures[f] = { ...m, console: p.journal.console.slice(-5), erreurs: p.journal.erreurs.slice(-3) };
  console.log(`  ${f} : pied ${m.piedBas}/${m.h}, scrollX ${m.scrollX}, larges ${m.larges.length}, bruts ${m.bruts.join(',') || '-'}, actif ${m.actif}, n° ${m.inputsNumber}`);
  return f;
}
async function glisserBarre(p, sel, de, a) {
  const b = await (await el(p, sel)).boundingBox();
  const y = b.y + b.height / 2, x0 = b.x + b.width * de, x1 = b.x + b.width * a;
  if (p.mode.tactile) { await p.touchscreen.touchStart(x0, y); for (let s = 1; s <= 8; s++) { await p.touchscreen.touchMove(x0 + ((x1 - x0) * s) / 8, y); await dormir(30); } }
  else { await p.mouse.move(x0, y); await p.mouse.down(); await p.mouse.move(x1, y, { steps: 8 }); }
  await dormir(300);
  return async () => { if (p.mode.tactile) await p.touchscreen.touchEnd(); else await p.mouse.up(); await dormir(300); };
}

// ------------------------------------------------------------------------------------------------------------------ scènes
const SCENES = {
  // Le vrai chemin : menu → Actions rapides → Créer une recette → fil « Malts/sucres », stock vide (aucune donnée sans jeton).
  async menu(nav, modeId, theme) {
    const p = await ouvrir(nav, modeId, theme, `${BASE}/?dev-local`);
    await dormir(1500);
    await photo(p, '00-accueil');
    await toucher(p, 'button[aria-label^="Actions rapides"]');
    await toucherTexte(p, 'Créer une recette');
    await dormir(800);
    await photo(p, '01-wizard-identite');
    await toucher(p, 'nav[aria-label="Étapes"] button[aria-label="Fermentescibles"]');
    await dormir(600);
    await photo(p, '02-menu-malts-vide');
    await toucher(p, '[data-role="ajout"]');
    await dormir(400);
    await photo(p, '03-menu-vide-ouverture');
    await p.keyboard.type('Pilsner Malz', { delay: 20 }); await dormir(400);
    await photo(p, '04-menu-vide-creer');
    await p.keyboard.press('Enter'); await dormir(600);
    await photo(p, '05-menu-vide-cree');
    await p.keyboard.type('5', { delay: 20 }); await p.keyboard.press('Enter'); await dormir(500);
    await photo(p, '06-menu-masse-5');
    // rechargement : le brouillon revient-il ?
    await p.reload({ waitUntil: 'networkidle0' }); await dormir(1500);
    await photo(p, '07-menu-rechargement');
    await p.close();
  },
  async repos(nav, modeId, theme) {
    const p = await banc(nav, modeId, theme);
    await photo(p, '10-repos');
    await photo(p, '10-repos', { pleine: true });
    await p.close();
  },
  async ouverture(nav, modeId, theme) {
    const p = await banc(nav, modeId, theme);
    await toucher(p, '[data-role="ajout"]');
    await p.waitForSelector('.fer-tu', { timeout: 8000 }).catch(() => {});
    await dormir(300);
    await photo(p, '11-ouverture');
    for (const [n, t] of [['12-mu', 'mu'], ['13-pils', 'pils'], ['14-abbey', 'Abbey Malt'], ['15-cara03', 'cara 0,3'], ['16-dext-en-grain', 'dext'], ['17-une-lettre', 'c']]) {
      await p.keyboard.down('Control'); await p.keyboard.press('a'); await p.keyboard.up('Control'); await p.keyboard.press('Backspace');
      await p.keyboard.type(t, { delay: 20 }); await dormir(350);
      await photo(p, n);
    }
    await p.keyboard.down('Control'); await p.keyboard.press('a'); await p.keyboard.up('Control'); await p.keyboard.press('Backspace');
    await p.keyboard.type('Munich', { delay: 20 }); await p.keyboard.press('Enter'); await dormir(600);
    await photo(p, '18-munich-ajoute');
    await p.keyboard.type('2,5', { delay: 20 }); await dormir(300);
    await photo(p, '19-munich-masse-pendant');
    await p.keyboard.press('Enter'); await dormir(400);
    await photo(p, '20-munich-masse-apres');
    await p.close();
  },
  async masse(nav, modeId, theme) {
    const p = await banc(nav, modeId, theme);
    await toucher(p, '[data-kl="0"]');
    await photo(p, '21-masse-touchee');
    await p.keyboard.type('7', { delay: 20 }); await dormir(300);
    await photo(p, '22-masse-7-pendant');
    await p.keyboard.press('Enter'); await dormir(400);
    await photo(p, '23-masse-7-apres');
    await toucher(p, '[data-kl="1"]'); await p.keyboard.type('99999', { delay: 15 }); await p.keyboard.press('Enter'); await dormir(400);
    await photo(p, '24-masse-99999');
    await toucher(p, '[data-kl="1"]'); await p.keyboard.type('abc', { delay: 15 }); await p.keyboard.press('Enter'); await dormir(400);
    await photo(p, '25-masse-abc');
    await toucher(p, '[data-kl="2"]'); await p.keyboard.press('Backspace'); await dormir(200); await p.keyboard.press('Enter'); await dormir(400);
    await photo(p, '26-masse-videe');
    await toucher(p, '[data-kl="2"]'); await p.keyboard.type('0,004', { delay: 15 }); await p.keyboard.press('Enter'); await dormir(400);
    await photo(p, '27-masse-0004');
    const fin = await glisserBarre(p, '[data-sel="0"] [data-role="masse-curseur"]', 0.3, 0.9);
    await photo(p, '28-barre-pendant');
    await fin();
    await photo(p, '29-barre-apres');
    await p.close();
  },
  async moment(nav, modeId, theme) {
    const p = await banc(nav, modeId, theme);
    await toucher(p, '[data-ml="1"]');
    await photo(p, '30-moment-ebullition');
    await toucher(p, '[data-ml="1"]');
    await photo(p, '31-moment-fermentation');
    await toucher(p, '[data-jl="1"]'); await p.keyboard.type('30', { delay: 20 }); await p.keyboard.press('Enter'); await dormir(300);
    await photo(p, '32-jour-30');
    await toucher(p, '[data-role="annuler-moment"]');
    await photo(p, '33-moment-annule');
    await toucher(p, '[data-sel="1"] [data-role="nom"]');
    await toucher(p, '[data-role="bal"] .fer-bmo');
    await photo(p, '34-plateau-moment-tourne');
    await p.close();
  },
  async couleur(nav, modeId, theme) {
    const p = await banc(nav, modeId, theme);
    await toucher(p, '[data-cl="0"]');
    await photo(p, '40-couleur-champ');
    await p.keyboard.type('4', { delay: 30 }); await dormir(250);
    await photo(p, '41-couleur-4-pendant');
    await p.keyboard.press('Enter'); await dormir(400);
    await photo(p, '42-couleur-4-apres');
    await toucher(p, '[data-role="arens"]');
    await photo(p, '43-arenseigner-chaine');
    await p.keyboard.type('2000', { delay: 20 }); await p.keyboard.press('Enter'); await dormir(300);
    await photo(p, '44-couleur-2000');
    await p.keyboard.type('3', { delay: 20 }); await p.keyboard.press('Enter'); await dormir(300);
    await photo(p, '45-couleur-suite');
    await p.keyboard.type('2', { delay: 20 }); await p.keyboard.press('Enter'); await dormir(500);
    await photo(p, '46-couleurs-toutes');
    await p.close();
  },
  async retrait(nav, modeId, theme) {
    const p = await banc(nav, modeId, theme);
    await toucher(p, '[data-ret="1"]');
    await photo(p, '50-retrait');
    await toucher(p, '[data-role="annuler"]');
    await photo(p, '51-retrait-annule');
    await toucher(p, '[data-ret="0"]'); await toucher(p, '[data-ret="0"]');
    await photo(p, '52-deux-retraits');
    await toucher(p, '[data-ret="0"]'); await dormir(300);
    await photo(p, '53-tout-retire');
    await dormir(6500);
    await photo(p, '54-apres-6s');
    await p.close();
  },
  async plateau(nav, modeId, theme) {
    const p = await banc(nav, modeId, theme);
    for (let k = 0; k < 3; k++) await toucher(p, '[data-role="bal"] [aria-label="Ajouter un cran"]');
    await toucher(p, '[data-role="bal"] [aria-label="Retirer un cran"]');
    await photo(p, '60-plateau-plus-moins');
    const b = await (await el(p, '[data-role="piste"]')).boundingBox();
    if (p.mode.tactile) await p.touchscreen.tap(b.x + b.width * 0.8, b.y + b.height / 2); else await p.mouse.click(b.x + b.width * 0.8, b.y + b.height / 2);
    await dormir(400);
    await photo(p, '61-piste-80pc');
    await toucher(p, '[data-role="bin"]'); await p.keyboard.type('12', { delay: 20 }); await p.keyboard.press('Enter'); await dormir(400);
    await photo(p, '62-plateau-masse-12');
    await toucher(p, '[data-role="bteinte"]'); await p.keyboard.type('5', { delay: 20 }); await dormir(250);
    await photo(p, '63-plateau-ebc-pendant');
    await p.keyboard.press('Enter'); await dormir(400);
    await photo(p, '64-plateau-ebc-apres');
    await toucher(p, '[data-role="fiche"]');
    await photo(p, '65-fiche-ouverte');
    await toucher(p, '[data-role="fiche-zone"] input[aria-label^="Potentiel"]'); await p.keyboard.type('37', { delay: 20 }); await p.keyboard.press('Tab'); await dormir(400);
    await photo(p, '66-fiche-ppg-37');
    await toucher(p, '[data-role="bal"] .fer-del');
    await photo(p, '67-corbeille');
    await p.close();
  },
  async sucre(nav, modeId, theme) {
    const p = await banc(nav, modeId, theme, 'sucre');
    await toucher(p, '[data-sel="3"] [data-role="nom"]');
    await photo(p, '70-sucre');
    await toucher(p, '[data-ml="3"]'); await toucher(p, '[data-ml="3"]');
    await photo(p, '71-sucre-empatage');
    await p.close();
  },
  async fruit(nav, modeId, theme) {
    const p = await banc(nav, modeId, theme, 'fruit');
    await toucher(p, '[data-sel="3"] [data-role="nom"]');
    await photo(p, '72-fruit');
    const r = await el(p, '[data-role="bal"] input[type="range"]');
    await r.focus(); for (let k = 0; k < 11; k++) await p.keyboard.press('ArrowRight'); await dormir(300);
    await photo(p, '73-fruit-j14');
    await toucher(p, '[data-jl="3"]'); await p.keyboard.type('0', { delay: 20 }); await p.keyboard.press('Enter'); await dormir(300);
    await photo(p, '74-fruit-j0');
    await p.close();
  },
  async huit(nav, modeId, theme) {
    const p = await banc(nav, modeId, theme, 'huit');
    await photo(p, '80-huit');
    await photo(p, '80-huit', { pleine: true });
    await toucher(p, '[data-sel="7"] [data-role="nom"]');
    await photo(p, '81-huit-lactose');
    await toucher(p, '[data-role="pli"]');
    await photo(p, '82-huit-reperes-ouverts');
    await p.close();
  },
  async familles(nav, modeId, theme) {
    const p = await banc(nav, modeId, theme);
    for (const [n] of [['90-fam-sucre'], ['91-fam-lactose'], ['92-fam-fruit'], ['93-fam-extrait'], ['94-fam-grain']]) {
      await toucher(p, '[data-role="fam"]');
      await toucher(p, '[data-role="ajout"]'); await dormir(300);
      await photo(p, n);
      await p.keyboard.press('Escape'); await dormir(200);
    }
    await toucher(p, '[data-role="fam"]'); await toucher(p, '[data-role="ajout"]'); await p.keyboard.type('Dextrose', { delay: 20 }); await p.keyboard.press('Enter'); await dormir(500);
    await photo(p, '95-sucre-ajoute');
    await toucher(p, '[data-role="fam"]'); await toucher(p, '[data-role="fam"]'); await toucher(p, '[data-role="fam"]'); await toucher(p, '[data-role="ajout"]'); await p.keyboard.type('Purée de mangue', { delay: 20 }); await p.keyboard.press('Enter'); await dormir(500);
    await photo(p, '96-fruit-cree');
    await p.close();
  },
  async beaucoup(nav, modeId, theme) {
    const p = await banc(nav, modeId, theme, 'huit');
    for (let k = 1; k <= 10; k++) {
      await toucher(p, '[data-role="ajout"]'); await p.keyboard.type(`Malt essai ${k}`, { delay: 5 }); await p.keyboard.press('Enter'); await dormir(250);
      await p.keyboard.type('0,2', { delay: 5 }); await p.keyboard.press('Enter'); await dormir(150);
    }
    await photo(p, '97-dix-huit-lignes');
    await photo(p, '97-dix-huit-lignes', { pleine: true });
    await p.close();
  },
  async appuiLong(nav, modeId, theme) {
    const p = await banc(nav, modeId, theme);
    const b = await (await el(p, '[data-sel="1"] [data-role="nom"]')).boundingBox();
    if (p.mode.tactile) { await p.touchscreen.touchStart(b.x + 10, b.y + b.height / 2); await dormir(900); await p.touchscreen.touchEnd(); }
    else { await p.mouse.move(b.x + 10, b.y + b.height / 2); await p.mouse.down(); await dormir(900); await p.mouse.up(); }
    await dormir(400);
    await photo(p, '98-appui-long-nom');
    await p.close();
  },
  async horsLigne(nav, modeId, theme) {
    const p = await banc(nav, modeId, theme);
    await p.setOfflineMode(true); await dormir(500);
    await toucher(p, '[data-role="ajout"]'); await p.keyboard.type('Carahell', { delay: 20 }); await p.keyboard.press('Enter'); await dormir(500);
    await p.keyboard.type('1', { delay: 20 }); await p.keyboard.press('Enter'); await dormir(600);
    await photo(p, '99-hors-ligne');
    await p.close();
  },
};

const PLAN = [
  ['menu', 't390', 'clair'], ['menu', 'pc1280', 'clair'],
  ['repos', 't390', 'clair'], ['repos', 't390', 'cave'], ['repos', 'pc1280', 'clair'], ['repos', 'pc1280', 'cave'],
  ['ouverture', 't390', 'clair'], ['ouverture', 't390', 'cave'], ['ouverture', 'pc1280', 'clair'],
  ['masse', 't390', 'clair'], ['masse', 'pc1280', 'clair'],
  ['moment', 't390', 'clair'], ['moment', 't390', 'cave'],
  ['couleur', 't390', 'clair'], ['couleur', 'pc1280', 'cave'],
  ['retrait', 't390', 'clair'],
  ['plateau', 't390', 'clair'], ['plateau', 't390', 'cave'], ['plateau', 'pc1280', 'clair'],
  ['sucre', 't390', 'clair'], ['sucre', 't390', 'cave'],
  ['fruit', 't390', 'clair'], ['fruit', 'pc1280', 'clair'],
  ['huit', 't390', 'clair'], ['huit', 't390', 'cave'], ['huit', 'pc1280', 'clair'],
  ['familles', 't390', 'clair'],
  ['beaucoup', 't390', 'clair'],
  ['appuiLong', 't390', 'clair'],
  ['horsLigne', 't390', 'clair'],
];

const nav = await puppeteer.launch({ executablePath: CHROME, headless: true });
const echecs = [];
for (const [s, m, t] of PLAN) {
  if (seuls.length && !seuls.includes(s)) continue;
  console.log(`\n== ${s} ${m} ${t}`);
  try { await SCENES[s](nav, m, t); }
  catch (e) { echecs.push(`${s} ${m} ${t} : ${String(e.message).split('\n')[0]}`); console.log('  ECHEC ' + String(e.message).split('\n')[0]); }
}
await nav.close();
fs.writeFileSync(path.join(OUT, '..', 'mesures.json'), JSON.stringify(mesures, null, 1));
console.log(`\n${Object.keys(mesures).length} captures ; ${echecs.length} scènes en échec`);
for (const e of echecs) console.log('  - ' + e);
