# Voie relecture-frise — relecture indépendante du nouveau cœur de la frise

- Agent : relecteur ; Modèle : sonnet ; Niveau : jugement ; Plafond : 60 tours.
- Lis DOSSIER.md (même dossier) À LA PLACE des sources brutes ; puis le code qu'il cite.

## Économie
- Mécanique : aucune — le seul lancement mécanique (le test par modèle) est une commande ; la relecture demande du jugement.
- Gestes : `git diff 06c430228 HEAD -- <fichiers>` ciblé, grep ; le test par modèle lancé une fois, sortie dans un fichier.

## À faire
1. Pour CHAQUE ligne de INVENTAIRE.md : présente dans le nouveau cœur ? même comportement ? (fichier:ligne). Table : fonction | ancien | nouveau | verdict (gardée, changée, PERDUE).
2. T29-1 à T29-12 : régression du nouveau cœur ou défaut ancien ? (rejouer la logique sur 06c430228 par lecture ou test unitaire).
3. Dans lot-cal : `ETAT_RUNS=200 npx playwright test e2e/calendrier/etat-coherent.spec.ts` (serveur selon la config du dépôt) → sortie dans voies/relecture-frise/modele.log ; contre-exemple éventuel recopié.
4. Verdict : risques restants, par gravité, et ce qui manque pour « robuste, fonctionnel, sans bug ».

## Critères
- Table complète (toutes les lignes de l'inventaire) ; modele.log présent ; aucune écriture dans le code (lecture seule).

Possède : work/missions/2026-11-23-reprise-soir/voies/relecture-frise/ seulement.

## Tenue
- RESULTAT.md tenu au fil (une limite de tours ne doit rien perdre).
- Tests : `ETAT_RUNS=200 npx playwright test e2e/calendrier/etat-coherent.spec.ts --reporter=dot > modele.log 2>&1` (dans lot-cal, sortie copiée ici).
