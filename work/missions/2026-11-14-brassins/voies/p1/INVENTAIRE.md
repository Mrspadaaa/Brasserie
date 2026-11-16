# INVENTAIRE p1 — e1a, e2a, e4c (L03 : chaque élément, chaque geste, où il vit)

Légende : existe = code actuel gardé ; créer = composant neuf dans `src/ui/production/fiche/` ; retirer = ce que la maquette n'a pas.
Tokens Tailwind de l'app = jetons de la trousse (`bg-hop/15`, `border-water/50`, `text-attention`, `rounded-control`...). Pas de classes `id-*` dans l'app : tout se porte en Tailwind.

## e1a — fiche d'un brassin planifié (BatchDetailSheet `status==='planifie'`)
| Élément maquette | Code | Décision |
|---|---|---|
| Poignée, titre « Pale Ale », sous-titre « LOT-020 · style · 24 L · F2 », × | `Sheet` (title, subtitle) | existe ; « visés » retiré, volume = `volumeL` ; fermenteur « F2 » : donnée absente du modèle -> omis (ACCORD) |
| Bloc ton attention : « Prévue le 08.11 · 6 j de retard » | `BatchSchedule` (date, `Date dépassée`) | créer `PlannedDateBlock` ; textes de `BatchSchedule` repris |
| Titre « Lundi 16.11 » (jour proposé) | `titreDeDate` (ficheModel) | créer |
| Segment À définir / Aujourd'hui / Reporter | `BrewScheduleField` (SegmentedControl) | créer en `id-segments` ; À définir -> `saveBatchSchedule(date '')`, Aujourd'hui -> `breweryDay(now)` |
| Jours rapides demain / lu 16 / +7 j | `DateField` shortcuts | créer 3 puces |
| Geste Reporter : curseur de jours m2 + bandes (alert/attention/hop) + −/+ + « Enregistrer lu 16.11 » + Annuler | `faisabilite` (ficheModel, `leadHours`) | créer ; bande absente sans plan de starter |
| Onglets Préparer / Carnet / Dossier | nav « Rubriques du brassin » (« Mesures » renommé « Préparer » si planifié) | existe, renommé |
| Carte Starter à cocher (plan, étapes, pastille « trop tard » / « à lancer ce soir ») | `YeastPreparationPanel` | créer `StarterCard` (étapes cochées = `markStep`) ; inoculum, régularisation, notice = `<details>` gardé (code actuel) |
| Cibles OG visée / FG cible (« mesurée — ») | `recipeSnapshot.ogTarget/fgTarget`, `draft.og/fg` | créer ; FG cible = point (pas de bande) |
| Tuile Stock « réservé » en icône | `stockConsumption.pendingItems` | créer ; bandeau ambre actuel retiré du premier plan (reste dans « ⋯ ») |
| Budget / Compagnon / Étape > | `BrewBudgetButton`, `BrewerChat`, ladder e4c | créer 3 boutons ; Étape ouvre l'échelle e4c |
| Pied : ⋯ + « Commencer le brassage » | raccord z1 (autre session) | créer ; ⋯ ouvre Supprimer, NOLO, suivi du stock |
| Retiré du planifié | Volume brassé / Conditionné / courbe à 0 | retirer |

