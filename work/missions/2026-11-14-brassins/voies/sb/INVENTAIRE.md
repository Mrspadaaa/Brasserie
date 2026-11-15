# Inventaire sb : d1b (feuille « Brasser ») et c2a (« Créer un brassin »)

Marque : existe (déjà dans l'app) / à créer / à retirer. Source de chaque chiffre entre crochets. Écrit avant le code (état au 15.11, tour 1).

## d1b : feuille « Brasser <recette> · v<n> »
| Élément ou geste | État | Marque | Source |
|---|---|---|---|
| En-tête « Brasser <recette> · v<n> » | tous | à créer (remplace « Préparer un brassin ») | `recipe.name`, `recipe.version ?? 1` |
| Ligne volume · cuve · « le stock se réserve à la planification » | tous | à créer | `recipe.volumeL` (ou volume adapté) ; `fermenterCapacityL` de la recette ou de l'installation ; capacité absente : dit « non renseignée », jamais 0 |
| Stock replié « Tout est en stock · … ⌄ » | repos | à créer, calcul existe | `besoinsDe` (r2a) |
| Stock : le manque (« Il manque … ») ou « À vérifier » | tous | à créer | `besoinsDe` : `manque`, `inconnu` |
| Toucher le stock : déplie les besoins | geste | à créer | `LigneBesoin.texte`, `.droite` |
| Mois + ‹ › (semaines d'avant et d'après) | tous | à créer (« non dessiné » dans la maquette) | décalage d'une semaine, jamais avant la semaine courante |
| Damier de 3 semaines, lundi → dimanche, jours passés inertes, aujourd'hui souligné | tous | à créer | date du jour |
| Bande de cuve par jour : pleine (hachurée) / libre (verte) ; inconnue : aucune bande | tous | à créer | `cuveModel.etatCuve` : brassins `fermentation`, `garde`, `planifie` datés ; `volumeBrewedL ?? volumeL` ; capacité |
| Picto dry hop (cône), mise en bouteille, début de garde | tous | à créer | dry hop : `recipeSnapshot.hops` (`dayOffset`) depuis l'ensemencement ; bouteille : `bottlingDate` ; garde : plan `recipeSnapshot.fermentation` |
| Jour proposé : tirets verts + « 1er » | repos, geste | à créer | `premierLibre` (cuve libre, sans dry hop) |
| Légende (cuve pleine/libre, dry hop, bouteille, garde) | tous | à créer | |
| Jour choisi redit avec sa raison | repos | à créer | `raisonDe` |
| Toucher un jour | geste | à créer | le jour devient le choix, la raison change |
| Un jour > 7 jours : « Dans N jours. » | loin | à créer | écart avec aujourd'hui |
| Conflit : cuve pleine et/ou dry hop dits, bouton « Prendre <jour>, le premier libre », « Planifier quand même » en gris | conflit | à créer | `raisonDe.conflit`, `.alternative` |
| Pied « Annuler » / « Planifier <jour> » | tous | à créer | `handleLaunchBrew(jour)` : chemin de création existant (`planRecipeBatch`) |
| Avertissement volume / matériel (AM-47) + « Adapter à N L » | si applicable | existe, gardé (sécurité des données, hors maquette) | `avertissementMaterielActuel` |
| Erreurs d'adoption d'installation, d'enregistrement non confirmé | si applicable | existe, gardé | `handleLaunchBrew` |
| Liste déroulante « Recette à brasser », curseur de volume, `BrewScheduleField` (À définir / Aujourd'hui / Autre date), « Créer le brassin à brasser » | | à retirer (la maquette ne les a pas) | volume : retiré, la feuille brasse le volume de la recette (ACCORD 2) ; « À définir » : retiré (ACCORD 3) |

## c2a : « Créer un brassin »
| Élément ou geste | État | Marque | Source |
|---|---|---|---|
| Entrée : bouton + de l'onglet Brassins (`fabActions.newBatch` → `brew-batch`) | repos | existe, branché | App `runFabAction` (non modifié) |
| Titre « n prêtes / n à compléter », compteur de recettes | repos | à créer | `grouper(lignees(...))` |
| Ligne cuve « La cuve est libre … » | repos | à créer (maquette : « F3 libre après la Pils ») | `phraseCuve` ; absente si capacité inconnue |
| Tri « Prêtes d'abord » / « Dernière brassée » | repos, geste | à créer | `grouper`, `derniere` |
| Carte : nom, style, pastille à trois traits + un mot | repos | à créer | `traitsDe` (malts, houblons, levure ; plein, creux, pointillé) |
| Carte : deux chiffres (Alcool ou OG ; Volume), « — » si inconnu | repos | à créer | `abvTarget`, `ogTarget`, `volumeL` ; jamais inventés |
| Carte : levure · dernier lot (levure à acheter en ocre) | repos | à créer | `recipe.yeast.name`, lots liés |
| « Brasser » | geste | à créer : ouvre d1b | |
| Brassin déjà prévu : « Brasser LOT-xxx » | repos | à créer : ouvre ce brassin | `Lignee.prevu` |
| Vide : « Aucune recette », 3 entrées en icône, aperçu grisé | vide | à créer | les 3 entrées ouvrent l'assistant de recette |
| Recette inconnue / « Nouvelle recette » | | existe, gardé : assistant actuel | `onOpenCreateBatch` |
| Après « Planifier » : liste des brassins e6a, carte du lot neuf en tête | après | à créer (App → `batchCree` → ProductionTab) | batch créé par `planRecipeBatch` |
| Effets en rangées : date, stock réservé, manques aux achats | après | à créer | `effetsDe` : `besoinsDe` sans le brassin neuf |
| ↶ sur chaque rangée | après | à retirer, ACCORD 4 | le modèle n'annule pas un effet seul |
| « Défaire » | après | à créer | `StorageService.deleteBatch` |
| « Ouvrir LOT-xxx » | après | à créer | fiche du brassin |
| Date « à définir » créée sans rien demander | | à retirer : d1b règle la date | |
