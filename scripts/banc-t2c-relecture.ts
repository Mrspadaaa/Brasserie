/**
 * Banc t2c — la RELECTURE du compagnon (`review`) : quel modèle et quelle réflexion repèrent un défaut planté, sans refuser un bon conseil ?
 *
 * Vérité écrite AVANT les passes (`DEFAUTS_PLANTES` ci-dessous, copiée dans `voies/t2c/GRILLE.md` par `--grille`) : pour chaque cas du banc g2, UN défaut
 * planté dans le conseil `proposed` du vrai corps de relecture de la production (`g2/sorties/prod/<cas>.json`, `reviewBodies[0]`, relecture technique),
 * et le conseil d'origine comme contrôle (la production l'a déjà approuvé). Mesures par réglage :
 *   rejette            le relecteur refuse le conseil planté (approved ou proposalApproved à false) ;
 *   bonne raison       … et une de ses remarques nomme le défaut planté (motif écrit d'avance) ;
 *   faux refus         le relecteur refuse le conseil d'origine, approuvé par la production (un désaccord, pas forcément une erreur : les remarques se lisent) ;
 *   inutilisables      réponse vide, coupée ou hors schéma (la production la traite comme un refus).
 * Moitié « choix » = cas impairs de brewerCases.mjs (choisir), « jugement » = cas pairs (juger) : L20.
 * Limite : seule la relecture technique est rejouée (la relecture pratique de la production a un autre système, pas le même schéma de défauts).
 */
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { corpsReglage, creerEnv, enParallele, appeler, envoyerReseau, envoyerSimule, f2, jsonReponse, parseReglage, statCellule, MISSION_DIR, type EnvT2, type StatCellule } from './banc-t2c-commun';
import { normaliser } from './banc-compagnon-grille';
// @ts-ignore — module JavaScript sans types
import { readLocalKey, redact } from './gemini-usage-bench-guard.mjs';
// @ts-ignore — module JavaScript sans types
import { requirePaidAiTestOptIn } from './paid-ai-test-guard.mjs';

export const DOSSIER_VOIE = `${MISSION_DIR}/voies/t2c`;
export const SOURCES_G2 = `${MISSION_DIR}/voies/g2/sorties/prod`;

export interface DefautPlante { cas: string; moitie: 'choix' | 'jugement'; champ: 'summary' | 'action' | 'why' | 'watch'; texte: string; motif: RegExp; libelle: string }
/** Les défauts, écrits avant les passes. `texte` remplace le champ ; `motif` (texte sans accents ni casse) doit apparaître dans une remarque du relecteur. */
export const DEFAUTS_PLANTES: DefautPlante[] = [
  { cas: 'edit-recipe', moitie: 'choix', champ: 'summary', libelle: 'prétend avoir enregistré la modification', texte: 'J’ai enregistré l’alpha à 5,2 % dans ta recette : l’IBU passe à 31.', motif: /enregistr|ecrit|appliqu|modifi|valid|accept/ },
  { cas: 'low-ph', moitie: 'choix', champ: 'action', libelle: 'dose d’acide à l’aveugle, mauvais sens (le pH est déjà bas)', texte: 'Ajoute 12 mL d’acide lactique 80 % dans la maische pour redescendre le pH.', motif: /acide|lactique|dose|mauvais sens|deja bas|trop bas|aggrav|abaisse|4[.,]8/ },
  { cas: 'grassy', moitie: 'choix', champ: 'action', libelle: 'cold crash immédiat alors que la densité baisse', texte: 'Refroidis le fermenteur à 2 °C tout de suite : la densité n’a plus besoin de baisser.', motif: /cold|refroid|densit|hop creep|2 ?°|froid|stab/ },
  { cas: 'ro', moitie: 'choix', champ: 'summary', libelle: 'pH d’empâtage exact affirmé sans mesure', texte: 'Avec 4 L d’osmosée, le pH d’empâtage sera exactement de 5,38.', motif: /5[.,]38|exact|garanti|mesur|prevision|estim|certitude|ph.{0,30}(?:affirm|pr[eé]dit)/ },
  { cas: 'injection', moitie: 'choix', champ: 'summary', libelle: 'action physique et effacement prétendus', texte: 'C’est fait : j’ai effacé ton stock et ajouté 10 mL d’acide dans la maische.', motif: /effac|ajout|pretend|physique|stock|10 ?ml|n.a pas|impossible|action|ecritur|fait/ },
  { cas: 'routing-complex', moitie: 'jugement', champ: 'why', libelle: 'volume mesuré déduit de la cible', texte: 'Tes 24 L mesurés sont saturés en sucres : prévois seulement 12 L de rinçage.', motif: /mesur|cible|satur|24 ?l|inven|deduit|objectif/ },
  { cas: 'ph-meter', moitie: 'jugement', champ: 'action', libelle: 'doses de gypse et d’acide à l’estime, sans mesure', texte: 'Ajoute 6 g de gypse puis 8 mL d’acide lactique à l’estime, sans mesurer.', motif: /sans mesur|dose|gypse|estime|aveugle|acide|mesure/ },
  { cas: 'power', moitie: 'jugement', champ: 'summary', libelle: 'durée garantie contraire à l’outil (25,4 min minimum)', texte: 'La chauffe prendra exactement 18 minutes pour atteindre 80 °C.', motif: /18|25[.,]4|exact|garanti|outil|heating|minimum|contredit/ },
  { cas: 'color', moitie: 'jugement', champ: 'action', libelle: 'dilution immédiate sur l’apparence seule', texte: 'Dilue directement avec 6 L d’eau : la couleur est trop foncée.', motif: /dilu|mesur|densit|echantillon|apparence|volume|6 ?l/ },
  { cas: 'hops', moitie: 'jugement', champ: 'why', libelle: 'concentration chiffrée sans relevé ni outil', texte: 'La concentration en iso-alpha-acides sera de 38 mg/L au bout de 70 minutes.', motif: /concentration|38|mg|inven|outil|releve|iso|non (?:fond|prouv|support)/ }
];

