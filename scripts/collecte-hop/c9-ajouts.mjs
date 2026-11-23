// Voie c9-ajouts-amertume (31.10, D199) : « Il doit manquer des choses ». Les variétés ajoutées par c6 (catalogue-ajouts.json) n'avaient souvent
// aucun α. Ce script ne devine rien : il CROISE les sources qui les décrivent et pose ce qu'elles disent, avec leur compte.
//
// Règles (paroles du brasseur, 31.10) :
//  - « Beer Maverick ne doit pas être la source de vérité » : une valeur est une plage croisée de plusieurs sources ; Beer Maverick en est une.
//  - Un houblon décrit par une seule source reste une variété et se montre : le compte de sources dit la confiance (`croise.<champ>.n`), jamais une exclusion.
//  - Seul ce qui n'est pas une variété (mélange de marque, lot de revendeur…), preuve à l'appui, reçoit `nature: 'produit' | 'inconnu'`
//    (table `natures` de alias-noms.json). C'est un drapeau : l'entrée reste.
//  - Un doublon se fond sur preuve (alias-noms.json : `alias`, `synonymes`, avec `preuvesC9`), jamais sur un nom proche.
//  - Une valeur déclarée par les recettes (Beer Analytics, moyenne des recettes de Brewer's Friend) n'est pas une fiche de producteur : elle porte la
//    marque `r` dans `croise` et son champ est listé dans `declare`. Elle ne sert de plage que si aucun producteur ne donne la valeur.
//  - Un inconnu n'est jamais 0.
//
// Lancement (depuis la racine) :
//   node scripts/collecte-hop/c9-ajouts.mjs --extraire    relit les fiches Beer Analytics (non suivies par git) et écrit c9-recettes-ba.json (suivi)
//   node scripts/collecte-hop/c9-ajouts.mjs               applique à src/data/hopV4/catalogue-ajouts.json (idempotent)
//   node scripts/collecte-hop/c9-ajouts.mjs --verifier    rend « C9 OK » ou la liste des écarts (n'écrit rien)
//   node scripts/collecte-hop/c9-ajouts.mjs --tableau     écrit tableau-des-76.md dans le dossier de la voie
// prototypes/houblons-v4/scripts/build-data.mjs appelle `appliquerC9` juste avant d'écrire catalogue-ajouts.json : le pipeline reste un point fixe.
import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { analyser, lireSources, lireTable, SOURCES_NOMS, cleFiche, strip, cle } from '../../src/data/hopV4/rattachement.mjs';

const ICI = dirname(fileURLToPath(import.meta.url));
const RACINE = resolve(ICI, '../..');
const F_AJOUTS = resolve(RACINE, 'src/data/hopV4/catalogue-ajouts.json');
const F_COMPLEMENTS = resolve(RACINE, 'src/data/hopV4/complements.json');
const F_PROTO = resolve(RACINE, 'src/data/hopV4/proto-data.json');
const F_BA = resolve(ICI, 'c9-recettes-ba.json');
const F_AVANT = resolve(ICI, 'c9-avant.json');
const DIR_SOURCES = resolve(RACINE, 'src/data/hopSources');
const DIR_VOIE = resolve(RACINE, 'work/missions/2026-10-25-integration-houblons/voies/c9-ajouts-amertume');
const lire = (p) => JSON.parse(readFileSync(p, 'utf8'));
const arr1 = (x) => Math.round(x * 10) / 10;
const fin = (x) => typeof x === 'number' && Number.isFinite(x);

// Champs croisés : nom dans l'ajout → nom dans complements.json. `recettes` : une valeur de recettes est admise comme repli (α et β seulement).
const CHAMPS = { alpha: { canon: 'alpha', recettes: true }, beta: { canon: 'beta', recettes: true }, cohumulone: { canon: 'cohumulone', recettes: false }, oil: { canon: 'huile', recettes: false } };
/** Seuil du calibrage d'une source qui n'écrit pas ses unités (HopDatabase, hops-json…) : part de ses valeurs qui recoupent celles des autres sources. */
const SEUIL_CALIBRAGE = 0.9;
const MIN_CALIBRAGE = 30;

