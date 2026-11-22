# Voie r — lectures IA sur réponses enregistrées, et reste du lot d, mission 2026-11-19-carnet-tour3
Lire `../../COMMUN-CODE.md` (règles). Lignes : `LIGNES.md` (29 `ia` + 10 du lot d à finir, voir `../d/REPRISE.md`).
Pour chaque `ia` : chercher une réponse Gemini enregistrée qui couvre le constat (dépôt Brasserie : `.claude/skills/banc-lecture/SKILL.md`
dit où sont les réponses ; fixtures `tests/fixtures/**`, tests `carnetsEnLigne*.test.tsx`, banc de lecture).
Rejouer l'app sur cette réponse par vitest :
- comportement juste → `corrige` (test et commit qui l'a corrigé) ;
- faux → corriger (test rouge puis vert), SEULEMENT hors des possessions de f1 (ExpenseSheet.tsx, controlesCroises.ts,
  src/ui/depense/*) et de f2 (src/ui/carnets/*, src/domain/carnets/*, UpgradeWorkspace.tsx) ; sinon décrire le correctif
  attendu (fichier, ligne, test) dans RESULTAT.md pour le pilote ;
- défaut de ce que Gemini lit, sans réponse enregistrée → `ouvert — non vérifiable sans Gemini`.
Pour les 10 du lot d : verdict au code au tag `en-ligne/2026-11-19-tour2` (`git show <tag>:<f>`), `corrige` avec commit, `present`
(fichier:ligne, sans corriger : f2 possède ces fichiers), ou `en-ligne` avec parcours.
Possède : fichiers de lecture IA (src/services/**, src/domain/finance/** hors finances/operations), tests/fixtures nouveaux.

## Preuves (obligatoires)
- RESULTAT.md tenu au fil : une ligne ajoutée dès qu'un id est fini (une limite de tours ne doit rien perdre).
- Tests : `npx vitest run <fichiers> --reporter=dot > voies/<voie>/tests-rouge.txt` (avant correctif) puis `> voies/<voie>/tests-vert.txt` (après) ; la ligne « Tests » de RESULTAT.md cite ces fichiers et leurs totaux.
