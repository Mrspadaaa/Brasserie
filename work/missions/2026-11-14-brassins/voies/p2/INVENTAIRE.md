# Inventaire e7a — « Le bilan » (port p2)

Maquette : `voies/e7/e7a/etat.html` (états `repos` = OG, `geste` = FG). Code : `CatalogAnalysis.tsx`, `BatchOutcomeAnalysis.tsx`, `bilan/bilanModel.ts`, `bilan/bilan.css`.

| Élément de la maquette | Statut | Où |
| --- | --- | --- |
| Titre « Le bilan » + interrupteur Archives | existe (neuf rendu) | `CatalogAnalysis` : bascule locale, inclut ou retire les lots archivés ; désactivée sans archive |
| Flèche retour « Retour aux brassins » | à créer, **non branchée** | exige `onBack` dans `ProductionCatalog` (hors voie) : ACCORD dans RESULTAT |
| Question « Densité initiale · ai-je atteint ma cible ? » | existe | `BatchOutcomeAnalysis` (une ligne par mesure) |
| Phrase-réponse en 28 px (« 3 brassins sur 4 dans la cible ») | à créer | `titreBilan` |
| Pastilles (lot hors cible, lot en cours à J+n) | à créer | `pastillesBilan` ; ton water / attention / hachuré |
| Segments OG / FG / Alcool / Volume avec compte 3/4 | existe (ordre et libellés de la maquette) | `scoreBilan` ; « — » quand rien à comparer |
| Ligne de lot : teinte, nom, lot, bande verte, ligne cible, barre d'écart, point, valeur, légende | existe → refait | `Ligne` ; toucher = ouvre les mesures du lot (geste d'avant) |
| Axe « −0,006 · cible · +0,006 » et « cible → réel » | à créer | `AXE` |
| FG : bande, lot en cours (hachuré, point creux), « à confirmer » | à créer | `lignesBilan('fg')` : FG mesurée, sinon dernier relevé du journal |
| Cuve → bouteille : pourcentage, barre, 48 L → 42,9 L, lignes par lot | existe → refait | `packagingBalance` (totaux) + `lotsConditionnes` |
| Par mois de brassage : légende, colonnes brassé/conditionné, 96 L brassés | refait sans recharts | `moisBilan` ; tableau « Valeurs du graphique » retiré (aria-label porte les valeurs) |
| Styles et avancement : puces + puce pointillée « prévu · hors bilan » | existe → refait | puces = filtre de la liste (geste d'avant) |
| Houblons : « Citra 100 g » | refait | grammes des recettes figées des lots du bilan (`houblonsBilan`) ; sans poids : nombre de fiches |
| Alcool et amertume : puces « Pils 4,8 % · IBU — » | refait (nuage retiré) | `e.abv`, IBU cible de la recette, « — » si inconnu |
| Retours de dégustation (puces) | refait | puce = ouvre la dégustation du lot (geste d'avant) |
| Deux colonnes à 1280 | à créer | `.bil-corps` |

Retiré (la maquette ne l'a pas) : phrase « La ligne centrale est la cible… », les trois compteurs En cuve / Brassés / Conditionnés et la phrase « Volumes mesurés sur… », « Explorer les profils et ingrédients » (dépliant), répartition par statut, nuage alcool × IBU, bouton « Voir tous les… » des distributions.
Gardé hors maquette (besoin réel) : « Voir les n brassins » au-delà de 6 lignes ; états vides en mots ; note « n lots sans date » ; recettes : en-tête d'origine (aucune maquette choisie).
