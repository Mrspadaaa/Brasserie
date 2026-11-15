# Voie s3 — mini maquettes : préréglages et saisie, chaude

- Mission : 2026-11-14-finances
- Agent : concepteur
- Modèle : opus
- Niveau : conception
- Plafond : 60 tours ; 3 essais par critère
- Dépend de : —
- Décideur en cas de doute : brasseur (par la page de choix) ; pilote pour le reste

## Objectif
Quatre mini maquettes **statiques** (images, non jouables) d'Opérations « Lignes serrées v6a » avec un filtre précis « du … au … », chacune au repos et après le geste. Chaleur : chaude.

## Entrées
- `work/missions/2026-11-14-finances/DOSSIER.md` — tout ce qu'il faut savoir (ses mots, la base, les états, les exigences). Lire en premier ; ne pas relire les sources qu'il résume.
- `work/missions/2026-11-14-finances/ref/v6a/etat.html`, `work/missions/2026-11-14-finances/ref/v6a/NOTE.md`, `work/missions/2026-11-14-finances/ref/v6a/v6a-page.png` — la base, telle quelle.
- `work/missions/2026-11-14-finances/analyse/cap/ops-plage-390-clair.png` — ce qu'il a aujourd'hui.

## Possède (seuls chemins où écrire, avec RESULTAT.md)
- `work/missions/2026-11-14-finances/voies/s3`

## Consignes
Charger d'abord les skills `boosters-ux`, `impeccable`, `ui-design-system`. Une variante par axe :
- s3a — puces préréglées sous la pilule : « 7 j · 30 j · ce mois · trimestre · du … au » ; la dernière ouvre les deux dates
- s3b — une phrase en tête « du 1er nov. au 15 nov. » dont chaque date est un mot touchable (édition sur place)
- s3c — la recherche comprend une période tapée (« 3-17 nov. ») et la pose en pastille de filtre, avec la puce « du … au » à côté
- s3d — libre et audacieuse : ta meilleure idée, tant que v6a reste intacte au repos
Chaque axe est une piste, pas un carcan : si l'idée casse v6a, dis-le dans NOTE.md et propose mieux dans le même esprit. Pas de Fable, aucun sous-agent.

## Exigences transversales et acquis (recopiés, leçons L05 et L06)
- Règle n° 1 : v6a reprise telle quelle ; seul le filtre de dates s'ajoute. « ✓ Payé » 24 px minimum.
- Peu de texte au premier plan ; au style (DESIGN.md) ; jamais type="number" ; inconnu ≠ 0 ; montants recalculés justes dans la plage.
- Lignes-tâches filtrantes gardées (acquis 10.11). Classes préfixées par l'id (L26).

## Critères
Dans `GATES.md`, même dossier. Ne pas le modifier. Lancer chaque `CHECK:` depuis la racine du dépôt.

## Rendre
- `RESULTAT.md` tenu au fil (une ligne par variante : id, idée, images ouvertes oui/non, défauts vus).
- Tests : maquettes statiques, aucun Vitest ; la ligne « Tests » est le contrôle de série écrit dans un fichier : `node work/missions/2026-11-14-finances/outils/controle-serie.mjs work/missions/2026-11-14-finances/voies/s3 s3a,s3b,s3c,s3d > work/missions/2026-11-14-finances/voies/s3/tests.txt` (à la place de `npx vitest run … --reporter=dot > tests.txt`).
- Voie d'écran : 390, clair, repos et après ; images toutes ouvertes avant de rendre.
Réponse finale au pilote : une ligne.
