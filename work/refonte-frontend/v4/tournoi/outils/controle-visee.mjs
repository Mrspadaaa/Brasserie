#!/usr/bin/env node
// D108 (23.10, soir) : « Aussi aucun impact sur je met plus, moins bannir ect.. » (commentaire sur « Tropicaux
// prévu », Ma bière, maquette publiée d332792c). Dans l'onglet Ma bière, « + » sur Tropicaux ne changeait rien sur la
// barre : seul le mot « plus » changeait, et une puce « + tropicaux » apparaissait hors de l'écran. Même chose pour
// « − » et « bannir ». Sa base v4.10 (base/consolide/biere.html, son choix « Ça aussi », la visée « en trait creux »
// qu'il avait dite « Parfait », 18.10) dessine la visée SUR la piste : un losange blanc à son niveau, relié au point de
// la bière par un trait pointillé ; « + » et « − » montent ou descendent d'un palier (échelle absolue 0 à 3 : faible
// 0,5 ; moyen 1,5 ; marqué 2,5), le palier est nommé entre les boutons, « × » retire la visée ; « bannir », c'est la
// visée à 0 : le nom de la famille est barré et grisé. Règle n° 1 : ce contrôle garde cette base, il ne décide pas de
// la forme.
//
// Règle : chaque geste de visée change la piste de la famille, et se lit sur la piste.
// Contrat de marqueurs (le même dans la voie p1), page à 390 × 844, tactile :
//   [data-famille-ligne="<famille>"]   la ligne ; elle s'ouvre par son bouton [aria-expanded]
//   [data-visee="plus|moins|bannir|retirer"]   les gestes (le « × » est « retirer »), dans le groupe ouvert
//   [data-biere-point]  le point de la bière ; [data-visee-marque][data-niveau]  le losange (palier visé, 0 à 3) ;
//   [data-visee-lien]  le trait qui les relie ; [data-palier]  le palier nommé, un mot ; [data-bannie]  sur la ligne
//   d'une famille bannie, dont le nom est barré (text-decoration line-through), ligne REFERMÉE.
// Six règles, jouées pour de vrai (toucher tactile, une page rechargée par scénario) :
//   1 repos : pas de losange sur la famille ;
//   2 « + » : losange visible à droite du point, un seul, trait qui les relie (à 4 px près), HTML de la piste changé,
//     palier nommé (un mot, changé), « × » visible ;
//   3 « − » (depuis le repos) : losange à gauche du point, même contrôle ;
//   4 « + » deux fois : le palier monte (data-niveau et position), sans dépasser 3 ;
//   5 « × » après « + » : le losange disparaît ;
//   6 « bannir » puis ligne refermée : [data-bannie] et nom barré visibles sans rouvrir ; losange (s'il est dessiné) à 0.
// La piste se lit par [data-role="piste"], [data-barre] ou .piste-f, à défaut le parent du point ou le bouton de la ligne.
//
// Usage : node controle-visee.mjs <dossier> [--famille=tropical] [--page=chemin]
//   Page : <dossier>/biere/etat.html, ou le fichier donné par --page. Une ligne par règle, puis
//   « VISEE OK (6/6, <famille>) » (code 0), ou « VISEE ECHEC » et une ligne « - D108 … » par manque (code 1) ;
//   code 2 si la page manque.
// Témoins (temoins/) : visee-base (sa base v4.10, seulement balisée) → OK ; visee-sans-trace (« + » ne change que le
//   mot) → ECHEC ; visee-mauvais-cote (le losange de « + » à gauche du point) → ECHEC. La maquette d332792c → ECHEC.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ICI = path.dirname(fileURLToPath(import.meta.url));
const RACINE = path.resolve(ICI, '../../../../..');
const puppeteer = createRequire(path.join(RACINE, 'package.json'))('puppeteer-core');
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';

