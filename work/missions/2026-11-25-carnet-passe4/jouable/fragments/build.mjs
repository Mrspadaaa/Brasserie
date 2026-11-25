import fs from 'fs';
const S = 'C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie/work/missions/2026-11-25-carnet-passe4/jouable/fragments/';
const R = 'C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie/work/missions/';
const src = fs.readFileSync(R + '2026-11-25-carnet-document/jouable/m4b.html', 'utf8').split('\n');
const L = n => src[n - 1];
const frag = f => fs.readFileSync(S + f, 'utf8').replace(/\n$/, '').split('\n');
const range = (a, b) => src.slice(a - 1, b);
function attend(n, bout) { if (!L(n).includes(bout)) throw new Error('ligne ' + n + ' inattendue : ' + L(n)); }
function patch(n, avant, apres) { attend(n, avant); return L(n).split(avant).join(apres); }
attend(377, '</style>'); attend(415, '<div id="app">'); attend(449, '</div>'); attend(531, 'houblons-citra'); attend(709, 'function rendreListe'); attend(794, '}');
attend(795, 'function rechargerExemples'); attend(834, 'function nettoyerCibles'); attend(843, '}'); attend(844, 'function deposer');
attend(883, 'function reRendre'); attend(942, '}'); attend(944, 'le document'); attend(1285, 'function consigne'); attend(1342, '}');
attend(1500, 'function valider'); attend(1593, '}'); attend(1634, 'Organisé */'); attend(1958, '}'); attend(1960, 'feuilles'); attend(2053, 'window.__m4b');
const out = [
  ...range(1, 5),
  '<title>Carnets · jouable passe 4</title>',
  '<!-- Jouable passe 4 (25.11 nuit). Moteur repris tel quel de jouable/m4b.html (Claude par sample, journal db, consigne et validation des citations,',
  '     lecture auto, Organisé par défaut, « + », Aide, exemples) ; interface greffée selon la recette des trois juges (JOUABLE-P4.md).',
  '     Capacités à déclarer à la publication : capabilities: { sample: {}, dictation: {}, db: { rules: [ { path: "journal", read: "admin", write: "interact" } ] } }',
  '     Les id des <symbol> commencent par « i- » ; aucun id d élément ne commence par « i- ». -->',
  ...range(11, 376), ...frag('css.txt'), ...range(377, 379),
  ...range(380, 413).map(l => l.split('id="b-').join('id="i-')),
  L(414), ...frag('html.txt'),
  ...range(450, 456), patch(457, "'m4b-jouable-demo' : 'm4b-jouable'", "'p4-jouable-demo' : 'p4-jouable'"), ...range(458, 531), ...frag('exemples.js'),
  ...range(532, 585), patch(586, 'aide: null', 'aide: null, pages: (base && base.pages) || null'),
  ...range(587, 620), patch(621, "'#' + nom", "'#' + nom.replace(/^b-/, 'i-')"),
  ...range(622, 700), patch(701, 'txt: dateCourte(best.d) }', 'txt: dateCourte(best.d), approx: !!best.approx }'),
  ...range(702, 708), ...frag('liste.js'),
  ...range(795, 833), ...frag('cible.js'),
  ...range(844, 878),
  "  ouvrirFeuille([h('h2', null, 'Ranger dans…'), h('div', { class: 'sous' }, emojiDe(c) + ' ' + titreCourt(c) + ' · un toucher suffit'),",
  "    h('div', { class: 'grp' }, 'Domaine'), cats, h('div', { class: 'grp' }, 'Priorité'), prios,",
  "    h('div', { class: 'm4b-actions' }, bouton('Fermer', '', fermerFeuille), dansListe ? bouton('Ouvrir', '', function () { fermerFeuille(); ouvrir(c.id); }) : null)]);",
  L(882), ...frag('ouvrir.js'),
  ...range(943, 1284), ...frag('consigne.js'),
  ...range(1343, 1463), patch(1464, 'valider(brut, lignes)', 'valider(brut, lignes, pagesDe(c))'),
  ...range(1465, 1499), ...frag('valider.js'),
  ...range(1594, 1597), patch(1598, ' && RANG[r.etatPropose] > RANG[c.etat])', ' && (o.garde.etat !== undefined || RANG[r.etatPropose] > RANG[c.etat]))'),
  ...range(1599, 1601), patch(1602, "if (r.resolu || r.etatPropose === 'resolu')", "if ((r.resolu || r.etatPropose === 'resolu') && (c.etat !== 'resolu' || o.garde.resolu !== undefined))"),
  ...range(1603, 1633), ...frag('organise.js'),
  ...range(1959, 2052),
  "window.__p4 = window.__m4b = { etat: function () { return etat; }, valider: valider, consigne: function () { var c = courant(); return c ? consigne(c, lignesDoc()) : ''; },",
  "  consigneDe: function (i) { var c = parId(i); return c ? consigne(c, lignesDe(c)) : ''; }, consigneAideDe: function (i) { var c = parId(i); return c ? consigneAide(c, lignesDe(c)) : ''; },",
  "  pagesDe: function (i) { return pagesDe(parId(i)); }, lignesDe: function (i) { return lignesDe(parId(i)); },",
  "  ouvrir: function (i) { ouvrir(i); }, fermer: function () { fermer(); }, lecture: function () { return { lecture: lecture && lecture.carnetId, file: file.slice() }; } };",
  ...range(2056, src.length)
];
const html = out.join('\n');
fs.writeFileSync(R + '2026-11-25-carnet-passe4/jouable/p4.html', html);
const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map(m => m[1]);
const sym = ids.filter(i => i.startsWith('i-')), el = ids.filter(i => !i.startsWith('i-'));
console.log('lignes', out.length, 'octets', html.length, 'symboles', sym.length, 'éléments', el.length, 'collision', el.filter(i => sym.includes(i)).length, 'doublons', ids.length - new Set(ids).size);
