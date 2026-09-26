import { existsSync, mkdirSync, writeFileSync, copyFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';

export function assertFreshClaudeOutput(output) {
  for (const path of [output, `${output}.progress.json`, `${output}.recovery.json`, `${output}.expert.json`, `${output}.artifacts`]) {
    if (existsSync(path)) throw new Error(`Sortie déjà utilisée : ${path}. Conserver ce dossier et choisir une nouvelle sortie pour la suite.`);
  }
}

export function createClaudeArchive({ output, brief, sources, sourceCwd, configured }) {
  assertFreshClaudeOutput(output);
  const root = resolve(`${output}.artifacts`);
  mkdirSync(dirname(root), { recursive: true });
  mkdirSync(root); // Exclusive creation also rejects a concurrent launch on this output.
  const workspace = join(root, 'workspace');
  mkdirSync(workspace);
  writeFileSync(join(root, 'brief.txt'), brief, { flag: 'wx' });
  writeFileSync(join(root, 'request.json'), JSON.stringify({
    createdAt: new Date().toISOString(), sourceCwd, configured,
    sources: sources.map(({ source, staged, size, digest }) => ({ source, staged, size, sha256: digest })),
    retention: 'Conserver entrées, sorties et copies, même après réception. Aucun nettoyage automatique.',
  }, null, 2), { flag: 'wx' });
  // Originals are kept separately from copies Claude may edit.
  for (const file of sources) {
    const dest = join(root, 'inputs', file.staged);
    mkdirSync(dirname(dest), { recursive: true });
    copyFileSync(file.source, dest);
    if (createHash('sha256').update(readFileSync(dest)).digest('hex') !== file.digest) {
      throw new Error(`Source modifiée pendant l'archivage : ${file.source}. Copies conservées dans ${root}.`);
    }
  }
  return { root, workspace, transcriptPath: join(root, 'transcript.jsonl') };
}
