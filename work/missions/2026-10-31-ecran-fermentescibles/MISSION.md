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

(les séries v0, le tri et la passe 2 s'ajoutent après la fiche du jury)

## Boucle de retour
Ses mots vont mot pour mot dans SPEC-BRASSEUR.md, une plainte va dans DEFAUTS-RECURRENTS.md avec son contrôle, et son choix va dans
`choix/ecrans-app.json` (D206).

## Pages
| Sujet | Version | Adresse | Source |
|---|---|---|---|

## Sources
- `src/pages/BrewWizard.tsx` (étape `fermentescibles`, l. 437 ; `fermentables`, l. 660)
- `work/refonte-frontend/v4/SPEC-BRASSEUR.md` l. 76 ; `PRODUCT.md` l. 120–130 et 163–168
- `work/missions/2026-10-31-ecran-identite/cadrage-jury.md` (réponses communes) ; `v1/r4-a/` (l'en-tête et le bandeau choisis)

## Reprise
- 31.10, soir : la mission est ouverte. i1 (inventaire et captures) est en vol, le dossier du jury est en écriture.
- 31.10, soir : i1 est rendu en ECHEC partiel. L'inventaire est écrit, mais aucune recette remplie n'est possible en `?dev-local` : la fixture n'a aucun fermentescible et le stock est vide.
  L'état rempli a été lu sur l'app en ligne, dans la page (NEIPA Test multi-houblons : 3 grains, « Couleur à renseigner », EBC —). La capture d'écran de l'étape 2 a expiré trois fois dans Chrome.
  **Le jury rapide est en vol** : Brasseur (Fable) a72f8d2e78ccab312, Contradicteur (Opus) ac4d81e570ab7e227, sur `jury-fermentescibles/dossier.md`.
  Ensuite : la fiche, puis 3 ou 4 séries v0 (12 à 16 concepts), avec une fixture de recette remplie à donner aux concepteurs.
