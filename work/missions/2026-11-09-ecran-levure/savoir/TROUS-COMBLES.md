# Trous comblés : effets levure (recherche sourcée)

Date : 2026-11-09. Mission 2026-11-09-ecran-levure. Complète `INVENTAIRE-EFFETS.md` (12 trous). Aucun fichier de `src/` touché ; propositions machine dans `faits-proposes.json` (46 faits, non appliqués). « Déclaré » = fabricant ; « étude » = mesure publiée. « non documenté » = rien trouvé à la source, pas une supposition. Aucune échelle d'intensité inventée : seuls les ordres des sources sont repris (Faible/Moyen/Élevé Fermentis ; Low/Medium/High Lallemand).

Limites de méthode : fiches Fermentis et TDS lues par résumé de page ou extraction PDF (`pdftotext`). Les TDS Fermentis (2018) donnent des chiffres de labo (esters en ppm, sucres résiduels en g/L) en conditions standard : ce sont des mesures du fabricant, pas des valeurs de brassage. Le tableau terpène/thiol de Lallemand est une image (lue visuellement) : « activité enzymatique relative », thiols fondés sur caractérisation labo et retours de brasseries [22].

## Tableau : 14 levures × effets

Colonnes : esters (banane/fruité), POF (épicé/girofle), corps/rondeur, biotransformation (β-lyase, β-glucosidase, géraniol→citronellol, thiols), sucres résiduels, conflit de l'inventaire. Corps/rondeur : aucune valeur de glycérol trouvée pour ces 14 levures bière.

| Levure | Esters | POF | Corps / rondeur | Biotransformation | Sucres résiduels | Conflit |
|---|---|---|---|---|---|---|
| SafAle US-05 | Faible ; 40 ppm [1][2] | non déclaré, pas POF− [1][2] | non documenté | non documenté | 11 g/L dont 3 g/L maltotriose [2] | POF : tranché |
| SafAle S-04 | Faible ; 37 ppm ; fruité-floral [3][4] | − (symbole) [3] | non documenté | non documenté | 18 g/L dont 10 g/L maltotriose [4] | esters : tranché |
| SafAle BE-256 | Élevé ; acétate d’isoamyle [5][7] (TDS ancien : 20 ppm [6]) | − déclaré [7] | non documenté | non documenté | 0 g/L [6] ; maltotriose consommé [16] | esters : réserve |
| SafAle T-58 | Élevé ; 37 ppm [8][9] | + ; girofle [8][9] | non documenté | non documenté | 22 g/L dont 11 g/L maltotriose [9] | — |
| SafLager W-34/70 | Faible ; floral-fruité [10] | − (symbole) [10] | non documenté | non documenté | 5 g/L dont 2 g/L maltotriose [11] | — |
| SafAle WB-06 | Moyen ; 78 ppm [12][13] | + ; girofle [13] | non documenté | non documenté | 0 g/L ; maltotriose consommé [13][16] | — |
| LalBrew Verdant IPA | niveau non documenté ; abricot, tropical [17] | − déclaré [17] | un peu plus de corps qu’une IPA US [17] | β-lyase déclarée [17] ; terpène Medium, thiol High [22] | non documenté | — |
| LalBrew Nottingham | neutre à légèrement estérifié [18] | − déclaré [18] | non documenté | β-gluc. et β-lyase « modérées » [18] ; terpène Medium, thiol High [22] ; plus de thiols des ales testés [23] | non documenté | — |
| LalBrew Pomona | niveau non documenté ; pêche, agrumes [19] | − déclaré [19] | non documenté | annoncée [19] ; terpène High, thiol Medium [22] ; géraniol vers citronellol : non documenté | non documenté | — |
| LalBrew Belle Saison | niveau non documenté ; agrumes, poivre [20] | + déclaré [20] | non documenté | β-glucosidase déclarée, pas de β-lyase [20] ; terpène High, thiol Low [22] | dextrines partiellement utilisées, STA1+ [20] | POF : tranché |
| LalBrew Abbaye | tropical, épicé, banane à chaud [21] | + déclaré [21] | non documenté | terpène Medium, thiol Low [22] | non documenté | profil « équilibré » : tranché |
| Mangrove Jack’s M44 | très neutre, niveau non documenté [25] | non documenté | sec, net ; mince si bière légère [25] | non documenté | non documenté | — |
| Fermentis BE-134 | Moyen ; 45 ppm [14][15] | + ; girofle [15] | sec [14] | non documenté | 0 g/L [15] | — |
| Mangrove Jack’s M20 | esters de banane abondants [25] | girofle phénolique [25] | crémeux, soyeux, corps plein [25] | non documenté | non documenté | — |

