OK — titre des outils à 18 px partout ; pieds en bas hors Dryhopper (laissé à r13)

Changement du pilote en cours de voie : Dryhopper = p4b2f, refait par r13 (en-tête et pied compris). Ma modification de
`ecrans/dryhopper/**` (pied déplacé sous le rail, RAIL OK et CONTINUITE OK à ce moment) a été retirée par
`git checkout -- prototypes/houblons-v4/parcours/src/ecrans/dryhopper` ; au moment du checkout, seuls `dryhopper.css`
et `index.tsx` étaient modifiés, par moi. Les modifications actuelles de ce dossier (frise.ts, mesures.ts…) sont venues
après : elles ne sont pas de moi.

## Fichiers écrits
- `prototypes/houblons-v4/parcours/src/commun/Onglets.tsx` : `TeteOutil`, le titre en `pq-tete-titre` (le `title` de
  DESIGN.md : 18 px, graisse 600, interligne 22 px), sur une ligne (`truncate`), `data-role="titre-outil"`. La croix,
  l'écart et la hauteur de la tête ne changent pas. Les mots du titre ne changent pas.
- `prototypes/houblons-v4/parcours/src/commun/retour.css` : la classe `.pq-tete-titre`.
- `prototypes/houblons-v4/parcours/src/ecrans/substituer/substituer.css` : seulement le commentaire de l'en-tête
  (« titre 15 px » est devenu « 18 px de TeteOutil, D129 ») ; le titre vient de `TeteOutil`, Substituer n'a pas de style à lui.
- Levure : rien à changer (titre par `TeteOutil`, pied déjà en bas).
- `prototypes/houblons-v4/maquettes/parcours-continuite/**` (construction).

## Critères
- G1 : `CONSTRUIT OK (9 pages) → prototypes/houblons-v4/maquettes/parcours-continuite/`
- G2, sans Dryhopper (copie du dossier construit sans `dryhopper/`, dans `os.tmpdir()/r12/sans-dry`) :
  `CONTINUITE OK (5 écrans × 2 largeurs)`. K3 tient aussi avec Dryhopper : les trois titres sont à 18 px, graisse 600, à
  x = 58 px (390) et à x = 314 px (1280), mesurés.
  Sur le dossier complet : `ECART 390 K4 pied de dryhopper à 666 px` et `ECART 1280 K4 pied de dryhopper à 622 px`,
  soit `CONTINUITE ECHEC (2)` : **laissé à r13**.
- G3 : `ANNULER OK (3 routes × 2 largeurs)` (Substituer et Levure : Annuler 96,8 × 48 à (56, 812) au téléphone et à
  (648, 768) à l'ordinateur ; action de 48 px à droite). Les lignes de Dryhopper (Annuler à (56, 690) et à (648, 646)) :
  **laissées à r13**. `controle-rail … dryhopper --parcours` : `RAIL OK 1/1` (Dryhopper tel que remis, non modifié).
  `controle-annuler` ne sait pas exclure une route : il refuse un dossier sans `dryhopper/etat.html`, donc joué sur le complet.
- G4 : `ETATS OK (118/118) ; 11 voulu(s) non rejoué(s) ; 1 en attente de son choix : etat-acquis-y1b-brassin-au-doigt (dryhopper)`
- Joués en plus : `TEINTE OK 7/7` ; `COMMUN OK` sur substituer et levure (`--page=etat.html --sans=mots`) ;
  `FONCTIONS-RAIL OK (37/37)`. `controle-choix` : `CHOIX ECHEC`, seulement pour Dryhopper (le nouveau choix p4b2f :
  ses mots absents de SPEC, `choix/etats/dryhopper.json` absent). C'est la part de r13 et du pilote.

## Revue côte à côte (planche, 390 et 1280)
Captures dans `os.tmpdir()` (C:\Users\mrspa\AppData\Local\Temp\r12) : `avant/` et `apres/` (`<largeur>-<route>.png`,
`planche-390.png`, `planche-1280.png`), et `apres/bandes-390.png` et `apres/bandes-1280.png` (en-tête et pied de chaque
écran, empilés à taille réelle). Toutes ouvertes en images.
- En-têtes : la croix est au même endroit sur les six écrans d'outil et d'onglet ; la tête fait la même hauteur.
  Substituer, Dryhopper et Levure ont désormais le même titre de 18 px. L'étape Houblons garde le fil d'étapes (D116)
  et la fiche sa feuille (D109, g1) : je n'y ai pas touché.
- Pieds : ceux de Substituer et de Levure sont identiques (Annuler à gauche, l'action en aplat noir, 48 px, en bas).
  Suggérer (« Comparer (2) ») et Comparer (barre d'icônes) gardent le pied de leur maquette choisie (q2b, r6a) : ces
  écrans ne changent pas la recette, donc pas d'Annuler (D120). Je n'ai pas vu d'autre rupture.
- Pour r13 : sur la base actuelle, l'action de Dryhopper (« Puis la levure ») est un contour gris, et non l'aplat noir
  des deux autres outils. Je l'avais passée en aplat (l'aperçu Pomona en blanc, son picto gardé) ; c'est retiré avec le reste.

Prédiction : « Là c'est cohérent, même croix, même titre » ; il remarquera Dryhopper tant que r13 n'a pas rendu p4b2f.

DÉCISION À PRENDRE : `controle-annuler.mjs` n'a pas d'option `--sans=<route>`. Tant que r13 n'a pas rendu, un G3
« sans Dryhopper » se lit à la main (voir plus haut).
CONNAISSANCE : aucune
LEÇON PROPOSÉE : aucune
