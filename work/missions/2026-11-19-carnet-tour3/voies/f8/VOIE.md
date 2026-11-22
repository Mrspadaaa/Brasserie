# Voie f8 — derniers défauts de la Dépense, mission 2026-11-19-carnet-tour3
Lire `../../COMMUN-CODE.md` une fois. ÉCONOMIE : `grep -n` puis `sed -n` ; jamais ExpenseSheet.tsx en entier.
1. v3-6 (`../v3/RESULTAT.md` « Défauts neufs » 6, captures `../v3/captures/`) : après « Retirer la ligne 3 » voulu par le brasseur, l'app dit
   « 2,40 CHF manquants » et « Ajouter la ligne manquante » : un retrait volontaire n'est pas un manque (le dire « 1 ligne retirée · 2,40 »,
   jamais un appel à rajouter). Fichiers : src/ui/finance/controlesCroises.ts, ExpenseSheet.tsx (f6a, f6b finies).
2. `tests/integration/expenseSheet.test.tsx` « lit dès le choix du fichier et attend une confirmation explicite des valeurs corrigées »
   ÉCHOUE déjà au tag en ligne en-ligne/2026-11-19-tour2 (prouvé par le pilote) : `expected {…} to match { amount: 555, … }`. Trouver si c'est
   un défaut réel du geste principal (valeur corrigée par le brasseur non retenue à la confirmation = DONNÉE FAUSSE, priorité 1) ou un test
   périmé (le dire avec le commit qui a changé le comportement voulu). Défaut réel → corriger le code.
3. `tests/unit/depense/lecture-d/serveur.test.ts` (3 rouges, ENOENT functions/src/hopAdviceContentReference.ts lu par `engineDigestOf`) :
   corriger le test ou son aide (lecture de fichiers seulement) ; ne rien changer sous funct/ ni déployer de fonction.
Possède : src/ui/finance/ExpenseSheet.tsx, src/ui/finance/controlesCroises.ts, src/ui/depense/*, tests/integration/expenseSheet.test.tsx, tests/unit/depense/**.

## Preuves (obligatoires)
- RESULTAT.md tenu au fil : `id | verdict | commit | test | rouge→vert | état à capturer`.
- Tests : `npx vitest run <fichiers> --reporter=dot > voies/f8/tests-rouge.txt` puis `> voies/f8/tests-vert.txt` ; à la fin
  `npx vitest run tests/unit/depense tests/integration/expense* --reporter=dot > voies/f8/tests-final.txt` VERT en entier ; tsc.
- Captures 390 et 1280 : prises et ouvertes par la voie v5b (vision) ; écrire l'état exact à capturer sur le banc `../v3/`.
- Commit par chemins, `git show --stat HEAD` vérifié. Plafond : à 150 k, `REPRISE : <fichier>`.
