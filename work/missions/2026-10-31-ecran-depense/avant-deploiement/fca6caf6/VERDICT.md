OK — 5 problèmes, 0 bloquants

# Test d'écran — Finances, constats 18 à 27 du jeu de nuit (voies u1 et u2)

Version : fca6caf6 (arbre propre au départ). Banc local `?dev-local&finance-demo` (et `=reel` pour le jeu presque vide), profil Chrome
neuf par scénario, requêtes hors localhost coupées (Gemini jamais joint). 390 tactile et 1280, clair et sombre (`cave`), les quatre faits
pour chaque scénario. Scripts : `capturer.mjs` (scénarios ret, apport, dep, prev, vide, projet, budget, budgetreel, profil ; `pointerdown`
avant chaque clic ; pièce « ZZ TEST — pièce payée » 40,00 payée, apport « ZZ TEST — Apport » 5,00, prévision « ZZ TEST — prévue » 7,00,
écrites dans le seul navigateur de test), `montage.mjs` (planches `M-a` à `M-e`). Journaux `j-*.log`. Aucun ECHEC. Erreurs de page :
seulement `setPointerCapture … No active pointer` (le `pointerdown` synthétique du banc). Rien d'enregistré hors du navigateur de test.

| capture | thème | largeur | état | problèmes | bloquants |
|---|---|---|---|---|---|
| ret-liste-390-clair.png | clair | 390 | Opérations avec la pièce payée 40,00 (payé 336,80, dépensé 736,80) | 0 | 0 |
| ret-confirm-390-sombre.png | sombre | 390 | fiche, « Corriger une erreur de saisie » › « Retirer cette écriture » et sa phrase | 1 | 0 |
| ret-fiche-390-clair.png | clair | 390 | fiche après « Confirmer le retrait » : « Écriture annulée », paiement « corrigé » | 2 | 0 |
| ret-apres-390-sombre.png | sombre | 390 | Opérations après le retrait : ligne sortie, payé 296,80 / à payer 400,00 / dépensé 696,80 | 0 | 0 |
| ret-apres-1280-clair.png | clair | 1280 | Opérations après le retrait, mêmes totaux, ligne sortie | 0 | 0 |
| ap-fiche-390-sombre.png | sombre | 390 | fiche de l'apport 5,00, « Corriger ce paiement saisi par erreur » | 1 | 0 |
| ap-corriger-390-clair.png | clair | 390 | confirmation de la correction du paiement (Garder / Confirmer la correction) | 1 | 0 |
| ap-annule-390-sombre.png | sombre | 390 | apport corrigé puis annulé : « Écriture annulée », 2 paiements | 2 | 0 |
| dep-feuille-390-clair.png | clair | 390 | Nouvelle dépense, saisie sans justificatif | 0 | 0 |
| dep-feuille-1280-clair.png | clair | 1280 | Nouvelle dépense en colonne centrée de 760 px, Total TTC détaché | 0 | 0 |
| pv-onglet-390-clair.png | clair | 390 | Prévisions, cartes « Avec / Sans Fermenteur suppléme… » | 1 | 0 |
| pv-modifier-390-sombre.png | sombre | 390 | Modifier la prévision, pied Annuler / Enregistrer / Supprimer | 1 | 0 |
| pv-confirm-390-clair.png | clair | 390 | « Supprimer « ZZ TEST — prévue » ? » Garder / Oui, supprimer | 1 | 0 |
| pv-supprime-390-sombre.png | sombre | 390 | Prévisions après suppression : 6 sorties, la prévision sortie | 0 | 0 |
| pvr-apres-390-clair.png | clair | 390 | jeu presque vide (`=reel`) après une prévision de 7,00 : pas de « Rien de prévu » | 0 | 0 |
| pj-liste-390-sombre.png | sombre | 390 | Mes projets de matériel, Fermenteur supplémentaire 750,00 | 1 | 0 |
| pj-pied-390-clair.png | clair | 390 | fiche du projet, pied Archiver / Supprimer / Enregistrer le projet, sans chevauchement | 1 | 0 |
| pj-archiver-390-sombre.png | sombre | 390 | « Archiver « Fermenteur supplémentaire » ? » Garder / Oui, archiver | 1 | 0 |
| pj-supprimer-390-clair.png | clair | 390 | « Supprimer « Fermenteur supplémentaire » ? » Garder / Oui, supprimer | 1 | 0 |
| pj-supprimer-1280-sombre.png | sombre | 1280 | même confirmation à 1280 | 1 | 0 |
| pj-apres-390-sombre.png | sombre | 390 | après « Oui, supprimer » : projet sorti de la liste et des cartes Avec / Sans | 0 | 0 |
| bbr-prix-390-sombre.png | sombre | 390 | Budget du brassin « Ssr » (`=reel`), « Prix de 1 ingrédient : munich », « … : cascade » | 1 | 0 |
| pf-frise-390-clair.png | clair | 390 | Solde et paramètres, frise janv. · mars · mai · juil. · sept., aucun mois répété | 0 | 0 |