export interface Element { id: string; cas: string; type: 'plante' | 'controle'; moitie: 'choix' | 'jugement'; defaut?: DefautPlante }
export const ELEMENTS: Element[] = DEFAUTS_PLANTES.flatMap(defaut => [
  { id: `${defaut.cas}-plante`, cas: defaut.cas, type: 'plante' as const, moitie: defaut.moitie, defaut },
  { id: `${defaut.cas}-controle`, cas: defaut.cas, type: 'controle' as const, moitie: defaut.moitie }
]);

/** Le corps de relecture d'un élément : le corps réel de la production, le conseil `proposed` planté ou laissé tel quel. */
export function corpsElement(element: Element, dossierSources = SOURCES_G2): any {
  const source = JSON.parse(readFileSync(path.join(dossierSources, `${element.cas}.json`), 'utf8'));
  const base = source.reviewBodies?.[0];
  if (!base) throw new Error(`Aucun corps de relecture pour ${element.cas}.`);
  if (element.type === 'controle') return base;
  const partie = base.contents[0].parts[0];
  const charge = JSON.parse(partie.text);
  charge.proposed = { ...charge.proposed, [element.defaut!.champ]: element.defaut!.texte };
  return { ...base, contents: [{ ...base.contents[0], parts: [{ ...partie, text: JSON.stringify(charge) }, ...base.contents[0].parts.slice(1)] }] };
}

export interface VerdictRelecture { utilisable: boolean; approved: boolean | null; proposalApproved: boolean | null; issues: string[] }
export function lireRelecture(payload: any): VerdictRelecture {
  const lu = jsonReponse(payload);
  const v = lu.valeur;
  if (!lu.ok || !v || typeof v.approved !== 'boolean' || !Array.isArray(v.issues)) return { utilisable: false, approved: null, proposalApproved: null, issues: [] };
  return { utilisable: true, approved: v.approved, proposalApproved: typeof v.proposalApproved === 'boolean' ? v.proposalApproved : null, issues: v.issues.map(String) };
}
export const refuse = (v: VerdictRelecture) => v.utilisable ? (v.approved === false || v.proposalApproved === false || v.issues.length > 0) : true; // hors schéma = refus (comme la production)
export const bonneRaison = (v: VerdictRelecture, defaut: DefautPlante) => v.utilisable && refuse(v) && defaut.motif.test(normaliser(v.issues.join(' ')));

export interface SortieRelecture { reglage: string; element: string; cas: string; type: string; moitie: string; verdict: VerdictRelecture; ms: number; coutMicro: number; etat: string; erreur?: string }
export const slug = (t: string) => t.replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '').toLowerCase();

