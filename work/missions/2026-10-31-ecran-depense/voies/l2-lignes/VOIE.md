# Voie l2-lignes — lenteur D : la ligne que la lecture lente ajoute, et celle qu'elle ne lit plus (D310), en mini maquettes

Agent : `concepteur` (Opus). Plafond : 50 tours. Critique Fable après la voie, puis le pilote publie (page neuve). Aucun code de l'app modifié,
aucun commit, aucun déploiement, aucun serveur Vite dans le dépôt. Possède : `work/missions/2026-10-31-ecran-depense/choix-lignes-38/**`.
Avant : `.claude/rules/affinee-frontend.md`, `DESIGN.md`, `docs/ui-compacte.md` (parties utiles) ; skills `boosters-ux`, `impeccable`.
Reprends la forme et l'outillage de `choix-lenteur/` (index.html, `outils/gen.mjs`, `outils/page.cjs`, maquettes) et de `choix-sousfamilles/`
(feuille compilée de l'app), et les verdicts `critique/VERDICT-c-lenteur.md`, `critique/VERDICT-r2-sousfamilles.md` : ne refais pas leurs défauts.
Lis la section 4 de `voies/l1-plan/PLAN.md` (les cas limites) et D308, D310 dans `work/refonte-frontend/decisions.md`.

## Ses mots (SPEC, 02.11, mot pour mot)
« La lenteur go pour la d »

## Sa maquette (règle n° 1, la base)
`choix-lenteur/maquettes/d-lue.html` et `img/d-lue.png` : à l'arrivée de la lecture lente, le fil part, « Confirmer » redevient noir, puce
« ↻ N corrigées » (même geste de filtre que les autres puces), valeur corrigée sur fond bleu, l'ancienne barrée sous le nom. Ne change rien
de cela. Les bandes sont celles d'aujourd'hui (vue Catégorie ; les sous-groupes de D307 ne sont pas encore portés : ne les dessine pas).

## Les deux questions (deux choix sur la même page, un facteur chacun, L10)
1. **Une ligne que la lecture lente ajoute** (absente du provisoire) : comment se voit-elle à l'arrivée ? Elle compte dans la puce.
   A (référence) : une rangée ordinaire de plus, sans marque. Puis 2 à 3 formes (la proposition du plan : la rangée entière sur fond bleu,
   sans ancienne valeur ; d'autres à toi).
2. **Une ligne du provisoire que la lecture lente ne lit plus** : rien ne se perd en silence (plan, § 4). A (référence) : retirée sans
   marque (ce qu'il ne faut pas faire, montré pour comparer). Puis 2 à 3 formes (la proposition du plan : la rangée barrée en attention,
   qu'il retire ou garde d'un toucher ; d'autres à toi). Le geste « garder / retirer » doit se trouver sans mode d'emploi.
Pas de cockpit, pas de paragraphe à l'écran ; la puce et le fond bleu de sa maquette restent la langue commune.

## Les vues
Pour chaque option : la dépense lue à 390 px (pièce fictive d'un fournisseur fictif, 8 à 10 lignes, deux corrections ordinaires comme
dans `d-lue`, plus la ligne du cas), clair ; une vue sombre pour la forme que tu proposes ; pour la question 2, l'état après « garder »
et après « retirer ». Valeurs fictives, aucune valeur de ses pièces.

## Contrôles
1. `node work/refonte-frontend/v4/tournoi/outils/controle-page-choix.mjs work/missions/2026-10-31-ecran-depense/choix-lignes-38/index.html --min=3` → `PAGE-CHOIX OK`.
2. `node scripts/agents/verifier-page.mjs work/missions/2026-10-31-ecran-depense/choix-lignes-38/index.html --page-lot --captures work/missions/2026-10-31-ecran-depense/choix-lignes-38/controle` → `PAGE OK` ; ouvre chaque capture (L12).
3. La référence A de chaque question reprend `d-lue.png` au pixel hors de la ligne du cas (mesure, L03).
4. `controle-choix` : l'écran Dépense n'est pas dans `ecrans.json` ; le dire dans RESULTAT.

## Retour
`choix-lignes-38/RESULTAT.md` (options, mesures, captures ouvertes, doutes ; `LEÇON PROPOSÉE : …`), puis une ligne
`L2-LIGNES OK — <n> options — choix-lignes-38/index.html` ou `L2-LIGNES ECHEC — <raison>`.
