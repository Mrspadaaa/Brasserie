# r4c — la balance, passe 3 (Malts/sucres 2/7, 31.10)

OK — r4c : 10 corrections faites sur 10 ; remplissage 0,55, sous le 0,80 demandé (écart dit plus bas)

- **Base** : copie de `v1/r4b/` (non modifiée). Même concept : ticket de pesée, plateau sous le pouce, lecture tapable, − +.
- **Chaleur** : chaude (lignée r4). Classes neuves préfixées `r4c-` ; code assemblé par `split/join` (L26).
- **Deux états du plateau, à mettre côte à côte (D126)** : clair par défaut (`r4c-repos.png`), noir de r4b en second état
  (`#noir`, `r4c-plateau-noir.png`). Le brasseur choisit, pas le pilote.

## Corrections (VERDICTS-v1 § r4b et § Commun)
| # | Demandé | Fait | Capture |
|---|---|---|---|
| 1 | Remplissage ≥ 0,80 par de l'information : « Rendement 75 % repère » déplié en carte de repères r4-a | fait (carte : rendement en grand chiffre, OG attendue face au style, teinte face au style) ; mesure 0,55, voir l'écart | `r4c-repos`, `r4c-couleurs` |
| 2 | Échelle des teintes u3 (greffe due) | faite : échelle 0–40 EBC aux teintes de bière, plage du style 21C (6–14) en crochet, repère de la bière, mot « Paille » ; « — » tant qu'une couleur manque | `r4c-repos`, `r4c-couleurs` |
| 3 | Plateau en clair, piste et pouce noir de r4-a | fait : panneau clair cerné, grand chiffre à droite, piste à pouce noir de 30 px, remplie à la teinte du malt (gris foncé tant qu'elle manque, pointillé pour un sucre), graduations | `r4c-repos`, `r4c-sucre` |
| 4 | Garder le plateau noir en second état | fait : `#noir`, la règle défilante de r4b | `r4c-plateau-noir`, `r4c-sucre-noir` |
| 5 | « n couleurs à renseigner », 12 px | fait : « 3 couleurs à renseigner » en 12 px, dans la ligne Teinte ; un toucher ouvre la première | `r4c-repos` |
| 6 | Lecture à 0 sans surbrillance système | fait : la lecture reste vide et montre « 0 » en ocre (indication), le curseur au bout, sans `select()` ; `::selection` transparente | `r4c-ajout-zero` |
| 7 | Greffe z1 : « Créer « X » · sucre : à l'ébullition » | faite : la famille et le moment de la famille courante (`fruit : en fermentation, J+3`) | `r4c-creer` |
| 8 | Greffe u1 : le doublon renvoie à sa masse | faite : « pils » propose « Pilsner Malz déjà 5,0 kg » ; Entrée sélectionne sa ligne et met le curseur dans sa masse, sans créer de ligne (4 lignes avant et après) | `r4c-doublon` |
| 9 | Sucre comme l'app (l. 2464-2530) | fait : nom, pastille « Sucre », moment en mot (« ébullition », « J+3 »), « 100 % ferm. » (« 0 % ferm. » pour le lactose), masse ; un grain dit « 63 % du grain » | `r4c-sucre`, `r4c-fruit`, `r4c-huit` |
| 10 | Rien de tronqué ; piste à l'échelle de l'ingrédient ; annexe hors du premier écran | faits : « Purée de mangue », « Weizenmalz hell », « 0,40 » entiers (contrôle de débordement dans `capturer.mjs`) ; piste 0–2 kg sous 1 kg, sinon la graduation ronde au-dessus d'une fois et demie la masse (5 kg → 0–8), figée pendant le geste ; annexe en `<details>` repliée, à 846 px (390) et 902 px (1280) | `r4c-sucre`, `r4c-fruit`, `r4c-1280` |

- La ligne du ticket passe sur deux rangs (nom et famille, puis moment, part et barre ; masse à droite) : c'est ce qui laisse le nom entier.
- À plus de 4 lignes, le ticket se serre, et les repères se replient à l'ouverture si le pied sortait du premier écran (r4-a :
  « Repères ⌄ ») ; un toucher les rouvre. À 8 lignes : 0,95 écran, plateau en 619–756 px, au-dessus du + (`r4c-huit`).

## Écart : le remplissage
- `controle-panel` (même règle, par capture) : **r4c-repos 0,55** (plateau clair), r4c-plateau-noir 0,58. Avant : r4b 0,47. Sur la même
  mesure, **r4-a (`g1-ebullition-repos`) fait 0,54** : la langue d'Identité, citée comme celle qui « remplit l'écran jusqu'au pied », est
  sous 0,80 elle aussi.
