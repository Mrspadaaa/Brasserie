// Lot 22 · r6k · « Le panel d'abord » : Comparer, « Lequel pour ma stout : Cascade, Idaho 7 ou Galaxy ? ».
// Le parti : d'abord ce que des panels ont goûté en bière, mesuré, houblon par houblon (OSU pour Cascade,
// une case cochée pour Idaho 7, rien de relevé pour Galaxy) ; le trou se voit. Ensuite le simulé à dose
// égale (4 g/L, après fermentation, 3 j, US-05), marqué « ~ », pour combler les trous : barres de l5b
// à la manière de w2 (une ligne par famille, les trois houblons dessus), puis trois petits radars r3 avec
// leurs intervalles. Chimie et vraies valeurs sous un toucher. Le gagnant ouvre Dryhopper.
// Choix portés (VOIE) : Radar r3 ; Base dose égale ; Porte non ; Descripteurs A.
// Données : ../donnees/comparer-stout.json seulement (vérifié par r6e) ; métadonnées des sources et liens
// composé → famille : prototypes/houblons-v4/data/composes-houblon.json (la source déclarée du JSON).
// Langage : socle de v1 (lot 21) — pictos au trait, habillage l8g, fiche g1 à l'appui long, légende « ? ».
// Usage : node generer.mjs  →  r6k/etat.html
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { HOPS, CH, SRC, COURT, JET, ORDRE, fr, plg, esc, M, conf, ic, pic, hn, alpha, usage, stock,
  barre, lentille, legende, li, LEG_FAMILLES, LEG_CONF, LEG_HOUBLON, page, ecrire } from '../../fils21-choisir/v1/socle.mjs';

const ici = path.dirname(fileURLToPath(import.meta.url));
const D = JSON.parse(fs.readFileSync(path.join(ici, '../donnees/comparer-stout.json'), 'utf8'));
const TROIS = ['Cascade', 'Idaho 7', 'Galaxy'];
const HD = Object.fromEntries(TROIS.map((n) => [n, D.houblons.find((h) => h.nom === n)]));
const INI = { Cascade: 'C', 'Idaho 7': 'I', Galaxy: 'G' };
const COUL = Object.fromEntries(TROIS.map((n) => [n, HOPS[n].couleur]));
// L'α affiché vient du JSON du lot (alpha.retenu) ; on vérifie qu'il est celui du socle (fiche et lot).
for (const n of TROIS) if (HOPS[n].alpha.lot !== HD[n].alpha.retenu.value) throw new Error('α de ' + n + ' : socle ' + HOPS[n].alpha.lot + ' ≠ JSON ' + HD[n].alpha.retenu.value);

// ---------- la base : dose égale ----------
const EG = D.egalites.doseEgale; // 4 g/L, dryPost, 3 j, US-05
const cas = (n) => HD[n].grille.find((g) => g.moment === EG.moment && g.dose_gL === EG.dose_gL && g.jours === EG.jours && g.levure === EG.levure);
const ZONE = D.style.zone;
const top = (f) => ZONE[f].bande[1];
const cran = (f) => (ZONE[f].bande[1] - ZONE[f].bande[0]) / 3;
const AV = Object.fromEntries(ORDRE.map((f) => [f, D.biere.avant[f]]));
// Un profil après ajout : bas, centre, haut ; inconnu quand le moteur n'a ni largeur ni effet (jamais 0).
const SIM = Object.fromEntries(TROIS.map((n) => {
  const g = cas(n);
  return [n, Object.fromEntries(ORDRE.map((f) => {
    const a = g.apres[f];
    const inconnu = a[4] === 'inconnu' && g.delta[f] === 0;
    return [f, { bas: a[0], c: a[1], haut: a[2], crans: a[3], d: g.delta[f], dc: g.delta[f] / cran(f), inconnu }];
  }))];
}));
const CONFIANCE = Object.fromEntries(TROIS.map((n) => [n, cas(n).confiance]));
const f1 = (x) => (Math.abs(x) < 0.05 ? '0' : (x > 0 ? '+' : '−') + fr(Math.abs(x), 1));

// ---------- goûté : les panels, mesurés ----------
const OSU = D.panelOSU; // Cascade, E04 / H22 : doses 0, 2, 3,86, 8, 16 g/L ; échelle 0–15
const iBase = OSU.doses.indexOf(3.86);
const E03 = HD['Idaho 7'].panels.find((p) => p.id === 'E03');
const E09 = HD.Galaxy.panels.find((p) => p.id === 'E09');
const E04 = HD.Cascade.panels.find((p) => p.id === 'E04');
const coches = E03.mesures.filter((m) => m.unite === 'présence' && /Idaho/.test(m.variete) && m.famille);
const motsCoches = { herbal: 'citronnelle', tropical: 'tropical' };
const annee = (ref) => (ref.match(/\b(19|20)\d{2}\b/) || [''])[0];
const auteur = (ref) => ref.split(/[ ,]/)[0];
const refCourte = (p) => auteur(p.ref) + ' ' + annee(p.ref);

