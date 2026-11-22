ECHEC — G2 : captures 390/1280 pas encore prises (DEMANDE EXECUTANT) ; fiche za3 commitée, G1 43 tests, tsc et build verts

REPRISE : le code et les tests sont finis et commités (72947bd5 dans W). Reste le banc visuel, à confier à un exécutant, puis jugement (G2). W = `C:/Users/mrspa/AppData/Local/Temp/materiel-port`, M = `C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie/work/missions/2026-11-14-materiel`.

## Fichiers (W, commits 92dd4f1b puis 72947bd5, par chemins)
- `src/ui/equipment/Detail.tsx` : `EquipmentDetail` (interface fixée de PORT.md, inchangée) ; layouts `sheet` et `pane`.
- `src/ui/equipment/DetailModel.ts` : calculs purs (écart `fmtEcart`, saisie décimale `lireNombre`/`filtrerSaisie`, étapes, titre d'état, historique, fil à 1280 à 3,5 px/j, rythme).
- `src/ui/equipment/DetailEdit.tsx` : `EquipmentEditSheet`, l'ancien formulaire déplacé (TE-46, TE-47, BR-94 gardés) ; ⋯ › Modifier et création.
- `src/ui/equipment/detail.css` (préfixe `eqd-`, jetons `--cave-*`, clair et cave) ; `src/ui/EquipmentSheet.tsx` (enveloppe : fiche dans `Sheet` pour un appareil nommé, formulaire pour une création).
- Tests : `tests/integration/equipmentDetail.test.tsx` (16, neuf) ; adaptés : `tests/unit/rejeu-649b/te47-prix-message-visible.test.tsx` (ouvre ⋯ › Modifier avant le prix, sélecteur `summary`), `tests/integration/compactEquipment.test.tsx` et `defautsStocksEcrans.test.tsx` (même détour ; l'état et l'entretien ne sont plus dans le formulaire de correction). `te47-prix-materiel.test.tsx` (création) passe sans changement.

## Critères
- G1 : `TESTS OK 43` (5 fichiers, `voies/d2b/tests.txt`, relancé sans couleurs). `npx tsc --noEmit` : aucune sortie. `npm run build` : vert (drapeaux OK).
- G2 : captures pas encore prises (voir DEMANDE EXECUTANT). Écrans jamais ouverts dans Chrome par moi : rien n'est dit juste côté rendu.
- Essais : 1 par critère ; un test corrigé (libellé du champ lu : `aria-label` sur le champ, pas le `label` englobant ; deuxième « Achat » derrière la feuille).

## DEMANDE EXECUTANT :
Commandes, dans l'ordre (dans W, chaque capture dans `M/voies/d2b/captures/`) :
1. `git -C W log --oneline | head -3` doit montrer 72947bd5 (d2b) au-dessus de 942198ca (d2a) : le câblage de d2a est déjà dedans.
2. En arrière-plan : `cd W && PORT=3447 npx vite --port 3447 --strictPort` ; ouvrir `http://localhost:3447/?dev-local` ; fixtures comme `M/voies/a0-banc/VOIE.md`, avec champs neufs remplis (données simulées uniquement) :
   - pH-mètre : `rhythm {every:1, unit:'mois'}`, `lastDone:'2026-10-11'`, `history` : étalonnages 11.10 (7,02 / 4,03), 12.09, 10.08, 08.07 ; achat sans date ni prix ; une transaction `expense` avec deux lignes `equipmentRef` du pH-mètre (24,90 et 12,50 CHF).
   - Pompe de recirculation : `brokenSince:'2026-11-05'`, `brokenNote:'fuit au raccord'`, `state:'À réparer'`.
   - Un frigo : `task:'Dégivrer'`, `rhythm {1 mois}`, `lastDone` récent (appareil sans étalonnage).
   - Jour de l'appareil : 15.11.2026 (le pH-mètre reste « prévu le 11.11 », prochain 15.12).
3. Captures, chacune ouverte en image (L12) et comparée à la maquette `M/v2/za3/za3-geste-390.png` (390) ou `za3-repos-1280.png` (1280) :
   - `d2b-ph-390.png` : Stocks › Matériel, toucher « Étalonner » du pH-mètre (390 tactile, clair), puis saisir `7,01` et `4,02` dans les deux champs (clavier décimal).
   - `d2b-ph-hors-390.png` : même fiche, `7,2` dans pH 7 (écart rouge ✗).
   - `d2b-pompe-390.png` : fiche de la pompe (bouton « Réparée »).
   - `d2b-frigo-390.png` : fiche du frigo (« Fait », sans étapes).
   - `d2b-gestion-390.png` : fiche du pH-mètre, ⋯ ouvert (Modifier, Vendu, Réformé, Supprimer).
   - `d2b-ph-cave-390.png` : fiche du pH-mètre en thème cave.
   - `d2b-ph-1280.png` : à 1280, pH-mètre choisi dans la liste (fil de l'appareil + fiche) ; `d2b-ph-cave-1280.png` : idem en cave.
4. Gestes à jouer (noter le résultat) : Étalonné → la fiche se ferme, le toast annonce « Étalonné · à jour jusqu'au 15.12 » avec Annuler ; Annuler rétablit ; Modifier ouvre le formulaire, Enregistrer ; Supprimer demande la confirmation (annuler, ne rien supprimer).
5. Arrêter le serveur.
Sorties attendues : 8 PNG, G2 `CAPTURES OK 8`, aucun texte < 12 px, aucun débordement horizontal à 390, aucun `type="number"`.
Je juge ensuite : fidélité côte à côte avec za3, hauteur de la feuille (94 dvh, pied au bas), pastilles de rythme et d'état sur une ligne à 390, bande « 30 j » et coupure du fil à 1280.

## Décisions et limites (à relire)
- **En-tête de la fiche à 390** : la maquette a « ← Stocks · Matériel » et ⋯ dans une barre de page ; `Sheet` (non possédé) impose son titre et sa croix. Le titre de la feuille est « Stocks · Matériel », la croix ferme, et ⋯ est dans la rangée du titre (comme à 1280 dans la maquette).
- **Hauteurs** : champs lus 44 px (maquette 36), ⋯ 44 px (maquette 36), zones des pastilles élargies à 44 sans changer leur dessin 30 px : cibles 44 px des exigences.
- **« Démo »** (pastille de la maquette sur les dépenses) : retiré, c'est un marqueur de maquette ; les vraies dépenses n'ont pas de drapeau.
- **« utilisé dans N brassins »** : compté depuis l'achat (tous les brassins faits sans date d'achat) ; non dit quand N = 0.
- **Rythme « brassin »** : la pastille écrit `{every:5, unit:'brassin'}` (le 5 est le « 5 brassins » de za3) ; aucun réglage du nombre dans la maquette, donc aucun. À décider.
- **État « À réparer »** ouvre une panne datée d'aujourd'hui (`markBroken`) ; tout autre état sur un appareil en panne la lève (`markRepaired`). Sans cause saisie : « en panne ».
- **Étalonné** s'enregistre même avec une lecture hors tolérance (✗ rouge, lecture gardée : une sonde à changer est une information) ou sans lecture (aucune valeur inventée). Étapes : rincer et ranger se cochent à la main, une étape de point se coche seule à la lecture.
- **Formulaire de correction** : sans état ni entretien (réglés sur la fiche), sauf un ancien texte d'entretien libre, gardé éditable. La suppression n'est plus dans le formulaire mais dans ⋯.
- **Payer un entretien** : `onPayMaintenance(item)`. d2a l'a câblé sur `ExpenseSheet initialIntent="expense" existingEquipmentId` : `newLine('expense')` crée une ligne « Ingrédients » ; le champ « Matériel entretenu » n'apparaît que pour une ligne « Entretien / réparation » ou « Matériel durable ». À corriger dans `ExpenseSheet` (hors de mon périmètre) : une prop `initialKind: 'maintenance'` pour la première ligne. Et, côté domaine, la ligne enregistrée en « Entretien / réparation » est lue `kind: 'service'` ou `autre` par `relatedExpenses` : à vérifier avec le type `FinanceLineKind` (pas de `maintenance` dans ce type).
- **Câblage de `EquipmentSheet` par StocksTab (d2a)** : l'interface reste compatible ; pour une feuille complète à 390, passer `batches`, `transactions`, `onPayMaintenance` et `onChange(item, toast)` (avec Annuler). Sans eux, la fiche s'ouvre sans dépenses ni brassins, et un geste appelle `onSave` sans bandeau.
- Fil à 1280 : l'espacement d'au moins 32 px entre deux points est de moi ; le « prévu » est ramené à 28 px au-dessus d'aujourd'hui comme dans la maquette (252 px) ; au-delà de 470 px, le point est ramené là avec une coupure (le prochain d'un rythme de 3 mois).

DÉCISION À PRENDRE : rythme « brassin » : garder « 5 » fixe (recommandé pour ce port, fidèle à la maquette) ou ajouter un petit réglage du nombre ? Pilote ; ajout hors maquette, à montrer au brasseur en mini maquette avant tout.
CONNAISSANCE : aucune
LEÇON PROPOSÉE : aucune
