# sbz8 · Le duo : deux du stock pour un Nugget

- Chaleur : **chaude** (série z, forme libre ; la baseline suivie : pictos au trait de la planche v3 dont épicé = cannelle et clou croisés, couleurs des familles, α et rôle en mot, au style par défaut avec l'absolu à un toucher et la zone 16D, stock en petit badge, thème blanc, croix pour sortir, Annuler à côté de Remplacer, légende derrière « ? », fiche au long appui, « ~ » pour le simulé, « ? » et hachures pour l'inconnu).
- Question : « Lequel à la place de Nugget ? » ; contexte fixé : 60′, 46 g → 60 IBU égal, stout 16D ; facteur libre : le remplaçant.
- Données : moteur v4 `substitutes` (Nugget 46 g, recette S1, 318 candidats, poids 0,2 / 0,2 / 0,6 à 60′ ; whirlpool 0,6 / 0,3 / 0,1), fiches du catalogue et du stock (`data.ts`, `describeFamilies`, `familyWords`), échelle 16D (`getStyleScale`). Rien d'autre.

## Idée
Aucun houblon seul du stock ne garde les sept familles de Nugget ; deux ensemble le peuvent. Chaque duo partage les 60 IBU (part d'IBU ~ par l'α du lot, IBU/g du moteur à 60′) : Idaho 7 20 g + Nelson Sauvin 36 g couvre 7/7 (3/3 attendues 16D), tout en stock. Cases : bleu / vert = lequel couvre, hachuré = perdu, « + » = apporté. Quatre duos, et « seul : Nelson Sauvin, 2/7 ».

## Ce qui tient
Une réponse que personne ne proposait, calculable et honnête (le moteur ne note pas un duo : seules familles et doses sont calculées, écrit) ; le stock suffit, dit par ligne.

## Ce qui casse
Le facteur libre devient un couple ; la couverture par familles ignore l'intensité et la dose de chaque part sur le nez ; 93 mots hors données.

## Sorties des contrôles (24.10)
- Baseline : COMMUN OK (controle-commun --page=etat.html --sans=mots, 24.10 : couleurs, au-style, survol, blocs, contraste, fiche, standard, trait, legende, parlant, brutes OK).
- Panel : PANEL OK sur les 8 premiers écrans (remplissage médian 0,55, 1 sous 0,50 ; ressemblance 0,89 ; 0 paire presque identique).
- Indicatifs, joués une fois : UNE-QUESTION : OK (1 groupe libre : houblon, 4 duos). SANS-FAMILLE : Nelson Sauvin sans part « autres ». MOTS --sans-donnees : 93 (> 80).
