// s2-sources-une-fois (26.10, D168 à D170) : un vrai parcours dans Chrome (390 × 844, fixtures ?dev-local, aucune donnée réelle).
// Ses mots sur la carte de Lotus : « Tu as ajouté à beaucoup beaucoup trop d'endroits les sources. », « cette vue doit se fermer
// quand on ouvre ou change de vue », « sur les infos de houblons, un endroit qui renvoie la source suffit ».
// Contrôles :
//  A. carte de Lotus dépliée : aucun nom de source au premier plan ni au survol ; plus de mot anglais dans ses mots par famille ;
//  B. une seule carte dépliée à la fois (une autre carte, une ligne d'ajout rapide) ;
//  C. changer de vue (Substituer, la fiche) ferme la carte, et la vue retrouvée la rend fermée ;
//  D. la fiche (hors de sa section « Sources ») : aucun nom de source ; la section « Sources » garde le lien Beer Maverick ;
//  E. Substituer : aucun nom de source au premier plan d'une rangée ni au survol ;
//  F. Comparer (Valeurs) : aucun nom de source à côté d'une valeur.
// Usage (racine) : node scripts/with_server.mjs --server "npm run dev -- --port 5251 --strictPort" --port 5251 --env VITE_HOP_V4=on -- node tests/integration/controle-sources-une-fois.mjs [--suffixe=apres] [--captures]
// Les captures vont dans work/missions/2026-10-25-integration-houblons/voies/s2-sources-une-fois/img/ (avec --captures).
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const RACINE = path.resolve(import.meta.dirname, '..', '..');
const { ouvrir } = await import(pathToFileURL(path.join(RACINE, '.claude/skills/webapp-testing/examples/_lanceur.mjs')).href);
const IMG = path.join(RACINE, 'work/missions/2026-10-25-integration-houblons/voies/s2-sources-une-fois/img');
const arg = (n, d) => process.argv.find((a) => a.startsWith(`--${n}=`))?.split('=').slice(1).join('=') ?? d;
const SUF = arg('suffixe', 'apres');
const CAPTURES = process.argv.includes('--captures');
if (CAPTURES) fs.mkdirSync(IMG, { recursive: true });
const dormir = (ms) => new Promise((r) => setTimeout(r, ms));
const base = `http://localhost:${process.env.WITH_SERVER_PORTS}`;

// Les noms de sources connus (le brasseur : « un endroit qui renvoie la source suffit »).
const NOMS = String.raw`Beer ?Maverick|Hopsteiner|Charles ?Faram|Yakima|YCH\b|Barth ?Haas|John I\.? Haas|Hop Products|NZ Hops|Freestyle|Crosby|Beer ?Analytics|Brewer.s Friend|British Hop|HopDatabase|Hops ?Direct|hops-json|Hopslist|Indie Hops|USA Hops|USDA|\bBSG\b`;
// Des mots anglais qui n'ont rien à faire dans les mots d'une carte (les mots d'un descripteur de fiche).
const ANGLAIS = /\b(lemon|tropical fruits?|passionfruit|orange zest|green tea|lemon ?grass|citrusy|piney|pleasant|herbs|liquorice|grapefruit|pineapple|apricot|peach|woody|spicy|fruity|resiny|resinous|mango|vanilla|cream|sweet)\b/i;

let echecs = 0;
const ok = (c, m) => { if (!c) echecs += 1; console.log(`${c ? 'OK    ' : 'ECHEC '} ${m}`); };

const { browser, page, journal } = await ouvrir({ largeur: 390, hauteur: 844 });
const erreurs = () => journal.erreurs.filter((e) => !/Firestore|firebase|net::ERR/i.test(e));

