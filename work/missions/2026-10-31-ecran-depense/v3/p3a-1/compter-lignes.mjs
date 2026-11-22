#!/usr/bin/env node
// p3a-1 : LIGNES a=<n> b=<n> pour la variante et pour la base (voir lignes-commun.mjs).
// Variante seule : node work/missions/2026-10-31-ecran-depense/v3/p3a-1/compter-lignes.mjs
// Base mesurée à nouveau : node scripts/with_server.mjs --server "npm run dev -- --port 5631 --strictPort" --port 5631 \
//   --env VITE_FIREBASE_API_KEY=fake -- node work/missions/2026-10-31-ecran-depense/v3/p3a-1/compter-lignes.mjs
import path from 'node:path';
import { principal } from './lignes-commun.mjs';
await principal(path.join(import.meta.dirname, 'etat.html'), 'p3a-1');
