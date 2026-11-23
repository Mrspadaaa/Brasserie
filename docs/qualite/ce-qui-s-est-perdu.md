# Ce qui s'est perdu — houblons (#116)

Phase 2 de la mission #119, 17.10.2026. Question : qu'est-ce que les versions
V1 à V5.5 savaient faire, que l'app actuelle ne fait plus ? Réponses jouées en
rendu, captures regardées, contre la [banque de questions](../besoins/banque-de-questions.md).

## En bref

- **Aucune version n'a jamais répondu à la demande principale** : « tous mes
  houblons classés pour ma stout, stock d'abord » (Q01) et « en un toucher, sans
  défiler » (Q03). Ce qui manque n'est donc pas perdu : c'est à construire.
- **Trois choses utiles ont disparu en route** : le panneau « Comparer et simuler
  les houblons » du créateur de recette (retiré le 16.10, test réécrit pour acter
  le retrait), la comparaison côte à côte des maquettes V5.5, et le stock
  « libre / besoin / couvert » affiché sur chaque ajout (V2, V3).
- **Toutes les maquettes tournaient sur des données inventées** (9 à 22 houblons,
  « valeurs simulées »). Aucune ne chargeait le catalogue de 318 variétés ni un
  stock réel.
- Les réponses les plus complètes (V5.5) étaient **noyées** : 780 mots pour la
  question « stout au Nugget », liste à comparer à 1 664 px sous le haut de l'écran.
- L'app actuelle, avec le stock réel de production, ne montre **aucun houblon du
  stock** en 0 ou 1 toucher, sur les 18 commandes possibles de l'étape.

## Méthode

- **Galerie** : `houblons-v5-realisation-2026-09-29`, 153 écrans servis en lecture
  seule (port 5182). 18 écrans représentatifs retenus : la dernière variante de
  chaque direction de chaque génération. Captures automatiques à 390 × 844 et
  1280 × 800 (`work/refonte-frontend/outils/capture-versions.mjs`).
- **Inventaire du code des maquettes** : agent Haiku, lecture des scripts de
  chaque écran, statut par question avec preuve fichier:ligne
  (`work/refonte-frontend/phase2/versions-inventaire.md`).
- **Vérification Opus en rendu** : cas stout joué dans la dernière V5.5
  (Explorer, comparaison de 2 houblons, question « Nugget »), Q05 joué dans
  V5.5, Q24 joué dans V2-1. Toutes les cellules « R » des questions Q01 à Q05
  sont vérifiées en rendu.
- **App actuelle** : banc QA local (vraie interface, données isolées), recette
  neuve « Stout », étape Houblons, à 390 × 844 et 1280 × 800 ; stock d'exemple
  (phase 1) puis stock réel de production (`scripts/check-hop-one-tap.mjs`).
- **Agrégation** : une colonne par génération ; la cellule prend le meilleur
  statut de ses variantes. La colonne App reprend l'état mesuré dans la banque.

