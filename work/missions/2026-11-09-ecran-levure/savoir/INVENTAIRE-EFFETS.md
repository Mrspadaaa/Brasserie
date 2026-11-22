# Inventaire des effets levure (arômes, bouche, biotransformation)

Date : 2026-11-09. Mission : 2026-11-09-ecran-levure, dossier savoir/. Lecture seule : aucun appel IA, aucun web, aucune donnée modifiée. Chemins relatifs à la racine du dépôt.

Légende : (cat.) = `catalogue.facts` de `src/data/yeastCatalogueBootstrap.json` ; (profil) = `src/data/yeastRecipeProfiles.ts` ou enrichissements belge/lager ; (doc) = fichier de `docs/research/` ; « absent » = aucune source trouvée dans le dépôt ; « non vérifié » = non terminé.

## Données

1. `src/data/yeastCatalogueBootstrap.json` : 1 733 fiches. Faits par clé (effets) : aroma 862, pof 346, esters 46, higherAlcohols 29, glycerol 62, residualSugar 15, biotransformation 170 (dans 127 fiches : 123 Escarpment Labs, 4 Omega Yeast), betaLyase 1 fait (fiche white-labs-wlp830). Champ `betaLyase` de la fiche = « unknown » pour les 1 733. Glycerol : 62 fiches, toutes Lallemand Wine. Residual sugar : 15 fiches, vin, NOLO et malolactiques.
2. `src/data/yeastCatalogueLibrary.json` : 1 733 entrées (version 1). Structure seule, non lue en détail.
3. `src/data/yeastEnrichmentBelgian.json` : 7 profils (Wyeast 1214, 3787, 3522, 3711 ; WLP500, WLP530 ; BE-256). `affinities` par but. BE-256 : fruit et banane, POF négatif.
4. `src/data/yeastEnrichmentLager.json` : 7 profils (Wyeast 2124, 2308, 1968 ; WLP830, WLP002 ; S-189, S-23). WLP830 : potentiel β-lyase relatif, texte fabricant sans gain garanti.
5. `src/data/yeastRecipeProfiles.ts` : profils curés (base + belge + lager), `affinities` par but (banana, clove, fruit, clean, dry, hops, balanced, low-sulfur), drapeaux `phenolic`, `diastatic`, `temperatureEsters`.
6. `src/data/yeastPracticalGuides.ts` : ids de guides (direct-pitch, flocculation, headspace, late-hops, rehydrate, storage, sulfur, suspension). Aucun effet chimique. Non vérifié au-delà des ids.
7. `src/data/hopYeastBootstrap.json` : 6 fiches (US-05, Diamond, Nottingham, London, BRY-97, Verdant IPA). `betaLyase` = « unknown » partout ; source : étude Samia.
8. `src/data/yeastCoreReferences.json` : 5 fiches (US-05 et NOLO : LoNa, WLP618, LA-01, Zero Hero).
9. `src/data/fermentationScienceBootstrap.json` (version 2026.09.08.1) : 12 composés (acétate d'isoamyle, esters éthyliques, 4VG, 4VP, diacétyle, acétaldéhyde, H2S, DMS, fusels, 3SH, 3SHA, lactones), 12 études, 20 leviers, 6 buts (banana, balanced, fruit, clean, phenolic, thiols), 7 benchmarks (Voss ×3, Abbaye, Belle Saison, Verdant, Pomona), 1 étude phénol locale (DM303, Cui 2015).
10. `docs/research/yeast-enrichment/README.md` et `mangrove.md` : 218 fiches enrichies, 2 531 observations. M44 : 18–23 °C seulement (mangrove.md, guide p. 21).

## Code

- `src/domain/yeastStrainInformation.ts` : `yeastStrainInformation(ref, form)` lit aroma, esters, betaLyase, biotransformation, flocculation. Affiché par `YeastStrainDetails` dans `src/ui/YeastChoiceComparison.tsx` et `src/ui/YeastRecipeChoice.tsx`.
- `src/domain/yeastCompanion.ts` : `buildYeastCompanion` lit pof, sta1, diastatic, esters, aroma, biotransformation, betaLyase, attenuation, flocculation. Utilisé par `src/ui/BrewSheetWithCompanion.tsx`.
- `src/domain/yeastStyleEvidence.ts` : `yeastStyleEvidence(ref)` ; buts par mots-clés sur les seules clés aroma et esters (l. 163-164), profil curé en repli. Ne lit pas pof.
- `src/domain/yeastRecipeDesign.ts` : `evaluateYeastRecipeDesign` produit des `YeastRecipeEffect` (documented, conditional, unknown, warning). `yeastTrait` lit pof et diastatic/sta1 (l. 191-206). But « clove » exige un phénolique positif (l. 371). Utilisé par `src/ui/YeastRecipeWorkbench.tsx` et `src/ui/YeastRecipePlan.tsx`.
- `src/domain/yeastProjection.ts` : atténuation, alcool, floculation. Ne lit ni glycerol ni residualSugar.
- `src/domain/yeastCatalogueSummary.ts` : bandes et titre depuis attenuation et temperature.
- `src/domain/yeastReferences.ts` : fusion catalogue et enregistré ; `effectiveYeastCatalogueFacts`, remplacements revus.
- `src/domain/hopDecision/biotransformation.ts` : `assessHopBiotransformation` ; 4 mécanismes (thiolRelease, geraniolToCitronellol, fermentationAroma, hopCreep). Statut selon état de fermentation, signal de précurseur et `yeast.betaLyase` (positive, negative, unknown). Aucun coefficient. Appelé par `src/domain/hopDecision/service.ts` (cas 'biotransformation').
- `src/domain/brewingNuanceProjection.ts` (aroma) et `src/domain/brewingScenario.ts` (aroma, betaLyase).
- `src/domain/noloYeastSelection.ts` : candidats NOLO selon diastatic et pof.
- Sans lecture d'effet (vérifié par grep des clés) : yeastBeerTarget, yeastFermentationStrategy, yeastPitching, yeastSupplyComparison, yeastBrewDay, yeastFlocculation, yeastCatalogue (étiquettes seulement), yeastCatalogueLibrary, recipeYeastReferences.
- `scripts/fermentation-science/evidence.mjs` : contient glycerol, residualSugar, higherAlcohols, biotransformation (grep). Non lu.

## Recherches passées

- `docs/research/hop-yeast-interactions-research.md` (254 l.) : §4 leviers banane et girofle (Wyeast 3068, Munich Classic, dose 0,5 et 1,0 g/L à 20 et 25 °C) ; §5 IPA : Verdant, London Ale III, WLP066, US-05 ; biotransformation : recettes Pomona (géraniol vers β-citronellol), Samia (5 souches, 15, 22, 30 °C), Haslbeck (myrcène).
- `docs/research/yeast-hop-practical-evidence.md` (259 l.) : §3 contribution fermentaire contre biotransformation. Samia : Verdant et BRY-97 varient moins en thiols que Nottingham et London. Omega (Thiolized). Escarpment TERPS (géraniol vers β-citronellol). Belle Saison : β-glucosidase déclarée, pas une β-lyase. §7 : tableau d'ids catalogue et atténuations.
- `docs/research/fermentation/report-source.md` (66 l.) : esters, phénols (4VG, POF et STA1 séparés), thiols (Samia 2024, 2025, 2026 ; lactones). Pas de chiffre par levure.
- `docs/research/fermentation/source-ledger.json` : 40 sources (18 fabricant, 21 recherche, 1 jugement). 4 lacunes déclarées : esters universels (aucun modèle activé), dynamique toutes souches, thiols 2026 (qualitatif), phénols DM303 (calcul local).
- `docs/research/yeast-belgian-enrichment.md` (97 l.) : BE-256 fruité et banane, POF négatif, Q&A Fermentis.
- `docs/research/yeast-wheat-style-evidence.md` (174 l.) : WB-06 fruitée, phénolique, diastatique (grep).
- `docs/research/yeast-information-enrichment.md` (67 l.) : signes POF, absence distincte de négatif (grep, l. 45).
- `docs/research/INDEX-houblon-levure.md` (59 l.) : index, état au 19.10.
- Pointeurs non lus : `work/finalisation-tickets-2026-10-08/github/publie/issue-fiche-levure-20261016.md`, `work/finalisation-tickets-2026-10-08/AI07-C/logs/carte-levure-compagnon.md`. Les hits de `work/` (JSON générés, streams, logs) sont des mentions, pas des recherches.

## Couverture (12 levures × effets)

Légende : valeur courte (source) ; « absent » = aucune source dans le dépôt.

| Levure (id) | Fruité / banane (esters) | Épicé / phénols (POF) | Rondeur / corps (glycérol) | Atténuation | Sucres résiduels | Biotransformation / β-lyase / thiols |
|---|---|---|---|---|---|---|
| SafAle US-05 (fermentis-us05) | Low (cat.) | POF− (fermentationScience locator ; cat. : non documenté) | absent | 78–82 % (cat.) | absent | absent ; fiche sans mesure β-lyase |
| SafAle S-04 (…safale-s-e2-80-9104) | Low (cat.) ; « fruitée et florale » (profil), conflit | – (cat.) | absent | 74–82 % (cat.) | absent | absent |
| SafAle BE-256 (…be-e2-80-91256) | High (cat.) ; banane, acétate d'isoamyle (Q&A) | – négatif (cat.) | absent | 82–86 % (cat.) | absent | absent |
| SafAle T-58 (…safale-t-e2-80-9158) | High (cat.) | + (cat.) | absent | 72–78 % (cat.) | absent | absent ; aucun profil curé |
| SafLager W-34/70 (yeast-fermentis-saflager-w-34-70) | Low (cat.) | – (cat.) | absent | 80–84 % (cat.) | absent | absent ; lager-rest (fermentationScience) |
| SafAle WB-06 (yeast-fermentis-safale-wb-06) | Medium (cat.) | + (cat.) | absent | 86–90 % (cat.) | absent | absent ; diastatique (profil) |
| LalBrew Verdant IPA (lalbrew-verdant-ipa) | absent ; abricot, tropical, agrumes (aroma cat.) | absent (gap) | absent | 75–82 % (cat.) | absent | thiols mesurés (Samia) ; β-lyase « unknown » |
| LalBrew Nottingham (lalbrew-nottingham) | absent ; « esters discrets » (profil) | absent (gap) | absent | 78–83 % (cat.) | absent | thiols (Samia) ; β-lyase « unknown » |
| LalBrew Pomona (lalbrew-pomona) | absent ; pêche, agrumes, tropical (aroma cat.) | absent (gap) | absent | 75–84 % (cat.) | absent | géraniol vers β-citronellol (recettes Lallemand, doc seulement) |
| LalBrew Belle Saison (lalbrew-belle-saison) | absent ; « fruity, spicy » (aroma cat.) | POF+ (doc, non vérifié en cat.) | absent | 86–94 % (cat.) | absent | β-glucosidase déclarée, pas β-lyase (doc) |
| LalBrew Abbaye (lalbrew-abbaye) | absent ; à T élevée : tropical, épicé, banane (aroma cat.) | absent (gap) | absent | 77–83 % (cat.) | absent | absent |
| Mangrove Jack's M44 (yeast-mangrove-jacks-132015569) | absent | absent | absent | 77–85 % (cat.) | absent | absent |

Totaux (12 levures) : esters 6 (clé cat.) ; POF 5 (clé cat.) + 1 doc (Belle Saison) ; aroma texte 5 ; atténuation 12 ; glycérol 0 ; sucres résiduels 0 ; biotransformation (clé cat.) 0 ; β-lyase mesurée 0 ; thiols mesurés par étude 2 (Verdant, Nottingham).

## Trous

1. Rondeur et corps (glycérol) : 0 levure sur 12. Clé `glycerol` seulement sur 62 fiches de vin. Aucun terme de corps ou de rondeur trouvé dans les faits des 12.
2. Sucres résiduels : 0 sur 12. Clé sur 15 fiches vin, NOLO et malo.
3. Biotransformation par clé catalogue : 0 sur 12. 127 fiches, aucune des 12. Les Escarpment définissent le géraniol vers β-citronellol, sans équivalent chiffré pour les 12.
4. β-lyase mesurée : 0 sur 12. Un seul fait `betaLyase` dans 1 733 fiches ; champ « unknown » partout.
5. Thiols mesurés par souche : 2 sur 12 (Verdant, Nottingham, étude Samia). Aucun chiffre dans le dépôt, ce qui est voulu.
6. Géraniol vers β-citronellol : seul Pomona en a une source (recettes Lallemand, prose). Non vérifié comme coefficient ; à traiter comme proposition fournisseur.
7. POF : absent pour 5 sur 12 (Verdant, Nottingham, Pomona, Abbaye, M44). US-05 : catalogue « non documenté » contre POF− dans le locator fermentationScience, à trancher à la source Fermentis.
8. Esters : clé absente pour 6 sur 12. Pomona, Abbaye, Belle Saison et Verdant n'ont qu'un texte aroma. Nottingham n'a qu'un profil curé. M44 : rien.
9. Conflits à trancher : S-04 esters Low (cat.) contre « fruitée et florale » (profil) ; Belle Saison POF+ (doc) contre fiche sans clé pof ; Abbaye profil « fruit, balanced » contre aroma cat. « tropical, spicy, banana ».
10. Fiches sans profil curé : T-58 (fiche riche : esters High, POF+, 8 faits, mais aucun profil ni doc) ; M44 (fiche pauvre, seul M20 est profilé).
11. Pas d'échelle comparable : aucune intensité chiffrée pour banane, épicé ou rondeur entre les 12. Les fiches disent « aucune intensité prédite ». Un tableau ordinal exige une source ou un avis explicite.
12. Recherche externe non faite ici : glycérol, sucres résiduels et biotransformation des 12 restent à chercher (aucun appel effectué, non vérifié au-delà de ce dépôt).

Sources : 34 fichiers lus ou interrogés par grep (pointeurs non lus exclus).
