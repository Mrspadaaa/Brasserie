OK — les ajouts nomment leurs vraies sources ; « 1 source » / « n sources » dit sous la liste des sources de la fiche ; moteur inchangé (Chrome au rejeu)

# B1 — étiquettes honnêtes et « 1 source » (option B, étape 1, D201)

## Ce qui change
- **I18 à I20.** `estBeerMaverick(c)` (id `beermaverick-*`) sépare les 317 variétés de base des ajouts. Une variété de base garde « Beer Maverick », sa page, ses dates.
  Un ajout n'a plus aucune étiquette Beer Maverick : sa plage porte le nom de sa source quand elle est seule (`sourceDeLAdresse(c.url)` : Hopslist, Brewer’s Friend,
  Charles Faram…), « enveloppe de n sources » (sans lien) quand `nbSources` ≥ 2. Ses liens de sources n'ont plus la ligne « Beer Maverick · nom » qui menait à
  Hopslist : la première adresse est posée sous son vrai nom ; avec les compléments (18 sources), chaque source se liste avec ce qu'elle apporte.
  `hopRef().alpha.from` : « plage variétale (Hopslist) » / « (enveloppe de 4 sources) » ; « (Beer Maverick) » inchangé pour la base.
  Aussi corrigés : la raison du farnésène (`hopSheet`) et celles de « cohumulone » et « géraniol » (« Pas dans les fiches »), qui nommaient Beer Maverick pour un ajout.
- **Confiance, un seul endroit.** Une ligne `[data-role="sources-confiance"]` sous la liste des sources de la feuille « Sources » de la fiche :
  « **1 source** : β, myrcène · **3 sources** : α, huile totale ». Valeurs réunies par compte, « 1 source » d'abord. Aucune mention ailleurs (carte, rail, Comparer,
  Substituer inchangés).
  - Comptage = sources **distinctes** : page Beer Maverick et fiche Hopsteiner du catalogue, plus les sources des compléments dont la valeur est dans l'enveloppe
    (la fiche Hopsteiner des compléments est celle du catalogue : une fois). Un ajout compte ses sources par les compléments ; sans eux (hors ligne), une variété à une
    seule source dit « 1 source », une variété à plusieurs ne dit rien (le compte par valeur serait inventé). Une valeur absente (« ? ») n'a pas de compte, jamais 0.
  - Le compte brut peut surestimer (v2 : plusieurs sources recopient la même plage) ; ici on compte les sources, comme la consigne ; compter les plages distinctes
    est une suite possible (B2).

## Fichiers écrits
`src/domain/hopIndex/v4/data.ts`, `src/domain/hopIndex/v4/fiches.ts`, `src/ui/hopIndex/fiche/sources.ts`, `src/ui/hopIndex/fiche/SourcesFiche.tsx`,
`src/ui/hopIndex/parcours/donnees.ts`, `tests/unit/hopIndexV4/etiquettesSources.test.tsx` (nouveau) ; dans la voie : `empreintes.ts`, `capture-fiches.mjs`, ce fichier.
`MarquesVue.tsx` : **non modifié** (voir la décision). Aucun JSON de données touché. Aucun commit.

## Critères
1. **Test rouge sur HEAD, vert ensuite.** `npx vitest run tests/unit/hopIndexV4/etiquettesSources.test.tsx` : sur HEAD (worktree jetable) `9 failed`, dont
   « 188 ajouts mal étiquetés » (« Ahil : Beer Maverick ; … Beer Maverick · Ahil ») et `plage variétale (Beer Maverick)` pour « Usda 200010 008 » ; après : `9 passed`.
2. **Empreintes** (`voies/b1-etiquettes/empreintes.ts`, catalogue plein de 505, HEAD pur contre HEAD + mes 5 fichiers de src, les deux dans un arbre jetable) :
   `substitutes_defaut 3765c251d6b65390`, `substitutes_60 0811fb9b96c005ea`, `proposer_21C 2885b01d3c5b7baa`, `proposer_21C_floral bbcca69b5b7606a9`,
   `proposer_16D bab334afc1e4981f` : **identiques**. `profils` change (f2f3b5c431176892 → 88ff806182dcae2d) à cause du seul libellé `from` recopié par
   `profil-simule.ts:421` ; `profils_hors_etiquette f8ad5c23ef6f6509` identique avant/après (le libellé « plage variétale (…) » neutralisé). Aucun chiffre ne bouge.
   Les voies t3 et c9 ne sont pas dans cette mesure (arbre HEAD) ; `moteurInchange.test.ts` (empreintes des variétés de base) est vert dans la suite.
