# Voie l2b-valider — son choix 2 D : « Tout valider », et un à un, quand plusieurs lignes ne sont pas retrouvées (D313), en mini maquettes

Agent : `concepteur` (Opus), le même que l2-lignes. Plafond : 40 tours. Critique Fable après la voie, puis le pilote publie (page neuve).
Aucun code de l'app modifié, aucun commit, aucun déploiement, aucun serveur Vite dans le dépôt.
Possède : `work/missions/2026-10-31-ecran-depense/choix-valider/**` (lecture seule de `choix-lignes-38/`).
Avant : `.claude/rules/affinee-frontend.md`, `DESIGN.md`, `docs/ui-compacte.md` (parties utiles) ; skill `boosters-ux`.
Reprends l'outillage de `choix-lignes-38/` (copie dans ton dossier, `ecran()` inchangée) et les verdicts `critique/VERDICT-l2-lignes.md`, `critique/VERDICT-l3-cas.md`.

## Ses mots (SPEC, 02.11, mot pour mot)
« 2 d, en un clic je peux Tout validé les changements. Mais aussi un à 1 »

## Sa maquette (règle n° 1, la base)
`choix-lignes-38/maquettes/q2-d-arrivee.html` (`img/q2-d-arrivee.png`), son choix 2 D : la ligne barrée dans la liste, hors des sommes ;
au pouce, au-dessus de Confirmer, le bandeau « … · pas retrouvée · Garder · Retirer » ; Confirmer sans trancher : elle part ; la puce
« ↻ N corrigées » la compte. Après le geste : `q2-*-garder` et `q2-a` (retirer). Ne change rien de cela.

## La question (un seul facteur, L10)
Avec **deux lignes pas retrouvées** (Avoine maltée dans Malts, et une seconde fictive dans une autre bande), où est « Tout valider » et comment
se tranche chaque ligne une à une ? Lecture du pilote (D313, à garder) : « Tout valider » applique la lecture lente à toutes (elles partent),
d'un toucher ; Garder / Retirer reste pour chacune. Son mot « Tout valider » est le libellé.
- **A (référence, `data-reference`)** : son 2 D tel quel, deux lignes, une question à la fois (« 1/2 »), sans « Tout valider ».
- 2 à 4 formes, la tienne marquée comme ton avis. Pistes, sans t'y limiter : « Tout valider » dans le bandeau, et un toucher sur une rangée
  barrée qui porte sa question ; le bandeau qui défile « 1/2 », « 2/2 » avec « Tout valider » à côté ; le bandeau ouvert en liste courte.
Le geste se trouve sans mode d'emploi ; une seule action noire (Confirmer) ; pas de cockpit ; aucun paragraphe à l'écran.

## Les vues de chaque option
1. L'arrivée (deux lignes pas retrouvées), 390 px, clair. 2. Après « Tout valider ». 3. Après un « Garder » sur la première, avant la seconde.
Sombre pour la vue 1 de ta forme. Valeurs fictives (Brauhaus Ouest), sommes justes ; aucune valeur de ses pièces.

## Contrôles
1. `node work/refonte-frontend/v4/tournoi/outils/controle-page-choix.mjs work/missions/2026-10-31-ecran-depense/choix-valider/index.html --min=3` → `PAGE-CHOIX OK`.
2. `node scripts/agents/verifier-page.mjs work/missions/2026-10-31-ecran-depense/choix-valider/index.html --page-lot --captures work/missions/2026-10-31-ecran-depense/choix-valider/controle` → `PAGE OK` ; ouvre chaque capture (L12).
3. Hors de la seconde ligne et du bandeau, A reprend `q2-d-arrivee.png` au pixel (mesure, L03), chaque écart nommé.
4. `controle-choix` : l'écran Dépense n'est pas dans `ecrans.json` ; le dire dans RESULTAT.
5. La page dit en mots simples ce qu'on attend de lui (une lettre), sans code (L24). (Question 1 tranchée : 1 B, D314 ; plus de rappel.)

## Retour
`choix-valider/RESULTAT.md` (options, mesures, captures ouvertes, doutes ; `LEÇON PROPOSÉE : …`), puis une ligne
`L2B-VALIDER OK — <n> options — choix-valider/index.html` ou `L2B-VALIDER ECHEC — <raison>`.
