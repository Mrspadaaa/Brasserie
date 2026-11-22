Version : 975b891e

| capture | thème | largeur | état | problèmes | bloquants |
|---|---|---|---|---|---|
| ajout-1280-clair.png | clair | 1280 | ajout | 0 | 0 |
| ajout-1280-sombre.png | sombre | 1280 | ajout | 0 | 0 |
| ajout-390-clair.png | clair | 390 | ajout | 0 | 0 |
| ajout-390-sombre.png | sombre | 390 | ajout | 0 | 0 |
| annule-1280-clair.png | clair | 1280 | annule | 0 | 0 |
| annule-1280-sombre.png | sombre | 1280 | annule | 0 | 0 |
| annule-390-clair.png | clair | 390 | annule | 0 | 0 |
| annule-390-sombre.png | sombre | 390 | annule | 0 | 0 |
| apres-etalonne-1280-clair.png | clair | 1280 | apres-etalonne | 1 | 0 |
| apres-etalonne-1280-sombre.png | sombre | 1280 | apres-etalonne | 1 | 0 |
| apres-etalonne-390-clair.png | clair | 390 | apres-etalonne | 0 | 0 |
| apres-etalonne-390-sombre.png | sombre | 390 | apres-etalonne | 0 | 0 |
| etalonne-traiter-1280-clair.png | clair | 1280 | etalonne-traiter | 0 | 0 |
| etalonne-traiter-1280-sombre.png | sombre | 1280 | etalonne-traiter | 0 | 0 |
| etalonne-traiter-390-clair.png | clair | 390 | etalonne-traiter | 1 | 0 |
| etalonne-traiter-390-sombre.png | sombre | 390 | etalonne-traiter | 1 | 0 |
| fait-refroidisseur-1280-clair.png | clair | 1280 | fait-refroidisseur | 2 | 0 |
| fait-refroidisseur-1280-sombre.png | sombre | 1280 | fait-refroidisseur | 2 | 0 |
| fait-refroidisseur-390-clair.png | clair | 390 | fait-refroidisseur | 1 | 0 |
| fait-refroidisseur-390-sombre.png | sombre | 390 | fait-refroidisseur | 1 | 0 |
| fiche-1280-clair.png | clair | 1280 | fiche | 0 | 0 |
| fiche-1280-sombre.png | sombre | 1280 | fiche | 0 | 0 |
| fiche-390-clair.png | clair | 390 | fiche | 0 | 0 |
| fiche-390-sombre.png | sombre | 390 | fiche | 0 | 0 |
| fiche-pompe-1280-clair.png | clair | 1280 | fiche-pompe | 0 | 0 |
| fiche-pompe-1280-sombre.png | sombre | 1280 | fiche-pompe | 0 | 0 |
| fiche-pompe-390-clair.png | clair | 390 | fiche-pompe | 0 | 0 |
| fiche-pompe-390-sombre.png | sombre | 390 | fiche-pompe | 0 | 0 |
| gestion-1280-clair.png | clair | 1280 | gestion | 0 | 0 |
| gestion-1280-sombre.png | sombre | 1280 | gestion | 0 | 0 |
| gestion-390-clair.png | clair | 390 | gestion | 0 | 0 |
| gestion-390-sombre.png | sombre | 390 | gestion | 0 | 0 |
| payer-1280-clair.png | clair | 1280 | payer | 1 | 0 |
| payer-1280-sombre.png | sombre | 1280 | payer | 1 | 0 |
| payer-390-clair.png | clair | 390 | payer | 0 | 0 |
| payer-390-sombre.png | sombre | 390 | payer | 0 | 0 |
| reparee-1280-clair.png | clair | 1280 | reparee | 1 | 0 |
| reparee-1280-sombre.png | sombre | 1280 | reparee | 1 | 0 |
| reparee-390-clair.png | clair | 390 | reparee | 0 | 0 |
| reparee-390-sombre.png | sombre | 390 | reparee | 0 | 0 |
| repos-1280-clair.png | clair | 1280 | repos | 0 | 0 |
| repos-1280-sombre.png | sombre | 1280 | repos | 0 | 0 |
| repos-390-clair.png | clair | 390 | repos | 0 | 0 |
| repos-390-sombre.png | sombre | 390 | repos | 0 | 0 |
| traiter-1280-clair.png | clair | 1280 | traiter | 0 | 0 |
| traiter-1280-sombre.png | sombre | 1280 | traiter | 0 | 0 |
| traiter-390-clair.png | clair | 390 | traiter | 0 | 0 |
| traiter-390-sombre.png | sombre | 390 | traiter | 0 | 0 |
| vide-1280-clair.png | clair | 1280 | vide | 0 | 0 |
| vide-1280-sombre.png | sombre | 1280 | vide | 0 | 0 |
| vide-390-clair.png | clair | 390 | vide | 0 | 0 |
| vide-390-sombre.png | sombre | 390 | vide | 0 | 0 |

