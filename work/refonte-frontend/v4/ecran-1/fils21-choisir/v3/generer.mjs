// Lot 21 · v3 · « Le calendrier du dry hop » (K2, K3, K4, K5 : « combinaison de 3j dryhopping Citra, 7j dry
// hopping Galaxy ; 3j citra - 5j idao7 […] C'est extrêmement complexe à voir ce qui est vraiment faisable »).
// Le parti : un calendrier, jour par jour. Chaque ajout est une barre sur les jours de contact ; les repères
// MESURÉS y sont posés (l'essentiel en 24 h, le transfert majeur en 2 j, rien de mesuré en plus après 3 j) ;
// au-delà, la barre est hachurée. Un curseur de jour fait défiler le profil simulé (parJour) : on voit qu'il ne
// bouge plus. Puis la dose : la vraie courbe du panel (Cascade, 0 à 16 g/L) et la part extraite qui baisse,
// avec la lecture contestée du tableau ; la levure et la biotransformation ; ce qui reste inconnu.
// Usage : node generer.mjs  →  v3/etat.html
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { JET, CH, MOTEUR, HOPS, PS, LEV, SIMU, grilleDe, casSim, etude, COURT, SRC, srcNom, fr, esc, M, conf, ic, pic, pics, hn, alpha, usage, stock, point,
  barre, lentille, legende, li, LEG_FAMILLES, LEG_CONF, LEG_HOUBLON, LEG_PISTE, LEG_SIM, page, ecrire, CLIENT, ORDRE } from '../v1/socle.mjs';

const ici = path.dirname(fileURLToPath(import.meta.url));
const TROIS = ['Citra', 'Galaxy', 'Idaho 7'];
const reduit = (o) => Object.fromEntries(ORDRE.map((f) => [f, (Array.isArray(o[f]) ? o[f] : [o[f].bas, o[f].centre, o[f].haut]).slice(0, 3).map((x) => Math.round(x * 10) / 10)]));
const TXT = (t) => (typeof t === 'string' && /^§\d+$/.test(t) ? SIMU.textes[t] || t : t);
const cas = (id) => { const c = casSim(id); if (!c) return null; return { id, titre: c.titre, aj: c.ajouts.map((a) => ({ n: a.nom, d: a.dose_gL, m: a.moment, j0: a.jourDebut, j: a.jours })), p: reduit(c.apres), jours: c.parJour.map((x) => ({ j: x.jour, jr: x.jourRecette, p: reduit(x.familles) })), sat: c.saturation, apports: c.apportsParHoublon.map((a) => ({ n: a.nom, seul: a.seul, apport: a.apport })), dr: [...new Set(c.drapeaux.map((d) => d.id))], drT: Object.fromEntries(c.drapeaux.map((d) => [d.id, TXT(d.titre)])), conf: { n: c.confiance.niveau, pq: c.confiance.pourquoi.map(TXT) }, bio: c.biotransformation }; };
const LEVS = ['us05', 'pomona', 'verdant', 'diamond'];
const CAS = {};
for (const h of TROIS) CAS['seul-' + h] = cas('K2-' + h.toLowerCase().replace(' ', '-'));
CAS['succ-Galaxy-dryPost-us05'] = cas('K3-citra3-galaxy7');
for (const l of LEVS) for (const [m, k] of [['dryActive', 'actif'], ['dryPost', 'apres']]) CAS['succ-Idaho 7-' + m + '-' + l] = cas('K4-' + l + '-' + k);
for (const b of ['Galaxy', 'Idaho 7']) for (const l of ['us05', 'pomona', 'verdant']) for (const [m, k] of [['dryActive', 'actif'], ['dryPost', 'apres']]) CAS['ens-' + b + '-' + m + '-' + l] = cas('K5-citra+' + b.toLowerCase().replace(' ', '-') + '-' + k + '-' + l);
for (const [k, v] of Object.entries(CAS)) if (!v) delete CAS[k];
const GR = grilleDe(TROIS).filter((g) => g.m === 'dryPost' || g.m === 'dryActive');

