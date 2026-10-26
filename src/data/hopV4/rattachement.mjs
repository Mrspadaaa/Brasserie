// Voie c6-catalogue-complet (26.10, D98, #187) : à quelle variété du catalogue se rattache une fiche de source, et quelles variétés
// les sources citent sans que le catalogue les connaisse. Partagé par scripts/collecte-hop/fusion.mjs (les valeurs) et par
// prototypes/houblons-v4/scripts/build-data.mjs (le catalogue et les mots) : une seule décision, deux lecteurs.
// Hors ligne, déterministe : lit src/data/hopSources/*.json et alias-noms.json (la table d'alias, relue à la main) ; aucune date.
//
// Règles de décision pour une fiche, dans l'ordre :
//  1. la collecte l'a rattachée à une variété (varietyId) et la vérification d'origine l'accepte : on garde (via « collecte »),
//     sauf identifiant fusionné (Equinox → Ekuanot) ;
//  2. un produit de forme (Cryo, T90, LUPOMAX, Pink Boots…) n'est pas une variété : hors de cette voie ;
//  3. le nom (fournisseur, parenthèses, codes de sélection et d'origine retirés) est dans la liste « à confirmer » : on ne force rien ;
//  4. le nom est dans la table d'alias, ou égal à un nom ou à un alias du catalogue ;
//     - une seule variété du catalogue : on s'y rattache ; si le nom ou la fiche annonce une origine que le catalogue n'a pas pour
//       cette variété (Cascade CHE, NZ Cascade, Cascade UK), la fiche se rattache à la variété la plus proche et porte
//       `origineNonRepertoriee` (l'origine lue) : l'écran mettra un astérisque ;
//     - plusieurs variétés (Perle GR/US) : celle dont l'origine est annoncée ; sinon « à confirmer » ;
//  5. sinon la fiche est la preuve d'une variété que le catalogue n'a pas : elle entre dans une variété nouvelle (id `sources-<nom>`).
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ICI = dirname(fileURLToPath(import.meta.url));
export const RACINE = resolve(ICI, '../../..');
export const DIR_SOURCES = resolve(RACINE, 'src/data/hopSources');
/** Les sources dont les noms attestent une variété (les 18 de la fusion, plus Freestyle Hops et l'IHPS, suivies par git). Beer Analytics (voie en cours) n'y est pas. */
export const SOURCES_NOMS = ['barthhaas', 'brewersfriend', 'britishhops', 'bsg', 'charlesfaram', 'crosbyhops', 'freestylehops', 'hopdatabase', 'hopsdirect', 'hopsjson', 'hopslist', 'hopsteiner', 'hpa', 'ihps', 'indiehops', 'johnihaas', 'nzhops', 'usahops', 'usda', 'yakimavalleyhops'];
export const PREFIXE_ID = 'sources-';

