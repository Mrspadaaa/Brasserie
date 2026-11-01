# r4 — chaque nombre est un curseur (v0, Identité 1/7, 31.10)

- **Chaleur** : tiède.
- **Axes** : A4 (curseurs) ; A2 (la piste du volume porte le fermenteur) ; A5 (interrupteur).
- **L'idée** : Le volume et l'ébullition sont deux curseurs au pouce ; la piste du volume porte le fermenteur (libre hachuré, conseil ~24, trop-plein rouge au-delà de 30), et l'évaporation estimée voyage avec le pouce de l'ébullition.
- **Série** : r, des représentations distinctes (jauge de fermenteur, curseurs, puces, interrupteurs).

## Ce qui tient
- C092 : « aucun slider » ; ici chaque grandeur se glisse, avec une règle par 1 L et par 5′.
- La conséquence est sous le pouce : « 6 L libres » / « 1 L de trop », « ~4,5 L évaporés ».
- Grandes lectures (48 px) lisibles à bout de bras.

## Ce qui casse
- DESIGN.md : un curseur ne remplace pas une valeur stable si sa piste consomme plus de hauteur ; ici deux cartes de ~170 px.
- À 31 L, la partie au-delà de 30 reste dorée sous le hachuré rouge.
- Le réglage de l'espace libre reste replié (hyp. 2), alors que l'idée voudrait un curseur de plus.

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
- `verifier-page.mjs etat.html --min-images 0 --captures r4/r4` : PAGE OK (390 px, sans erreur).
- `mots-premier-ecran.mjs v0 r4 --page=etat.html --max=80` : 77 mots (série : MOTS OK).
- `controle-panel.mjs` sur les six captures de la série : PANEL OK (médiane 0,59, 1 sous 0,50, ressemblance 0,88, 0 paire presque identique) ; remplissage de r4 : 0,504.
- `controle-commun.mjs v0 r1…r6 --page=etat.html --sans=mots,au-style,fiche,trait,legende` : couleurs OK, survol OK, blocs OK, contraste OK, parlant OK, brutes OK ; standard ECHEC (S3 : rayons 10 et 16 px, ceux de DESIGN.md « Shapes » et de l'écran actuel, que S3 compte hors de l'échelle 2/4/8 des maquettes houblons ; S4 : le + commun à 2 px contre 1,3 px pour les autres icônes, trait repris de l'app).
  - `--sans=mots` : demandé par le brief. `au-style`, `fiche`, `trait`, `legende` : contrôles de l'outil houblons (lentille au style, fiche d'un houblon, pictos de famille, légende des arômes) ; l'écran Identité n'a ni houblon ni famille d'arômes.
- `controle-choix.mjs` : s.o. ; l'écran Identité n'est pas au registre `ecrans.json` (écran ouvert, aucun choix du brasseur à reprendre).
- Gestes joués (puppeteer, r4-avant.png → r4-apres.png) : les deux captures diffèrent.

## Captures (ouvertes)
- `r4/r4-haut.png` (premier écran), `r4/r4-page.png` (page entière, avec l'annexe des états), `r4/r4-avant.png`, `r4/r4-apres.png`.

## Boosters UX (boosters-ux)
- Boosters : curseur-volume — ajuster ; input range 1–35 L ; lecture, « libres / de trop », alerte suivent
- Boosters : curseur-ebullition — ajuster ; input range 0–120 par 5′ ; bulle ~évaporation suit le pouce
- Boosters : nolo — choisir ; interrupteur de 48 px
- B1 OK — chaque décision du premier plan a son contrôle (deux curseurs, interrupteur) ; captures avant et après qui diffèrent.
- B2 OK — les deux lectures de 48 px dominent à égalité ; un seul primaire.
- B3 OK — 7 éléments ; 77 mots.
- B4 OK — une carte par grandeur, nommée par son icône et son libellé.
- B5 non mesuré (v0) — échelle 4–6 / 8–12 px visée ; R2 non joué.
- B6 ECHEC probable — tailles : 12, 14, 16, 20, 48 px ; mono pour les mesures seulement ; rien sous 12 px.
- B7 OK — controle-contraste OK (clair) ; une couleur d'alerte (#A8291F texte) ; seule l'exception se colore. Cave non mesuré (v0).
- B8 OK — états dessinés dans l'annexe : recette neuve à 30 L (plein), volume effacé (« — L », sans pouce), évaporation au repli 10 %/h marquée estimée.
- B9 OK (partiel) — retour sous le doigt (scale, transitions 150–200 ms) ; prefers-reduced-motion non traité en v0.
- B10 OK — aucun `type="number"` ; input range, pas de saisie numérique.
- B11 OK — « neipa v3, Double IPA : 24 L, 6 L libres, 60 min et ~3 L évaporés, NOLO éteint. »
- B12 OK — rayons 10 / 16 px, bordure 1 px, chevron ⌄ unique, icônes au trait de lucide ; hors du corps, la baseline.
- B13 OK — pouces de 38 px, pistes de 28 px, interrupteur sur toute la rangée.
- Écarts voulus : aucun
