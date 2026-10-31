# Mission 2026-10-31-ecran-identite — refaire l'écran « Identité 1/7 » de la création de recette

## Ses mots (31.10)
- « Une fois terminé avec houblons on va refaire tout les écrans de l'app un à un comme houblons ».
- « On va tester tout ça en refaisant ce premier écran, identité dans la création de recette ». Sa capture de production :
  `brasseur-identite-avant.jpg`.
- Sur les méthodes : « Alors ça non ou à adapter avec un jury. Le reste ok, on peut aussi faire des tests ! » (D198).

C'est le premier écran du programme, et le banc d'essai des outils de la mission `2026-10-31-systeme-ecrans` :
- le jury (e4) ;
- l'inventaire (e2) ;
- les captures de référence (e1) ;
- le lint de DESIGN.md (e5) ;
- le glossaire (e3).

## Ce que montre l'écran aujourd'hui (sa capture)
- L'en-tête « ‹ Identité 1/7 · Abandonner », avec les icônes copier et thème, puis les onglets des 7 étapes : Identité, Malts/sucres,
  Houblons, Levure, Paliers, Eau, Récap.
- Le bandeau Grain 8,6 kg · OG 1,080 · IBU ~93 (curseur) · EBC 9,5, et « Coller une recette trouvée ».
- Le bloc « Identité » :
  - le nom de la bière et son style ;
  - « Repères du style · 22A · BJCP 2021 », repliable ;
  - le volume en fermenteur (24 L) et la durée d'ébullition (60 min) ;
  - « 3 L évaporés — autant d'eau à prévoir en plus dans la cuve ».
- « Objectif NOLO · ≤ 0,5 % », une case à cocher.
- « Choix pour ce brassin » : 24 / 30 L · 6 L libres, un repère provisoire de 20 %, l'espace libre choisi et le remplissage conseillé.
- « Matériel du plan : Royal Catering · cuve 45 L », puis un + flottant.

## Étapes (entonnoir, `.claude/skills/voies/references/entonnoir.md`)
| Étape | Qui | Livrable | État |
|---|---|---|---|
| Identité · panel v0 (48 concepts) | 31.10 v1 | https://claude.ai/artifact/F5Laf6mqwAtp7dF4ZVVZBx | `work/missions/2026-10-31-ecran-identite/panel-v0/page.html` |
| 0. Cadrage | jury (e4, essai réel) et inventaire (e2) | `cadrage-jury.md`, `inventaire-identite.md` | en vol |
| 1. v0 | 8 séries, un concepteur (Opus) par série, dont une série Fable créative et une série libre ; trois chaleurs ; la baseline = l'écran d'aujourd'hui et ses acquis | 48 concepts au moins (60 visés), publiés dès qu'ils sont faits | à venir |
| 2. Tri | critique (Fable) | `critique/SYNTHESE.md` : classement, 5 candidates, greffes | à venir |
| 3. Passes 2, 3… | les mêmes agents | passes publiées, une page par passe | à venir |
| 4. Son choix | le brasseur | sa maquette, reprise telle quelle (règle n° 1), au registre `ecrans.json` | à venir |
| 5. Port | auteur (Sonnet), critique (Fable) | l'écran dans l'app, captures côte à côte, baseline (e1), lint (e5) | à venir |

## Règles
- Aucune question bloquante : le jury tranche ce qui se tranche par les sources, et chaque goût devient un axe de variantes (L24).
- Les exigences transversales (L05) :
  - pas de cockpit ;
  - le premier plan léger, le détail à un toucher ;
  - aucun texte sous 12 px ;
  - les saisies sans `type="number"` ([[saisie-mobile]]) ;
  - le hors ligne ;
  - les données réelles jamais modifiées.

## Pages
| Sujet | Version | Adresse | Source |
|---|---|---|---|
| Identité · panel v0 (48 concepts) | 31.10 v1 | https://claude.ai/artifact/F5Laf6mqwAtp7dF4ZVVZBx | `work/missions/2026-10-31-ecran-identite/panel-v0/page.html` |
| Identité · tri du critique à l'aveugle (D203) | 31.10 v1 | https://claude.ai/artifact/JkXn7UbyGCLfXLn3FTW9eN | `work/missions/2026-10-31-ecran-identite/panel-v0/tri-critique.html` |
| Identité · r4 adaptée (D205) | 31.10 v1 | https://claude.ai/artifact/6HGuqpXUoHS3XLnYqj73ci | `work/missions/2026-10-31-ecran-identite/v1/page.html` |

## Agents
- v0 (31.10) : g af688d7c3b4c1d8dc ; w a95dbcb30c165788b ; v a3f468d6fd75b44d7 ; r af505646da84f8574 ; e ae29161fae3410bb7 ; i a270f131ab87e2197 ; z (Fable) a9544f6c979771512 ; u a63ad22afca40541e. La passe 2 repart chez le même agent.

