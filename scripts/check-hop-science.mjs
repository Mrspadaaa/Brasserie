// Offline benchmark: no network, database, paid AI, or generated production data.
import { build } from 'esbuild';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const compiled = await build({
  absWorkingDir: root, entryPoints: [resolve(root, 'tests/scientific/hopSecondPass.ts')],
  bundle: true, platform: 'node', format: 'esm', write: false, metafile: true, logLevel: 'silent',
});
const forbiddenInputs = Object.keys(compiled.metafile.inputs).filter(path =>
  /(?:node_modules\/(?:firebase|@firebase)|src\/services\/|functions\/src\/(?:ai|firebase)\.)/.test(path.replaceAll('\\', '/')));
if (forbiddenInputs.length) throw Error('Scientific benchmark gained remote dependencies: ' + forbiddenInputs.join(', '));
const { runHopScientificBenchmark, runHopSecondPass } = await import('data:text/javascript;base64,' + Buffer.from(compiled.outputFiles[0].text).toString('base64'));
const report = { ...runHopScientificBenchmark(), secondPass: runHopSecondPass() };
process.stdout.write(JSON.stringify(report, null, 2) + '\n');
if (report.failures.length || report.secondPass.failures.length) process.exitCode = 1;
