# Voie f6b — Dépense, constats de la vision locale v3, mission 2026-11-19-carnet-tour3
Lire `../../COMMUN-CODE.md`, `../f1/RESULTAT.md` (ce qui a déjà été fait : eccd75e42, 7b199eb85, d1848500b) et `../v3/RESULTAT.md`
(verdicts, « Défauts neufs » numérotés v3-1 à v3-10 ; captures dans `../v3/captures/` : ouvrir chaque capture citée avant de corriger).
Banc prêt : `../v3/outil.mjs`, `../v3/vite.v3.config.mjs`, `../v3/finals.ts` (réponses Gemini enregistrées, jamais d'appel réel).
Liste figée, chaque constat prouvé seul. Montants et TVA : aucun arrondi changé sans test.
Une autre voie (f6a/f6b) corrige en même temps : respecter « Possède » ; un fichier de l'autre → « DEMANDE » dans RESULTAT.md.
Ta liste (écran et gestes) : LR1-9 (« Voir le désaccord » n'ouvre ni les deux lectures ni le champ en désaccord ; la carte fixe du pied couvre
la ligne ouverte à 390), LR1-6 réserve (total souligné de tirets rouges pendant la lecture provisoire), v3-5 (« Confirmer » gris à roue sans
dire ce qu'on attend), LR1-7 réserve (prix déduit écrit dans le champ sans marque « déduit »), v3-1 (doc14 1280 : colonne trop étroite, barré
sur 5 lignes, noms coupés), v3-2 (montant d'en-tête de groupe qui déborde), v3-6 (retrait volontaire d'une ligne lu « 2,40 CHF manquants »
avec « Ajouter la ligne manquante »), v3-7 (« Retirer la ligne 3 » hors écran à 390 même en défilant : geste impossible au doigt — PRIORITÉ),
v3-8 (champs d'une ligne repliée touchables sous le résumé, à vérifier puis corriger).
Possède : src/ui/finance/ExpenseSheet.tsx, src/ui/depense/* SAUF finale.ts, etat.ts, familles.ts ; CSS de la Dépense ; leurs tests.

## Preuves (obligatoires)
- RESULTAT.md tenu au fil : `id | verdict | commit | test | rouge→vert | état à capturer`.
- Tests : `npx vitest run <fichiers> --reporter=dot > voies/f6b/tests-rouge.txt` puis `> voies/f6b/tests-vert.txt` ; à la fin
  `npx vitest run tests/unit/depense tests/integration/expense* --reporter=dot > voies/f6b/tests-final.txt` (échec d'un fichier de l'autre voie : le dire) ; tsc.
- Captures 390 et 1280 : prises et ouvertes par la voie de vision suivante (v5) ; écrire pour chaque id l'état exact à capturer sur le banc v3.
- Commit par chemins à chaque id vert (tests non suivis compris : `git status --short tests`), `git show --stat HEAD` vérifié.
- Plafond : à 150 k, commit de ce qui est vert puis `REPRISE : <fichier>`.
