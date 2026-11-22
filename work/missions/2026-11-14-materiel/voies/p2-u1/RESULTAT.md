OK — passe 2 uq1 et uq2 : sept images et NOTE chacune, G1 PASSE OK


Tests : sans objet (maquettes statiques).

## Fichiers écrits
- `v1/u/uq2/etat.html` (réécrit ; états repos, geste, traiter, ajout, vide, rayon, repos à 1280 ; thème cave)
- `v1/u/uq2/uq2-{repos,geste,traiter,ajout,vide,rayon,repos-cave}-390.png`, `v1/u/uq2/uq2-repos-1280.png`
- `v1/u/uq2/NOTE.md` : « ## Passe 2 » ajoutée (défauts D1 à D5, retouches communes, greffes, mesures)
- `v1/u/uq1/` : seulement la copie de la v0 (etat.html, NOTE.md, 3 captures v0). Rien de la passe 2.

## Critères
- G1 : PASSE ECHEC attendu sur uq1 (traiter, ajout, vide, repos-1280, NOTE) ; uq2 complet.
- Captures : `node socle/capt.mjs v1/u repos,geste,traiter,ajout,vide,rayon,repos-1280 uq2` → CAPTURES OK.
- Mesure (puppeteer, `scratchpad/mesure.mjs`, 7 états de uq2) : texte < 12 px 0, nom tronqué 0, débordement 0, cible « fait » < 44 px 0,
  « champ neuf » / « −n j » / « séance » / « EQ- » 0. Mots du premier écran : 67 avec chiffres et dates (environ 45 en mots seuls).
- Captures ouvertes et corrigées : repos-390 (pied collé à la barre : lignes 48 px), geste-390 (étiquettes « dû » et « 14.11 »
  superposées ; Gestion sous le pied : sheet remontée, Notes et gestion fusionnées), traiter-390 (220 px de blanc : Ensuite complété),
  ajout-390 (aperçu sans fond ; blanc : Étalonnage et Notes ajoutés), rayon-390 (pied ajouté), repos-1280 (recherche sur deux lignes,
  pied du panneau sous la barre : corrigés). repos-cave-390 ouverte (jauges lisibles, soleil). Non ouverte : vide-390.

Prédiction : « Là je vois tout de suite ce qui dépasse, et le bouton dit ce que je fais » ; il pourrait trouver les dates sous les jours de trop.

DÉCISION À PRENDRE : mots du premier écran de uq2 à 67 si l'on compte dates et nombres (plafond 60). Garder la date sous les jours
(greffe zq1, 9 mots) ou la réserver à la fiche et au 1280. Je l'ai gardée.

## Reprise uq1 (agent neuf, Opus, environ 25 tours)
Partir de `v1/u/uq1/etat.html` (copie v0). Reprendre le bâtisseur JS de `v1/u/uq2/etat.html` (données `R`, coque `HD/SUB/BB`, fonctions
`row`, `mesure.mjs`) en préfixe `uq1-`. Défauts SYNTHESE § uq1 :
- D1 : jauge fine (6 px) sous le nom, largeur fixe, même trait dû (75 %) sur toutes les lignes ; légende « dernier fait · dû » à droite
  de l'en-tête du premier rayon.
- D2 : rayons repliés avec leur prochaine échéance en mono (Stockage « 36 j », Atelier « 48 j », Embouteillage « sans rappel ») ; mêmes
  rythmes que uq2 (frigo 20.12, déshumidificateur 01.01, hotte 15.01).
- D3 : puces « tout 13 » (active), « à traiter 4 », « en panne 1 », « à étalonner 2 » (346 px, tient).
- D4 : ✓ de 44 px ; lignes à geste 48 px, autres 40 px (budget : 704 px sur 721).
- D5 : fiche pleine page : historique en 4 lignes (08.10, 06.09, 03.08, 02.07 ; « tenu »), plus de « champ neuf », retirer la ligne
  « 08.10 dernier étalonnage » (« chaque mois » en sous-titre) pour que Gestion tienne au-dessus du pied.
- D6 : segment Rappel « semaine · mois · brassin · 3 mois ».
- États : traiter (puce « à traiter 3 » active après ✓ sur le pH-mètre, ligne verte, toast « Étalonné · prochain 14.12 · Annuler »,
  rayons sans dû repliés) ; ajout (nouveau en pleine page « Matériel · Mesure », catégorie Mesure préremplie depuis le rayon, Acheter
  et Projets en tête, rappel, étalonnage) ; vide (cinq rayons repliés à 0, phrase, « Enregistrer un achat » et « Déjà possédé ») ;
  repos-1280 (rayons dépliés sur deux colonnes, fiche en panneau à droite, coque 1280 de uq2).
- Puis `node socle/capt.mjs v1/u repos,geste,traiter,ajout,vide,repos-1280 uq1`, ouvrir chaque image, `## Passe 2` dans sa NOTE, rejouer G1.

CONNAISSANCE : aucune
LEÇON PROPOSÉE : une voie de passe 2 qui porte deux variantes et sept états chacune dépasse le budget de contexte d'un agent Opus
(180 k après une variante, lectures comprises) : une variante par voie en passe 2.

## Reprise uq1 (fait, agent neuf, Opus)
- Fichiers : `v1/u/uq1/etat.html` (réécrit, bâtisseur JS préfixé uq1-, coque de uq2 v1) ; `v1/u/uq1/uq1-{repos,geste,traiter,ajout,vide,repos-cave}-390.png`, `uq1-repos-1280.png` ; `v1/u/uq1/NOTE.md` : « ## Passe 2 ».
- Captures : `node socle/capt.mjs v1/u repos,geste,traiter,ajout,vide,repos-1280 uq1` → CAPTURES OK (7 images).
- G1 rejoué : PASSE OK (uq1 et uq2).
- Mesure (scratchpad `mesure1.mjs`, 6 états) : texte < 12 px 0, tronqué 0, débordement 0, cible « fait » < 44 px 0, interdits 0 ; mots repos 63 avec coque (environ 50 hors en-tête et barres) ; bas du contenu repos 789 contre barre 802.
- Captures ouvertes : repos-390, geste-390, traiter-390, ajout-390 (blanc comblé : achat « date inconnue / prix inconnu »), vide-390 (blanc comblé : rayons à 56 px, ligne fantôme), repos-1280 (étiquette « Densimètre » sur « mars » : mois descendus), repos-cave-390.
- Défauts D1 à D6 et retouches communes corrigés (détail dans la NOTE). Reste : « en panne » par glissé non dessiné ; blanc de 180 px au-dessus du toast dans traiter.
- Prédiction uq1 : « Là c'est mes rayons, et je vois d'un coup ce qui est en retard » ; il pourrait trouver la jauge fine un peu discrète à côté de uq2.
- Reprise : sans objet.
