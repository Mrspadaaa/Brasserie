/**
 * Banc t2c — la RECHERCHE WEB du compagnon (`research`) : fournisseurs suisses (`find_brewing_suppliers`) et référence fabricant (`lookup_brewing_reference`).
 *
 * On appelle `researchBrewing` de la production (functions/src/brewerResearch.ts) tel quel, avec UN chercheur (coût), un `call(body)` qui passe par `appeler()`
 * (journal commun, plafonds, 429) et le modèle / la réflexion de la cellule. Les fiches sont vérifiées par `verifySupplierPagesReport` (lecture HTTP publique
 * des boutiques, robots.txt respecté), comme en production.
 *
 * Vérité écrite AVANT les passes (`REQUETES`, `QUESTIONS`) :
 *   fournisseurs : fiche vérifiée « pertinente » = son nom contient la variété demandée (`nom`) ; « exacte » = en plus le conditionnement demandé (`pack`).
 *   référence    : « source primaire » = une source citée dont le titre ou l'URL contient le domaine du fabricant ; « fait clé » = tous les motifs `faits` dans le texte.
 * Production : fournisseurs = 3.8@low ; référence = Flash-Lite@minimal (géré par la route lite de models.ts).
 * Limites : 3 requêtes, 2 questions, un tirage ; les boutiques changent (stock, pages) : une fiche manquée un jour peut exister le lendemain.
 */
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { corpsReglage, creerEnv, appeler, envoyerReseau, envoyerSimule, f2, parseReglage, statCellule, MISSION_DIR, type EnvT2, type StatCellule } from './banc-t2c-commun';
import { normaliser } from './banc-compagnon-grille';
import { researchBrewing } from '../functions/src/brewerResearch';
// @ts-ignore — module JavaScript sans types
import { readLocalKey, redact } from './gemini-usage-bench-guard.mjs';
// @ts-ignore — module JavaScript sans types
import { requirePaidAiTestOptIn } from './paid-ai-test-guard.mjs';

export const DOSSIER_VOIE = `${MISSION_DIR}/voies/t2c`;

export interface Requete { id: string; query: string; nom: RegExp; pack: RegExp }
export const REQUETES: Requete[] = [
  { id: 'citra', query: 'Citra pellets 100 g', nom: /citra/, pack: /100 ?g/ },
  { id: 'maris', query: 'Maris Otter malt 25 kg', nom: /maris/, pack: /25 ?kg/ },
  { id: 'us05', query: 'Safale US-05 levure sèche 11,5 g', nom: /us-?05/, pack: /11[.,]5 ?g|11\.5/ }
];
export interface Question { id: string; query: string; domaine: RegExp; faits: RegExp[] }
export const QUESTIONS: Question[] = [
  { id: 'us05-temp', query: 'Fermentis SafAle US-05 : plage de température de fermentation recommandée par le fabricant', domaine: /fermentis/, faits: [/18/, /26/] },
  { id: 'w3470-temp', query: 'Fermentis SafLager W-34/70 : plage de température de fermentation recommandée par le fabricant', domaine: /fermentis/, faits: [/12/, /18/] }
];

export interface SortieRecherche {
  reglage: string; kind: 'fournisseurs' | 'reference'; id: string; utilisable: boolean; produits: Array<{ name: string; url: string; supplier: string; packageLabel?: string }>;
  pertinentes: number; exactes: number; sourcesPrimaires: number; faitCle: boolean; web: number; ms: number; coutMicro: number; appels: number; etat: string; extrait: string; erreur?: string;
}
export const slug = (t: string) => t.replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '').toLowerCase();

export function noterFournisseurs(produits: Array<{ name: string; packageLabel?: string; priceText?: string }>, req: Pick<Requete, 'nom' | 'pack'>) {
  const pertinentes = produits.filter(p => req.nom.test(normaliser(p.name)));
  const exactes = pertinentes.filter(p => req.pack.test(normaliser(`${p.name} ${p.packageLabel ?? ''}`)));
  return { pertinentes: pertinentes.length, exactes: exactes.length };
}
export function noterReference(texte: string, sources: Array<{ title: string; url: string }>, q: Pick<Question, 'domaine' | 'faits'>) {
  return { sourcesPrimaires: sources.filter(s => q.domaine.test(normaliser(`${s.title} ${s.url}`))).length, faitCle: q.faits.every(f => f.test(normaliser(texte))) };
}

