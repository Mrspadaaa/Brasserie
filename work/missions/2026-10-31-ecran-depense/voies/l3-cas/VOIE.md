# Voie l3-cas — lenteur D : un champ d'en-tête que la lecture lente corrige, et la lecture lente qui n'arrive jamais (D312), en mini maquettes

Agent : `concepteur` (Opus). Plafond : 50 tours. Critique Fable après la voie, puis le pilote publie (page neuve). Aucun code de l'app modifié,
aucun commit, aucun déploiement, aucun serveur Vite dans le dépôt. Possède : `work/missions/2026-10-31-ecran-depense/choix-cas-38/**`.
Avant : `.claude/rules/affinee-frontend.md`, `DESIGN.md`, `docs/ui-compacte.md` (parties utiles) ; skills `boosters-ux`, `impeccable`.
Reprends la forme et l'outillage de `choix-lignes-38/` (index.html, `outils/gen.mjs` et sa fonction `ecran()`, `outils/mesure-a.mjs`, maquettes),
ses défauts relevés par le critique (`critique/VERDICT-l2-lignes.md` s'il existe à ton arrivée) et ceux de `critique/VERDICT-c-lenteur.md`.
Lis la section 4 de `voies/l1-plan/PLAN.md` (lignes « un en-tête corrigé », « fin de partie », « erreur après le provisoire », « 3.8 en échec »),
et D308, D310, D312 dans `work/refonte-frontend/decisions.md`.

## Ses mots (SPEC, 02.11, mot pour mot)
« La lenteur go pour la d »

## Sa maquette (règle n° 1, la base)
`choix-lenteur/maquettes/d-lue.html` et `img/d-lue.png`, reprise par `choix-lignes-38/outils/gen.mjs` (`ecran({})` la rend octet pour octet) :
fil parti, « Confirmer » noir, puce « ↻ N corrigées », valeur corrigée sur fond bleu, l'ancienne barrée sous le nom. Ne change rien de cela.
Pour la question 2, l'état d'attente est sa maquette `choix-lenteur/maquettes/d-15.html` (`img/d-15.png`) : fil, « Lectures ●●◌ », « Confirmer »
gris avec sa roue. Bandes d'aujourd'hui (vue Catégorie, sans les sous-groupes de D307).

## Les deux questions (deux choix sur la même page, un facteur chacun, L10)
1. **Un champ d'en-tête que la lecture lente corrige** (le total, la date ou le fournisseur de la carte du haut ; prends le total : 46,40 lu vite,
   48,00 lu lentement, une ligne corrigée qui l'explique). Il compte une fois dans la puce. Sa saisie l'emporte : un champ qu'il a touché ne change pas.
   A (référence, défaut du pilote) : la langue de sa maquette appliquée au champ — fond bleu sur la valeur, l'ancienne barrée tout près.
   Puis 2 à 3 autres formes (à toi), dont au moins une plus discrète que A.
2. **La lecture lente qui n'arrive jamais** (aucune réponse 150 s après l'envoi, ou la reprise ratée ; même forme pour une erreur après la
   lecture rapide). Les valeurs rapides restent, ses saisies aussi ; « Confirmer » redevient noir et enregistre les valeurs rapides avec leurs drapeaux.
   A (référence, défaut du pilote) : la forme d'aujourd'hui d'une lecture lente coupée — le fil part, « 2 lectures » en attention dans la
   rangée Lectures (`ExpenseSheet.tsx:970`), et la phrase de production « Le contrôle complémentaire n'a pas abouti. Les divergences restent
   à vérifier sur le justificatif. » au récap (`functions/src/invoiceVisionReview.ts:213`). Puis 2 à 3 autres formes (à toi), sans paragraphe
   ajouté à l'écran ; montre pour chacune l'avant (d-15, l'attente) et l'après.
Pas de cockpit, pas de paragraphe neuf à l'écran ; le fond bleu et la puce de sa maquette restent la langue commune.

## Les vues
Pour chaque option : la dépense à 390 px (pièce fictive d'un fournisseur fictif, la même que choix-lignes-38), clair ; une vue sombre pour la
forme que tu proposes. Valeurs fictives, aucune valeur de ses pièces.

## Contrôles
1. `node work/refonte-frontend/v4/tournoi/outils/controle-page-choix.mjs work/missions/2026-10-31-ecran-depense/choix-cas-38/index.html --min=3` → `PAGE-CHOIX OK`.
2. `node scripts/agents/verifier-page.mjs work/missions/2026-10-31-ecran-depense/choix-cas-38/index.html --page-lot --captures work/missions/2026-10-31-ecran-depense/choix-cas-38/controle` → `PAGE OK` ; ouvre chaque capture (L12).
3. La référence A de chaque question reprend `d-lue.png` (question 1) et `d-15.png` puis la forme coupée d'aujourd'hui (question 2) au pixel
   hors des éléments du cas, chacun nommé (mesure, L03).
4. `controle-choix` : l'écran Dépense n'est pas dans `ecrans.json` ; le dire dans RESULTAT.
5. La page dit en mots simples ce qu'on attend de lui (une lettre par question), sans code (L24).

## Retour
`choix-cas-38/RESULTAT.md` (options, mesures, captures ouvertes, doutes ; `LEÇON PROPOSÉE : …`), puis une ligne
`L3-CAS OK — <n> options — choix-cas-38/index.html` ou `L3-CAS ECHEC — <raison>`.
