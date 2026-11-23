# Voie couloirs — pose en couloirs dans les rangées de la frise, et rangée cachée sans chevauchement (CAL-LIGNES-PACKEES)

- Agent : auteur ; Modèle : sonnet ; Niveau : jugement ; Plafond : 80 tours. Copie : C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie.
- Lis ../../COMMUN.md, puis DOSSIER.md (même dossier) À LA PLACE des sources brutes ; ouvre sa capture.

## Économie
- Mécanique : aucune — la preuve se fait en ligne par le pilote (« les seul vrai tests sont ceux sur la vrai app »).
- Gestes : grep ciblé ; un script par lot.

## À faire
1. Trouver la pose actuelle (pourquoi l'escalier) et la cause du chevauchement quand une donnée est cachée.
2. Pose en couloirs (interval partitioning, first-fit trié par début, boîtes = marque ∪ étiquette mesurée) ; hauteur de rangée dérivée.
3. Cacher (œil) une donnée ou une rangée : hauteurs recalculées, aucune rangée ne chevauche la suivante.
4. Tests unitaires de la règle de pose (couloirs minimaux, aucune intersection), rouges sur la pose actuelle, verts après.
Attention : fix30 et la voie agenda travaillent dans la même copie (carnets, Bord) ; ne touche pas à leurs fichiers.

## Critères
- `npx tsc --noEmit -p .` : aucune erreur neuve (2 connues) ; tests touchés verts. Commit par chemins ; fin : « PRÊT À METTRE EN LIGNE <hash> ».

OWNS : src/ui/calendrier/frise/** ; src/domain/calendrier/** (pose) ; tests/unit/calendrier* que tu crées ; ton dossier de voie.

## Tenue
- RESULTAT.md tenu au fil (une limite de tours ne doit rien perdre).
- Tests : `npx vitest run <fichiers> --reporter=dot > voies/couloirs/tests.log 2>&1; tail -5 voies/couloirs/tests.log`.
- Pas de captures locales : la preuve est faite en ligne par le pilote, à 390, sur sa vue (20 mois).