// ───────────────────────── Beer Analytics : extraction (les fichiers par lettre ne sont pas suivis par git) ─────────────────────────
const PAYS_EN = { 'United States': 'États-Unis', 'Great Britain': 'Royaume-Uni', Germany: 'Allemagne', 'New Zealand': 'Nouvelle-Zélande', Australia: 'Australie', 'Czech Republic': 'Tchéquie', Slovenia: 'Slovénie', France: 'France', Poland: 'Pologne', Japan: 'Japon', 'South Africa': 'Afrique du Sud', Canada: 'Canada', Argentina: 'Argentine', Ukraine: 'Ukraine', Belgium: 'Belgique', Serbia: 'Serbie', Austria: 'Autriche' };
const origineBA = (brut) => {
  if (typeof brut !== 'string') return null;
  const noms = brut.split(',').map((x) => x.replace(/^[^A-Za-z]+/, '').trim()).filter(Boolean);
  const fr = noms.map((n) => PAYS_EN[n]).filter(Boolean);
  return noms.length === 1 && fr.length === 1 ? fr[0] : null; // plusieurs pays ou pays inconnu : pas d'origine (inconnu, jamais deviné)
};
/** Plage des recettes : du 10e au 90e centile de l'histogramme du site (classes pondérées par leur compte) ; sans histogramme, la valeur du milieu seule. */
function plageRecettes(champ, histo) {
  if (!champ || !fin(champ.milieu)) return null;
  const classes = histo?.classes ?? [];
  const total = classes.reduce((t, c) => t + (fin(c.compte) ? c.compte : 0), 0);
  if (total > 0) {
    let cum = 0, lo = null, hi = null;
    for (const c of classes) {
      cum += c.compte;
      if (lo === null && cum / total >= 0.1) lo = c.de;
      if (hi === null && cum / total >= 0.9) hi = c.a;
    }
    if (fin(lo) && fin(hi)) return { min: champ.min ?? null, milieu: champ.milieu, max: champ.max ?? null, plage: [arr1(lo), arr1(hi)], classes: classes.length };
  }
  return { min: champ.min ?? null, milieu: champ.milieu, max: champ.max ?? null, plage: [champ.milieu, champ.milieu], classes: 0 };
}
export function extraireBA() {
  const fichiers = readdirSync(DIR_SOURCES).filter((f) => /^beeranalytics-[A-Z]\.json$/.test(f)).sort();
  const out = [];
  for (const f of fichiers) {
    for (const fiche of lire(resolve(DIR_SOURCES, f)).fiches) {
      const c = fiche.champs ?? {};
      out.push({
        nom: fiche.nom, k: strip(cle(fiche.nom)).k, url: fiche.url, categorie: fiche.categorie ?? null,
        recettes: c.recettes?.valeur ?? null, usage: c.usage?.brut ?? null, alphaClasse: c.alphaClasse?.brut ?? null, origine: origineBA(c.origine?.brut),
        alpha: plageRecettes(c.alphaDesRecettes, fiche.stats?.['alpha-histogram']), beta: plageRecettes(c.betaDesRecettes, fiche.stats?.['beta-histogram']),
      });
    }
  }
  return out.sort((a, b) => a.nom.localeCompare(b.nom) || String(a.url).localeCompare(String(b.url)));
}
const PURPOSE_BA = { aroma: 'aroma', bittering: 'bittering', 'dual purpose': 'dual', dual: 'dual' };

// ───────────────────────── Brewer's Friend : moyenne des α déclarés par les recettes des utilisateurs ─────────────────────────
function recettesBF(fiche) {
  let n = 0, somme = 0;
  const moyennes = [];
  for (const f of fiche.formes ?? []) {
    const a = f.alphaMoyenRecettes?.valeur, r = f.recettes;
    // « Average AA 0 » (extrait, sans α) est un inconnu, jamais un 0 : la valeur doit être positive.
    if (fin(a) && a > 0 && fin(r) && r > 0) { n += r; somme += a * r; moyennes.push(a); }
  }
  if (!n) return null;
  return { n, moyenne: arr1(somme / n), min: Math.min(...moyennes), max: Math.max(...moyennes) };
}

