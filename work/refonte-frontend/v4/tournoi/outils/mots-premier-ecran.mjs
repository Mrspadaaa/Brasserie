// Compte les mots visibles dans le premier écran à 390 × 844, pour chaque maquette.
// Usage : node work/refonte-frontend/v4/tournoi/outils/mots-premier-ecran.mjs <dossier-etape> [ids…] [--max=N]
// Un mot est compté s'il appartient à un nœud texte visible dont la boîte touche le
// premier écran. Les chiffres comptent comme des mots. Sortie : une ligne par maquette,
// puis MOTS OK si toutes respectent --max (si fourni), sinon MOTS ECHEC.
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import puppeteer from 'puppeteer-core';

const args = process.argv.slice(2);
const max = Number((args.find((a) => a.startsWith('--max=')) || '').slice(6)) || null;
const modere = args.includes('--modere');
const alertes = [];
// --page=etat-b.html : compte un autre fichier de chaque dossier (défaut : index.html).
const pageFile = (args.find((a) => a.startsWith('--page=')) || '--page=index.html').slice(7);
// --sans-donnees (20.10, d'après le critique du lot 21 : « les données restent, l'explication part ») :
// ne compte ni les noms des 12 familles, ni les nombres, plages, unités et signes de mesure, ni les noms
// de houblons et de levures ; restent les mots qui expliquent. La règle des 70 mots sur ce compte a
// empêché l5e de couper des mots utiles (icônes muettes, D90) tout en laissant passer les explications.
const sansDonnees = args.includes('--sans-donnees');
// --sans-coquille (24.10, D116) : ne compte pas l'en-tête de l'app (le <header> de PageShell : fil d'étapes, onglets,
// croix), qui est son cadre et non le contenu de l'écran ; le brasseur a demandé « le vrai Stepper de la vrai app ».
// Dans tous les cas, un texte réservé aux lecteurs d'écran (sr-only, boîte de 1 px ou moins) n'est pas lu.
const sansCoquille = args.includes('--sans-coquille');
const rest = args.filter((a) => !a.startsWith('--'));
const dir = path.resolve(rest[0] || '.');
const only = rest.slice(1);
const ids = fs.readdirSync(dir)
  .filter((d) => fs.existsSync(path.join(dir, d, pageFile)))
  .filter((d) => (only.length ? only.includes(d) : /^p\d+|^consolide$|^version-/.test(d)))
  .sort();

const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
let over = 0;
for (const id of ids) {
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
  await page.goto(pathToFileURL(path.join(dir, id, pageFile)).href, { waitUntil: 'networkidle0', timeout: 30000 });
  await new Promise((r) => setTimeout(r, 300));
  const n = await page.evaluate((sansDonnees, sansCoquille) => {
    const H = innerHeight;
    const DONNEE = /^(floral|herbacé|terreux|agrumes|tropicaux|tropical|noyau|pépins|baies|melon|résineux|épicé|végétal|citra|cascade|galaxy|idaho|motueka|nelson|sauvin|cryo|nugget|aurum|celeia|columbus|hallertau|blanc|east|kent|goldings|us-05|verdant|pomona|diamond|lalbrew|g\/l|g|ml\/100|%|ibu|ebc|j|h|°c|crans?|α|[≈~±×+−–\-=<>≤≥]+)$/i;
    const estDonnee = (w) => DONNEE.test(w) || /^[~≈±×+−–\-]?\d+([,.]\d+)?([–\-]\d+([,.]\d+)?)?[%′″]?$/.test(w) || /^\d+([,.]\d+)?(g|j|h|%|′)$/.test(w) || /^[\d,.\s–\-×%′+−~≈]+$/.test(w);
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    let words = 0;
    const range = document.createRange();
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      const text = node.textContent.trim();
      if (!text) continue;
      const el = node.parentElement;
      const cs = getComputedStyle(el);
      if (cs.visibility === 'hidden' || cs.display === 'none' || Number(cs.opacity) === 0) continue;
      const boite = el.getBoundingClientRect();
      if (boite.width <= 1 && boite.height <= 1) continue;
      if (sansCoquille && el.closest('[data-page-shell] header')) continue;
      range.selectNodeContents(node);
      const r = range.getBoundingClientRect();
      if (r.width === 0 || r.height === 0 || r.bottom <= 0 || r.top >= H) continue;
      const mots = text.split(/\s+/).filter(Boolean);
      words += sansDonnees ? mots.filter((w) => !estDonnee(w.replace(/[(),:;.!?«»"]/g, ''))).length : mots.length;
    }
    // Textes SVG dessinés aussi comptés par le parcours ci-dessus (nœuds texte).
    return words;
  }, sansDonnees, sansCoquille);
  await page.close();
  // --modere (24.10, soir : « dépasse les 70 mots au premier écran c'est pas ultra grave. Il faut être modéré avec les
  // mots ») : au-dessus du seuil, une alerte ; l'échec seulement au-delà de 40 % de plus.
  const bad = max && n > (modere ? Math.floor(max * 1.4) : max);
  const alerte = max && !bad && n > max;
  if (bad) over++;
  if (alerte) alertes.push(`${id} ${n}`);
  console.log(id + ' ' + n + ' mots' + (sansDonnees ? ' (hors données)' : '') + (bad ? ' (> ' + max + ')' : alerte ? ' (alerte : > ' + max + ', modéré)' : ''));
}
await browser.close();
if (max) console.log(over === 0 ? 'MOTS OK' + (alertes.length ? ` (alerte modérée : ${alertes.join(', ')} au-dessus de ${max})` : '') : 'MOTS ECHEC ' + over + '/' + ids.length + ' au-dessus de ' + (modere ? `${Math.floor(max * 1.4)} (seuil ${max} + 40 %)` : max));
