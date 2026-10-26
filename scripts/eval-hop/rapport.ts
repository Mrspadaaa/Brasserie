// Rapport Markdown du banc d'évaluation (#181, e1-banc-eval) : met en forme resultats.json, sans rien calculer de plus.
/* eslint-disable @typescript-eslint/no-explicit-any */
type F = { pct: (x: number | null) => string; f1: (x: number | null) => string; f3: (x: number | null) => string };

export function rapport(r: any, f: F): string {
  const L: string[] = [];
  const w = (s = '') => L.push(s);
  const tab = (tete: string[], lignes: (string | number)[][]) => { w(`| ${tete.join(' | ')} |`); w(`|${tete.map(() => '---').join('|')}|`); for (const l of lignes) w(`| ${l.join(' | ')} |`); w(); };
  const lr = (nom: string, x: any) => [nom, x.n, f.pct(x.rappel5), f.pct(x.rappel10), f.pct(x.touche10), f.f1(x.rangMedian), f.f3(x.mrr)];
  const TETE = ['', 'houblons', 'rappel@5', 'rappel@10', 'au moins 1 dans les 10', 'rang médian du 1er', 'MRR'];
  const nom = (id: string) => id.replace('beermaverick-', '');
  const wp = (x: any) => `${x.arome} / ${x.huiles} / ${x.amertume}`.replace(/./g, ',');

  w('# Banc d’évaluation Substituer et Suggérer (#181, étape 1 : mesurer)');
  w();
  w('Généré par `scripts/eval-hop/banc-eval.ts` (déterministe, hors ligne, sans Gemini). **Cette étape mesure, elle ne règle rien** : aucun changement dans `src/domain`.');
  w();
  w('## 1. Données et méthode');
  w();
  w(`- Moteur : \`${r.banc.moteur}\` — ${r.banc.poolSubstituer}. Le stock du brasseur ne pèse pas sur la mesure.`);
  w(`- Vérité de terrain : le bloc \`bm.substituts\` (Beer Maverick, D75), que le moteur ne lit pas. ${r.verite.houblonsAvecSubstituts} houblons, ${r.verite.substitutsReferences} paires (médiane ${r.verite.attendusParHoublonMedian} substituts par houblon) ; ${r.verite.substitutsNonReliesIgnores} citations au nom non relié sont ignorées.`);
  w(`- Usage de l’original : aroma ${r.verite.parUsage.aroma}, dual ${r.verite.parUsage.dual}, bittering ${r.verite.parUsage.bittering}.`);
  w(`- Référence imparfaite : seules ${r.verite.reciprocite.reciproques} paires sur ${r.verite.reciprocite.paires} (${Math.round(100 * r.verite.reciprocite.reciproques / r.verite.reciprocite.paires)} %) sont réciproques (A cite B et B cite A). Un score parfait n’existe pas.`);
  w(`- Métriques : rappel@k = part des substituts de référence dans les k premiers, moyennée sur les houblons ; « au moins 1 » = part des houblons dont un substitut est dans les 10 premiers ; rang du premier substitut (médiane) ; MRR = moyenne de 1/rang du premier. Le rang est la position dans la liste telle que l’app l’affiche (ex æquo départagés par le nom).`);
  w(`- Référence au hasard (même nombre de substituts, classement tiré au sort, graine ${r.banc.graineEchantillon + 1}, 20 tirages) : rappel@10 ${f.pct(r.substituer.aleatoire.rappel10)}, MRR ${f.f3(r.substituer.aleatoire.mrr)}, rang médian ${r.substituer.aleatoire.rangMedian}.`);
  w();
  w('## 2. Substituer : le moteur contre les substituts de Beer Maverick');
  w();
  const ri = r.substituer.rankingsIdentiques;
  w(`**Constat de structure** : à 10′, au whirlpool et au dry hop actif, les classements sont **identiques** pour ${ri.b10_wp} houblons sur ${ri.sur} (10′ contre dry hop : ${ri.b10_dry}). Les poids ne dépendent que de la nature du moment (amertume : 60′ ; arôme : tout le reste) ; seule la dose change. Il y a donc deux classements réels, pas quatre.`);
  w();
  tab(TETE, [lr('60′', r.substituer.parMoment['60′'].tous), lr('10′ = whirlpool = dry hop', r.substituer.parMoment['10′'].tous), lr('au hasard', { ...r.substituer.aleatoire })]);
  w('Par moment et par usage de l’original :');
  w();
  const lignesU: (string | number)[][] = [];
  for (const mo of ['60′', '10′', 'dry hop actif']) for (const u of ['aroma', 'dual', 'bittering']) lignesU.push(lr(`${mo} · ${u}`, r.substituer.parMoment[mo].parUsage[u]));
  tab(TETE, lignesU);
  w('Lecture : le moteur fait mieux que le hasard (rappel@10 ~3 fois, MRR ~2,5 fois), mais ne retrouve qu’un substitut sur 10 dans les 10 premiers, et un houblon sur quatre a au moins un substitut dans ses 10 premiers.');
  w();
  w('### Où la référence semble fausse ou discutable');
  w();
  const fl = r.substituer.drapeauxReference;
  w(`Sur ${fl.paires} paires : usage opposé (aromatique contre amérisant) ${fl.usageOppose} ; α à plus du double ${fl.alphaDouble} ; aucune famille d’arôme en commun ${fl.sansFamilleCommune} ; au moins un de ces drapeaux ${fl.auMoinsUn}. Hypothèse (non prouvée) : les substituts de Beer Maverick semblent souvent être des substituts de **classe** (noble pour noble, « un houblon doux ») ou de **marché**, peu sensibles à l’α ; le moteur pèse l’α et le rôle et s’en éloigne. Contre-indice : « amertume seule » bat « arôme seul » (§ 6), ce qui ferait de la référence une référence d’α.`);
  w();
  w('Cinq exemples (deux houblons décrits par au moins 3 familles ; le mauvais rang ne vient donc pas d’un profil creux) :');
  w();
  tab(['Houblon → substitut Beer Maverick', 'rang à l’arôme', 'rang à 60′', 'usage', 'α (%)', 'mots (fr)', 'drapeaux'],
    r.substituer.exemplesFaux.map((e: any) => [`${e.cibleNom} → ${e.subNom}`, e.rangArome, e.rang60, e.usage.join(' / '), e.alpha.map((a: any) => (a ? `${a[0]}–${a[1]}` : '?')).join(' / '), `${e.tagsCible.slice(0, 4).join(', ')} // ${e.tagsSub.slice(0, 4).join(', ')}`, e.drapeaux.join(', ')]));
  w('Noms de substituts cités par la page mais non reliés au catalogue (donnée du #180) : ' + `${r.substituer.nonRelies.distincts} noms distincts, ${r.substituer.nonRelies.retrouvables} retrouvables par une correspondance indulgente (` +
    r.substituer.nonRelies.lignes.filter((l: any) => l.candidats.length).map((l: any) => `${l.nom} → ${l.candidats.slice(0, 2).join(' ou ')}`).join(' ; ') + `) ; absents du catalogue : ${r.substituer.nonRelies.lignes.filter((l: any) => !l.candidats.length).map((l: any) => l.nom).join(', ')}.`);
  w();
  w('## 3. Les houblons phares (L14)');
  w();
  w('Dix premiers de `substitutes()` avec le score (arôme / huiles / amertume), puis les substituts de Beer Maverick avec leur rang sur 317. « inconnu » : la page cite un nom que le catalogue ne relie pas.');
  w();
  for (const p of r.phares) {
    w(`### ${p.libelle}`);
    w();
    w(`Usage ${p.usage}, α ${p.alpha ? p.alpha.join('–') : '?'} %, ${p.nbFamilles} familles décrites, ${p.mots} mots dont ${Math.round((p.partSansFamille ?? 0) * 100)} % sans famille.`);
    w();
    for (const [k, lib] of [['dry', 'Dry hop (aussi 10′ et whirlpool)'], ['a60', '60′']] as const) {
      const v = p[k];
      w(`**${lib}** : ${v.top10.map((t: any) => `${t.rang}. ${t.nom} ${t.score} (${t.arome ?? '–'}/${t.huiles ?? '–'}/${t.amertume ?? '–'})`).join(' · ')}`);
      w();
      w(`Beer Maverick : ${v.bm.map((b: any) => (b.relie ? `${b.nom} ${b.rang}e (${b.score})` : `${b.nom} (inconnu)`)).join(' · ')}`);
      w();
      w(`Verdict : ${p.verdict ? p.verdict[k] : '–'}`);
      w();
    }
  }
  w('## 4. Suggérer : l’aller-retour');
  w();
  const S = r.suggerer.resume;
  w(`**Méthode.** Pour une variété X, la visée est son profil : « plus » sur ses familles marquées (trois au plus ; sinon sa famille citée la plus nette). Recette de base : 20 L, US-05, sans houblon, dry hop en fermentation active, toutes les voies « ajouter » de \`proposeVoies\` (400 variétés examinées, aucune limite). On lit le rang de X puis celui de ses substituts Beer Maverick (X ôté de la liste). Échantillon fixe : ${S.echantillon} variétés, graine ${S.graine} (mélange de Fisher-Yates, mulberry32, sur les ids triés des ${r.verite.houblonsAvecSubstituts} houblons avec substituts et au moins une famille décrite ; les 60 premiers, plus les phares absents). Les ex æquo reçoivent leur **rang moyen** : le moteur range alors par ordre alphabétique, ce qui n’a aucun sens.`);
  w();
  tab(['base', 'houblons', 'X dans la liste', 'rang moyen médian de X', 'X dans les 10', 'taille médiane du 1er groupe', 'liste médiane', 'groupes distincts (médiane)'],
    [['neutre (style sans échelle)', S.neutre.houblons, S.neutre.X.dansLaListe, f.f1(S.neutre.X.rangMoyenMedian), S.neutre.X.dansLesDix, S.neutre.X.premierGroupeMedian, S.neutre.X.listeMediane, S.neutre.X.groupesDistinctsMedian],
      ['IPA 21A (contrôle)', S.ipa21A.houblons, S.ipa21A.X.dansLaListe, f.f1(S.ipa21A.X.rangMoyenMedian), S.ipa21A.X.dansLesDix, S.ipa21A.X.premierGroupeMedian, S.ipa21A.X.listeMediane, S.ipa21A.X.groupesDistinctsMedian]]);
  tab(TETE.concat(['absents de la liste']), [lr('substituts BM, base neutre', S.neutre.substitutsBM).concat([`${S.neutre.absentsDeLaListe.absents} / ${S.neutre.absentsDeLaListe.total}`]),
    lr('substituts BM, base IPA', S.ipa21A.substitutsBM).concat([`${S.ipa21A.absentsDeLaListe.absents} / ${S.ipa21A.absentsDeLaListe.total}`]), lr('au hasard (317)', S.referenceAleatoire).concat(['–'])]);
  w(`**Lecture.** Sur la base neutre, la liste a **un seul groupe de rang** (médiane ${S.neutre.X.groupesDistinctsMedian}) : tous les houblons qui citent une famille visée reçoivent le même effet (l’apport V5.5 d’une famille citée ne dépend pas de la variété), donc la même distance. Suggérer ne **classe** pas les variétés entre elles : il sépare celles qui citent la famille de celles qui ne la citent pas, puis range par ordre alphabétique. X est au milieu de sa liste (rang moyen médian ${f.f1(S.neutre.X.rangMoyenMedian)} sur ${S.neutre.X.listeMediane}) : aucun signal de ressemblance. Avec le style IPA, ${S.ipa21A.X.groupesDistinctsMedian} groupes apparaissent (bandes et débordements), mais le premier groupe garde ${S.ipa21A.X.premierGroupeMedian} houblons. ${S.neutre.absentsDeLaListe.absents} substituts sur ${S.neutre.absentsDeLaListe.total} sont absents de la liste parce qu’ils ne citent aucune des familles visées.`);
  w();
  w(`Inconnu lu comme zéro : parmi les 10 premières voies de chaque houblon (${r.suggerer.inconnuLuCommeZero.voies} voies), ${r.suggerer.inconnuLuCommeZero.avecFamilleVisee_inconnue} ont une famille visée sans effet établi, comptée avec un effet de 0 dans la distance (\`central ?? 0\`, voies.ts).`);
  w();
  w(`Levure : mêmes visées avec Pomona au lieu d’US-05 (${r.suggerer.levure.houblons} houblons) : écart moyen du rang de X ${r.suggerer.levure.ecartMoyenDuRangDeX}, recouvrement du premier groupe ${r.suggerer.levure.recouvrementPremierGroupe}. Au dry hop actif, la levure ne change pas le classement des variétés dans ces cas.`);
  w();
  w('### Cinq cas « recette et attente » (mots du brasseur)');
  w();
  tab(['cas', 'ses mots', 'réponse attendue', 'observé', 'verdict'], r.suggerer.cas.map((c: any) => [`${c.id} · ${c.titre}`, c.mots, c.attendu, '`' + JSON.stringify(c.observe).replace(/\|/g, '/') + '`', c.ok ? 'tenu' : 'ÉCHEC']));
  w('## 5. Où l’algorithme se trompe, par cause');
  w();
  const E = r.erreurs;
  w(`Inventaire du catalogue (${E.inventaire.varietes} variétés) : aucune famille décrite ${E.inventaire.sansAucuneFamille} ; deux familles au plus ${E.inventaire.auPlusDeuxFamilles} ; moins de deux composants d’huile ${E.inventaire.huilesInsuffisantes} ; au moins 50 % de mots sans famille (6 mots ou plus) ${E.inventaire.motsSansFamilleAu50pc}.`);
  w();
  w('Substituer : les paires de référence **hors des 10 premiers**, rangées dans la première cause qui s’applique (ordre du tableau), et le nombre où la cause est présente, exclusive ou non. « Non expliqué » : référence discutable ou vrai écart.');
  w();
  const causes = Object.keys(E.causes['60′'].exclusif);
  tab(['cause', '60′ : première cause', '60′ : présente', 'arôme : première cause', 'arôme : présente'],
    causes.map((c) => [c, E.causes['60′'].exclusif[c], E.causes['60′'].inclusif[c], E.causes['arôme (10′, whirlpool, dry hop)'].exclusif[c], E.causes['arôme (10′, whirlpool, dry hop)'].inclusif[c]]));
  w(`Paires hors des 10 premiers : 60′ ${E.causes['60′'].horsDesDix} sur ${E.causes['60′'].substitutsReferences} (${f.pct(E.causes['60′'].partHorsDesDix)}) ; arôme ${E.causes['arôme (10′, whirlpool, dry hop)'].horsDesDix} sur ${E.causes['arôme (10′, whirlpool, dry hop)'].substitutsReferences} (${f.pct(E.causes['arôme (10′, whirlpool, dry hop)'].partHorsDesDix)}).`);
  w();
  w('Définitions : *données manquantes* = arôme inconnu d’un côté (rejeté derrière tous les autres par la clé de couverture), huiles ou amertume inconnues ; *amérisant écarté* = le substitut est un houblon aromatique, passé derrière les amérisants à 60′ ; *profil creux* = au plus 2 familles décrites pour l’original ou le substitut (les autres lues comme 0) ; *mots sans famille* = au moins 50 % de mots hors des 12 familles (6 mots ou plus) ; *poids de l’amertume* = le substitut entre dans les 10 premiers avec les meilleurs poids de la grille (§ 6) ; *levure* = Substituer ne lit pas la levure : 0 par construction.');
  w();
  const z = r.suggerer.inconnuLuCommeZero, k1 = r.suggerer.cas[0].observe.reservesMotsResineuxSansFamille;
  w(`Suggérer : (1) le classement est **plat** (§ 4) ; (2) inconnu lu comme zéro : ${z.avecFamilleVisee_inconnue} voies sur ${z.voies} (§ 4) ; (3) mots sans famille : K1, ${k1.length ? k1.map((x: any) => `${x.nom} (${x.mots.join(', ')})`).join(', ') : 'aucun cas'} passe(nt) pour « floral sans résineux » alors que les fiches disent le contraire en mots hors famille ; (4) levure : sans effet sur le rang dans ces cas ; (5) données manquantes : ${S.neutre.absentsDeLaListe.absents} substituts sur ${S.neutre.absentsDeLaListe.total} ne citent aucune famille visée.`);
  w();
  w('## 6. Options de réglage, chacune mesurée sur le banc');
  w();
  w('Toutes les mesures ci-dessous sont **hors ligne**, sur la même référence (substituts Beer Maverick). Une amélioration ici veut dire « plus proche de Beer Maverick », pas « plus juste pour le brasseur » : voir les réserves.');
  w();
  const P = r.options.poids;
  for (const lib of Object.keys(P)) {
    const x = P[lib];
    w(`### Poids par moment — ${lib}`);
    w();
    tab(['poids (arôme / huiles / amertume)', 'jeu', ...TETE.slice(1)], [
      [wp(x.courants.poids) + ' (actuels)', 'tous', ...lr('', x.courants.tous).slice(1)],
      [wp(x.courants.poids) + ' (actuels)', 'contrôle', ...lr('', x.courants.controle).slice(1)],
      [wp(x.meilleurs_sur_moitie_apprentissage.poids) + ' (meilleurs, appris sur une moitié)', 'contrôle (autre moitié)', ...lr('', x.meilleurs_sur_moitie_apprentissage.controle).slice(1)],
      [wp(x.meilleurs_sur_moitie_apprentissage.poids) + ' (meilleurs)', 'tous', ...lr('', x.meilleurs_sur_moitie_apprentissage.tous).slice(1)],
      ['0,7 / 0,3 / 0 (sans amertume)', 'tous', ...lr('', x.sans_amertume.tous).slice(1)],
      ['1 / 0 / 0 (arôme seul)', 'tous', ...lr('', x.arome_seul.tous).slice(1)],
      ['0 / 1 / 0 (huiles seules)', 'tous', ...lr('', x.huiles_seules.tous).slice(1)],
      ['0 / 0 / 1 (amertume seule)', 'tous', ...lr('', x.amertume_seule.tous).slice(1)],
    ]);
  }
  const X = r.options.poidsControleExact;
  w(`Contrôle exact par le moteur avec ces poids imposés (valide la réplique hors ligne) : 60′ MRR ${f.f3(X['60′'].tous.mrr)}, rappel@10 ${f.pct(X['60′'].tous.rappel10)} ; arôme MRR ${f.f3(X['arôme (10′, whirlpool, dry hop)'].tous.mrr)}, rappel@10 ${f.pct(X['arôme (10′, whirlpool, dry hop)'].tous.rappel10)}.`);
  w();
  w('**Réserve forte** : les meilleurs poids sont ceux de l’amertume (0,8), à tous les moments, et « amertume seule » bat l’arôme seul : la référence Beer Maverick suit surtout l’α, le rôle et la bêta, ce que le brasseur de Nelson Sauvin ne veut pas (il veut le vin blanc). Un gain ici est un alignement sur le marché, pas une preuve de justesse.');
  w();
  w('### Mots sans famille (cosinus pondéré par la rareté des mots, hors ligne)');
  w();
  w('Variante mesurée : l’arôme d’un candidat = λ × cosinus des 12 familles + (1 − λ) × cosinus des **mots** de toutes les fiches (famille ou non, pondérés par log(N/df)), poids actuels de l’arôme conservés. Aux moments d’arôme seulement.');
  w();
  tab(TETE.map((t, i) => (i === 0 ? 'λ' : t)), Object.keys(r.options.motsSansFamille).map((k) => lr(k, r.options.motsSansFamille[k])));
  const C = r.options.motsPlusPoids;
  w(`Mots (λ = 0,25) plus les poids appris : contrôle (autre moitié) MRR ${f.f3(C.controle.mrr)}, rappel@10 ${f.pct(C.controle.rappel10)} ; tous MRR ${f.f3(C.tous.mrr)}, rappel@10 ${f.pct(C.tous.rappel10)}. Les deux gains ne s’additionnent pas.`);
  w();
  const N = r.options.motsNelsonSauvin;
  w(`Nelson Sauvin (K4), rangs de ses quatre substituts Beer Maverick (Hallertau Blanc, Enigma, Motueka, Riwaka), 155, 244, 89, 206 aujourd’hui : ${Object.keys(N).map((k) => `${k} → ${N[k].map((x: any) => `${x.nom} ${x.rang}`).join(', ')}`).join(' ; ')}.`);
  w();
  w('Réserve : les mots viennent de la même page Beer Maverick que les substituts (mêmes étiquettes pour des houblons voisins) ; le gain peut être en partie une corrélation de source. Il confirme néanmoins que les mots hors famille portent de l’information que le moteur jette (L14).');
  w();
  w('### Radar Beer Maverick `bm.arome` (9 axes, 57 % des variétés)');
  w();
  tab(TETE.map((t, i) => (i === 0 ? 'λ (tous les houblons ; repli sur les familles sans radar)' : t)), Object.keys(r.options.radarBM.tous).map((k) => lr(k, r.options.radarBM.tous[k])));
  tab(TETE.map((t, i) => (i === 0 ? `λ (seulement les ${r.options.radarBM.nHoublonsAvecRadar} houblons dont l’original a un radar)` : t)), Object.keys(r.options.radarBM.surHoublonsAvecRadar).map((k) => lr(k, r.options.radarBM.surHoublonsAvecRadar[k])));
  w('Même sous-ensemble, avec les **mots** à la place du radar :');
  w();
  tab(TETE.map((t, i) => (i === 0 ? 'λ (mots, sous-ensemble radar)' : t)), Object.keys(r.options.motsSurHoublonsAvecRadar).map((k) => lr(k, r.options.motsSurHoublonsAvecRadar[k])));
  w('Réserve : fuite possible de source (radar et substituts viennent de la même page) ; un radar est un résumé de 9 nombres par variété, absent pour 43 % ; les mots font mieux sur le même sous-ensemble.');
  w();
  w('## 7. Protocole d’un essai d’IA en re-classement (aucun appel fait ici)');
  w();
  w('- **Quoi** : le moteur garde la main sur la liste ; un modèle (Gemini) reçoit les 20 premiers candidats avec leurs fiches (mots, α, huiles) et rend un ordre des 10 premiers avec une phrase. Jamais sur tout le catalogue.');
  w('- **Banc** : les 30 premiers houblons de l’échantillon de ce banc (graine 181), aux deux moments (60′, dry hop), plus les 9 phares : 78 requêtes au plus, journalisées (entrée, sortie, durée, jetons).');
  w('- **À battre** : sur ces mêmes cas, MRR et rappel@10 du moteur seul (§ 2) et du meilleur réglage hors ligne (§ 6). Gain minimal pour continuer : +0,05 de MRR, ou +5 points de rappel@10, **et** les verdicts du brasseur sur les 9 phares (Nelson Sauvin : Hallertau Blanc dans les 5 premiers).');
  w('- **Limites** : durée par requête sous 3 s au p95 (écran Substituer) ; coût journalisé en jetons ; jamais dans `npm test` ; un fichier de requêtes figé et rejoué hors ligne pour comparer deux invites ; résultats dans un dossier daté, appels lancés à la main, très limités ; hors ligne : le moteur reste la réponse.');
  w('- **Risque** : même source que la référence (le modèle a vu Beer Maverick) ; contre la fuite, juger aussi sur les cinq cas du brasseur (K1 à K5) qui ne viennent pas de Beer Maverick.');
  w();
  return L.join('\n') + '\n';
}
