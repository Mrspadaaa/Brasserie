// Instantané de test (hors dépôt) : la config du dépôt, plus `zxing-wasm/*` et `pdfjs-dist/*` externalisés (déclarés dans package.json à HEAD,
// jamais installés dans le node_modules partagé ; imports dynamiques du seul écran Dépense, jamais chargé par ce test). Aucun import de
// « vite » ici : ce fichier vit hors du dépôt et ne résout pas ses paquets.
import base from 'C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie/vite.config.ts';

const MANQUANTS = new RegExp('^(zxing-wasm|pdfjs-dist)([/]|$)');

export default async (env) => {
  const b = typeof base === 'function' ? await base(env) : base;
  const ro = b.build?.rollupOptions ?? {};
  const avant = Array.isArray(ro.external) ? ro.external : [];
  return { ...b, build: { ...(b.build ?? {}), rollupOptions: { ...ro, external: [...avant, MANQUANTS] } } };
};
