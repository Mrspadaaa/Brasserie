// Voie s1-stock : liste des noms de houblons du catalogue du dépôt (src/data/hopDatabaseBootstrap.json), normalisés
// comme les jetons d'appariement (minuscules, sans accent). Sert à ingredientIdentity.ts (nature inconnue : homonyme
// d'une autre catégorie). Lancement : node work/missions/2026-10-31-ecran-depense/voies/s1-stock/extraire-noms-houblons.mjs
import { readFileSync } from 'node:fs';
const data = JSON.parse(readFileSync('src/data/hopDatabaseBootstrap.json', 'utf8'));
const norm = s => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
const names = new Set();
for (const v of data.hopVarieties ?? []) for (const n of [v.name, ...(v.aliases ?? [])]) { const k = norm(n); if (k && k.length >= 3) names.add(k); }
const list = [...names].sort();
console.log(list.length + ' noms');
console.log(JSON.stringify(list));
