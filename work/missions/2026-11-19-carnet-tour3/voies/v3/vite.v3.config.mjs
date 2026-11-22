// Banc de la voie v3 (lecture seule du code) : la config de port-carnet + deux états d'aperçu de banc, injectés au service (transform), aucun fichier de code écrit.
//  - `?dev-local&depense=v3-lent` : la lenteur `perdue` (provisoire en écart) avec un final retardé de 25 s, pour voir le bloc pendant la lecture provisoire (LR1-6).
//  - `?dev-local&depense=reel-<clé>` : provisoire et final tirés des réponses Gemini ENREGISTRÉES (finals.ts, <tmp>/v3-finals, hors Git), par le vote de production.
// Usage (cwd port-carnet) : npx vite --config <ce fichier> --port 5186 --strictPort
import fs from 'node:fs';
import os from 'node:os';
import base from '../../../../../../port-carnet/vite.config.ts';
const DOSSIER = `${os.tmpdir()}/v3-finals`;
const CLES = { doc25: 'banc-robuste-1__doc25-t2', doc25b: 'banc-robuste-2__doc25-t8', doc14: 'banc-m9-payant__doc14-t1', doc14b: 'banc-m9-payant-t2__doc14-t1', doc2: 'banc-m9-payant-t2__doc2-t1' };
const ENTREE = 'export function apercuDepense(etat: string): ApercuDepense {';
const AJOUT = `
function v3Etat(etat: string): ApercuDepense | null {
  if (etat === 'v3-lent') { const a = apercuLenteur('lenteur-perdue'); return { ...a, etat, delaiMs: 25000 }; }
  if (!etat.startsWith('reel-')) return null;
  const paire = (V3F as any)[etat.slice(5)]; if (!paire) return null;
  const sc: any = Object.values(V3GS).find((v: any) => v && typeof v.normalizeResult === 'function');
  const norm = (r: any) => (sc ? sc.normalizeResult(r) : r);
  const prov = norm(clone(paire.provisoire)), fin = { ...norm(clone(paire.final)), provisoireJeton: 'jeton-v3' };
  const fichier = { name: 'piece-reelle.jpg', size: 400000, type: 'application/pdf' };
  const sortie = (result: any, extra: any = {}) => ({ ok: true, result, proofDataUrl: '', fileName: fichier.name, mimeType: fichier.type, model: 'enregistre', cached: false, ...extra });
  return { outcome: sortie(prov), fichier, stocks: stockSimule(), transactions: [], etat, drive: 'ok', reseau: true, provisoire: sortie(prov, { jeton: 'jeton-v3' }), final: sortie(fin), delaiMs: 450,
    enregistrer: async () => { await pause(600); return { driveFileId: 'simule', fileName: 'piece.pdf', bytes: 400000, sha256: '0'.repeat(64), verified: true, folder: 'banc', webViewLink: 'https://drive.google.com/file/d/simule/view' }; } } as any;
}
`;
const banc = {
  name: 'v3-banc-depense', enforce: 'pre',
  resolveId: (s) => (s === 'virtual:v3-finals' ? '\0v3-finals' : null),
  load(id) {
    if (id !== '\0v3-finals') return null;
    const o = {}; for (const [k, f] of Object.entries(CLES)) { const p = `${DOSSIER}/${f}.json`; if (fs.existsSync(p)) o[k] = JSON.parse(fs.readFileSync(p, 'utf8')); }
    return `export default ${JSON.stringify(o)};`;
  },
  transform(code, id) {
    if (!/src[\/]ui[\/]depense[\/]apercuDev\.ts(\?|$)/.test(id)) return null;
    if (!code.includes(ENTREE)) throw new Error('v3 : point d’entrée absent');
    const tete = `import V3F from 'virtual:v3-finals';\nimport * as V3GS from '../../services/geminiScanner';\n`;
    return tete + code.split(ENTREE).join(`${ENTREE}\n  { const v3 = v3Etat(etat); if (v3) return v3; }`) + AJOUT;
  },
};
export default async (env) => { const b = typeof base === 'function' ? await base(env) : base; return { ...b, cacheDir: `${os.tmpdir()}/v3-vite-cache`, plugins: [banc, ...(b.plugins ?? [])], server: { ...(b.server ?? {}), port: 5186, strictPort: true, hmr: false, watch: null, fs: { ...(b.server?.fs ?? {}), strict: false } } }; };
