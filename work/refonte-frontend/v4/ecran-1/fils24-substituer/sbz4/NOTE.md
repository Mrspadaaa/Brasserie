# sbz4 · La règle à calcul

- Chaleur : **chaude** (série z, forme libre ; la baseline suivie : pictos au trait de la planche v3 dont épicé = cannelle et clou croisés, couleurs des familles, α et rôle en mot, au style par défaut avec l'absolu à un toucher et la zone 16D, stock en petit badge, thème blanc, croix pour sortir, Annuler à côté de Remplacer, légende derrière « ? », fiche au long appui, « ~ » pour le simulé, « ? » et hachures pour l'inconnu).
- Question : « Lequel à la place de Nugget ? » ; contexte fixé : 60′, 46 g → 60 IBU égal, stout 16D ; facteur libre : le remplaçant.
- Données : moteur v4 `substitutes` (Nugget 46 g, recette S1, 318 candidats, poids 0,2 / 0,2 / 0,6 à 60′ ; whirlpool 0,6 / 0,3 / 0,1), fiches du catalogue et du stock (`data.ts`, `describeFamilies`, `familyWords`), échelle 16D (`getStyleScale`). Rien d'autre.

## Idée
Une règle à calcul : l'α en haut (échelle log), la dose pour les mêmes 60 IBU en bas (46 g × 13 ÷ α, à 60′). Nugget est le curseur. Les houblons du stock sont des pins pleins à l'α du lot, la dose se lit juste au-dessus (Nelson Sauvin 9,6 → 62 g) ; les variétés à acheter sont des traits sur leur plage variétale, la dose devient une plage (Magnat 37–54 g). Un toucher ouvre la carte ; dessous, les plus proches et ce qu'ils gardent.

## Ce qui tient
Le réflexe du brasseur (« α plus bas, plus de grammes ») devient un objet qu'on lit ; les plages restent des plages ; le manque de stock est en orangé sur le pin.

## Ce qui casse
L'arôme n'est que dans la carte et la liste du bas, pas sur la règle ; le score du moteur est secondaire ici.

## Sorties des contrôles (24.10)
- Baseline : COMMUN OK (controle-commun --page=etat.html --sans=mots, 24.10 : couleurs, au-style, survol, blocs, contraste, fiche, standard, trait, legende, parlant, brutes OK).
- Panel : PANEL OK sur les 8 premiers écrans (remplissage médian 0,55, 1 sous 0,50 ; ressemblance 0,89 ; 0 paire presque identique).
- Indicatifs, joués une fois : UNE-QUESTION : faux positif « moment » sur les pins (texte vide lu) ; 1 groupe libre houblon. SANS-FAMILLE : Nelson Sauvin, Hallertau Blanc sans part « autres ». MOTS --sans-donnees : 83 (> 80).
