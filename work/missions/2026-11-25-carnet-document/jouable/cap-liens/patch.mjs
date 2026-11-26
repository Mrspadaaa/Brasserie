// Applique liens lus (LIENS.md), PAS-DE-HARCELEMENT, liste en arbre compacte et champ « Noter » à m4b-v7.html et m4b.html.
// Repart toujours de HEAD (idempotent). Assemblage par split/join sur des ancres uniques (L26).
// node cap-liens/patch.mjs
import fs from 'node:fs';
import { execSync } from 'node:child_process';
const RACINE = 'C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie/';
const REL = 'work/missions/2026-11-25-carnet-document/jouable/';
const BLOC = fs.readFileSync(new URL('./bloc-liens.js', import.meta.url), 'utf8');

const LIGNE = `function ligneCarnet(c) {
  /* une ligne par carnet (26.11, « pas assez compact ») : emoji, titre, à droite un point d'état et un repère */
  var p = prioDe(c), lit = estEnLecture(c), pro = !lit && prochaine(c), res = !lit && !pro && resumeDe(c), et = NOM_ETAT[c.etat] || 'Noté';
  var row = h('button', { type: 'button', class: 'm4j-r m4j-r1 ' + p, 'data-id': c.id, 'aria-label': titreCourt(c) + ' · ' + et + (pro ? ' · ' + pro.txt + ', ' + texteJours(pro.n) : res ? ' · ' + res : '') },
    h('span', { class: 'ic' }, emojiDe(c)),
    h('span', { class: 'ti' }, titreCourt(c)),
    h('span', { class: 'rp' }, h('i', { class: 'pt', title: et, style: 'background:' + COUL_ETAT[c.etat] }),
      lit ? h('span', { class: 'lit' }, '✦ lit…') : pro ? h('span', { class: 'dt' + (pro.n < 0 ? ' passe' : pro.n <= 7 ? ' proche' : '') }, pro.txt) : res ? h('span', { class: 'res' }, res) : null),
    c.orgNeuf ? h('i', { class: 'neuf', title: 'Organisé a du neuf' }) : null);
  brancherGlisse(row, c);
  return row;
}`;

const CSS = `
/* 26.11 : liste en arbre compacte (densité de p4 : une ligne par carnet, en-têtes fins, tuiles réduites) */
#v-liste{position:relative}
#v-liste .m4j-tete{padding:calc(8px + env(safe-area-inset-top)) 14px 6px;font-size:18px}
#v-liste .m4j-sous{position:absolute;top:calc(13px + env(safe-area-inset-top));right:14px;left:110px;text-align:right;padding:0;font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#v-liste .m4j-liste{padding:0 10px 10px}
#v-liste .m4j-oeil{gap:5px;padding:0 0 5px}
#v-liste .m4j-oeil div{min-height:0;padding:3px 8px;border-radius:8px;display:flex;align-items:baseline;gap:5px;white-space:nowrap;overflow:hidden}
#v-liste .m4j-oeil b{display:inline;font-size:15px}
#v-liste .m4j-oeil span{font-size:12px}
#v-liste .m4j-puces{padding:0}
#v-liste .m4j-puce{height:32px;font-size:14px;padding:0 12px}
#v-liste .m4j-aide{font-size:11px}
#v-liste .m4j-dn{min-height:32px;margin-top:4px;font-size:15px;padding:0 10px;border-radius:8px}
#v-liste .m4j-sd{min-height:22px;font-size:12.5px;padding:0 8px 0 10px}
#v-liste .m4j-r1{min-height:38px;padding:0 6px;gap:8px;border-bottom:1px solid var(--s2);border-radius:0}
#v-liste .m4j-r1 .ic{width:22px;height:auto;background:none;font-size:17px;border-radius:0}
#v-liste .m4j-r1 .ti{flex:1;min-width:0;font-size:15px;font-weight:600}
#v-liste .m4j-r1.basse .ti{font-weight:500}
#v-liste .m4j-r1 .rp{display:flex;align-items:center;gap:5px;flex:none;max-width:42%;font-size:13px;font-weight:700;white-space:nowrap}
#v-liste .m4j-r1 .pt{width:8px;height:8px;border-radius:50%;flex:none}
#v-liste .m4j-r1 .rp .res{overflow:hidden;text-overflow:ellipsis;min-width:0;color:var(--ink)}
#v-liste .m4j-r1 .dt.proche{color:var(--att)}
#v-liste .m4j-r1 .dt.passe{color:var(--bad)}
#v-liste .m4j-recharger{margin:12px auto 0}
.m4j-saisie{display:flex;gap:8px;flex:1;min-width:0}
.m4j-saisie input{flex:1;min-width:0;height:44px;border-radius:22px;border:1.5px solid var(--line);background:var(--bg);color:var(--ink);font:inherit;font-size:16px;padding:0 14px;outline:none}
.m4j-saisie input:focus{border-color:var(--ia)}
.m4j-plus{width:44px;height:44px;border-radius:50%;background:var(--ink);color:var(--sur-plein);font-size:26px;font-weight:600;display:grid;place-items:center;flex:none}
/* liens lus par Claude : 🔗 après une valeur venue d'un lien ; « 🔗 en lecture » sur l'article dont le lien attend */
.lk{font-size:10px;margin-left:2px;font-weight:400}
.lk-at{display:block;font-size:11px;font-weight:600;color:var(--fin);white-space:nowrap}
.v7-cmp .hd .hc.lk-at{color:var(--fin);font-size:11px}
.v7-p .lk-at{display:inline;margin-left:6px}
`;

