#!/usr/bin/env node
// p3a-3 : LIGNES a=<n> b=<n> pour la variante et pour la base (voir ../p3a-1/lignes-commun.mjs).
// node work/missions/2026-10-31-ecran-depense/v3/p3a-3/compter-lignes.mjs
import path from 'node:path';
import { principal } from '../p3a-1/lignes-commun.mjs';
await principal(path.join(import.meta.dirname, 'etat.html'), 'p3a-3');
