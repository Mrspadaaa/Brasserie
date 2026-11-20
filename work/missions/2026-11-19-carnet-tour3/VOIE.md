# Voie de tri au code — mission 2026-11-19-carnet-tour3 (lots a, b, c, d)

Objectif : classer chaque ligne de `voies/<lot>/LOT.md` (défauts « ouvert » du carnet : Finances › Dépense,
lecture des justificatifs, opérations) contre le code actuel. Brasseur : le carnet doit être « éprouvé en ligne
et robuste ». Un défaut mal classé « corrigé » est une faute grave (L11) ; dans le doute : `en-ligne`.

## Où
- Code à juger (LECTURE SEULE) : `C:/Users/mrspa/.codex/worktrees/openai-clean-start/port-carnet`
  (branche `claude/port-carnet-1711`, HEAD 4daf08e98). Version en ligne = tag `en-ligne/2026-11-19-tour2`
  (ancêtre de HEAD ; seul 4daf08e98 n'est pas en ligne, fiches du stock, hors carnet).
  Commandes git permises : `git -C <port-carnet> log/show/grep/blame/merge-base`. Interdit : checkout, stash,
  reset, commit, toute écriture dans port-carnet, `npm`, navigateur, `functions/.env`.
- Rapports sources (texte complet des constats, captures) : dans ce dépôt (`Brasserie`), `work/missions/2026-11-17-port-carnet/`
  (CRITIQUE-7.md, CRITIQUE-8.md, en-ligne-1..4/RAPPORT.md), `work/missions/2026-10-31-ecran-depense/`, et la colonne
  « état/note » de `work/missions/BUGS.md` (ne PAS modifier BUGS.md).
- Écrans du carnet : surtout `src/ui/finance/` (ExpenseSheet, carnet, opérations), `src/domain/finance/`, `src/services/`
  (lecture IA, controlesCroises). Trouver par `git grep` sur les mots du constat (libellés à l'écran).

## Verdicts (un par ligne du lot, sans exception)
- `corrige` : le défaut n'existe plus au tag. Preuve = commit qui l'a corrigé (`git log -S`/`-G`/`-L`) + fichier:ligne
  actuel. Dire si le commit est ancêtre du tag (`git merge-base --is-ancestor <c> en-ligne/2026-11-19-tour2`).
- `present` : encore là. Preuve = fichier:ligne + une phrase sur la cause.
- `obsolete` : composant ou écran refait/supprimé, le constat ne peut plus se produire. Raison précise.
- `doublon` : même défaut qu'un autre id (le nommer).
- `en-ligne` : seul un rendu ou un geste dans l'app peut trancher (mise en page, visuel, donnée en ligne). Donner dans
  `rejeu` le parcours en une ligne (onglet, geste, ce qu'on doit voir).
- `ia` : dépend d'une réponse de Gemini. Dire dans `rejeu` si le comportement de l'app sur la réponse est testable par une
  réponse enregistrée (fixture du banc : `git -C <port-carnet> grep -l` dans `tests/`, `work/missions/*banc*`) ou non.

Champs : `gravite` (B = donnée/montant/TVA faux ou perdu, geste impossible ; G = gênant ; D = détail) et `geste`
(true si touche données, montants, TVA ou le geste principal : saisir une dépense, confirmer, justificatif).

## Méthode et plafond
Grouper : un `git grep` couvre plusieurs lignes ; ne pas relire un fichier déjà lu. Plafond : 100 tours ; au-delà,
rendre ce qui est fait avec `en-ligne` pour le reste, jamais vide.

## Livrable (seule écriture permise : `voies/<lot>/`)
- `voies/<lot>/TRI.json` : tableau `{id, ligne, verdict, preuve, raison, gravite, geste, rejeu}` ; autant d'entrées que de
  lignes du LOT.md (contrôle : `node -e` qui compare les ids).
- Réponse finale en une ligne : `<lot> : N lignes — x corrige, y present (z geste), …`.
- `LEÇON PROPOSÉE : …` ou `CONNAISSANCE : …` en fin de réponse si utile.
