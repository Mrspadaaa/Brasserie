TESTS ROUGES 32 rouges / 52 au total — R43 à R46 chacune au moins un rouge, aucun fichier src/ ni functions/ modifié

## Fichiers écrits
- `tests/unit/c61Regles.test.tsx` (52 tests : R43, R44, R45, R46 ; un `describe` par règle, R46 en quatre blocs C61-3, C61-5, C61-6).
- `tests/fixtures/c61/carnets.json` (carnet « Houblons citra » du test en ligne, paires de pays, valeurs allemandes ; valeurs des captures, aucune donnée personnelle).
- Ce dossier : `tests-rouge.log` (sortie `--reporter=dot`), `RESULTAT.md`.
- Le `.skip` du cas R4 avec critère de `c48Regles.test.tsx` est déjà en place (CADUC c56-tests) : rien à y toucher, fichier non modifié.

## Critères
- `npx vitest run tests/unit/c61Regles* --reporter=dot` : `Tests 32 failed | 20 passed (52)` (tests-rouge.log). Un essai par critère.
- `git status` : aucun fichier suivi de `src/` ni de `functions/` modifié (les dossiers `src/fermenter|finance|stock|asset|data/hopSources` non suivis viennent d'autres sessions).
- `tsc` : aucune erreur dans le fichier de test.
- Attendu et texte passent par la même fonction `sans` (NFKC, espaces insécables réunis, apostrophes droites, sans accent, minuscules).

## Rouges par règle (cause lue, pas devinée)
- R43 (10 rouges sur 17) : liste « dès 0,10 CHF » (C61-1) ; tableau, feuille Articles, Comparer, fiche et pastille de MotlerHops : « ≈4 CHF » et « 3,72 € » sans « 50 g » ni CHF/kg (C61-4) ; `prixPropose` renvoie 10 centimes (« Prix estimé ? » vers À venir) ; `prixChoisiCentimes` renvoie 10 pour l'article choisi (plan, Calendrier). Verts voulus : le tableau, la feuille, Comparer et les fiches cachent déjà 0,10 (garde-fous) ; la chambre froide garde son prix.
- R44 (2 rouges sur 9) : reproduit en jsdom : on colle un lien, on quitte le carnet pendant la lecture, et la vue affiche « Lecture de lien interrompue : 1 à reprendre [Reprendre] » pour une lecture vivante ; il reste après la fin. Cause lue : l'effet de `CarnetsVue` (lignes ~170-177) lit `lecturesEnAttente()` (le suivi garde le jeton jusqu'à `fin`) à chaque nouveau `rangement` (changer de carnet) et pousse la lecture vivante dans `aReprendre`, que rien ne vide à la fin. Verts : rester dans le carnet jusqu'à la fin, remontage de la vue, et le garde-fou LE-1 (lecture réellement gardée : bandeau ; aucune écriture).
- R45 (7 rouges sur 12) : la valeur gardée en « 13,6 % » dans la chaîne (forme `texte-unite`) n'est jamais nommée Alpha ; la page de CITRA® (US) dit « Taux d'acides alpha » : jamais « Alpha » ni en tête ; ni Comparer (aucune ligne Alpha), ni la carte, ni le tableau. Verts : formes `nombre` et `texte` (déjà corrigées en c59-fix2) et non-houblon intact.
- R46 : C61-3 (6 rouges : pas de ligne Alpha/Arômes en tête de Comparer, cinq paires de pays écrites de deux façons) ; C61-5 (2 rouges : jauge de la marmite 50 L à 0 % contre 100 % pour le frigo de 242 L ; vert sur 242 dans Comparer) ; C61-6 (5 rouges : trois valeurs allemandes non traduites par `traduireValeurs`, fiche en allemand, attendu « ales et IPA américaines »). C59-6 est porté par R43.

## Doutes et limites
- jsdom ne mesure aucune boîte : R43 lit le texte d'une surface (quantité à 40 signes avant ou 60 après le prix ; une ligne « Poids » ne compte pas comme quantité du prix). Un correctif qui écrit « les 50 g » ou « CHF/kg » à côté du prix passe ; un correctif qui rend le prix inconnu (« ? ») passe aussi.
- R44 : le déclencheur réel (Firestore) n'est pas reproduit ; les rouges tiennent à la navigation pendant la lecture, la cause la plus directe. Cinq tests R44 sont verts par construction (garde-fous), pas par oubli.
- R46 C61-5 : la jauge est acceptée si la marmite de 50 L est plus pleine que le frigo ou si un repère `.cn-reglette-cible` / `[data-cible]` existe ; le vert de Comparer : jamais sur 242 L (ni vert, ou vert sur 50 L).
- R46 C61-3 : l'écriture du pays est testée sur cinq paires (USA, US, United States, Deutschland, New Zealand) ; un correctif par dictionnaire doit les couvrir.
- Les rouges sont aussi le contrat : le correctif ne les modifie pas.

DÉCISION À PRENDRE : aucune.
CONNAISSANCE : l'avis « Lecture de lien interrompue » naît du suivi gardé (jeton conservé jusqu'à `fin`) relu à chaque changement de carnet : il confond lecture vivante et lecture interrompue ; le signe d'interruption est un jeton gardé SANS lecture en cours dans cette session.
LEÇON PROPOSÉE : un test « regarder n'écrit rien » (LE-1) doit aussi jouer le changement de carnet pendant une lecture vivante ; il ne couvrait que le montage.
