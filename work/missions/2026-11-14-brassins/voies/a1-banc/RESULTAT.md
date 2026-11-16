OK — banc local rejouable, 156 captures (390/1280, clair/cave) et inventaire TROUS.md des brassins.

## Fichiers écrits (tous sous `work/missions/2026-11-14-brassins/voies/a1-banc/`)
`banc.mjs`, `fixtures.json` (5 brassins ZZ, régénéré à chaque rejeu), `captures/` (156 PNG), `journal.json`, `tests.txt` (sortie du banc), `tests-base.txt`, `TROUS.md`, `RESULTAT.md`. Rien hors de la mission (`git status`).

## Rejouer le banc (depuis la racine du dépôt, env. 8 min, port 3100)
`node scripts/with_server.mjs --server "npm run dev -- --port 3100 --strictPort" --port 3100 -- node work/missions/2026-11-14-brassins/voies/a1-banc/banc.mjs`
(`--seulement=<fragment>` pour un scénario.) Sortie attendue : `BANC OK 156 captures`.

## Critères
- G1 : `CAPTURES OK 156`. G2 : `TROUS OK`. G3 : `HORS OK`. Essais : un seul par critère, après quatre itérations du banc (sélecteurs).
- Banc : `BANC OK 156 captures`, 0 geste sans effet, 0 erreur de page, 0 erreur console hors réseau externe coupé (`journal.json`).
- Tests de base `npx vitest run tests/integration/batch*` : 67 passés, aucun rouge (`tests-base.txt`).

## Fixtures (fictives, cache mémoire `?dev-local`, aucune connexion Firestore)
ZZ-001 planifié, date prévue dépassée de 6 jours ; ZZ-002 en fermentation, OG 1,062, 3 relevés densité + température, dry hop prévu J+6 (180 g, ajout réservé au stock) ; ZZ-003 garde froide ; ZZ-004 conditionné (30 bouteilles, un fût) ; ZZ-005 terminé (FG, ABV, notes) ; plus la liste vide (scénario sans fixture). Thème « cave » posé par `localStorage laffinee.theme` (le bouton soleil/lune de l'en-tête fait pareil, `src/theme/ThemeToggle.tsx`). 390 : tactile, page rechargée à la bonne taille.

## Captures ouvertes (Read) et ce que j'y ai vu
Ouvertes : `liste-remplie-390-clair`, `fiche-fermentation-390-clair`, `saisie-apres-releve-390-cave`, `saisie-conditionnement-ouvert-390-clair`, et, sur les premiers rejeux, `liste-vide-390-cave`, `saisie-releve-densite-ouvert-390-clair`. Les 150 autres sont générées par le même script, avec les mêmes gestes, mais NON ouvertes une à une : mon plafond de contexte ne le permettait pas. Le critique a2 les ouvrira ; elles peuvent cacher un défaut propre à 1280 ou à une fiche que je n'ai pas vue.
Vu : liste à 5 cartes, états distincts ; fiche en fermentation avec bandeau ambre « Ajouts réservés » AVANT les mesures ; courbe à 5 points après le geste, ligne « FG cible », « Atténuation apparente 77 % » ; encadré de conditionnement (volume + date seulement) au-dessus du Dossier.

## Constats principaux (détail dans TROUS.md)
- Pas de dry hop daté ni de température de fermentation du brassin ; courbe en « Relevé n », pas en jours ; aucun rappel ; densité stable non détectée.
- `packaging.bottles33/bottles75/kegIds` jamais lus ni écrits.
- Défaut : le filtre « Période : Ce mois » (`App.tsx:171`) cache 3 brassins sur 5 à l'ouverture de la liste.
- À l'ouverture en `?dev-local`, un toast « Base initialisée avec 11 enregistrements » couvre l'en-tête quelques secondes : le banc attend sa disparition (propre au mode local).

## Doutes et limites
- Le jour de brassage n'est pas rejoué : l'état « fermentation » est posé avec les champs que `BrewDayPage.tsx:1750-1760` écrit.
- `recipeSnapshot` des fixtures est minimal et fictif (pas de calcul de moteur).
- « J+4 » affiché pour un levurage vieux de 5 jours à 18 h : arrondi par le bas, signalé en P3.

DÉCISION À PRENDRE : aucune.
CONNAISSANCE : en `?dev-local`, `Input` devient un `textarea` en tactile (`src/ui/Input.tsx`, `singleLine`) : un sélecteur `input[…]` ne trouve pas le champ à 390 ; utiliser `[aria-label=…]`. Le filtre de période de l'app se règle par `localStorage laffinee_ui_state` → `app_global_time_filter: 'all'`.
LEÇON PROPOSÉE : aucune.
