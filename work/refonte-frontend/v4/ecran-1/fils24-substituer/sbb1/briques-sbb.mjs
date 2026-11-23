// Briques partagées des concepts de la série b (jeton « §- » : préfixe du concept).
// Un bloc par candidat, seul celui choisi visible (le facteur libre).
export const parCand = (S, liste, fn, tag = 'div', init = S.REP.k) => liste.map((c) => `<${tag} data-pour-cand="${c.k}"${c.k === init ? '' : ' hidden'}>${fn(c)}</${tag}>`).join('');
export const doseTxt = (S, c) => c.dose.min !== c.dose.max ? `${S.fr(c.dose.grams)} g <span class="§-gr">(${S.fr(c.dose.min)}–${S.fr(c.dose.max)} selon l’α)</span>` : `${S.fr(c.dose.grams)} g`;
export const stockMot = (S, c) => !c.stock || c.stock.etat === 'à acheter' ? 'à acheter' : c.stock.suffisant === false ? `${S.fr(c.stock.libre)} g en stock, il en faut ${S.fr(c.dose.grams)}` : `en stock, il t’en restera ${S.fr(c.reste)} g`;
export const pied = (S, P, liste) => `<footer class="§-pied"><p>${parCand(S, liste, (c) => `46 g de Nugget → <b>${S.fr(c.dose.grams)} g de ${S.esc(c.nom)}</b>`, 'span')}</p><button type="button" class="§-go">Remplacer${S.ico('i-chev-r')}</button></footer>`;
export const ligneBiere = (S, f, c, { court = false } = {}) => `<div class="§-lb">${S.pic(f, 16)}<span class="§-lbn" style="color:${S.T(f)}">${court ? S.NOMF[f].slice(0, 4) + '.' : S.NOMF[f]}</span>${S.barre(f, c.apres.profil, S.NUG.profil)}${S.delta(f, c.apres.profil, S.NUG.profil)}</div>`;
export const CSS_LB = `.§-lb { display:grid; grid-template-columns:16px 64px 1fr 34px; align-items:center; gap:6px; min-height:20px; }
.§-lbn { font-size:13px; font-weight:600; }
.§-lb .§-dl { text-align:right; }`;


