# g2 — L'œil en haut, le pouce en bas

- **Série** : g, le geste d'abord. **Chaleur : froide** (les blocs de la baseline, retournés selon la portée du pouce).
- **Axes** : A1 (identité en titre), A2 (fermenteur et cuve en jauges), A4 (− + au bord droit), A5 (interrupteur), A6 (bouton du corps
  retiré).
- **L'idée** : en haut, ce qu'on lit (la bière, et l'effet sur le fermenteur et la cuve) ; en bas, dans la zone du pouce, ce qu'on
  règle (volume, ébullition, espace libre, NOLO). L'effet se voit en haut pendant que le pouce agit en bas.

## Baseline (plancher à enrichir)
- [x] En-tête commun, [x] fil des 7 étapes, [x] bandeau : tels quels.
- [x] Nom, style et code 22A, repères repliés, volume, ébullition, évaporation, NOLO, fermenteur, matériel : tout reste.
- Enrichi :
  - deux jauges verticales : fermenteur 30 L, avec 6 L libres et le repère tireté ; cuve 45 L, avec ~27 L à chauffer, dont ~3 L
    évaporés en hachures, et la limite provisoire de 35 L en tireté ;
  - l'espace libre, réglage replié (hypothèse 2), au plus près du pouce.
- Retiré : « Coller » dans le corps (l'icône d'en-tête suffit, A6).
- La pastille de style prend la teinte de sa famille (teal, IPA), comme `BeerStyleTag`.

## Honnêteté (J7)
- L'évaporation est hachurée : c'est l'estimation, distincte du moût mesuré en noir. Le « ~ » marque toutes les estimations.
- Volume effacé : « — », jauge vide en pointillé, « volume à renseigner » (état dessiné). Jamais 0.

## Boosters UX (boosters-ux)
- `volume-pas` : ajuster ; deux boutons de 48 × 40 px au bord droit, sous le pouce. Effet vu : à 31 L, la jauge du fermenteur passe au
  rouge et affiche « +1 L de trop » (`capture-apres.png`).
- `ebullition-pas` : ajuster ; pas de 5 min. Effet : la part hachurée de la cuve grandit.
- `effets` (les deux jauges) : lire ; elles suivent chaque geste.
- `espace-repli`, `nolo-bascule`, `style-pastille`, `reperes-repli`, `materiel-repli` : choisir ou déclencher.
- B1 OK : 8 boosters ; captures avant et après différentes.
- B2 OK : une seule action noire (« Suivant ») ; dominantes : les jauges et la lecture « 24 L ».
- B3 OK : 73 mots ; détails à un toucher.
- B4 OK : deux zones, lire et régler.
- B5 OK : rythme de 8 à 12 px entre les groupes.
- B6 à vérifier : quatre tailles (13, 16, 28, et 18 dans l'en-tête commun).
- B7 OK : contraste OK ; couleurs OK.
- B8 OK : plein, volume effacé, NOLO coché et estimation hachurée, en annexe.
- B9 OK : retour noir à l'appui.
- B10 OK : 0 `type="number"`.
- B11 OK : « 6 L libres sur 30, ~27 L à chauffer » se lit d'un coup d'œil.
- B12 OK : chevron ⌄, rayons 10, 16 et 24 px (la console).
- B13 OK : cibles de 40 px et plus.

## Mesures (recopiées)
- PAGE OK ; MOTS 73 ; remplissage 0,58.
- controle-commun `--sans=mots,fiche,trait,legende,au-style` (les houblons sont absents de cet écran) : tout OK sauf STANDARD (S3
  rayons, S4 + commun).

## Ce qui tient, ce qui casse
- Tient : la relation cause et effet est immédiate ; l'évaporation enfin visible comme une part de la cuve.
- Casse :
  - « ~27 L » (28 px) concurrence le « 24 L » réglé ;
  - la poignée de la console évoque une feuille qu'on ne peut pas tirer ;
  - vide d'environ 30 px entre les jauges et la console.
