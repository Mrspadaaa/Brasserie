// La page des fils de fer (https://claude.ai/artifact/2VTRQP7nLXhX5GqDaAGAyU, « Nuit du 18 au 19 ») :
// son générateur est perdu ; ce script repart de la page publiée (lue avec l'outil Artifact, chemin
// index.html) et y ajoute un lot en tête, sans créer de page (les pages ne se suppriment pas d'ici).
// Usage : node ajouter-lot.mjs <page publiée.html> <lot.json>
//   lot.json : { id, ticket, titre, etat, puces: [..], images: [[source.png, légende], ..] }
// Sortie : page-nuit/site/index.html (sans le squelette ajouté à la publication) et site/img/.
import fs from 'node:fs';
import path from 'node:path';

const here = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));
const [src, lotFile] = process.argv.slice(2);
const lot = JSON.parse(fs.readFileSync(lotFile, 'utf8'));
let html = fs.readFileSync(src, 'utf8');
// Le squelette de publication (doctype, head, body) se remet tout seul : on garde du <title> au </div> final.
const debut = html.indexOf('<title>'), fin = html.lastIndexOf('</body>');
html = html.slice(debut, fin < 0 ? undefined : fin).trim();
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const site = path.join(here, 'site'), img = path.join(site, 'img');
fs.mkdirSync(img, { recursive: true });
const deja = (html.match(/img\/(\d+)-/g) || []).map((m) => Number(m.slice(4, -1)));
let n = Math.max(0, ...deja);
const figures = lot.images.map(([source, legende]) => {
  const nom = String(++n).padStart(2, '0') + '-' + path.basename(source);
  fs.copyFileSync(source, path.join(img, nom));
  return '<figure><a href="img/' + nom + '"><img loading="lazy" src="img/' + nom + '" alt="' + esc(legende) + '"></a><figcaption>' + esc(legende) + '</figcaption></figure>';
});
const ancre = 't' + lot.ticket;
html = html.replace(new RegExp('<section id="' + ancre + '">[\\s\\S]*?</section>'), '');
html = html.replace(new RegExp('<a href="#' + ancre + '">[^<]*</a>'), '');
const section = '<section id="' + ancre + '"><h2><a href="https://github.com/Mrspadaaa/Brasserie/issues/' + lot.ticket + '">#' + lot.ticket + '</a> ' + esc(lot.titre) + '</h2>'
  + '<p class="etat ok">' + esc(lot.etat) + '</p><ul>' + lot.puces.map((p) => '<li>' + esc(p) + '</li>').join('') + '</ul>'
  + '<div class="g">' + figures.join('') + '</div></section>';
html = html.replace('<nav>', '<nav><a href="#' + ancre + '">#' + lot.ticket + ' ' + esc(lot.court || '') + '</a>');
html = html.replace(/(<\/nav>)/, '$1' + section);
fs.writeFileSync(path.join(site, 'index.html'), html);
console.log('PAGE ' + path.join(site, 'index.html') + ' · ' + figures.length + ' images ajoutées');
