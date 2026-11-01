# r5 — deux anneaux qu'on tourne (v0, Identité 1/7, 31.10)

- **Chaleur** : chaude.
- **Axes** : A2 (anneau fermenteur) ; A4 (anneau ébullition) ; A5 (interrupteur).
- **L'idée** : Deux anneaux concentriques qu'on tourne au pouce : l'extérieur est le fermenteur (un tour = 30 L) qui se remplit de la couleur de la bière, l'intérieur l'ébullition (un tour = 120 min) ; le centre dit combien, combien de libre et combien de temps.
- **Série** : r, des représentations distinctes (jauge de fermenteur, curseurs, puces, interrupteurs).

## Ce qui tient
- Une seule image répond à « combien et comment » ; 55 mots, le moins de la série.
- Le libre se voit en hachuré sur l'anneau ; le conseil ~24 en tireté ; plein, l'anneau passe au rouge.
- Forme connue (anneaux d'activité, minuteur), étrangère à l'app : la plus « frappante » (C096).

## Ce qui casse
- La précision au degré près est dure au pouce sur un anneau ; une saisie exacte manque au premier plan.
- Les libellés « fermenteur · 30 L » et « conseil ~24 » sont serrés au bord du cadran.
- Le style et le nom sont petits face au cadran.

## Acquis de la baseline
- [x] En-tête commun tel que l'app : ‹, « Identité 1/7 », Abandonner (brouillon repris, comme sa capture), icône d'import, thème (BrewWizard.tsx l. 2121-2150, tailles et traits de lucide repris).
- [x] Fil des 7 étapes, libellés courts, barre active noire (WizardStepRail, showLabels, compactLabels).
- [x] Bandeau Grain 8,6 kg · OG 1,080 · IBU ~93 et sa piste (bande 60–100) · EBC ● 9,5 (recipe-metrics, IbuEnPlage).
- [x] Pied commun « Retour · Suivant — Fermentescibles » (libellé long de l'étape, comme stepActions) et lanceur + de 48 px ; le pied laisse son coin au +, rien ne passe dessous au premier écran (D164).
- Hors périmètre (J12), non redessinés.

## Honnêteté des données
- Recette de démonstration : neipa v3, Double IPA 22A BJCP 2021, 24 L, 60 min, cuve 45 L Royal Catering, fermenteur 30 L ; plages du style lues dans `src/data/brewingStylesBootstrap.json` (OG 1,065–1,085, IBU 60–100, SRM 6–14 → EBC 12–28, alcool 7,5–10 %).
- L'évaporation porte « ~ » : ~3 L à 60 min, comme sa capture ; son origine (profil mesuré ou repli de 10 %/h) reste à mesurer (M1). Le repli s'écrit « repli 10 %/h, estimé » là où il s'affiche.
- « 20 % » d'espace libre porte la pastille tiretée « repère » (repère provisoire, J7) ; « conseil ~24 » est un conseil (30 × 0,8), distinct du volume choisi (hyp. 6), égal par hasard.
- L'alcool de la recette est inconnu à cette étape (FG à venir) : « — », jamais 0. Volume effacé : « — L », « Volume à renseigner ».
- Aucun calcul ajouté : seuls le volume, l'ébullition, la capacité du fermenteur et le conseil existant sont dessinés.

## Contrôles (sorties recopiées, 31.10)
- `verifier-page.mjs etat.html --min-images 0 --captures r5/r5` : PAGE OK (390 px, sans erreur).
- `mots-premier-ecran.mjs v0 r5 --page=etat.html --max=80` : 55 mots (série : MOTS OK).
- `controle-panel.mjs` sur les six captures de la série : PANEL OK (médiane 0,59, 1 sous 0,50, ressemblance 0,88, 0 paire presque identique) ; remplissage de r5 : 0,595.
- `controle-commun.mjs v0 r1…r6 --page=etat.html --sans=mots,au-style,fiche,trait,legende` : couleurs OK, survol OK, blocs OK, contraste OK, parlant OK, brutes OK ; standard ECHEC (S3 : rayons 10 et 16 px, ceux de DESIGN.md « Shapes » et de l'écran actuel, que S3 compte hors de l'échelle 2/4/8 des maquettes houblons ; S4 : le + commun à 2 px contre 1,3 px pour les autres icônes, trait repris de l'app).
  - `--sans=mots` : demandé par le brief. `au-style`, `fiche`, `trait`, `legende` : contrôles de l'outil houblons (lentille au style, fiche d'un houblon, pictos de famille, légende des arômes) ; l'écran Identité n'a ni houblon ni famille d'arômes.
- `controle-choix.mjs` : s.o. ; l'écran Identité n'est pas au registre `ecrans.json` (écran ouvert, aucun choix du brasseur à reprendre).
- Gestes joués (puppeteer, r5-avant.png → r5-apres.png) : les deux captures diffèrent.

## Captures (ouvertes)
- `r5/r5-haut.png` (premier écran), `r5/r5-page.png` (page entière, avec l'annexe des états), `r5/r5-avant.png`, `r5/r5-apres.png`.

## Boosters UX (boosters-ux)
- Boosters : anneaux — ajuster ; glisser circulaire (extérieur : volume, intérieur : ébullition par 5′) ; centre, hachuré et poignées suivent
- Boosters : nolo — choisir ; interrupteur
- B1 OK — chaque décision du premier plan a son contrôle (glisser circulaire, interrupteur) ; captures avant et après qui diffèrent.
- B2 OK — le cadran domine ; un seul primaire.
- B3 OK — 6 éléments ; 55 mots.
- B4 OK — le cadran seul, puis une rangée NOLO et deux replis.
- B5 non mesuré (v0) — échelle 4–6 / 8–12 px visée ; R2 non joué.
- B6 ECHEC probable — tailles : 12, 14, 16, 22, 36 px ; mono pour les mesures seulement ; rien sous 12 px.
- B7 OK — controle-contraste OK (clair) ; une couleur d'alerte (#A8291F texte) ; seule l'exception se colore. Cave non mesuré (v0).
- B8 OK — états dessinés dans l'annexe : plein (anneau rouge), volume inconnu (« — L », anneau vide), 24 L, en mini cadrans dans l'annexe.
- B9 OK (partiel) — retour sous le doigt (scale, transitions 150–200 ms) ; prefers-reduced-motion non traité en v0.
- B10 OK — aucun `type="number"`.
- B11 OK — « neipa v3, Double IPA : 24 L sur 30, 6 L libres, 60 min, NOLO éteint. »
- B12 OK — rayons 10 / 16 px, bordure 1 px, chevron ⌄ unique, icônes au trait de lucide ; hors du corps, la baseline.
- B13 À vérifier — anneau extérieur de 26 px d'épaisseur, intérieur de 16 px (sous 24 px : la cible est la couronne ±16 px).
- Écarts voulus : B13 — l'anneau intérieur fait 16 px ; sa cible est élargie à ±16 px autour du rayon, sans toucher l'extérieur.
