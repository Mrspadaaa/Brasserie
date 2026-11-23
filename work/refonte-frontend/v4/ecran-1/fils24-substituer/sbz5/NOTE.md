# sbz5 · Mot pour mot

- Chaleur : **chaude** (série z, forme libre ; la baseline suivie : pictos au trait de la planche v3 dont épicé = cannelle et clou croisés, couleurs des familles, α et rôle en mot, au style par défaut avec l'absolu à un toucher et la zone 16D, stock en petit badge, thème blanc, croix pour sortir, Annuler à côté de Remplacer, légende derrière « ? », fiche au long appui, « ~ » pour le simulé, « ? » et hachures pour l'inconnu).
- Question : « Lequel à la place de Nugget ? » ; contexte fixé : 60′, 46 g → 60 IBU égal, stout 16D ; facteur libre : le remplaçant.
- Données : moteur v4 `substitutes` (Nugget 46 g, recette S1, 318 candidats, poids 0,2 / 0,2 / 0,6 à 60′ ; whirlpool 0,6 / 0,3 / 0,1), fiches du catalogue et du stock (`data.ts`, `describeFamilies`, `familyWords`), échelle 16D (`getStyleScale`). Rien d'autre.

## Idée
Les fiches face à face, mot pour mot : une ligne par famille, à gauche les mots de Nugget (4 fiches), à droite ceux du remplaçant ; hachuré = perdu, « + » = gagné ; en bas les mots hors roue (vin blanc, groseille à maquereau, raisin pour Nelson Sauvin ; gingembre pour Nugget) qui comptent pour le brasseur et pas pour le score. Puis l'amertume en chiffres (α, β, dose à 60 IBU, stock) et le score décomposé. Onglets de remplaçants en tête.

## Ce qui tient
Rien n'est inventé : chaque mot vient d'une fiche nommée dans la légende ; Nelson Sauvin cesse d'être « ordinaire » (L14) puisqu'on lit ce que les familles ne disent pas.

## Ce qui casse
Le moins rempli du lot (0,48) ; 90 mots hors données, car les mots sont la matière même de la page ; les mots hors roue ne sont pas une « part » dessinée au sens de D100.

## Sorties des contrôles (24.10)
- Baseline : COMMUN OK (controle-commun --page=etat.html --sans=mots, 24.10 : couleurs, au-style, survol, blocs, contraste, fiche, standard, trait, legende, parlant, brutes OK).
- Panel : PANEL OK sur les 8 premiers écrans (remplissage médian 0,55, 1 sous 0,50 ; ressemblance 0,89 ; 0 paire presque identique).
- Indicatifs, joués une fois : UNE-QUESTION : 1 faute, le bouton « Remplacer par … › » lu comme sélecteur. SANS-FAMILLE : Nelson Sauvin sans part « autres » (ses mots sont montrés, en chips). MOTS --sans-donnees : 90 (> 80).
