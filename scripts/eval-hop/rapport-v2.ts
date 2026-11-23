// Rapport Markdown du banc moteur-v2.ts (voie e2-moteur-substitution). Pur : reçoit les résultats, rend du texte.
import { VARS, PROFILS } from './formuleV2';

type IC = [number, number];
interface Ligne { n: number; mrr: number; rappel10: number; rangMedian: number; ic95: { mrr: IC; rappel10: IC; rangMedian: IC }; ecart: { mrr: IC; rappel10: IC; rangMedian: IC } | null; ecartPoint: { mrr: number; rappel10: number; rangMedian: number } | null; contreC: { mrr: IC; rappel10: IC; rangMedian: IC } | null; contreCPoint: { mrr: number; rappel10: number } | null }
interface Res {
  effectifs: Record<string, number>; donnees: Record<string, { catalogue: number; complements: number; inconnu: number }>; sigma: Record<string, number>;
  appris: Record<string, Record<string, { g: number[]; partMots: number; mrrApp: number; rappelApp: number; dix: { g: number[]; partMots: number; mrr: number }[] }>>;
  amerTous: { g: number[]; partMots: number; mrrApp: number };
  poids: Record<string, Record<string, Record<string, number>>>;
  hasard: { tous: { mrr: number; rappel10: number; rangMedian: number }; amer: { mrr: number; rappel10: number; rangMedian: number } };
  resultatsA: Record<string, Record<string, Record<string, Record<string, Ligne>>>>;
  ablation: Record<string, { variable: string; poids: number; mrrSans: number; ecartMrr: number; ecartRappel10: number; ic: { mrr: IC } }[]>;
  refB: Record<string, Record<string, { parPhare: { phare: string; rangs: number[] }[]; dansLes10: number; sur: number; rangMedian: number; rangMoyen: number }>>;
  topPhares: { phare: string; d: string[]; bm: string[]; parMoment: Record<string, { dix: { rang: number; nom: string; score: number; bm: boolean; d: boolean }[]; rangsBM: { nom: string; rang: number }[]; rangsD: { nom: string; rang: number }[] }> }[];
  recouvrement60: { houblon: string; communs: number }[];
  essais: Record<string, { famille: string; definition: string; g: number[]; partMots: number; mrrApp: number; mrrCtl: number; rappel10Ctl: number; ecartA: IC; ecartAPoint: number; ecartC: IC; ecartCPoint: number; mrrCtlTous: number | null; bDans10: number; bRangMedian: number; retenu: boolean }[]>;
  seuilB: { A: number; C: number; seuil: number; famillesChoisies: Record<string, string> };
  verdict: Record<string, unknown>;
}
const f3 = (x: number | null | undefined) => (x === null || x === undefined ? '–' : x.toFixed(3).replace('.', ','));
const f1 = (x: number | null | undefined) => (x === null || x === undefined ? '–' : String(Math.round(x * 10) / 10).replace('.', ','));
const sg = (x: number) => (x > 0 ? '+' : '') + f3(x);
const ic = (x: IC) => `[${f3(x[0])} ; ${f3(x[1])}]`;
const icR = (x: IC) => `[${f1(x[0])} ; ${f1(x[1])}]`;
const pctG = (g: number[]) => `amertume ${g[0]} · huile ${g[1]} · arôme ${g[2]}`;

