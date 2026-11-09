OK — 7 problèmes du VERDICT-2 corrigés (3 bloquants d'abord) ; tests rouges avant, verts après ; captures finales à rejouer par l'exécutant

## Corrigé (chaque point a son test, vu rouge avant la correction : `tests/integration/depenseD3.test.tsx`, 12 tests)
1. **Bloquant : « Lectures 3/3 d'accord » contre la barre « désaccord ».** Cause : la rangée comptait `points` filtrés sur `origine==='lecture'` et `pese!==false` ; la barre du bas compte les chips `lectures-divergentes` encore à trancher. Le banc pose l'origine « contrôle » : 0 désaccord à la rangée, 3 à la barre. Correction (`ExpenseSheet.tsx`, `nDesaccords`) : la rangée lit les mêmes chips que la barre (TVA comprise, ceux déjà « Gardés » en moins). Vu : tache « 3/3 · 45 désaccords · Voir le désaccord ›», Sun Store 2 « 3 désaccords » ; `bauhaus-eur` n'a aucun désaccord au banc : « 3/3 d'accord » y reste vrai. Un test avec l'origine « contrôle » (rouge avant), un avec « lecture ».
2. **Bloquant : « Voir la ligne en trop › » muet.** Cause : cible = 1re ligne fausse, sinon la ligne dont le montant égale l'écart ; aucune des deux (écart 296,47, ligne en trop 370,92) → `versListe()` sans effet visible. Correction : `ligneEnTrop()` : la ligne désignée par « Lignes hors articles », sinon la plus grosse ligne (rabais exclus) ; le geste ouvre toujours une ligne. Trois tests (hors articles ; plus grosse ligne ; pastille « Somme ≠ imprimé » en surplus), rouges avant. Vu : `bauhaus-eur` 390 clair, toucher « Articles lus ≠ comptés 30 / 29 +1 » → ligne « Montant en EUR 370,92 » ouverte (page fraîche).
3. **Bloquant : sous-total 0,00 en recherche.** Cause : `calculerBandes` ne rend des `sousGroupes` que pour deux sous-familles visibles au moins ; une ligne trouvée dans un sous-groupe → `?? 0`. Correction : le sous-groupe somme ses lignes visibles comme la bande (`bandesMontrees`). Test : « peinture » (3 lignes dans « Peinture et sols »), rouge avant (« 3/10,00 »), + « serre », « 14,90 », « brosse ». Vu : `bauhaus-eur` « peinture » → « Peinture et sols 29/29 · 277,60 ».
4. **« Qté × prix 2/5 ».** La rangée ne compte que les lignes vérifiables (quantité, prix unitaire et montant lus ; ni port ni rabais) : « 2/2 · 1 sans prix unitaire » sur Sun Store 2, sans coche tant qu'une ligne n'est pas vérifiée (jamais verte, ni fausse) ; « 23/23 justes », « 30/30 justes » inchangés. En devise étrangère (pas de montant de ligne en CHF) le compte reste celui du serveur. `controlesCroises.ts` : `qte.sansPrix`.
5. **Fiche d'un rabais.** Elle n'a que son montant (`Montant ligne n`), « imprimé « NoVatTax - 0% » », « extrait · supprimer » : plus de quantité, prix, unité, +1 +2, nature, article, famille (`ExpenseSheet.tsx`, `estRabais`). Vu : Sun Store 2 390 clair.
6. **Mineur : champ montant qui passe à la ligne** (`1 pièce L × 370,92 =` puis le montant dessous à 390). `largeur()` de `Plateau.tsx` : six caractères tiennent en 78 px (au lieu de 96). Vu : `bauhaus-eur` 390 clair, tout sur une ligne.
7. **Mineur : barre du bas tronquée à 390.** `Pied.tsx` : le nom du changement passe sur deux lignes au lieu de `truncate` : « nom : lectures divergentes (ligne 1) » entier. Vu : tache et Sun Store 2 390 clair.

Une seule assertion modifiée, sans l'affaiblir : `tests/unit/depense/lecture-d/finitions.test.tsx` (a') « le prix effacé, 6/7 sans coche » devient « 6/6 · 1 sans prix unitaire » sans coche (le dénominateur ne compte plus que les lignes vérifiables ; la ligne sans prix est dite à part ; la sémantique « pas de vert » est gardée).

