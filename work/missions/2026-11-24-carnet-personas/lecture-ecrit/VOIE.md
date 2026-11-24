# Voie lecture-ecrit — regarder un carnet n'écrit jamais rien (D1, D4 des personas)

- Agent : auteur ; Modèle : sonnet ; Niveau : jugement ; Plafond : 100 tours. Copie : C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie.
- Lis DOSSIER.md À LA PLACE des sources brutes.

## Économie
- Mécanique : aucune.
- Gestes : grep de TOUTES les écritures (repo, save, update, set, put, persist, Firestore, Dexie) atteintes depuis le montage ou l'ouverture d'une vue du Carnet (liste, carnet ouvert, Articles, fiche, Comparer, Choisir, Quand) ; un script par lot ; tests dans un fichier.

## À faire
1. En tête de RESULTAT.md : chaque écriture déclenchée sans geste (fichier:ligne, ce qu'elle écrit, depuis quand : git log -S), et si elle a déjà modifié ses données (quels champs).
2. Test AVANT le correctif, lancé rouge (tests-rouge.log) : monter chaque vue du Carnet avec un dépôt espion ; AUCUNE écriture tant qu'aucun geste d'écriture n'est fait ; puis correctif (l'écriture ne part qu'après un geste explicite ; un calcul d'affichage — ordre, domaine déduit, prix choisi, migration de forme — reste en mémoire), vert.
3. Registre : ligne neuve LE-1 (B) à work/missions/BUGS.md (format des lignes C58 ; source : personas du 24.11) → « corrigé en local <hash> » ; node scripts/agents/controle-bugs.mjs → BUGS OK.

## Critères
- tsc : aucune erreur neuve (2 connues) ; test espion vert ; tests/unit/carnets* et c4*, c5* verts ; npx vitest run tests/unit/proprietes vert ; BUGS OK ; commit par chemins ; fin « PRÊT À METTRE EN LIGNE <hash> ».

OWNS : src/ui/carnets/** ; src/domain/carnets/** ; le dépôt des carnets (src/services/ ou src/data/, fichier à nommer) pour la seule garde d'écriture ; tests/unit/ que tu crées ; ligne LE-1 de BUGS.md ; ton dossier de voie. Ne touche pas src/domain/stock, src/ui/stock ; aucune donnée réelle ; ne déploie rien.

## Tenue
- RESULTAT.md tenu au fil (une limite de tours ne doit rien perdre).
- Tests : npx vitest run <fichiers> --reporter=dot > tests.log 2>&1; tail -5 tests.log (dans ton dossier).