3. `npx vitest run tests/unit/hopIndexV4 --maxWorkers=2` : **100 fichiers, 963 tests, vert** (arbre de travail, t3 et c9 compris). `npx tsc --noEmit` : sans sortie.
4. `controle-sources-une-fois.mjs` et la capture : **non lancés** (Chrome ; pas de serveur dans l'arbre principal) → DEMANDE EXECUTANT.
5. Captures : non prises (même raison).

Essais : un par critère (le test a passé du premier coup ; rouge confirmé sur HEAD).

## DEMANDE EXECUTANT :
Dans `C:/Users/mrspa/AppData/Local/Temp/atelier-ecrans`, après `git checkout` du commit de la voie (ou un arbre portant ces 5 fichiers de src) :
1. `node scripts/with_server.mjs --server "npm run dev -- --port 5251 --strictPort" --port 5251 --env VITE_HOP_V4=on -- node tests/integration/controle-sources-une-fois.mjs`
   → attendu `CONTROLE OK` (la section « Sources » garde le lien Beer Maverick pour Lotus ; hors de cette section, aucun nom de source).
2. `node scripts/with_server.mjs --server "npm run dev -- --port 5252 --strictPort" --port 5252 --env VITE_HOP_V4=on -- node work/missions/2026-10-25-integration-houblons/voies/b1-etiquettes/capture-fiches.mjs`
   → attendu `CAPTURE OK` ; fichiers `…/voies/b1-etiquettes/img/{lotus,fusion,krpan,krush}-sources.png`. Si « Fusion » ou « Krpan » ouvre une autre variété (la recherche
   prend le premier résultat), le dire : changer le nom ou la clé dans le script suffit.
3. Ouvrir les 4 images (L12) : la ligne grise sous les sources (« 1 source : α, β… »), « Beer Maverick » absent de Fusion/Krpan/Krush, présent pour Lotus ; la ligne ne déborde pas
   et ne gêne pas la liste.
Rapporter la sortie des deux scripts et un coup d'œil sur les images ; je juge ensuite.

## Doutes et limites
- La mise en page de la ligne de confiance n'est pas vue (pas de rendu) : jsdom prouve le contenu, pas l'apparence.
- `Comparer` (`comparer/valeurs.ts`, refs « BM ») et `substituer/donnees.ts:208` (`motsSource: 'Beer Maverick'`) nomment encore Beer Maverick pour des ajouts (I21, I22) : hors de
  mon périmètre listé (`valeurs.ts`, `sourcesMesures.ts` ne sont pas à moi) ; à voir en B2/B3. Non vérifié ici pour les ajouts.
- Fiche d'un ajout : le bloc « Beer Maverick » (`s.bm`, usage, styles, radar) était déjà absent (`bm` null) : rien à corriger.
- L'enveloppe d'un ajout à plusieurs sources montre « enveloppe de n sources » sans lien ; les liens de ces sources sont dans la liste du haut une fois les compléments arrivés
  (jusqu'à 800 ms, ou jamais hors ligne : seule la première adresse est alors listée).
- `nbSources` exclut Brewer’s Friend (index) ; un ajout à `nbSources: 0` est dit « 1 source » (Brewer’s Friend, α déclaré des recettes) : c'est vrai mais ce n'est pas une
  spécification de producteur (v2, § 2.3).
- Résidu : mon worktree jetable `…/.git/worktrees/b1-head` n'a pas pu être supprimé (Permission denied sur `git worktree prune`, dossier admin seul ; le dossier de travail
  temporaire est supprimé). Inoffensif ; `git worktree prune` à relancer plus tard.
- Rien d'autre dans `git status` n'est de moi (traduction.ts, pack-fiches.json, fils26-radar : d'autres voies).

DÉCISION À PRENDRE : « peu de données » (I23, `MarquesVue.tsx`). La voie dit à la fois « le texte est à changer » (audit) et « 1 source nulle part ailleurs que la ligne de sources de
la fiche » (D168). La marque « peu de données » vit sur la carte du rail, la ligne d'ajout et l'en-tête de la fiche. Options : (a) la laisser (choix fait ; son test `catalogueBranche`
l'attend) ; (b) la renommer « 1 source » : cela met « 1 source » à trois endroits de plus, contre D168 ; (c) la retirer et ne garder que la ligne de la fiche : le brasseur ne voit
plus d'un coup d'œil qu'une variété est mal documentée. Recommandation : (a) pour B1, et trancher (c) au moment où B2 retire le reculement `peuDeDonnees` (audit, décision n° 2).

CONNAISSANCE : `nbSources` (hors Brewer’s Friend) ne dit pas combien de sources portent *chaque* valeur : pour une variété ajoutée, le compte par valeur vient des compléments
(115 des 188 y sont) ; les 73 autres n'ont qu'une source ou aucune valeur. Un ajout n'a jamais eu de page Beer Maverick : `c.url` est la première de ses sources.

LEÇON PROPOSÉE : aucune.
