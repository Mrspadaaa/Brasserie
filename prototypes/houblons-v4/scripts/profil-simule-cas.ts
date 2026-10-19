// Profils simulés du lot 21 (fils21-choisir/BRIEF-AUTEUR.md, contrat du fichier de données) : cas K1 à K5 et
// grille du simulateur, sur la stout 16D S1 du lot 20 (Nugget 46 g à 60′, 20 L). Lecture seule du dépôt ;
// écrit work/refonte-frontend/v4/ecran-1/fils21-choisir/donnees/profils-simules.json et imprime un résumé.
// Usage (depuis prototypes/houblons-v4) : node_modules/.bin/vite-node scripts/profil-simule-cas.ts [fichier]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  CORRESPONDANCE, FAMILIES, FAMILY_NAMES, MENTION_RAPPORT, MENTION_SIMULE, MOMENTS_SIMULES, PROFIL_RULE,
  activiteAncre, echelleSimulee, hopRef, simulerCas, sourceSimulee, styleSimule,
  type AjoutSimule, type CasSimule, type FamilyId, type MomentSimule, type ProfilFamilles,
} from '../src/engine';
import { S1_TASTING, s1Recipe } from '../src/pack/buildPack';

const here = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const repo = path.resolve(here, '../..');
const out = path.resolve(process.argv[2] || path.join(repo, 'work/refonte-frontend/v4/ecran-1/fils21-choisir/donnees/profils-simules.json'));
fs.mkdirSync(path.dirname(out), { recursive: true });

const CITRA = 'beermaverick-citra', CASCADE = 'beermaverick-cascade', GALAXY = 'beermaverick-galaxy', IDAHO7 = 'beermaverick-idaho-7', MOTUEKA = 'beermaverick-motueka', NELSON = 'beermaverick-nelson-sauvin';
const LEV = { us05: 'fermentis-us05', verdant: 'lalbrew-verdant-ipa', pomona: 'lalbrew-pomona', diamond: 'lalbrew-diamond' } as const;
const NOM_LEV: Record<string, string> = { 'fermentis-us05': 'US-05', 'lalbrew-verdant-ipa': 'Verdant', 'lalbrew-pomona': 'Pomona', 'lalbrew-diamond': 'Diamond' };
const nomH = (k: string) => hopRef(k)?.name ?? k;
const court = (k: string) => k.replace(/^beermaverick-/, '');
const recette = s1Recipe();
const LABEL: Record<MomentSimule, string> = { b60: '60′', b10: '10′', wp: 'whirlpool', dryActive: 'dry hop actif', dryPost: 'dry hop après fermentation' };
const jourDebut = (m: MomentSimule, ordre = 0) => (m === 'dryActive' ? 2 + ordre : m === 'dryPost' ? 7 + ordre : null);
const aj = (houblon: string, dose_gL: number, moment: MomentSimule, jours: number | null = 3, j: number | null = jourDebut(moment), id?: string): AjoutSimule =>
  ({ id: id ?? court(houblon), houblon, dose_gL, moment, jourDebut: j, jours: moment === 'dryActive' || moment === 'dryPost' ? jours : null });

// ---------- Cas K1 à K5 ----------
type Def = { id: string; groupe: string; titre: string; ajouts: AjoutSimule[]; levure: string };
const defs: Def[] = [];
for (const h of [CITRA, CASCADE]) for (const m of MOMENTS_SIMULES)
  defs.push({ id: `K1-${court(h)}-${m}`, groupe: 'K1', titre: `${nomH(h)} 4 g/L, ${LABEL[m]}${m.startsWith('dry') ? ', 3 j' : ''}`, ajouts: [aj(h, 4, m)], levure: LEV.us05 });
for (const h of [CITRA, GALAXY, IDAHO7])
  defs.push({ id: `K2-${court(h)}`, groupe: 'K2', titre: `${nomH(h)} 4 g/L, dry hop après fermentation, J+7, 3 j`, ajouts: [aj(h, 4, 'dryPost')], levure: LEV.us05 });