// Le plus grand écart simulé de ma bière (familles de la 16D et résineux), en points.
export const maxDelta = (S, c) => Math.max(...S.BIERE_FAM.map((f) => { const x = c.apres.profil[f].v, a = S.NUG.profil[f].v; return x && a ? Math.abs(x.centre - a.centre) : 0; }));
// Pourquoi, en trois composantes du moteur (à 60′ : amertume 0,6, huiles 0,2, arôme 0,2). L'arôme à 60′ n'est pas une
// ressemblance : c'est ce que le remplaçant n'ajoute pas d'étranger (contexte amertume du moteur).
export const compos = (S, c) => {
  const b = (lab, v, poids) => `<span class="§-cp"><span>${lab} <span class="§-gr">×${poids}</span></span>${v == null ? '<i class="§-cpi"></i><b class="§-num">?</b>' : `<i class="§-cpt"><i style="width:${v}%"></i></i><b class="§-num">${v}</b>`}</span>`;
  return `<span class="§-cps">${b('amertume', c.comp.amertume, '0,6')}${b('huiles', c.comp.huiles, '0,2')}${b('rien d’étranger', c.comp.arome, '0,2')}</span>`;
};
export const CSS_CP = `.§-cps { display:flex; flex-direction:column; gap:3px; }
.§-cp { display:grid; grid-template-columns:118px 1fr 26px; align-items:center; gap:6px; font-size:12px; }
.§-cpt { position:relative; display:block; height:6px; border-radius:999px; background:#ebebeb; }
.§-cpt i { position:absolute; left:0; top:0; bottom:0; border-radius:999px; background:#444; }
.§-cpi { display:block; height:6px; border-radius:999px; background:repeating-linear-gradient(45deg,#c9c9c9 0 2px,#fff 2px 5px); }
.§-cp b { font-size:12px; text-align:right; }`;
// Ce que le remplaçant ajoute, d'après les fiches (familles que Nugget ne cite pas, ou cite moins).
export const ajoute = (S, c) => c.gagne.length ? c.gagne.map((f) => S.pic(f, 15)).join('') : '';
// Jauge horizontale : bande, repère d'avant (rond), valeur (trait plein).
export const jauge = (S, { v, av, b0, b1, max, coul = '#111' }) => `<span class="§-jg"><i class="§-jgz" style="left:${(b0 / max) * 100}%;width:${((b1 - b0) / max) * 100}%"></i><i class="§-jgv" style="width:${Math.min(100, (v / max) * 100)}%;background:${coul}"></i>${av != null ? `<i class="§-jga" style="left:${Math.min(100, (av / max) * 100)}%"></i>` : ''}</span>`;
export const CSS_JG = `.§-jg { position:relative; display:block; height:10px; border-radius:999px; background:#f0f0f0; }
.§-jg i { position:absolute; top:0; bottom:0; display:block; }
.§-jgz { background:#d9d9d9; border-radius:999px; }
.§-jgv { left:0; top:3px !important; bottom:3px !important; border-radius:999px; }
.§-jga { top:50% !important; width:12px; height:12px; margin:-6px 0 0 -6px; border-radius:50%; background:#fff; border:2px solid #111; }`;
// Le bilan d'un remplacement, en mots de brasseur, chaque ligne tirée des données (aucun mot inventé).
export function bilan(S, c) {
  const garde = [], perd = [], inc = [];
  const dI = c.ibu - S.NUG.ibu;
  garde.push(`l’amertume : <b class="§-num">${S.fr(c.ibu, 1)}</b> IBU <span class="§-gr">(Nugget ${S.fr(S.NUG.ibu, 1)})</span>`);
  if (c.role === S.NUG.role) garde.push(`${S.usage(c)} comme Nugget`); else perd.push(`${S.usage(c)}, Nugget ${S.usage(S.NUG)}`);
  const md = maxDelta(S, c);
  (md < 1.5 ? garde : perd).push(`ma bière en arôme : ${md < 1.5 ? '<b class="§-num">~±1</b>, l’ébullition l’emporte' : '<b class="§-num">~' + S.fr(md) + '</b> pt au plus'}`);
  const dg = c.dose.grams - S.NUG.grams;
  (dg <= 0 ? garde : perd).push(`<b class="§-num">${S.sg(dg)} g</b> de matière <span class="§-gr">(α ${S.fr(c.alpha.valeur, 1)} contre 13)</span>`);
  if (!c.stock || c.stock.etat === 'à acheter') perd.push('à acheter : pas au stock');
  else if (c.stock.suffisant === false) perd.push(`il manque <b class="§-num">${S.fr(c.dose.grams - c.stock.libre)} g</b> <span class="§-gr">(${S.fr(c.stock.libre)} g au stock)</span>`);
  else perd.push(`<b class="§-num">${S.fr(c.dose.grams)} g</b> de ton stock, il t’en restera <b class="§-num">${S.fr(c.reste)} g</b>`);
  if (c.comp.huiles == null) inc.push('ses huiles : <b>?</b> pas dans nos fiches');
  else if (c.comp.huiles < 90) perd.push(`huiles moins proches : <b class="§-num">${c.comp.huiles}</b>`);
  if (c.alpha.horsFiches) inc.push(`α du lot <b class="§-num">${S.fr(c.alpha.valeur, 1)}</b> hors des fiches (${S.fr(c.alpha.plage[0], 1)}–${S.fr(c.alpha.plage[1], 1)})`);
  if (c.sansF != null && c.sansF >= 0.25) inc.push(`${S.autres(c, 26)} de ses mots sans famille : ${S.esc(c.motsSF.slice(0, 2).join(', '))}`);
  inc.push('cohumulone : <b>?</b> pas dans nos fiches');
  return { garde, perd, inc };
}
