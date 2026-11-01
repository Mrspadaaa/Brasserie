# g1 — Rangées au pouce

- **Série** : g, le geste d'abord. **Chaleur : froide** (affine la baseline : mêmes blocs, même ordre).
- **Axes** : A4 (pas à pas sur place), A5 (interrupteur), A6 (le bouton « Coller » du corps ne revient que sur une recette neuve).
- **L'idée** : chaque valeur se règle au pouce là où elle se lit. Une rangée porte une valeur, son − + au bord droit, et son effet
  juste dessous (fermenteur sous le volume, cuve sous l'ébullition).

## Baseline (plancher à enrichir)
- [x] En-tête commun ‹, « Identité 1/7 », Abandonner, import, thème : tel quel.
- [x] Fil des 7 étapes : tel quel.
- [x] Bandeau Grain · OG · IBU · EBC : tel quel (absent sur recette neuve, comme le code).
- [x] Nom, style, repères repliés, volume, ébullition, évaporation, NOLO, fermenteur, matériel : tous gardés, dans l'ordre.
- Enrichi :
  - le pas à pas de volume (1 L) et d'ébullition (5 min) ;
  - la barre du fermenteur, avec le repère ~20 % en tireté ;
  - la cuve « ~27 L à chauffer » sur 45 L, avec la limite utile provisoire de 35 L en tireté.
- Retiré : le bouton « Coller une recette trouvée » du corps, qui doublait l'icône d'en-tête (J9) ; il revient sur une recette neuve.
- Les mots J8 (« Objectif NOLO », « Choix pour ce brassin », « Repère provisoire », « Matériel du plan ») sont remplacés par
  « La bière », « Le brassin », « NOLO », « Matériel ».

## Honnêteté (J7)
- « ~3 L évaporés » et « ~27 L » portent le « ~ ». Sans taux mesuré, le détail dit « 10 %/h par défaut » (état dessiné).
- Le repère de 20 % est dit « repère à ajuster » ; le conseil se lit comme un tireté, pas comme un plafond.
- Volume effacé : « à renseigner », barre en pointillé, « libre : — ». Jamais 0.
- Le calcul de l'évaporation dans la maquette imite le code (repli de 10 %/h) ; il n'est pas le vrai calcul.

## Boosters UX (boosters-ux)
- `volume-pas` : ajuster ; − + de 36 × 32 px ; le chiffre au centre. Effet vu : à 30 L, la barre passe au rouge et affiche « plein · 0 L »
  (`capture-apres.png`).
- `ebullition-pas` : ajuster ; pas de 5 min. Effet vu : l'évaporation (~4 L à 65 min) et la cuve (~34 L) se recalculent.
- `fermenteur-barre` : lire ; barre 0–30 L, tireté au repère. Effet : suit le volume ; ambre au-dessus du repère, rouge au plein.
- `cuve-barre` : lire ; barre 0–45 L, tireté à 35 L. Effet : suit le volume et l'ébullition.
- `nolo-bascule` : choisir ; un interrupteur de 44 × 26 px.
- `style-liste`, `reperes-repli`, `materiel-repli` : déclencher ; une rangée entière, avec son chevron ⌄.
- B1 OK : 8 boosters marqués ; captures avant/après différentes.
- B2 OK : « Suivant » est la seule action noire ; le groupe « Le brassin » domine.
- B3 OK : 67 mots ; détails à un toucher (repères, matériel).
- B4 OK : deux groupes nommés, effet collé à sa cause ; pas de carte dans une carte.
- B5 à vérifier : rangées de 54 px, plus hautes que les 28–48 de DESIGN.md (choix pour le pouce).
- B6 OK : 13 et 16 px dans le corps, mono pour les mesures.
- B7 OK : contraste OK ; ambre pour l'attention, rouge pour le plein seulement.
- B8 OK : 5 états dessinés en annexe (plein, recette neuve, NOLO coché, volume effacé, sans taux d'évaporation).
- B9 OK : retour noir à l'appui, 180 ms, `prefers-reduced-motion` respecté.
- B10 OK : aucun `type="number"` (0) ; le nom en `type="text"`.
- B11 OK : « neipa v3, Double IPA, 24 L sur 30, 60 min, sans NOLO » se lit en trois secondes.
- B12 OK : chevron ⌄ partout, rayons 10 et 16 px.
- B13 OK : cibles de 32 × 30 px au moins.

## Mesures (recopiées)
- PAGE OK (390 px, sans erreur) ; MOTS 67 (≤ 80) ; remplissage du premier écran 0,34, le plus bas de la série.
- controle-commun `--sans=mots,fiche,trait,legende,au-style` : couleurs, survol, blocs, contraste, parlant et brutes OK.
  - Raison des `--sans` : ces contrôles visent les houblons, absents de cet écran.
  - STANDARD ECHEC : S3 (rayons 10 et 16 px contre 2, 4 et 8 px) et S4 (+ flottant commun). Voir RESULTAT.

## Ce qui tient, ce qui casse
- Tient : c'est la baseline reconnue, mais chaque chiffre a son geste et son effet.
- Casse : premier écran à moitié vide sous « Suivant » (0,34). C'est la plus sage des six : correcte, mais peut-être quelconque.
