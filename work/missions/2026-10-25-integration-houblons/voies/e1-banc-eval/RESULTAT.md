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


---

# Suite (avis du conseil sur l'option « mots »)

Ligne : OK — λ jugé sur moitié de contrôle : gain net sur une moitié, douteux sur l'autre ; « hors famille seul » sans gain ; garde « ≥ 2 mots » mesurée ; listes écrites.

## Fichiers
- `scripts/eval-hop/suite-mots.ts`, `rapport-suite.ts` (nouveaux ; le banc d'origine et son `resultats.json` ne bougent pas).
- `resultats/suite-mots.json`, `resultats/suite-mots.md` (tableaux complets avec intervalles), `resultats/listes-lambda.json`.
- Lancement : `npx vite-node scripts/eval-hop/suite-mots.ts -- --sortie=<voie>/resultats` (46 s). Deux passes : sha256 identiques pour les trois fichiers (`suite-mots.json` : efb241f56661a881bf39e296504b7cbe2ba3a8b8df4e183da4961c86620eca23).
- Rien dans `src/domain/hopIndex`. `git diff` montre `src/domain/hopDecision/adviceContentReference.ts` modifié : ce n'est pas moi (autre voie).
- Réplique hors ligne sur des composantes entières : ±1 rang possible pour λ < 1 ; λ = 1 est le moteur lui-même.

## 1. λ choisi sur une moitié, jugé sur l'autre (95 %, 1000 rééchantillons des houblons, graine 181)
Moitié 0 = 109 houblons (parité de l'indice), moitié 1 = 108. Cellule : valeur [intervalle à 95 %].

**Tous les mots** : λ choisi sur la moitié 0 = 0,25 ; sur la moitié 1 = 0.

| λ | moitié 1 : MRR | rappel@10 | rang médian | moitié 0 : MRR | rappel@10 | rang médian |
|---|---|---|---|---|---|---|
| 1 (moteur) | 0,112 [0,079 ; 0,149] | 0,119 [0,077 ; 0,171] | 26,5 [19,5 ; 36] | 0,129 [0,090 ; 0,174] | 0,099 [0,063 ; 0,140] | 27 [19 ; 42] |
| 0,75 | 0,167 [0,119 ; 0,225] | 0,145 [0,097 ; 0,197] | 21,5 [14,5 ; 26,5] | 0,144 [0,104 ; 0,190] | 0,127 [0,086 ; 0,174] | 21 [15 ; 35] |
| 0,5 | 0,195 [0,143 ; 0,258] | 0,171 [0,123 ; 0,223] | 17 [12 ; 21,5] | 0,160 [0,119 ; 0,206] | 0,145 [0,103 ; 0,193] | 17 [11 ; 30] |
| **0,25** | **0,238 [0,181 ; 0,302]** | **0,216 [0,164 ; 0,275]** | **12 [7,5 ; 17]** | 0,166 [0,122 ; 0,211] | 0,134 [0,095 ; 0,180] | 16 [12 ; 29] |
| 0 | 0,252 [0,191 ; 0,319] | 0,232 [0,174 ; 0,296] | 11 [8 ; 15] | 0,163 [0,117 ; 0,214] | 0,121 [0,082 ; 0,162] | 21 [14 ; 27] |

- λ = 0,25 (choisi sur la moitié 0), jugé sur la moitié 1 : écart au moteur MRR +0,072 à +0,183, rappel@10 +0,055 à +0,144, rang médian −24 à −8 : **l'intervalle exclut 0**.
- λ = 0 (choisi sur la moitié 1), jugé sur la moitié 0 : écart MRR −0,017 à +0,085, rappel@10 −0,021 à +0,067 : **l'intervalle contient 0**. Sur cette moitié, λ = 0,5 donne +0,021 à +0,079 en rappel@10 (hors 0) mais MRR −0,002 à +0,065.
- Le gain va dans le même sens sur les deux moitiés, mais il n'est net que sur l'une. Sur les 217 ensemble : MRR +0,054 à +0,121 (λ = 0,25).
- λ = 0 (mots seuls) ne fait pas mieux que 0,25 sur la moitié 0 ; je ne retiens pas λ < 0,25.

**Mots hors famille seulement** (cosinus des seuls mots sans famille) : λ choisi sur la moitié 0 = **1** (aucune valeur < 1 ne bat le moteur), sur la moitié 1 = 0,75. Sur toutes les lignes l'écart au moteur en MRR contient 0 ; à λ ≤ 0,25 le rappel@10 baisse (moitié 1 : −0,073 à −0,004). **Cette variante n'apporte rien de mesurable.** Le gain de « tous les mots » vient des mots rattachables à une famille mais plus fins que les 12 familles (grapefruit, lime, lemon, tropical fruit, mojito…), pas des mots hors famille. Elle remonte quand même Hallertau Blanc (155e → 35e à λ = 0,25) grâce à gooseberry, grapes, sauvignon blanc, white wine : utile pour Nelson Sauvin, sans effet mesurable ailleurs.

## 2. Candidats remontés par un seul mot
- À λ = 0,25 sans garde, 318 houblons pris comme original : 1878 entrants dans les 10 premiers ; **408 (22 %) partagent un seul mot** avec l'original, 15 aucun. Les plus rares : Relax → Michigan Copper (hibiscus), Wurttemberg → Marco Polo (oregano ; 186e chez le moteur), Akoya → TNT Blend (green fruit ; 84e), Gemini → Idaho 7 (black tea), Pahto → Yakima Gold (smooth ; 210e), Gaia → Sylva (hoppy ; 217e).
- « dank » et « cannabis » (hors famille) : 26 entrants, presque tous avec plusieurs mots partagés (Chinook, Summit, Galaxy, Amarillo, Columbus, Strata se rapprochent) ; un seul par « dank » seul (African Queen → Chinook). Ces deux mots portent la dimension « dank » que les 12 familles ne voient pas (cas K1) : ils ne sont pas un artefact de mot unique.
- Gardes à λ = 0,25, moitié 1 :

| garde | entrants à un seul mot | MRR | rappel@10 | rang médian |
|---|---|---|---|---|
| aucune | 408 | 0,238 [0,181 ; 0,302] | 0,216 | 12 |
| ≥ 2 mots partagés (sinon le terme « mots » vaut 0) | **57** | 0,248 [0,191 ; 0,314] | 0,228 | 12 |
| plafond de rareté (un mot compte au moins comme df = 8) | 377 | 0,240 | 0,220 | 12 |
| les deux | **48** | **0,250 [0,192 ; 0,317]** | **0,236** | 10,5 |

  La garde « au moins 2 mots » supprime 86 % des entrants à un mot sans perte (MRR +0,010, dans le bruit). Le plafond de rareté seul est presque sans effet (les mots rares valent déjà idf 4 à 5 ; le plafond les baisse de 15 %). Les 48 à 57 restants montent parce que d'autres candidats redescendent. **Garde proposée : au moins 2 mots partagés.**
- Limite : les mots ne sont pas dédoublonnés entre français et anglais (« fruity » et « fruité », « grape » et « grapes » comptent pour 2) ; la garde peut donc être satisfaite par un doublon de traduction. À régler avant tout code (table de synonymes) ; non mesuré ici.

## 3. Pourquoi Nelson Sauvin, Motueka, Riwaka, Hallertau Blanc bougent (rangs chez Nelson Sauvin, dry hop)
| candidat | λ 1 (moteur) | 0,75 | 0,5 | 0,25 | 0 | mots partagés avec Nelson Sauvin |
|---|---|---|---|---|---|---|
| Hallertau Blanc | 155 | 94 | 40 | **2** | 1 | agrumes, fruité, gooseberry, grapes, sauvignon blanc, white wine, épicé (7 des 13 mots du candidat) |
| Enigma | 244 | 223 | 180 | 92 | 10 | white wine (un seul) |
| Motueka | 89 | 85 | 102 | **130** | 174 | agrumes, fruité (2) |
| Riwaka | 206 | 208 | 210 | 204 | 199 | agrumes, fruité (2) |

- **Hallertau Blanc** : sept mots partagés, dont quatre hors famille (gooseberry, grapes, sauvignon blanc, white wine) ; le cosinus des 12 familles n'était que de 0,53 (il ne voit qu'agrumes et épicé). Son arôme ne passe que de 53 à 58 au λ 0,25 (score 52 → 55) : le saut de rang est surtout **relatif** : les candidats « arôme 90–100 » du moteur, sans mot commun, redescendent. D'où 155 → 94 → 40 → 2 : un seul réglage décide (confirmé).
- **Enigma** : un seul mot partagé (white wine) ; n'entre dans les 10 premiers qu'à λ = 0 : le cas « un mot » que la garde étouffe.
- **Motueka recule** (89 → 130) : son arôme du moteur (67) venait du cosinus des familles (agrumes marqué, comme Nelson Sauvin cite agrumes) ; ses dix mots (citrus, lime, lemon, lemon zest, mojito…) ne recoupent que « agrumes » et « fruité » parmi les neuf mots de Nelson Sauvin ; son arôme tombe à 24 au λ 0,25. Vu par les mots, Motueka n'a pas le vocabulaire vin blanc/groseille ; que ce recul soit juste pour le brasseur est à lui de le dire.
- **Riwaka** reste à 204–210 : mêmes deux mots partagés, arôme de 50 à 25 ; il recule comme tout le monde, donc son rang relatif ne bouge pas. Les mots ne l'aident pas (pamplemousse, citron vert, fruit de la passion, pas de vin blanc) ; la référence le lie sans doute par l'origine et l'α, ce que les mots ne voient pas.
- Conclusion honnête : λ ≥ 0,5 ne fait pas entrer Hallertau Blanc dans les 10 premiers ; seul λ ≤ 0,25 le fait.

## 4. Listes avant/après
`resultats/listes-lambda.json` : 11 houblons (Nelson Sauvin, Motueka, Citra, Galaxy, Saaz (CZ), Mosaic, Simcoe, Cascade, et trois ordinaires : Fuggle, Magnum (US), Willamette), au dry hop. Pour chacun les 10 premiers du moteur, du **réglage retenu** (λ = 0,25, garde ≥ 2 mots + plafond df 8 ; moitié 1 : MRR 0,250 [0,192 ; 0,317] ; moitié 0 : 0,173 [0,126 ; 0,224], écart au moteur −0,001 à +0,089) et d'un réglage **prudent** (λ = 0,5, même garde ; moitié 1 : 0,208 [0,156 ; 0,272] ; moitié 0 : 0,173 [0,129 ; 0,221], écart au moteur +0,011 à +0,077). Chaque candidat : nom, α, usage, score, mots partagés avec l'original ; aucune mention de Beer Maverick.
- Nelson Sauvin, retenu : Herkules, Godiva, **Hallertau Blanc (3e)**, Sládek, Admiral, Cashmere… ; prudent : Herkules, Godiva, Boomerang, Pacific Jade, Phoenix… (Hallertau Blanc hors des 10).
- Motueka, retenu : Cascade, Taiheke, Riwaka, Bravo, Mandarina Bavaria, Southern Cross… (Buzz Bullets et Shaddock sortent).

## DÉCISION À PRENDRE (conseil) : adopter l'option mots, et à quel λ ?
- **Recommandation** : oui, avec réserves. (1) Garde « au moins 2 mots partagés » (perte nulle, 86 % des entrants à un mot supprimés). (2) λ = 0,5 plutôt que 0,25 : l'intervalle de l'écart au moteur est au-dessus de 0 sur les deux moitiés (MRR +0,011 à +0,077 et +0,050 à +0,144 avec la garde) ; λ = 0,25 n'est net que sur la moitié 1. Mais Hallertau Blanc n'entre dans les 10 premiers de Nelson Sauvin qu'à 0,25 : il faut arbitrer entre un gain moyen robuste et le cas Nelson Sauvin du brasseur. (3) Avant tout code : une table de synonymes fr/en, sinon la garde est contournée.
- Ce que cette suite ne montre pas : que le brasseur préfère les listes obtenues. Les listes de `listes-lambda.json` sont à lui montrer (ou au critique calibré). La référence reste Beer Maverick (mêmes pages que les mots : risque de corrélation de source).
- Réponse aux trois points du conseil : (a) « un autre moteur » : à λ = 0,25 le terme mots pèse 75 % de l'arôme ; à 0,5, 50 % ; la variante « hors famille seulement » plus fidèle à l'idée de départ ne donne aucun gain ; (b) λ est maintenant choisi sur une moitié et jugé sur l'autre : résultat asymétrique (net sur l'une, douteux sur l'autre) ; (c) Hallertau Blanc dépend bien d'un seul réglage (155 → 94 → 40 → 2) ; Motueka recule car son vocabulaire (agrumes) recoupe peu celui de Nelson Sauvin ; Riwaka reste là où il est.

CONNAISSANCE : la valeur de l'option « mots » vient des mots rattachables à une famille mais plus fins que les 12 familles ; les mots hors famille seuls n'apportent rien de mesurable (sauf Hallertau Blanc pour Nelson Sauvin). LEÇON PROPOSÉE : aucune.
