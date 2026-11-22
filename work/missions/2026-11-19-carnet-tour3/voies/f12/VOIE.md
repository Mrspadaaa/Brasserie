# Voie f12 — 2 constats du pilote sur la Dépense (capture f10-doc2-lectures-1280-cave), mission 2026-11-19-carnet-tour3
Lire `../../COMMUN-CODE.md` une fois. Ouvrir `../f10/captures/f10-doc2-lectures-1280-cave.png` (banc `../v3/`, réponse enregistrée reel-doc2).
ÉCONOMIE : `grep -n` puis `sed -n` ; jamais ExpenseSheet.tsx en entier.
P-1 : la ligne « Sedation IM, pose catheter, … narcose … » est rangée sous « Services » (règle vétérinaire de 7b199eb85), mais son choix de nature
      montre « Matériel » (Ingrédient / Service / Matériel) : la nature enregistrée doit suivre la règle (Service), sinon la ligne part en matériel.
      DONNÉE : vérifier par test ce qui est enregistré (`kind`) à la confirmation.
P-2 : barrés sans information : « Collerette Velfast ROUGE 25cm · ? » barré sous le même nom, « 3 cp × ? · ? » sous « Rimadyl 50mg »,
      « Combiclav 250 /cp · 8 cp × ? · ? » : un barré dont la seule différence est une valeur inconnue (« ? ») ne s'affiche pas (même règle que
      7b199eb85 « ? × ? » et 84551fc8e LR1-5, étendue au nom identique suivi de « ? »).
Possède : src/ui/finance/ExpenseSheet.tsx, src/ui/finance/controlesCroises.ts, src/ui/depense/*, leurs tests.

## Preuves (obligatoires)
- RESULTAT.md tenu au fil : `id | verdict | commit | test | rouge→vert | capture`.
- Tests : `npx vitest run <fichiers> --reporter=dot > voies/f12/tests-rouge.txt` puis `> voies/f12/tests-vert.txt` ; à la fin
  `npx vitest run tests/unit/depense tests/integration/expense* --reporter=dot > voies/f12/tests-final.txt` VERT ; tsc.
- Captures 390 et 1280, clair et sombre, de reel-doc2 (banc `../v3/`, `PORT_BANC=5200`, script `../f10/g-f10.mjs` à copier), OUVERTES, dans `voies/f12/captures/` ; serveur arrêté.
- Commit par chemins, `git show --stat HEAD` vérifié. Plafond : à 150 k, `REPRISE : <fichier>`.
