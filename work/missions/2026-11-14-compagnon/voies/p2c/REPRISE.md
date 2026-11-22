# Reprise de la voie p2c (contexte du concepteur à 176 k, arrêt avant 200 k)

## Fait
- Skills chargés : boosters-ux, impeccable (craft-floor lu), ui-design-system. Entrées lues : VOIE, GATES, DOSSIER, s2d (source, NOTE, capture), SYNTHESE (s2d, greffes, défauts communs), captures e12, e14, e16, e17.
- Outils copiés et adaptés dans `p2c/outils/` : `commun.mjs` (jetons + `--passe`, `--fintx`, `--finbg` ; icônes ajoutées ; rangées en flex-wrap ; cadre bureau 1280 ; `FOND_FIN` ; typographie française : espace insécable avant « : ; ? ! » et entre nombre et unité), `construire.mjs` (construit, capture clair et cave, mesure par cadre : débordement, chevauchements des marques `data-m` de la frise, vide en bas du `data-fil` ; recadrages par rangée vers un dossier passé en argument).
- `p2c/source.mjs` écrit : 12 cadres (accueil, attente, reponse, erreur, urgent, fournisseurs, finances, conversations, plafond, limites, zero, bureau). `etat.html`, `p2c-clair.png`, `p2c-cave.png` produits ; build sans erreur ni réseau.

## Commande de construction (racine)
`node work/missions/2026-11-14-compagnon/voies/p2c/outils/construire.mjs <dossier-recadrages-hors-dépôt>`

## Dernière mesure (à corriger)
- Vide en bas > 120 px : accueil 136, attente 132, conversations 210, plafond 200, limites 245, zero 138, bureau 213 (fournisseurs 116, erreur 105 : limites).
  Pistes : accueil, ajouter la rangée « Gestes à venir » cochables (J+2 Citra 85 g, J+4 densité, J+6 Galaxy 43 g) ou le rappel daté ; attente, ligne « Me notifier » ; conversations, rangées de 64 px + phrase d'état ; plafond, rappel « J+4 densité » au journal ; limites, `.§-bloc` plus aérés ou ligne « Questions par mode » ; zero, aperçu plus long ; bureau, journal plus long (J+0 brassage 19 L) et panneau : rappel.
- Chevauchement urgent : libellé « 85 » (Citra J+2) touche l'épingle thermomètre d'aujourd'hui (J+1,5) → passer `auj` à 1.3 pour le cadre urgent ou baisser l'épingle.
- Débordement horizontal : accueil 1 élément (probablement la rangée `.§-amorces` ou `.§-lim`), conversations 3 (rangée de statut ou `.§-menu`) → vérifier sur les recadrages.
- Captures pas encore regardées (L12) : à ouvrir, clair et cave, rangée par rangée, puis les deux pages entières.

## Décisions de données prises (à écrire dans RESULTAT, DÉCISION À PRENDRE)
- Jour d'accueil, attente, erreur, plafond, zéro : J+1 (36 h), pas J+4 : la question 1 dit « depuis 36 h », sa réponse parle du Citra de J+2 et de « Densité à J+4 : vers 1,020 », incompatibles avec J+4 et « DF 1,012 relevée ». La question suggérée « DF 1,012 : la levure a fini ? » devient « Densité à J+4 : la levure a fini ? ».
- Réponse et bureau à J+8 ; fournisseurs à J+4 ; urgent à J+1.
- « Brassin 31 · Blonde de garde » devient « Brassin 30 · Blonde de garde » (le brassin 31 est la NEIPA).
- Réponse info de la question 1 montrée dans l'aperçu grisé du cadre zero.

## Reste à faire
1. Corriger les points ci-dessus, reconstruire, ouvrir les 8 recadrages (scratchpad) puis les deux pages.
2. `NOTE.md` (14 lignes au plus) dans `p2c/p2c/` : idée, chaleur froide (passe 2), boosters, greffes prises, écarts.
3. Lancer G1 (`controle-serie.mjs … p2c --complet` > `tests.txt`) et G2 (`verifier-page.mjs …/p2c/etat.html`).
4. `RESULTAT.md` : ligne 1, un cadre par ligne, sorties, prédiction, DÉCISION À PRENDRE (données ci-dessus), CONNAISSANCE, LEÇON PROPOSÉE.
