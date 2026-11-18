OK — Sun Store : lignes retirées, total changé et terminal ≠ total en rouge avec leur geste ; total entier à 390 ; plus d'icône hors brassage ; cause serveur écrite

Version : HEAD c76481aa + le travail non commité de la voie. Aucun commit, stash, déploiement, appel Gemini.

## Fichiers écrits
- `src/ui/finance/controlesCroises.ts` : rangées `retirees`, `total-corrige`, `tva-corrigee` (champ `ton` rouge/ambre) ; « Payé ≠ imprimé » rouge quand un terminal lu diffère du total sans reçu ni partage expliqué ; `gardees`, `retiresExpliquent`.
- `src/ui/finance/ExpenseSheet.tsx` : entrées du bloc, gestes « Les garder » (rend aussi le total d'avant s'il avait baissé d'exactement ces lignes), « Remettre 163,85 », « Remettre 0,37 », « Tout valider » tranche aussi total et TVA, `finLecture` rejoue la fusion pour un final servi du cache, `sansStock` sur les lignes barrées.
- `src/ui/depense/Ligne.tsx` (LignePerdue sans icône hors brassage), `src/ui/depense/Recap.tsx` (total `shrink-0`, « lu 163,85 CHF » sur sa ligne), `src/ui/depense/finale.ts` (`provisoireDeRetirees`, `JETON_CACHE`), `src/services/geminiScanner.ts` (lit `retirees`).
- `functions/src/invoiceScanVote.ts` : `retireesParLaTroisieme`, `lireCsv8` écrit `retirees`.
- Tests : `tests/unit/finance/controlesCroisesP2.test.ts` (17), `tests/unit/depense/p2-retirees.test.tsx` (8), `p2-retirees-serveur.test.ts` (3), `p2-normalize.test.ts` (3) ; `tests/integration/depensePiece.test.tsx` : un test changé exprès (terminal > total : « sans drapeau » devient rouge, contrat du bloquant 2).
- Voie : `banc/` (banc p1 + `sunstore-pages-retirees`), `capturer-p2.mjs`, `montages-p2.mjs`, `console-p2.txt`, `captures/` (28 PNG + 14 montages clair | cave), `tests.txt`, `tsc.txt`, `tsc-functions.txt`, `build.txt`.

## Cause du bloquant 1b (vérification d'une dépense à plusieurs pages)
1. Les trois lectures reçoivent les mêmes images et la même note (`MULTI_PAGE_NOTE` : « captures successives d'un même document… elles peuvent se recouvrir », `ai.ts` l.199) ; deux tickets distincts du même passage s'y lisent comme un seul document.
2. Quand les deux Flash-Lite divergent, la 3.8 tranche SEULE (C★, `finalOfStar`, `invoiceScanVote.ts`) : ses lignes et son total remplacent ceux des deux premières lectures, même quand elles s'accordaient sur la page 1 et sur 163,85. Que la 3.8 ne rende que la page 2 est un comportement du modèle : non prouvable sans appel réel, donc non corrigé (la note multi-pages est « la forme mesurée » du banc ; je n'y touche pas).
3. Cause PROUVÉE de « tout vert » : ce que la 3.8 retire n'était écrit nulle part dans le résultat. Le client ne le savait que par le flux provisoire ; un résultat relu du cache (cas c du jeu en ligne 4 : « 5 lignes, 149,25, plus trace des deux articles ») n'a plus aucune trace. Preuve : `tests/unit/depense/p2-retirees-serveur.test.ts` (fetch simulé, 2 pages) : avant, aucun champ ; après, `retirees` = les 2 lignes (rang, montants), 163,85 et 0,37 d'avant.
4. Correction : le serveur écrit `retirees` (additif, aucune valeur du résultat changée) ; le client refait le provisoire (`provisoireDeRetirees`) et rejoue la fusion habituelle : lignes barrées, total et TVA changés, rangées rouges, mêmes gestes que sur le flux.
5. Limites : seules les LIGNES retirées déclenchent l'écriture (un total corrigé seul reste une correction ordinaire : le banc de parité `banc-lecture-facture` est l'oracle et ne l'écrit pas ; son test a échoué quand je l'écrivais aussi sur total seul) ; une ligne que la 3.8 AJOUTE n'est pas connue du cache (lue comme inchangée). Non déployé : les résultats déjà au cache n'ont pas le champ.

