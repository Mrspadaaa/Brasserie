// Lot 21 · a5 · « Le duel » : deux plans face à face, en papillon. Par défaut la même paire (Citra +
// Idaho 7, dry hop actif) avec deux levures, US-05 contre Pomona : « un duel de levures sur la même
// paire ». Chaque côté se règle (plan, moment, levure) ; au milieu, la famille et l'écart écrit, vers le
// côté qui l'emporte ; en tête, la réponse en une ligne. Le brasseur choisit : la page ne désigne aucun
// gagnant. Simulé : grille et paires du moteur ; vraies valeurs : fiches des levures, α. Usage :
// node generer-a5.mjs → a5/etat.html
import * as S from '../a1/socle.mjs';
const { R, ico, esc, leg } = S;
const donnees = S.tranche({ paires: () => true, grille: (g) => g.dose_gL === 4 && g.jours === 3 && (g.moment === 'dryPost' || g.moment === 'dryActive') });
const HOPS = ['Citra', 'Galaxy', 'Idaho 7', 'Cascade', 'Motueka', 'Nelson Sauvin'];
const PLANS = [];
for (let i = 0; i < HOPS.length; i++) for (let j = i + 1; j < HOPS.length; j++) PLANS.push({ id: HOPS[i] + '+' + HOPS[j], t: HOPS[i] + ' + ' + HOPS[j] + ' (2 + 2 g/L)', hs: [HOPS[i], HOPS[j]] });
for (const h of HOPS) PLANS.push({ id: h, t: h + ' seul (4 g/L)', hs: [h] });
const cote = (c, def) => `
    <div class="cote c-${c}" data-cote="${c}">
      <span class="ce"><span class="ce-l">${c === 'g' ? 'A' : 'B'}</span><label class="pl-s"><span class="pl-t" data-role="plan-t"></span>${ico('i-chev-d', 14)}<select data-role="reglage" data-reglage="ajout-cumule" data-cote="${c}" aria-label="Plan ${c === 'g' ? 'A' : 'B'}">${PLANS.map((p) => `<option value="${esc(p.id)}"${p.id === def.plan ? ' selected' : ''}>${esc(p.t)}</option>`).join('')}</select></label></span>
      <span class="ce-h" data-role="ajout"></span>
      <div class="seg mini" role="radiogroup" aria-label="Moment, plan ${c === 'g' ? 'A' : 'B'}"><button role="radio" data-role="reglage" data-cote="${c}" data-moment="actif" aria-checked="${def.moment === 'actif'}">actif</button><button role="radio" data-role="reglage" data-cote="${c}" data-moment="apres" aria-checked="${def.moment === 'apres'}">après</button></div>
      <div class="seg mini" role="radiogroup" aria-label="Levure, plan ${c === 'g' ? 'A' : 'B'}">${['us05', 'pomona', 'verdant'].map((l) => `<button role="radio" data-role="reglage" data-reglage="levure" data-cote="${c}" data-levure="${l}" aria-checked="${l === def.levure}">${l === 'us05' ? 'US-05' : esc(R.levures[l].nom.replace(' IPA', ''))}</button>`).join('')}</div>
      <span class="ce-f" data-role="fiche-levure"></span>
    </div>`;
const corps = `
  ${S.entete('Le duel', 'deux plans de dry hop, face à face · 16D')}
  <div class="outils">${S.lentille()}<button class="rg-b ech" data-role="reglage" aria-label="Échanger les deux plans">${ico('i-arrow-r', 14)}échanger</button></div>
  <section class="carte duel-h">
    ${cote('g', { plan: 'Citra+Idaho 7', moment: 'actif', levure: 'us05' })}
    ${cote('d', { plan: 'Citra+Idaho 7', moment: 'actif', levure: 'pomona' })}
  </section>
  <section class="carte" data-role="simulation" aria-label="Les deux profils simulés, en papillon">
    <div class="ct"><span class="sv">~ simulé</span><span class="dr gris">sur 100</span></div>
    <p class="repo" data-role="reponse"></p>
    <div class="pap" data-role="papillon"></div>
    <p class="drp" data-role="biotransformation"></p>
    <p class="src-l" data-role="confiances"></p>
  </section>
  <section class="carte" aria-label="Ce qui est mesuré">
    <div class="ct">Ce que disent les fiches des levures<span class="dr"><span class="cf cf-fournisseur">fournisseur</span></span></div>
    <div class="fl" data-role="fiches"></div>
    <p class="phr trou"><span class="cf cf-inconnu">inconnu</span> Aucune mesure ne croise variété, levure et dry hop (recherche J) : l’écart entre deux levures vient des fiches et des conventions du moteur (Pomona 50 % de géraniol converti ; Verdant 0,1 % de thiols libérés).</p>
  </section>`;

