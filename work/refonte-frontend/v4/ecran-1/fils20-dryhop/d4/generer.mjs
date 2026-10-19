// Lot 20 · d4 · Levure et biotransformation. On choisit sa levure et le moment du dry hop ; on lit, sur
// chaque ligne d'ajout, les constats que l'app calcule déjà (assessHopBiotransformation, statuts-app.json),
// et, dans le tableau des voies, ce que H documente pour cette levure. Des drapeaux, jamais des chiffres
// inventés : le seul ordre de grandeur est celui de [42]. Tout chiffre vient de ../donnees-h.json.
// Usage : node generer.mjs (après statuts-app.ts) → etat.html
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { H, N, ENTREE, INC, pic, ico, hop, alpha, seg, lentille, legende, legendeBouton, page, detail, plage, fr, esc, srcTxt, HOP, SRC } from './commun.mjs';

const ici = path.dirname(fileURLToPath(import.meta.url));
const APP = JSON.parse(fs.readFileSync(path.join(ici, 'statuts-app.json'), 'utf8'));
const D4 = H.d4, LEV = H.levures, HC = H.hopCreep;
const LEVURES = [['us05', 'US-05'], ['verdant', 'Verdant'], ['pomona', 'Pomona'], ['diamond', 'Diamond']];
const MOMENTS = [['actif', 'actif', 'j-cuve-a'], ['apres', 'après', 'j-cuve-p']];
const DEF = { lev: 'us05', mom: 'actif' };

// Les quatre constats de l'app, dans l'ordre des voies du tableau.
const MECA = [
  { id: 'thiolRelease', pic: pic('tropical'), titre: 'thiols' },
  { id: 'geraniolToCitronellol', pic: pic('floral') + pic('citrus', 'pi-b'), titre: 'géraniol → citronellol' },
  { id: 'fermentationAroma', pic: '<span class="ic-rd">' + ico('j-levure', 14) + '</span>', titre: 'arôme de la levure' },
  { id: 'hopCreep', pic: '<span class="ic-rd">' + ico('j-jauge', 14) + '</span>', titre: 'hop creep' },
];
const STATUT = { contextuallyRelevant: ['en jeu', 'v-jeu'], conditional: ['si…', 'v-si'], unknown: ['inconnu', null], notCurrentlyActive: ['inactif', 'v-off'] };
// Le signe du verdict (comme l8b) : cercle coché, cercle en tirets, cercle barré ; inconnu = hachures.
const signe = (cls) => (cls ? '<span class="sg">' + ico(cls, 14) + '</span>' : '<i class="hach" aria-hidden="true"></i>');
const ALERTE = '<span class="al seul-style" role="img" aria-label="hors de ce que la 16D attend">' + ico('j-alerte', 14) + '</span>';

// ---- les sorties du moteur « pouvoir aromatique » (moteur-lot20.ts → moteur-lot20.json) ----
const M = JSON.parse(fs.readFileSync(path.join(ici, 'moteur-lot20.json'), 'utf8'));
const HID = { citra: 'citra', idaho7: 'idaho7' };
// Une clé de source du moteur (« H35 », « H50-pomona ») devient le [n] de H ; les autres restent telles.
const srcM = (l) => (l || []).map((k) => { const m = String(k).match(/^H(\d+)/); return m ? Number(m[1]) : k; }).filter((v, i, a) => a.indexOf(v) === i);
const nivM = (l) => { const n = (l || []).map((k) => (M.sources[k] || {}).niveau).filter(Boolean); return ['P', 'F', 'S', 'H'].find((x) => n.includes(x)) || 'H'; };
const DM = (o) => N(esc(o.statut), srcM(o.sources), nivM(o.sources));