## Critères
- `npx tsc --noEmit -p .` et `cd functions && npx tsc --noEmit -p .` : sorties vides (`tsc.txt`, `tsc-functions.txt`).
- Tests (`tests.txt`) : `Test Files 236 passed | 1 skipped (237)` ; `Tests 3061 passed | 4 skipped (3065)` ; zéro rouge. Lecture serveur : `tests/unit/invoiceScan*` et `banc-lecture-facture` : 267 verts.
- `npm run build` : « built in 14.46s », DRAPEAUX OK (`build.txt`).
- L13 : 16 tests de p2 (hors cache) rouges quand `controlesCroises.ts`, `ExpenseSheet.tsx`, `Ligne.tsx`, `Recap.tsx` étaient remis à HEAD (copie dans /tmp, `cmp` vérifié après restauration), verts ensuite. Les tests ajoutés après (cache, `gardees`, somme → « Les garder ») sont verts ; les 3 du serveur échouent sur HEAD par construction (`retirees` n'existait pas).
- Captures Chrome réel (puppeteer-core, Vite :5199), 390 tactile (tap) et 1280, clair et cave : repos et après chaque pastille en écart (retirées, total changé, TVA changée, payé). `console-p2.txt` : 0 erreur de page, total scrollWidth = clientWidth (123/123 à 390 et à 1280), 0 icône de stock sur les 2 lignes barrées, 0 chevauchement, pas de débordement de page.
- Captures ouvertes en image : 390 haut, bloc, lignes barrées, après retirées, après total, après TVA, après payé (clair et cave) ; 1280 après retirées et après payé. Non rouvertes en image après la dernière relance : 1280 « 0-haut », « 1-bloc », « 2 », « 4 », « 5 » (même contenu que les 1280 lus ; mesures dans `console-p2.txt`). À rouvrir par l'exécutant si le pilote le veut.

## Ce que l'écran dit maintenant (banc Sun Store, 390 cave et clair)
Total « 149,25 » entier, « lu 163,85 CHF » dessous ; en-tête rouge « À vérifier · 2 lignes retirées · 14,60 CHF » ; « Articles lus » et « Somme des lignes » en gris neutre (jamais vert) ; « 2 lignes lues puis retirées 14,60 › Les garder » rouge ; « Total changé 163,85 → 149,25 › Remettre 163,85 » rouge ; « TVA changée 0,37 → 0,00 » ambre ; « Payé · TWINT ≠ imprimé 163,85 / 149,25 +14,60 › Les garder · 14,60 retirés » rouge (sans « montant non lu »). « Les garder » : 7 lignes, total 163,85, Payé = imprimé, il ne reste que la TVA ; « Articles lus 5 · 2 rabais · dont 2 gardées » neutre.

## Essais
Un essai par point en code ; 2 relances de test (somme ≠ ok sur la fixture « lenteur » dont les lignes ne font pas le total ; parité du banc serveur) ; captures : 4 passages complets (banc, montage cassé par file://, 2 relances après corrections). Détour : le Bash du poste mange les barres inverses des scripts de réécriture (scripts passés par Write, CRLF géré).

## Doutes et limites
- Hors contrat, laissé : pied « pas retrouvée » (D277) toujours en place (« Paracétamol 500 mg 5,40 · pas retrouvée · 1/2 · Garder / Retirer · Tout valider ») ; « Tout valider » entérine la perte de la page 1 en un toucher (il tranche désormais aussi total et TVA). Photo à 1280 (VERDICT-4 point 6) non touchée.
- Doublon d'information : « Vues par une seule lecture » (acquis P3) et « lignes retirées » disent la même chose quand on remet le total ; je n'ai pas retiré la première (test acquis `depenseTotaux` P3).
- « Lignes = total 149,25 » reste sous la liste (gris, hors bloc) : lit le total changé sans le dire.
- « Les garder » est offert à trois endroits (retirées, payé, somme) : un même geste, voulu (chaque pastille mène à son geste).
- La cause modèle (pourquoi la 3.8 ne rend que la page 2) reste ouverte : piste pour le conseil, une note de lecture « plusieurs tickets d'un même règlement » mesurée au banc réel (appel réel : hors contrat).

DÉCISION À PRENDRE : déployer `functions` (champ `retirees`) pour que les lectures futures portent la trace ; recommandation : oui, additif, sans effet sur les valeurs ; les lectures déjà au cache n'auront pas le champ.

CONNAISSANCE : une relecture servie du cache ne porte pas le flux provisoire : tout ce que la 3.8 retire doit être écrit dans le résultat serveur (`retirees`) pour rester tranchable ; le banc de parité (`scripts/banc-lecture-facture.ts`) interdit d'ajouter une clé au résultat sans lignes retirées.

LEÇON PROPOSÉE : un contrôle « tout vert » se joue aussi sur un résultat servi du cache (sans flux provisoire), pas seulement au premier passage : le jeu en ligne 4 a montré les deux.
