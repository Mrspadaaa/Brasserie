OK — banc hors ligne Substituer/Suggérer : 217 houblons, 697 paires, déterministe (sha256 égal), rapport et options chiffrées

## Fichiers écrits
- `scripts/eval-hop/banc-eval.ts` (le banc), `metriques.ts` (formules pures), `rapport.ts` (Markdown), `verdicts.ts` (verdicts écrits à la main sur les 9 phares).
- `tests/unit/hopIndexV4/bancEvalMetriques.test.ts` (6 tests, mini jeu à réponse connue ; n'appelle pas le banc).
- `work/missions/2026-10-25-integration-houblons/voies/e1-banc-eval/resultats/resultats.json` et `rapport.md` (344 lignes : métriques, phares, 5 cas, erreurs par cause, options, protocole IA).
- Rien dans `src/domain`. Pas de GATES.md dans la voie : critères pris dans VOIE.md.

## Critères (sortie décisive)
- `npx vite-node scripts/eval-hop/banc-eval.ts -- --sortie=<voie>/resultats` : sort 0 deux fois (75 s puis 82 s, dont ~45 s de démarrage de vite-node sur ce poste) ; `sha256sum` des deux `resultats.json` : `acf24dc3bd8f5d6355aea3fd7035c9734f54301a508ec1f7a8dde0f757eb5a63` (égal) ; `rapport.md` aussi égal.
- `rapport.md` : métriques par moment et par usage (§ 2), houblons phares avec verdicts (§ 3), erreurs classées par cause (§ 5).
- `npx vitest run tests/unit/hopIndexV4` : 24 fichiers, 231 tests verts. `npm run build` : exit 0. `git diff --stat -- src/domain` : vide.
- Essais utilisés : 0 échec de critère. Corrections de mon banc en cours de route : base neutre pour l'aller-retour Suggérer, K2 sur toutes les voies (voir doutes).

## Chiffres décisifs
**Substituer** (pool : 318 variétés, sans stock ; vérité : `bm.substituts`, réciproque pour 25 % des paires seulement)
| | rappel@5 | rappel@10 | ≥1 dans les 10 | rang médian du 1er | MRR |
|---|---|---|---|---|---|
| 60′ | 6 % | 10 % | 24 % | 36 | 0,118 |
| 10′ = whirlpool = dry hop | 7 % | 11 % | 26 % | 27 | 0,121 |
| au hasard | 2 % | 3 % | 10 % | 70 | 0,047 |
- Les classements de 10′, whirlpool et dry hop sont **identiques** pour les 217 houblons : il y a deux classements réels (60′ et arôme), seule la dose change.
- Par usage de l'original (10′ et après) : aroma rappel@10 15 %, dual 7 %, bittering 12 % ; à 60′ : 10 %, 9 %, 12 %.
- Le moteur fait ~3 fois le hasard, mais 89 % des substituts de référence sont hors des 10 premiers.
- Paires de référence discutables : usage opposé 66, α à plus du double 68, aucune famille commune 36 (156 sur 697 avec au moins un drapeau). Exemples (§ 2 du rapport) : Dana → Fuggle, Loral → Glacier, Falconer's Flight → Crystal, Bobek → Fuggle, Pekko → Saaz (CZ). Hypothèse non prouvée : la référence suit surtout l'α et la classe de houblon (« amertume seule » bat « arôme seul »).
- Données du #180 : 7 des 10 noms de substituts non reliés se retrouvent par une correspondance indulgente (Tettnang → Tettnanger, East Kent Golding, Magnum, Northern Brewer, Taurus, Whitbread Golding Variety, Saaz (CH)) ; Lubelski, Mount Ranier, Polish Lublin sont absents du catalogue.

**Phares** (verdicts dans le rapport) : Saaz juste ; Simcoe, Idaho 7, Mosaic presque ; Citra, Cascade, Galaxy, Motueka plausibles ou moyens ; **Nelson Sauvin faux** (Boomerang, Herkules, Phoenix en tête ; Hallertau Blanc 155e, Riwaka 206e ; 2 familles décrites, 78 % de mots sans famille).

**Suggérer** (aller-retour, échantillon de 67 variétés, graine 181 : 60 tirés + 7 phares ; base neutre, dry hop actif)
- La liste est **un seul groupe d'ex æquo** (médiane de 1 groupe sur 138 houblons ; le moteur range alors par ordre alphabétique) : X est au rang moyen 51,5, dans les 10 pour 11 variétés sur 67 ; les substituts Beer Maverick ont rappel@10 1 % (au hasard : 4 %) et 54 sur 211 sont absents de la liste (ils ne citent aucune famille visée). Avec le style IPA : 9 groupes, premier groupe de 45 houblons, rappel@10 0 %.
- Cause probable : l'effet d'une famille citée ne dépend pas de la variété (V5.5 : plateau « cité »). Suggérer sépare « cite la famille » de « ne la cite pas » ; il ne classe pas entre houblons.
- Levure : Pomona au lieu d'US-05, écart du rang de X : 0 ; inconnu lu comme zéro : 12 voies sur 670 dans les dix premières.

**5 cas du brasseur** (3 échecs, 2 tenus)
- K1 stout 16D « trop résineuse, plus floral » : ÉCHEC par réserve : 5/5 floraux sans résineux selon les fiches, 0 conflit, mais Columbus passe alors que ses mots sont « dank, cannabis » (hors famille).
- K2 « résineux : la stout le tolère, la lager non » : ÉCHEC : l'échelle du résineux est la même en 16D et en 3B (neutre, bande 0–30, cran 10) ; 102 voies sur 102 hors style dans les deux.
- K3 agrumes IPA/lager : tenu (cran 33,3 contre 10).
- K4 Nelson Sauvin : ÉCHEC (Hallertau Blanc 155e).
- K5 Galaxy n'est pas Saaz : tenu (score 30 de part et d'autre).