defs.push({ id: 'K3-citra3-galaxy7', groupe: 'K3', titre: 'Citra 2 g/L 3 j (J+7) puis Galaxy 2 g/L 7 j (J+10), après fermentation', ajouts: [aj(CITRA, 2, 'dryPost', 3, 7), aj(GALAXY, 2, 'dryPost', 7, 10)], levure: LEV.us05 });
defs.push({ id: 'K3-citra3-idaho7-5', groupe: 'K3', titre: 'Citra 2 g/L 3 j (J+7) puis Idaho 7 2 g/L 5 j (J+10), après fermentation', ajouts: [aj(CITRA, 2, 'dryPost', 3, 7), aj(IDAHO7, 2, 'dryPost', 5, 10)], levure: LEV.us05 });
for (const [lk, l] of Object.entries(LEV)) for (const m of ['dryActive', 'dryPost'] as const) {
  const j = m === 'dryActive' ? 2 : 7;
  defs.push({ id: `K4-${lk}-${m === 'dryActive' ? 'actif' : 'apres'}`, groupe: 'K4', titre: `${NOM_LEV[l]} : Citra 2 g/L 3 j (J+${j}) puis Idaho 7 2 g/L 5 j (J+${j + 3}), ${LABEL[m]}`,
    ajouts: [aj(CITRA, 2, m, 3, j), aj(IDAHO7, 2, m, 5, j + 3)], levure: l });
}
for (const b of [GALAXY, IDAHO7, CASCADE]) for (const m of ['dryActive', 'dryPost'] as const) for (const lk of ['us05', 'pomona', 'verdant'] as const) {
  defs.push({ id: `K5-citra+${court(b)}-${m === 'dryActive' ? 'actif' : 'apres'}-${lk}`, groupe: 'K5', titre: `Citra 2 g/L + ${nomH(b)} 2 g/L ensemble, ${LABEL[m]}, J+${jourDebut(m)}, 3 j, ${NOM_LEV[LEV[lk]]}`,
    ajouts: [aj(CITRA, 2, m), aj(b, 2, m)], levure: LEV[lk] });
}
// Mesures publiées en dry hop (fils21-choisir/donnees/comparatifs-dryhop.json, recherche J) : pour chaque ajout,
// la mesure de la même variété la plus proche (même composé ou descripteur, dose la plus proche). Confrontation
// seulement : rien n'est recalé sur elles.
type Etude = { id: string; ref: string; url: string; niveau: string; base: string; conditions: { dose_gL: unknown; jours: unknown; moment: string; levure: string | null }; mesures: { variete: string; compose?: string; descripteur?: string; valeur: unknown; ecart?: number; unite: string; famille: string | null; lecture: string; dose_gL?: number; note?: string }[] };
const COMP = path.join(path.dirname(out), 'comparatifs-dryhop.json');
const ETUDES: Etude[] = fs.existsSync(COMP) ? JSON.parse(fs.readFileSync(COMP, 'utf8')).etudes : [];
const norm = (s: string) => s.toLowerCase().replace(/[-\s]+/g, ' ').trim();
function publiees(nom: string, dose: number) {
  const out_: unknown[] = [];
  for (const e of ETUDES) {
    const ms = e.mesures.filter((m) => norm(m.variete).split(/,| et /).map((x) => x.trim()).some((v) => v === norm(nom) || v.startsWith(norm(nom) + ' ')));
    const groupes = new Map<string, typeof ms>();
    for (const m of ms) { const k = m.compose ?? m.descripteur ?? '?'; groupes.set(k, [...(groupes.get(k) ?? []), m]); }
    for (const [k, g] of groupes) {
      const m = g.reduce((a, x) => (x.dose_gL != null && (a.dose_gL == null || Math.abs(x.dose_gL - dose) < Math.abs(a.dose_gL - dose)) ? x : a), g[0]);
      out_.push({ type: 'publiee', houblon: nom, compose: k, valeur: m.valeur, ...(m.ecart != null ? { ecart: m.ecart } : {}), unite: m.unite, famille: m.famille, dose_gL: m.dose_gL ?? null,
        base: `mesure publiée la plus proche (${e.id}) : ${typeof e.conditions.moment === 'string' ? e.conditions.moment : ''}${e.conditions.dose_gL != null ? ` ; dose ${e.conditions.dose_gL} g/L` : ''}${e.conditions.jours != null ? ` ; ${e.conditions.jours} j` : ''}`,
        texte: [m.lecture, m.note].filter(Boolean).join(' ; '), niveau: e.niveau, source: [e.id], largeur: 'inconnu' });
    }
  }
  return out_;
}
const cas = defs.map((d) => {
  const r = simulerCas({ id: d.id, titre: d.titre, ajouts: d.ajouts, levure: d.levure, recette, degustation: S1_TASTING });
  // L'avant de chaque cas est la bière de départ (biere.avant), le même pour tous : il n'est pas répété.
  const { drapeauxIds: _ids, avant: _avant, ...rest } = r;
  const vus = new Set<string>();
  const pub = r.ajouts.filter((a) => !vus.has(a.nom) && vus.add(a.nom)).flatMap((a) => publiees(a.nom, a.dose_gL).map((m) => ({ ...(m as object), ajout: a.id })));
  // parJour compact : chaque famille en tableau dans l'ordre de FORMAT_GRILLE.
  const parJour = rest.parJour.map((j) => ({ jour: j.jour, jourRecette: j.jourRecette, familles: Object.fromEntries(FAMILIES.map((f) => { const v = j.familles[f]; return [f, [v.bas, v.centre, v.haut, v.crans, v.largeur]]; })) }));
  return { groupe: d.groupe, ...rest, parJour, mesures: [...rest.mesures, ...pub] };
});