// La courbe du panel OSU (sans molette) : dose en racine carrée (0 à 16 g/L), notes de 0 à 15.
function courbeOSU() {
  const W = 210, H = 78, g = 6, d = 26, h = 8, b = 16;
  const x = (dose) => g + (Math.sqrt(dose) / 4) * (W - g - d);
  const y = (v) => h + (1 - v / 15) * (H - h - b);
  const ligne = (vals, f) => `<polyline points="${OSU.doses.map((ds, i) => x(ds).toFixed(1) + ',' + y(vals[i]).toFixed(1)).join(' ')}" fill="none" stroke="${JET[f].texte}" stroke-width="2" stroke-linejoin="round"/>` + OSU.doses.map((ds, i) => `<circle cx="${x(ds).toFixed(1)}" cy="${y(vals[i]).toFixed(1)}" r="${i === iBase ? 3.5 : 2.2}" fill="${i === iBase ? JET[f].texte : '#fff'}" stroke="${JET[f].texte}" stroke-width="1.5"/>`).join('');
  const xb = x(OSU.doses[iBase]);
  const zone = `<rect x="${x(OSU.zone[0]).toFixed(1)}" y="${h - 4}" width="${(x(OSU.zone[1]) - x(OSU.zone[0])).toFixed(1)}" height="${H - h - b + 4}" fill="#f1f1f5"/>`;
  const ticks = [0, 4, 16].map((t) => `<text x="${x(t).toFixed(1)}" y="${H - 2}" text-anchor="middle" font-size="12" fill="#55555f">${t}</text>`).join('');
  const fin = (vals, f) => `<svg x="${W - d + 6}" y="${(y(vals[4]) - 8).toFixed(1)}" width="16" height="16" data-famille="${f}" role="img" aria-label="${COURT[f]}"><use href="#p-${f}"/></svg>`;
  return `<svg class="osu-c" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="Panel OSU, Cascade : agrumes et herbacé selon la dose, de 0 à 16 g/L, notes sur 15">${zone}<line x1="${g}" y1="${H - b}" x2="${W - d}" y2="${H - b}" stroke="#c4c4cc"/><line x1="${xb.toFixed(1)}" y1="${h - 4}" x2="${xb.toFixed(1)}" y2="${H - b}" stroke="#16161a" stroke-width="1.5"/>${ligne(OSU.herbaceThe, 'herbal')}${ligne(OSU.agrumes, 'citrus')}${ticks}${fin(OSU.herbaceThe, 'herbal')}${fin(OSU.agrumes, 'citrus')}</svg>`;
}
const srcOSU = [...OSU.sources, 'E04'].join(' ');
const panelCascade = `
      <div class="pn-l" data-h="Cascade" data-acquis="osu" data-nature="mesure" data-source="${esc(srcOSU)}" aria-label="Panel OSU, Cascade">
        <div class="pn-n"><i class="hpt plein" style="--hc:${COUL.Cascade}" aria-hidden="true"></i>${hn('Cascade')}<span class="pn-s mono">OSU · ${esc(refCourte(E04))}</span></div>
        <div class="pn-c">${courbeOSU()}
          <div class="pn-v">
            <span class="pn-x">${pic('citrus', 16)}${M(fr(OSU.agrumes[iBase]), srcOSU)}</span>
            <span class="pn-x">${pic('herbal', 16)}${M(fr(OSU.herbaceThe[iBase]), srcOSU)}</span>
            <span class="pn-u mono">/15 à ${fr(OSU.doses[iBase], 2)} g/L</span>
          </div>
        </div>
      </div>`;
const panelIdaho = `
      <div class="pn-l" data-h="Idaho 7" data-nature="mesure" data-source="E03">
        <div class="pn-n"><i class="hpt plein" style="--hc:${COUL['Idaho 7']}" aria-hidden="true"></i>${hn('Idaho 7')}<span class="pn-s mono">${esc(refCourte(E03))}</span></div>
        <div class="pn-k">${coches.map((m) => `<span class="ck" data-nature="mesure" data-source="E03">${ic('check', 14)}${pic(m.famille, 16)}<span>${motsCoches[m.famille] || COURT[m.famille]}</span></span>`).join('')}<span class="ck-i" data-inconnu="intensité non publiée (CATA : présence seulement)">force ?</span></div>
      </div>`;
const panelGalaxy = `
      <div class="pn-l" data-h="Galaxy" data-source="E09">
        <div class="pn-n"><i class="hpt plein" style="--hc:${COUL.Galaxy}" aria-hidden="true"></i>${hn('Galaxy')}<span class="pn-s mono">${esc(refCourte(E09))}</span></div>
        <div class="pn-k"><span class="pn-trou" data-inconnu="goûté à 4 g/L, 3 j, mais positions publiées seulement en figure, non relevées">goûté, non relevé ?</span></div>
      </div>`;

