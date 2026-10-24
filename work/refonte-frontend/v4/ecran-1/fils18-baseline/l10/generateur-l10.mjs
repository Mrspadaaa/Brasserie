// Lot 18 · l10 · En moins : q2b réduit au strict nécessaire. Génère l10/etat-b.html et l10/planche.html
// depuis fils15-s5-complexe/donnees/c1.json (via commun-l10-l11.mjs). Usage : node generateur-l10.mjs
// En moins (et pourquoi, dans NOTE.md) : les onglets deviennent un titre et le retour ; Barres/Radar
// une icône ; les tuiles de réponse perdent fond, sous-titre et mini-cible ; chaque groupe montre sa
// voie de tête, les autres repliées sous « +N » avec les pictos de ce qu'elles ajoutent ; les cases
// d'objectifs quittent les lignes (la barre du groupe les porte, data-crans) ; le stock ne marque que
// l'exception ; l'« α » de l'usage déduit cède au trait seul ; les crans s'écrivent « +2 » face à
// deux graduations fines de la piste.
import {
  C, D18, J, BASE, TEXTE, FOND, OBJ, OB, NOM, COURT, ORDRE, V, MEMES, GESTES, slotsDe, nomVoie, momentDe, MOMENT, pill, usage, STOCK,
  couloirs, fonds, VIS, caseFam, reponses, MOT, BIO, bioPictos, IBU, HORS, FICHES, voieDe, stockDe, roue, reglette, replis, actions, motsHTML,
  picto, ic, jc, SYMBOLES, noteAlpha, fr, p, recente, plageF, nbF, ROLE_MOT, mots, esc, page, ecrire, LENTILLE_JS, ATTENDUES,
} from './commun-l10-l11.mjs';

const OUT = D18 + '/l10';
const AJOUTEES = [1, 15];
// L'écart au bout de la barre : « +2 » (crans du style, lus face aux graduations), « ≈ » en icône sous un demi-cran.
const lab = (c) => (Math.abs(c) < 0.5 ? `<span class="ap" role="img" aria-label="moins d'un demi-cran">${jc('j-approx')}</span>` : (c > 0 ? '+' : '−') + Math.round(Math.abs(c)));
let nRepli = 0;

// ---------- haut de page : le retour, le titre, la lentille, la vue en icône ----------
const tete = `
  <header class="barre">
    <a class="retour" href="#" aria-label="Retour à ma bière">${ic('i-chev-l')}</a>
    <h1>Suggestions</h1>
    <div class="seg lentille" role="radiogroup" aria-label="Lecture des familles">
      <button role="radio" data-e="style" aria-checked="true">Au style</button><button role="radio" data-e="absolu" aria-checked="false">Absolu</button>
    </div>
    <button class="vue" aria-label="Voir en radar">${jc('j-radar')}</button>
  </header>`;

// ---------- les réponses : le mot, rien d'autre ----------
const R = reponses();
const rep = (f, titre, extra = '') => {
  const r = R[f], X = r.X, nom = nomVoie(X.v).nom;
  const lbl = f === 'resin' ? 'Moins résineux : ma bière est au-dessus du style d\'après la dégustation ; aucune voie houblon ne l\'y ramène'
    : `${titre} : la meilleure voie, ${nom}, ${MOT[r.verdict].toLowerCase()} la visée (${fr(r.avant)} → ${fr(r.apres)}, visée ${fr(r.visee)})`;
  return `<section class="rp" data-role="objectif" data-famille="${f}" aria-label="${lbl}" style="--b:${BASE[f]};--t:${TEXTE[f]}">
      <span class="rp-n">${picto(f)}${titre}</span>
      <b class="rep" data-role="reponse" data-famille="${f}" data-verdict="${r.verdict}">${MOT[r.verdict]}</b>${extra}
    </section>`;
};
const reps = `
  <div class="reps">
    ${rep('resin', 'Moins résineux', `<button class="hh-b" onclick="var b=document.querySelector('[aria-controls=hh-c]');if(b.getAttribute('aria-expanded')!=='true')b.click();document.getElementById('hh').scrollIntoView({behavior:'smooth'})">hors houblon${ic('i-chev-r')}</button>`)}
    ${rep('floral', 'Plus floral')}
    ${rep('citrus', 'Plus agrumes')}
  </div>`;

