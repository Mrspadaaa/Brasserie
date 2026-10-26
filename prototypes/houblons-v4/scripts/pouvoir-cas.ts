// Cas du brasseur pour le moteur « pouvoir aromatique » (fils19-choix/MOTEUR-POUVOIR.md, 19.10, soir) :
// « voir ce que ça change si je fais du dryhop de citra, Galaxy, idao7. Et combinaison de 3j dryhopping
// Citra, 7j dry hopping Galaxy ; 3j citra - 5j idao7 », sur la stout 16D (S1). Plus la table « Citra contre
// Cascade par famille » à tous les moments (« Pourquoi à 10' pas à 60 ? Aussi ? »). Lecture seule du
// dépôt ; écrit un JSON par cas et imprime un résumé. Rien n'est inventé : doses et jours d'exemple dits.
// Usage (depuis prototypes/houblons-v4) : node_modules/.bin/vite-node scripts/pouvoir-cas.ts [dossier]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  FAMILIES, FAMILY_NAMES, MOMENTS_POUVOIR, POUVOIR_RULE, comparerComposes, comparerFamilles, pouvoirAjout, pouvoirRecette, profilParMoment, textePlage, verifications,
  type AjoutPouvoir, type ComposeId, type Plage, type PouvoirAjout, type PouvoirRecette, type RecettePouvoir, type SourceRef,
} from '../../../src/domain/hopIndex/v4';
import { MOMENTS, type MomentId } from '../../../src/domain/hopIndex/v4/recipe';
import { s1Recipe } from '../src/pack/buildPack';

const here = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const out = path.resolve(process.argv[2] || path.join(here, '../../work/refonte-frontend/v4/ecran-1/fils19-choix/donnees'));
fs.mkdirSync(out, { recursive: true });
const rel = (f: string) => path.relative(path.resolve(here, '../..'), f).replace(/\\/g, '/');

const CITRA = 'beermaverick-citra', CASCADE = 'beermaverick-cascade', GALAXY = 'beermaverick-galaxy', IDAHO7 = 'beermaverick-idaho-7', CRYO = 'beermaverick-citra:cryo';
const S1 = (yeastId = 'fermentis-us05'): RecettePouvoir => ({ ...s1Recipe(), yeastId });
const avec = (adds: AjoutPouvoir[], yeastId?: string): RecettePouvoir => ({ ...S1(yeastId), additions: [...s1Recipe().additions, ...adds] });
const dh = (id: string, hopKey: string, gL: number, day: number, dureeJours: number, moment: MomentId = 'dryPost'): AjoutPouvoir => ({ id, hopKey, moment, grams: gL * 20, day, dureeJours });
const DOSE = 4; // g/L : la dose de référence de H §7.4 et du panel OSU (12 variétés).

// JSON allégé, sans perte : chaque liste de sources devient une liste de clés, résolues une fois en tête
// de fichier ; un texte long répété devient « §n », résolu dans `textes` ; 4 chiffres significatifs.
function allege(o: unknown) {
  const sources: Record<string, Omit<SourceRef, 'cle'>> = {};
  const compte = new Map<string, number>();
  const compter = (x: unknown): void => {
    if (typeof x === 'string' && x.length >= 60) compte.set(x, (compte.get(x) ?? 0) + 1);
    else if (Array.isArray(x)) x.forEach(compter);
    else if (x && typeof x === 'object') Object.values(x).forEach(compter);
  };
  compter(o);
  const textes: Record<string, string> = {};
  const ids = new Map<string, string>();
  const w = (x: unknown): unknown => {
    if (typeof x === 'number') return Number.isFinite(x) ? Number(x.toPrecision(4)) : x;
    if (typeof x === 'string' && (compte.get(x) ?? 0) > 1) {
      if (!ids.has(x)) { const id = `§${ids.size + 1}`; ids.set(x, id); textes[id] = x; }
      return ids.get(x);
    }
    if (Array.isArray(x)) {
      if (x.length && x.every((s) => s && typeof s === 'object' && 'cle' in s && 'url' in s)) return (x as SourceRef[]).map(({ cle, ...s }) => ((sources[cle] = s), cle));
      return x.map(w);
    }
    if (x && typeof x === 'object') return Object.fromEntries(Object.entries(x).map(([k, v]) => [k, w(v)]));
    return x;
  };
  const corps = w(o);
  return { lecture: 'Les clés de « sources » et les renvois « §n » de « textes » se résolvent en tête de fichier.', sources, textes, ...(corps as object) };
}
// Vue compacte d'un ajout pour la table : par composé, les grandeurs sans le détail par base et par seuil.
const g = (y: { plage: Plage | null; unite: string; base: string; niveau: string | null; sources: SourceRef[]; inconnu: string | null }) =>
  ({ plage: y.plage, unite: y.unite, base: y.base, niveau: y.niveau, sources: y.sources, inconnu: y.inconnu });
