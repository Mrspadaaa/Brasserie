OK — P7 et N1 à N5 corrigés dans W (commit 5e57055d), tsc, 116 tests et build verts ; captures à refaire par un exécutant

W = `C:/Users/mrspa/AppData/Local/Temp/materiel-port` (branche claude/materiel-port, arbre propre). M = `C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie/work/missions/2026-11-14-materiel`.
Commit `5e57055d`, fin « Co-Authored-By: Claude Opus 5.5 ».

## Corrigé comment
- **N1 (bloquant)** : `StocksTab` garde `traiteMateriel` ({avant, apres, id}) à chaque geste de la fiche (feuille 390 et panneau 1280, `changerDepuisFiche`) et le passe à `EquipmentList` (prop `traite`). La liste lit l'index de l'ancienne place sur le fil d'avant le geste, puis pose le même `recent` qu'un geste de la ligne : note pointillée « ✓ pH-mètre à jour jusqu'au 15.12 » à l'ancienne place, ligne `mt-flash` (z-index 2, fond plein : le trait 30 j ne la barre plus) à sa nouvelle date avec « 4,02 · 7,01 ✓ » (`lecturesDerniere`, dans `DetailModel`, valeurs rangées par attendu croissant ; ✗ si hors tolérance). Vaut pour Tout et À traiter. Bonus : la note s'affiche aussi quand l'appareil était le dernier du haut (elle disparaissait).
  Test `materielFicheStocks.test.tsx` « N1 » : **échoue avant** (note absente : `getByText(/pH-mètre à jour jusqu'au/)` introuvable, 1 rouge sur 4), **passe après**.
- **N2** : « Payer un entretien » passe le nom à `ExpenseSheet` (`existingEquipmentName`) : « Pour quoi ? » = « Entretien · pH-mètre » (saisie « typed »), ligne de nature « Entretien / réparation » reliée à l'appareil, catégorie `materiel` ; la section repliée dit « matériel · pH-mètre » au lieu de « 1 fiche de matériel ». Test : la Dépense reçoit le nom.
- **N3** : `filDuTemps` : un appareil au brassin à jour (`avenir` sans date) reste dans `avenir` avec `sansDate: true`, après les lignes datées (et après la coupure s'il y en a une), et sort de `sansEcheance`. Ligne « détartrer · dans 5 brassins » (la sous-ligne de statut dit « dans », plus « encore »). Au filtre À traiter, une telle ligne se pose juste sous « aujourd'hui » (sinon elle serait très loin sous la coupure). Test unitaire remplacé (`equipmentSchedule`).
- **N4** : `Sheet` sans en-tête (`bare`) : à l'ouverture, le focus va à la feuille, pas à un bouton : plus d'anneau autour de « ← Stocks · Matériel » ni du × de « Nouveau matériel ». Le :focus-visible clavier reste.
- **N5** : toast `StocksTab` : verbe en `<b>`, `Undo2` devant « Annuler ». Test.
- **P7** : `Sheet` reçoit `plein` (page pleine : `top-0`, 100 dvh, pas de poignée, pas de coins, fond opaque `cave-950`) ; `EquipmentSheet` l'utilise ; `detail.css` hauteur 100 dvh. Barre de za3 : pictogramme houblon (lucide `Hop`, vert) devant « Stocks · Matériel », filet sous la barre pleine largeur, ⋯ rond à droite, marge de sécurité haute.

## Critères
- `npx tsc --noEmit` : aucune sortie.
- `npx vitest run …` (liste de la demande + `materielFicheStocks`) → `voies/c2/tests.txt` : 6 fichiers, 116 verts, 0 rouge.
- `npm run build` : vert (DRAPEAUX OK).
- Essais : 1 par critère, une correction du script d'édition (CRLF d'`ExpenseSheet`).

## Limites et doutes
- Aucune capture prise par moi : ma limite de contexte (150 k) m'oblige à confier la série mécanique à l'exécutant. P7, N1, N3, N4 ne sont dits justes que par le code et les tests ; les captures décident (L12).
- `Sheet` et `ExpenseSheet` sont modifiés (hors périmètre de d2a/d2b, dans W seul) ; changements optionnels, sans effet sur les autres feuilles (`plein` absent, `existingEquipmentName` absent). `bare` change le focus initial de « Nouveau matériel » aussi (voulu, N4).
- Coque : la page pleine à 390 couvre la barre du bas de l'app (comme za3-geste-390, qui n'a pas de barre du bas).
- La DETAIL « fiche du pH-mètre » conserve « encore N brassins » dans son titre d'état (« À jour · encore 5 brassins ») : seul le fil liste dit « dans ».
- `ExpenseSheet` : catégorie `materiel` pour un entretien d'appareil existant ; à confirmer au banc que la Dépense s'ouvre sans erreur.

