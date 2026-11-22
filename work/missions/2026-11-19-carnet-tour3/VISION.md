# Voies v1, v2 — rejeu par la vision en local, mission 2026-11-19-carnet-tour3

Pourquoi en local : en ligne, aucun carnet n'existe et en créer un passe par Gemini (interdit) ; la fenêtre de Chrome est à
2560 px et l'app refuse l'iframe (voies/e1/RESULTAT.md). Ces constats viennent du banc local du 18.11 : on les rejoue là.

- Code : `C:/Users/mrspa/.codex/worktrees/openai-clean-start/port-carnet`, HEAD de `claude/port-carnet-1711` (contient les
  correctifs f1/f2 du jour). LECTURE SEULE : aucun fichier de code modifié, ni stash, ni checkout.
- Outil : skill `webapp-testing` (dépôt Brasserie `.claude/skills/webapp-testing/SKILL.md`, puppeteer-core, Chrome sans écran).
  App en `?dev-local` (IA simulée, aucune donnée réelle, jamais Gemini). Port imposé : v1 = 5181, v2 = 5182 ; serveur arrêté à la fin.
- Tailles : 390×844 tactile (émulation mobile, toucher) ET 1280×800 ; thème clair et sombre quand le constat porte sur une
  couleur, un contraste ou un bloc. Chaque capture ouverte (Read de l'image) avant de juger (L12) ; captures dans `voies/<v>/captures/`.
- Pour chaque ligne de `voies/<v>/LIGNES.md` : jouer le parcours (colonne rejeu, sinon le constat), regarder, classer
  `present` (ce qu'on voit, mot pour mot, capture) / `corrige` (ce qu'on voit, capture) / `obsolete` (l'écran n'existe plus) /
  `ouvert-gemini` (seule une vraie réponse Gemini peut le montrer).
- Question ouverte en plus, sur chaque écran du carnet traversé : « combien et quels problèmes ? » (liste numérotée, défauts neufs).
- Livrable : `voies/<v>/RESULTAT.md` tenu au fil, une ligne par id : `id | verdict | observé (≤ 25 mots) | capture | taille`, puis
  « Défauts neufs » numérotés. Plafond 120 tours ; à 200 k : `REPRISE : <fichier>`. Réponse finale : une ligne.
- Aide : la voie f2 a un script de captures prêt (`voies/f2/captures.mjs`, banc `?preview=carnets`, journal `voies/f2/captures/journal.txt`) :
  le reprendre (copie dans ta voie, autre port) plutôt que d'en écrire un. Le banc sert pour les états ; le parcours réel se juge
  dans l'app (`?dev-local`, Stocks › Matériel › carnets) au moins une fois par écran (L11 : un banc ne contourne aucun geste).
- Écrans corrigés aujourd'hui à regarder en plus : voir `voies/f2/RESULTAT.md` (PCN non capturés : 100, 133…).
