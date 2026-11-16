OK — 3 tests anciens repassent : leurs règles vivent dans le Dossier de la fiche ; 22 fichiers, 191 tests verts

Fichiers écrits : `tests/integration/batchAbvOgConfirmee.test.tsx`, `tests/integration/batchDefautsB.test.tsx`, `tests/integration/batchNombresFr.test.tsx` (une seule modification : `initialSection="measurements"` devient `"overview"`). Aucun fichier `src/` touché.

- batchAbvOgConfirmee : test adapté. Sous gfc, la section « measurements » d'un brassin en fermentation montre la fiche gfc, et la rubrique OG/FG est passée dans le Dossier (« Corriger les mesures »). Règles gardées telles quelles : OG 1,140 gardée → alcool calculé 17,7 % vol et écrit dans le brassin ; au-delà de 18 % → « non calculé » avec sa raison.
- batchDefautsB : test adapté, même cause. « Jour réellement brassé » refuse toujours le futur (message « dans le futur », rien écrit) et écrit une date passée.
- batchNombresFr : test adapté, même cause. Cibles à trois décimales avec virgule, alcool « 6,6/6,7 % vol », aide « 1,048 et non 1048 » : toutes tenues par le Dossier.

Aucune régression de code : la règle métier existe encore, seul son emplacement a changé. Aucune attente affaiblie ni supprimée.

Critères
- G1 : `Test Files 22 passed, Tests 191 passed`, sortie dans `tests.txt`, code de sortie 0.
- G2 : `TSC OK`.

Essais : 1 par critère. Le `tests/unit/bDiversContraste.test.ts` cité en consigne ne figure pas dans echecs.txt et n'a pas été touché.

Doutes : le Dossier garde les mesures dans un `<details>` replié ; les tests le lisent dans le DOM sans l'ouvrir (jsdom). Pas de capture : voie de tests seule.

CONNAISSANCE : aucune
LEÇON PROPOSÉE : aucune
