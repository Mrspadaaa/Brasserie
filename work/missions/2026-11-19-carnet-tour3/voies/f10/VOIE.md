# Voie f10 — derniers problèmes de la Dépense (après la critique v5b), mission 2026-11-19-carnet-tour3
Lire `../../COMMUN-CODE.md` une fois, puis `../v5b/RESULTAT.md` et `../v5b/REPRISE.md` (problèmes provisoires 1 à 4, captures `../v5b/captures/`).
ÉCONOMIE : `grep -n` puis `sed -n` ; jamais ExpenseSheet.tsx en entier.
1. v3-5 suite : pendant la lecture, à 390, le pied est coupé (« 3e lecture en c… ») et « Lecture en cours… » n'apparaît jamais (51e5393b8) : le pied dit
   en entier ce qu'on attend, à 390.
2. doc2 : faux « 1 valeur en désaccord » en rouge alors que les trois lectures du fournisseur désignent le même cabinet (variantes d'un même nom,
   règle de ressemblance de 7b199eb85 / 84551fc8e) : une variante n'est pas un désaccord.
3. LR1-7 : le prix déduit n'est signalé que par la couleur : ajouter le mot (title et texte accessible, « déduit : 50,00 ÷ 2 »).
4. À trancher par un test : saisie à la main d'une dépense de 3,00 → 6 rangées « Ligne sans libellé » ? (geste exact dans `../v5b/REPRISE.md`) ; si l'app
   le fait, c'est un défaut à corriger ; sinon `ecarte — geste du banc`.
Possède : src/ui/finance/ExpenseSheet.tsx, src/ui/finance/controlesCroises.ts, src/ui/depense/*, leurs tests.

## Preuves (obligatoires)
- RESULTAT.md tenu au fil : `n° | verdict | commit | test | rouge→vert | capture`.
- Tests : `npx vitest run <fichiers> --reporter=dot > voies/f10/tests-rouge.txt` puis `> voies/f10/tests-vert.txt` ; à la fin
  `npx vitest run tests/unit/depense tests/integration/expense* --reporter=dot > voies/f10/tests-final.txt` VERT ; tsc.
- Captures 390 et 1280, clair et sombre, des n° 1 à 3 avec le banc `../v3/` (`PORT_BANC=5198`), OUVERTES avant de conclure, dans `voies/f10/captures/` ; serveur arrêté.
- Commit par chemins, `git show --stat HEAD` vérifié. Plafond : à 150 k, `REPRISE : <fichier>`.
