// Assemble jouable/m4b-v7.html depuis cap-amelio/src/base.html (la v7 publiée, HEAD du 26.11) + amelio.css + amelio.js.
// Remplacements par split/join sur des ancres uniques (L26). node cap-amelio/build.mjs
import fs from 'node:fs';
const J = 'C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie/work/missions/2026-11-25-carnet-document/jouable/';
const S = J + 'cap-amelio/src/';
let s = fs.readFileSync(S + 'base.html', 'utf8');
const CSS = fs.readFileSync(S + 'amelio.css', 'utf8'), JS = fs.readFileSync(S + 'amelio.js', 'utf8');
function une(a, b) { const n = s.split(a).length - 1; if (n !== 1) throw new Error('ancre ×' + n + ' : ' + a.slice(0, 80)); s = s.split(a).join(b); }
une('<title>Carnets · M4 b jouable · Organisé v7</title>', '<title>Carnets · jouable v7 amélioré (26.11)</title>');
une('<meta charset="utf-8">', '<meta charset="utf-8">\n<link rel="preconnect" href="https://fonts.googleapis.com"><link href="https://fonts.googleapis.com/css2?family=Source+Sans+3:wght@400;600;700&display=swap" rel="stylesheet">');
une('</style>', CSS + '\n</style>');
// Comparer tient 6 offres ou plus : clés A à H, 8 articles et 8 options gardés à la validation
une("cp = r.comparaison, L = 'ABCD';", "cp = r.comparaison, L = 'ABCDEFGH';");
une('cp.articles.slice(0, 4)', 'cp.articles.slice(0, 8)');
une('(Array.isArray(brut.options) ? brut.options : []).slice(0, 5)', '(Array.isArray(brut.options) ? brut.options : []).slice(0, 8)');
// Escalader : la lecture demandée passe en modelTier "complex"
une('return sample.json(consigne(c, lignes), { signal: ctl.signal });', 'return sample.json(consigne(c, lignes), forteOpts(c, ctl.signal));');
// la couche, avant le démarrage (les fonctions remplacées sont hissées)
une('/* ====================================================================== démarrage */', JS + '\n/* ====================================================================== démarrage */');
// banc : créer un carnet de lignes (cas 6 offres)
une('})();\n</script>\n</body>', "window.__m4b.ajouter = function (t, L) { var c = nouveauCarnet(t, L, null); etat.carnets.push(c); sauver(); enFile(c); rendreListe(); return c.id; };\n})();\n</script>\n</body>");
fs.writeFileSync(J + 'm4b-v7.html', s);
console.log('m4b-v7.html', s.length, 'car.');
