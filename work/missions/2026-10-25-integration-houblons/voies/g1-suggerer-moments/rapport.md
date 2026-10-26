# g1 — Suggérer à 60′ comme au dry hop, et l'IA par-dessus : diagnostic chiffré et plan

Date des mesures : 26.10, données d'aujourd'hui (fiches d4 comprises). Rien dans `src/`. Sources des chiffres :
`suggerer-moments.json` (sha256 `c8e19c6c…cbf0`, identique sur deux passes) et `suggerer-60.json` (sha256 `b8b8252c…0354`, idem), produits par
`scripts/eval-hop/suggerer-moments.ts` et `suggerer-60.ts`. Lancement : `npx vite-node scripts/eval-hop/<script>.ts -- --sortie=<dossier>`.

**Recettes mesurées** (mon choix, faute de « recette type » écrite dans la voie ; ce sont des fixtures du dépôt) :
- 21C « Hazy du jeudi » (`tests/unit/hopIndexV4/demandeReelle.test.tsx`) : 20 L, OG 1,058, US-05, Nugget 20 g à 60′, Cascade 80 g en dry hop actif ; IBU 27,9.
- Stout 16D de e1 : 20 L, OG 1,066, US-05, Nugget 46 g à 60′ ; IBU 59,7.
- Trois visées : « plus d'agrumes » (`citrus +1`), « plus d'amertume » (direction vide : voir § 1.1), « moins de résineux » (`resin −1`).

## 1. Diagnostic

### 1.1 À quels moments Suggérer propose-t-il, et qui choisit le moment ?
- **En dur, dans le moteur.** `proposeVoies` (`voies.ts` l. 145) prend `moments = ['b10','wp','dryActive','dryPost']` par défaut. L'adaptateur
  (`parcours/adaptateur.ts` : `proposer` l. 281, `leviersLevure` l. 295) ne passe jamais `moments`. Ni l'écran, ni la visée ne le choisissent.
- **Aucun ajout à 60′.** `b60` n'est pas dans la liste. Le seul 60′ de l'écran : modifier un ajout de la recette qui est déjà à 60′ (« Remplacer Nugget par X à IBU égal »,
  « Diminuer Nugget », « Retirer »). Sur la 21C, « plus d'agrumes » : 14 voies à l'écran = 7 « Ajouter · 10′ », 4 « Ajouter · whirlpool », 1 assemblage 10′, 2 « Remplacer Nugget · 60′ » ;
  **aucune au dry hop** parmi ces 14 (plafond du moteur : 10 du stock, 4 à acheter, 2 par houblon).
- **Le dry hop passe par un autre chemin** : `leviersLevure` rend **une seule** voie « houblonner à froid en fermentation active » (la meilleure du stock sans conflit,
  `voies.ts` l. 376) ; l'écran prévoit `dryhopMax = 4` et n'en reçoit qu'une. 21C : Galaxy 40 g. Stout : Target 5 g (la stout n'a pas de dry hop à réduire).
- **Un amérisant pour une IBU visée : non.** `Direction` ne porte que des familles. Avec une direction vide (« plus d'amertume »), `proposeVoies` rend **0 voie** (21C : 37 voies
  examinées, 0 retenue ; stout : 20 examinées, 0). L'IBU n'est qu'une dérive affichée (`ibu.drift`) et un critère de rang en dernier. `gramsForIbu` existe (il sert à « remplacer à IBU égal ») mais
  personne ne l'appelle pour un ajout.
- **Qui gagne le moment** : la dose est cherchée sur la grille de doses du moment (g/L) pour que l'effet tombe près du cran visé ; le moment dont l'effet est le plus proche l'emporte
  (21C, agrumes : 10′ à 40 g, distance 0,012 ; whirlpool 0,063 ; dry hop 0,087). Le moment est un effet de bord de la dose, pas un choix du brasseur.
- **Dans q2b, le brasseur peut-il choisir le moment ?** Vue Barres : non, le moment est une étiquette de groupe. Vue Radar : un « ‹ 10′ › » par voie, à chaud seulement (moût, 60′ à 0′ par 5′,
  whirlpool) ; le dry hop n'y est pas décalable. Un ajout à 10′ devient « 60′ » en dix touchers, et l'effet affiché tombe alors à presque rien (§ 1.2).