// ---------- les repères mesurés de la durée ----------
const D = CH.duree;
const E04 = etude('E04'), E05 = etude('E05'), E08 = etude('E08'), E10 = etude('E10');
const REP = [
  { j: 1, t: '24 h', d: D.essentiel24h.texte, src: D.essentiel24h.sources },
  { j: 2, t: '2 j', d: (E08 ? E08.mesures[0].valeur + ' (Eureka!, −1 °C)' : D.thiols.texte), src: E08 ? ['E08'] : D.thiols.sources },
  { j: 3, t: '3 j', d: D.auDela.texte, src: D.auDela.sources },
];
// ---------- la dose : le tableau 3 de Lafontaine 2018 (E04), et sa lecture contestée ----------
const DOSES0 = E04 ? [...new Set(E04.mesures.filter((m) => m.dose_gL != null && m.unite === 'points').map((m) => m.dose_gL))] : CH.saturation.doses;
const doses = E04 ? [...new Set(E04.mesures.filter((m) => m.dose_gL != null && m.unite === 'points').map((m) => m.dose_gL))] : CH.saturation.doses;
const serie = (re) => (E04 ? E04.mesures.filter((m) => m.unite === 'points' && re.test(m.descripteur || '')).map((m) => m.valeur) : null);
const descripteurs = E04 ? [...new Set(E04.mesures.filter((m) => m.unite === 'points').map((m) => m.descripteur))] : [];
const pts = E04 ? E04.mesures.filter((m) => m.unite === 'points') : [];
const SER = E04 ? [...new Set(pts.map((m) => m.famille))].map((f) => ({ famille: f, nomJ: pts.filter((m) => m.famille === f).map((m) => m.descripteur.split(',')[0]).pop(), v: DOSES0.map((d) => (pts.find((m) => m.famille === f && m.dose_gL === d) || {}).valeur ?? null) })) : [];
const EXTR = E04 ? E04.mesures.filter((m) => /part extraite/.test(m.compose || '')).map((m) => ({ c: m.compose.split(',')[0], d: m.dose_gL, v: m.valeur })) : [];

// ---------- le moteur : K2, rapport au seuil, pour les trois seuls ----------
const RAP = Object.fromEntries(TROIS.map((n) => { const aj = MOTEUR(HOPS[n].cas).pouvoir.ajouts.find((x) => x.nom === n); const r = (k, bc) => { const c = aj.composes[k]; const x = bc && c.baseCommune && c.baseCommune.rapport ? c.baseCommune.rapport : c.rapport; const p = x && (x.plage || x); return p ? { min: p.min, c: p.central, max: p.max } : null; }; return [n, { thiols: r('4MMP', true), linalol: r('linalol'), myrcene: r('myrcene') }]; }));

const LEVN = Object.fromEntries(Object.entries(LEV).map(([k, id]) => [k, CH.levures[id].nom]));
const LEVF = Object.fromEntries(Object.entries(LEV).map(([k, id]) => { const L = CH.levures[id]; return [k, { nom: L.nom, esters: L.esters, gc: L.geraniolCitronellol, betaLyase: L.betaLyase, notes: L.notes, src: L.sources }]; }));
const COUL = Object.fromEntries(['Citra', 'Galaxy', 'Idaho 7', 'Cascade'].map((n) => [n, HOPS[n].couleur]));

