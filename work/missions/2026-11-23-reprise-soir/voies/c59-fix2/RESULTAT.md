# RESULTAT c59-fix2 (24.11)

## Plan (par règle : endroit → correctif)
- **c48 R4** (régression c59-fix) : `nombreDit` (comparer.ts) ne lit plus que « un nombre et son unité » (« 2,6 m³ ») ; un triplet de dimensions (« 1640 x 1340 x 1850 mm »), une plage (« 0 °C à 8 °C ») ou une phrase à plusieurs nombres ne sont ni un écart ni une valeur à dire : le compromis ne recopie plus les dimensions du tableau. C58-4 / C59-3 (« 4,06 m³ au lieu de 2,6 m³ ») restent.
- **R36 (C59-4)** : `Colonne.genre` (mots du critère à cible hors nombre, unité et nom de la caractéristique : « marmite », « brassage ») ; `ordonnableCol(v, k, nomArticle)` ajoute `MALUS_HORS_GENRE` = 12 % de la cible à la distance d'un article dont le NOM ne reprend aucun mot de genre ; clés du tri (`trier`) et `domine`. Frigo 50 L pile (distance 0 + 6 = 6) derrière marmite 45 L (5) ; marmite « Maischekessel 50 L » (0 + 6) devant « Marmite … 60 L » (10) ; frigo 242 L loin derrière. Pas de dictionnaire.
- **R37 (C59-7)** : un seul prix « ≈ » = le rendu estimé (celui de la pastille et de la cellule de Comparer, maquette B1, D421). Nouveau `prixUnique` (PrixPastille.tsx) utilisé par la fiche (en-tête et Offre : « ≈4 CHF rendu ») ; TableauCarnet : la colonne du prix dit le rendu et non le converti seul. La carte (`CarteArticle`, `PrixTexte`) garde le converti D447 (test carnetsPrixHorsFranc « ≈1 160 »).
- **R38 (C59-8)** : `nomAlpha` dans `valeursLuesDe` (comparer.ts, point commun carte, fiche, colonnes) : « Citra : 13,6 % » sur un article « Citra 13.6% » devient « Alpha 13,6 % » (seulement si le nom de la ligne ouvre le nom de l'article et que sa valeur est le % écrit dans ce nom) ; `rangDeDecision` met déjà « alpha » en tête.
- **R38 (C59-9)** : `functions/src/aromesFrancais.ts` (vocabulaire fermé allemand/anglais → français, l'inconnu reste tel quel, idempotent) ; lecture serveur : `enFrancais` (lienLibelles.ts) + nom « Arômes » ; affichage de la donnée déjà stockée : `valeursLuesDe`.

## Critères
- `tests.log` : c48Regles + c59Regles : tous verts (66 passés, 1 sauté d'origine).
- `tests-large.log` : tests/unit/c4*, c5*, carnets*, lien*, lire*, proprietes : 65 fichiers, 1383 verts, 3 sautés d'origine, 0 rouge.
- tsc racine : 2 erreurs, les 2 connues (seedData GanttTask, virtual:pwa-register). tsc functions : 0.
- Aucun test modifié. Aucun appel Gemini, aucun déploiement.

## Doutes et limites
- R36 « hors genre » est satisfait par une règle d'affinité de NOM, pas de genre réel : un article dont le nom ne reprend aucun mot du critère (« Maischekessel », en allemand) perd 12 % de la cible ; une marmite à 45 L nommée comme le critère passe devant un 50 L pile d'un autre nom. Un frigo à 47 L nommé « frigo » passerait aussi derrière ; un 52 L « Maischekessel » passerait devant « Marmite 50 L » à égalité de malus : à juger en ligne. Le rang PAR COLONNE (« 1er pour le volume ») reste la proximité pure.
- R37 : le prix « ≈ » unique est le rendu (TVA d'import 8,1 %, port lu), arrondi au franc : un article à quelques francs se dit « ≈4 CHF rendu » pour 3,72 € (3,46 CHF converti). La carte et le choix disent encore le converti seul (D447, test épinglé) : deux chiffres existent donc encore entre carte et pastille. DÉCISION À PRENDRE ci-dessous.
- Aromes : vocabulaire d'environ 250 entrées, non exhaustif ; un mot inconnu reste en allemand.
- Pas de capture locale (consigne) : preuve en ligne par le pilote et le critique.

DÉCISION À PRENDRE : C59-7 — quel prix « ≈ » partout (carte et choix compris) ? (a) le rendu partout, (b) le converti seul au centime partout, rendu dit à part sans « ≈ ». Fait ici : (a) sur Comparer, feuille Articles, tableau, fiche (les 3 surfaces de R37), la carte garde le converti (test carnetsPrixHorsFranc). Recommandation : (a) étendu aux cartes, en adaptant ce test ; touche D447 (brasseur) et D421.

CONNAISSANCE : une ligne de houblon nommée comme la variété et valant le % du titre est l'alpha (`nomAlpha`). Un critère à cible se classe par proximité, avec une affinité de nom en secours (`MALUS_HORS_GENRE`).
LEÇON PROPOSÉE : aucune
