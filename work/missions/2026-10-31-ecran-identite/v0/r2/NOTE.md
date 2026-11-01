# r2 — des puces, sans clavier (v0, Identité 1/7, 31.10)

- **Chaleur** : froide.
- **Axes** : A4 (puces de durée et de volume, valeur libre au ✎) ; A2 (badge) ; A5 (segment non/oui) ; A3 (tags de plage) ; A6 (retiré, l'icône d'en-tête suffit).
- **L'idée** : L'ordre de la baseline, mais chaque choix se pose en puces au pouce, sans ouvrir le clavier ; le fermenteur devient un badge, les repères trois petits tags où seule l'exception se colore.
- **Série** : r, des représentations distinctes (jauge de fermenteur, curseurs, puces, interrupteurs).

## Ce qui tient
- Aucun clavier pour une recette ordinaire : 60, 75, 90 et « 30 L plein » se touchent ; le ✎ garde la valeur libre (« Rien de figé »).
- Le badge « 6 L libres sur 30 » passe au rouge plein (« 0 L libre ») quand on touche 30 L.
- Les tags donnent la plage du style sans répéter le bandeau ; « EBC 12–28 · sous » est le seul coloré.

## Ce qui casse
- Les puces de volume ne savent que deux raccourcis justes (le conseil et le plein) : le reste passe par ✎.
- Le grand 24 L et la puce « 24 L conseil » se lisent deux fois tant que le volume égale le conseil (hasard, J9-4).
- Remplissage le plus bas de la série (0,46) : l'écran reste aéré.

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
- `verifier-page.mjs etat.html --min-images 0 --captures r2/r2` : PAGE OK (390 px, sans erreur).
- `mots-premier-ecran.mjs v0 r2 --page=etat.html --max=80` : 80 mots (série : MOTS OK).
- `controle-panel.mjs` sur les six captures de la série : PANEL OK (médiane 0,59, 1 sous 0,50, ressemblance 0,88, 0 paire presque identique) ; remplissage de r2 : 0,464.
- `controle-commun.mjs v0 r1…r6 --page=etat.html --sans=mots,au-style,fiche,trait,legende` : couleurs OK, survol OK, blocs OK, contraste OK, parlant OK, brutes OK ; standard ECHEC (S3 : rayons 10 et 16 px, ceux de DESIGN.md « Shapes » et de l'écran actuel, que S3 compte hors de l'échelle 2/4/8 des maquettes houblons ; S4 : le + commun à 2 px contre 1,3 px pour les autres icônes, trait repris de l'app).
  - `--sans=mots` : demandé par le brief. `au-style`, `fiche`, `trait`, `legende` : contrôles de l'outil houblons (lentille au style, fiche d'un houblon, pictos de famille, légende des arômes) ; l'écran Identité n'a ni houblon ni famille d'arômes.
- `controle-choix.mjs` : s.o. ; l'écran Identité n'est pas au registre `ecrans.json` (écran ouvert, aucun choix du brasseur à reprendre).
- Gestes joués (puppeteer, r2-avant.png → r2-apres.png) : les deux captures diffèrent.

## Captures (ouvertes)
- `r2/r2-haut.png` (premier écran), `r2/r2-page.png` (page entière, avec l'annexe des états), `r2/r2-avant.png`, `r2/r2-apres.png`.

## Boosters UX (boosters-ux)
- Boosters : volume-puces — choisir ; puces raccourcis + ✎ ; le grand nombre et le badge suivent
- Boosters : badge-fermenteur — lire ; pastille verte, rouge à 30 L
- Boosters : ebullition-segments — choisir ; segments 30–90 + ✎ ; ~évaporation suit
- Boosters : nolo — choisir ; segment non / oui
- Boosters : reperes-tags — lire ; tags de plage, exception colorée
- Boosters : style — choisir ; pastille de style (palette des styles, teal pour IPA)
- B1 OK — chaque décision du premier plan a son contrôle (puces, segments, badge, tags) ; captures avant et après qui diffèrent.
- B2 OK — le grand « 24 L » domine ; un seul primaire.
- B3 ECHEC léger — 8 éléments ; 80 mots.
- B4 OK — quatre groupes séparés par un filet, chacun nommé par un libellé de 12 px.
- B5 non mesuré (v0) — échelle 4–6 / 8–12 px visée ; R2 non joué.
- B6 ECHEC probable — tailles : 12, 13, 14, 16, 22, 48 px ; mono pour les mesures seulement ; rien sous 12 px.
- B7 OK — controle-contraste OK (clair) ; une couleur d'alerte (#A8291F texte) ; seule l'exception se colore. Cave non mesuré (v0).
- B8 OK — états dessinés dans l'annexe : fermenteur plein (badge rouge), fermenteur inconnu (« Fermenteur à renseigner »), style créé et recette neuve (tags « — »), NOLO coché.
- B9 OK (partiel) — retour sous le doigt (scale, transitions 150–200 ms) ; prefers-reduced-motion non traité en v0.
- B10 OK — aucun `type="number"` ; le ✎ ouvre la saisie libre.
- B11 OK — « neipa v3, Double IPA, 24 L, 6 L libres sur 30, 60 min, NOLO non. »
- B12 OK — rayons 10 / 16 px, bordure 1 px, chevron ⌄ unique, icônes au trait de lucide ; hors du corps, la baseline.
- B13 OK (à mesurer) — puces de 34 px, segments de 40 px.
- Écarts voulus : A6 — bouton d'import retiré du corps (l'icône de l'en-tête fait la même chose, J9-1).
