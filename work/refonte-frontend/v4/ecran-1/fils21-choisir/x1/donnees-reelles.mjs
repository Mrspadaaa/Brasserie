// Lot 21 · x1–x5 · les vraies valeurs de chaque réglage, prêtes pour la page : moteur « pouvoir aromatique »
// (fils19-choix/donnees, via x1/valeurs-reelles.json), comparatifs publiés (donnees/comparatifs-dryhop.json), stock et
// fiches. Chaque valeur garde sa source, son mot de confiance (mesuré, panel, calcul, fiche) et ses marques
// « à vérifier » ou « lu sur figure ».
import { P, CMP, HB, SEC, MES, etude, aVerifier, refCourte, fr } from './socle-x.mjs';

const E = (id) => etude(id);
const m = (e, pred) => e.mesures.find(pred);
// Les mesures en bière par houblon (comparatifs-dryhop.json), et les trous.
export const BIERE = {
  citra: [(() => { const e = E('E06'), x = m(e, (y) => y.variete === 'Citra' && y.compose === 'linalol'), c = m(e, (y) => y.variete === 'Centennial' && y.compose === 'linalol');
    return { txt: 'linalol ' + fr(x.valeur) + ' µg/L', detail: 'dry hop, dose non indiquée ; Centennial ' + fr(c.valeur) + ', témoin ' + fr(m(e, (y) => /témoin/.test(y.variete) && y.compose === 'linalol').valeur), src: refCourte(e) + ', ' + x.lecture, mot: 'mesuré', verifier: aVerifier(x), figure: x.lecture === 'figure', compose: 'linalol', famille: 'floral' }; })()],
  cascade: [(() => { const e = E('E04'), a = m(e, (y) => /OHAI/.test(y.descripteur || '') && y.dose_gL === 2), b = m(e, (y) => /OHAI/.test(y.descripteur || '') && y.dose_gL === 16);
    return { txt: 'intensité ' + fr(a.valeur) + ' → ' + fr(b.valeur) + ' sur 15', detail: 'de 2 à 16 g/L, 24 h : 8 fois la dose, 2 fois l’intensité', src: refCourte(e) + ', tableau 3', mot: 'panel', verifier: aVerifier(a) || aVerifier(b), figure: false, famille: null }; })(),
  (() => { const e = E('E04'), a = m(e, (y) => /linalol/.test(y.compose || '') && y.dose_gL === 2), b = m(e, (y) => /linalol/.test(y.compose || '') && y.dose_gL === 16);
    return { txt: 'linalol extrait ' + a.valeur + ' % → ' + b.valeur + ' %', detail: 'de 2 à 16 g/L : la saturation, mesurée', src: refCourte(e) + ', texte', mot: 'mesuré', verifier: false, figure: false, compose: 'linalol', famille: 'floral' }; })()],
  galaxy: [{ trou: true, txt: 'aucune mesure en bière', detail: 'aucune comparaison chiffrée de Galaxy trouvée (J, 10 études)', src: 'recherche J, comparatifs-dryhop.json' }],
  idaho7: [(() => { const e = E('E03'), x = m(e, (y) => y.variete === 'Idaho-7' && y.compose === 'linalol');
    return { txt: 'linalol ' + fr(x.valeur * 1000) + ' µg/L', detail: 'au pitch, pas un dry hop ; une seule étude', src: refCourte(e) + ', ' + x.lecture.split(',')[0], mot: 'mesuré', verifier: true, figure: false, compose: 'linalol', famille: 'floral' }; })()],
};
export const DUREE = [(() => { const e = E('E08'); return { txt: 'l’essentiel en 2 j', detail: 'Eureka!, 2,5 g/L, contacts de 1 à 8 j', src: refCourte(e) + ', texte', mot: 'mesuré' }; })(),
  (() => { const e = E('E10'); return { txt: '1 h = 96 h au nez', detail: 'Cascade 1,43 g/L, bière jeune : aucune différence perçue', src: refCourte(e) + ', texte', mot: 'panel' }; })()];
