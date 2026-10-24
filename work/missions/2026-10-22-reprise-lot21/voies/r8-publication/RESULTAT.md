OK — lot 22 écrit : lot22.json (16 images, 7 puces) et section t119-lot22 en tête de la copie locale ; non publié.

Fichiers écrits :
- C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie/work/refonte-frontend/v4/outils/page-nuit/faire-lot22.mjs (nouveau)
- C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie/work/refonte-frontend/v4/outils/page-nuit/lot22.json (nouveau)
- C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie/work/refonte-frontend/v4/outils/page-nuit/site/index.html (ajout : section t119-lot22 après le nav, lien d'ancre en tête du nav)
- C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie/work/refonte-frontend/v4/outils/page-nuit/site/img/ (16 images ajoutées, numéros 164 à 179)
- C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie/work/missions/2026-10-22-reprise-lot21/voies/r8-publication/RESULTAT.md

Critères :
- G1 : `node work/refonte-frontend/v4/outils/page-nuit/faire-lot22.mjs` → « lot22.json · 16 images » (attendu : lot22.json · 16 images) — OK
- G2 : `LOT22 OK` — OK
- G3 : `SECTION OK` — OK

Vérifications hors critères :
- ajouter-lot.mjs lancé une seule fois. Sauvegarde de la page avant ajout : C:/Users/mrspa/AppData/Local/Temp/claude/C--Users-mrspa--codex-worktrees-openai-clean-start-Brasserie/6bed03f4-a8d6-468f-8115-deafa40df0cf/scratchpad/index-avant-r8.html
- Diff contrôlé : hors la section et le lien d'ancre, l'ancien texte de la page est intact.
- Les 16 images ont été listées, leurs chemins vérifiés ; je n'ai pas ouvert les captures une à une, le rendu n'est pas regardé ici.

Essais utilisés : 1 par critère (G1, G2, G3 passés du premier coup).

Ce qui reste douteux :
- Tous les fichiers de sortie (lot22.json, site/index.html, site/img/, faire-lot22.mjs) sont sous `/work/refonte-frontend/**`, ignorés par .gitignore. Ils existent sur disque mais ne sont pas versionnés ; faire-lot22.mjs apparaît en « ?? » dans git status, les autres pas.
- Le texte des puces et des légendes est copié tel quel du VOIE.md ; la mise en page n'est pas revue dans Chrome.
- Les trois dépendances (r5, r6r, r4cr) ont un RESULTAT.md « OK » ; leur contenu n'a pas été rejoué.
- Publication non faite (le pilote publie).

CONNAISSANCE : aucune
LEÇON PROPOSÉE : aucune
