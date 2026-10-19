// Lot 21 · w5 · « Ce qui ne marchera pas » (la réponse d'abord, par le refus expliqué).
// Les idées du brasseur passées au crible, une par ligne, avec leur verdict en mots (« ne marchera pas »,
// « risque », « on ne sait pas », « ça tient »), la raison en une ligne avec sa vraie valeur, et « fais plutôt ».
// Un toucher ouvre le crash-test : on POUSSE l'idée (dose, moment, jours, paire, levure) et l'on voit où elle
// casse — la 16D, la saturation, le hop creep, l'inconnu —, avec le profil ~ simulé et la mesure publiée.
// Usage : node generer-w5.mjs  →  w5/etat.html
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as S from '../w1/socle-w.mjs';

const { D, ORDRE, HOP, BANDE, CRAN, JET, fr, esc, ic, pic, alpha, usage, nomH, verdict, conf, V, bandeLog, preuve, page, ecrire, MOMENT, MOTS_F, COURT, inconnu, STUB_MOT, compacter, JS_DEPLIER, profilLignes, deltaU, rgba } = S;
const ICI = path.dirname(fileURLToPath(import.meta.url));
const AV = D.AVANT;
const pt = (h, m, d, j, l = 'US-05') => D.point(h, m, d, m.startsWith('dry') ? j : null, l).profil;
const dl = (p, f) => (p[f].inconnu ? null : p[f].crans - AV[f].crans);
const etape = (lab, p, extra = {}) => ({ lab, p: compacter(p), v: verdict(p).k, ...extra });

