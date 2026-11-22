# zq2 — Le tableau d'ombres (chaude)

Idée : l'écran est le panneau perforé de l'atelier (tableau d'ombres) : chaque appareil a sa silhouette peinte ; une étiquette suspendue porte ce qui est dû, et se touche pour le noter fait ; la pompe en panne est « partie » : il ne reste que son ombre en pointillé rouge.

- Problèmes résolus : P1 (À traiter · 3), P2, P3 (l'étiquette = le geste fait / réparée / étalonner), P4, P5 (13 au premier écran), P7, P8, P9 (picto par appareil, rayons = zones peintes), P11, P12, P17 (case « Ajouter » visible dans chaque zone), P19, P20, P21, P25 en partie (la case « Ajouter » d'une zone pré-remplit la catégorie : plus de « Brassage » par défaut). Parcours : M1, M2, M3, M4, M5, M9 (ajout toujours visible), M10.
- Champs neufs : les mêmes que zq1 (rythme, dernier fait, échéance, étalonnage lu, panne depuis, brassins depuis).
- Données : échéances identiques à zq1, calculées au 14.11.2026 ; dépense Démo. Aucune valeur en liste (axe « argent : rien en liste »).
- Acquis écartés : « Enregistrer un achat » n'a plus son bouton : la case « Ajouter » d'une zone propose Achat ou Déjà possédé (un toucher de plus, mais catégorie juste). Les catégories Embouteillage, Stockage et Atelier partagent la zone « Cave · atelier » (trois rayons d'un ou deux appareils) ; la fiche garde la catégorie exacte. Projets d'équipement : dans le ⋯.
- Écart : étiquettes de 44 px de haut, mais posées en biais, sur le picto (la métaphore le veut).

## Boosters UX (boosters-ux)
- tableau-ombres : lire où en est chaque appareil d'un coup d'œil ; silhouette et étiquette.
- reparee, fait, etalonner : déclencher en touchant l'étiquette. ajouter-* : déclencher, catégorie pré-remplie.
- Fiche : etalonnage-flacons (tampons aux couleurs du commerce, rouge pH 4, jaune pH 7), etiquettes-passees, depenses-reliees, payer-entretien, enregistrer-etalonnage.
- Mesures v0 : 35 mots hors noms ; 0 texte < 12 px ; 0 `type="number"` ; 13 `data-booster`. B2 à B13 en passe 2.
