EN LIGNE AXE — 2/4 OK, 6 problèmes (2 bloquants), ZZ TEST retirés oui

# Test en ligne du calendrier — critique (Opus), 18.11

Version : tag en-ligne/2026-11-18-jalons ; bundle vérifié sans cache : `index-K5xNLfEe.js` (index.html servi = script chargé). Session du brasseur ouverte (vraies données ; rien de réel modifié).

## Conditions et limites
- Claude in Chrome, onglet propre, fermé à la fin. `resize_window` sans effet (fenêtre plein écran 2560 px), iframe refusée par l'hébergement. 390 émulé dans la page : media queries réécrites pour 390 × 844, `matchMedia`, `innerWidth/Height`, `clientWidth` racine forcés, `body` 390 × 844 avec `transform`. L'en-tête est passé en mobile. Artefact : la barre d'onglets fixe suit le défilement du `body` (un toucher l'a atteinte par erreur : « Masquer Achats » puis Finances ; Achats ré-affichée aussitôt, vérifié).
- Gestes à la souris : pincer non jouable ; bulle d'étape au toucher non jouée. Thème sombre non joué (pas de bascule sans toucher aux réglages). 1280 non joué (fenêtre bloquée en 2560).
- Console : aucune erreur depuis le début du suivi (suivi lancé en fin de parcours, donc partiel).

## Gestes
1. Bundle et session : OK.
2. Calendrier, 6 sem., repos : mini icônes d'étapes colorées (salle chaude orange, houblon vert, cuve bleue, colis noir), petites, sur le pied ; pied coloré par phase ; aucune bulle au repos. Barres de brassin à environ 26 px, avec un espace d'environ 4 px.
3. Menu période : ligne « Échelle Jour · Semaine · Mois », Semaine par défaut. OK.
4. Jour : bande L M M J V S D sous S47/S48, « 2 sem. · j », aujourd'hui (18) marqué. OK.
5. Mois : « 6 mois », bande nov.→mai, brassins courts en pastilles. OK.
6. Retour Semaine, toucher S49 : dépliée en 7 jours (L 30 … D 6), « toucher pour replier ». OK.
7. Création par le « + » des rangées, en S49 : « ZZ TEST — Foire » (Fêtes, 3 j actifs) → barre de la semaine ; « ZZ TEST — Dédé, 1 fût » (Ventes, 1 j, +130) → jalon (`cal-ponctuel`, 30 nov.) ; « ZZ TEST — Tireuse » (Achats, 1 j, −150) → barre de la semaine (fiche : Date 30 nov. → 6 déc., Fenêtre S49 → S49, Jours actifs 1 j).
8. Lier l'achat à la fête : aucun « Lier » dans la fiche de l'achat ni dans sa feuille « Modifier » (seulement Ouvrir dans Finances, Mettre de côté, Modifier, Retirer), ni dans la fiche du jalon Dédé (Modifier, Retirer).
9. Toucher la Foire : sa fiche s'ouvre sous la barre ; sans lien, rien ne pâlit (normal).
10. « Plus de détails › » de la feuille rapide Achats : « Prévoir une dépense » s'ouvre avec Libellé et CHF vides.
11. Retrait des 3 ZZ TEST par « Retirer » (sans dialogue). Rechargé : aucun « ZZ TEST » dans Calendrier ni dans Finances.

## Les 4 points du périmètre
1. Mini icônes C, pied par phase : OK au repos ; bulle au toucher non jouée.
2. Échelle au menu et semaine dépliée : OK ; pincer non jouable.
3. Jalons, fil, allumage : KO (problèmes 1 et 2).
4. Barres compactes au format de la Stout : KO (problème 5).

## Problèmes
1. BLOQUANT — Un achat d'un jour, ajouté par le « + » de la rangée Achats, devient une barre de toute la semaine (30 nov. → 6 déc.). Une vente d'un jour faite de la même façon devient bien un jalon. Ses mots (18.11) : « une vente ou un Achat … est sur un seul moment, un seul jour ».
2. BLOQUANT — Rien ne permet de lier un achat ou une vente à la fête dans l'app : ni fiche, ni Modifier. Le fil discret, et « liés allumés, autres pâlis », ne se jouent donc pas sur la vraie app.
3. « Plus de détails › » perd le nom et le montant déjà tapés dans la feuille rapide.
4. Vue Jour : la dernière barre « Ttt » a son nom au-dessus, et sa durée (« J0 / 15 · prête 8 déc. ») à gauche sous le nom, collée au bord. Nom et durée sont séparés.
5. Brassins non brassés (Ttt, Fruty, Hefe en 6 sem.) : « pas brassée · prête le 3 déc. » passe sur une 2e ligne sous le nom et le montant, au lieu de tenir sur une ligne au format de la Stout.
6. Le bouton de période « 2 sem. · j » est rogné de 2 px (79 > 77).

## Doutes (non comptés)
- « Emballage · Jhhh » apparaît deux fois, avec une icône de chariot, dans la rangée Brassins (données réelles ?).
- Le « + » flottant recouvre l'onglet « Clients » (peut-être un effet de l'émulation 390).
- Une fête « 3 j actifs » occupe toute la semaine, avec 3 points : la durée vient de la semaine, pas des jours.

LEÇON PROPOSÉE : Claude in Chrome en plein écran ne se redimensionne pas. Prévoir dans le brief le banc puppeteer à 390 pour la vision, et Chrome seulement pour la session réelle.
