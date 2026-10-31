#!/usr/bin/env node
// Voie p1-port : la série Chrome de l'étape Identité (r4-a portée dans l'app). Mécanique : à confier à l'exécutant.
//
// Usage (le serveur tourne dans une COPIE, jamais dans l'arbre principal) :
//   node scripts/with_server.mjs --server "cd <copie> && npm run dev -- --port 5611 --strictPort" --port 5611 \
//     --env VITE_FIREBASE_API_KEY=fake -- node <ce fichier> --sortie=<dossier des captures>
//   ou, avec un serveur déjà lancé : node <ce fichier> --url=http://localhost:5611 --sortie=<dossier>
//
// Fixtures seulement : `?dev-local&etape=houblons&recette=vide` ouvre le wizard sur une recette neuve, sans donnée réelle,
// et toute requête hors localhost est coupée (lanceur). Sortie : « IDENTITE OK » (code 0) ou « IDENTITE ECHEC n » et la liste.
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const RACINE = path.resolve(import.meta.dirname, '..', '..', '..', '..', '..');
const { ouvrir, calme } = await import(pathToFileURL(path.join(RACINE, '.claude/skills/webapp-testing/examples/_lanceur.mjs')).href);

const argv = process.argv.slice(2);
const valeur = (n) => argv.find((a) => a.startsWith(`--${n}=`))?.slice(n.length + 3);
const url = (valeur('url') ?? `http://localhost:${(process.env.WITH_SERVER_PORTS ?? '').split(',')[0]}`).replace(/\/$/, '');
if (/localhost:$/.test(url)) { console.log('IDENTITE ECHEC 1\n  - pas de serveur : with_server.mjs ou --url='); process.exit(1); }
const SORTIE = path.resolve(valeur('sortie') ?? path.join(import.meta.dirname, 'captures'));
fs.mkdirSync(SORTIE, { recursive: true });
const MAQUETTE = path.join(RACINE, 'work/missions/2026-10-31-ecran-identite/v1/r4-a/etat.html');

const fautes = [];
const lignes = [];
const verifier = (ok, texte) => { lignes.push(`${ok ? 'OK ' : 'ECHEC'} ${texte}`); if (!ok) fautes.push(texte); };
const dormir = (ms) => new Promise((r) => setTimeout(r, ms));
const sel = (e) => `[data-element="${e}"]`;

