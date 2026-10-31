// v2-verite-croisee (31.10) : les fiches Beer Analytics sans varietyId, que la table de typicité ignore : où l'analyseur de rattachement les mettrait.
// Lancement depuis la racine : node work/missions/2026-10-25-integration-houblons/voies/v2-verite-croisee/mesure3.mjs
import fs from 'node:fs';
import path from 'node:path';
import { analyser, lireSources, lireTable, SOURCES_NOMS, cleFiche } from '../../../../../src/data/hopV4/rattachement.mjs';

const R = process.cwd();
const proto = JSON.parse(fs.readFileSync(path.join(R, 'src/data/hopV4/proto-data.json'), 'utf8'));
const dir = path.join(R, 'src/data/hopSources');
const ba = fs.readdirSync(dir).filter((f) => /^beeranalytics-[A-Z]\.json$/.test(f)).sort().flatMap((f) => JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')).fiches);
const src = lireSources(SOURCES_NOMS); src.set('beeranalytics', ba);
const D = analyser(src, proto.varieties.map((v) => ({ id: v.id, name: v.name, aliases: v.aliases ?? [], origin: v.origin })), lireTable());
const ids = new Set(proto.varieties.map((v) => v.id));
const out = { total: ba.length, avecIdOrigine: 0, sansIdOrigine: 0, sansIdVersBase: 0, sansIdVersNouvelle: 0, sansIdNonRattachee: 0, avecStyles: 0, avecStylesSansId: 0, versBaseAvecStylesGE1000: [], nonRattacheeGE1000: [], nouvelleGE1000: [] };
ba.forEach((f, i) => {
  const d = D.decisions.get(cleFiche('beeranalytics', i));
  const styles = (f.stats?.['typical-styles-relative']?.parStyle ?? []).length > 0, rec = f.champs?.recettes?.valeur ?? 0;
  if (styles) out.avecStyles++;
  if (f.varietyId) { out.avecIdOrigine++; return; }
  out.sansIdOrigine++;
  if (styles) out.avecStylesSansId++;
  if (d?.id && ids.has(d.id)) { out.sansIdVersBase++; if (styles && rec >= 1000) out.versBaseAvecStylesGE1000.push(`${f.nom}→${d.id} (${rec})`); }
  else if (d?.id) { out.sansIdVersNouvelle++; if (styles && rec >= 1000) out.nouvelleGE1000.push(`${f.nom}→${d.id} (${rec})`); }
  else { out.sansIdNonRattachee++; if (styles && rec >= 1000) out.nonRattacheeGE1000.push(`${f.nom} [${d?.statut}] (${rec})`); }
});
console.log(JSON.stringify(out, null, 1));
fs.writeFileSync(path.join(R, 'work/missions/2026-10-25-integration-houblons/voies/v2-verite-croisee/mesures3.json'), JSON.stringify(out, null, 1));
