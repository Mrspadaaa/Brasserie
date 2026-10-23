# Mission 2026-10-23-etalonnage-critique

## Objectif
Étalonner le critique Fable sur les vrais verdicts du brasseur (L27). L'utilisateur, le 23.10 : « Oui », en réponse à
« Je lance aussi l'étalonnage du critique ? ».

Le critique classait sans voir qu'un panel était faible. Il a jugé « satisfaisantes » des passes 2 encore vides, et il
avait rejeté r6a, que le brasseur a choisie. Son portrait (`fils21-choisir/critique/PORTRAIT.md`) a été écrit par un
modèle et n'a jamais été confronté à ses verdicts.

Fini veut dire :
- un jeu de verdicts, mot pour mot, avec la capture jugée ;
- une épreuve à l'aveugle ;
- un score d'accord calculé par `systeme.mjs etalonnage` ;
- et, selon le score :
  - au seuil (paires 80 %, classes 70 %), le critique est déclaré étalonné, avec son score, dans `critique.md` ;
  - sous le seuil, le portrait est réécrit à partir des verdicts de la moitié A, puis éprouvé sur la moitié B par un
    critique neuf.

## Décisions
| Décision | Options | Décideur | État |
|---|---|---|---|
| Seuils d'accord | paires 80 %, classes 70 % | pilote | tranchée : réversible, ajustable après une première mesure |
| Contenu du jeu | verdicts mot pour mot de SPEC et de elements-notes.json seulement ; rien du critique ni du pilote | pilote | tranchée |

## Voies
| Voie | Objectif | Niveau | Agent | Modèle | Plafond | Possède | Dépend de | Contrôles | Décideur | Étape |
|---|---|---|---|---|---|---|---|---|---|---|
| e1-jeu | le jeu d'étalonnage : paires (il a préféré A à B) et classes (aime, mitigé, rejette), ses mots exacts, la capture qu'il a jugée | jugement | auteur | sonnet | 80 | work/refonte-frontend/v4/etalonnage/jeu.json, work/refonte-frontend/v4/etalonnage/JEU.md | — | comptes, captures présentes, citations retrouvées dans SPEC | pilote | — |
| e2-epreuve | anonymiser : captures renommées, ordre A/B tiré au sort, moitiés A et B ; clé à part (`systeme.mjs epreuve`) | mécanique | pilote (script) | opus | 10 | work/refonte-frontend/v4/etalonnage/epreuve/**, work/refonte-frontend/v4/etalonnage/cle.json | e1-jeu | aucun nom de variante ni verdict dans epreuve/ | pilote | — |
| e3-aveugle | le critique passe l'épreuve sans la clé : pour chaque paire, laquelle il préférerait, et pour chaque capture, sa classe, avec la phrase qu'il dirait | jugement | critique | fable | 30 | work/refonte-frontend/v4/etalonnage/reponses.json | e2-epreuve | une réponse par item ; `systeme.mjs etalonnage` | pilote | — |

## Boucle de retour
- Sous le seuil :
  1. le pilote lit les désaccords ;
  2. il réécrit le portrait à partir des seuls verdicts de la moitié A ;
  3. un critique neuf passe la moitié B.
- Chaque nouveau verdict du brasseur entre dans le jeu (`jeu.json`), et l'épreuve se rejoue.
- Le regard Brasseur du conseil passe la même épreuve.

## Budget
Usage au lancement (23.10, ~11 h) : fenêtre de 5 h à 2 % ce matin, semaine à 35 %, Fable à 21 %.

## Sources
- `work/refonte-frontend/v4/SPEC-BRASSEUR.md`
- `work/refonte-frontend/v4/ecran-1/fils22-comparer/donnees/elements-notes.json`
- `work/refonte-frontend/v4/ecran-1/fils21-choisir/critique/PORTRAIT.md`
- `cerveau/LECONS.md`

## Signature
23.10, pilote.

**Voies**
- e1-jeu : ALL MET. 37 paires et 23 classes, prises dans SPEC.
- Amendements du pilote, notés dans `jeu.json` :
  - pictos découpés de leur planche, texte masqué ;
  - r4 sur la planche d'origine (la croix rouge donnait le verdict) ;
  - premiers écrans seulement ;
  - 7 items `hors_image` (geste, comparaison à une version d'avant, besoin), gardés au jeu mais hors du score.
- e2-epreuve : `systeme.mjs epreuve`, 60 items anonymes ; aucun nom de variante ni verdict dans `epreuve/`.
- e3-aveugle (portrait v1) : paires 23/34 (68 %), classes 13/19 (68 %). ECHEC. Sur la moitié B : 71 % et 75 %.
- e4-aveugle-v2 (critique neuf, portrait v2, moitié B seulement) : ALL MET. **ETALONNAGE OK : paires 15/17 (88 %),
  classes 6/8 (75 %).**

**Décisions**
- Le portrait v2 remplace le v1, archivé sous `PORTRAIT-v1-non-etalonne.md` (pilote, réversible).
- Le critique est déclaré étalonné, avec son score, dans `.claude/agents/critique.md`.

**Limites**
- 25 items inédits seulement.
- Des items de la moitié B partagent un verdict avec la moitié A (y1b, r6a, le picto) : le portrait n'en nomme aucun,
  mais ses principes en viennent.
- Erreurs restantes :
  - trop clément devant un radar à plusieurs couleurs (lot 16) ;
  - r6a vue comme mitigée ;
  - le picto choisi jugé « pas parlant » ;
  - une paire de Comparer du lot 6.

**Ouvert**
- Chaque nouveau verdict du brasseur entre dans `jeu.json`, et l'épreuve se rejoue : `systeme.mjs epreuve` puis
  `systeme.mjs etalonnage --reponses <fichier>`.
- La prochaine vraie épreuve, c'est son verdict sur le prochain lot, comparé à la prédiction du critique.
- Le regard Brasserie du conseil lit le même portrait ; il passera la même épreuve.
