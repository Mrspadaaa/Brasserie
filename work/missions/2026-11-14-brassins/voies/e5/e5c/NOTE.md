# e5c — tiède (ma meilleure)

Chaleur : tiède
Idée : rebrasser ce qui manque.

Les recettes rangées par l’état de leur dernier lot (écoulée, déjà planifiée, en stock, en garde, en cuve). Titre-réponse : « La Saison est écoulée. On la rebrasse ? » La carte choisie porte volume et date sur place. La Pale Ale signale « déjà planifiée » (LOT-020) : évite le doublon. 1280 : liste à gauche, carte et calendrier du mois à droite. Cave : mêmes aplats.
- Baseline : saisie au curseur (piste, valeur tapée à un toucher, jamais type="number") ; chiffres à la virgule ; inconnu « — » ; cibles ≥ 44 px ; pas de cockpit, pas de bandeau d’alerte en tête, pas de code interne ; classes et globales préfixées ; HTML autonome.
- Fonctions de l’écran actuel (QuickActionModal « Préparer un brassin », BrewScheduleField) : recette (volume repris de la recette), volume modifiable, avertissement « matériel actuel » (ici zone « plein » hachurée à 30 L de F1, le bouton « Adapter à 29,5 L » reste au geste), Quand brasser (À définir / Aujourd’hui / Autre date, raccourcis Demain et +7 j), « stock déduit aux ajouts » (icône stock), erreurs d’installation (non dessinées, inchangées), Créer puis message « LOT-0xx préparé pour le … », cas sans recette → Créer une recette.
- Causes c3 évitées : composition propre, phrase-réponse en tête, couleur pleine (EBC des recettes), boosters au lieu de texte, pas de phrase grise au repos.
- Données : 5 brassins et chiffres de BRIEF-AUTEUR ; fictifs : volumes des recettes hors NEIPA (Pale Ale 24, Pils 25, Stout 30, Saison 24 L), LOT-021 (prochain numéro), dates choisies.
- Écart : l’ordre par état est une proposition (règle à écrire) ; lien recette / dernier lot à vérifier dans le code.

- f3b1 (14.11) : tuile « autre » (calendrier) après « +7 j » à 390 (« me 18 » retiré) ; carnet vide : « — L », sans repère ; repère « cuve 30 L » au lieu de « F1 30 L » ; « 30 plein » écrit ; piste du curseur visible en cave ; 1280 : aujourd’hui marqué d’un trait, plus d’un second choix.