async function taper(page, selecteur, texte) {
  await page.click(selecteur);
  await page.keyboard.down('Control'); await page.keyboard.press('KeyA'); await page.keyboard.up('Control');
  await page.keyboard.type(texte);
  await page.keyboard.press('Enter');
  await dormir(350);
}
const lire = (page, selecteur, fonction) => page.$eval(selecteur, fonction);
const valeurChamp = (page, e) => lire(page, sel(e), (n) => n.value);
const derniere = (page, nom) => page.$eval(`[data-role="echelle-${nom}"] .idn-dern`, (n) => n.textContent.trim());
const derniereAvecChevron = (page, nom) => page.$eval(`[data-role="echelle-${nom}"] .idn-dern`, (n) => n.textContent.trim() + (getComputedStyle(n, '::after').content || '').replace(/["']/g, ''));

// `vide` : recette neuve (sans malts ni style). Sinon : la recette de démonstration (fixture, style 16D, malts), qui a des plages de style
// et un plan d'eau — celle des gestes (relance 1 : sans style, les pastilles de plages ne peuvent pas s'afficher).
async function ouvrirIdentite(page, vide = false) {
  await page.goto(`${url}/?dev-local&etape=houblons${vide ? '&recette=vide' : ''}`, { waitUntil: 'networkidle0' });
  await page.waitForSelector('nav[aria-label="Étapes"]', { timeout: 150000 });
  await page.evaluate(() => {
    const b = [...document.querySelectorAll('nav[aria-label="Étapes"] button')].find((x) => /Identité/.test(x.textContent));
    b.click();
  });
  await page.waitForSelector(sel('r4a-volume-champ'), { timeout: 30000 });
  await calme(page, 600);
}

async function serie(largeur) {
  const mobile = largeur < 700;
  const { browser, page, journal } = await ouvrir({ largeur, hauteur: mobile ? 844 : 900, mobile, echelle: 2 });
  const tag = String(largeur);
  const cap = (nom) => page.screenshot({ path: path.join(SORTIE, `${nom}-${tag}.png`) });
  try {
    await ouvrirIdentite(page);

    // 1. Le repos.
    await cap('app-repos');
    verifier((await page.$$('input[type="number"]')).length === 0, `${tag} : aucun input type=number`);
    // Les deux demi-tuiles du bas : côte à côte, fermées au repos (r4-a).
    const tuiles = await page.evaluate((e) => {
      const g = (m) => { const n = document.querySelector(`[data-element="${m}"]`); if (!n) return null; const r = n.getBoundingClientRect(); return { top: Math.round(r.top), left: Math.round(r.left), w: Math.round(r.width), ouvert: n.classList.contains('idn-ouvert') }; };
      return { espace: g('r4a-espace-libre'), materiel: g('r4a-materiel'), large: window.innerWidth };
    });
    lignes.push(`INFO ${tag} : tuiles ${JSON.stringify(tuiles)}`);
    verifier(!!tuiles.espace && !!tuiles.materiel && !tuiles.espace.ouvert && !tuiles.materiel.ouvert, `${tag} : Espace libre et Matériel fermés au repos`);
    verifier(!!tuiles.espace && !!tuiles.materiel && Math.abs(tuiles.espace.top - tuiles.materiel.top) <= 2 && tuiles.espace.left !== tuiles.materiel.left, `${tag} : Espace libre et Matériel côte à côte`);
    // Une seule fenêtre : le pied Retour / Suivant se voit sans défiler (r4-a tient en un écran à 390).
    const pied = await page.evaluate(() => { const b = [...document.querySelectorAll('button')].find((x) => /^Suivant/.test(x.textContent.trim())); if (!b) return null; const r = b.getBoundingClientRect(); return { bas: Math.round(r.bottom), haut: window.innerHeight }; });
    lignes.push(`INFO ${tag} : pied ${JSON.stringify(pied)}`);
    if (mobile) verifier(!!pied && pied.bas <= pied.haut, `${tag} : le pied Suivant se voit sans défiler (${JSON.stringify(pied)})`);
    // Le + flottant ne recouvre aucun texte du bloc au repos.
    const recouvre = await page.evaluate(() => {
      const f = [...document.querySelectorAll('button')].find((b) => /Actions rapides/i.test(b.getAttribute('aria-label') || '') && getComputedStyle(b).position === 'fixed');
      if (!f) return ['(+ introuvable)'];
      const a = f.getBoundingClientRect(); const r = [];
      for (const n of document.querySelectorAll('.idn-c *')) {
        if (![...n.childNodes].some((c) => c.nodeType === 3 && c.textContent.trim())) continue;
        const b = n.getBoundingClientRect();
        if (b.width && b.height && b.left < a.right && b.right > a.left && b.top < a.bottom && b.bottom > a.top) r.push(n.textContent.trim().slice(0, 30));
      }
      return r;
    });
    verifier(recouvre.length === 0, `${tag} : le + ne recouvre aucun texte au repos (${recouvre.slice(0, 3).join(' ; ')})`);
    // La pastille du style : teintée (une famille reconnue), et son chevron ne recouvre pas le texte.
    const pastille = await page.evaluate(() => {
      const p = document.querySelector('[data-element="r4a-style"]'); if (!p) return null;
      const champ = p.querySelector('input,textarea'); const chev = p.querySelector("button[aria-label$='la liste']");
      const cr = champ.getBoundingClientRect(), vr = chev.getBoundingClientRect();
      return { teinte: p.style.getPropertyValue('--idn-teinte'), fond: getComputedStyle(p).backgroundColor, paddingDroit: parseFloat(getComputedStyle(champ).paddingRight), chevron: Math.round(vr.width), champ: Math.round(cr.width) };
    });
    lignes.push(`INFO ${tag} : pastille ${JSON.stringify(pastille)}`);
    verifier(!!pastille && !!pastille.teinte, `${tag} : la pastille du style est teintée (famille reconnue) ${JSON.stringify(pastille)}`);
    verifier(!!pastille && pastille.paddingDroit >= pastille.chevron, `${tag} : le chevron du style ne recouvre pas le texte`);
    // Le thème « cave » au repos.
    await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'cave'));
    await dormir(300);
    await cap('app-repos-cave');
    await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'clair'));
    await dormir(200);
    for (const e of ['r4a-nom', 'r4a-style', 'r4a-plages', 'r4a-volume-champ', 'r4a-piste-volume', 'r4a-regle-volume', 'r4a-ebullition-champ', 'r4a-curseur-ebullition', 'r4a-regle-ebullition', 'r4a-nolo']) {
      verifier((await page.$$(sel(e))).length > 0, `${tag} : marqueur ${e} présent`);
    }
    verifier((await derniere(page, 'ebullition')) === '120', `${tag} : la règle d'ébullition va de 0 à 120 au repos`);
    verifier((await derniereAvecChevron(page, 'ebullition')).endsWith('›'), `${tag} : le « › » se voit au bout de la règle d'ébullition`);
    verifier((await derniereAvecChevron(page, 'volume')).endsWith('›'), `${tag} : le « › » se voit au bout de la règle du volume`);
    const pointille = await page.$eval(sel('r4a-volume-champ'), (n) => getComputedStyle(n).borderBottomStyle);
    verifier(pointille === 'dotted', `${tag} : pointillé sous le volume au repos (${pointille})`);
    const petits = await page.evaluate(() => {
      const r = [];
      for (const n of document.querySelectorAll('.idn-c *, .idn-coller')) {
        if (![...n.childNodes].some((c) => c.nodeType === 3 && c.textContent.trim())) continue;
        const f = parseFloat(getComputedStyle(n).fontSize);
        if (f < 12 && n.getClientRects().length) r.push(`${n.tagName}.${String(n.className).slice(0, 30)} ${f}px « ${n.textContent.trim().slice(0, 20)} »`);
      }
      return r;
    });
    verifier(petits.length === 0, `${tag} : aucun texte sous 12 px ${petits.slice(0, 3).join(' ; ')}`);
    verifier((await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)), `${tag} : aucun débordement horizontal`);

    // 2. L'ébullition tapée à 240.
    await taper(page, sel('r4a-ebullition-champ'), '240');
    verifier((await valeurChamp(page, 'r4a-ebullition-champ')) === '240', `${tag} : ébullition tapée = 240`);
    verifier((await derniere(page, 'ebullition')) === '270', `${tag} : la règle d'ébullition va de 0 à 270 à 240 min`);
    await cap('app-ebullition-240');

    // 3. Le fermenteur à 60 L par la puce.
    const puce = await page.$(sel('r4a-puce-fermenteur'));
    verifier(!!puce, `${tag} : la puce « fermenteur » existe (profil d'équipement chiffré)`);
    if (puce) {
      await puce.click();
      await dormir(400);
      verifier((await page.evaluate(() => document.activeElement?.id)) === 'wz-fermenteur', `${tag} : la puce ouvre le matériel et met le champ du fermenteur au focus`);
      await cap('app-fermenteur-ouvert');
      await page.keyboard.down('Control'); await page.keyboard.press('KeyA'); await page.keyboard.up('Control');
      await page.keyboard.type('60'); await page.keyboard.press('Enter'); await dormir(500);
      verifier((await lire(page, sel('r4a-puce-fermenteur'), (n) => n.textContent)).includes('60'), `${tag} : la puce lit 60 L`);
      verifier((await page.$('[data-role="raz"]:not([hidden])')) !== null, `${tag} : « ↺ profil » apparaît`);
      verifier(Number(await derniere(page, 'volume')) >= 60, `${tag} : la règle du volume suit le fermenteur (${await derniere(page, 'volume')})`);
      await cap('app-fermenteur-60');

      // 4. 55 L dans 60 L, ébullition à 240 : la cuve déborde.
      await taper(page, sel('r4a-volume-champ'), '55');
      const libres = await lire(page, sel('r4a-libres'), (n) => n.textContent.replace(/\s+/g, ' '));
      verifier(/5 L libres/.test(libres), `${tag} : 55 L dans 60 L = « 5 L libres » (${libres})`);
      const preb = await page.$eval('[data-role="preb"]', (n) => n.textContent);
      lignes.push(`INFO ${tag} : avant ébullition ${preb}`);
      // Une seule source : la barre de la cuve et « Avant ébullition · à chaud » du bloc disent le même nombre (ou « — » et 0).
      const bloc = await page.evaluate(() => {
        const d = [...document.querySelectorAll('.equipment-plan-values > div')].find((x) => /Avant ébullition/.test(x.textContent));
        return d ? d.querySelector('dd').textContent.replace(/\s+/g, ' ') : '';
      });
      lignes.push(`INFO ${tag} : bloc « Avant ébullition » = ${bloc}`);
      const nombre = (t) => { const m = t.match(/\d+(?:,\d+)?/); return m ? Number(m[0].replace(',', '.')) : null; };
      verifier(preb !== '—', `${tag} : la recette de démonstration a un plan d'eau (moût avant ébullition ${preb}) : sans lui, la cuve ne peut pas déborder`);
      verifier(preb === '—' ? nombre(bloc) === 0 : nombre(preb) === nombre(bloc), `${tag} : un seul nombre avant ébullition : barre « ${preb} », bloc « ${bloc} »`);
      const deb = await page.$('[data-role="debordement"]');
      const texteDeb = deb ? await deb.evaluate((n) => n.textContent.replace(/\s+/g, ' ') + '|' + n.getAttribute('role')) : '';
      verifier(!!deb && /\+\d[\d,]* L.*de trop\|alert/.test(texteDeb), `${tag} : la cuve dit son dépassement « ${texteDeb} »`);
      // « Repères ⌄ » : plages du style (FG, alcool, EBC, source) à un toucher.
      await page.evaluate(() => document.querySelector('[data-role="repbtn"]')?.click()); await dormir(300);
      verifier(await page.$eval(sel('r4a-reperes'), (n) => !n.hidden && n.getClientRects().length > 0), `${tag} : « Repères ⌄ » déplie la source et les plages restantes`);
      await cap('app-reperes-ouverts');
      await page.evaluate(() => document.querySelector('[data-role="repbtn"]')?.click()); await dormir(200);
      verifier(Number(await derniere(page, 'volume')) >= 65, `${tag} : la règle du volume contient le moût avant ébullition (${await derniere(page, 'volume')})`);
      await cap('app-cuve-deborde');
      // « ↺ profil » rend la capacité du profil.
      await page.click('[data-role="raz"]'); await dormir(400);
      verifier(!(await lire(page, sel('r4a-puce-fermenteur'), (n) => n.textContent)).includes('60'), `${tag} : « ↺ profil » rend la capacité du profil`);
      await cap('app-profil-rendu');
      // Un volume au-delà du fermenteur : « +25 L de trop », jamais une valeur négative.
      const espaceBloc = await page.evaluate(() => [...document.querySelectorAll('.equipment-plan-secondary')].find((d) => /Espace libre/.test(d.textContent))?.textContent.replace(/\s+/g, ' ') ?? '');
      lignes.push(`INFO ${tag} : bloc « Espace libre » = ${espaceBloc}`);
      verifier(/\+25 L de trop/.test(espaceBloc) && !/[−-]\s?\d/.test(espaceBloc), `${tag} : le bloc dit « +25 L de trop », sans valeur négative (${espaceBloc})`);
    }

    // 4 bis. La recette vide : l'import dans le corps, pas de plages (aucun style), moût avant ébullition inconnu (« — »).
    await ouvrirIdentite(page, true);
    await cap('app-vide');
    verifier((await page.$$('.idn-coller')).length === 1, `${tag} : recette vide : « Coller une recette trouvée » dans le corps`);
    verifier((await page.$$(sel('r4a-plages'))).length === 0, `${tag} : recette vide, style vide : aucune pastille de plage (rien d'inventé)`);
    verifier((await page.$eval('[data-role="preb"]', (n) => n.textContent)) === '—', `${tag} : recette vide : « — avant ébullition », pas un nombre`);

    // 5. Le parcours au clavier (page rechargée).
    await ouvrirIdentite(page);
    await page.focus('#wz-title');
    const suite = [];
    for (let i = 0; i < 16; i++) {
      await page.keyboard.press('Tab');
      suite.push(await page.evaluate(() => { const a = document.activeElement; return (a.getAttribute('aria-label') || a.id || a.textContent || a.tagName).trim().slice(0, 38); }));
    }
    lignes.push(`INFO ${tag} : Tab depuis le nom → ${suite.join(' | ')}`);
    verifier(suite.some((s) => /Volume en fermenteur$/.test(s)) && suite.some((s) => /Durée d’ébullition$/.test(s)), `${tag} : Tab atteint les champs du volume et de l'ébullition`);
    await page.focus('#wz-volume');
    const v0 = Number((await page.$eval('#wz-volume', (n) => n.value)).replace(',', '.'));
    await page.keyboard.press('ArrowUp'); await page.keyboard.press('ArrowUp');
    verifier(Number((await page.$eval('#wz-volume', (n) => n.value)).replace(',', '.')) === v0 + 2, `${tag} : ↑ ↑ = +2 L`);
    await page.keyboard.press('ArrowDown');
    verifier(Number((await page.$eval('#wz-volume', (n) => n.value)).replace(',', '.')) === v0 + 1, `${tag} : ↓ = −1 L`);
    await page.keyboard.press('Escape'); await dormir(300);
    verifier(Number((await page.$eval('#wz-volume', (n) => n.value)).replace(',', '.')) === v0, `${tag} : Échap rend la valeur d'avant (${v0})`);
    await page.focus('#wz-boil');
    const b0 = Number(await page.$eval('#wz-boil', (n) => n.value));
    await page.keyboard.press('ArrowUp');
    verifier(Number(await page.$eval('#wz-boil', (n) => n.value)) === b0 + 5, `${tag} : ↑ = +5′`);
    await page.keyboard.press('Enter'); await dormir(300);
    verifier(await page.evaluate(() => document.activeElement?.id !== 'wz-boil'), `${tag} : Entrée valide et quitte le champ`);
    verifier(Number(await page.$eval('#wz-boil', (n) => n.value)) === b0 + 5, `${tag} : Entrée garde ${b0 + 5} min`);
    await page.focus('#wz-boil'); await page.keyboard.down('Control'); await page.keyboard.press('KeyA'); await page.keyboard.up('Control');
    await page.keyboard.type('180');
    await cap('app-clavier-saisie-en-cours');
    await page.keyboard.press('Enter'); await dormir(300);
    verifier((await derniere(page, 'ebullition')) === '210', `${tag} : 180 min tapé → règle 0–210`);
    await cap('app-clavier-apres');

    // 6. Sans erreur de page.
    verifier(journal.erreurs.length === 0, `${tag} : aucune erreur de page (${journal.erreurs.slice(0, 2).join(' ; ')})`);
    // 7. La maquette au même format, puis côte à côte.
    const m = await ouvrir({ largeur, hauteur: mobile ? 844 : 900, mobile, echelle: 2 });
    await m.page.goto(pathToFileURL(MAQUETTE).href, { waitUntil: 'load' });
    await dormir(500);
    await m.page.screenshot({ path: path.join(SORTIE, `maquette-repos-${tag}.png`) });
    await m.browser.close();
    await ouvrirIdentite(page);
    await cap('app-repos-bis');
    const b64 = (f) => fs.readFileSync(path.join(SORTIE, f)).toString('base64');
    const duo = await ouvrir({ largeur: largeur * 2 + 30, hauteur: mobile ? 900 : 950, mobile: false, echelle: 1 });
    await duo.page.setContent(`<body style="margin:0;background:#888;display:flex;gap:30px;font:12px sans-serif"><figure style="margin:0"><figcaption>maquette r4-a</figcaption><img style="width:${largeur}px" src="data:image/png;base64,${b64(`maquette-repos-${tag}.png`)}"></figure><figure style="margin:0"><figcaption>app (étape Identité)</figcaption><img style="width:${largeur}px" src="data:image/png;base64,${b64(`app-repos-bis-${tag}.png`)}"></figure></body>`);
    await duo.page.screenshot({ path: path.join(SORTIE, `cote-a-cote-${tag}.png`), fullPage: true });
    await duo.browser.close();
  } catch (e) {
    verifier(false, `${tag} : exception ${e?.message ?? e}`);
  } finally {
    await browser.close();
  }
}

await serie(390);
await serie(1280);
fs.writeFileSync(path.join(SORTIE, 'identite-journal.txt'), lignes.join('\n') + '\n');
for (const l of lignes) console.log(l);
if (fautes.length) { console.log(`IDENTITE ECHEC ${fautes.length}`); process.exit(1); }
console.log('IDENTITE OK');
