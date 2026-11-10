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
// --profil=sans-houblons (o1, 31.10, D202) : ne compte que le texte réellement visible au premier écran. Ni le texte d'un
// <details> fermé (sauf son <summary>), ni celui qu'un conteneur à défilement ou rogné (overflow) cache : rangs hors de la
// boîte d'une molette, bas d'une zone qui défile caché sous le pied. Sans l'option (profil houblons), le comptage reste
// celui d'avant : sur les maquettes houblons choisies, il donne d'autres nombres (comparer 102 → 92, fiche 186 → 166,
// substituer 86 → 73, suggérer 111 → 105 le 31.10) ; le pilote tranche s'il devient le défaut.
const profil = (args.find((a) => a.startsWith('--profil=')) || '--profil=houblons').slice(9);
if (!['houblons', 'sans-houblons'].includes(profil)) { console.log('Profil inconnu : ' + profil + ' (houblons ou sans-houblons)'); process.exit(2); }
const seulementVisible = profil === 'sans-houblons';
// --sans-lignes (D238, 01.11, Dépense passe 3 : « je vois le maximum d'items ») : ne compte pas le texte des lignes de facture,
// marquées data-mots="lignes" (nom, quantité, montant, pastilles, sous-totaux de groupe) ; le récap, les points et le reste comptent.
const sansLignes = args.includes('--sans-lignes');
const rest = args.filter((a) => !a.startsWith('--'));
const dir = path.resolve(rest[0] || '.');
const only = rest.slice(1);
const ids = fs.readdirSync(dir)
  .filter((d) => fs.existsSync(path.join(dir, d, pageFile)))
  .filter((d) => (only.length ? only.includes(d) : /^p\d+|^consolide$|^version-/.test(d)))
  .sort();
// Rien à compter n'est pas un succès (31.10 : sans --page=etat.html, MOTS OK sans avoir rien lu).
const manquants = only.filter((d) => !ids.includes(d));
if (!ids.length || manquants.length) {
  console.log('MOTS ECHEC : ' + (manquants.length ? manquants.join(', ') : 'aucun dossier') + ' sans ' + pageFile);
  process.exit(1);
}

const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
let over = 0;
for (const id of ids) {
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
  await page.goto(pathToFileURL(path.join(dir, id, pageFile)).href, { waitUntil: 'networkidle0', timeout: 30000 });
  await new Promise((r) => setTimeout(r, 300));
  const n = await page.evaluate((sansDonnees, sansCoquille, seulementVisible, sansLignes) => {
    const H = innerHeight;
    const DONNEE = /^(floral|herbacé|terreux|agrumes|tropicaux|tropical|noyau|pépins|baies|melon|résineux|épicé|végétal|citra|cascade|galaxy|idaho|motueka|nelson|sauvin|cryo|nugget|aurum|celeia|columbus|hallertau|blanc|east|kent|goldings|us-05|verdant|pomona|diamond|lalbrew|g\/l|g|ml\/100|%|ibu|ebc|j|h|°c|crans?|α|[≈~±×+−–\-=<>≤≥]+)$/i;
    const estDonnee = (w) => DONNEE.test(w) || /^[~≈±×+−–\-]?\d+([,.]\d+)?([–\-]\d+([,.]\d+)?)?[%′″]?$/.test(w) || /^\d+([,.]\d+)?(g|j|h|%|′)$/.test(w) || /^[\d,.\s–\-×%′+−~≈]+$/.test(w);
    // Un <details> fermé cache tout sauf son <summary>.
    const replie = (el) => {
      for (let x = el; x && x !== document.body; x = x.parentElement) {
        if (x.tagName !== 'DETAILS' || x.open) continue;
        const sum = [...x.children].find((c) => c.tagName === 'SUMMARY');
        if (!(sum && sum.contains(el))) return true;
      }
      return false;
    };
    // La boîte réellement visible d'un texte (rect r de son nœud) une fois rognée par les ancêtres qui coupent
    // (overflow autre que visible). Un élément absolu ne subit que le rognage de son bloc conteneur et de ses
    // ancêtres ; un fixe, aucun. { intact: true } si rien n'est coupé ; { intact: false, box: null } si tout l'est.
    const boiteVisible = (el, r) => {
      let box = { left: r.left, top: r.top, right: r.right, bottom: r.bottom };
      let saute = false, cur = el;
      while (cur && cur !== document.body && cur !== document.documentElement) {
        const pos = getComputedStyle(cur).position;
        if (pos === 'fixed') break;
        if (pos === 'absolute') saute = true;
        const p = cur.parentElement;
        if (!p || p === document.body || p === document.documentElement) break;
        const cp = getComputedStyle(p);
        if (saute && cp.position === 'static') { cur = p; continue; }
        saute = false;
        const cx = cp.overflowX !== 'visible', cy = cp.overflowY !== 'visible';
        if (cx || cy) {
          const b = p.getBoundingClientRect();
          const g = b.left + p.clientLeft, t = b.top + p.clientTop;
          if (cx) { box.left = Math.max(box.left, g); box.right = Math.min(box.right, g + p.clientWidth); }
          if (cy) { box.top = Math.max(box.top, t); box.bottom = Math.min(box.bottom, t + p.clientHeight); }
          if (box.left >= box.right || box.top >= box.bottom) return { intact: false, box: null };
        }
        cur = p;
      }
      const intact = box.left <= r.left + 0.5 && box.top <= r.top + 0.5 && box.right >= r.right - 0.5 && box.bottom >= r.bottom - 0.5;
      return intact ? { intact: true } : { intact: false, box };
    };
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
      if (sansLignes && el.closest('[data-mots="lignes"]')) continue;
      // o1 (31.10) : le texte d'un <details> fermé n'est pas lu (Chrome lui donne une boîte), sauf son <summary>.
      if (seulementVisible && replie(el)) continue;
      range.selectNodeContents(node);
      const r = range.getBoundingClientRect();
      if (r.width === 0 || r.height === 0 || r.bottom <= 0 || r.top >= H) continue;
      const garde = (w) => (sansDonnees ? !estDonnee(w.replace(/[(),:;.!?«»"]/g, '')) : true);
      // o1 (31.10) : un conteneur à défilement ou rogné (overflow) cache ce qui sort de sa boîte. Rien n'est compté
      // d'un nœud entièrement coupé ; d'un nœud en partie coupé, seuls les mots dont le centre reste visible.
      const coupe = seulementVisible ? boiteVisible(el, r) : null;
      if (coupe && !coupe.intact) {
        if (!coupe.box) continue;
        const brut = node.textContent;
        for (const m of brut.matchAll(/\S+/g)) {
          range.setStart(node, m.index); range.setEnd(node, m.index + m[0].length);
          const q = range.getBoundingClientRect();
          const cx = q.left + q.width / 2, cy = q.top + q.height / 2;
          if (q.width === 0 || q.height === 0 || q.bottom <= 0 || q.top >= H) continue;
          if (cx < coupe.box.left || cx > coupe.box.right || cy < coupe.box.top || cy > coupe.box.bottom) continue;
          if (garde(m[0])) words++;
        }
        continue;
      }
      const mots = text.split(/\s+/).filter(Boolean);
      words += mots.filter(garde).length;
    }
    // Textes SVG dessinés aussi comptés par le parcours ci-dessus (nœuds texte).
    return words;
  }, sansDonnees, sansCoquille, seulementVisible, sansLignes);
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