// ---------- Grille du simulateur ----------
const HOUBLONS = [CITRA, CASCADE, GALAXY, IDAHO7, MOTUEKA, NELSON];
const DOSES = [1, 2, 4, 8], JOURS = [1, 2, 3, 5, 7];
// Grille compacte : chaque famille en tableau [bas, centre, haut, crans, largeur, hautPartiel (1 ou 0)] (FORMAT_GRILLE).
const FORMAT_GRILLE = ['bas', 'centre', 'haut', 'crans', 'largeur', 'hautPartiel'];
const compact = (p: ProfilFamilles) => Object.fromEntries(FAMILIES.map((f) => [f, [p[f].bas, p[f].centre, p[f].haut, p[f].crans, p[f].largeur, p[f].hautPartiel ? 1 : 0]]));
const deltaC = (r: CasSimule) => Object.fromEntries(FAMILIES.map((f) => [f, r.delta[f].centre]));
const grille: unknown[] = [];
for (const h of HOUBLONS) for (const m of MOMENTS_SIMULES) for (const d of DOSES) for (const j of m.startsWith('dry') ? JOURS : [null]) for (const l of [LEV.us05, LEV.pomona]) {
  const r = simulerCas({ id: 'g', titre: 'g', ajouts: [aj(h, d, m, j)], levure: l, recette, degustation: S1_TASTING, complet: false });
  grille.push({ houblon: h, nom: nomH(h), moment: m, dose_gL: d, jours: j, levure: l, apres: compact(r.apres), delta: deltaC(r), confiance: r.confiance.niveau, drapeaux: r.drapeauxIds });
}
const grillePaires: unknown[] = [];
for (let i = 0; i < HOUBLONS.length; i++) for (let k = i + 1; k < HOUBLONS.length; k++) for (const m of ['dryActive', 'dryPost'] as const) for (const l of [LEV.us05, LEV.pomona, LEV.verdant]) {
  const [a, b] = [HOUBLONS[i], HOUBLONS[k]];
  const r = simulerCas({ id: 'p', titre: 'p', ajouts: [aj(a, 2, m), aj(b, 2, m)], levure: l, recette, degustation: S1_TASTING, complet: false });
  grillePaires.push({ houblons: [a, b], noms: [nomH(a), nomH(b)], moment: m, doses_gL: [2, 2], jours: 3, levure: l, apres: compact(r.apres), delta: deltaC(r),
    apports: Object.fromEntries(r.apportsParHoublon.map((x) => [x.houblon, x.apport])), seuls: Object.fromEntries(r.apportsParHoublon.map((x) => [x.houblon, x.seul])),
    facteurSaturation: r.saturation.facteur, confiance: r.confiance.niveau, drapeaux: r.drapeauxIds });
}

