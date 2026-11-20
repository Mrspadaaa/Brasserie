// T3-11 : geste prêt, LECTURE SEULE, à lancer par le brasseur (ou avec son accord) sur un export JSON de sa configuration et de ses recettes.
// Il ne lit aucun Firestore et n'écrit rien. Il dit : quelle brasserie est active, si son matériel (`equipment`) est renseigné, et quelles recettes
// portent une brasserie figée sans matériel (celles que « Planifier » refuse : « matériel pas figé »).
//
// Usage : node lire-brasserie-active.mjs export.json
// Forme attendue de export.json : { "config": { "brewhouses": [...], "activeBrewhouseId": "..." }, "recipes": [ { "id", "name", "brewhouse"?: {...} } ] }
import fs from 'node:fs';

const fichier = process.argv[2];
if (!fichier) { console.log('Usage : node lire-brasserie-active.mjs export.json'); process.exit(2); }
const { config = {}, recipes = [] } = JSON.parse(fs.readFileSync(fichier, 'utf8'));
const maisons = config.brewhouses ?? [];
const active = maisons.find((b) => b.id === config.activeBrewhouseId) ?? maisons[0];
const equipe = (b) => (b?.equipment ? `matériel renseigné (cuve ${b.equipment.kettleCapacityL ?? '?'} L, fermenteur ${b.equipment.fermenterCapacityL ?? '?'} L)` : 'SANS matériel');
console.log(`Brasserie active : ${active ? `${active.name} (${active.id}), ${equipe(active)}` : 'aucune'}`);
console.log(`Autres brasseries : ${maisons.filter((b) => b !== active).map((b) => `${b.name} (${b.id}), ${equipe(b)}`).join(' ; ') || 'aucune'}`);
const sans = recipes.filter((r) => !r.brewhouse || !r.brewhouse.equipment);
console.log(`Recettes sans matériel figé : ${sans.length} / ${recipes.length}`);
for (const r of sans) console.log(`  - ${r.name ?? r.id} : ${r.brewhouse ? `brasserie « ${r.brewhouse.name ?? r.brewhouse.id} » sans matériel` : 'aucune brasserie figée'}`);
if (active?.equipment && sans.length) console.log('=> Le matériel actif est renseigné : ces recettes demandent « Adapter à mon matériel actuel » avant « Planifier ».');
