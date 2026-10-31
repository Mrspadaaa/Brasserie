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
| Passe 3 : le remplissage ≥ 0,80 de RELANCE-v1 était mal étalonné (r4-a, sa référence, fait 0,54 sur `controle-panel`). Seuil retenu : celui de r4-a (≥ 0,50) et le vide sous le pied jugé sur capture ; r4c 0,55, u2c 0,51 | pilote |
| L'OG suit l'app : « — » tant qu'un potentiel manque (`brewCompanion.ts:505`, « Aucun rendement inventé ») ; l'OG estimée « ~1,061 » de r4c (PPG tapés dans la maquette) est retirée par le pilote, captures refaites | pilote |
| Le choix : **r4c (La balance)**, avec une adaptation : modifier, supprimer et ajouter sur la ligne, sans plateau ; toucher la ligne ouvre le détail (D208, D209). Passe 4 : r4d | brasseur |
| Les axes de la page qu'il n'a pas tranchés (plateau, sucre, teinte, OG) gardent la forme de r4c ; la page de la passe 4 le dit (L01) | pilote |
| Le registre `choix/ecrans-app.json` reçoit Malts/sucres après son accord sur r4d, comme Identité | pilote |

## Voies
| Voie | Objectif | Niveau | Agent | Modèle | Plafond | Possède | Dépend de | Contrôles | Décideur | Étape |
|---|---|---|---|---|---|---|---|---|---|---|
| i1 | inventaire et captures de l'écran actuel | mécanique | executant | haiku | 60 | work/missions/2026-10-31-ecran-fermentescibles/inventaire/** | — | inventaire-fermentescibles.md, captures ouvertes | pilote | — |

