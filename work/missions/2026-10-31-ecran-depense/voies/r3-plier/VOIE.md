# Voie r3-plier — « tout plier, déplier » sur son choix D : une page de choix en mini maquettes (D307)

Agent : `concepteur` (Opus). Plafond : 50 tours. Critique Fable après la voie, puis le pilote publie (page neuve). Aucun code de l'app modifié,
aucun commit, aucun déploiement, aucun serveur Vite dans le dépôt. Possède : `work/missions/2026-10-31-ecran-depense/choix-plier/**`.
Avant : `.claude/rules/affinee-frontend.md`, `DESIGN.md`, `docs/ui-compacte.md` (parties utiles) ; skills `boosters-ux`, `impeccable`.
Reprends la forme et l'outillage de `choix-sousfamilles/` (index.html, `outils/gen.mjs`, `outils/sf.css`, feuille compilée de l'app, visionneuse)
et son verdict `critique/VERDICT-r2-sousfamilles.md` : ne refais pas ses défauts.

## Ses mots (SPEC, 02.11, mot pour mot)
« J'aime beaucoup D mais il faudrait pouvoir facilement tout plier, déplier »

## La question (un seul facteur, L10)
Sur D (sa maquette, retouche e-t12 comprise : `choix-sousfamilles/maquettes/d-*.html`), **où et comment plie-t-il ou déplie-t-il tous les
sous-groupes d'un coup ?** Seul varie ce geste et ce qu'il montre. D reste tel quel : ligne de sous-famille, toucher qui ouvre un groupe,
ligne à vérifier ouverte d'office, sous-groupe d'une ligne sans chevron.

## Les options (A est la référence ; 3 à 5 en tout ; tu peux en proposer une, en le disant comme ton avis)
- **A — D tel quel** (`data-reference`) : un groupe à la fois.
- Des pistes à explorer, sans t'y limiter : un geste sur l'en-tête de bande (cette bande seulement) ; un contrôle unique pour toute la
  dépense (près des bandes, ou dans le pied à côté de « Catégorie | Papier ») ; « Catégorie » touché une seconde fois qui bascule plié / déplié.
Le geste doit se trouver sans mode d'emploi, ne pas ajouter de cockpit (`cerveau/brasseur/pas-de-cockpit.md`), ne pas chevaucher une autre
commande (DESIGN.md), et dire son état (plié ou déplié) sans paragraphe.

## Les vues de chaque option
1. Tout plié (pièce fictive « Brico Fictif SA » de D, plus une bande Nettoyage) à 390 px, défilée jusqu'aux bandes.
2. Tout déplié, même cadrage.
3. Un état mêlé (un groupe ouvert à la main) : ce que fait le geste depuis là.
Clair pour toutes, sombre pour la vue 1.

## La forme de la page et les contrôles
`choix-plier/index.html`, maquettes HTML à 390 px capturées en PNG (`img/`), valeurs et fournisseurs fictifs (aucune valeur de ses pièces).
1. `node work/refonte-frontend/v4/tournoi/outils/controle-page-choix.mjs work/missions/2026-10-31-ecran-depense/choix-plier/index.html --min=3` → `PAGE-CHOIX OK`.
2. `node scripts/agents/verifier-page.mjs work/missions/2026-10-31-ecran-depense/choix-plier/index.html --page-lot --captures work/missions/2026-10-31-ecran-depense/choix-plier/controle` → `PAGE OK` ; ouvre chaque capture (L12).
3. La vue « tout plié » de A est identique au pixel à `choix-sousfamilles/img/d-renovation.png` hors groupe ouvert (mesure, L03).
4. `controle-choix` : l'écran Dépense n'est pas dans `ecrans.json` ; le dire dans RESULTAT.

## Retour
`choix-plier/RESULTAT.md` (options, mesures, captures ouvertes, doutes ; `LEÇON PROPOSÉE : …`), puis une ligne
`R3-PLIER OK — <n> options — choix-plier/index.html` ou `R3-PLIER ECHEC — <raison>`.