const PIED_AV = `<div class="m4b-pied"><button class="m4b-btn plein" id="nouveau" type="button">+ Nouveau carnet</button></div>`;
const PIED_AP = `<div class="m4b-pied"><div class="m4j-saisie"><input id="noter" type="text" placeholder="Noter, coller un lien…" enterkeyhint="send" autocomplete="off" aria-label="Noter dans un nouveau carnet"><button class="m4j-plus" id="nouveau" type="button" aria-label="Nouveau carnet">+</button></div></div>`;
const NOUV_AV = `$('nouveau').addEventListener('click', function () {
  var c = nouveauCarnet('', [''], null); etat.carnets.push(c); sauver(); geste('nouveau carnet', c.id); ouvrir(c.id);
});`;
const NOUV_AP = `/* le champ de la liste (26.11, « un champ texte, une action en moins ») : ce qu'il tape crée un carnet, l'IA le range et le titre */
$('nouveau').addEventListener('click', function () {
  var t = $('noter').value.trim();
  if (!t) { var c = nouveauCarnet('', [''], null); etat.carnets.push(c); sauver(); geste('nouveau carnet', c.id); ouvrir(c.id); return; }
  var c2 = nouveauCarnet('', [t], null); etat.carnets.push(c2); $('noter').value = ''; sauver(); geste('noter depuis la liste', t);
  if (navigator.onLine) enFile(c2); else c2.attente = true;
  sauver(); rendreListe();
  toast('Noté · l’IA le range', 'Ouvrir', function () { ouvrir(c2.id); });
});
$('noter').addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); $('nouveau').click(); } });`;

