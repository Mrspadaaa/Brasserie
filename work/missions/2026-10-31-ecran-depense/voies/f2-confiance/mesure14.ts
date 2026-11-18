// Mesure de la voie f2-confiance sur les 14 pièces du banc, HORS LIGNE, aucun appel : lectures de banc-d272b-hl (variante Csv8+N), vérités cas*.json.
// Usage : npx tsx work/missions/2026-10-31-ecran-depense/voies/f2-confiance/mesure14.ts [--detail]
// Les noms d'achat ne sont affichés qu'avec --detail, dans le terminal : ils ne vont ni dans un test ni dans RESULTAT.md.
// L'« unité vraie » d'une ligne qui n'imprime pas d'unité vient (1) de la ligne de MÊME NOM dans la vérité d'une facture PDF du même magasin (doc8, doc9),
// (2) à défaut de la lecture du métier consignée ci-dessous (SURCHARGES), écrite avant de regarder le verdict.
import { readFileSync } from 'node:fs';
import { confianceLigne, deduireUnite, type LigneConfiance } from '../../../../../src/ui/depense/confiance';
import { isReadableUnit } from '../../../../../src/services/ingredientIdentity';
import { linkUnit } from '../../../../../src/services/stockLineMatching';

const RACINE = 'C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie/work/finalisation-tickets-2026-10-08/H13-reels';
const lire = (f: string) => JSON.parse(readFileSync(`${RACINE}/${f}`, 'utf8'));
const detail = process.argv.includes('--detail');
const banc = lire('banc-d272b-hl/results.json');
const verites: Record<string, any> = {};
for (const f of ['cas.json', 'cas-2.json', 'cas-3.json', 'cas-4.json', 'cas-5.json']) { const j = lire(f); for (const c of j.cases ?? j) verites[c.id] = c; }

const plat = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
/** Classe d'unité : les pièces (Stk, sachet, Pck, pce) forment une classe. */
const classe = (u: string) => { const k = linkUnit(u); return ['stk', 'sachet', 'pck', 'pce', 'pcs', 'piece', 'pièce'].includes(k) ? 'piece' : k; };

// Vérité des PDF du magasin : nom plat → unité imprimée.
const memoire = new Map<string, string>();
for (const id of ['doc8', 'doc9']) for (const it of verites[id].expected.items) if (it.unit) memoire.set(plat(it.name), it.unit);
const cherche = (nom: string): string | undefined => { const n = plat(nom); for (const [k, u] of memoire) if (k.length >= 5 && n.includes(k)) return u; return undefined; };

/** La lecture du métier pour ce qui n'est dans aucun PDF (écrite avant le verdict). */
const SURCHARGES: Array<[RegExp, string]> = [
  [/gramm\b/i, 'g'], [/,\s*kg\b/i, 'Kg'], [/typ 2 kg/i, 'Kg'], [/flocken,\s*1 kg/i, 'Kg'], [/malzextraktpulver hell 1 kg/i, 'Kg'], [/malzextraktpulver hell 0,5 kg/i, 'Stk'],
  [/lactose/i, 'Stk'], [/irish moss/i, 'Stk'], [/nutrient|hefenahrung/i, 'Stk'], [/candi syrup/i, 'Stk'], [/cryo hops/i, 'Pck'], [/sekt/i, 'Stk'],
  [/schlauch/i, 'm'], [/\d+(?:[.,]\d)?\s*%/, 'g'], [/safale|windsor|verdant|wyeast|m29|m44|lallemand/i, 'Stk'],
  [/g[aä]rtank|g[aä]reimer|g[aä]rglocke|stopfen|hahn|kappe|sack|siphon|erlenmeyer|baumwollfilter|schraub|flaschenbaum|spider|gummiring|kronkorken|karton|verschluss/i, 'Stk'],
];
// La lecture du métier passe d'abord : une même matière se vend au kilo en sac et au gramme dans la commande en ligne (la vérité cas-4 de doc11 et doc12 marque ces lignes « g, gramm »).
const uniteVraie = (nom: string): string | undefined => SURCHARGES.find(([re]) => re.test(nom))?.[1] ?? cherche(nom);