// ---------- La bière, l'échelle, le style ----------
const avantCas = simulerCas({ id: 'biere', titre: 'Stout 16D S1 du lot 20', ajouts: [], levure: LEV.us05, recette, degustation: S1_TASTING });
const biere = {
  titre: 'Stout export 16D S1 (lot 20) : Nugget 46 g à 60′, 20 L, DI 1,066, US-05',
  recette: { nom: recette.name, style: recette.styleCode, volumeL: recette.volumeL, og: recette.og, ajouts: recette.additions.map((a) => ({ houblon: a.hopKey, nom: nomH(a.hopKey), dose_gL: a.grams / recette.volumeL, moment: a.moment })) },
  degustation: { citation: S1_TASTING.quote, date: S1_TASTING.date, familles: S1_TASTING.axes.filter((x) => x.perceived).map((x) => ({ famille: x.family, percu: x.perceived })), regle: 'la dégustation prime : milieu de sa classe (marqué 83), bas et haut de la classe' },
  avant: avantCas.avant, mesures: avantCas.mesures, drapeaux: avantCas.drapeaux.filter((d) => ['simule', 'biere-noire', 'masquage'].includes(d.id)),
};

// ---------- Sources ----------
const cles = new Set<string>();
const walk = (o: unknown, k = ''): void => {
  if (Array.isArray(o)) { if ((k === 'source' || k === 'sources' || k === 'lien') && o.every((x) => typeof x === 'string')) o.forEach((x) => cles.add(x)); else o.forEach((x) => walk(x)); return; }
  if (o && typeof o === 'object') for (const [kk, v] of Object.entries(o)) walk(v, kk);
};
const corps = { biere, cas, correspondance: CORRESPONDANCE };
walk(corps);
const etude = (k: string) => { const e = ETUDES.find((x) => x.id === k); return e ? { titre: e.ref, url: e.url, niveau: e.niveau, annee: Number(e.ref.match(/\b(19|20)\d\d\b/)?.[0]) || null, lecture: 'fils21-choisir/donnees/comparatifs-dryhop.json (recherche J)' } : null; };
const sources = Object.fromEntries([...cles].sort().map((k) => [k, sourceSimulee(k) ?? etude(k) ?? { titre: k, niveau: null, annee: null, url: null, lecture: 'clé hors du fichier du moteur' }]));

// Textes longs répétés (drapeaux, bases des mesures) : écrits une fois dans « textes », renvoyés par « §n ».
const compte = new Map<string, number>();
const compter = (x: unknown): void => {
  if (typeof x === 'string' && x.length >= 30) compte.set(x, (compte.get(x) ?? 0) + 1);
  else if (Array.isArray(x)) x.forEach(compter);
  else if (x && typeof x === 'object') Object.values(x).forEach(compter);
};
compter(corps);
const textes: Record<string, string> = {}, ids = new Map<string, string>();
const dedup = (x: unknown): unknown => {
  if (typeof x === 'string' && (compte.get(x) ?? 0) > 1) { if (!ids.has(x)) { const id = `§${ids.size + 1}`; ids.set(x, id); textes[id] = x; } return ids.get(x); }
  if (Array.isArray(x)) return x.map(dedup);
  if (x && typeof x === 'object') return Object.fromEntries(Object.entries(x).map(([k, v]) => [k, dedup(v)]));
  return x;
};
const biereD = dedup(biere), casD = dedup(cas);