const voie = (n) => `<span class="hv" data-voie="${esc(n)}">${point(n)}<span class="hb">${hn(n)}${alpha(n, { plage: HOPS[n].alpha.lot == null })}</span>${usage(n)}${stock(n)}<span class="hv-f" data-nature="mesure" data-source="pack-fiches" aria-label="familles de ses fiches">${pics(ORDRE.filter((f) => HOPS[n].niveaux[f] > 0).slice(0, 5), 14)}</span></span>`;
const chip = (k, t, extra = '') => `<button type="button" class="chip" data-sc="${k}" data-role="reglage"${extra} aria-pressed="false">${t}</button>`;
const corps = `
  ${barre('Dry hop : combien de jours ?')}
  <div class="outils">${lentille()}<span class="ctx">16D · après fermentation</span></div>
  <div class="scs">
    <div class="regl" role="group" aria-label="Un houblon seul, 4 g/L"><span class="rg-t">seul, 4 g/L</span>${TROIS.map((n) => chip('seul-' + n, esc(n))).join('')}</div>
    <div class="regl" role="group" aria-label="Deux houblons, 2 + 2 g/L"><span class="rg-t">l’un puis l’autre</span>${chip('succ-Galaxy', 'Citra 3 j → Galaxy 7 j')}${chip('succ-Idaho 7', 'Citra 3 j → Idaho 7 5 j')}</div>
    <div class="regl" role="group" aria-label="Deux houblons ensemble"><span class="rg-t">ensemble</span>${chip('ens-Galaxy', ic('plus2', 14) + 'Citra + Galaxy', ' data-reglage="ajout-cumule"')}${chip('ens-Idaho 7', ic('plus2', 14) + 'Citra + Idaho 7', ' data-reglage="ajout-cumule"')}</div>
  </div>
  <div class="voies">${TROIS.map(voie).join('')}</div>
  <p class="reponse" id="reponse"></p>
  <section class="carte cal" aria-label="Le calendrier du dry hop">
    <h2>Le calendrier ${conf('mesure')}<small>repères mesurés, posés sur chaque ajout</small></h2>
    <div id="cal"></div>
    <div class="curseur"><label for="jour">${ic('calendrier', 14)}Jour</label><input id="jour" type="range" min="0" max="10" step="1" value="10" data-role="reglage" aria-label="Le jour du profil"><b class="mono" id="jour-v"></b></div>
    <div class="sim" data-role="simulation" id="sim"></div>
  </section>
  <section class="carte" aria-label="La levure">
    <h2>La levure ${conf('mesure')}<small>ce que disent ses fournisseurs</small></h2>
    <div class="regl" role="group" aria-label="Le moment du dry hop"><button type="button" class="chip" data-mom="dryPost" data-role="reglage" aria-pressed="true">${ic('cuveP', 14)}après fermentation</button><button type="button" class="chip" data-mom="dryActive" data-role="reglage" aria-pressed="false">${ic('cuveA', 14)}fermentation active</button></div>
    <div class="regl" role="group" aria-label="La levure">${LEVS.map((k) => `<button type="button" class="chip" data-lev="${k}" data-role="reglage" data-reglage="levure" aria-pressed="${k === 'us05'}">${ic('levure', 14)}${esc(LEVN[k].replace(/^(SafAle|LalBrew) /, '').replace(' IPA', ''))}</button>`).join('')}</div>
    <div id="bio"></div>
  </section>
  <section class="carte" aria-label="La dose">
    <h2>Combien ? La saturation ${conf('panel')}<small>Cascade, 24 h, panel OSU, 0–15</small></h2>
    <div id="dose"></div>
    <p class="src-l">${esc(E04 ? E04.ref.split('.')[0] + ' (2018)' : srcNom('H22'))}, tableau 3 et texte. La zone 4–8 g/L est celle que les auteurs retiennent (${esc(srcNom('H22'))}).</p>
  </section>
  <section class="carte" aria-label="Les trois seuls dans ta 16D">
    <h2>Les trois seuls, dans ta 16D ${conf('calcule')}<small>4 g/L, 3 j, rapport au seuil</small></h2>
    <div id="k2"></div>
  </section>
  <section class="carte" aria-label="La durée, mesurée">
    <h2>La durée, ce qui est mesuré ${conf('mesure')}</h2>
    <div class="mes">
      ${E10 ? `<p>${M('1 h = 96 h', 'E10', 'txt')} : Cascade à ${fr(E10.conditions.dose_gL)} g/L, le panel ne distingue pas les temps de contact dans une bière jeune (${esc(E10.ref.split(',')[0])}, ${E10.niveau}).</p>` : ''}
      ${E08 ? `<p>${M('2 jours', 'E08', 'txt')} : Eureka! à ${fr(E08.conditions.dose_gL)} g/L, −1 °C, transfert majeur les deux premiers jours ; les chiffres par jour n’ont pas été lus (${E08.niveau}).</p>` : ''}
      ${E05 ? `<p>${M('43 % contre 89 %', 'E05', 'txt')} du linalol extrait en 6 h, au repos ou agité (Cascade pastilles, 3,86 g/L, thèse) : brasser compte plus que la durée.</p>` : ''}
      <p>${M(esc(CH.hopCreep.chiffres.find((c) => /10 g\/L, 7 j/.test(c.texte)).texte), 'H68', 'txt')} (hop creep, levure vivante).</p>
      <div class="trou">${ic('inconnu', 14)}<span><b>Inconnus :</b> l’ordre des deux ajouts, leur synergie, le masquage par la stout ; aucune étude qui croise variété, levure et dry hop ; aucun chiffre pour Galaxy en bière.</span></div>
    </div>
  </section>
  ${legende([LEG_FAMILLES, LEG_CONF, LEG_HOUBLON, ['Le calendrier', [li('<span class="lg-c"><i class="b"></i></span>', 'barre : les jours de contact'), li('<span class="lg-c"><i class="h"></i></span>', 'hachures : rien de mesuré en plus'), li('<span class="mono">24 h · 2 j · 3 j</span>', 'repères mesurés'), li('<span class="lg-c"><i class="j"></i></span>', 'trait : le jour du profil')], true], LEG_PISTE, LEG_SIM])}`;

