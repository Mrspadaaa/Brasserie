// Server-only copy. Never write a report into public/ or import it from src/.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
const markdown = readFileSync(new URL('../docs/research/fermentation/report-source.md', import.meta.url), 'utf8');
const folder = new URL('../functions/reports/', import.meta.url);
mkdirSync(folder, { recursive: true });
writeFileSync(new URL('fermentation-2026.md', folder), markdown);
console.log('Protected research report prepared for the authenticated server endpoint.');
