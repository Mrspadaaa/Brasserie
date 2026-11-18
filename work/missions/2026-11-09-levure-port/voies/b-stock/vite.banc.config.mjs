import { defineConfig, mergeConfig } from 'vite';
import base from '../../../../../vite.config.ts';
export default defineConfig(async (env) => mergeConfig(typeof base === 'function' ? await base(env) : base, {
  root: 'C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie',
  cacheDir: 'C:/Users/mrspa/AppData/Local/Temp/claude/2574149e6fd34767/16fc09ec-4e69-48a9-9744-5912b6ef6552/scratchpad/cache-apres',
  server: { port: 5652, strictPort: true, fs: { strict: false } }
}));