export async function jouerRecherche(options: { reglages: string[]; fournisseurs: string[]; references: string[]; sortie: string; fetchSignalMs?: number }, env: EnvT2, log: (l: string) => void = () => {}): Promise<SortieRecherche[]> {
  const sorties: SortieRecherche[] = [];
  const taches: Array<{ reglage: ReturnType<typeof parseReglage>; kind: 'fournisseurs' | 'reference'; id: string; query: string; req?: Requete; q?: Question }> = [];
  for (const texte of options.reglages) {
    const reglage = parseReglage(texte);
    for (const id of options.fournisseurs) { const req = REQUETES.find(r => r.id === id); if (!req) throw new Error(`Requête inconnue : ${id}`); taches.push({ reglage, kind: 'fournisseurs', id, query: req.query, req }); }
    for (const id of options.references) { const q = QUESTIONS.find(r => r.id === id); if (!q) throw new Error(`Question inconnue : ${id}`); taches.push({ reglage, kind: 'reference', id, query: q.query, q }); }
  }
  for (const t of taches) {
    if (env.arret.raison) break;
    const fichier = path.join(options.sortie, slug(t.reglage.id), `${t.kind}-${t.id}.json`);
    if (existsSync(fichier)) { log(`déjà joué : ${t.reglage.id} / ${t.id}`); sorties.push(JSON.parse(readFileSync(fichier, 'utf8'))); continue; }
    const mesures = { ms: 0, coutMicro: 0, web: 0, appels: 0, etat: '' };
    const call = async (body: Record<string, unknown>) => {
      const r = await appeler(env, { doc: `recherche-${t.kind}-${t.id}`, variante: 'research', reglage: t.reglage, body: corpsReglage(body, t.reglage, 6000), maxSortie: 6000, timeoutMs: 90_000 });
      mesures.ms += r.ms; mesures.coutMicro += r.coutMicro; mesures.web += r.web; mesures.appels++; mesures.etat = r.etat;
      if (!r.ok) throw new Error(`appel échoué : ${r.etat}`);
      return r.payload;
    };
    const signal = AbortSignal.timeout(options.fetchSignalMs ?? 120_000);
    let sortie: SortieRecherche;
    try {
      const nom = t.kind === 'fournisseurs' ? 'find_brewing_suppliers' : 'lookup_brewing_reference';
      const e = await researchBrewing(nom, t.query, 1, call, signal);
      const produits = (e.products ?? []).filter(p => p.verifiedBy === 'product-page').map(p => ({ name: p.name, url: p.url, supplier: p.supplier, packageLabel: p.packageLabel }));
      const texte = (e.data as any)?.researchers?.map((r: any) => r.snippet).join('\n') ?? '';
      const notes = t.kind === 'fournisseurs' ? { ...noterFournisseurs(produits, t.req!), sourcesPrimaires: 0, faitCle: false } : { pertinentes: 0, exactes: 0, ...noterReference(texte, e.sources ?? [], t.q!) };
      sortie = { reglage: t.reglage.id, kind: t.kind, id: t.id, utilisable: true, produits, ...notes, ...mesures, extrait: texte.slice(0, 300) };
    } catch (erreur) {
      if (env.arret.raison) { log(`ARRÊT (${env.arret.raison}) pendant ${t.reglage.id} / ${t.id}`); break; }
      sortie = { reglage: t.reglage.id, kind: t.kind, id: t.id, utilisable: false, produits: [], pertinentes: 0, exactes: 0, sourcesPrimaires: 0, faitCle: false, ...mesures, extrait: '', erreur: redact(String((erreur as Error).message).slice(0, 160), env.cle) };
    }
    mkdirSync(path.dirname(fichier), { recursive: true });
    writeFileSync(fichier, JSON.stringify(sortie, null, 1));
    sorties.push(sortie);
    log(`${t.reglage.id} / ${t.id} : ${sortie.utilisable ? 'ok' : 'INUTILISABLE'} ${t.kind === 'fournisseurs' ? `${sortie.pertinentes} pertinentes, ${sortie.exactes} exactes / ${sortie.produits.length} vérifiées` : `${sortie.sourcesPrimaires} source(s) primaire(s), fait clé ${sortie.faitCle ? 'oui' : 'non'}`}, ${sortie.web} requêtes web, ${(sortie.ms / 1000).toFixed(1)} s, ${(sortie.coutMicro / 1e6).toFixed(4)} CHF`);
  }
  return sorties;
}

