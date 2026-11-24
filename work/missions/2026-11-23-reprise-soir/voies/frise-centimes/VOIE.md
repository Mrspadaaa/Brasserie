# Voie frise-centimes — tout montant du Calendrier écrit ses centimes dès qu'il y en a (C46-5 rouvert)

- Agent : auteur ; Modèle : sonnet ; Niveau : jugement ; Plafond : 60 tours. Copie : C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie.
- Lis ../../COMMUN.md puis DOSSIER.md À LA PLACE des sources brutes.

## Économie
- Mécanique : aucune.
- Gestes : grep de TOUS les formateurs de montants du Calendrier et d'À venir (règle, pas l'exemple) ; un script par lot ; tests dans un fichier.

## À faire
1. En tête de RESULTAT.md : la liste de chaque endroit qui écrit un montant dans le Calendrier (bulles, frise, rangées, en-tête, Achats, À venir) et son formateur.
2. Test rouge LANCÉ sur le code d'avant pour la règle (79,95 → « 79,95 » ; 80 → « 80 ») sur chaque formateur trouvé, puis correction, vert.
3. Registre : C46-5 → « corrigé en local <hash> » ; node scripts/agents/controle-bugs.mjs → BUGS OK.

## Critères
- tsc : aucune erreur neuve (2 connues) ; tests touchés et tests calendrier verts ; npx vitest run tests/unit/proprietes vert ; BUGS OK ; commit par chemins ; fin « PRÊT À METTRE EN LIGNE <hash> ».

OWNS : src/ui/calendrier/entete/** (affichage des montants seulement) ; src/ui/calendrier/ (rangées, bulles : formateurs de montants seulement) ; src/ui/finance/UpgradeWorkspace.tsx ; ligne C46-5 de BUGS.md ; tests/unit/ que tu crées ; ton dossier de voie. Ne touche pas src/ui/calendrier/cadre, src/ui/carnets, src/domain/stock, src/ui/stock.

## Tenue
- RESULTAT.md tenu au fil (une limite de tours ne doit rien perdre).
- Tests : npx vitest run <fichiers> --reporter=dot > voies/frise-centimes/tests.log 2>&1; tail -5 voies/frise-centimes/tests.log
- Pas de captures locales : preuve en ligne par le pilote et le critique.
