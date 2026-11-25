// Assemble jouable/m4b-v7.html depuis jouable/m4b.html (intact) : remplacements par split/join sur des ancres uniques (L26).
import fs from 'node:fs';
import path from 'node:path';
const ICI = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1'));
const J = 'C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie/work/missions/2026-11-25-carnet-document/jouable/';
let s = fs.readFileSync(J + 'm4b.html', 'utf8');
const ORGJS = fs.readFileSync(path.join(ICI, 'org.js'), 'utf8'), ORGCSS = fs.readFileSync(path.join(ICI, 'org.css'), 'utf8');
function une(a, b) { const n = s.split(a).length - 1; if (n !== 1) throw new Error('ancre ×' + n + ' : ' + a.slice(0, 80)); s = s.split(a).join(b); }
function toutes(a, b) { const n = s.split(a).length - 1; if (!n) throw new Error('ancre absente : ' + a.slice(0, 80)); s = s.split(a).join(b); }

une('<title>Carnets · M4 b jouable</title>', '<title>Carnets · M4 b jouable · Organisé v7</title>');
une('</style>', ORGCSS + '\n</style>');
une("var CLE = DEMO ? 'm4b-jouable-demo' : 'm4b-jouable';", "var CLE = DEMO ? 'm4b-v7-jouable-demo' : 'm4b-v7-jouable';");
// les 5 cas fictifs du pilote (visuel/cas-fictifs.json) rejoignent les 14 exemples
const fict = JSON.parse(fs.readFileSync(J + '../visuel/cas-fictifs.json', 'utf8')).cas.map((x, i) => ({ src: 'cas-fictifs.json#' + i, titre: x.titre, lignes: x.lignes, cree: '2026-11-25T08:00:00.000Z', maj: '2026-11-25T08:00:00.000Z', etat: 'note', etatPar: null, genre: null }));
{ const i0 = s.indexOf('var EXEMPLES = ['), i1 = s.indexOf('}];', i0); if (i0 < 0 || i1 < 0) throw new Error('EXEMPLES'); s = s.slice(0, i1 + 1) + ',\n' + fict.map(x => JSON.stringify(x)).join(',\n') + s.slice(i1 + 1); }
une('/* Ses carnets d\'exemple : tests/fixtures/c79 (12) et c75 (4)', '/* Ses carnets d\'exemple : tests/fixtures/c79 (12) et c75 (4), puis les 5 cas fictifs du pilote (visuel/cas-fictifs.json, port v7)');
une("  if (c.org) basculer('org');", "  if (c.org || c.orgErreur) basculer('org');");
une('    var v = valider(brut, lignes);', '    var v = valider(brut, lignes, titreDe(c));');
une('function valider(brut, lignes) {', 'function valider(brut, lignes, titre) {');
// consigne : les champs de la v7
une(`    ' "conseil":string?, "resolu":{"question":string}?,',`, `    ' "conseil":string?, "resolu":{"question":string,"ligne":number,"citation":string}?,',\n    ' "faits":[{"emoji":string,"texte":string,"ligne":number,"citation":string}],',`);
une(`"valeurs":[{"texte":string,"source":"notes"|"ia"}]}],"gagnant":[number|null],"compromis":string?}|null,'`,
  `"valeurs":[{"texte":string,"source":"notes"|"ia"}],"offre":{"prix":string?,"min":string?,"max":string?,"livraison":string?}?}],"gagnant":[number|null],"compromis":string?,"besoin":{"quantite":number,"ligne":number,"citation":string}?}|null,'`);
une(`    '17. "genre" : "planning" pour un projet avec une période ou un budget à planifier. Champs vides : [] ou null.',`,
  `    '17. "genre" : "planning" pour un projet avec une période ou un budget à planifier. Champs vides : [] ou null.',
    '18. "tache" est ce qu’Organisé montre en tête : LA prochaine chose que LUI fait, verbe d’abord (3 mots au plus), avec "ligne" et "citation" de la ligne qui la dit, et "quand" si une date ou un délai y est écrit. Une tâche que tu proposes sans qu’elle soit écrite n’a pas de citation : elle sera marquée IA.',
    '19. "faits" : ce qu’il a déjà fait (ses notes le disent au passé : « changé », « commandé », « déplacés »), 3 mots au plus, citation exacte. Un fait n’est jamais aussi une piste ni une option. Sinon [].',
    '20. "resolu" : "question" = ce qui l’a réglé, 5 mots au plus ; "ligne" et "citation" : la ligne qui dit que c’est réglé, extrait exact.',
    '21. Coût total d’une comparaison (l’app le calcule, pas toi) : "besoin" = la quantité voulue, écrite dans le titre ("ligne": 0) ou dans une ligne, avec sa "citation" exacte. Pour chaque article, "offre" : des extraits EXACTS de SA ligne : "prix" (prix à l’unité), "min" (quantité minimale), "max" (quantité disponible, « seulement »), "livraison" (frais d’envoi). Omets ce qui n’est pas écrit.',`);