// ---------- les idées, chacune avec son balayage (simulé) et ses vraies valeurs ----------
const RC = D.rapports('cas-citra.json');
const IDEES = [
  { id: 'i1', idee: 'Citra 4 g/L en dry hop, 3 j après', verdict: 'non', mot: 'ne marchera pas dans ta 16D',
    raison: `agrumes et tropical sortent de ta 16D (~ simulé) ; ${pic('tropical', 14)}4MMP ${V('×4 au moins', 'moteur pouvoir · cas-citra')} le seuil`,
    plutot: 'Citra 1 g/L, 2 j', fam: ['citrus', 'tropical', 'berries', 'floral'], hops: ['Citra'], pousse: 'dose',
    etapes: D.VALEURS.doses.map((d) => etape(d + ' g/L', pt('Citra', 'dryPost', d, 3))), depart: 2, plutotI: 0 },
  { id: 'i2', idee: 'Citra à 60′, pour l’arôme', verdict: 'non', mot: 'ne marchera pas',
    raison: `l’arôme part, l’amertume reste : ${V('≈ 100 IBU', 'moteur IBU · α fiches (bm-citra)')} ; ${pic('tropical', 14)}4MMP ${V('−91 % en 60′', 'H13 · Kishimoto 2008')}`,
    plutot: 'Citra à 10′ ou en dry hop', fam: ['citrus', 'tropical', 'floral'], hops: ['Citra'], pousse: 'moment',
    etapes: ['b60', 'b10', 'wp', 'dryActive', 'dryPost'].map((m) => etape(MOMENT[m].court, pt('Citra', m, 4, 3))), depart: 0, plutotI: 1 },
  { id: 'i3', idee: 'Galaxy 7 j, pour plus d’arôme', verdict: 'risque', mot: 'rien de plus, et un risque',
    raison: `après 3 j, ${V('aucun gain mesuré', 'H73 · Wolfe 2012')} ; 1 h et 96 h ${V('non distinguables', 'E10 · Titus 2021')} au panel`,
    plutot: 'Galaxy 1 à 2 j', fam: ['tropical', 'citrus', 'green'], hops: ['Galaxy'], pousse: 'jours',
    etapes: D.VALEURS.jours.map((j) => etape(j + ' j', pt('Galaxy', 'dryPost', 2, j))), depart: 4, plutotI: 1 },
  { id: 'i4', idee: 'Plus de houblon : 8 g/L', verdict: 'risque', mot: 'chaque gramme rend moins',
    raison: `saturation : linalol extrait ${V('23 % à 2 g/L, 7 % à 16 g/L', 'E04 · Lafontaine 2018')} (Cascade)`,
    plutot: 'Cascade 2 à 4 g/L', fam: ['citrus', 'herbal', 'resin'], hops: ['Cascade'], pousse: 'dose',
    etapes: D.VALEURS.doses.map((d) => etape(d + ' g/L', pt('Cascade', 'dryPost', d, 1))), depart: 3, plutotI: 1, satur: true },
  { id: 'i5', idee: 'Deux houblons ensemble, deux fois plus', verdict: 'non', mot: 'ça ne s’additionne pas',
    raison: `<span data-role="ajout" class="w5-aj">${S.hop('Citra', { usage: false })} + ${S.hop('Galaxy', { usage: false })}</span> : ~ ${Math.round(D.paire('Citra', 'Galaxy', 'dryPost').facteur.citrus * 100)} % de la somme (simulé) ; synergie : ${inconnu('aucune étude', 'inconnue')}`,
    plutot: 'garder la dose totale, choisir la forme', fam: ['citrus', 'tropical', 'stoneFruit', 'berries'], hops: ['Citra', 'Galaxy'], pousse: 'paire',
    etapes: [etape('Citra 4', pt('Citra', 'dryPost', 4, 3)), etape('Citra 2 + Galaxy 2', D.paire('Citra', 'Galaxy', 'dryPost').profil, { ajout: ['Citra', 'Galaxy'] }), etape('Galaxy 4', pt('Galaxy', 'dryPost', 4, 3)), etape('Citra 2 + Idaho 7 2', D.paire('Citra', 'Idaho 7', 'dryPost').profil, { ajout: ['Citra', 'Idaho 7'] }), etape('Citra 2 + Cascade 2', D.paire('Citra', 'Cascade', 'dryPost').profil, { ajout: ['Citra', 'Cascade'] })], depart: 1, plutotI: 0 },
  { id: 'i6', idee: 'Dry hop actif avec US-05, pour la biotransformation', verdict: 'inconnu', mot: 'on ne sait pas, et un risque',
    raison: `US-05 : biotransformation ${inconnu('non publiée', 'non publiée')} ; hop creep ${V('+0,39 % vol. en 2 j', 'H35 · Klimczak 2023')}`,
    plutot: 'Pomona en actif (géraniol → citronellol)', fam: ['citrus', 'floral', 'tropical'], hops: ['Citra', 'Idaho 7'], pousse: 'levure', bio: true,
    etapes: ['us05', 'pomona', 'verdant', 'diamond'].map((l) => ({ ...etape({ us05: 'US-05', pomona: 'Pomona', verdant: 'Verdant', diamond: 'Diamond' }[l], D.cas('K4-' + l + '-actif').apres), ajout: ['Citra', 'Idaho 7'], lev: l })), depart: 0, plutotI: 1 },
  { id: 'i7', idee: 'Diamond, pour plus de thiols', verdict: 'inconnu', mot: 'mesuré : l’inverse au goût',
    raison: `le plus de thiols mesurés, le fruité perçu le plus faible (Samia) ; le simulé ne le voit pas`,
    plutot: 'juger en dégustation, ou Verdant', fam: ['tropical', 'citrus'], hops: ['Citra', 'Idaho 7'], pousse: 'levure', bio: true,
    etapes: ['diamond', 'verdant', 'pomona', 'us05'].map((l) => ({ ...etape({ us05: 'US-05', pomona: 'Pomona', verdant: 'Verdant', diamond: 'Diamond' }[l], D.cas('K4-' + l + '-actif').apres), ajout: ['Citra', 'Idaho 7'], lev: l })), depart: 0, plutotI: 1 },
  { id: 'i8', idee: 'Le Citra cryo du stock', verdict: 'inconnu', mot: 'on ne sait pas',
    raison: `α du lot ${V('24,8 %', 'stock · lu sur l’article')}, mais son huile n’est relevée nulle part : rien de simulé`,
    plutot: 'Citra en pellets, ou mesurer ton lot', fam: [], hops: [], pousse: null, etapes: [], depart: 0 },
  { id: 'i9', idee: 'Cascade 4 g/L, 3 j après', verdict: 'ok', mot: 'ça tient dans ta 16D',
    raison: `agrumes ~ ${deltaU(dl(pt('Cascade', 'dryPost', 4, 3), 'citrus'))} sans sortir du style ; huile ${V('0,5–2,6 mL/100 g', 'fiches Cascade')}`,
    plutot: '', fam: ['citrus', 'herbal', 'resin', 'berries'], hops: ['Cascade'], pousse: 'dose',
    etapes: D.VALEURS.doses.map((d) => etape(d + ' g/L', pt('Cascade', 'dryPost', d, 3))), depart: 2, plutotI: 2 },
];
const VERD = { non: ['ne marchera pas', 'refus'], risque: ['risque', 'risque'], inconnu: ['on ne sait pas', 'aide2'], ok: ['ça tient', 'ok'] };

