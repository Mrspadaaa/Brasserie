# Inventaire e3gb — le fil, le vrac posé sur aujourd'hui (rubriques Carnet et Dossier d'un brassin EN FERMENTATION)

Portée : e3gb ne dessine que la fermentation (NEIPA J+5). Les états planifié, garde, conditionné, terminé, annulé gardent leurs choix déjà portés (e1a, e2a, e4c) : leur Carnet et leur Dossier ne changent pas. Existe = code actuel conservé ; À créer = `src/ui/production/carnet/` ; À retirer = ce que la maquette n'a pas.

Stockage : aucun champ neuf. Les entrées vivent dans `notesTasting` et `notesBrewDay` (lignes `14.11.2026 · Cuve : …`, `14.11.2026 07:40 · Vrac : …`, `Prochain essai : …`) ; un texte ancien sans ligne de tête reste lisible (vrac dans `notesTasting`, observation du J0 dans `notesBrewDay`). Visé = `notesCreation`. Voir `carnetModel.ts`.

## Carnet (états : repos, geste, rangement)
| Élément maquette | Où | Statut |
| --- | --- | --- |
| Panneau « J+5 · sam. 14.11 » + titre-réponse (« N notes en vrac » / « N morceaux à placer » / « Carnet à jour ») | `CarnetFil.tsx` | à créer |
| Gros bouton rond Ranger (vrac) / Dicter (sinon) ; pastille « proposé » en geste | `CarnetFil.tsx`, `useCarnet.ts` | à créer |
| Ligne Visé + crayon (champ sur place) | `notesCreation` | à créer (remplace le champ « Inspiration et profil visé ») |
| Ligne Prochain essai + crayon ; « pas encore écrit » ; en geste, morceau proposé ✓ ✎ | ligne `Prochain essai :` de `notesTasting` | à créer |
| Fil jour par jour (rail J0…, aujourd'hui plein, futur ambre), bulles Cuve/Dégustation/Brassage/Incident, puces densité · cuve · OG · levuré | `construireFil` (relevés `gravityLog`, `brewDay`, notes) | à créer |
| Rappel dry hop sur son jour (« demain », « en retard ») | `recipeSnapshot.hops` stage dryHop + `stockConsumption.pendingItems` | à créer |
| Note en vrac : pastille « en vrac », heure « écrite », 6 lignes + « tout lire » à 390, entière à 1280 | `Vrac` | à créer |
| Morceau proposé : ✓ accepter, ✎ corriger (texte, jour), « Quel jour ? » (aujourd'hui, hier, 44 px), ✓ grisé sans jour | `Propose` | à créer |
| Morceau d'un autre brassin (« Autre brassin → Stout · LOT-015 ») | `poserMorceaux` écrit dans `notesTasting` de l'autre brassin | à créer |
| Densité déjà relevée non recopiée | contexte `releves` donné au rangeur | à créer (contrat) |
| Pied : Dicter · Écrire / Accepter les N · Laisser en vrac / toast « N rangés · 1 envoyé à la Stout » + Annuler | `CarnetPied` | à créer |
| Ligne « rangés depuis ta note de 07:40 » | `CarnetFil` | à créer |
| Hors ligne : pastille « pas rangée », rangement au retour du réseau | `useCarnet` (`enAttente`, évènement `online`) | à créer |
| Écrire (saisie d'une note en vrac) | composer, `poser` | à créer (geste que la maquette nomme sans le dessiner) |
| Dégustations des houblons (HopTastingsPanel) | `HopTastingsPanel` | existe, conservé sous le fil |
| Trois champs de notes empilés (dégustation, jour de brassage, inspiration) | `BatchDetailSheet.tsx` `champNote` | à retirer pour la fermentation |
| IA de rangement | `rangement.ts` : couture + drapeau éteint | ACCORD (tâche serveur neuve) |

## Dossier
| Élément maquette | Où | Statut |
| --- | --- | --- |
| Titre-réponse « Tout est sorti du stock, sauf le dry hop. » | stock (`stockConsumption`) | à créer |
| Ruban des étapes Brassé / Ferment. / Garde / Cond. / Terminé | `DossierFil` | à créer |
| Ticket « Recette figée » (date · volume ; malts, levure, houblons avec α ou « α non saisi » et moment ; cochés / réservés) | `recipeSnapshot`, `stockConsumption` | à créer |
| OG, Empâtage, plan fermentation → repos → garde (période · °C), FG visée en bande | `batch.og`, `recipeSnapshot.mash` / `.fermentation`, `fgBande` | à créer |
| Passer en garde + « pas stable » ; Revenir · abandon ; Budget ; Compagnon ; Supprimer | `changeStatus`, `statusOptions`, `BudgetLien`, `BrewerChat`, `confirmDelete` | existent, regroupés |
| Pied : rappel « Demain · dry hop … · réservés » ; au jour J, « Dry hop ajouté · … » | `confirmStock('remaining')` | à créer |
| Bouton pleine largeur « Passer en … » + liste déroulante d'étape + bouton Budget en tête | `BatchDetailSheet.tsx` | à retirer pour la fermentation |
