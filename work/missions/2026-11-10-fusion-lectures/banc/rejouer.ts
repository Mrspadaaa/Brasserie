// Banc HORS LIGNE (aucun appel) : rejoue `lireCsv8` (le code de `functions/src` de ce dépôt) sur toutes les lectures réelles enregistrées
// (raw/ du banc, hors Git) et juge le final, le provisoire, les appariements montrés et les lignes retirées contre la vérité écrite.
// Usage : npx tsx work/missions/2026-11-10-fusion-lectures/banc/rejouer.ts <sortie.json>   (RACINE : variable BANC_RACINE)
// Rien de réel n'est écrit : des comptes et des noms de documents (docN), aucune valeur de pièce.
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { parseReadResponse } from '../../../../scripts/banc-lecture-facture';
import { normalizeInvoiceScan } from '../../../../functions/src/invoiceScanCore';
import { isoCurrency, lireCsv8, ressemblance, ressemblanceNoms } from '../../../../functions/src/invoiceScanVote';

const RACINE = process.env.BANC_RACINE ?? 'C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie/work/finalisation-tickets-2026-10-08/H13-reels';
const cts = (v: any) => (typeof v === 'number' && Number.isFinite(v) ? Math.round(v * 100) : null);
const verites = new Map<string, any>();
for (const f of readdirSync(RACINE).filter(f => /^cas(-\d+)?\.json$/.test(f)).sort()) {
  try { const j = JSON.parse(readFileSync(`${RACINE}/${f}`, 'utf8')); for (const c of (j.cases ?? j)) if (c?.id && Array.isArray(c.expected?.items)) verites.set(c.id, c.expected); } catch { /* autre format */ }
}
const lire = (d: string, doc: string, t: string, k: number, p = "Csv8") => {
  const f = `${RACINE}/${d}/raw/${doc}-${t}-${p}${k}.json`;
  if (!existsSync(f)) return { absent: true } as const;
  try { const brut = parseReadResponse(JSON.parse(readFileSync(f, 'utf8')), { codes: true }); brut.currency = isoCurrency(brut.currency); return { normalized: normalizeInvoiceScan(brut) }; }
  catch { return { coupee: true } as const; }
};

/** Juge : alignement ORDONNÉ (plus longue sous-suite commune) des lignes sur la vérité, au même montant (centimes), le nom départageant.
 * Les noms OCR et ceux de la vérité diffèrent trop (abrégés, traduits) pour juger au nom ; le montant au bon rang est la preuve. */
