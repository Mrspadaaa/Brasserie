# Voie e4-jury — les questions des méthodes, posées à un jury plutôt qu'au brasseur

Agent : general-purpose (Opus), pour lire les dépôts en ligne. Une méthode : un skill, puis un essai réel. Écris RESULTAT.md tôt.

## Ses mots (31.10)
Sur « superpowers, mattpocock et addyosmani imposent des questions bloquantes » : « Alors ça non ou à adapter avec un jury. […] on peut
aussi faire des tests ! ».

## Ce qui est demandé
1. **Lire, en lecture seule** : les skills qui posent des questions. Ne clone, n'installe et n'exécute rien.
   - superpowers `brainstorming` (https://github.com/obra/superpowers) ;
   - mattpocock `grilling` et les skills voisins (https://github.com/mattpocock/skills) ;
   - addyosmani `interview-me` (https://github.com/addyosmani/agent-skills).
   Pour chacun, note les questions qui comptent vraiment, et l'ordre où elles arrivent. Lis aussi notre rapport,
   `work/missions/2026-10-31-methodes/RAPPORT.md`, § 2 et § 6.
2. **Lire notre système** : `.claude/skills/conseil/SKILL.md` et `references/regards.md`, `.claude/skills/voies/SKILL.md`,
   `.claude/agents/conseiller.md`, `docs/agents/systeme.md` (§ Décider), `cerveau/LECONS.md` (L19, L24, L27), `CLAUDE.md`.
3. **Écrire un skill `.claude/skills/jury/SKILL.md`**, en français : un interrogatoire avant de planifier une voie ou un écran.
   - Les questions viennent des trois méthodes, triées et sans doublon.
   - Chaque question est posée au jury, jamais au brasseur. Le jury est fait de regards existants :
     - le Brasseur, en Fable, calibré sur `work/refonte-frontend/v4/ecran-1/fils21-choisir/critique/PORTRAIT.md` ;
     - le Contradicteur ;
     - les Premiers principes ;
     - au besoin le Bâtisseur.
   - Le jury répond d'après les sources : `SPEC-BRASSEUR.md`, `ecrans.json`, `cerveau/`, PRODUCT.md, DESIGN.md, le code.
   - Il rend une fiche de cadrage :
     - les réponses, avec leur source ;
     - ce qui reste ouvert parce que c'est un goût, qui devient un axe de variantes à montrer (L24) ;
     - ce qui reste ouvert parce que c'est irréversible ou externe, qui va aux accords groupés.
   - Il ne bloque jamais.
   - Trois niveaux de coût, comme le conseil : rapide (2 regards), normal, complet. Garde le plafond de tours, et le retour en une ligne.
   - Ajoute le skill à la liste des skills de `docs/agents/systeme.md`, en une ligne proposée sans l'écrire, et la place du jury dans
     `voies` (avant le premier VOIE.md d'un lot qu'on lui montre).
4. **Un essai réel** : lance le jury, en niveau rapide, sur le cadrage du premier écran à refaire après houblons. Choisis-le parmi les écrans
   de `src/App.tsx`, par exemple le tableau de bord ou les stocks.
   - Écris la fiche de cadrage dans ta voie.
   - Dis ce qu'elle a tranché, ce qui reste ouvert, et ce qu'elle a coûté en jetons, si tu peux le lire.
   - Compare-la à ce qu'un cadrage sans jury aurait laissé en suspens.
5. **Licences** : si tu reprends des formulations, garde la source et la licence (MIT) dans un `SOURCE.md` à côté du skill, comme
   `webapp-testing`.

## Critères
- `.claude/skills/jury/SKILL.md` existe, avec un en-tête `name` et une `description` qui déclenchent correctement. Il ne contient aucune
  consigne de poser une question à l'utilisateur, ce que vérifie un grep.
- La fiche de l'essai réel existe et cite ses sources.
- `node scripts/agents/systeme.mjs cerveau` et `charge` passent, si tu touches au cerveau (normalement, non).

## Possède
- `.claude/skills/jury/` (neuf).
- `work/missions/2026-10-31-systeme-ecrans/voies/e4-jury/`.

Ne lance aucun serveur. N'écris aucun code par heredoc ni par `node -e`. Pas de `git stash`, aucun commit. Rends une ligne.
