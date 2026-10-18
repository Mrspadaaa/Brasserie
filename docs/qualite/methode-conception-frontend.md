# Méthode de conception frontend — L'Affinée

Adoptée le 18.10.2026 après deux prototypes houblons refusés (v2, puis v3 arrêtée).
Elle vaut pour tout écran de l'app, pas seulement les houblons. Elle complète
[PRODUCT.md](../../PRODUCT.md), [DESIGN.md](../../DESIGN.md),
[le guide UI](../ui-compacte.md) et [le protocole de revue UX](protocole-revue-ux.md).

## Pourquoi cette méthode

Les échecs de la v2 et de la v3 ont trois causes vérifiées (décisions D17 à D19) :

1. **Des substituts ont jugé à la place du brasseur** : contrôles automatiques et
   relecteurs Fable étaient au vert, le brasseur a refusé.
2. **Ses propres références ont été perdues** : l'inventaire n'a lu que ses messages
   directs. Les demandes relayées dans les briefs d'agents (carte Territoire, échelles
   relatives au style, bascule Barres / Radar) en sont sorties.
3. **Aucune méthode de conception** : pas de parcours écrit avant les écrans, une seule
   idée explorée à chaque fois, pas de critère à nous. D'où la comparaison avec un site
   concurrent comme critère de réussite.

## Cinq principes

1. **Le brasseur juge. Tout le reste filtre.** Les contrôles et les relecteurs
   éliminent les défauts avant lui ; ils ne valident jamais à sa place.
2. **Ses mots et ses choix passés d'abord.** On relit tout le corpus : messages,
   briefs d'agents, décisions d'archive, concepts qu'il a aimés ou rejetés.
3. **Le parcours et les données avant l'apparence.** On écrit ce que le brasseur
   fait, dans quel ordre, avec quelles données et quels états, puis on dessine.
4. **Une maquette reste une maquette.** Tant qu'on conçoit, on travaille en pages
   HTML légères, avec de vraies données. Une maquette qui fonctionne en partie
   suffit. La pile de l'app, les tests et l'outillage de production arrivent à
   l'intégration, après l'accord du brasseur. (Mots du brasseur, 18.10 : « c'est
   pour le moment juste des maquettes ».)
5. **Pas plus d'outils que l'étape n'en demande.** Chaque étape a un outil et une
   sortie ; on n'ajoute rien qui ne serve pas la décision du moment.

## Phase maquette (maintenant)

| Étape | Sortie | Outils |
|---|---|---|
| E0 Besoin | Corpus complet, banque de questions, 3 à 5 scénarios, chacun avec une citation du brasseur | Scripts d'extraction, vérification des citations mot pour mot |
| E1 Références | Ce qu'il a aimé, ce qu'il a refusé, et pourquoi. La grammaire graphique prise ailleurs sert à dessiner, jamais à juger | Captures (Chrome, galerie d'archive), Claude in Chrome en lecture seule |
| E2 Cadrage | Brief : tâche, résultat, états, limites ; structures possibles ; contrat de direction | Skill **impeccable** : `shape`, `concept-seed`, `surface-brief` |
| E3 Données | Un jeu de données réel commun à toutes les maquettes, calculé par le moteur de l'app (importé, pas recopié) | Script Node, quelques tests de cohérence |
| E4 Tournois | À chaque petite étape, des mini-maquettes, un jury à l'aveugle, puis une consolidation (section suivante) | HTML autonome, captures 390 et 1280 pour le jury, jury Fable |
| E5 Trois maquettes finales | Trois maquettes complètes et cliquables, sur les vrais scénarios, construites sur des partis pris différents à partir des consolidations. Demande du brasseur : « me faire 3 version à la fin plutôt qu'une » | HTML autonome, Artifact privé |
| E6 Revue | Pour chaque maquette : une critique notée, puis une relecture neuve | `impeccable critique`, relecteur Fable à l'aveugle |
| E7 Le brasseur | Son choix parmi les trois, et son avis sur les finalistes des étapes serrées s'il le veut | Lien privé (Artifact). C'est la porte B |

## Phase intégration (après l'accord du brasseur)

La maquette retenue est reconstruite dans l'app (React, TypeScript, Tailwind, jetons de
DESIGN.md). On y ajoute les vérifications de production :