// ---------- les trous : le simulé à dose égale, en barres de l5b, à la manière de w2 ----------
// Une ligne par famille ; les trois houblons dessus, chacun sa barre (centre) et son trait (bas–haut).
// Au style : la zone de la 16D = 3 crans = la moitié de la piste ; l'orangé au-delà. Absolu : 0–120.
const MAXC = 6, MAXA = 120;
const pc = (v, f) => Math.min(100, (v / cran(f) / MAXC) * 100);
const pa = (v) => Math.min(100, (v / MAXA) * 100);
const leader = (f) => { const k = TROIS.filter((n) => !SIM[n][f].inconnu).sort((a, b) => SIM[b][f].d - SIM[a][f].d); return k[0] || null; };
function piste(f) {
  const lanes = TROIS.map((n) => {
    const s = SIM[n][f];
    if (s.inconnu) return `<i class="ln inc-l" data-h="${esc(n)}" data-inconnu="pas de mot ni d'effet connu pour ${esc(n)} : inconnu, pas zéro" aria-label="${esc(n)} : inconnu"></i>`;
    const zs = 50; // la zone : 3 crans sur 6
    const cS = pc(s.c, f), cA = pa(s.c);
    return `<i class="ln" data-h="${esc(n)}" data-nature="simule" style="--hc:${COUL[n]};--c:${cS.toFixed(1)}%;--ca:${cA.toFixed(1)}%;--b:${pc(s.bas, f).toFixed(1)}%;--ba:${pa(s.bas).toFixed(1)}%;--t:${pc(s.haut, f).toFixed(1)}%;--ta:${pa(s.haut).toFixed(1)}%;--x:${Math.max(0, cS - zs).toFixed(1)}%" aria-label="${esc(n)} : ~${f1(s.dc)} cran(s)"><b class="ln-b"></b><b class="ln-o"></b><b class="ln-r${s.haut / cran(f) > MAXC ? ' deb' : ''}${s.haut > MAXA ? ' deba' : ''}"></b></i>`;
  }).join('');
  const av = AV[f];
  const L = leader(f);
  const val = L ? `<b style="color:${COUL[L]}">${INI[L]}</b><span class="vs" data-nature="simule">~${f1(SIM[L][f].dc)}</span>` : '<span class="inc">?</span>';
  const vals = TROIS.map((n) => `<span class="pv" data-pour="${esc(n)}" hidden>${SIM[n][f].inconnu ? '<span class="inc">?</span>' : `<span class="vs${SIM[n][f].crans >= 4 ? ' hst' : ''}" data-nature="simule">~${f1(SIM[n][f].dc)}</span>`}</span>`).join('');
  const attendu = ZONE[f].statut === 'attendue';
  return `<div class="tr${attendu ? ' att' : ''}" data-f="${f}" style="--zf:${JET[f].fond};--zt:${JET[f].texte}">
      <span class="tr-n">${pic(f, 16)}<span>${COURT[f]}</span>${GOUTE[f] ? `<span class="tr-g" role="img" aria-label="goûté par un panel : ${esc(GOUTE[f].join(', '))}">${ic('panel', 12)}</span>` : ''}</span>
      <span class="tr-p"><i class="tr-z" data-role="zone"></i><i class="tr-av" style="--av:${pc(av.centre, f).toFixed(1)}%;--ava:${pa(av.centre).toFixed(1)}%" aria-hidden="true"></i>${lanes}</span>
      <span class="tr-v"><span class="pv-l">${val}</span>${vals}</span>
    </div>`;
}
// Les familles qu'un panel a goûtées (Cascade : OSU, agrumes et herbacé ; Idaho 7 : cochées) : le simulé n'y est qu'un complément.
const GOUTE = {};
for (const f of ['citrus', 'herbal']) (GOUTE[f] = GOUTE[f] || []).push('Cascade');
for (const m of coches) (GOUTE[m.famille] = GOUTE[m.famille] || []).push('Idaho 7');
const familles16D = ORDRE.filter((f) => ZONE[f].statut === 'attendue');
const pistes = `
  <section class="carte trous" aria-label="Les trous, simulés à dose égale" data-nature="simule">
    <h2>${ic('simul', 16)}Les trous ${conf('simule')}<small>crans de ta 16D</small></h2>
    <div class="tr-cle" aria-hidden="true">${TROIS.map((n) => `<span><i class="hpt plein" style="--hc:${COUL[n]}"></i>${INI[n]}</span>`).join('')}</div>
    ${ORDRE.map(piste).join('')}
    <p class="src-l">~ ${esc(D.simule.split(':')[0])} : moteur profil-simulé, conventions à valider. Hachuré : inconnu, pas zéro. Résineux : ${esc(D.biere.degustation.familles[0].percu)} à ta dégustation du ${D.biere.degustation.date.split('-').reverse().slice(0, 2).join('.')}.</p>
  </section>`;

// ---------- pour ta stout : la réponse, calculée (aucune phrase écrite à la main sur les valeurs) ----------
const DEG = D.biere.degustation; // « ma stout est trop résineuses, je la veux plus floral » (18.10)
const voulu = 'floral';
const trois = (f) => TROIS.map((n) => ({ n, s: SIM[n][f] })).sort((a, b) => (a.s.inconnu) - (b.s.inconnu) || b.s.dc - a.s.dc)
  .map(({ n, s }) => `<span class="vd-h" data-h="${esc(n)}"><b style="color:${COUL[n]}">${INI[n]}</b>${s.inconnu ? '<span class="inc">?</span>' : `<span class="vs" data-nature="simule">~${f1(s.dc)}</span>`}</span>`).join('');
const horsStyle = TROIS.flatMap((n) => ORDRE.filter((f) => f !== 'resin' && !SIM[n][f].inconnu && SIM[n][f].crans >= 4).map((f) => ({ n, f })));
const resineMin = Math.min(...TROIS.map((n) => SIM[n].resin.dc));
const candidat = leader(voulu);
const vLigne = (f, quoi) => `<div class="vd-l"><span class="vd-f">${pic(f, 16)}<span>${COURT[f]}</span>${quoi ? `<small>${quoi}</small>` : ''}</span><span class="vd-v">${trois(f)}</span></div>`;
const verdict = `
  <section class="carte vd" aria-label="Pour ta stout">
    <h2>${ic('bulle', 16)}Pour ta stout<small>« ${esc(DEG.citation)} » (${DEG.date.split('-').reverse().slice(0, 2).join('.')})</small></h2>
    ${vLigne(voulu, 'ta demande')}
    ${familles16D.filter((f) => f !== voulu).map((f) => vLigne(f, 'attendu en 16D')).join('')}
    <div class="vd-l vd-x"><span class="vd-f">${pic('resin', 16)}<span>${COURT.resin}</span></span><span class="vd-t">${resineMin > 0.5 ? `tous <span class="vs hst" data-nature="simule">~+${fr(Math.floor(resineMin * 10) / 10, 1)}</span> au moins : aucun ne le baisse` : 'un houblon le laisse stable'}</span></div>
    ${horsStyle.map(({ n, f }) => `<div class="vd-l vd-x" data-h="${esc(n)}"><span class="vd-f">${pic(f, 16)}<span>${COURT[f]}</span></span><span class="vd-t">${hn(n)} <span class="vs hst" data-nature="simule">~${f1(SIM[n][f].dc)}</span> : hors de ta 16D</span></div>`).join('')}
    <p class="vd-r">Le plus ${COURT[voulu].toLowerCase()} à dose égale : ${hn(candidat)} <span class="gris">(simulé, confiance ${CONFIANCE[candidat]}, pas goûté en ${COURT[voulu].toLowerCase()})</span>.</p>
  </section>`;