export interface LigneRecherche extends StatCellule { kind: string; fiches: number; pertinentes: number; exactes: number; web: number; sourcesPrimaires: number; faitCle: number; questions: number }
export function agregerRecherche(sorties: SortieRecherche[]): LigneRecherche[] {
  const groupes = new Map<string, SortieRecherche[]>();
  for (const s of sorties) groupes.set(`${s.kind}|${s.reglage}`, [...(groupes.get(`${s.kind}|${s.reglage}`) ?? []), s]);
  return [...groupes.entries()].map(([cle, liste]) => {
    const [kind, reglage] = cle.split('|');
    const somme = (f: (s: SortieRecherche) => number) => liste.reduce((a, s) => a + f(s), 0);
    return { ...statCellule(reglage, liste.map(s => ({ ms: s.ms, coutMicro: s.coutMicro, utilisable: s.utilisable }))), kind, fiches: somme(s => s.produits.length), pertinentes: somme(s => s.pertinentes), exactes: somme(s => s.exactes),
      web: somme(s => s.web), sourcesPrimaires: somme(s => s.sourcesPrimaires), faitCle: liste.filter(s => s.faitCle).length, questions: liste.length };
  }).sort((a, b) => a.kind.localeCompare(b.kind) || a.reglage.localeCompare(b.reglage));
}
export function tableauRecherche(lignes: LigneRecherche[]): string {
  const f = lignes.filter(l => l.kind === 'fournisseurs'), r = lignes.filter(l => l.kind === 'reference');
  const sorties: string[] = [];
  if (f.length) sorties.push('Fournisseurs', '', '| réglage | requêtes | fiches vérifiées | pertinentes | exactes (conditionnement) | requêtes web | inutilisables | p50 s | p90 s | CHF/appel |', '|---|---|---|---|---|---|---|---|---|---|',
    ...f.map(l => `| ${l.reglage} | ${l.questions} | ${l.fiches} | ${l.pertinentes} | ${l.exactes} | ${l.web} | ${l.inutilisables} | ${f2(l.p50, 1)} | ${f2(l.p90, 1)} | ${f2(l.chfParAppel, 4)} |`), '');
  if (r.length) sorties.push('Référence fabricant', '', '| réglage | questions | source primaire citée | fait clé | requêtes web | inutilisables | p50 s | p90 s | CHF/appel |', '|---|---|---|---|---|---|---|---|---|',
    ...r.map(l => `| ${l.reglage} | ${l.questions} | ${l.sourcesPrimaires} | ${l.faitCle}/${l.questions} | ${l.web} | ${l.inutilisables} | ${f2(l.p50, 1)} | ${f2(l.p90, 1)} | ${f2(l.chfParAppel, 4)} |`));
  return sorties.join('\n');
}
export function grilleRecherche(): string {
  return ['# Grille de la recherche web (écrite avant les passes, 14.11.2026, voie t2c)', '',
    'Fournisseurs (un chercheur au lieu de trois : coût) : fiche pertinente = nom contient la variété ; exacte = en plus le conditionnement.',
    ...REQUETES.map(r => `- ${r.id} : « ${r.query} », nom /${r.nom.source}/, pack /${r.pack.source}/`), '',
    'Référence : source primaire = titre ou URL d’une source citée contient le domaine du fabricant ; fait clé = tous les motifs dans le texte.',
    ...QUESTIONS.map(q => `- ${q.id} : « ${q.query} », domaine /${q.domaine.source}/, faits ${q.faits.map(f => `/${f.source}/`).join(' et ')}`)].join('\n');
}

