OK — quatre mini maquettes v6a + filtre du … au (puces, phrase, loupe, règle), repos et après

## Variantes (id · idée · images ouvertes · défauts vus)
- s3a · puces « 7 j · 30 j · ce mois · trimestre · du … au », chacune avec un trait à la longueur de sa durée ; « du … au » ouvre deux dates natives ; la pilule devient « ‹ 1er – 15 nov. › » · oui (repos, après) · +36 px au repos ; 7 j et 30 j débordent sur octobre (pas de données : inconnu)
- s3b · phrase « du 1er nov. au 30 nov. » aux dates touchables ; calendrier à plage (react-day-picker, mode range) avec points d'opérations ; « ↺ novembre » · oui (repos, ouvert, après) · « novembre » dit deux fois au repos ; le calendrier couvre les piles pendant le choix
- s3c · la loupe lit « 3-17 nov. » comme une période (suggestion avec frise), posée en pastille « 3 → 17 nov. × » ; puce « du … au » à côté du mois · oui (repos, ouvert, après) · rangée du mois pleine à 354 px (1re version : retour à la ligne, corrigé) ; analyse des dates tapées = bibliothèque à choisir
- s3d (libre) · la règle du mois sous les piles : 30 jours, flux du 9 et loyer hachuré du 25 visibles, deux poignées qui pincent la plage ; bulle « 1er → 15 nov. », jours hors plage hachurés · oui (repos, après) · +60 px au repos ; étiquettes sous les poignées (1re version masquée, corrigé)

Après le geste (toutes) : loyer (25 nov.) sorti ; Fixes 68,00 ; payé 325,40 · à payer 0,00 · dépensé 296,80 ; retard 2025 (60,00) gardé à part comme v6a ; « ✓ Payé » 24 px inchangé.

## Fichiers écrits
- `work/missions/2026-11-14-finances/voies/s3/{s3a,s3b,s3c,s3d}/` : etat.html, `<id>-repos.png`, `<id>-apres.png` (+ `s3b-ouvert.png`, `s3c-ouvert.png`), NOTE.md
- `work/missions/2026-11-14-finances/voies/s3/fonts/` (copie locale des polices de s1, aucun appel réseau)
- `work/missions/2026-11-14-finances/voies/s3/_outils/fabriquer.mjs` (base v6a découpée par indices, préfixe par split/join, captures 390 × 844 à l'échelle 2)
- `work/missions/2026-11-14-finances/voies/s3/tests.txt`

## Critères
- G1 : `controle-serie.mjs … s3a,s3b,s3c,s3d` → SERIE OK (aussi dans tests.txt)
- G2 : s3a → PAGE OK (2 images chargées, 390 px, sans erreur)
- G3 : s3b → PAGE OK (3 images chargées, 390 px, sans erreur)
- G4 : s3c → PAGE OK (3 images chargées, 390 px, sans erreur)
- G5 : s3d → PAGE OK (2 images chargées, 390 px, sans erreur)
- Tests : maquettes statiques, aucun Vitest ; la ligne « Tests » = tests.txt (SERIE OK).

## Captures (toutes ouvertes)
`voies/s3/s3a/s3a-repos.png`, `s3a-apres.png` ; `s3b/s3b-repos.png`, `s3b-ouvert.png`, `s3b-apres.png` ; `s3c/s3c-repos.png`, `s3c-ouvert.png`, `s3c-apres.png` ; `s3d/s3d-repos.png`, `s3d-apres.png`.

## Prédiction
s3d le frappe (« je vois quand l'argent bouge et je pince ») ; s3a est celle qu'il pose le plus vite au pouce ; s3c lui paraît la plus « gadget » au téléphone.

DÉCISION À PRENDRE : aucune hors page de choix (le brasseur choisit entre s3a à s3d).
CONNAISSANCE : novembre 2026 commence un dimanche ; dans les données v6a, « dépensé » exclut le matériel à part (696,80 = 468 + 186,80 + 42), d'où 296,80 sur 1er–15 nov.
LEÇON PROPOSÉE : aucune
