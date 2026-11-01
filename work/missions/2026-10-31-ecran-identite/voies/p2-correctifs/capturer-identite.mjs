#!/usr/bin/env node
// Voie p1-port : la série Chrome de l'étape Identité (r4-a portée dans l'app). Mécanique : à confier à l'exécutant.
//
// Usage (le serveur tourne dans une COPIE, jamais dans l'arbre principal) :
//   node scripts/with_server.mjs --server "cd <copie> && npm run dev -- --port 5611 --strictPort" --port 5611 \
//     --env VITE_HOP_V4=on --env VITE_FIREBASE_API_KEY=fake -- node <ce fichier> --sortie=<dossier des captures>
//   (VITE_HOP_V4=on : la même configuration que baseline-visuelle.mjs ; sans elle, l'étape Houblons ne monte pas `ma-biere`.)
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
const maxRegle = async (page, nom) => Number(await page.$eval(`[data-role="echelle-${nom}"]`, (n) => n.dataset.max));
const chiffresRegle = (page, nom) => page.$$eval(`[data-role="echelle-${nom}"] span`, (l) => l.map((n) => n.textContent.trim()));
const derniereAvecChevron =(page, nom) => page.$eval(`[data-role="echelle-${nom}"] .idn-dern`, (n) => n.textContent.trim() + (getComputedStyle(n, '::after').content || '').replace(/["']/g, ''));

// ---------------------------------------------------------------------------------------------------------------------
// Voie p2-correctifs : les contrôles du verdict (critique/VERDICT-port.md), à 390 et à 1280, dans tous les états.
// ---------------------------------------------------------------------------------------------------------------------
// n° 1 : entre la tuile Volume et la tuile Ébullition, une ligne d'alerte (role=status ou alert) au plus.
const lignesEntreTuiles = (page) => page.evaluate(() => {
  const a = document.querySelector('section[data-carte="volume"]'); const b = document.querySelector('section[data-carte="ebullition"]');
  if (!a || !b) return null;
  const r = [];
  for (let n = a.nextElementSibling; n && n !== b; n = n.nextElementSibling) {
    const lignes = n.matches('[role="status"],[role="alert"]') ? [n] : [...n.querySelectorAll('[role="status"],[role="alert"]')];
    for (const l of lignes) if (l.getClientRects().length) r.push(l.textContent.replace(/\s+/g, ' ').trim().slice(0, 70));
  }
  return r;
});
async function controleEntreTuiles(page, tag, etat) {
  const l = await lignesEntreTuiles(page);
  verifier(l !== null && l.length <= 1, `${tag} ${etat} : au plus une ligne d'alerte entre Volume et Ébullition (${l === null ? 'tuiles absentes' : l.length + ' : ' + l.join(' | ')})`);
}
// n° 4 et n° 11 : le bandeau Grain / OG / IBU / EBC sur une ligne ; « Abandonner » sur la ligne du titre, et le haut de la page ne bouge pas.
async function controleBandeau(page, tag, etat) {
  const b = await page.evaluate(() => {
    const m = document.querySelector('.recipe-metrics'); if (!m || !m.getClientRects().length) return null;
    const feuilles = [...m.querySelectorAll('*')].filter((n) => n.getClientRects().length && [...n.childNodes].some((c) => c.nodeType === 3 && c.textContent.trim()));
    const centres = feuilles.map((n) => { const r = n.getBoundingClientRect(); return r.top + r.height / 2; });
    const piste = m.querySelector('[data-role="ibu-piste"]'); const pr = piste ? piste.getBoundingClientRect() : null;
    const mr = m.getBoundingClientRect();
    return { hauteur: Math.round(mr.height), ecart: Math.round(Math.max(...centres) - Math.min(...centres)), piste: pr ? Math.round(Math.abs(pr.top + pr.height / 2 - (Math.min(...centres) + Math.max(...centres)) / 2)) : null, n: feuilles.length };
  });
  lignes.push(`INFO ${tag} ${etat} : bandeau ${JSON.stringify(b)}`);
  verifier(!!b && b.ecart <= 8 && b.hauteur <= 48 && (b.piste === null || b.piste <= 8), `${tag} ${etat} : le bandeau Grain / OG / IBU / EBC tient sur une ligne (${JSON.stringify(b)})`);
}
async function controleTitre(page, tag, etat, hautAvant) {
  const t = await page.evaluate(() => {
    const visible = (n) => n && n.getClientRects().length;
    const nav = [...document.querySelectorAll('nav[aria-label="Étapes"]')].find(visible);
    const abv = [...document.querySelectorAll('[data-role="abandonner-brouillon"]')].find(visible);
    const h = [...document.querySelectorAll('[data-page-titlebar] h1')].find(visible);
    const c = (n) => { const r = n.getBoundingClientRect(); return r.top + r.height / 2; };
    return { ab: !!abv, ecartTitre: abv && h ? Math.round(Math.abs(c(abv) - c(h))) : null, nav: nav ? Math.round(nav.getBoundingClientRect().top) : null };
  });
  lignes.push(`INFO ${tag} ${etat} : titre ${JSON.stringify(t)}`);
  if (t.ab && t.ecartTitre !== null) verifier(t.ecartTitre <= 14, `${tag} ${etat} : « Abandonner » sur la ligne du titre (${t.ecartTitre} px d'écart)`);
  if (hautAvant != null) verifier(Math.abs(t.nav - hautAvant) <= 1, `${tag} ${etat} : le haut de la page ne bouge pas quand la recette est modifiée (barre d'étapes ${hautAvant} → ${t.nav})`);
  return t.nav;
}
// n° 5 : au focus d'un nombre tapable, ni bordure ni fond blanc ; un trait plein de 2 px dessous.
async function controleFocus(page, tag, id, cadre = false) {
  await page.focus(`#${id}`);
  await dormir(350); // les champs ont une transition de bordure : la mesure attend la fin
  const s =await page.$eval(`#${id}`, (n) => { const c = getComputedStyle(n); return { haut: c.borderTopWidth, gauche: c.borderLeftWidth, droite: c.borderRightWidth, bas: c.borderBottomWidth, style: c.borderBottomStyle, fond: c.backgroundColor, contour: c.outlineStyle, ombre: c.boxShadow }; });
  lignes.push(`INFO ${tag} : focus #${id} ${JSON.stringify(s)}`);
  if (cadre) { verifier(s.haut === '1px' && s.bas === '1px', `${tag} : le champ « Fermenteur » garde son cadre au focus (${JSON.stringify(s)})`); return; }
  verifier(s.haut === '0px' && s.gauche === '0px' && s.droite === '0px', `${tag} : au focus de #${id}, aucune bordure sauf le trait du bas (${s.haut} ${s.gauche} ${s.droite})`);
  verifier(s.fond === 'rgba(0, 0, 0, 0)' || s.fond === 'transparent', `${tag} : au focus de #${id}, fond transparent, pas de fond blanc (${s.fond})`);
  verifier(s.bas === '2px' && s.style === 'solid', `${tag} : au focus de #${id}, un trait plein de 2 px dessous (${s.bas} ${s.style})`);
  verifier(s.contour === 'none' && (s.ombre === 'none' || s.ombre === ''), `${tag} : au focus de #${id}, ni contour ni ombre (${s.contour} ${s.ombre})`);
}

// `vide` : recette neuve (sans malts ni style). Sinon : la recette de démonstration (fixture, style 16D, malts), qui a des plages de style
// et un plan d'eau — celle des gestes (relance 1 : sans style, les pastilles de plages ne peuvent pas s'afficher).
async function ouvrirIdentite(page, vide = false) {
  // `recette=identite` : la fixture d'Identité (src/ui/identite/apercuDev.ts, AVEC grains et plan d'eau) ; `recette=vide` : recette neuve.
  await page.goto(`${url}/?dev-local&etape=houblons&recette=${vide ? 'vide' : 'identite'}`, { waitUntil: 'networkidle0' });
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
    // Verdict p2 : les contrôles du repos.
    await controleEntreTuiles(page, tag, 'repos');
    await controleBandeau(page, tag, 'repos');
    // R1, garde-fou : dans la cuve, la part évaporée (bleue) se voit toujours au repos.
    const evapRepos = await page.$eval('.idn-cevap', (e) => Math.round(e.getBoundingClientRect().width)).catch(() => 0);
    verifier(evapRepos >= 5, `${tag} repos : R1, la part évaporée se voit encore dans la cuve (${evapRepos} px)`);
    const hautRepos = await controleTitre(page, tag, 'repos', null);
    const sousTitre = await page.$eval('[data-element="r4a-materiel"] .idn-pli', (n) => n.textContent.replace(/\s+/g, ' ').trim());
    verifier(/· à adopter/.test(sousTitre) && (await page.$$('[data-role="alerte-installation"]')).length === 0, `${tag} repos : n° 7, « à adopter » est le sous-titre de la tuile Matériel, plus une phrase (${sousTitre})`);
    const pas = await page.evaluate(() => { const p = document.querySelector('[data-element="r4a-style"]'); const s = p.querySelector('small'); const c = p.querySelector("button[aria-label$='la liste']"); if (!s || !c) return null; return { code: s.textContent.trim(), droiteCode: Math.round(s.getBoundingClientRect().right), gaucheChevron: Math.round(c.getBoundingClientRect().left) }; });
    verifier(!!pas && pas.droiteCode <= pas.gaucheChevron + 1, `${tag} repos : n° 8, le code du style avant le chevron (${JSON.stringify(pas)})`);
    const cuveLib = await page.evaluate(() => [...document.querySelectorAll('[data-carte="volume"] .idn-k')].map((n) => n.textContent.replace(/\s+/g, ' ').trim()).find((t) => /^cuve/.test(t)) ?? '');
    verifier(/^cuve 35 L$/.test(cuveLib), `${tag} repos : n° 9, « cuve 35 L » sans « utile » (${cuveLib})`);
    // n° 6 : la colonne d'Identité contre celle des autres étapes (mesurée ici, décidée par la comparaison).
    const colId = await page.evaluate(() => Math.round(document.querySelector('.idn-c').getBoundingClientRect().width));
    lignes.push(`INFO ${tag} repos : colonne Identité ${colId} px`);
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
      // Le + est un bouton « Actions rapides » dont un ancêtre (ou lui) est en position fixe.
      const fixe = (n) => { for (let x = n; x && x !== document.body; x = x.parentElement) if (getComputedStyle(x).position === 'fixed') return true; return false; };
      const f = [...document.querySelectorAll('button')].find((b) => /^Actions rapides/i.test(b.getAttribute('aria-label') || '') && fixe(b));
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
    verifier((await maxRegle(page, 'ebullition')) === 270, `${tag} : la règle d'ébullition va de 0 à 270 à 240 min`);
    const eb = await chiffresRegle(page, 'ebullition');
    verifier(eb.join(',') === '0,60,120,180,240' && (await derniereAvecChevron(page, 'ebullition')).endsWith('›'), `${tag} : n° 10, au-delà de 180 min un chiffre tous les 60 min, le « › » sur le dernier (${eb.join(',')})`);
    await cap('app-ebullition-240');
    await controleEntreTuiles(page, tag, 'ébullition 240');
    await controleBandeau(page, tag, 'ébullition 240');
    await controleTitre(page, tag, 'ébullition 240', hautRepos);

    // 3. Le fermenteur à 60 L par la puce.
    const puce = await page.$(sel('r4a-puce-fermenteur'));
    verifier(!!puce, `${tag} : la puce « fermenteur » existe (profil d'équipement chiffré)`);
    if (puce) {
      await puce.click();
      await dormir(400);
      verifier((await page.evaluate(() => document.activeElement?.id)) === 'wz-fermenteur', `${tag} : la puce ouvre le matériel et met le champ du fermenteur au focus`);
      await cap('app-fermenteur-ouvert');
      await controleEntreTuiles(page, tag, 'fermenteur ouvert');
      // n° 3 : au dépli, « Fermenteur [N] L » ; le résumé « Volumes et matériel » est replié.
      const ouvert = await page.evaluate(() => {
        const visible = (n) => !!n && n.getClientRects().length > 0;
        const champ = document.querySelector('#wz-fermenteur');
        const plan = document.querySelector('.equipment-plan');
        const pli = document.querySelector('[data-role="volumes-pli"]');
        const adapter = [...document.querySelectorAll('[data-element="r4a-materiel"] button')].filter((b) => /^Adapter/.test(b.textContent.trim()) && visible(b));
        const cadre = adapter.map((b) => getComputedStyle(b).borderTopWidth);
        return { champ: visible(champ), plan: visible(plan), pli: visible(pli), pliTexte: pli ? pli.textContent.replace(/\s+/g, ' ').trim() : '', adapter: adapter.length, cadre, nomPlan: [...document.querySelectorAll('[data-element="r4a-materiel"] p')].some((p) => /Matériel du plan|Installation à adopter/.test(p.textContent)) };
      });
      lignes.push(`INFO ${tag} : fermenteur ouvert ${JSON.stringify(ouvert)}`);
      verifier(ouvert.champ, `${tag} fermenteur ouvert : le champ « Fermenteur [N] L » est visible`);
      verifier(!ouvert.plan && ouvert.pli && /^Volumes · .* L avant ébullition/.test(ouvert.pliTexte), `${tag} fermenteur ouvert : « Volumes et matériel » replié sur une ligne (${ouvert.pliTexte || 'absente'}), tableau caché: ${!ouvert.plan}`);
      verifier(ouvert.adapter >= 1 && ouvert.cadre.every((c) => c === '0px') && !ouvert.nomPlan, `${tag} fermenteur ouvert : les adaptations sont des liens sans cadre, sans la ligne « Matériel du plan » (${JSON.stringify(ouvert)})`);
      await controleFocus(page, tag, 'wz-fermenteur', true);
      await page.keyboard.down('Control'); await page.keyboard.press('KeyA'); await page.keyboard.up('Control');
      await page.keyboard.type('60'); await page.keyboard.press('Enter'); await dormir(500);
      verifier((await lire(page, sel('r4a-puce-fermenteur'), (n) => n.textContent)).includes('60'), `${tag} : la puce lit 60 L`);
      verifier((await page.$('[data-role="raz"]:not([hidden])')) !== null, `${tag} : « ↺ profil » apparaît`);
      verifier(await page.$eval('[data-role="raz"]', (n) => n.getClientRects().length > 0 && !!n.offsetParent), `${tag} fermenteur ouvert : « ↺ profil » est visible après 60`);
      verifier(Number(await derniere(page, 'volume')) >= 60, `${tag} : la règle du volume suit le fermenteur (${await derniere(page, 'volume')})`);
      await cap('app-fermenteur-60');
      await controleEntreTuiles(page, tag, 'fermenteur 60');
      verifier((await maxRegle(page, 'volume')) === 65 && (await derniereAvecChevron(page, 'volume')) === '60›', `${tag} fermenteur 60 : n° 10, règle du volume = fermenteur + 5 L (0–${await maxRegle(page, 'volume')}), dernier chiffre « ${await derniereAvecChevron(page, 'volume')} »`);

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
      const reperes = await page.$(sel('r4a-reperes'));
      verifier(!!reperes && await reperes.evaluate((n) => !n.hidden && n.getClientRects().length > 0), `${tag} : « Repères ⌄ » déplie la source et les plages restantes`);
      await page.evaluate(() => document.querySelector('[data-role="repbtn"]')?.scrollIntoView({ block: 'start' })); await dormir(200);
      await cap('app-reperes-ouverts');
      // R2 (second critique) : la cible « Lire la source » fait 24 px de haut au moins (WCAG 2.2, 2.5.8).
      const cibleSource = await page.$eval(`${sel('r4a-reperes')} .idn-src a`, (a) => { const r = a.getBoundingClientRect(); return { h: Math.round(r.height * 10) / 10, l: Math.round(r.width * 10) / 10 }; });
      lignes.push(`INFO ${tag} : cible « Lire la source » ${JSON.stringify(cibleSource)}`);
      verifier(cibleSource.h >= 24 && cibleSource.l >= 24, `${tag} repères ouverts : R2, la cible « Lire la source » fait 24 px au moins (${cibleSource.l} × ${cibleSource.h})`);
      await controleEntreTuiles(page, tag, 'repères ouverts');
      // n° 2 : une seule ligne de source, aucun bouton pleine largeur, pas de phrase explicative.
      const rep = await page.$eval(sel('r4a-reperes'), (n) => {
        const t = n.textContent.replace(/\s+/g, ' ');
        const l = n.getBoundingClientRect().width;
        const sources = [...n.querySelectorAll('*')].filter((x) => x.children.length === 0 && /BJCP|Lire la source/.test(x.textContent)).length;
        const large = [...n.querySelectorAll('button')].filter((b) => b.getBoundingClientRect().width >= l * 0.8).map((b) => b.textContent.trim());
        const src = n.querySelector('.idn-src');
        return { bjcp: (t.match(/BJCP/g) || []).length, lire: (t.match(/Lire la source/g) || []).length, large, phrase: /Points de départ de L/.test(t), src: src ? src.textContent.replace(/\s+/g, ' ').trim() : '', sources, boutons: n.querySelectorAll('button').length };
      });
      lignes.push(`INFO ${tag} : repères ${JSON.stringify(rep)}`);
      verifier(rep.bjcp === 1 && rep.lire <= 1 && rep.src === '16D · BJCP 2021 · Lire la source', `${tag} repères ouverts : une seule ligne de source « 16D · BJCP 2021 · Lire la source » (${rep.src}), BJCP écrit ${rep.bjcp} fois`);
      verifier(rep.large.length === 0 && !rep.phrase, `${tag} repères ouverts : aucun bouton pleine largeur ni phrase explicative (${JSON.stringify(rep.large)}, phrase ${rep.phrase})`);
      await page.evaluate(() => document.querySelector('[data-role="repbtn"]')?.click()); await dormir(200);
      verifier((await maxRegle(page, 'volume')) === 65 && (await derniereAvecChevron(page, 'volume')) === '60›', `${tag} cuve déborde : n° 10, règle du volume 0–${await maxRegle(page, 'volume')}, dernier chiffre « ${await derniereAvecChevron(page, 'volume')} » (fermenteur + 5 L)`);
      await cap('app-cuve-deborde');
      await controleEntreTuiles(page, tag, 'cuve déborde');
      // R1 (second critique) : au-delà de la cuve, seules les hachures rouges ; la part évaporée (bleue) ne se mêle pas au rouge (« violet »).
      const evap = await page.evaluate(() => {
        const e = document.querySelector('.idn-cevap'); const c = document.querySelector('.idn-ccuve'); if (!c) return null;
        const cr = c.getBoundingClientRect();
        if (!e) return { absente: true, gaucheCuve: Math.round(cr.left * 10) / 10 };
        const er = e.getBoundingClientRect();
        return { largeur: Math.round(er.width * 10) / 10, droiteEvap: Math.round(er.right * 10) / 10, gaucheCuve: Math.round(cr.left * 10) / 10 };
      });
      const moutDroite = await page.evaluate(() => { const m = document.querySelector('.idn-cmout'); return m ? Math.round(m.getBoundingClientRect().right * 10) / 10 : 0; });
      verifier(!!evap && moutDroite <= evap.gaucheCuve + 1, `${tag} cuve déborde : R1, le moût (or) s'arrête à la cuve, le reste est rouge seul (or jusqu'à ${moutDroite}, cuve à ${evap?.gaucheCuve})`);
      lignes.push(`INFO ${tag} : part évaporée de la barre ${JSON.stringify(evap)}`);
      verifier(!!evap && (evap.absente || evap.largeur <= 0.5 || evap.droiteEvap <= evap.gaucheCuve + 1), `${tag} cuve déborde : R1, aucun bleu au-delà de la cuve, donc pas de bout violet (${JSON.stringify(evap)})`);
      // « ↺ profil » rend la capacité du profil.
      await page.click('[data-role="raz"]'); await dormir(400);
      verifier(!(await lire(page, sel('r4a-puce-fermenteur'), (n) => n.textContent)).includes('60'), `${tag} : « ↺ profil » rend la capacité du profil`);
      await cap('app-profil-rendu');
      await controleEntreTuiles(page, tag, 'profil rendu');
      // Rien ne se perd : l'alerte du rinçage, retirée de l'écran, reste dite dans Matériel (« Rinçage impossible »).
      const alertesMat = await page.evaluate(() => [...document.querySelectorAll('[data-element="r4a-materiel"] [role="alert"], [data-element="r4a-materiel"] .equipment-plan-warning')].map((n) => n.textContent.replace(/\s+/g, ' ').trim().slice(0, 60)));
      lignes.push(`INFO ${tag} : alertes gardées dans Matériel ${JSON.stringify(alertesMat)}`);
      verifier(alertesMat.length >= 1, `${tag} profil rendu : les alertes d'installation restent dites dans la tuile Matériel (${alertesMat.length})`);
      // Un volume au-delà du fermenteur : « +25 L de trop », jamais une valeur négative.
      const espaceBloc = await page.evaluate(() => [...document.querySelectorAll('.equipment-plan-secondary')].find((d) => /Espace libre/.test(d.textContent))?.textContent.replace(/\s+/g, ' ') ?? '');
      lignes.push(`INFO ${tag} : bloc « Espace libre » = ${espaceBloc}`);
      verifier(/\+25 L de trop/.test(espaceBloc) && !/[−-]\s?\d/.test(espaceBloc), `${tag} : le bloc dit « +25 L de trop », sans valeur négative (${espaceBloc})`);
    }

    // 4 bis. La recette vide : l'import dans le corps, pas de plages (aucun style), moût avant ébullition inconnu (« — »).
    await ouvrirIdentite(page, true);
    await cap('app-vide');
    await controleEntreTuiles(page, tag, 'vide');
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
    await controleFocus(page, tag, 'wz-boil');
    await page.keyboard.press('Enter'); await dormir(300);
    verifier((await maxRegle(page, 'ebullition')) === 210, `${tag} : 180 min tapé → règle 0–210 (${await maxRegle(page, 'ebullition')})`);
    await cap('app-clavier-apres');
    await controleEntreTuiles(page, tag, 'clavier après');
    await controleFocus(page, tag, 'wz-volume');
    await page.keyboard.press('Escape'); await dormir(200);
    // n° 6 : la colonne des autres étapes (Fermentescibles), mesurée dans le même rendu.
    await page.evaluate(() => { const b = [...document.querySelectorAll('nav[aria-label="Étapes"] button')].find((x) => /Fermentescibles/.test(x.textContent)); b.click(); });
    await dormir(700);
    const autre = await page.evaluate(() => {
      const c = document.querySelector('.recipe-wizard main > div');
      const largeurs = [...c.querySelectorAll(':scope > *, :scope > fieldset > *')].map((n) => Math.round(n.getBoundingClientRect().width)).filter((w) => w > 100);
      return { cadre: Math.round(c.getBoundingClientRect().width), plus: Math.max(...largeurs, 0) };
    });
    lignes.push(`INFO ${tag} : colonne Identité ${colId} px ; autres étapes (Fermentescibles) : ${JSON.stringify(autre)}`);
    verifier(Math.abs(colId - autre.plus) <= 20 || !(autre.plus > 0), `${tag} : n° 6, la colonne d'Identité (${colId} px) a la largeur de celle des autres étapes (${autre.plus} px)`);

    // 6. Sans erreur de page.
    verifier(journal.erreurs.length === 0, `${tag} : aucune erreur de page (${journal.erreurs.slice(0, 2).join(' ; ')})`);
    // 7. La maquette au même format, puis côte à côte.
    const m = await ouvrir({ largeur, hauteur: mobile ? 844 : 900, mobile, echelle: 2 });
    await m.page.goto(pathToFileURL(MAQUETTE).href, { waitUntil: 'load' });
    await dormir(500);
    await m.page.screenshot({ path: path.join(SORTIE, `maquette-repos-${tag}.png`) });
    await m.browser.close();
    // Le brouillon de la page persiste (localStorage) : le repos à comparer à la maquette s'ouvre dans un Chrome neuf.
    const frais = await ouvrir({ largeur, hauteur: mobile ? 844 : 900, mobile, echelle: 2 });
    await ouvrirIdentite(frais.page);
    await frais.page.screenshot({ path: path.join(SORTIE, `app-repos-bis-${tag}.png`) });
    await frais.browser.close();
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
