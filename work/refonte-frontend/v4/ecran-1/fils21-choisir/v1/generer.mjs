// Lot 21 · v1 · « Le duel, à dose égale » (« Des vrai donné, mieux présenté » ; « je sais que par exemple
// citra aura un effet extrêmement differents en dry hopping que cascade alors que pourtant d'après Nos
// outils ils sont assez similaire »).
// Le parti : deux houblons au choix parmi Citra, Cascade, Galaxy et Idaho 7, à la même dose (4 g/L). Une
// seule échelle, « qui en a le plus », centrée sur « pareil » : les mots des fiches tombent au milieu
// (mêmes familles), les vraies teneurs du cône s'en écartent (thiols ×8, farnésène ÷10…), chaque écart en
// bande d'incertitude et écrit en clair. Puis ce qui est mesuré en bière (et les trous), puis ce que le
// moteur calcule dans ta 16D, et le profil simulé qui bouge avec la levure, le moment et l'ajout cumulé.
// Usage : node generer.mjs  →  v1/etat.html
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { CH, MOTEUR, HOPS, QUATRE, STY, PS, LEV, SIMU, grilleDe, pairesDe, COURT, NOM, JET, ORDRE, etude, SRC, srcNom, fr, plg, esc, M, conf, ic, pic, pics, hn, alpha, usage, stock, point,
  barre, lentille, legende, li, LEG_FAMILLES, LEG_CONF, LEG_HOUBLON, LEG_PISTE, LEG_SIM, page, ecrire, CLIENT, posLog } from './socle.mjs';

const ici = path.dirname(fileURLToPath(import.meta.url));
const P = PS;

// ---------- les vraies valeurs de chaque houblon, telles que le moteur et composes-houblon les donnent ----------
const centre = (a, b) => (a != null && b != null ? (a + b) / 2 : null);
function valeurs(nom) {
  const H = HOPS[nom], V = CH.varietes[H.cle];
  const aj = MOTEUR(H.cas).pouvoir.ajouts.find((x) => x.nom === nom);
  const t = (k) => { const p = aj.composes[k].teneur; return { min: p.plage.min, c: p.plage.central, max: p.plage.max, src: p.sources, base: p.base }; };
  const lots = (k) => (V.lots || []).filter((l) => l.composes && l.composes[k] != null).map((l) => ({ id: l.id, v: l.composes[k], an: l.recolte, src: l.sources }));
  const mmp = V.composes['4MMP'].valeurs.find((v) => v.portee === 'variété');
  const rap = (k, bc) => { const c = aj.composes[k]; const r = (bc && c.baseCommune && c.baseCommune.rapport) ? c.baseCommune.rapport : c.rapport; const p = r && (r.plage || r); return p ? { min: p.min, c: p.central, max: p.max, bc: !!(bc && c.baseCommune && c.baseCommune.rapport), src: r.sources || [] } : null; };
  return {
    couleur: H.couleur, niveaux: H.niveaux,
    thiols: { min: mmp.plage[0], c: centre(mmp.plage[0], mmp.plage[1]), max: mmp.plage[1], src: mmp.sources, base: mmp.texte, lots: lots('4MMP') },
    linalol: { ...t('linalol'), lots: lots('linalol') },
    farnesene: { ...t('farnesene'), lots: lots('farnesene') },
    myrcene: { ...t('myrcene'), lots: lots('myrcene') },
    huile: { min: aj.huile.plage.min, c: aj.huile.plage.central, max: aj.huile.plage.max, src: aj.huile.sources, base: aj.huile.base, lots: (V.lots || []).filter((l) => l.huile != null).map((l) => ({ id: l.id, v: l.huile, an: l.recolte, src: l.sources })) },
    moteur: { thiols: rap('4MMP', true), linalol: rap('linalol'), myrcene: rap('myrcene') },
    panel: (V.panel || []).map((p) => ({ texte: p.texte, src: p.sources })),
  };
}
const DATA = Object.fromEntries(QUATRE.map((n) => [n, valeurs(n)]));
const ROWS = [
  { id: 'thiols', fams: ['tropical', 'berries'], nom: 'Tropical, cassis', tag: '4MMP', unite: 'µg/kg', note: 'même labo' },
  { id: 'linalol', fams: ['floral', 'citrus'], nom: 'Floral, agrumes', tag: 'linalol', unite: '% huile' },
  { id: 'farnesene', fams: ['green', 'herbal'], nom: 'Vert, herbacé', tag: 'farnésène', unite: '% huile' },
  { id: 'myrcene', fams: ['resin', 'green'], nom: 'Résineux, vert', tag: 'myrcène', unite: '% huile' },
  { id: 'huile', fams: [], nom: 'Huile totale', tag: '', unite: 'mL/100 g' },
];
const SRCN = Object.fromEntries(Object.keys(SRC).map((k) => [k, srcNom(k) + ' · ' + (SRC[k].niveau || '')]));