Codes : **R** répond (la réponse s'affiche, même sur données de démonstration),
**P** partiel (une partie de la réponse, ou une idée de démonstration sans
réponse), **A** absent.

## Matrice question × version

| Question | V1 | V2 | V3 | V4 | V5-C1 | V5-C2 | V5-C3 | V5.5 | App |
|---|---|---|---|---|---|---|---|---|---|
| Q01 Stout : mes houblons classés, stock d'abord | P | A | P | A | P | P | P | P | A |
| Q02 Comparer 2 à 4 houblons côte à côte | P | P | P | P | P | P | P | P | P |
| Q03 Un toucher, sans défiler : mon houblon et mon stock | P | P | P | P | P | P | P | P | A |
| Q04 Stout au Nugget : trop résineuse ? | A | A | A | A | P | P | P | P | A |
| Q05 Saaz remplacé par Styrian Golding | P | P | P | P | P | P | P | R | P |
| Q06 Houblon indisponible : remplaçants | A | A | P | P | P | P | P | P | P |
| Q07 Forte amertume sans sapin ni résine | P | P | P | P | P | P | P | P | A |
| Q08 Blanche tropicale et banane | A | A | A | A | P | P | P | P | A |
| Q09 Lager juicy, non amère | A | A | A | A | P | P | P | P | A |
| Q10 Pastry stout trop sucrée | A | A | A | A | P | P | P | P | A |
| Q11 Champagne florale, biotransformation | A | P | P | A | P | P | P | P | P |
| Q12 Blanche : dry hop, 20 g de moins | P | P | P | P | P | P | P | P | P |
| Q13 Houblon et levure pour une NEIPA | A | P | A | A | P | P | P | P | P |
| Q14 Cryo et HyperBoost | A | A | P | P | P | P | P | R | P |
| Q15 IBU total, dry hop compris | P | P | P | P | P | P | P | P | P |
| Q16 Profil d'un houblon | P | P | P | P | P | P | P | R | P |
| Q17 IBU et arôme par ajout | P | P | P | P | P | P | P | P | P |
| Q18 Remplacer X par Y à IBU égal | P | P | P | P | P | P | P | R | P |
| Q19 Houblon × moment × levure | A | P | A | A | P | P | P | P | P |
| Q20 Simuler tous les ajouts | P | P | P | P | P | P | P | P | P |
| Q21 Houblons pour n'importe quel style | A | A | A | A | A | A | A | A | A |
| Q22 Stout très amère et chocolatée | A | A | A | A | A | A | A | P | A |
| Q23 Houblons pour une IPA | A | A | A | A | A | A | A | P | P |
| Q24 Assez de stock pour la dose ? | P | R | R | P | P | P | P | P | P |
| Q25 Ajout à +30 au lieu de +60 | P | P | P | P | P | P | P | P | P |
| Q26 Goût raté : que faire | A | A | P | A | P | P | P | P | A |
| Q27 NOLO | A | A | A | A | P | P | P | P | A |
| Q28 Sour et culture acidifiante | A | A | A | A | P | P | P | P | A |
| Q29 Houblon maison ou sans analyse | P | A | P | P | P | P | P | P | A |
| Q30 Où acheter en Suisse | A | A | A | A | A | A | A | A | A |

| Version | R | P | A |
|---|---|---|---|
| V1 | 0 | 14 | 16 |
| V2 | 1 | 14 | 15 |
| V3 | 1 | 17 | 12 |
| V4 | 0 | 15 | 15 |
| V5-C1 | 0 | 26 | 4 |
| V5-C2 | 0 | 26 | 4 |
| V5-C3 | 0 | 26 | 4 |
| V5.5 | 4 | 24 | 2 |
| App | 0 | 16 | 14 |

**Lecture.**
- Les 4 « R » de V5.5 (Q05, Q14, Q16, Q18) tournent sur des données simulées.
  Q05, joué : gains « floral +2,9, épice +2,4, herbe +2,2 », dose à alpha égal
  41,63 g, IBU 0 → 21. La réponse occupe 785 mots, avec « Ce que j'ai compris »,
  « deux conventions » et la chimie des lots avant toute action.
- Les « P » de V5 et V5.5 sur Q04, Q08, Q09, Q10, Q27 et Q28 viennent surtout
  des **exemples de questions** proposés par bière : la question existe à
  l'écran, la réponse est un long texte de démonstration.
- Q21 et Q30 n'ont jamais été traitées. Q01 non plus : la stout n'existe que comme
  bière de démonstration (« Stout sèche », « Pastry stout »), sans classement
  par style.
- Le statut « P » de V1 à V4 sur Q03 signifie « mobile d'abord, mais pas en un
  toucher » : aucune génération ne montre le stock classé sans défiler.

## Captures regardées

Captures à 390 × 844 sauf mention. Chaque ligne dit ce que la capture montre.

| Colonne | Capture | Ce que je vois |
|---|---|---|
| V1 | [V1-A](captures/versions/V1-A-390.png), [V1-B](captures/versions/V1-B-390.png) | Pale ale d'atelier : barre « 21,8 IBU à chaud, cible 30, écart −8,2 », ajouts réglables ; V1-B propose « Viser un total d'IBU » et « Remplacer un houblon ». Aucun stock classé, aucune stout. |
| V2 | [V2-1](captures/versions/V2-1-390.png) | Méthode rédigée en phrases (« Au premier moût, ajouter 12 g de Saaz ») ; le stock de chaque ajout s'affiche plus bas (« libre 40 g, besoin 12 g, couvert »). Page de 6 100 px de haut. |
| V3 | [V3](captures/versions/V3-390.png) | Comptoir : chaque houblon de la recette avec jauge « besoin 20 g, libre 250 g » et « manque 6 g » en rouge ; onglets Comptoir, Partition, Équilibre. Recette fixe « Blonde florale ». |
| V4 | [V4](captures/versions/V4-390.png) | Recette par moments (chaud, whirlpool, froid) avec doses en g et en g/L, besoin et libre sous chaque ligne ; barre basse « Chercher une voie ». Pas de liste de houblons à choisir. |
| V5-C1 | [V5-C1](captures/versions/V5-C1-390.png) | « Brassin vivant » : bandeau IBU et juicy, onglets « Ma bière » et « Matières & comparaison », profil du verre en barres (agrumes 8,4, tropical 8,7). Panneau clair, police à empattements. |
| V5-C2 | [V5-C2](captures/versions/V5-C2-390.png) | « Territoire des possibles » : champ « Ta question », boutons « Lire ma question », « Nuancier », « Explorer les matières » ; aucune matière visible au premier écran. |
| V5-C3 | [V5-C3](captures/versions/V5-C3-390.png) | « Le verre d'abord » : étapes « Ce que tu veux changer », « Ta demande, ligne par ligne », long texte d'explication ; aucune matière visible. |
| V5.5 | [premier écran](captures/versions/V55-derniere-390.png), [Explorer stout](captures/versions/v55-stout-explorer-390.png), [comparaison](captures/versions/v55-stout-comparaison-390.png), [réponse Nugget](captures/versions/v55-stout-nugget-390.png) | Premier écran : « Ta question » et 4 exemples. Explorer sur la stout : 7 menus déroulants puis une carte en compas ; la liste « + comparer » commence à 1 664 px. Comparaison Nugget et Tettnang : 15 barres avec « recouvrement, précision limitée », « sous le fond (hyp.) ». Réponse Nugget : « Résine 0/5 », puis 780 mots ; aucune quantité en stock nulle part. |
| App | [390](captures/versions/app-390-stout-etape.png), [1280](captures/versions/app-1280-stout-etape.png) | Étape Houblons d'une stout neuve : barre « IBU à chaud, Tinseth, 0 », puis panneau clair « Atelier Houblons V5.5, brouillon en cours, dossier local », onglets Ma bière, Décider, Explorer, Historique, champ « Ta question ». Aucun houblon du stock, à 390 comme à 1280. |

Captures brutes de toutes les versions : `work/refonte-frontend/phase2/captures/`
(dossier de travail, non versionné).

## Ce qui a disparu

Chaque perte cite le fichier qui la porte encore. « Récupérable » veut dire que
le code ou le comportement existe et peut servir à la refonte.

- **P01** · Panneau « Comparer et simuler les houblons » de l'étape Houblons du créateur, avec les outils « Viser des IBU », « Déplacer un ajout », « Remplacer un houblon » et « Dose à cru » · archive : `src/ui/hopIndex/HopRecipeWorkbench.tsx` · retiré du créateur par le commit `4add7b51` (16.10.2026, 289 fichiers, +56 862 lignes, intitulé « sauvegarde ») ; le même commit réécrit `scripts/check-recipe-journey-ui.mjs:394-396` pour affirmer « The former comparison/simulation panel is no longer mounted » ; fusionné en production le 17.10 (PR #102). Le panneau reste monté sur la fiche recette et au jour de brassage (`src/ui/hopIndex/HopRecipePanel.tsx`) : récupérable.
- **P02** · Liste des houblons avec « + comparer » et comparaison côte à côte en barres ou en radar, avec IBU et amertume perçue · archive : `C:\Users\mrspa\Documents\Brasserie\work\houblons-v5-realisation-2026-09-29\explorations\catalogue\v5\candidate-v55-final-22-preview\v5-5.html` · présente dans la dernière maquette V5.5 (jouée sur la stout : Nugget et Tettnang), plafonnée à 3 matières selon son code, sur valeurs simulées. Dans l'app, « Explorer » s'ouvre sur « Configurer les observations et leurs comparaisons » sans aucun houblon du stock (mesure de la phase 1). Le calcul existe (`src/domain/hopDecision/programAnalysis.ts`, `src/services/hopV55/explorationProfiles.ts`) : récupérable après tri.
- **P03** · Stock sur chaque ajout de houblon : physique, réservé, libre, besoin, couvert ou manque · archive : `C:\Users\mrspa\Documents\Brasserie\work\houblons-v5-realisation-2026-09-29\explorations\catalogue\v2\quatre-v2-reprise-10\direction1.html` · affiché en V2 (joué : « libre 40 g, besoin de la copie 12 g, couvert ») et en V3 (`catalogue/v3/continuation04-native-preserved/index.html` : « manque 6 g » en rouge) ; absent de V5, de V5.5 et de l'étape actuelle, où le stock n'apparaît qu'après 2 touchers, sans besoin ni manque.
- **P04** · Cible d'IBU avec écart et ajout qui absorbe l'écart (« Viser un total d'IBU ») · archive : `C:\Users\mrspa\Documents\Brasserie\work\houblons-v5-realisation-2026-09-29\explorations\catalogue\v1\concepts\direction-b.html` · V1-B (capture : « Copie 21,8 IBU, cible 30 »), puis outil « Viser des IBU » de P01 ; l'étape actuelle n'a qu'une barre IBU sans action.
- **P05** · Profil aromatique prévu du verre, en barres par famille · archive : `C:\Users\mrspa\Documents\Brasserie\work\houblons-v5-realisation-2026-09-29\explorations\catalogue\v5\integrated-c1-21\concept-1.html` · V5-C1 (capture : agrumes 8,4, tropical 8,7, fruit blanc 7,4) ; depuis l'étape actuelle, aucune simulation aromatique n'est atteinte (phase 1).
- **P06** · Exemples de questions propres à la bière, dont celles du brasseur (« Dans ma stout, si j'amérise avec Nugget… », « remplacer Saaz par Styrian Golding ») · archive : `C:\Users\mrspa\Documents\Brasserie\work\houblons-v5-realisation-2026-09-29\explorations\catalogue\v5\candidate-v55-final-22-preview\v5-5.html` · présents dans toutes les maquettes V5.5 ; aucune occurrence dans `src/` (recherche « Exemples pour cette bière », « amérise avec Nugget »).

**Ce qui n'a jamais existé**, donc rien à récupérer : un classement de mes
houblons par style (Q01, Q21), la stout comme style documenté, une liste de
remplaçants classés par ressemblance (Q06), l'achat en Suisse (Q30).

## Ce que le backend permet de récupérer

Inventaire complet : `work/refonte-frontend/phase2/backend-recuperable.md`
(agent Haiku, relu ; 4 affirmations vérifiées par Opus, 1 corrigée ci-dessous).

**À garder tel quel**
- IBU à chaud par Tinseth : `src/services/brewingMath.ts:109`, `src/domain/hopBitterness.ts:21`.
- Moments d'ajout : `src/domain/hopStage.ts`.
- Dose de remplacement à IBU égal : `src/domain/hopDecision/calculations.ts:30` (`replacementHopDose`).
- Comparaison de programmes : `src/domain/hopDecision/programAnalysis.ts:53` (`compareHopPrograms`).
- Règles des six produits (Cryo, HyperBoost, SPECTRUM, INCOGNITO, LUPOMAX, CO₂) : `src/domain/hopDecision/products.ts`.
- Modèle aromatique dose-réponse : `functions/src/hopExtrapolationCore.ts`.
- Passerelle Gemini et budget : `functions/src/ai.ts`, `functions/src/brewerBudget.ts`.

**À garder après correction**
- Rôles par style : `src/domain/hopRecipeDesign.ts:29`, `examples: []` pour stout-porter (et kolsch-alt, sour). Il faut une source d'usage par style.
- Usages par style : `src/data/hopStyleUsageBootstrap.json`, 67 variétés, IPA seulement.
- Substitution : `src/domain/hopDecision/substitution.ts:26` dit « No aroma score » ; dose et blocages seulement, aucun classement par ressemblance.
- Analyses : `src/domain/hopDecision/measurements.ts` ; l'alpha absente doit rester une inconnue visible, jamais 0.
- IBU à cru : `functions/src/hopBitternessCore.ts`, à revérifier (panne signalée, C019).
- Catalogue : deux sources concurrentes (`src/services/storage.ts:587` lit Firestore, `src/domain/brewingCatalogueReferences.ts:10` ajoute les références embarquées).

**Inutile pour la refonte** (ne rien supprimer sans accord)
- `src/services/hopV55/` : 67 fichiers, environ 42 900 lignes d'archives, de codecs V1 à V6, de dossiers et de fixtures.
- Dossiers et conseils de `src/domain/hopDecision/` (environ 14 300 lignes) et conseil assisté, fichiers « brewerHopAdvice » de `functions/src/` (environ 7 000 lignes), indisponible par défaut dans l'app.

**Données**
- Beer Maverick (`src/data/hopBeerMaverickBootstrap.json`, 2,0 Mo) : alpha et bêta pour 318 variétés, huiles détaillées pour 260. Les tags d'arôme sont dans le texte (« Tags documentaires : #… ») : 164 tags distincts sur 300 variétés, « pine » sur 58. L'agent les disait non reproductibles ; recomptés par Opus, ils le sont. Les styles et les scores de substitution ne sont pas importés.
- Forme (pellet, cryo, cône) : jamais renseignée pour une variété (0 sur 318 chez Beer Maverick).
- Concurrence : un tableau public attache des styles à chaque variété ; Target, Cascade et Nelson Sauvin y sont marqués stout ou porter (`work/refonte-frontend/phase2/concurrence.md`).

## Production

- **Données, lues en lecture seule** (17.10, 22:41 et 23:40) : 12 variétés au
  catalogue, dont 3 sans aucun alpha (Simcoe, Idaho 7, Nectaron) ; 18 articles
  de stock houblon, dont 9 avec une quantité ; noms avec l'alpha, alpha absente
  sur 7 articles, aucun lien article → variété ; recettes avec alpha 0 et
  ingrédients non houblons dans les houblons. Détail : #120.
- **App jouée avec le stock réel de production** (banc QA, 390 × 844) : 0 houblon
  du stock visible avec sa quantité, à l'arrivée et après chacune des 18 commandes
  de l'étape (`scripts/check-hop-one-tap.mjs`, adaptateur `qa-bench`).
- **Non vérifié** : le rendu de l'app connectée en production. Aucune session
  Chrome QA n'était ouverte, et l'agent ne se connecte pas lui-même. Le banc QA
  charge tout le catalogue guide alors que la production n'en a que 12 variétés :
  le rendu en production ne peut être que pareil ou pire.