// ---- les lignes d'ajout ----
// La frise : toute la largeur de la ligne vaut J0 → la fin du contact ; le segment de l'ajout, à la couleur du houblon.
const frise = (a, fin) => {
  const h = HOP[a.hid];
  const x = (a.jour / fin) * 100, w = (a.dureeJours / fin) * 100;
  return '<span class="frise" role="img" aria-label="du jour ' + a.jour + ' au jour ' + (a.jour + a.dureeJours) + '"><i class="fr-axe"></i><i class="fr-bar" data-houblon="' + h.cle + '" data-couleur="' + h.couleur + '" style="left:' + x.toFixed(1) + '%;width:' + w.toFixed(1) + '%;background:' + h.couleur + '"></i></span>';
};
const chips = (a, lev, mom) => MECA.map((m) => {
  const s = APP.statuts[a.houblon + '|' + lev + '|' + mom][m.id];
  const [mot, cls] = STATUT[s.status];
  return '<button type="button" class="cp" data-detail="app-' + a.houblon + '-' + lev + '-' + mom + '-' + m.id + '" aria-label="' + esc(m.titre + ' : ' + mot) + '">' + signe(cls) + m.pic + '</button>';
}).join('');
// Les ajouts du cas du moteur : Citra 2 g/L 3 j puis Idaho 7 2 g/L 5 j (doses et jours du moteur).
const ajoutsDe = (lev, mom) => M.d4[lev + '|' + mom].ajouts.map((a) => ({ ...a, hid: HID[a.id], houblon: HID[a.id] }));
const lignes = (lev, mom) => { const fin = M.d4[lev + '|' + mom].contact.fin; return ajoutsDe(lev, mom).map((a) => {
  const h = HOP[a.hid];
  return '<div class="aj" data-role="ligne-houblon" data-voie data-cle-fiche="' + h.cle + '"><div class="aj1">' + hop(a.hid) + alpha(a.hid) + '<span class="aj-j">' + ENTREE(fr(a.doseGL) + ' g/L', 'dose') + ENTREE('J' + a.jour, 'gris') + ENTREE(a.dureeJours + ' j') + '</span></div>' + frise(a, fin) + '<div class="cps">' + chips(a, lev, mom) + '</div></div>';
}).join(''); };