- tests du domaine (Vitest) ;
- contrôles de parcours `check-hop-*` (un toucher, règles U, budgets) ;
- accessibilité (`a11y-audit`) ;
- `impeccable detect` ;
- revue finale **impeccable-finish-reviewer** ;
- documentation **impeccable-documenter**.

Un atelier de composants ou des scénarios automatisés ne s'ajoutent que si un besoin
réel apparaît.

## Diverger puis converger, à chaque petite étape

Demande du brasseur (18.10) : « à chaque mini étape ajoute la création de mini Proto
5,10,15,20 le nombre qu'il en faut. Ensuite jette les pire et consolide les meilleurs
[…] Pour les Proto récompense à fond la créativité, disruption, l'ux ».

Chaque petite étape de conception suit ce cycle. Exemples d'étapes : une feuille de
lecture, un geste, une comparaison, une vue d'ensemble, l'assemblage d'une page.

1. **Diverger.** De 5 à 20 mini-prototypes, autant qu'il en faut pour couvrir des idées
   vraiment différentes.
   - Chacun est une page HTML jetable, sur le même jeu de données réel, qui joue les
     mêmes scénarios.
   - La diversité est forcée :
     - chaque auteur reçoit une contrainte de forme différente (structures et défis
       tirés par `impeccable concept-seed`, formes étrangères au métier) ;
     - les auteurs sont de modèles différents (Opus, Sonnet, Fable) ;
     - aucun auteur ne voit le travail des autres.
   - À ce stade, on récompense la créativité, la rupture et l'intelligence du geste ;
     la finition ne compte pas.
2. **Juger à l'aveugle.** Un jury Fable, qui n'a rien conçu, note les captures (390 et
   1280) sur une grille fixe :
   - **créativité et rupture** : 30 % ;
   - **clarté pour la tâche du brasseur** : 30 % ;
   - **vérité des données** (rien d'inventé, une inconnue n'est jamais zéro, pas de
     granularité plus fine que la donnée) : 20 % ;
   - **densité selon DESIGN.md** : 10 % ;
   - **faisabilité** : 10 %.

   Un mini-prototype qui ment sur les données est éliminé, quelle que soit sa note.
3. **Jeter.** La moitié la plus faible part, avec une ligne de raison chacune.
4. **Consolider.** Un consolidateur part du meilleur et y greffe les idées nommées des
   autres finalistes. Chaque greffe porte le nom de sa source. Le résultat devient le
   composant de l'atelier (E4).
5. **Garder la trace.** Captures, notes, raisons d'élimination et greffes vont dans le
   dossier du tournoi. À la fin, le brasseur voit le résultat consolidé ; pour les étapes
   où le tournoi a été serré, il voit aussi les deux ou trois finalistes, s'il le veut.

Ce cycle est l'étape E4 de la phase maquette.

## Rôles

- **Pilote (Opus)** : besoin, cadrage, contrat, organisation des tournois, regard sur
  chaque capture.
- **Auteurs de mini-maquettes** (Opus, Sonnet, Fable, contexte neuf) : une ou deux
  formes imposées chacun.
- **Jury** (Fable, contexte neuf, sans les notes des auteurs) : notes et élimination.
- **Consolidateur** (Opus) : le meilleur, plus les greffes nommées.
- **Haiku** : extractions et captures ; le pilote relit.
- **Le brasseur** : juge final de la maquette.

## Outils de la phase maquette

| Outil | Rôle | Où |
|---|---|---|
| impeccable | Cadrage, tirage de formes, contrat, critique | `.claude/skills/impeccable` |
| Pages HTML autonomes | Mini-maquettes et maquette consolidée | `work/…/tournoi/`, `prototypes/` |
| Script de captures (puppeteer-core) | Captures 390 et 1280 pour le jury, pas des tests | `work/refonte-frontend/v4/tournoi/outils/capture.mjs` |
| Moteur de l'app, importé par un script Node | Le jeu de données réel commun | `prototypes/houblons-v4/` |
| Fable | Jury à l'aveugle, relecture | Agents en contexte neuf |
| Artifact privé | Montrer la maquette au brasseur | claude.ai |

Le `package.json` de l'app ne change pas avant l'accord du brasseur.

## Ce qui est interdit

- Juger une version contre un site concurrent. La concurrence fournit une grammaire,
  pas un critère.
- Déclarer une étape faite sur un reçu ou une capture non regardée.
- Recopier un calcul du domaine dans une maquette : les chiffres viennent du moteur.
- Alourdir la phase maquette avec l'outillage de production.