export const TROUS = ['aucune étude ne mesure Citra contre Cascade en bière à dose égale', 'aucune comparaison chiffrée pour Galaxy', 'une seule étude pour Idaho 7, au pitch', 'aucune mesure qui croise variété, levure et dry hop'];

// Le moteur, par houblon et par moment : rapport au seuil du linalol et du 4MMP, IBU à chaud, ce qui reste.
const rapportDe = (ms, comp) => { const x = ms && ms.find((y) => y.id === 'rapport-' + comp); return x ? (x.inconnu ? { inconnu: true, raison: x.raison, src: x.source } : { ...x.rapport, src: x.source }) : null; };
export function moteur(h, mo) {
  const id = ['citra', 'cascade'].includes(h) ? 'k1-' + h + '-' + mo : mo === 'dryPost' ? 'k2-' + h : null;
  const c = id && MES[id];
  const ibu = c && c.find((y) => y.id === 'ibu'), perte = c && c.find((y) => y.id === 'perte');
  return { lin: c ? rapportDe(c, 'linalol') : { inconnu: true, raison: 'le moteur n’a pas calculé ce moment pour ' + HB[h].nom, src: 'fils19-choix/donnees' },
    mmp: c ? rapportDe(c, '4MMP') : { inconnu: true, raison: 'le moteur n’a pas calculé ce moment pour ' + HB[h].nom, src: 'fils19-choix/donnees' },
    ibu: ibu ? { v: ibu.valeur, min: ibu.plage[0], max: ibu.plage[1], src: ibu.source, dose: 4 } : null, perte: perte || null, cas: id };
}
// L'IBU d'un ajout à chaud à une autre dose : proportionnelle à la masse (Tinseth), et à l'α pour un autre houblon.
export function ibuA(h, mo, dose) {
  if (SEC(mo)) return null;
  const ref = moteur(['citra', 'cascade'].includes(h) ? h : 'citra', mo).ibu; if (!ref) return null;
  const k = dose / 4 * (['citra', 'cascade'].includes(h) ? 1 : (HB[h].lot ? HB[h].lot.alpha : (HB[h].alphaFiches[0] + HB[h].alphaFiches[1]) / 2) / 12.5);
  return { v: Math.round(ref.v * k), min: Math.round(ref.min * k), max: Math.round(ref.max * k), src: ref.src + (k !== 1 ? ' ; mis à l’échelle de la dose' + (['citra', 'cascade'].includes(h) ? '' : ' et de l’α du lot') + ' (calcul)' : '') };
}
// L'IBU de la stout avant tout ajout (Nugget 46 g à 60′) : le calcul de l'app, cas c1 du lot 15.
import fs from 'node:fs';
const C1 = JSON.parse(fs.readFileSync(new URL('../../fils15-s5-complexe/donnees/c1.json', import.meta.url), 'utf8'));
export const IBU_BIERE = { v: C1.ibu, src: 'IBU de ma bière : calcul de l’app (fils15-s5-complexe/donnees/c1.json)' };
// Tout ce qu'une page interactive peut demander, en un objet.
export function tableReelle() {
  const T = { moteur: {}, ibu: {}, biere: BIERE, duree: DUREE, trous: TROUS, style: { ibu: P.style.ibu, src: P.style.source, ibuBiere: IBU_BIERE.v, ibuSrc: IBU_BIERE.src } };
  for (const h of ['citra', 'cascade', 'galaxy', 'idaho7']) for (const mo of Object.keys(P.moments)) {
    T.moteur[h + '|' + mo] = moteur(h, mo);
    for (const d of [1, 2, 4, 8]) { const x = ibuA(h, mo, d); if (x) T.ibu[h + '|' + mo + '|' + d] = x; }
  }
  return T;
}
