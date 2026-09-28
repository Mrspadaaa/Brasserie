// Replays already captured PUBLIC yeast lookups through the recipe mapper and
// a real, isolated Firestore emulator. No provider call and no production data.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';

const root = fileURLToPath(new URL('../', import.meta.url));
const projectId = 'demo-yeast-ai';
const host = '127.0.0.1:8080';
const hub = await fetch('http://127.0.0.1:4400/emulators').then(response => response.json()).catch(() => null);
if (hub?.firestore?.host !== '127.0.0.1' || hub.firestore.port !== 8080)
  throw Error('Émulateur Firestore isolé absent ; aucune écriture.');
process.env.FIRESTORE_EMULATOR_HOST = host;
process.env.GCLOUD_PROJECT = projectId;
const { outputFiles } = await build({ entryPoints: [resolve(root, 'src/domain/ingredientFacts.ts')],
  bundle: true, write: false, platform: 'node', format: 'esm', target: 'node22' });
const factsModule = await import(`data:text/javascript;base64,${Buffer.from(outputFiles[0].contents).toString('base64')}`);
const projectionBuild = await build({ entryPoints: [resolve(root, 'src/domain/yeastProjection.ts')],
  bundle: true, write: false, platform: 'node', format: 'esm', target: 'node22' });
const { resolveYeastDossier } = await import(`data:text/javascript;base64,${Buffer.from(projectionBuild.outputFiles[0].contents).toString('base64')}`);
const { initializeApp, deleteApp } = await import('../functions/node_modules/firebase-admin/lib/esm/app/index.js');
const { getFirestore } = await import('../functions/node_modules/firebase-admin/lib/esm/firestore/index.js');
const app = initializeApp({ projectId }, 'qa-real-yeast-lookups');
const db = getFirestore(app);
const reportPath = resolve(root, 'work/ux-mobile-poc-2026-09-25/review/real-yeast-db-check.json');
const reports = await Promise.all(['real-yeast-lookups-expanded.json', 'real-yeast-lookups-expanded-mangrove.json']
  .map(name => readFile(resolve(root, 'work/ux-mobile-poc-2026-09-25/review', name), 'utf8').then(JSON.parse)));
const responses = reports.flatMap(report => report.results).filter(row => row.status === 200 && !row.error && !row.validationError && row.data?.found);
assert.equal(responses.length, 3, 'S‑04, M20 et M54 validées au transport requises.');
const evidence = { schema: 'laffinee.real-yeast-db-check.v1', projectId, emulatorHost: host, providerCalls: 0,
  mode: 'Firestore emulator Admin SDK, public synthetic recipes only', checkedAt: new Date().toISOString(), cases: [] };
try {
  for (const response of responses) {
    const data = response.data;
    const yeast = factsModule.applyReviewedYeastFacts({ name: response.requestedName }, data, [], {});
    const id = `qa-real-yeast-${response.requestedName.includes('S-04') ? 's04' : response.requestedName.includes('M20') ? 'm20' : 'm54'}`;
    const recipe = { id, name: `QA fiche levure ${response.requestedName}`, style: 'Fixture isolée', volumeL: 20,
      boilMin: 60, ogTarget: 1.05, fermentables: [{ name: 'Malt témoin', kind: 'grain', use: 'empatage', weightKg: 4, potentialPpg: 37 }],
      hops: [], yeast, mash: { steps: [{ name: 'Saccharification', tempC: 66, durationMin: 60 }], spargeType: 'batch' },
      fermentation: [{ kind: 'primaire', name: 'Primaire', tempC: 20, days: 10 }] };
    // Match the application's Firestore serialization boundary: undefined
    // never becomes a fabricated null or a quantity from another product.
    const submitted = JSON.parse(JSON.stringify(recipe));
    const ref = db.collection('recipes').doc(id);
    await ref.set(submitted);
    const reopened = (await ref.get()).data();
    assert.deepEqual(reopened, submitted, `${id} : écart après lecture Firestore`);
    assert.equal(reopened.yeast.name, response.requestedName);
    assert.equal(reopened.yeast.lab, data.lab);
    assert.equal(reopened.yeast.strain, data.strain);
    assert.equal(reopened.yeast.form, data.form);
    assert.equal(reopened.yeast.fermTempMinC, data.tempMinC);
    assert.equal(reopened.yeast.fermTempMaxC, data.tempMaxC);
    assert.equal(reopened.yeast.qty, undefined);
    assert.equal(reopened.yeast.unit, undefined);
    assert.equal(reopened.yeast.pitchTempC, undefined);
    assert.equal(reopened.yeast.stockItemRef, undefined);
    assert(reopened.yeast.technicalFacts?.length >= data.technicalFacts.length);
    assert(reopened.yeast.technicalFacts.every(fact => fact.source && fact.sourceUrl));
    const dossier = resolveYeastDossier(reopened.yeast);
    if (id === 'qa-real-yeast-s04') {
      assert(reopened.yeast.flocculation, 'Floculation textuelle S‑04 doit remplir le champ.');
      assert.deepEqual(reopened.yeast.technicalSelections?.attenuation?.range, { min: 74, max: 82 });
    }
    if (id === 'qa-real-yeast-m54') {
      assert.equal(reopened.yeast.attenuationPct, undefined, 'Moyenne IA 79,5 % refusée pour la plage 77–82 %.');
      assert.equal(reopened.yeast.alcoholTolerancePct, undefined, 'Borne upTo 9 % non transformée en point exact.');
      assert.deepEqual(reopened.yeast.technicalSelections?.attenuation?.range, { min: 77, max: 82 }, 'Plage M54 retenue malgré son contexte descriptif.');
      assert.equal(reopened.yeast.technicalSelections?.alcoholTolerance?.qualifier, 'upTo');
      assert.deepEqual(dossier.documentedAttenuation?.range, { min: 77, max: 82 }, 'Projection M54 doit lire la plage retenue.');
    }
    evidence.cases.push({ id, requestedName: response.requestedName, fields: Object.keys(reopened.yeast),
      technicalFacts: reopened.yeast.technicalFacts.length,
      selectedRanges: Object.fromEntries(Object.entries(reopened.yeast.technicalSelections ?? {}).map(([key, value]) => [key, value?.range ?? null])),
      projectedAttenuation: dossier.documentedAttenuation?.range ?? null,
      flocculation: reopened.yeast.flocculation ?? null, attenuationPct: reopened.yeast.attenuationPct ?? null,
      alcoholTolerancePct: reopened.yeast.alcoholTolerancePct ?? null,
      documentSha256: createHash('sha256').update(JSON.stringify(reopened)).digest('hex'), persisted: true });
  }
} finally {
  await deleteApp(app);
}
await writeFile(reportPath, JSON.stringify(evidence, null, 2) + '\n');
console.log(JSON.stringify({ reportPath, emulatorProject: projectId, cases: evidence.cases.map(row => ({ id: row.id, persisted: row.persisted, technicalFacts: row.technicalFacts })) }));
