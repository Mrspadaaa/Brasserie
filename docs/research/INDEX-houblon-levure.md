# Index des recherches houblon et levure (état au 19.10.2026)

Le brasseur : « Je crois que il y a eu déjà beaucoup de recherches à ce sujet, je sais pas si tout est déjà consigné quelques part. Ça vaut le coup de regarder et de compétenté ».

Jusqu'ici, rien n'était consigné en un seul endroit. Cet index réunit ce qui existe, ce qui est établi, les trous et les contradictions. Les recherches nouvelles s'ajoutent ici, sans refaire l'existant.

## Où se trouve la recherche

| Lieu | Contenu |
|---|---|
| `docs/index-houblon-*.md` (7 fichiers, 07–09.09) | Socle scientifique : axes, conjugués de thiols, huiles et perception, composition des transformations, risques, confiance ; revue, consolidation, lactones et esters, étalonnage, conception |
| `docs/hop-extrapolation.md`, `hop-math-audit.md`, `hop-prediction-validation.md`, `hop-recipe-prediction.md`, `water-dryhop-2026-09-09.md` | Le modèle V4/V5.5, son audit, son benchmark (seules erreurs mesurées), la recette complète, l'amertume à cru (Maye) |
| `docs/research/hop-style-*.md`, `hop-yeast-interactions-research.md`, `yeast-hop-practical-evidence.md` (12.09) | Houblonnage par style ; houblon × levure (Samia, Haslbeck, hop creep). Les deux derniers se recoupent largement |
| `docs/research/fermentation/` (= `functions/reports/fermentation-2026.md`) | Synthèse fermentation ; registre de 40 sources et 4 lacunes déclarées |
| `docs/research/yeast-*.md`, `yeast-enrichment/`, `nolo-*.md` | Levures : fenêtres des fabricants, catalogue (1 733 fiches), dosage, sans alcool |
| `work/refonte-frontend/v4/recherche/A–G` (18.10) | Conception UX (A–D, F, G) ; **E-donnees-houblon** : données houblon et recommandations pour le moteur |
| `work/refonte-frontend/v4/recherche/H-choisir-deux-houblons.md` (19.10) | État de l’art « choisir deux houblons » : Citra contre Cascade chiffrés, dry hop (dose, durée, ajouts successifs), seuils de perception, taux de transfert, stout 16D, levures, vieillissement ; table « faisable / pas faisable » ; 93 sources, chaque constat marqué établi, nouveau ou contredit |
| `work/refonte-frontend/v4/ecran-1/fils19-choix/` | `DIAGNOSTIC.md` (Citra = Cascade dans V5.5) et `INVENTAIRE.md` (ce que le code fait déjà) |
| `src/data/*Bootstrap.json`, `tests/fixtures/hopScientific/`, `tests/scientific/` | Ce qui est réellement installé et vérifié : 34 notes de recherche, lots publics (6 références, 88 mesures), courbe de dose de Lafontaine, lots Cascade 2015, DM303, Samia 2024 |
| Issues #119, #122, #124–#128, #131, #132, #137, #139, #140 | Besoins du brasseur et critères ; pas de science |

## Ce qui est établi, par thème

