# r3 — le fermenteur qu'on remplit au pouce (v0, Identité 1/7, 31.10)

- **Chaleur** : tiède.
- **Axes** : A2 (jauge fermenteur, dessinée) ; A4 (volume glissé, ébullition en pas à pas) ; A5 (interrupteur).
- **L'idée** : Le volume ne se tape plus : on glisse la surface du moût dans un fermenteur de 30 L dessiné à droite ; l'espace libre se voit en hachuré, le conseil ~24 est un trait, le trop-plein déborde en rouge au-dessus du couvercle.
- **Série** : r, des représentations distinctes (jauge de fermenteur, curseurs, puces, interrupteurs).

## Ce qui tient
- La réponse à « ça tient ? » est l'objet lui-même, à la couleur EBC de la bière.
- Le geste est vertical, au pouce, sur toute la hauteur de la cuve (500 px de course pour 30 L : 1 L ≈ 17 px) ; flèches ↑ ↓ au clavier.
- Le reste (nom, style, ébullition, NOLO, replis) tient dans une colonne de gauche.

## Ce qui casse
- La colonne de gauche s'arrête à mi-écran ; un vide reste sous les replis.
- La valeur exacte passe par le glisser ou les flèches ; pas de saisie tapée visible.
- Proche de la série e (matériel dessiné) : ici le fermenteur seul, comme commande, sans la cuve ni l'évaporation dessinées.

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
- `verifier-page.mjs etat.html --min-images 0 --captures r3/r3` : PAGE OK (390 px, sans erreur).
- `mots-premier-ecran.mjs v0 r3 --page=etat.html --max=80` : 68 mots (série : MOTS OK).
- `controle-panel.mjs` sur les six captures de la série : PANEL OK (médiane 0,59, 1 sous 0,50, ressemblance 0,88, 0 paire presque identique) ; remplissage de r3 : 0,776.
- `controle-commun.mjs v0 r1…r6 --page=etat.html --sans=mots,au-style,fiche,trait,legende` : couleurs OK, survol OK, blocs OK, contraste OK, parlant OK, brutes OK ; standard ECHEC (S3 : rayons 10 et 16 px, ceux de DESIGN.md « Shapes » et de l'écran actuel, que S3 compte hors de l'échelle 2/4/8 des maquettes houblons ; S4 : le + commun à 2 px contre 1,3 px pour les autres icônes, trait repris de l'app).
  - `--sans=mots` : demandé par le brief. `au-style`, `fiche`, `trait`, `legende` : contrôles de l'outil houblons (lentille au style, fiche d'un houblon, pictos de famille, légende des arômes) ; l'écran Identité n'a ni houblon ni famille d'arômes.
- `controle-choix.mjs` : s.o. ; l'écran Identité n'est pas au registre `ecrans.json` (écran ouvert, aucun choix du brasseur à reprendre).
- Gestes joués (puppeteer, r3-avant.png → r3-apres.png) : les deux captures diffèrent.

## Captures (ouvertes)
- `r3/r3-haut.png` (premier écran), `r3/r3-page.png` (page entière, avec l'annexe des états), `r3/r3-avant.png`, `r3/r3-apres.png`.

## Boosters UX (boosters-ux)
- Boosters : cuve-glisser — ajuster ; curseur vertical (role=slider) sur le dessin ; surface, poignée « 24 L », « 6 L libres » et alerte suivent
- Boosters : ebullition — ajuster ; pas à pas ± 5′ ; ~évaporation suit
- Boosters : nolo — choisir ; interrupteur
- B1 OK — chaque décision du premier plan a son contrôle (curseur vertical dessiné, pas à pas, interrupteur) ; captures avant et après qui diffèrent.
- B2 OK — la cuve domine ; un seul primaire.
- B3 OK — 7 éléments ; 68 mots.
- B4 OK — deux colonnes : la bière et ses choix à gauche, le fermenteur à droite.
- B5 non mesuré (v0) — échelle 4–6 / 8–12 px visée ; R2 non joué.
- B6 ECHEC probable — tailles : 12, 13, 14, 16, 22, 28 px ; mono pour les mesures seulement ; rien sous 12 px.
- B7 OK — controle-contraste OK (clair) ; une couleur d'alerte (#A8291F texte) ; seule l'exception se colore. Cave non mesuré (v0).
- B8 OK — états dessinés dans l'annexe : trop-plein, volume effacé, fermenteur inconnu, ébullition 90′ et 0′ (décrits dans l'annexe).
- B9 OK (partiel) — retour sous le doigt (scale, transitions 150–200 ms) ; prefers-reduced-motion non traité en v0.
- B10 OK — aucun `type="number"`.
- B11 OK — « neipa v3, Double IPA : 24 L dans le fermenteur de 30 L, 6 L libres, 60′, sans NOLO. »
- B12 OK — rayons 10 / 16 px, bordure 1 px, chevron ⌄ unique, icônes au trait de lucide ; hors du corps, la baseline.
- B13 OK — la cuve entière est la cible (172 × 570 px).
- Écarts voulus : aucun
