# e1b — Le compte à rebours du starter (tiède)
Chaleur : tiède (forme de l'approche : planifier à rebours depuis le levurage).
Idée : le starter fixe le jour.
Composition : titre-réponse géant « Brasser lundi 16.11 », bande de 7 jours colorée par faisabilité (trop tard / court / prêt, pastille DH NEIPA le 15), rail vertical de z1 « Jusqu'au levurage » à cocher, recette en trois cases, pied « Brasser aujourd'hui » / « Lancer le starter ».
Geste : toucher « sa 14 auj. » → titre rouge « Aujourd'hui : sans starter », starter barré, « Levure du stock » à cocher, « Commencer le brassage › ».
Ma meilleure : cave et 1280 (poste : jours et compte à rebours côte à côte, cuverie de la semaine).
À 1280 (f3a1) : la cuverie de la semaine et la recette descendent sous les jours, dans la colonne gauche ; le compte à rebours tient la droite.

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
- 45 L → 24 L dans le rail. À 1280, cuverie et recette dans la colonne gauche (grille à zones). La pastille « DH » est posée dans la case di 15, à côté de « di », hors du cadre de lu 16. « FG cible ».
- Non fait : « À définir » sous « … » (pas de menu « … » dans cette variante : à dessiner en passe 2).

## Rhabillage re1 (15.11, « Ça semble pas du tout respecter l'identité global de l'app ?? »)
- Trousse chargée (identite.css, chrome.js) : jetons des deux thèmes, Source Sans 3 et IBM Plex Mono, tailles ≤ 28 px, graisses ≤ 600, rayons 4 / 10 / 16 / 24.
- Feuille de l'app sur la liste ; « Brasser lundi 16.11 » en id-display ; stock, carnet, dossier en id-btn-icone à côté de la ligne de retard ; bande des jours teintée alerte / attention / houblon, choix plein (sur-paille), DH en marque or (--ebc-gold) ; compte à rebours en id-panneau, fil et puces aux jetons ; recette en id-sureleve ; à 1280, deux colonnes dans la feuille de 42 rem et la cuverie de la semaine visible (comble la colonne gauche vide signalée en v0).
- Idée, composition, textes et chiffres inchangés. Contrôle : IDENTITE OK.