**Erreurs par cause** (paires hors des 10 premiers, première cause ; 60′ / arôme) : données manquantes 78 / 77 ; amérisant écarté 108 / 0 ; profil creux (≤ 2 familles, inconnus lus comme zéros) 112 / 142 ; mots sans famille 11 / 17 ; poids de l'amertume 13 / 41 ; levure 0 / 0 (Substituer ne la lit pas) ; non expliqué 291 / 344. Inventaire : 21 variétés sans aucune famille, 91 avec 2 au plus, 65 avec moins de 2 composants d'huile.

## DÉCISION À PRENDRE : quelle option de réglage pour l'étape suivante ?
Toutes mesurées hors ligne contre Beer Maverick (cohérence avec le marché, pas justesse du goût). Coûts : le moteur fait ~2,4 ms par `substitutes()` (mesuré) ; les surcoûts ci-dessous sont estimés, non chronométrés.
1. **Mots sans famille** (cosinus pondéré par la rareté, mélangé à l'arôme, λ = 0,25–0,5, aux moments d'arôme) : MRR 0,116 → 0,177–0,202, rappel@10 11 % → 16–18 %, rang médian 27 → 14–17 ; **Nelson Sauvin : Hallertau Blanc 155e → 2e (λ = 0,25)**. Coût : précalcul des mots une fois par moteur, ~10 produits par candidat, négligeable. Réserve : mêmes pages que la référence.
2. **Poids par moment** : l'optimum de la grille est amertume 0,8 / arôme 0,1 / huiles 0,1 aux deux moments (arôme : MRR 0,111 → 0,190 sur la moitié de contrôle ; 60′ : 0,122 → 0,130). Coût nul. Réserve forte : c'est un alignement sur l'α de Beer Maverick, contraire à l'attente du brasseur sur Nelson Sauvin. Je ne le recommande pas seul ; les gains 1 et 2 ne s'additionnent pas (MRR 0,186 sur contrôle).
3. **`bm.arome`** (radar à 9 axes, 57 % des variétés) : MRR 0,116 → 0,148 (λ = 0,25) ; sur les 138 houblons avec radar 0,148 → 0,198. Moins bon que les mots sur le même sous-ensemble (0,241) et risque de fuite de source ; utile en complément seulement.
4. **IA en re-classement** : protocole écrit au rapport § 7 (20 candidats du moteur, 78 requêtes journalisées, hors `npm test`, à battre : +0,05 de MRR ou +5 points de rappel@10 et Hallertau Blanc dans les 5 premiers de Nelson Sauvin). Aucun appel fait.
5. **Hors réglage mais découvert** : Suggérer est plat (un groupe) et K2 échoue (échelle du résineux identique) : ni les poids ni les mots ne le corrigent ; il faut une intensité par variété (pouvoir aromatique, huiles) dans l'effet d'une famille.
**Recommandation** : 1 d'abord (seule option qui aide Nelson Sauvin), puis évaluer l'IA seulement sur le reste ; garder 2 et 3 en réserve ; traiter 5 dans une étape distincte. Décideur : conseil pour 1 et 5 (convention du moteur, comme l'option C de [[descripteurs-hors-familles]]) ; le brasseur pour l'IA.

## Doutes et limites
- Référence imparfaite : réciprocité 25 %, 22 % des paires avec un drapeau, 50 % des manques « non expliqués » (référence discutable ou vrai écart). Aucun chiffre ici ne dit la justesse pour le brasseur.
- Aller-retour Suggérer : un seul protocole (dry hop actif, au plus 3 familles marquées, base sans houblon) ; mon premier essai en style IPA mélangeait ressemblance et conflits de style, d'où la base neutre en principal ; K2 mesuré d'abord sur les 10 premières voies (biais du classement) puis sur toutes les voies.
- L'attendu de K1 à K5 est écrit par moi d'après ses mots (SPEC-BRASSEUR.md § 1, § 2, § 3) ; il n'a pas été validé par lui. Les seuils de K2 et K3 (25 points, ×2) sont les miens.
- Les verdicts sur les phares sont mon jugement de lecture, pas une mesure ; ils sont figés dans `verdicts.ts` et à relire si le moteur change.
- Poids : grille de 66 jeux appris sur une moitié des houblons (parité de l'id), contrôlés sur l'autre ; le moteur exact confirme la réplique hors ligne (MRR 0,131 et 0,180).
- Temps : ~35 s de calcul, ~45 s de démarrage de vite-node sur ce poste (Windows) : 75 à 90 s au total, sous les 2 minutes sans marge large.
- `SPEC-BRASSEUR.md` n'est pas dans mon Possède : les 5 cas sont dans le rapport et dans `banc-eval.ts` (cas K1 à K5), avec renvoi à ses paragraphes.

CONNAISSANCE : substitutes() n'a que deux classements (60′ et arôme) ; Suggérer ne départage pas les houblons qui citent les mêmes familles (liste en un groupe, ordre alphabétique) ; la référence Beer Maverick de substitution suit l'α plus que l'arôme ; les mots hors famille, mélangés à l'arôme, remontent Hallertau Blanc de la 155e à la 2e place chez Nelson Sauvin. Note à créer par le pilote dans cerveau/metier (sources : resultats/rapport.md).

LEÇON PROPOSÉE : un critère de style mesuré sur les 10 premières voies est biaisé par le classement lui-même (il place en tête celles qui débordent le moins) ; mesurer sur toutes les voies, et vérifier avant que le test sépare au moins un cas connu (rôles : auteur, relecteur).