// validation côté page
une('      return { nom: str(a.nom), ligne: va ? va.ligne : null, citation: va ? va.citation : null, valeurs: vals };', `      /* v7 : les extraits de l'offre sont vérifiés contre SA ligne ; le total est calculé par la page */
      var nl = va ? va.ligne : Number(a.ligne), Lg = Number.isInteger(nl) && nl >= 1 && nl <= lignes.length ? normA(lignes[nl - 1]) : '', offre = null;
      if (a.offre && typeof a.offre === 'object' && Lg) {
        offre = {};
        ['prix', 'min', 'max', 'livraison'].forEach(function (f) {
          var x = str(a.offre[f]); if (!x) return;
          if (Lg.indexOf(normA(x)) >= 0 && (/\\d/.test(x) || (f === 'livraison' && /offert|gratuit|inclus/i.test(x)))) offre[f] = x;
          else { fausses++; erreurs.push('offre « ' + a.nom + ' » ' + f + ' : absente de la ligne ' + nl + ' : « ' + x + ' »'); }
        });
        if (!Object.keys(offre).length) offre = null;
      }
      return { nom: str(a.nom), ligne: va ? va.ligne : null, citation: va ? va.citation : null, valeurs: vals, offre: offre };`);
une('  return { rep: rep, erreurs: erreurs, fausses: fausses };', `  /* v7 : faits, réglé cité, besoin d'une comparaison (rien d'inventé : chaque extrait est dans sa ligne, ou dans le titre pour la ligne 0) */
  rep.faits = arr(brut.faits).slice(0, 4).map(function (x) {
    if (!x || !str(x.texte)) return null; var v = verifier('fait « ' + x.texte + ' »', x.ligne, x.citation);
    return v ? { emoji: emo(x.emoji), texte: str(x.texte), ligne: v.ligne, citation: v.citation } : null;
  }).filter(Boolean);
  if (rep.resolu && brut.resolu.citation) { var vr = verifier('réglé', brut.resolu.ligne, brut.resolu.citation); if (vr) { rep.resolu.ligne = vr.ligne; rep.resolu.citation = vr.citation; } }
  if (rep.comparaison && cp.besoin && typeof cp.besoin === 'object') {
    var qb = Number(cp.besoin.quantite), cb = str(cp.besoin.citation), nb0 = Number(cp.besoin.ligne);
    var src0 = nb0 === 0 ? String(titre || '') : (Number.isInteger(nb0) && nb0 >= 1 && nb0 <= lignes.length ? lignes[nb0 - 1] : '');
    if (qb > 0 && cb && normA(src0).indexOf(normA(cb)) >= 0 && cb.replace(/[ ’']/g, '').indexOf(String(qb)) >= 0) rep.comparaison.besoin = { quantite: qb, ligne: nb0, citation: cb };
    else { fausses++; erreurs.push('besoin : citation absente : « ' + cb + ' » (retiré)'); }
  }
  return { rep: rep, erreurs: erreurs, fausses: fausses };`);
// Organisé : la v7 remplace l'ancienne vue (de son titre de section à la barre d'ajout)
{ const a = s.indexOf('/* ====================================================================== Organisé */'), b = s.indexOf("/* la barre d'Organisé : une ligne pour ajouter");
  if (a < 0 || b < a) throw new Error('bloc Organisé');
  const ancien = s.slice(a, b);
  const garde = ancien.slice(ancien.indexOf('function poserEtat(c, e) {'), ancien.indexOf('function frise(c, propose) {'));
  s = s.slice(0, a) + ORGJS + '\n' + garde + s.slice(b);
  const partis = ['sectionPistes', 'sectionOptions', 'sectionAFaire', 'carteAide', 'finirPleins', 'frise', 'optionsComparees', 'ajoutsVides', 'tete'];
  partis.forEach(f => { const re = new RegExp('\\b' + f + '\\s*\\(', 'g'); const n = (s.match(re) || []).length; if (n) console.log('ATTENTION reste un appel à', f, n); });
}
une("  ics.appendChild(h('button', { type: 'button', class: 'm4b-aidebtn', onclick: aide }, ico('b-ampoule'), 'Aide'));", "  ics.appendChild(h('button', { type: 'button', class: 'v7-aidebtn', onclick: ouvrirAide }, '💡 Aide'));\n  majAideBtn(org.__D || null);");
toutes("'Ajouter à tes notes…'", "'Ajouter…'");
une('function fermerFlottants() {\n  fermerBulle(); enleverSurl(); fermerMenu();', "function fermerFlottants() {\n  fermerBulle(); enleverSurl(); fermerMenu();\n  aideOuverte = false; metaOuvert = false; Array.prototype.forEach.call(document.querySelectorAll('.v7-pile'), function (x) { x.remove(); });");
une("  ouvrir: function (i) { ouvrir(i); }, fermer: function () { fermer(); },", "  ouvrir: function (i) { ouvrir(i); }, fermer: function () { fermer(); }, modele: function () { return org.__D || null; },");
fs.writeFileSync(J + 'm4b-v7.html', s);
console.log('m4b-v7.html', s.length, 'car.');