export const norm = (s) => String(s).normalize('NFKD').replace(/\p{M}/gu, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

/** Pays, en français comme le catalogue, d'un code ou d'un mot (clé normée). */
const PAYS = {
  us: 'États-Unis', usa: 'États-Unis', american: 'États-Unis', 'united states': 'États-Unis',
  gr: 'Allemagne', de: 'Allemagne', ger: 'Allemagne', germany: 'Allemagne',
  uk: 'Royaume-Uni', english: 'Royaume-Uni', 'united kingdom': 'Royaume-Uni', england: 'Royaume-Uni', 'great britain': 'Royaume-Uni',
  nz: 'Nouvelle-Zélande', 'new zealand': 'Nouvelle-Zélande',
  au: 'Australie', aus: 'Australie', australia: 'Australie',
  cz: 'Tchéquie', czech: 'Tchéquie', 'czech republic': 'Tchéquie', czechia: 'Tchéquie',
  si: 'Slovénie', slovenia: 'Slovénie', fr: 'France', france: 'France',
  bc: 'Canada', canada: 'Canada', rsa: 'Afrique du Sud', 'south africa': 'Afrique du Sud',
  pl: 'Pologne', poland: 'Pologne', jp: 'Japon', japan: 'Japon',
  german: 'Allemagne', french: 'France', australian: 'Australie',
  che: 'Suisse', ch: 'Suisse', swiss: 'Suisse', switzerland: 'Suisse', argentina: 'Argentine', arg: 'Argentine',
};
/** Codes d'origine retirés en début ou en fin de nom (« NZ Cascade », « Hallertau Tradition Gr »). */
const CODES = new Set(['us', 'usa', 'gr', 'de', 'ger', 'uk', 'nz', 'au', 'aus', 'cz', 'si', 'fr', 'bc', 'pl', 'jp', 'rsa', 'english', 'american', 'che', 'ch', 'swiss', 'german', 'french', 'czech', 'australian']);
/** Bruit des sources : codes de sélection (« Krush HBC 586 », « Amarillo VGXP01 c.v. »), mentions commerciales. */
const BRUIT = /\b(hbc|ycr|yqh|adha|vgxp\d*|hs|hpa|ihps|usda)\s*[a-z]?\d+[a-z0-9]*\b|\bc v\b|\bbrand\b|\bestate grown\b|\borganic\b|\bhop revolution\b|\bus\b$/g;
/** Produits de forme (cas b de c5) : ni une variété fraîche ni à rattacher ici. */
const RE_FORME = /\b(cryo|hyper ?boost|lupuln2|lupuln|lupomax|incognito|powder|poudre|pellets?|t90|t45|extract|extrait|co2|blend|oil|huile|juice|concentrate|isomerized|iso alpha|pink ?boots|dbl|lupulin|kief)\b/i;
export const estForme = (nom) => RE_FORME.test(String(nom));

/** Nom de variété sans le fournisseur (« Yakima Valley Hops - Krush » → « Krush »), sauf quand le segment avant le tiret est un produit. */
export const cle = (nom) => {
  const s = String(nom);
  const i = s.lastIndexOf(' - ');
  if (i < 0 || RE_FORME.test(s.slice(0, i))) return s;
  return s.slice(i + 3);
};

/** { k, pays } : la clé normée d'un nom (sans parenthèses, bruit ni codes d'origine) et les pays que son écriture annonce. */
export function strip(nom) {
  const pays = new Set();
  const brut = String(nom);
  for (const m of brut.matchAll(/\(([^)]+)\)/g)) { const p = PAYS[norm(m[1])]; if (p) pays.add(p); }
  const s = norm(brut.replace(/\([^)]*\)/g, ' ')).replace(BRUIT, ' ').replace(/\s+/g, ' ').trim();
  const t = s.split(' ').filter(Boolean).map((x) => (x === 'mt' ? 'mount' : x));
  while (t.length > 1 && CODES.has(t[0])) pays.add(PAYS[t.shift()]);
  while (t.length > 1 && CODES.has(t[t.length - 1])) pays.add(PAYS[t.pop()]);
  // Un nom réduit à du bruit (« HBC 630 ») garde sa forme normée, pour ne pas collisionner.
  if (t.length > 1 && /^hops?$/.test(t[t.length - 1])) t.pop();
  if (t.length) return { k: t.join(' '), pays };
  // Un nom réduit à un code de sélection (« HBC 638 c.v. », « Hbc 522 », « HS09326 ») : la clé est le code, sans les mots autour.
  const code = norm(nom).match(/\b(hbc|ycr|yqh|hs|hpa|ihps)\s*([a-z]?\d+[a-z0-9]*)/);
  return { k: code ? `${code[1]} ${code[2]}` : norm(nom), pays };
}

/** Les pays que la fiche écrit dans ses champs d'origine (BarthHaas, John I. Haas, Hopslist), en français. */
export function paysDeFiche(fiche) {
  const out = new Set();
  const lire = (x) => { for (const p of String(x).split(/[,;/]/)) { const f = PAYS[norm(p)]; if (f) out.add(f); } };
  for (const x of [fiche.origine, fiche.pays]) if (typeof x === 'string') lire(x);
  if (Array.isArray(fiche.listes?.origine)) for (const x of fiche.listes.origine) lire(x);
  return out;
}

// ───────────────────────── Vérification d'un rattachement de la collecte (ex-fusion.mjs, d3a) ─────────────────────────
const ORIGINES_ANNONCEES = PAYS;
/** Origines que le nom ou la fiche annoncent (suffixe « (UK) », préfixe « NZ »), en français comme le catalogue. */
export function originesAnnoncees(fiche, sid) {
  const out = new Set();
  const nom = String(fiche.nom);
  for (const m of nom.matchAll(/\(([^)]+)\)/g)) { const o = ORIGINES_ANNONCEES[m[1].trim().toLowerCase()]; if (o) out.add(o); }
  const pre = nom.match(/^([A-Za-z]{2,6})\s+\S/);
  if (pre && ORIGINES_ANNONCEES[pre[1].toLowerCase()] && !['che', 'ch', 'swiss', 'arg', 'argentina'].includes(pre[1].toLowerCase())) out.add(ORIGINES_ANNONCEES[pre[1].toLowerCase()]);
  const lo = fiche.listes?.origine;
  if (sid === 'hopslist' && Array.isArray(lo)) for (const x of lo) { const o = ORIGINES_ANNONCEES[String(x).trim().toLowerCase()]; if (o) out.add(o); }
  return out;
}
// Cas relus à la main (26.10) : le nom est ambigu même si l'origine ne l'est pas.
const REJETS_MANUELS = { 'hopdatabase|Wai': 'abréviation : l\'URL est celle de NZ Wai-iti, pas de Waimea' };
/** { ok, raison } pour le rattachement proposé par la collecte (v : variété du catalogue visée). */
export function verifierRattachement(sid, fiche, v) {
  if (!v) return { ok: false, raison: 'identifiant absent du catalogue' };
  const manuel = REJETS_MANUELS[`${sid}|${fiche.nom}`];
  if (manuel) return { ok: false, raison: manuel, definitif: true };
  const annoncees = originesAnnoncees(fiche, sid);
  if (annoncees.size > 0 && v.origin && !annoncees.has(v.origin)) {
    return { ok: false, raison: `origine annoncée (${[...annoncees].join(', ')}) différente de celle du catalogue (${v.origin})` };
  }
  return { ok: true, raison: null };
}