function patch(fichier, v7) {
  let s = execSync('git show HEAD:' + REL + fichier, { cwd: RACINE, encoding: 'utf8', maxBuffer: 64e6 });
  const rep = (a, b, n = 1) => { const k = s.split(a).length - 1; if (k !== n) throw new Error(fichier + ' : ancre ' + k + '× : ' + a.slice(0, 90)); s = s.split(a).join(b); };
  // capacités
  rep('db: { rules: [ { path: "journal", read: "admin", write: "interact" } ] } }',
    'db: { rules: [ {path:"journal",read:"admin",write:"admin"}, {path:"liens",read:"view",write:"admin"}, {path:"demandes",read:"admin",write:"admin"} ] } }\n     Liens lus par Claude (26.11) : la page lit liens/<id>, écrit demandes/<id> ; voir work/missions/2026-11-26-liens/LIENS.md.');
  // CSS
  const i = s.indexOf('</style>'); if (i < 0) throw new Error('style'); s = s.slice(0, i) + CSS + s.slice(i);
  // le bloc liens, avant la consigne
  rep('function consigne(c, lignes) {', BLOC + 'function consigne(c, lignes) {');
  // consigne : schéma, règle 9, questions, titre, ce que disent ses liens
  rep('"valeurs":[{"texte":string,"source":"notes"|"ia"}]', '"valeurs":[{"texte":string,"source":"notes"|"ia"|"lien","lien":number?}]');
  rep(`    ' "genre":"probleme"|"achat"|"memo"|"idee"|"planning"}',`, `    ' "titre":string?,',\n    ' "genre":"probleme"|"achat"|"memo"|"idee"|"planning"}',`);
  rep(`    '   Tu ne peux pas ouvrir les liens : ce qui n’est que derrière un lien vaut "?".',`,
    `    '   Tu ne peux pas ouvrir les liens. Claude en a lu : leurs faits sont plus bas (« Ce que disent ses liens »). Une valeur prise là porte "source":"lien" et "lien" : le numéro de la ligne du lien ; copie-la telle quelle (nombre et unité), jamais inventée. Un lien pas encore lu : "?" (l’app le marque « 🔗 en lecture »).',`);
  rep(`    '',\n    'Carnet : ' + titreDe(c),\n    'État actuel`,
    `    'Jamais de question : ne lui demande rien, ne lui demande pas de noter une donnée ; ce qui manque vaut "?" à sa place.',\n    'Titre : ' + (c.titre && c.titre.trim() ? 'posé par lui ; omets "titre".' : 'aucun ; propose "titre" : 2 à 5 mots, le sujet du carnet (ex. « Houblons citra »).'),\n    '',\n    'Carnet : ' + titreDe(c),\n    'État actuel`);
  rep(`    lignes.map(function (l, i) { return (i + 1) + ': ' + l; }).join('\\n'),\n    '',\n    'Organisé précédent`,
    `    lignes.map(function (l, i) { return (i + 1) + ': ' + l; }).join('\\n'),\n    texteLiens(urlsParLigne(c)),\n    '',\n    'Organisé précédent`);
  // valider : une valeur "lien" existe dans liens/<id> ; titre proposé
  rep(`        return { texte: tx || '?', source: x && x.source === 'notes' ? 'notes' : 'ia' };`,
    `        if (x && x.source === 'lien' && tx && tx !== '?') { var nlv = Number(x.lien) || (va ? va.ligne : Number(a.ligne));
          if (valeurDuLien(tx, liensValider, nlv)) return { texte: tx, source: 'lien', lien: nlv };
          fausses++; erreurs.push('valeur « ' + tx + ' » de « ' + a.nom + ' » : absente du lien lu (retirée)'); return { texte: '?', source: 'ia' }; }
        return { texte: tx || '?', source: x && x.source === 'notes' ? 'notes' : 'ia' };`);
  rep(`  rep.comparaison = null;\n`, `  rep.titreIA = typeof brut.titre === 'string' && brut.titre.trim() && brut.titre.trim().length <= 48 ? brut.titre.trim() : null;\n  rep.comparaison = null;\n`);
  // lancerLecture : attendre la base des liens (1,5 s au plus), demander les liens non lus, garder ce qui a été lu
  rep(`  capSample.then(function (sample) {\n    if (!sample) throw { code: 'indisponible' };\n    if (DEMO) return attendre(DEMO_MS`,
    `  var UL = [], vus = {};\n  liensPrets.then(function () { if (ctl.signal.aborted) throw { code: 'cancelled' }; UL = urlsParLigne(c); vus = liensVus(UL); demanderLiens(c, UL); return capSample; }).then(function (sample) {\n    if (!sample) throw { code: 'indisponible' };\n    if (DEMO) return attendre(DEMO_MS`);
  rep(`    var v = valider(brut, lignes`, `    liensValider = UL; var v = valider(brut, lignes`);
  rep(`    reporter(c.orgPrec, c.org);`, `    c.org.liens = vus; c.org.urls = UL;\n    if (!(c.titre && c.titre.trim()) && v.rep.titreIA) { c.titre = v.rep.titreIA; c.titreIA = true; if (courant() === c && $('titre')) $('titre').textContent = c.titre; }\n    reporter(c.orgPrec, c.org);`);
  rep(`    rendreListe(); suivant();`, `    rendreListe(); suivant(); setTimeout(function () { verifierLiens(c); }, 0);`);
  // rendu de la comparaison
  if (v7) {
    rep(`art: true });`, `art: true, srcs: a.valeurs.map(function (v) { return v.source; }), attente: marqueLien(o.urls || urlsParLigne(c), a.ligne) });`);
    rep(`h += '<span class="k" title="' + esc(cr.nom) + '">' + cr.ic + (unit ?`, `h += '<span class="k" title="' + esc(cr.nom) + '">' + cr.ic + (/\\d/.test(cr.nom) ? '<small>' + esc(cr.nom.replace(/\\/\\S+/, '').trim()) + '</small>' : '') + (unit ?`);
    rep(`(a.conseil && C.totalG == null ? tagConseil(a.k) : '') + qch(a) +`, `(a.conseil && C.totalG == null ? tagConseil(a.k) : '') + qch(a) + attenteHtml(a) +`);
    rep(`'<span class="hc">' + C.crit[j].ic + ' ' + esc(a.vals[j]) + '</span>'`, `'<span class="hc">' + C.crit[j].ic + ' ' + esc(a.vals[j]) + lkHtml(a, j) + '</span>'`);
    rep(`' mono' + col(a.i) + '">' + esc(v) + '</span>'; }).join(''); });`, `' mono' + col(a.i) + '">' + esc(v) + lkHtml(a, j) + '</span>'; }).join(''); });`);
    rep(`'<b>' + esc(a.nom) + '</b><span class="e s">🔗</span></button>'`, `'<b>' + esc(a.nom) + '</b>' + (a.attente ? '<span class="lk-at">' + esc(a.attente) + '</span>' : '<span class="e s">🔗</span>') + '</button>'`);
  } else {
    rep(`h('small', null, nb ? nb + (nb > 1 ? ' gagnés' : ' gagné') : ''),`, `h('small', null, nb ? nb + (nb > 1 ? ' gagnés' : ' gagné') : ''), (function (m) { return m ? h('small', { class: 'lk-at' }, m) : null; })(marqueLien(o.urls || urlsParLigne(c), ar.ligne)),`);
    rep(`v.source === 'ia' && v.texte !== '?' ? h('small', null, ' IA') : null`, `v.source === 'ia' && v.texte !== '?' ? h('small', null, ' IA') : null, v.source === 'lien' ? h('small', { class: 'lk', title: 'lu sur son lien' }, ' 🔗') : null`);
  }
  // liste compacte et champ « Noter »
  const a0 = s.indexOf('function ligneCarnet(c) {'), a1 = s.indexOf('  brancherGlisse(row, c);\n  return row;\n}', a0);
  if (a0 < 0 || a1 < 0 || s.indexOf('function ligneCarnet(c) {', a0 + 1) >= 0) throw new Error(fichier + ' : ligneCarnet');
  s = s.slice(0, a0) + LIGNE + s.slice(a1 + '  brancherGlisse(row, c);\n  return row;\n}'.length);
  rep(PIED_AV, PIED_AP);
  rep(NOUV_AV, NOUV_AP);
  fs.writeFileSync(RACINE + REL + fichier, s);
  console.log(fichier, 'OK', s.length);
}
patch('m4b-v7.html', true);
patch('m4b.html', false);