const args = process.argv.slice(2);
const pos = args.filter((a) => !a.startsWith('--'));
const opt = (n, d) => (args.find((a) => a.startsWith('--' + n + '=')) || '').slice(n.length + 3) || d;
const famille = opt('famille', 'tropical');
const pageOpt = opt('page', '');
if (!pageOpt && !pos[0]) { console.log('Usage : node controle-visee.mjs <dossier> [--famille=tropical] [--page=chemin]'); process.exit(2); }
const fPage = path.resolve(pageOpt || path.join(pos[0], 'biere', 'etat.html'));
if (!fs.existsSync(fPage)) { console.log('VISEE ECHEC : page absente (' + fPage + ')'); process.exit(2); }

const SEL = '[data-famille-ligne="' + famille + '"]';
const attente = (ms) => new Promise((r) => setTimeout(r, ms));
const browser = await puppeteer.launch({ executablePath: CHROME, headless: true });
const p = await browser.newPage();
await p.setViewport({ width: 390, height: 844, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
const charger = async () => {
  await p.goto(pathToFileURL(fPage).href, { waitUntil: 'networkidle0', timeout: 30000 }).catch(() => {});
  await attente(500);
};

// Mesure de la ligne, dans la page (les éléments sont repris à chaque lecture : un rendu peut les remplacer).
const lire = (sel, famille) => {
  const row = document.querySelector(sel);
  if (!row) return { ligne: false };
  const vis = (e) => !!e && e.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true }) && e.getBoundingClientRect().width > 0;
  const centre = (e) => { const r = e.getBoundingClientRect(); return r.left + r.width / 2; };
  const bouton = row.querySelector('[aria-expanded]');
  const point = row.querySelector('[data-biere-point]');
  const marques = [...row.querySelectorAll('[data-visee-marque]')];
  const marque = marques.find(vis) || marques[0] || null;
  const lien = row.querySelector('[data-visee-lien]');
  const palier = row.querySelector('[data-palier]');
  const piste = row.querySelector('[data-role="piste"], [data-barre], .piste-f') || (point && point.parentElement) || bouton;
  const geste = (g) => { const e = row.querySelector('[data-visee="' + g + '"]'); return { existe: !!e, visible: vis(e) }; };
  let barre = false;
  if (bouton) {
    const chaine = [bouton, ...bouton.querySelectorAll('*')];
    barre = chaine.some((e) => (getComputedStyle(e).textDecorationLine || '').includes('line-through'));
  }
  const rl = lien ? lien.getBoundingClientRect() : null;
  return {
    ligne: true,
    ouverte: bouton ? bouton.getAttribute('aria-expanded') === 'true' : null,
    piste: piste ? piste.innerHTML : null,
    point: point ? { visible: vis(point), x: centre(point) } : null,
    marques: marques.length,
    marque: marque ? { visible: vis(marque), x: centre(marque), niveau: marque.getAttribute('data-niveau') } : null,
    lien: lien ? { visible: vis(lien), g: rl.left, d: rl.right } : null,
    palier: palier ? { visible: vis(palier), texte: (palier.textContent || '').replace(/\s+/g, ' ').trim() } : null,
    gestes: { plus: geste('plus'), moins: geste('moins'), bannir: geste('bannir'), retirer: geste('retirer') },
    bannie: row.hasAttribute('data-bannie') || !!row.querySelector('[data-bannie]'),
    barre,
    famille,
  };
};
const mesurer = () => p.evaluate(lire, SEL, famille);

// Un toucher sur un élément de la ligne (repris dans la page au moment du geste).
const toucher = async (selecteur) => {
  const h = await p.$(SEL + ' ' + selecteur);
  if (!h) return false;
  try { await h.tap(); } catch { return false; }
  await attente(550);
  return true;
};
const ouvrir = async () => {
  const e = await mesurer();
  if (e.ligne && !e.ouverte) await toucher('[aria-expanded]');
};
// Un scénario : page rechargée, ligne ouverte, instantané « avant », puis les gestes ; rend l'instantané après chaque geste.
const jouer = async (gestes, refermer = false) => {
  await charger();
  const avant0 = await mesurer();
  if (!avant0.ligne) return { sansLigne: true };
  await ouvrir();
  const avant = await mesurer();
  const etapes = [], manques = [];
  for (const g of gestes) {
    const ok = await toucher('[data-visee="' + g + '"]');
    if (!ok) manques.push(g);
    etapes.push(await mesurer());
  }
  let ferme = null;
  if (refermer) {
    await toucher('[aria-expanded]');
    ferme = await mesurer();
  }
  return { avant, etapes, manques, ferme };
};
const mot = (t) => !!t && /^[\p{L}-]+$/u.test(t);

