// Inventaire des variétés de houblon citées par les sources et absentes du catalogue v4.
// Lecture seule : ne touche ni src/ ni scripts/. Sortie : manquants.json (dans ce dossier) et un résumé sur stdout.
// Déterministe : aucune date ni aléa dans la sortie.

import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ici = dirname(fileURLToPath(import.meta.url));
const racine = resolve(ici, '../../../../..');
const DIR_SOURCES = resolve(racine, 'src/data/hopSources');
const CATALOGUE = resolve(racine, 'src/data/hopV4/proto-data.json');
const NON_RATTACHEES = resolve(racine, 'src/data/hopV4/complements-non-rattachees.json');
const FUSION = resolve(racine, 'scripts/collecte-hop/fusion.mjs');
const SORTIE = resolve(ici, 'manquants.json');

const lire = (p) => JSON.parse(readFileSync(p, 'utf8'));

// Normalisation : copie exacte de la ligne 207 de scripts/collecte-hop/fusion.mjs.
// fusion.mjs n'exporte pas sa fonction et s'exécute en entier à l'import (il écrit complements.json),
// donc on la réemploie à l'identique, et on vérifie ci-dessous qu'elle figure toujours dans fusion.mjs.
const NORM_SRC = String.raw`const norm = (s) => String(s).normalize('NFKD').replace(/\p{M}/gu, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();`;
const normeSynchro = readFileSync(FUSION, 'utf8').includes(NORM_SRC);
const norm = (s) => String(s).normalize('NFKD').replace(/\p{M}/gu, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

// Codes d'origine retirés en début ou fin de nom pour regrouper (« Cascade (US) » = « Cascade »).
const CODES = new Set(['us', 'usa', 'gr', 'de', 'ger', 'uk', 'nz', 'au', 'aus', 'cz', 'si', 'fr', 'bc', 'pl', 'jp', 'rsa', 'english', 'american']);
const PAYS_CODE = {
  us: 'États-Unis', usa: 'États-Unis', gr: 'Allemagne', de: 'Allemagne', ger: 'Allemagne', uk: 'Royaume-Uni', english: 'Royaume-Uni',
  nz: 'Nouvelle-Zélande', au: 'Australie', aus: 'Australie', cz: 'Tchéquie', si: 'Slovénie', fr: 'France', bc: 'Canada', pl: 'Pologne',
  jp: 'Japon', rsa: 'Afrique du Sud', american: 'États-Unis',
};
const paysDuNom = (nom) => {
  const out = new Set();
  for (const m of String(nom).matchAll(/\(([^)]+)\)/g)) { const p = PAYS_CODE[norm(m[1])]; if (p) out.add(p); }
  const t = norm(nom).split(' ');
  if (t.length > 1 && PAYS_CODE[t[0]]) out.add(PAYS_CODE[t[0]]);
  return out.size ? [...out].join(' / ') : null;
};

// Bruit des sources retiré avant regroupement : codes de sélection (« Krush HBC 586 », « Elani YQH-1320 »,
// « Amarillo VGXP01 c.v. »), mentions commerciales (« Hop Revolution », « Brand », « Estate Grown »).
const BRUIT = /\b(hbc|ycr|yqh|adha|vgxp\d*|hs|hpa|ihps|usda)\s*[a-z]?\d+[a-z0-9]*\b|\bc v\b|\bbrand\b|\bestate grown\b|\borganic\b|\bhop revolution\b|\bus\b$/g;

// Nom de variété, sans le fournisseur (« Yakima Valley Hops - Krush » → « Krush ») et sans le bruit.
// Quand le segment avant le tiret est lui-même un produit (« Incognito - Citra »), il est gardé.
const cle = (nom) => {
  const s = String(nom);
  const i = s.lastIndexOf(' - ');
  if (i < 0 || RE_FORME.test(s.slice(0, i))) return s;
  return s.slice(i + 3);
};

