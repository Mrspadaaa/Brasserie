OK — s2bp2, s1bp2, s2ap2 corrigées : ‹ › gardés en plage, « hors plage » placé, v6a au repos

## Par candidate (défauts du critique, greffes, images ouvertes)
- **s2bp2** : défauts 1 à 3 corrigés (‹ › dans la pilule de plage, glissent de 15 j ; pied de feuille « 15 jours · 5 opérations · à payer 0,00 · dépensé 296,80 · hors plage loyer du 25 · 400,00 » ; pilule bleu clair, plus noire). Greffes : raccourcis « 1er – 15 · 16 – 30 · mois passé », « 1er », IA « Pourquoi le brassage pèse autant ? ». Images ouvertes : feuille, après (repos : v6a + ▦, inchangé depuis la v0, recapturé en page entière).
- **s1bp2** : défauts 1 à 5 corrigés (« 1er » ; bornes 32 px dans une pilule de 36 px, zone de toucher 44 px ; ligne « hors plage » sous Charges fixes, pastille du bas retirée ; bulle « du … au : touche une date » au premier toucher ; durée « 15 j · 5 opérations » et pastille « en retard » en ligne 2, donc à cheval tient). Greffe : aperçu des flèches à l'appui (« lâcher : ‹ 17 → 31 oct. »), image en plus. Images ouvertes : geste, après, appui.
- **s2ap2** : défauts 1 à 4 corrigés (frise repliée au repos, icône 14 px dans la pilule ; poignées rondes à bord épais, avec la bulle « 1er → 15 nov. » quand on les tient ; à cheval « 15 oct. → 10 nov. », 27 jours, « du 15 au 31 oct. · aucune opération saisie », sans point ni barre en octobre ; barres déjà à l'échelle, 28 contre 34 px, le point vert de la vente descendu sur l'axe). Greffes : ‹ › glissent la plage (pilule teintée, plus de « novembre » contradictoire), repères des lundis. Images ouvertes : repos, glisser, après, à cheval.

## Fichiers écrits (tous dans voies/p2a)
- `s2bp2/`, `s1bp2/`, `s2ap2/` : etat.html, NOTE.md, PNG (390 px, échelle 2)
- `fonts/` : copie de s2/fonts, pour les polices locales
- `outils/passe2.mjs` : construit les trois candidates depuis les v0, par split/join (L26), et peut se rejouer
- `outils/capturer.mjs` : captures et contrôle des débords
- `tests.txt`

## Critères (rejoués depuis la racine)
- G1 `controle-serie.mjs … s2bp2,s1bp2,s2ap2` → `SERIE OK`
- G2 s2bp2 → `PAGE OK (1 images chargées, 390 px, sans erreur)`
- G3 s1bp2 → `PAGE OK (1 images chargées, 390 px, sans erreur)`
- G4 s2ap2 → `PAGE OK (1 images chargées, 390 px, sans erreur)`
- Captures : 0 erreur, 0 débord hors 390 px.
- Tests : `tests.txt` = SERIE OK. Ce sont des maquettes statiques, sans Vitest.

## Captures
- C:\Users\mrspa\Documents\Brasserie\.claude\worktrees\festive-wilbur-d80f3a\work\missions\2026-11-14-finances\voies\p2a\s2bp2\s2bp2-repos.png, s2bp2-feuille.png, s2bp2-apres.png
- C:\Users\mrspa\Documents\Brasserie\.claude\worktrees\festive-wilbur-d80f3a\work\missions\2026-11-14-finances\voies\p2a\s1bp2\s1bp2-repos.png, s1bp2-geste.png, s1bp2-apres.png, s1bp2-appui.png
- C:\Users\mrspa\Documents\Brasserie\.claude\worktrees\festive-wilbur-d80f3a\work\missions\2026-11-14-finances\voies\p2a\s2ap2\s2ap2-repos.png, s2ap2-glisser.png, s2ap2-apres.png, s2ap2-acheval.png

## Prédiction
« Là je garde mes flèches même avec mes dates, et je vois que le loyer est juste sorti, pas disparu. »

## Limites
- Thème cave et 1280 px non capturés : la voie demandait 390 clair seulement.
- Le lanceur `impeccable context` n'a pas été lancé. Les règles locales des trois skills chargés (boosters-ux, impeccable, ui-design-system) ont été suivies.
- Dans s1bp2, en plage seulement, la pastille « en retard » descend d'une ligne. C'est un écart voulu, écrit dans la NOTE ; le repos reste v6a tel quel.

DÉCISION À PRENDRE : aucune
CONNAISSANCE : aucune
LEÇON PROPOSÉE : aucune