// ───────────────────────── La table d'alias ─────────────────────────
export function lireTable(chemin = resolve(ICI, 'alias-noms.json')) { return JSON.parse(readFileSync(chemin, 'utf8')); }

// ───────────────────────── Résolution d'un nom ─────────────────────────
const poser = (m, k, v) => { if (!k) return; const l = m.get(k) ?? []; m.set(k, l); if (!l.includes(v)) l.push(v); };
/** Index du catalogue de base (les variétés Beer Maverick fusionnées) : nom normé → ids, alias normé → ids. */
export function indexer(catalogue) {
  const noms = new Map(), alias = new Map(), parId = new Map(catalogue.map((v) => [v.id, v]));
  for (const v of catalogue) {
    poser(noms, strip(v.name).k, v.id);
    for (const a of v.aliases ?? []) if (/^[A-Za-zÀ-ÿ][A-Za-zÀ-ÿ .'-]{3,}$/.test(a)) poser(alias, strip(a).k, v.id);
  }
  return { noms, alias, parId };
}

/** Vérifie que la table ne pointe que vers des variétés du catalogue (une faute de frappe ne passe pas en silence). */
export function verifierTable(table, index) {
  const erreurs = [];
  for (const [k, id] of Object.entries(table.alias)) if (!index.parId.has(id)) erreurs.push(`alias « ${k} » → ${id} : absent du catalogue`);
  for (const [de, vers] of Object.entries(table.idsFusionnes)) if (!index.parId.has(vers)) erreurs.push(`id fusionné ${de} → ${vers} : absent du catalogue`);
  return erreurs;
}

/**
 * Où va un nom de source ? Rend { id, via, origineNonRepertoriee? } ou { statut, ... } ('forme', 'aconfirmer', 'nouveau').
 * `paysSup` : les pays que la fiche écrit en dehors du nom.
 */
export function resoudreNom(nom, index, table, paysSup = new Set()) {
  if (estForme(nom)) return { statut: 'forme' };
  const { k: k0, pays: paysNom } = strip(cle(nom));
  const k = table.synonymes[k0] ?? k0;
  const pays = new Set([...paysNom, ...paysSup]);
  if (!k) return { statut: 'nouveau', k, pays };
  if (table.exclus[k]) return { statut: 'exclu', k, raison: table.exclus[k] };
  if (table.aConfirmer[k]) return { statut: 'aconfirmer', k, raison: table.aConfirmer[k].raison, candidats: table.aConfirmer[k].candidats ?? [] };
  // Un nom qui porte une origine peut avoir sa propre cible (« Tettnanger » des États-Unis → Tettnang (US)).
  const parOrigine = [...pays].map((p) => table.alias[`${k}|${p}`]).find(Boolean);
  const candidats = parOrigine ? [parOrigine] : table.alias[k] ? [table.alias[k]] : [...(index.noms.get(k) ?? []), ...(index.alias.get(k) ?? []).filter((x) => !(index.noms.get(k) ?? []).includes(x))];
  const via = parOrigine || table.alias[k] ? 'alias' : (index.noms.get(k)?.length ? 'nom' : 'alias du catalogue');
  if (!candidats.length) return { statut: 'nouveau', k, pays };
  let id = null;
  if (candidats.length === 1) id = candidats[0];
  else {
    const dansPays = candidats.filter((c) => pays.has(index.parId.get(c).origin));
    if (dansPays.length === 1) id = dansPays[0];
    else return { statut: 'aconfirmer', k, raison: `plusieurs variétés du catalogue portent ce nom (${candidats.map((c) => index.parId.get(c).name).join(', ')}) et la fiche ne dit pas laquelle`, candidats };
  }
  const origine = index.parId.get(id).origin;
  const out = { id, via, k };
  if (pays.size > 0 && origine && !pays.has(origine)) out.origineNonRepertoriee = [...pays].sort().join(' / ');
  return out;
}

// ───────────────────────── Lecture des sources et décision pour chaque fiche ─────────────────────────
export function lireSources(ids = SOURCES_NOMS) {
  return new Map(ids.map((id) => [id, JSON.parse(readFileSync(resolve(DIR_SOURCES, `${id}.json`), 'utf8')).fiches ?? []]));
}
/** Clé d'une fiche : la source et son rang dans le fichier (les noms et les adresses se répètent). */
export const cleFiche = (sid, i) => `${sid}#${i}`;

const frequent = (liste) => { const m = new Map(); for (const x of liste) m.set(x, (m.get(x) ?? 0) + 1); return [...m.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0]?.[0] ?? null; };
const slug = (k) => k.replace(/ /g, '-');

/**
 * Décide, pour chaque fiche de chaque source, sa variété. `catalogue` : les variétés de base [{ id, name, aliases, origin }].
 * Rend { decisions: Map(cleFiche → décision), nouvelles: [variété], aConfirmer: [{ k, noms, sources, raison, candidats }] }.
 * Décision : { id, via, origineNonRepertoriee? } si rattachée ; sinon { id: null, statut, raison? }.
 */
export function analyser(sources, catalogue, table) {
  const index = indexer(catalogue);
  const decisions = new Map();
  const groupes = new Map(); // k → { noms: [], pays: [], fiches: [{ sid, i, nom }] }
  const confirmer = new Map();
  for (const [sid, fiches] of sources) {
    fiches.forEach((fiche, i) => {
      const cle0 = cleFiche(sid, i);
      const nom = String(fiche.nom);
      // 1. la collecte l'a rattachée
      if (fiche.varietyId) {
        const cible = table.idsFusionnes[fiche.varietyId] ?? fiche.varietyId;
        const v = index.parId.get(cible);
        const ver = verifierRattachement(sid, fiche, v);
        if (ver.ok) { decisions.set(cle0, { id: cible, via: 'collecte' }); return; }
        if (ver.definitif) { decisions.set(cle0, { id: null, statut: 'ecarte', raison: ver.raison, propose: cible }); return; }
        const r = resoudreNom(nom, index, table, paysDeFiche(fiche));
        if (r.id) { decisions.set(cle0, { id: r.id, via: `${r.via} (écarté par la vérification : ${ver.raison})`, ...(r.origineNonRepertoriee ? { origineNonRepertoriee: r.origineNonRepertoriee } : {}), ancien: cible }); return; }
        decisions.set(cle0, { id: null, statut: 'ecarte', raison: ver.raison, propose: cible });
        return;
      }
      const r = resoudreNom(nom, index, table, paysDeFiche(fiche));
      if (r.id) { decisions.set(cle0, { id: r.id, via: r.via, ...(r.origineNonRepertoriee ? { origineNonRepertoriee: r.origineNonRepertoriee } : {}) }); return; }
      if (r.statut === 'forme') { decisions.set(cle0, { id: null, statut: 'forme' }); return; }
      if (r.statut === 'exclu') { decisions.set(cle0, { id: null, statut: 'exclu', raison: r.raison }); return; }
      if (r.statut === 'aconfirmer') {
        decisions.set(cle0, { id: null, statut: 'aconfirmer', raison: r.raison });
        const g = confirmer.get(r.k) ?? { k: r.k, noms: new Set(), sources: new Set(), raison: r.raison, candidats: r.candidats };
        confirmer.set(r.k, g); g.noms.add(nom); g.sources.add(sid);
        return;
      }
      const g = groupes.get(r.k) ?? { noms: [], pays: [], fiches: [] };
      groupes.set(r.k, g);
      g.noms.push(cle(nom)); g.pays.push(...r.pays, ...paysDeFiche(fiche)); g.fiches.push({ sid, i, nom });
    });
  }
  const nouvelles = [];
  for (const [k, g] of [...groupes.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
    const id = `${PREFIXE_ID}${slug(k)}`;
    // Le nom affiché : l'écriture la plus fréquente qui n'a ni code ni bruit, sinon la plus fréquente.
    const sansPays = g.noms.map((n) => n.replace(/\s*\([^)]*\)/g, '').trim() || n);
    const propres = sansPays.filter((n) => norm(n) === k);
    const nom = frequent(propres.length ? propres : sansPays);
    const aliases = [...new Set(sansPays)].filter((n) => n !== nom).sort();
    const sourcesIds = [...new Set(g.fiches.map((f) => f.sid))].sort();
    const origine = frequent(g.pays);
    for (const f of g.fiches) decisions.set(cleFiche(f.sid, f.i), { id, via: 'nouvelle variété' });
    nouvelles.push({ id, name: nom, aliases, origin: origine, k, sources: sourcesIds, nbFiches: g.fiches.length });
  }
  const aConfirmer = [...confirmer.values()].map((g) => ({ k: g.k, noms: [...g.noms].sort(), sources: [...g.sources].sort(), raison: g.raison, candidats: g.candidats })).sort((a, b) => a.k.localeCompare(b.k));
  return { decisions, nouvelles, aConfirmer, index };
}