const compact = (p: PouvoirAjout) => ({
  houblon: p.nom, moment: p.momentLabel, doseGL: p.doseGL, huile: g(p.huile), chargeHuile: g(p.chargeHuile), amertume: p.amertume,
  composes: Object.fromEntries(Object.values(p.composes).map((y) => [y.compose, { nom: y.nom, teneur: g(y.teneur), charge: g(y.charge), transfert: g(y.transfert),
    concentration: g(y.concentration), seuil: g(y.seuil), rapport: g(y.rapport), lecture: y.lecture,
    hypotheses: [...new Set([y.teneur, y.charge, y.transfert, y.concentration, y.seuil, y.rapport].flatMap((z) => z.hypotheses))],
    baseCommune: y.baseCommune && { base: y.baseCommune.base, teneur: g(y.baseCommune.teneur), concentration: g(y.baseCommune.concentration), rapport: g(y.baseCommune.rapport), rapportParSeuil: y.baseCommune.rapportParSeuil, lecture: y.baseCommune.lecture } }])),
  familles: p.familles, pouvoir: p.pouvoir, drapeaux: p.drapeaux,
});
const n2 = (v: number) => v.toLocaleString('fr-CH', { maximumSignificantDigits: 2 });
const n1 = (v: number) => v.toLocaleString('fr-CH', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
// Les cas complets s'écrivent sans indentation (lus par les écrans) ; l'index et la vérification restent lisibles.
const ecrire = (nom: string, o: unknown, lisible = false) => {
  const f = path.join(out, `${nom}.json`);
  fs.writeFileSync(f, JSON.stringify(allege(o), null, lisible ? 1 : undefined) + '\n');
  return f;
};

const t = (p: Plage | null, u = '') => textePlage(p, u);
const x = (p: Plage | null) => (p ? textePlage(p).replace(/(\d[\d',]*)/g, '×$1').replace('××', '×') : 'inconnu');
const lignes: string[] = [];
const dire = (s = '') => lignes.push(s);

// ---------- 1. Citra contre Cascade, dry hop après fermentation ----------
const r16 = S1();
dire(`POUVOIR-CAS → ${rel(out)}`);
dire(`Recette : ${r16.name} ${r16.styleCode} (6,3–8 % vol., BJCP 2021), ${r16.volumeL} L, US-05, Nugget 46 g à 60′. ${'Rapport au seuil, pas une intensité perçue.'}`);
dire('');
dire(`1. Citra contre Cascade : ${DOSE} g/L, dry hop après fermentation, 3 j`);
const ca = pouvoirAjout({ id: 'citra', hopKey: CITRA, moment: 'dryPost', grams: DOSE * 20, dureeJours: 3 }, r16);
const cb = pouvoirAjout({ id: 'cascade', hopKey: CASCADE, moment: 'dryPost', grams: DOSE * 20, dureeJours: 3 }, r16);
const cc = comparerComposes(ca, cb);
dire(`   huile introduite : Citra ${t(ca.chargeHuile.plage, 'mL/hL')} ; Cascade ${t(cb.chargeHuile.plage, 'mL/hL')}`);
const ligneCompose = (c: ComposeId, label = c as string, bc = false) => {
  const a = bc ? ca.composes[c].baseCommune! : ca.composes[c], b = bc ? cb.composes[c].baseCommune! : cb.composes[c];
  const u = a.concentration.unite;
  const sens = bc ? cc[c].baseCommune : cc[c].concentration;
  dire(`   ${label.padEnd(28)} Citra ${t(a.concentration.plage, u)} (${x(a.rapport.plage)} le seuil) | Cascade ${t(b.concentration.plage, u)} (${x(b.rapport.plage)}) → ${sens}${!bc && cc[c].facteurCentral ? `, central ×${n2(cc[c].facteurCentral!)}` : ''}`);
};
ligneCompose('4MMP', '4MMP, base commune', true);
dire(`   ${''.padEnd(28)} à chaque seuil : ${ca.composes['4MMP'].baseCommune!.rapportParSeuil.map((s, i) => `${s.seuil.split(' (')[0]} ${x(s.plage)} contre ${x(cb.composes['4MMP'].baseCommune!.rapportParSeuil[i].plage)}`).join(' ; ')}`);
ligneCompose('4MMP', '4MMP, toutes sources');
for (const c of ['3MH', 'linalol', 'geraniol', 'myrcene', 'humulene', 'caryophyllene'] as ComposeId[]) ligneCompose(c, ca.composes[c].nom);
dire(`   ${'farnésène (charge, sans seuil)'.padEnd(28)} Citra ${t(ca.composes.farnesene.charge.plage, 'µg/L')} | Cascade ${t(cb.composes.farnesene.charge.plage, 'µg/L')} → central ×${n2(cb.composes.farnesene.charge.plage!.central! / ca.composes.farnesene.charge.plage!.central!)} pour Cascade`);
dire(`   teneurs : Citra 4MMP ${t(ca.composes['4MMP'].teneur.plage, 'µg/kg')}, linalol ${t(ca.composes.linalol.teneur.plage, '%')}, huile ${t(ca.huile.plage, 'mL/100 g')} ; Cascade 4MMP ${t(cb.composes['4MMP'].teneur.plage, 'µg/kg')} (base commune ${t(cb.composes['4MMP'].baseCommune!.teneur.plage, 'µg/kg')}), linalol ${t(cb.composes.linalol.teneur.plage, '%')}, huile ${t(cb.huile.plage, 'mL/100 g')}`);

// ---------- 2. Table « Citra contre Cascade par famille », tous les moments ----------
dire('');
dire(`2. Citra contre Cascade par famille : ${DOSE} g/L, 16D, signal = rapport au seuil du marqueur dominant (pas une intensité)`);
const profC = profilParMoment(CITRA, DOSE, r16), profK = profilParMoment(CASCADE, DOSE, r16);
const table = MOMENTS_POUVOIR.map((m, i) => {
  const a = profC[i].pouvoir, b = profK[i].pouvoir;
  const fam = comparerFamilles(a, b);
  const ibu = a.amertume.ibu ? ` ; IBU Citra ${n1(a.amertume.ibu.valeur)} (α ${n1(a.amertume.alpha!.valeur)} %), Cascade ${n1(b.amertume.ibu!.valeur)} (α ${n1(b.amertume.alpha!.valeur)} %)` : '';
  dire(`   ${MOMENTS[m].label}${ibu}${MOMENTS[m].kind === 'amertume' ? ' ; surtout de l’amertume à ce moment' : ''}`);
  for (const f of FAMILIES) {
    const s = a.familles[f], k = b.familles[f];
    if (!s.marqueurs.length) continue;
    const cell = (y: typeof s) => (y.signal ? `${y.marqueurs.find((mq) => mq.compose === y.dominant)!.nom} ${x(y.signal).replace(', borne basse inconnue', '')}` : 'inconnu');
    const c = fam[f];
    const verdict = !s.signal || !k.signal ? `inconnu : ${(s.inconnu ?? k.inconnu ?? '').replace(/^aucun marqueur chiffré : /, '').split(' ; ')[0]}` : [c.baseCommune ? `base commune : ${c.baseCommune}` : '', `plages : ${c.signaux}`, c.central.facteur != null ? `central Citra ×${n2(c.central.facteur)}` : 'sans repère central (bornes hautes seules)'].filter(Boolean).join(' ; ');
    dire(`     ${FAMILY_NAMES[f].padEnd(20)} Citra ${cell(s).padEnd(24)} Cascade ${cell(k).padEnd(24)} ${verdict}`);
  }
  return { moment: m, label: MOMENTS[m].label, familles: fam, composes: comparerComposes(a, b), citra: compact(a), cascade: compact(b) };
});
dire(`     sans marqueur dans H : ${FAMILIES.filter((f) => !profC[0].pouvoir.familles[f].marqueurs.length).map((f) => FAMILY_NAMES[f]).join(', ')} → « inconnu »`);
const fichiers = [ecrire('citra-contre-cascade', { titre: `Citra contre Cascade par famille et par composé, ${DOSE} g/L, recette 16D S1, tous les moments`, regle: POUVOIR_RULE, table })];

// ---------- 3. Les cas du brasseur ----------
dire('');
dire('3. Cas du brasseur (stout 16D S1 ; doses et jours d’exemple, à régler)');
const CAS: { id: string; titre: string; recette: RecettePouvoir }[] = [
  { id: 'cas-citra', titre: `Citra ${DOSE} g/L, dry hop après fermentation, J+7, 3 j`, recette: avec([dh('citra', CITRA, DOSE, 7, 3)]) },
  { id: 'cas-cascade', titre: `Cascade ${DOSE} g/L, dry hop après fermentation, J+7, 3 j (témoin)`, recette: avec([dh('cascade', CASCADE, DOSE, 7, 3)]) },
  { id: 'cas-galaxy', titre: `Galaxy ${DOSE} g/L, dry hop après fermentation, J+7, 3 j`, recette: avec([dh('galaxy', GALAXY, DOSE, 7, 3)]) },
  { id: 'cas-idaho7', titre: `Idaho 7 ${DOSE} g/L, dry hop après fermentation, J+7, 3 j`, recette: avec([dh('idaho7', IDAHO7, DOSE, 7, 3)]) },
  { id: 'cas-citra3-galaxy7', titre: 'Citra 2 g/L 3 j (J+7) puis Galaxy 2 g/L 7 j (J+10), après fermentation', recette: avec([dh('citra', CITRA, 2, 7, 3), dh('galaxy', GALAXY, 2, 10, 7)]) },
  { id: 'cas-citra3-idaho7-5', titre: 'Citra 2 g/L 3 j (J+7) puis Idaho 7 2 g/L 5 j (J+10), après fermentation', recette: avec([dh('citra', CITRA, 2, 7, 3), dh('idaho7', IDAHO7, 2, 10, 5)]) },
  { id: 'cas-citra3-idaho7-5-pomona-actif', titre: 'Variante : Citra 2 g/L 3 j (J+2) puis Idaho 7 2 g/L 5 j (J+5), en fermentation active, LalBrew Pomona', recette: avec([dh('citra', CITRA, 2, 2, 3, 'dryActive'), dh('idaho7', IDAHO7, 2, 5, 5, 'dryActive')], 'lalbrew-pomona') },
  { id: 'cas-citra-cryo-stock', titre: 'Citra cryo du stock 2 g/L (40 g sur 65 g), après fermentation, J+7, 3 j', recette: avec([dh('cryo', CRYO, 2, 7, 3)]) },
];
const COMPOSES_RESUME: ComposeId[] = ['4MMP', 'linalol', 'geraniol', 'myrcene', '3MH'];
for (const c of CAS) {
  const p: PouvoirRecette = pouvoirRecette(c.recette);
  fichiers.push(ecrire(c.id, { cas: c.id, titre: c.titre, recette: c.recette, pouvoir: p }));
  dire(`   ${c.id} : ${c.titre}`);
  dire(`     dose à cru ${p.doseACruGL.toLocaleString('fr-CH')} g/L ; ${p.contact.texte} ; face au style : ${p.pouvoir.faceAuStyle.statut}${p.pouvoir.famillesNonDecrites.length ? ` ; au-dessus du seuil hors des familles du style : ${p.pouvoir.famillesNonDecrites.map((f) => FAMILY_NAMES[f]).join(', ')}` : ''}`);
  for (const k of COMPOSES_RESUME) {
    const y = p.composes[k];
    const bc = y.baseCommune ? ` ; base commune ${t(y.baseCommune.concentration.plage, y.concentration.unite)}` : '';
    const trous = y.parAjout.filter((z) => !z.concentration || z.concentration.max == null).map((z) => z.houblon);
    dire(`     ${y.nom.padEnd(14)} ${t(y.concentration.plage, y.concentration.unite)} → ${y.lecture.texte}${bc}${trous.length ? ` [borne haute inconnue par : ${[...new Set(trous)].join(', ')}]` : ''}`);
  }
  const fl = [...p.drapeaux, ...p.ajouts.flatMap((a: PouvoirAjout) => a.drapeaux.filter((d) => ['duree-longue', 'geraniol-citronellol', 'saturation', 'cryo'].includes(d.id)).map((d) => ({ ...d, id: `${a.id}:${d.id}` })))];
  dire(`     drapeaux : ${fl.filter((d) => d.id !== 'vieillissement' && d.id !== 'levure').map((d) => `${d.id} (${d.statut})`).join(' ; ')}`);
}

// ---------- 4. Vérification sur les mesures en bière ----------
dire('');
dire('4. Vérification de la chaîne sur les mesures en bière (H §5, §7.4)');
const v = verifications();
for (const y of v) dire(`   ${y.houblon}, ${y.compose} : mesuré ${t(y.mesure, y.unite)} ; calculé ${t(y.calcul, y.unite)} → ${y.verdict}${y.calculBaseCommune ? ` ; base commune ${t(y.calculBaseCommune, y.unite)} → ${y.verdictBaseCommune}` : ''}`);
fichiers.push(ecrire('verifications', { titre: 'La chaîne du moteur rejouée sur les mesures en bière du fichier', verifications: v }, true));

// ---------- 5. Ce qui reste inconnu ----------
dire('');
dire('5. Inconnu (jamais 0)');
for (const [key, nomH] of [[CITRA, 'Citra'], [CASCADE, 'Cascade'], [GALAXY, 'Galaxy'], [IDAHO7, 'Idaho 7'], [CRYO, 'Citra cryo']] as const) {
  const p = pouvoirAjout({ id: key, hopKey: key, moment: 'dryPost', grams: DOSE * 20, dureeJours: 3 }, r16);
  const inc = Object.values(p.composes).filter((y) => !y.rapport.plage).map((y) => `${y.nom} (${(y.teneur.plage ? y.rapport.inconnu : y.teneur.inconnu)?.split(' ; ')[0]})`);
  dire(`   ${nomH} : ${inc.join(' ; ') || 'aucun composé sans rapport'}`);
}
dire('   toujours : ordre des ajouts, synergie, masquage, perception en bière noire, taux de biotransformation, ampleur du hop creep pour ce brassin');
fichiers.push(ecrire('index', { titre: 'Moteur « pouvoir aromatique » : cas du brasseur (19.10.2026)', specification: 'work/refonte-frontend/v4/ecran-1/fils19-choix/MOTEUR-POUVOIR.md', regle: POUVOIR_RULE,
  fichiers: fichiers.map((f) => path.basename(f)), cas: CAS.map((c) => ({ id: c.id, titre: c.titre })), resume: lignes }, true));

console.log(lignes.join('\n'));
console.log(`\n${fichiers.length} fichiers : ${fichiers.map((f) => `${path.basename(f)} (${(fs.statSync(f).size / 1024).toFixed(0)} ko)`).join(', ')}`);
