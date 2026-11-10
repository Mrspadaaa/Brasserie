// l1-plan : la taille (octets) de la réponse JSON de chaque lecture du banc k6-C (texte du modèle, pensées exclues) ; aucune valeur affichée.
// Le résultat qu'aiTask renvoie est cette lecture normalisée, plus ses points : sa taille est du même ordre.
// Usage : node work/missions/2026-10-31-ecran-depense/voies/l1-plan/octets.mjs <dossier raw>
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
const dossier = process.argv[2];
const parLecture = { Csv81: [], Csv82: [], Csv83: [] };
for (const nom of readdirSync(dossier).filter(n => n.endsWith('.json')).sort()) {
  const brut = JSON.parse(readFileSync(join(dossier, nom), 'utf8'));
  const reponse = brut.response ?? brut.output ?? brut;
  const parts = reponse?.candidates?.[0]?.content?.parts ?? [];
  const texte = parts.filter(p => p.thought !== true && typeof p.text === 'string').map(p => p.text).join('');
  const lecture = Object.keys(parLecture).find(k => nom.includes(k));
  if (!texte) { console.log(`${nom} : aucun texte (clés : ${Object.keys(brut).join(', ')})`); continue; }
  if (lecture) parLecture[lecture].push(Buffer.byteLength(texte));
}
const med = a => { const s = [...a].sort((x, y) => x - y); return s.length ? s[Math.floor(s.length / 2)] : null; };
for (const [k, a] of Object.entries(parLecture)) console.log(`OCTETS ${k} : ${a.length} lectures, médiane ${med(a)}, max ${a.length ? Math.max(...a) : null}`);
