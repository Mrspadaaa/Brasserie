// Lot 20 · d4 : ce que l'app dirait aujourd'hui. Appelle la vraie fonction de l'app,
// assessHopBiotransformation (src/domain/hopDecision/biotransformation.ts, en lecture seule), pour
// chaque houblon du lot, chaque levure du brasseur et chaque moment du dry hop.
// Entrées : la β-lyase de chaque levure telle que le catalogue de l'app la porte
// (src/data/yeastCatalogueBootstrap.json) ; les mesures du houblon tirées de donnees-h.json (H) ;
// fermentation « active » ou « terminée » ; un dry hop prévu, avec sa durée. Aucune donnée inventée :
// dextrines et enzymes du lot restent « inconnues », comme dans l'app.
// Usage (depuis la racine du dépôt) : npx vite-node work/refonte-frontend/v4/ecran-1/fils20-dryhop/d4/statuts-app.ts
import fs from 'node:fs';
import path from 'node:path';
import { assessHopBiotransformation, type HopBiotransformationInput } from '../../../../../../src/domain/hopDecision/biotransformation';
import type { HopMeasurement, HopSource } from '../../../../../../functions/src/hopIndexSchema';

const REPO = 'C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie';
const ICI = REPO + '/work/refonte-frontend/v4/ecran-1/fils20-dryhop/d4';
const H = JSON.parse(fs.readFileSync(path.join(ICI, '../donnees-h.json'), 'utf8'));
const CAT = JSON.parse(fs.readFileSync(REPO + '/src/data/yeastCatalogueBootstrap.json', 'utf8')) as any[];
const LEVURES: Record<string, string> = { us05: 'fermentis-us05', verdant: 'lalbrew-verdant-ipa', pomona: 'lalbrew-pomona', diamond: 'lalbrew-diamond' };
const SRC = { ...H.sources, ...H.sources_d4d6 };
const srcH = (ns: (number | string)[], niv: string): HopSource => ({ title: 'Rapport H, sources [' + ns.join('] [') + ']', author: ns.map((n) => SRC[n] || 'H').join(' ; ').slice(0, 200), year: 2026, kind: niv === 'F' ? 'manufacturer' : 'research', reference: 'work/refonte-frontend/v4/recherche/H-choisir-deux-houblons.md' });

function mesures(hid: string, h: any): HopMeasurement[] {
  const m: HopMeasurement[] = [];
  const g = Array.isArray(h.geraniol_pct) ? h.geraniol_pct[0] : null;
  if (g) m.push({ analyte: 'geraniol', unit: 'percentOil', basis: 'oil', kind: 'range', range: { min: g.v[0], max: g.v[1] }, source: srcH(g.src, g.niv), confidence: 'medium' });
  // Précurseurs : présence rapportée (Citra [16], Cascade [17]) ; la valeur n'entre pas dans les statuts.
  const p = H.d4.precurseurs[hid];
  if (p && p.present) m.push({ analyte: hid === 'citra' ? '3mhGsh' : '3mhCys', unit: 'ugKgThiolEquivalent', basis: 'unknown', kind: 'point', value: hid === 'citra' ? 23000 : 1640, source: srcH(p.src, p.niv), confidence: 'low' });
  return m;
}
const out: any = { _origine: 'assessHopBiotransformation (src/domain/hopDecision/biotransformation.ts), lancée le ' + new Date().toISOString().slice(0, 10), levures: {}, statuts: {} };
for (const [id, cid] of Object.entries(LEVURES)) {
  const y = CAT.find((x) => x.id === cid);
  out.levures[id] = { catalogue: cid, nom: y?.name, betaLyase: y?.betaLyase ?? 'unknown' };
}
for (const [hid, h] of Object.entries<any>(H.houblons)) for (const [lid] of Object.entries(LEVURES)) for (const moment of ['actif', 'apres']) {
  const input: HopBiotransformationInput = {
    subjectLabel: h.nom,
    hopMeasurements: mesures(hid, h),
    yeast: { betaLyase: out.levures[lid].betaLyase },
    fermentation: { state: moment === 'actif' ? 'active' : 'finished', temperatureC: null },
    additions: [{ kind: 'dryHop', state: 'planned', contactHours: null, temperatureC: null }],
    stage: 'fermentation',
  };
  const a = assessHopBiotransformation(input);
  out.statuts[hid + '|' + lid + '|' + moment] = Object.fromEntries(a.findings.map((f) => [f.id, { status: f.status, sens: f.statusMeaning, inconnus: f.unknownsThatCouldChangeDecision.length }]));
}
fs.writeFileSync(path.join(ICI, 'statuts-app.json'), JSON.stringify(out, null, 1));
console.log('levures', JSON.stringify(out.levures));
for (const [k, v] of Object.entries<any>(out.statuts)) console.log(k.padEnd(24), Object.entries<any>(v).map(([m, s]) => m + ':' + s.status).join('  '));
