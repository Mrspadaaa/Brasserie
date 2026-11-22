// Build de test de la chaîne PRODUIRE (21.11). Reprend la config du parcours de port-carnet (DEV vrai, fixture par localStorage),
// puis redirige `data/seedData` vers le modèle COMMITTÉ `seedData.example.ts` : `src/data/seedData.ts` n'est jamais importé.
import { pathToFileURL } from 'node:url';
import path from 'node:path';

const PORT_CARNET = 'C:/Users/mrspa/.codex/worktrees/openai-clean-start/port-carnet';
const parcours = (await import(pathToFileURL(path.join(PORT_CARNET, 'scripts/parcours/vite.parcours.config.mjs')).href)).default;
const MODELE = path.join(PORT_CARNET, 'src/data/seedData.example.ts').replace(/\\/g, '/');

export default async (env) => {
  const c = await parcours(env);
  c.plugins = [
    {
      name: 'produire-seed-modele',
      enforce: 'pre',
      resolveId(source) {
        if (/(^|\/)data\/seedData$/.test(source)) return MODELE;
        return null;
      }
    },
    ...c.plugins
  ];
  return c;
};