// ───────────────────────── Calibrage des sources sans unité ─────────────────────────
const recoupe = (a, b) => (a[0] ?? -Infinity) <= (b[1] ?? Infinity) && (b[0] ?? -Infinity) <= (a[1] ?? Infinity);
/** Pour chaque (champ, source) dont les valeurs portent « unité non écrite » : la part qui recoupe l'enveloppe des valeurs sûres des AUTRES sources de la même variété. */
export function calibrer(complements) {
  const srcId = (idx) => complements.sources[idx].id;
  const stat = {};
  for (const [id, v] of Object.entries(complements.varietes)) {
    if (id.startsWith('sources-')) continue; // les variétés ajoutées n'entrent pas dans leur propre calibrage
    for (const [canon, c] of Object.entries(v.c ?? {})) {
      const sures = c.v.filter((x) => !x[3] && fin(x[1]) && fin(x[2]));
      for (const x of c.v) {
        if (x[3] !== 'h-unite-absente' || !fin(x[1]) || !fin(x[2])) continue;
        const s = srcId(v.f[x[0]][0]);
        const autres = sures.filter((y) => srcId(v.f[y[0]][0]) !== s);
        if (!autres.length) continue;
        const cle2 = `${canon}|${s}`;
        const st = (stat[cle2] ??= { champ: canon, source: s, n: 0, ok: 0 });
        st.n += 1;
        const lo = Math.min(...autres.map((y) => y[1])), hi = Math.max(...autres.map((y) => y[2]));
        if (recoupe([x[1], x[2]], [lo, hi])) st.ok += 1;
      }
    }
  }
  const liste = Object.values(stat).map((s) => ({ ...s, part: s.n ? s.ok / s.n : 0, admise: s.n >= MIN_CALIBRAGE && s.ok / s.n >= SEUIL_CALIBRAGE })).sort((a, b) => a.champ.localeCompare(b.champ) || a.source.localeCompare(b.source));
  return liste;
}

// ───────────────────────── Le croisement ─────────────────────────
const enveloppe = (voix) => {
  const ok = voix.filter((x) => fin(x[1]) && fin(x[2]));
  if (!ok.length) return null;
  return [Math.min(...ok.map((x) => x[1])), Math.max(...ok.map((x) => x[2]))];
};
const milieuDe = (x) => (x[1] + x[2]) / 2;

/** Les voix d'un champ pour une variété ajoutée : [source, lo, hi, marque]. f : fiche valide · u : unité non écrite, source calibrée · r : déclaré par les recettes · s : signalée (suspecte, hors plage) · x : écartée (unité ou base autre). */
function voixDe(id, champ, ctx) {
  const { complements, calib, recettes } = ctx;
  const v = complements.varietes[id];
  const out = [];
  for (const x of v?.c?.[CHAMPS[champ].canon]?.v ?? []) {
    const s = complements.sources[v.f[x[0]][0]].id;
    const code = x[3];
    const marque = !code ? 'f' : code === 'h-unite-absente' && calib.find((c) => c.champ === CHAMPS[champ].canon && c.source === s)?.admise ? 'u' : code.startsWith('s-') ? 's' : 'x';
    out.push([s, x[1], x[2], marque, ...(code ? [code] : [])]);
  }
  if (CHAMPS[champ].recettes) for (const r of recettes[champ] ?? []) out.push(r);
  return out;
}

/** Résume les voix d'un champ : plage, nombre de sources, écart, valeurs signalées. */
function croiser(voix) {
  const admises = voix.filter((x) => (x[3] === 'f' || x[3] === 'u') && fin(x[1]) && fin(x[2]));
  const recettes = voix.filter((x) => x[3] === 'r' && fin(x[1]) && fin(x[2]));
  const producteurs = admises.length > 0;
  const plage = enveloppe(producteurs ? admises : recettes);
  const comptables = [...admises, ...recettes];
  const sources = new Set(comptables.map((x) => x[0]));
  const milieux = comptables.map(milieuDe);
  const ecart = sources.size >= 2 ? arr1(Math.max(...milieux) - Math.min(...milieux)) : null;
  return { plage, n: sources.size, ecart, declare: !producteurs && !!plage, voix };
}

/**
 * Applique le croisement, les natures et les marques « déclaré par les recettes » aux variétés ajoutées.
 * `ctx` : { decision (rattachement.mjs), sources (lireSources), complements, table, ba (c9-recettes-ba.json) }.
 * Pure : rend un nouvel objet, ne lit rien du disque.
 */
