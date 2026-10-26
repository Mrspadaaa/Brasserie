// Rapport Markdown de la suite « mots » (#181, e1-banc-eval) : met en forme suite-mots.json, sans rien calculer de plus.
/* eslint-disable @typescript-eslint/no-explicit-any */
const c = (x: number | null | undefined, n = 3) => (x === null || x === undefined ? '–' : String(Math.round(x * 10 ** n) / 10 ** n).replace('.', ','));
const iv = (a: number[] | null) => (a ? `[${c(a[0])} ; ${c(a[1])}]` : '–');
const iv1 = (a: number[] | null) => (a ? `[${c(a[0], 1)} ; ${c(a[1], 1)}]` : '–');

export function rapportSuite(r: any): string {
  const L: string[] = [];
  const w = (s = '') => L.push(s);
  const tab = (tete: string[], lignes: (string | number)[][]) => { w(`| ${tete.join(' | ')} |`); w(`|${tete.map(() => '---').join('|')}|`); for (const l of lignes) w(`| ${l.join(' | ')} |`); w(); };
  const ligne = (nom: string, x: any) => [nom, `${c(x.mrr)} ${iv(x.ic95.mrr)}`, `${c(x.rappel10)} ${iv(x.ic95.rappel10)}`, `${c(x.rangMedian, 1)} ${iv1(x.ic95.rangMedian)}`,
    x.ecartAuMoteur_ic95 ? `${iv(x.ecartAuMoteur_ic95.mrr)} · ${iv(x.ecartAuMoteur_ic95.rappel10)} · ${iv1(x.ecartAuMoteur_ic95.rangMedian)}` : '(moteur)'];
  const TETE = ['λ', 'MRR [IC 95 %]', 'rappel@10 [IC 95 %]', 'rang médian du 1er [IC 95 %]', 'écart au moteur [IC 95 %] : MRR · rappel@10 · rang'];

  w('# Suite e1 : l’option « mots » mise à l’épreuve (#181)');
  w();
  w('Généré par `scripts/eval-hop/suite-mots.ts`, déterministe, hors ligne ; mesure seulement (`src/domain` intact). Mêmes houblons, même référence que `rapport.md`. Variante : l’arôme d’un candidat devient λ × arôme du moteur + (1 − λ) × 100 × cosinus des mots (pondérés par la rareté log(N/df)) ; λ = 1 est le moteur. Dry hop (les classements de 10′, whirlpool et dry hop sont identiques). Réplique hors ligne sur les composantes rendues (entiers) : ±1 rang possible hors λ = 1.');
  w();
  w(`Protocole : ${r.suite.moitie}. Pour chaque variante, λ est choisi sur la moitié 0 (meilleur MRR ; à égalité, le plus grand λ) puis jugé sur la moitié 1, et inversement. Intervalles à 95 % : ${r.suite.rééchantillons} rééchantillonnages des houblons (graine ${r.suite.graine}) ; l’écart au moteur est apparié (mêmes houblons tirés).`);
  w();
  w('## 1. λ choisi sur une moitié, jugé sur l’autre');
  w();
  for (const genre of Object.keys(r.lambda)) {
    const ch = r.choix[genre];
    w(`### ${genre}`);
    w();
    w(`λ choisi sur la moitié 0 : **${ch.choisiSurMoitie0_jugeSurMoitie1}** (jugé sur la moitié 1) ; choisi sur la moitié 1 : **${ch.choisiSurMoitie1_jugeSurMoitie0}** (jugé sur la moitié 0).`);
    w();
    w('Moitié 1 (contrôle de λ choisi sur la moitié 0) :');
    w();
    tab(TETE, Object.keys(r.lambda[genre]).map((k) => ligne(k, r.lambda[genre][k].controle)));
    w('Moitié 0 (contrôle de λ choisi sur la moitié 1) :');
    w();
    tab(TETE, Object.keys(r.lambda[genre]).map((k) => ligne(k, r.lambda[genre][k].apprentissage)));
  }
  w('## 2. Candidats remontés par un seul mot');
  w();
  const u = r.unSeulMot;
  w(`Au réglage λ = ${r.suite.retenu.lambda} sans garde, sur les 318 houblons pris comme original : ${u.nEntrants} candidats entrent dans les 10 premiers sans y être avec le moteur ; **${u.unSeulMot}** n’ont qu’un seul mot partagé avec l’original, ${u.aucunMot} aucun (ils montent parce que d’autres redescendent). Exemples parmi les mots les plus rares :`);
  w();
  tab(['original', 'candidat', 'rang', 'rang du moteur', 'mot partagé', 'rareté (idf)'], u.exemples.slice(0, 12).map((e: any) => [e.original, e.candidat, e.rang, e.rangMoteur ?? '>317', e.mot, c(e.idf, 2)]));
  w(`Les mots « dank » et « cannabis » (hors famille, ceux de Columbus) font entrer ${u.dankCannabis.length} candidats, presque tous avec plusieurs mots partagés (Chinook, Summit, Galaxy, Amarillo, Columbus… entre eux) : ils rapprochent des houblons que le brasseur dit « dank » ; un seul entrant partage « dank » seul (African Queen → Chinook).`);
  w();
  w('Gardes mesurées à ce λ (mots de toutes les fiches) :');
  w();
  tab(['garde', 'entrants dans les 10', 'dont un seul mot', 'dont aucun', 'MRR contrôle [IC]', 'rappel@10 contrôle [IC]', 'rang médian contrôle [IC]', 'MRR tous'],
    u.gardes.map((g: any) => [g.garde, g.entrantsDansLesDix, g.dontUnSeulMot, g.dontAucunMot, `${c(g.controle.mrr)} ${iv(g.controle.ic95.mrr)}`, `${c(g.controle.rappel10)} ${iv(g.controle.ic95.rappel10)}`, `${c(g.controle.rangMedian, 1)} ${iv1(g.controle.ic95.rangMedian)}`, c(g.tous.mrr)]));
  w('## 3. Pourquoi Nelson Sauvin, Motueka, Riwaka et Hallertau Blanc bougent');
  w();
  const e = r.explications;
  w(`Mots de Nelson Sauvin : ${e.motsOriginal.join(', ')}. Hors famille : ${e.motsSansFamilleOriginal.join(', ')}.`);
  w();
  const lam = ['λ=1', 'λ=0.75', 'λ=0.5', 'λ=0.25', 'λ=0'];
  for (const cd of e.candidats) {
    w(`**${cd.candidat}** (cosinus des 12 familles ${c(cd.cosinusFamilles, 2)}) — mots : ${cd.motsDuCandidat.join(', ')}.`);
    w();
    tab(['variante', ...lam.map((l) => `rang ${l}`), 'arôme (moteur → λ=0,25)', 'mots partagés'], [
      ['tous les mots', ...lam.map((l) => cd.parLambda[`tous ${l}`].rang), `${cd.parLambda['tous λ=1'].arome} → ${cd.parLambda['tous λ=0.25'].arome}`, cd.parLambda['tous λ=0.25'].motsPartages.join(', ') || '–'],
      ['hors famille seulement', ...lam.map((l) => cd.parLambda[`hors-famille ${l}`].rang), `${cd.parLambda['hors-famille λ=1'].arome} → ${cd.parLambda['hors-famille λ=0.25'].arome}`, cd.parLambda['hors-famille λ=0.25'].motsPartages.join(', ') || '–'],
    ]);
  }
  w(`Motueka comme original (ses mots : ${e.motueka.motsOriginal.join(', ')}) : ${e.motueka.candidatsBM.map((cd: any) => `${cd.candidat} → ${Object.keys(cd.parLambda).map((k) => `${k} : ${cd.parLambda[k].rang}e`).join(', ')} (mots partagés : ${cd.parLambda['λ=0.25'].motsPartages.join(', ') || 'aucun'})`).join(' ; ')}.`);
  w();
  w('## 4. Réglages retenus, sur toutes les mesures');
  w();
  tab(['réglage', 'jeu', ...TETE.slice(1)], [
    ...['retenu', 'prudent'].flatMap((k) => ['apprentissage', 'controle', 'tous'].map((j) => [`${k} : λ = ${r[k].lambda}, garde ≥ ${r[k].garde.min} mots, plafond df ${r[k].garde.plafondDf}`, j === 'apprentissage' ? 'moitié 0' : j === 'controle' ? 'moitié 1' : 'tous', ...ligne('', r[k][j]).slice(1)])),
  ]);
  w('Listes avant/après pour 11 houblons : `listes-lambda.json`.');
  w();
  return L.join('\n') + '\n';
}