// ---------- en bière : ce qui est mesuré (comparatifs-dryhop.json, H12) ----------
const E02 = etude('E02'), E03 = etude('E03'), E06 = etude('E06');
const lin = (e, v) => e && e.mesures.find((m) => m.variete === v && m.compose === 'linalol');
const kish = CH.varietes['beermaverick-cascade'].mesuresEnBiere.find((m) => m.id === 'kishimoto-linalol');
const tch = E02 ? E02.mesures.filter((m) => m.compose === 'linalol' && !/témoin/.test(m.variete)) : [];
const PTS = [
  E03 && { nom: 'Idaho 7', v: lin(E03, 'Idaho-7').valeur * 1000, cond: 'au pitch, semi-quantifié', src: 'E03', verif: true, hop: 'Idaho 7' },
  E06 && { nom: 'sans houblon', v: lin(E06, 'témoin (sans houblon)').valeur, cond: 'témoin, même étude', src: 'E06' },
  { nom: 'Cascade', v: kish.plage[0], cond: '2 g/L, moût refroidi', src: kish.sources[0], hop: 'Cascade' },
  E06 && { nom: 'Nelson Sauvin', v: lin(E06, 'Nelson Sauvin').valeur, cond: 'dose non publiée', src: 'E06' },
  E06 && { nom: 'Centennial', v: lin(E06, 'Centennial').valeur, cond: 'dose non publiée', src: 'E06' },
  tch.length && { nom: '5 tchèques', min: Math.min(...tch.map((m) => m.valeur)), max: Math.max(...tch.map((m) => m.valeur)), cond: 'même huile visée, 30 j', src: 'E02' },
  E06 && { nom: 'Citra', v: lin(E06, 'Citra').valeur, ec: lin(E06, 'Citra').ecart, cond: 'dose non publiée', src: 'E06', hop: 'Citra' },
].filter(Boolean);
const SEUILS = CH.seuils.linalol.valeurs.map((v) => v.plage[0]);
const BL = { min: 10, max: 1000 };
const pl = (x) => Math.max(0, Math.min(100, ((Math.log10(x) - 1) / 2) * 100));
const niveauE = (id) => (etude(id) || {}).niveau || (SRC[id] || {}).niveau || '';
const refE = (id) => (etude(id) ? etude(id).ref.split('.')[0].split(',')[0] + ' (' + (etude(id).ref.match(/(20\d\d|19\d\d)/) || [''])[0] + ')' : srcNom(id));
const biere = `
  <section class="carte" aria-label="En bière, ce qui est mesuré">
    <h2>${pics(['floral', 'citrus'], 16)}Linalol mesuré en bière ${conf('mesure')}<small>µg/L, après dry hop</small></h2>
    <div class="dp">
      <div class="dp-ax mono" aria-hidden="true">${[10, 30, 100, 300, 1000].map((m) => `<span style="left:${pl(m)}%">${m}</span>`).join('')}</div>
      <div class="dp-z"><i class="dp-s" style="left:0;width:${pl(Math.max(...SEUILS))}%"></i></div>
      ${PTS.map((p) => {
        const col = p.hop ? HOPS[p.hop].couleur : '#8a8a96';
        const marque = p.min != null ? `<i class="dp-b" style="left:${pl(p.min)}%;width:${pl(p.max) - pl(p.min)}%;--hc:${col}"></i>` : `<i class="dp-p" style="left:${pl(p.v)}%;--hc:${col}"></i>`;
        const val = p.min != null ? fr(p.min) + '–' + fr(p.max) : fr(p.v) + (p.ec ? ' ±' + fr(p.ec) : '');
        return `<div class="dp-l${p.hop ? ' nous' : ''}"><span class="dp-n">${p.hop ? hn(p.hop) : esc(p.nom)}<small>${esc(p.cond)}${p.verif ? ' · <b class="averif">à vérifier</b>' : ''}</small></span><span class="dp-t">${marque}</span>${M(val, p.src, 'dp-v')}<span class="dp-src">${esc(p.src)} ${niveauE(p.src)}</span></div>`;
      }).join('')}
    </div>
    <p class="src-l">Pâle : les seuils publiés du linalol, de ${fr(Math.min(...SEUILS))} à ${fr(Math.max(...SEUILS))} µg/L (types et bières mêlés, H §8.1). E06 : ${esc(refE('E06'))}, diapositives ; E02 : ${esc(refE('E02'))} ; E03 : ${esc(refE('E03'))} ; H12 : ${esc(srcNom('H12'))}.</p>
    <div class="trou">${ic('inconnu', 14)}<span><b>Citra contre Cascade, même dose, même bière : aucune étude lue.</b> Galaxy : aucune mesure en bière chiffrée. Idaho 7 : une seule étude, houblon ajouté au pitch. Ces points ne se comparent pas entre eux : doses et bières diffèrent.</span></div>
  </section>`;

