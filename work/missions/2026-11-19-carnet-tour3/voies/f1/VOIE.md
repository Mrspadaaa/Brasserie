# Voie f1 — Dépense (lecture des justificatifs), mission 2026-11-19-carnet-tour3
Lire `../../COMMUN-CODE.md` (règles) puis corriger chaque ligne de `LIGNES.md` (TL-46, LR1-6, LR1-7, LR1-10, LR1-12).
Possède : src/ui/finance/ExpenseSheet.tsx, src/ui/finance/controlesCroises.ts, src/ui/depense/*, leurs tests (tests/**).
Pistes du tri : LR1-6 neutraliser le bloc de contrôles (pas de rouge, « en cours ») tant que la lecture est provisoire ;
LR1-7 déduire le prix unitaire = montant / quantité quand il manque (affiché comme déduit) ; LR1-10 indexer aussi les références
des lectures écartées ; LR1-12 virgule décimale suisse dans le message repris (« 2,6 % »). TL-46 : lire le tri ; si aucune
décision écrite ne tranche, `ouvert` avec la question exacte (pas de devinette sur le produit).
Montants et TVA : aucun arrondi changé sans test qui le montre.

## Preuves (obligatoires)
- RESULTAT.md tenu au fil : une ligne ajoutée dès qu'un id est fini (une limite de tours ne doit rien perdre).
- Tests : `npx vitest run <fichiers> --reporter=dot > voies/<voie>/tests-rouge.txt` (avant correctif) puis `> voies/<voie>/tests-vert.txt` (après) ; la ligne « Tests » de RESULTAT.md cite ces fichiers et leurs totaux.
- Captures 390 et 1280 de chaque écran touché, ouvertes (Read de l'image) avant de conclure : skill `webapp-testing` (dossier Brasserie `.claude/skills/webapp-testing/SKILL.md`), app de port-carnet en `?dev-local`, 390 tactile et 1280, thème clair et sombre ; captures dans `voies/<voie>/captures/` ; arrêter le serveur ensuite.
