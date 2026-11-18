// Les tests de Dépense qui importent `qrLecture.ts` (zxing-wasm, pdf.js) ne se chargent pas dans ce worktree : ces paquets manquent au node_modules
// partagé. Cette config reprend celle du dépôt et les prend dans la copie de banc qui les a. Usage : npx vitest run --config <ce fichier> tests/unit/depense
import base from '../../../../vitest.config.ts';
const COPIE = 'C:/Users/mrspa/AppData/Local/Temp/deploy-hosting-qr/node_modules';
const b: any = typeof base === 'function' ? await (base as any)({ command: 'serve', mode: 'test' }) : base;
const alias = [...(Array.isArray(b.resolve?.alias) ? b.resolve.alias : []),
  { find: /^zxing-wasm\/reader\/zxing_reader\.wasm(?=\?|$)/, replacement: `${COPIE}/zxing-wasm/dist/reader/zxing_reader.wasm` },
  { find: /^zxing-wasm\/reader$/, replacement: `${COPIE}/zxing-wasm/dist/es/reader/index.js` },
  { find: /^pdfjs-dist(?=\/|$)/, replacement: `${COPIE}/pdfjs-dist` }];
export default { ...b, resolve: { ...(b.resolve ?? {}), alias } };