// ---------- une voie : une ligne ----------
const ajc = (X) => { const { nom } = nomVoie(X.v), on = AJOUTEES.includes(X.n); return `<button class="ajc" data-role="ajouter-comparer" aria-pressed="${on}" aria-label="${on ? 'Retirer ' + nom + ' de la comparaison' : 'Ajouter ' + nom + ' à la comparaison'}">${ic(on ? 'i-check' : 'i-plus')}</button>`; };
const noms = (v) => (v.levureVers ? `<b class="nm">${v.levureVers}</b>` : v.actions.map((a) => `<b class="nm" data-houblon="${a.houblon}">${a.houblon}</b>`).join('<span class="et">+</span>'));
const stockEx = (v) => (v.levureVers || v.stock === 'suffisant' ? '' : `<span class="stk" role="img" aria-label="${STOCK[v.stock][0]}">${jc(STOCK[v.stock][1])}</span>`);
function bio(X) {
  if (!(X.v.bio || []).length) return '';
  const id = 'bio-' + X.n;
  const liste = BIO.map((s) => `<li><b>${s.titre}</b> · ${s.statut}</li>`).join('');
  return `<span class="bio" data-role="bio"><button class="bio-b" data-repli aria-expanded="false" aria-controls="${id}" aria-label="Biotransformation possible, ampleur non quantifiée">${bioPictos()}</button><ul id="${id}" hidden>${liste}</ul></span>`;
}
function ligne(X, { voie = false } = {}) {
  const { q } = nomVoie(X.v);
  const dose = X.v.type === 'assemblage' ? '<span class="q">5+5 g</span>' : q ? `<span class="q">${q}</span>` : '';
  const carte = X.v.levureVers ? '' : ' data-role="ligne-houblon"';
  return `<div class="vr"${carte}${voie ? ` data-voie="${X.n}"` : ''}>
        <span class="vg">${noms(X.v)}${(X.v.fiches || []).map((h) => usage(h)).join('')}${dose}${stockEx(X.v)}${bio(X)}</span>
        <span class="exs">${X.extras.map((t) => caseFam(X, t.famille, false, { vide: false })).join('')}</span>${ajc(X)}
      </div>`;
}
// La voie de tête porte sa barre (data-voie autour des deux) ; les autres se replient.
const tetePortee = (X, avant) => `<div class="voie" data-voie="${X.n}">${avant ? `<div class="rangee">${couloirs(X, { lab: true, labResin: true, crans: true, labFn: lab })}</div>` : ''}${ligne(X)}${avant ? '' : `<div class="rangee">${couloirs(X, { lab: true, labResin: true, crans: true, labFn: lab })}</div>`}</div>`;
function repli(xs, quoi) {
  if (!xs.length) return '';
  const fams = slotsDe(xs), id = 'autres-' + ++nRepli;
  return `<div class="autres"><button class="autres-b" data-repli aria-expanded="false" aria-controls="${id}" aria-label="${xs.length} autre${xs.length > 1 ? 's' : ''} ${quoi} : ${xs.map((X) => nomVoie(X.v).nom).join(', ')}"><b>+${xs.length}</b><span class="tz">${fams.map((f) => `<span class="tzf" data-famille="${f}">${picto(f)}</span>`).join('')}</span>${ic('i-chev-b', 16, 'chev')}</button>
      <div class="autres-c" id="${id}" hidden>${xs.map((X) => ligne(X, { voie: true })).join('')}</div>
    </div>`;
}
const groupes = MEMES.map((g, gi) => {
  const [tete0, ...autres] = g.voies;
  return `<div class="gr">
    <div class="gh">${jc('j-egal', 'eg')}<b class="nb-v">×${g.voies.length}</b>${gi ? '' : '<span class="me">même effet</span>'}<span class="dose">${tete0.v.actions[0].grammes} g</span>${pill(momentDe(tete0.v))}</div>
    ${tetePortee(tete0, true)}
    ${repli(autres, 'au même effet')}
  </div>`;
}).join('');
// La tête d'un geste, en moins : la dose est sur la ligne, la pastille « levure » dit le changement de souche.
const GT = { b10: 'Assembler', b60: 'Remplacer Nugget', dryActive: 'Dry hop', levure: '' };
const gestes = GESTES.map((g) => {
  const [t0, ...autres] = g.voies;
  return `<div class="gr">
    <div class="gh">${g.ic ? jc(g.ic) : ''}${GT[g.mo] ? `<span class="gt">${GT[g.mo]}</span>` : ''}${pill(g.mo)}${g.est ? `<span class="est">${jc('j-approx')}estimé</span>` : ''}</div>
    ${tetePortee(t0, false)}
    ${repli(autres, g.t.toLowerCase())}
  </div>`;
}).join('');

const tetes = `
    <div class="tetes" aria-hidden="true">
      <div class="m re"><i class="axe g-ax"></i></div>
      <div class="g"></div>
      <div class="m fl"><i class="axe d-ax"></i><span class="puce v sty-only" style="--s:${p(VIS.flS)}">visée</span>
        <span class="puce pv abs-only" style="--a:${p(VIS.flA)}">${picto('floral')}</span><span class="puce pv abs-only" style="--a:${p(VIS.ciA)}">${picto('citrus')}</span></div>
    </div>`;
const details = `
  <div class="pli">
    <button class="pli-b" data-repli aria-expanded="false" aria-controls="ibu">IBU après chaque voie <span class="pg">${fr(IBU.biere)} · style ${IBU.bande.join('–')}</span>${ic('i-chev-b', 16, 'chev')}</button>
    <ul id="ibu" hidden>${V.map((X) => `<li><span>${nomVoie(X.v).nom} · ${MOMENT[momentDe(X.v)][0]}</span><b>${fr(X.v.ibu.after)}</b></li>`).join('')}</ul>
  </div>
  <div class="pli" id="hh">
    <button class="pli-b" data-repli aria-expanded="false" aria-controls="hh-c">Hors houblon · résineux <span class="pg">${HORS.length} pistes</span>${ic('i-chev-b', 16, 'chev')}</button>
    <ul id="hh-c" hidden>${HORS.map((x) => `<li><span><b>${x.titre}</b> : ${x.action.charAt(0).toLowerCase() + x.action.slice(1)}</span><i>${x.preuve}</i></li>`).join('')}</ul>
  </div>`;