const css = `
  .outils { align-items: center; }
  .ech svg { transform: rotate(180deg); }
  .duel-h { flex-direction: row; gap: 6px; padding: 6px; }
  .cote { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 4px; padding: 4px; border-radius: 4px; }
  .c-g { background: #f3f4f7; } .c-d { background: #fff; box-shadow: inset 0 0 0 1.5px #16161a; }
  .ce { display: flex; align-items: center; gap: 4px; min-width: 0; }
  .ce-l { width: 20px; height: 20px; border-radius: 50%; background: var(--encre); color: #fff; font: 700 12px var(--sans); display: inline-flex; align-items: center; justify-content: center; flex: none; }
  .c-g .ce-l { background: #fff; color: var(--encre); box-shadow: inset 0 0 0 1.5px var(--encre); }
  .pl-s { position: relative; flex: 1; min-width: 0; min-height: 28px; display: flex; align-items: center; gap: 2px; border-radius: 4px; background: #fff; box-shadow: inset 0 0 0 1px #c9cad2; padding: 0 4px 0 6px; }
  .pl-s select { position: absolute; inset: 0; opacity: 0; width: 100%; font-size: 16px; }
  .pl-t { flex: 1; min-width: 0; font-size: 12px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .pl-s:focus-within { outline: 2px solid #1d4ed8; outline-offset: 1px; }
  .ce-h { display: flex; flex-wrap: wrap; gap: 2px 6px; align-items: center; font-size: 12px; min-height: 18px; }
  .ce-h .hn { font-size: 13px; }
  .ce-h .al { font-size: 12px; }
  .mini { width: 100%; border-radius: 15px; }
  .mini button { padding: 0 4px; font-size: 12px; min-height: 26px; border-radius: 13px; }
  .hw { display: inline-flex; align-items: center; gap: 4px; }
  .ce-f { font-size: 12px; color: var(--gris); display: flex; gap: 2px; align-items: center; flex-wrap: wrap; min-height: 16px; }
  .ce-f .pi { width: 14px; height: 14px; }
  .repo { font-size: 14px; font-weight: 600; line-height: 1.35; }
  .repo .sv { font-size: 14px; }
  .repo .pi { display: inline-block; vertical-align: -3px; }
  .pap { display: flex; flex-direction: column; gap: 6px; }
  .pr { display: grid; grid-template-columns: minmax(0, 1fr) 84px minmax(0, 1fr); align-items: center; gap: 4px; min-height: 30px; }
  .pr-c { display: flex; flex-direction: column; align-items: center; gap: 0; line-height: 1.1; }
  .pr-c .nm2 { display: inline-flex; align-items: center; gap: 3px; font-size: 12px; font-weight: 600; color: var(--t); }
  .pr-c .dl { font: 500 12px var(--mono); color: var(--encre); white-space: nowrap; }
  .pr-c .dl.eq { color: var(--gris); font-family: var(--sans); font-weight: 400; }
  .pb { position: relative; height: 18px; }
  .pb-z { position: absolute; top: 0; bottom: 0; background: var(--z); }
  .pb-s { position: absolute; top: 3px; height: 12px; }
  .pb-x { position: absolute; top: 3px; height: 12px; background: var(--acc); }
  .pb-w { position: absolute; top: 8px; height: 1.5px; background: var(--encre); }
  .pb-v { position: absolute; top: 0; font-size: 12px; line-height: 18px; }
  .g .pb-z { right: 0; border-left: 1.5px solid var(--t); } .d .pb-z { left: 0; border-right: 1.5px solid var(--t); }
  .g .pb-s, .g .pb-x, .g .pb-w { right: 0; } .d .pb-s, .d .pb-x, .d .pb-w { left: 0; }
  .pb::after { content: ''; position: absolute; top: -2px; bottom: -2px; width: 2px; background: var(--encre); }
  .g .pb::after { right: 0; } .d .pb::after { left: 0; }
  .g .pb-v { left: 0; } .d .pb-v { right: 0; }
  .pb-inc { position: absolute; top: 2px; height: 14px; padding: 0 4px; font: 600 12px var(--sans); line-height: 14px; background: repeating-linear-gradient(135deg, #fff 0 2px, #c6c9d1 2px 3.5px); box-shadow: inset 0 0 0 1px #8a909b; border-radius: 2px; }
  .g .pb-inc { right: 4px; } .d .pb-inc { left: 4px; }
  .pr.gagne-g .g .pb-s, .pr.gagne-d .d .pb-s { box-shadow: 0 0 0 1.5px var(--encre); }
  .drp { font-size: 12px; color: var(--gris); display: flex; gap: 4px; align-items: center; flex-wrap: wrap; }
  .drp .pi { display: inline-block; vertical-align: -3px; }
  .fl { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; font-size: 12px; }
  .fl-i { display: flex; flex-direction: column; gap: 2px; }
  .fl-i b { font-size: 13px; }
  .fl-i .pi { display: inline-block; vertical-align: -3px; }
  .trou { display: flex; gap: 6px; align-items: flex-start; font-size: 13px; }
`;