/** Les textes que le brasseur voit (au premier plan) et ce qu'il touche (title, aria-label) sous une racine, sans la zone exclue. */
async function lire(selecteur, exclure) {
  return page.evaluate((sel, excl) => {
    const racine = document.querySelector(sel);
    if (!racine) return null;
    const vu = (el) => !!el && !el.closest('[hidden], [aria-hidden="true"] [hidden]') && (el.getClientRects().length > 0 || el.tagName === 'svg');
    const texte = [], attributs = [];
    const w = document.createTreeWalker(racine, NodeFilter.SHOW_TEXT);
    for (let n = w.nextNode(); n; n = w.nextNode()) {
      const p = n.parentElement;
      if (!p || (excl && p.closest(excl)) || !vu(p) || p.closest('.sr-only')) continue;
      const t = n.textContent.replace(/\s+/g, ' ').trim();
      if (t) texte.push(t);
    }
    for (const el of racine.querySelectorAll('[title], [aria-label]')) {
      if (excl && el.closest(excl)) continue;
      for (const a of ['title', 'aria-label']) { const v = el.getAttribute(a); if (v) attributs.push(v); }
    }
    return { texte: texte.join(' | '), attributs: attributs.join(' | ') };
  }, selecteur, exclure ?? null);
}
const trouve = (s, re) => (s ? [...new Set((s.texte + ' | ' + s.attributs).match(new RegExp(re, 'gi')) ?? [])] : ['(écran absent)']);
const extrait = (s, re) => { const tout = `${s.texte} | ${s.attributs}`; const m = new RegExp(`.{0,50}(${re}).{0,30}`, 'i').exec(tout); return m ? `« …${m[0]}… »` : ''; };
const aucunNom = (s, lieu) => { const t = trouve(s, NOMS); ok(t.length === 0, `${lieu} : aucun nom de source${t.length ? ` (trouvé : ${t.join(', ')} ; ex. ${extrait(s, NOMS)})` : ''}`); };
const capture = async (nom) => { if (CAPTURES) await page.screenshot({ path: path.join(IMG, `${nom}-${SUF}.png`) }); };

await page.goto(`${base}/?dev-local&etape=houblons`, { waitUntil: 'networkidle0' });
await page.waitForSelector('[data-ecran="ma-biere"]', { timeout: 120000 });
await dormir(800);

async function ajouter(nom) {
  const champ = '[aria-label="Ajouter un houblon : stock ou catalogue"]';
  await page.waitForSelector(champ, { timeout: 30000 });
  await page.click(champ, { clickCount: 3 });
  await page.keyboard.press('Backspace');
  await page.type(champ, nom, { delay: 15 });
  const plus = '[data-role="ajout-rapide"] [data-role="ajout-rapide-plus"]';
  await page.waitForSelector(plus, { timeout: 30000 });
  const cle = await page.$eval('[data-role="ajout-rapide"]', (e) => e.getAttribute('data-houblon-ajout'));
  await page.click(plus);
  await dormir(900);
  return cle;
}
const lotus = await ajouter('Lotus');
const citra = await ajouter('Citra');
ok(!!lotus && !!citra, `deux houblons ajoutés (${lotus}, ${citra})`);

const carte = (cle) => `[data-element="etape-carte-ajout"][data-houblon-ligne="${cle}"]`;
const ouvertes = () => page.$$eval('[data-role="bande-ouverte"]', (l) => l.map((e) => e.closest('[data-houblon-ligne], [data-role="ajout-rapide"]')?.getAttribute('data-houblon-ligne') ?? e.closest('[data-role="ajout-rapide"]')?.getAttribute('data-houblon-ajout') ?? '?'));
/** Un toucher court sur la bande des arômes de la carte (ou de la ligne d'ajout rapide). */
async function toucherBande(cle, rapide = false) {
  const sel = rapide ? `[data-role="ajout-rapide"][data-houblon-ajout="${cle}"] [data-role="bande"]` : `${carte(cle)} [data-role="bande"]`;
  // La bande n'existe plus quand la carte est déjà dépliée (elle est remplacée par la bande ouverte) : rien à toucher.
  if (!(await page.waitForSelector(sel, { timeout: 4000 }).catch(() => null))) return false;
  await page.$eval(sel, (e) => e.scrollIntoView({ block: 'center' }));
  await dormir(200);
  await page.click(sel);
  await dormir(500);
  return true;
}

// ---- G. D173 : un appui long sur + ajoute des grammes en continu ; un toucher court, un seul pas ; − garde 0 g
const dose = async (cle) => Number((await page.$eval(`${carte(cle)} [data-role="dose"]`, (e) => e.textContent)).replace(/[^0-9,.]/g, '').replace(',', '.'));
async function appui(cle, role, ms) {
  const sel = `${carte(cle)} [data-role="${role}"]`;
  await page.$eval(sel, (e) => e.scrollIntoView({ block: 'center' }));
  await dormir(200);
  const b = await (await page.$(sel)).boundingBox();
  await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2);
  await page.mouse.down(); await dormir(ms); await page.mouse.up();
  await dormir(700);
}
const g0 = await dose(lotus);
await appui(lotus, 'dose-plus', 80);
const g1 = await dose(lotus);
ok(g1 === g0 + 2, `G. un toucher court sur + ajoute un seul pas de 2 g (${g0} → ${g1})`);
await appui(lotus, 'dose-plus', 1500);
const g2 = await dose(lotus);
ok(g2 >= g1 + 8, `G. un appui de 1,5 s sur + ajoute plusieurs pas (${g1} → ${g2} g)`);
await appui(lotus, 'dose-moins', 6000);
const g3 = await dose(lotus);
ok(g3 === 0, `G. un long appui sur − s'arrête à 0 g (${g2} → ${g3} g)`);
await appui(lotus, 'dose-plus', 80); await appui(lotus, 'dose-plus', 80); await appui(lotus, 'dose-plus', 80); await appui(lotus, 'dose-plus', 80); await appui(lotus, 'dose-plus', 80);
ok((await dose(lotus)) === 10, `G. de retour à 10 g (${await dose(lotus)})`);