// ---------- la fiche, en moins : les mots des fiches à un toucher, la roue tout de suite ----------
function fiche(F) {
  const a = recente(F.alpha), role = F.role ? ROLE_MOT[F.role.v] || F.role.v : null, regle = F.role && /^règle/.test(F.role.src);
  const st = stockDe(F.nom);
  const par = Object.fromEntries(F.aromes.map((x) => [x.f, x]));
  const of = (F.aromes[0] || {}).of || 0;
  const decrites = ORDRE.filter((f) => par[f] && par[f].n > 0);
  const cas = (f, n, sep) => `<i class="c${n >= 2 ? ' m' : n === 1 ? ' ci' : ''}${sep ? ' sep' : ''}" data-famille="${f}" style="--b:${BASE[f]};--fd:${FOND[f]}"></i>`;
  const lignes = decrites.map((f) => {
    const x = par[f], cpt = x.of === 1 ? '' : x.n + '/' + x.of, w = mots(x), prem = x.n === 1 && x.premier.length ? 'nommé en premier' : '';
    const corps = [prem, w.join(', ')].filter(Boolean).join(' · ');
    const id = 'fl-' + F.cle.replace(/[^a-z0-9]/gi, '') + '-' + f;
    return corps ? `<div class="f-lab" data-explique="${f}"><button class="f-s" data-repli aria-expanded="false" aria-controls="${id}" aria-label="${COURT[f]}${cpt ? ', ' + x.n + ' fiches sur ' + x.of : ''} : les mots de ses fiches">${cas(f, x.n)}<b>${COURT[f]}</b>${cpt ? `<span class="f-n">${cpt}</span>` : ''}<i class="f-ch"></i></button><p id="${id}" hidden>${esc(corps)}</p></div>`
      : `<div class="f-lab" data-explique="${f}"><span class="f-s">${cas(f, x.n)}<b>${COURT[f]}</b>${cpt ? `<span class="f-n">${cpt}</span>` : ''}</span></div>`;
  }).join('');
  const txt = a ? plageF(a) + ' %' : F.lot != null ? nbF(F.lot) + ' %' : 'non renseigné';
  const html = `<section class="f-fiche" data-role="fiche" data-fiche="${esc(F.nom)}" role="dialog" aria-label="Fiche de ${esc(F.nom)}" tabindex="-1" hidden>
    <div class="f-poignee" aria-hidden="true"></div>
    <header class="f-tete"><h2>${esc(F.nom)}</h2>${st && st !== 'suffisant' ? `<span class="stk" role="img" aria-label="${STOCK[st][0]}">${jc(STOCK[st][1])}</span>` : ''}<button class="f-fermer" data-role="fermer-fiche" aria-label="Fermer la fiche de ${esc(F.nom)}">${ic('i-x')}</button></header>
    <div class="f-ab">
      <span class="f-alpha" data-role="fiche-alpha" aria-label="Acides alpha ${txt}${a ? ' (' + a.src + (a.an ? ' ' + a.an : '') + ')' : ''}${F.lot != null ? ', mon lot ' + nbF(F.lot) + ' %' : ''}"><i>α</i><b>${txt}</b>${F.lot != null ? `<span class="f-lot">lot ${nbF(F.lot)} %</span>` : ''}</span>
      ${a ? reglette(F) : ''}
      ${role ? `<span class="f-role${regle ? ' regle' : ''}" aria-label="Rôle : ${role}${regle ? ', déduit de l\'α, à valider' : ', attesté par le fournisseur'}">${role}</span>` : ''}
    </div>
    ${noteAlpha(F) ? `<p class="f-note">${noteAlpha(F)}</p>` : ''}
    <div class="f-labels" data-role="fiche-labels">
      <div class="f-bande" role="img" aria-label="Les familles citées par les fiches de ${esc(F.nom)}">${ORDRE.map((f, i) => cas(f, par[f] ? par[f].n : 0, i === ATTENDUES.length)).join('')}${of === 1 ? '<span class="f-seule">1 seule fiche</span>' : ''}</div>
      <div class="f-lgs">${lignes}</div>
    </div>
    <div class="f-arome" data-role="fiche-arome">${roue(F, { W: 350, H: 226, R: 70 })}</div>
    ${actions(F)}
    ${replis(F)}
  </section>`;
  console.log('  fiche ' + F.nom + ' : ~' + motsHTML(html) + ' mots');
  return html;
}
const fiches = `<div id="fiches"><div class="f-voile" hidden></div>${Object.values(FICHES).map(fiche).join('')}</div>`;

