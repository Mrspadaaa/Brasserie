# Voie r1-renovation — la famille « Rénovation » et ses sous-familles (D306)

Agent : `auteur` (Sonnet), neuf. Plafond : 70 tours. Ligne `r1-renovation` de MISSION.md. Aucun commit, aucun déploiement, aucun appel réel,
aucun serveur Vite dans le dépôt. Tests et serveur dans la copie isolée :
`node work/missions/2026-10-31-ecran-depense/voies/p3c-port/copie.mjs "<commande>"` (une commande simple par appel, sans `;`).
Lis d'abord D306 dans `work/refonte-frontend/decisions.md` et la dernière entrée de `work/refonte-frontend/v4/SPEC-BRASSEUR.md`.
Ne lis pas `voies/r0-mesure-pilote/` : c'est la mesure du pilote sur sa vraie pièce, il la rejoue lui-même après toi.

## Ses mots (SPEC, 02.11, mot pour mot)
« Je viens de faire un achat, il me manque encore pas mal de catégorie, famille, sous familles, notamment pour la rénovation »
Sa pièce : un magasin de bricolage (produit pour sol, peinture et ses outils, brosses, ruban de masquage, détartrant, déboucheur, seau,
protection du corps). D262d : « Le classement par famille ou sous familles était pas que pour malt et houblons mais pour tout type de famille ??? »

## Le fait mesuré (pilote, 02.11)
Sur sa pièce, 17 lignes : lues `other`, 12 vont en « Autres » ; lues `equipment`, 17 vont en « Matériel de brassage ». Il n'existe ni famille
des travaux, ni sous-famille. `suggestedKind` de « Local » vaut `service` (`ExpenseSheet.tsx`, vers la ligne 248) : une ligne ajoutée à la
main sous Local tombe en « Services ».

## À faire (plancher à enrichir, L07)
1. `src/ui/depense/familles.ts` : `FamilleCle` gagne `renovation`, nom « Rénovation », placé après `consommable` dans `ORDRE_FAMILLES`.
   `EntreeFamille` gagne `categorie?: string` (la catégorie « Pour quoi ? » de la dépense : `brassage`, `materiel`, `renovation`…).
2. Les règles de D306, dans `familleDe` :
   - un mot sans équivoque des travaux (peinture, vernis, vitrificateur, lasure, enduit, plâtre, mastic, silicone, rouleau à peinture,
     pinceau, bac à peinture, ponceuse, abrasif, cheville, vis à bois, interrupteur, prise, gaine, carrelage, ciment…, avec leurs formes
     allemandes, anglaises et italiennes) va en Rénovation **sous toute catégorie** ; un mot du brassage plus précis garde la main
     (« Hop Spider Bag » reste Matériel, un ruban de téflon d'un robinet de cuve aussi s'il est lu sous Brassage) ;
   - un mot ambigu (robinet, tuyau, joint, brosse, seau, gant, masque, combinaison, ruban…) va en Rénovation **quand `categorie` vaut
     `renovation`**, et garde sa famille d'aujourd'hui ailleurs ;
   - sous `renovation`, toute ligne sans mot d'ingrédient, d'emballage, de nettoyage ni de service (kinds `equipment`, `maintenance`,
     `other`, `unknown`, `stock`, `service` sans mot de service) va en Rénovation ; l'EPI (gant, masque, combinaison, lunettes, `EPI` lu
     en catégorie de stock) en Rénovation › Protection ;
   - détartrant, anticalcaire, déboucheur (et Entkalker, descaler, decalcificante, Rohrreiniger, drain cleaner, disgorgante) vont en
     Nettoyage, sous toute catégorie ;
   - le port, la remise et l'inclassable hors Local ne changent pas.