export function appliquer(ajouts, ctx) {
  const { decision, sources, complements, table, ba } = ctx;
  const calib = calibrer(complements);
  const kDe = new Map(decision.nouvelles.map((n) => [n.id, n.k]));
  const baParK = new Map();
  for (const f of ba) { const k = table.synonymes?.[f.k] ?? f.k; if (!baParK.has(k)) baParK.set(k, []); baParK.get(k).push(f); }
  // Les fiches de chaque variété ajoutée : source → fiches.
  const fichesDe = new Map();
  for (const [sid, fiches] of sources) fiches.forEach((f, i) => { const d = decision.decisions.get(cleFiche(sid, i)); if (d?.id?.startsWith('sources-')) { if (!fichesDe.has(d.id)) fichesDe.set(d.id, []); fichesDe.get(d.id).push({ sid, f }); } });
  const natures = table.natures ?? {};
  const varieties = ajouts.varieties.map((v0) => {
    // Idempotence : un champ rempli par une passe précédente repart de zéro.
    const v = { ...v0 };
    for (const [champ, c] of Object.entries(v0.croise ?? {})) if (c.rempli) v[champ] = null;
    if (v0.purposeC9) v.purpose = null;
    if (v0.originC9) v.origin = null;
    delete v.croise; delete v.declare; delete v.nature; delete v.purposeC9; delete v.originC9;
    const baFiches = baParK.get(kDe.get(v.id)) ?? [];
    const bf = (fichesDe.get(v.id) ?? []).filter((x) => x.sid === 'brewersfriend').map((x) => recettesBF(x.f)).filter(Boolean);
    const recettes = { alpha: [], beta: [] };
    for (const b of baFiches) {
      if (b.alpha) recettes.alpha.push(['beeranalytics', b.alpha.plage[0], b.alpha.plage[1], 'r']);
      if (b.beta) recettes.beta.push(['beeranalytics', b.beta.plage[0], b.beta.plage[1], 'r']);
    }
    if (bf.length) {
      const n = bf.reduce((t, x) => t + x.n, 0);
      const m = arr1(bf.reduce((t, x) => t + x.moyenne * x.n, 0) / n);
      recettes.alpha.push(['brewersfriend', m, m, 'r']);
    }
    const croise = {}, declare = [];
    for (const champ of Object.keys(CHAMPS)) {
      const voix = voixDe(v.id, champ, { complements, calib, recettes });
      if (!voix.length) continue;
      const c = croiser(voix);
      const entree = { n: c.n, ecart: c.ecart, voix: c.voix };
      const plage = c.plage ? c.plage.map(arr1) : null;
      // Le champ de l'ajout : la plage croisée si elle existe ; sinon on garde ce que c6 avait (inchangé). Jamais 0.
      if (plage && fin(plage[0]) && fin(plage[1])) {
        const etaitVide = !v[champ];
        if (etaitVide) entree.rempli = true;
        v[champ] = plage;
        if (c.declare) declare.push(champ);
      }
      croise[champ] = entree;
    }
    // Usage selon Beer Analytics (catégorie de la page) : seulement si aucune autre source ne le donne. Marqué déclaré par les recettes.
    const usage = baFiches.map((b) => PURPOSE_BA[String(b.usage ?? '').toLowerCase()]).find(Boolean);
    if (usage && !v.purpose) { v.purpose = usage; v.purposeC9 = true; declare.push('purpose'); }
    if (!v.origin) { const o = baFiches.map((b) => b.origine).find(Boolean); if (o) { v.origin = o; v.originC9 = true; declare.push('origin'); } }
    if (Object.keys(croise).length) v.croise = croise;
    if (declare.length) v.declare = [...new Set(declare)].sort();
    const nat = natures[v.id];
    if (nat) v.nature = nat.nature;
    // Compte de sources : celles de c6 (hors Brewer's Friend) plus Beer Analytics ; `peuDeDonnees` = moins de deux sources ou pas d'α (sens inchangé, D175).
    const sourcesHorsIndex = new Set((fichesDe.get(v.id) ?? []).map((x) => x.sid).filter((s) => s !== 'brewersfriend'));
    if (baFiches.length) sourcesHorsIndex.add('beeranalytics');
    v.nbSources = Math.max(sourcesHorsIndex.size, v0.nbSources ?? 0);
    // Les voix qui ont donné une valeur (fiches, recettes) comptent pour la confiance, jamais pour l'exclusion (brasseur, 31.10).
    const voixSources = new Set(sourcesHorsIndex);
    for (const c of Object.values(croise)) for (const x of c.voix) if (['f', 'u', 'r'].includes(x[3])) voixSources.add(x[0]);
    v.peuDeDonnees = voixSources.size < 2 || !v.alpha;
    return v;
  });
  return { ...ajouts, varieties };
}

