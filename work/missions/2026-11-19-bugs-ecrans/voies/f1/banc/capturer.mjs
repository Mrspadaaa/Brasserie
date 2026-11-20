// Captures de la voie f1 : node scripts/with_server.mjs --server "npx vite --port 3108 --strictPort" --port 3108 -- node <ce fichier> [390-clair,390-cave,1280-clair,1280-cave]
// Fiche « Milk Stout » du banc (données simulées), 390 tactile et 1280, clair et cave. Chaque PNG est à ouvrir.
// Ajouts (20.11, DEMANDE EXECUTANT) : défilement du conteneur par pas de 700 px (fiche-<taille>-<thème>-<n>.png) ;
// onglet Simuler à 390 clair (fiche-390-clair-simuler.png), après « Détail des ajouts et IBU ».
import { ouvrir, calme, cliquerTexte } from '../../../../../../.claude/skills/webapp-testing/examples/_lanceur.mjs';
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ici = dirname(fileURLToPath(import.meta.url));
const sortie = join(ici, '..', 'captures');
mkdirSync(sortie, { recursive: true });
const URL = 'http://localhost:3108/work/missions/2026-11-19-bugs-ecrans/voies/f1/banc/index.html';
const tailles = [{ nom: '390', largeur: 390, hauteur: 844, mobile: true }, { nom: '1280', largeur: 1280, hauteur: 900, mobile: false }];
const themes = ['clair', 'cave'];
const PAS = 700;
const MAX_PAS = 12;
const DELAI_COMBO = 240000; // une combinaison bloquée ne bloque pas les autres
const seuls = process.argv[2] ? process.argv[2].split(',') : null; // filtre optionnel : 390-clair,390-cave,…

const selecteurConteneur = 'main, [data-scroll], .overflow-y-auto';

// Position de défilement : conteneur s'il défile, sinon la fenêtre.
const defiler = (y) => {
  const el = document.querySelector('main, [data-scroll], .overflow-y-auto');
  const conteneur = el && el.scrollHeight > el.clientHeight ? el : null;
  if (conteneur) conteneur.scrollTop = y; else window.scrollTo(0, y);
  return conteneur ? conteneur.scrollTop : window.scrollY;
};
const hauteurDefilable = () => {
  const el = document.querySelector('main, [data-scroll], .overflow-y-auto');
  return el && el.scrollHeight > el.clientHeight ? el.scrollHeight - el.clientHeight : document.documentElement.scrollHeight - window.innerHeight;
};

// Clic sur un élément dont le texte est exactement ce mot (évite « Simuler une variante de levure »).
const cliquerExact = (page, mot) => page.evaluate((m) => {
  const el = [...document.querySelectorAll('button, [role="tab"], [role="button"], a')].find((e) => e.textContent.trim() === m);
  if (!el) return false;
  el.click();
  return true;
}, mot);