const strip = (nom) => {
  let s = norm(String(nom).replace(/\([^)]*\)/g, ' '));
  s = s.replace(BRUIT, ' ').replace(/\s+/g, ' ').trim();
  const t = s.split(' ').filter(Boolean).map((x) => (x === 'mt' ? 'mount' : x));
  while (t.length > 1 && CODES.has(t[0])) t.shift();
  while (t.length > 1 && CODES.has(t[t.length - 1])) t.pop();
  // Un nom réduit à du bruit (« HBC 630 ») garde sa forme normée, pour ne pas collisionner.
  return t.length ? t.join(' ') : norm(nom);
};

// Distance de Levenshtein (sur chaînes normalisées, courtes).
function lev(a, b) {
  if (a === b) return 0;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    prev = cur;
  }
  return prev[b.length];
}

const push = (m, k, v) => { if (!k) return; if (!m.has(k)) m.set(k, []); if (!m.get(k).includes(v)) m.get(k).push(v); };

// Forme : produits qui ne sont pas une variété de houblon fraîche (cas b).
// « Pink Boots » : mélange commercial de Yakima Chief (blend), pas une variété ; à confirmer.
const RE_FORME = /\b(cryo|hyper ?boost|lupuln2|lupuln|lupomax|incognito|powder|poudre|pellets?|t90|t45|extract|extrait|co2|blend|oil|huile|juice|concentrate|isomerized|iso alpha|pink ?boots)\b/i;

// Doublons de catalogue signalés par une source : deux entrées du catalogue pour une même variété.
const DOUBLONS_SIGNALES = [
  { a: 'beermaverick-ekuanot', b: 'beermaverick-equinox', preuve: 'barthhaas.json, fiche Ekuanot : « Ekuanot™ (formerly HBC 366) was commercially released in 2014 as “Equinox” » ; hopslist.json rattache « Equinox » à beermaverick-equinox, les 8 autres sources à beermaverick-ekuanot.' },
];