## Reprise
- 31.10 : la mission est ouverte. Le cadrage est en vol (jury e4, inventaire e2).
- 31.10 : cadrage fait par le jury (`cadrage-jury.md` : 13 points tranchés, 6 axes A1 à A6). Brief commun écrit (`BRIEF-AUTEUR.md`). **Les 8 séries v0 sont lancées** (6 concepts chacune, 48 visés), avec boosters-ux. Ensuite : publier le panel dès qu'il est rendu, puis le tri par le critique (Fable), les passes et la page de choix.
- 31.10, vers 15 h (**état courant**) :
  - l'inventaire fin est fait (`inventaire-identite.md`) ;
  - les 8 séries v0 sont en vol (agents dans « ## Agents »).
  À chaque série rendue :
  1. regarder ses captures (L12) ;
  2. la publier sur la page du panel v0, un artefact neuf daté inscrit dans « ## Pages », section `data-voies` ;
  3. puis lancer le tri par un critique Fable unique (`critique/<série>.md`, puis `critique/SYNTHESE.md` : Classement, Candidates,
     Greffes) ;
  4. puis les passes 2 par `SendMessage` aux mêmes agents.
  La question de fond du lint : `button-danger` est à 4,09:1 (e5).
- 31.10 : 3 séries rendues sur 8 : r, u, e. Décision du pilote : **DESIGN.md prime**. Ses rayons sont de 10 et 16 px, alors que le contrôle `controle-commun` S3 attend 2, 4 et 8 px, une règle venue du lot houblons. Le trait de 2 px du + commun vient de l'app. Pour les écrans hors houblons, il faut un profil « sans houblons » de `controle-commun`, qui lise DESIGN.md (à faire avant les passes 2). Les contrôles au-style, fiche, trait et légende ne s'appliquent pas ici.
- 31.10 : 6 séries rendues sur 8 (r, u, e, z, w, g). À corriger avant les passes 2 (voie outils) :
  - `controle-panel` identifie une capture par son nom de fichier : six `capture-haut.png` donnent un faux échec de diversité ;
  - `mots-premier-ecran` compte le texte d'un `<details>` fermé ;
  - `controle-contraste` ne voit pas une bande de fond posée à côté du texte ;
  - le profil « sans houblons » de `controle-commun` (rayons de DESIGN.md : 10, 16 et 24 px).
  Défaut de données relevé par g et par l'inventaire : une recette neuve s'ouvre à 30 L dans un fermenteur de 30 L, donc « plein ».
- 31.10, avant la compaction (**état courant**) : 7 séries v0 rendues sur 8 (r, u, e, z, w, g, v ; les dossiers sont dans v0/ et les RESULTAT dans v0/<série>-serie/ ou v0/<série>1/). **i est encore en vol** (agent a270f131ab87e2197). Prochaine action :
  1. quand i rend, ouvrir quelques captures (L12) ;
  2. publier le panel v0 sur un artefact neuf daté, inscrit dans « ## Pages » ;
  3. corriger les outils (D202 : `controle-panel` par nom de fichier, `<details>` fermé, contraste, profil sans houblons) ;
  4. lancer un critique Fable unique pour le tri (`critique/SYNTHESE.md`) ;
  5. lancer les passes 2 chez les mêmes agents (`## Agents`).
- 31.10 : **les 8 séries v0 sont rendues (48 concepts) et commitées.** En vol :
  - la page du panel (executant ae0de61eea3a6e407, `panel-v0/page.html`), que le pilote publiera dans un artefact neuf ;
  - o1, la correction des outils (auteur a0b178aca728e039d).
  Ensuite : le tri par un critique Fable unique, puis les passes 2. En passe 2, la série i, qui a suivi les rayons de 2, 4 et 8 px, s'aligne sur DESIGN.md (10, 16 et 24 px).
- 31.10 : **le panel v0 est publié** (F5Laf6mqwAtp7dF4ZVVZBx). Ensuite : le tri par un critique Fable unique, puis les passes 2.
- 31.10, après le panel (**état courant**) : ses mots dans SPEC-BRASSEUR ; D203 : le panel sert d'épreuve à l'aveugle du critique ; écrans suivants allégés.
  Une interruption a arrêté trois agents, qui ne se reprennent pas : il faut un agent neuf, sur sa demande.
  1. **Le critique** (a470b5e82b5327d57) : `critique/g.md`, `r.md`, `v.md` et `w.md` sont écrits. Il reste e, i, z et u, puis `SYNTHESE.md` :
     - le classement des 48, avec un verdict par concept (très bien, moyen ou très mauvais ; au moins 6 de chaque extrême) ;
     - 5 candidates ;
     - les greffes.
     Un critique neuf reprend au même format, sans rien savoir de son avis.
  2. **o1** (a0b178aca728e039d) : ses changements dans les 5 outils de `tournoi/outils/` ne sont pas commités, et il n'y a pas de RESULTAT. Il faut les relire, puis finir ou annuler.
  Ensuite : la passe 2 sur les 5 candidates seulement, puis une page neuve (le classement du critique et la passe 2), pour qu'il compare.
- 31.10, relance sur sa demande (« Reprend, c'est une demande explicite ») : un critique neuf fait le tri à l'aveugle (ab55281b7c63f8839 ; e, i, z, u et SYNTHESE) ; un auteur neuf finit o1 (adc66a3d9e7549c50). Ensuite, la passe 2 sur les 5 candidates, puis une page neuve.
- 31.10 : **le tri est fait** (`critique/SYNTHESE.md`) : 8 très bien, 34 moyen, 6 très mauvais. Candidates : e1, z3, w3, r4 et w6. La page du tri est publiée (JkXn7UbyGCLfXLn3FTW9eN), pour qu'il compare. Ensuite : quand o1 rend, la passe 2 des 5 candidates, avec les greffes de SYNTHESE (agents e, z, w ×2, r).
- r4 choisie : « Est le meilleur, mais limite peut être un peu trop, au je veux plus d'ébullition, SI je change de fermenteur... Quelques adaptations mais si non c'est bien ! » (D205). La passe 2 sur 5 candidates est annulée : seule r4 est reprise avec ses adaptations, dans `v1/r4-a/`, par l'agent de la série r ; le critique la juge ensuite, puis une page neuve la montre à côté de r4.
- 31.10 : **o1 est fini** (22 témoins verts ; les profils `--profil=sans-houblons` de mots et de contraste ; sur houblons, rien ne bouge). **r4-a** est rendue, et le critique demandait deux retouches (`v1/r4-a/CRITIQUE.md`), faites : le « › » au bout des règles, le pointillé sous les nombres. La page est publiée (6HGuqpXUoHS3XLnYqj73ci). Ensuite, sur son accord : le registre `ecrans.json` (r4-a), puis le port dans l'app (auteur Sonnet, critique Fable, baseline, lint). Au port, « ~27 L avant ébullition » vient du moteur (`brewingMath.ts`), pas de l'addition de la maquette.
- 31.10, soir : son verdict sur r4-a : « ça semble vraiment bien ». Ses deux questions ont été vérifiées dans la maquette, à 1280 px :
  - la saisie au clavier marche ;
  - une ébullition de 240 min donne une règle de 0 à 270 ;
  - un fermenteur de 60 L donne une règle de 0 à 70.
  Un trou a été vu : la cuve qui déborde (~67 L dans 45 L) ne le dit pas. Il est ajouté au portage.
  **Le portage p1 est en vol** (auteur ac33fb2cfc4d362b6, `voies/p1-port/`, registre `ecrans-app.json`, D206). Ensuite : l'exécutant fait les captures Chrome, puis le critique juge.
- 31.10, soir : **accord de l'utilisateur**. Une fois r4-a portée, on la joue sur l'app déployée, et on peut écrire des recettes, sans données inutiles (SPEC, [[autonomie-decisions]]).
  Suite :
  1. p1 rend ;
  2. l'exécutant fait les captures Chrome en local, puis le critique juge ;
  3. rejeu complet dans `deploy-63130965` ;
  4. déploiement de hosting ;
  5. parcours sur l'app en ligne avec **une seule recette de test** (un brouillon), dans son Chrome ou le navigateur intégré : 390 et 1280 px ; saisie au clavier, 240 min, fermenteur 60 L, cuve qui déborde ;
  6. captures regardées ;
  7. le brouillon remis dans son état, ou abandonné par le geste de l'app.
- 31.10, nuit : rejeu `voies --approuver` : **VOIES OK 2/2** (G2 de p1-port réécrit en `&& echo TESTS IDENTITE OK` : la sortie colorée
  de vitest cassait le motif), manifeste 21dd75b3. **Verdict du critique sur le port : À CORRIGER** (`critique/VERDICT-port.md`,
  11 écarts dont 1 bloquant et 4 majeurs) : au repos c'est r4-a ; au toucher, l'ancien bloc revient (alertes redites, tableau de
  Matériel, deux boutons de repères), et le bandeau se casse en deux à 1280. Voie **p2-correctifs** écrite (auteur Sonnet, agent neuf,
  contrôles qui échouent d'abord) ; test de compréhension en vol. Le déploiement attend ses critères et un second regard du critique.
