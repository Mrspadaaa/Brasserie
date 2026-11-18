# c6a — c5a + les 18 filtres de l'audit, en tiroir à sections repliables (passe 4, 09.11)

Base : c5a telle quelle (carte de la 1056 tapée, pont des plages, écarts « + / = », ordre c4). Classes `c6a-`. Chaleur : froide.
Idée : le tiroir de c5a devient une liste de sections repliées, une ligne par filtre (nom · valeur posée ou repère · « ⌕ n » non documentées · chevron) ; on ouvre une section sur place. Les 11 du premier rang en lignes, « Plus de filtres » (7) en puces comptées, « Trier » en segments, « Voir 1 339 ».

## Cadres
1. « 1056 » tapé : rangée c5a + « bière » (défaut, grisé) + « repères 19 °C · 7 % » en pointillé rouge (jamais un filtre). Le 19 °C de la conduite est un trait rouge sur chaque piste °C. US-05 en tête de « Vendue CH · FR · DE » (liseré bleu), puis Verdant, Pomona, NovaLager ; Nottingham et BRY-97 en Europe.
2. Tiroir : Famille ouverte (10 familles comptées), Tolérance ouverte (histogramme 4 cases, repère « ≈ 7 » de ta bière, ⌕ 669) ; °C « repère 19 · ta conduite » ; Plus de filtres ; Trier (proche, prix, atténuation, °C, tolérance).
3. ale · couvre 18–20 °C · sans STA1 = 120 (0 vendue ici · 1 Europe · 119 rares). Bande ambre « STA1 non documentée 143 · dont 5 vendues ici · chercher » : US-05, Verdant, Pomona (1084, 1007 repliées) passent pâles avec « ⌕ STA1 ? » ; BRY-97 « STA1 − · fiche » ; WLP001 en rare.

## Comptes (vrais, `comptes-p4.mjs` → `comptes-p4.txt`, sur `yeastCatalogueBootstrap.json` et `yeastSupplyBootstrap.json`)
- Boisson (estimé : fabricant + mots du nom) : bière 1 339 · vin 330 · autres 64 (distillerie 37, cidre et hydromel 18, café, kvas… 9).
- Famille (estimé, mots : espèce, nom, usage, catégories ; une famille par fiche) : ale 403, lager 179, blé 198, belge 83, saison 53, anglaise 102, kveik 55, Brett 132, bactéries 56, mélange 78.
- Fiches bière : °C non documenté 620 ; atténuation 449 ; tolérance 669 (documentées : < 8 % 4, 8–10 57, 10–12 263, ≥ 12 346) ; floculation 443 ; forme sèche 106, liquide 76, 1 157 sans ; STA1 déclarée négative 437 (positive 115, 787 non documentées) ; labos 20 ; vitesse 154 ; rondeur 4 (sucres restants ; glycérol 0 fiche bière) ; soufre 2 ; nutriments 2 ; sans alcool 17 (mots, estimé). Style : 1 412 sans style (audit, tout le catalogue).
- Cadre 3 : ale ∧ plage couvrant 18–20 ∧ STA1 négative déclarée = 120 ; même chose STA1 non documentée = 143 (dont US-05, Pomona, Verdant, 1084, 1007) ; STA1 positive = 23 (M41, M31…).
- En stock « 1 » : fixture (US-05 de la recette), pas l'inventaire réel.
- Repères : 19 °C = palier 1 de la conduite ; ≈ 7 % = US-05 à OG 1,066 (6,8–7,1 % vol, fiche hypothèse 2).

## Honnêteté
Tolérance et °C restent des repères : aucune levure n'est retirée par la recette ; US-05 reste en tête après « 1056 » (c5b avait posé les plages de la 1056 en filtres et l'avait sortie). « Sans STA1 » ne garde que les déclarées négatives ; les non documentées ne sont ni cachées ni comptées dedans, elles sont rangées « à vérifier » (toucher = recherche IA, 09.11). Écart : les comptes de floculation et de forme diffèrent de c5a (209 / 411 / 186, sèche 126) parce que c6a compte les fiches bière seules (Boisson = bière par défaut).

## Boosters (data-booster)
rangee-filtres, repere-recette (pointillé rouge, sans filtrer), tiroir-sections (une ligne par filtre, valeur et ⌕ à droite), famille, tolerance-histogramme (repère ta bière sur l'histogramme), plus-de-filtres, trier, compte-rayons, chercher-ia (bande ambre), effets-us, pont.

## Contrôles
- verifier-page : PAGE OK (390 px, sans erreur) ; débordement : seulement les puces coupées de la rangée qui défile (voulu).
- `p2/s7a/controle-p4.mjs` : c6a OK, premier rang 11/11, second 7/7, US-05 en tête, Trier présent.
- Mots au premier écran : 99 bruts, 77 sans chiffres (> 72 ; c5a : 92 / 75).
- controle-panel (4 hauts de la passe) : PANEL ECHEC, remplissage 0,51 et ressemblance 0,94, voulu : c6a et c6b partagent c5a, sa base choisie. controle-commun : sans objet (contrôles houblon, la navigation échoue sur les pages levure).

## Retouches de la passe 4 (critique, SYNTHESE-P4 « Verdicts »)
1. Au repos, « Filtres » sans nombre ; la rangée de puces est remplacée par la ligne de résumé de c6b : « Filtres ˅ · bière · repères 19 °C · 7 % · proche de 1056 · 1 339 ».
2. Style compté sur les seules fiches bière : 233 documentées, ⌕ 1 106 (le 1 412 venait de tout le catalogue).
3. Lignes du tiroir à 30 px ; Famille repliée en résumé (« ale US 403 · blé 198 · lager 179 · Brett 132… · estimé ») pour tenir l'écran ; sous la tolérance, la bascule éteinte « ne garder que ≥ 7 % » et US-05 9–11 % (greffe c6b).
4. Famille « ale » renommée « ale US · neutre » (puce « ale US » au cadre 3) ; le rangement par mots reste « estimé », à normaliser au port.
5. Cadre 3 : les cinq vendues ici (US-05, Verdant, Pomona, 1084, 1007 épuisée), chacune sa ligne pâle « ⌕ STA1 ? ».
Comptes : `comptes-p4.mjs` relancé, `comptes-p4.txt` à jour (style bière, axes Arômes estimés). Contrôles rejoués : PAGE OK ; `controle-p4.mjs` c6a OK ; mots 101 bruts, 77 sans chiffres.
