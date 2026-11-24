ECHEC — c59Regles : 35 verts sur 39 ; restent C59-8, C59-9, C59-7 et 1 test R36 cité (plafond de tours atteint) ; R35 et C59-2 VERTS

# RESULTAT c59-fix (24.11)

## Tenu (commit 3df418c59 + suite, par chemins)
- **R35 (C59-1, bloquant)** : `rangerMaintenant()` reprenait tout `aReprendre` ; « Relire » / « Ranger maintenant » / « Reprendre » ne passent plus que les ids du bandeau (`aReprendreVus` = messages du carnet ouvert). bandeauxCarnet.tsx, CarnetsVue.tsx. 4/4 verts (tests-r35.log). LE-1 intact : rien ne change à l'ouverture, la garde `lecturesOffertes` n'est pas touchée.
- **C59-2** : rangement.ts `ERREUR_PLAFOND` (/plafond de dépenses/, le texte de l'erreur `spend-cap` de geminiErrors.ts) : AUCUNE reprise après répit, un seul appel ; `AVIS.pause` « IA en pause : plafond de dépenses atteint : rangé sur l'appareil, votre message est gardé » ; dit par le bandeau de reprise (`AReprendre.pause`), le retour (`poserAvis` + texte) et `EtatIA`. 2/2 verts (tests-c592.log). « Relire » reste un geste manuel, jamais une boucle.
- **R36 (C59-4)** : `Colonne.cible` (comparer.ts) : un critère qui dit une mesure sans borne (« 50 L ») classe par proximité (tri, `domine`, places) ; « au moins / plus de / max / jusqu'à » gardent plus/moins. 7/8.
- **R37 (C59-6)** : `articleHonnete` (prixUnitaire.ts) : un prix « dès » sans quantité n'est ni classé ni montré (tableau, Comparer, feuille, pastille, fiche, offres du même nom) ; la donnée stockée n'est pas touchée. functions/src/lienProduit.ts : un prix par unité de référence (UnitPriceSpecification + referenceQuantity : 0,1044 CHF le gramme) n'est plus publié (sans conditionnement, pas de prix, « douteux » dit) ; la variante désignée (MotlerHops « Citra US - 50 g ») ajoute la valeur « Conditionnement 50 g ». 10/11.
- **R38 C58-4, C50-5, C59-3** : `nombreDit` (comparer.ts) : la perte se dit aussi quand la valeur est gardée en une chaîne (« 2,6 m³ ») : 6/6 verts.
- **R38 C59-5** : le titre du lien retour de Comparer tient dans un seul `span.cn-retour-titre` (un seul élément flex). **C59-10** : `.cn-classee-pied .cn-reglette { margin-right: 6px }` (écart jauge / Veiller 16 px ≥ 12). Verts.

## Critères
- tests : `tests.log` (c59Regles + c58 + carnets* + lien*) : 795 verts, 9 rouges avant C59-5/C59-10 ; après : `tests-r38.log` R38 12/16. Large (c48, c50, c52..c56, c58, carnets, proprietes, lien, lire) : `tests-large.log` 1344 verts, 0 rouge (avant les derniers correctifs CSS/Comparer.tsx, non rejoué en entier : à rejouer par le pilote).
- tsc racine : 2 erreurs, les 2 connues (seedData GanttTask, virtual:pwa-register). tsc functions : 0.
- BUGS.md : NON mis à jour (plafond de tours) ; `controle-bugs.mjs` non lancé. À faire : C59-1, C59-2, C59-3, C59-4, C59-5, C59-6, C59-10, C58-3, C58-4, C50-5 → « corrigé en local <hash> ».

## Restent rouges (4 tests)
1. **R36 « hors genre »** (frigo 50 L pile contre marmite 45 L) : TEST CITÉ, non satisfaisable sans vocabulaire par objet. Même nombre, même caractéristique, même unité ; seul le NOM diffère. Le test 1 exige au contraire que « Maischekessel ZZ 50 L » (sans le mot « marmite ») batte « Marmite de brassage inox ZZ 60 L ». Seul un dictionnaire (marmite = Maischekessel ≠ frigo) satisfait les deux ; src/domain/carnets l'interdit (B6). Un seuil de tolérance ±10 % les satisfait aussi mais fait battre un 50 L exact par un 45 L au nom proche : refusé.
2. **C59-8** (« Citra : 13,6 % » → « Alpha 13,6 % » en tête) : à faire dans FicheArticle.tsx (cases, l.174) : la valeur dont le nom est celui de la variété (nom de l'article) prend le nom « Alpha » et passe en tête ; `trierParDecision` à regarder.
3. **C59-9** (arômes en français) : `traduireValeurs` (functions/src/lienLibelles.ts) ne traduit pas la valeur des « Aromen/Arômes » ; table de mots d'arômes (Limette → citron vert, Mango → mangue, tropische Früchte → fruits tropicaux) et reprise du rendu de la fiche pour la donnée déjà stockée.
4. **C59-7** (un prix, trois valeurs : Comparer et feuille « ≈4 », fiche « ≈3 ») : cause : Comparer et la pastille disent le « rendu » (3,72 € + TVA d'import → ≈4 CHF), la fiche et l'offre disent le converti seul arrondi au franc (3,46 → ≈3).

DÉCISION À PRENDRE : C59-7 — quel prix se dit partout ? (a) le converti seul au centime (≈3,46 CHF) partout, le rendu dit à part sous « rendu » sans « ≈ » nu ; (b) le rendu (≈4) partout ; (c) garder deux prix mais étiquetés. Recommandation : (a), car arrondir 3,46 à 3 (13 %) ou 4 trompe sur un article à quelques francs ; le choix du prix rendu touche D447, au brasseur/conseil.
DÉCISION À PRENDRE : R36 « hors genre » — retirer le test ou l'écrire avec un genre porté par la donnée (famille de l'article lue sur la page) ; la recommandation est de le retirer de c59Regles.

CONNAISSANCE : un critère « 50 L » sans borne est une cible (proximité), un critère « au moins 50 L » une borne ; la distinction vit dans `BORNE_DITE` (comparer.ts).
LEÇON PROPOSÉE : un script d'édition lancé depuis le Bash (même heredoc entre guillemets) perd les barres inverses : `\b` est devenu un retour arrière (0x08) dans une regex de comparer.ts, `\d` est devenu `d` dans lienProduit.ts ; lu 2 fois seulement parce qu'un test échouait. Toute regex s'écrit avec Edit, jamais par script Bash (déjà dans la consigne ; revenu 2 fois ici).