/** Variables d'amertume connues d'un ajout : α, β, cohumulone (le rôle ne vient que d'un fournisseur ou de l'α). */
export const sansAmertume = (v) => !v.alpha && !v.beta && !v.cohumulone && !(v.usage && v.usage.some((u) => u.roles?.length));

// ───────────────────────── Contexte autonome (hors build-data) ─────────────────────────
export function contexteAutonome() {
  const table = lireTable();
  const proto = lire(F_PROTO).varieties.filter((v) => v.id.startsWith('beermaverick-') && !table.idsFusionnes[v.id]);
  const sources = lireSources(SOURCES_NOMS);
  const decision = analyser(sources, proto, table);
  const complements = lire(F_COMPLEMENTS);
  const ba = lire(F_BA);
  return { decision, sources, complements, table, ba };
}
/** Appelé par build-data.mjs : même résultat que la ligne de commande, avec la décision de rattachement déjà calculée. */
export function appliquerC9(ajouts, { decision, sources, complements, table }) {
  return appliquer(ajouts, { decision, sources, complements, table, ba: lire(F_BA) });
}

// ───────────────────────── Vérification ─────────────────────────
function verifier() {
  const erreurs = [];
  const table = lireTable();
  const ajouts = lire(F_AJOUTS);
  const avant = lire(F_AVANT);
  const ctx = contexteAutonome();
  const proto = lire(F_PROTO).varieties;
  const ids = new Set(proto.map((v) => v.id));
  // 1. les ajouts du fichier sont ceux de la décision de rattachement (la table et le fichier racontent la même chose)
  const idsDecision = ctx.decision.nouvelles.map((n) => n.id).sort().join(',');
  const idsFichier = ajouts.varieties.map((v) => v.id).sort().join(',');
  if (idsDecision !== idsFichier) erreurs.push('les variétés ajoutées du fichier ne sont pas celles de la décision de rattachement (rejouer fusion.mjs puis build-data.mjs)');
  // 2. idempotence : appliquer au fichier ne change rien
  const re = JSON.stringify(appliquer(ajouts, ctx));
  if (re !== JSON.stringify(ajouts)) erreurs.push('catalogue-ajouts.json n\'est pas le résultat de c9-ajouts.mjs (rejouer sans argument)');
  // 3. aucun alias ne pointe hors du catalogue, chaque alias C9 a sa preuve
  for (const [k, cible] of Object.entries(table.alias)) if (!ids.has(cible)) erreurs.push(`alias « ${k} » : ${cible} absent du catalogue`);
  for (const k of Object.keys(table.preuvesC9 ?? {})) if (!(k in table.alias) && !(k in table.synonymes)) erreurs.push(`preuve C9 « ${k} » sans alias ni synonyme`);
  for (const k of Object.keys(table.alias)) if (k.startsWith('c9:')) erreurs.push(`clé d'alias réservée : ${k}`);
  // 4. aucun ajout dont le nom soit l'un des alias C9 (un doublon fondu ne revient pas en variété à part)
  const clesC9 = new Set(Object.keys(table.preuvesC9 ?? {}));
  for (const n of ctx.decision.nouvelles) if (clesC9.has(n.k)) erreurs.push(`« ${n.name} » est un alias prouvé mais reste une variété à part`);
  // 5. natures : valeurs permises, preuve écrite, id présent ; le drapeau est dans le fichier
  const permis = new Set(['produit', 'inconnu']);
  for (const [id, nat] of Object.entries(table.natures ?? {})) {
    const v = ajouts.varieties.find((x) => x.id === id);
    if (!v) { erreurs.push(`nature : ${id} absent des ajouts`); continue; }
    if (!permis.has(nat.nature)) erreurs.push(`nature « ${nat.nature} » (${id}) hors de produit | inconnu`);
    if (!nat.preuve || !nat.raison) erreurs.push(`nature de ${id} sans preuve`);
    if (v.nature !== nat.nature) erreurs.push(`${id} : drapeau nature absent du fichier`);
  }
  for (const v of ajouts.varieties) if (v.nature && !(table.natures ?? {})[v.id]) erreurs.push(`${v.id} : nature sans entrée dans la table`);
  // 6. jamais 0 pour un inconnu, plages à deux bornes, valeurs déclarées marquées
  for (const v of ajouts.varieties) {
    for (const champ of Object.keys(CHAMPS)) {
      const p = v[champ];
      if (p == null) continue;
      if (!Array.isArray(p) || p.length !== 2 || !p.every(fin)) erreurs.push(`${v.id}.${champ} : plage mal formée`);
      else if (p[0] === 0 && p[1] === 0 && champ !== 'cohumulone') erreurs.push(`${v.id}.${champ} : [0, 0] (un inconnu n'est jamais 0)`);
      const c = v.croise?.[champ];
      if (c?.rempli && !c.voix.length) erreurs.push(`${v.id}.${champ} : rempli sans source`);
    }
    for (const champ of v.declare ?? []) if (['alpha', 'beta'].includes(champ) && !v.croise?.[champ]?.voix?.some((x) => x[3] === 'r')) erreurs.push(`${v.id}.${champ} déclaré par les recettes sans voix de recettes`);
  }
  // 7. le compte : jamais plus d'ajouts sans amertume qu'avant ; la liste des 76 figée reste lisible
  const ajoutsParId = new Map(ajouts.varieties.map((v) => [v.id, v]));
  const restants = avant.ids.filter((id) => ajoutsParId.has(id) && sansAmertume(ajoutsParId.get(id)));
  if (restants.length > avant.ids.length) erreurs.push('plus d\'ajouts sans amertume qu\'avant');
  // 8. Beer Analytics : l'extraction se rejoue si les fiches sont là (elles ne sont pas suivies par git)
  let ba = 'extraction Beer Analytics non rejouée (fiches absentes)';
  if (existsSync(resolve(DIR_SOURCES, 'beeranalytics-A.json'))) {
    ba = 'extraction Beer Analytics rejouée';
    if (JSON.stringify(extraireBA()) !== JSON.stringify(lire(F_BA))) erreurs.push('c9-recettes-ba.json n\'est pas l\'extraction des fiches Beer Analytics (rejouer --extraire)');
  }
  return { erreurs, restants: restants.length, avant: avant.ids.length, ba, ajouts: ajouts.varieties.length };
}

