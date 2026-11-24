# Voie fix28-app — constats du test en ligne du tour 28, côté app (T28-1, 2, 3, 4, 6, 10, 11, 15, 17)

- Agent : auteur ; Modèle : sonnet ; Niveau : jugement ; Plafond : 100 tours. Copie : C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie.
- Lis ../../COMMUN.md, puis DOSSIER.md (même dossier) À LA PLACE des sources brutes ; ouvre une source seulement pour un point qu'il ne couvre pas.

## Économie
- Mécanique : aucune — chaque correctif se prouve en ligne par le pilote après mise en ligne ; pas de banc ni de captures locales (brasseur, 23.11 : « les seul vrai tests sont ceux sur la vrai app »).
- Gestes : lectures groupées (grep ciblé, un script par lot), sorties filtrées.

## À faire, par gravité
1. T28-1 (B, données) : après rechargement pendant une lecture, l'article doit aller dans le carnet où le lien a été collé (garder carnetId avec le jeton), jamais ailleurs.
2. T28-2 (B) : la barre repliée touchée depuis un autre carnet ouvre le carnet du lien, avec son nom.
3. T28-3 (B) : « Compléter » sur un lien mort ouvre la saisie ; jamais d'article « lecture… » ni de « L'IA n'a pas répondu ».
4. T28-4 (B) : « Escalader » montre son attente (étapes au fil) puis son résultat ; bouton désactivé pendant.
5. T28-6 (B) : classement des articles au prix ramené à l'unité de quantité (CHF/kg pour un houblon) ; quantité à côté du prix dans la liste et la fiche.
6. T28-11 : compte des articles inchangé tant que la lecture n'a pas abouti. T28-15 : le bandeau de fin nomme le carnet. T28-10 : durée affichée = temps vécu (horloge de l'app depuis le collage, jamais le seul temps serveur).
7. T28-17 : un lien déjà dans le carnet (lienCanonique) est reconnu au collage, sans appel serveur.
Chaque défaut : un test qui échoue sur le code actuel (règle de calcul ou d'état seulement), puis la correction, puis vert. Pas de test d'écran local.

## Critères
- `npx tsc --noEmit -p .` : aucune erreur neuve (2 connues : seedData, pwa-register) ; tests touchés verts.
- Commit par chemins ; fin : « PRÊT À METTRE EN LIGNE <hash> ».

OWNS : src/ui/carnets/** sauf FicheArticle.tsx et fiche-article.css ; src/domain/carnets/** ; src/services/aiClient.ts ; tests/unit/carnets* que tu crées ou touches ; ton dossier de voie.

## Tenue
- RESULTAT.md tenu au fil (une limite de tours ne doit rien perdre) : une ligne par constat (fait, test, commit).
- Tests : `npx vitest run <fichiers> --reporter=dot > voies/fix28-app/tests.log 2>&1; tail -5 voies/fix28-app/tests.log`.
- Pas de captures locales : la preuve est faite en ligne par le pilote.