Bloquants : 0

## Argent (j-*.log, les quatre configurations identiques)

- Avant : payé 296,80, à payer 400,00, dépensé 696,80. Pièce « ZZ TEST — pièce payée » 40,00 payée : payé 336,80, à payer 400,00, dépensé
  736,80 (Brassage 186,80 → 226,80). Après « Retirer cette écriture » : payé 296,80, à payer 400,00, dépensé 696,80, Brassage 186,80 ; la
  ligne a quitté la liste (390 et 1280, clair et sombre).
- Apport 5,00 : « +5,00 Apports » paraît, dépenses inchangées ; corrigé puis annulé : la ligne Apports disparaît, totaux inchangés.
- Prévision 7,00 : 6 → 7 sorties, puis 6 après « Oui, supprimer ». Projet : sorti de « Mes projets » et des cartes Avec / Sans.

## Problèmes

1. **Deux croix côte à côte sur une fiche annulée** (ret-fiche 390 clair, ap-annule 390 sombre) : le carré d'état « annulé » est un ×
   gris, juste à gauche du × de fermeture. En brasseur : « laquelle je touche pour fermer ? ». Déjà signalé par u1, hors de sa voie.
2. **La croix × garde son gros cadre** (noir en clair, blanc en sombre) sur les fiches d'écriture et le projet de matériel (ret-confirm 390
   sombre, ret-fiche, ap-fiche, ap-corriger, ap-annule, pj-pied, pj-archiver, pj-supprimer 390 et 1280). Problème 2 de a2c5db31, toujours
   là ; la feuille de prévision, elle, a une croix simple. Ses maquettes (m3pm-d) ont une croix simple.
3. **Le nom du projet reste coupé** : « Avec Fermenteur suppléme… / Sans Fermenteur suppléme… » sur les cartes (pv-onglet 390 clair,
   pj-liste 390 sombre ; tuile de cinq lignes), « Fermenteur su… −750, 01.01 » dans la bulle. La casse est gardée (26), mais il ne lit pas
   le nom de son projet là où il compare avec et sans.
4. **Légende du graphique de la prévision en minuscules** : « avec zz test — prévue » (pv-modifier 390 sombre, pv-confirm 390 clair)
   pour « ZZ TEST — prévue ». Le nom n'est pas gardé tel quel à cet endroit (constat 26).
5. **Budget du brassin : « Prix de 1 ingrédient : munich » puis « Prix de 1 ingrédient : cascade »** (bbr-prix 390 sombre) : deux lignes
   au singulier, et le nom en minuscules alors que la liste du dessous dit « Munich · 5 kg ». En brasseur : « il me manque deux prix, dis-le
   en une fois, et écris le malt comme je l'ai écrit ».

## Doutes (non comptés)

- « Rien de prévu » : jamais affiché, ni sur le jeu démo ni sur `=reel` (deux sorties déjà prévues) ; absent avant et après l'ajout. Sa
  disparition n'a donc pas été vue en direct ; il ne s'affiche plus à tort, c'est tout ce que montrent les captures.
- « Prix de 4 ingrédients » : non vu, aucun brassin du banc n'a quatre prix manquants ; seul le singulier est vu (voir problème 5).
- Bandeau « Mouvement enregistré. Fermer » : reste en tête d'Opérations après l'annulation de l'apport (texte de page, hors capture).
- La confirmation de la prévision met « Oui, supprimer » en gros bouton noir plein (pv-confirm), celle du projet en contour rouge
  (pj-supprimer) : deux habits pour le même geste destructeur.
- Le bandeau « « X » est archivé. Annuler » de la fiche Atelier (UpgradeWorkspace) n'est pas joué : « Archiver » a été joué jusqu'à la
  confirmation dans la feuille Mes projets, puis « Garder ».
- Frise du profil : solde de départ du banc (4 000,00 au 1 janv. 2026), pas le cas « 100,00 au 1 août » ; étiquettes uniques, la
  dernière est sept. alors que la courbe va jusqu'à aujourd'hui (nov.).

Pilote : vu (16.11 : ap-annule-390-sombre ouverte, apport annulé et corrigé ; 5 mineurs versés à BUGS.md FN-17 à FN-21)