- Pourquoi : la mesure ne compte une rangée que si 2 % de ses pixels s'écartent du blanc de plus de 60. Les fonds de carte (#F5F5F5)
  et l'interligne ne comptent pas. Avec les cartes claires de r4-a, 0,80 ne s'atteint qu'en grisant les fonds, c'est-à-dire en
  remplissant pour le contrôle, ce que le Commun interdit.
- Ce qui a changé à l'œil : les 220 px vides sous le pied de r4b tombent à 21 px (761–782), puis vient le +. Le pied est à 735–761 px,
  comme celui de r4-a (750–775).

## Honnêteté
- OG « ~1,061 » au bandeau et sur la piste : estimation (« ~ ») avec des extraits types du catalogue (PPG : Pilsner 37, Weizen 38,
  flocons 33, dextrose 46), au rendement de 75 % « repère » pour le grain ; un ajout en fermentation n'entre pas dans l'OG. Avec le
  dextrose, ~1,066. L'app affiche « OG — » : voir la décision.
- Plage du style : BJCP 2021, 21C Hazy IPA (OG 1,060–1,085, SRM 3–7, soit 6–14 EBC), la même que u3. Le style de sa recette est
  supposé (« NEIPA ») ; au port, la plage vient du style choisi à Identité.
- Couleurs « ? », EBC « — » et teinte « — » tant qu'une couleur manque. Stock de démonstration.

## Contrôles (31.10, rejoués sur `v2 r4c`)
- `verifier-page.mjs v2/r4c/etat.html --min-images 0` : PAGE OK (390 px, sans erreur).
- `mots-premier-ecran.mjs v2 r4c --page=etat.html --max=80 --profil=sans-houblons` : 80 mots, MOTS OK. Pour tenir 80 : la part n'est
  dite que sur la ligne, l'OG au bandeau et sur la piste, « Teinte » est dite par le picto du verre.
- `controle-contraste.mjs` : CONTRASTE OK, pire 4,85:1.
- `controle-hauteur.mjs v2 r4c --page=etat.html` : HAUTEUR OK (1,04 écran).
- `controle-commun.mjs v2 r4c --page=etat.html --profil=sans-houblons` : COMMUN ECHEC, 1 contrôle : couleurs (1 teinte franche,
  39°, l'ocre et l'échelle des teintes). C'est l'écart voulu de r4b (J7 : aucune couleur connue dans sa recette). Le critique l'a
  jugé acceptable pour z2b, pour la même raison. Tout le reste est OK : mots, survol, blocs, contraste, standard (rayons sur l'échelle
  de DESIGN.md), parlant et brutes.
- `controle-panel.mjs r4c-repos.png r4c-plateau-noir.png` : PANEL OK (médiane 0,58). La diversité est sans objet.
- `capturer.mjs` : CAPTURES OK, sans erreur. Il vérifie : rien de tronqué, l'annexe hors du premier écran (846 et 902 px), « 0,40 »,
  l'ajout à 0 (valeur vide, indication « 0 », aucune sélection), le doublon (focus sur la masse de Pilsner Malz, 5,0, 4 lignes), le
  texte de « Créer », et la piste (pouce à la moitié de 0–2 kg → 1,0).
- `type="number"` : 0.

## Captures (ouvertes une à une)
- 390 : `r4c-repos.png`, `r4c-plateau-noir.png`, `r4c-couleurs.png`, `r4c-sucre.png`, `r4c-sucre-noir.png`, `r4c-fruit.png`,
  `r4c-huit.png`, `r4c-ajout-zero.png`, `r4c-doublon.png`, `r4c-creer.png`.
- 1280 : `r4c-1280.png`.

## Phrase prédite
« Là je vois mes malts, ma densité et ma couleur face au style d'un coup, et le plateau clair, c'est Identité. »

DÉCISION À PRENDRE :
- Le seuil de 0,80 sur `controle-panel` : r4-a fait 0,54 sur cette mesure. Faut-il le garder tel quel, ou mesurer « le pied à moins de
  N px du + » ?
- L'OG estimée au bandeau (« ~1,061 ») alors que l'app affiche « — » : faut-il la même convention pour z2c et u2c ?
- 31.10, pilote : OG ramenée à « — » comme l'app (PPG retirés de la maquette, `brewCompanion.ts:505`) ; captures refaites, PAGE OK.