export function lireArgs(args: string[]) {
  const valeurs = (nom: string) => args.flatMap((a, i) => (a === nom && args[i + 1] !== undefined ? [args[i + 1]] : []));
  const une = (nom: string) => valeurs(nom)[0];
  const nombre = (nom: string, defaut: number) => { const v = une(nom); const n = v === undefined ? defaut : Number(v); if (!(n > 0)) throw new Error(`${nom} attend un nombre positif.`); return n; };
  const liste = (nom: string, defaut: string[]) => (une(nom) === undefined ? defaut : une(nom)!.split(',').filter(Boolean));
  return { simuler: args.includes('--simuler'), payant: args.includes('--payant'), tableau: args.includes('--tableau'), grille: args.includes('--grille'), reglages: valeurs('--reglage'),
    fournisseurs: liste('--fournisseurs', REQUETES.map(r => r.id)), references: liste('--references', []), sortie: une('--out') ?? `${DOSSIER_VOIE}/recherche`, plafondPasse: nombre('--plafond-passe', 0.5) };
}
export async function main(args: string[]) {
  const o = lireArgs(args);
  if (o.grille) { writeFileSync(path.join(DOSSIER_VOIE, 'GRILLE-recherche.md'), grilleRecherche()); console.log('GRILLE-recherche.md écrit.'); return; }
  if (o.tableau) {
    const fichiers = readdirSync(o.sortie, { withFileTypes: true }).filter(d => d.isDirectory()).flatMap(d => readdirSync(path.join(o.sortie, d.name)).filter(n => n.endsWith('.json')).map(n => JSON.parse(readFileSync(path.join(o.sortie, d.name, n), 'utf8')) as SortieRecherche));
    const texte = tableauRecherche(agregerRecherche(fichiers)); writeFileSync(path.join(o.sortie, 'tableau-recherche.md'), `${texte}\n`); console.log(texte); return;
  }
  if (!o.reglages.length) throw new Error('Au moins un --reglage <modèle>@<niveau>.');
  let env: EnvT2;
  if (o.simuler) env = creerEnv({ simuler: true, payant: false, plafondPasse: o.plafondPasse, journal: path.join(o.sortie, 'journal-simule.md') }, envoyerSimule());
  else {
    if (!o.payant) throw new Error('Passe payante : ajouter --payant --confirm-paid-ai (ou --simuler).');
    requirePaidAiTestOptIn({ label: `Banc t2c recherche (${o.reglages.join(' | ')}, passe ${o.plafondPasse} CHF)`, command: 'npx vite-node --config vitest.config.ts scripts/banc-t2c-recherche.ts -- --payant --confirm-paid-ai --reglage <modèle@niveau>' });
    const cle = readLocalKey();
    if (!cle) throw new Error('Aucune clé Gemini locale : aucun appel.');
    env = creerEnv({ simuler: false, payant: true, plafondPasse: o.plafondPasse, cle }, envoyerReseau(cle));
  }
  const sorties = await jouerRecherche({ reglages: o.reglages, fournisseurs: o.fournisseurs, references: o.references, sortie: o.sortie }, env, l => console.log(redact(l, env.cle)));
  console.log(`${o.simuler ? 'SIMULÉ ' : ''}Passe terminée : ${sorties.length} recherches, ${(env.depensePasseMicro / 1e6).toFixed(4)} CHF${env.arret.raison ? ` ; ARRÊT : ${env.arret.raison}` : ''}.`);
  if (env.arret.raison) process.exitCode = 2;
}
const estPrincipal = () => !process.env.VITEST && ['--simuler', '--payant', '--tableau', '--grille'].some(drapeau => process.argv.includes(drapeau));
if (estPrincipal()) main(process.argv.slice(2)).catch(erreur => { console.error(String(erreur?.message ?? erreur)); process.exitCode = 1; });