const fichier = {
  version: 'profils-simules-v1', date: '2026-10-19', simule: true,
  _origine: 'prototypes/houblons-v4/src/engine/profil-simule.ts (simulerCas), scripts/profil-simule-cas.ts ; table data/correspondance-familles.json ; note fils21-choisir/donnees/PROFIL-SIMULE.md',
  mention: MENTION_SIMULE, mentionRapport: MENTION_RAPPORT, regle: PROFIL_RULE,
  lecture: [
    'Chaque famille : { bas, centre, haut, crans, largeur, source }. Échelle 0–100 de style-bands.json, jamais rognée. crans : CRANS_RULE sur le centre (0–3 dans la bande du style, 4 au-dessus, −1 en dessous).',
    'largeur = haut ÷ bas, « inconnu » si le bas est nul. hautPartiel : composés sans borne haute publiée ; le vrai haut peut être plus haut (la largeur est alors un minimum).',
    'source « dégustation » : la famille dite par le brasseur (Boisé et résineux « marqué ») prime ; l’ajout la décale de son effet simulé.',
    'delta = après − avant ; delta.crans « ≈ » sous le seuil d’écart du style (un quart de bande).',
    'parJour : J0 = premier jour de dry hop ; jourRecette = J+n de fermentation ; chaque famille en tableau [bas, centre, haut, crans, largeur] (ordre de formatGrille).',
    'mesures[] : les vraies valeurs (α, huile, dose, jours, teneur, concentration et rapport au seuil du moteur, mesures en bière, mesure publiée la plus proche), avec leurs clés de source résolues dans « sources ».',
    'grille[] : un houblon seul (houblon × moment × dose × jours × levure) ; grillePaires[] : deux houblons ensemble, 2 + 2 g/L, 3 j. Chaque famille y est un tableau dans l’ordre de formatGrille : [bas, centre, haut, crans, largeur, hautPartiel 1/0] ; drapeaux en identifiants (textes dans les cas).',
    'Les cas ne répètent pas l’avant : c’est biere.avant (Nugget à 60′ et la dégustation), le même pour tous.',
    'Un texte « §n » se lit dans « textes » (textes longs répétés, écrits une fois).',
  ],
  familles: FAMILIES.map((f) => ({ id: f, nom: FAMILY_NAMES[f] })),
  echelle: echelleSimulee('16D'),
  style: styleSimule('16D'),
  ancre: { ...CORRESPONDANCE.courbes.ancre, activite: activiteAncre() },
  biere: biereD,
  cas: casD,
  formatGrille: FORMAT_GRILLE,
  grille,
  grillePaires,
  correspondance: 'prototypes/houblons-v4/data/correspondance-familles.json',
  textes,
  sources,
};
const r2 = (o: unknown): unknown => (typeof o === 'number' ? (Number.isFinite(o) ? (Math.abs(o) >= 0.01 || o === 0 ? Math.round(o * 100) / 100 : Number(o.toPrecision(2))) : o) : Array.isArray(o) ? o.map(r2) : o && typeof o === 'object' ? Object.fromEntries(Object.entries(o).map(([k, v]) => [k, r2(v)])) : o);
const texte = JSON.stringify(r2(fichier));
fs.writeFileSync(out, texte + '\n');

// ---------- Résumé ----------
const L: string[] = [];
const ligne = (r: { apres: ProfilFamilles }, fs_: FamilyId[]) => fs_.map((f) => `${FAMILY_NAMES[f]} ${r.apres[f].centre} [${r.apres[f].bas}–${r.apres[f].haut}${r.apres[f].hautPartiel ? '+' : ''}] c${r.apres[f].crans}`).join(' ; ');
const get = (id: string) => cas.find((c) => c.id === id)!;
const F6: FamilyId[] = ['citrus', 'tropical', 'berries', 'floral', 'green', 'resin'];
L.push(`PROFIL-SIMULE → ${path.relative(repo, out).replace(/\\/g, '/')} (${(texte.length / 1024).toFixed(0)} ko) ; ${cas.length} cas, ${grille.length} entrées de grille, ${grillePaires.length} paires ; ancre ${activiteAncre().toPrecision(3)}`);
L.push(`avant (Nugget 60′) : ${ligne(avantCas, [...FAMILIES])}`);
for (const id of ['K1-citra-dryPost', 'K1-cascade-dryPost', 'K1-citra-b60', 'K1-citra-b10', 'K1-citra-wp', 'K1-citra-dryActive', 'K3-citra3-galaxy7', 'K3-citra3-idaho7-5', 'K4-us05-actif', 'K4-pomona-actif', 'K5-citra+galaxy-apres-us05']) {
  const c = get(id);
  L.push(`${id} [${c.confiance.niveau}] : ${ligne(c, F6)}`);
  L.push(`   delta : ${F6.map((f) => `${f} ${c.delta[f].centre} (${c.delta[f].crans})`).join(' ; ')} ; drapeaux : ${c.drapeaux.map((d) => d.id).filter((x, i, a) => a.indexOf(x) === i).join(',')}`);
}
console.log(L.join('\n'));