const compte = { sur: { juste: 0, faux: 0, sans: 0 }, repris: { juste: 0, faux: 0, sans: 0 }, inconnu: { n: 0, vraie: 0 }, imprimee: 0, sansObjet: 0 };
const fauxSur: string[] = [];
let lignesVides = 0, valeurs = { sur: 0, repris: 0, inconnu: 0 } as Record<string, number>;
for (const rec of banc.records) {
  const res = rec.variants['Csv8+N'].result;
  const lignes: LigneConfiance[] = res.items.map((it: any) => ({
    id: it.id, description: it.name, kind: it.kind, quantity: it.quantity ?? undefined, unit: it.unit ?? '', unitPrice: it.price ?? undefined, amount: it.amountTTC ?? undefined,
    stockCategory: it.stockCategory ?? '', sourceReference: it.reference ?? '',
  }));
  const contexte = { lignes, fournisseur: res.vendor, total: res.amountTTC, points: res.points };
  for (const l of lignes) {
    const c = confianceLigne(l, contexte);
    for (const v of [c.unite, c.quantite, c.prix, c.montant, c.famille, c.article]) valeurs[v.niveau]++;
    if (isReadableUnit(l.unit)) { compte.imprimee++; continue; }
    lignesVides++;
    const u = deduireUnite(l, contexte);
    if (u.regle === 'sans-objet') { compte.sansObjet++; continue; }
    if (u.niveau === 'inconnu') { compte.inconnu.n++; if (detail) console.log(`${rec.doc} INCONNU | ${l.description.replace(/\s+/g, ' ').slice(0, 44)} | ${l.quantity} × ${l.unitPrice} | ${u.raison}`); continue; }
    const vraie = uniteVraie(l.description);
    const bucket = compte[u.niveau];
    if (!vraie) { bucket.sans++; if (detail) console.log(`${rec.doc} ${u.niveau} SANS-VERITE | ${l.description.replace(/\s+/g, ' ').slice(0, 44)} | ${u.valeur}`); continue; }
    const juste = classe(u.valeur!) === classe(vraie);
    if (juste) bucket.juste++; else { bucket.faux++; if (u.niveau === 'sur') fauxSur.push(`${rec.doc} ${l.description.slice(0, 40)} : ${u.valeur} au lieu de ${vraie}`); }
    if (detail || !juste) console.log(`${rec.doc} ${u.niveau.padEnd(6)} ${juste ? 'ok ' : 'FAUX'} | ${l.description.replace(/\s+/g, ' ').slice(0, 44).padEnd(44)} | ${l.quantity} × ${l.unitPrice} | ${u.valeur} (vrai ${vraie}) [${u.regle}]`);
  }
}
console.log(`LIGNES SANS UNITE IMPRIMEE : ${lignesVides} (dont ${compte.sansObjet} sans objet : service, port, divers)`);
console.log(`UNITES IMPRIMEES (jamais réécrites) : ${compte.imprimee}`);
console.log(`SUR    : ${compte.sur.juste} justes, ${compte.sur.faux} faux, ${compte.sur.sans} sans vérité`);
console.log(`REPRIS : ${compte.repris.juste} justes, ${compte.repris.faux} faux, ${compte.repris.sans} sans vérité`);
console.log(`INCONNU: ${compte.inconnu.n}`);
console.log(`NIVEAUX DES 6 VALEURS PAR LIGNE : sur ${valeurs.sur}, repris ${valeurs.repris}, inconnu ${valeurs.inconnu}`);
console.log(fauxSur.length ? `SUR FAUX : ${fauxSur.length}\n${fauxSur.join('\n')}` : 'SUR FAUX : 0');