### 1.2 Que rend-il à 60′ et au dry hop ? (chaque moment examiné seul, tout le pool de 318 variétés)
Ajouts uniquement ; « groupes » = rangs distincts, « 1er groupe » = nombre de houblons au rang 1.

| recette · visée | moment | ajouts | effet de la famille visée | groupes | 1er groupe | tête de liste |
|---|---|---|---|---|---|---|
| 21C · agrumes | 60′ | 93 | **+2,4** pt, identique pour les 93 | 80 | 1 | Monroe, Medusa, Multihead, Shaddock, Yellow Sub : classés par la dérive d'IBU, 40 g chacun |
| 21C · agrumes | 10′ | 93 | +34,5 | 77 | 1 | Monroe, Medusa, … (même ordre) |
| 21C · agrumes | dry hop actif | 93 | +42 | **4** | **23** | African Queen, Belma, Galaxy, Herald, Huell Melon : **ordre alphabétique** |
| stout · agrumes | 60′ | 233 | +2,4 à 40 g, +1,6 à 20 g, identique d'un houblon à l'autre | 199 | 1 | Strisselspalt, Grungeist, Monroe (40 g), puis Diamond Springs, Shaddock (20 g) : dérive d'IBU |
| stout · agrumes | dry hop actif | 233 | +42 à 40 g, identique | **22** | **8** | Arcadian, Buzz Bullets, Diamond Springs, Herald, Satus : **alphabétique** |
| 21C ou stout · amertume | tous | **0** | — | 0 | 0 | rien |
| 21C · moins de résineux | 60′ | 0 ajout ; 3 « diminuer », 98 « remplacer à IBU égal », 98 « remplacer à masse égale », 2 « retirer » | −1,6 à −2,6 sur toutes les familles de Nugget | — | — | « Diminuer Nugget 20 → 17,9 g » (−0,1 partout), puis Remplacer Nugget par Monroe **96 g** |
| stout · moins de résineux | 60′ | 0 ajout ; 2 « diminuer », 184 « remplacer à IBU égal », 1 « retirer » | idem | 94 sur les 184 remplacements | 6 | Remplacer Nugget par Galaxy 35 g, Boadicea 68 g, Motueka 74 g, East Kent Goldings 109 g |

À lire :
- **À 60′ les ajouts ne servent pas une visée de famille.** L'effet d'une famille est de +1,6 point à 1 g/L à 60′, contre +34,5 à 2 g/L à 10′ et +55,6 à 4 g/L au dry hop (mesure B, une seule valeur par moment pour les 233 houblons qui citent l'agrume).
  Le moteur garde ces 93 voies (« mouvement établi ») et les range par dérive d'IBU : c'est un classement d'amérisants déguisé en classement d'agrumes. Ce n'est pas la question du brasseur à 60′, qui est l'IBU.
- **Au dry hop, la liste est un groupe d'ex æquo rangé par ordre alphabétique** (premier groupe : 23 houblons sur la 21C, 8 sur la stout). Le moment où l'effet est le plus utile est celui où le moteur ne départage pas.
- **« Remplacer à IBU égal » à 60′ ne regarde pas l'usage du houblon** : Monroe (2,7 % d'α, arôme) en 96 g, Aurum en 130 g, Galaxy à 60′ (35 g dans la stout) sont proposés devant des amérisants. Sur la stout, 47 des 159 remplacements « agrumes » dépassent 5 g/L ;
  sur la 21C « moins de résineux », un remplacement demande 10,6 g/L.