## e2a — fiche après la fermentation
| Élément | Code | Décision |
|---|---|---|
| Bloc de l'état (garde : « FG à confirmer » / « Prête à conditionner » ; conditionné : « 21,9 L en place » ; terminé : « Écoulée · 6,1 % » ; annulé : « Abandonnée, jamais brassée ») | `statusOfBatch`, `abvFromGravities` | créer `HeroEtat` ; teinte water / hop / copper / gold / gris |
| Chips de relevés égaux reliés par « = » + « stable 8 j » | `palierStable` (ficheModel) | créer |
| J+n · garde 2 °C depuis le 03.11 | `jourN`, `releves` ; date d'entrée en garde et consigne 2 °C : absentes du modèle | « — » ou omis (ACCORD) |
| Curseur FG m2 : −/+, bande verte 1,008–1,012, « Confirmer la FG 1,010 » + toast Annuler | `saveGravity`, `gravityBounds`, `fgBande` | créer ; remplace les deux champs texte OG/FG |
| Tuiles FG confirmée / Alcool + atténuation 80 % | `abvFromGravities` | créer |
| « Conditionner · bouteilles et fût > » | ouvre l'échelle e4c | créer |
| Courbe garde + bande verte + palier épais | `FermentationCurveChart` | créer `CourbeGarde` SVG (tailles fixes, k1 n° 5) |
| °C cuve (« — », consigne, hier) + Relever | `BatchGravityEntry` (tempC) | gardé ; « hier 2,1 » = dernier relevé avec tempC |
| Volume 24 L brassés · en cuve — + crayon | `volumeBrewedL`, `BatchPackagingForm` | existe |
| Pied ⋯ + « + Relevé de densité » | `BatchGravityEntry` | gardé |
| Conditionné : bouteilles dessinées (30 × 33 cl · 9,9 L) + fût F-01 12 L dans 20 L | `batch.packaging` (bottles33, kegIds), `KegItem.capacityL` ; **litres par fût : absents** | créer ; fût = capacité (ACCORD : « 12 L » non stocké) |
| Étapes Ferm. / Garde / Cond. / Terminé | `BATCH_STATUS` | créer |
| Pied « Tout écoulé · Terminer » | `applyStatus('termine')` | créer |
| Terminé : Carnet (Dégustation, observations, inspiration, 3 puces verdict) | `notesTasting/notesBrewDay/notesCreation` ; verdict : **aucun champ** | verdict retiré (ACCORD) ; « Rebrasser cette Saison » retiré (neuf, à trancher) ; pied ⋯ + Fermer |
| Annulé : Dossier, étape « Annulée » (hachure retirée, k1 n° 4), « Revenir à « Planifié » », Budget, Historique, Supprimer | `statusOptions`, `ConfirmSheet` | créer |

## e4c — l'échelle des étapes (saisies de passage)
| Élément | Code | Décision |
|---|---|---|
| Titre-réponse (« Garde finie : ≈ 22 L à tirer », « Pils en bouteilles et en fût », « Stout : retour en garde ? ») | | créer ; « ≈ 22 L » = `packagingLimitL` moins pertes : volume en cuve absent -> « — » |
| Marches empilées, rail, palet (descendre/remonter), cible pointillée | `statusOptions` (forward / back / cancel) | créer `StageLadder` ; geste = glisser OU toucher |
| Marche Conditionné : curseur bouteilles m2 (bande = bouteilles qui tiennent), −/+, bascule des fûts libres, jauge de volume, date (Auj./Hier/Autre) | `repartition`, `bouteillesMax`, `KegItem`, `validatePackaging`, `DateField` | créer ; écrit `packaging`, `volumePackagedL`, `bottlingDate`, puis `applyStatus` (stock inchangé) |
| Chips « libère F3 · Pale Ale +6 j », « OG — · poser », « alcool — » | `fermenterConflict` ; fermenteur par brassin absent | « OG — · poser » : oui ; « libère F3 » omis (ACCORD) |
| Conflit F2 / « Brasser la Pale Ale dans F3 » | autre session (z1) | raccord seulement |
| Clôturer (Terminé) | `applyStatus('termine')` | créer |
| Retour : confirmation dans la marche (« Gardés : 30 × 33 cl · F-01 · 5,9 % », « Aucun ingrédient remis en rayon », Laisser conditionnée / Revenir en garde) | `transitionConsequence`, `ConfirmSheet` remplacé | créer ; « touchée ou palet lâché » retiré (k1 n° 5) |
| Abandonner le lot (bande rouge) | `needsConfirmation` (annule) | créer ; hachures retirées au repos (k1 n° 1, 2) |
| Annuler le passage (« Garde → Conditionné ») | `applyStatus` retour | créer |
| Ancien : liste « Étape du brassin », `BatchPackagingForm` | | remplacés ; `BatchPackagingForm` gardé pour « corriger le volume » |

## Non dessiné, gardé à un toucher (« ⋯ »)
Jour réellement brassé, alerte densité hors bornes, suivi du stock, NOLO, Budget, Compagnon, Supprimer.