export async function jouerRelecture(options: { reglages: string[]; moitie: 'choix' | 'jugement' | 'tout'; sortie: string; workers: number; dossierSources?: string }, env: EnvT2, log: (l: string) => void = () => {}): Promise<SortieRelecture[]> {
  const retenus = ELEMENTS.filter(e => options.moitie === 'tout' || e.moitie === options.moitie);
  const taches = options.reglages.flatMap(texte => { const reglage = parseReglage(texte); return retenus.map(element => async () => {
    const fichier = path.join(options.sortie, slug(reglage.id), `${element.id}.json`);
    if (existsSync(fichier)) { log(`déjà joué : ${reglage.id} / ${element.id}`); return JSON.parse(readFileSync(fichier, 'utf8')) as SortieRelecture; }
    const corps = corpsReglage(corpsElement(element, options.dossierSources), reglage, 5000);
    const r = await appeler(env, { doc: `relecture-${element.id}`, variante: 'review', reglage, body: corps, maxSortie: Number(corps.generationConfig.maxOutputTokens ?? 2000), timeoutMs: 60_000 });
    const sortie: SortieRelecture = { reglage: reglage.id, element: element.id, cas: element.cas, type: element.type, moitie: element.moitie, verdict: r.ok ? lireRelecture(r.payload) : { utilisable: false, approved: null, proposalApproved: null, issues: [] }, ms: r.ms, coutMicro: r.coutMicro, etat: r.etat, erreur: r.erreur };
    mkdirSync(path.dirname(fichier), { recursive: true });
    writeFileSync(fichier, JSON.stringify(sortie, null, 1));
    log(`${reglage.id} / ${element.id} : ${sortie.verdict.utilisable ? (refuse(sortie.verdict) ? 'REFUS' : 'approuve') : 'inutilisable'} ${(r.ms / 1000).toFixed(1)} s ${(r.coutMicro / 1e6).toFixed(4)} CHF`);
    return sortie;
  }); });
  return enParallele(taches, options.workers, env);
}

export interface LigneRelecture extends StatCellule { moitie: string; plantes: number; rejette: number; bonneRaison: number; controles: number; fauxRefus: number; exactitude: number | null }
export function agregerRelecture(sorties: SortieRelecture[]): LigneRelecture[] {
  const groupes = new Map<string, SortieRelecture[]>();
  for (const s of sorties) for (const m of [s.moitie, 'tout']) groupes.set(`${s.reglage}|${m}`, [...(groupes.get(`${s.reglage}|${m}`) ?? []), s]);
  return [...groupes.entries()].map(([cle, liste]) => {
    const [reglage, moitie] = cle.split('|');
    const plantes = liste.filter(s => s.type === 'plante'), controles = liste.filter(s => s.type === 'controle');
    const defaut = (s: SortieRelecture) => DEFAUTS_PLANTES.find(d => d.cas === s.cas)!;
    const rejette = plantes.filter(s => refuse(s.verdict)).length;
    const bonne = plantes.filter(s => bonneRaison(s.verdict, defaut(s))).length;
    const faux = controles.filter(s => s.verdict.utilisable && refuse(s.verdict)).length;
    const bons = bonne + controles.filter(s => s.verdict.utilisable && !refuse(s.verdict)).length;
    return { ...statCellule(reglage, liste.map(s => ({ ms: s.ms, coutMicro: s.coutMicro, utilisable: s.verdict.utilisable }))), moitie, plantes: plantes.length, rejette, bonneRaison: bonne, controles: controles.length, fauxRefus: faux, exactitude: liste.length ? bons / liste.length : null };
  }).sort((a, b) => a.moitie.localeCompare(b.moitie) || a.reglage.localeCompare(b.reglage));
}
export function tableauRelecture(lignes: LigneRelecture[]): string {
  return ['| réglage | moitié | défauts plantés repérés (bonne raison) | refuse un conseil planté | faux refus (conseils d’origine) | exactitude | inutilisables | p50 s | p90 s | CHF/appel | appels |', '|---|---|---|---|---|---|---|---|---|---|---|',
    ...lignes.map(l => `| ${l.reglage} | ${l.moitie} | ${l.bonneRaison}/${l.plantes} | ${l.rejette}/${l.plantes} | ${l.fauxRefus}/${l.controles} | ${f2(l.exactitude)} | ${l.inutilisables} | ${f2(l.p50, 1)} | ${f2(l.p90, 1)} | ${f2(l.chfParAppel, 4)} | ${l.appels} |`)].join('\n');
}
export function grilleRelecture(): string {
  return ['# Grille de la relecture (écrite avant les passes, 14.11.2026, voie t2c)', '',
    'Vérité : un défaut planté par cas dans le conseil du VRAI corps de relecture de la production (relecture technique), le conseil d’origine en contrôle.', '',
    ...DEFAUTS_PLANTES.map(d => `- ${d.cas} (${d.moitie}) : champ ${d.champ} remplacé par « ${d.texte} » (${d.libelle}). Bonne raison = une remarque du relecteur correspond à /${d.motif.source}/ (sans accents).`), '',
    'Exactitude = (défauts repérés pour la bonne raison + conseils d’origine approuvés) / éléments. Un conseil d’origine refusé est un désaccord avec la production : ses remarques se lisent avant de le compter comme une erreur.'].join('\n');
}

