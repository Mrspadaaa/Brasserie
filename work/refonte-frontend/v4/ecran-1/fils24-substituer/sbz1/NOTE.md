# sbz1 · La cible

- Chaleur : **chaude** (série z, forme libre ; la baseline suivie : pictos au trait de la planche v3 dont épicé = cannelle et clou croisés, couleurs des familles, α et rôle en mot, au style par défaut avec l'absolu à un toucher et la zone 16D, stock en petit badge, thème blanc, croix pour sortir, Annuler à côté de Remplacer, légende derrière « ? », fiche au long appui, « ~ » pour le simulé, « ? » et hachures pour l'inconnu).
- Question : « Lequel à la place de Nugget ? » ; contexte fixé : 60′, 46 g → 60 IBU égal, stout 16D ; facteur libre : le remplaçant.
- Données : moteur v4 `substitutes` (Nugget 46 g, recette S1, 318 candidats, poids 0,2 / 0,2 / 0,6 à 60′ ; whirlpool 0,6 / 0,3 / 0,1), fiches du catalogue et du stock (`data.ts`, `describeFamilies`, `familyWords`), échelle 16D (`getStyleScale`). Rien d'autre.

## Idée
Nugget au centre ; chaque remplaçant est un point placé à la distance de son score (~ moteur, 60′) : plus il est près, plus il lui ressemble. Haut : α plus fort, bas : plus faible ; droite : garde beaucoup de ses familles (au style : les trois attendues en 16D), gauche : peu. Point plein : stock ; cercle : à acheter ; pointillé : huiles inconnues, score ouvert (79–99). Un toucher ouvre la carte du point (dose à 60 IBU, α, garde / perd, stock, jauge 16D).

## Ce qui tient
La réponse se lit en trois secondes (près = bon), le stock se voit sans mot, l'inconnu ne vaut jamais 0 (anneau pointillé et plage). Les 17 candidats tiennent sur un écran.

## Ce qui casse
Les étiquettes se chevauchent encore près du centre (Helios / Loral, Magnat / Yeoman) et en bas (Motueka / Cascade sur « α plus faible ») ; la disposition angulaire est une convention de cette page, pas du moteur (dite dans la légende).

## Sorties des contrôles (24.10)
- Baseline : COMMUN OK (controle-commun --page=etat.html --sans=mots, 24.10 : couleurs, au-style, survol, blocs, contraste, fiche, standard, trait, legende, parlant, brutes OK).
- Panel : PANEL OK sur les 8 premiers écrans (remplissage médian 0,55, 1 sous 0,50 ; ressemblance 0,89 ; 0 paire presque identique).
- Indicatifs, joués une fois : UNE-QUESTION : 1 faute, le bouton « Remplacer par Nelson Sauvin › » lu comme un sélecteur de houblon (c'est l'action du pied). SANS-FAMILLE : Nelson Sauvin et Hallertau Blanc montrés sans part « autres » (D100, conditionnel). MOTS --sans-donnees : 67.
