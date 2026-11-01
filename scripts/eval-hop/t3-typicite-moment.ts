// Voie t3 : une typicité PAR MOMENT serait-elle la vraie correction ? (question du pilote, 31.10)
// La typicité de Beer Analytics (part des recettes du style qui contiennent le houblon, et concentration du houblon dans la famille) compte tous les usages du houblon dans le style, amertume comprise.
// Beer Analytics ne publie PAS la typicité par moment (graphique « usage-types » par houblon seulement, sans le style). Seule approximation possible : part dans le style × part au frais du houblon
// (suppose que la part au frais ne dépend pas du style : à vérifier, non vérifiable sur la source). Ce script montre, pour des houblons de 22A et de stout, le palier actuel et le palier de cette approximation.
//   npx vite-node scripts/eval-hop/t3-typicite-moment.ts
import { palierDePart, poserTypicite, typiciteDe, usageAuFrais } from '../../src/domain/hopIndex/v4/typicite';
import { chargerTable } from './f9-commun';

const CAS: [string, string[]][] = [
  ['22A (double IPA)', ['citra', 'mosaic', 'centennial', 'cascade', 'amarillo', 'simcoe', 'cashmere', 'columbus', 'nugget', 'warrior', 'chinook', 'target']],
  ['15B (stout sec irlandais)', ['east-kent-goldings', 'fuggle', 'target', 'willamette', 'nugget', 'columbus', 'challenger', 'northdown']],
];
chargerTable();
for (const [style, ids] of CAS) {
  const code = style.slice(0, 3).trim();
  console.log(`--- ${style}`);
  console.log('houblon              part style  palier actuel   frais   part×frais  palier au frais   écart');
  for (const id of ids) {
    const t = typiciteDe(id, code), f = usageAuFrais(id);
    const part = t.part, corr = part !== null && f ? part * f.part : null, palierCorr = corr === null ? null : palierDePart(corr);
    const ligne = [id.padEnd(20), (part === null ? '—' : `${(part * 100).toFixed(1)} %`).padEnd(10), String(t.palier ?? '?').padEnd(14), (f ? `${Math.round(f.part * 100)} %` : '?').padEnd(7),
      (corr === null ? '—' : `${(corr * 100).toFixed(2)} %`).padEnd(11), String(palierCorr ?? '?').padEnd(17), palierCorr !== null && t.palier !== null && palierCorr !== t.palier ? `${t.palier} → ${palierCorr}` : ''];
    console.log(ligne.join(' '));
  }
}
poserTypicite(null);