## Fichiers écrits
`src/ui/finance/ExpenseSheet.tsx`, `src/ui/finance/controlesCroises.ts`, `src/ui/depense/Plateau.tsx`, `src/ui/depense/Pied.tsx` ; tests : `tests/integration/depenseD3.test.tsx` (nouveau), `tests/unit/depense/lecture-d/finitions.test.tsx` (1 assertion) ; `voies/d3/capturer-d3.mjs`, `voies/d3/captures/` (4 captures du premier essai), `voies/d3/tests.txt`. Rien dans `functions/`, ni commit ni stash.

## Critères
- `npx tsc --noEmit -p .` : sortie vide.
- **Tests** (`tests.txt`) : `npx vitest run tests/unit/depense tests/unit/finance tests/integration/depense tests/integration/finance tests/integration/expenseSheet tests/unit/geminiScanner.test.ts --reporter=dot` : 230 fichiers passés, 2 990 tests verts, 4 ignorés, zéro rouge (2 978 avant, 12 neufs).
- Captures du premier essai (390 clair, 3 pièces), ouvertes : `captures/bauhaus-eur-390-clair-2-ligne-en-trop.png` (geste 2 ; champ du montant sur une ligne), `captures/bauhaus-eur-390-clair-3-recherche.png` (sous-groupe), `captures/sunstore2-390-clair-5-rabais-ouvert.png` (fiche du rabais, « 2/2 · 1 sans prix unitaire », barre entière), `captures/bauhaus-tache-390-clair-1-lectures.png` (« 3/3 · 45 désaccords », barre entière).

## Doutes et limites
- Au banc, `bauhaus-eur` n'a aucun désaccord de lecture (valeur du banc de d2) : son « 3/3 d'accord » est vrai ; le critique l'avait compté parmi les cinq pièces fausses.
- « Qté × prix » : Sun Store 2 passe en gris (une ligne sans prix unitaire) et non en vert ; choix prudent, réversible (une ligne dans `controlesCroises.ts`).
- Le geste « ligne en trop » prend la plus grosse ligne faute de mieux : sur une pièce où la ligne en trop n'est pas la plus grosse, le brasseur arrive sur une ligne qu'il écartera d'un coup d'œil ; la pastille ne ment pas (elle ouvre une ligne et la liste reste filtrable).
- Le justificatif cassé au banc (`proofDataUrl` vide) et la tache d'avant c1 restent à confirmer en ligne (L28), comme le disait VERDICT-2.

## DEMANDE EXECUTANT
Rejouer toutes les captures sur le code final. Depuis `C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie` :
1. Lancer en arrière-plan `npx vite --port 5199 --strictPort`, attendre « ready ».
2. Pour chaque `c` dans `sunstore1 sunstore2 bauhaus-tache bauhaus-copie bauhaus-eur` : `CAS=<c> MOT=peinture node work/missions/2026-11-09-depense-totaux/voies/d3/capturer-d3.mjs` (clair et cave, 390 et 1280 dans le même appel ; MOT=« vaccin » pour sunstore2, « ibu » pour sunstore1). Recopier la console.
3. Arrêter le serveur (processus sur le port 5199).
Fichiers : `voies/d3/captures/<cas>-<390|1280>-<clair|cave>-<1-lectures|2-ligne-en-trop|3-recherche|4-qte|5-rabais-ouvert>.png` (2 et 5 seulement quand la pièce les a).
Sorties attendues : aucune ligne `ERREUR PAGE` ; bauhaus-eur : « après toucher « articles » : lignes ouvertes line-30 » ; bauhaus-tache : « Lectures : …3/3 · 45 désaccords » et « lignes ouvertes AUCUNE » (la pastille mène à la recherche, voulu) ; sunstore2 : « Qté × prix : 2/2 · 1 sans prix unitaire », « fiche du rabais : champs Montant ligne 2 » ; bauhaus-eur recherche « sous-groupes : 29/29 277,60 ».
À me dire par capture ouverte : texte coupé ou chevauché oui/non ; le jugement du dessin reste à moi.

DÉCISION À PRENDRE : aucune bloquante.
CONNAISSANCE : une rangée d'un bloc de contrôles doit lire la même source que la barre qui dit la même chose (ici les chips `lectures-divergentes`) ; deux comptes de la même chose se contredisent un jour.
LEÇON PROPOSÉE : un test de verdict d'écran doit poser le cas par le chemin réel de la donnée (origine « lecture » du serveur, et celle du banc) : le banc de d2 posait l'origine « contrôle », la rangée testée ne voyait donc aucun désaccord, et les tests verts de d2 n'ont jamais exercé le cas.
