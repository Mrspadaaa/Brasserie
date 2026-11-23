# Voie fix30 — constats du test en ligne du tour 30, Carnet (T30-1 à T30-14, reste de T28-2, 3, 6, 12, 13)

- Agent : auteur ; Modèle : sonnet ; Niveau : jugement ; Plafond : 100 tours. Copie : C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie.
- Lis ../../COMMUN.md, puis DOSSIER.md (même dossier) À LA PLACE des sources brutes ; ouvre une source seulement pour un point qu'il ne couvre pas.

## Économie
- Mécanique : aucune — la preuve se fait en ligne par le pilote après mise en ligne (« les seul vrai tests sont ceux sur la vrai app »).
- Gestes : lectures par grep ciblé, un script par lot ; tests dans un fichier.

## À faire, par gravité
1. T30-1 (B) : quitter le carnet pendant la lecture replie la carte en barre (v01-repliee, plus compacte), sans toucher « Replier » ; la carte entière ne reste jamais en tête d'un autre écran.
2. T30-2 / T28-3 (B) : « Compléter » sur un lien mort ouvre une saisie (nom, prix) ; jamais un simple toast.
3. T28-6 (B) : partout (liste, rang « 1er pour le prix », Choisir, fiche), le prix se compare ramené à l'unité (CHF/kg pour un houblon), la quantité à côté du prix.
4. T30-3 à T30-14 et restes de T28-2, T28-12, T28-13 : dans l'ordre du registre.
Chaque défaut de règle ou d'état : test rouge sur le code actuel, puis correction, puis vert. Pas de captures locales.

## Critères
- `npx tsc --noEmit -p .` : aucune erreur neuve (2 connues) ; `cd functions && npx tsc --noEmit` si touché ; tests touchés verts ; banc liens sans recul si le serveur change.
- Gemini réel : 0. Commit par chemins ; fin : « PRÊT À METTRE EN LIGNE <hash> ».

OWNS : src/ui/carnets/** ; src/domain/carnets/** ; src/services/aiClient.ts ; functions/src/** (lecture de liens) ; tests/unit/carnets* ; ton dossier de voie.

## Tenue
- RESULTAT.md tenu au fil (une limite de tours ne doit rien perdre) : une ligne par constat (fait, test, commit).
- Tests : `npx vitest run <fichiers> --reporter=dot > voies/fix30/tests.log 2>&1; tail -5 voies/fix30/tests.log`.
- Pas de captures locales : la preuve est faite en ligne par le pilote.
