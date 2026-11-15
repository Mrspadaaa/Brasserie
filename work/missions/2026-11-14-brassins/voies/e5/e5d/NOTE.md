# e5d — chaude

Chaleur : chaude
Idée : la phrase à trous.

Tout l’écran est une phrase : « Je brasse [NEIPA] [24 L] le [jour ?] », fond à la couleur EBC de la recette (jeton le plus proche, estimé). Chaque trou ouvre son clavier de choix en bas (tuiles de recettes, règle à glisser pour le volume, frise de jours). Geste : « Je brasse Saison, 22 L le dim. 15.11 » + pastille « Planifié · LOT-021 · 15.11 ».
- Baseline : saisie au curseur (piste, valeur tapée à un toucher, jamais type="number") ; chiffres à la virgule ; inconnu « — » ; cibles ≥ 44 px ; pas de cockpit, pas de bandeau d’alerte en tête, pas de code interne ; classes et globales préfixées ; HTML autonome.
- Fonctions de l’écran actuel (QuickActionModal « Préparer un brassin », BrewScheduleField) : recette (volume repris de la recette), volume modifiable, avertissement « matériel actuel » (« plein selon la cuve » au geste), Quand brasser (À définir / Aujourd’hui / Autre date, raccourcis Demain et +7 j), « stock déduit aux ajouts » (icône stock), erreurs d’installation (non dessinées, inchangées), Créer puis message « LOT-0xx préparé pour le … », cas sans recette → Créer une recette.
- Causes c3 évitées : composition propre, phrase-réponse en tête, couleur pleine (EBC des recettes), boosters au lieu de texte, pas de phrase grise au repos.
- Données : 5 brassins et chiffres de BRIEF-AUTEUR ; volumes des recettes : 24 L pour les 5 (DONNEES-COMMUNES.md ; Pils 25 et Stout 30 L corrigés en f4), LOT-021 (prochain numéro), dates choisies.
- Écarts : action en paille sur panneau noir même en clair (genre osé) ; verbe « Tamponner » à confirmer.

- f3b1 (14.11) : geste : « cuve à choisir » (F1 porte la NEIPA), règle sans repère « plein » ; tuile « autre » (calendrier) dans la frise ; pastille LOT-020 sous le volume ; « Planifier LOT-021 » remplace « Tamponner » ; tampon décalé ; vide : tuiles sombres retirées ; repos : plateau remonté.

- re6 (15.11) : rhabillée à l’identité de l’app (trousse identite.css + chrome.js) ; idée et composition inchangées.
- g2a (15.11, critique k2) : tampon rouge pivoté retiré, remplacé par la pastille hop « ✓ Planifié · LOT-021 · 15.11 » ; panneau et tuiles au jeton EBC de chaque recette (Pils et NEIPA or, Saison ambre, Pale Ale cuivre, Stout noir ; estimés) : NEIPA or au repos, Saison ambre au geste ; 8 px entre les lignes de la phrase ; « Touche un trou » (tutoiement, comme e5b et e5c) ; « dim. 15.11 » en Source Sans.