const CSS = `
  :root { --encre: #16161a; --gris: #5b5b66; --gris2: #6e6e78; --trait: #e6e6ec; --piste: #ececf1; --acc: #c2410c; --gut: 20px; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { background: #fff; color: var(--encre); }
  body { font: 400 14px/1.25 -apple-system, system-ui, "Segoe UI", Roboto, sans-serif; -webkit-tap-highlight-color: transparent; }
  button { font: inherit; color: inherit; background: none; border: 0; cursor: pointer; }
  svg { display: block; flex: none; }
  .ecran { max-width: 390px; margin: 0 auto; padding: 6px 16px 84px; display: flex; flex-direction: column; gap: 14px; overflow-x: hidden; }

  /* Le chrome : une ligne. */
  .barre { display: flex; align-items: center; gap: 6px; height: 36px; }
  .retour { width: 28px; height: 28px; display: inline-flex; align-items: center; justify-content: center; color: var(--encre); margin-left: -6px; }
  h1 { font-size: 17px; font-weight: 750; letter-spacing: -.01em; flex: 1; }
  .seg { display: inline-flex; border-radius: 14px; padding: 2px; box-shadow: inset 0 0 0 1px var(--trait); }
  .seg button { height: 24px; padding: 0 10px; border-radius: 12px; font-size: 13px; color: var(--gris); white-space: nowrap; }
  .seg button[aria-checked="true"] { background: var(--encre); color: #fff; font-weight: 650; }
  .vue { width: 30px; height: 28px; display: inline-flex; align-items: center; justify-content: center; color: var(--gris); }

  /* Les réponses : un mot, sous un filet de la famille. */
  .reps { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
  .rp { display: flex; flex-direction: column; gap: 5px; padding-top: 7px; border-top: 3px solid var(--b); min-height: 64px; }
  .rp-n { display: flex; align-items: center; gap: 4px; font-size: 12px; font-weight: 650; color: var(--t); white-space: nowrap; }
  .rep { font-size: 21px; font-weight: 800; line-height: 1; letter-spacing: -.02em; color: var(--encre); }
  .hh-b { display: inline-flex; align-items: center; gap: 1px; font-size: 12px; font-weight: 650; color: var(--t); text-decoration: underline; text-underline-offset: 2px; align-self: flex-start; margin-left: -1px; }
  .hh-b svg { margin: 0 -3px 0 -2px; }

  /* Les pistes, sans fond ; ma bière en rail. */
  .graph { position: relative; margin-top: -4px; }
  .fonds { position: absolute; inset: 0; display: flex; pointer-events: none; }
  .moitie { position: relative; flex: 1; }
  .moitie .ov { position: absolute; inset: 0; }
  .gut { width: var(--gut); flex: none; position: relative; }
  .gut::before { content: ''; position: absolute; top: 0; bottom: 0; left: 8.5px; width: 3px; border-radius: 2px; background: var(--encre); }
  .vl { position: absolute; top: 0; bottom: 0; width: 0; border-left: 1.5px dashed var(--encre); left: var(--s); z-index: 1; }
  body.abs .vl { left: var(--a); }
  .cr-t { position: absolute; top: 0; bottom: 0; width: 0; border-left: 1px solid var(--trait); left: var(--s); }
  .flou { position: absolute; top: 0; bottom: 0; right: var(--s0); width: var(--s1); background: linear-gradient(270deg, rgba(47,107,95,.18), rgba(47,107,95,.02)); }
  body.abs .flou { right: var(--a0); width: var(--a1); }
  .tetes { position: relative; display: flex; height: 26px; }
  .tetes .m { flex: 1; position: relative; }
  .tetes .g { width: var(--gut); flex: none; }
  .axe { position: absolute; top: 4px; height: 1px; background: var(--encre); }
  .g-ax { left: 2px; right: 0; } .d-ax { left: 0; right: 2px; }
  .g-ax::before, .d-ax::after { content: ''; position: absolute; top: -3.5px; border: 4px solid transparent; }
  .g-ax::before { left: -4px; border-right: 6px solid var(--encre); border-left: 0; }
  .d-ax::after { right: -4px; border-left: 6px solid var(--encre); border-right: 0; }
  .puce { position: absolute; top: 9px; font-size: 12px; font-weight: 650; padding: 0 6px; height: 16px; line-height: 16px; border-radius: 8px; white-space: nowrap; background: #fff; color: var(--encre); box-shadow: inset 0 0 0 1px var(--encre); display: inline-flex; align-items: center; }
  .fl .puce.v { left: calc(var(--s) - 18px); }
  .fl .puce.pv { left: calc(var(--a) - 11px); padding: 0 3px; }
  .abs-only { display: none !important; }
  body.abs .abs-only { display: inline-flex !important; }
  body.abs .sty-only { display: none !important; }

  /* Un groupe : sa tête, sa barre, sa voie de tête, le reste replié. */
  .gr { position: relative; display: flex; flex-direction: column; gap: 4px; }
  .gh { position: relative; z-index: 2; display: flex; align-items: center; gap: 6px; height: 26px; font-size: 13px; font-weight: 700; background: #fff; align-self: flex-start; padding-right: 6px; }
  .gh .eg { color: var(--gris); }
  .nb-v { font-variant-numeric: tabular-nums; }
  .me, .gt { white-space: nowrap; }
  .dose { font-weight: 600; color: var(--gris); }
  .mo { display: inline-flex; align-items: center; gap: 3px; height: 22px; padding: 0 7px 0 5px; border-radius: 11px; background: #fff; box-shadow: inset 0 0 0 1px #b9b9c2; font-size: 12px; font-weight: 700; white-space: nowrap; }
  .est { display: inline-flex; align-items: center; gap: 3px; height: 20px; padding: 0 7px 0 5px; border-radius: 10px; background: var(--piste); font-size: 12px; font-weight: 600; color: var(--gris); }
  .est b { color: var(--encre); }
  .rangee { position: relative; padding: 2px 0 8px; }
  .bars { position: relative; display: flex; height: 28px; }
  .bars .m { position: relative; flex: 1; }
  .bars .g { width: var(--gut); flex: none; }
  .ln { position: absolute; left: 0; right: 0; height: 8px; }
  .ln.a { top: 0; } .ln.b { top: 15px; }
  .zt { position: absolute; bottom: -4px; height: 2px; width: var(--s); background: rgba(22,22,26,.16); }
  .zt::after { content: ''; position: absolute; top: -4px; width: 2px; height: 8px; border-radius: 1px; background: var(--c); }
  .fl .zt { left: 0; } .fl .zt::after { right: -1px; }
  .re .zt { right: 0; } .re .zt::after { left: -1px; }
  .zt.cs::after { display: none; } body.abs .zt.cs::after { display: block; } body.abs .zt.ca::after { display: none; }
  body.abs .zt { width: var(--a); }
  .bar { position: absolute; top: 0; height: 8px; min-width: 3px; width: var(--s); background: var(--c); z-index: 1; }
  body.abs .bar:not(.inconnu) { width: var(--a); }
  .fl .bar { left: 0; border-radius: 0 4px 4px 0; } .re .bar { right: 0; border-radius: 4px 0 0 4px; }
  .bar.ci { background: var(--f); box-shadow: inset 0 0 0 1.5px var(--c); }
  .bar.sf { background: #fff; box-shadow: inset 0 0 0 1.5px var(--c); }
  .bar.inconnu { width: 22px; background: repeating-linear-gradient(135deg, #fff 0 3px, #b8bec8 3px 5px); box-shadow: inset 0 0 0 1px #8a909b; }
  .hs { position: absolute; top: 0; height: 8px; left: var(--s0); width: var(--s1); background: var(--acc); z-index: 2; border-radius: 0 4px 4px 0; }
  .re .hs { left: auto; right: var(--s0); border-radius: 4px 0 0 4px; }
  body.abs .hs { left: var(--a0); width: var(--a1); }
  body.abs .re .hs { left: auto; right: var(--a0); }
  .lab-i { position: absolute; top: -4px; left: calc(var(--s) + 4px); font-size: 12px; font-weight: 750; white-space: nowrap; background: #fff; padding: 0 3px; z-index: 3; line-height: 16px; font-variant-numeric: tabular-nums; }
  .lab-i.g { left: auto; right: calc(var(--s) + 4px); }
  body.abs .lab-i { left: calc(var(--a) + 4px); } body.abs .lab-i.g { left: auto; right: calc(var(--a) + 4px); }

  /* La ligne d'une voie : nom, usage, l'exception de stock, ce qu'elle ajoute, « + ». */
  .voie { position: relative; }
  .vr { position: relative; z-index: 2; background: #fff; display: flex; align-items: center; gap: 6px; min-height: 40px; padding: 4px 0; border-top: 1px solid var(--trait); border-bottom: 1px solid var(--trait); }
  .vg { flex: 1; min-width: 0; display: flex; flex-wrap: wrap; align-items: center; gap: 2px 5px; }
  .vr + .vr { border-top: 0; }
  .vr.f-source { box-shadow: inset 3px 0 0 var(--encre); padding-left: 6px; }
  .nm { font-size: 15px; font-weight: 700; line-height: 1.15; }
  .nm.appui, .nm.survol { background: var(--piste); border-radius: 4px; }
  .et { color: var(--gris); font-weight: 600; }
  .us { order: -1; display: inline-flex; align-items: center; height: 20px; padding: 0 4px; border-radius: 10px; background: var(--piste); color: var(--encre); }
  .us.deduit { background: none; padding: 0 1px; color: var(--gris); }
  .us .al { display: none; }
  .q { font-size: 13px; color: var(--gris); white-space: nowrap; font-variant-numeric: tabular-nums; }
  .stk { display: inline-flex; color: var(--gris); }
  .exs { display: inline-flex; gap: 2px; align-items: flex-start; flex: none; }
  .cf { width: 24px; height: 30px; display: inline-flex; flex-direction: column; align-items: center; gap: 2px; position: relative; }
  [data-famille="citrus"] { --fd: ${FOND.citrus}; } [data-famille="tropical"] { --fd: ${FOND.tropical}; } [data-famille="melon"] { --fd: ${FOND.melon}; }
  [data-famille="stoneFruit"] { --fd: ${FOND.stoneFruit}; } [data-famille="pomeFruit"] { --fd: ${FOND.pomeFruit}; } [data-famille="berries"] { --fd: ${FOND.berries}; }
  [data-famille="floral"] { --fd: ${FOND.floral}; } [data-famille="herbal"] { --fd: ${FOND.herbal}; } [data-famille="resin"] { --fd: ${FOND.resin}; }
  [data-famille="spice"] { --fd: ${FOND.spice}; } [data-famille="green"] { --fd: ${FOND.green}; } [data-famille="earthy"] { --fd: ${FOND.earthy}; }
  .cf .pi { width: 20px; height: 20px; padding: 3px; border-radius: 50%; background: var(--fd); }
  .cf.ci .pi, .cf.sf .pi { background: none; }
  .cf.moins::before { content: ''; position: absolute; left: -1px; top: -1px; width: 7px; height: 2.5px; border-radius: 2px; background: var(--encre); box-shadow: 0 0 0 1px #fff; z-index: 1; }
  .jg { display: inline-flex; gap: 2px; height: 5px; align-items: flex-end; }
  .jg i { width: 4px; height: 5px; border-radius: 2px; background: var(--encre); }
  .jg i.pt { width: 3px; height: 3px; }
  .jg.bas i { background: #fff; box-shadow: inset 0 0 0 1.2px var(--encre); }
  .jg.bas i.pt { background: var(--encre); }
  .jg.xs i { background: var(--acc); }
  .ajc { width: 30px; height: 30px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; background: #fff; box-shadow: inset 0 0 0 1.5px var(--encre); flex: none; }
  .ajc[aria-pressed="true"] { background: var(--encre); color: #fff; }

  /* Le reste, à un toucher : « +N » et les pictos de ce que ces voies ajoutent. */
  .autres { position: relative; z-index: 2; }
  .autres-b { display: inline-flex; align-items: center; gap: 6px; height: 28px; padding: 0 6px 0 2px; background: #fff; border-radius: 4px; }
  .autres-b b { font-size: 13px; font-weight: 750; font-variant-numeric: tabular-nums; }
  .tz { display: inline-flex; gap: 1px; }
  .tzf .pi { width: 16px; height: 16px; }
  .chev { color: var(--gris); transition: transform .15s; }
  .autres-b[aria-expanded="true"] .chev { transform: rotate(180deg); }
  .autres-c > .vr:first-child { border-top: 1px solid var(--trait); }
  .autres-c[hidden] { display: none; }

  .bio { display: inline-flex; position: static; }
  .bio-b { display: inline-flex; align-items: center; gap: 3px; height: 24px; padding: 0 4px; border-radius: 12px; box-shadow: inset 0 0 0 1px #8a909b; background: repeating-linear-gradient(135deg, #fff 0 3px, #e3e4ea 3px 5px); }
  .bt { display: inline-flex; align-items: center; gap: 1px; background: #fff; border-radius: 8px; padding: 0 2px; height: 18px; }
  .bt .fl { width: 12px; height: 12px; color: var(--gris); }
  .bt.mot span { font-size: 12px; font-weight: 650; margin-left: 2px; }
  .bio ul { position: absolute; left: 0; right: 0; top: 100%; z-index: 6; background: #fff; border-radius: 8px; box-shadow: 0 6px 18px rgba(0,0,0,.16); padding: 10px 12px 10px 24px; font-size: 13px; display: flex; flex-direction: column; gap: 6px; }
  .bio ul[hidden] { display: none; }
  .ap { display: inline-flex; align-items: center; height: 16px; }
  .est svg { color: var(--encre); }

  /* Les plis du bas. */
  .pli { border-top: 1px solid var(--trait); padding: 6px 0 0; }
  .pli-b { display: flex; align-items: center; gap: 4px; width: 100%; min-height: 32px; font-size: 14px; font-weight: 700; text-align: left; }
  .pli-b .chev { margin-left: auto; }
  .pli-b[aria-expanded="true"] .chev { transform: rotate(180deg); }
  .pg { font-weight: 500; color: var(--gris); font-size: 13px; margin-left: 4px; }
  .pli ul { list-style: none; margin: 4px 0 4px; display: flex; flex-direction: column; gap: 4px; font-size: 13px; }
  .pli ul[hidden] { display: none; }
  .pli li { display: flex; justify-content: space-between; gap: 10px; }
  .pli li b { font-variant-numeric: tabular-nums; }
  .pli li i { color: var(--gris2); font-style: normal; font-size: 12px; white-space: nowrap; }

  .cmp { position: fixed; z-index: 8; left: 50%; transform: translateX(-50%); bottom: 14px; width: 358px; max-width: calc(100% - 32px); height: 46px; border-radius: 23px; background: var(--encre); color: #fff; display: flex; align-items: center; justify-content: center; gap: 6px; font-size: 15px; font-weight: 700; text-decoration: none; box-shadow: 0 6px 18px rgba(0,0,0,.24); }

  /* La fiche, en moins : une feuille blanche, des filets, la roue tout de suite. */
  .f-voile { position: fixed; inset: 0; z-index: 20; background: rgba(22,22,26,.32); }
  .f-fiche { position: fixed; z-index: 21; background: #fff; color: var(--encre); overflow-y: auto; overscroll-behavior: contain; padding: 0 16px 16px; display: flex; flex-direction: column; gap: 10px; }
  .f-fiche[hidden] { display: none; }
  .f-feuille { left: 0; right: 0; bottom: 0; max-height: calc(100% - 56px); border-radius: 8px 8px 0 0; box-shadow: 0 -6px 24px rgba(0,0,0,.18); }
  .f-bulle { width: 382px; max-height: calc(100% - 16px); border-radius: 8px; box-shadow: 0 10px 32px rgba(0,0,0,.2), 0 0 0 1px var(--trait); padding-top: 12px; }
  .f-poignee { align-self: center; width: 36px; height: 4px; border-radius: 2px; background: #c9cad2; margin: 8px 0 0; flex: none; touch-action: none; }
  .f-bulle .f-poignee { display: none; }
  .f-tete { display: flex; align-items: center; gap: 6px; }
  .f-tete h2 { font-size: 21px; font-weight: 800; letter-spacing: -.02em; flex: 1; }
  .f-fermer { width: 32px; height: 32px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; box-shadow: inset 0 0 0 1px var(--trait); }
  .f-ab { display: flex; align-items: center; gap: 8px; padding-bottom: 10px; border-bottom: 1px solid var(--trait); }
  .f-alpha { display: inline-flex; align-items: baseline; gap: 4px; }
  .f-alpha i { font-style: normal; font-size: 15px; color: var(--gris); }
  .f-alpha b { font-size: 19px; font-weight: 750; font-variant-numeric: tabular-nums; }
  .f-lot { font-size: 13px; color: var(--gris); }
  .f-role { margin-left: auto; font-size: 13px; height: 24px; line-height: 22px; padding: 0 9px; border-radius: 12px; box-shadow: inset 0 0 0 1px var(--encre); white-space: nowrap; }
  .f-role.regle { box-shadow: none; border: 1px dashed var(--gris2); color: var(--gris); }
  .f-note { font-size: 12px; color: var(--gris); margin-top: -4px; }
  .f-bande { display: flex; align-items: center; gap: 2px; }
  .f-bande .c, .f-lab .c { width: 16px; height: 16px; border-radius: 2px; background: var(--piste); flex: none; }
  .f-bande .c.sep { margin-left: 6px; }
  .c.m { background: var(--b) !important; }
  .c.ci { background: var(--fd) !important; box-shadow: inset 0 0 0 1.5px var(--b); }
  .f-seule { margin-left: 8px; font-size: 12px; color: var(--gris); }
  .f-lgs { display: grid; grid-template-columns: 1fr 1fr; gap: 2px 12px; margin-top: 8px; }
  .f-lab .f-s { display: flex; align-items: center; gap: 6px; min-height: 26px; font-size: 14px; text-align: left; }
  .f-ch { width: 5px; height: 5px; border-right: 1.5px solid var(--gris2); border-bottom: 1.5px solid var(--gris2); transform: rotate(45deg); margin: -3px 0 0 2px; }
  .f-s[aria-expanded="true"] .f-ch { transform: rotate(225deg); margin-top: 3px; }
  .f-lab p[hidden] { display: none; }
  .f-n { color: var(--gris); font-variant-numeric: tabular-nums; }
  .f-lab p { font-size: 13px; color: var(--gris); padding: 0 0 4px 22px; }
  .f-arome { display: flex; justify-content: center; border-top: 1px solid var(--trait); padding-top: 4px; }
  .f-actions { display: flex; align-items: center; gap: 6px; }
  .f-gout { display: inline-flex; gap: 2px; margin-right: auto; }
  .f-g { width: 34px; height: 34px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; color: var(--gris); box-shadow: inset 0 0 0 1px var(--trait); }
  .f-g[aria-pressed="true"] { background: var(--encre); color: #fff; box-shadow: none; }
  .f-act { height: 34px; padding: 0 12px; border-radius: 17px; display: inline-flex; align-items: center; gap: 4px; font-size: 13px; font-weight: 700; box-shadow: inset 0 0 0 1.5px var(--encre); white-space: nowrap; }
  .f-ajouter { background: var(--encre); color: #fff; }
  .f-ajouter[aria-pressed="true"] { background: #fff; color: var(--encre); }
  .f-replis { display: flex; gap: 14px; border-top: 1px solid var(--trait); padding-top: 8px; }
  .f-repli { font-size: 13px; font-weight: 650; color: var(--gris); height: 26px; text-decoration: underline; text-decoration-color: var(--trait); text-underline-offset: 3px; }
  .f-repli[aria-expanded="true"] { color: var(--encre); text-decoration-color: var(--encre); }
  .f-sec { font-size: 13px; display: flex; flex-direction: column; gap: 4px; }
  .f-sec[hidden] { display: none; }
  .f-rg { display: flex; justify-content: space-between; gap: 8px; } .f-rg span { color: var(--gris); }
  .f-gris { color: var(--gris); }
  .f-tags { display: flex; flex-wrap: wrap; gap: 4px; } .f-tags span { padding: 1px 7px; border-radius: 10px; background: var(--piste); font-size: 12px; }
  @media (min-width: 700px) { body.f-ouverte { overflow: auto; } }
`;

