# RESULTAT — passe Haiku, tranche E (27.11)

Banc : Chrome 9222 via `work/missions/2026-11-26-nuit/outils/lib.mjs`, `ouvrir({ bloquerExterne: true })`, 390 × 844 tactile, `fermer()` à chaque script. Local `http://localhost:3131` seulement, données « ZZ TEST » semées (`semer` de principes/commun.mjs). Aucun fichier de `src/` ni `tests/` touché. Aucune donnée réelle ni personnelle. Scripts : `passe-haiku/s1.mjs`, `s1b.mjs`, `s2.mjs`, `s2e.mjs`, `s345.mjs`, aides `h.mjs`. Captures : `passe-haiku/*.png` (39). Chevauchements et éditions : `[]` et `[]` à chaque état joué.

## Point 1 — Brassage, onglets pH et Volume (`s1.mjs`, `s1b.mjs`)
- Ouvrir « Mesurer » (pied), onglet pH : valeur « ? », −0,01 / +0,01, Enregistrer grisé. Capture `a2-onglet-ph.png` ouverte : OK, pas d'unité pour le pH.
- Glisser pH 0,50 → 0,98 : affiche 8,92, pH sans unité. Capture `a3-ph-droite.png` ouverte : OK.
- Glisser pH 0,98 → 0,00 : valeur reste 8,92. Constat à vérifier : capture `a4-ph-gauche.png` non ouverte.
- Onglet Volume : « ? L », cible 17,6–19,4 L, Enregistrer grisé. Capture `a5-onglet-volume.png` ouverte : OK.
- Glisser Volume 0,50 → 0,98 : 21,1 L, « +1,7 au-dessus de la cible ». Capture `a6-volume-droite.png` non ouverte.
- Saisie : Ctrl+A, Retour arrière, « 19,2 » (textarea decimal). Capture `a9-saisie-vide-19-2.png` ouverte : « 19,2 », « Volume (L) », verdict « dans la cible », curseur à 19,2. OK.
- Entrée : la feuille se ferme et le journal affiche « Volume 19,2 L ajouté au journal ». Capture `a10-apres-entree.png` ouverte : OK. Doute : Entrée enregistre directement, sans passer par Enregistrer.
- Enregistrer : non joué sur le chemin valide (Entrée a déjà fermé la feuille). Le premier essai (`s1.mjs`, « 21,19,2 ») vient d'un script mal vidé, pas de l'app : non compté.
- Essais : 2 scripts. Non joué : onglet pH et Volume au toucher du champ « Taper la valeur » sans Entrée ; `&keyboard=300` non joué.

## Point 2 — Minuteurs −5/+5 et « Terminer et continuer » (`s2.mjs`, `s2e.mjs`)
- Frise « Empâter » : étape 3 Empâtage, « 1 h 00 », boutons −5, −1, pause, +1, +5 ; « fin ~5 h 21 ». Capture `b1-minuteurs.png` ouverte : OK, unités h/min cohérentes.
- −5 puis +5 : retour à 1 h 00 (`b1` après la paire). Valeur après −5 non lue : mon sélecteur de durée n'a pas attrapé le texte. Doute.
- « Terminer et continuer » (étape 1) : 1 Eau et sels → 2 Concassage → 3 Empâtage en deux appuis, sans boîte de confirmation lue. Cela contredit la passe 1 (40 appuis sans effet) : cause non établie.
- Étape 3, pied « Commencer la montée » : l'en-tête reste « 3 Empâtage ». Aucun changement lu, pas de boîte. Arrêt après 2 appuis sans changement.
- Bilan : texte lu, capture `b7-fin.png` non ouverte. Clôture non atteinte. Non joué : `&keyboard=300`, relevés finaux.

## Point 3 — Brassins en dev-local (`s345.mjs`) : PARTIEL
- Semer OK ; onglet Brassins (3) ouvert ; capture `c1-brassins.png` non ouverte.
- Recherche « ZZ » : champ absent. Entrées « ZZ TEST » : non touchables par mon sélecteur. Feuille de brassin : non ouverte. Densités 1,030 / 1,0300 / 1,3, Budget, Dossier : non joués.
- Recettes : onglet non ouvert (« Recettes (1) » trouvé). Menu ⋯ touché mais ouvert un menu « Nouvelle idée / Lancer un brassin » : non vérifié.
- Volumes : « Adapter les volumes » ouvert, « Volume cible, curseur=25 », « recette 25 L · × 1,00 ». Crayon non trouvé. Non joué.

## Point 4 — Dupliquer dans la page recette réelle : NON JOUÉ
- Ouverture de « ZZ TEST IPA » et Recettes (4) : non trouvées. Dupliquer non touché.

## Point 5 — Atelier V5.5 (`?preview=hop-v55`) : MAL CIBLÉ
- Onglet Décider touché. Mon sélecteur a pris des boutons de navigation (Ma bière, Historique, « Confirmer cette hypothèse », « Ajouter à la référence ») et non les gestes de décision. Aucun geste de décision valide. Ce que « touché=true » prouve : rien sur l'atelier.

## Doutes et non joué
- Constats à vérifier : pH gauche sans effet (8,92 inchangé) ; « Terminer » qui avance ici mais pas en passe 1 ; Entrée qui enregistre au journal.
- Textes des feuilles lus par `innerText` ; les minuteurs se lisent par regex (une durée peut être mal lue).
- Non joué : point 4 entier, point 3 (fiche, densités, Budget, Dossier, Recettes), point 5 (gestes de décision), `&keyboard=300`, clôture et bilan.
- Erreurs console : `ERR_FAILED` (requêtes externes bloquées) et `navigator.vibrate` ; non analysé en détail.

## Compte
- Ouvertes et regardées : `a2`, `a3`, `a5`, `a9`, `a10`, `b1` (6 captures).
- Points joués : 1 (partiel), 2 (partiel), 3 (partiel) ; 4 non joué ; 5 mal ciblé.

PARTIEL — tranche E passe Haiku : points 1 à 3 partiels, 4 non joué, 5 mal ciblé.
