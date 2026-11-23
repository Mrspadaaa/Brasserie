/**
 * Voie r (tour 3) : rejeu des réponses Gemini ENREGISTRÉES du banc (H13-reels, hors Git, valeurs de pièces réelles) dans le vote de production (`lireCsv8`).
 * Aucun appel Gemini, aucune valeur de pièce dans ce fichier ni dans ses sorties : des comptes seulement. Sans le dossier privé (CI, autre poste), le test est sauté.
 * Mesures du 19.11 (banc-robuste-1 et -2, 12 tirages du doc25 ; banc-m9-payant et -t2, doc2, doc14, doc15) : voir RESULTAT.md de la voie r.
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { normalizeInvoiceScan } from '../../../functions/src/invoiceScanCore';
import { lireCsv8 } from '../../../functions/src/invoiceScanVote';

const H13 = process.env.H13_REELS ?? 'C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie/work/finalisation-tickets-2026-10-08/H13-reels';
const RUNS = ['banc-robuste-1', 'banc-robuste-2', 'banc-m9-payant', 'banc-m9-payant-t2'];
const DOCS = ['doc2', 'doc14', 'doc15', 'doc25'];
const ici = existsSync(H13);

const decode = (file: string) => {
  const c = JSON.parse(readFileSync(file, 'utf8')).candidates?.[0];
  if (c?.finishReason !== 'STOP') throw new Error('lecture coupée');
  const texte = (c.content?.parts ?? []).filter((p: any) => p.thought !== true && typeof p.text === 'string').map((p: any) => p.text).join('');
  return normalizeInvoiceScan(JSON.parse(texte.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '')));
};
const lettres = (s: unknown) => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '');

async function rejouer() {
  const sorties: Array<{ run: string; tirage: string; final: any }> = [];
  for (const run of RUNS) {
    const raw = `${H13}/${run}/raw`;
    if (!existsSync(raw)) continue;
    const tirages = new Set(readdirSync(raw).map(f => /^(doc\d+-t\d+)-Csv8[123]\.json$/.exec(f)?.[1]).filter((t): t is string => !!t && DOCS.includes(t.split('-')[0])));
    for (const tirage of tirages) {
      const f = [1, 2, 3].map(n => `${raw}/${tirage}-Csv8${n}.json`);
      if (!f.every(existsSync)) continue;
      const final = await lireCsv8({ readLite: async (n: 1 | 2) => decode(f[n - 1]), readStrong: async () => decode(f[2]), causeOf: () => null, deadlineReached: () => false, provisoire: () => undefined } as any);
      sorties.push({ run, tirage, final });
    }
  }
  return sorties;
}

describe.skipIf(!ici)('rejeu des lectures enregistrées (LR1-5, LR2-3, LR2-5, LR3-1, LR3-4 : ce que le vote de production tire des vrais tirages)', () => {
  it('un désaccord posé sur un nom ne porte jamais des noms identiques aux lettres près (le doc25 : 12 tirages)', async () => {
    const sorties = await rejouer();
    expect(sorties.filter(s => s.tirage.startsWith('doc25')).length).toBeGreaterThanOrEqual(12);
    for (const { final } of sorties) {
      for (const p of final.points ?? []) {
        if (p.source !== 'désaccord' || !String(p.champs?.[0] ?? '').endsWith('.name')) continue;
        const noms = (p.valeurs ?? []).map((v: any) => lettres(v.valeur));
        expect(new Set(noms).size, 'noms identiques aux lettres près : pas un désaccord').toBeGreaterThan(1);
      }
    }
  });

  it('une ligne retirée par la 3.8 garde son montant (le client la remet « Garder » sur ce montant, LR3-1)', async () => {
    const sorties = await rejouer();
    for (const { final } of sorties) {
      for (const r of final.retirees?.lignes ?? []) expect(typeof r.ligne.amountTTC, 'une ligne retirée ne perd pas son montant').toBe('number');
    }
  });
});