## Conflits tranchés à la source (5)

1. US-05, POF. Le catalogue dit « non documenté », le locator fermentationScience dit POF−. À la source : la page Fermentis [1] a le champ « Phenolic Off-Flavor » vide ; la TDS [2] ne parle pas de POF (alors que T-58, WB-06 et BE-134 écrivent « POF+ » en toutes lettres [9][13][15]). Verdict : Fermentis ne déclare rien ; « non documenté » est exact, le POF− du locator n'a pas de source fabricant. Seule une page tierce (brewing.it, non retenue) l'annonce négatif.
2. S-04, esters. Catalogue Low contre profil « fruitée et florale » : pas de contradiction. Fermentis écrit les deux : esters totaux Low (37 ppm) et « balanced fruity and floral notes » [3][4]. Garder Low, ajouter le descripteur.
3. Belle Saison, POF. Positif : « This strain is POF Positive » [20]. La fiche catalogue peut recevoir `pof` = positif. Autres faits déclarés : STA1 positif, diastaticus (utilise des dextrines), β-glucosidase exprimée, pas de β-lyase [20] ; tableau Lallemand : terpènes High, thiols Low [22].
4. Abbaye (Lallemand), profil « fruit, balanced » contre aroma catalogue : la TDS donne « fruity and spicy », POF positif, et à haute température « tropical, spicy and banana » ; à basse température raisin, datte, figue [21]. Le catalogue est juste, « balanced » n'a pas de source. À ne pas confondre avec le BE-256 de Fermentis.
5. BE-256, esters (conflit nouveau, avec réserve). Page actuelle : esters totaux High, « strong fermentation aromas » [5] ; Q&R : « high levels of isoamyl acetate » [7] ; Make a choice : BE-256 et WB-06 « more fruity flavor » [16]. Mais la TDS espagnole (2018) montre 20 ppm d'esters totaux et « aromas sutiles » [6]. Retenu : High (trois sources fabricant récentes) ; le 20 ppm reste un chiffre de labo à une température donnée, non réconcilié.

