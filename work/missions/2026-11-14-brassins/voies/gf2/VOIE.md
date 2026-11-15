# Voie gf2 — La fiche en fermentation : trois genres nets, corrigés

- Mission : 2026-11-14-brassins · Agent : concepteur · Modèle : opus (Fable interdit) · Niveau : conception · Plafond : 40 tours · Dépend de : revue-page5 · Décideur : brasseur (il choisit sur la page)

## Objectif
Ses mots (15.11) : « s4a Tableau de cuverie, fiche dépliée s4a — s6c Conduite de z1, houblons en colonnes s6c — Dans l'idéal mais
s4a est beaucoup trop chargé. Mais j'aime bien le graph sur le temps », puis sur la page : « Toujours pas très clair ». gfa, gfb, gfc se
ressemblent (mêmes pièces réordonnées) ; gfb sort. Garder trois genres nets : gfa = empiler (le graphe en haut, les houblons dessous),
gfc = relier (les houblons pendus à leur jour, J+6), gfd = ouvrir le jour (le jour J+6 s'ouvre À CÔTÉ du graphe, sans le masquer).

## Entrées
- La revue : `work/missions/2026-11-14-brassins/revue-page5/critique.md` (§ A, les points cités), `work/missions/2026-11-14-brassins/revue-page5/ux-ui.md` (sections des variantes), `work/missions/2026-11-14-brassins/revue-page5/brasseur.md`, `SYNTHESE.md`.
- Les variantes : `work/missions/2026-11-14-brassins/voies/gf/gfa/`, `work/missions/2026-11-14-brassins/voies/gf/gfc/`, `work/missions/2026-11-14-brassins/voies/gf/gfd/` (`etat.html`, PNG, `NOTE.md`) ; `capture.mjs` de la série : `work/missions/2026-11-14-brassins/voies/gf/capture.mjs`.

## Possède (seuls chemins où écrire, avec RESULTAT.md)
- `work/missions/2026-11-14-brassins/voies/gf/gfa/`, `work/missions/2026-11-14-brassins/voies/gf/gfc/`, `work/missions/2026-11-14-brassins/voies/gf/gfd/` et `work/missions/2026-11-14-brassins/voies/gf2/` (`RESULTAT.md`, `tests.txt`). gfb reste tel quel (retiré de la page). Rien dans `src/`.

## Consignes
- Partout (critique 1 à 3, 7, ux-ui gf) : la DO de départ (1,062, J+0) visible à 390 ; dans le graphe, la ligne °C cuve jour par jour
  et le signe de FG stable (« 2 relevés égaux ○=○ ») repris de s4a (`work/missions/2026-11-14-brassins/voies/s4/s4a/etat.html`) ; l'α du lot réservé, pas la plage du
  catalogue (si s4a/s6c n'ont pas l'α du lot : `grep -n -i "α\|alpha" work/missions/2026-11-14-brassins/DONNEES-COMMUNES.md work/missions/2026-11-14-brassins/BRIEF-AUTEUR.md`, sinon « α du lot — ») ;
  une mesure absente se dit « non mesurée » ; retirer « Quand ajouter ? » ; la date dite une fois.
- gfa (4) : à 1280, la place sous le graphe exploitée (houblons ou tâches à côté).
- gfc (8) : la colonne « aujourd'hui » légendée, distincte de la bande FG.
- gfd (9, 10) : la bulle ne cache plus la prévision J+6 → J+10 ni l'arrivée dans la bande FG ; après le geste, les cartes gardent arômes et α.
- gfd (11) : vérifier la phrase « l'axe à pas variable fausse la pente » sur la capture ; si faux, la retirer de NOTE.md.
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
`work/missions/2026-11-14-brassins/voies/gf2/GATES.md`, depuis la racine du dépôt. Ne pas le modifier.

## Rendre
- `RESULTAT.md` tenu au fil (tous les 5 éléments) ; vers 150 k de contexte, finir les images en cours et rendre « REPRISE : RESULTAT.md ».
- La ligne « Tests » écrite dans un fichier : aucune suite Vitest (rien dans `src/`) ; `tests.txt` porte la sortie des CHECK.
- Voie d'écran : captures 390 tactile et 1280, clair et cave, toutes ouvertes (Read) avant de cocher.
- Fable interdit sous toute forme. Ni commit ni stash. Fichiers de travail : ton OWNS ou `os.tmpdir()` préfixés de l'id de la voie.
Réponse finale au pilote : une ligne.
