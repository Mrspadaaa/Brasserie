# f1 — diagnostic d'affinage : Citra cryo, les coupes, le poids de l'α, le bon critère, l'IA, les formes (26.10)

Mesure seulement : rien dans `src/`, rien dans `tests/`. Scripts neufs (déterministes : deux passes, même sha256, vérifié) :
`scripts/eval-hop/f1-diagnostic.ts` (parties 1, 2), `f1-poids.ts` (3, 4), `f1-ia.ts` (5), `f1-formes.ts` (6), `f1-sonde.ts` (stock). Sorties à côté :
`diagnostic.json`, `poids.json`, `ia.json`, `formes.json` ; `durees.json` (millisecondes, hors empreinte).

**État mesuré.** HEAD `1add85a3` plus le diff en cours de g2d sur `voies.ts` / `minoritaire.ts`. L'ordre au dry hop est mesuré **dans les deux états** :
sans l'option (`apportMinoritaire` absent : l'état d'avant D99) et sous l'option `c` (l'état que d99 rend actif au dry hop). Les chiffres de rang qui
en dépendent portent les deux valeurs. Les fichiers de données (`proto-data.json`, `complements*.json`) ont bougé pendant la voie (317 ou 318 houblons,
204 ou 205 candidats à 60′) : chaque chiffre ci-dessous vient de la dernière passe ; un autre état des données peut décaler un rang de 1.
Recettes : 21C (Nugget 20 g à 60′, Cascade 80 g en dry hop actif), stout 16D (Nugget 46 g à 60′), 20 L, stock des fixtures du prototype (16 articles dont
**Citra cryo, 65 g, α 24,8 % lu sur l'article « Houblon Cryo Hops Citra 24.8% »**).
Note de cadrage : le poids d'amertume de Substituer à 60′ est **0,7** dans le code (`substitution.ts:30`), pas 0,8 comme dans la voie.

---

## 1. D174 — Citra cryo « boosté », Citra simple absent

**Le score ne boost pas le cryo.** Dans Substituer, Citra et Citra cryo ont la **même fiche de variété**, donc les mêmes composantes et le même score :
à 60′ 95 (arôme 97, huile 91, amertume 96), rang 214 tous deux ; au dry hop 58 (21C) et 56 (16D), rang 10 et 14 tous deux. Ce qui diffère : la dose
(10,5 g contre 20,8 g à 60′ : α du lot 24,8 contre 12,5 de la plage variétale ; `doseOf`, `substitution.ts:308`), le stock et la raison de démotion.

Trois chemins font pourtant monter le cryo ou cacher le simple. Chacun a sa cause exacte :

| Écran | Ce qu'on voit | Cause (fichier:ligne) |
|---|---|---|
| **Substituer** (`stockFirst: false`, `donnees.ts:56`) | Au dry hop : Citra cryo est affiché (2e des 3 du stock, rang 10), Citra simple jamais. À 60′ : aucun des deux (rang 214, « chers pour amériser », 94 houblons derrière). | L'écran coupe en **deux listes** : 5 « à acheter » + 3 « du stock » (`donnees.ts:103-105`). Le cryo est le 2e de 8 articles du stock ; Citra simple est le **10e** des 309 à acheter, hors des 5. Même score, même rang : seule la coupe les sépare. |
| **Fiche › Substituts** (« en stock d'abord », `fiches.ts:79,94`) | Citra cryo 1er (16D) ou 2e (21C) des « en stock » au dry hop, rang général 14 ou 10. | `stockFirst` : clés `[conflit, faible, démotion, palier, stock, −score]` (`substitution.ts:418`). Même palier « partiel » (50 à 64) : le stock passe avant le score, donc Citra cryo 58 devant Centennial 64. **`stockFirst` explique ce boost.** Le même chemin existe dans `adaptateur.ts:360` (`remplacants`), qu'aucun écran n'appelle. |
| **Suggérer à 60′** (g2b, `palier60`) | Citra cryo **1er sur 204** (21C) et **1er sur 317** (16D), 3,8 g (+10 IBU) ; Moutere 2e à 5 g. | Clé de rang = [usage, grammes] (`palier.ts:26`). Les grammes viennent de l'α du lot (`voies.ts:495`, `infoPalierDe` l. 343), 24,8 contre 12,5 : la moitié des grammes bat tout le monde. L'usage est celui de la **variété** (Citra : « dual », `purpose`), pas celui du produit : aucune démotion « produit d'arôme, cher pour amériser », que Substituer applique pourtant (`substitution.ts:321-324,415`). |
| **Suggérer (toutes listes)** : Citra simple absent | 0 ligne de Citra simple, ni à 60′, ni au dry hop, ni en défaut, avec le stock des fixtures. | `available` = les **variétés** du stock libre (`voies.ts:238`) ; le pool « à acheter » retire toute variété disponible (`voies.ts:244`, `487` pour 60′, `536` pour le dry hop) et le remplace par la clé du stock (`:253`). Citra est « disponible » par son cryo : Citra simple n'est jamais candidat. **Preuve par contraste** : sans le stock des fixtures et sans plafond, Citra simple est **46e/204 à 60′** (7,5 g) et **53e/155** au dry hop actif ; avec le stock : absent. |

Au dry hop, il n'y a **pas de boost** : même effet (+35 points d'agrumes à 30 g, `additionEffect`), même rang pour les deux (53e sur 155 avant D99 ; **29e** sous l'option `c`). Le moteur
dose le cryo **gramme pour gramme comme un pellet** : un cryo (huile 2 à 6 mL/100 g, α 21 à 28 % chez BSG) est traité comme un T-90. C'est plutôt l'inverse d'un boost (voir partie 6).

**Cause en une phrase** : l'α du lot (24,8 %) fait un rang 1 à 60′ dans Suggérer (aucune démotion de produit), pendant que `available` par variété efface Citra simple, et que
la coupe 5 + 3 (Substituer) ou `stockFirst` (fiche) met le cryo en avant sans le simple.

## 2. D175 — où le pool est coupé avant le classement final

### Substituer (moteur : 317 remplaçants classés ; l'écran en garde 8, l'IA 20)
| Coupe | Retire (21C et 16D, pareil) | Houblons phares coupés |
|---|---|---|
| Écran : 5 « à acheter » + 3 « du stock » (`donnees.ts:103-107`) | **309** de 317 | 60′ : seuls **Nelson Sauvin** et **Idaho 7** visibles ; dry hop : seul **Idaho 7**. Citra, Galaxy, Mosaic, Motueka, Strata, Simcoe, Cascade, Hallertau Blanc : hors écran. |
| Fenêtre de l'IA : 20 premiers (`donnees.ts:47`) | **297** | 60′ : seul **Simcoe** (14e) y est ; dry hop : Citra, Idaho 7, Simcoe (21C), Citra, Idaho 7 (16D). Nelson Sauvin, Galaxy, Mosaic, Motueka, Strata, Cascade, Hallertau Blanc : jamais remontables. |
| Clé « démotion d'amertume » avant le score (60′, `substitution.ts:415-418`) | **94** passent derrière (30 %) | Citra 214e, Mosaic 216e, Strata 219e, Cascade 225e (« houblon aromatique, cher pour amériser »). Règle de brasseur assumée ; sans elle, 4 des 20 premiers changent (Citra 95 ×2, Mosaic 94). |
| Clé « couverture faible » (`:417`) | 15 à 16 derrière | aucun phare. Sans elle, 9 des 20 premiers seraient d'autres (Omega 90, Hallertau Gold 85, Smooth Cone 75 : scores sur trop peu de variables). À garder. |
| Conflit de style (D90) | 0 candidat (21C et 16D, Nugget) | aucun |

Coût de couper plus tard à Substituer : **nul**. L'écran demande déjà les 317 rendus : 3,4 à 3,8 ms (chaud) contre 0,8 ms pour 8 ; 5 ms pour 20. Le cold de la première demande du processus : 1 à 6 ms (note `cout-calcul-moteur`).
(Mon « froid » = moteur neuf mais contexte des fixtures partagé : pas un vrai premier passage.)

### Suggérer (`proposeVoies`, défauts : `maxBuy 6`, `limit 10`, `buyLimit 4`, `perHop 2`, 2 assemblages)
| Coupe | 21C « plus d'agrumes » | 16D « plus floral » | 16D « moins de résineux » |
|---|---|---|---|
| En stock libre (variété retirée du pool « à acheter », `voies.ts:238,244`) | 9 | 9 | 9 |
| Exclus par une famille **marquée** (visée « moins », style indésirable ; D90, `voies.ts:246`) | **111** | 0 | **90** |
| Sans famille visée citée (`requirePlus`) | 51 | 159 | (sans objet : visée « moins ») |
| Pool « à acheter » éligible | 146 | 149 | 218 |
| **`maxBuy 6`** : coupe (tri : familles visées, … puis nom) | **140** | **143** | **212** |
| Voies retenues (`limit`, `buyLimit 4`, `perHop 2`, 2 assemblages ; `voies.ts:438-442`) | 14 sur 733 voies examinées | 14 sur 752 | 11 sur 198 |
| Houblons « ajouter » distincts : défaut → `maxBuy 400` → + limites 2000 → + `perHop` 100 | 8 → 10 → **154** → 155 | 10 → 10 → **155** → 155 | 0 (visée par remplacement) |
| Phares présents dans le défaut | 5 sur 10 (Citra, Nelson, Galaxy, Motueka, Hallertau Blanc : **parce qu'ils sont en stock**) | 5 (Citra, Motueka, Idaho 7, Cascade, Hallertau Blanc) | 0 |
| Phares sans plafond | 9 sur 10 | 6 | — |

- **Le plafond qui coupe le plus n'est pas `maxBuy` mais `buyLimit 4`** : lever `maxBuy` seul ne change presque rien (8 → 10 houblons) ; lever `buyLimit` fait passer de 10 à **154**.
  Hors stock, un houblon n'apparaît que s'il est dans les 6 premiers du tri par familles puis alphabet, puis dans les 4 premières voies « à acheter ».
- **Mosaic et Simcoe** sont « éligibles » en 21C et jamais montrés ; **Strata** est exclu en 21C par `herbal` marqué (famille indésirable de la 21C) et **Simcoe** en 16D « moins de résineux » : deux phares sortis **avant** tout classement.
- **À 60′ (`palier60`)** : 113 exclus (21C) et 91 (16D) par un conflit de famille ; limites par défaut 11 à 13 voies affichées pour 204 à 317 candidats. Dry hop : 13 (21C), 10 (16D floral) pour 155.
- **Coût de couper plus tard** (21C, millisecondes, chaud ; froid entre parenthèses) : défaut **75** (110) ; `maxBuy 400` **125 à 143** (378) ; + limites 2000 **1 450** (1 450) ; tout ouvert **2 900**. Options g2b par défaut : 380 (732) ; g2b tout ouvert : **6 000**.
  Le prix n'est pas le classement (+65 ms chaud à `maxBuy 400`) mais le **profil « après » calculé pour chaque voie gardée** (~4 ms par voie). Classer tout et ne calculer `after` que pour l'affiché ramène « tout ouvert » vers 130 à 200 ms. (Estimation tirée de ces mesures, non codée.)

## 3. Le poids de l'α

Mesuré sur la réplique exacte de la formule (317 × 316 scores contre `substitutes()` : **0 écart** ; contexte d'amertume, sans style ni stock), 317 originaux.

**Substituer à 60′ (actuel : groupes 0,7 · 0,2 · 0,1 ; dans l'amertume α 0,4, β 0,2, cohumulone 0,2, usage 0,2).**
- L'α porte **43 % de la dispersion des scores** (50 % pour les 183 amérisants et doubles usages) ; usage 18 %, cohumulone 13 %, β 11 %, huile 9 %, arôme restant 6 %.
- Si on retire l'α, le **premier change dans 47 % des cas** et **3,5 des 10 premiers** changent (chevauchement 0,65).
- Le classement par l'α seul a un Spearman de 0,67 avec le classement actuel (0,81 chez les amérisants) : « surtout l'α » est vrai à 60′.

**Suggérer à 60′ (palier g2b : usage, puis grammes).** L'α décide **tout** : Spearman position contre α = **−1,00** dans chaque classe d'usage (127 + 77 candidats en 21C, 183 + 134 en 16D). Les 10 premiers ont tous un α de 16 à 18,5 % (21C) ou 17,4 à 20,5 % (16D). Il n'existe **aucune autre clé**.

**Trois jeux proposés (Substituer 60′) :**
| Jeu | Groupes (am. · huile · arôme) ; α · β · cohu · usage | Part de l'α | Ce que ça change à l'écran |
|---|---|---|---|
| actuel | 0,7 · 0,2 · 0,1 ; 0,4 · 0,2 · 0,2 · 0,2 | 43 % | — |
| **J1** α allégé | 0,7 · 0,2 · 0,1 ; 0,15 · 0,25 · 0,3 · 0,3 | **14 %** (cohu 25, usage 32) | 7,9 des 10 premiers restent ; le premier reste le même dans 78 % des cas |
| J2 α, huile, arôme restant | 0,5 · 0,3 · 0,2 ; 0,2 · 0,25 · 0,25 · 0,3 | 14 % (huile 18, arôme 23) | 7,0 sur 10 restent ; premier identique 70 % |
| J3 = J2 + part du style 0,15 | idem + « usage publié par le producteur pour le style de la recette » | — | non jugeable : voir partie 4 (P4) |

**Jugement en deux moitiés** (moitié = parité de l'indice parmi les ids triés ; choix sur l'une, jugement sur l'autre, les deux sens ; ΔMRR au jeu actuel, intervalle à 95 % sur 500 rééchantillonnages) :
- choix sur A → l'actuel ; juge sur B : écart 0.
- choix sur B → J1 ; juge sur A : P1a (Hopsteiner) **−0,008** [−0,040 ; +0,020], P1b **−0,002** [−0,021 ; +0,017], P3 **+0,000** [−0,024 ; +0,020].
- J2 est **moins bon** sur les deux moitiés (composite 0,122 et 0,136 contre 0,149 et 0,142) : à écarter.
- Lecture : **réduire l'α de 43 % à 14 % ne coûte rien de mesurable** sur les références indépendantes (tout est dans l'intervalle de zéro) et **ne gagne rien non plus**. Aucune de ces références ne sait départager « α fort » de « α faible » : la justification de J1 est le principe du brasseur (l'α se règle par la dose), pas un gain de banc.

**Suggérer 60′ : proposition S** (réutiliser le score d'amertume de Substituer contre le houblon d'amertume déjà dans la recette, ici Nugget ; usage d'abord comme aujourd'hui). 21C : **0 des 10 premiers en commun** avec la liste actuelle (Feux-Cœur Français, Trident, Yeoman, Centennial, Magnat… α 9,5 à 15,5 contre 16 à 18,5) ; 16D : 1 sur 10. Les grammes montent (6 à 10 g pour +10 IBU au lieu de 5 à 5,5, selon l'α 9,5 à 15,5 %), ce qui est le sens du principe (la dose absorbe l'α). Limite : sans houblon d'amertume dans la recette, il faut un houblon de référence (décision).

## 4. Un critère de justesse sans artefact

Le banc de `f1-poids.ts`, quatre indicateurs, aucun ne dépend de l'α ni du produit de Beer Maverick :
- **P1 — substituts publiés par d'autres** (nouveau : `src/data/hopSources/` en a déjà). **Hopsteiner « Brewhouse »** (producteur, **par moment** : « Brewhouse » 42 houblons, « Dry Hopping » 29) : 33 originaux, 52 paires résolues ; **Hopslist + Hops Direct** : 74 originaux amérisants ou doubles usages, 181 paires (les listes ne disent pas le moment : seuls les amérisants servent à 60′). Non résolus (noms hors catalogue) : 45, 94 et 13.
  Résultat v2 actuel : MRR 0,07 à 0,15 selon la moitié : **faible**, et c'est un fait à garder (la méthode des producteurs n'est pas la nôtre).
- **P2 — jugements du brasseur** : les 3 premiers de D (option 1 + IA) pour 8 phares ; K4 (Nelson Sauvin → Hallertau Blanc, « sauvignon blanc ») ; K5 (Galaxy n'est pas Saaz). Au dry hop, le moteur v2 range le 1er attendu au rang 1, 7, 2, 1, 8, 1, 4, 1 : **MRR 0,63** ; K4 : Hallertau Blanc **1er** chez Nelson Sauvin ; K5 : Saaz 265e chez Galaxy. **Réserve : D vient de la formule « mots » (option 1) proche de v2** ; un banc qui s'appuie sur D juge v2 sur son propre cousin. Et **au 60′ le brasseur n'a jugé aucune liste**.
- **P3 — Beer Maverick en secondaire, l'α retiré** : le rang du substitut BM parmi les candidats d'**α voisin** (rapport ≤ 1,25), 131 amérisants : MRR 0,23, rappel@10 0,2 à 0,35. L'α ne peut plus faire le rang.
- **P4 — selon le style** : part des 10 premiers dont les styles publiés par les producteurs (`usage.styles`) disent le style de la recette. **Inutilisable aujourd'hui** : les styles ne sont connus que pour **20 % des houblons** ; 21C : 100 % des connus l'indiquent pour tous les jeux ; 16D : 0 % (aucun amérisant n'est donné « stout »). Il manque une source de style : **Beer Analytics « amount used per style »** (CC BY-SA, déjà en collecte par c3h : 22 fiches sur 318).
- Composite pour choisir : moyenne de P1a, P1b, P3. P2 reste un contrôle (phares, K4, K5) : un jeu qui fait perdre K4 ou remonte Saaz chez Galaxy est refusé.

**Ce qu'un test à l'aveugle avec le brasseur apporterait de plus** : 10 houblons, deux listes sans étiquette (moteur ; IA), ordre tiré au sort. Il est le **seul** à juger selon le goût et le style (l'α, la source des produits et le « mot » sont hors de sa vue), à départager moteur et IA (à 60′, rien n'a été jugé), à calibrer le banc (si ses choix corrèlent avec P1/P3, on peut s'y fier ; sinon on les retire) et à fournir le jeu P2 qui manque à 60′. Coût : 10 minutes de lui, une page (artefact neuf), pas d'appel IA neuf (les listes existent : ia1, i2). Condition : choisir 10 houblons de plusieurs rôles (2 amérisants, 4 arômes, 2 doubles usages, 2 « particuliers » comme Lotus ou Nelson Sauvin) et mélanger gauche/droite.

## 5. L'écart avec l'IA (sans appel neuf)

Sur les 8 phares de ia1 (IA 3.8, liste « option 1 », dry hop actif), comparés au moteur v2 actuel :
- **4,0 des 10 premiers seulement sont communs** (de 2 à 5) ; les choix de l'IA sont au **rang médian 19,5** du moteur (de 11 à 38).
- Score moteur moyen des 10 de l'IA : **56,3 contre 60,7** pour ses propres 10 premiers : l'IA prend des houblons que le moteur juge moins proches.
- L'α : l'écart d'α (|ln rapport|) est **plus grand chez l'IA** (0,25 contre 0,20) : elle ne suit pas l'α ; elle garde 43 % d'houblons « arôme » contre 35 %.
- Les mots : l'IA **partage moins de mots de fiche** avec l'original (6,0 contre 6,9). Ses 80 phrases citent des descripteurs précis dans **66** cas (« groseille », « vin blanc », « nectar », « thiol »…), des huiles dans 21, l'α ou la cohumulone dans **5**, l'usage dans 11.
- Essai réel i2 (Flash-Lite, émulateur) : le moteur montre Hallertau Blanc 65, Cashmere 61, Sládek 60, Southern Sublime 58, Trident 58 ; l'IA met Hallertau Blanc 65, **Nectaron 55**, Cashmere 61, **Solero 57**, **Mandarina Bavaria 57** : elle monte des houblons de score plus bas portés par un mot fruité (« nectar »).
- **Sur quoi ils diffèrent le plus** : l'IA lit la **sémantique des descripteurs** (mots fins, thiols, fruit précis) et laisse de côté la structure α / usage / cohumulone ; le moteur v2 donne 75 % de l'arôme aux mots mais 70 % du score à l'amertume et aux huiles à 60′, et une structure d'usage à froid. C'est cohérent avec son mot : « le class IA semble bien mais change pas mal le classement de base ». Plafond connu (ia1) : l'IA ne remonte que ce que la fenêtre de 20 contient (Hallertau Blanc n'y était pas avec le moteur v1).

## 6. Les formes de produit : Cryo, HyperBoost, LupuLN2, Incognito, Spectrum, Lupomax… (« pourquoi pas l'hyperboost ou les autres cryo ? »)

**Constat.** Le catalogue v4 n'a qu'une entrée par variété ; `beermaverick-citra:cryo` n'existe que parce que le stock du brasseur contient « Cryo Hops Citra » (`build-data.mjs` : forme créée **depuis le stock**, `donneesApp.ts:93-112`). Sans stock, aucune forme n'est candidate. Strata HyperBoost (Indie Hops) et deux autres mentions de Cryo restent dans `complements-non-rattachees.json` (3 : Strata Cryo, Strata HyperBoost, « Cryo Pop original blend »). `stockFirst` ne l'explique pas : il ne change rien à l'**existence** d'un cryo, seulement à son rang quand il est en stock (partie 1).

### 6.1 Inventaire (`formes.json` : 84 fiches de forme dans 9 sources ; α publié 61, huile 9, **dose conseillée 0**)
| Forme | Où | Variétés | Publié |
|---|---|---|---|
| **Cryo / LupuLN2** (Yakima Chief) | Brewer's Friend (17 fiches), BSG (7 : Cascade, Citra, Columbus, Krush, Loral, Mosaic, Simcoe), Hopdatabase (1 : « Cryo Pop original blend »), Indie Hops (Strata Cryo) | ~25 | BSG : **α 21 à 28 % (Citra), huile 2 à 6 mL/100 g** (Cascade 11-18 % / 1,5-4 ; Mosaic 18-26 / 1,5-4,5 ; Simcoe 21-28 / 2-5 ; Columbus 23,4 / 2,5) ; Cryo Pop 18-22 % / 2-4 ; Strata Cryo (Indie Hops : « Cryogenic Lupulin Pellets », pas YCH) 22,6-23,9 % / 2,9-3,4 % ; Brewer's Friend : seulement une **moyenne de recettes d'utilisateurs** (12,4 à 26,8 %), pas une analyse |
| **HyperBoost** (Indie Hops) | Indie Hops (Strata HyperBoost) | 1 | **α 15 à 40 % (w/w), huile > 40 % (w/w)** : un extrait enrichi en huile, pas un pellet |
| **Lupomax** (Yakima Valley Hops) | Brewer's Friend (13, moyenne de recettes 13,5 à 20 %), BarthHaas (6) et John I. Haas (1) : seulement la **liste des formes vendues** par variété | ~19 | pas de chiffre propre au produit |
| **Incognito** (BarthHaas) | Brewer's Friend (9 : moyennes 40,6 à 49,1 %), BarthHaas (6), Haas (1) | ~15 | moyennes de recettes seulement |
| **Spectrum** (BarthHaas) | BarthHaas (6 : Azacca, Bru-1, Cascade, Eclipse, Galaxy, Vic Secret), Haas (1) | 6 | liste des formes seulement |
| **Lupuline / poudre** (Lupulin Pellet) | Brewer's Friend (12 produits de lupuline : Hopsteiner Lotus, Sultana, Comet Lupulin, etc.) | 12 | moyennes (5,2 à 24,2 %) |
| **DynaBoost** | aucune fiche | 0 | — |
| Dose conseillée | **aucune des 84 fiches** (recherche par motifs « dose », « g/L », « lb/bbl », « recommended », « usage rate ») | — | — |
Lecture : seuls BSG, Hopdatabase et Indie Hops publient une analyse (α, huile) d'un produit de forme ; tout le reste est une moyenne de recettes ou la simple mention de la forme. Aucune source du dépôt ne donne le facteur de dose cryo contre pellet.

### 6.2 Deux modèles « variété + forme »
- **(a) Les formes en candidats séparés** (comme Citra cryo) : chaque forme est une clé (`citra:cryo`, `strata:hyperboost`…), avec son α, son huile, son prix, **son propre rang**.
  - *Substituer* : la forme est un candidat comme les autres ; la règle « autre forme, même variété » existe déjà (`memeVariete`). Plusieurs lignes presque jumelles (même score) : il faut grouper à l'affichage.
  - *Suggérer* : le pool doit filtrer par **clé** et non par variété (`voies.ts:238,244,487,536`), sinon Citra simple disparaît encore. La démotion « produit d'arôme » doit s'appliquer à 60′ dans `palier.ts`.
  - *D174* : le cryo et le simple sont deux lignes de même score ; Citra simple revient (46e / 53e sans le cryo en tête) ; le cryo ne reste premier que s'il porte ses propres données. Avec ~25 cryo + 15 Incognito + 19 Lupomax : le catalogue passe de 318 à ~380 candidats, dont ~60 jumeaux de score ; les listes de 5 sont **saturées de jumeaux** (« Citra · Citra cryo · Citra Lupomax… »).
- **(b) La forme en option de la variété** (« Citra · pellets / cryo ») : un seul houblon classé ; la forme règle **la dose** (α, huile).
  - *Substituer* : une ligne par variété ; un sélecteur de forme sur la ligne ; la dose suit (10,5 g cryo contre 20,8 g pellets à 60′ ; au dry hop, facteur de masse cryo, à sourcer). Le stock fixe la forme **par défaut** (cryo si seul le cryo est en stock).
  - *Suggérer* : le classement porte sur la variété ; la forme change les grammes et le coût, pas le rang. Le 60′ n'est plus gagné par l'α d'un produit : rang sur la variété (α variétal), dose sur la forme.
  - *D174* : **résolu structurellement** : plus de « Citra cryo contre Citra simple » à classer ; une ligne Citra, à 60′ démotée comme tout houblon aromatique, au dry hop au rang de la variété. Le brasseur voit « pourquoi il n'y a pas l'hyperboost » : la forme apparaît dès qu'une source en publie les données, sans stock. Coût : un champ `forme` sur la fiche, la dose par forme, une UI de sélecteur (écran Ma bière, Suggérer, Substituer).
- **Recommandation : (b)**, avec une table de formes à **peu de lignes sourcées** (cryo, lupuline/Lupomax, extrait HyperBoost : α, huile, facteur de masse) ; (a) seulement pour le stock réel (ce qui existe) tant que (b) n'est pas fait. Le facteur de masse (cryo ≈ moins de masse pour le même arôme) **n'est dans aucune source du dépôt** : on ne l'invente pas.

### 6.3 À collecter (sources publiques, robots.txt respecté) et ce qui reste bloqué
- **Déjà là, à relier** : BSG (Cascade, Citra, Columbus, Krush, Loral, Mosaic, Simcoe en Cryo : α, huile), Indie Hops (Strata Cryo, HyperBoost). Les 3 non-rattachées se résolvent par le nom de variété (« Strata » est dans le catalogue).
- **À collecter** : (1) pages produit **BarthHaas** Incognito, Spectrum et Lupomax (le site est lu : « pas de Disallow sur /hops-and-products/ ») : α et huile du produit, s'ils existent ; (2) **John I. Haas** (pages produit ; conditions : usage privé, aucun reprise sans accord, déjà notées) ; (3) **Hopsteiner** : « Lupulin pellets » (Lotus, Sultana, Comet) ; (4) **Indie Hops** : toutes les formes de Strata ; (5) des **fiches de dosage** : recommandations de dose des fabricants (Yakima Chief, BarthHaas, Indie Hops) si publiées en page publique.
- **Bloqué** : **Yakima Chief** (#186), qui fabrique les Cryo / LupuLN2 : ses fiches (α, huile, facteur de dose recommandé) ne sont pas collectables tant que #186 est bloqué. Brewer's Friend ne donne que des **moyennes de recettes** (à marquer comme telles : « moyenne de recettes d'utilisateurs, pas une analyse »). Un facteur de masse cryo reste **inconnu, jamais 0**.

---

## DÉCISION À PRENDRE : le plan d'affinage

L'ordre proposé suit « on est quand même pas mal, mais manque un peu de fine tune » : peu de changements, mesurés, et réversibles. Coût = estimation d'auteur (jour de travail d'un agent Sonnet + vérification) ; aucun n'est codé ici.

| # | Changement | Pourquoi (mesure) | Coût | Ce qui change à l'écran |
|---|---|---|---|---|
| **A** | **Suggérer : pool « à acheter » par clé, pas par variété ; démotion « produit d'arôme » à 60′ ; rang du palier sur l'α **de la variété** pour une forme produit** (`voies.ts:238,244,487,536`, `infoPalierDe`) | partie 1 : Citra cryo 1er/204 à 60′, Citra simple jamais | 0,5 j + 3 tests ; 0 ms | À 60′ Citra cryo quitte le rang 1 (il retombe parmi les arômes) ; Citra simple apparaît au dry hop (29e/53e) et à 60′ (46e). |
| **B** | **Les coupes** : (B1) classer tout et couper à l'affichage dans Suggérer (`buyLimit 4`, `perHop 2` en limites d'**affichage**, `maxBuy` retiré) ; (B2) Substituer : montrer **8 à acheter + 3 du stock** ou une ligne « autres de même score » ; (B3) D90 : une famille marquée devient un **drapeau** et un malus, plus une exclusion (Strata en 21C, Simcoe en 16D) | partie 2 : 309 de 317 retirés à l'écran ; `buyLimit 4` fait passer de 10 à 154 houblons ; 5 phares sur 10 seulement parce qu'en stock | B1 : 0,5 j, **+65 ms chaud** si `after` calculé à l'affichage (sinon 1,4 s : à ne pas faire) ; B2 : 0,3 j, 0 ms ; B3 : 0,3 j | Plus de houblons hors stock en tête de Suggérer ; les phares reviennent (avec un drapeau rouge si une famille indésirable est marquée) ; Substituer plus long. |
| **C** | **Poids de l'α** : J1 à 60′ dans Substituer (α 0,4 → 0,15 ; β 0,25, cohumulone 0,3, usage 0,3) ; Suggérer 60′ : usage, puis ressemblance au houblon d'amertume de la recette (S), les grammes en information | partie 3 : α 43 % de la dispersion (50 % amérisants) ; Suggérer à 60′ : α décide 100 % ; J1 : zéro perte mesurée (|Δ MRR| ≤ 0,01, intervalles autour de 0) | 0,3 j pour J1 (poids de `PROFILS.amertume` et tests) ; 0,5 j pour S (+ le choix du houblon de référence sans amérisant) | Substituer 60′ : 2 des 10 premiers changent, le premier reste identique dans 78 % des cas ; Suggérer 60′ : la liste change presque entièrement (0 sur 10 en commun en 21C), les doses montent (6 à 10 g pour +10 IBU). |
| **D** | **Banc** : mettre P1 (Hopsteiner, Hopslist, Hops Direct), P3 (BM, α constant) et P2 (jugements du brasseur) dans `scripts/eval-hop/`, sans BM seul ; P4 quand Beer Analytics par style est collecté | partie 4 | 0,5 j (déjà écrit : `f1-poids.ts`) ; P4 : dépend de c3h | rien à l'écran |
| **E** | **Test à l'aveugle** avec le brasseur (10 houblons, moteur contre IA, sans étiquette) | partie 4 et 5 : seul juge du goût et du 60′ | 0,5 j pour la page (artefact neuf) | une page à lui montrer |
| **F** | **Formes** : modèle (b), table de formes sourcée, relier BSG et Indie Hops | partie 6 | 1,5 à 2 j (modèle + sélecteur) ; collecte BarthHaas/Haas/Hopsteiner/Indie : 0,5 j chacune ; Yakima Chief bloqué (#186) | une ligne par variété avec un sélecteur de forme ; HyperBoost et cryo disponibles sans stock |

**Questions à trancher** (la route est la vôtre : pilote, conseil ou brasseur ; goût : lui) :
1. **A est un correctif, pas un choix** : à faire sans lui. **B3** (D90 : drapeau au lieu d'exclusion) touche à la décision D90 : au pilote ou au conseil.
2. **C** : J1 seul, ou J1 + S ? Recommandation : **J1 maintenant** (réversible, mesuré), **S après le test à l'aveugle (E)** : S change presque toute la liste à 60′, il se montre en mini maquettes (règle n° 1 / L24).
3. **F** : (a) ou (b) ? Recommandation : (b), après A. (a) laisse le tri à l'α du produit et sature les listes de jumeaux ; (b) ne change que les grammes.
4. **Ordre** : A, puis B1 et B2, puis C(J1), puis D et E en parallèle, F ensuite.

## Doutes et limites
- Références P1 petites (33 et 74 originaux) : tous les intervalles de J1 contre l'actuel contiennent zéro ; un jeu « aussi bon » n'est pas un jeu « meilleur ». P1 est faible (MRR ≤ 0,15) : ces sources ne partagent pas notre logique.
- D (P2) vient d'une formule proche de v2 (circulaire en partie) ; K4 et K5 sont bien ses mots.
- P4 (style) est vide faute de données (20 %) ; J3 n'est donc pas jugé. Les listes de style des producteurs sont des mots libres, pas une échelle.
- Mes « froid » Substituer et Suggérer partagent le contexte des fixtures : ce ne sont pas des premiers passages absolus. Les temps sont de 3 passes sur un PC sous charge (autres voies actives).
- Les fichiers de données ont changé pendant la voie ; la dernière passe fait foi. `npx vitest run tests/unit/hopIndexV4` : première passe 679/680 (un échec), deuxième 3 échecs différents (`complements.test.ts` déterminisme de fusion, `substituerIA.test.tsx`, `useHopData`) : **aucun fichier de ma voie n'est dans `src/` ni `tests/`** ; ces échecs coïncident avec les fichiers modifiés en parallèle (`complements*.json`, `proto-data.json`, `voies.ts`).