- **La visée « moins de résineux » n'a de voie qu'en retirant ou remplaçant ce qui existe** : normal, mais à 60′ comme au dry hop. Au dry hop de la 21C : « diminuer » (1), « remplacer à masse égale » (2), « retirer » (1).
- **L'effet d'une famille citée ne dépend pas de la variété** (mesure B, dose fixe par moment : 1 g/L à 60′, 2 à 10′, 3 whirlpool, 4 dry hop) : une seule valeur par moment et par famille pour les 233 (agrumes), 123 (tropical),
  154 (floral), 134 (résineux) houblons qui la citent. Les barres de q2b ne peuvent donc pas distinguer deux houblons qui citent les mêmes familles ; elles distinguent **combien de familles** le houblon cite (d'où les 4 à 22 groupes).

### 1.3 Le banc d'aller-retour de e1, rejoué (échantillon 66, graine 181 ; base neutre ; visée = les familles marquées de X)
| | e1 (avant d4) | aujourd'hui, dry hop | aujourd'hui, 60′ |
|---|---|---|---|
| houblons évalués | 67 | 66 | 66 |
| taille médiane de la liste | 138 | 252,5 | 252,5 |
| **groupes d'ex æquo, médiane** | **1** | **5** | 174,5 |
| **taille du premier groupe, médiane** | 102 | **53** | 1 |
| X dans les 10 premiers | 11 sur 67 | **4 sur 66** | 17 sur 66 |
| rappel@10 des substituts Beer Maverick | 0,9 % | 1,1 % | 19,5 % |
| substituts absents de la liste | 54 sur 211 | 13 sur 210 | 13 sur 210 |

- **Le groupe d'ex æquo est toujours là.** Il est un peu plus fin (5 groupes au lieu d'1) parce que d4 a fait citer plus de familles à plus de houblons ; mais le premier groupe médian compte encore 53 houblons, et le rang moyen de X reste au milieu de la liste.
  Le rappel@10 (1 %) est celui du hasard ou en dessous.
- **Le chiffre de 60′ (19,5 %) est un artefact, à ne pas créditer.** À 60′ l'ordre ne vient plus des familles (effet identique pour tous) mais de la dérive d'IBU de la meilleure dose : il range les houblons par leur α. Beer Maverick lie surtout des houblons d'α proche (e1, § 2),
  donc la référence récompense l'α, pas un bon classement de Suggérer. Ce banc ne mesure pas Suggérer à 60′ : il faut un autre critère (§ 2).