const E04 = [0, 2, 3.86, 8, 16].map((x) => D.mesureEtude('E04', (m) => m.dose_gL === x && /OHAI/.test(m.descripteur || '')));
const ligneIdee = (x, i) => `<article class="w5-i ${x.verdict}${i === 0 ? ' ouvert' : ''}" data-i="${x.id}">
  <button type="button" class="w5-t" data-ouvre="${x.id}" aria-expanded="${i === 0}"><span class="w5-v ${x.verdict}">${ic(VERD[x.verdict][1], 14)}${VERD[x.verdict][0]}</span><span class="w5-id">« ${esc(x.idee)} »</span>${ic('chevb', 16)}</button>
  <p class="w5-r">${x.raison}</p>
  ${x.plutot ? `<p class="w5-p">${ic('fleche', 14)}<span>fais plutôt : <b>${esc(x.plutot)}</b></span></p>` : ''}
  <div class="w5-b" data-role="simulation" ${i === 0 ? '' : 'hidden'}></div></article>`;
const corps = `
  ${S.tete('Ça ne marchera pas')}
  <p class="w5-int">Tes idées, au crible de ta 16D. Un toucher : <b>pousse l’idée</b>, vois où elle casse.</p>
  <div class="w5-cpt">${Object.entries(VERD).map(([k, [m, i]]) => `<span class="w5-v ${k}">${ic(i, 14)}${IDEES.filter((x) => x.verdict === k).length} ${m}</span>`).join('')}</div>
  <div data-role="objectif" class="w5-is">${IDEES.map(ligneIdee).join('')}</div>
  <p class="w5-pied">${conf('simule')}<span>${STUB_MOT}</span><span>· ta 16D, Nugget 60′</span>${alpha('Nugget')}</p>`;