// ───────────────────────── Tableau des 76 ─────────────────────────
function tableau() {
  const ctx = contexteAutonome();
  const ajouts = lire(F_AJOUTS);
  const avant = lire(F_AVANT);
  const par = new Map(ajouts.varieties.map((v) => [v.id, v]));
  const fiches = new Map();
  for (const [sid, liste] of ctx.sources) liste.forEach((f, i) => { const d = ctx.decision.decisions.get(cleFiche(sid, i)); if (d?.id) { if (!fiches.has(d.id)) fiches.set(d.id, []); fiches.get(d.id).push({ sid, f }); } });
  const txt = (x) => String(x ?? '').replace(/\|/g, '/');
  const plage = (p) => (p ? `${p[0]}–${p[1]}` : '—');
  const lignes = [];
  for (const id of avant.ids) {
    const v = par.get(id);
    const k = id.replace(/^sources-/, '').replace(/-/g, ' ');
    const nat = (ctx.table.natures ?? {})[id];
    const proche = (ctx.table.procheNonProuve ?? {})[id];
    const nomBrut = (fiches.get(id) ?? [])[0]?.f.nom ?? k;
    let e;
    if (!v) {
      const cible = ctx.table.alias[k] ?? (ctx.table.synonymes[k] ? `l'ajout « ${ctx.table.synonymes[k]} »` : null);
      e = cible ? { cause: `doublon fondu dans ${cible}`, preuve: ctx.table.preuvesC9[k] } : { cause: 'marque de commerce : les fiches vont à la variété écrite avant la marque (rattachement.mjs, MARQUES)', preuve: `fiches HopDatabase « ${k} » dont l'adresse Yakima Chief porte « trade-brand-machops »` };
      lignes.push(`| ${txt(id.replace(/^sources-/, ''))} | ${txt(e.cause)} | ${txt(e.preuve)} | — | — | — | — |`);
      continue;
    }
    const aA = v.alpha ? (v.declare?.includes('alpha') ? 'donnée trouvée : α déclaré par les recettes seulement' : 'donnée trouvée : α de fiches de sources (non fusionné avant : unité non écrite, ou source unique)') : null;
    e = nat ? { cause: `pas une variété (${nat.raison})`, preuve: nat.preuve }
      : v.alpha ? { cause: aA, preuve: `nom « ${nomBrut} » dans ${[...new Set((fiches.get(id) ?? []).map((x) => x.sid))].join(', ') || 'Beer Analytics'}` }
        : { cause: `rien nulle part (α, β, cohumulone inconnus)${proche ? ` ; proche de ${proche}, non fondu faute de preuve` : ''}`, preuve: `nom « ${nomBrut} »` };
    if (proche && v.alpha) e.cause += ` ; proche de ${proche}, non fondu faute de preuve`;
    const srcs = [...new Set((fiches.get(id) ?? []).map((x) => x.sid))];
    if (ctx.ba.some((b) => (ctx.table.synonymes?.[b.k] ?? b.k) === [...ctx.decision.nouvelles].find((n) => n.id === id)?.k)) srcs.push('beeranalytics');
    const url = (fiches.get(id) ?? [])[0]?.f.url ?? v.url ?? '';
    const marq = (champ) => (v.declare?.includes(champ) ? ' (recettes)' : '');
    const n = Math.max(0, ...Object.values(v.croise ?? {}).map((c) => c.n));
    lignes.push(`| ${txt(v.name)} | ${txt(e?.cause)}${v.nature ? ` ; nature ${v.nature}` : ''} | ${txt(e?.preuve)} ${url ? `— ${url}` : ''} | ${srcs.join(', ') || '—'} (${srcs.length}) | α ${plage(v.alpha)}${marq('alpha')} · β ${plage(v.beta)}${marq('beta')} · cohu ${plage(v.cohumulone)} · huile ${plage(v.oil)} | ${v.purpose ?? '—'}${marq('purpose')} | ${n || '—'} |`);
  }
  const entete = '| Variété | Cause | Preuve (nom dans la source, URL) | Sources qui la citent (compte) | Trouvé | Usage | Sources de la valeur |\n|---|---|---|---|---|---|---|';
  return `# Les 76 ajouts sans amertume (c9, D199)\n\nÉtat « avant » : c9-avant.json (${avant.ids.length} ajouts sans α, β ni cohumulone).\n\n${entete}\n${lignes.join('\n')}\n`;
}

