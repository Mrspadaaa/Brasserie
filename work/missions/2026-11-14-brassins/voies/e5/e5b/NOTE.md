# e5b — tiède

Chaleur : tiède
Idée : le planning des cuves décide.

Un planning cuve × jour (14 au 26.11) : on pose une recette sur un jour libre d’une cuve. Titre-réponse : « F4 vide depuis 8 jours. » Geste : « Saison dans F4, lundi 16.11 », barre LOT-021 posée, volume en jauge de cuve.
- Baseline : saisie au curseur (piste, valeur tapée à un toucher, jamais type="number") ; chiffres à la virgule ; inconnu « — » ; cibles ≥ 44 px ; pas de cockpit, pas de bandeau d’alerte en tête, pas de code interne ; classes et globales préfixées ; HTML autonome.
- Fonctions de l’écran actuel (QuickActionModal « Préparer un brassin », BrewScheduleField) : recette (volume repris de la recette), volume modifiable, avertissement « matériel actuel » (ici zone « plein » hachurée à 30 L de F1, le bouton « Adapter à 29,5 L » reste au geste), Quand brasser (À définir / Aujourd’hui / Autre date, raccourcis Demain et +7 j), « stock déduit aux ajouts » (icône stock), erreurs d’installation (non dessinées, inchangées), Créer puis message « LOT-0xx préparé pour le … », cas sans recette → Créer une recette.
- Causes c3 évitées : composition propre, phrase-réponse en tête, couleur pleine (EBC des recettes), boosters au lieu de texte, pas de phrase grise au repos.
- Données : 5 brassins et chiffres de BRIEF-AUTEUR ; volumes des recettes : 24 L pour les 5 (DONNEES-COMMUNES.md ; Pils 25 et Stout 30 L corrigés en f4), LOT-021 (prochain numéro), dates choisies.
- Ajout : choix du fermenteur (absent du code actuel ; à brancher sur l’équipement). Fictifs : noms et capacités F3, F4 (Pils en F3, F4 libérée par le Stout le 06.11) ; capacité F2 « — ».

- f3b1 (14.11) : « NEIPA » en tête de la rangée F1 ; boutons « Date à définir » et « Autre date » (calendrier) sous le planning ; « brassage le 16 » ; tuile Pale Ale lisible (hachure, texte plein, pastille LOT-020).
