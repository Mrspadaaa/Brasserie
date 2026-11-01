# Voie o1 — les contrôles `comprendre`, `revue` et `ecarts`

- Mission : 2026-10-31-relire-sans-memoire
- Agent : auteur
- Modèle : sonnet
- Niveau : jugement
- Plafond : 70 tours ; 3 essais par critère
- Dépend de : —
- Décideur en cas de doute : pilote

## Objectif
Trois sous-commandes de `scripts/agents/systeme.mjs`, qui mécanisent la marche à suivre
`.claude/skills/voies/references/sans-memoire.md` : `comprendre` (§ 1), `revue` (§ 2) et `ecarts` (§ 3). Chacune fait exactement ce
que dit la ligne « Contrôle » de son paragraphe, rend son jeton (`COMPRIS OK` / `COMPRIS ECHEC`, `REVUE OK` / `REVUE ECHEC`,
`ECARTS OK` / `ECARTS ECHEC`) et sort avec un code non nul en échec.

## Entrées
- `.claude/skills/voies/references/sans-memoire.md` : la règle, à lire en entier.
- `scripts/agents/systeme.mjs` : l'en-tête d'usage (l. 2 à 24), `finir`, le `switch` des commandes (vers l. 1100 à 1215), `temoins()`
  (l. 937) et ses fabriques de cas (`construireMissionPlan`, etc.). Suivre leur style : commentaires courts en français, datés, qui
  disent pourquoi.
- Les docs du premier essai réel : `docs/finances.md`, `docs/gemini-budget.md`, `docs/finance-verification.md`,
  `docs/financial-sync.md`, `docs/expense-vision-evaluation.md`.

## Possède (seuls chemins où écrire, avec RESULTAT.md)
- `scripts/agents/systeme.mjs` : seulement l'en-tête d'usage, les trois sous-commandes et leurs cas dans `temoins()`.
- `work/missions/2026-10-31-relire-sans-memoire/voies/o1/temoins/` : les fichiers témoins des critères, en `.md` (seuls les `.md` et
  `.json` des missions sont suivis par git).

## Consignes
- **comprendre `<dossier de voie>`** : lit `COMPRIS.md` et `VOIE.md`. Échoue si l'une des cinq parties manque ou est vide
  (`## Objectif`, `## Écrit dans`, `## Fini quand`, `## Ne fait pas`, `## Doutes`). Échoue si un chemin entre accents graves de
  « Écrit dans » n'est pas sous un chemin de la section « Possède » de VOIE.md (`RESULTAT.md` et `COMPRIS.md` de la voie sont
  toujours permis). En succès, imprime le nombre de doutes (« aucun » = 0).
- **revue `<REVUE-PLAN.md>`** : exige `## Conception` et `## Prêt à coder`, chacune avec le tableau
  `| n | Gravité | Constat (preuve) | Correction attendue | Sort | Raison |`. Gravité parmi `bloquant`, `majeur`, `détail` ; Sort parmi
  `corrigée`, `contestée`, `acceptée` ; Raison non vide si contestée ou acceptée ; aucun bloquant accepté ni sans sort. Une section
  sans ligne n'est permise qu'avec une ligne qui commence par « Aucun constat : » suivie de sa preuve (« ne jamais approuver par
  défaut »). En succès, imprime le compte par gravité.
- **ecarts `<doc…>`** : pour chaque passage entre accents graves d'un document :
  - un chemin (contient `/` ou finit par une extension de code ou de doc) doit exister depuis la racine ; un nom de fichier seul est
    résolu par `git ls-files` s'il est unique ;
  - un `fichier:ligne` ou `fichier:l1-l2` ne doit pas dépasser la fin du fichier ;
  - un identifiant de code (camelCase, PascalCase, MAJUSCULES_SOULIGNÉES, ou mot à tirets qui contient un chiffre comme `invoice-v4`)
    doit se trouver par `git grep -F` dans `src/`, `functions/src/`, `scripts/` ou `tests/` ;
  - le reste est ignoré : commandes (`node …`, `npm …`), adresses, nombres et unités, texte avec espaces, mots français.
  Une ligne par écart : `doc:ligne — <passage> : <raison>`. Aucun appel réseau.
- **Témoins** : dans `temoins()`, pour chaque sous-commande, un cas bon (attendu vrai) et au moins deux cas faux (attendu faux). Les
  cas faux visent ce que la règle refuse : partie manquante, chemin hors « Possède », bloquant accepté, sort manquant, chemin absent,
  ligne au-delà de la fin, identifiant inconnu.
- **Essai réel** : lancer `ecarts` sur les cinq docs des finances. Dans RESULTAT.md : le nombre d'écarts par doc, puis 10 écarts tirés
  au hasard, chacun classé vrai ou faux positif avec sa raison. Au-delà de 20 % de faux positifs, resserrer la règle des
  identifiants et rejouer. `invoice-v3` (`docs/gemini-budget.md:37`) est un vrai écart connu : le code écrit `invoice-v4`.
- Ne rien changer d'autre dans `systeme.mjs` ; ne corriger aucune doc (le pilote s'en charge après e1). Avant de rendre :
  `node scripts/agents/systeme.mjs temoins` et `node scripts/agents/systeme.mjs cablage`.

## Exigences transversales et acquis (recopiés, leçons L05 et L06)
- Un critère n'imprime jamais son jeton sans condition (M10) ; rien à compter n'est pas un succès (31.10, `mots-premier-ecran.mjs`).
- Un contrôle nouveau échoue sur son témoin négatif (L13).

## Critères
Dans `GATES.md`, même dossier. Ne pas le modifier. Lancer chaque `CHECK:` depuis la racine du dépôt.

## Rendre
`RESULTAT.md` au format de l'agent. Réponse finale au pilote : une ligne.
