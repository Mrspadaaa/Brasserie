OK — carnet p4 : barres depuis zéro, en-têtes en clair, interrupteur de veille, offres ailleurs chiffrées

## Fichiers (tous dans f9/p4)
- `retouche.mjs` (nouveau, part de `../p3/proto.tpl.html`, split/join, chaque marque unique), `proto.tpl.html`, `assemble.mjs` (dégradés acier, verre, ambre, symbole `i-livre`), `build.mjs`, `proto.src.html`, `proto.html`.
- Contrôles : `gestes.mjs` (T2, T5b et T8 resserrés), `mesure.mjs`, `cibles.mjs` ; sorties `gestes.log`, `mesure.log`, `cibles.log`. `capt.mjs` (copie de calendrier/p8), `planche.mjs`, `GESTES.md` mis à jour.
- Rebâtir : `node retouche.mjs && node assemble.mjs && node build.mjs`.

## Sorties décisives
- `node gestes.mjs` : **GESTES OK**. T1 en 0 toucher, T8 et T11 en 1, T2b en 1, toutes les autres en 2 ; T5b 4 et T14b 3 (gestes en plus). 0 frappe, aucun `type="number"`, console propre. T8 exige « Débit » et « m³/h » sans ↑ ↓ ✦ ; T2 exige ≥ 3 puces proposées.
- `node mesure.mjs` : **MESURE OK**, 40 écrans sur 40 en clair et en cave. Tailles 15/18/26, rien sous 15 px, contraste min 6,36:1. Mots : liste 35, carnet 40, articles 35, comparer 33, pourquoi 37, fiche 40, feuille du choix 40, carac 30, ventilation-comparer 35, frigo-comparer 34, lien 18, nouveau 27.
- `node cibles.mjs` : **CIBLES OK**.

## Retouches (3 juges, groupées)
1. Comparer : barre = valeur ÷ max de la colonne, depuis un zéro commun (Q15), pour toutes les colonnes ; le meilleur en vert (chiffre et barre). Le rang (ordre des lignes, « 1er sur… ») vient d'un score séparé. Embouteillage : 6’400, 11’700 et 21’500 ont des barres de 30, 54 et 100 %.
2. En-têtes : nom puis unité, sans ↑ ↓ ✦ ; le sens est écrit en mots dans Caractéristiques (« m³/h, plus = mieux »). Frigo : « ★ Tient 2 °C jusqu’à / °C ambiant ». « Prix ⌄ » devient une puce à contour, sans filet.
3. Une ligne par offre, même compte qu'Articles : l'offre DE 11’200 apparaît (« Pré-évacuation 4 becs DE »), les écartés derrière « 3 écartés ⌄ » à 390, en gris avec × une fois ouverts et en paysage. Le lien sans aperçu est une ligne « ? » qui ouvre Compléter.
4. Fiche : interrupteur à droite de « Surveiller tous les 3 jours » (role=switch) ; courbe de 36 px chiffrée « 12’300 » puis « 11’700, 13 nov. » ; plus de sous-titre redit. Offres ailleurs, la moins chère d'abord, ligne entière touchable : « Abfülltechnik West, DE · 11’200, SAV étranger, −500 » et « Getränketechnik Ost, AT · 11’600, en stock, −100 » (cette dernière s'ajoute à Comparer).
5. Après un lien (T4) ou un partage (T5) : aucun Choisir ; toast « Rangé dans Ventilation · Changer ».
6. ★ devant le critère dans la bannière (Ventilation), et devant la raison quand elle est le critère après le choix (« ★ oxygène le plus bas »).
7. Feuille du choix : pastille « ✓ Choisi » sous le nom, coches à l'encre sans case pleine, raison décochée en gris, « Arrêter leur veille » en interrupteur.
8. Propositions de l'IA en puces « + Cadence », « + Formats de bouteille »…, gardées d'un toucher.
9. Volant b1r : actions du carnet en tête (Dicter, puis Coller le lien · Photo · Écrire sur une rangée) ; « Partout » toujours là, sur une rangée ; « Compta » au grand livre, le crayon reste à Écrire.
10. Mots : majuscule des carnets, plus de « (IA, exemple) » ni de « métadonnée » (« Pas d’aperçu pour ce lien ») ; nombre et unité insécables ; « Pré-évacuation » ne se coupe plus au trait.
11. Austérité : illustrations en matières (acier brossé, verre, ambre), fond chaud en dégradé, ombre au sol ; photo de bannière à 72 px.

## Captures (f9/p4/captures)
- 390, clair et cave : 39 états `p4-<état>-390.png`, `p4-<état>-cave-390.png`, plus `p4-carnet-apercu-390.png` (variante du journal).
- 844 : `p4-{repos,comparer,ventilation-comparer,frigo-comparer,carnet,comparer-ligne}-844.png` et `-cave-844.png`.
- 1280 : `p4-{repos,carnet,articles,comparer,fiche,pourquoi,ventilation-comparer}-1280.png`.
- Ouvertes en planches et regardées. Défauts vus puis corrigés : « Pré- / évacuation » coupé, « ★ Oxygène » collé à la puce « Prix ⌄ », « ★ Tient / 2 °C / jusqu’à » sur 3 lignes, Choisir encore présent dans l'état `lien`, puce « Cadence ⌄ » hors colonne.

## Écarts voulus et restes
- En-têtes de Comparer à 390 en 15 px, comme en paysage : la colonne de 92 px garde le nom entier.
- La pastille de la feuille du choix dit « Choisi » sans date, et l'en-tête « Pourquoi » est retiré (plafond de 40 mots) ; la date reste dans le journal et dans Pourquoi.
- « SAV à l’étranger » s'abrège en « SAV étranger » (fiche à 40 mots).
- Moitié basse encore claire sur Comparer à 390 quand les écartés sont repliés (3 lignes) : le paysage montre tout.
- La 1280 garde ses petits multiples ; les écartés y sont en gris avec ×, rangés à leur rang.

## Prédiction
« Là je lis tout de suite qui gagne et combien ça coûte, les barres veulent dire quelque chose, et mon switch de veille est là. »

DÉCISION À PRENDRE : deux choix ouverts, à montrer en variantes (L24) : le repli du journal (`?etat=carnet` contre `?etat=carnet&journal=apercu`, captures `p4-carnet-390.png` et `p4-carnet-apercu-390.png`), et la place des écartés dans Comparer à 390 (repliés ici, ou visibles en gris : 6 lignes, environ 48 mots).
CONNAISSANCE : dans une comparaison où certaines colonnes sont « moins = mieux », la barre suit la valeur depuis zéro et le meilleur se dit par la couleur ; le rang se calcule à part (score normalisé), sinon l'ordre des lignes et la barre se contredisent.
LEÇON PROPOSÉE : aucune
