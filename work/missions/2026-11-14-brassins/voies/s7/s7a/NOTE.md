# s7a — Dry hop demain (Dryhopper pur)
- Chaleur : **froide** (le genre G4 pur). Ma meilleure : repos, geste, cave, 1280.
- Idée : la fiche titre la décision (« Dry hop demain · Citra + Mosaic ») et reprend p4b2f : onglets ébullition / WP / actif / après, deux colonnes houblon à la cmc2k, la densité comme repère du moment (fenêtre « actif · encore 0,004 » au-dessus de la bande « après »).
- Geste : « Ajouté aujourd'hui » coché sur les deux houblons → titre « Garde dès que stable », cases vertes pleines datées 14.11, stock −100 g / −80 g (déstockage fusionné, toast Annuler), barre dry hop déplacée sur J+5, critère stable 0/3.
- 1280 : poste de cave en trois colonnes (houblons et relevés · courbe et « Jour par jour » · Mes cuves titrées par leur décision).
## Baseline
- [x] m2 : « Mesurer la densité » ouvre le geste m2 (dessiné en s7b) ; pas de `type="number"`
- [x] z1 : en-tête de lot, « Relevés du jour » en chiffres gras, cases vertes pleines ; jetons clair et cave
- [x] J+5 · levuré le 09.11 ; [x] °C cuve (— / 19 °C) et °C échantillon (Jour par jour, 1280) distinctes
- [x] FG en bande 1,010–1,014 ; inconnu « — » ; alcool provisoire (1280 et s7b/s7c)
- [x] dry hop nommé, dosé, daté (J+6 · dim. 15.11) ; « Ajouté » date et déstocke en un geste
- [x] pas de cockpit, pas de bandeau d'alerte, pas de code interne
## Causes c3 évitées
1 pas d'en-tête + puces + courbe + cases °C + carte + pied : titre-réponse, colonnes, onglets de moment ; 2 héros = dry hop, °C cuve en une ligne ; 3 aplats pleins (familles, aire violette, bande verte, consigne 19/21/2 °C), aucun pointillé ; 4 phrase-réponse 32 px, critère stable en 3 cases au geste ; 5 nom, α, rôle, pictos de familles ; 6 axe cadré 1,008–1,034 (1,058 en flèche), futur rempli par la fenêtre actif et la consigne ; 7 aucune phrase grise d'aide, 1280 en trois colonnes.
## Sources des houblons
α : `src/data/hopDatabaseBootstrap.json` (kasperg3/HopDatabase) Citra 10–16 %, Mosaic 10–15 % (plage de variété, icône livre comme cmc2k ; α du lot inconnu). Rôle : `hopBeerMaverickFiches.json` purpose « dual ». Familles : tags Beer Maverick (`hopBeerMaverickBootstrap.json`), rangés à la main (Citra : agrumes, pêche, melon, floral, fruit de la passion/litchi ; hors : groseille à maquereau ; Mosaic : myrtille, tropical, agrumes, herbe, pin, épicé, rose, terreux ; hors : chewing-gum). Aucune intensité chiffrée.
## Écarts assumés
- La fenêtre « actif » à droite d'aujourd'hui est la plage 1,018–1,014 (reste à descendre), pas une prévision ; aucun point futur.
- `controle-panel` / `controle-commun` non lancés (contexte de l'agent au plafond) : voir DEMANDE EXECUTANT dans RESULTAT.md.
