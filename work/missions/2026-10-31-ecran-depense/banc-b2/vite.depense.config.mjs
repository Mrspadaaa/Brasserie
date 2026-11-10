// Banc B2 (Dépense) : le build figé de l'app en mode développement (`?dev-local&depense=<état>`), pour le critique. La config du dépôt, plus
// `pdfjs-dist` et `zxing-wasm` (déclarés dans package.json, absents du node_modules partagé) pris dans la copie de banc qui les a ; sans elle, ils
// sont externalisés et les états PDF et QR ne se chargent pas (le dire dans le rapport).
// Usage, depuis la racine : NODE_ENV=development npx vite build --mode development --config work/missions/2026-10-31-ecran-depense/banc-b2/vite.depense.config.mjs --outDir <dossier>
import fs from 'node:fs';
import base from '../../../../vite.config.ts';

const COPIE = 'C:/Users/mrspa/AppData/Local/Temp/deploy-hosting-qr/node_modules';
const MANQUANTS = ['pdfjs-dist', 'zxing-wasm'];

export default async (env) => {
  const b = typeof base === 'function' ? await base(env) : base;
  const la = MANQUANTS.filter(m => fs.existsSync(`${COPIE}/${m}`));
  // zxing-wasm passe par les « exports » de son paquet : ses deux sous-chemins vont à leurs fichiers ; pdf.js se résout depuis son dossier.
  const exacts = { 'zxing-wasm': [['zxing-wasm/reader/zxing_reader.wasm', 'dist/reader/zxing_reader.wasm'], ['zxing-wasm/reader', 'dist/es/reader/index.js']] };
  const alias = [...(b.resolve?.alias ?? []), ...la.flatMap(m => (exacts[m]
    ? exacts[m].map(([de, vers]) => ({ find: new RegExp(`^${de.replace(/[.]/g, '\\.')}(?=\\?|$)`), replacement: `${COPIE}/${m}/${vers}` }))
    : [{ find: new RegExp(`^${m}(?=/|$)`), replacement: `${COPIE}/${m}` }]))];
  const absents = MANQUANTS.filter(m => !la.includes(m));
  const ro = b.build?.rollupOptions ?? {};
  return {
    ...b, resolve: { ...(b.resolve ?? {}), alias },
    build: { ...(b.build ?? {}), rollupOptions: { ...ro, external: [...(Array.isArray(ro.external) ? ro.external : []), ...absents.map(m => new RegExp(`^${m}(/|$)`))] } },
  };
};
