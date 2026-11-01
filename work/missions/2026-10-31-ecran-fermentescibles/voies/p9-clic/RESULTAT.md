OK — Ajout.tsx : les tuiles se replient après l'appui, plus pendant ; clic Chrome réel OK, témoin HEAD en échec
P9 OK — le premier appui sous les tuiles (souris et doigt, 390 px) abouti : « Ajouter un cran » monte la masse de 5,0 à 5,1 kg ; sur HEAD, 0 cran.

## Diff en une phrase
Dans `src/ui/fermentescibles/Ajout.tsx`, `onBlur={() => setOuvert(false)}` devient `replierPlusTard` : souris tenue (suivie par un écouteur `pointerdown`/`pointerup` du document), on attend le `pointerup` puis un `setTimeout(0)` ; doigt ou clavier, `setTimeout(0)` ; rien ne se replie si le champ a repris le focus ; `onFocus` annule le repli en attente ; minuterie et écouteurs retirés au démontage. Ni dessin, ni tailles, ni Échap, ni tuiles (leur `preventDefault` est intact).

## Fichiers écrits
- `src/ui/fermentescibles/Ajout.tsx` (modifié)
- `tests/unit/fermentescibles/ajout-repli.test.tsx` (nouveau, 5 tests : souris, clavier, doigt, focus repris, démontage)
- `work/missions/2026-10-31-ecran-fermentescibles/voies/p9-clic/controle-clic.mjs` (nouveau)
- ce RESULTAT.md

## Critères
- `npx tsc --noEmit -p .` : `TYPES OK`
- `npx vitest run tests/unit/fermentescibles --maxWorkers=2` : 4 fichiers, 47 tests verts, `TESTS MALTS OK`
- `node scripts/audit_inputs.mjs` : `INPUT PROTECTION AUDIT PASSED: 653 protected usages in 364 files`
- `controle-clic.mjs` (port 5616) sur ma version :
  ```
  OK    souris390 : le champ a le focus, 5 tuiles ouvertes (focus « ajout »)
  OK    souris390 : masse du plateau 5,0 -> 5,1 kg (ligne 5,0 -> 5,1), un cran attendu au premier appui
  OK    souris390 : les tuiles se replient après l'appui (0 grille ouverte)
  OK    tactile390 : … 5,0 -> 5,1 kg …           OK    tactile390 : tuiles repliées
  OK    souris1280 : … 5,0 -> 5,1 kg …           OK    souris1280 : tuiles repliées
  CLIC OK
  ```
  Captures ouvertes en image : `%TEMP%/p9-clic-ma/souris390-1-avant.png` (tuiles ouvertes sur deux colonnes, plateau en bas, « 5,0 ») et `souris390-2-apres.png` (tuiles repliées en une rangée, « 5,1 »).
- p8 : `capturer-malts.mjs` (port 5615) : `CHOIX OK (1 écran(s) conforme(s) à son choix ; 0 ouvert(s))`, `MALTS OK`, code 0.

## Témoin négatif (Ajout.tsx de `git show HEAD:` remis le temps du témoin, puis ma version rétablie)
Sur HEAD :
```
OK    souris390 : le champ a le focus, 5 tuiles ouvertes (focus « ajout »)
ECHEC souris390 : masse du plateau 5,0 -> 5,0 kg (ligne 5,0 -> 5,0), un cran attendu au premier appui
OK    souris390 : les tuiles se replient après l'appui (0 grille ouverte)
ECHEC tactile390 : masse du plateau 5,0 -> 5,0 kg (ligne 5,0 -> 5,0), un cran attendu au premier appui
OK    souris1280 : … 5,0 -> 5,1 kg …
CLIC ECHEC 2
```
Sur ma version : `CLIC OK` (ci-dessus). Le défaut est donc reproduit aux deux formats 390 (souris et doigt) et corrigé. À 1280, la page ne bouge pas assez sous la souris : le clic passait déjà sur HEAD.
Remise en place vérifiée (`replierPlusTard` présent dans Ajout.tsx).

## Essais, doutes, limites
- Essais : un par critère, sauf le test de démontage (3 essais : le décompte de minuteries compte aussi celles de React ; il compare maintenant avant/après le démontage et la balance des écouteurs `pointer*` posés/retirés).
- Le doigt réel (iOS/Android) n'est pas testé : `touchscreen.tap` de Chrome émule la suite touch puis mousedown/mouseup/click. Le test en 390 tactile échoue bien sur HEAD, donc il porte le risque.
- Cas limite : bouton de souris relâché hors de la fenêtre, sans `pointerup` reçu : le repli attendrait le prochain `pointerup` du document ; le champ reste ouvert jusque-là (sans gêne, il se replie au prochain appui). Le `pointercancel` est aussi écouté.
- `git status` : seuls `Ajout.tsx`, le test et le dossier de la voie sont à moi ; les autres fichiers modifiés viennent d'autres voies ou existaient déjà.

CONNAISSANCE : aucune
LEÇON PROPOSÉE : aucune
