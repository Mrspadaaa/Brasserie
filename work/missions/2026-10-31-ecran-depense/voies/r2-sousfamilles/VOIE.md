# Voie r2-sousfamilles — comment une sous-famille se montre dans une bande (D306) : une page de choix en mini maquettes

Agent : `concepteur` (Opus). Plafond : 60 tours. Critique Fable après la voie, puis le pilote publie. Aucun code de l'app modifié, aucun commit,
aucun déploiement, aucun serveur Vite dans le dépôt. Possède : `work/missions/2026-10-31-ecran-depense/choix-sousfamilles/**`.
Avant de concevoir : `.claude/rules/affinee-frontend.md`, `DESIGN.md`, `docs/ui-compacte.md` (parties utiles) ; skills `boosters-ux`, `impeccable`.
Reprends la forme des pages déjà acceptées `choix-nom/`, `choix-captures/` et `choix-frise/` (index.html, outils/, maquettes/, vignettes
« = X », en-tête court, visionneuse) et les verdicts du critique dans `critique/` : ne refais pas leurs défauts.

## La question (un seul facteur, L10)
Dans une bande de famille de la Dépense (vue « Catégorie »), comment se montre la sous-famille d'une ligne ? Seul varie **l'affichage de la
sous-famille**. La bande garde sa forme validée (sa maquette p3c-3, `v3/p3c-3/etat.html` et ses captures) : point de couleur, nom, nombre,
sous-total de quantité et de montant ; rangées picto, nom, quantité × prix, montant ; bascule « Catégorie | Papier » en bas. Rien d'autre ne change.

## Ses mots (SPEC-BRASSEUR, mot pour mot)
- 02.11 : « Je viens de faire un achat, il me manque encore pas mal de catégorie, famille, sous familles, notamment pour la rénovation »
- D262d, 01.11 : « Je comprends pas ,j'ai validé les maquettes de tout ça ?? » ; « Le classement par famille ou sous familles était pas que
  pour malt et houblons mais pour tout type de famille ??? »
- D273e : « …j'ai l'impression qu'il y a trop de d'items en autre ? »

## Les faits (D306, pilote)
- Famille neuve « Rénovation », après Consommables, teinte kaki `--dp-fam-renovation` : clair `rgb(120 112 28)`, sombre `rgb(196 186 90)`.
- Ses sept sous-familles, dans cet ordre : Peinture et sols, Outillage, Quincaillerie, Électricité, Plomberie, Protection, Divers travaux.
- Les autres familles ont déjà des sous-familles : Nettoyage (CIP alcalin, CIP acide, Désinfectant, Détergent), Consommables (EPI, Consommable).
  Montre chaque option **sur la bande Rénovation et sur la bande Nettoyage** : le choix vaut pour toute famille (D262d).
- Une bande à une seule sous-famille, ou une famille sans sous-famille (Houblons), ne doit pas devenir plus lourde : montre ce cas.

## Les options (A est la référence ; tu peux en ajouter une, en le disant comme ton avis)
- **A — aujourd'hui** (`data-reference`) : aucune sous-famille, les lignes dans l'ordre du papier.
- **B — sous-titres dans la bande** : les lignes regroupées par sous-famille, un petit sous-titre par groupe avec son nombre et son sous-total.
- **C — un mot sur chaque rangée** : l'ordre du papier gardé, la sous-famille en petit mot ou pastille sur la rangée.
- **D — la bande en sous-groupes repliés** : au repos, une ligne par sous-famille (nom, nombre, montant) ; un toucher l'ouvre.
Pas de cockpit : premier plan léger, détails à un toucher (`cerveau/brasseur/pas-de-cockpit.md`). Pas de paragraphe d'explication à l'écran.

## Les vues de chaque option
1. Bande Rénovation ouverte (pièce fictive « Brico Fictif SA », 12 à 16 lignes inventées couvrant 5 sous-familles au moins, aucune valeur de sa pièce).
2. Bande Nettoyage ouverte (4 lignes, 3 sous-familles).
3. La dépense au repos, défilée jusqu'aux bandes, à 390 px (la place que prend l'option).

## La forme de la page et les contrôles
`choix-sousfamilles/index.html`, maquettes HTML à 390 px capturées en PNG (`img/`), clair et sombre au moins pour la vue 1, valeurs et
fournisseurs fictifs. Base visuelle : la bande telle qu'elle est servie aujourd'hui
(`voies/p3c-bandes/captures/`, `voies/f3-rangees/captures/tactile390-clair-repos.png`), reprise au pixel (L03) : mêmes classes `dp-p3c-*`,
même typographie, même rangée ; préfixe tes classes neuves (`sf-…`, L26). Aucune option « proposée » par le pilote ; tu peux en proposer une.
1. `node work/refonte-frontend/v4/tournoi/outils/controle-page-choix.mjs work/missions/2026-10-31-ecran-depense/choix-sousfamilles/index.html --min=4` → `PAGE-CHOIX OK`.
2. `node scripts/agents/verifier-page.mjs work/missions/2026-10-31-ecran-depense/choix-sousfamilles/index.html --page-lot --captures work/missions/2026-10-31-ecran-depense/choix-sousfamilles/controle` → `PAGE OK` ; ouvre chaque capture (L12).
3. Côte à côte : la rangée de l'option A et la capture servie ont la même hauteur, la même taille de texte et les mêmes marges (mesure-les, L03).
4. `controle-choix` : l'écran Dépense n'est pas dans `ecrans.json` ; le dire dans RESULTAT.

## Retour
`choix-sousfamilles/RESULTAT.md` (options, mesures, captures ouvertes, doutes ; `LEÇON PROPOSÉE : …`), puis une ligne
`R2-SOUSFAMILLES OK — <n> options — choix-sousfamilles/index.html` ou `R2-SOUSFAMILLES ECHEC — <raison>`.