const rapport = []; // [n, titre, [manques]]
const regle = (n, titre, manques) => rapport.push([n, titre, manques]);
const pasDeLigne = (n, titre) => regle(n, titre, ['aucune ligne ' + SEL + ' sur la page (famille « ' + famille + ' »)']);

// Contrôle commun d'un geste qui pose la visée : sens, trait, piste, palier, « × ».
const trace = (geste, avant, apres, sens) => {
  const m = [], nom = '« ' + geste + ' »';
  if (!apres.marque || !apres.marque.visible) {
    m.push(nom + ' ne dessine aucun losange [data-visee-marque] sur la piste' + (avant.piste === apres.piste ? ' (le HTML de la piste est identique avant et après)' : ''));
  } else {
    if (apres.marques > 1) m.push(nom + ' : ' + apres.marques + ' losanges sur la piste, un seul attendu');
    if (!apres.point || !apres.point.visible) m.push(nom + ' : point de la bière [data-biere-point] absent ou caché, le côté du losange ne se vérifie pas');
    else if (sens > 0 ? !(apres.marque.x > apres.point.x) : !(apres.marque.x < apres.point.x)) {
      m.push(nom + ' : losange à ' + Math.round(apres.marque.x) + ' px, du mauvais côté du point (' + Math.round(apres.point.x) + ' px) : ' + (sens > 0 ? 'plus doit être à droite' : 'moins doit être à gauche'));
    }
    if (apres.point && apres.point.visible) {
      const a = Math.min(apres.point.x, apres.marque.x), b = Math.max(apres.point.x, apres.marque.x);
      if (!apres.lien || !apres.lien.visible) m.push(nom + ' : aucun trait [data-visee-lien] entre le point et le losange');
      else if (apres.lien.g > a + 4 || apres.lien.d < b - 4) m.push(nom + ' : le trait (' + Math.round(apres.lien.g) + ' à ' + Math.round(apres.lien.d) + ' px) ne couvre pas l\'écart point–losange (' + Math.round(a) + ' à ' + Math.round(b) + ' px)');
    }
  }
  if (avant.piste === apres.piste) m.push(nom + ' : le HTML de la piste n\'a pas changé');
  if (!apres.palier || !apres.palier.visible || !mot(apres.palier.texte)) m.push(nom + ' : palier [data-palier] absent ou pas un mot' + (apres.palier ? ' (« ' + apres.palier.texte + ' »)' : ''));
  else if (avant.palier && avant.palier.texte === apres.palier.texte) m.push(nom + ' : le palier nommé n\'a pas changé (« ' + apres.palier.texte + ' »)');
  if (!apres.gestes.retirer.visible) m.push(nom + ' : « × » [data-visee="retirer"] pas visible');
  return m;
};

