# s5c — Cadrans ronds et cuverie (chaude)
Chaleur : chaude (G2 mêlé à G1, tableau de cuverie).
Idée : de vrais cadrans ronds (densité, °C cuve, compte à rebours du dry hop) sous un rail de cuverie, avec la frise de jours pleine de G1 ; la liste est la cuverie en tuiles.
Boosters : rail-cuverie (choisir la cuve), densite-cadran (anneau 1,040–1,006, bande verte, Relever), cuve-cadran (anneau, consigne 19 en jaune), dryhop-cadran (« 1 j »), frise-cuverie (J0 à J+11, phases pleines, aujourd hui cerclé), geste-cuve (feuille m2 : 19,2, ±0,1, consigne marquée, écart +0,2).
Images : s5c-repos-390-clair, s5c-geste-390-clair, s5c-liste-390-clair.
Écarts : pas de bande de tolérance en °C de cuve (la recette donne une consigne, pas une plage) : la consigne est un repère vert sur la piste.
## Baseline (BRIEF-AUTEUR)
- [x] geste m2 : toucher la tuile ouvre sur place gros chiffre, −/+, piste avec bande cible ; jamais type="number" ; virgule
- [x] grammaire z1 : en-tête de lot, cases à cocher pleines, jetons clair/cave de DESIGN.md (z1 etat.html)
- [x] J+5 depuis le levurage, avec sa date (levuré le 09.11)
- [x] deux températures : °C cuve (tuile, consigne 19) et °C échantillon (liée au relevé de densité)
- [x] FG en bande 1,014–1,010 ; inconnu « — » (°C cuve du 14.11) ; alcool 5,8 % et atténuation 71 % « provisoires »
- [x] dry hop nommé, dosé, daté (Citra 100 g + Mosaic 80 g, J+6 · 15.11) ; « ajouté » date et déstocke en un geste
- [x] pas de cockpit, pas de bandeau d alerte, pas de code interne
## Honnêteté
- Chiffres du brief seuls. α : plages de src/data/hopDatabaseBootstrap.json (kasperg3/HopDatabase, agrégat communautaire) : Citra 10–16 %, Mosaic 10–15 %.
- Familles : tirées des descripteurs documentaires du même fichier (Citra : citrus, tropical, stone fruit, blackberry/gooseberry ; Mosaic : berry, citrus, tropical, stone fruit). Aucune intensité ; l ordre des pastilles n est pas un poids.
- Rôle « arôme · actif » : usage en dry hop pendant la fermentation active (densité hors bande), pas une valeur inventée.
- Au geste densité (s5a) : 6,0 % et 74 % calculés par (1,062 − 1,016) × 131,25 et (OG − D)/(OG − 1).
## Causes c3 évitées
1 pas d en-tête + puces + courbe + cases °C + carte + pied ; 2 le héros n est pas le relevé de °C (la tuile °C est un des trois, le titre est la décision) ; 3 aplats pleins (noir, bleu, vert, familles), aucun pointillé ; 4 phrase-réponse en tête et « stable ? = ? » dessiné ; 5 houblons en brasseur (nom, α, rôle, pastilles) ; 6 axe cadré sur 1,024–1,008 (ou 1,040–1,006), OG hors cadre ; 7 aucune phrase grise d aide, écran rempli.
## Boosters (boosters-ux)
- Mesures B2 à B13 non jouées en v0 (permis par le skill : seules pèsent honnêteté et baseline). Skills impeccable et ui-design-system non chargés (contexte) : écart signalé.
