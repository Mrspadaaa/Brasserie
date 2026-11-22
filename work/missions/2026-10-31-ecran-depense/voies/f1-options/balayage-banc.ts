// Balayage de f1-options : ce que lireOptions comprend sur les lignes lues des 14 pièces du banc D272b (lecture « Csv8+N »).
// Ne sort que des comptes et des FORMES (lettres -> a, chiffres -> 9) : aucun nom d'achat n'est recopié.
// Lancer : npx vite-node work/missions/2026-10-31-ecran-depense/voies/f1-options/balayage-banc.ts
import { readFileSync } from 'node:fs';
import { lireOptions } from '../../../../../src/ui/depense/optionsDuNom';

const banc = JSON.parse(readFileSync('work/finalisation-tickets-2026-10-08/H13-reels/banc-d272b-hl/results.json', 'utf8'));
const forme = (s: string) => s.replace(/\p{Lu}/gu, 'A').replace(/\p{Ll}/gu, 'a').replace(/\d/g, '9').replace(/a+/g, 'a').replace(/A+/g, 'A');
const compte: Record<string, number> = {};
const formes: Record<string, number> = {};
const plus = (o: Record<string, number>, k: string) => { o[k] = (o[k] ?? 0) + 1; };
const lignes: Array<{ name: string; variant: string; unit: string }> = [];
for (const rec of banc.records) for (const it of rec.variants?.['Csv8+N']?.result?.items ?? []) lignes.push({ name: it.name ?? '', variant: it.variant ?? '', unit: it.unit ?? '' });

for (const l of lignes) {
  const r = lireOptions(l.name, l.variant, l.unit);
  plus(compte, 'lignes');
  if (l.variant.trim()) plus(compte, 'lignes avec variante');
  if (r.base !== l.name.trim()) plus(compte, 'base différente du nom imprimé');
  if (r.etat) plus(compte, `état ${r.etat.texte}`);
  if (r.supplement) plus(compte, `supplément ${r.supplement.montant} ${r.supplement.devise}`);
  if (r.options.length) plus(compte, 'ligne avec option traduite');
  if (r.restes.length) plus(compte, 'ligne avec reste');
  if (l.variant.trim() && !r.restes.length) plus(compte, 'variante entièrement comprise (ou déjà dans le nom)');
  if (l.variant.trim() && r.restes.length) plus(compte, 'variante non comprise (ou en partie)');
  for (const x of r.restes) plus(formes, forme(x));
  if (/\n/.test(l.name)) plus(compte, 'nom avec retour à la ligne');
  if (r.uniteDuNom) plus(compte, 'suffixe d\'unité sorti du nom (colonne vide), rendu dans uniteDuNom');
  if (/\n/.test(l.name) && r.base === l.name.trim()) plus(compte, 'nom multi-ligne laissé tel quel (aucune option reconnue : description)');
  if (/\n/.test(l.name) && r.base !== l.name.trim() && /[\n]/.test(r.base)) plus(compte, 'ALERTE base garde un retour à la ligne alors que le nom a changé');
  if (/schrotung|mischung|\[\+/i.test(r.base) && !/^zuschlag/i.test(r.base)) plus(compte, 'ALERTE base garde encore une option');
  if (/\[|\]/.test(r.base)) plus(compte, 'ALERTE base garde un crochet');
}
console.log(JSON.stringify({ compte, formesDesRestes: formes }, null, 2));