function versVerite(items: any[], verite: any[]): Map<number, { t: number; fort: boolean; s: number }> {
  const n = items.length, m = verite.length, S = Array.from({ length: n + 1 }, () => new Float64Array(m + 1));
  const w = (i: number, t: number) => { const a = cts(items[i]?.amountTTC); return a !== null && a === cts(verite[t]?.amountTTC) ? 1 + 0.5 * ressemblance(items[i]?.name, verite[t]?.name) : -1; };
  for (let i = 1; i <= n; i++) for (let t = 1; t <= m; t++) { const x = w(i - 1, t - 1); S[i][t] = Math.max(S[i - 1][t], S[i][t - 1], x > 0 ? S[i - 1][t - 1] + x : -Infinity); }
  const out = new Map<number, { t: number; fort: boolean; s: number }>();
  for (let i = n, t = m; i > 0 && t > 0;) {
    const x = w(i - 1, t - 1);
    if (x > 0 && Math.abs(S[i][t] - (S[i - 1][t - 1] + x)) < 1e-9) { out.set(i - 1, { t: t - 1, fort: true, s: 1 }); i--; t--; }
    else if (S[i][t] === S[i - 1][t]) i--; else t--;
  }
  return out;
}
/** Le défaut vu en ligne (jeu 7 n° 5) : un nom barré d'une autre ligne. Deux noms sans rapport : Levenshtein < 0,4 et aucun mot de 4 lettres ou plus en commun. */
const motsDe = (v: unknown) => new Set(String(v ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().split(/[^a-z0-9]+/).filter(m => m.length >= 4));
const nomsSansRapport = (a: unknown, b: unknown) => { const A = motsDe(a), B = motsDe(b); return ressemblance(a, b) < 0.4 && ![...A].some(m => B.has(m)); };
const qte = (x: any) => (x?.quantity ?? (x?.price != null && cts(x.price) === cts(x.amountTTC) ? 1 : null));
const juste = (m?: { fort: boolean; s: number }) => Boolean(m && m.fort && m.s >= 0.6);

const lignes: any[] = [];
async function main() {
  for (const d of readdirSync(RACINE).filter(d => d.startsWith('banc-') && existsSync(`${RACINE}/${d}/raw`)).sort()) {
    for (const f of readdirSync(`${RACINE}/${d}/raw`).filter(f => /-(Csv8|C)1\.json$/.test(f)).sort()) {
      const m = /^(doc\d+)-(t\d+)-(Csv8|C)1\.json$/.exec(f); if (!m) continue;
      const [, doc, t, p] = m;
      const l = [1, 2, 3].map(k => lire(d, doc, t, k, p));
      const tiersAbsent = 'absent' in l[2];
      let prov: any = null;
      const io = {
        readLite: (k: 1 | 2) => ('normalized' in l[k - 1] ? Promise.resolve((l[k - 1] as any).normalized) : Promise.reject(new Error('coupée'))),
        readStrong: () => ('normalized' in l[2] ? Promise.resolve((l[2] as any).normalized) : Promise.reject(new Error('coupée'))),
        causeOf: () => null, deadlineReached: () => false, provisoire: (p: any) => { prov = p; },
      };
      let fin: any;
      try { fin = await lireCsv8(io as any); } catch { lignes.push({ d, doc, t, erreur: true }); continue; }
      const v = verites.get(doc);
      const r: any = { d, doc, t, tiersAbsent, n: fin.items.length, status: fin.review?.status, tiers: Boolean(prov) };
      if (v) {
        const V = v.items, mf = versVerite(fin.items, V);
        r.nV = V.length;
        r.justes = [...mf.values()].filter(juste).length;
        r.enTrop = fin.items.length - mf.size;
        r.qte = [...mf].filter(([i, x]) => juste(x) && cts(qte(fin.items[i])) === cts(qte(V[x.t]) ?? 1)).length;
        r.total = cts(fin.amountTTC) === cts(v.amountTTC);
        // Voie f2 (jeu en ligne 8) : « le final a-t-il perdu ou inventé quelque chose que les lectures avaient ? », en plus de « les montants sont-ils au bon rang ? ».
        const lus = l.flatMap(x => ('normalized' in x ? [(x as any).normalized] : []));
        const auMontant = (liste: any[], c: number | null) => liste.filter(x => c !== null && cts(x.amountTTC) === c);
        // comptage d'articles annoncé (printedLineCount) : sans majorité parmi les lectures (« annoncés 23 » inventé), ou différent du nombre de lignes de la vérité
        const pl = fin.printedLineCount;
        r.annonceSansMajorite = typeof pl === 'number' && lus.filter((x: any) => x.printedLineCount === pl).length < 2;
        r.annonceFausse = typeof pl === 'number' && pl !== V.length;
        // prix ou unité que le final n'a plus, alors qu'une lecture les lisait à ce montant
        r.prixPerdus = fin.items.filter((it: any) => it.price == null && cts(it.amountTTC) !== null && lus.some((x: any) => auMontant(x.items, cts(it.amountTTC)).some((y: any) => y.price != null))).length;
        r.unitesPerdues = fin.items.filter((it: any) => !String(it.unit ?? '').trim() && cts(it.amountTTC) !== null && lus.some((x: any) => auMontant(x.items, cts(it.amountTTC)).some((y: any) => String(y.unit ?? '').trim()))).length;
        // un nom déplacé : les deux Flash-Lite lisent le même nom (≥ 0,6) à ce montant, le final en porte un autre (< 0,5 avec chacun) qui est celui d'une ligne d'un autre montant (≥ 0,6)
        r.nomsContreMajorite = l[0] && l[1] && 'normalized' in l[0] && 'normalized' in l[1] ? fin.items.filter((it: any) => {
          const A = auMontant((l[0] as any).normalized.items, cts(it.amountTTC)), B = auMontant((l[1] as any).normalized.items, cts(it.amountTTC));
          const ailleurs = lus.slice(0, 2).some((x: any) => x.items.some((y: any) => cts(y.amountTTC) !== cts(it.amountTTC) && ressemblanceNoms(it.name, y.name) >= 0.6));
          return ailleurs && A.length === 1 && B.length === 1 && A.some((a: any) => B.some((b: any) => ressemblanceNoms(a.name, b.name) >= 0.6 && ressemblanceNoms(it.name, a.name) < 0.5 && ressemblanceNoms(it.name, b.name) < 0.5));
        }).length : 0;
        // un nom posé sur le montant d'une voisine, jugé sur la vérité : le nom ressemble à une autre ligne de la vérité (≥ 0,6) et très peu à la sienne (< 0,35)
        r.nomsDecales = [...mf].filter(([i, x]) => juste(x) && ressemblanceNoms(fin.items[i].name, V[x.t]?.name) < 0.35 && V.some((w: any, u: number) => u !== x.t && ressemblanceNoms(fin.items[i].name, w.name) >= 0.6)).length;
        r.compte = fin.countedAmounts ?? null; r.compteFaux = typeof fin.countedAmounts === 'number' && fin.countedAmounts !== V.length;
        // Cas réel du 10.11 (BAUHAUS tâché, 28 lignes, « Somme = imprimé 352,05 » en vert) : la somme des lignes égale le total alors que la vérité ne l'égale pas.
        const sommeF = fin.items.reduce((t: number, x: any) => t + (cts(x.amountTTC) ?? 0), 0), sommeV = V.reduce((t: number, x: any) => t + (cts(x.amountTTC) ?? 0), 0);
        r.sommeVerteFausse = sommeF === cts(fin.amountTTC) && sommeV !== cts(v.amountTTC);
        r.fauxVert =fin.review?.status === 'checked' && (r.justes < V.length || r.enTrop > 0 || !r.total);
        if (prov) {
          const mp = versVerite(prov.items, V);
          r.nP = prov.items.length; r.provJustes = [...mp.values()].filter(juste).length; r.provEnTrop = prov.items.length - mp.size;
          // C2 : un appariement montré (rang provisoire → ligne finale) qui relie deux lignes différentes de la vérité
          let faux = 0, paires = 0, nomsAutres = 0;
          fin.items.forEach((it: any, j: number) => {
            const rp = it.rangProvisoire; if (typeof rp !== 'number') return; paires++;
            const a = mp.get(rp), b = mf.get(j);
            if (a && b && a.t !== b.t) faux++;
            if (nomsSansRapport(prov.items[rp]?.name, it.name)) nomsAutres++;
          });
          r.paires = paires; r.pairesFausses = faux; r.pairesNoms = nomsAutres;
          // Le critère du jeu 7 (n° 5) : une ligne finale qui a sa JUMELLE dans le provisoire (même montant, nom ≥ 0,8) doit y être rapprochée ; sinon une correction ou un ajout inventé.
          r.jumellesManquees = fin.items.filter((it: any) => { const j = prov.items.map((p: any, k: number) => ({ p, k })).filter((x: any) => cts(x.p.amountTTC) === cts(it.amountTTC) && ressemblance(x.p.name, it.name) >= 0.8); return j.length > 0 && !j.some((x: any) => x.k === it.rangProvisoire); }).length;
        }
        // C3 : lignes retirées qui doublent une ligne gardée (même ligne de vérité) ou sans aucune ligne de vérité
        const re = fin.retirees?.lignes ?? [];
        const tGardees = new Set([...mf.values()].map(x => x.t));
        const mr = versVerite(re.map((x: any) => x.ligne), V);
        r.retirees = re.length;
        r.retireesDoublons = re.filter((_: any, i: number) => { const x = mr.get(i); return x ? tGardees.has(x.t) : false; }).length;
        r.retireesVraies = re.filter((_: any, i: number) => { const x = mr.get(i); return x ? !tGardees.has(x.t) : false; }).length;
      }
      lignes.push(r);
    }
  }
  const avec = lignes.filter(r => r.nV !== undefined);
  const somme = (k: string) => avec.reduce((t, r) => t + (typeof r[k] === 'number' ? r[k] : r[k] === true ? 1 : 0), 0);
  const tot = Object.fromEntries(['nV', 'justes', 'enTrop', 'qte', 'total', 'fauxVert', 'sommeVerteFausse', 'compteFaux', 'annonceSansMajorite', 'annonceFausse', 'prixPerdus', 'unitesPerdues', 'nomsContreMajorite', 'nomsDecales', 'provJustes', 'provEnTrop', 'paires', 'pairesFausses', 'pairesNoms', 'jumellesManquees', 'retirees', 'retireesDoublons', 'retireesVraies'].map(k => [k, somme(k)]));
  const sortie = process.argv[2];
  if (sortie) writeFileSync(sortie, JSON.stringify({ tot, tirages: lignes.length, avecVerite: avec.length, erreurs: lignes.filter(r => r.erreur).length, lignes }, null, 1));
  console.log('TIRAGES', lignes.length, 'avec vérité', avec.length, 'erreurs', lignes.filter(r => r.erreur).length);
  console.log('TOTAL', JSON.stringify(tot));
}
main();