// ───────────── Catalogue ─────────────
const cat = lire(CATALOGUE).varieties;
const parId = new Map(cat.map((v) => [v.id, v]));
const idxNom = new Map();   // strip(nom du catalogue) → ids
const idxAlias = new Map(); // strip(alias lettres, >= 4) → ids
for (const v of cat) {
  push(idxNom, strip(v.name), v.id);
  for (const a of v.aliases ?? []) if (/^[A-Za-zÀ-ÿ][A-Za-zÀ-ÿ .'-]{3,}$/.test(a)) push(idxAlias, strip(a), v.id);
}
const clesNom = [...idxNom.keys()];

/** Rattache un nom de source au catalogue : { type, ids, d } ou null. */
function trouve(nom) {
  const k = strip(nom);
  if (!k) return null;
  if (idxNom.has(k)) return { type: 'nom', ids: idxNom.get(k), d: 0 };
  if (idxAlias.has(k)) return { type: 'alias', ids: idxAlias.get(k), d: 0 };
  // Pas de rapprochement flou avec un chiffre : « HBC 431 » n'est pas « HBC 630 ».
  if (k.length < 6 || /\d/.test(k)) return null;
  let best = Infinity; let ids = [];
  for (const c of clesNom) {
    if (c.length < 6) continue;
    const d = lev(k, c);
    if (d < best) { best = d; ids = [...idxNom.get(c)]; } else if (d === best) for (const id of idxNom.get(c)) if (!ids.includes(id)) ids.push(id);
  }
  if (best <= 2) return { type: 'proche', ids, d: best };
  return null;
}

// ───────────── Fiches écartées à la fusion (le rattachement de la collecte a été refusé) ─────────────
const nonRat = lire(NON_RATTACHEES).fiches;
const ecartees = new Set(nonRat.filter((x) => String(x.raison).startsWith('écarté')).map((x) => `${x.source}|${x.nom}`));

// ───────────── Sources ─────────────
const fichiers = readdirSync(DIR_SOURCES).filter((f) => f.endsWith('.json')).sort();
const sourcesLues = [];
const groupes = new Map();   // strip → { cle, nomsBruts:Map, sources:[] }
const paires = new Map();    // strip → { nomsBruts, ids, type, d, source }
const attachesADouter = [];
const compteParSource = {};

const alpha = (c) => {
  const a = c?.alpha; if (!a) return null;
  if (a.brut) return String(a.brut);
  return a.min != null ? `${a.min}–${a.max ?? a.min}` : a.valeur != null ? String(a.valeur) : null;
};
const huiles = (c) => {
  const h = c?.huile_totale ?? c?.huileTotale ?? c?.huileTotaleHopsteiner ?? c?.huileTotaleFerme;
  return h?.brut ? String(h.brut) : null;
};
const mots = (l) => {
  const m = l?.descripteurs ?? l?.aromes ?? l?.profilCourt ?? l?.descripteursBiere ?? null;
  if (m == null) return null;
  const s = Array.isArray(m) ? m.join(', ') : String(m);
  return s.length > 160 ? s.slice(0, 157) + '…' : s;
};
const paysFiche = (f) => {
  const p = f.origine ?? f.pays ?? f.listes?.origine ?? f.listes?.pays ?? f.listes?.region ?? f.champs?.pays_principal?.brut ?? null;
  const s = Array.isArray(p) ? p.join(', ') : p == null ? null : String(p);
  return s || null;
};

for (const fichier of fichiers) {
  const id = fichier.replace(/\.json$/, '');
  const j = lire(resolve(DIR_SOURCES, fichier));
  const fiches = j.fiches ?? [];
  let nonAttachees = 0;
  compteParSource[id] = { fiches: fiches.length, rattachees: 0, nonRattachees: 0, ecartees: 0 };
  sourcesLues.push({ id, nom: j.source?.nom ?? id, fiches: fiches.length });

  for (const f of fiches) {
    const nom = String(f.nom);
    const cleFiche = `${id}|${nom}`;
    const attachee = f.varietyId && parId.has(f.varietyId) && !ecartees.has(cleFiche);
    if (attachee) {
      compteParSource[id].rattachees++;
      // Contrôle inverse : nom d'une fiche rattachée très loin du nom de la variété choisie.
      const v = parId.get(f.varietyId);
      const k = strip(cle(nom));
      const ok = k === strip(v.name) || (v.aliases ?? []).some((a) => strip(a) === k) || lev(k, strip(v.name)) <= 2;
      if (!ok && k.length >= 4) attachesADouter.push({ source: id, nom, varietyId: f.varietyId, nomCatalogue: v.name });
      continue;
    }
    compteParSource[id].nonRattachees++;
    if (ecartees.has(cleFiche)) compteParSource[id].ecartees++;
    nonAttachees++;

    // Un produit de forme reste un groupe à part, même quand son nom contient une variété du catalogue.
    const forme = RE_FORME.test(nom);
    const k = (forme ? 'FORME:' : '') + strip(cle(nom));
    const r = forme ? null : trouve(cle(nom));
    // Brewer's Friend est un index d'usage : la fusion n'y rattache rien (complements-non-rattachees l'exclut).
    // Ses noms reconnus ne comptent donc pas comme paires mal rattachées ; ses noms inconnus restent des manquants.
    if (r && id === 'brewersfriend') { compteParSource[id].citeeConnue = (compteParSource[id].citeeConnue ?? 0) + 1; continue; }
    if (r) {
      if (!paires.has(k)) paires.set(k, { cleNorm: k, nomsBruts: new Set(), ids: [], type: r.type, d: r.d, sources: new Set() });
      const p = paires.get(k);
      p.nomsBruts.add(nom); p.sources.add(id);
      for (const x of r.ids) if (!p.ids.includes(x)) p.ids.push(x);
      continue;
    }
    if (!groupes.has(k)) groupes.set(k, { cle: k, nomsBruts: new Map(), fiches: [] });
    const g = groupes.get(k);
    g.nomsBruts.set(cle(nom), (g.nomsBruts.get(cle(nom)) ?? 0) + 1);
    g.fiches.push({
      source: id,
      nom,
      url: f.url ?? null,
      alpha: alpha(f.champs),
      huiles: huiles(f.champs),
      mots: mots(f.listes),
      pays: paysFiche(f),
      paysDuNom: paysDuNom(nom),
      forme,
    });
  }
}

// ───────────── Sorties ─────────────
// Voisins probables : une variété du catalogue dont le nom est un mot entier du nom (ou l'inverse). À confirmer à la main.
function voisins(k) {
  if (k.startsWith('FORME:') || k.length < 4) return [];
  const out = [];
  for (const [c, ids] of idxNom) {
    if (c === k || c.length < 4 || /\d/.test(c)) continue;
    const dans = (` ${k} `).includes(` ${c} `);
    const contient = (` ${c} `).includes(` ${k} `);
    if (dans || contient) out.push({ sens: dans ? 'le nom contient la variété du catalogue' : 'la variété du catalogue contient le nom', cleCatalogue: c, ids: ids.slice(0, 3), noms: ids.map((i) => parId.get(i)?.name) });
  }
  return out;
}

const manquants = [...groupes.values()].map((g) => {
  const sourcesDistinctes = [...new Set(g.fiches.map((x) => x.source))].sort();
  const nomAffiche = [...g.nomsBruts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0][0];
  const forme = g.fiches.some((x) => x.forme);
  const paysConnu = g.fiches.map((x) => x.paysDuNom ?? x.pays).find((x) => x) ?? null;
  return {
    cle: g.cle,
    nomAffiche,
    variantes: [...g.nomsBruts.keys()].sort(),
    cas: forme ? 'b' : 'a',
    nbSources: sourcesDistinctes.length,
    sources: sourcesDistinctes,
    nbFiches: g.fiches.length,
    seulementBrewersFriend: sourcesDistinctes.length === 1 && sourcesDistinctes[0] === 'brewersfriend',
    paysConnu,
    voisinsProbables: voisins(g.cle),
    fiches: g.fiches.sort((a, b) => a.source.localeCompare(b.source)),
  };
}).sort((a, b) => b.nbSources - a.nbSources || b.nbFiches - a.nbFiches || a.cle.localeCompare(b.cle));

const pairesSortie = [...paires.values()].map((p) => ({
  nomsBruts: [...p.nomsBruts].sort(),
  cleNorm: p.cleNorm,
  candidats: p.ids.map((id) => ({ id, nom: parId.get(id)?.name ?? null, origine: parId.get(id)?.origin ?? null })),
  correspondance: p.type === 'proche' ? `proche (distance ${p.d})` : p.type,
  ambigu: p.ids.length > 1,
  sources: [...p.sources].sort(),
})).sort((a, b) => a.cleNorm.localeCompare(b.cleNorm));

// Attendus par le brasseur (liste du message de lancement) : présence au catalogue et dans les sources.
const ATTENDUS = ['Talus', 'Krush', 'Superdelic', 'Peacharine', 'Nectaron', 'Riwaka', 'Sabro', 'Strata', 'Idaho Gem', 'Zappa', 'Bru-1', 'HBC 630', 'Lotus', 'Anchovy', 'Pink Boots', 'Vista', 'Elani', 'Eclipse', 'Ella', 'Topaz', 'Vic Secret', 'Enigma', 'Galaxy', 'Motueka', 'Wai-iti', 'Southern Cross', 'Dr. Rudi'];
const toutesFiches = [];
for (const fichier of fichiers) {
  const id = fichier.replace(/\.json$/, '');
  for (const f of lire(resolve(DIR_SOURCES, fichier)).fiches ?? []) toutesFiches.push({ source: id, nom: String(f.nom), norm: norm(cle(f.nom)) });
}
const attendus = ATTENDUS.map((a) => {
  const t = trouve(a);
  const na = norm(a);
  // Citation : le nom (fournisseur retiré) est la variété, ou la contient comme mots entiers.
  const cites = toutesFiches.filter((f) => f.norm === na || (` ${f.norm} `).includes(` ${na} `));
  const grp = [...groupes.values()].filter((g) => !g.cle.startsWith('FORME:') && (` ${g.cle} `).includes(` ${strip(a)} `));
  const formes = [...groupes.values()].filter((g) => g.cle.startsWith('FORME:') && (` ${g.cle.slice(6)} `).includes(` ${strip(a)} `));
  let statut;
  if (t && (t.type === 'nom' || t.type === 'alias')) statut = `au catalogue (${t.ids.map((i) => parId.get(i)?.name).join(' / ')}, par ${t.type})`;
  else if (t) statut = `proche du catalogue (${t.ids.map((i) => parId.get(i)?.name).join(' / ')}, distance ${t.d})`;
  else if (grp.length) statut = `MANQUANT (${new Set(grp.flatMap((g) => g.fiches.map((x) => x.source))).size} sources, groupes : ${grp.map((g) => g.cle).join(' / ')})`;
  else if (formes.length) statut = `présent seulement comme forme (${formes.map((g) => g.cle).join(' / ')})`;
  else statut = 'absent des sources collectées';
  return { attendu: a, statut, citations: cites.length, sourcesCitantes: [...new Set(cites.map((c) => c.source))].sort() };
});

const comptes = {
  sources: sourcesLues.length,
  fichesTotal: sourcesLues.reduce((s, x) => s + x.fiches, 0),
  rattacheesValides: Object.values(compteParSource).reduce((s, x) => s + x.rattachees, 0),
  nonRattacheesOuEcartees: Object.values(compteParSource).reduce((s, x) => s + x.nonRattachees, 0),
  cas_a_varietesManquantes: manquants.filter((m) => m.cas === 'a').length,
  cas_a_dontSeulementBrewersFriend: manquants.filter((m) => m.cas === 'a' && m.seulementBrewersFriend).length,
  cas_a_citeesPar2SourcesOuPlus: manquants.filter((m) => m.cas === 'a' && m.nbSources >= 2).length,
  cas_b_formes: manquants.filter((m) => m.cas === 'b').length,
  cas_c_pairesMalRattachees: pairesSortie.length,
  cas_c_pairesAmbigues: pairesSortie.filter((p) => p.ambigu).length,
  cas_c_pairesProches: pairesSortie.filter((p) => p.correspondance.startsWith('proche')).length,
  attachesADouterNomDivergent: attachesADouter.length,
  normeIdentiqueFusion: normeSynchro,
};

/** Nombre de fiches de toutes les sources rattachées (varietyId) à cet identifiant du catalogue. */
function nbRattachees(id) {
  let n = 0;
  for (const fichier of fichiers) for (const f of lire(resolve(DIR_SOURCES, fichier)).fiches ?? []) if (f.varietyId === id) n++;
  return n;
}

const sortie = {
  genere: 'inventaire.mjs (voie c5-houblons-manquants)',
  regle: 'Une fiche est « présente » si son nom (sans parenthèses ni code d\'origine) égale un nom ou alias du catalogue, ou est à distance de Levenshtein ≤ 2 (noms ≥ 6 lettres). Les fiches écartées à la fusion comptent comme non rattachées.',
  comptes,
  sources: sourcesLues,
  varietesManquantes: manquants,
  pairesMalRattachees: pairesSortie,
  doublonsSignales: DOUBLONS_SIGNALES.map((d) => ({ ...d, nomA: parId.get(d.a)?.name ?? null, nomB: parId.get(d.b)?.name ?? null, fichesA: nbRattachees(d.a), fichesB: nbRattachees(d.b) })),
  attachesADouter: attachesADouter.sort((a, b) => a.source.localeCompare(b.source) || a.nom.localeCompare(b.nom)),
  attendus,
  compteParSource,
};

writeFileSync(SORTIE, JSON.stringify(sortie, null, 2) + '\n', 'utf8');

console.log(`normeIdentiqueFusion=${normeSynchro}`);
console.log(JSON.stringify(comptes, null, 2));
console.log('--- 30 premières variétés manquantes ---');
manquants.slice(0, 30).forEach((m, i) => console.log(`${i + 1}. ${m.nomAffiche} [${m.cas}] ${m.nbSources} src (${m.sources.join(',')}) pays=${m.paysConnu ?? '-'}`));
console.log('--- paires mal rattachées ---');
pairesSortie.forEach((p) => console.log(`${p.nomsBruts.join(' | ')}  ->  ${p.candidats.map((c) => c.nom).join(' / ')} [${p.correspondance}] src=${p.sources.join(',')}`));
console.log('--- attendus ---');
attendus.forEach((a) => console.log(`${a.attendu}: ${a.statut}; citations=${a.citations}`));
