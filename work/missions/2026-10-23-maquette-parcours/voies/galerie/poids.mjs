#!/usr/bin/env node
// Les deux pages de la galerie tiennent dans un artefact : 120 fichiers et 60 Mo au plus ensemble, 15 Mo par fichier.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..', '..', '..');
const dossiers = ['2026-10-24-galerie', '2026-10-24-dryhopper-tout'].map((d) => path.join(RACINE, 'work/refonte-frontend/v4/outils/pages', d));
const fichiers = [];
const marcher = (d) => { if (!fs.existsSync(d)) return; for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) { if (e.name !== 'outils') marcher(p); } else fichiers.push({ p, o: fs.statSync(p).size }); } };
dossiers.forEach(marcher);
const total = fichiers.reduce((s, f) => s + f.o, 0), gros = fichiers.filter((f) => f.o > 15e6);
const ecarts = [];
if (!fichiers.length) ecarts.push('aucun fichier');
if (fichiers.length > 120) ecarts.push(`${fichiers.length} fichiers (120 au plus)`);
if (total > 60e6) ecarts.push(`${(total / 1e6).toFixed(1)} Mo (60 au plus)`);
if (gros.length) ecarts.push(`${gros.length} fichier(s) de plus de 15 Mo`);
console.log(ecarts.length ? `POIDS ECHEC (${ecarts.join(' ; ')})` : `POIDS OK (${fichiers.length} fichiers, ${(total / 1e6).toFixed(1)} Mo)`);
process.exit(ecarts.length ? 1 : 0);
