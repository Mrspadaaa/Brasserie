# g3 — Trois questions, trois rails

- **Série** : g, le geste d'abord. **Chaleur : tiède** (la forme de l'approche : « quelle bière, combien, comment », un toucher par
  réponse).
- **Axes** : A1 (forme de l'identité : trois questions numérotées), A4 (puces de durée et de volume, valeur libre au toucher de la puce
  choisie), A5 (NOLO en pastille), A6 (« Coller » devient la première puce de « Quelle bière », sur recette neuve seulement).
- **L'idée** : l'écran pose les trois questions de l'outil, dans l'ordre. Chacune se répond d'un pouce sur un rail de puces : la puce
  choisie est la réponse, sans chiffre écrit deux fois. Le nom vient après le style (J2).

## Baseline (plancher à enrichir)
- [x] En-tête commun, [x] fil des 7 étapes, [x] bandeau : tels quels.
- [x] Nom, style et code 22A, repères repliés, volume, ébullition, évaporation, NOLO, fermenteur, cuve, matériel.
- Enrichi :
  - styles du carnet en puces, avec le point de couleur de leur famille (teal IPA, lime Hazy, orange Saison, palette `BeerStyleTag`) ;
  - le rail de volume se lit comme une jauge : sous la valeur, en gris (le moût) ; au-dessus du repère, en ambre ; 30, point rouge (plein) ;
  - le conseil ≤ 24 L, avec le réglage de l'espace libre derrière son chevron.
- Limite : la liste de styles est illustrative ; dans l'app, ce sont `Suggestions.knownStyles` et le catalogue BJCP.

## Honnêteté (J7)
- Les puces sont des raccourcis (hypothèse 4) : toute valeur reste possible au toucher de la puce choisie (saisie exacte, au clavier
  décimal).
- Une valeur hors puces (31 L) devient sa propre puce (état dessiné).
- « ~3 L », « ~27 L » : estimations marquées. Recette neuve : « style : — », rien de pré-choisi.
- Risque : choisir un style réécrit le profil d'eau qui suit le style (inventaire § 7). Il faudra le dire dans la passe 2.

## Boosters UX (boosters-ux)
- `style-puces` : choisir. Effet : la puce passe au noir.
- `volume-puces` : choisir. Effet vu : à 28 L, l'en-tête dit « 2 L libres sur 30 », en ambre (`capture-apres.png`).
- `ebullition-puces` : choisir. Effet : l'évaporation et la cuve se recalculent.
- `nolo-puce` : basculer ; une pastille en tirets qui passe au noir, dans la langue « dry hop » des Houblons.
- `espace-repli`, `reperes-repli`, `materiel-repli` : déclencher.
- B1 OK : 7 boosters ; captures avant et après différentes.
- B2 OK : une seule action noire de fond (« Suivant »). Les puces choisies sont noires aussi, comme dans la langue des Houblons.
- B3 OK : 77 mots ; au-delà de 4 options par décision (6 volumes), les puces forment une échelle.
- B4 OK : trois questions, un fil noir qui les relie.
- B5 OK.
- B6 OK : 13 et 16 px dans le corps.
- B7 OK : couleurs et contraste OK.
- B8 OK : recette neuve (« Coller » en première puce), 31 L hors puces, NOLO coché.
- B9 OK : 150 ms, mouvement réduit respecté.
- B10 OK : 0 `type="number"`.
- B11 OK : la question, puis la réponse en noir.
- B12 OK : chevron ⌄, rayons 10 px.
- B13 OK : puces de 48 px.
- Écart voulu : les numéros 1, 2, 3 sont dessinés par CSS (`::before`), pour ne pas compter des numéros d'ordre comme des mots.

## Mesures (recopiées)
- PAGE OK ; MOTS 77 ; remplissage 0,50 (limite).
- controle-commun `--sans=mots,fiche,trait,legende,au-style` (les houblons sont absents de cet écran) : tout OK sauf STANDARD (S3
  rayons, S4 + commun).

## Ce qui tient, ce qui casse
- Tient : la question de l'outil est l'écran lui-même ; trois touchers suffisent à répondre.
- Casse :
  - 200 px vides sous « Suivant » ;
  - le rail de styles déborde à droite (voulu, pour inviter à défiler, mais coupé) ;
  - la valeur libre n'a pas de signifiant visible, hors ébullition.