| r | série r, représentations distinctes (A1, A2, A4) | conception | concepteur | opus | 60 | work/missions/2026-10-31-ecran-fermentescibles/v0/r*/** | — | baseline : controle-commun --profil=sans-houblons, controle-choix, controle-continuite | brasseur | v0 ×4 (1 froide, 1 tiède, 2 chaude) |
| z | série z, créative à fond | conception | concepteur | fable | 60 | work/missions/2026-10-31-ecran-fermentescibles/v0/z*/** | — | baseline : controle-commun --profil=sans-houblons, controle-choix, controle-continuite | brasseur | v0 ×4 (1 froide, 1 tiède, 2 chaude) |
| u | série u, libre au brief minimal | conception | concepteur | opus | 60 | work/missions/2026-10-31-ecran-fermentescibles/v0/u*/** | — | baseline : controle-commun --profil=sans-houblons, controle-choix, controle-continuite | brasseur | v0 ×4 (1 froide, 1 tiède, 2 chaude) |
| t | tri des 12 concepts (classement, 3 candidates, greffes) | jugement | critique | fable | 30 | work/missions/2026-10-31-ecran-fermentescibles/critique/** | r, z, u | controle-panel, captures ouvertes | pilote | tri |
| p2 | passe 2 des 3 candidates | conception | concepteur | opus | 60 | work/missions/2026-10-31-ecran-fermentescibles/v1/** | t | controle-commun --profil=sans-houblons, controle-choix, controle-continuite | brasseur | passe 2 |
| t2 | verdicts des passes 2 (r4b, z2b, u2b), agent neuf (D207) | jugement | critique | fable | 30 | work/missions/2026-10-31-ecran-fermentescibles/critique/VERDICTS-v1.md | p2 | captures ouvertes | pilote | — |
| p3 | relance des 3 passes (r4c, z2c, u2c), agents neufs sur RELANCE-v1.md (D207) ; z2c en Fable | conception | concepteur | opus | 40 | work/missions/2026-10-31-ecran-fermentescibles/v2/** | t2 | controle-commun --profil=sans-houblons, controle-choix, controle-continuite, controle-panel, controle-hauteur | brasseur | passe 3 |
| t3 | verdicts des passes 3 (r4c, z2c, u2c), agent neuf (D207) | jugement | critique | fable | 30 | work/missions/2026-10-31-ecran-fermentescibles/critique/VERDICTS-v2.md | p3 | captures ouvertes | pilote | — |
| p4 | r4d : r4c avec modifier, retirer et ajouter sur la ligne, détail au toucher du nom (D208, D209) ; agent neuf, compréhension testée (COMPRIS OK) | conception | concepteur | opus | 40 | work/missions/2026-10-31-ecran-fermentescibles/v3/r4d/** | t3 | controle-gestes-ligne, controle-choix (s.o. : Malts entre au registre après son accord sur r4d), verifier-page, mots-premier-ecran, controle-commun, controle-contraste, controle-hauteur, captures | brasseur | passe 4 |
| t4 | verdict de r4d contre r4c, agent neuf (D207) | jugement | critique | fable | 30 | work/missions/2026-10-31-ecran-fermentescibles/critique/VERDICT-v3.md, work/missions/2026-10-31-ecran-fermentescibles/critique/t4/** | p4 | captures ouvertes | pilote | — |
| c5 | `controle-volee.mjs` : masse, part, moment et couleur se changent sur la ligne (D211) ; échoue sur r4d | jugement | auteur | sonnet | 60 | work/refonte-frontend/v4/tournoi/outils/controle-volee.mjs, work/missions/2026-10-31-ecran-fermentescibles/voies/c5/** | t4 | ECHOUE OK sur r4d, VOLEE OK sur le témoin | pilote | — |
| p5 | r4e-a (menu ancré, part tapée) et r4e-b (cycle, barre tirée) depuis r4d, plateau toujours visible (D211, D212) ; agent neuf, compréhension testée | conception | concepteur | opus | 110 | work/missions/2026-10-31-ecran-fermentescibles/v4/** | c5 | controle-volee, controle-gestes-ligne, controle-choix (s.o. : Malts entre au registre après son accord), verifier-page, mots-premier-ecran, controle-commun, controle-contraste, controle-hauteur, captures | brasseur | passe 5 |

## Boucle de retour
Ses mots vont mot pour mot dans SPEC-BRASSEUR.md, une plainte va dans DEFAUTS-RECURRENTS.md avec son contrôle, et son choix va dans
`choix/ecrans-app.json` (D206).

## Pages
| Sujet | Version | Adresse | Source |
|---|---|---|---|
| Malts/sucres · panel v0 (12 concepts) | 31.10 v1 | https://claude.ai/artifact/Hn6WHBqAAEzV7UuJj9qCoh | `work/missions/2026-10-31-ecran-fermentescibles/panel-v0.html` |
| Malts/sucres · passe 3 (r4c, z2c, u2c) et ses axes | 31.10 v1 | https://claude.ai/artifact/2bBQ7dcRjwnyGfbUgf7vUG | `work/missions/2026-10-31-ecran-fermentescibles/choix-v2/index.html` |
| Malts/sucres · passe 4 (r4c et r4d, gestes sur la ligne, plateau visible ou replié) | 31.10 v1 | https://claude.ai/artifact/9TYpaMsGrfuBYYMPUf8XeU | `work/missions/2026-10-31-ecran-fermentescibles/choix-v3/index.html` |
| Malts/sucres · passe 5 (r4e-a et r4e-b, besoins à la volée sur la ligne) | 31.10 v1 | https://claude.ai/artifact/L1yhL5ei1UmHyYAdHVFPnd | `work/missions/2026-10-31-ecran-fermentescibles/choix-v4/index.html` |

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
- 31.10, soir : **tri fait** (`critique/SYNTHESE.md`).
  - Classement : r4, z2, u3, r3, r2, u2, u4, z3, z4, r1, u1, z1. Aucun rejet, aucun « très mauvais ».
  - Candidates : **r4** (le réglage, dans sa langue r4-a), **z2** (la composition ; absorbe r3 et u3) et **u2** (l'ajout au clavier).
  **La passe 2 est lancée** chez les mêmes agents, dans `v1/r4b`, `v1/z2b` et `v1/u2b`, avec les captures à 8 grains (D5). Ensuite : le critique juge chaque variante, puis une page neuve.
- 31.10, soir : **r4b** est rendue avec le plateau noir réduit d'un tiers, mon choix contre le plateau clair (0,42).
  - Écart accepté par le pilote : le remplissage vaut 0,47 pour 0,5 attendu, car sa recette n'a que 3 malts ; à 8 grains, la page fait 0,96 écran. Gonfler la page serait du remplissage, pas de l'information.
  - Couleurs : COMMUN échoue comme en v0, et c'est voulu (J7 : aucune couleur connue).
- 31.10, soir : u2b est rendue (« pils 5 » gardé, COMMUN OK, remplissage 0,46 : même écart accepté que r4b, 3 malts). z2b est encore en vol. Le jugement des passes et la suite se feront dans une session neuve (D207), avec un critique neuf.
- 31.10, nuit : **t3 rendu** (`critique/VERDICTS-v2.md`) : r4c, z2c et u2c PRÊTES À MONTRER ; proposition de classement z2c, r4c, u2c (indicative, L27).
  Deux micro-correctifs du pilote, captures refaites et ouvertes : r4c dit « 90 % ferm. » pour le fruit (fermentabilité par famille, `KIND_DEF`) et
  « Lactose : non fermentescible… » ; z2c dit « OG — · style 1,060–1,085 » (décision OG, PPG retirés). L'OG en piste ou en puce reste un axe montré.
  **Page de choix publiée** (2bBQ7dcRjwnyGfbUgf7vUG, PAGE OK, captures ouvertes). Ensuite : son choix dans `choix/ecrans-app.json` (D206), puis le port.
- 31.10, nuit : **r4d rendue** (p4, Opus) : GESTES OK (16), G1 à G8 OK au rejeu du pilote ; les 6 captures ouvertes. La masse se tape sur la
  ligne (trait de 2 px, total et % suivent), le retrait laisse « … retiré · Annuler » à sa place, le nom ouvre le détail.
  Décision du pilote (réversible) : au toucher, la frappe remplace la masse (l'ancienne reste en gris, Échap la rend), comme la retouche B
  d'Identité ; une ligne à changer s'il veut compléter le chiffre. Le rejeu dit « ECHEC mission — 1 voie (2 au moins) » : les voies
  i1 à t3 ont tourné sans dossier `voies/` (D204, économie), seule p4 en a un ; écart connu, pas un défaut de p4.
  **Le critique t4 est en vol** (`critique/VERDICT-v3.md`). Ensuite : la page de la passe 4 (r4c et r4d côte à côte, gestes repos /
  pendant / après, les deux états du plateau), un artefact neuf.
- 31.10, nuit : t4 rend **PRÊT À MONTRER** (0 bloquant, 5 détails, `critique/VERDICT-v3.md`). Le n° 2 est corrigé par le pilote : la
  ligne retirée garde la hauteur d'une ligne (50 px, 40 en dense) ; mesuré, Haferflocken 242 → 240 px au retrait (avant : un saut de
  liste). Les n° 3 (vide sous le pied, replié à 3 lignes) et n° 4 (détail en bas) sont écrits en coût sous l'option repliée de la page ;
  n° 1, n° 5 et Q4 : rien à faire avant ses mots. Page de la passe 4 publiée (PAGE OK, captures ouvertes), table « Pages ».
  **Attend son verdict** : r4d lui va-t-elle, et quel plateau (visible ou replié). Ensuite : Malts dans `ecrans-app.json`, puis le port
  (avec l'alias « Munich » → « Münchner Malz », vu sur r4d : le champ crée une ligne au lieu de proposer la fiche existante).
- 31.10, nuit : **critique t5** (`critique/VERDICT-v4.md`) : PRÊT À MONTRER, r4e-a et r4e-b, 0 bloquant, 0 majeur, 6 détails. Retouches d'une ligne faites
  par le pilote : a1 (la masse déduite de la part tapée tombe au cran de la piste : « 30 » → 2,8 kg, grain 9,3 kg ; attente de `capturer.mjs` de a mise à jour),
  a2 (le champ couleur fait 36 px et déborde de 6 px de chaque côté : la ligne ne bouge plus), b2 (« Annuler » du moment prend la place de « du grain » :
  la part « 19 % » reste, la barre perd 20 px ; d'abord essayé à la place du ×, il couvrait le « kg » sur la capture, écarté). a3 et b1 dits sur la page.
  Captures refaites et ouvertes, `systeme.mjs voies` → VOIES OK 3/3 (approbations rejouées). Page de la passe 5 publiée (PAGE OK, trois captures
  ouvertes), table « Pages ». **Attend son verdict** : a, b ou un mélange. Ensuite : Malts dans `ecrans-app.json`, puis le port (alias « Munich »).
