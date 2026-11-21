# Analyse transversale par principes (21.11)

Règles : `REGLES.md` (R1 à R10). Constats : `BUGS-principes.md` (WFX-1 à WFX-16). Filtre des propositions : `GAIN.md`.
Banc : `principes/commun.mjs`, puis `tour.mjs` à `tour4.mjs`, qui donnent 70 captures, toutes à 390 tactile, dans `principes/captures/` ;
les captures citées ont été ouvertes. Pas de visuel ici : des actions et des enchaînements (« workflow, pas le dessin »).
Le gel du 20.11 tient : rien n'est codé, chaque proposition entre au passage de son écran.

## 1. Écran × règle

`ok` : la règle tient, ou l'écran en offre un bon modèle. `WFX-n` : constat. `–` : sans objet. `?` : non joué.

| Écran (entrée) | R1 suites | R2 précision | R3 geste | R4 retour | R5 peu, ordre | R6 vue | R8 suggérer | R9 en place |
|---|---|---|---|---|---|---|---|---|
| Bord | – | – | – | ok (coche « Fait » immédiate) | WFX-8 (liste des courses ici, pas dans Courses) | WFX-12 | – | ok |
| Finances › Synthèse | – | ok (sept. · oct. · nov. · tout) | – | ok (barres Entré / Dépensé) | – | ok | – | ok |
| Finances › Prévisions | WFX-10 | ok (30 j · 90 j · 12 mois) | – | – | – | ok (courbe) | – | ok |
| Calendrier | WFX-9 | – | ok (frise B, portage en cours) | ok | – | ok | – | plaintes du 21.11 (CAL-ENTETE) |
| Calendrier › + Ajouter | – | ok (puces de semaine) | ok | – | WFX-16 | – | – | ok |
| Brassins › liste | – | – | – | – | ok | ok | – | ok |
| Brassins › mesures | WFX-11 | ok (J+n) | ok (curseur de densité) | ok (atténuation, alcool provisoires) | ok | ok (courbe) | – | ok |
| Recettes › liste et fiche | WFX-2 | WFX-2 | – | – | ok | ok (stock libre par ligne) | – | ok |
| Recette › Houblons | WFX-15 | – | – | ok (IBU, repère du style) | – | ok | WFX-15 | ok |
| Recette › Eau | ? | ? | ? | ? | ? | ? | ? | ? |
| Atelier › Carnet | (chaîne projets) | WFX-1 | – | – | ok | ok | ok (exemples) | ok |
| Stocks › Épicerie | – | – | ok | ok | ok | **modèle** | – | ok |
| Stocks › Courses | – | – | – | – | WFX-8 | WFX-8 | – | ok |
| Stocks › Fûts › Remplir | WFX-4 | ok (Aujourd'hui · Hier · Autre date) | – | – | ok | – | WFX-4 | ok |
| Stocks › Matériel › Parc | – | WFX-1 (10 « sans échéance ») | – | – | ok | ok (frise d'échéances) | – | ok |
| Matériel › Étalonner | – | ok (rythme semaine · mois · 3 mois · brassin) | WFX-5 | – | ok | ok | – | ok |
| Matériel › Achat | WFX-3 (projet du carnet non repris) | WFX-1 (date d'achat) | – | – | WFX-3 | – | – | ok |
| Clients › Carnet | – | – | – | – | – | WFX-7 | WFX-7 | ok |
| Clients › Prix | WFX-6 | – | WFX-6 (lien texte) | – | WFX-6 | WFX-6 | – | ok |
| Réglages | – | – | – | ok (« sur 100 CHF il te reste ») | ok (3 trous, 2 erreurs comptés) | ok | – | ok |
| Plus › Période | – | – | ok (frise à poignées) | – | WFX-13 | – | – | ok |
| Recherche | ? | – | – | ? | – | – | ? | ? |
| Hors ligne | ? | – | – | ? | – | – | – | ? |
| Toute l'app | WFX-14 | WFX-1 | – | WFX-14 | – | – | – | – |

## 2. Ce qui ressort, par règle

- **R2 est le trou le plus large** (WFX-1, 2) : aucun composant d'horizon dans l'app, des dates au jour près partout. Pourtant trois
  amorces existent et marchent (Remplir un fût, rythme d'Étalonner, puces de semaine). R7 dit de les pousser, pas d'en inventer une quatrième.
- **R1 casse aux coutures entre écrans** (WFX-4, 6, 9, 10, 11) : une feuille renvoie ailleurs (« depuis sa fiche », « à régler dans
  Finances › Solde ») ou réclame une donnée que le brassin a déjà. L'annonce des effets (L9) n'est branchée que sur deux gestes (WFX-14).
- **R5 et R6 touchent les écrans oubliés par les chaînes** : Clients › Prix, Courses, Échéances, Achat de matériel. L'épicerie et les
  Réglages (barre « il te reste ») sont les modèles internes à suivre.
- **R3 et R4 tiennent mieux qu'ailleurs** : courbe de densité, frise de période, curseurs, IBU. Seuls restent des îlots au clavier (WFX-5).

## 3. Propositions candidates (filtre GAIN)

Gestes avant : comptés sur la capture ou au code ; « estimé » quand le sélecteur natif n'a pas été joué. Fréquences : estimées depuis
ses mots et le seed, sans relevé d'usage. À mesurer en ligne avant la mini maquette.

| Id | Règle | Chaîne | Avant → après | Fréquence | Gain | Coût honnête |
|---|---|---|---|---|---|---|
| PX-1 | R2, R7 (WFX-1, 2) | Dater une intention : projet, recette, brassin lointain, entretien, prévision | sélecteur natif : toucher, mois suivant × n, jour, OK, soit 3 à 5 (estimé) → 1 puce (aujourd'hui · 1 mois · 3 mois · 6 mois · 1 an · plus tard) ; reporter : 1 | plusieurs fois par mois (19 projets portés du Planning, chaque recette, chaque brassin) | ≥ 60 % de gestes en moins | un composant partagé, issu des trois amorces existantes ; le jour précis reste en repli et devient obligatoire là où il compte (brassage, échéance, mesure) |
| PX-2 | R1, R8 (WFX-4) | Mettre un lot en fûts | fermer, « Tout marquer propre », rouvrir « Remplir », ouvrir la liste, choisir le lot, puis cocher et Remplir : ≈ 8 → « Marquer les 4 propres » dans la feuille, lot en garde déjà proposé, puis cocher et Remplir : ≈ 3 | à chaque brassin mis en fût (mensuel ou plus) | − 60 % ; un lot faux devient improbable (seuls les lots éligibles sont proposés) | une ligne dans la feuille ; retire l'aller-retour vers la fiche |
| PX-3 | R1, R6, R7 (WFX-6) | Fixer le prix d'une bière | 7 renvois, chacun vers un autre écran → litres conditionnés, coût et densité repris du brassin, seul le prix reste à décider, au curseur (`CurseurPrix` existe dans l'Atelier) | à chaque nouvelle bière ou nouveau brassin (mensuel) | ressaisie supprimée (litres, densité déjà saisis au brassin) ; prix sans coût rendu impossible | lecture des données du brassin ; retire 3 lignes de texte ; à confirmer avec la chaîne vendre |
| PX-4 | R1, R4 (WFX-14) | Tout geste qui a des suites : vendre, acheter, lancer, mesurer, remplir, dater | aucune annonce → bandeau L9 « ce qui a bougé · Annuler » | quotidien | une suite fausse se voit et se défait tout de suite (erreur rendue visible, puis annulable) | un bandeau par geste, mécanisme déjà codé ; à greffer par chaque chaîne, sans écran neuf (pe2, pe5 refusés) |
| PX-5 | R8, R1 (WFX-15) | Ajouter un houblon à une recette | taper l'α (toucher, frappe, fermer le clavier) → l'α du lot en stock posé, modifiable | à chaque recette (mensuel) | ressaisie supprimée | aucun écran ; à confirmer : d'où l'α est lu (lot ou article) |
| PX-6 | R5 (WFX-8) | Préparer les courses | Stocks › Courses, puis « Tout voir » : 3 → la liste d'emblée : 2 | hebdomadaire | − 33 % | retire la ligne tronquée ; la liste du Bord reste un aperçu |

## 4. Corrections sans proposition (R5 et R9, à faire au passage de l'écran)

Ces défauts relèvent de ses plaintes (« champs visible de base », « l'info ont l'a déjà ») mais n'enlèvent pas de geste. Ce sont des
corrections, pas des candidats :
- WFX-3 : Achat de matériel ouvert « Plié » (Pour quoi ?, Total, Enregistrer) ;
- WFX-13 : retirer la saisie texte qui double la frise de période ;
- WFX-16 : « Nom » en premier dans l'ajout au calendrier.

## Annexe : gimmicks écartés

- **Étalonner au curseur** (WFX-5) : − 50 % de gestes, mais l'étalonnage est mensuel au mieux, et plus rare en pratique. À faire seulement
  si l'on porte de toute façon le curseur de densité (R7).
- **Échéances posées sur la rangée Papiers** (WFX-12) : l'oubli d'une déclaration deviendrait impossible, mais la chaîne est
  trimestrielle ou annuelle, donc sous le seuil mensuel.
- **Achat de matériel repris d'un projet du Carnet** (WFX-3) : supprime une ressaisie (nom, prix estimé), mais un achat de matériel est
  rare (estimé à moins d'un par mois). Il revient à la chaîne projets si son relevé montre une fréquence plus haute.
- **Vue client « ce qu'il a, ce qu'il prend »** (WFX-7) : aucune chaîne n'a été mesurée ici, et la vente reste à jouer par la chaîne vendre.
- **Fin de brassin estimée au calendrier** (WFX-9) et **prévision nourrie par le planning** (WFX-10) : ce sont de vrais gains possibles
  (oubli rendu impossible), mais ils dépendent d'une fixture à confirmer. Ils sont renvoyés aux chaînes produire et acheter, pas écartés
  sur le fond.
