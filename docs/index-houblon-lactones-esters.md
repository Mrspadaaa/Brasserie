# Complément aux photographies Lallemand — 8 septembre 2026

Cette passe prolonge la [consolidation scientifique](index-houblon-consolidation.md).
Le rapport livré est `output/pdf/index-houblon-lactones-esters.pdf`. Il examine les
cinq photographies, les publications retrouvées, six ouvrages et les sources
fabricants ; chaque conclusion y conserve son lien et sa limite d’accès.

## Changements effectifs

- `hopResearchBootstrap.json` contient **34 notes**, dont **13 nouvelles**.
  Les notes restent des documents explicatifs, sans coefficient implicite.
  Elles s’installent par le parcours existant Sources et modèles → Ajouter les
  notes sourcées, avec validation et rejeu idempotent.
- Trois analytes sont ajoutés au contrat commun : `3mhaFree`,
  `2methylbutylIsobutyrate`, `gammaNonalactone`. Le premier ne remplace pas
  `3mhFree`. L’abréviation ambiguë « 2MIB » n’est pas un identifiant.
- `ugL` représente une concentration absolue en bière. Il reste distinct de
  `ugLInternalStandardEquivalent` ; aucune conversion implicite d’unité.
  Les deux nouveaux analytes non thiolés refusent les équivalents thiol.
- Les formulaires et libellés suivent ce contrat. Les consignes d’extraction IA
  distinguent identité chimique, dose de préparation sensorielle, seuil,
  rendement et analyse de lot. Une consigne de prompt n’est pas une garantie de
  justesse de l’IA : le résultat demeure soumis à validation et revue.

## Décisions de logique

Les références exactes et limites sont présentes dans les notes suivantes :

| Sujet | Note à consulter | Décision |
| --- | --- | --- |
| Préparation sensorielle | `manufacturer-sensory-dose-2019` | Ne pas importer une dose de kit dans un COA. |
| Esters pendant la fermentation | `research-branched-esters-transfer-2018` | Ne pas transformer une pente de transfert en rendement enzymatique. |
| Conjugué, alcool, acétate | `research-thiol-molar-balance-2021` | Garder le dénominateur et la base molaire ou massique de chaque résultat. |
| Lactones et levure | `research-lactone-biosynthesis-2008` | Ne pas confondre excès énantiomérique et conversion. |
| Mélanges et seuils | `research-lactone-terpene-interaction-2022` | Conserver matrice, attribut et mélange ; aucun bonus universel de synergie. |
| Sources moins visibles | `manufacturer-lactone-patent-2025` et `review-new-ipa-book-2019` | Brevet, synthèse et essai primaire gardent des statuts différents. |

Le moteur, les axes et le modèle Cascade restent inchangés. La connaissance d’un
nouveau composé ne crée pas une prédiction de ce composé. Les observations sans
dispersion ne gagnent pas une plage inventée. Les inconnus continuent à se
replier par analyte sur la variété selon le comportement existant ; une valeur
de bière ne devient pas une composition de houblon.

## Vérification de cette passe

- **1 914 tests / 82 fichiers** réussis, avec la frontière Gemini payant active.
- Builds Vite et Cloud Functions réussis ; avertissements existants de taille
  de chunks conservés.
- Audit du corpus : **766 références par source**, **10 échantillons publics**,
  **3 222 mesures**, **6 levures**, **34 notes**, **1 modèle**. Aucune mesure
  supplémentaire issue des diapositives.
- Parcours Chrome local en **320, 390 et 1 280 px** : packs réellement chargés,
  nouvelles notes validées, rejeu, recherche, comparaison et dégustation.
  Aucune erreur JavaScript ; requêtes métier et IA bloquées pendant ce contrôle.
- Revue indépendante des nouveaux types et unités : aucun défaut concret trouvé.

Journaux dans `.codex-remote-attachments/hop-index/photos-followup-2026-09-08/` ;
inventaire `data-audit.json` et parcours `report.json` dans le dossier parent.
Aucun déploiement ou import Firestore distant effectué.

## Ce qui manque encore pour un calcul nouveau

Le support français complet, le protocole Niagara College et les données
complètes du tableau V photographié ne sont pas obtenus. Les valeurs 36 ng/L,
480 µg/L et la borne basse du seuil de γ-nonalactone ne constituent pas des
paramètres validés. Les analyses appariées avant/après et les répétitions
biologiques restent nécessaires pour calibrer une transformation dans son
domaine. Le rapport distingue ces lacunes des résultats effectivement lus.