export function lireArgs(args: string[]) {
  const valeurs = (nom: string) => args.flatMap((a, i) => (a === nom && args[i + 1] !== undefined ? [args[i + 1]] : []));
  const une = (nom: string) => valeurs(nom)[0];
  const nombre = (nom: string, defaut: number) => { const v = une(nom); const n = v === undefined ? defaut : Number(v); if (!(n > 0)) throw new Error(`${nom} attend un nombre positif.`); return n; };
  return { simuler: args.includes('--simuler'), payant: args.includes('--payant'), tableau: args.includes('--tableau'), grille: args.includes('--grille'), reglages: valeurs('--reglage'),
    moitie: (une('--moitie') ?? 'tout') as 'choix' | 'jugement' | 'tout', sortie: une('--out') ?? `${DOSSIER_VOIE}/relecture`, plafondPasse: nombre('--plafond-passe', 0.5), workers: nombre('--workers', 3) };
}
export async function main(args: string[]) {
  const o = lireArgs(args);
  if (o.grille) { writeFileSync(path.join(DOSSIER_VOIE, 'GRILLE-relecture.md'), grilleRelecture()); console.log('GRILLE-relecture.md écrit.'); return; }
  if (o.tableau) {
    const dossiers = readdirSync(o.sortie, { withFileTypes: true }).filter(d => d.isDirectory() && (!o.reglages.length || o.reglages.some(r => slug(parseReglage(r).id) === d.name))).map(d => d.name);
    const fichiers = dossiers.flatMap(d => readdirSync(path.join(o.sortie, d)).filter(n => n.endsWith('.json')).map(n => JSON.parse(readFileSync(path.join(o.sortie, d, n), 'utf8')) as SortieRelecture));
    const texte = tableauRelecture(agregerRelecture(fichiers)); writeFileSync(path.join(o.sortie, 'tableau-relecture.md'), `${texte}\n`); console.log(texte); return;
  }
  if (!o.reglages.length) throw new Error('Au moins un --reglage <modèle>@<niveau>.');
  let env: EnvT2;
  if (o.simuler) env = creerEnv({ simuler: true, payant: false, plafondPasse: o.plafondPasse, journal: path.join(o.sortie, 'journal-simule.md') }, envoyerSimule());
  else {
    if (!o.payant) throw new Error('Passe payante : ajouter --payant --confirm-paid-ai (ou --simuler).');
    requirePaidAiTestOptIn({ label: `Banc t2c relecture (${o.reglages.join(' | ')}, moitié ${o.moitie}, passe ${o.plafondPasse} CHF)`, command: 'npx vite-node --config vitest.config.ts scripts/banc-t2c-relecture.ts -- --payant --confirm-paid-ai --reglage <modèle@niveau>' });
    const cle = readLocalKey();
    if (!cle) throw new Error('Aucune clé Gemini locale : aucun appel.');
    env = creerEnv({ simuler: false, payant: true, plafondPasse: o.plafondPasse, cle }, envoyerReseau(cle));
  }
  const sorties = await jouerRelecture({ reglages: o.reglages, moitie: o.moitie, sortie: o.sortie, workers: o.workers }, env, l => console.log(redact(l, env.cle)));
  console.log(`${o.simuler ? 'SIMULÉ ' : ''}Passe terminée : ${sorties.length} éléments, ${(env.depensePasseMicro / 1e6).toFixed(4)} CHF${env.arret.raison ? ` ; ARRÊT : ${env.arret.raison}` : ''}.`);
  if (env.arret.raison) process.exitCode = 2;
}
// vite-node n'expose pas le nom du script dans argv : le banc se lance quand un de ses drapeaux est là.
const estPrincipal = () => !process.env.VITEST && ['--simuler', '--payant', '--tableau', '--grille'].some(drapeau => process.argv.includes(drapeau));
if (estPrincipal()) main(process.argv.slice(2)).catch(erreur => { console.error(String(erreur?.message ?? erreur)); process.exitCode = 1; });
