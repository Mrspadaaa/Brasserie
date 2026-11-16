OK — Page neuve des 12 variantes écrite à la main, PAGE OK, contenu OK.

Fichiers écrits :
- work/missions/2026-11-14-brassins/page2/index.html (écrit à la main, Write)
- work/missions/2026-11-14-brassins/page2/img/ (39 PNG copiés : 37 variantes s4 à s7, plus ref-fiche.png et ref-liste.png)
- work/missions/2026-11-14-brassins/voies/pg2/tests.txt
- work/missions/2026-11-14-brassins/voies/pg2/verif-haut.png, verif-page.png, verif-ordinateur.png (captures du verifier)

Critères :
- G1 : `node scripts/agents/verifier-page.mjs work/missions/2026-11-14-brassins/page2/index.html --page-lot --captures work/missions/2026-11-14-brassins/voies/pg2/verif` → `PAGE OK (39 images chargées, lisible à 390 et 1280 px, sans erreur)`, exit 0.
- G2 : `CONTENU OK 40/37` (12 identifiants présents, `id="a-choisir"` présent, pas de « fable », 40 data-vignette pour 37 PNG de variantes), exit 0.

Captures ouvertes : haut, page entière et ordinateur. On voit la phrase-réponse en tête, les quatre genres en rangées, trois variantes par genre, chaque vignette légendée, sans débordement visible. Les textes restent lisibles à 390 ; en 1280, les vignettes font six colonnes.

Essais utilisés : 1 pour G1, 1 pour G2 (aucun échec).

Ce qui reste douteux :
- Les « phrases probables » sont les phrases prédites par la critique (c4a, c4b), pas des propos du brasseur ; la page le dit dans le libellé « Phrase probable ».
- Les classements sont par lot : 4a (s4, s5) et 4b (s6, s7) ont chacun leur 1 à 6, non comparables entre eux.
- Les noms en mots sont résumés de la ligne « Idée » de chaque NOTE.md (6 mots au plus) ; ce sont mes condensés, à relire.
- Le contrôle de lisibilité ne mesure pas le rendu visuel réel de chaque vignette : les captures ont été ouvertes, pas jugées une à une.

CONNAISSANCE : aucune
LEÇON PROPOSÉE : aucune
