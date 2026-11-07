// Vitest avec les alias du banc (pdfjs-dist et zxing-wasm pris dans `%TEMP%/deploy-hosting-qr/node_modules`, absents du node_modules partagé) : sans eux, 29 suites de tests/unit/depense
// (celles qui montent ExpenseSheet) ne se chargent pas ici (« Failed to resolve import zxing-wasm/reader »), donc ne protègent rien.
// La config est celle de `vitest.config.ts` (env, setup, inclusion) ; seuls les alias s'ajoutent.
// Usage, depuis la racine : npx vitest run --config work/missions/2026-10-31-ecran-depense/banc-b2/vitest.depense.config.mjs tests/unit/depense
import fs from 'node:fs';
import path from 'node:path';
import base from '../../../../vitest.config.ts';

const COPIE = 'C:/Users/mrspa/AppData/Local/Temp/deploy-hosting-qr/node_modules';
export default async (env) => {
  const b = typeof base === 'function' ? await base(env) : base;
  const alias = [...(Array.isArray(b.resolve?.alias) ? b.resolve.alias : Object.entries(b.resolve?.alias ?? {}).map(([find, replacement]) => ({ find, replacement })))];
  if (fs.existsSync(`${COPIE}/pdfjs-dist`)) alias.push({ find: /^pdfjs-dist(?=\/|$)/, replacement: `${COPIE}/pdfjs-dist` });
  if (fs.existsSync(`${COPIE}/zxing-wasm`)) alias.push({ find: /^zxing-wasm\/reader\/zxing_reader\.wasm(?=\?|$)/, replacement: `${COPIE}/zxing-wasm/dist/reader/zxing_reader.wasm` }, { find: /^zxing-wasm\/reader(?=\?|$)/, replacement: `${COPIE}/zxing-wasm/dist/es/reader/index.js` });
  return { ...b, root: path.resolve(import.meta.dirname, '../../../..'), resolve: { ...(b.resolve ?? {}), alias } };
};
