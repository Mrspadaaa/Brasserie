# sbz6 · La file des 318

- Chaleur : **chaude** (série z, forme libre ; la baseline suivie : pictos au trait de la planche v3 dont épicé = cannelle et clou croisés, couleurs des familles, α et rôle en mot, au style par défaut avec l'absolu à un toucher et la zone 16D, stock en petit badge, thème blanc, croix pour sortir, Annuler à côté de Remplacer, légende derrière « ? », fiche au long appui, « ~ » pour le simulé, « ? » et hachures pour l'inconnu).
- Question : « Lequel à la place de Nugget ? » ; contexte fixé : 60′, 46 g → 60 IBU égal, stout 16D ; facteur libre : le remplaçant.
- Données : moteur v4 `substitutes` (Nugget 46 g, recette S1, 318 candidats, poids 0,2 / 0,2 / 0,6 à 60′ ; whirlpool 0,6 / 0,3 / 0,1), fiches du catalogue et du stock (`data.ts`, `describeFamilies`, `familyWords`), échelle 16D (`getStyleScale`). Rien d'autre.

## Idée
Les 318 houblons du catalogue, un trait chacun, rangés par ressemblance à Nugget (scores du moteur à 60′, tout le catalogue recalculé) : la densité se voit, les paliers aussi. Ton stock en drapeaux avec son rang (Sabro 27e, Idaho 7 34e, Nelson Sauvin 73e, Galaxy 80e, Target 213e, Citra cryo 215e : « cher pour amériser »). En bas, la même file Nugget déplacé au whirlpool : la file se renverse (Target 2e, Idaho 7 4e, Nelson Sauvin 236e).

## Ce qui tient
Honnêteté rare : on voit où tombe ce qu'on a dans toute la file, et que 25 houblons sont ≥ 95 ; le moment change la réponse, montré sans geste.

## Ce qui casse
Drapeaux serrés entre 74 et 86 (Cascade / Hallertau Blanc se chevauchent) ; 112 mots hors données avec les deux files et leurs libellés.

## Sorties des contrôles (24.10)
- Baseline : COMMUN OK (controle-commun --page=etat.html --sans=mots, 24.10 : couleurs, au-style, survol, blocs, contraste, fiche, standard, trait, legende, parlant, brutes OK).
- Panel : PANEL OK sur les 8 premiers écrans (remplissage médian 0,55, 1 sous 0,50 ; ressemblance 0,89 ; 0 paire presque identique).
- Indicatifs, joués une fois : UNE-QUESTION : faux positif « moment » (texte des drapeaux vide), 2 fautes. SANS-FAMILLE : Nelson Sauvin, Hallertau Blanc sans part « autres ». MOTS --sans-donnees : 112 (> 80).
