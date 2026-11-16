# Inventaire q1 — gfc (fiche d'un brassin en fermentation) → app

Base : `voies/gf/gfc/etat.html` + 4 PNG. Code : `src/ui/production/fermentation/{modele.ts,GrapheTemps.tsx,FicheFermentation.tsx}`, branché dans `src/ui/BatchDetailSheet.tsx` (rubrique Mesures, `ficheM`, ~l. 245-350). États : repos, geste (ajouts faits), cave, 1280. Statut : EXISTE = déjà dans l'app avant la voie ; CRÉÉ = port ; RETIRÉ = absent de gfc ; ÉCART = voulu, ligne ACCORD dans RESULTAT.md.

| Élément / geste de gfc | Repos | Geste | Cave | 1280 | Statut, code |
|---|---|---|---|---|---|
| Titre-réponse « Dry hop demain / aujourd'hui / ajouté » | oui | « Dry hop ajouté » | oui | oui | CRÉÉ `modele.ts` (titre), `FicheFermentation.tsx` l.133. ÉCART : « Citra ajouté, Mosaic demain » (ajout partiel) impossible : le déstockage est un geste unique, tous les ajouts |
| Ligne « J+5 · levuré le 10.11 » | oui | oui | oui | oui | CRÉÉ `FicheFermentation.tsx` l.133 (date de levurage réelle, `JJ.MM`) |
| Ligne « Densité · alc. · att. · provisoires » | oui | oui | oui | oui | CRÉÉ l.155-157 ; alcool et atténuation du dépôt (`abvFromGravities`), pas recalculés : 5,9 % au banc contre 5,8 % de la maquette |
| Graphe : DO, relevés, point « dernier » gros | oui | oui | oui | oui | CRÉÉ `GrapheTemps.tsx` (l.62-70) |
| Colonne « auj. » en pointillé + étiquette | oui | oui | oui | oui | CRÉÉ `GrapheTemps.tsx` l.38-40 |
| Bande FG visée + « FG 1,010–1,014 » | oui | oui | oui | oui | CRÉÉ l.45-46 (FG de la recette ; sans FG : bande absente) |
| Attendu pointillé jusqu'à la FG | oui | oui | oui | oui | CRÉÉ l.60 (« Attendu, pas mesuré ») |
| « 2 relevés égaux » ○ = ○ → | oui | oui | oui | oui | CRÉÉ l.56 |
| °C au relevé (points + courbe) ; consigne en tirets ; « consigne » | oui | oui | oui | oui | CRÉÉ l.71-96. ÉCART : « °C cuve » → « °C au relevé » (la valeur vient du relevé de densité, pas d'une sonde) |
| « auj. non mesurée » + cercle pointillé | oui | oui | oui | oui | CRÉÉ l.78, 99 |
| Flèche 2 °C (garde) | oui | oui | oui | oui | CRÉÉ l.89-91 |
| Axe de phases coloré (Fermenter 19 °C / Repos 21 °C / 2 °C) | oui | oui | oui | oui | CRÉÉ l.103-110 (phases de la recette) |
| Losange or du dry hop (J+6), fil descendant | oui | oui (vert, nœud à auj.) | oui | oui | CRÉÉ `GrapheTemps.tsx` l.119-129 ; jeton `--ebc-gold` absent de l'app : repli à la valeur de la maquette |
| Axe des jours J+n / date | oui | oui | oui | oui | CRÉÉ l.111-117 |
| Cartes houblon : nom, dose, α du lot, plage fiches, rôle | oui | oui (date d'ajout) | oui | oui | CRÉÉ `FicheFermentation.tsx` l.171-190. α du lot « — » (recette sans α) |
| Liseré de famille (Citra jaune, Mosaic baies) | oui | oui | oui | oui | CRÉÉ `modele.ts` l.91-93 (écart n° 1 corrigé : la règle garde la 1re barre) |
| 4 barres de familles (picto + part des fiches) | oui | oui | oui | oui | CRÉÉ `FamilleBarre` l.48 ; source `describeFamilies` |
| Bouton « Ajouté auj. » → « −100 g au stock » | oui | oui | oui | oui | CRÉÉ l.195, relié à la confirmation existante. ÉCART : pas de toast « Annuler » ; la confirmation « Confirmer et déstocker » existait déjà |
| Tâches (J+7 Cuve à 21 °C, J+10 Garde 2 °C) + fils | oui | oui | oui | oui | CRÉÉ l.203-221. ÉCART : sans case (aucun champ de suivi des tâches) |
| Pied « Mesurer / densité · °C au relevé » | oui | oui | oui | oui | CRÉÉ `PiedFermentation` l.268 |
| Panneau Mesurer m2 : valeur, curseur 1,000-1,070, bande, − / +, Taper | — | — | — | — | CRÉÉ `PanneauMesure` l.229 ; Annuler / Enregistrer le relevé ; erreur « Valeur illisible » |
| Accès carnet · stock · dossier (icônes) | oui | oui | oui | oui | CRÉÉ l.121-141. ÉCART restant : dans le corps à droite du titre ; gfc les met dans l'en-tête à côté du × (`Sheet.tsx` n'a pas de slot : DÉCISION) |
| En-tête de feuille « NEIPA en fermentation · LOT · F1 · 24 L » | oui | oui | oui | oui | EXISTE `Sheet.tsx` : nom du lot + « ID · style · volume visés » |
| Ancien contenu de la rubrique (BatchSchedule, préparation levure, onglets) | — | — | — | — | RETIRÉ de la rubrique Mesures (`ficheM`) ; OG/FG/volumes gardés dans « Corriger les mesures » (replié) |
| Bandeau de stock | — | — | — | — | RETIRÉ des cas normaux (reste : historique, à vérifier, erreur) |
| Largeur 1280 : graphe à gauche, cartes à droite (23 rem), tâches sous le graphe | — | — | — | oui | CRÉÉ ; feuille élargie à `lg:!max-w-6xl` (`BatchDetailSheet.tsx`, seulement avec la fiche) |