// ---- A. la carte de Lotus dépliée
await toucherBande(lotus);
await page.$eval(carte(lotus), (e) => e.scrollIntoView({ block: 'center' }));
await dormir(300);
await capture('lotus-carte');
const lecteurCarte = await lire(carte(lotus));
aucunNom(lecteurCarte, 'A. carte de Lotus dépliée');
const motsFamilles = await page.$$eval(`${carte(lotus)} .pq-mb-lg-precis`, (l) => l.map((e) => e.textContent.trim()));
const anglais = motsFamilles.filter((t) => ANGLAIS.test(t));
ok(motsFamilles.length > 0 && anglais.length === 0, `A. mots par famille de Lotus en français : « ${motsFamilles.join(' / ')} »${anglais.length ? ` (anglais : ${anglais.join(' ; ')})` : ''}`);
const garde = await page.$eval(carte(lotus), (e) => ({ losange: !!e.querySelector('.pq-mb-lg-los'), autres: /autres \d+ ?%/.test(e.textContent ?? '') }));
ok(garde.losange && garde.autres, 'A. le ◇ et « autres n % » restent');

// ---- B. une seule carte dépliée à la fois
await toucherBande(citra);
let o = await ouvertes();
ok(o.length === 1 && o[0] === citra, `B. ouvrir Citra ferme Lotus (ouvertes : ${o.join(', ') || 'aucune'})`);
// Une ligne d'ajout rapide (si le moteur en propose) ferme la carte du rail, et inversement.
const rapide = await page.$eval('[data-role="ajout-rapide"]', (e) => e.getAttribute('data-houblon-ajout')).catch(() => null);
if (rapide) {
  await toucherBande(rapide, true);
  o = await ouvertes();
  ok(o.length === 1 && o[0] === rapide, `B. une ligne d'ajout rapide ouverte ferme la carte (ouvertes : ${o.join(', ') || 'aucune'})`);
  await toucherBande(lotus);
  o = await ouvertes();
  ok(o.length === 1 && o[0] === lotus, `B. ouvrir Lotus ferme la ligne d'ajout rapide (ouvertes : ${o.join(', ') || 'aucune'})`);
} else console.log('INFO  aucune ligne d\'ajout rapide proposée : B partiel');

// ---- C. changer de vue ferme la carte ; en revenant, elle est fermée
o = await ouvertes();
ok(o.length === 1 && o[0] === lotus, `C. Lotus est ouverte, seule, avant de changer de vue (ouvertes : ${o.join(', ') || 'aucune'})`);
await page.$eval(`${carte(lotus)} [data-role="pont-substituer"]`, (e) => e.scrollIntoView({ block: 'center' }));
await page.click(`${carte(lotus)} [data-role="pont-substituer"]`);
await page.waitForSelector('[data-ecran="substituer"] [data-remplacant]', { timeout: 30000 });
await dormir(1500);
const recipeId = (await page.evaluate(() => window.__hopPile.pile())).map((r) => r.recipeId).find(Boolean) ?? null;

// ---- E. Substituer (sur Lotus)
await capture('substituer');
aucunNom(await lire('[data-ecran="substituer"]'), 'E. Substituer, au premier plan et au survol');
await page.evaluate(() => window.__hopPile.close());
await dormir(900);
o = await ouvertes();
ok(o.length === 0, `C. de retour de Substituer, aucune carte n'est dépliée (ouvertes : ${o.join(', ') || 'aucune'})`);

