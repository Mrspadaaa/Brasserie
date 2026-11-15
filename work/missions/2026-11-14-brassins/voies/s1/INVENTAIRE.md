# Inventaire s1 — r2a (Recettes) porté ; c2a (Créer) non porté

Légende : existe (déjà dans l'app) · créé (par ce port) · retiré (la maquette ne l'a pas) · non porté (voir la raison).
Captures : `captures/<id>-<état>-app-<390|1280>-<clair|cave>.png`, ouvertes à côté des PNG de `voies/r2/r2a/`. Fixtures « ZZ » (le préfixe ZZ devant les noms vient d'elles).

## r2a — le carnet de recettes

| Élément de la maquette | Statut | Où |
|---|---|---|
| Barre des sous-onglets Brassins / Recettes / Atelier / Volumes | existe, avec ses compteurs (choix e11a, autre voie) : la maquette r2a n'en a pas, le choix e11a gagne | `ProductionTab.tsx` |
| Tête : « n prêtes à brasser / n à un achat près » (vert / ocre), total lignées + recettes | créé | `CarnetRecettes.tsx` (`rcp-tete`) |
| Ligne « Fermenteur libre : F3… » | retiré : aucune donnée de cuve libre (ACCORD 2) | — |
| Recherche « Nom, houblon, levure… dans les n » | créé | `rcp-champ` |
| Bouton Filtrer (feuille Style / Houblon / Levure, Effacer / Voir) | créé (la maquette montre le bouton, pas la feuille : feuille minimale) | `FeuilleFiltres` |
| Groupes Prêtes · À un achat près · Plus loin (+ À vérifier, ajout imposé : l'inconnu n'est jamais 0) | créé | `recettesModel.ts` (`compareRecipeWithStock`, `pendingStockQuantity`, aucun calcul neuf) |
| Ligne : pastille état, nom, métro des versions à la couleur de la bière, vN, sous-ligne, verbe | créé | `rcp-ligne`, `Metro`, `teinte` (aplats EBC) |
| Sous-ligne « manque Citra 250 g : les 100 g du stock vont au LOT-019 » | créé, chiffre corrigé | modèle |
| Sous-ligne Pale Ale « stock réservé · prévue le … · n j de retard » | partiel : date prévue et retard dits ; « stock réservé » retiré (ACCORD 5) | modèle (`retardDe`) |
| « dernière en août » / « dernière : 19.07.2025 » | l'app dit toujours la date complète | modèle |
| Verbe « Brasser » (prêtes) → feuille de préparation | existe : ouvre la feuille « Préparer un brassin » actuelle, inchangée (consigne VOIE.md) | `onBrew` → `ProductionTab` |
| Verbe « Aux besoins » (à un achat près) | remplacé par « Planifier » (ACCORD 1 : aucun champ de besoin permis) | `CarnetRecettes.tsx` |
| Pastille brassin planifié « LOT-020 › » → fiche du brassin | créé | `onOpenBatch` |
| Feuille d'une recette : titre, alerte (« Pour la rebrasser, il manque … » ou « Tout est en stock »), bouton | créé ; « Mettre … aux besoins » devient « Planifier le brassin » | `FeuilleRecette` |
| « Ce qu'elle demande » : une ligne par ingrédient, état et quantité libre | créé (une ligne par ingrédient, la maquette regroupe : plus précis) | idem |
| « Depuis la vN » (changements de version) | créé | `changementsDepuis` |
| Ligne « OG · IBU › » vers la fiche | créé | idem |
| Pied : « Modifier en v4 » / « Brasser quand même » | créé ; « Modifier » (ACCORD 4) | idem |
| État vide : exemple en pointillés, stock du jour, Nouvelle recette, Photo / Lien / Texte | créé ; Photo / Lien / Texte ouvrent l'assistant de recette (ACCORD 3) | `Vide` |
| Archives (non montré par la maquette) | ajouté : ligne « n lignée aux Archives » et liste, retour au carnet | nécessaire pour ne pas perdre les recettes rangées |
| Comparer, bilan « résultats de mes recettes », favori, Ranger, « Voir les brassins de… », puces Avec/Sans brassin | retirés de l'écran (DÉCISION a du pilote) ; `RecipeComparison` et `CatalogAnalysis` intacts | — |

Gestes : taper une ligne ouvre la feuille ; Brasser ouvre la préparation ; Planifier idem ; Filtrer ouvre la feuille ; saisie filtre en direct ; Archives et retour ; × / balayage ferme.

## c2a — créer un brassin d'un toucher : NON PORTÉ

Raison : la consigne de la voie dit que la feuille « Brasser » et son choix de date sont à revoir (« bien revoir cette écran notamment pour la sélection de date », 15.11) ; d'autres versions lui sont montrées. En attendant, « Brasser » ouvre la feuille « Préparer un brassin » actuelle, sans la changer (capture `c2a-geste-*`).

- Repos c2a (cartes à deux chiffres, pastille à trois traits, tri « Prêtes d'abord ») : non porté. La capture `c2a-repos-*` montre la liste Brassins (e6a), autre voie, pas c2a.
- Geste c2a (un toucher, brassin LOT-021 créé, ↶ annuler chaque effet, « Tout défaire », « Date à définir ») : non porté.
- Après c2a, vide c2a : non portés.
- À faire quand la feuille de date est choisie : reprendre ce geste dans `ProductionTab`/`fabActions`.
