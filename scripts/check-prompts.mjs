import { createRequire } from 'node:module';
import { readFileSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

/**
 * Contrôle des schémas de réponse envoyés à Gemini.
 *
 * ⚠️ Pourquoi ce script existe : renommer `malts` en `fermentables` dans les
 * `properties` d'une tâche sans toucher son tableau `required` a fait rejeter
 * TOUTE la requête, sur les trois modèles de la chaîne :
 *
 *     HTTP 400 — response_schema.required[3]: property is not defined
 *
 * L'erreur ne se voit ni à la compilation ni à la relecture : elle n'apparaît
 * qu'au premier appel réel, et le repli local masque le problème en donnant
 * l'impression que « l'IA n'a pas répondu ». On la rattrape donc ici.
 *
 * Le script vérifie aussi ce que l'API refuse silencieusement ailleurs :
 * un type mal casé, un `enum` sans type chaîne, un tableau sans `items`.
 */

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');
const require_ = createRequire(join(ROOT, 'package.json'));
const { transformSync } = require_('esbuild');

const OUT = join(ROOT, 'node_modules', '.check-prompts');
mkdirSync(OUT, { recursive: true });

/** Les prompts importent `models.js` uniquement pour un type — on le neutralise. */
const ts = readFileSync(join(ROOT, 'functions/src/prompts.ts'), 'utf8');
const js = transformSync(ts, { loader: 'ts', format: 'esm' }).code.replace(
  /import\s*\{[^}]*\}\s*from\s*['"]\.\/models\.js['"];?/,
  ''
);
const file = join(OUT, 'prompts.mjs');
writeFileSync(file, js);

const { TASKS } = await import(`file:///${file.split('\\').join('/')}`);

const VALID_TYPES = new Set(['OBJECT', 'ARRAY', 'STRING', 'NUMBER', 'INTEGER', 'BOOLEAN']);

const problems = [];

/** Parcourt un schéma en profondeur ; `path` sert à situer l'erreur. */
function walk(schema, path, task) {
  if (!schema || typeof schema !== 'object') return;

  if (schema.type && !VALID_TYPES.has(schema.type)) {
    problems.push(
      `${task} · ${path} : type « ${schema.type} » invalide — Gemini attend ${[...VALID_TYPES].join(', ')}.`
    );
  }

  if (schema.enum && schema.type !== 'STRING') {
    problems.push(`${task} · ${path} : un « enum » exige type "STRING", trouvé « ${schema.type} ».`);
  }

  if (schema.type === 'ARRAY' && !schema.items) {
    problems.push(`${task} · ${path} : tableau sans « items ».`);
  }

  if (schema.type === 'OBJECT') {
    const props = schema.properties ?? {};
    (schema.required ?? []).forEach((name, i) => {
      if (!(name in props)) {
        problems.push(
          `${task} · ${path}.required[${i}] : « ${name} » n’existe pas dans properties. ` +
            `Champs disponibles : ${Object.keys(props).join(', ')}.`
        );
      }
    });
    Object.entries(props).forEach(([name, sub]) => walk(sub, `${path}.${name}`, task));
  }

  if (schema.items) walk(schema.items, `${path}[]`, task);
}

Object.entries(TASKS).forEach(([id, def]) => {
  walk(def.schema, 'schema', id);

  if (!def.system?.trim()) problems.push(`${id} : consigne système vide.`);
  if (!def.schema) problems.push(`${id} : aucun schéma de réponse.`);
  if (def.defaultTier !== 'fast' && def.defaultTier !== 'max') {
    problems.push(`${id} : niveau « ${def.defaultTier} » inconnu.`);
  }
  // Une tâche ancrée doit pouvoir dire d'où vient sa réponse : la métadonnée
  // d'ancrage de Gemini revient vide quand un schéma est imposé.
  if (def.grounded && !('source' in (def.schema.properties ?? {}))) {
    problems.push(
      `${id} : tâche ancrée sur la recherche Google mais sans champ « source » — ` +
        `impossible de distinguer une donnée retrouvée d’une donnée inventée.`
    );
  }
});

rmSync(OUT, { recursive: true, force: true });

if (problems.length > 0) {
  console.log(`⛔ ${problems.length} problème(s) dans les schémas IA :\n`);
  problems.forEach((p) => console.log(`   ❌ ${p}`));
  process.exit(1);
}

console.log(
  `✅ ${Object.keys(TASKS).length} schémas IA vérifiés : champs requis, types, enums, tableaux.`
);
