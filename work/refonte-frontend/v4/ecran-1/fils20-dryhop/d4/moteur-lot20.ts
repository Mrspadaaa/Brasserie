// Lot 20 · d4 et d5 : les sorties du moteur « pouvoir aromatique » (prototypes/houblons-v4/src/engine/
// pouvoir.ts, lecture seule) pour les cas de ces maquettes, sur la recette S1 (16D), comme
// scripts/pouvoir-cas.ts. Les générateurs lisent ce JSON au lieu de refaire les calculs de H.
//  - d4 : Citra 2 g/L 3 j puis Idaho 7 2 g/L 5 j (le cas du brasseur, doses du moteur), pour chaque
//    levure (US-05, Verdant, Pomona, Diamond) et chaque moment (actif : J+2 et J+5 ; après : J+7 et J+10).
//  - d5 : Cascade 4 g/L après fermentation, J+7, 3 j : la variété, puis chaque lot du fichier du moteur ;
//    Idaho 7 de même avec son certificat.
// Usage (depuis prototypes/houblons-v4) : node_modules/.bin/vite-node <ce fichier>
import fs from 'node:fs';
import path from 'node:path';
import { pouvoirRecette, DONNEES_POUVOIR, FACTEUR_ELEVE, type AjoutPouvoir, type RecettePouvoir, type Plage } from '../../../../../../prototypes/houblons-v4/src/engine';
import { s1Recipe } from '../../../../../../prototypes/houblons-v4/src/pack/buildPack';

const ICI = 'C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie/work/refonte-frontend/v4/ecran-1/fils20-dryhop/d4';
const S1 = (yeastId: string, adds: AjoutPouvoir[]): RecettePouvoir => ({ ...s1Recipe(), yeastId, additions: [...s1Recipe().additions, ...adds] });
const dh = (id: string, hopKey: string, gL: number, day: number, dureeJours: number, moment: 'dryActive' | 'dryPost', extra: Partial<AjoutPouvoir> = {}): AjoutPouvoir => ({ id, hopKey, moment, grams: gL * 20, day, dureeJours, ...extra });
const srcs = (l: { cle: string }[]) => l.map((s) => s.cle);
const dr = (d: { id: string; titre: string; statut: string; pourquoi: string; sources: { cle: string }[] }) => ({ id: d.id, titre: d.titre, statut: d.statut, pourquoi: d.pourquoi, sources: srcs(d.sources) });
const g = (x: { plage: Plage | null; unite: string; base: string; niveau: string | null; sources: { cle: string }[]; inconnu: string | null }) => ({ plage: x.plage, unite: x.unite, base: x.base, niveau: x.niveau, sources: srcs(x.sources), inconnu: x.inconnu });