## Problèmes

Combien et quels problèmes ? 4 problèmes, aucun bloquant, et aucune régression par rapport à 070d5268. J'ai ouvert les
52 captures et je les ai comparées à za3 (repos-390, repos-1280, traiter-390, ajout-390, vide-390, geste-390) et à
070d5268. Octet par octet, 50 captures sont identiques à celles de 070d5268. Les deux autres (fait-refroidisseur-390-clair
et reparee-390-sombre) sont ouvertes côte à côte avec leur version 070d5268 : aucun écart visible. La fusion avec la version
en ligne (Atelier ks4, rangerNoteIA) ne touche donc rien dans l'écran Matériel. Les 4 problèmes mineurs de 070d5268 restent
ouverts :

1. **apres-etalonne-1280-×2, fait-refroidisseur-1280-×2, reparee-1280-×2** : à 1280, le toast « Étalonné / Fait / Réparée ·
   Annuler » se centre sur toute la fenêtre. Il coupe « Projets d'équipeme… » et masque « 1 739 CHF » après Fait et
   Réparée. En brasseur : « le bandeau me cache le bouton ». Mineur (pas à sa place). Correction : à 1280, poser le toast
   dans le panneau de droite, sous ses boutons (zone vide).
2. **fait-refroidisseur-390-×2, fait-refroidisseur-1280-×2** : après « Fait », le Refroidisseur, au rythme « brassin »,
   descend tout en bas du fil, après « Cuve d'ébullition 02.03 » (mars), et sans date. En brasseur : « 5 brassins, c'est pas
   après mars ». Mineur (pas à sa place). Correction : le placer à la date estimée par la cadence des brassins (« ~5 br. »),
   ou le ranger dans un groupe « selon les brassins » juste sous « aujourd'hui ».
3. **etalonne-traiter-390-clair, -sombre** : za3-traiter-390 garde, en vue « À traiter », la bande beige des 30 jours, le
   trait « 30 j » sur lequel se pose la ligne verte du pH-mètre, et le rail jusqu'à « janv. ». La capture n'a ni la bande,
   ni « 30 j », ni « janv. ». Mineur (écart à sa maquette). Correction : afficher la bande 30 j et les repères de mois
   aussi dans le filtre « À traiter ».
4. **payer-1280-clair, -sombre** : dans « Nouvelle dépense » à 1280, « Joindre des documents » prend toute la largeur de la
   fenêtre, alors que le formulaire tient dans une colonne centrée d'environ 744 px. « Mon mois » et « Enregistrer » sont
   rejetés aux deux coins. En brasseur : « c'est étiré, faut traverser l'écran ». Mineur (pas pratique ; formulaire partagé,
   hors écran Matériel). Correction : aligner le bouton et le pied sur la colonne du formulaire.

Doutes (non comptés) :
- apres-etalonne-390 et -1280 : un petit point gris sur le rail, entre Frigo et Réfractomètre, absent au repos (un reste de
  l'ancienne position du pH-mètre ?).
- ajout-1280-×2 : le dialogue centré garde la poignée de glissement d'une feuille mobile, inutile à la souris.
- repos-1280 : la pompe est sélectionnée par défaut, alors que za3-repos-1280 ouvre le pH-mètre (logique : premier urgent).
- Fil à 1280 : « 14.11 Réparer » et « 14.11 étalonné » sont serrés contre le trait « aujourd'hui ».
- Une pastille recouvre le bouton ⋮ de l'en-tête de l'app ; za3 montre une pastille « 24 » sur Stocks, absente ici (hors
  écran Matériel). Pictos « Réparée » et « Projets » : une clé plate au lieu du tournevis de za3 (écart minime).
- La coque « Compagnon hors connexion » est masquée par le banc : elle n'est pas vérifiable ici.

Bloquants : 0

Pilote : vu (15.11 ; repos 1280 clair regardé, verdict lu ; 4 mineurs gardés pour la suite).
