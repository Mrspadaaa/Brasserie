# Test en ligne, passe 2 (partielle) : 19.11, https://brasserie-l-affinee.web.app/

Méthode : le navigateur intégré demande une connexion Google (rien saisi). Passage à Claude in Chrome (session du brasseur), fenêtre 1568 px non redimensionnable. Tailles émulées par une iframe `srcdoc` de même origine (l'iframe directe est refusée, X-Frame-Options) : les media queries suivent bien la taille de l'iframe. Pas de moyen d'émuler `prefers-color-scheme` dans l'iframe ; thème sombre à jouer par le réglage de l'app (bascule « Thème sombre (cave) » dans l'éditeur, page Plus). Budget atteint avant 844×340, 1280 et sombre : INACHEVÉ.

## Tableau (clair seulement ; 844×340, 1280, sombre : non joués)

| Point | 390 clair | 844×340 | 1280 | Sombre |
|---|---|---|---|---|
| 1 Calendrier : axe | OK : un seul axe visible (S47 à S52) sous le graphe ; un « déc. » orphelin reste en haut de la frise (voir T2B-2) | non joué | non joué | non joué |
| 1 Frise paysage, plein écran + retour | non joué | non joué | non joué | non joué |
| 1 Barre de brassin ZZ TEST ouvre sa fiche | non joué : planification bloquée (T2B-1) | non joué | non joué | non joué |
| 2 Stocks, Courses, en-tête | non joué (déjà OK au tour 1) | non joué | non joué | non joué |
| 3 Finances (barres, période, frise, du/au, Confirmer le paiement) | non joué | non joué | non joué | non joué |
| 4 Brassins : cartes | non joué (déjà vu au tour 1) | non joué | non joué | non joué |
| 5a Recette avec grain, Identité : cuve trop petite + renvoi | OK : « Cuve trop petite : 38,9 L pour 35 L » en rouge, bouton « Ajouter 3,9 L d'eau pendant ou après l'ébullition », « ou 29 L », renvoi « Eau / grain et rinçage › » ; le renvoi ouvre bien l'étape 6/7 Eau et sels | non joué | non joué | non joué |
| 5b Eau et sels : onglets Eau / Sels, repères | OK : onglet 1 Eau (empâtage 28,1 L, rinçage 17,9 L, Eau/grain 3,12 L/kg, osmosée 50 %, repères min/max sur les curseurs) ; onglet 2 Sels (profil, radar d'ions, SO₄:Cl « réglage 1,27 / obtenu 1,27 », 9 sels avec − / + et bascules) | non joué | non joué | non joué |
| 5c Ma levure : gestes, fluidité | OK avec réserve : Chercher (recherche « US » filtre en 0,05 s), « Choisir pour ma recette » donne la carte US-05 avec « Annuler le changement » et ×, Comparer (état vide clair), glisser la température 19 → 25,5 °C et la durée J10 → J13 fonctionne, le tracé fantôme garde l'ancien réglage et « Dernier réglage… » s'écrit. Réserve : retour sur « Ma levure » ~1,2 s (T2B-3) | non joué | non joué | non joué |
| 6 Carnet : affichage seul | non joué (déjà OK au tour 1) | non joué | non joué | non joué |

Décompte : OK 3 (5a, 5b, 5c avec réserve) / KO 0 / non joués : tout le reste du tableau, y compris la totalité de 844×340, 1280 et sombre. Points KO possibles : T2B-1 (bloquant le point 1.3).

## Combien et quels problèmes ? 3

1. T2B-1 : Planifier un brassin depuis une recette dont le matériel « n'est pas figé » est sans effet. La fiche « Brasser ZZ TEST » affiche un message rouge (« Le matériel de cette recette n'est pas figé. Ouvre « Modifier la recette », puis choisis « Adapter à mon matériel actuel »… »), mais le bouton « Planifier quand même » reste actif en apparence (cliqué deux fois, au clic réel aussi) et ne planifie rien, sans retour. Gênant : on ne peut pas créer de brassin ZZ TEST, donc le point « toucher une barre ouvre la fiche » n'a pas pu être rejoué. À vérifier : « Adapter à 29 L » a bien changé le volume (33 → 29 L) mais le blocage est resté.
2. T2B-2 : Calendrier 390 : un libellé « déc. » est coupé en haut de la frise, au-dessus des semaines (S47…), séparé du reste de l'axe. Mineur ; à rapprocher de la plainte « un seul axe ».
3. T2B-3 : Recette > Levure : le retour sur l'onglet « Ma levure » prend ~1,2 s avant d'afficher (Chercher et Comparer : 15 à 55 ms). Mesuré dans une iframe sur PC, donc à confirmer sur téléphone. Mineur.

Observation sans gravité : le champ « Nom de la bière » tronque « ZZ TEST — recet… » dans l'éditeur à 390.

## Données ZZ TEST créées et retirées

- Recette « ZZ TEST — recette » (9 kg Maris Otter, US-05, 33 puis 29 L) : créée par « Enregistrer la recette », puis supprimée par « Supprimer la recette » ; contrôlé : plus aucune occurrence de « ZZ TEST » dans la page.
- Brassin ZZ TEST : non créé (T2B-1).
- Aucune donnée réelle touchée (une fiche de recette réelle « proble levure » a été ouverte par erreur, fermée sans aucune action). Aucun envoi à l'IA.
- Reste du tour 1, non vérifié ici : l'opération « ZZ TEST — operation » annulée peut subsister en base (voir RAPPORT.md).

## REPRISE : C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie/work/missions/2026-11-18-choix-calendrier/tour2/en-ligne/RAPPORT-2.md

À rejouer dans un contexte neuf : tout 844×340 et 1280, thème sombre, les points 1 (frise paysage, plein écran, retour), 2, 3 (frise qui s'étend, du/au, Confirmer le paiement), 4 et 6. Méthode utile : ouvrir l'app dans Claude in Chrome, créer `iframe.srcdoc = (html de /)` avec `<base href="https://brasserie-l-affinee.web.app/">`, piloter via `iframe.contentDocument` ; clics réels par coordonnées pour les boutons de feuille (le `.click()` JS ne déclenche pas « Planifier quand même »). Pour le point 1.3, passer par « Modifier la recette > Adapter à mon matériel actuel » avant de planifier.
