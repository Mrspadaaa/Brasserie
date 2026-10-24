# lvb — tiède : un pont « Et avec une autre levure ? › », son effet chiffré sur une ligne

Jeu court jc-levure (D35). Page : copie de Suggérer rendue par r4 (bundle dans `../assets/`) ; seul le pont s'ajoute.

## Ce qui est montré
- Sous le dernier groupe (Dry hop), hors de l'axe, avant « IBU après chaque voie » : un bloc-bouton à bord noir,
  icône levure, « Et avec une autre levure ? », chevron. Sa seconde ligne : la meilleure souche pour tes objectifs,
  chiffrée : « Pomona · agrumes ~+2,8 hors style · floral, résineux » suivis d'une hachure (non établis).
- Toucher le pont : une feuille du bas. « Changer de levure » ; « Toute la bière · houblons et IBU 59,7 inchangés » ;
  « Aujourd'hui SafAle US-05 » ; Pomona et Verdant IPA avec les cases de la page (objectifs cerclés, hachures, traits,
  tropical et noyau) ; « Ouvrir l'étape Levure › » (copie de l'étape rendue, `levure.html`) ; « Fermentation à revoir ·
  stock de levure non suivi ». × ou Échap ferme.

## Données
Moteur en direct (`outils/levures-moteur.ts`, `donnees/levures-moteur.json`) : Pomona agrumes ~+2,8 crans hors style
(35,5 > 30), Verdant ~+1,3 ; noyau ~+4,3 / ~+4,4 hors style ; floral et résineux non établis (null, jamais 0).

## Chaleur : tiède
La forme imposée par l'approche : un pont vers l'étape Levure, avec l'effet d'une ligne. Écart : le toucher ouvre un
aperçu avant l'étape, parce que l'étape Levure rendue est celle de Dryhopper (Idaho 7 fixé, 4 g/L, actif) ; y arriver
depuis Suggérer montrerait un houblon que le brasseur n'a pas choisi. L'aperçu dit ce que la souche fait seule.

## Ce qui tient
- Suggérer reste à un facteur : la levure n'est pas une voie de la liste, c'est une sortie.
- La ligne chiffrée répond avant le toucher : « Pomona pousse les agrumes, hors style ; le floral, on ne sait pas ».

## Ce qui casse
- En bas de liste, le pont n'est vu qu'après défilement (cinq écrans).
- Deux gestes jusqu'à l'étape (pont, puis « Ouvrir l'étape Levure ») au lieu d'un.
- Les traits hors style des cases restent noirs, comme dans la page rendue.

## Contrôles
- `controle-commun.mjs … --page=etat.html --sans=mots` : COMMUN OK. Premier essai : STANDARD ECHEC (S4, icône levure
  et × à 2,1 px) ; redessinées à 1,2 px.
- Captures : `captures/lvb-repos.png`, `captures/lvb-toucher.png` (390 × 844), ouvertes.
