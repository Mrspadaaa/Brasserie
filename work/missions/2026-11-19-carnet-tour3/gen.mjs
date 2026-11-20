// Met à jour work/missions/BUGS.md avec le tri du carnet, tour 3, et écrit RAPPORT.md.
// Usage : node gen.mjs <tag-en-ligne> [ids-vérifiés-en-ligne séparés par des virgules]
import fs from 'fs';
import { execSync } from 'child_process';
const TAG = process.argv[2]; if (!TAG) throw new Error('tag manquant');
const VERIFIES = new Set((process.argv[3] || '').split(',').filter(Boolean));
const PC = 'C:/Users/mrspa/.codex/worktrees/openai-clean-start/port-carnet';
const BUGS = process.env.BUGS || '../BUGS.md';
const LOCAL = TAG === 'local';
const jour = new Set(execSync(`git -C ${PC} log --format=%h en-ligne/2026-11-19-tour2..${LOCAL ? 'HEAD' : TAG}`).toString().trim().split('\n').map((s) => s.slice(0, 9)));
const fin = JSON.parse(fs.readFileSync('FINAL.json', 'utf8'));
const shas = (x) => x.hist.flatMap((e) => (e[1] + ' ' + e[2]).match(/\b[0-9a-f]{9}\b/g) || []);
const choix = 'ouvert — choix du brasseur, à dessiner en mini maquettes (règle n° 1)';
const gem = 'ouvert — non vérifiable sans Gemini (aucun envoi réel accordé)';
const O = {
  'LR3-4': ['corrige', '7b199eb85', 'même règle que LR2-5 ; compte rendu lisible (84551fc8e, aaf52d272)'],
  'PCN-160': ['corrige', '', 'réponse Gemini enregistrée du test en ligne 2 rejouée : carnetsEnLigne2 n° 1 vert'],
  'PCN-104': ['corrige', '', 'réponses enregistrées rejouées : carnetsEnLigne2 n° 2-4 et carnetsEnLigne4 verts'],
  'PCN-15': [gem], 'PCN-44': [gem], 'PCN-50': [gem], 'PCN-8': [gem + ' (photo, caractéristiques, marque : aucune réponse enregistrée)'],
  'LL-8': [gem + ' (relecture de ses 13 pièces)'], 'SU-NOTE-6': [gem + ' (délais serveur)'],
  'LR1-14': ['ecarte', '', 'non reproduit en local (v5b) ; en ligne, toute écriture de 2026 rouvre les vérifications de clôture : voulu ; les tests en ligne ne confirment plus de dépense ZZ'],
  'TE-NOTE-3': ['ouvert — « Enregistrer et télécharger » : téléchargement du PDF à accorder par le brasseur'],
  'E1-2': ['ecarte', 'd1848500b', 'non reproduit : code (2 témoins) et banc f10 (1 rangée, unité gardée)'],
  'TE-35': ['corrige', 'e1500f2e8', 'déjà corrigé (MoneyInput/ChampNombre) ; preuve ajoutée'],
  'LR1-7': ['corrige', '1a57b53e4', 'prix déduit dit en mots (452b7babc, 1a57b53e4), vu en capture f10'],
  'LR2-NOTE-2': ['ecarte', '', 'choix B2 n° 5 : une seule casse « Kg » à l\'écran'],
  'T2-3': ['ouvert — pris par la session t3-corrections (Frise.tsx)'], 'T2-4': ['ouvert — pris par la session t3-corrections (TransactionDetails.tsx)'],
  'PCN-27': [choix], 'PCN-77': [choix], 'PCN-117': [choix], 'PCN-141': [choix + ' (où vit « Prochain brassin »)'], 'PCN-111': [choix], 'TL-46': [choix + ' (« Saisir sans justificatif » : écran à bandes ?)'],
  'PCN-103': ['corrige', '1f243127a', 'bulle G8 entière, vue par la critique tour 2 (v5a n° 2)'],
  'PCN-146': ['ecarte', '', 'voulu par la critique 7 (création visible avant la confirmation)'],
  'PCN-37': ['ouvert — à jouer sur un vrai téléphone (390×660, clavier ouvert)'],
  'TL-NOTE-6': ['en cours — joué en ligne en partie (e1) ; reste : TVA, Préparer un brassin, Budget, Suivre au stock'],
};
const etat = (x) => {
  const o = O[x.id];
  const cat = o ? (o[0] === 'corrige' || o[0] === 'ecarte' ? o[0] : 'texte') : x.cat;
  const s = o?.[1] || [...shas(x)].reverse().find((h) => jour.has(h)) || [...shas(x)].reverse()[0] || '';
  const note = o?.[2] || `voie ${x.der} : ${x.verdict.slice(0, 160)}`;
  if (cat === 'texte') return { e: o[0], c: '', n: '' };
  if (cat === 'corrige' && !s) return { e: 'corrigé (vu au banc local du port, 19-20.11 ; non déployé)', c: '6f0282d15', n: `tour 3 (20.11) : vu au code de 6f0282d15 ; ${note}` };
  if (cat === 'corrige') {
    const e = VERIFIES.has(x.id) ? `vérifié en ligne (${TAG})` : jour.has(s) ? (LOCAL ? 'corrigé (port-carnet, non déployé)' : `déployé (${TAG})`) : 'déployé (corrigé avant, vu au code du tag en-ligne/2026-11-19-tour2)';
    return { e, c: s, n: `tour 3 (20.11) : ${note}` };
  }
  if (/^doublon/.test(x.verdict)) { const d = (x.hist.map((e) => e[2]).join(" ").match(/(?:[A-Z][A-Z0-9]*-)+(?:NOTE-)?d+/g) || []).find((v) => v !== x.id); return { e: d ? `doublon de ${d}` : 'écarté (doublon)', c: '', n: '' }; }
  if (cat === 'ecarte') return { e: `écarté (${note})`, c: s, n: '' };
  if (cat === 'gemini') return { e: gem, c: '', n: `tour 3 : ${note}` };
  return { e: `ouvert — ${x.verdict.slice(0, 120)}`, c: s, n: '' };
};
const lignes = fs.readFileSync(BUGS, 'utf8').split('\n');
const parId = new Map(fin.filter((x) => !x.neuf).map((x) => [x.id, x]));
let n = 0; const compte = {};
for (let i = 0; i < lignes.length; i++) {
  if (!lignes[i].startsWith("| ")) continue; const c = lignes[i].split("|").slice(1, -1).map((s) => s.trim()); if (c.length !== 8) continue;
  const id = c[0]; const x = parId.get(id); if (!x || !/^ouvert/.test(c[5])) continue;
  const r = etat(x); c[5] = r.e.replace(/\|/g, '/'); if (r.c) c[6] = r.c;
  if (r.n) c[7] = (c[7] ? c[7] + " ; " : "") + r.n.split("|").join("/");
  lignes[i] = "| " + c.join(" | ") + " |"; n++; const k = r.e.split(/[ (—]/)[0]; compte[k] = (compte[k] || 0) + 1; parId.delete(id);
}
fs.writeFileSync(BUGS, lignes.join('\n'));
console.log('lignes changées', n, compte, 'non trouvées', [...parId.keys()].join(' '));
fs.writeFileSync('COMPTE.json', JSON.stringify({ n, compte }, null, 1));