const css = `
  .w5-int { font-size: 14px; line-height: 1.35; }
  .w5-cpt { display: flex; gap: 6px; flex-wrap: wrap; }
  .w5-v { display: inline-flex; align-items: center; gap: 3px; height: 22px; padding: 0 8px 0 5px; border-radius: 999px; font-size: 12px; font-weight: 700; white-space: nowrap; flex: none; }
  .w5-v.non { background: #16161a; color: #fff; } .w5-v.risque { background: #fff; color: var(--acc); box-shadow: inset 0 0 0 1.5px var(--acc); }
  .w5-v.inconnu { background: #fff; color: var(--gris); box-shadow: inset 0 0 0 1.5px #8a909b; } .w5-v.ok { background: #e6f2ea; color: #2f6b4f; }
  .w5-is { display: flex; flex-direction: column; gap: 10px; }
  .w5-aj { display: inline-flex; flex-wrap: wrap; gap: 4px; align-items: center; } .w5-r .pi { display: inline-block; vertical-align: -2px; }
  .w5-i { display: flex; flex-direction: column; gap: 4px; padding: 8px 12px 10px; border-radius: 8px; background: #fff; box-shadow: 0 1px 4px rgba(0,0,0,.13); }
  .w5-i.ouvert { box-shadow: inset 0 0 0 2px var(--encre); }
  .w5-t { display: grid; grid-template-columns: auto 1fr 16px; align-items: center; gap: 8px; text-align: left; min-height: 30px; }
  .w5-id { font-size: 14px; font-weight: 700; }
  .w5-i.ouvert .w5-t > .ic { transform: rotate(180deg); }
  .w5-r { font-size: 13px; line-height: 1.4; color: var(--encre); }
  .w5-r .w-v { font-family: var(--sans); font-size: 13px; font-weight: 700; letter-spacing: 0; white-space: normal; }
  .w5-p { display: flex; align-items: center; gap: 4px; font-size: 13px; color: #2f6b4f; }
  .w5-b { display: flex; flex-direction: column; gap: 8px; border-top: 1px solid var(--trait); padding-top: 8px; margin-top: 2px; }
  .w5-h3 { font-size: 14px; display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
  .w5-h3 small { font-size: 12px; font-weight: 400; color: var(--gris); }
  .w5-crash { display: flex; gap: 4px; padding-top: 14px; }
  .w5-c { flex: 1; min-width: 0; display: flex; flex-direction: column; align-items: center; gap: 1px; padding: 4px 2px; border-radius: 8px; background: #f6f6f9; position: relative; }
  .w5-c[aria-checked="true"] { background: #fff; box-shadow: inset 0 0 0 2px var(--encre); }
  .w5-c.hors { background: #fdf0ea; } .w5-c.hors[aria-checked="true"] { box-shadow: inset 0 0 0 2px var(--acc); }
  .w5-cz { height: 30px; width: 100%; display: flex; align-items: flex-end; justify-content: center; gap: 2px; }
  .w5-cb { width: 8px; border-radius: 2px 2px 0 0; transition: height .25s; }
  .w5-cl { font-size: 12px; text-align: center; line-height: 1.15; } .w5-cv { font-size: 12px; font-weight: 700; }
  .w5-c.hors .w5-cv { color: var(--acc); } .w5-c.dans .w5-cv { color: #2f6b4f; } .w5-c.bord .w5-cv { color: var(--gris); }
  .w5-mur { position: absolute; top: -4px; bottom: -4px; left: -4px; width: 0; border-left: 2.5px solid var(--acc); }
  .w5-mur span { position: absolute; top: -16px; left: -18px; font-size: 12px; font-weight: 700; color: var(--acc); background: #fff; white-space: nowrap; }
  .w5-sat { position: relative; height: 110px; margin: 6px 0 18px 24px; border-left: 1px solid var(--trait2); border-bottom: 1px solid var(--trait2); }
  .w5-sat svg { position: absolute; inset: 0; overflow: visible; }
  .w5-yl { position: absolute; left: -24px; font: 500 12px var(--mono); color: var(--gris); }
  .w5-xl { position: absolute; bottom: -16px; transform: translateX(-50%); font: 500 12px var(--mono); color: var(--gris); }
  .w5-lg { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; font-size: 12px; color: var(--gris); }
  .w5-lg i { width: 10px; height: 10px; display: inline-block; border-radius: 50%; }
  .w5-bio { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; font-size: 14px; }
  .w5-cryo { display: flex; flex-direction: column; gap: 6px; font-size: 14px; }
  .w5-cryo .w-hop { gap: 6px; }
  .w5-pied { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; font-size: 12px; color: var(--gris); }
`;

