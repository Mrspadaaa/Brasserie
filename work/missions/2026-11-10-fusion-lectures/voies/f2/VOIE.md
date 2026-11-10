# Voie f2 — les 5 bloquants du jeu en ligne 8 (mission 2026-11-10-fusion-lectures)

- Agent : auteur · Modèle : sonnet · Plafond : 150 tours · Décideur : pilote
- Dossier de travail : le worktree `C:/Users/mrspa/Documents/Brasserie/.claude/worktrees/epic-banach-4c4f89` (branche
  `claude/happy-satoshi-f3f2c1`). Toutes les commandes s'y lancent.
- Lis : `CLAUDE.md`, `cerveau/LECONS.md` (L13, L20, L28, L29) ; `work/missions/2026-11-10-fusion-lectures/MISSION.md` en entier (état de l'art,
  décision, état de reprise § 96-110) ; `work/missions/2026-11-09-depense-totaux/critique/VERDICT-EN-LIGNE-8.md` (dans ce worktree, ou dans
  `C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie/work/missions/2026-11-09-depense-totaux/critique/`) ;
  `.claude/skills/banc-lecture/SKILL.md`.

## Objectif
Suivre la « Prochaine action » de l'état de reprise, à la cause, avec un test qui échoue avant chaque correction (L13) :
1. BAUHAUS : 8 lignes au montant de leur voisine + 1 perdue ; (4) 13 corrections barrées au nom d'une voisine : vote du NOM aussi
   (majorité nom ↔ montant), pas seulement du montant.
2. « annoncés 23 » inventé : `printedLineCount` voté comme un comptage (`voterComptage`).
3. Prix unitaire perdu 28/28, unité 17/28 : un prix ou une unité null de la 3.8 ne l'emporte pas sur une valeur lue au même montant.
5. Sun Store : « Rabais total −2,58 » ne doit pas être proposé à garder (rabais global, pas un article) : côté serveur si possible ; si la
   cause est côté client, écris-la dans RESULTAT.md (le pilote porte le client).
D'abord sur les 207 tirages réels enregistrés : aucun document en recul (mesure avant / après, comme la passe précédente). Puis, si utile,
lectures Gemini réelles : 2 CHF au plus, journalisées selon le skill banc-lecture (journal de la mission), jamais dans `npm test`.

## Contrôles
- `npx tsc --noEmit -p .` à la racine et dans `functions/`.
- Tests serveur et lecture de la mission (ceux que MISSION.md liste) + `npx vitest run tests/unit/depense tests/unit/finance --reporter=dot > work/missions/2026-11-10-fusion-lectures/voies/f2/tests.txt` ; zéro nouveau rouge (les 12 rouges déjà sur HEAD sont listés dans MISSION.md).
- `npm run build` vert.
- Banc : sortie avant / après sur les 207 tirages, dans `voies/f2/`.

## Possède
- `functions/src/invoice*.ts`, `functions/src/prompts.ts`, `functions/src/ai.ts` et leurs tests ; `scripts/` du banc de la mission ;
  `tests/unit/invoice*`, `tests/unit/banc-lecture*` ; `work/missions/2026-11-10-fusion-lectures/**`.
Rien dans `src/` (client) : une cause client va dans RESULTAT.md. Jamais lire `functions/.env`. Aucun déploiement. Ni commit ni stash.

## Exigences transversales
- Aucune régression : Sun Store tient (7 lignes, 163,85, payé 163,85) ; l'écart BAUHAUS reste rouge ; aucun chiffre inventé.
- Aucune donnée réelle dans Git (photos, réponses brutes anonymisées avant).

## Rendre (exigé par `.claude/hooks/garde-jetons.mjs`, L18)
- `RESULTAT.md` tenu au fil, mis à jour tous les 5 éléments : une limite de tours ne perd rien.
- La ligne « Tests » écrite dans un fichier (`--reporter=dot > …/f2/tests.txt`).
- Pas d'interface touchée : pas de captures.

Réponse finale au pilote : une ligne.
