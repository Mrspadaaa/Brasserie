# fla5c — passe 3 légère de fla5b (série a), après le REJET du critique (PASSE2.md)

- **Chaleur : tiède** (forme de la série a, les mots d'abord ; lecture au style).
- Question : « Que sent ce houblon, dit avec ses mots ? » La v0 `fla5/` et la passe 2 `fla5b/` restent intactes.
- Captures (`../captures/`) : `fla5c-nelson.png`, `fla5c-nugget.png` (même premier écran, 390 × 844, fiche ouverte par un vrai appui long), `fla5c-page.png` (Nelson Sauvin, feuille dépliée) ; états : `fla5c-nugget-absolu.png` (toucher sur « absolu »), `fla5c-nelson-aide.png` (toucher sur « ? »). `fla5c-premier-ecran.png` = Nelson, doublon du script.
- Générer : `node ../fla1/commun/generer.mjs fla5c` puis `node ../fla1/commun/capturer.mjs fla5c`.

## Retouches du verdict (point 5) et leur mesure
| Retouche | Fait | Mesure sur la capture |
|---|---|---|
| Sur Nelson, « Le style n'en dit rien » en tête, en grosses tuiles (greffe flc8) | L'étagère la plus pleine (somme des fiches qui disent ses mots) passe en tête, en tuiles de 66 px, mot en 22 px ; les autres restent en pastilles | Nelson : 5 tuiles en tête (vin blanc 2/2, raisin 2/2, groseille à maquereau 2/2, fruité 2/2, sauvignon blanc 1/2). Nugget : « Ta stout 16D les attend » en tuiles (herbacé 2/4, floral 1/4, géranium 1/4, terreux 1/4 ; égalité 5 contre 5 avec « tolère », l'attendu reste devant) |
| Jamais un 0 en gros chiffre | Le bloc « 0 mots que ta stout attend · 0 déjà trop marqués » est retiré ; une étagère vide ne s'affiche pas | Nelson : aucune étagère « attend » ni « trop marqué », aucun 0 à l'écran |
| « (classé) » → « rangé par le fournisseur » | Sur pastille et tuile | Nelson : agrumes 1/2 et épicé 1/2 « rangé par le fournisseur » ; Nugget : épicé 1/4 |
| Radar à sa taille, avant (« Mettre le radargraph avant ») | Radar g1 légendé (rayon 62, 12 axes nommés, « ? » hachurés) sous l'en-tête, avant les étagères | ~190 px de haut, tous les axes lisibles |
| « dégustation 18.10 » derrière le « ? » | Sous-titres retirés ; un « ? » de 26 px ouvre une aide fermée au repos (style 16D, dégustation du 18.10, « rangé par le fournisseur », non décrites, n/N) | `fla5c-nelson-aide.png` |
| Un seul α, celui de g1 | En-tête du socle : Hopsteiner 2025, avec le lot | Nelson « α 12–14 % lot 9,6 % » ; Nugget « α 11–14 % lot 13 % » |

## Recompte (L14), chaque nombre contre `pack-fiches.json`
- Nelson Sauvin : α 12–14 % (Hopsteiner 2025), lot 9,6 %, stock 100 g ; radar Agrumes 1/2, Épicé 1/2, 10 « ? » ; 7 mots, 2 fiches ; vin blanc 2/2 (Beer Maverick, Hopsteiner « White wine »), raisin 2/2 (« grape »), groseille à maquereau 2/2 (« gooseberry »), fruité 2/2 (« fruity »), sauvignon blanc 1/2 (Beer Maverick) ; agrumes et épicé 1/2 : la ligne « Familles déclarées » de Hopsteiner.
- Nugget : α 11–14 %, lot 13 %, épuisé (0 g) ; radar Résineux, Tropicaux, Herbacé, Floral 2/4, Agrumes, Terreux, Épicé 1/4 ; 12 mots, 4 fiches ; boisé 2/4, ananas 2/4, herbacé 2/4 (un mot de Beer Maverick et la famille déclarée par Hopsteiner), les autres 1/4 ; épicé 1/4 rangé par le fournisseur.

## Passe 3 : la correction du REJET (D119, D116), puis les décisions du pilote
- L'étape garde l'en-tête de sa base, tel quel : `h1` « ‹ Houblons 3/7 », « 16D hypothèse », IBU 60 · OG 1,066 · EBC 70 (haut de `fla5c-nelson.png`, sous le voile).
- Sous l'en-tête, le choix du houblon (greffe flc8b / fld8b) : une pastille par houblon, à sa couleur, sur deux lignes à 390 px (Nugget, Nelson Sauvin, Citra cryo / Motueka, Cascade), sans défilement caché ; seul facteur libre (`data-libre="houblon"`). Un toucher ou un appui long change la fiche.
- La fiche (feuille g1 par-dessus l'étape) a son propre en-tête : son titre `h2` « Que sent Nelson Sauvin ? », le ⊙, le stock, l'α de g1 et le lot avec sa jauge, l'usage, la ligne de contexte « Stout 16D · SafAle US-05 », la croix ronde de 44 px.
- « 1er » sur vin blanc (nommé en premier par les deux fiches), une seule fois ; sur Nugget, sur boisé (nommé en premier par Hopsteiner boutique US et Yakima Chief Hops).
- Repris de fla5b sans changement : radar g1 à sa taille, lentille au style / absolu, « 7 mots, 2 fiches », le « ? » et son aide (la légende de la page, 12 familles nommées), les étagères, la tête en tuiles, « rangé par le fournisseur », aucun 0.
- Sans controle-fiche : la fiche est montrée ouverte, le geste d'appui long n'est pas le sujet de ce fil de fer. Aucun `data-role="fiche"` dans la page (le marqueur posé pour le contrôle à la version précédente est retiré).
- Page propre à fla5c (`page.mjs`, appelée par le socle commun) ; fla5 et fla5b restent telles quelles.

## Ce qui casse encore
- UNE-QUESTION sans levée échoue sur le titre : le premier titre de l'écran est le `h1` « Houblons 3/7 » de la base, la question est le titre de la feuille. Avec `--regle-n1` (l'étape garde l'en-tête de sa base), OK.
- Règle de repli de flb3b non greffée.
- Nugget : la liste dépasse le premier écran (le « hors des 12 », gingembre, est sous le pli).
- Herbacé 2/4 de Nugget mêle un mot senti et un classement : compté comme mot (ce que dit le pack).

## Sorties des contrôles (fla5c seule)
- `controle-commun.mjs … fla5c --page=etat.html --sans=mots,fiche` → COMMUN OK (couleurs, au-style, survol, blocs, contraste, standard, trait, legende, parlant, brutes ; mots et fiche sautés).
- `controle-une-question.mjs … fla5c --page=etat.html` → UNE-QUESTION ECHEC 1 problème : « le titre « Houblons 3/7 » ne pose pas une question » (libres : houblon, 5 contrôles ; contexte : base, levure).
- `controle-une-question.mjs … fla5c --page=etat.html "--regle-n1=étape de la base v4.10 (h1 Houblons 3/7) gardée ; question et contexte dans la feuille"` → UNE-QUESTION OK (1 groupe libre : houblon).
- `mots-premier-ecran.mjs … fla5c --max=80 --page=etat.html --sans-donnees` → 77 mots (hors données), MOTS OK.