const js = `${JS_DEPLIER}
const IDEES = ${JSON.stringify(IDEES.map((x) => ({ id: x.id, fam: x.fam, hops: x.hops, pousse: x.pousse, etapes: x.etapes, depart: x.depart, plutotI: x.plutotI, satur: !!x.satur, bio: !!x.bio, verdict: x.verdict })))};
const E04 = ${JSON.stringify(E04.map((m) => ({ d: m.dose_gL, v: m.valeur, src: m.etude + ' · ' + m.ref })))};
const AV = SIM.AV;
const HOPS = ${JSON.stringify(Object.fromEntries(['Citra', 'Cascade', 'Galaxy', 'Idaho 7'].map((h) => [h, S.nomH(h) + S.alpha(h) + S.usage(h)])))};
const CRYO = ${JSON.stringify(`<div class="w5-cryo"><span class="w-hop">${nomH('Citra')}<span class="al lot" data-role="alpha" data-source="lot" data-nature="mesure" aria-label="α du lot en stock : Citra cryo 24,8 %, lu sur l’article">24,8%<span class="pel">cryo</span></span><span class="al fi" data-role="alpha" data-source="fiches" data-nature="mesure">${ic('livre', 12)}10–15%<span class="pel">pellets</span></span></span><span>${ic('stock', 14)}65 g en stock ; huile, linalol, 4MMP du cryo : ${inconnu('composition du cryo non relevée (H, dépôt)', 'non relevés')}</span><span>${inconnu('rien de simulé', 'profil simulé : rien')} pas de zéro : on ne sait pas.</span></div>`)};
const ST = Object.fromEntries(IDEES.map((x) => [x.id, x.depart]));
const $ = (s) => document.querySelector(s);
const MOTS_V = { hors: 'sort', bord: 'au bord', dans: 'dans' };
function rendre(id) {
  const x = IDEES.find((y) => y.id === id), b = document.querySelector('[data-i="' + id + '"] .w5-b'); if (!b || b.hidden) return;
  if (!x.pousse) { b.innerHTML = CRYO; return; }
  const k = ST[id], E = x.etapes.map((e) => ({ ...e, P: deplier(e.p) })), cur = E[k];
  const f0 = x.fam[0];
  // le crash-test : chaque pas, son effet sur la famille, et où il casse
  let mur = -1; for (let i = 1; i < E.length; i++) if (E[i].v === 'hors' && E[i - 1].v !== 'hors' && x.pousse !== 'paire' && x.pousse !== 'levure') { mur = i; break; }
  let h = '<h3 class="w5-h3">' + ICO('reglages', 14) + 'Pousse l’idée <small>' + { dose: 'la dose', moment: 'le moment', jours: 'les jours', paire: 'la forme, à dose totale 4 g/L', levure: 'la levure, Citra puis Idaho 7 en actif' }[x.pousse] + ' · ~ crans de ' + MOTS_F[f0] + '</small></h3>';
  h += '<div class="w5-crash">' + E.map((e, i) => { const d = e.P[f0].inconnu ? null : e.P[f0].crans - AV[f0].crans, hh = d == null ? 0 : Math.max(2, Math.min(6, d) * 5);
    return '<button type="button" class="w5-c ' + e.v + '" data-role="reglage" data-reglage="' + x.pousse + '" data-v="' + i + '" aria-checked="' + (i === k) + '">' + (i === mur ? '<i class="w5-mur"><span>ta 16D</span></i>' : '') + '<span class="w5-cz"><i class="w5-cb" data-nature="simule" style="height:' + hh + 'px;background:' + SIM.CB[f0] + '"></i></span><span class="w5-cl">' + e.lab + '</span><span class="w5-cv" data-nature="simule">' + (d == null ? '?' : '~ ' + (d >= 0 ? '+' : '') + String(Math.round(d * 10) / 10).replace('.', ',')) + '</span><span class="w5-cv">' + MOTS_V[e.v] + '</span></button>'; }).join('') + '</div>';
  // les houblons du pas choisi, avec leur α
  const hs = cur.ajout || x.hops;
  h += '<p class="w5-lg"' + (hs.length > 1 ? ' data-role="ajout"' : '') + '>' + hs.map((y) => HOPS[y]).join('<span>+</span>') + '</p>';
  h += '<div class="w5-sim">' + document.querySelector('template[data-prof="' + id + '"]').innerHTML + '</div>';
  if (x.bio) h += '<div class="w5-bio" data-role="biotransformation">' + ICO('bio', 16) + (cur.lev === 'pomona' ? '<b>Pomona</b>' + PIC('floral', 16) + ICO('fleche', 12) + PIC('citrus', 16) + '<span>géraniol → citronellol, ~ 50 % au centre (convention)</span>' : cur.lev === 'verdant' ? '<b>Verdant</b>' + PIC('tropical', 16) + '<span>thiols ~ 0,1 % libérés (<span class="w-v mono" data-nature="mesure" data-source="H42">0,01–0,35 %</span>)</span>' : cur.lev === 'diamond' ? '<b>Diamond</b>' + PIC('tropical', 16) + '<span>simulé comme Verdant ; mesuré : plus de thiols, fruité perçu le plus faible</span>' : '<span class="w-inc"><i class="w-hach"></i>US-05 : non publiée, centre 0 (pas une preuve d’absence)</span>') + '</div>';
  if (x.satur) {
    const W = 290, H = 110, X = (d) => d / 16 * W, Y = (v) => H - v / 15 * H;
    h += '<h3 class="w5-h3">' + ICO('labo', 14) + 'Mesuré : Cascade, 24 h, panel <small>intensité houblonnée globale, sur 15 (E04) : chaque gramme rend moins</small></h3>'
      + '<div class="w5-sat" style="width:' + W + 'px"><svg viewBox="0 0 ' + W + ' ' + H + '" width="' + W + '" height="' + H + '" aria-hidden="true"><polyline fill="none" stroke="#16161a" stroke-width="2" points="' + E04.map((m) => X(m.d) + ',' + Y(m.v)).join(' ') + '"/>' + E04.map((m) => '<circle cx="' + X(m.d) + '" cy="' + Y(m.v) + '" r="4" fill="#16161a"/>').join('')
      + '</svg>'
      + [0, 5, 10, 15].map((v) => '<span class="w5-yl" style="top:' + (Y(v) - 7) + 'px">' + v + '</span>').join('') + [0, 2, 4, 8, 16].map((d) => '<span class="w5-xl" style="left:' + X(d) + 'px">' + d + '</span>').join('') + '</div>'
      + '<p class="w5-lg"><i style="background:#16161a"></i><span data-nature="mesure" data-source="E04 · Lafontaine 2018">mesuré : 3 · 6,3 · 8,1 · 10,4 · 12,3 sur 15 à 0 · 2 · 3,86 · 8 · 16 g/L (g/L en abscisse) ; le simulé est dans les pas au-dessus</span></p>'
      + '<p class="w-trou"><span class="w-cf verifier">' + ICO('risque', 12) + 'à vérifier</span><span>H et J lisent les lignes agrumes et herbacé du même tableau à l’inverse : qui plafonne, agrumes ou herbacé ? à trancher en relisant l’article.</span></p>';
  }
  if (x.plutotI != null && x.plutotI !== k) h += '<button type="button" class="w-pq" data-role="reglage" data-reglage="' + x.pousse + '" data-v="' + x.plutotI + '">' + ICO('fleche', 14) + '<span>Essaie : ' + E[x.plutotI].lab + '</span></button>';
  b.innerHTML = h;
  majProfil(b.querySelector('.w-prof'), cur.P, AV);
}
document.addEventListener('click', (e) => {
  const o = e.target.closest('[data-ouvre]');
  if (o) { const id = o.dataset.ouvre, a = o.closest('.w5-i'), ouv = a.classList.contains('ouvert');
    document.querySelectorAll('.w5-i').forEach((x) => { x.classList.remove('ouvert'); x.querySelector('.w5-b').hidden = true; x.querySelector('.w5-t').setAttribute('aria-expanded', 'false'); });
    if (!ouv) { a.classList.add('ouvert'); a.querySelector('.w5-b').hidden = false; o.setAttribute('aria-expanded', 'true'); rendre(id); a.scrollIntoView({ block: 'nearest' }); } return; }
  const b = e.target.closest('button[data-role="reglage"]'); if (!b) return;
  const id = b.closest('.w5-i').dataset.i; ST[id] = Number(b.dataset.v); rendre(id);
});
const q = new URLSearchParams(location.search);
if (q.get('i')) { document.querySelector('.w5-i.ouvert [data-ouvre]').click(); document.querySelector('[data-ouvre="' + q.get('i') + '"]').click(); }
if (q.get('pas')) { const id = q.get('i') || 'i1'; ST[id] = Number(q.get('pas')); rendre(id); }
rendre('i1');
`;

// Un profil en lignes par idée (les familles qui comptent), rempli par la page.
const tpl = IDEES.filter((x) => x.pousse).map((x) => `<template data-prof="${x.id}">${profilLignes(D.cas('K2-citra').apres, AV, { familles: x.fam, cls: 'w5-p' + x.id })}</template>`).join('');
ecrire(path.join(ICI, 'etat.html'), page({
  titre: 'w5 · Ça ne marchera pas',
  commentaire: 'Lot 21 · w5 : les idées du brasseur au crible, verdict en mots, raison mesurée, « fais plutôt », et un crash-test qui pousse l’idée jusqu’où elle casse ; profil ~ simulé (' + STUB_MOT + ').',
  corps: corps + tpl, css, js, demande: [{ f: 'citrus', s: 1 }],
  sim: { CB: Object.fromEntries(ORDRE.map((f) => [f, JET[f].base])) },
}));
