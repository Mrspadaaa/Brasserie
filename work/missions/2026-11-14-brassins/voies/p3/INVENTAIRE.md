# Inventaire p3 — e11a (la coque) et e10c (Adapter les volumes)

Légende : porté = existe dans l'app, vérifié en capture ; hors voie = vit dans un fichier qui n'est pas à p3 (lecture seule) ; retiré = la maquette ne l'a pas.
Captures : `captures/<id>-<état>-app-390-clair.png` (+ cave 390 et 1280 clair au repos), maquette : `voies/e11/e11a/*.png`, `voies/e10/e10c/*.png`.

## e11a — la coque de l'onglet

| Élément ou geste de la maquette | Code | Statut |
|---|---|---|
| Barre segmentée à quatre sous-onglets, actif plein, compteurs en pastilles | `volumes/Coque.tsx` (`SegmentsCoque`), `ProductionTab.tsx` l. 163-168 | porté. Compteur Brassins = brassins non archivés **visibles sous la période** (3 au banc sous « Ce mois »), pas 4 comme la maquette (elle retire la Saison écoulée) ; Recettes = recettes courantes |
| Libellés courts « Brassins · Recettes · Atelier · Volumes » ; aria-label complets conservés (« Brassins (3) », « Atelier R&D », « Adapter les volumes ») | `Coque.tsx`, `ProductionTab.tsx` | porté |
| Phrase-réponse en grand (Brassins) : retard, FG à confirmer, dry hop proche ; rien de vrai = pas de phrase | `volumes/phrase.ts`, `Coque.tsx` (`PhraseReponse`) | porté, tirée des brassins réels (aucun texte inventé) |
| Phrase-réponse (Recettes) : « X attend son brassin » + « depuis N j » en rouge seul | `phrase.ts` (`fin`) | porté (rouge sur le retard seul, comme la maquette) |
| Bouton « Atelier Houblons V5.5 » masqué de l'écran | `ProductionTab.tsx` | retiré de l'écran ; encore atteint depuis la fiche recette et la fiche brassin |
| Compagnon, recherche, filtres, bilan de la liste (icônes) | liste Brassins / Recettes | hors voie (choix ouvert), inchangé |
| « + Brassin » / « + Recette » : le + dit ce qu'il crée | `FloatingActions.tsx`, `fabActions.ts` | **hors voie, non porté** : le + reste « + » sans nom (écart 1) |
| Menu du + : action de l'écran en tête, « Outils houblons » (sans V5.5) | idem | **hors voie, non porté** : l'entrée « Outils houblons » manque (écart 2) |
| Pastilles-filtres « Tous · 2 en cuve · 1 en retard » | liste des brassins | hors voie (choix ouvert) |
| Cartes à bande d'état, jauge densité vers la FG, geste du jour en bouton noir | liste des brassins | hors voie (choix ouvert) |
| Ligne « Saison écoulée » repliée | liste des brassins | hors voie (choix ouvert) |
| Cartes de l'onglet Recettes (F2 réservé, LOT, Brasser) | sous-onglet Recettes | hors voie (choix ouvert) |
| Filtre de période : un brassin en cours reste visible | `volumes/periode.ts`, `ProductionTab.tsx` l. 157, 173 | corrigé (voir ACCORD sur `filterCatalog`) ; test qui échoue sur l'ancien comportement |

## e10c — Adapter les volumes

| Élément ou geste | Code | Statut |
|---|---|---|
| Recette source (liste déroulante, nom seul) | `AdapterVolumes.tsx` | porté |
| « recette 24 L · × 1,00 » | idem | porté, décimales fixes |
| Phrase « À peser pour 24 L » ; « 36 L ne tiennent pas dans <installation> » + « prend 30 L au plus » | idem (`etatVolume`) | porté ; le nom d'installation vient du modèle (« Système 30 L »), pas « F1 » |
| Volume refusé : « 2 500 L ? » + borne « Au plus 2 000 L » ; sous 0,5 L ; texte illisible ; quantités « — » | idem | porté (états refuse) |
| Totaux eau / grain / houblon | idem, `etapes.ts` (`totauxDe`) | porté ; eau « — » quand le calcul d'eau n'aboutit pas (jamais 0 L) |
| Moments dans l'ordre du jour : empâtage, rinçage, ébullition, whirlpool, levurage, dry hop (+ autres ajouts s'il y en a) | `etapes.ts` | porté, valeurs de `scaleBrewRecipeScenario` (aucun calcul réécrit) |
| Détail du moment : « 67 °C · 60′ », « 60′ », « 20′ », « J+6 », « 19 °C » | `etapes.ts` | porté, lu dans la recette ; absent si non saisi |
| Cases à cocher (rail, 44 px) | `AdapterVolumes.tsx` | porté ; non liées à un brassin du jour (k3 n° 2 : hors brief) |
| Pastilles d'écart « +3,33 » au geste, ton attention | idem | porté |
| Bandes de familles des houblons (sans α) | `volumes/familles.ts` | porté, lues dans le radar du catalogue ; houblon inconnu : aucune bande |
| Curseur m2 5–60 L, repères « recette » et « cuve », zone rouge au-delà de la cuve | `AdapterVolumes.tsx`, `volumes.css` | porté |
| Valeur tapée par le bouton ✎ (virgule, Entrée, Échap, jamais `type="number"`) | idem | porté |
| Panneau « Volume cible » fixe en bas à 390, dans la tête à 1280 | `volumes.css` | porté |
| Carnet vide : « Rien à peser : carnet vide » + « Créer une recette » | idem | porté (`onOpenCreateBatch`) |
| Rail de moments en deux colonnes à 1280 | `volumes.css` | porté |
| Ligne « Empâtage plafonné par la cuve (35 L utiles) » | `AdapterVolumes.tsx` | non dessinée par la maquette, conservée (TE-39) |
| Ancien tableau, QuantityStepper « Volume cible », `data-role="borne-refusee"` | ancien ProductionTab | retiré (la maquette ne les a pas) |
