// Server-only copy. Never write a report into public/ or import it from src/.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
const markdown = readFileSync(new URL('../docs/research/fermentation/report-source.md', import.meta.url), 'utf8');
const folder = new URL('../functions/reports/', import.meta.url);
mkdirSync(folder, { recursive: true });
writeFileSync(new URL('fermentation-2026.md', folder), markdown);
// A fresh checkout has a generic example. Never overwrite a personal dossier.
const pilotReport = new URL('nolo-scenarios-2026.md', folder);
if (!existsSync(pilotReport)) writeFileSync(pilotReport, readFileSync(new URL('nolo-scenarios.example.md', folder)));
console.log('Protected research report prepared for the authenticated server endpoint.');
