// v2-verite-croisee (31.10) : suite de mesure.mjs. Valeurs qui ne tiennent qu'à UNE source, désaccords de Beer Maverick, exemples.
// Lancement depuis la racine : node work/missions/2026-10-25-integration-houblons/voies/v2-verite-croisee/mesure2.mjs
import fs from 'node:fs';
import path from 'node:path';
import { analyser, lireSources, lireTable, SOURCES_NOMS, cleFiche } from '../../../../../src/data/hopV4/rattachement.mjs';

const R = process.cwd();
const lire = (p) => JSON.parse(fs.readFileSync(path.join(R, p), 'utf8'));
const proto = lire('src/data/hopV4/proto-data.json');
const ajouts = lire('src/data/hopV4/catalogue-ajouts.json');
const comp = lire('src/data/hopV4/complements.json');
const base = proto.varieties, idsBase = new Set(base.map((v) => v.id));
const tous = [...base, ...ajouts.varieties];
const nomSrc = comp.sources.map((s) => s.id);
const mid = (a, b) => (a != null && b != null ? (a + b) / 2 : a ?? b);
const med = (xs) => { if (!xs.length) return null; const s = [...xs].sort((a, b) => a - b); const h = s.length >> 1; return s.length % 2 ? s[h] : (s[h - 1] + s[h]) / 2; };
const bmVal = (v, c) => (c === 'alpha' ? v.alpha : c === 'beta' ? v.beta : c === 'huile' ? v.oil : c === 'cohumulone' ? v.cohumulone : c === 'myrcene' ? v.oils?.myrcene : null);

const CHAMPS = ['alpha', 'beta', 'cohumulone', 'huile', 'myrcene', 'linalol'];
const sortie = { champs: {}, exemples: {} };
for (const c of CHAMPS) {
  let baseBMseul = 0, baseAvecBM = 0, ajoutsUneSource = 0, ajoutsAvecValeur = 0, sansBMperdrait = 0, baseUneAutreSeule = 0;
  const gros = [];
  for (const v of tous) {
    const e = comp.varietes[v.id];
    const par = new Map();
    for (const [k, mn, mx, raison] of e?.c?.[c]?.v ?? []) {
      if (raison) continue;
      const m = mid(mn, mx); if (m == null) continue;
      const s = nomSrc[e.f[k][0]]; const l = par.get(s) ?? []; par.set(s, l); l.push(m);
    }
    const n = par.size, bm = bmVal(v, c);
    if (idsBase.has(v.id)) {
      if (bm) { baseAvecBM++; if (n === 0) baseBMseul++; if (n === 1) baseUneAutreSeule++; }
      if (!bm && n === 0) sansBMperdrait += 0;
      if (bm && n >= 3) {
        const mids = [...par.values()].map((l) => l.reduce((a, b) => a + b, 0) / l.length);
        const mb = mid(bm[0], bm[1]), md = med(mids);
        gros.push({ id: v.id, bm: bm.join('–'), médianeAutres: Math.round(md * 100) / 100, autres: [...par.entries()].map(([s, l]) => `${s}:${(l.reduce((a, b) => a + b, 0) / l.length).toFixed(1)}`).join(' '), écart: Math.round(Math.abs(mb - md) * 100) / 100, rel: Math.round(Math.abs(mb - md) / md * 100) });
      }
    } else if (n >= 1) { ajoutsAvecValeur++; if (n === 1) ajoutsUneSource++; }
  }
  gros.sort((a, b) => b.rel - a.rel);
  sortie.champs[c] = { baseAvecValeurBM: baseAvecBM, baseValeurBMseule: baseBMseul, baseBMplusUneAutre: baseUneAutreSeule, ajoutsAvecValeur, ajoutsValeurUneSeuleSource: ajoutsUneSource };
  sortie.exemples[c] = gros.slice(0, 6);
}

// Un fait sur les 18 « à confirmer » et les ajouts qui sont peut-être déjà dans Beer Maverick sous un autre nom
const table = lireTable();
const A = analyser(lireSources(SOURCES_NOMS), base.map((v) => ({ id: v.id, name: v.name, aliases: v.aliases ?? [], origin: v.origin })), table);
sortie.aConfirmer = A.aConfirmer.map((x) => `${x.k} [${x.sources.join(',')}] → ${x.candidats.join('|')}`);
sortie.nombreDAliasManuels = Object.keys(table.alias).length;
sortie.nombreDeSynonymes = Object.keys(table.synonymes ?? {}).length;

// Les 30 variétés « Beer Maverick seule » et un échantillon de 12 ajouts à une source
const src = lireSources(SOURCES_NOMS);
const parVar = new Map();
for (const [sid, f] of src) f.forEach((x, i) => { const d = A.decisions.get(cleFiche(sid, i)); if (d?.id) { const s = parVar.get(d.id) ?? new Set(); parVar.set(d.id, s); s.add(sid); } });
sortie.baseSansAutreSource = base.filter((v) => !(parVar.get(v.id)?.size)).map((v) => v.name);
sortie.ajoutsUneSourceEchantillon = A.nouvelles.filter((n) => (parVar.get(n.id)?.size ?? 0) === 1).slice(0, 12).map((n) => `${n.name} [${[...parVar.get(n.id)].join(',')}]`);
sortie.ajoutsPeuDeDonnees = { drapeau: ajouts.varieties.filter((v) => v.peuDeDonnees).length, sans: ajouts.varieties.filter((v) => !v.peuDeDonnees).length };
// Beer Maverick : date de relevé et fiches publiées sans date
const bmFiches = lire('src/data/hopBeerMaverickFiches.json');
sortie.bmFichesRelevées = bmFiches.length;
const ann = {}; for (const v of base) { ann[v.bmYear ?? 'null'] = (ann[v.bmYear ?? 'null'] ?? 0) + 1; }
sortie.bmAnnee = ann;
fs.writeFileSync(path.join(R, 'work/missions/2026-10-25-integration-houblons/voies/v2-verite-croisee/mesures2.json'), JSON.stringify(sortie, null, 1));
console.log(JSON.stringify(sortie, null, 1));
