# Voie e8n — Le carnet de recettes, compact pour des dizaines

- Mission : 2026-11-14-brassins · Agent : concepteur · Modèle : opus (Fable interdit) · Niveau : conception · Plafond : 45 tours · Dépend de : — · Décideur : brasseur (il choisit sur la page)

## Objectif
Ses mots (15.11), mot pour mot : « Le carnet de recettes, pas très compact, pas super convaincu quand il y aura des dizaines de recette »,
et « e8 · Le carnet de recettes j'ai déjà donné mon avis la dessus ». Les 4 versions e8a à e8d sont refusées. Faire 4 carnets compacts qui
tiennent 30 à 40 recettes : retrouver vite (recherche, tri, regroupement), lignes denses, l'historique des lots et la comparaison à un toucher.

## Entrées
- Les refusées (Read, repos une fois) : `work/missions/2026-11-14-brassins/voies/e8/e8[a-d]/` et `work/missions/2026-11-14-brassins/voies/k2/VERDICT.md` § e8.
- Ce que fait l'app : sous-onglet Recettes (`src/components/tabs/ProductionTab.tsx`, `grep -n "Recettes\|RecipeCard" -r src/components | head`).
- La fiche et l'édition de recette sont d'une autre session : on y renvoie.
- Données : les 5 recettes réelles de DONNEES-COMMUNES (NEIPA, Pale Ale, Pils, Stout, Saison) gardent leurs chiffres ; ajouter 30 recettes
  d'exemple plausibles (noms, styles, alcool, nombre de lots, dernier lot), dites « recettes d'exemple pour la densité » dans NOTE.md.
- Gabarit de capture : `work/missions/2026-11-14-brassins/voies/e8/capture.mjs`.
- Revue de la page précédente (pourquoi « pas très clair ») : `work/missions/2026-11-14-brassins/revue-page5/SYNTHESE.md`, puis `critique.md` § B.

## Possède (seuls chemins où écrire, avec RESULTAT.md)
- `work/missions/2026-11-14-brassins/voies/e8n/` : `e8na` à `e8nd` (`etat.html`, PNG, `NOTE.md`), `capture.mjs`, `RESULTAT.md`, `tests.txt`. Rien dans `src/`.

## Consignes
- 1 froide (l'actuel rendu compact), 2 tièdes, 1 chaude ; aucune ne reprend une forme refusée (cartes, frise sur l'année, duel, étagère).
- Au repos à 390 : au moins 10 recettes lisibles au premier écran. `geste` : après une recherche tapée (« IPA ») ; `historique` : les lots
  d'une recette ; `comparer` : deux recettes côte à côte ; `vide` : carnet vide.
- Images par variante : `<id>-repos-390-clair.png`, `<id>-geste-390-clair.png`, `<id>-historique-390-clair.png`, `<id>-comparer-390-clair.png`, `<id>-vide-390-clair.png`, `<id>-repos-390-cave.png` ; la meilleure ajoute `<id>-repos-1280-clair.png`. Ouvrir chaque image (Read) une fois.
- D'abord, dans RESULTAT.md, en 5 lignes : ce qu'il a dit, ce qu'on en lit, les 4 genres choisis et en quoi ils diffèrent au repos.

## Exigences transversales et acquis (recopiés, leçons L05 et L06)
- Identité de l'app : trousse `work/missions/2026-11-14-brassins/outils/identite/` (LISEZMOI.md d'abord) ; `node work/missions/2026-11-14-brassins/outils/controle-identite.mjs <dossier>` → IDENTITE OK.
- Saisie au curseur (m2), jamais `type="number"` ; chiffres à la virgule ; inconnu dit en mots (« non mesurée »), jamais un chiffre inventé ;
  cibles ≥ 44 px ; clair et cave ; 390 tactile et 1280 ; données de `work/missions/2026-11-14-brassins/BRIEF-AUTEUR.md` § Les chiffres et `work/missions/2026-11-14-brassins/DONNEES-COMMUNES.md`.
- Premier plan actionnable, pas de cockpit ni de code interne ; une information dite une fois (la revue du 15.11 a compté 2 à 5 redites par écran).
- Plancher à enrichir (L07). Classes et globales JS préfixées par l'id de la variante (L26).
- Page « pas très clair » (15.11) : chaque variante doit se distinguer des autres AU REPOS, à 390, en un coup d'œil (« toutes les
  propositions se ressemblent » : refus connu). `NOTE.md` porte quatre lignes : « Chaleur : », « Idée : » (nom en 6 mots au plus),
  « Ce qui change : » (15 mots au plus, en mots de brasseur, sans code de variante), « Geste : » (le geste montré par l'image geste,
  nommé : « après "Planifier" », « après Citra coché »).

## Critères
`work/missions/2026-11-14-brassins/voies/e8n/GATES.md`, depuis la racine du dépôt. Ne pas le modifier.

## Rendre
- `RESULTAT.md` tenu au fil (tous les 5 éléments) ; vers 150 k de contexte, finir les images en cours et rendre « REPRISE : RESULTAT.md ».
- La ligne « Tests » écrite dans un fichier : aucune suite Vitest (rien dans `src/`) ; `tests.txt` porte la sortie des CHECK.
- Voie d'écran : captures 390 tactile et 1280, clair et cave, toutes ouvertes (Read) avant de cocher.
- Fable interdit sous toute forme. Ni commit ni stash. Fichiers de travail : ton OWNS ou `os.tmpdir()` préfixés de l'id de la voie.
Réponse finale au pilote : une ligne.
