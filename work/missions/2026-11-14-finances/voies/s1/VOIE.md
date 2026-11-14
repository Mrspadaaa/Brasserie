# Voie s1 — mini maquettes : la plage depuis la pilule du mois

- Mission : 2026-11-14-finances
- Agent : concepteur
- Modèle : opus
- Niveau : conception
- Plafond : 60 tours ; 3 essais par critère
- Dépend de : —
- Décideur en cas de doute : brasseur (par la page de choix) ; pilote pour le reste

## Objectif
Quatre mini maquettes **statiques** (images, non jouables) d'Opérations « Lignes serrées v6a » avec un filtre précis « du … au … », chacune au repos et après le geste. Chaleur : froide à tiède.

## Entrées
- `work/missions/2026-11-14-finances/DOSSIER.md` — tout ce qu'il faut savoir (ses mots, la base, les états, les exigences). Lire en premier ; ne pas relire les sources qu'il résume.
- `work/missions/2026-11-14-finances/ref/v6a/etat.html`, `work/missions/2026-11-14-finances/ref/v6a/NOTE.md`, `work/missions/2026-11-14-finances/ref/v6a/v6a-page.png` — la base, telle quelle.
- `work/missions/2026-11-14-finances/analyse/cap/ops-plage-390-clair.png` — ce qu'il a aujourd'hui.

## Possède (seuls chemins où écrire, avec RESULTAT.md)
- `work/missions/2026-11-14-finances/voies/s1`

## Consignes
Charger d'abord les skills `boosters-ux`, `impeccable`, `ui-design-system`. Une variante par axe :
- s1a — toucher le nom du mois « novembre » ouvre une petite feuille « du [date] au [date] » (deux sélecteurs natifs) ; après : la pilule dit « 1 → 15 nov. » avec ×
- s1b — la pilule s'étire en deux bornes touchables « ‹ 1 nov. — 15 nov. › » ; les flèches décalent la plage entière
- s1c — une rangée fine « du … au … » repliée sous la pilule, dépliée par un chevron ; les deux champs restent visibles une fois posés
- s1d — bascule à deux segments « Mois | Plage » dans la carte du graphe ; Plage montre deux bornes datées
Chaque axe est une piste, pas un carcan : si l'idée casse v6a, dis-le dans NOTE.md et propose mieux dans le même esprit. Pas de Fable, aucun sous-agent.

## Exigences transversales et acquis (recopiés, leçons L05 et L06)
- Règle n° 1 : v6a reprise telle quelle ; seul le filtre de dates s'ajoute. « ✓ Payé » 24 px minimum.
- Peu de texte au premier plan ; au style (DESIGN.md) ; jamais type="number" ; inconnu ≠ 0 ; montants recalculés justes dans la plage.
- Lignes-tâches filtrantes gardées (acquis 10.11). Classes préfixées par l'id (L26).

## Critères
Dans `GATES.md`, même dossier. Ne pas le modifier. Lancer chaque `CHECK:` depuis la racine du dépôt.

## Rendre
- `RESULTAT.md` tenu au fil (une ligne par variante : id, idée, images ouvertes oui/non, défauts vus).
- Tests : maquettes statiques, aucun Vitest ; la ligne « Tests » est le contrôle de série écrit dans un fichier : `node work/missions/2026-11-14-finances/outils/controle-serie.mjs work/missions/2026-11-14-finances/voies/s1 s1a,s1b,s1c,s1d > work/missions/2026-11-14-finances/voies/s1/tests.txt` (à la place de `npx vitest run … --reporter=dot > tests.txt`).
- Voie d'écran : 390, clair, repos et après ; images toutes ouvertes avant de rendre.
Réponse finale au pilote : une ligne.
