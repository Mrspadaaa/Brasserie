# r1 — la jauge à la place de la phrase (v0, Identité 1/7, 31.10)

- **Chaleur** : froide.
- **Axes** : A2 (jauge du fermenteur) ; A5 (interrupteur) ; A3 (repères dépliés, liste baseline) ; A6 (bouton tel quel, raccourci).
- **L'idée** : Le formulaire de la baseline, compacté en rangées ; « Choix pour ce brassin » et sa phrase deviennent une jauge du fermenteur posée sous le volume, qui la suit au doigt.
- **Série** : r, des représentations distinctes (jauge de fermenteur, curseurs, puces, interrupteurs).

## Ce qui tient
- L'ordre et les mots de sa capture : il reconnaît son écran.
- La jauge dit en un coup d'œil 24 sur 30, 6 L libres, et le conseil ~24 en trait tireté ; plein, elle passe au hachuré rouge avec l'alerte là où se saisit le volume (J5).
- Les repères du style, dépliés en quatre lignes, ne répètent pas le bandeau : la plage seule, et l'exception « EBC sous ».

## Ce qui casse
- La jauge est épaisse (90 px) : elle prend la place de deux rangées.
- Les repères dépliés au repos sont un choix de l'axe A3, pas de la baseline (repliés).
- Le bouton « Coller une recette » double l'icône de l'en-tête (J9-1), gardé pour la froideur.

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
- `verifier-page.mjs etat.html --min-images 0 --captures r1/r1` : PAGE OK (390 px, sans erreur).
- `mots-premier-ecran.mjs v0 r1 --page=etat.html --max=80` : 78 mots (série : MOTS OK).
- `controle-panel.mjs` sur les six captures de la série : PANEL OK (médiane 0,59, 1 sous 0,50, ressemblance 0,88, 0 paire presque identique) ; remplissage de r1 : 0,505.
- `controle-commun.mjs v0 r1…r6 --page=etat.html --sans=mots,au-style,fiche,trait,legende` : couleurs OK, survol OK, blocs OK, contraste OK, parlant OK, brutes OK ; standard ECHEC (S3 : rayons 10 et 16 px, ceux de DESIGN.md « Shapes » et de l'écran actuel, que S3 compte hors de l'échelle 2/4/8 des maquettes houblons ; S4 : le + commun à 2 px contre 1,3 px pour les autres icônes, trait repris de l'app).
  - `--sans=mots` : demandé par le brief. `au-style`, `fiche`, `trait`, `legende` : contrôles de l'outil houblons (lentille au style, fiche d'un houblon, pictos de famille, légende des arômes) ; l'écran Identité n'a ni houblon ni famille d'arômes.
- `controle-choix.mjs` : s.o. ; l'écran Identité n'est pas au registre `ecrans.json` (écran ouvert, aucun choix du brasseur à reprendre).
- Gestes joués (puppeteer, r1-avant.png → r1-apres.png) : les deux captures diffèrent.

## Captures (ouvertes)
- `r1/r1-haut.png` (premier écran), `r1/r1-page.png` (page entière, avec l'annexe des états), `r1/r1-avant.png`, `r1/r1-apres.png`.

## Boosters UX (boosters-ux)
- Boosters : volume — ajuster ; stepper ± 1 L ; nombre mono 24 px ; la jauge et « 6 L libres » suivent
- Boosters : jauge-fermenteur — lire ; jauge horizontale 30 L, moût couleur EBC, hachuré libre, conseil tireté ; 24 → 30 L : hachuré rouge, alerte
- Boosters : ebullition — ajuster ; stepper ± 5 min ; ~évaporation recalculée
- Boosters : nolo — choisir ; interrupteur ; s'allume
- Boosters : reperes — lire ; liste repliable ⌃
- B1 OK — chaque décision du premier plan a son contrôle (stepper, jauge, interrupteur, liste repliable) ; captures avant et après qui diffèrent.
- B2 OK — la jauge domine ; un seul primaire (Suivant).
- B3 ECHEC léger — 9 éléments au premier plan (nom, style, repères, volume, jauge, ébullition, NOLO, espace, matériel) ; 78 mots.
- B4 OK — deux groupes nommés par leur contenu (identité, ce brassin), séparés par l'espace ; pas de carte dans une carte.
- B5 non mesuré (v0) — échelle 4–6 / 8–12 px visée ; R2 non joué.
- B6 ECHEC probable — tailles : 12, 14, 16, 24 px (+ 16 et 14 du chrome commun) ; mono pour les mesures seulement ; rien sous 12 px.
- B7 OK — controle-contraste OK (clair) ; une couleur d'alerte (#A8291F texte) ; seule l'exception se colore. Cave non mesuré (v0).
- B8 OK — états dessinés dans l'annexe : recette neuve au volume du profil (30/30, plein, alerte), volume effacé, style créé, NOLO coché.
- B9 OK (partiel) — retour sous le doigt (scale, transitions 150–200 ms) ; prefers-reduced-motion non traité en v0.
- B10 OK — aucun `type="number"` ; nom en champ texte, valeurs par stepper (saisie au clavier décimal au toucher de la valeur).
- B11 OK — « neipa v3, une Double IPA de 24 L dans un fermenteur de 30 L, 6 L libres, 60 min, sans NOLO. »
- B12 OK — rayons 10 / 16 px, bordure 1 px, chevron ⌄ unique, icônes au trait de lucide ; hors du corps, la baseline.
- B13 OK (à mesurer) — steppers 32 × 30 px, rangées entières pour l'interrupteur et les replis.
- Écarts voulus : B3 — les repères dépliés (axe A3) remplissent le premier écran avec des plages vraies ; à replier si le brasseur préfère.
