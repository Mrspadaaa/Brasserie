# Voie saisie — Apport aligné, apport au Calendrier, date en direct, avis sans recouvrement

- Agent : auteur ; Modèle : sonnet ; Niveau : jugement ; Plafond : 100 tours. Copie : C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie.
- Lis ../../COMMUN.md puis DOSSIER.md À LA PLACE des sources brutes.

## Économie
- Mécanique : aucune — la preuve se fait en ligne par le pilote (« les seul vrai tests sont ceux sur la vrai app »).
- Gestes : grep ciblé, un script par lot ; tests dans un fichier.

## À faire
1. Vue Apport : même structure que les autres « Ça rentre », coche « pas de justificatif » comprise.
2. Apport visible dans une rangée du Calendrier, comme les autres entrées d'argent de même genre.
3. Pastille de date mise à jour en direct pendant le tirage du curseur.
4. Avis « Nouvelle version » : jamais par-dessus le contenu (bas d'écran au-dessus de la barre, ou place réservée), toujours actif au toucher.
Chaque règle de calcul ou d'état : test rouge puis vert.

## Critères
- tsc : aucune erreur neuve (2 connues) ; tests touchés verts ; commit par chemins ; fin « PRÊT À METTRE EN LIGNE <hash> ».

OWNS : la feuille Saisir à la main et ses blocs (fichiers de src/ui/finance/ ou src/components/ concernés, à nommer) ; le seul branchement des apports dans les rangées du Calendrier (un fichier de src/domain/calendrier ou src/ui/calendrier, à nommer) ; src/services/miseAJour.ts et son composant d'avis ; tests/unit/ que tu crées ; ton dossier de voie. Ne touche pas src/components/navigation (voie plus) ni src/ui/calendrier/cadre, entete (voie modele).

## Tenue
- RESULTAT.md tenu au fil (une limite de tours ne doit rien perdre).
- Tests : `npx vitest run <fichiers> --reporter=dot > voies/saisie/tests.log 2>&1; tail -5 voies/saisie/tests.log`.
- Pas de captures locales : preuve en ligne par le pilote.
