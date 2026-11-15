OK — rangées d'Opérations en v6a (geste sous le montant, 44/47/28 px), contrôle V6A vert ; TSC bloqué par firebase-admin absent (hors périmètre)

## Fichiers
- Modifiés : `src/ui/finance/operations.css`, `src/ui/finance/TransactionRow.tsx`. `journal.css` : pas touché (aucune règle d'Opérations n'y vit).
- Voie : `controle-v6a.mjs`, `temoin-head.txt`, `tests.txt`, `capturer.mjs`, `appliquer.mjs` (remplacements faits, à ne pas rejouer), `cap/`.

## Ce qui change (et rien d'autre : NOTE v6a)
Grille de la ligne : 3 colonnes (liseré, nom+état, montant) sur 2 rangées 18 px / min 18 px ; le bouton principal couvre les deux rangées, le montant est en haut à droite, le geste dessous (`margin:1px 0 -4px`). Marges de ligne 2/5 px ; nom 16 px d'interligne ; étage d'état 18 px, pastilles 16 px ; icônes de pièce 16 px (trait 2,4, comme la maquette) ; « ✓ Payé » 24 px (`.ops-btn`) ; en-tête de catégorie 5/1 px avec pastille 22 px. Gardés d'avant : état et pièce sans retour à la ligne (ellipse sur la pastille d'état), `ops-erreur` en 3e rangée. Aucune règle de calcul, d'écriture, de TVA ni de montant touchée ; le geste, ses libellés et `payesParLeGeste` sont inchangés.

## Critères
- G1 `controle-v6a.mjs 3000` : V6A OK. Mesuré à 390 clair sur deux jeux de démonstration (`finance-demo=reel` et `finance-demo`, la brasserie complète pour les « ✓ Payé ») : 12 opérations toutes à 47,0 px avec geste, 44,0 px geste masqué (aucune fixture n'a de ligne sans geste, le contrôle masque le geste), 11 en-têtes à 28,0 px, « ✓ Payé » 24,0 px, geste sous le montant partout.
- G2 `lire.mjs temoin-head.txt "V6A ECHEC" TEMOIN` : TEMOIN OK (avant : lignes à 36 px, gestes « À CÔTÉ », en-têtes 24 px).
- G3 `tsc.mjs` : TSC ECHEC, mais seulement 2 erreurs, `functions/src/brewer*Store.ts` : « Cannot find module 'firebase-admin/firestore' » (`functions/node_modules` absent de ce worktree). Zéro erreur dans `src/` ou `tests/`. À rejouer dans un arbre où `functions` est installé.
- G4 `vitest-lu.mjs tests.txt` : VITEST OK (10 fichiers, 97 tests : `src/ui/finance`, `src/domain/finance` et les tests d'intégration voisins : fx1, f2ReelOperations, f3ReelCoutImpotClient, financeJournalUx/Doublons/DoubleSomme, financeWorkspace, operationsCalculs, operationsPeriode, mobileDailyViews). Piège : sans `--no-color`, la sortie contient des codes ANSI et `vitest-lu.mjs` répond ECHEC ; `tests.txt` est écrit avec `--no-color`.
- Plus large (`finance operations fx f2 f3`) : 396 tests verts, 3 fichiers en échec au chargement (`financeDocumentHistory`, `financeDocumentMigration`, `financeAssistantContext`), même cause `firebase-admin` absent, sans rapport avec la voie.

## Captures, toutes ouvertes (cap/)
`ops-390-clair.png`, `ops-390-cave.png`, `ops-1280-clair.png`, `ops-1280-cave.png` (jeu complet), `ops-apres-paye-390-clair.png` (après « ✓ Payé » sur le loyer : ligne verte, « Annuler »), `planche-390.png` (app clair / maquette v6a / app cave côte à côte). Lecture : mêmes étages, geste sous le montant, hauteurs de la maquette ; en 1280 la liste à droite reste lisible, clair et cave. Aucune erreur de console sur les 4 rendus.

## Doutes et limites
- La maquette montre des dates figées (9 nov., « dans 16 j ») et une pièce « facture » sur certaines lignes ; le banc, lui, a des données d'aujourd'hui, toutes « sans pièce » : l'écart est la donnée, pas la mise en page.
- La bande de période, les piles et la barre du bas (autres voies) ne sont pas dans la comparaison ; la planche les montre tels quels.
- Écart de contenu connu avec v6a seule : « Malt et houblons · Pale Ale · Comptoir du bra… » est coupé par l'ellipse (nom long, voir « Ce qui casse » de v6b) ; la maquette v6a le laisse tenir en entier à 390.
- `git status` : mes seuls changements sont `TransactionRow.tsx` et `operations.css` ; `synthese*` appartient à y1.

CONNAISSANCE : une ligne sans geste n'existe dans aucune fixture ; le contrôle de sa hauteur masque le geste (même grille, rangée 2 à 18 px minimum).
LEÇON PROPOSÉE : aucune
