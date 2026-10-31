# Mission 2026-10-31-ecran-fermentescibles — refaire l'étape « Malts/sucres 2/7 » de la création de recette

## Objectif
L'écran suivant du programme « refaire tous les écrans un à un comme houblons » (SPEC-BRASSEUR, 31.10), après Identité (r4-a choisie,
D205). Son mot sur cette étape (18.10, capture de l'étape Malts à l'appui) : « Comme pour les Malts j'ai besoin d'avoir des le premier
coup d'œil, quel matière première j'ai, et et je peux ajouter en un click ultra facilement. Ensuite seulement je peux ouvrir mon panel
de comparatif ect .. ». Entonnoir allégé (D204 : « il faudra pas autant de mini maquettes et série, c'est trop demandant en quotas ») :
12 à 16 v0 en 3 ou 4 séries, un tri par le critique, une passe 2 sur 3 candidates.

## Décisions
| Décision | Décideur |
|---|---|
| Jury rapide (Brasserie en Fable, Contradicteur en Opus) : D204 demande l'économie, et les réponses communes d'Identité (scène, en-tête, pied, fil) sont acquises | pilote |
| La baseline est l'écran d'aujourd'hui (production ae7c7a8d), et l'en-tête, le fil et le bandeau d'Identité r4-a, communs aux 7 étapes | pilote |
| Le choix de la variante | brasseur |

## Voies
| Voie | Objectif | Niveau | Agent | Modèle | Plafond | Possède | Dépend de | Contrôles | Décideur | Étape |
|---|---|---|---|---|---|---|---|---|---|---|
| i1 | inventaire et captures de l'écran actuel | mécanique | executant | haiku | 60 | work/missions/2026-10-31-ecran-fermentescibles/inventaire/** | — | inventaire-fermentescibles.md, captures ouvertes | pilote | — |

| r | série r, représentations distinctes (A1, A2, A4) | conception | concepteur | opus | 60 | work/missions/2026-10-31-ecran-fermentescibles/v0/r*/** | — | baseline : controle-commun --profil=sans-houblons, controle-choix, controle-continuite | brasseur | v0 ×4 (1 froide, 1 tiède, 2 chaude) |
| z | série z, créative à fond | conception | concepteur | fable | 60 | work/missions/2026-10-31-ecran-fermentescibles/v0/z*/** | — | baseline : controle-commun --profil=sans-houblons, controle-choix, controle-continuite | brasseur | v0 ×4 (1 froide, 1 tiède, 2 chaude) |
| u | série u, libre au brief minimal | conception | concepteur | opus | 60 | work/missions/2026-10-31-ecran-fermentescibles/v0/u*/** | — | baseline : controle-commun --profil=sans-houblons, controle-choix, controle-continuite | brasseur | v0 ×4 (1 froide, 1 tiède, 2 chaude) |
| t | tri des 12 concepts (classement, 3 candidates, greffes) | jugement | critique | fable | 30 | work/missions/2026-10-31-ecran-fermentescibles/critique/** | r, z, u | controle-panel, captures ouvertes | pilote | tri |
| p2 | passe 2 des 3 candidates | conception | concepteur | opus | 60 | work/missions/2026-10-31-ecran-fermentescibles/v1/** | t | controle-commun --profil=sans-houblons, controle-choix, controle-continuite | brasseur | passe 2 |

## Boucle de retour
Ses mots vont mot pour mot dans SPEC-BRASSEUR.md, une plainte va dans DEFAUTS-RECURRENTS.md avec son contrôle, et son choix va dans
`choix/ecrans-app.json` (D206).

## Pages
| Sujet | Version | Adresse | Source |
|---|---|---|---|
| Malts/sucres · panel v0 (12 concepts) | 31.10 v1 | https://claude.ai/artifact/Hn6WHBqAAEzV7UuJj9qCoh | `panel-v0.html` |

## Sources
- `src/pages/BrewWizard.tsx` (étape `fermentescibles`, l. 437 ; `fermentables`, l. 660)
- `work/refonte-frontend/v4/SPEC-BRASSEUR.md` l. 76 ; `PRODUCT.md` l. 120–130 et 163–168
- `work/missions/2026-10-31-ecran-identite/cadrage-jury.md` (réponses communes) ; `work/missions/2026-10-31-ecran-identite/v1/r4-a/etat.html` (sa langue, l'étape 1 choisie)

## Reprise
- 31.10, soir : la mission est ouverte. i1 (inventaire et captures) est en vol, le dossier du jury est en écriture.
- 31.10, soir : i1 est rendu en ECHEC partiel. L'inventaire est écrit, mais aucune recette remplie n'est possible en `?dev-local` : la fixture n'a aucun fermentescible et le stock est vide.
  L'état rempli a été lu sur l'app en ligne, dans la page (NEIPA Test multi-houblons : 3 grains, « Couleur à renseigner », EBC —). La capture d'écran de l'étape 2 a expiré trois fois dans Chrome.
  **Le jury rapide est en vol** : Brasseur (Fable) a72f8d2e78ccab312, Contradicteur (Opus) ac4d81e570ab7e227, sur `jury-fermentescibles/dossier.md`.
  Ensuite : la fiche, puis 3 ou 4 séries v0 (12 à 16 concepts), avec une fixture de recette remplie à donner aux concepteurs.
- 31.10, soir : **la fiche du jury est écrite** (`jury-fermentescibles/fiche.md` : 14 tranchées, 4 axes, 5 hypothèses, 2 accords). Le Contradicteur a corrigé le dossier : la création à la volée existe, le clavier PC est un acquis, et le « panel de comparatif » visait les houblons.
  **Les 3 séries v0 sont lancées** (4 concepts chacune, 12 en tout, D204) : r (Opus) a48bacb65242c02e1, z (Fable) a57b38d5523944a01, u (Opus, libre) a550c22545d3a7792. La passe 2 repart chez les mêmes agents.
  Ensuite : regarder leurs captures, publier le panel (un artefact neuf), faire le tri par le critique, puis la passe 2 sur 3 candidates.
- 31.10, soir : **les 12 concepts v0 sont rendus** et le panel est publié (Hn6WHBqAAEzV7UuJj9qCoh).
  - r : MOTS OK, COMMUN échoue sur les couleurs (voulu : ses couleurs sont inconnues), PANEL échoue parce que r1 est trop vide.
  - z : PAGE OK ×4, MOTS OK.
  - u : COMMUN OK, MOTS OK, contraste OK.
  Le tri du critique est en vol (`critique/SYNTHESE.md`, 3 candidates). Ensuite : la passe 2 chez les mêmes agents (r a48bacb65242c02e1, z a57b38d5523944a01, u a550c22545d3a7792).
