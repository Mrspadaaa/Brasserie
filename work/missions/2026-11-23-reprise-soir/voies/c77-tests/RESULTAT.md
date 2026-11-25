TESTS ROUGES 32 rouges / 53 exécutés (58 écrits, 5 sautés par it.runIf : un projet du Planning n'a pas de date dans la liste) — R103 4/4, R104 4/5, R105 12/31, R106 12/13

# RESULTAT c77-tests

## Fichiers écrits
- `tests/unit/c77Regles.test.tsx` : 4 blocs, R103 à R106.
- `tests/fixtures/c77/chambre-froide.json` : copie de la FORME exacte de `tests/fixtures/c75/houblons-citra.json` (mêmes champs), valeurs lues dans `voies/reel-77/RESULTAT.md` (captures C02-*). Champ `_releve` : « construit, jamais lu en ligne ». Marqué simulé.
- `tests-rouge.log` (cette voie) : `npx vitest run tests/unit/c77Regles* --reporter=dot` → `Tests 32 failed | 21 passed | 5 skipped (58)`.
- Aucun fichier de `src/` ni de `functions/` modifié par cette voie (`UpgradeWorkspace.tsx` était déjà modifié au départ).
- Le `.skip` du cas R4 avec critère de `c48Regles.test.tsx` existe déjà (CADUC c56-tests) : rien à ajouter.

## Ce que chaque règle teste (sur les documents réels, par le composant)
- **R103** (R77-1) : Comparer d'Houblons citra. Rouge : « prix CHF » dit ≈73,8 (le prix au kilo) ; aucune ligne « CHF/kg » ; la ligne qui porte 73,8 ne dit pas kg. 4 rouges sur 4.
- **R104** (R77-2) : fiche MotlerHops dit « Non publié par le vendeur : Arômes » sans puce ; Comparer met « ? » ; pas la même valeur fiche / Comparer. Vert : le carnet montre bien « Arômes lus sur les pages » (l'endroit juste, test de garde).
- **R105** (R73-25) : la RÈGLE, jamais une chaîne attendue. Le contrôle lit chaque date écrite (« S17 », « 1 mai », « vers mars », « fin mars »), la rattache au jour que le carnet porte, exige l'année de CE jour (année ISO du jeudi pour une semaine) quand elle n'est pas celle d'aujourd'hui. Il est lui-même testé (3 tests de contrôle verts). Surfaces : Quand, liste des carnets, À faire.
  - Formes : (1) S17 2027, projet du Planning de Frigo + congel (01.08.2026 → 01.05.2027) ; (2) S50 2026 vue en 2027, semaine posée ; (2b) S50 2025 vue en 2026, projet du Planning (Sol, murs) ; (3 et 3b) plage à cheval sur deux années (14.12.2026 → 10.01.2027), avant puis après son début ; (4) date seule 17.03.2027 ; (4b) « vers mars » 2027 ; (6) S53 2026 vue en 2027.
  - Gardes de l'année en cours (« jamais l'année partout », CT4-A-13) : (5) S50 2026 vue en 2026, (6b) S53 : le 01.01.2027 est en S53 de 2026 (jamais « S53 2027 »), (7) projet du Planning dans l'année en cours.
  - Rouges : Quand dit « S17 », « passé · S50 » (2026 et 2025), « S1 », « S11 », « vers mars », « passé · S53 » sans année ; la liste dit « passé · S50 », « S11 », « vers mars », « passé · S53 » sans année ; Quand d'un projet du Planning de l'année en cours dit « 14 déc. 2026 » (année de trop, alors qu'À faire dit « dès le 14 déc. »). À faire : aucun rouge.
  - Verts justifiés : À faire dit déjà l'année pour tous les cas (`jourAvecAnnee` : « jusqu'au 1 mai 2027 », « jusqu'au 10 janv. 2027 », « sem. du 7 déc. 2026 ») ; Quand du cas 3 (avant son début : « 14 déc. 2026 » est de l'année en cours). Le défaut de R105 est donc dans `texteIntention` (Quand, liste), pas dans À faire.
- **R106** : R77-3 (carte de MotlerHops « 3,72 » sans unité), R77-4 (rang « 2 » contre « ? »), R77-5 (cellule prix de Comparer : Relire et Escalader dedans), R77-7 (« Brau » contre « Brau- und Rauchshop » ; bouton de 32 signes), R77-8 (« rattachée à MotlerHops » absent de la bulle), R73-9 (TVA d'import et 73,8 dits deux fois ; arômes de Brau deux fois), R75-3 (nom de 68 signes au tableau de Chambre froide), R75-6 (« 0 à 8 °C », « 550 Watt », « 1N~/PE » en chasse fixe), R73-10 (2 697,74 dit 3 fois au Choisir), R73-13 (bouton « Choisir » de Comparer sans nom).
  - Vert justifié : R77-6 (liste filtrée) : l'espace des milliers est déjà insécable (« 2 697,74 CHF » en entier) ; la coupe « 2697,7… » vient du CSS à 390 px, que jsdom ne mesure pas : à voir en ligne.

## Doutes et limites
1. Cas 3b (plage commencée, aujourd'hui 20.12.2026) : Quand dit « S1 » (la semaine du 10.01.2027) sans année : rouge ; À faire dit « jusqu'au 10 janv. 2027 » : juste. Le correctif doit dire l'année ISO de la semaine : « S1 2027 ».
2. Année de trop : le test « année en cours » du Quand de Planning (cas 7) exige « 14 déc. » sans année, par R101 (« Quand dit la date comme À faire ») et `jourAvecAnnee` (« jamais l'année partout »). Le brasseur n'a pas dit ce point : si on préfère « 14 déc. 2026 » partout, retirer ce seul test.
3. La liste des carnets ne dit une date que pour un carnet sans prix, sans « Dans À venir » (`listeRegles.valeurUtile`) : les formes Planning n'y sont donc pas testées (tests sautés). La date d'un projet du Planning ne s'y lit nulle part.
4. Le rendu à 390 px (troncature, une ligne, bande de 140 px) reste à voir en ligne : R73-8, R73-14, R73-15, R73-18, R77-5 en hauteur, R77-6 en largeur.
5. Non couverts, faute de document ou de critère : R73-12 (deux « 1 » : il faut un critère « Volume »), R73-17 et R75-7 (liens de Frigo et de l'armoire), R73-19 à R73-21 (ZZ à retirer de ses données), R73-23 et R73-24 sur Sol, R73-30 et R73-31 (ordre de la liste : DÉCISION déjà ouverte).
6. Les carnets datés (Frigo, Sol, etc.) sont des copies en mémoire de `embouteillage-planning.json`, dates changées ; Chambre froide est construit à la forme de `houblons-citra.json`. Aucune donnée réelle, aucun appel IA.
7. Pièges rencontrés : le Bash du poste perd les barres inverses (script de remplacement abandonné, Edit utilisé) ; `textContent` colle « 2027 » à « au Planning » (extraction par nœuds de texte, espace entre voisins) ; les carnets sans domaine tombent dans « À ranger » (domaine posé).

CONNAISSANCE : aucune
LEÇON PROPOSÉE : aucune
