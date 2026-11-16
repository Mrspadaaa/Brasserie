# Voie g62 — Retrouver et filtrer : deux lectures de e6a × e6c, corrigées

- Mission : 2026-11-14-brassins · Agent : concepteur · Modèle : opus (Fable interdit) · Niveau : conception · Plafond : 35 tours · Dépend de : revue-page5 · Décideur : brasseur (il choisit sur la page)

## Objectif
Ses mots (15.11) : « e7a — e6a — e6c Des filtres qui comptent — », puis sur la page : « Toujours pas très clair ». e6a est SON choix :
sa tête « 2 en cuve / 1 à brasser » et ses étiquettes courtes (NEIPA, APA) restent telles quelles (règle n° 1). g6c sort.

## Entrées
- La revue : `work/missions/2026-11-14-brassins/revue-page5/critique.md` (§ A, les points cités), `work/missions/2026-11-14-brassins/revue-page5/ux-ui.md` (sections des variantes), `work/missions/2026-11-14-brassins/revue-page5/brasseur.md`, `SYNTHESE.md`.
- Les variantes : `work/missions/2026-11-14-brassins/voies/g6/g6a/`, `work/missions/2026-11-14-brassins/voies/g6/g6b/` (`etat.html`, PNG, `NOTE.md`) ; `capture.mjs` de la série : `work/missions/2026-11-14-brassins/voies/g6/capture.mjs`.

## Possède (seuls chemins où écrire, avec RESULTAT.md)
- `work/missions/2026-11-14-brassins/voies/g6/g6a/`, `work/missions/2026-11-14-brassins/voies/g6/g6b/` et `work/missions/2026-11-14-brassins/voies/g62/` (`RESULTAT.md`, `tests.txt`). g6c reste tel quel (retiré de la page). Rien dans `src/`.

## Consignes
- g6a (critique 12 à 14, ux-ui g6a) : étiquettes NEIPA, APA de e6a (`work/missions/2026-11-14-brassins/voies/e6/e6a/etat.html`), sans redite ; la puce « Tous 5 » revient ;
  une seule rangée de puces (états, Favoris et styles réunis ou repliés) ; la première carte au tiers de l'écran comme e6a ; un seul mot pour
  un état (Terminé ou Écoulée, celui de l'app : `grep -n "Écoulé\|Terminé" src/components/production/*.tsx | head`) ; « Tout voir 5 × » clair.
- g6b (15, ux-ui g6b) : à vide, la tête ne contredit plus le résultat ; « Retire un mot » remplacé par un geste clair ; la phrase sur deux
  lignes (22 px, puis 14 px) ; un indice de toucher sous chaque terme ; « Nov. + en cours » dans la rangée du tri ; les styles visibles.
- Pour chaque variante corrigée, régénérer TOUTES ses images (mêmes noms) et ouvrir chacune (Read) avant de cocher.
- `RESULTAT.md` : une ligne cochée `- [x] <id> n° <k> : <correction faite>` par point ; ce qui n'a pu l'être, dit et pourquoi.

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
`work/missions/2026-11-14-brassins/voies/g62/GATES.md`, depuis la racine du dépôt. Ne pas le modifier.

## Rendre
- `RESULTAT.md` tenu au fil (tous les 5 éléments) ; vers 150 k de contexte, finir les images en cours et rendre « REPRISE : RESULTAT.md ».
- La ligne « Tests » écrite dans un fichier : aucune suite Vitest (rien dans `src/`) ; `tests.txt` porte la sortie des CHECK.
- Voie d'écran : captures 390 tactile et 1280, clair et cave, toutes ouvertes (Read) avant de cocher.
- Fable interdit sous toute forme. Ni commit ni stash. Fichiers de travail : ton OWNS ou `os.tmpdir()` préfixés de l'id de la voie.
Réponse finale au pilote : une ligne.
