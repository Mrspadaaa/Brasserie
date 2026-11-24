# Voie fix29 — constats du test en ligne du Calendrier (T29-1 à T29-12, T28-16, CALP-5)

- Agent : auteur ; Modèle : sonnet ; Niveau : jugement ; Plafond : 100 tours. Copie : C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie.
- Lis ../../COMMUN.md, puis DOSSIER.md (même dossier) À LA PLACE des sources brutes ; ouvre une source seulement pour un point qu'il ne couvre pas.

## Économie
- Mécanique : aucune — la preuve se fait en ligne par le pilote après mise en ligne (brasseur, 23.11 : « les seul vrai tests sont ceux sur la vrai app »).
- Gestes : lectures par grep ciblé, un script par lot ; le test par modèle lancé une fois par correctif, sortie dans un fichier.

## À faire, par gravité
1. T29-1 (B) : la période de l'app (ex. 01.01.2024 → 31.12.2027) est entièrement atteignable sur la frise ; butée visible au bord.
2. T29-2 (B) : « › Période suivante » avance, « ‹ » recule, et la frise suit.
3. T29-3 / T28-16 (B) : tenir ou glisser une barre ne change jamais l'échelle ; l'événement se pose là où le doigt le lâche (droite = plus tard).
4. T29-4 (B) : dans Bord › Agenda, toucher le nom ouvre la feuille de la ligne ; seule la case coche.
5. T29-5 à T29-12, CALP-5 : dans l'ordre du registre.
Chaque défaut de calcul ou d'état : test rouge (unitaire sur le réducteur, ou une commande ajoutée au test par modèle) avant correction, vert après. Pas de captures locales.

## Critères
- `npx tsc --noEmit -p .` : aucune erreur neuve (2 connues : seedData, pwa-register) ; tests calendrier verts ; etat-coherent.spec (ETAT_RUNS=60) vert.
- Commit par chemins ; fin : « PRÊT À METTRE EN LIGNE <hash> ».

OWNS : src/ui/calendrier/** ; src/domain/calendrier.ts et src/domain/calendrier/** ; le composant de Bord › Agenda (cherche-le, ce fichier seulement) ; e2e/calendrier/** ; tests/unit/calendrier* ; ton dossier de voie.

## Tenue
- RESULTAT.md tenu au fil (une limite de tours ne doit rien perdre) : une ligne par constat (fait, test, commit).
- Tests : `npx vitest run <fichiers> --reporter=dot > voies/fix29/tests.log 2>&1; tail -5 voies/fix29/tests.log`.
- Pas de captures locales : la preuve est faite en ligne par le pilote.