const corps = `<main class="ecran">${tete}${reps}
  <div class="graph">${fonds({ crans: true })}${tetes}
    ${groupes}
    ${gestes}
  </div>
  ${details}
  <a class="cmp" data-role="comparer" href="#">Comparer <b class="nb">(${AJOUTEES.length})</b></a>
</main>
${fiches}`;
ecrire(OUT + '/etat-b.html', page({ titre: 'Suggestions · en moins', commentaire: 'Lot 18 · l10 · En moins (c1). q2b réduit au strict nécessaire : la réponse, la barre de chaque groupe une fois, sa voie de tête, le reste replié sous « +N ». Appui long ou survol long sur un houblon : sa fiche g1. Généré par generateur-l10.mjs.', css: CSS, corps, js: LENTILLE_JS }));

// ======================= planche : l'écran en mini, la fiche, l'abécédaire =======================
const ab = `
  <div class="abc">
    <div class="it"><span class="sw" style="background:#fff;box-shadow:inset 0 0 0 1px var(--trait)"></span><span class="sw" style="background:var(--encre)"></span><span class="mot">surfaces</span></div>
    <div class="it"><b style="font-size:21px;font-weight:800;letter-spacing:-.02em">Approche</b><span class="mot">texte</span></div>
    <div class="it"><span class="ajc" style="box-shadow:inset 0 0 0 1.5px var(--encre)">${ic('i-plus')}</span><span class="mot">action</span></div>
    <div class="it"><span class="cf mq" data-famille="floral">${picto('floral')}<span class="jg"><i></i></span></span><span class="mot">famille</span></div>
    <div class="it"><span class="mini-piste"><i class="mz"></i><i class="mb"></i><i class="mx"></i></span><span class="mot">au style</span></div>
    <div class="it"><span class="bt-m">Comparer</span><span class="mot">bouton</span></div>
  </div>`;