### 1.4 Ce qui pourrait départager (mesure D, catalogue de 318 variétés)
Fiches : α 318, usage 318, β 311, cohumulone 287, huile totale 301, au moins 2 composants d'huile 253, linalol Hopsteiner 64, classe « thiol impact » 59, mots des sources 302, radar Beer Maverick 181.
Le moteur « pouvoir aromatique » (`pouvoir.ts`, rapport au seuil par composé) n'a des données que pour **8 clés** (Citra, Cascade, Galaxy, Idaho 7, Motueka, Nelson Sauvin, Nugget, Citra cryo) : il ne peut pas servir au classement des 318.
Parmi les houblons qui citent l'agrume (233), le nombre de valeurs distinctes de chaque clé candidate (aujourd'hui : 1 groupe) :
| clé | agrumes (233) | tropical (123) | résineux (134) | floral (154) |
|---|---|---|---|---|
| fiche « marquée » (oui/non) | 2 | 2 | 2 | 2 |
| part des fiches qui la citent (sur celles lues) | 17 | 22 | 19 | 20 |
| huile totale (houblons sans valeur : 10, 4, 4, 4) | 68 | 52 | 60 | 57 |
| cascade marqué → premier descripteur → part → huile | **179** | **107** | **123** | **136** |
- **L'huile totale seule est un mauvais proxy de l'agrume** : en tête des agrumes par la cascade, on trouve Styrian Dragon, Altus, Styrian Cardinal, Sorachi Ace, Ekuanot ; Altus est aussi en tête du résineux. Une intensité utile se lit **par famille** (linalol, géraniol pour l'agrume et le floral ; myrcène pour le résineux ; thiols pour le tropical),
  pas par la quantité d'huile. Couverture : linalol 64 variétés, thiols 59 : insuffisant seul. Le brasseur doit voir les listes (§ 2a).
- **À 60′** : pour +10 IBU, la dose va de 0,23 à 3,9 g/L (21C ; médiane 0,52 ; 10 % à 0,31, 90 % à 1,09) ; par usage (médiane en g/L) : amérisant 0,39, double 0,44, arôme 0,78. De 4,5 g (Polaris, 20,5 % d'α) à 77,6 g (Teamaker, 1,2 %). Aucune dose > 5 g/L : l'écart est surtout de masse,
  donc de coût et de volume de trempe, pas de faisabilité. α, usage, cohumulone (287), β (311) sont lus par le moteur v2 de Substituer (e2) : une partie de la formule existe.

## 2. Plan (à décider ; coûts en voies d'agent et en tours, estimés, non mesurés)

Ordre : (a1) → (a2) et (b) en parallèle → (c). L'IA reclasse les **20 premiers du moteur** : tant que ces 20 sont les 20 premiers d'un groupe d'ex æquo alphabétique (A à H), elle ne peut pas retrouver ce que le moteur n'a pas mis dans la fenêtre (l'essai ia1 : Hallertau Blanc 155e hors des 20, plafond MRR 0,333).

### (a) Le moteur
- **a1 — départager au dry hop et à chaud (arôme).** Une clé de rang de plus, **après la distance et avant les effets de bord**, jamais une nouvelle grandeur sur les barres : l'effet affiché de q2b ne change pas, seul l'ordre à l'intérieur d'un groupe d'ex æquo.
  Candidate : fiche marquée, premier descripteur, part des fiches, puis un signal par famille (linalol/géraniol pour agrumes et floral, myrcène pour résineux, thiols pour tropical) quand il existe, sinon l'huile totale ; **l'inconnu passe après le connu, jamais à 0** (règle d'honnêteté).
  Rejouable : même sortie JSON, groupes d'ex æquo (cible : premier groupe ≤ 10 sur la médiane des 66), et une page de **10 listes à lui montrer** (Citra, Galaxy, Cascade pour « plus d'agrumes » à 21C ; leçon L14 : les confronter à la réputation). Beer Maverick ne juge pas Suggérer (§ 1.3).
  Coût : 1 voie Sonnet, 60 à 80 tours (`voies.ts`, clé dans `compareRankKeys`, empreinte `moteurInchange.test.ts`, tests) ; mesures et page de listes : 1 voie Haiku/Sonnet, 30 tours. Décideur : conseil pour la clé (convention du moteur, comme l'option C de [[descripteurs-hors-familles]]), brasseur pour les listes.
  Alternative écartée par défaut : mettre à l'échelle l'effet par variété. Elle change les barres et la lecture d'un « +34 », et `pouvoir.ts` interdit de présenter une intensité 0–100.
- **a2 — un jeu à 60′ pour « plus d'amertume ».** (1) Un objectif d'IBU dans la direction (+n IBU ou IBU cible), seul cas où l'objet visé n'est pas une famille. (2) `moments` de la requête : `b60` (puis b30, b15, fwh) pour les ajouts d'amertume, la dose cherchée par `gramsForIbu` : exacte, pas sur grille.
  (3) Rang à 60′, dans l'ordre d'une proposition à valider : conflit de famille (résineux cité quand « moins de résineux »), dépassement de la bande d'IBU du style, usage (amérisant et double avant arôme : un arôme à 60′ perd son arôme), puis α (moins de grammes), cohumulone (287/318) et β (311/318).
  **Ce qui rend une amertume « meilleure » (cohumulone basse, β) n'est pas établi dans le dépôt ; ce sont des conventions de brasseur : le brasseur ou le conseil les fixent, avec des sources.** Le banc e2 dit seulement que β, cohumulone et usage servent contre Beer Maverick à 60′, pas qu'ils servent le goût.
  (4) Corriger le défaut vu au § 1.2 : « remplacer à IBU égal » propose un houblon d'arôme (usage `aroma`) à 60′ en 96 ou 130 g devant des amérisants ; l'usage devient une clé de rang à 60′ aussi pour le remplacement.
  Coût : 1 voie Sonnet, 80 à 100 tours (le moteur, `Direction`, `adaptateur.proposer`, tests, empreinte) ; elle touche `src/domain` : revue Sonnet.
- **a3 — banc de Suggérer à 60′** (`scripts/eval-hop/`, nouveau) : critères écrits : (i) pour une IBU visée, la dose rend l'IBU à ± 0,5 ; (ii) aucun houblon d'arôme avant un amérisant à IBU égal sauf visée de famille ; (iii) listes à lui montrer. 1 voie Haiku, 25 tours.

### (b) L'écran : le brasseur choisit 60′ ou dry hop dans q2b
- **q2b ne le permet pas aujourd'hui.** Barres : le moment est une étiquette de groupe (« 10′ », « whirlpool », « actif », « 60′ » sous « Remplacer Nugget »). Radar : un décalage par voie, à chaud, dix touchers du 10′ au 60′, et rien au dry hop.
  Les trois cartes d'objectif sont des familles ; aucune carte d'amertume.
- **Variantes à lui montrer, en mini maquettes dans un artefact neuf, sur la capture de q2b (la maquette choisie reste la base, rien ne la remplace) :**
  - **M1 — un groupe « Amérisant · 60′ » à côté de « Dry hop · actif »** : q2b range déjà ses voies en gestes ; 60′ devient un geste, comme le dry hop. Rien n'est ajouté au premier plan, le décalage du Radar reste.
  - **M2 — une quatrième carte d'objectif « Plus d'amertume · +n IBU »**, dans la forme des trois cartes (verdict, piste, IBU avant → après), qui appelle a2 et ouvre les groupes 60′.
  - **M3 — trois puces « Quand ? 60′ · 10′ et whirlpool · dry hop »** sous les cartes, qui filtrent les groupes ; la liste de départ montre les trois (pas un filtre posé d'office). Plus lourd que M1 et M2 : à lui montrer comme contraste, au sens de [[outils-houblons]] (un facteur libre par écran : ici le moment).
  - Ma recommandation : M1 + M2 ensemble (M2 donne la visée, M1 la place) ; M3 seulement si M1 ne suffit pas à lire « 60′ et dry hop à égalité ».
- **L'IA dans q2b** (c) ajoute une puce à un écran qu'il a choisi : à montrer aussi (mini maquette de la puce « classé par l'IA » sur q2b, repris de Substituer s'il la valide).
- Coût : concepteur Opus 1 voie (3 variantes sur 2 recettes, états inclus), 40 à 60 tours ; critique Fable 1 voie ; port Sonnet 1 voie, 60 à 80 tours, avec `controle-choix.mjs`, `controle-etats.mjs --ecran=suggerer` et les états de e3.

### (c) L'IA : le même callable que Substituer, en mode « suggestion »
- Base : `hopReclasserIA` (voie i2, en cours), Flash-Lite : p95 2,8 s, ~0,003 CHF par appel (ia1). Ajouter un mode `suggestion` : entrée = recette (style, ajouts avec moment et dose), visée (familles ± crans, ou IBU visée), moment (60′ ou dry hop), **20 premiers du moteur** avec leurs fiches courtes (mots, α, usage, huiles, familles citées) ;
  sortie = l'ordre des 10 premiers et une phrase par choix ; réponse invalide refusée, jamais un ordre inventé ; hors ligne : l'ordre du moteur. Mêmes garde-fous (auth, budget du compagnon). Les scores et les barres restent ceux du moteur.
- **Ne passe qu'après a1** : à 60′ comme au dry hop, elle verrait sinon 20 houblons alphabétiques (A à H). Elle aide surtout où les données manquent (« moins de résineux » : dank, cannabis, hors familles ; cas K1 de e1).
- Essai réel : ≤ 30 appels Flash-Lite (~0,1 CHF) sur les 10 listes de a1 et 5 listes à 60′, sous une nouvelle enveloppe (celle d'ia1 est à 100/100), journalisés, hors `npm test`. Le brasseur juge, pas Beer Maverick.
- **L'accord de D80 vise « cet usage » (Substituer).** Suggérer est un nouvel usage facturé : à confirmer par lui avant l'essai réel et avant la production (mêmes 0,003 CHF par recherche). Ses mots du 26.10 (« elle peut aussi être présente pour la suggestion ») vont dans le sens du oui, sans valoir accord chiffré.
- Coût : 1 voie Sonnet, 40 à 60 tours, après i2 et a1 ; l'essai : 1 voie Haiku.

## 3. Limites
- « Recette type » : mon choix (21C du test a2 et stout de e1). Les chiffres de § 1.1 (écran) utilisent le stock des fixtures ; ceux de § 1.2 et 1.3 n'ont aucun stock (pool de 318).
- La visée de § 1.3 est celle de e1 (les familles marquées de X) ; la référence Beer Maverick mesure une ressemblance, pas un bon choix de brasseur.
- Les clés de § 1.4 sont une mesure de pouvoir de séparation, pas une formule recommandée ; l'huile totale seule est jugée mauvaise sur les listes (Altus à la fois en tête d'agrumes et de résineux).
- Les coûts en tours sont des estimations d'après les voies voisines (e2, ia1, t4), non chronométrées. Temps des scripts : 140 s pour `suggerer-moments.ts`, 50 s pour `suggerer-60.ts` (dont ~45 s de démarrage de vite-node).
