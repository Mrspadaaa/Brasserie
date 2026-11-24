# Voie couloirs — CONTRAT RÉÉCRIT : frise bord à bord, traits continus à travers les rangées vides ou cachées (CAL-BORDS-ET-LIGNES)

- Agent : auteur ; Modèle : sonnet ; Niveau : jugement ; Plafond : 80 tours. Copie : C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie.
- Lis ../../COMMUN.md, puis DOSSIER.md (même dossier) À LA PLACE des sources brutes ; ouvre sa capture.

## Économie
- Mécanique : aucune — la preuve se fait en ligne par le pilote (« les seul vrai tests sont ceux sur la vrai app »).
- Gestes : grep ciblé ; un script par lot.

## À faire
1. Trouver d’où viennent les marges (conteneur, padding) et pourquoi une rangée vide ou cachée est une bande blanche sans traits.
2. Frise bord à bord (gauche, droite, jusqu’à la barre du bas) ; en-têtes de rangée avec retrait interne.
3. Traits des graduations continus à travers toutes les rangées, vides ou cachées.
4. Aucune pose en couloirs (retirer si déjà codée). Test : géométrie calculée (largeur = écran, traits sur toute la hauteur) si une règle de calcul existe ; sinon preuve en ligne seulement.
Attention : fix30 et la voie agenda travaillent dans la même copie (carnets, Bord) ; ne touche pas à leurs fichiers.

## Critères
- `npx tsc --noEmit -p .` : aucune erreur neuve (2 connues) ; tests touchés verts. Commit par chemins ; fin : « PRÊT À METTRE EN LIGNE <hash> ».

OWNS : src/ui/calendrier/frise/** ; src/domain/calendrier/** (pose) ; tests/unit/calendrier* que tu crées ; ton dossier de voie.

## Tenue
- RESULTAT.md tenu au fil (une limite de tours ne doit rien perdre).
- Tests : `npx vitest run <fichiers> --reporter=dot > voies/couloirs/tests.log 2>&1; tail -5 voies/couloirs/tests.log`.
- Pas de captures locales : la preuve est faite en ligne par le pilote, à 390, sur sa vue (20 mois).
