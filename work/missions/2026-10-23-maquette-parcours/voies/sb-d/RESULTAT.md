OK — Substituer série d : huit concepts selon le moment, PANEL OK (médiane 0,57), baseline verte

## Fichiers écrits (tous dans Possède)
- `work/refonte-frontend/v4/ecran-1/fils24-substituer/sbd1` à `sbd8` : `etat.html`, `NOTE.md`, `concept.mjs` (générateur de chaque concept).
- Socle de vocabulaire de la série, pas un gabarit : `sbd1/serie/socle.mjs`, `generer.mjs`, `capturer.mjs`.
- Données du moteur v4 (rien d'inventé) :
  - `sbd1/donnees/extraire-remplacants.ts` → `remplacants-nugget.json` : substitutes, Nugget 46 g, S1, 16D, à chaque moment, plus hopSheet ;
  - `sbd1/donnees/simuler-moments.ts` → `profils-moments.json` : simulerCas, un seul ajout.
- Captures, dans `captures/` : `sbd1…sbd8-premier-ecran.png`, `-page.png`, `-wp.png` (le même Nugget en whirlpool), `-choix.png`, `-fiche.png`.

## Une ligne par concept (approche d : selon le moment)
- sbd1, chaleur froide : u4 affiné. Chaque barre de note se découpe selon les poids du moment (60′ : 60/20/20, whirlpool : 10/30/60).
  - Ce qui tient : la réponse en une ligne, l'inconnu en plage (Altus 79–99).
  - Ce qui casse : ça reste une liste proche de u4.
- sbd2, chaleur froide : le face-à-face de u4 en écart de recette ; les sections viennent dans l'ordre des poids.
  - Ce qui tient : les vraies valeurs, et « arôme étranger » au lieu d'« arôme 100 ».
  - Ce qui casse : c'est le plus proche de Comparer.
- sbd3, chaleur tiède : la largeur des colonnes vaut le poids du moment.
  - Ce qui tient : le moment se lit sans un mot.
  - Ce qui casse : le tableau est serré à 390 px.
- sbd4, chaleur tiède : la carte de l'étape Houblons sur le rail, éclairée par le moment (à 60′, l'α et l'IBU ; tard, la bande des arômes).
  - Ce qui tient : le vocabulaire qu'il a validé.
  - Ce qui casse : la bande éteinte se lit « sans arôme ».
- sbd5, chaleur tiède : la frise des réponses (137 très proches jusqu'à 15′, puis 8).
  - Ce qui tient : la falaise dit tout.
  - Ce qui casse : on peut la prendre pour un rail à glisser.
- sbd6, chaleur chaude : le chaudron. À 60′, la vapeur emporte les pictos et la cuve garde 60 IBU ; en whirlpool, ils restent.
  - Ce qui tient : il se comprend sans légende.
  - Ce qui casse : il a moins de chiffres que les autres.
- sbd7, chaleur chaude : l'entonnoir des clés de classement du moteur (318 → 137 → 2 en stock à 60′ ; 8, puis 0 en stock, en whirlpool).
  - Ce qui tient : la règle devient visible.
  - Ce qui casse : la réponse arrive au milieu de l'écran.
- sbd8, chaleur chaude : la carte qui penche (amertume en x, arôme en y ; la ligne des 80 penche avec le moment).
  - Ce qui tient : une seule image montre que la réponse change.
  - Ce qui casse : à 60′ les points s'entassent ; une liste les reprend dessous.

## Reprise du remplissage (retour du pilote)
Chaque concept garde son idée. Son premier écran porte en plus :
- le cas de sa stout à trois moments, placé différemment selon la page. Pour 60′, whirlpool et dry hop : le meilleur remplaçant sans inconnue, la dose, l'IBU, le nombre de très proches, le premier en stock qui suffit, et le poids des trois parts ;
- ce que le remplaçant choisi perd et gagne face à Nugget (familles des fiches, « emportés à 60′ ») ;
- un rythme resserré.

Remplissage avant la reprise : 0,39 à 0,55. Après : 0,51 à 0,65.

## Sorties décisives
- G1 : `SERIE-BIEN-8`.
- G2 : `COMMUN OK` sur les huit, rejoué après la reprise.
- G3 : `NOTE OK`.
- Panel, obligatoire : `PANEL OK`.
  - Remplissage médian 0,57, aucune capture sous 0,50.
  - Ressemblance moyenne 0,85, 0/28 paires presque identiques.
- Indicatifs, recopiés dans chaque NOTE :
  - `SANS-FAMILLE OK` : 10 houblons au-dessus de 50 %, la part « autres » est visible (Nelson Sauvin 83 %) ;
  - `mots-premier-ecran --sans-donnees --max=80` : ECHEC sur 5 pages sur 8, de 61 à 91 mots. Le cas à trois moments a ajouté des mots ;
  - `controle-une-question` : ECHEC. Le détecteur ne reconnaît pas les variétés du seul catalogue (Magnat, Altus…), qu'il classe « inconnu ».

## Prédiction
« sbd5 et sbd8 c'est vachement bien, on voit direct que la réponse change avec le moment, mais sbd1 c'est encore u4 et sbd6 manque de chiffres. »

DÉCISION À PRENDRE : faut-il adapter `controle-une-question` aux variétés du catalogue, qu'il ne connaît pas ? Pour le passer en passe 2, il faut soit étendre son dictionnaire de houblons, soit un balisage reconnu.

CONNAISSANCE : pour Nugget dans la 16D, le moteur v4 change complètement de réponse entre 15′ et 10′. De 60′ à 15′ (poids amertume 0,6), 137 remplaçants sont très proches. Dès 10′ (poids arôme 0,6), il n'en reste que 8, et Nelson Sauvin passe de 86 à 42. Source : `substitutes`, `sbd1/donnees/remplacants-nugget.json`.

LEÇON PROPOSÉE : jouer `controle-panel.mjs` dès le premier concept d'une série, et non à la fin.
- Son seuil (écart de couleur > 60) ne voit pas les surfaces #f3f3f6 du thème blanc ; une série au thème des maquettes doit donc gagner sa densité par le contenu et le rythme des lignes.
- La reprise l'a montré : le cas de la stout à trois moments a fait passer la médiane de 0,45 à 0,57.