// 1. repos
{
  await charger();
  const e = await mesurer();
  if (!e.ligne) pasDeLigne(1, 'repos : pas de losange');
  else {
    await ouvrir();
    const o = await mesurer();
    const m = [];
    if (e.marques > 0) m.push('un losange [data-visee-marque] est dessiné sans visée sur « ' + famille + ' »');
    if (o.marques > 0) m.push('un losange est dessiné à l\'ouverture de la ligne, sans geste');
    regle(1, 'repos : pas de losange sans visée', m);
  }
}
// 2. « + »
{
  const r = await jouer(['plus']);
  if (r.sansLigne) pasDeLigne(2, '« + » : losange à droite, relié, palier');
  else regle(2, '« + » : losange à droite, relié, palier', [...r.manques.map((g) => 'geste [data-visee="' + g + '"] introuvable ou intouchable'), ...(r.manques.length ? [] : trace('+', r.avant, r.etapes[0], 1))]);
}
// 3. « − »
{
  const r = await jouer(['moins']);
  if (r.sansLigne) pasDeLigne(3, '« − » : losange à gauche, relié, palier');
  else regle(3, '« − » : losange à gauche, relié, palier', [...r.manques.map((g) => 'geste [data-visee="' + g + '"] introuvable ou intouchable'), ...(r.manques.length ? [] : trace('−', r.avant, r.etapes[0], -1))]);
}
// 4. « + » deux fois
{
  const r = await jouer(['plus', 'plus']);
  if (r.sansLigne) pasDeLigne(4, '« + » deux fois : le losange monte');
  else {
    const m = r.manques.map((g) => 'geste [data-visee="' + g + '"] introuvable ou intouchable');
    const [a, b] = r.etapes;
    if (!m.length) {
      if (!a.marque || !a.marque.visible || !b.marque || !b.marque.visible) m.push('« + » deux fois : pas de losange visible (' + (a.marque && a.marque.visible ? 'perdu au second' : 'absent dès le premier') + ')');
      else {
        const na = parseFloat(a.marque.niveau), nb = parseFloat(b.marque.niveau);
        if (!(nb > na)) m.push('« + » deux fois : data-niveau ne monte pas (' + a.marque.niveau + ' puis ' + b.marque.niveau + ')');
        if (!(nb <= 3)) m.push('« + » deux fois : data-niveau dépasse 3 (' + b.marque.niveau + ')');
        if (!(b.marque.x > a.marque.x + 1)) m.push('« + » deux fois : le losange ne monte pas sur la piste (' + Math.round(a.marque.x) + ' puis ' + Math.round(b.marque.x) + ' px)');
      }
    }
    regle(4, '« + » deux fois : le losange monte d\'un palier', m);
  }
}
// 5. « × »
{
  const r = await jouer(['plus', 'retirer']);
  if (r.sansLigne) pasDeLigne(5, '« × » : le losange disparaît');
  else {
    const m = r.manques.map((g) => 'geste [data-visee="' + g + '"] introuvable ou intouchable');
    const [a, b] = r.etapes;
    if (!m.length) {
      if (!a.marque || !a.marque.visible) m.push('« + » ne dessine aucun losange : « × » n\'a rien à retirer');
      else if (b.marque && b.marque.visible) m.push('« × » : le losange est toujours sur la piste');
    }
    regle(5, '« × » : le losange disparaît', m);
  }
}
// 6. « bannir », ligne refermée
{
  const r = await jouer(['bannir'], true);
  if (r.sansLigne) pasDeLigne(6, '« bannir » : nom barré, ligne refermée');
  else {
    const m = r.manques.map((g) => 'geste [data-visee="' + g + '"] introuvable ou intouchable');
    if (!m.length) {
      const f = r.ferme;
      if (f.ouverte !== false) m.push('la ligne ne se referme pas par son bouton [aria-expanded]');
      if (f.gestes.plus.visible) m.push('la ligne refermée montre encore ses gestes');
      if (!f.bannie) m.push('« bannir » : pas de [data-bannie] sur la ligne refermée');
      if (!f.barre) m.push('« bannir » : le nom n\'est pas barré (text-decoration line-through) ligne refermée');
      if (f.marque && f.marque.visible && !(parseFloat(f.marque.niveau) === 0)) m.push('« bannir » : le losange est au niveau ' + f.marque.niveau + ', pas 0');
    }
    regle(6, '« bannir » : nom barré, ligne refermée', m);
  }
}
await browser.close();

let bons = 0;
for (const [n, titre, m] of rapport) { if (!m.length) bons++; console.log(n + ' · ' + titre + ' · ' + (m.length ? 'ECHEC' : 'OK')); }
if (bons === rapport.length) { console.log('VISEE OK (' + bons + '/' + rapport.length + ', ' + famille + ')'); process.exit(0); }
console.log('VISEE ECHEC (' + bons + '/' + rapport.length + ', ' + famille + ')');
for (const [n, , m] of rapport) for (const x of m) console.log('- D108 règle ' + n + ' : ' + x);
process.exit(1);
