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
