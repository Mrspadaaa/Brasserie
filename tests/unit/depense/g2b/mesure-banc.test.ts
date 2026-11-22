// Voie g2b-logique : mesure AVANT / APRÈS sur les VRAIES pièces du banc, HORS LIGNE, aucun appel, aucun jeu de fixtures neuf. Chaque ligne passe par le chemin de l'écran :
// `lignesDeLecture` (nature, unité déduite, rapprochement) puis `confianceLigne` sur la ligne avec son unité déduite à côté de `unit` (comme `effDe`).
// Sources (lecture seule) : `rejeu-k6.json` (commandes de brassage, ses lectures), `banc-d272b-hl` (14 pièces), et sa lecture Bauhaus du 02.11 (%TEMP%/bauhaus-0211/final.json, MESURE_TICKET=1).
// Inerte sans MESURE_SORTIE (jamais dans `npm test`). Usage, depuis la racine du worktree :
//   MESURE_SORTIE=<chemin>.json [MESURE_TICKET=1] node work/missions/2026-10-31-ecran-depense/voies/p3c-port/copie.mjs "npx vitest run tests/unit/depense/g2b/mesure-banc.test.ts"
// La sortie ne garde AUCUN nom ni valeur : par pièce et rang de ligne, la famille, la nature, l'unité (niveau, règle) et le pire niveau. Au terminal, des comptes seulement.
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { describe, it } from 'vitest';
import { confianceLigne } from '../../../../src/ui/depense/confiance';
import { lignesDeLecture } from '../../../../src/ui/depense/finale';
import { contexteConfiance, ligneConfianceDe, niveauxRangee } from '../../../../src/ui/depense/rangees';
import { uniteEffective } from '../../../../src/services/purchaseEntry';
import { groupeDe } from '../../../../src/ui/depense/groupes';
import { donneesDeLigne } from '../../../../src/services/stockLineMatching';
import { ligneDeBrouillon } from '../../../../src/domain/stock/articleNeuf';

const RACINE = 'C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie/work/finalisation-tickets-2026-10-08/H13-reels';
const TICKET = 'C:/Users/mrspa/AppData/Local/Temp/bauhaus-0211/final.json';
const INGREDIENTS = new Set(['malt', 'houblon', 'levure', 'sucre', 'additif']);
interface Fiche { groupe: string; doc: string; rang: number; famille: string; nature: string; stockAction: string; uniteNiveau: string; uniteRegle: string; uniteValeur: string; pire: string; nouveau: boolean }

/** Les lectures de `rejeu-k6.json` : chaque pièce dit son fichier de sortie et le chemin (pointer) de son résultat. */
function piecesK6(): Array<{ groupe: string; doc: string; res: any }> {
  const dossier = `${RACINE}/jus0`, manifeste = JSON.parse(readFileSync(`${dossier}/rejeu-k6.json`, 'utf8'));
  return Object.entries<any>(manifeste.docs).map(([doc, v]) => {
    let res = JSON.parse(readFileSync(path.resolve(dossier, v.output), 'utf8'));
    for (const p of v.pointer) res = res?.[p];
    return { groupe: 'k6', doc, res };
  });
}

describe.skipIf(!process.env.MESURE_SORTIE)('mesure banc (hors ligne)', () => {
  it('écrit les fiches anonymes et les comptes', () => {
    const banc = JSON.parse(readFileSync(`${RACINE}/banc-d272b-hl/results.json`, 'utf8'));
    const pieces = [...piecesK6(), ...banc.records.map((r: any) => ({ groupe: 'd272b', doc: r.doc, res: r.variants['Csv8+N'].result }))];
    const ticket = Boolean(process.env.MESURE_TICKET) && existsSync(TICKET);
    if (ticket) pieces.push({ groupe: 'ticket', doc: 'ticket', res: JSON.parse(readFileSync(TICKET, 'utf8')) });
    const fiches: Fiche[] = [];
    for (const { groupe, doc, res } of pieces) {
      const { lines, propositions } = lignesDeLecture(res, [], 'sub');
      const ctx = contexteConfiance({ lines, vendor: res.vendor ?? '', amount: res.amountTTC ?? undefined, category: res.category }, [], res.points);
      lines.forEach((l, i) => {
        // L'écran lit la ligne avec son unité déduite À CÔTÉ de `unit` (`effDe`, `avecUnitesDeduites`) : `unit` imprimée reste vide.
        const c = confianceLigne(ligneConfianceDe(l), ctx), n = niveauxRangee(l, c);
        const famille = groupeDe(donneesDeLigne(ligneDeBrouillon({ ...l, unit: uniteEffective(l) }, res.vendor ?? undefined)).contexte, l.kind, l.description, l.stockCategory, undefined, res.category);
        fiches.push({ groupe, doc, rang: i + 1, famille, nature: l.kind, stockAction: l.stockAction, uniteNiveau: c.unite.niveau, uniteRegle: c.unite.regle, uniteValeur: c.unite.valeur ?? '', pire: n.pire, nouveau: propositions.neufDOffice.has(l.id) });
      });
    }
    writeFileSync(process.env.MESURE_SORTIE!, JSON.stringify(fiches, null, 1));
    const compte = (f: (x: Fiche) => string, sel: (x: Fiche) => boolean) => { const m: Record<string, number> = {}; for (const x of fiches.filter(sel)) m[f(x)] = (m[f(x)] ?? 0) + 1; return JSON.stringify(m); };
    const sortie: string[] = [];
    for (const g of ['k6', 'd272b']) {
      const dans = (x: Fiche) => x.groupe === g, ing = (x: Fiche) => dans(x) && INGREDIENTS.has(x.famille), hors = (x: Fiche) => dans(x) && !INGREDIENTS.has(x.famille);
      sortie.push(`${g === 'k6' ? 'REJEU-K6' : 'BANC D272B'} (${new Set(fiches.filter(dans).map(x => x.doc)).size} pièces, ${fiches.filter(dans).length} lignes)`,
        `  unité, familles d'ingrédients : ${compte(x => x.uniteNiveau, ing)}`, `  unité, hors ingrédients       : ${compte(x => x.uniteNiveau, hors)}`,
        `  pire niveau, hors ingrédients : ${compte(x => x.pire, hors)}`, `  nature, ingrédients           : ${compte(x => x.nature, ing)}`, `  nature, hors ingrédients      : ${compte(x => x.nature, hors)}`,
        `  « nouveau » d'office          : ${fiches.filter(x => dans(x) && x.nouveau).length}`);
    }
    if (ticket) {
      const t = (x: Fiche) => x.groupe === 'ticket';
      sortie.push(`TICKET (${fiches.filter(t).length} lignes) — comptes seulement`, `  famille : ${compte(x => x.famille, t)}`, `  nature  : ${compte(x => x.nature, t)}`,
        `  stock   : ${compte(x => x.stockAction, t)}  nouveaux : ${fiches.filter(x => t(x) && x.nouveau).length}`, `  unité   : ${compte(x => `${x.uniteNiveau}/${x.uniteRegle}`, t)}`, `  pire    : ${compte(x => x.pire, t)}`);
    }
    console.log(sortie.join('\n'));
  });
});
