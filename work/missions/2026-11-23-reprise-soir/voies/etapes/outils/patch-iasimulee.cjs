// Patch ponctuel (voie etapes) : étapes simulées et serveur de banc dans iaSimulee.ts (fins de ligne du fichier gardées).
const fs = require('fs');
const f = 'src/domain/carnets/iaSimulee.ts';
let t = fs.readFileSync(f, 'utf8');
const eol = t.includes('\r\n') ? '\r\n' : '\n';
const E = (x) => x.replace(/\r?\n/g, eol);
const a = E("  'exemple.invalid/cuve-morte': { statut: 'introuvable', etapes: [{ nom: 'page', statut: 'absent', detail: 'introuvable' }] },\n");
if (!t.includes(a)) throw new Error('ancre cuve-morte');
t = t.replace(a, a + E(fs.readFileSync(__dirname + '/pages-banc.txt', 'utf8')));
const debut = t.indexOf(E('/**\n * `lireLien` simulé'));
const fin = t.indexOf('const MOTS_VIDES');
if (debut < 0 || fin < 0) throw new Error('ancre lireLienSimule');
t = t.slice(0, debut) + E(fs.readFileSync(__dirname + '/lire-simule.txt', 'utf8')) + eol + t.slice(fin);
fs.writeFileSync(f, t);
console.log('ok', eol === '\r\n' ? 'crlf' : 'lf');