async function combo(t, theme) {
  const { browser, page, journal } = await ouvrir({ largeur: t.largeur, hauteur: t.hauteur, mobile: t.mobile });
  try {
    await page.evaluateOnNewDocument((th) => { try { localStorage.setItem('laffinee.theme', th); } catch {} }, theme);
    await page.goto(URL, { waitUntil: 'networkidle0' });
    await calme(page, 1200);
    // Ouvre toutes les sections de la fiche pour que la capture montre Houblons, Additifs et Brassins.
    await page.evaluate(() => document.querySelectorAll('details').forEach((d) => { d.open = true; }));
    await calme(page, 600);
    await page.screenshot({ path: join(sortie, `fiche-${t.nom}-${theme}.png`), fullPage: true });

    // Défilement par pas de PAS px : une capture par pas, jusqu'au bas du conteneur.
    const cible = await page.evaluate(() => { const el = document.querySelector('main, [data-scroll], .overflow-y-auto'); return el && el.scrollHeight > el.clientHeight ? 'conteneur' : 'fenetre'; });
    const hauteurTotale = await page.evaluate(hauteurDefilable);
    const nbPas = Math.min(MAX_PAS, Math.ceil(hauteurTotale / PAS) + 1);
    const positions = [];
    for (let n = 0; n < nbPas; n++) {
      const position = await page.evaluate(defiler, n * PAS);
      await calme(page, 300);
      await page.screenshot({ path: join(sortie, `fiche-${t.nom}-${theme}-${n}.png`) });
      positions.push(`${n}:${Math.round(position)}`);
    }

    const texte = await page.evaluate(() => document.body.innerText);
    console.log(`${t.nom} ${theme} (${cible}, ${nbPas} pas, positions ${positions.join(' ')}) : erreurs ${journal.erreurs.length} ; IBU ${/IBU\s*\n?\s*(\d+)/.exec(texte)?.[1] ?? '?'} ; aucun brassin ${/aucun brassin/.test(texte)} ; Rstgerste ${/Rstgerste|Caramnch/.test(texte)} ; Lactose sous Houblons ${/Houblons[\s\S]{0,400}Lactose/.test(texte)}`);
    if (journal.erreurs.length) console.log(journal.erreurs.slice(0, 3));

    // k2 (20.11) : colonne de la fiche et barre « Préparer un brassin » (n° 15), à comparer à 1280.
    const largeurs = await page.evaluate(() => {
      const col = document.querySelector('[data-element="r1-colonne"]');
      const pied = document.querySelector('footer button');
      const barre = pied && pied.parentElement;
      const l = (e) => e ? Math.round(e.getBoundingClientRect().width) : null;
      const x = (e) => e ? Math.round(e.getBoundingClientRect().left) : null;
      return { colonne: l(col), colonneX: x(col), barre: l(barre), barreX: x(barre) };
    });
    console.log(`Largeurs ${t.nom} ${theme} : colonne ${largeurs.colonne} px (x ${largeurs.colonneX}) ; barre ${largeurs.barre} px (x ${largeurs.barreX})`);

    // Onglet Simuler (k2, preuve 1) : ouvrir « Détail des ajouts et IBU », chercher l'onglet « Simuler » (rôle tab, nom exact) ;
    // repli : le bouton au texte exact « Simuler » ; s'il n'y est pas, « Potentiel aromatique » (où vit l'atelier à onglets).
    await page.evaluate((s) => { const el = document.querySelector(s); if (el) el.scrollTop = 0; window.scrollTo(0, 0); }, selecteurConteneur);
    await cliquerTexte(page, 'Détail des ajouts et IBU');
    await calme(page, 600);
    const cliquerOnglet = () => page.evaluate(() => {
      const onglet = [...document.querySelectorAll('[role="tab"]')].find((e) => (e.getAttribute('aria-label') ?? e.textContent).trim() === 'Simuler');
      if (onglet) { onglet.click(); return 'rôle tab'; }
      const bouton = [...document.querySelectorAll('button')].find((e) => e.textContent.trim() === 'Simuler' && !e.getAttribute('aria-label'));
      if (bouton) { bouton.click(); return 'bouton exact'; }
      return null;
    });
    let trouve = await cliquerOnglet();
    let ou = 'Détail des ajouts et IBU';
    if (!trouve) {
      await cliquerTexte(page, 'Potentiel aromatique');
      await calme(page, 2500); // l'atelier se monte à la première ouverture
      trouve = await cliquerOnglet();
      ou = 'Potentiel aromatique';
    }
    await calme(page, 1200);
    await page.evaluate(() => { const p = document.querySelector('[role="tabpanel"]'); if (p) p.scrollIntoView({ block: 'start' }); });
    await calme(page, 400);
    await page.screenshot({ path: join(sortie, `fiche-${t.nom}-${theme}-simuler.png`) });
    const simuler = await page.evaluate(() => {
      const panneau = document.querySelector('[role="tabpanel"]');
      const texte = panneau ? panneau.innerText : '';
      const i = texte.indexOf('Viser des IBU');
      return { corps: document.body.innerText, viser: i >= 0 ? texte.slice(i, i + 420).replace(/\s+/g, ' ') : null };
    });
    console.log(`Simuler ${t.nom} ${theme} : onglet trouvé ${trouve ? 'true' : 'false'} (${trouve ?? '—'}, dans « ${ou} ») ; « durée d'ébullition » ${/durée d.ébullition/i.test(simuler.corps) ? 'PRÉSENTE' : 'absente'} ; erreurs ${journal.erreurs.length}`);
    console.log(`  Viser des IBU : ${simuler.viser ?? 'texte absent'}`);
  } finally {
    await browser.close();
  }
}

for (const t of tailles) for (const theme of themes) {
  const cle = `${t.nom}-${theme}`;
  if (seuls && !seuls.includes(cle)) continue;
  const delai = new Promise((_, rejet) => setTimeout(() => rejet(new Error(`délai dépassé : ${cle}`)), DELAI_COMBO));
  try {
    await Promise.race([combo(t, theme), delai]);
  } catch (e) {
    console.log(`ÉCHEC ${cle} : ${e.message}`);
  }
}