3. Une fonction pure `sousFamilleDe(famille, entree)` (même fichier, exportée) : pour `renovation`, une des sept sous-familles dans cet ordre
   d'affichage : Peinture et sols, Outillage, Quincaillerie, Électricité, Plomberie, Protection, Divers travaux (sans mot reconnu). Pour les
   autres familles, la sous-famille existante (`categorieDeFamille` pour Nettoyage et Consommables, la catégorie de stock lue ou de l'article),
   sinon `undefined`. Elle n'est **affichée nulle part** : l'affichage est un choix du brasseur (voie r2). Elle se teste.
4. Les appelants passent la catégorie de la dépense : `groupeDe` (`groupes.ts`) et `groupeDeLigne` (`ExpenseSheet.tsx`, vers la ligne 714),
   `familleDeLigne` (`confiance.ts`), `categorieArticleNeuf` (`stockLineMatching.ts`) si la catégorie lui parvient ; sinon le dire.
   `grep` de tous les lecteurs de `familleDe`, `groupeDe`, `ORDRE_FAMILLES`, `NOMS_FAMILLES`, `POINT_FAMILLE`, `FILET_FAMILLE` (L17) :
   chaque table indexée par `FamilleCle` reçoit `renovation` (tsc le prouve).
5. Une ligne Rénovation ne crée **jamais** d'article de stock, ni de mouvement (même lue `stock`) : là où `ExpenseSheet.tsx` décide le
   « nouvel article » d'office (vers les lignes 335 à 348), une ligne dont la famille est `renovation` reste `stockAction: 'none'`.
6. `suggestedKind` de `renovation` : `equipment` au lieu de `service` (une ligne ajoutée à la main sous Local arrive en Rénovation).
7. `src/ui/depense/p3c.css` : le jeton `--dp-fam-renovation`, clair `120 112 28`, cave `196 186 90` (fixé par le pilote, D306), et les classes
   `dp-p3c-t-renovation`, `dp-p3c-pt-renovation`, `dp-p3c-fi-renovation` sur le modèle des quatre existantes ; `POINT_FAMILLE` et
   `FILET_FAMILLE` les utilisent. Le picto de la bande : celui des autres familles hors stock s'il en existe un générique ; sinon une clé
   d'outil simple au trait du jeu existant (dis lequel dans RESULTAT).
8. L'aperçu de développement : un état `renovation` dans `src/ui/depense/apercuDev.ts`, sur le modèle d'`apercuFamilles()` : une pièce
   SIMULÉE d'un magasin fictif (« Brico Fictif SA »), catégorie lue `renovation`, 14 à 18 lignes inventées en français, allemand, anglais
   et italien couvrant les sept sous-familles, deux lignes ambiguës (un seau, une brosse), un détartrant, un EPI, un port ; aucune valeur ni
   désignation de sa pièce.
9. Script de captures `voies/r1-renovation/capturer-renovation.mjs`, sur le modèle de `voies/p3c-bandes/capturer-familles.mjs` : état
   `renovation` et état `familles`, à 390 tactile et 1280, clair et sombre, au repos et bande Rénovation ouverte ; sortie
   `RENOVATION OK` ou `RENOVATION ECHEC n`. Ouvre chaque capture (L12) : la bande Rénovation est là, en kaki, et l'état `familles`
   est inchangé à l'œil (compare avec `voies/p3c-bandes/captures/`).

Interdits : `functions/**` (la lecture n'est pas touchée), le schéma des données (`src/types/**` sauf si tsc l'exige, et le dire), la forme
des bandes (en-tête, sous-totaux, rangées : sa maquette validée), tout autre fichier.

## Possède
`src/ui/depense/familles.ts`, `src/ui/depense/groupes.ts`, `src/ui/depense/p3c.css` (jetons et classes de famille), `src/ui/depense/apercuDev.ts`,
`src/ui/depense/apercu/**` (une fixture neuve au besoin), `src/ui/depense/confiance.ts` (l'appel de `familleDe`), `src/services/stockLineMatching.ts`
(`categorieArticleNeuf`), `src/ui/finance/ExpenseSheet.tsx` (`groupeDeLigne`, `suggestedKind`, la décision du nouvel article), le picto s'il en faut un,
`tests/unit/depense/bandes/**`, `tests/unit/depense/stock/**`, `work/missions/2026-10-31-ecran-depense/voies/r1-renovation/**`.

## Critères (le pilote les rejoue)
1. Témoins rouges sur l'arbre d'avant, verts après (mutation dans la copie isolée) : une pièce inventée de travaux en quatre langues,
   lue `other` puis `equipment`, sous `renovation` : 0 ligne en « Autres » ni en « Matériel de brassage » hors port ; chaque ligne dans la
   sous-famille attendue ; le seau et la brosse en Rénovation sous Local, dans leur famille d'aujourd'hui sous Brassage ; détartrant en
   Nettoyage ; aucune ligne Rénovation en nouvel article de stock.
2. Les tests existants des familles (`tests/unit/depense/bandes/**`) restent verts **sans changer une attente** ; si une attente doit
   changer, arrête-toi et dis pourquoi dans RESULTAT (le pilote tranche).
3. `npx vitest run tests/unit/depense --maxWorkers=2` (copie isolée) : tout vert ; `npx tsc --noEmit -p tsconfig.json` : 0 erreur ;
   `npm run build` : 0 erreur.
4. `capturer-renovation.mjs` → `RENOVATION OK`, captures ouvertes et décrites dans RESULTAT.

## Rendre
`RESULTAT.md` : fichiers, règles (l'ordre de décision final de `familleDe`), mots ajoutés par langue et par sous-famille, témoins, sorties,
captures, doutes ; `LEÇON PROPOSÉE : …`, `CONNAISSANCE : …`. Une ligne : `R1-RENOVATION OK — …` ou `R1-RENOVATION ECHEC — …`.
