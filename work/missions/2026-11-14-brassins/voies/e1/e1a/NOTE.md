# e1a — La fiche remise d'aplomb (froide)
Chaleur : froide (l'écran actuel remis d'aplomb).
Idée : la fiche actuelle, date en tête.
Composition : poignée de feuille, bloc ocre « 6 jours de retard » avec segment À définir / Aujourd'hui / Reporter et trois jours rapides (demain 15, lu 16 ✓, +7 j 21), onglets Préparer / Carnet / Dossier, carte Starter à cocher, cibles OG/FG « mesurée — », stock en icône, Budget / Compagnon / Étape, pied « Commencer le brassage ».
Geste : Reporter → curseur de jours (bandes rouge, ocre, vert selon le starter), −/+ d'un jour, « Enregistrer lu 16.11 ».
Boosters : date-brassage, jours-rapides, curseur-jours, starter (cases), stock-icone.
Écarts : onglet « Mesures » renommé « Préparer » pour un brassin planifié.

## Fonctions de l'écran actuel (BatchDetailSheet, BatchSchedule, BrewScheduleField, YeastPreparationPanel)
- Date prévue et « Date dépassée » : gardées, en tête (réponse). « Quand brasser ? » (À définir, Aujourd'hui, Autre date, Demain, Dans 7 jours, Enregistrer) : gardé sous la forme propre à la variante.
- Starter (plan, étapes cochées, état « Trop tard pour démarrer · replanifier » du code) : gardé au premier plan. Inoculum prélevé et régularisation de stock : à un toucher (dans la ligne du starter), non dessinés en v0.
- Mesures OG/FG : cibles montrées ; « Volume brassé / Conditionné / courbe à 0 mesure » : retirés du planifié (rien à mesurer avant le brassage), ils reviennent au jour de brassage z1.
- Bandeau de stock ambre : remplacé par « Stock · réservé » en icône (stock : autre session).
- Carnet, Dossier (budget, étape, compagnon, supprimer), NOLO : à un toucher (onglets, icônes ou « … »).
- « Commencer le brassage » : ouvre z1 (raccord, hors périmètre). « Fermer » : remplacé par × ou ‹.

## Causes c3 évitées
1 composition propre (pas le squelette des 19) ; 2 le héros est la décision du jour (quand brasser), pas une corvée ; 3 aplats pleins, aucun pointillé ; 4 phrase-réponse en gros en tête ; 5 aucun houblon montré (aucun α ni arôme de la Pale Ale n'est connu : rien inventé) ; 6 pas de graphe vide ; 7 aucune phrase grise d'aide au repos.

## Baseline
- [x] Pas de type="number", chiffres à la virgule (1,062), inconnu « — », cibles ≥ 44 px, en-tête de lot de z1, jetons clair/cave de DESIGN.md
- [x] Pas de cockpit, pas de bandeau d'alerte, pas de code interne (« ZZ », « ZZ-001 » retirés), pas de paragraphe
- s.o. J+n, °C cuve/échantillon, FG en bande, dry hop : brassin non levuré (la FG cible 1,012 est un point de la recette du banc, pas une bande inventée)

## Données
- Brief : Pale Ale · LOT-020 · F2, prévue le 08.11, 6 j de retard ; aujourd'hui sa 14.11 ; NEIPA F1 levurée 09.11, dry hop 15.11, repos 21 °C 16–18.11, garde 2 °C ; Pils garde 2 °C, 1,010 stable.
- Fixture du banc a1 : American Pale Ale, OG cible 1,062, FG cible 1,012 ; volume : 24 L en F2 (DONNEES-COMMUNES.md, hypothèse du pilote, fictive ; remplace les 45 L du banc, impossibles dans un fermenteur de 30 L).
- FICTIVES : levure « Wyeast 1056 » liquide, starter 1,5 L à 1,040, ensemencement 22 °C, prêt à +24 h (fenêtre de notice supposée 24–48 h), « ingrédients réservés ».
- Faisabilité par jour (aujourd'hui trop tard, di 15 court < 24 h, lu 16 et suivants prêts) : tirée de ces données fictives et de la logique du code (yeastPreparationState, leadHours.min).

## Corrections f3a1 (14.11, verdict c5a)
- 45 L → 24 L dans l'en-tête. Au repos, titre « Lundi 16.11 » (le jour proposé), le retard passe dans la ligne « Prévue le 08.11 · 6 j de retard ».
- « FG visée » → « FG cible » (un point, pas une bande). Tuile Stock : « déstocké au brassage » retiré. Curseur de jours : libellés descendus sous le pouce.

## Rhabillage re1 (15.11, « Ça semble pas du tout respecter l'identité global de l'app ?? »)
- Trousse chargée (identite.css, chrome.js) : jetons des deux thèmes, Source Sans 3 et IBM Plex Mono, tailles ≤ 28 px, graisses ≤ 600, rayons 4 / 10 / 16 / 24.
- Feuille de l'app (poignée, rayon 24, × et pied) posée sur la liste des brassins ; bloc de date au ton attention ; segment et jours rapides = id-segments et id-puce ; curseur de jours = curseur m2 de la trousse sur une bande alerte / attention / houblon ; onglets de fiche ; starter en id-panneau à cases de 24 px (cible 44) ; cibles en id-sureleve et id-reading ; pied : ⋯ + « Commencer le brassage » (repos), Annuler + « Enregistrer lu 16.11 » (geste, boutons sortis du bloc pour une seule primaire).
- Idée, composition, textes et chiffres inchangés. Contrôle : IDENTITE OK.
