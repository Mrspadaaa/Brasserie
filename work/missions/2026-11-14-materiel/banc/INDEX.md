# Banc a0 — Stocks › Matériel (version en ligne, `?dev-local`, fixtures en mémoire)

Source : copie détachée `C:/Users/mrspa/AppData/Local/Temp/materiel-banc` (port 3427, serveur arrêté après capture).
Fixtures : `stocks.equipment` = 12 lignes EQ-001…EQ-012 + « Moulin à malt » (EQ-1b2c3d4e-…-0) dans `src/data/seedData.ts` **de la copie** ; `stocks.rawMaterials` = « Malt Pilsner » (12 kg, seuil 5 kg), ajouté pour les vues Articles (ref-article*). Rien dans `src/` du dépôt, aucun appel Gemini, aucune donnée réelle (requêtes hors localhost coupées par le lanceur).
Vue `vide` : même copie avec `VIDE_EQ = true` (matériel vide, Articles inchangé).
Script : `C:/Users/mrspa/AppData/Local/Temp/materiel-banc/a0-capture.mjs` (journaux : `journal-a0-*.json` dans ce dossier).

Chaque capture a été ouverte avant inscription. Erreurs console : une par capture, `ERR_BLOCKED_BY_CLIENT` vue en reconnaissance (requêtes Firebase/Google coupées par le lanceur) ; 0 exception de page dans `journal-a0-vues.json` et `journal-a0-vide.json`.

## Mesures (Tout, `liste`)

- 390 : **9 lignes** rendues dans le premier écran, hauteur d'une ligne **54 px** (mesurée sur le bouton de rangée). DOM : 9 rangées sur 13 au moment de la capture.
- 1280 : 10 à 11 rangées rendues sur 13 (capture : 10 visibles, « Moulin à malt », pH-mètre, Réfractomètre absents du rendu initial). Lignes 54 px.
- À vérifier : la liste ne rend pas les 13 lignes sans défilement ni recherche ; `fullPage` ne capture que la fenêtre (le conteneur défile).

## Captures

Légende : 390 = 390×844 tactile DPR 2 ; 1280 = 1280×900 ; clair / cave (bouton lune).

| Capture | Ce qu'on voit (ouvert) |
|---|---|
| liste-390-clair | Onglet Matériel actif, « Actions du matériel » replié, champ « Chercher un équipement… », filtres Tout · 13 / À traiter · 2, 9 lignes (Pompe de recirculation en tête, pastille « À réparer » rouge). |
| liste-390-cave | Même vue en thème cave, lisible, contrastes conservés. |
| liste-1280-clair | Ligne pleine largeur, 10 rangées visibles, actions en barre (Enregistrer un achat, Matériel déjà possédé, Projets d'équipement) ; pas de pagination visible. |
| liste-1280-cave | Même vue cave 1280. |
| a-traiter-390-clair | Filtre « À traiter · 2 » : Pompe de recirculation (À réparer), Refroidisseur à plaques (À entretenir, note « Détartrer après 5 brassins »). Reste vide en bas. |
| a-traiter-390-cave | Même filtre en cave. |
| a-traiter-1280-clair | Même filtre 1280 ; actions visibles en barre. |
| a-traiter-1280-cave | Même filtre 1280 cave. |
| recherche-390-clair | « mètre » tapé : 7 résultats (pH-mètre, Réfractomètre, Densimètre, Refroidisseur, Balance, Hotte, Pompe) ; Pompe de recirculation en dernier, cause non vérifiée. Croix d'effacement visible. |
| recherche-vide-390-clair | « zzz » : « Rien ne correspond à « zzz » » + « La recherche tolère les fautes et les accents manquants. » ; compteur Tout · 13 inchangé. |
| actions-390-clair | « Actions du matériel » déplié : Enregistrer un achat (noir), Matériel déjà possédé, Projets d'équipement. |
| actions-390-cave | Même dépliement en cave. |
| actions-1280-clair | Boutons d'action déjà visibles (pas de repli à 1280) ; pas de dépliement. |
| actions-1280-cave | Idem cave. |
| fiche-390-clair | Feuille « pH-mètre » (Mesure · EQ-005) : Nom, Catégorie, État Bon, Entretien « Étalonner chaque mois (pH 4 et 7) », replis Achat / Notes / Gestion du matériel repliés, Annuler / Enregistrer. Liste derrière floutée. |
| fiche-390-cave | Même feuille en cave. |
| fiche-1280-clair | Même feuille en 1280, fond flou ; repli de droite inchangé. |
| fiche-1280-cave | Même feuille 1280 cave. |
| fiche-achat-390-clair | Fiche « Cuve d'ébullition 100L » (Neuf) : repli Achat déplié (02.03.2026, 1450 CHF), Notes replié, Gestion replié. |
| fiche-reparer-390-clair | Fiche « Pompe de recirculation » : État « À réparer » sélectionné (fond gris), Entretien vide avec placeholder « Joint à changer chaque année », Notes « fuit au raccord » en résumé du repli. |
| fiche-gestion-390-clair | Fiche pH-mètre, repli « Gestion du matériel » déplié : seul bouton « Supprimer » (rouge). Aucun clic dessus. |
| nouveau-390-clair | Feuille « Nouveau matériel » vide : Nom placeholder « Cuve 50 L, réfractomètre, pompe… », État Neuf, Enregistrer grisé (sans nom). |
| achat-390-clair | Feuille « Acheter du matériel » (Enregistrer un achat), Total TTC 0,00, « Matériel durable » / « Créer la fiche de ce matériel », Mon mois / Enregistrer. **Rien enregistré** (ne pas toucher). |
| vide-390-clair | Matériel vide : « Tout · 0 », « À traiter · 0 », texte « Aucun équipement enregistré ». Pas d'appel d'action vide. |
| ref-articles-390-clair | Stocks › Articles (référence) : Comparer une recette, Étagère/Recompter, recherche, filtres manque/bas/épuisés, Malts 1 (Malt Pilsner 12 kg, seuil 5 kg, EBC non connu). |
| ref-articles-390-cave | Même vue en cave. |
| ref-articles-1280-clair | Articles 1280 : tableau (Article, EBC, En stock, échelle, Dernier mouvement, Fournisseur), bouton « Ajouter un article ». |
| ref-article-fiche-390-clair | Fiche article « Malt Pilsner » : 12 kg en stock, seuil 5 kg, Besoin « aucun », Corriger le stock déplié, Commander / Enregistrer. |

## Notes

- Les captures `*-390-*` de la vue `recherche`, `fiche` et `fiche-gestion` passent par la recherche « pH-mètre » : le pH-mètre n'est pas rendu dans le premier écran de la liste (voir Mesures).
- Captures à 1280 pour les autres vues : hors périmètre de la voie (4 combinaisons pour liste, a-traiter, fiche, actions seulement).
- `journal-a0-tout.json` : première passe, contient les échecs corrigés (recherche, fiche) ; faire foi de `journal-a0-vues.json` (0 échec) et `journal-a0-vide.json`.