// ---- le tableau des voies : les drapeaux du moteur pour la levure et le moment choisis ----
const fleche = (style, lab) => '<span class="fl fl-' + style + '"><span class="fl-lab">' + lab + '</span><svg width="64" height="10" viewBox="0 0 64 10" aria-hidden="true"><path d="M1 5H58" class="fl-l"/><path d="M55 1.5 61 5 55 8.5" class="fl-p"/></svg></span>';
// Les esters de la fiche de levure, rangés dans les familles (lecture des mots, niv H).
const MOTS_FAM = { 'pêche': 'stoneFruit', abricot: 'stoneFruit', agrumes: 'citrus', tropical: 'tropical' };
const famEsters = (t) => [...new Set(t.replace(/\(.*?\)|«|»/g, '').split(/,\s*/).map((m) => MOTS_FAM[m.trim()]).filter(Boolean))];
const drap = (o) => (!o ? '' : o.inconnu ? INC(o.raison, o.src || [], 'H') : N(o.v, o.src, o.niv));
const COURT = { 'documenté pour cette levure': 'documenté', 'possible, non documenté pour cette levure': 'non documenté', 'hors du cas documenté': 'hors du cas', 'possible': 'possible', 'non évaluable (précurseurs non publiés)': 'non évaluable', 'peu documenté après fermentation': 'peu documenté', 'non évaluable': 'non évaluable' };
const STYLE_FL = { documenté: 'doc', 'non documenté': 'meca', 'hors du cas': 'apres', possible: 'meca', 'non évaluable': 'apres', 'peu documenté': 'apres' };
const LEVID = { us05: 'fermentis-us05', verdant: 'lalbrew-verdant-ipa', pomona: 'lalbrew-pomona', diamond: 'lalbrew-diamond' };
// Par houblon de la ligne : le statut du moteur, en mot court, avec la pastille du houblon.
const parHop = (lev, mom, id) => ajoutsDe(lev, mom).map((a) => { const d = a.drapeaux.find((x) => x.id === id); const c = COURT[d.statut] || d.statut; return '<span class="ph"><i class="pt" style="background:' + HOP[a.hid].couleur + '" aria-hidden="true"></i>' + N(esc(c), srcM(d.sources), nivM(d.sources)) + '</span>'; }).join('');
const statutCommun = (lev, mom, id) => { const s = ajoutsDe(lev, mom).map((a) => COURT[a.drapeaux.find((x) => x.id === id).statut]); return s.every((x) => x === s[0]) ? s[0] : null; };
function voies(lev, mom) {
  const E = M.d4[lev + '|' + mom], L = M.levures[LEVID[lev]];
  const gc = statutCommun(lev, mom, 'geraniol-citronellol');
  const gd = ajoutsDe(lev, mom)[0].drapeaux.find((x) => x.id === 'geraniol-citronellol');
  const gLab = gc ? N(esc(gc), srcM(gd.sources), nivM(gd.sources)) : '';
  const tc = statutCommun(lev, mom, 'thiols-precurseurs');
  const conv = D4.voies.thiols.conversion;
  const tLab = N(plage(conv) + ' %', conv.src, conv.niv);
  const tFlag = /Samia/.test(L.betaLyase) ? N('▲ 3SH mesuré', srcM(L.sources), nivM(L.sources)) : /qualitative/.test(L.betaLyase) ? N('β-lyase', srcM(L.sources), nivM(L.sources)) : INC('β-lyase ' + L.betaLyase, srcM(L.sources), nivM(L.sources));
  const cr = E.drapeaux.find((x) => x.id === 'hop-creep');
  const cLab = N('+' + fr(HC.j2.v[0]), HC.j2.src, HC.j2.niv) + ' ' + N('+' + fr(HC.j7_10gL.v[0]) + ' % vol.', HC.j7_10gL.src, HC.j7_10gL.niv);
  const MY = H.transferts.hydrocarbures.actif;
  const fe = famEsters(L.esters);
  return '<div class="vx">'
    + '<div class="vr" data-detail="voie-geraniol-' + lev + '-' + mom + '"><span class="vs">' + pic('floral') + '<b>géraniol</b></span>' + fleche(STYLE_FL[gc] || 'meca', gLab) + '<span class="vp">' + pic('citrus') + '<b>citronellol</b></span>' + (gc ? '' : '<span class="vf">' + parHop(lev, mom, 'geraniol-citronellol') + '</span>') + '</div>'
    + '<div class="vr" data-detail="voie-thiols-' + lev + '-' + mom + '"><span class="vs">' + ico('j-lien', 14) + '<b>précurseurs</b></span>' + fleche(STYLE_FL[tc] || (mom === 'actif' ? 'meca' : 'apres'), tLab) + '<span class="vp">' + pic('tropical') + '<b>thiols</b></span><span class="vf">' + (tc ? N(esc(tc), [], 'H') : parHop(lev, mom, 'thiols-precurseurs')) + '<span class="lv">' + tFlag + '</span></span></div>'
    + '<div class="vr" data-detail="voie-creep-' + lev + '-' + mom + '"><span class="vs">' + ico('j-jauge', 14) + '<b>dextrines</b></span>' + fleche('doc', cLab) + '<span class="vp"><b>alcool</b></span><span class="vf">' + N(cr.statut.startsWith('risque :') ? 'levure vivante' : 'si levure présente', srcM(cr.sources), nivM(cr.sources)) + '</span></div>'
    + (mom === 'actif' ? '<div class="vr" data-detail="voie-co2"><span class="vs">' + pic('resin') + '<b>myrcène</b></span>' + fleche('doc', N('emporté', MY.src, MY.niv)) + '<span class="vp"><b>CO₂</b></span></div>' : '')
    + '<div class="vr" data-detail="voie-esters-' + lev + '"><span class="vs">' + ico('j-levure', 14) + '<b>levure</b></span>' + fleche('doc', N(esc(L.esters.replace(/[«»]/g, '').replace(/\s*\(fiche\)/, '').trim()), srcM(L.sources), nivM(L.sources))) + '<span class="vp">' + fe.map((f) => pic(f)).join('') + '</span></div>'
    + '</div>';
}
// Face à la 16D (lentille au style) : la zone du style (ses familles), puis les familles que le moteur
// trouve au-dessus du seuil sans que la 16D les décrive ; « hors du style » seulement au-delà du facteur
// ×10, une convention du moteur à valider.
const face16D = (lev, mom) => {
  const E = M.d4[lev + '|' + mom], st = M.style16D;
  const nd = E.famillesNonDecrites;
  const hors = E.faceAuStyle.statut === 'hors du style';
  return '<span class="f16 seul-style"><span class="zone" data-role="zone" aria-label="Ce que la 16D attend : ' + esc(st.attendu) + '">' + N('16D', srcM(st.sources), nivM(st.sources), 'z-n') + st.familles.map((f) => pic(f)).join('') + '</span>'
    + (nd.length ? '<span class="nd' + (hors ? ' xs' : '') + '" data-detail="face-16d-' + lev + '-' + mom + '">' + nd.map((f) => pic(f)).join('') + N((hors ? '≥' : '<') + ' ×' + M.facteurEleve, ['moteur'], 'H', 'conv') + '</span>' : '') + '</span>';
};
// ---- plan 2 : les détails ----
let details = '';
const statutMot = (s) => STATUT[s][0];
for (const a of ['citra', 'idaho7'].map((houblon) => ({ houblon }))) for (const [lev, nl] of LEVURES) for (const [mom, nm] of MOMENTS) for (const m of MECA) {
  const s = APP.statuts[a.houblon + '|' + lev + '|' + mom][m.id];
  const pr = D4.precurseurs[a.houblon];
  const g = Array.isArray(HOP[a.houblon].geraniol_pct) ? HOP[a.houblon].geraniol_pct[0] : null;
  const l = [['statut', '<b>' + statutMot(s.status) + '</b>'], ['sens', esc(s.sens)]];
  if (m.id === 'thiolRelease') { l.push(['β-lyase', 'inconnue dans le catalogue de l\'app (' + esc(nl) + ')']); l.push(['précurseurs', pr.inconnu ? INC(pr.raison, pr.src, 'H') : N(esc(pr.v), pr.src, pr.niv)]); }
  if (m.id === 'geraniolToCitronellol') l.push(['géraniol', g ? N(plage(g) + ' % de l\'huile', g.src, g.niv) : INC('géraniol non publié', [26], 'F')]);
  if (m.id === 'hopCreep') l.push(['enzymes, dextrines', INC('non mesurées pour ce lot', ['dépôt:app'], 'H')]);
  l.push(['à lever', N(s.inconnus + ' inconnu' + (s.inconnus > 1 ? 's' : ''), 'dépôt:app', 'H')]);
  details += detail('app-' + a.houblon + '-' + lev + '-' + mom + '-' + m.id, HOP[a.houblon].nom + ' · ' + m.titre, l, '<p class="src" data-source="dépôt:app" data-niveau="H">' + esc(SRC['dépôt:app']) + '</p>');
}
// Le « pourquoi » d'un drapeau du moteur, tel quel, avec ses sources.
const PQ = (d) => '<span class="pq" data-source="' + esc(srcTxt(srcM(d.sources))) + '" data-niveau="' + nivM(d.sources) + '">' + esc(d.pourquoi) + '</span>';
for (const [lev, nl] of LEVURES) for (const [mom, nm] of MOMENTS) {
  const E = M.d4[lev + '|' + mom], A = ajoutsDe(lev, mom);
  const parA = (id) => A.map((a) => { const d = a.drapeaux.find((x) => x.id === id); return [HOP[a.hid].nom, '<b>' + esc(d.statut) + '</b><br>' + PQ(d)]; });
  details += detail('voie-geraniol-' + lev + '-' + mom, 'géraniol → citronellol · ' + nl + ', ' + nm, parA('geraniol-citronellol'));
  details += detail('voie-thiols-' + lev + '-' + mom, 'précurseurs → thiols · ' + nl + ', ' + nm, [...parA('thiols-precurseurs'), [nl, '<span class="pq" data-source="' + esc(srcTxt(srcM(M.levures[LEVID[lev]].sources))) + '" data-niveau="' + nivM(M.levures[LEVID[lev]].sources) + '">β-lyase : ' + esc(M.levures[LEVID[lev]].betaLyase) + '</span>']]);
  const cr = E.drapeaux.find((x) => x.id === 'hop-creep');
  details += detail('voie-creep-' + lev + '-' + mom, 'hop creep · ' + nm, [['statut', '<b>' + esc(cr.statut) + '</b>'], ['pourquoi', PQ(cr)], ['variétés', '<span class="pq" data-source="moteur" data-niveau="P">' + esc(M.hopCreep.nonTrouve) + '</span>']]);
  details += detail('face-16d-' + lev + '-' + mom, 'face à la 16D', [['moteur', '<b>' + esc(E.faceAuStyle.statut) + '</b><br><span class="pq" data-source="moteur" data-niveau="H">' + esc(E.faceAuStyle.texte) + '</span>'], [N('×' + M.facteurEleve, ['moteur'], 'H'), '<span class="pq" data-source="moteur" data-niveau="H">' + esc(E.facteurEleve.convention) + ' : convention à valider</span>']]);
}
for (const [lev, nl] of LEVURES) { const L = M.levures[LEVID[lev]]; const pq = (t) => '<span class="pq" data-source="' + esc(srcTxt(srcM(L.sources))) + '" data-niveau="' + nivM(L.sources) + '">' + esc(t) + '</span>';
  details += detail('voie-esters-' + lev, 'arôme de la levure · ' + nl, [['esters', pq(L.esters)], ['POF', pq(L.pof)], ['atténuation', pq(L.attenuation)], ['biotransfo.', pq(L.biotransformation)], ['familles', '<span class="src">lecture des mots de la fiche (H)</span>']]); }
