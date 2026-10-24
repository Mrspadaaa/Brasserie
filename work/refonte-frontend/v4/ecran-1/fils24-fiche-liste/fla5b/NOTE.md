# fla5b — passe 2 de fla5 (série a), candidate n° 5 du conseil fl

- **Chaleur : tiède** (forme de la série a, les mots d'abord ; lecture au style).
- Question : « Que sent ce houblon, dit avec ses mots ? » La v0 `fla5/` reste intacte.
- Captures (`../captures/`) : `fla5b-nelson.png`, `fla5b-nugget.png` (même premier écran, 390 × 844, fiche ouverte par un vrai appui long), `fla5b-page.png` (Nelson Sauvin, feuille dépliée) ; états : `fla5b-nugget-absolu.png` (toucher sur « absolu »), `fla5b-nelson-aide.png` (toucher sur « ? »). `fla5b-premier-ecran.png` = Nelson, doublon du script.
- Générer : `node ../fla1/commun/generer.mjs fla5b` puis `node ../fla1/commun/capturer.mjs fla5b`.

## Retouches du verdict (point 5) et leur mesure
| Retouche | Fait | Mesure sur la capture |
|---|---|---|
| Sur Nelson, « Le style n'en dit rien » en tête, en grosses tuiles (greffe flc8) | L'étagère la plus pleine (somme des fiches qui disent ses mots) passe en tête, en tuiles de 66 px, mot en 22 px ; les autres restent en pastilles | Nelson : 5 tuiles en tête (vin blanc 2/2, raisin 2/2, groseille à maquereau 2/2, fruité 2/2, sauvignon blanc 1/2). Nugget : « Ta stout 16D les attend » en tuiles (herbacé 2/4, floral 1/4, géranium 1/4, terreux 1/4 ; égalité 5 contre 5 avec « tolère », l'attendu reste devant) |
| Jamais un 0 en gros chiffre | Le bloc « 0 mots que ta stout attend · 0 déjà trop marqués » est retiré ; une étagère vide ne s'affiche pas | Nelson : aucune étagère « attend » ni « trop marqué », aucun 0 à l'écran |
| « (classé) » → « rangé par le fournisseur » | Sur pastille et tuile | Nelson : agrumes 1/2 et épicé 1/2 « rangé par le fournisseur » ; Nugget : épicé 1/4 |
| Radar à sa taille, avant (« Mettre le radargraph avant ») | Radar g1 légendé (rayon 62, 12 axes nommés, « ? » hachurés) sous l'en-tête, avant les étagères | ~190 px de haut, tous les axes lisibles |
| « dégustation 18.10 » derrière le « ? » | Sous-titres retirés ; un « ? » de 26 px ouvre une aide fermée au repos (style 16D, dégustation du 18.10, « rangé par le fournisseur », non décrites, n/N) | `fla5b-nelson-aide.png` |
| Un seul α, celui de g1 | En-tête du socle : Hopsteiner 2025, avec le lot | Nelson « α 12–14 % lot 9,6 % » ; Nugget « α 11–14 % lot 13 % » |

## Recompte (L14), chaque nombre contre `pack-fiches.json`
- Nelson Sauvin : α 12–14 % (Hopsteiner 2025), lot 9,6 %, stock 100 g ; radar Agrumes 1/2, Épicé 1/2, 10 « ? » ; 7 mots, 2 fiches ; vin blanc 2/2 (Beer Maverick, Hopsteiner « White wine »), raisin 2/2 (« grape »), groseille à maquereau 2/2 (« gooseberry »), fruité 2/2 (« fruity »), sauvignon blanc 1/2 (Beer Maverick) ; agrumes et épicé 1/2 : la ligne « Familles déclarées » de Hopsteiner.
- Nugget : α 11–14 %, lot 13 %, épuisé (0 g) ; radar Résineux, Tropicaux, Herbacé, Floral 2/4, Agrumes, Terreux, Épicé 1/4 ; 12 mots, 4 fiches ; boisé 2/4, ananas 2/4, herbacé 2/4 (un mot de Beer Maverick et la famille déclarée par Hopsteiner), les autres 1/4 ; épicé 1/4 rangé par le fournisseur.

## Pour G3 (une question)
La page au repos (l'étape Houblons derrière la fiche) porte désormais le titre « Que sent ce houblon ? », une ligne de contexte (Stout 16D, SafAle US-05) et le groupe des ajouts proposés balisé `data-libre="houblon"` : au repos, on choisit le houblon dont on lit la fiche ; dans la fiche, le houblon, sa fiche et le style sont fixés. Option `etape` du socle, sans effet sur les v0 (régénérées à l'identique, sans le balisage).

## Ce qui casse encore
- Pas de « 1er » sur vin blanc (nommé en premier par les deux fiches) : à reprendre si le critique le demande.
- Nugget : la liste dépasse le premier écran (le « hors des 12 », gingembre, est sous le pli).
- Herbacé 2/4 de Nugget mêle un mot senti et un classement : compté comme mot (ce que dit le pack).

## Sorties des contrôles (fla5b seule)
- G2 `controle-commun.mjs … fla5b --page=etat.html --sans=mots` → COMMUN OK (couleurs, au-style, survol, blocs, contraste, fiche, standard, trait, legende, parlant, brutes).
- G3 `controle-une-question.mjs … fla5b --page=etat.html` → UNE-QUESTION OK (1 groupe libre : houblon).
- G4 `mots-premier-ecran.mjs … fla5b --max=80 --page=etat.html --sans-donnees` → fla5b 51 mots (hors données), MOTS OK.
- `controle-fiche.mjs` → FICHE OK 1/1.
- `controle-sans-famille.mjs` (indicatif) → ECHEC : il lit la page au repos, fiche fermée ; ouverte, les 5 mots hors des 12 de Nelson sont l'étagère de tête.
