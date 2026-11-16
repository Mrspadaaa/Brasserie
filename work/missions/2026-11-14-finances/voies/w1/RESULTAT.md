OK — FN-22 à FN-26, « Prix d’1 ingrédient » (m4bb-a) et coutBrassinRenvois corrigés, G1 à G5 verts ; captures à confirmer (DEMANDE EXECUTANT)

## Fichiers écrits
- `src/ui/finance/budget/libelles.ts` : singulier « Prix d’1 ingrédient » rendu (la maquette m4bb-a le dit mot pour mot : « Prix d'1 ingrédient : acide lactique »), pluriel « Prix de 4 ingrédients » gardé.
- `src/ui/finance/TransactionJournal.tsx` (FN-22) : le filtre d'état « Toutes » devient « Sans filtre » ; « Courantes / Tout » et « toutes les dates » inchangés.
- `src/ui/finance/prevision/PlanSheetC.tsx` (FN-23) : légende « avec ZZ TEST — Prévision » (nom tel quel, coupé par la fin à 28 signes).
- `src/ui/finance/previsions/Previsions.tsx` (FN-24) : cartes « Avec / Sans » : nom entier (coupé par la fin au-delà de 40 signes), nom entier en `title` au toucher.
- `src/ui/finance/previsions/mesureProjet.ts` (FN-25) : `direHorizon` ; la limite « aucun mois ne tient le seuil » dit « d’ici fin <dernier mois> (soldes de fin de mois, 13 mois) ; au-delà de la vue affichée (jusqu’au 6 févr.) ». La contradiction venait de deux horizons (13 mois de soldes mensuels pour la limite, vue de 90 jours pour « Plus bas »). Le domaine (`materielFutur.ts`) n'est pas à moi : la phrase est complétée côté écran.
- `src/ui/finance/previsions/FicheEtiquette.tsx` + `src/ui/finance/previsions.css` (FN-26) : « 750,00 CHF » dans un bloc `.prv-nb` insécable sans retour à la ligne ; le nom passe à la ligne, jamais « CHF » seul.
- Tests : `tests/integration/w1Mineurs.test.tsx` (neuf, 7 tests). Changés parce qu'ils décrivaient ce qu'un choix remplace : `u2Pures.test.ts` (singulier « d’1 », maquette m4bb-a ; u2 l'avait mis à « de 1 » contre elle), `financeJournalUx.test.tsx` (« Toutes » → « Sans filtre », FN-22).
- Outils de la voie : `sonde.mjs` (chemin du testeur au banc), `aria.mjs`, `rouge/`.

## coutBrassinRenvois : un manque de code, pas un choix remplacé
Le test attend « Prix d’1 ingrédient : pilsner » ; il cite m4bb-a. La maquette m4bb-a dit bien « Prix d'1 ingrédient » (`voies/m4/m4bb-a/etat.html`). C'est u2 (constat 24) qui avait changé le singulier en « Prix de 1 ingrédient » en corrigeant « de4 ». Règle n° 1 : code corrigé, test gardé. Rouge sur HEAD : `rouge/renvois-avant.txt` (1 échec / 8). Vert après.

## Rouge avant correction (HEAD) : `rouge/avant.txt`
6 échecs sur 7 : FN-22 (« Toutes » présent), FN-23 (« avec zz test — prévision »), FN-24 (2 tests : « Avec ZZ TEST - Projet ma… », pas de title), FN-25 (limite sans horizon), FN-26 (montant et « CHF » séparés ; ce test a d'abord échoué sur ma fixture, corrigée). Le 7e, constat 22 par le vrai chemin (`FinanceService.savePlan` d'une dépense de 7,00 aujourd'hui, onglet Prévisions monté, « Rien de prévu » présent puis absent), est déjà VERT sur HEAD : u2 l'a bien corrigé, je n'ai pas trouvé d'autre entrée fausse. Vert après : `rouge/apres1.txt` (14 fichiers, 162 tests).

## Constats 22, 24, 25, 26 du jeu de nuit
Le journal du rejeu (`BUGS.md` du clone codex) dit « 22, 25, 26 : NON JOUÉS (arrêt) » et « 24 : NON JOUÉ en entier, libellé non atteint ». Aucun n'a donc été vu faux en ligne après u2. Le test d'écran 8b9e1732 ne liste que FN-19 (nom coupé, toujours là : corrigé ici avec FN-24), pas « Rien de prévu », « de4 » ni la frise. Rejoué : 22 (test), 24 « de4 » (pur, 4 cas), 25 frise (`etiquettesAxe`, u2Pures vert), 26 nom du projet (cartes, bulle, fiche).

## Critères
- G1 `vitest-lu.mjs voies/w1/tests.txt` : VITEST OK (les 6 fichiers de la ligne Tests + `w1Mineurs`, `u2Pures`, `financeJournalUx`).
- G2 `lire.mjs build.txt "built in" BUILD` : BUILD OK (`npx vite build --outDir <tmp>`).
- G3 `outils/tsc.mjs` : TSC OK.
- G4 `controle-v6a.mjs 3000` : V6A OK. `controle-frise.mjs 3000` : FRISE OK.
- G5 `emulateur.txt` : EMULATEUR OK.
- Essais : 1 par critère ; tests : 2 passes (fixture du test FN-26 corrigée).

## Captures : vues et reste à faire
Ouverte : `cap/fn22-filtres-390-clair.png` (Filtres : « Courantes / Tout », « Sans filtre 7 », « toutes les dates » ; les trois mots se distinguent ; le banc sert bien mon code). Le reste est une série mécanique, voir ci-dessous (ma sonde a bloqué 5 minutes sur la fiche du projet et j'ai gardé le contexte pour rendre).

## DEMANDE EXECUTANT
Banc : `http://localhost:3000/?dev-local&finance-demo` (ne pas relancer ; il sert déjà ce code). Dossier : `work/missions/2026-11-14-finances/voies/w1/cap/` ; nommer `<point>-<390|1280>-<clair|cave>.png` ; ouvrir chaque image. Sondes : `work/missions/2026-11-14-finances/voies/w1/sonde.mjs <filtres|23|24|dump> <largeur> <clair|cave> [onglet]` (le cas 23 ouvre « + » puis « prévision » : sur le banc le bouton est « Actions rapides » ou « Ajouter une prévision » dans la feuille des sorties de l'onglet Prévisions ; adapter le chemin si la sonde dit « prévision absent »). Une capture à la fois, timeout 120 s par commande ; si une commande dépasse, la tuer et rendre `BLOQUE <cas>`.
1. `fn22` Opérations › Filtres : panneau ouvert (« Courantes / Tout », « Sans filtre n », « toutes les dates »). 390 et 1280, clair et cave.
2. `fn23` Prévisions › Ajouter une prévision : titre « ZZ TEST — Prévision », montant 7 ; la légende sous la frise doit lire « avec ZZ TEST — Prévision » (casse conservée), sans Enregistrer. 4 captures.
3. `fn24` Prévisions : cartes « Avec Fermenteur supplémentaire / Sans Fermenteur supplémentaire » entières, sur 390 aucune coupure en « suppléme… ». 4 captures.
4. `fn25-26` Prévisions › bulle « Fermenteur supplémentaire −750 » : fiche du projet. Titre « Fermenteur supplémentaire, 750,00 CHF » : à 1280 « CHF » jamais seul à la ligne ; Limites : la ligne « aucun mois ne tient le seuil » dit « d’ici fin … (soldes de fin de mois, 13 mois) ; au-delà de la vue affichée (jusqu’au … ) ». 4 captures (+ Limites en gros plan si besoin).
5. `de4` Prévisions › « n sorties » › Budget d'un brassin : un brassin avec prix manquants : « Prix de 4 ingrédients : … » ; avec un seul manque : « Prix d’1 ingrédient : … » (apostrophe, comme la maquette m4bb-a). 390 clair et cave suffisent.
6. `25b` Synthèse (`?dev-local&finance-demo=reel`) › Solde et paramètres : frise m4pf-c, mois uniques (août, sept., oct., nov.). 390 et 1280, clair.
Ensuite rejouer : `node work/missions/2026-11-14-finances/voies/o1/controle-v6a.mjs 3000` (V6A OK) et `node work/missions/2026-11-14-finances/voies/f1/controle-frise.mjs 3000` (FRISE OK). Rendre la liste des images ouvertes, ce qui déborde ou se chevauche (surtout : cartes Avec/Sans à 390, titre de la fiche à 1280). Je juge ensuite.

## Doutes et limites
- Validation visuelle faite seulement pour FN-22 (390 clair). Les autres points sont prouvés par tests de rendu (jsdom), pas encore par capture.
- Les cartes « Avec / Sans » grandissent d'une ligne à 390 pour un nom long : le nom entier prime sur la hauteur de la carte (FN-24 : « sans coupure »).
- FN-23 : la légende garde le nom entier ; coupé à 28 signes au-delà.
- « Prix d’1 ingrédient » est une tournure bizarre en français mais c'est le texte de la maquette choisie.
- `functions/*`, `assistantContext.ts`, `compagnon/` etc. dans `git status` : voie w2, non touchés.

DÉCISION À PRENDRE : « Sans filtre » (état « tous ») est mon mot pour FN-22 ; alternative « Tous états ». Recommandation : garder « Sans filtre », il ne ressemble ni à « Tout » ni à « toutes les dates ».

CONNAISSANCE : la limite « aucun mois ne tient le seuil » du domaine (`materielFutur.ts`) lit les soldes de fin de mois sur 13 mois, pas la vue affichée ; « Plus bas » lit l'escalier du jour de la vue.
LEÇON PROPOSÉE : un contrôle écrit sur la parole d'un constat « corrigé » doit d'abord rejouer le chemin : ici 22/24/25 n'avaient jamais été vus faux en ligne après u2 (« NON JOUÉ » au journal), seul le nom du projet l'était.