export function rapportV2(r: Res, LIB: Record<string, string>): string {
  const L: string[] = [];
  const E = r.effectifs;
  L.push('# Moteur v2 de Substituer : mesure hors ligne (#181, D80)', '');
  L.push(`Généré par \`scripts/eval-hop/moteur-v2.ts\` (formule : \`formuleV2.ts\`), déterministe, hors ligne ; \`src/domain\` n'est pas touché par ce rapport. Mesure sur ${E.cibles} houblons qui ont des substituts Beer Maverick reliés au catalogue : ${E.apprentissage} pour apprendre (parité 0), ${E.controle} pour juger (parité 1). Intervalles à 95 % : 1000 rééchantillonnages des houblons (graine 181) ; un écart est apparié (mêmes houblons tirés). Hasard au contrôle : MRR ${f3(r.hasard.tous.mrr)}, rappel@10 ${f3(r.hasard.tous.rappel10)}, rang médian ${f1(r.hasard.tous.rangMedian)}.`, '');
  L.push('## 1. La formule v2', '');
  L.push('- Une ressemblance par variable, entre 0 et 1. Moyenne pondérée des variables **connues des deux houblons** : un inconnu sort du calcul (jamais 0) ; poids renormalisés.');
  L.push(`- Quatorze variables : ${VARS.join(', ')}. Valeurs : le catalogue d'abord, sinon l'enveloppe valide de \`complements.json\` (borne seule ou [0, 0] : inconnu).`);
  L.push('- Trois jeux de poids : amertume (premier moût, 60′, 30′, 15′), arôme chaud (10′, whirlpool), à froid (dry hop). Poids de groupe (amertume, huile, arôme) et part des mots appris sur la moitié d\'apprentissage ; poids à l\'intérieur d\'un groupe fixés à la main :');
  L.push('', '| moment | amertume : α · β · cohumulone · usage | huile : totale · myrcène · humulène · caryophyllène · farnésène · linalol · géraniol |', '|---|---|---|');
  for (const mo of ['am', 'ch', 'fr']) L.push(`| ${LIB[mo]} | ${(PROFILS as never as Record<string, { amertume: number[]; huile: number[] }>)[mo].amertume.join(' · ')} | ${(PROFILS as never as Record<string, { amertume: number[]; huile: number[] }>)[mo].huile.join(' · ')} |`);
  L.push('', '- Arôme : familles (cosinus ; à l\'amertume, la part non étrangère, comme aujourd\'hui), mots fins (cosinus pondéré par la rareté, garde de 2 mots partagés : le réglage C de e1), radar Beer Maverick (poids 0,1 du groupe quand les deux l\'ont : c\'est la donnée de la référence). Aux moments d\'arôme, la part des mots est apprise (0,25 / 0,5 / 0,75) ; à l\'amertume les mots et le radar ne comptent pas.');
  L.push('- Classement : mêmes clés que le moteur actuel (couverture faible derrière ; à l\'amertume, produit d\'arôme ou houblon aromatique derrière ; score entier ; nom). La réplique de A hors ligne reproduit l\'ordre de `substitutes()` pour les 318 originaux aux 3 moments (vérifié par le script, il s\'arrête sinon).', '');
  L.push('### Couverture des données', '', '| variable | catalogue | compléments | inconnu |', '|---|---|---|---|');
  for (const v of ['alpha', 'beta', 'cohumulone', 'usage', 'huile', 'myrcène', 'humulène', 'caryophyllène', 'farnésène', 'linalol', 'géraniol', 'familles', 'mots', 'radar']) { const d = r.donnees[v]; if (d) L.push(`| ${v} | ${d.catalogue} | ${d.complements} | ${d.inconnu} |`); }
  L.push('', 'Sur 318 houblons. Le géraniol et le linalol sont les variables rares : ils ne comptent que lorsque les deux fiches les ont.', '');

  L.push('## 2. Poids appris (moitié d\'apprentissage)', '');
  L.push('| réglage | moment | poids de groupe | part des mots | MRR apprentissage |', '|---|---|---|---|---|');
  for (const nomV of ['v2', 'v2libre']) for (const mo of ['am', 'ch', 'fr']) { const a = r.appris[nomV][mo]; L.push(`| ${nomV === 'v2' ? 'v2 (contraint)' : 'v2 libre'} | ${LIB[mo]} | ${pctG(a.g)} | ${mo === 'am' ? '–' : a.partMots} | ${f3(a.mrrApp)} |`); }
  const sb = r.seuilB;
  L.push('', `Le réglage libre (aucune contrainte) montre où va la référence (a) quand on la laisse faire : vers l'α et l'usage, comme l'avait montré e1. v2 est donc appris sous une contrainte a priori de brasseur. Amertume : le groupe amertume pèse au moins 0,4, appris sur les ${E.amerisantsApprentissage} amérisants de la moitié d'apprentissage (usage BM bittering) ; garde-fou : appris sur tous les houblons, poids ${pctG(r.amerTous.g)}. Moments d'arôme : quatre contraintes a priori essayées (§ 2 bis), et v2 prend la meilleure sur la moitié d'apprentissage dont la liste D est retrouvée (à froid, dans les 10 premiers) aux trois quarts de l'écart A → C : ${sb.A} (A) → ${sb.C} (C) sur 24, seuil ${sb.seuil}. Familles retenues : arôme chaud ${sb.famillesChoisies.ch}, à froid ${sb.famillesChoisies.fr}.`, '');
  L.push('### 2 bis. Tous les réglages essayés', '', 'Aux moments d\'arôme : tous les houblons au contrôle. À l\'amertume : les amérisants au contrôle (colonne « tous » : MRR sur les 108 houblons). (b) : les 24 houblons de D parmi les 10 premiers (A et C : voir § 5, seuls les moments d\'arôme ont un (b)).', '', '| moment | famille d\'a priori | poids de groupe (amertume · huile · arôme), part des mots | MRR appr. | MRR contrôle | écart à A [IC] | écart à C [IC] | rappel@10 | (b) dans les 10 | (b) rang médian | |', '|---|---|---|---|---|---|---|---|---|---|---|');
  for (const mo of ['am', 'ch', 'fr']) for (const x of r.essais[mo]) {
    if (mo === 'am' && !['k1', 'libre'].includes(x.famille)) continue;
    L.push(`| ${LIB[mo]} | ${x.famille} : ${x.definition} | ${x.g.join(' · ')}${mo === 'am' ? '' : `, ${x.partMots}`} | ${f3(x.mrrApp)} | ${f3(x.mrrCtl)}${x.mrrCtlTous === null ? '' : ` (tous : ${f3(x.mrrCtlTous)})`} | ${sg(x.ecartAPoint)} ${ic(x.ecartA)} | ${sg(x.ecartCPoint)} ${ic(x.ecartC)} | ${f3(x.rappel10Ctl)} | ${x.bDans10} | ${f1(x.bRangMedian)} | ${x.retenu ? '**retenu**' : ''} |`);
  }
  L.push('');

  L.push('## 3. Contre (a), les substituts Beer Maverick, sur la moitié de contrôle', '');
  L.push('(a) ressemble à la formule de Beer Maverick (fuite) : un gain ici ne dit pas la justesse pour le brasseur. Lecture : MRR = moyenne de 1/rang du premier substitut ; rappel@10 = part des substituts dans les 10 premiers.', '');
  for (const mo of ['am', 'ch', 'fr']) {
    for (const [ens, parts] of Object.entries(r.resultatsA[mo])) {
      const c = parts.ctl;
      L.push(`### ${LIB[mo]} — ${ens} (contrôle, n = ${Object.values(c)[0].n})`, '', '| méthode | MRR [IC 95 %] | rappel@10 [IC 95 %] | rang médian du 1er [IC 95 %] | écart à A : MRR [IC] | écart à C : MRR [IC] |', '|---|---|---|---|---|---|');
      for (const [l, x] of Object.entries(c)) L.push(`| ${l} | ${f3(x.mrr)} ${ic(x.ic95.mrr)} | ${f3(x.rappel10)} ${ic(x.ic95.rappel10)} | ${f1(x.rangMedian)} ${icR(x.ic95.rangMedian)} | ${x.ecart && x.ecartPoint ? `${sg(x.ecartPoint.mrr)} ${ic(x.ecart.mrr)}` : '–'} | ${x.contreC && x.contreCPoint ? `${sg(x.contreCPoint.mrr)} ${ic(x.contreC.mrr)}` : '–'} |`);
      L.push('');
      const a = parts.app;
      L.push(`Moitié d'apprentissage (n = ${Object.values(a)[0].n}) : ` + Object.entries(a).map(([l, x]) => `${l} MRR ${f3(x.mrr)}`).join(' ; ') + '.', '');
    }
  }
  L.push(`Hasard, amérisants au contrôle : MRR ${f3(r.hasard.amer.mrr)}, rappel@10 ${f3(r.hasard.amer.rappel10)}, rang médian ${f1(r.hasard.amer.rangMedian)}. À l'amertume, A et C sont le même classement (C ne touche que l'arôme).`, '');

  L.push('## 4. Ce que chaque variable ajoute (v2 sans elle, contrôle)', '');
  L.push('Une ligne = v2 dont la variable (ou le groupe) est mise à poids 0, les autres renormalisées. Un écart négatif : la variable aide ; positif : elle gêne sur cette référence. L\'IC est celui de l\'écart apparié au v2 entier.', '');
  for (const [k, rows] of Object.entries(r.ablation)) {
    L.push(`### ${k.replace(/^(am|ch|fr)/, (m) => LIB[m])}`, '', '| sans… | poids dans v2 | MRR sans | écart de MRR [IC 95 %] | écart de rappel@10 |', '|---|---|---|---|---|');
    for (const x of rows) L.push(`| ${x.variable} | ${f3(x.poids)} | ${f3(x.mrrSans)} | ${sg(x.ecartMrr)} ${ic(x.ic.mrr)} | ${sg(x.ecartRappel10)} |`);
    L.push('');
  }

  L.push('## 5. Contre (b), le jugement du brasseur : les 3 premiers de D pour les 8 phares', '');
  L.push('Rang, dans chaque classement, des 24 houblons que D place en tête (3 par phare). **Limite** : D est fait avec le classement C (l\'IA reclasse les 20 premiers de C) ; (b) est donc plus proche de C que d\'A ou de v2. Il départage, il ne tranche pas.', '');
  L.push('| moment | méthode | dans les 10 premiers (sur 24) | rang médian | rang moyen |', '|---|---|---|---|---|');
  for (const mo of ['fr', 'ch', 'am']) for (const [l, x] of Object.entries(r.refB[mo])) L.push(`| ${LIB[mo]} | ${l} | ${x.dansLes10} | ${f1(x.rangMedian)} | ${f1(x.rangMoyen)} |`);
  L.push('', 'Détail à froid (rang des 3 houblons de D, dans l\'ordre de D) :', '', '| phare | A | C | v2 | v2 libre |', '|---|---|---|---|---|');
  const phs = r.refB.fr['A (actuel)'].parPhare.map((p) => p.phare);
  phs.forEach((p, i) => L.push(`| ${p} | ${['A (actuel)', 'C (mots, λ 0,25)', 'v2', 'v2 libre'].map((l) => r.refB.fr[l].parPhare[i].rangs.join(' · ')).join(' | ')} |`));
  L.push('');

  L.push('## 6. Les 10 premiers de v2, pour les 8 phares et les 3 moments', '');
  L.push('Marques : **D** = l\'un des 3 premiers de D ; **BM** = substitut Beer Maverick. Entre parenthèses, le score v2.', '');
  for (const p of r.topPhares) {
    L.push(`### ${p.phare}`, '', `D : ${p.d.join(', ')}. Beer Maverick : ${p.bm.join(', ') || '–'}.`, '');
    for (const mo of ['am', 'ch', 'fr']) {
      const t = p.parMoment[mo];
      L.push(`- **${LIB[mo]}** : ${t.dix.map((x) => `${x.rang}. ${x.nom} (${x.score})${x.d ? ' **D**' : ''}${x.bm ? ' BM' : ''}`).join(' ; ')}`);
      L.push(`  - rang des houblons de D : ${t.rangsD.map((x) => `${x.nom} ${x.rang}`).join(', ')} ; rang des substituts BM : ${t.rangsBM.map((x) => `${x.nom} ${x.rang}`).join(', ') || '–'}`);
    }
    L.push('');
  }
  L.push('## 7. Recouvrement A et v2 à 60′ (les dix premiers)', '', r.recouvrement60.map((x) => `${x.houblon} ${x.communs}/10`).join(' · '), '');
  return L.join('\n') + '\n';
}
