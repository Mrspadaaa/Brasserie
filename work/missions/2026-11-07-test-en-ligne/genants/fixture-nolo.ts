// Configuration NOLO SIMULÉE pour le contrôle n° 15 (partie NOLO) : tirée de la fixture `fruty` des tests (process « arrested », cible 0,4 %,
// dilution de 6 L, densité du moût 1,018), validée par le code de l'app (`applyNoloWortSg`). Aucune donnée réelle.
// Usage : npx vite-node work/missions/2026-11-07-test-en-ligne/genants/fixture-nolo.ts -- <sortie.json>   → FIXTURE OK
import fs from 'node:fs';
import { fruty } from '../../../../tests/fixtures/fruty';
import { noloPlanningSource } from '../../../../src/domain/nolo';
import { applyNoloWortSg } from '../../../../src/domain/noloBrewTools';

const sortie = process.argv.at(-1)!;
const r = fruty(true); r.hops = [];
r.nolo!.process = 'arrested'; r.nolo!.targetAbvPct = .4;
r.nolo!.planning = { version: 1, source: noloPlanningSource, stopSg: { min: 1.014, max: 1.015 } };
r.nolo!.operations = [{ id: 'water', kind: 'dilution', name: 'Eau après fermentation', volumeL: 6 }];
const nolo = applyNoloWortSg(r, 1.018).value!.nolo;
fs.writeFileSync(sortie, JSON.stringify(nolo));
console.log(`FIXTURE OK ${sortie}`);