// ---------- goûté : le panel OSU à 4 g/L (H21, lu sur un biplot) ----------
const E09 = etude('E09');
const panel = `
  <section class="carte" aria-label="Goûté par un panel">
    <h2>Goûté à 4 g/L ${conf('panel')}<small>OSU, 12 variétés, 72 h, 18 °C</small></h2>
    ${QUATRE.map((n) => { const p = DATA[n].panel.find((x) => /4 g\/L|OSU/.test(x.texte)); return `<div class="pn">${point(n)}${hn(n)}<span class="pn-t">${p ? M(esc(p.texte.replace(/^.*?:\s*/, '').replace(new RegExp('^' + n + '\\s*'), '')), p.src, 'pn-v txt') : INCx('aucun panel entraîné trouvé')}</span></div>`; }).join('')}
    <p class="src-l">${esc(srcNom('H21'))}, positions lues sur un biplot, pas de moyennes. ${E09 ? 'E09 : la seule étude des 12 variétés à dose égale ; ses positions ne sont publiées qu’en figure.' : ''}</p>
  </section>`;
function INCx(t) { return `<span class="inc" data-inconnu="${esc(t)}" data-source="H">inconnu</span> <span class="gris petit">${esc(t)}</span>`; }

// ---------- les quatre houblons (les voies), le duel, ta 16D ----------
const carte = (n) => `<button type="button" class="hc" data-voie="${esc(n)}" data-h="${esc(n)}" data-role="reglage" aria-pressed="false" style="--hc:${HOPS[n].couleur}" aria-label="${esc(n)} dans le duel">
      <span class="hc-m" aria-hidden="true"></span>
      <span class="hb">${hn(n)}${alpha(n, { plage: HOPS[n].alpha.lot == null })}</span>
      <span class="hc-2">${usage(n)}${stock(n)}</span>
    </button>`;
