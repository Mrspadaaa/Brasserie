// Jouable passe 5 : p4.html (moteur) + interface des mini maquettes p5. Assemblage par split/join sur des repères uniques (L26).
// node work/missions/2026-11-25-carnet-passe4/jouable/cap-p5/build.mjs
import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url';
const ICI = path.dirname(fileURLToPath(import.meta.url)), J = path.dirname(ICI);
// base : p4.html du dernier commit (8277769ac) ; une autre voie améliore p4.html en ce moment, on ne part pas d'un fichier en cours d'écriture
import { execSync } from 'child_process';
let s = execSync('git show 8277769ac:./p4.html', { cwd: J, encoding: 'utf8', maxBuffer: 1 << 26 });
const lire = f => fs.readFileSync(path.join(ICI, f), 'utf8');
function rep(a, b, n = 1) { const k = s.split(a).length - 1; if (k !== n) throw new Error(k + ' fois : ' + a.slice(0, 70)); s = s.split(a).join(b); }
rep('<title>Carnets · jouable passe 4</title>', '<title>Carnets · jouable passe 5</title>\n<!-- Jouable passe 5 (26.11) : moteur de p4.html gardé ; interface des mini maquettes p5 (mini/S-*, mini/O-*, COMMUN.md, DONNEES.md) et ses choix figés du 17.11 pour articles, Comparer, choisi, À venir. Assemblé par jouable/cap-p5/build.mjs. -->\n<link href="https://fonts.googleapis.com/css2?family=Source+Sans+3:wght@400;600;700;800&display=swap" rel="stylesheet">');
rep('</style>\n</head>', '</style>\n<style>\n' + lire('p5.css') + '</style>\n</head>');
const a = s.indexOf('<div id="app">'), b = s.indexOf('<script>', a); if (a < 0 || b < 0) throw new Error('app');
s = s.slice(0, a) + lire('p5-body.html') + '\n' + s.slice(b);
rep("'p4-jouable-demo' : 'p4-jouable'", "'p5-jouable-demo' : 'p5-jouable'");
rep('"categorie.nom" : Brasserie, Local, Administratif, Événements, ou "Sans catégorie" si rien ne va.', '"categorie.nom" : Brasserie, Local, Bureau, ou "Sans catégorie" si rien ne va.');
rep('pour Local, Eau, Électricité ou Rangement ; sinon omis.', 'pour Local, Eau, Électricité, Rangement ou Sol ; pour Bureau, Assurance, Événements ou Administratif ; sinon omis.');
// COMPARER-BEAUCOUP-D-OPTIONS : le contrôle gardait 4 offres et 6 critères ; il en garde 12 et 24
rep('cp.criteres.map(str).filter(Boolean).slice(0, 6)', 'cp.criteres.map(str).filter(Boolean).slice(0, 24)');
rep('cp.articles.slice(0, 4).map(', 'cp.articles.slice(0, 12).map(');
// point 13 : « Escalader à l'IA » relance la lecture avec modelTier "complex"
rep('return sample.json(consigne(c, lignes, lus), { signal: ctl.signal });', "return sample.json(consigne(c, lignes, lus), Object.assign({ signal: ctl.signal }, c.p5fort ? (c.p5fort = false, { modelTier: 'complex' }) : {}));");
// Chambre froide (DONNEES.md, rang 4 de Brasserie) : ses deux liens, fixture c78 (relevé du 25.11)
const c78 = JSON.parse(fs.readFileSync(path.resolve(J, '../../../../tests/fixtures/c78/chambre-froide-releve.json'), 'utf8'));
const urls = c78.messages.map(m => m.carnetMessage && m.carnetMessage.texte).filter(t => /^https:/.test(t || ''));
rep('/* 26.11 (work/missions/2026-11-26-liens/LIENS.md)', '/* passe 5 : Chambre froide, tests/fixtures/c78/chambre-froide-releve.json (ses deux liens, tels quels) */\nEXEMPLES.push(' + JSON.stringify({ src: 'c78/chambre-froide-releve.json', titre: 'ZZ TEST — Chambre froide', lignes: urls, cree: c78.carnet.carnet.creeLe, maj: c78.carnet.carnet.creeLe, etat: 'cherche', etatPar: null, genre: 'achat' }) + ');\n/* 26.11 (work/missions/2026-11-26-liens/LIENS.md)');
rep('/* ====================================================================== démarrage */', lire('p5-ui.js') + '\n/* ====================================================================== démarrage */');
rep('window.__p4 = window.__m4b = {', 'window.__p5 = window.__p4 = window.__m4b = { aDecider: function () { return aDecider().map(function (c) { return c.id; }); }, vueC: function () { return p5vueC; },');
fs.writeFileSync(path.join(J, 'p5.html'), s);
const ids = [...s.matchAll(/\sid="([^"]+)"/g)].map(m => m[1]), used = [...new Set([...s.matchAll(/\$\('([a-zA-Z0-9-]+)'\)/g)].map(m => m[1]))];
const manque = used.filter(i => !ids.includes(i));
console.log('octets', s.length, 'doublons', ids.length - new Set(ids).size, 'ids $() absents :', manque.join(',') || 'aucun', '| urls', urls.length);