const client = fs.readFileSync(path.join(ici, 'client-calendrier.js'), 'utf8');
const js = `(() => {
${CLIENT(PS)}
const CAS = ${JSON.stringify(CAS)};
const GR = ${JSON.stringify(GR)};
const REP = ${JSON.stringify(REP)};
const SER = ${JSON.stringify(SER)};
const DOSES = ${JSON.stringify(doses)};
const EXTR = ${JSON.stringify(EXTR)};
const ZONE = ${JSON.stringify(CH.saturation.zone)};
const RAP = ${JSON.stringify(RAP)};
const LEVK = ${JSON.stringify(LEV)};
const LEVN = ${JSON.stringify(LEVN)};
const LEVF = ${JSON.stringify(LEVF)};
const COULEUR = ${JSON.stringify(COUL)};
const SIMMENTION = ${JSON.stringify(SIMU.mention)};
const NOTE_E04 = ${JSON.stringify('Lecture du tableau 3 contestée : H et docs/hop-solver.md lisent « les agrumes plafonnent, l’herbacé monte » ; la recherche J lit l’inverse. À trancher en relisant le tableau (note du moteur profil-simulé).')};
${client}
})();`;

const CSS = `
  .scs { display: flex; flex-direction: column; gap: 4px; }
  .scs .regl { align-items: center; gap: 4px; }
  .rg-t { font-size: 12px; color: var(--gris); width: 100%; }
  .chip[data-sc] { min-height: 32px; }
  .voies { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 4px; }
  .hv { display: flex; flex-direction: column; align-items: flex-start; gap: 2px; padding: 5px 6px; border-radius: 8px; background: #fff; box-shadow: 0 0 0 1px var(--trait); font-size: 12px; }
  .hv .hpt { position: absolute; } .hv { position: relative; padding-left: 18px; } .hv .hpt { left: 5px; top: 9px; }
  .hv .hb { display: flex; flex-wrap: wrap; align-items: baseline; gap: 3px; } .hv .hn { font-size: 14px; }
  .hv.actif { box-shadow: 0 0 0 2px var(--encre); }
  .hv-f { display: flex; }
  .reponse { font-size: 14px; line-height: 1.3; } .reponse b { font-weight: 700; }
  .cal-j { display: grid; grid-template-columns: 72px 1fr; align-items: center; font: 500 12px var(--mono); color: var(--gris); }
  .cal-jt { position: relative; height: 16px; margin-right: 8px; } .cal-jt span { position: absolute; transform: translateX(-50%); white-space: nowrap; } .cal-jt span.on { color: var(--encre); font-weight: 700; background: #ececf1; border-radius: 4px; padding: 0 2px; z-index: 1; }
  .cal-l { position: relative; display: grid; grid-template-columns: 72px 1fr; align-items: center; min-height: 52px; border-top: 1px solid var(--trait); }
  .cal-n { display: flex; flex-direction: column; font-size: 12px; line-height: 1.15; } .cal-n .mono { font-size: 12px; } .cal-n .hn { font-size: 13px; }
  .cal-t { position: relative; height: 50px; margin-right: 8px; }
  .cal-b { position: absolute; top: 16px; height: 14px; border-radius: 4px; background: var(--hc); }
  .cal-h { position: absolute; top: 16px; height: 14px; border-radius: 0 4px 4px 0; background: repeating-linear-gradient(135deg, #fff 0 3px, var(--hc) 3px 4.5px); box-shadow: inset 0 0 0 1.5px var(--hc); }
  .cal-r { position: absolute; top: 0; bottom: 6px; width: 0; border-left: 1.5px dashed var(--encre); }
  .cal-r.bas span { top: auto; bottom: -6px; }
  .cal-r span { position: absolute; top: -1px; left: 2px; font: 600 12px var(--mono); color: var(--encre); white-space: nowrap; background: #fff; padding: 0 1px; }
  .cal-cur { position: absolute; top: 0; bottom: 0; width: 3px; margin-left: -1.5px; background: var(--encre); border-radius: 2px; z-index: 2; }
  .cal-f { font-size: 12px; line-height: 1.3; display: flex; flex-direction: column; gap: 2px; padding-top: 4px; }
  .curseur { display: grid; grid-template-columns: auto 1fr auto; align-items: center; gap: 8px; font-size: 12px; font-weight: 600; }
  .curseur label { display: inline-flex; align-items: center; gap: 4px; }
  .curseur input { width: 100%; height: 32px; accent-color: var(--encre); }
  .pj { position: relative; height: 70px; margin: 2px 8px 0 72px; border-bottom: 1px solid var(--trait2); }
  .pj-z { position: absolute; left: 0; right: 0; bottom: 0; height: var(--zh); background: #eceaf4; border-top: 1.5px solid #8a8a96; }
  body.abs .pj-z { display: none; }
  .pj-p { position: absolute; width: 8px; height: 8px; margin: 0 0 -4px -4px; border-radius: 50%; background: var(--b); }
  .pj-p.t { border-radius: 2px; }
  .pj-t { display: block; font-size: 12px; color: var(--gris); margin: 4px 0 0 72px; }
  .pj-k { display: flex; gap: 10px; font-size: 12px; margin-left: 72px; } .pj-k span { display: inline-flex; align-items: center; gap: 3px; }
  .sb-leg { display: flex; flex-wrap: wrap; gap: 4px 12px; font-size: 12px; align-items: center; }
  .ecart { font-size: 14px; line-height: 1.3; } .ecart b { font-weight: 700; }
  [data-role="ajout"] { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; font-size: 12px; padding: 6px 8px; border-radius: 8px; background: #f6f6f9; }
  .dz { position: relative; display: grid; grid-template-columns: repeat(var(--nd), 1fr); align-items: end; gap: 4px; height: 120px; margin-top: 4px; }
  .dz-z { position: absolute; top: 0; bottom: 0; background: #f1ecf7; border-left: 1.5px dashed #8a8a96; border-right: 1.5px dashed #8a8a96; }
  .dz-c { position: relative; display: flex; justify-content: center; align-items: flex-end; gap: 2px; height: 100%; }
  .dz-b { width: 12px; border-radius: 2px 2px 0 0; background: var(--b); }
  .dz-b.o { background: #fff; box-shadow: inset 0 0 0 2px var(--b); }
  .dz-b.g { background: #5b5b66; }
  .dz-x { display: grid; grid-template-columns: repeat(var(--nd), 1fr); gap: 4px; font: 500 12px var(--mono); text-align: center; }
  .dz-x .on { font-weight: 700; color: var(--encre); background: #ececf1; border-radius: 4px; }
  .dz-v { display: grid; grid-template-columns: repeat(var(--nd), 1fr); gap: 4px; font: 500 12px var(--mono); text-align: center; color: var(--encre); }
  .dz-k { display: flex; flex-direction: column; gap: 3px; font-size: 12px; line-height: 1.3; } .dz-k > span { display: block; } .dz-k i { margin-right: 4px; vertical-align: -1px; }
  .fx { display: inline-flex; align-items: center; gap: 3px; white-space: nowrap; }
  .dz-k i { width: 10px; height: 10px; border-radius: 2px; display: inline-block; background: var(--b); } .dz-k i.o { background: #fff; box-shadow: inset 0 0 0 2px var(--b); } .dz-k i.g { background: #5b5b66; }
  .averif { font-weight: 700; color: #7a4e00; background: #fff4d6; padding: 0 3px; border-radius: 2px; }
  .mes { display: flex; flex-direction: column; gap: 6px; font-size: 12px; line-height: 1.35; }
  .mo-l { display: grid; grid-template-columns: 96px 1fr; align-items: center; gap: 4px; padding: 2px 0; border-top: 1px solid #ececf1; }
  .mo-l .lab { display: flex; flex-direction: column; font-size: 12px; line-height: 1.15; } .mo-l .lab b { display: inline-flex; align-items: center; gap: 3px; font-size: 13px; } .mo-l .lab small { font: 500 12px var(--mono); color: var(--gris); }
  .mo-l .lpiste .lpi-t { margin: 0 30px 0 28px; }
  .lg-c { position: relative; width: 40px; height: 14px; display: inline-block; flex: none; }
  .lg-c i { position: absolute; top: 2px; bottom: 2px; border-radius: 4px; }
  .lg-c .b { left: 0; right: 0; background: #184078; } .lg-c .h { left: 0; right: 0; background: repeating-linear-gradient(135deg, #fff 0 3px, #184078 3px 4.5px); box-shadow: inset 0 0 0 1.5px #184078; } .lg-c .j { left: 18px; width: 3px; top: 0; bottom: 0; background: var(--encre); }`;
ecrire(path.join(ici, 'etat.html'), page({ titre: 'Le calendrier du dry hop', desc: 'Lot 21 · v3 · Le calendrier du dry hop : les ajouts jour par jour, les repères mesurés (24 h, 2 j, 3 j), le profil simulé qui ne bouge plus (parJour, profils-simules.json) ; la dose réelle du panel et sa lecture contestée ; la levure ; ce qui reste inconnu. Généré par v3/generer.mjs.', css: CSS, corps, js }));