const LEVURES = Object.keys(LEV);
const LEVN = Object.fromEntries(Object.entries(LEV).map(([k, id]) => [k, CH.levures[id].nom]));
const corps = `
  ${barre('<span id="titre">' + hn('Citra') + ' ou ' + hn('Cascade') + ', à 4 g/L ?</span>')}
  <div class="outils">${lentille()}<span class="ctx">dry hop · après · 3 j</span></div>
  <p class="reponse" id="reponse"></p>
  <div class="hcs" role="group" aria-label="Choisir les deux houblons du duel">${QUATRE.map(carte).join('')}</div>
  <section class="carte duel" aria-label="Le duel : qui en a le plus, à dose égale">
    <div class="axe-d" aria-hidden="true"><span class="ax-b"><i class="hpt contour" id="ax-pb"></i><span id="ax-b">Cascade</span> en a plus</span><button type="button" class="swap" data-swap data-role="reglage" aria-label="Échanger les deux houblons">${ic('echange', 16)}</button><span class="ax-a"><span id="ax-a">Citra</span> en a plus<i class="hpt plein" id="ax-pa"></i></span></div>
    <div id="rows"></div>
    <p class="src-l">${conf('mesure')} fiches, de la plus petite à la plus grande valeur ; <span class="fx">${pics(['tropical', 'berries'], 12)}4MMP</span> : un seul labo (${esc(srcNom('H11'))}). Touche une ligne : sources et lots.</p>
  </section>
  ${biere}
  <section class="carte" aria-label="Dans ta 16D">
    <h2>Dans ta 16D ${conf('calcule')}<small>chacun seul, 4 g/L, après fermentation, 3 j</small></h2>
    <p class="gris petit">${esc(STY.name)} : « ${esc(CH.styles['16D'].attendu)} » (BJCP 2021). Rapport au seuil, pas une intensité.</p>
    ${'' /* l'axe et les pistes du moteur, rendus par le script */}
    <div id="moteur"></div>
    <div class="sim" data-role="simulation"><h2 class="sim-h">Le profil ${conf('simule')}<small id="sim-ctx"></small></h2>
    <div class="regl" role="group" aria-label="L’ajout">
      <button type="button" class="chip" data-ens="0" data-role="reglage" aria-pressed="true">chacun seul, 4 g/L</button>
      <button type="button" class="chip" data-ens="1" data-role="reglage" data-reglage="ajout-cumule" aria-pressed="false">${ic('plus2', 14)}ensemble, 2 + 2 g/L</button>
    </div>
    <div class="regl" role="group" aria-label="Le moment du dry hop">
      <button type="button" class="chip" data-mom="dryActive" data-role="reglage" aria-pressed="false">${ic('cuveA', 14)}fermentation active</button>
      <button type="button" class="chip" data-mom="dryPost" data-role="reglage" aria-pressed="true">${ic('cuveP', 14)}après</button>
    </div>
    <div class="regl" role="group" aria-label="La levure">${LEVURES.map((k) => `<button type="button" class="chip" data-lev="${k}" data-role="reglage" data-reglage="levure" aria-pressed="${k === 'us05'}">${ic('levure', 14)}${esc(LEVN[k].replace(/^(SafAle|LalBrew) /, '').replace(' IPA', ''))}</button>`).join('')}</div>
    <div id="ajout"></div>
    <div id="sim"></div>
    <p class="ecart" id="ecart"></p>
    <div id="bio"></div>
    </div><p class="src-l">~ ${esc(SIMU.mention)} Conventions à valider (donnees/PROFIL-SIMULE.md) : ancre Cascade 3,86 g/L = 26 points d’agrumes (H22), poids des fiches et des composés, géraniol → citronellol 50 % pour Pomona.</p>
  </section>
  ${panel}
  ${legende([LEG_FAMILLES, LEG_CONF, LEG_HOUBLON, ['Le duel', [li('<span class="lg-d"><i class="c"></i><i class="b"></i></span>', 'bande : du plus petit au plus grand écart possible entre les fiches'), li('<span class="lg-d"><i class="c"></i></span>', 'trait du milieu : pareil'), li('<b class="mono">Citra ×8</b>', 'Citra en a 8 fois plus (milieux des plages)'), li('<b class="mono">×1,3 ?</b>', '? : la bande passe par « pareil »')], true], LEG_PISTE, LEG_SIM])}`;