// ---------- radar r3 : un petit radar par houblon, deux par rangée, avec l'intervalle ----------
const AXES = ORDRE;
function radar(nom, serie, couleur, opts = {}) {
  const W = 168, R = 58, cx = W / 2, cy = W / 2;
  const ang = (i) => -Math.PI / 2 + (i * 2 * Math.PI) / AXES.length;
  const pt = (i, r) => [cx + r * Math.cos(ang(i)), cy + r * Math.sin(ang(i))];
  const rS = (v, f) => (Math.min(v / top(f), 1.4) / 1.4) * R;
  const rA = (v) => (Math.min(v / 100, 1.2) / 1.2) * R;
  const poly = (rs) => rs.map((r, i) => pt(i, r).map((x) => x.toFixed(1)).join(',')).join(' ');
  const R0 = R / 1.4;
  const grille = [R0, R].map((r) => `<polygon points="${poly(AXES.map(() => r))}" fill="none" stroke="#dcdce3" stroke-width="1"/>`).join('') + AXES.map((f, i) => { const [x, y] = pt(i, R); return `<line x1="${cx}" y1="${cy}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" stroke="#ececf1"/>`; }).join('');
  const zone = `<g data-serie="zone" class="m-sty"><polygon data-role="zone" points="${poly(AXES.map(() => R0))}" fill="#f3f1f8" stroke="#8a8a96" stroke-width="1"/></g>`;
  const inc = AXES.map((f, i) => (serie[f].inconnu ? (() => { const a = pt(i - 0.5, R), b = pt(i + 0.5, R); return `<path d="M${cx},${cy} L${a[0].toFixed(1)},${a[1].toFixed(1)} A${R},${R} 0 0 1 ${b[0].toFixed(1)},${b[1].toFixed(1)} Z" fill="url(#hach)"/>`; })() : '')).join('');
  const anneau = (rf) => { const o = AXES.map((f) => (serie[f].inconnu ? 0 : rf(serie[f].haut, f))), n = AXES.map((f) => (serie[f].inconnu ? 0 : rf(serie[f].bas, f))); return `<path d="M${poly(o).split(' ').join(' L')} Z M${poly(n).split(' ').join(' L')} Z" fill-rule="evenodd" fill="${couleur}" fill-opacity=".10" stroke="none" data-role="incertitude"/>`; };
  const centres = AXES.map((f) => serie[f].c);
  // Le trait du centre s'interrompt sur un axe inconnu (jamais ramené à zéro) ; la surface ne relie que les
  // axes connus. Au style, une valeur au-delà de l'échelle (1,8 bande) est rognée et marquée d'un point orangé.
  const ligne = (rf, cls, maxR) => {
    const k = AXES.map((f, i) => (serie[f].inconnu ? null : { i, r: rf(serie[f].c, f) }));
    let d = '', ouvert = false;
    for (let j = 0; j <= AXES.length; j++) { const q = k[j % AXES.length]; if (!q) { ouvert = false; continue; } const [x, y] = pt(q.i, q.r); d += (ouvert ? 'L' : 'M') + x.toFixed(1) + ',' + y.toFixed(1) + ' '; ouvert = true; }
    const surf = k.filter(Boolean).map((q) => pt(q.i, q.r).map((x) => x.toFixed(1)).join(',')).join(' ');
    const hors = maxR ? k.filter((q) => q && q.r >= maxR - 0.01).map((q) => { const [x, y] = pt(q.i, q.r); return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="3.5" fill="#c2410c"/>`; }).join('') : '';
    return `<g class="${cls}" data-serie="${esc(nom)}" data-valeurs="${centres.map((v) => +v.toFixed(2)).join(',')}" data-nature="${opts.nature || 'simule'}"><polygon points="${surf}" fill="${couleur}" fill-opacity=".14" stroke="none"/><path d="${d.trim()}" fill="none" stroke="${couleur}" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round"/>${hors}</g>`;
  };
  const avant = opts.avant ? `<polygon data-noyau points="${poly(AXES.map((f) => rS(AV[f].centre, f)))}" class="m-sty" fill="none" stroke="#16161a" stroke-width="1"/><polygon data-noyau points="${poly(AXES.map((f) => rA(AV[f].centre)))}" class="m-abs" fill="none" stroke="#16161a" stroke-width="1"/>` : '';
  const pics = AXES.map((f, i) => { const [x, y] = pt(i, R + 11); return `<svg x="${(x - 7).toFixed(1)}" y="${(y - 7).toFixed(1)}" width="14" height="14" data-famille="${f}" role="img" aria-label="${COURT[f]}${serie[f].inconnu ? ' : inconnu' : ''}"><use href="#p-${f}"/></svg>`; }).join('');
  return `<svg class="rad" width="${W}" height="${W}" viewBox="0 0 ${W} ${W}" data-radar data-objet="comparer" data-axes="${AXES.join(',')}" role="img" aria-label="${esc(nom)} : silhouette ${opts.nature === 'mesure' ? '' : 'simulée '}sur les 12 familles">${grille}${zone}<g class="m-sty">${anneau(rS)}</g><g class="m-abs">${anneau(rA)}</g>${inc}${ligne(rS, 'm-sty', R)}${ligne(rA, 'm-abs', R)}${avant}${pics}</svg>`;
}
const SAV = Object.fromEntries(ORDRE.map((f) => { const a = AV[f]; return [f, { bas: a.bas, c: a.centre, haut: a.haut, inconnu: !!a.inconnu }]; }));
const radars = `
  <section class="carte" aria-label="Silhouettes à dose égale" data-acquis="radar">
    <h2>${ic('radar', 16)}Silhouettes ${conf('simule')}</h2>
    <div class="rads">
      ${TROIS.map((n) => `<figure class="rf" data-h="${esc(n)}">${radar(n, SIM[n], COUL[n])}<figcaption><i class="hpt plein" style="--hc:${COUL[n]}" aria-hidden="true"></i>${hn(n)}<span class="gris">${CONFIANCE[n] === 'bonne' ? '' : 'confiance ' + CONFIANCE[n]}</span></figcaption></figure>`).join('')}
      <figure class="rf"><span class="rf-av">${radar('ma stout avant', SAV, '#55555f', { nature: 'simule' })}</span><figcaption><i class="hpt contour" style="--hc:#16161a" aria-hidden="true"></i><b>ta stout, avant</b></figcaption></figure>
    </div>
    <svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs><pattern id="hach" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="5" height="5" fill="#fff"/><line x1="0" y1="0" x2="0" y2="5" stroke="#d4d4dc" stroke-width="2"/></pattern></defs></svg>
  </section>`;

// ---------- sous un toucher : vraies valeurs et chimie ----------
const srcN = (k) => (SRC[k] ? SRC[k].titre.split(/[,.]/)[0].replace(/\s*\(.*$/, '') + (SRC[k].annee ? ' ' + SRC[k].annee : '') : k);
const plage = (sources) => { const mins = sources.map((s) => s.min).filter((x) => x != null), maxs = sources.map((s) => s.max).filter((x) => x != null); return [mins.length ? Math.min(...mins) : null, maxs.length ? Math.max(...maxs) : null]; };
const srcFiche = (s) => s.source + (s.annee ? ' ' + s.annee : '');
const ligneVal = (titre, unite, get) => `<div class="vv"><span class="vv-n">${titre}<small>${unite}</small></span>${TROIS.map((n) => get(n)).join('')}</div>`;
const cellFiche = (sources, unite) => { if (!sources || !sources.length) return '<span class="vv-c"><span class="inc">inconnu</span></span>'; const [a, b] = plage(sources); return `<span class="vv-c">${M(plg(a, b) + ' ' + unite, sources.map(srcFiche).join(' ; '), 'vv-v', ` aria-label="${esc(plg(a, b) + ' ' + unite + ', ' + sources.map(srcFiche).join(', '))}"`)}</span>`; };
const valeurs = `
    <div class="vals" data-acquis="valeurs">
      <div class="vv vv-t"><span></span>${TROIS.map((n) => `<span class="vv-h"><i class="hpt plein" style="--hc:${COUL[n]}" aria-hidden="true"></i>${INI[n] === 'I' ? 'Idaho 7' : n}</span>`).join('')}</div>
      ${ligneVal('α du lot', '%', (n) => `<span class="vv-c">${M(fr(HD[n].alpha.retenu.value, 1) + ' %', 'lot', 'vv-v')}</span>`)}
      ${ligneVal('α fiches', '%', (n) => cellFiche(HD[n].alpha.sources, '%'))}
      ${ligneVal('β fiches', '%', (n) => cellFiche(HD[n].beta.sources, '%'))}
      ${ligneVal('huile', 'mL/100 g', (n) => cellFiche(HD[n].huiles.totale.sources, ''))}
      <p class="src-l">Beer Maverick 2023 ; Hopsteiner 2025 (Cascade). α du lot : ta fiche de stock ; Galaxy ≠ ses fiches.</p>
    </div>`;
const LIENS = CH.familles.liens;
const famDe = (k) => [...new Set(LIENS.filter((l) => l.compose === k && !l.via).flatMap((l) => l.familles))].slice(0, 2);
const CHIM = [
  { k: 'linalol', u: '% huile' }, { k: 'geraniol', u: '% huile' }, { k: 'myrcene', u: '% huile' }, { k: 'farnesene', u: '% huile' },
  { k: 'caryophyllene', u: '% huile' }, { k: '4MMP', u: 'µg/kg' }, { k: '3MH', u: 'µg/kg' },
];
const NOMC = { linalol: 'linalol', geraniol: 'géraniol', myrcene: 'myrcène', farnesene: 'farnésène', caryophyllene: 'caryophyllène', '4MMP': '4MMP', '3MH': '3MH' };
function cellC(n, k) {
  const c = HD[n].composes.composes[k];
  if (!c || !c.valeurs) {
    const nd = c && c.nonDetecte && c.nonDetecte.length;
    return `<span class="vv-c"><span class="inc" data-inconnu="${esc((c && c.raison) || 'non publié')}">${nd ? 'non détecté' : 'inconnu'}</span></span>`;
  }
  const v = c.valeurs.filter((x) => x.portee !== 'littérature');
  const [a, b] = [Math.min(...v.map((x) => x.plage[0] ?? Infinity)), Math.max(...v.map((x) => x.plage[1] ?? -Infinity))];
  const lo = Number.isFinite(a) ? a : null, hi = Number.isFinite(b) ? b : null;
  const s = [...new Set(v.flatMap((x) => x.sources))];
  return `<span class="vv-c">${M(plg(lo, hi), s, 'vv-v', ` aria-label="${esc(NOMC[k] + ' : ' + plg(lo, hi) + ', ' + s.map(srcN).join(', '))}"`)}${v.some((x) => x.aConfirmer) ? '<b class="averif">?</b>' : ''}</span>`;
}
const chimie = `
    <div class="chim" data-acquis="chimie">
      ${CHIM.map(({ k, u }) => `<div class="vv" data-compose="${k}"><span class="vv-n"><span class="pis">${famDe(k).map((f) => pic(f, 14)).join('')}</span>${NOMC[k]}<small>${u}</small></span>${TROIS.map((n) => cellC(n, k)).join('')}</div>`).join('')}
      <p class="src-l">Fiches : Yakima Chief, Haas, Hopsteiner, HPA, Beer Maverick ; thiols : Schmidt 2024 (H11, LC-MS/MS, US). Du cône, pas en bière.</p>
    </div>`;
const toucher = `
  <section class="carte" aria-label="Chimie et vraies valeurs">
    <button type="button" class="ouvre" aria-expanded="false" aria-controls="chim-vals" data-ouvre-acquis="chimie valeurs">${ic('flacon', 16)}<span>Chimie et vraies valeurs</span>${ic('bas2', 16)}</button>
    <div id="chim-vals" hidden>${valeurs}${chimie}</div>
  </section>`;

// ---------- les houblons : le seul facteur libre (mettre en avant) ----------
const marques = (n) => HD[n].aromes.filter((a) => a.level >= 1).sort((a, b) => b.level - a.level).slice(0, 4).map((a) => a.family);
const colonne = (n) => `<button type="button" class="col" data-h="${esc(n)}" aria-pressed="false" aria-label="Mettre ${esc(n)} en avant" style="--hc:${COUL[n]}">
      <span class="col-1"><i class="hpt plein" aria-hidden="true" style="--hc:${COUL[n]}"></i>${hn(n)}</span>
      <span class="col-2">${alpha(n, { plage: false })}${usage(n)}${stock(n)}</span>
      <span class="col-3">${marques(n).map((f) => pic(f, 16)).join('')}</span>
    </button>`;

const contexte = `<p class="ctx-l" data-role="contexte"><span data-contexte="biere">ta 16D</span><span data-contexte="dose">dose égale, ${fr(EG.dose_gL)} g/L</span><span data-contexte="moment">après fermentation, ${EG.jours} j</span><span data-contexte="levure">US-05</span></p>`;

const panel = `
  <section class="carte panel" aria-label="Goûté en bière par un panel">
    <h2>${ic('panel', 16)}Goûté ${conf('panel')}<small>en blonde ; en stout ?</small></h2>
    ${panelCascade}${panelIdaho}${panelGalaxy}
  </section>`;

const nav = `<nav class="pont" aria-label="Suite">${TROIS.map((n) => `<a href="#" class="pt" data-pour="${esc(n)}" hidden>${ic('cuveP', 16)}<span>Dryhopper ${esc(n)}</span>${ic('chev-r', 16)}</a>`).join('')}<a href="#" class="pt" data-pour="" >${ic('cuveP', 16)}<span>Dryhopper ${esc(candidat)}, le plus ${COURT[voulu].toLowerCase()}</span>${ic('chev-r', 16)}</a></nav>`;

const corps = `
  ${barre('Lequel pour ma stout : Cascade, Idaho 7 ou Galaxy ?')}
  <div class="outils">${lentille()}</div>
  ${contexte}
  <div class="cols" data-libre="houblon" role="group" aria-label="Mettre un houblon en avant">${TROIS.map(colonne).join('')}</div>
  ${panel}
  ${radars}
  ${pistes}
  ${verdict}
  ${toucher}
  ${nav}
  ${legende([LEG_FAMILLES, LEG_CONF, LEG_HOUBLON,
    ['Goûté', [li(`<span class="lg-osu"><i></i></span>`, 'panel OSU : note sur 15 selon la dose, trait noir : la dose lue (3,86 g/L)'), li(`<span class="ck">${ic('check', 14)}</span>`, 'coché par un panel : présent, sans intensité'), li('<span class="pn-trou">?</span>', 'goûté, mais rien de chiffré ou de relevé')], true],
    ['Les trous', [li('<span class="lg-ln"><i class="z"></i><i class="b"></i></span>', 'barre : après l’ajout, ~ ; trait : de bas à haut'), li('<span class="lg-ln"><i class="z"></i></span>', 'pâle : la zone de ta 16D (3 crans)'), li('<span class="lg-ln"><i class="z"></i><i class="b x"></i></span>', 'orangé : au-delà de la 16D'), li('<span class="lg-ln"><i class="h"></i></span>', 'hachuré : inconnu, jamais zéro'), li('<b>G</b>', 'qui en ajoute le plus, en crans')], true],
  ])}`;

const CSS = `
  .outils { display: flex; justify-content: flex-start; }
  .ctx-l { display: flex; flex-wrap: wrap; align-items: center; gap: 2px 5px; font: 500 13px var(--sans); color: var(--gris); margin-top: -4px; }
  .ctx-l > span + span::before { content: "· "; color: var(--gris); }
  .cols { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; }
  .col { position: relative; display: flex; flex-direction: column; align-items: flex-start; gap: 4px; padding: 7px 7px 6px; border-radius: 8px; background: #fff; box-shadow: 0 0 0 1px var(--trait); text-align: left; min-width: 0; }
  .col[aria-pressed="true"] { box-shadow: 0 0 0 2px var(--hc); }
  .col-1 { display: flex; align-items: center; gap: 5px; } .col-1 .hn { font-size: 15px; white-space: nowrap; }
  .col-2 { display: flex; align-items: center; gap: 5px; flex-wrap: wrap; font-size: 12px; }
  .col-3 { display: flex; gap: 3px; min-height: 16px; }
  .panel { gap: 6px; }
  .pn-l { display: flex; flex-direction: column; gap: 2px; padding-top: 6px; border-top: 1px solid #ececf1; }
  .pn-n { display: flex; align-items: center; gap: 5px; } .pn-n .hn { font-size: 14px; }
  .pn-s { margin-left: auto; font-size: 12px; color: var(--gris); }
  .pn-c { display: flex; align-items: center; gap: 8px; }
  .pn-v { display: flex; flex-direction: column; gap: 3px; }
  .pn-x { display: inline-flex; align-items: center; gap: 4px; font-size: 16px; }
  .pn-x .vm { font-size: 16px; }
  .pn-u { font-size: 12px; color: var(--gris); }
  .pn-k { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; min-height: 28px; }
  .ck { display: inline-flex; align-items: center; gap: 3px; height: 26px; padding: 0 8px 0 5px; border-radius: 4px; background: #f6f6f9; box-shadow: inset 0 0 0 1px #d4d4dc; font-size: 13px; }
  .ck > .ic { color: #2f6b3a; }
  .ck-i { font-size: 12px; color: var(--gris); }
  .pn-trou { display: inline-flex; align-items: center; height: 26px; padding: 0 10px; border-radius: 4px; font-size: 13px; color: var(--encre); background: repeating-linear-gradient(135deg, #fff 0 4px, #e4e4ea 4px 7px); box-shadow: inset 0 0 0 1px #9a9aa6; }
  /* Les trous : barres de l5b, à plat, à la manière de w2. */
  .trous { gap: 3px; }
  .tr-cle { display: flex; align-items: center; gap: 10px; font: 700 12px var(--sans); margin: 0 0 2px 98px; }
  .tr-cle > span { display: inline-flex; align-items: center; gap: 3px; }
  .tr-cle-t { font-weight: 400; color: var(--gris); margin-left: auto; }
  .tr { display: grid; grid-template-columns: 94px 1fr 52px; align-items: center; gap: 4px; min-height: 22px; }
  .tr-n { display: inline-flex; align-items: center; gap: 4px; font-size: 12px; white-space: nowrap; }
  .tr.att .tr-n { font-weight: 700; }
  .tr-g { display: inline-flex; color: var(--gris); }
  .tr-p { position: relative; display: flex; flex-direction: column; gap: 2px; padding: 2px 0; }
  .tr-z { position: absolute; left: 0; top: 0; bottom: 0; width: 50%; background: var(--zf); border-right: 1.5px solid var(--zt); }
  body.abs .tr-z { display: none; }
  .tr-av { position: absolute; top: -2px; bottom: -2px; left: var(--av); width: 2px; margin-left: -1px; background: var(--encre); z-index: 2; }
  body.abs .tr-av { left: var(--ava); }
  .ln { position: relative; display: block; height: 4px; }
  .ln-b { position: absolute; left: 0; top: 0; bottom: 0; width: var(--c); background: var(--hc); border-radius: 0 2px 2px 0; overflow: hidden; }
  .ln-o { position: absolute; top: 0; bottom: 0; left: 50%; width: var(--x); background: var(--acc); }
  .ln-r { position: absolute; top: 1.5px; height: 1px; left: var(--b); width: calc(var(--t) - var(--b)); background: var(--hc); opacity: .45; }
  .ln-r.deb::after { content: ""; position: absolute; right: -4px; top: -3px; border: 3.5px solid transparent; border-left: 4px solid var(--hc); border-right: 0; }
  body.abs .ln-b { width: var(--ca); } body.abs .ln-o { display: none; } body.abs .ln-r { left: var(--ba); width: calc(var(--ta) - var(--ba)); }
  .inc-l { background: repeating-linear-gradient(135deg, #fff 0 2px, #b4b4be 2px 3px); width: 50%; }
  .tr-v { font: 500 12px var(--mono); white-space: nowrap; text-align: right; }
  .tr-v b { margin-right: 2px; }
  .hst { color: var(--acc); font-weight: 700; }
  /* Radars r3 */
  .rads { display: grid; grid-template-columns: 1fr 1fr; gap: 4px; }
  .rf { margin: 0; display: flex; flex-direction: column; align-items: center; gap: 0; }
  .rf figcaption { display: flex; align-items: center; gap: 4px; font-size: 13px; }
  .rf .gris { font-size: 12px; }
  .m-abs { display: none; } body.abs .m-abs { display: inline; } body.abs .m-sty { display: none; }
  /* Mettre en avant : les autres s'effacent, la valeur du houblon remplace celle du meneur. */
  ${TROIS.map((n) => `body[data-avant="${n}"] [data-h]:not([data-h="${n}"]):not(.col) { opacity: .28; }
  body[data-avant="${n}"] .pv[data-pour="${n}"] { display: inline; }`).join('\n  ')}
  body[data-avant] .pv-l { display: none; }
  .pv[hidden] { display: none; }
  /* Sous un toucher */
  .ouvre { display: flex; align-items: center; gap: 6px; width: 100%; min-height: 32px; font-size: 14px; font-weight: 700; }
  .ouvre > .ic:last-child { margin-left: auto; transition: transform .15s; }
  .ouvre[aria-expanded="true"] > .ic:last-child { transform: rotate(180deg); }
  .vals, .chim { display: flex; flex-direction: column; gap: 0; }
  .chim { margin-top: 8px; }
  .vv { display: grid; grid-template-columns: 1.45fr 1fr 1fr 1fr; gap: 4px; align-items: center; min-height: 28px; border-top: 1px solid #ececf1; font-size: 12px; }
  .vv-t { border-top: 0; min-height: 22px; }
  .vv-h { display: inline-flex; align-items: center; gap: 3px; font-weight: 700; font-size: 12px; white-space: nowrap; }
  .vv-n { display: flex; align-items: center; gap: 3px; flex-wrap: wrap; font-weight: 600; } .vv-n small { font: 400 12px var(--sans); color: var(--gris); }
  .vv-c { display: inline-flex; align-items: center; gap: 2px; }
  .vv-v { font-size: 12px; }
  .averif { font-weight: 700; color: #7a4e00; background: #fff4d6; padding: 0 3px; border-radius: 2px; }
  .vd { gap: 4px; }
  .vd h2 small { flex-basis: 100%; font-style: italic; }
  .vd-l { display: grid; grid-template-columns: 128px 1fr; align-items: center; gap: 6px; min-height: 26px; border-top: 1px solid #ececf1; }
  .vd-f { display: inline-flex; align-items: center; gap: 4px; font-size: 13px; font-weight: 600; flex-wrap: wrap; }
  .vd-f small { flex-basis: 100%; font-weight: 400; font-size: 12px; color: var(--gris); padding-left: 20px; margin-top: -3px; }
  .vd-v { display: flex; gap: 10px; font: 500 13px var(--mono); }
  .vd-h { display: inline-flex; gap: 2px; align-items: baseline; } .vd-h b { font-family: var(--sans); }
  .vd-t { font-size: 13px; }
  .vd-r { font-size: 14px; line-height: 1.3; padding-top: 4px; border-top: 1px solid #ececf1; }
  .vd-r .gris { font-size: 12px; }
  .pont { display: flex; flex-direction: column; }
  .pt { display: flex; align-items: center; gap: 6px; min-height: 40px; padding: 0 12px; border-radius: 8px; background: var(--encre); color: #fff; font-size: 14px; font-weight: 700; text-decoration: none; }
  .pt .ic:last-child { margin-left: auto; }
  .pt[hidden] { display: none; }
  .lg-osu { position: relative; width: 30px; height: 14px; display: inline-block; flex: none; }
  .lg-osu i { position: absolute; left: 14px; top: 0; bottom: 0; border-left: 1.5px solid var(--encre); }
  .lg-ln { position: relative; width: 40px; height: 12px; display: inline-block; flex: none; }
  .lg-ln i { position: absolute; top: 4px; height: 4px; left: 0; }
  .lg-ln .z { top: 0; height: 12px; width: 20px; background: #f3e8f7; border-right: 1.5px solid #9840bc; }
  .lg-ln .b { width: 14px; background: #781838; } .lg-ln .b.x { width: 30px; background: linear-gradient(90deg, #781838 0 20px, #c2410c 20px); }
  .lg-ln .h { width: 40px; background: repeating-linear-gradient(135deg, #fff 0 2px, #b4b4be 2px 3px); }`;

const js = `
(() => {
  // La lentille : au style (défaut) / absolu.
  document.querySelectorAll('.lentille [role="radio"]').forEach((b) => b.addEventListener('click', () => {
    document.querySelectorAll('.lentille [role="radio"]').forEach((x) => x.setAttribute('aria-checked', String(x === b)));
    document.body.classList.toggle('abs', b.dataset.e === 'absolu');
  }));
  if (/[?&]abs\\b/.test(location.search)) document.querySelector('.lentille [data-e="absolu"]').click();
  // Le seul facteur libre : mettre un houblon en avant (un toucher), le retirer d'un second.
  const cols = [...document.querySelectorAll('.col')];
  const avant = (n) => {
    cols.forEach((c) => c.setAttribute('aria-pressed', String(c.dataset.h === n)));
    if (n) document.body.dataset.avant = n; else delete document.body.dataset.avant;
    document.querySelectorAll('.pv').forEach((p) => { p.hidden = p.dataset.pour !== n; });
    document.querySelectorAll('.pt').forEach((p) => { p.hidden = (p.dataset.pour || '') !== (n || ''); });
  };
  cols.forEach((c) => c.addEventListener('click', () => avant(c.getAttribute('aria-pressed') === 'true' ? null : c.dataset.h)));
  const m = location.search.match(/[?&]avant=([^&]+)/); if (m) avant(decodeURIComponent(m[1]));
  // Chimie et vraies valeurs : un toucher.
  const o = document.querySelector('.ouvre'), z = document.getElementById('chim-vals');
  o.addEventListener('click', () => { const on = z.hidden; z.hidden = !on; o.setAttribute('aria-expanded', String(on)); });
  if (/[?&]ouvert\\b/.test(location.search)) o.click();
})();`;

ecrire(path.join(ici, 'etat.html'), page({
  titre: 'Lequel pour ma stout : Cascade, Idaho 7 ou Galaxy ?',
  desc: 'Lot 22 · r6k · Le panel d’abord : ce que des panels ont goûté (OSU pour Cascade, coché pour Idaho 7, non relevé pour Galaxy), puis le simulé à dose égale pour les trous, radars r3, chimie et vraies valeurs à un toucher. Généré par r6k/generer.mjs.',
  css: CSS, corps, js,
}));
