OK partiel — drapeau « pas un achat de brasserie ? » + renvoi privé, total seul = 1 × total, mois en français, paiement lié à l'achat ; captures 390 à faire (DEMANDE EXECUTANT)

## Fichiers écrits
- `src/ui/depense/confiance.ts` : `PAS_BRASSERIE`, ligne « Autres » (kind other/unknown) d'une dépense « divers » = niveau `repris` avec cette raison (la règle existante catégorie + famille, aucune liste de mots).
- `src/ui/depense/finale.ts` : `totalSeulEnUn` (kinds other/maintenance/service/shipping, ni quantité ni prix lus, montant > 0 → quantité 1, prix unitaire = total), appliqué dans `lignesDeLecture`.
- `src/ui/depense/Plateau.tsx` : `SegmentUnite` a des séparateurs (`divide-x`) : « pièce | L », plus « pièceL ».
- `src/ui/finance/ExpenseSheet.tsx` : renvoi `data-dp-renvoi-prive` « Apport ou prélèvement privé › » sous la nature (ouvre `MovementSheet` préremplie), `changerNature` pose 1 × total pour Service, ligne `data-dp="paye-autre-jour"`.
- `src/ui/finance/MovementSheet.tsx` (hors liste, minimal) : prop optionnelle `prefill` (retrait, montant, motif, date).
- `src/services/purchasePrefill.ts` : une date de paiement supposée (`document_date`) suit la date de l'achat même si elle en différait.
- `src/ui/DateField.tsx` : « Changer le mois » = deux listes (mois en français `MOIS_FR`, année), plus de `type="month"` natif (« November 2026 »).
- Tests : `tests/integration/depenseMedicament.test.tsx` (neuf, 13), `tests/integration/expenseSheet.test.tsx` (le mois se choisit par `'07'`).

## Causes (fichier:ligne approximatives, après édition)
1. « Pas flaggé » : `confiance.ts` ~l.382 : la famille « Autres » n'était signalée que si le kind n'était PAS hors stock ; une ligne lue `other` (rangée « Autres ») restait `sur`. Maintenant `repris` si la pièce est « divers ».
2. « Aucune unité rien » : la ligne `other` sans prix lu : `quantiteImpliciteDuTicket` (`finale.ts` ~l.43) ne donnait 1 que si prix = montant ; ici `price` null → quantité, prix vides, et pour un kind hors stock aucun rouge (muet). « pièce L » = les deux boutons du segment matériel [pièce][L], collés et aucun allumé (unité vide) : séparés maintenant ; l'unité « Stk » se déduit dès que la quantité vaut 1.
3. « liaison stock ouverte » : aucun déclencheur automatique pour Matériel / Service / hors stock (la liaison ne s'ouvre que par ⇄ `choisirAutre` ou « Suivre au stock »). Ce qu'il a vu : la ligne lue « stock » (ingrédient) d'une pièce de BRASSAGE, famille « Autres », reçoit d'office « nouvel article » + « unité à remplir » (`finale.ts` ~l.111, règle D306/D328c : « un adjuvant que nul mot ne classe reste un ingrédient »), puis il a choisi Matériel (`changerNature` remet `stockAction:'none'`). Cette règle est un acquis testé (`renovation-d306.test.tsx`) : non changée.

## Critères
- Rouge sur HEAD : `voies/dp/tests-rouge.txt` : 9 échecs / 13 (flag, renvoi, quantité 1, séparateurs, Service 1 × total, paiement supposé qui suit, note « autre jour », mois français ×2).
- Vert : `voies/dp/tests.txt` : 118 fichiers, 1494 verts, 1 skipped ; seul échec : `tests/unit/d100AiTaskOutput.test.ts` (package `firebase-functions` absent de ce poste, sans lien).
- `npx tsc --noEmit` hors paquets cités : aucune erreur. `npx vite build --outDir $TEMP/dp-build` : vert.
- Essais : les tests existants `depenseS1` ont fait reculer `totalSeulEnUn` (le matériel sans quantité garde son flux « unité à remplir » + « toucher l'unité y met 1 », acquis s1) ; la règle « Autres sans nouvel article d'office » a été retirée (acquis D306).

## CP-20 (ajout du pilote)
(a) le lien existait (`patchPurchaseDraft`) mais ne jouait que si paiement = achat ; une date supposée suit maintenant toujours, une date choisie (`typed`) rompt le lien et la feuille dit « payé le …, autre jour que l'achat (…) » (avant l'achat : le message « avant la date de la pièce » existant prime). (b) mois en français (fr-CH) : liste de mois + année. (c) test rouge d'abord : fait.

## Doutes et limites
- Captures 390 clair/cave avant/après NON prises (contexte épuisé) : à faire par l'exécutant (ci-dessous). Validation visuelle non effectuée.
- Pas de preuve que sa pièce était bien « divers » : le drapeau ne joue que pour une pièce « divers » ; dans une pièce « brassage », la ligne « Autres » ingrédient était déjà jaune (« classée dans Autres »).
- `PAS_BRASSERIE` s'applique aussi à tout « divers » sans mot de brasserie (parking, frais) : un faux drapeau possible, levé par « Garder »/ordre normal ; à juger par lui.

## DEMANDE EXECUTANT
1. `npx vite --port 3012 --strictPort` en arrière-plan.
2. Ajouter dans `src/ui/depense/apercuDev.ts` un état `medicament` (lecture simulée de `lecturePharmacie` du test : BENU Matran, MEFENACIDE 13,40, `price:null`, catégorie `divers`) puis ouvrir `http://localhost:3012/?dev-local&...` avec cet état ; sinon rejouer le test en navigateur.
3. Captures 390 tactile, clair et cave, ligne ouverte, avant (`git stash` interdit : utiliser `git show HEAD:<fichier>` vers un dossier temporaire) et après : rangée « à contrôler », « Apport ou prélèvement privé › », « 1 pièce × 13,40 », segment « pièce | L », panneau « Date du paiement » (mois français). Ouvrir chaque capture (L12). Arrêter le serveur.
4. Sorties attendues : `npx vitest run tests/integration/depenseMedicament.test.tsx` = 13 verts.

## DÉCISION À PRENDRE
La ligne « Autres » lue « stock » d'une pièce de brassage reçoit d'office « nouvel article » (D306). Pour un médicament, c'est probablement ce qu'il appelle « ça m'avait ouvert la liaison stock ». Options : (1) garder (adjuvants jamais perdus), (2) ne plus poser « nouvel article » d'office pour la famille « Autres » (un toucher « Suivre au stock » le fait). Recommandation : (2), mais elle contredit `renovation-d306.test.tsx` (« Balai de cantonnier ») : au pilote de trancher.

CONNAISSANCE : aucune
LEÇON PROPOSÉE : aucune