const LEVF = { us05: 'fermentis-us05', verdant: 'lalbrew-verdant-ipa', pomona: 'lalbrew-pomona', diamond: 'lalbrew-diamond' };
const BIO = {
  levures: Object.fromEntries(Object.entries(LEVF).map(([k, id]) => { const L = CH.levures[id]; return [k, { nom: L.nom, bio: L.biotransformation, gc: L.geraniolCitronellol, esters: L.esters, betaLyase: L.betaLyase, notes: L.notes, src: L.sources }]; })),
  linalol: CH.biotransformation.linalol, gc: CH.biotransformation.geraniolCitronellol, thiols: CH.biotransformation.thiolsPrecurseurs, aucune: CH.levures.aucune,
  creep: CH.hopCreep.chiffres.find((c) => /10 g\/L, 7 j/.test(c.texte)),
  sat: CH.saturation, synergie: CH.ajoutsSuccessifs.synergie, masquage: CH.ajoutsSuccessifs.masquage,
};
const client = fs.readFileSync(path.join(ici, 'client-duel.js'), 'utf8');
const js = `(() => {
${CLIENT(P)}
const H = ${JSON.stringify(DATA)};
const ROWS = ${JSON.stringify(ROWS)};
const SRCN = ${JSON.stringify(SRCN)};
const GRILLE = ${JSON.stringify(grilleDe(QUATRE))};
const PAIRES = ${JSON.stringify(pairesDe(QUATRE))};
const LEVK = ${JSON.stringify(LEV)};
const LEVN = ${JSON.stringify(LEVN)};
const BIO = ${JSON.stringify(BIO)};
const COULEUR = ${JSON.stringify(Object.fromEntries(QUATRE.map((n) => [n, HOPS[n].couleur])))};
${client}
})();`;

