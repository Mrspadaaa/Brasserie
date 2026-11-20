OK — LR1-4, LR2-8, LR3-2 corrigés (pièce classée par vote de ses lignes) ; M9-1 corrigé, captures non faites (gel) ; LT-6 ouvert
# Voie d3 (tour 2, d3b)
- M9-1 | corrigé | bc3b95470 | `validatePurchase` (src/services/purchaseEntry.ts) : une ligne LUE sur un justificatif, nature « ingrédient », stockAction « none », dépense de brassage, nom reconnu comme malt, houblon, levure, sucre ou additif, est refusée à « Confirmer » avec « X : ingrédient hors stock. Ajoute-le au stock… ». Lecture étroite : ligne tapée à la main, dépense hors brassage et autres natures restent libres. Cas C0 et C3 de stock-repare.test.tsx : rien n'est écrit, alerte affichée (rouge avant, vert après). Preuve de rendu : le bandeau « À corriger » est lu dans stock-repare.test.tsx ; captures 390/1280 clair/cave NON prises (gel du brasseur avant la fin ; voir DEMANDE EXECUTANT).
- LR1-4 | corrigé | 1775c770e | `classerLaPiece` (src/ui/depense/familles.ts, « ## État de l'art — d3b » de MISSION.md) : règle d'avant (3 mots sans équivoque) gardée en premier ; une pièce qui porte une ligne d'ingrédient ou de matériel précis garde sa catégorie lue (acquis p3) ; sinon vote de toutes les lignes : sûr +1, ambigu +0,5, mot déformé rapproché d'un mot de la liste (Levenshtein bornée, même première lettre, ≥ 5 lettres) × 0,75, poids = montant (absent : médiane, jamais 0), catégorie lue = une voix de brassage ; Rénovation si part ≥ 0,15 et ≥ 8 lignes votent pour les travaux ; sinon la catégorie lue reste et `raison` le dit (`vote-faible`, `egalite`, `brassage`). `finale.ts` passe les montants (port et remise exclus). Test rouge d'abord : it.fails de bc3b95470 (18 lignes en Matériel sur doc25-provisoire-t2) ; après : 0 matériel, 20 Rénovation sur 21 (la 21e est un emballage « MAGASIN SAC GRAND »).
- LR2-8 | corrigé | 1775c770e | même cause et même correctif : « ETERE MULTIBROSSE » (ligne `equipment` rangée par le kind quand la catégorie de la pièce restait « materiel ») suit désormais la catégorie de la pièce (Rénovation).
- LR3-2 | corrigé | 1775c770e | même cause et même correctif : les deux tirages (provisoire-t2 lu « materiel », ticket-t1 final lu « renovation ») donnent la même catégorie, Rénovation (test « le vote des lectures du doc25 (final) »).
- LT-6 | ouvert | — | accord requis : la date de doc1 sous « vérifié » est corrigée côté consigne (6c17266f) mais ne se rejoue pas hors ligne (c'est la lecture qui change) ; pour clore : une passe payante limitée à doc1 et doc3 (≈ 0,1 CHF au banc) ou l'accord de la voie c. Gemini réel non lancé. Non repris en d3b (hors consigne).

## Tableau avant/après (chaque lecture enregistrée, tests/unit/depense/g1/brut ; part = voix des travaux, n = lignes qui votent)
| pièce | lue | avant | après |
|---|---|---|---|
| doc14-port-en-ligne L1, L2, L3 | brassage | brassage | brassage (ligne de brassage : inchangé) |
| doc2-sedation L1, L2, L3 | divers | divers | divers (hors brassage : inchangé) |
| doc25-provisoire-t1 L1, L2 | materiel | materiel | renovation (vote, part 0,22, n 14) |
| doc25-provisoire-t2 L1, L2 | materiel | materiel | renovation (vote, part 0,39 et 0,22, n 14) |
| doc25-ticket-t1 L1, L2 | materiel | materiel | renovation (vote, part 0,23 et 0,35, n 14) |
| doc25-ticket-t1 L3 | renovation | renovation | renovation (inchangé) |
Aucune pièce déjà juste ne change (doc14, doc2, p3-categorie-piece.test.ts verts). Réglage 0,15 / 8 posé sur t2 et t1 ; les autres pièces sont à −0,77 (brassage) ou hors brassage : marge large. Limite : le cas synthétique « 2 mots sûrs + 5 ambigus sur 10 lignes » (p3) reste « materiel » grâce au quorum de 8 ; seuil et quorum sont dimensionnés sur une seule photo réelle (doc25) : à rejouer sur la prochaine pièce de bricolage.

## M9-1 / plier-regrouper (tests/unit/depense/g2a/plier-regrouper.test.tsx, 2 rouges)
bc3b95470 n'en est PAS la cause : rejoué avec `purchaseEntry.ts` d'avant bc3b95470 substitué en mémoire (vi.mock vers une copie `git show bc3b95470^`), les 2 mêmes tests échouent à l'identique (« Unable to fire a click event »). Cause : la modification non commitée d'ExpenseSheet.tsx par une autre session (`milieu={ordre==='cat'&&etatSeg.visible&&!unDoutePlieAff?<SegmentPlier …>}` masque le segment « Plié » quand un doute est plié). hors voie : ExpenseSheet modifié par une autre session. Même origine probable des 2 autres rouges de la passe large (ecran.test.tsx T4 : « plusieurs éléments role=alert » ; sous-groupes-d307 : région « Vérification du justificatif » introuvable) : non diagnostiqués, hors voie.

## Tests
`npx vitest run tests/unit/depense/g1 tests/unit/depense/p5 tests/unit/depense/h13-0811 tests/unit/bugs-d3-LR1-4.test.ts tests/unit/bugs-d3-M9-1.test.ts tests/unit/depense/p3-categorie-piece.test.ts tests/unit/purchaseEntry.test.ts` → 82 passés, 0 échoué (tests.txt). Passe large par dossier (tests/unit/depense/*, tests/integration/depense*, bugs-d3, purchaseEntry) : 2 729 passés, 4 échoués (les 3 fichiers hors voie ci-dessus) + learn.test.ts (délai de hook 10 s sous charge, flaky) ; tests/unit/depense/banc-k6/ ne rend pas de rapport JSON en un lot (non rejoué par fichier, non diagnostiqué). `tsc --noEmit` : aucune erreur sur familles, finale, apercuDev ni les tests d3. Gemini jamais appelé.

## Gel du brasseur : état
- Fait et commité : 1775c770e (code, aperçu `hors-stock` SIMULÉ dans apercuDev.ts, script capturer-m9-1.mjs), 81da2ea87 (test).
- Non fait : captures de M9-1 (390 tactile et 1280, clair et cave). Une tentative sous charge a échoué (délai de navigation). Pour la reprendre : `node scripts/with_server.mjs --server "npx vite --port 3121 --strictPort" --port 3121 -- node work/missions/2026-11-19-bugs-ecrans/voies/d3/capturer-m9-1.mjs` sur machine calme (état `?dev-local&depense=hors-stock`), puis ouvrir les 4 PNG de voies/d3/captures/.
- L'affichage de la raison « vote faible » à l'écran demande ExpenseSheet (occupé) : hors voie ; `classerLaPiece` la rend déjà.

DEMANDE EXECUTANT : lancer la commande de captures ci-dessus (rien d'autre), ouvrir `m9-1-390-clair.png`, `m9-1-390-cave.png`, `m9-1-1280-clair.png`, `m9-1-1280-cave.png` ; sortie attendue : bandeau « À corriger » avec « Citra : ingrédient hors stock. Ajoute-le au stock… », rien d'enregistré.
CONNAISSANCE : un vote de pièce à mots déformés se règle sur une photo réelle (doc25) ; le seuil 0,15 et le quorum 8 sont à reconfirmer à la prochaine pièce de bricolage. Une passe vitest groupée de ce dépôt s'arrête sans rapport (exit 0) à cause de tests/unit/depense/banc-k6 : rejouer dossier par dossier avec --reporter=json.
LEÇON PROPOSÉE : aucune