const js = `
const { R, H, L, J, esc, fr0, fr1, picto, ico, sim, mes, conf, texte, seul, paire, profil, usage, alpha, stock, nom, COURT, NOM, LEV, MOM } = V;
const PLANS = ${JSON.stringify(PLANS)};
const ETAT = { g: { plan: 'Citra+Idaho 7', moment: 'actif', levure: 'us05' }, d: { plan: 'Citra+Idaho 7', moment: 'actif', levure: 'pomona' } };
const lent = () => (${S.lentilleCourante});
function entree(c) {
  const e = ETAT[c], p = PLANS.find((x) => x.id === e.plan), m = MOM[e.moment];
  if (p.hs.length === 1 && e.levure === 'verdant') e.levure = 'us05';
  const x = p.hs.length === 2 ? paire({ a: p.hs[0], b: p.hs[1], moment: m, levure: e.levure }) : seul({ nom: p.hs[0], moment: m, dose: 4, jours: 3, levure: e.levure });
  const ref = p.hs.length === 2 && e.levure !== 'us05' ? paire({ a: p.hs[0], b: p.hs[1], moment: m, levure: 'us05' }) : null;
  return { p, x, s: profil(x, { ref, ordre: p.hs }) };
}
function barre(cls, x, max) {
  const W = 100, X = (v) => Math.max(0, Math.min(W, v / max * W));
  if (x.rien) return '<span class="pb ' + cls + '"><i class="pb-inc">rien</i></span>';
  const z = X(x.top), c = X(x.centre);
  const over = x.centre > x.top ? '<i class="pb-x" style="' + (cls === 'g' ? 'right' : 'left') + ':' + z.toFixed(1) + '%;width:' + Math.max(1, c - z).toFixed(1) + '%"></i>' : '';
  return '<span class="pb ' + cls + '"><i class="pb-z" data-role="zone" style="width:' + z.toFixed(1) + '%"></i><i class="pb-s" style="width:' + Math.min(c, z).toFixed(1) + '%;background:var(--c)"></i>' + over + '<i class="pb-w" style="' + (cls === 'g' ? 'right' : 'left') + ':' + X(x.bas).toFixed(1) + '%;width:' + Math.max(0.5, X(x.haut) - X(x.bas)).toFixed(1) + '%"></i></span>';
}
function redessiner() {
  const A = entree('g'), B = entree('d');
  for (const [c, E] of [['g', A], ['d', B]]) {
    const el = document.querySelector('.cote[data-cote="' + c + '"]');
    el.querySelector('[data-role="plan-t"]').textContent = E.p.hs.join(' + ') + (E.p.hs.length === 2 ? ' · 2 + 2 g/L' : ' · 4 g/L');
    el.querySelector('select').value = E.p.id;
    el.querySelector('[data-role="ajout"]').innerHTML = E.p.hs.map((n, i) => '<span class="hw" data-voie="' + (c === 'g' ? 1 : 3) + i + '">' + nom(n) + alpha(n) + '</span>').join(' ');
    el.querySelectorAll('[data-moment]').forEach((x) => x.setAttribute('aria-checked', String(x.dataset.moment === ETAT[c].moment)));
    el.querySelectorAll('[data-levure]').forEach((x) => { x.setAttribute('aria-checked', String(x.dataset.levure === ETAT[c].levure)); x.setAttribute('aria-disabled', String(E.p.hs.length === 1 && x.dataset.levure === 'verdant')); });
    const lv = L[ETAT[c].levure];
    el.querySelector('[data-role="fiche-levure"]').innerHTML = (lv.estersFam.length ? lv.estersFam.map((f) => picto(f, 14)).join('') + esc(lv.esters) : 'esters ' + esc(lv.esters)) ;
  }
  const len = lent(), fams = V.P.ordre.filter((f) => f !== 'pomeFruit' || !A.s[f].rien || !B.s[f].rien);
  const max = (f) => (len === 'style' ? V.cran(f) * 5 : 100);
  const ecarts = [];
  document.querySelector('[data-role="papillon"]').innerHTML = fams.map((f) => {
    const a = A.s[f], b = B.s[f], d = b.centre - a.centre;
    if (Math.abs(d) >= 1 && !a.rien && !b.rien) ecarts.push([f, d]);
    const dl = a.rien || b.rien ? '<span class="dl eq">inconnu</span>' : Math.abs(d) < 1 ? '<span class="dl eq">≈</span>' : '<span class="dl" data-nature="simule">' + (d > 0 ? '~+' + fr0(d) + ' B ▸' : '◂ A ~+' + fr0(-d)) + '</span>';
    return '<div class="pr' + (d >= 1 ? ' gagne-d' : d <= -1 ? ' gagne-g' : '') + '" data-famille="' + f + '" style="--c:' + J[f].base + ';--t:' + J[f].texte + ';--z:' + J[f].fond + '">' + barre('g', a, max(f)) + '<span class="pr-c"><span class="nm2">' + picto(f, 14) + COURT[f] + '</span>' + dl + '</span>' + barre('d', b, max(f)) + '</div>';
  }).join('') + '<div class="pr"><span class="pb-v2 gris" style="text-align:left;font-size:12px">' + sim('A') + ' ' + V.confiance(A.x.confiance) + '</span><span></span><span class="gris" style="text-align:right;font-size:12px">' + sim('B') + ' ' + V.confiance(B.x.confiance) + '</span></div>';
  ecarts.sort((x, y) => Math.abs(y[1]) - Math.abs(x[1]));
  const same = (k) => ETAT.g[k] === ETAT.d[k];
  const quoi = [!same('plan') ? 'l’autre plan' : '', !same('moment') ? 'le dry hop ' + ETAT.d.moment : '', !same('levure') ? L[ETAT.d.levure].nom + ' au lieu de ' + L[ETAT.g.levure].nom : ''].filter(Boolean).join(', ') || 'le même plan';
  document.querySelector('[data-role="reponse"]').innerHTML = 'B, avec ' + esc(quoi) + ' : ' + (ecarts.length ? ecarts.slice(0, 3).map(([f, d]) => picto(f, 14) + COURT[f].toLowerCase() + ' ' + sim(V.sgn(d))).join(' · ') + (ecarts.length > 3 ? ' · ' + (ecarts.length - 3) + ' autre(s)' : '') : '≈ pareil, à 1 point près') + '.';
  // La biotransformation de chaque côté, en familles et en mots.
  const bio = (c, E) => { const e = ETAT[c]; if (e.moment !== 'actif') return (c === 'g' ? 'A' : 'B') + ' : après fermentation, aucune biotransformation simulée'; if (e.levure === 'pomona') return (c === 'g' ? 'A' : 'B') + ' : ' + picto('floral', 14) + 'géraniol → citronellol' + picto('citrus', 14) + ' ' + conf('fournisseur', '« medium »'); if (e.levure === 'verdant') return (c === 'g' ? 'A' : 'B') + ' : précurseurs → thiols' + picto('tropical', 14) + ' ' + conf('estime', '0,1 %'); return (c === 'g' ? 'A' : 'B') + ' : US-05, biotransformation à 0 au centre ' + conf('inconnu', 'non documentée'); };
  document.querySelector('[data-role="biotransformation"]').innerHTML = '<span data-role="biotransformation">' + bio('g', A) + '</span> · <span>' + bio('d', B) + '</span>';
  // Les fiches des deux levures (vraies valeurs, fournisseur).
  document.querySelector('[data-role="fiches"]').innerHTML = ['g', 'd'].map((c) => { const lv = L[ETAT[c].levure]; return '<span class="fl-i"><b>' + (c === 'g' ? 'A · ' : 'B · ') + esc(lv.long) + '</b><span>esters ' + mes(esc(lv.esters), lv.sources.join(', ') + ' (fiche)', { cls: 'mot' }) + '</span><span>atténuation ' + mes(esc(lv.attenuation), lv.sources.join(', ')) + '</span><span>biotransformation : ' + mes(esc(lv.biotransformation), lv.sources.join(', '), { cls: 'mot' }) + '</span></span>'; }).join('');
}
window.redessiner = redessiner;
document.addEventListener('change', (e) => { const s = e.target.closest('select[data-cote]'); if (!s) return; ETAT[s.dataset.cote].plan = s.value; redessiner(); });
document.addEventListener('click', (e) => {
  const b = e.target.closest('[data-role="reglage"]'); if (!b || b.tagName === 'SELECT') return;
  if (b.classList.contains('ech')) { const t = ETAT.g; ETAT.g = ETAT.d; ETAT.d = t; return redessiner(); }
  if (b.getAttribute('aria-disabled') === 'true') return;
  const c = b.dataset.cote; if (!c) return;
  if (b.dataset.moment) ETAT[c].moment = b.dataset.moment; else if (b.dataset.levure) ETAT[c].levure = b.dataset.levure;
  redessiner();
});
redessiner();
`;
S.page({
  fichier: S.D21 + '/a5/etat.html',
  titre: 'Le duel',
  description: 'Lot 21 · a5 : deux plans de dry hop face à face en papillon (par défaut la même paire avec deux levures), l’écart écrit par famille ; grille et paires du moteur. Générée par a5/generer-a5.mjs (../a1/socle.mjs).',
  css, corps, js, donnees,
  legende: [S.LEG_FAMILLES, S.LEG_NATURE, ['Papillon', [
    leg.li('<i class="lg-b" style="background:#f3f4f7;box-shadow:inset 0 0 0 1px #c9cad2"></i>', 'A à gauche, B à droite'), leg.li('<span class="dl" style="font:500 12px var(--mono)">~+6 B ▸</span>', 'écart, vers le côté le plus fort'),
    leg.li('<i class="lg-b" style="background:#fdf1e3;border-top:1.5px solid #9b5d0d"></i>', 'zone du style 16D'), leg.li('<i class="lg-b" style="background:var(--acc)"></i>', 'au-delà : hors du style'),
    leg.li('<i class="lg-w"></i>', 'trait fin : plage simulée'), leg.li('<span class="cf cf-inconnu">rien</span>', 'rien de simulé : pas une absence'),
  ], 'l2'], S.LEG_HOUBLON],
});
