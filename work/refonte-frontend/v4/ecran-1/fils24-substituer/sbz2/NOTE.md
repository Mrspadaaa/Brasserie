# sbz2 · La pile : de quoi le score est fait

- Chaleur : **chaude** (série z, forme libre ; la baseline suivie : pictos au trait de la planche v3 dont épicé = cannelle et clou croisés, couleurs des familles, α et rôle en mot, au style par défaut avec l'absolu à un toucher et la zone 16D, stock en petit badge, thème blanc, croix pour sortir, Annuler à côté de Remplacer, légende derrière « ? », fiche au long appui, « ~ » pour le simulé, « ? » et hachures pour l'inconnu).
- Question : « Lequel à la place de Nugget ? » ; contexte fixé : 60′, 46 g → 60 IBU égal, stout 16D ; facteur libre : le remplaçant.
- Données : moteur v4 `substitutes` (Nugget 46 g, recette S1, 318 candidats, poids 0,2 / 0,2 / 0,6 à 60′ ; whirlpool 0,6 / 0,3 / 0,1), fiches du catalogue et du stock (`data.ts`, `describeFamilies`, `familyWords`), échelle 16D (`getStyleScale`). Rien d'autre.

## Idée
Chaque remplaçant est une barre empilée : 60 % d'amertume (α, β, rôle), 20 % d'huiles, 20 % d'arômes, les poids que le moteur prend à 60′ (l'ébullition emporte le nez). Huiles inconnues : segment hachuré, le score se lit en plage (Altus 79–99). En bas de page, le même Nugget déplacé au whirlpool : poids 10 / 30 / 60, la liste se renverse (Target, Idaho 7, Sabro devant ; Nelson Sauvin loin).

## Ce qui tient
On voit pourquoi un score est haut et ce qui manque pour le dire ; la dose à 60 IBU, le stock et le manque (« −15 ») sur chaque ligne ; le moment change la réponse, montré sans geste.

## Ce qui casse
Les pictos des familles communes sont petits (13 px) et atténués au style ; 82 mots hors données au premier écran (la bande des poids porte des mots).

## Sorties des contrôles (24.10)
- Baseline : COMMUN OK (controle-commun --page=etat.html --sans=mots, 24.10 : couleurs, au-style, survol, blocs, contraste, fiche, standard, trait, legende, parlant, brutes OK).
- Panel : PANEL OK sur les 8 premiers écrans (remplissage médian 0,55, 1 sous 0,50 ; ressemblance 0,89 ; 0 paire presque identique).
- Indicatifs, joués une fois : UNE-QUESTION : « moment » détecté dans le texte des lignes (« 37–54 g à a… » tronqué) : faux positif, aucun réglage de moment sur la page. SANS-FAMILLE : Nelson Sauvin sans part « autres ». MOTS --sans-donnees : 82 (> 80).