// ───────────────────────── Ligne de commande ─────────────────────────
const direct = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (direct) {
  const args = process.argv.slice(2);
  if (args.includes('--extraire')) {
    const ba = extraireBA();
    writeFileSync(F_BA, JSON.stringify(ba) + '\n');
    console.log(`C9 extraction ${ba.length} fiches Beer Analytics, ${ba.filter((b) => b.alpha).length} avec α des recettes → c9-recettes-ba.json`);
  } else if (args.includes('--verifier')) {
    const r = verifier();
    if (r.erreurs.length) { console.log(`C9 ECHEC (${r.erreurs.length})`); for (const e of r.erreurs) console.log(` - ${e}`); process.exitCode = 1; }
    else console.log(`C9 OK — ${r.ajouts} ajouts, sans amertume connue : ${r.avant} avant → ${r.restants} maintenant ; ${r.ba}`);
  } else if (args.includes('--tableau')) {
    writeFileSync(resolve(DIR_VOIE, 'tableau-des-76.md'), tableau());
    console.log('C9 tableau écrit');
  } else if (args.includes('--calibrage')) {
    for (const c of calibrer(lire(F_COMPLEMENTS))) console.log(`${c.champ.padEnd(11)} ${c.source.padEnd(12)} n=${String(c.n).padStart(4)} recoupe ${(c.part * 100).toFixed(0)} % ${c.admise ? 'ADMISE' : 'refusée'}`);
  } else {
    const ctx = contexteAutonome();
    const avant = lire(F_AJOUTS);
    const apres = appliquer(avant, ctx);
    const texte = JSON.stringify(apres);
    writeFileSync(F_AJOUTS, texte);
    console.log(`C9 appliqué : ${apres.varieties.length} ajouts, sans amertume connue ${apres.varieties.filter(sansAmertume).length}`);
  }
}