const CSS = `
  .hcs { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
  .hc { position: relative; display: flex; flex-direction: column; align-items: flex-start; gap: 3px; min-height: 52px; padding: 6px 8px 6px 24px; border-radius: 8px; background: #fff; box-shadow: 0 0 0 1px var(--trait); text-align: left; }
  .hc[aria-pressed="true"] { box-shadow: 0 0 0 2px var(--hc); }
  .hc-m { position: absolute; left: 7px; top: 9px; width: 11px; height: 11px; border-radius: 2px; box-shadow: inset 0 0 0 1px #c4c4cc; }
  .hc[data-role-duel="a"] .hc-m { background: var(--hc); box-shadow: none; }
  .hc[data-role-duel="b"] .hc-m { background: #fff; box-shadow: inset 0 0 0 2.5px var(--hc); }
  .hc .hb { display: flex; align-items: baseline; gap: 5px; flex-wrap: wrap; }
  .hc .hn { font-size: 15px; }
  .hc-2 { display: flex; align-items: center; gap: 6px; }
  .duel { gap: 4px; }
  .axe-d { display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; gap: 4px; font-size: 12px; color: var(--encre); }
  .axe-d b, .axe-d span span { font-weight: 700; }
  .ax-b { display: inline-flex; align-items: center; gap: 4px; } .ax-a { display: inline-flex; align-items: center; gap: 4px; justify-content: flex-end; }
  .swap { width: 32px; height: 32px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; background: #ececf1; }
  .dr { padding: 6px 0 4px; border-top: 1px solid var(--trait); cursor: pointer; }
  .dr-1 { display: flex; align-items: center; gap: 6px; min-height: 20px; }
  .dr-n { display: inline-flex; align-items: center; gap: 4px; font-size: 14px; font-weight: 600; min-width: 0; }
  .dr-n small { font: 500 12px var(--mono); color: var(--gris); margin-left: 2px; }
  .dr-x { margin-left: auto; font: 700 14px var(--mono); color: var(--encre); white-space: nowrap; }
  .dr-2 { display: grid; grid-template-columns: 58px 1fr 58px; align-items: center; gap: 4px; margin-top: 2px; }
  .dr-v { font: 600 12px var(--mono); white-space: nowrap; } .dr-v.b { text-align: right; } .dr-v.a { text-align: left; }
  .dt { position: relative; height: 16px; }
  .dt-0 { position: absolute; left: 50%; top: -2px; bottom: -2px; width: 0; border-left: 1.5px solid var(--encre); }
  .dt-g { position: absolute; top: 6px; height: 4px; left: 0; right: 0; background: #f0f0f4; border-radius: 2px; }
  .dt-k { position: absolute; top: 4px; height: 8px; width: 0; border-left: 1px solid #b4b4be; }
  .db { position: absolute; top: 3px; height: 10px; border-radius: 4px; background: var(--dc, #5b5b66); }
  .db.ouv-d { border-top-right-radius: 0; border-bottom-right-radius: 0; -webkit-mask: linear-gradient(90deg, #000 80%, transparent); mask: linear-gradient(90deg, #000 80%, transparent); }
  .db.ouv-g { border-top-left-radius: 0; border-bottom-left-radius: 0; -webkit-mask: linear-gradient(270deg, #000 80%, transparent); mask: linear-gradient(270deg, #000 80%, transparent); }
  .db b { position: absolute; top: -3px; width: 3px; height: 16px; margin-left: -1.5px; background: var(--encre); border-radius: 2px; }
  .dr-d { display: none; flex-direction: column; gap: 4px; padding: 6px 0 2px; font-size: 12px; line-height: 1.35; }
  .dr.ouvert .dr-d { display: flex; }
  .dr-d .hrow { display: flex; gap: 6px; align-items: baseline; flex-wrap: wrap; }
  .lots { position: relative; height: 18px; margin: 2px 0 0; background: linear-gradient(var(--trait), var(--trait)) 0 9px / 100% 1px no-repeat; }
  .lots i { position: absolute; top: 4px; width: 10px; height: 10px; margin-left: -5px; border-radius: 50%; background: var(--hc); box-shadow: 0 0 0 1.5px #fff; }
  .lots .pl { position: absolute; top: 7px; height: 4px; border-radius: 2px; background: var(--hc); opacity: .35; }
  .mots { display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; gap: 6px; margin-top: 2px; }
  .mots .g { justify-self: end; } .mots .d { justify-self: start; }
  .mots .m { display: inline-flex; align-items: center; gap: 4px; padding: 2px 8px; border-radius: 12px; background: #f6f6f9; box-shadow: inset 0 0 0 1.5px var(--encre); font-size: 12px; font-weight: 600; }
  .dp { display: flex; flex-direction: column; gap: 0; position: relative; }
  .dp-ax { position: relative; height: 16px; margin-left: 118px; margin-right: 92px; }
  .dp-ax span { position: absolute; transform: translateX(-50%); font-size: 12px; color: var(--gris); }
  .dp-z { position: absolute; top: 16px; bottom: 0; left: 118px; right: 92px; }
  .dp-s { position: absolute; top: 0; bottom: 0; background: #f1ecf7; }
  .dp-l { position: relative; display: grid; grid-template-columns: 114px 1fr 52px 36px; align-items: center; gap: 4px; min-height: 30px; border-top: 1px solid #ececf1; }
  .dp-n { display: flex; flex-direction: column; font-size: 12px; line-height: 1.15; } .dp-n small { font-size: 12px; color: var(--gris); }
  .dp-n .hn { font-size: 13px; }
  .dp-t { position: relative; height: 14px; }
  .dp-p { position: absolute; top: 2px; width: 10px; height: 10px; margin-left: -5px; border-radius: 50%; background: var(--hc); }
  .dp-b { position: absolute; top: 3px; height: 8px; border-radius: 4px; background: var(--hc); }
  .dp-v { font-size: 12px; text-align: right; } .dp-src { font: 500 12px var(--mono); color: var(--gris); }
  .averif { font-weight: 700; color: #7a4e00; background: #fff4d6; padding: 0 3px; border-radius: 2px; }
  .pn { display: grid; grid-template-columns: 12px auto 1fr; gap: 6px; align-items: baseline; font-size: 12px; line-height: 1.3; }
  .pn .hpt { align-self: center; } .pn .hn { font-size: 13px; } .pn-v { font: 400 12px var(--sans); }
  .sim-h { margin-top: 4px; font-size: 14px; font-weight: 700; display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
  .sim-h small { font: 400 12px var(--sans); color: var(--gris); }
  .reponse { font-size: 14px; line-height: 1.3; }
  .reponse b { font-weight: 700; }
  .fx { display: inline-flex; align-items: center; gap: 2px; white-space: nowrap; vertical-align: -2px; }
  .ecart { font-size: 14px; line-height: 1.3; }
  .ecart b { font-weight: 700; }
  #ajout:empty { display: none; }
  [data-role="ajout"] { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; font-size: 12px; padding: 6px 8px; border-radius: 8px; background: #f6f6f9; }
  .mo-l { display: grid; grid-template-columns: 96px 1fr; align-items: center; gap: 4px; padding: 2px 0; border-top: 1px solid #ececf1; }
  .mo-l .lab { display: flex; flex-direction: column; font-size: 12px; line-height: 1.15; }
  .mo-l .lab b { display: inline-flex; align-items: center; gap: 3px; font-size: 13px; }
  .mo-l .lab small { font: 500 12px var(--mono); color: var(--gris); }
  .mo-l .lpiste .lpi-t { margin: 0 30px 0 28px; }
  .mo-l .verdict { grid-column: 2; font-size: 12px; color: var(--encre); padding-left: 28px; }
  
  .lg-d { position: relative; width: 44px; height: 14px; display: inline-block; flex: none; }
  .lg-d .c { position: absolute; left: 21px; top: 0; bottom: 0; border-left: 1.5px solid var(--encre); }
  .lg-d .b { position: absolute; left: 24px; right: 2px; top: 3px; bottom: 3px; border-radius: 4px; background: #5b5b66; }
  body.abs .hors-abs { display: none; }
  .sb-leg { display: flex; flex-wrap: wrap; gap: 4px 12px; font-size: 12px; align-items: center; }
  .sb-leg > span { display: inline-flex; align-items: center; gap: 4px; }
  .sb-leg .hn { font-size: 12px; }
  .fdet { display: flex; flex-direction: column; gap: 4px; font-size: 12px; line-height: 1.3; padding: 8px; border-radius: 8px; background: #f6f6f9; }
  .fdet > b { display: flex; align-items: center; gap: 4px; font-size: 13px; }
  .fd-l { display: grid; grid-template-columns: 74px 1fr 96px; gap: 6px; align-items: center; }
  .fd-n { display: inline-flex; align-items: center; gap: 4px; } .fd-n .hn { font-size: 12px; }
  .fd-t { position: relative; height: 14px; background: #fff; border-radius: 2px; box-shadow: inset 0 0 0 1px var(--trait); }
  .fd-z { position: absolute; left: 0; top: 0; bottom: 0; background: #eceaf4; border-right: 1.5px solid #8a8a96; }
  .fd-b { position: absolute; top: 3px; height: 8px; border-radius: 4px; background: var(--hc); }
  .fd-b.b { background: #fff; box-shadow: inset 0 0 0 2px var(--hc); }
  .fd-b b { position: absolute; top: -3px; width: 3px; height: 14px; margin-left: -1.5px; background: var(--encre); border-radius: 2px; }
  .fd-v { font-size: 12px; text-align: right; } .fd-v small { color: var(--gris); font-size: 12px; }`;
ecrire(path.join(ici, 'etat.html'), page({ titre: 'Le duel à dose égale', desc: 'Lot 21 · v1 · Le duel, à dose égale : deux houblons, une échelle « qui en a le plus », les mots des fiches au milieu, les vraies teneurs du cône en bandes ; puis ce qui est mesuré en bière, le moteur dans ta 16D et le profil simulé (maquette). Généré par v1/generer.mjs.', css: CSS, corps, js }));