| Thème | Établi (document) | Niveau | Ce qui manque |
|---|---|---|---|
| Huiles et perception | Cascade 2015 : géraniol → agrumes, R² 0,50 sur 29 lots (`index-houblon-etalonnage`). Huile totale non corrélée à l'intensité sur 23 lots (Vollmer 2016). Un marqueur ≈ moitié de la variance, propre à la variété (Lafontaine 2018, 84 lots). Aucun modèle général transférable (`index-houblon-recherche`) | Local : une variété, une récolte | Profils d'huiles complets et multi-sources (#131) ; les lots Centennial de Lafontaine 2018 ne sont pas utilisés |
| Thiols et précurseurs | Formes cystéinylée et glutathionylée distinctes (Santiago 2015, Chenot 2022, Christiaens 2025). Activité enzymatique non corrélée aux thiols libérés (Calicis 2025). Diamond : le plus de thiols, mais le moins de fruité perçu (Samia 2024) | Qualitatif | Aucun rendement par précurseur, souche ou variété ; un seul jeu de mesures (Cascade T90) |
| Biotransformation | β-lyase (IRC7) ; géraniol → β-citronellol (Takoi) ; 3MH → 3MHA (ATF1). Évaluation qualitative codée dans `src/domain/hopDecision/biotransformation.ts` | Mécanismes | Taux, temps, effet de dose |
| Dry hop, dose | Lafontaine 2018 : agrumes ≈ 7,1 à 8 g/L et 7,0 à 16 g/L ; l'herbacé monte au-delà. « Pas un plafond général » (`hop-style-practical-research`) | Un lot, un protocole | Autres variétés et formes |
| Dry hop, durée et température | Protocole de 24 h à 13,3–15 °C (Lafontaine). Thiols selon la température (Samia : 15, 22, 30 °C) | Qualitatif | Aucune courbe de durée, aucune loi thermique |
| Hop creep | Mécanisme (Stokholm et Shellhammer, Kirkpatrick 2018, Willemart 2025) ; contrôle de densité après le dernier ajout | Qualitatif | Aucun taux, aucune probabilité |
| Levure et arôme | Fenêtres des fabricants ; esters selon température, densité et inoculum ; pression (Souffriau) ; POF et STA1 ; Cui 2015 (DM303, 4VG et 4VP) : seul modèle levure chiffré | Fiches, un modèle local | Esters toutes souches ; effet de la levure sur l'expression du houblon (identique pour toutes dans V5.5) |
| Modèles et validation | Benchmark du 09.09 : MAE agrumes 0,444 contre 0,581 pour la constante ; couverture 26/29 ; pas de validation externe (`hop-prediction-validation`) | Reproduction | Jeu indépendant ; dégustations calibrées (#139) |
| Données variétales | 760 à 766 fiches de 5 bases (doublons) ; variabilité de récolte (Hopsteiner : −45 % d'huile pour Hallertau Blanc) ; fiches divergentes (Nugget : huile 0,8 à 3,3 mL/100 g) | Documentaire | Licences (D25) ; plusieurs sources par valeur (#131) ; substituts |
| Style et matrice | IBU BJCP 2021 par style ; usages « IPA » de 67 variétés | Référence | Stout et porter : aucun usage (#127) ; masquage par le torréfié non étudié |

## Les trous

1. **Biotransformation chiffrée** : rien par souche, précurseur ou temps.
2. **Dry hop, la combinaison dose × durée × température × forme** : une seule expérience (Cascade, 24 h).
3. **Hop creep chiffré.**
4. **Huiles complètes et thiols par variété et par récolte** (#131).
5. **Stout et porter** : usages, masquage par le torréfié.
6. **Esters de levure** toutes souches ; **interaction levure × houblon chiffrée**.
7. **Validation externe** : aucun jeu indépendant, aucune dégustation calibrée.
8. **Vieillissement et HSI** : étudiés (Rutnik 2022), sans modèle.
9. **Licences** des données (D25).

## Les contradictions à arbitrer

1. **Les bornes chiffrées.** `index-houblon-recherche` : « sans bornes défendables, même cette formule ne doit pas fabriquer une plage numérique ». Or `hop-extrapolation` produit des plages 0–100 à partir de bornes de jugement.
2. **La régression ou l'ordinal.** E (rec. 7) : « pas de régression fine ; valider en ordinal ». Or le dépôt livre une régression (Cascade, R² 0,50) et des intervalles numériques.
3. **La charge d'huile.** E (rec. 2) : une charge en µL/L, « jamais comme intensité ». `index-houblon-recherche` (§3) interdit la somme « huile × poids » présentée comme une mesure sensorielle. La frontière est mince ; le moteur « pouvoir aromatique » demandé le 19.10 doit la trancher.
4. **Les 12 familles** n'ont pas le même nom partout (« boisé et résineux », « résineux », « vert/herbeux », « végétal »).
5. **Les études Samia** sont citées sous 2024, 2025 et 2026 pour des travaux différents. Il faut citer par DOI.
6. **« US-05 neutre »** : Kumar 2023 la dit « pas dépourvue de transformation ».
7. **Le plateau de dose à 8 g/L** : observé sur Cascade, mais « pas un plafond général ».

Recensement complet, document par document (dates, conclusions, chiffres, statut) : rapport de l'agent du 19.10, résumé ici. Les détails de chaque document restent dans le document lui-même.
