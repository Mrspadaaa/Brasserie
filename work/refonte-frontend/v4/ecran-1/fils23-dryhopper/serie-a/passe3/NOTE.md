# a1, passe 3 : « Le rail sous le pouce », sans vide (voie r7a3, 23.10)

Base : la passe 2, intacte dans `../passe2`. Régénérer : `node generer.mjs`. Les captures et le geste joué au doigt
viennent de `node captures/travail/capturer.mjs`, dont la sortie est dans `captures/travail/geste.json`.
`captures/travail/panel.json` donne le remplissage. `socle.mjs` est la copie du socle de la passe 2, avec en plus le
certificat du lot dans la fiche.

## Passe 3

**Remplissage du premier écran : 0,41 → 0,64** (`controle-panel.mjs`). r6n2 est à 0,70. Le vide est rempli par des
idées : MOTS passe de 79 à 77.

Ajouts :
- **Un ruban par famille sous chaque barre** (greffe des mini-rubans de d8 et du dock-profil de e1). Ce sont les
  24 moments du rail, alignés sur ses positions. La couleur de la famille fonce avec sa valeur ; le trait orangé
  marque le hors-style, le hachuré l'inconnu ; la case du moment est cerclée. On voit, famille par famille, où elle
  monte avant de glisser : le résineux sort partout, et le floral ne vient qu'à froid.
- **L'amertume devient une ligne de la figure**, avec son ruban d'IBU (greffe de la table d'IBU de b4) : orangé là où
  c'est trop amer (de 60′ au whirlpool), gris ailleurs. Sa valeur est « 60+? » à cru (la chaîne de d1) et « ≈119 » à
  20′.
- **Loupe à mini-barres chiffrées** (e5). Sous chaque moment voisin, une barre de floral et son chiffre : à 20′,
  ≈+9 · ≈+10 · ≈+11 · ≈+12 · ~+13. La loupe fait 66 px par cran contre 11,8 px sur le rail.
- **La ligne du doigt rangée contre ★** (b4), quand on s'écarte du meilleur. Exemple : « contre ★ actif · 2 j :
  floral ≈−11 · résineux ≈−7 · trop amer ».
- **La courbe d'activité de la levure** (f5, g6) : un trait fin sur les cases du dock, qui monte au début de l'actif
  et retombe vers J+5. Le « ? » précise « à confirmer à la densité ».
- **Les pastilles d'étape trop amères soulignées en orangé** : 60′–0′ et WP.
- **Le certificat du lot dans la fiche** (d5, b4) : huile 2,5 mL/100 g, linalol 0,4 %, géraniol 0,6 %, myrcène
  45,4 %. Il est repris de `fils20-dryhop/d4/moteur-lot20.json` et balisé mesuré, CoA ID7-2573.

Rapprochés :
- barres et pistes plus épaisses (18 px), rubans de 15 px ;
- figure qui s'étire jusqu'au dock, sans trou entre la source et le dock.

Retouches du verdict :
- « sans gain » en pointillé et pâle, non plus en hachuré : la hachure reste à l'inconnu ;
- « au levurage » au lieu de « au pitch », dans le « ? » ;
- plus aucun code de source (E03, E10) au premier plan : l'auteur et l'année seulement.

Corrections :
- les cases du ruban et du dock ne se chevauchent plus entre deux étapes : leur largeur vaut 85 % de l'écart au
  voisin ;
- toutes les classes sont préfixées par composant (L26) : `a1rep-`, `a1fig-`, `a1bas-`, `a1dock-`, `a1et-`,
  `a1jr-`, `a1prof-`, `a1rail-`, `a1loupe-`.

## Baseline

Elle est inchangée depuis la passe 2 (voir `../passe2/NOTE.md`).
- **y1b** : le rail par 5′, « Face à ta stout », la jauge d'amertume (devenue la ligne Amertume, zone 50–70, à cru
  hachuré « ? ») et le dock sous le pouce avec sa loupe.
- **x3b réduit en fin de frise** : les jours.
- **Levure en pont**, avec un texte qui suit le moment.
- **Les acquis** :
  - α du lot puis plage ;
  - rôle en mot ;
  - stock en icône ;
  - au style avec Absolu (les rubans suivent la lentille) ;
  - pictos au trait, avec épicé en cannelle et clou croisés ;
  - « ? » ;
  - appui long vers la vraie fiche.

Écarts, chacun avec sa raison :
- **Pépins, Melon, Épicé restent repliés**, pour tenir 80 mots.
- **La ligne « Résineux déjà hors du style »** est dans le « ? ». Sa barre et son ruban le montrent.
- **Pas de radar sur l'écran**, seulement dans la fiche.

## Contrôles (passe 3, tous obligatoires)

| critère | sortie |
|---|---|
| G1 `controle-commun --sans=mots` | **COMMUN OK** |
| G2 `mots-premier-ecran --max=80` | **MOTS OK**, 77 mots |
| G3 `controle-une-question --edition` | **UNE-QUESTION OK (1 groupe libre : moment)** |
| G4 `controle-acquis --outil=dryhopper` | **ACQUIS OK (4/4 : geste, frise, valeurs, levure)**, au repos |
| G5 `verifier-page` | **PAGE OK** : 390 px, sans erreur |
| G6 `controle-panel --plancher=0.55 --part-vides=0` | **PANEL OK** : a1 0,643, r6n2 0,704 |

Geste au doigt (`geste.json`) : d'actif · 2 j (~+22, 60+?, Pomona ~+13 agrumes) à 20′ (≈+11, ≈119 trop amer,
« contre ★ … », « jamais mesuré à ce moment »). Loupe : 5 voisins.

Captures ouvertes : `captures/a1-premier-ecran.png`, `captures/a1-toucher-390.png`, `captures/a1-390.png`.