details += detail('voie-co2', 'myrcène et CO₂', [['actif', drap(H.transferts.hydrocarbures.actif)], ['dry hop', N(plage(H.transferts.hydrocarbures.dh[0]) + ' %', H.transferts.hydrocarbures.dh[0].src, H.transferts.hydrocarbures.dh[0].niv) + ' <span class="src">retrouvé en bière</span>']]);
details += detail('diamond', 'Diamond', [['mesuré', '<span class="pq" data-source="' + esc(srcTxt(srcM(M.levures['lalbrew-diamond'].sources))) + '" data-niveau="P">' + esc(M.levures['lalbrew-diamond'].notes.join(' ')) + '</span>'], ['essai', '<span class="pq" data-source="dépôt:samia2024" data-niveau="P">' + esc(D4.diamond.essai) + '</span>']]);

// Diamond : le plus de thiols mesurés, le fruité perçu le plus faible (Samia) : deux échelles de rang.
const diamond = (lev) => {
  const L = M.levures['lalbrew-diamond'];
  const echelle = (haut, lab) => '<span class="rg"><span class="rg-c">' + [0, 1, 2, 3, 4].map((i) => '<i class="' + ((haut ? i === 0 : i === 4) ? 'on' : '') + '"></i>').join('') + '</span><span class="rg-l">' + lab + '</span></span>';
  return '<div class="dm' + (lev === 'diamond' ? ' dm-on' : '') + '" data-detail="diamond"><span class="dm-n" data-source="' + esc(srcTxt(srcM(L.sources))) + '" data-niveau="P">Diamond</span>' + echelle(true, 'thiols') + '<svg class="dm-x" width="40" height="34" viewBox="0 0 40 34" aria-hidden="true"><path d="M2 4 38 30" /></svg>' + echelle(false, 'fruité') + '</div>';
};
// La fiche de la levure, en une ligne : atténuation et température (moteur, fiche relevée en H §8.4).
const ident = (lev) => { const L = M.levures[LEVID[lev]]; const [att, t] = L.attenuation.split(' ; '); return '<span class="id">' + N(esc(att.replace(/\s*\(.*$/, '')), srcM(L.sources), nivM(L.sources)) + N(esc((t || '').replace(/\s*ou.*$/, '')), srcM(L.sources), nivM(L.sources)) + '</span>'; };

// ---- les états (levure × moment), un seul visible ----
let etats = '';
for (const [lev, nl] of LEVURES) for (const [mom] of MOMENTS) {
  const on = lev === DEF.lev && mom === DEF.mom;
  etats += '<div class="etat" data-lev="' + lev + '" data-mom="' + mom + '"' + (on ? '' : ' hidden') + '>'
    + '<div class="reg2">' + seg('moment', 'Moment du dry hop', MOMENTS.map(([v, t, i]) => ({ v, t, ico: ico(i, 14) })), mom) + '</div>'
    + '<section class="ajouts carte" aria-label="Ajouts à cru">' + lignes(lev, mom) + '</section>'
    + '<section class="voies carte" aria-label="Voies de biotransformation"><div class="v-t"><span class="sec-t">' + ico('j-levure', 14) + nl + '</span>' + face16D(lev, mom) + '</div>' + voies(lev, mom) + diamond(lev) + '</section>'
    + '</div>';
}

const LEGENDE = legende([
  [signe('v-jeu'), 'en jeu : la voie concorde avec ce que l\'app sait (ni rendement, ni intensité)'],
  [signe('v-si'), 'si… : une condition manque (levure, précurseur, viabilité)'],
  [signe(null), 'inconnu, jamais zéro'],
  [signe('v-off'), 'inactif : pas de levure vivante'],
  ['<svg width="40" height="10" viewBox="0 0 64 10"><path d="M1 5H58" style="stroke:#16161a;stroke-width:2"/></svg>', 'moteur : documenté pour cette levure et ce moment'],
  ['<svg width="40" height="10" viewBox="0 0 64 10"><path d="M1 5H58" style="stroke:#8a909b;stroke-width:2;stroke-dasharray:4 3"/></svg>', 'moteur : possible, non documenté pour cette levure'],
  ['<svg width="40" height="10" viewBox="0 0 64 10"><path d="M1 5H58" style="stroke:#b8bcc4;stroke-width:2;stroke-dasharray:2 4"/></svg>', 'moteur : hors du cas documenté, peu documenté ou non évaluable'],
  ['<span class="zone" style="height:20px"><b class="z-n">16D</b></span>', 'ce que la 16D attend : terreux, herbacé ou floral, faible et facultatif'],
  ['<span class="nd">&lt; ×10</span>', 'au-dessus du seuil, famille que la 16D ne décrit pas ; « hors du style » (orangé) à partir de ×10, convention du moteur à valider'],
  ['<span class="pt" style="background:#184078"></span>', 'le statut pour ce houblon de la ligne'],
  ['<span class="rg-c"><i class="on"></i><i></i><i></i></span>', 'rang parmi les 5 levures de l\'essai Samia (Cascade, sans dry hop)'],
  ['<span class="alpha"><span class="a-lot n">6,5 %</span><span class="a-fi n">4,5–9</span></span>', 'α du lot en stock, puis plage des fiches'],
  [ico('j-cuve-a', 14) + ico('j-cuve-p', 14), 'dry hop en fermentation active ou après'],
]);

const corps = '<main class="ecran">'
  + '<div class="barre"><button class="retour" type="button" aria-label="Retour">' + ico('i-chev-l', 16) + '</button><h1>Levure, dry hop</h1>' + lentille() + legendeBouton() + '</div>'
  + '<div class="reg">' + seg('levure', 'Levure', LEVURES.map(([v, t]) => ({ v, t })), DEF.lev) + '</div>'
  + etats + '</main>' + LEGENDE + details;

const css = `
  .reg .seg { width: 100%; justify-content: space-between; }
  .reg .seg button { flex: 1; justify-content: center; padding: 0 6px; }
  .reg2 { display: flex; align-items: center; gap: 8px; }
  .id { display: inline-flex; gap: 8px; margin-left: auto; font-size: 12px; color: var(--gris); }
  .ajouts { display: flex; flex-direction: column; padding: 2px 10px 8px; }
  .aj { display: flex; flex-direction: column; gap: 6px; padding: 8px 0 4px; border-radius: 4px; }
  .aj + .aj { border-top: 1px solid var(--trait); }
  .aj1 { display: flex; align-items: center; gap: 8px; min-height: 24px; }
  .dose { font-weight: 600; font-size: 14px; color: var(--encre); }
  .aj-j { margin-left: auto; display: inline-flex; align-items: baseline; gap: 6px; font-size: 12px; }
  .frise { position: relative; display: block; height: 8px; }
  .fr-axe { position: absolute; left: 0; right: 0; top: 3px; height: 2px; border-radius: 2px; background: var(--piste); }
  .fr-bar { position: absolute; top: 1px; height: 6px; border-radius: 2px; }
  .cps { display: flex; gap: 6px; }
  .cp { display: inline-flex; align-items: center; gap: 3px; height: 28px; padding: 0 8px 0 6px; border-radius: 14px; box-shadow: inset 0 0 0 1px var(--trait2); background: #fff; min-width: 0; }
  .cp .pi-b { margin-left: -4px; }
  .cpm { font-size: 12px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .sg { display: inline-flex; color: var(--encre); }
  .ic-rd { display: inline-flex; align-items: center; justify-content: center; flex: none; color: var(--encre); }
  .voies { display: flex; flex-direction: column; gap: 2px; padding: 4px 10px 8px; }
  .v-t { display: flex; align-items: center; gap: 8px; min-height: 32px; }
  .v-t .sec-t { color: var(--encre); font-size: 14px; }
  .zone { margin-left: auto; display: inline-flex; align-items: center; gap: 3px; height: 26px; padding: 0 6px 0 8px; border-radius: 13px; background: var(--piste); }
  .z-n { font-size: 12px; font-weight: 600; margin-right: 2px; }
  .vx { display: flex; flex-direction: column; }
  .vr { display: grid; grid-template-columns: 100px 1fr 96px; align-items: center; column-gap: 4px; min-height: 40px; cursor: pointer; border-radius: 4px; }
  .vr + .vr { border-top: 1px solid var(--trait); }
  .vr .vf { grid-column: 2 / 4; justify-self: end; margin: -6px 0 4px; font-size: 12px; }
  .vs, .vp { display: inline-flex; align-items: center; gap: 4px; min-width: 0; }
  .vs b, .vp b { font-size: 12px; font-weight: 600; white-space: nowrap; }
  .fl { display: flex; flex-direction: column; align-items: center; gap: 1px; min-width: 0; }
  .fl-lab { font-size: 12px; font-weight: 600; display: inline-flex; gap: 4px; white-space: nowrap; }
  .fl svg { width: 100%; }
  .fl-l { stroke: var(--encre); stroke-width: 2; fill: none; }
  .fl-p { stroke: var(--encre); stroke-width: 2; fill: none; stroke-linecap: round; stroke-linejoin: round; }
  .fl-meca .fl-l { stroke: #8a909b; stroke-dasharray: 4 3; } .fl-meca .fl-p { stroke: #8a909b; }
  .fl-apres .fl-l { stroke: #b8bcc4; stroke-dasharray: 2 4; } .fl-apres .fl-p { stroke: #b8bcc4; }
  .al { display: inline-flex; color: var(--acc); }
  .ph { display: inline-flex; align-items: center; gap: 3px; margin-left: 8px; }
  .lv { margin-left: 10px; display: inline-flex; }
  .f16 { margin-left: auto; display: inline-flex; align-items: center; gap: 6px; }
  .f16 .zone { margin-left: 0; }
  .nd { display: inline-flex; align-items: center; gap: 2px; height: 26px; padding: 0 6px; border-radius: 13px; box-shadow: inset 0 0 0 1px var(--trait2); font-size: 12px; cursor: pointer; }
  .nd.xs { box-shadow: inset 0 0 0 1.5px var(--acc); color: var(--acc); }
  .conv { font-size: 12px; margin-left: 2px; }
  .pq { font-size: 12px; color: var(--encre); }
  .dm { display: flex; align-items: center; gap: 8px; min-height: 44px; padding-top: 4px; border-top: 1px solid var(--trait); cursor: pointer; }
  .dm-n { font-size: 12px; font-weight: 600; width: 100px; font-family: var(--sans); }
  .dm-on .dm-n { text-decoration: underline; text-underline-offset: 3px; }
  .rg { display: inline-flex; align-items: center; gap: 4px; }
  .rg-c { display: inline-flex; flex-direction: column; gap: 2px; }
  .rg-c i { width: 18px; height: 4px; border-radius: 2px; background: var(--piste); display: block; }
  .rg-c i.on { background: var(--encre); }
  .rg-l { font-size: 12px; font-weight: 600; }
  .dm-x path { stroke: #8a909b; stroke-width: 1.5; stroke-dasharray: 3 3; fill: none; }
  .barre .lentille { margin-left: auto; }
`;
const script = `
  const ST = { lev: '${DEF.lev}', mom: '${DEF.mom}' };
  function montrer() {
    document.querySelectorAll('.etat').forEach((e) => { e.hidden = !(e.dataset.lev === ST.lev && e.dataset.mom === ST.mom); });
    document.querySelectorAll('[data-seg="levure"] [data-v]').forEach((b) => b.setAttribute('aria-checked', String(b.dataset.v === ST.lev)));
    document.querySelectorAll('[data-seg="moment"] [data-v]').forEach((b) => b.setAttribute('aria-checked', String(b.dataset.v === ST.mom)));
  }
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-seg] [data-v]'); if (!b) return;
    const s = b.closest('[data-seg]').dataset.seg; if (s === 'levure') ST.lev = b.dataset.v; else if (s === 'moment') ST.mom = b.dataset.v; montrer();
  });
  const q = new URLSearchParams(location.search); if (q.get('lev')) ST.lev = q.get('lev'); if (q.get('mom')) ST.mom = q.get('mom'); montrer();
`;

fs.writeFileSync(path.join(ici, 'etat.html'), page({ titre: 'Levure et dry hop', css, corps, script, fiches: ['citra', 'idaho7'].map((k) => HOP[k].cle) }));
console.log('écrit d4/etat.html');