## DEMANDE EXECUTANT :
Dans W, serveur de banc en arrière-plan : `cd C:/Users/mrspa/AppData/Local/Temp/materiel-port && npx vite --port 3457 --strictPort`, ouvrir `http://localhost:3457/?dev-local`. Méthode et fixtures : `M/voies/d2a/RESULTAT.md` « Banc » et `M/voies/c1/RESULTAT.md` « DEMANDE EXECUTANT » (copie jetable de `src/data/seedData.ts` à remettre à l'original ensuite ; jour de l'appareil figé au 15.11.2026 par un shim `Date` ; pH-mètre sans `calibration`, rythme 1 mois, `lastDone` 2026-10-11, historique 11.10 / 12.09 / 10.08 / 08.07 ; deux dépenses `service` reliées ; pompe en panne depuis le 05.11 « fuit au raccord » ; frigo Dégivrer ; refroidisseur à plaques Détartrer au rythme 5 brassins avec 5 brassins fictifs ; un appareil avec prix pour le total ≥ 1 000 CHF ; une cuve avec échéance après la coupure).
Captures dans `M/voies/c2/captures/` (PNG, clair, 390 tactile sauf mention ; chacune ouverte en image, L12, et comparée à `M/v2/za3/za3-*.png`) :
1. `c2-etalonne-tout-390.png` : fiche du pH-mètre (feuille), saisir 7,01 et 4,02, **✓ Étalonné**, liste en filtre **Tout** : note pointillée « pH-mètre à jour jusqu'au 15.12 » sous la pompe, ligne pH-mètre surlignée à 15.12 avec « 4,02 · 7,01 ✓ », toast « **Étalonné** · à jour jusqu'au 15.12 » avec ↶ Annuler ; le trait 30 j ne barre pas la date.
2. `c2-etalonne-traiter-390.png` : même geste, puis filtre **À traiter** (l'état de `za3-traiter-390.png`) : note, ligne surlignée, « N à jour · Tout › ».
3. `c2-etalonne-1280.png` : à 1280, choisir le pH-mètre dans le panneau, Étalonné : note et ligne surlignée dans la liste, toast.
4. `c2-fiche-pleine-390.png` : fiche du pH-mètre ouverte à 390 : page pleine (plus de poignée ni de fond flou), barre « ← 🌿 Stocks · Matériel » avec ⋯ rond et filet, aucun anneau de focus. Aussi `c2-fiche-pompe-390.png` et `c2-fiche-frigo-390.png` (noms sur une ligne, sans anneau). Comparer à `za3-geste-390.png`.
5. `c2-payer-390.png` : fiche du pH-mètre, **Payer un entretien** : la Dépense s'ouvre ; « Pour quoi ? » = « Entretien · pH-mètre » et la section repliée dit « matériel · pH-mètre » (ligne de matériel visible sans déplier).
6. `c2-apres-geste-1280.png` et `c2-apres-geste-390.png` : **Fait** sur le Refroidisseur : il reste dans le fil, après la coupure, « détartrer · dans 5 brassins » (sans date), il n'est plus dans « sans échéance » ; toast « **Fait** · à jour pour 5 brassins » avec ↶ Annuler.
7. `c2-ajout-390.png` : « Nouveau matériel » : titre gras, × rond, **aucun anneau de focus** sur le ×.
8. `c2-annule-390.png` : après Annuler d'un Étalonné : le pH-mètre revient en haut, la note et la ligne surlignée ont disparu.
Contrôles à rejouer sur chaque page : 0 texte < 12 px, 0 `input[type="number"]`, 0 débordement horizontal à 390, 0 exception. Sortie attendue : `CAPTURES OK 10` (liste de celles qui manquent). Arrêter le serveur, remettre `seedData.ts`, `git status --short` dans W vide.
Je juge ensuite : fidélité côte à côte avec `za3-traiter-390.png` et `za3-geste-390.png`.

CONNAISSANCE : un geste fait dans une feuille ouverte au-dessus d'une liste (Étalonné) doit remonter jusqu'à la liste par une prop du parent (`traite`), pas seulement par un toast : sinon la liste ne montre pas le résultat à sa place.
LEÇON PROPOSÉE : aucune