Autre fait utile : le symbole « – » de la page Fermentis vaut POF négatif (BE-256 : « won't produce any spicy flavours » [7]). Appliqué à S-04 et W-34/70 par analogie, noté comme tel.

## Biotransformation : ce que disent les sources

- β-lyase (thiols) : gène IRC7 ; une délétion de 38 pb réduit l'activité et est courante chez les souches de vin et moins chez les ales ; la mutation T185A la réduit d'environ 50 % ; la libération de 3MH reste faible en bière (≈ 0,1 à 0,5 % de conversion) [26]. Aucun fabricant ne publie de valeur IRC7 par souche ici.
- Samia et al. (2026, JASBC 84(1)) : même moût à 15, 22, 30 °C. Lager Diamond le plus de thiols (2 à 3 fois les ales) ; parmi les ales, Nottingham le plus, BRY-97 le moins ; 3SH monte de 33 à 72 % avec la température ; goût tropical maximal pour les ales à 22 à 30 °C ; la différence entre souches est attribuée à l'activité β-lyase (IRC7/STR3) [23]. Verdant testée, sans classement séparé dans le résumé. Article non lu : résumé Lallemand seulement.
- Géraniol vers β-citronellol : réduction par une enzyme NADPH (Lallemand cite l'enzyme, pas de souche) [27] ; la dépendance à la souche (étude OYE2, essais de bière) n’a été vue que dans des extraits de recherche, donc non retenue comme fait. Aucune donnée par souche pour les 12 : « non documenté ».
- Pomona : « exceptional » dans la newsletter [28], et mieux en passion/goyave que Verdant selon Sierra Nevada (retour de brasserie, pas une mesure). Non chiffré.
- Lager : aucune donnée fabricant pour W-34/70 (le tableau Lallemand ne couvre que ses souches).

## Reste non documenté (26 cases du tableau, sur 70)

- Corps/rondeur : aucun fabricant ne publie de glycérol pour ces levures bière. Seuls des mots : Verdant (un peu plus de corps), M20 (crémeux, plein), M44 (sec ; mince si bière légère), BE-134 (sec). US-05, S-04, BE-256, T-58, W-34/70, WB-06, Nottingham, Pomona, Belle Saison, Abbaye : rien.
- Biotransformation : US-05, S-04, BE-256, T-58, W-34/70, WB-06, BE-134, M44, M20 : rien (aucune souche Fermentis ou Mangrove Jack's dans le tableau Lallemand ni dans l'étude Samia). β-lyase chiffrée : aucune souche. Géraniol→citronellol par souche : aucune.
- Sucres résiduels : 6 levures Lallemand/Mangrove (Verdant, Nottingham, Pomona, Abbaye, M44, M20) sans valeur ; Belle Saison seulement qualitatif.
- POF : M44 (aucun avis fabricant ; une page tierce dit négatif, non retenue).
- Niveau d'esters en clair : Verdant, Pomona, Belle Saison (descripteurs seulement), M44 (neutre).
- BE-134 et M20 : couverts partiellement (hors des 12 demandés).

## Pistes pour le port (non appliquées)

- `pof` : ajouter Belle Saison, Verdant, Nottingham, Pomona, Abbaye (déclarés), T-58/WB-06/BE-134/M20 (positif), S-04/W-34/70/BE-256 (négatif). Ne rien inscrire pour US-05 et M44.
- `residualSugar` Fermentis : mettre « essai labo Fermentis » dans la valeur, car ce sont des g/L en conditions standard, pas une prédiction.
- `biotransformation` : un fait par souche Lallemand avec l'ordre du tableau [22], marqué « activité enzymatique relative ».
- `betaLyase` : ne mettre « positive » que pour Verdant et Nottingham (expression déclarée) ; Belle Saison reste inconnue (β-glucosidase seulement).

## Sources (consultées le 2026-11-09)

1. Fermentis, SafAle US-05 (page produit) : https://fermentis.com/en/product/safale-us-05/ (consulté 2026-11-09)
2. Fermentis, TDS SafAle US-05, rev. mars 2018 : https://rahrbsg.ca/wp-content/uploads/2021/12/SPEC-Fermentis-SafAle-US-05-030118.pdf (consulté 2026-11-09)
3. Fermentis, SafAle S-04 (page produit) : https://fermentis.com/en/product/safale-s-04/ (consulté 2026-11-09)
4. Fermentis, TDS SafAle S-04, rev. mars 2018 : https://rahrbsg.ca/wp-content/uploads/2021/12/SPEC-Fermentis-SafAle-S-04-030118.pdf (consulté 2026-11-09)
5. Fermentis, SafAle BE-256 (page produit) : https://fermentis.com/en/product/safale-be-256/ (consulté 2026-11-09)
6. Fermentis, TDS SafAle BE-256 (version espagnole, rev. mai 2018 selon recherche) : https://distributors.fermentis.com/download/127/spanish/755/safale-be-256-es.pdf (consulté 2026-11-09)
7. Fermentis, SafAle BE-256 questions and answers : https://fermentis.com/en/knowledge-center/expert-insights/beer/safale-be-256-questions-answers (consulté 2026-11-09)
8. Fermentis, SafAle T-58 (page produit) : https://fermentis.com/en/product/safale-t-58/ (consulté 2026-11-09)
9. Fermentis, TDS SafAle T-58, rev. mars 2018 : https://rahrbsg.ca/wp-content/uploads/2021/12/SPEC-Fermentis-SafAle-T-58-030118.pdf (consulté 2026-11-09)
10. Fermentis, SafLager W-34/70 (page produit) : https://fermentis.com/en/product/saflager-w-34-70/ (consulté 2026-11-09)
11. Fermentis, TDS SafLager W-34/70 (copie distributeur) : https://morewine.com/cdn/shop/files/SafLager-W-3470.pdf (consulté 2026-11-09)
12. Fermentis, SafAle WB-06 (page produit) : https://fermentis.com/en/product/safale-wb-06/ (consulté 2026-11-09)
13. Fermentis, TDS SafAle WB-06, rev. janv. 2018 : https://rahrbsg.ca/wp-content/uploads/2021/12/SPEC-Fermentis-SafAle-WB-06-010118.pdf (consulté 2026-11-09)
14. Fermentis, SafAle BE-134 (page produit) : https://fermentis.com/en/product/safale-be-134/ (consulté 2026-11-09)
15. Fermentis, TDS SafAle BE-134, rev. mars 2018 : https://rahrbsg.ca/wp-content/uploads/2021/12/SPEC-Fermentis-SafAle-BE-134-030118.pdf (consulté 2026-11-09)
16. Fermentis, Make our yeasts for beers (Make a choice) : https://www.CastleMalting.com/Presentations/Fermentis_Make-a-choice_EN.pdf (consulté 2026-11-09)
17. Lallemand Brewing, TDS LalBrew Verdant IPA (A4) : https://cdn.shopify.com/s/files/1/0323/8825/1780/files/Verdant_TDS_ENG_Print_A4_LalBrew.pdf (consulté 2026-11-09)
18. Lallemand Brewing, TDS LalBrew Nottingham (copie Scott Laboratories) : https://files.scottlab.com/uploads/NOTTINGHAM%20TDS.pdf (consulté 2026-11-09)
19. Lallemand Brewing, TDS LalBrew Pomona (copie Murphy and Son, 2024) : https://murphyandson.co.uk/wp-content/uploads/2024/07/Pomona-TDS-ENG-8.5x11-Print-LalBrew.pdf (consulté 2026-11-09)
20. Lallemand Brewing, TDS LalBrew Belle Saison (copie Scott Laboratories) : https://files.scottlab.com/uploads/BELLE%20SAISON%20TDS.pdf (consulté 2026-11-09)
21. Lallemand Brewing, TDS LalBrew Abbaye (copie Scott Laboratories) : https://files.scottlab.com/uploads/ABBAYE%20TDS.pdf (consulté 2026-11-09)
22. Lallemand Brewing, Strain Terpene and Thiol Favoring Activity table (2025-05) : https://admin.lallemandbrewing.com/wp-content/uploads/2025/05/Strain-Terpene-and-Thiol-Favoring-Activity-table.png (consulté 2026-11-09)
23. Lallemand Brewing, Which factors influence thiol release? New OSU thiol research (résumé de Samia et al. 2026, J. Am. Soc. Brew. Chem. 84(1):65-76 ; article non lu) : https://www.lallemandbrewing.com/en/africa/resources/whats-new/which-factors-influence-thiol-release-new-osu-thiol-research-published/ (consulté 2026-11-09)
24. Lallemand Brewing, Biotransformation: ongoing research : https://lallemandbrewing.com/en/asia/resources/whats-new/biotransformation-ongoing-research (consulté 2026-11-09)
25. Mangrove Jack’s, Craft Series Yeast (livret : M20 p. 12, M44 p. 25) : https://cdn.shopify.com/s/files/1/0520/9384/5665/files/Craft_Series_Yeast.pdf (consulté 2026-11-09)
26. Svedlund, Evering, Gibson, Krogerus, Appl. Microbiol. Biotechnol. 106:4929-4944 (2022), revue sur la libération des thiols par les levures : https://pmc.ncbi.nlm.nih.gov/articles/PMC9329171/ (consulté 2026-11-09)
27. Lallemand Brewing, What are terpenes? (centre biotransformation) : https://www.lallemandbrewing.com/en/asia/biotransformation-resources-center/terpenes/ (consulté 2026-11-09)
28. Lallemand Brewing, Quarterly newsletter issue 18 (janv. 2025), essais Pomona : https://admin.lallemandbrewing.com/wp-content/uploads/2024/12/newsletter-WBWY-18-web-1.pdf (consulté 2026-11-09)
