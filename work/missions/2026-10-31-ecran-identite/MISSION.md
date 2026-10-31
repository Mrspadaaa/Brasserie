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

## Reprise
- 31.10 : la mission est ouverte. Le cadrage est en vol (jury e4, inventaire e2).
