// Cas difficiles pour Suggestions (#138, lot 15, 19.10, soir) : le brasseur, sur le lot 14 : « s4-s5
// semble pas mal, s5 semble vraiment le mieux dans ce cas, mais proablement très compliqué si plusieurs
// voies, et pour les cas complexe, pas sûr que ça aille » ; « si je veux banir, ou ouvrir vers plusieurs
// voie ça semble un peu limité ? D'ailleur ça prends pas encore en compte bio transfo, levure. et dry
// hopping ». Le moteur calcule les voies de cas plus durs que S1 ; rien n'est inventé. Lecture seule du
// dépôt ; écrit un JSON par cas.
// Usage : vite-node scripts/cas-suggestions.ts <dossier de sortie>
import fs from 'node:fs';
import path from 'node:path';
import { applyVoie, describeFamilies, getStyleScale, hopRef, hopRole, STOCK, offModelLeads, proposeVoies, recipeIbu, yeastSignals, FAMILIES, FAMILY_NAMES,
  type FamilyId, type Gouts, type Recipe, type Voie } from '../../../src/domain/hopIndex/v4';
import { S1_DIRECTION, S1_TASTING, s1Recipe, s2Recipe } from '../src/pack/buildPack';

const out = path.resolve(process.argv[2] || '.');
fs.mkdirSync(out, { recursive: true });
const lager = (): Recipe => ({ ...s2Recipe(), additions: [
  { id: 'a1', hopKey: 'beermaverick-saaz-cz', moment: 'b60', grams: 40 },
  { id: 'a2', hopKey: 'beermaverick-citra:cryo', moment: 'b10', grams: 10 },
] });
// c1b : c1, le brasseur bannit une famille et une variété (exemple de goûts ; jamais supposés ailleurs).
const citra = hopRef('beermaverick-citra:cryo')!.varietyId;
const BANNIS: Gouts = { aime: [], exclut: [
  { type: 'famille', id: 'spice', source: 'exemple du lot 15 : « pas d’épicé dans ma stout »' },
  { type: 'variété', id: citra, source: 'exemple du lot 15 : « le cryo citra est ultra aromatique »' },
] };
const CAS = [
  // s1 : le cas de la base (pack S1, même appel que buildPack) ; ses voies sont celles de la base, dans le même ordre.
  { id: 's1', titre: 'Stout 16D de la base (S1) : plus floral, moins résineux', recipe: s1Recipe(), direction: S1_DIRECTION, tasting: S1_TASTING, gouts: undefined, ensemble: [] },
  { id: 'c1', titre: 'Stout 16D, trois objectifs : plus floral, moins résineux, plus agrumes', recipe: s1Recipe(), direction: { floral: 1, resin: -1, citrus: 1 }, tasting: S1_TASTING, gouts: undefined, ensemble: [[1, 12], [1, 15], [7, 12]] },
  { id: 'c1b', titre: 'c1, avec l’épicé et Citra bannis', recipe: s1Recipe(), direction: { floral: 1, resin: -1, citrus: 1 }, tasting: S1_TASTING, gouts: BANNIS, ensemble: [] },
  { id: 'c2', titre: 'Stout 16D, deux objectifs dans le même sens : plus floral, plus tropical', recipe: s1Recipe(), direction: { floral: 1, tropical: 1 }, tasting: S1_TASTING, gouts: undefined, ensemble: [[3, 12]] },
  { id: 'c3', titre: 'Lager tchèque 3B (Saaz 40 g à 60′, Citra cryo 10 g à 10′) : moins agrumes, moins tropical, plus floral', recipe: lager(), direction: { citrus: -1, tropical: -1, floral: 1 }, tasting: null, gouts: undefined, ensemble: [] },
] as const;
const r1 = (x: number | null | undefined) => (x == null ? null : Math.round(x * 10) / 10);
for (const c of CAS) {
  const recipe = c.recipe as Recipe;
  const r = proposeVoies(recipe, c.direction, { tasting: c.tasting ?? undefined, leviersLevure: true, gouts: c.gouts });
  const style = getStyleScale(recipe.styleCode);
  const fams = Object.keys(c.direction) as FamilyId[];
  const famille = (f: FamilyId) => ({ famille: f, nom: FAMILY_NAMES[f], visee: fams.includes(f), statut: style.families[f].status, bande: style.families[f].band });
  // Biotransformation : les signaux cités par le moteur pour un dry hop (possible, non évaluable ; jamais chiffrés).
  const bio = (v: Voie) => v.actions.filter((a) => a.op !== 'retirer' && (a.moment === 'dryActive' || a.moment === 'dryPost')).map((a) => {
    const s = yeastSignals({ id: a.additionId, hopKey: a.hopKey, moment: a.moment, grams: a.grams }, applyVoie(recipe, v));
    return s && { houblon: a.hopName, moment: a.momentLabel, signaux: s.signaux.map((x) => ({ id: x.id, titre: x.titre, statut: x.statut, pourquoi: x.pourquoi, sources: x.sources.map((y) => y.title) })) };
  }).filter(Boolean);
  const data = {
    cas: c.id, titre: c.titre, style: recipe.styleCode, styleNom: style.name, recette: recipe.name,
    ajouts: recipe.additions.map((a) => ({ houblon: a.hopKey, grammes: a.grams, moment: a.moment })), ibu: r1(r.ibu), bandeIbu: style.ibu,
    // c3 : sous une levure sans profil V5.5 (LalBrew Diamond), ma bière n'est située sur aucune famille.
    levure: r.yeast, situee: FAMILIES.some((f) => r.before.profile[f].central !== undefined),
    bannis: c.gouts ? c.gouts.exclut.map((g) => ({ type: g.type, id: g.id, nom: g.type === 'famille' ? FAMILY_NAMES[g.id as FamilyId] : (hopRef(g.id)?.name ?? g.id), source: g.source })) : [],
    objectifs: r.direction.map((d) => ({ famille: d.family, nom: d.name, crans: d.crans, statut: d.status, bande: style.families[d.family].band, cran: d.cran, largeur: d.width,
      maBiere: d.current, visee: d.targetAbsolute, viseeDe: d.targetFrom, note: d.note })),
    voies: r.voies.map((v) => ({ rang: v.rank, type: v.type, libelle: v.label, domaine: v.domain, estime: v.estimated, estimePourquoi: v.estimatedWhy,
      actions: v.actions.map((a) => ({ op: a.op, houblon: a.hopName, cle: a.hopKey, grammes: a.grams, avant: a.previousGrams ?? null, moment: a.momentLabel, momentId: a.moment })),
      levureVers: v.yeastChange?.toName ?? null,
      effet: Object.fromEntries(fams.map((f) => [f, { central: r1(v.effect[f]?.central), etabli: !!v.effect[f]?.established }])),
      // Le brasseur (19.10, soir) : « on voit pas quels sont les autre ajouts, alors oui par nelson sauving
      // agumente un peu le floral mais on voit pas ce qu'il ajoute en plus ». Toutes les familles que la
      // voie fait bouger (apport établi), visées ou non : ma bière avant, après, bande du style.
      tout: FAMILIES.filter((f) => v.effect[f]?.established && v.effect[f].central !== null && Math.abs(v.effect[f].central!) >= 0.05).map((f) => {
        const avant = r.before.profile[f].central, e = v.effect[f].central!;
        // Intensité au style (19.10 : « mieux afficher l'intensité des saveur comme sur p5 s4 ») : crans du style.
        return { ...famille(f), effet: r1(e), crans: style.families[f].cran ? r1(e / style.families[f].cran) : null, avant: r1(avant ?? null), apres: avant === undefined ? null : r1(avant + e) };
      }),
      // Le modèle donne la même amplitude à toute famille citée : seules les fiches disent « un peu »
      // (cité, 1 fiche) ou « surtout » (marqué : ≥ 2 fiches ou nommé en premier). Par houblon ajouté.
      fiches: [...new Set(v.actions.filter((a) => a.op !== 'retirer' && !(a.previousGrams !== undefined && a.grams < a.previousGrams && !a.previousHopKey)).map((a) => a.hopKey))].map((k) => {
        const id = hopRef(k)?.varietyId ?? k, d = describeFamilies(id);
        const role = hopRole(k);
        // Usage du houblon (19.10 : « le type de houbon pour son usage, mixte, amérisant, aromatique ») : rôle du fournisseur, sinon règle rôle-α (prototype), sinon inconnu.
        // α (19.10 : « Pas d'info sur les AA, j'en vrai valeur ») : celui du lot en stock (qui fait la dose), sinon la plage des fiches.
        const lot = STOCK.find((x) => x.key === k), cat = (hopRef(k) as any)?.catalogue?.alpha ?? null;
        const alpha = { lot: lot ? lot.alpha : null, lotSource: lot ? (lot as any).alphaFrom ?? null : null, fiches: cat, horsFiches: !!(lot && cat && (lot.alpha < cat[0] || lot.alpha > cat[1])) };
        return { houblon: hopRef(k)?.name ?? k, role: role.value, roleSource: role.source, roleRaison: role.raison ?? null, alpha, familles: FAMILIES.filter((f) => d[f].level !== 'non décrit')
          .map((f) => ({ famille: f, nom: FAMILY_NAMES[f], niveau: d[f].level, n: d[f].sources, sur: d[f].of, premier: d[f].first })) };
      }),
      bio: bio(v),
      distance: v.distance, horsStyle: v.styleOverflow, bord: v.sideEffects, ibu: v.ibu, stock: v.stock.status, conflits: v.conflicts })),
    // « ouvrir vers plusieurs voie » : des voies posées ensemble. Convention des voies (FamilyEffect :
    // somme signée des apports des ajouts changés, chacun seul à son moment) ; valable si les voies ne
    // touchent pas le même moment (sinon la dose se cumule : memeMoment, et la voie « assemblage » du
    // moteur fait foi). Le profil recalculé de la recette entière (cumul V5.5) diffère souvent : voir
    // la note du moteur (plages 0–100 après un ajout d'arôme). n = place dans voies (1 = la première).
    ensemble: c.ensemble.map((ns) => {
      const vs = ns.map((n) => r.voies[n - 1]);
      const next = vs.reduce((rec, v) => applyVoie(rec, v), recipe);
      const moments = vs.flatMap((v) => v.actions.map((a) => a.moment));
      return { voies: ns, libelles: vs.map((v) => v.label), ibu: r1(recipeIbu(next).value), memeMoment: new Set(moments).size < moments.length,
        tout: FAMILIES.filter((f) => vs.some((v) => v.effect[f]?.established && v.effect[f].central !== null)).map((f) => {
          const avant = r.before.profile[f].central, e = r1(vs.reduce((s, v) => s + (v.effect[f]?.established ? v.effect[f].central ?? 0 : 0), 0))!;
          return { ...famille(f), effet: e, avant: r1(avant ?? null), apres: avant === undefined ? null : r1(avant + e) };
        }).filter((t) => t.visee || Math.abs(t.effet) >= 0.05) };
    }),
    nonExamine: r.skipped, notes: r.notes, horsModele: offModelLeads(c.direction).map((x) => ({ famille: x.family, nom: FAMILY_NAMES[x.family], pistes: x.leads.map((l) => ({ titre: l.title, action: l.action, preuve: l.evidence })) })),
  };
  fs.writeFileSync(path.join(out, c.id + '.json'), JSON.stringify(data, null, 1) + '\n');
  console.log(c.id, data.voies.length + ' voies', data.objectifs.map((o) => o.nom + ' ' + r1(o.maBiere?.central ?? null) + ' → ' + o.visee).join(' ; '));
}