const LEVURES = { us05: 'fermentis-us05', verdant: 'lalbrew-verdant-ipa', pomona: 'lalbrew-pomona', diamond: 'lalbrew-diamond' };
const out: any = { _origine: 'prototypes/houblons-v4/src/engine/pouvoir.ts (pouvoirRecette), recette S1, ' + new Date().toISOString().slice(0, 10), facteurEleve: FACTEUR_ELEVE, d4: {}, d5: {}, sources: {}, hsiClasses: DONNEES_POUVOIR.hsi, levures: DONNEES_POUVOIR.levures, hopCreep: DONNEES_POUVOIR.hopCreep, biotransformation: DONNEES_POUVOIR.biotransformation, style16D: DONNEES_POUVOIR.styles['16D'] };
for (const [lid, yid] of Object.entries(LEVURES)) for (const mom of ['actif', 'apres'] as const) {
  const m = mom === 'actif' ? 'dryActive' : 'dryPost', j0 = mom === 'actif' ? 2 : 7;
  const p = pouvoirRecette(S1(yid, [dh('citra', 'beermaverick-citra', 2, j0, 3, m), dh('idaho7', 'beermaverick-idaho-7', 2, j0 + 3, 5, m)]));
  for (const s of [...p.drapeaux.flatMap((d) => d.sources), ...p.ajouts.flatMap((a) => a.drapeaux.flatMap((d) => d.sources))]) out.sources[s.cle] = { titre: s.titre, niveau: s.niveau, annee: s.annee };
  out.d4[lid + '|' + mom] = {
    levure: p.levure, contact: p.contact,
    drapeaux: p.drapeaux.map(dr),
    ajouts: p.ajouts.filter((a) => a.id !== 'a1').map((a) => ({ id: a.id, nom: a.nom, moment: a.momentLabel, doseGL: a.doseGL, jour: a.jour, dureeJours: a.dureeJours, drapeaux: a.drapeaux.map(dr) })),
    faceAuStyle: p.pouvoir.faceAuStyle, famillesNonDecrites: p.pouvoir.famillesNonDecrites, facteurEleve: p.pouvoir.facteurEleve,
  };
}
const COMP = ['linalol', 'geraniol', '4MMP', 'myrcene'] as const;
const casD5 = (hop: string, lot?: string) => {
  const p = pouvoirRecette(S1('fermentis-us05', [dh('h', hop, 4, 7, 3, 'dryPost', lot ? { lot } : {})]));
  const a = p.ajouts.find((x) => x.id === 'h')!;
  for (const s of [...a.drapeaux.flatMap((d) => d.sources), ...a.huile.sources, ...COMP.flatMap((c) => [...a.composes[c].charge.sources, ...a.composes[c].concentration.sources, ...a.composes[c].rapport.sources])]) out.sources[s.cle] = { titre: s.titre, niveau: s.niveau, annee: s.annee };
  return {
    lot: a.lot, huile: g(a.huile), chargeHuile: g(a.chargeHuile), alpha: a.amertume.alpha,
    composes: Object.fromEntries(COMP.map((c) => [c, { nom: a.composes[c].nom, teneur: g(a.composes[c].teneur), charge: g(a.composes[c].charge), concentration: g(a.composes[c].concentration), rapport: g(a.composes[c].rapport), lecture: a.composes[c].lecture, lotsHorsPlage: a.composes[c].lotsHorsPlage }])),
    familles: Object.fromEntries(Object.entries(a.familles).map(([f, s]) => [f, { lecture: s.lecture, dominant: s.dominant }])),
    faceAuStyle: a.pouvoir.faceAuStyle, famillesNonDecrites: a.pouvoir.famillesNonDecrites,
    drapeaux: a.drapeaux.map(dr),
  };
};
for (const lot of [undefined, 'CAS-2400', 'CAS-2401', 'CAS-2519', 'CAS-2520', 'samia-2026', 'kishimoto-2006']) out.d5['cascade|' + (lot ?? 'variete')] = casD5('beermaverick-cascade', lot);
for (const lot of [undefined, 'ID7-2573']) out.d5['idaho7|' + (lot ?? 'variete')] = casD5('beermaverick-idaho-7', lot);
fs.writeFileSync(path.join(ICI, 'moteur-lot20.json'), JSON.stringify(out, null, 1));
for (const [k, v] of Object.entries<any>(out.d4)) console.log(k.padEnd(14), v.ajouts.map((a: any) => a.nom + ' ' + a.drapeaux.filter((d: any) => /geraniol|thiols/.test(d.id)).map((d: any) => d.id.slice(0, 8) + ':' + d.statut).join(' ; ')).join(' | '), '| style:', v.faceAuStyle.statut, v.famillesNonDecrites.join(','));
for (const [k, v] of Object.entries<any>(out.d5)) console.log(k.padEnd(22), 'huile', JSON.stringify(v.chargeHuile.plage), 'lin', JSON.stringify(v.composes.linalol.charge.plage), 'lin÷s', JSON.stringify(v.composes.linalol.rapport.plage), v.composes.linalol.lecture.classe, '4MMP÷s', JSON.stringify(v.composes['4MMP'].rapport.plage), '|', v.faceAuStyle.statut, v.famillesNonDecrites.join(','), '|', v.drapeaux.map((d: any) => d.id).join(','));
