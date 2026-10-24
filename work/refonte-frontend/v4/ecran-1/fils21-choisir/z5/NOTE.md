# z5 · Le pari

- **L'idée, en une phrase** : devine, puis vois — cinq cartes, une par question du brasseur (K1 à K5) ; on parie d'un toucher et la carte se retourne sur le simulé des options côte à côte, la vraie valeur qui tranche, le pourquoi en une phrase et un réglage pour rejouer.
- **Pourquoi ça aide à comprendre et à choisir** :
  - chaque question réelle a sa carte : 60′ ou 10′ (agrumes ~8 contre ~31, ~100 IBU contre ~36) ; Citra, Galaxy ou Idaho 7 le plus tropical (~41, ~41, ~19, et le 4MMP ×4–×71 / ×4–? / ?–×18,7 qui tranche, Galaxy sans borne haute) ; Citra 3 j puis Galaxy 7 j ou puis Idaho 7 5 j (~41 contre ~33, rien de plus après 3 j, ordre inconnu) ; Pomona contre US-05 en dry hop actif (agrumes ~36 contre ~30, géraniol → citronellol, convention à valider) ; Citra + Galaxy ensemble contre Citra seul (autant : ~35 contre ~37, la saturation partagée) ;
  - le pari force une attente avant la réponse : c'est ce qui fait retenir ; le score est le sien, l'outil ne juge pas ;
  - chaque carte retournée a son réglage : le moment, la dose, le jour par jour des deux enchaînements (J0 à J10, parJour du moteur), la levure, seul ou ensemble ;
  - la fin dit ce qu'on a appris et les trous des études (Citra contre Cascade jamais mesurés à dose égale, Galaxy sans chiffre, Idaho 7 une seule étude, rien qui croise variété, levure et dry hop).
- **Ce qui tient** : pictos au trait (mini-barres à six familles, nommées en court), zone du style et orangé au-delà, « au style » / absolu, α du lot sur les puces des houblons, légende derrière « ? », appui long vers la fiche, bandes logarithmiques des rapports au seuil. En plus : le pari, le verdict honnête (« Le moteur dit : … », deux bonnes réponses admises quand le moteur ne tranche pas), la confiance et l'IBU sur chaque option, les trous écrits, « ma stout avant » visible dès l'ouverture.
- **Ce qui casse** :
  - au repos, une seule carte et sa question : les contrôles d'ouverture ne voient ni simulation ni levure ni ajout cumulé avant le premier pari (ils sont tous là une carte plus loin : captures pari-1 à pari-5) ; « ma stout avant » donne les pictos et le simulé dès l'ouverture, pas la levure ;
  - un pari ne choisit pas une recette : la page apprend, elle ne compose pas ; « ce que j'ai appris » renvoie aux autres formes pour choisir ;
  - les réponses sont celles du moteur, avec ses conventions (ancre Cascade 2018, poids des composés, levures) ; la carte le dit à chaque fois, mais un pari « perdu » contre une convention peut agacer ;
  - cinq cartes, c'est cinq questions ; les autres (Cascade contre Citra à 60′, dose 8 g/L) ne se jouent qu'avec les réglages de rejeu.
- **À greffer dans la baseline** : la phrase « ce qui tranche en vrai » avec sa bande à côté de chaque comparaison ; le jour par jour en curseur pour un enchaînement ; les trous des études écrits sous les vraies valeurs ; « le moteur dit » comme formule, jamais « bon / meilleur ».
- **Données** : simulé = profils-simules.json (grille, paires, cas K3 avec parJour, cas K4) ; vraies valeurs = base/consolide, fils19-choix/donnees, comparatifs-dryhop.json ; style = style-bands.json.
- **Contrôles** (indicatifs en v0, sauf honnêteté et usage au doigt) :
  - COMMUN OK (MOTS 67, COULEURS, AU-STYLE, SURVOL, BLOCS, CONTRASTE, FICHE, STANDARD, TRAIT, LEGENDE, PARLANT) ; FICHE-BASELINE OK ; ALPHA OK ;
  - au repos, avant tout pari : première passe LISIBLE ECHEC (L1, 0 picto) et SIMULATION ECHEC (S1) ; après l'ajout de « ma stout avant » : LISIBLE OK (6 pictos, 4 mesurées, 7 simulées) et SIMULATION OK (le premier pari fait bouger le simulé) ; CUMUL ECHEC au repos (C1, C2, C3 : la levure, l'ajout cumulé et la biotransformation sont sur les cartes 4 et 5, après le pari) — assumé, le pari est l'idée.
- **Captures** (captures/z5-*.png, regardées) : haut, page, pari-1 (60′ contre 10′, rejeu du moment), pari-2, pari-3 (jour par jour à J2), pari-4 (levures), pari-5 (seul contre ensemble), fin, fiche.
