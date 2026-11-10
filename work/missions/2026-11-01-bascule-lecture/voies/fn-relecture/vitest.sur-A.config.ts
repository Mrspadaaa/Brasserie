// Rejoue les tests ajoutés/adaptés de fn-csv8 contre le code de HEAD (A), sans remettre aucun fichier du dépôt à HEAD :
// un plugin redirige tout import de `functions/src/<x>` vers la copie de HEAD extraite dans os.tmpdir()/headsrc (git archive HEAD functions/src).
// Un module absent de HEAD (invoiceScanVote) reste celui du dépôt.
import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';
import { existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import base from '../../../../../vitest.config';

const root = fileURLToPath(new URL('../../../../../', import.meta.url));
const repoSrc = path.resolve(root, 'functions/src');
const headSrc = path.resolve(tmpdir(), 'headsrc/functions/src');
const norm = (p: string) => p.replace(/\\/g, '/');

export default defineConfig({
  ...(base as any),
  root,
  plugins: [
    ...((base as any).plugins ?? []),
    {
      name: 'sur-A', enforce: 'pre' as const,
      async resolveId(this: any, source: string, importer?: string) {
        if (!importer) return null;
        const imp = norm(importer);
        if (imp.startsWith(norm(headSrc)) && !source.startsWith('.') && !path.isAbsolute(source))
          return this.resolve(source, path.join(repoSrc, 'ai.ts'), { skipSelf: true });
        if (!source.startsWith('.')) return null;
        const target = norm(path.resolve(path.dirname(importer), source)).replace(/\.js$/, '');
        const rel = norm(path.relative(repoSrc, target));
        if (!rel.startsWith('..') && !rel.startsWith('node_modules')) {
          const head = path.join(headSrc, rel + '.ts');
          if (existsSync(head)) return head;
        }
        return null;
      }
    }
  ],
  test: { ...(base as any).test, exclude: [], environmentMatchGlobs: [], include: [
    'tests/unit/invoiceScanCsv8.test.ts', 'tests/unit/invoiceScanBudget.test.ts', 'tests/unit/invoiceScanTransport.test.ts',
    'tests/unit/banc-lecture-facture.test.ts', 'tests/unit/depense/rapprochement/lecture-coupee.test.ts'
  ] }
});
