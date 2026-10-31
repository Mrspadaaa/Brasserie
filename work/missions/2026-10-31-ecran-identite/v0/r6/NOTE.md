# r6 — un centre de contrôle (v0, Identité 1/7, 31.10)

- **Chaleur** : chaude.
- **Axes** : A1 (tuiles) ; A2 (tuile fermenteur qui se remplit) ; A4 (tuile ébullition glissée) ; A5 (tuile NOLO qui s'allume) ; A6 (retiré).
- **L'idée** : Un centre de contrôle comme celui du téléphone : chaque tuile est la commande et sa réponse à la fois ; le Volume se remplit comme le fermenteur en glissant vers le haut, l'Ébullition se remplit de gauche à droite par 5′, NOLO s'allume.
- **Série** : r, des représentations distinctes (jauge de fermenteur, curseurs, puces, interrupteurs).

## Ce qui tient
- Un geste connu de tous les téléphones (Centre de contrôle iOS, Réglages rapides Android).
- Aucun champ, aucun libellé au-dessus d'un champ : C094 « très textuel » en face.
- Le verre de la tuile du nom prend la couleur EBC 9,5 : on voit la bière.

## Ce qui casse
- La tuile Ébullition sombre (#666 / #111) pèse autant que le volume.
- Les tuiles Espace libre et NOLO ont la même forme mais pas le même geste (déplier contre basculer).
- La valeur exacte passe par le glisser seul.

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
- `verifier-page.mjs etat.html --min-images 0 --captures r6/r6` : PAGE OK (390 px, sans erreur).
- `mots-premier-ecran.mjs v0 r6 --page=etat.html --max=80` : 65 mots (série : MOTS OK).
- `controle-panel.mjs` sur les six captures de la série : PANEL OK (médiane 0,59, 1 sous 0,50, ressemblance 0,88, 0 paire presque identique) ; remplissage de r6 : 0,682.
- `controle-commun.mjs v0 r1…r6 --page=etat.html --sans=mots,au-style,fiche,trait,legende` : couleurs OK, survol OK, blocs OK, contraste OK, parlant OK, brutes OK ; standard ECHEC (S3 : rayons 10 et 16 px, ceux de DESIGN.md « Shapes » et de l'écran actuel, que S3 compte hors de l'échelle 2/4/8 des maquettes houblons ; S4 : le + commun à 2 px contre 1,3 px pour les autres icônes, trait repris de l'app).
  - `--sans=mots` : demandé par le brief. `au-style`, `fiche`, `trait`, `legende` : contrôles de l'outil houblons (lentille au style, fiche d'un houblon, pictos de famille, légende des arômes) ; l'écran Identité n'a ni houblon ni famille d'arômes.
- `controle-choix.mjs` : s.o. ; l'écran Identité n'est pas au registre `ecrans.json` (écran ouvert, aucun choix du brasseur à reprendre).
- Gestes joués (puppeteer, r6-avant.png → r6-apres.png) : les deux captures diffèrent.

## Captures (ouvertes)
- `r6/r6-haut.png` (premier écran), `r6/r6-page.png` (page entière, avec l'annexe des états), `r6/r6-avant.png`, `r6/r6-apres.png`.

## Boosters UX (boosters-ux)
- Boosters : tuile-volume — ajuster ; glisser vertical sur la tuile ; remplissage doré, conseil tireté, « 6 L libres », plein hachuré rouge
- Boosters : tuile-ebullition — ajuster ; glisser horizontal par 5′ ; remplissage, ~évaporation
- Boosters : tuile-nolo — choisir ; tuile qui s'allume (noire)
- B1 OK — chaque décision du premier plan a son contrôle (tuiles à glisser, tuile à bascule) ; captures avant et après qui diffèrent.
- B2 OK — la tuile Volume domine ; un seul primaire.
- B3 OK — 7 éléments ; 65 mots.
- B4 OK — une grille, une tuile par décision ; replis en rangées pleines sous la grille.
- B5 non mesuré (v0) — échelle 4–6 / 8–12 px visée ; R2 non joué.
- B6 ECHEC probable — tailles : 12, 13, 14, 16, 18, 22, 24, 34 px ; mono pour les mesures seulement ; rien sous 12 px.
- B7 OK — controle-contraste OK (clair) ; une couleur d'alerte (#A8291F texte) ; seule l'exception se colore. Cave non mesuré (v0).
- B8 OK — états dessinés dans l'annexe : plein (tuile hachurée rouge), volume inconnu (« — L, à renseigner »), NOLO activé.
- B9 OK (partiel) — retour sous le doigt (scale, transitions 150–200 ms) ; prefers-reduced-motion non traité en v0.
- B10 OK — aucun `type="number"`.
- B11 OK — « neipa v3, Double IPA : 24 L sur 30, 6 L libres, 60 min, NOLO éteint. »
- B12 OK — rayons 10 / 16 px, bordure 1 px, chevron ⌄ unique, icônes au trait de lucide ; hors du corps, la baseline.
- B13 OK — tuiles de 86 × 182 px et plus.
- Écarts voulus : B6 — huit tailles : la grille vit de lectures de tailles diverses ; à resserrer en passe 2.