const planche = `<!doctype html>
<html lang="fr">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>l10 · En moins · planche</title>
<style>
  :root { --encre: #16161a; --gris: #5b5b66; --trait: #e6e6ec; --piste: #ececf1; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { background: #fff; color: var(--encre); }
  body { font: 400 13px/1.25 -apple-system, system-ui, "Segoe UI", Roboto, sans-serif; }
  svg { display: block; flex: none; }
  .pl { width: 390px; margin: 0 auto; padding: 12px 12px 16px; display: flex; flex-direction: column; gap: 12px; }
  h1 { font-size: 15px; font-weight: 800; letter-spacing: -.01em; }
  h1 span { font-weight: 500; color: var(--gris); }
  .minis { display: flex; gap: 6px; }
  .mini { width: 180px; height: 600px; overflow: hidden; position: relative; box-shadow: 0 0 0 1px var(--trait); border-radius: 8px; }
  .mini iframe { width: 390px; height: 1300px; border: 0; transform: scale(.4615); transform-origin: 0 0; position: absolute; left: 0; top: 0; pointer-events: none; }
  .abc { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px 8px; border-top: 1px solid var(--trait); padding-top: 12px; }
  .it { display: flex; flex-direction: column; align-items: flex-start; gap: 5px; }
  .mot { font-size: 12px; color: var(--gris); }
  .sw { display: inline-block; width: 24px; height: 24px; border-radius: 4px; margin-right: 4px; }
  .it:first-child { flex-direction: row; flex-wrap: wrap; align-items: center; }
  .it:first-child .mot { width: 100%; }
  .ajc { width: 30px; height: 30px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; }
  .cf { width: 24px; display: inline-flex; flex-direction: column; align-items: center; gap: 2px; }
  .cf .pi { width: 20px; height: 20px; padding: 3px; border-radius: 50%; background: ${FOND.floral}; }
  .jg { display: inline-flex; gap: 2px; height: 5px; } .jg i { width: 4px; height: 5px; border-radius: 2px; background: var(--encre); }
  .mini-piste { position: relative; width: 110px; height: 14px; display: block; }
  .mz { position: absolute; left: 0; bottom: 0; width: 80px; height: 2px; background: rgba(22,22,26,.16); }
  .mz::after { content: ''; position: absolute; right: -1px; top: -4px; width: 2px; height: 8px; border-radius: 1px; background: ${BASE.floral}; }
  .mb { position: absolute; left: 0; top: 0; width: 64px; height: 8px; border-radius: 0 4px 4px 0; background: ${BASE.floral}; }
  .mx { position: absolute; left: 88px; top: -3px; bottom: -3px; border-left: 1.5px dashed var(--encre); }
  .bt-m { height: 30px; padding: 0 14px; border-radius: 15px; background: var(--encre); color: #fff; font-weight: 700; display: inline-flex; align-items: center; }
</style></head>
<body>${SYMBOLES}
<main class="pl">
  <h1>l10 · En moins <span>q2b au strict nécessaire</span></h1>
  <div class="minis">
    <div class="mini"><iframe src="etat-b.html" title="Suggestions, en moins" tabindex="-1"></iframe></div>
    <div class="mini"><iframe src="etat-b.html?fiche=Motueka" title="Fiche de Motueka, en moins" tabindex="-1"></iframe></div>
  </div>
  ${ab}
</main>
</body></html>
`;
ecrire(OUT + '/planche.html', planche);