// ---- C. la fiche ferme aussi la carte
await toucherBande(lotus);
o = await ouvertes();
ok(o.includes(lotus), 'C. Lotus rouverte');
const nom = `${carte(lotus)} [data-role="ouvrir-fiche"]`;
const b = await (await page.$(nom)).boundingBox();
await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2);
await page.mouse.down();
await dormir(750);
await page.mouse.up();
await page.waitForSelector('[data-ecran="fiche"]', { timeout: 15000 });
await dormir(1200);
// ---- D. la fiche
const FICHE = '[data-ecran="fiche"]';
const HORS_SOURCES = '#pq-fiche-repli section[aria-label="Sources"]';
await capture('fiche');
aucunNom(await lire(FICHE, HORS_SOURCES), 'D. fiche (repos)');
for (const [id, nomRepli] of [['styles', 'Styles'], ['huiles', 'Huiles']]) {
  await page.click(`[data-etat="etat-fiche-${id}"]`);
  await dormir(600);
  if (id === 'huiles') await capture('fiche-huiles');
  aucunNom(await lire(FICHE, HORS_SOURCES), `D. fiche, repli ${nomRepli}`);
}
await page.click('[data-etat="etat-fiche-sources"]');
await page.waitForSelector('[data-role="sources-feuille"]', { timeout: 15000 });
await dormir(700);
await page.$eval('[data-role="sources-feuille"]', (e) => e.scrollIntoView({ block: 'start' }));
await dormir(300);
await capture('fiche-sources');
const bm = await page.$('[data-role="lien-beer-maverick"]');
ok(!!bm, 'D. la section « Sources » de la fiche garde le lien Beer Maverick');
await page.keyboard.press('Escape');
await dormir(900);
if (await page.$('[data-ecran="fiche"]')) { await page.click('[aria-label="Fermer"]').catch(() => {}); await dormir(800); }
o = await ouvertes();
ok(o.length === 0, `C. de retour de la fiche, aucune carte n'est dépliée (ouvertes : ${o.join(', ') || 'aucune'})`);

// ---- F. Comparer (Valeurs)
if (recipeId) {
  await page.evaluate((r, a, b2) => window.__hopPile.open({ view: 'hopCompare', recipeId: r, hops: [a, b2] }), recipeId, lotus, citra);
  await page.waitForSelector('[data-ecran="comparer"], .pq-comparer', { timeout: 30000 }).catch(() => {});
  await dormir(2500);
  await page.click('[data-etat~="etat-comp-chimie"]').catch(() => {});
  await page.waitForSelector('.pq-comparer-vraies', { timeout: 15000 }).catch(() => {});
  await dormir(1200);
  const valeurs = await page.$('.pq-comparer-vraies');
  if (valeurs) { await valeurs.evaluate((e) => e.scrollIntoView({ block: 'start' })); await dormir(400); await capture('comparer-valeurs'); }
  const lc = await lire('.pq-comparer-vraies');
  if (lc) {
    aucunNom(lc, 'F. Comparer, Valeurs : au premier plan et au survol (hors citations d\'études H22, H77)');
    // Les références courtes (BM, HS, BH…) à côté d'une valeur sont des noms de source abrégés.
    const codes = await page.$$eval('.pq-comparer-vraies .pq-comparer-vc .pq-comparer-vr', (l) => l.map((e) => e.textContent.trim()).filter((t) => /\b(BM|HS|BH|BF|BHA|CF|CRO|HD|HDI|HJ|HL|HPA|IH|JH|NZH|USA|USDA|YVH|BSG|H\d+[a-z]?)\b/.test(t)));
    ok(codes.length === 0, `F. Comparer, Valeurs : aucune référence de source à côté d'une valeur${codes.length ? ` (${codes.length}, ex. « ${codes[0]} »)` : ''}`);
    const legende = await page.$$eval('.pq-comparer-vraies .pq-comparer-vrefs', (l) => l.map((e) => e.textContent.trim()).join(' / '));
    ok(!legende, `F. Comparer, Valeurs : plus de légende des références${legende ? ` (« ${legende.slice(0, 80)} »)` : ''}`);
  } else console.log('INFO  Comparer (Valeurs) non atteint dans ce parcours');
  await page.evaluate(() => window.__hopPile.close());
  await dormir(600);
} else console.log('INFO  pas de recipeId dans la pile : F non joué');

ok(erreurs().length === 0, `aucune erreur de page${erreurs().length ? ` : ${erreurs().slice(0, 2).join(' | ')}` : ''}`);
await browser.close();
console.log(echecs ? `\nCONTROLE ECHEC (${echecs})` : '\nCONTROLE OK');
process.exit(echecs ? 1 : 0);
