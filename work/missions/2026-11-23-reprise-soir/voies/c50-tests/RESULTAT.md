OK — 57 tests écrits depuis R6..R11 : 50 rouges, 7 verts justifiés ; src/ et functions/ intacts

# RESULTAT c50-tests

## Endroits du code où chaque règle s'applique (grep fait avant d'écrire)
- **R6 (« non publié » jamais dit d'une valeur lue)** : 3 endroits qui le disent. Fiche : `FicheArticle.tsx` (`manque` : « Non publié par le vendeur : … » ; case `non publié` ; les colonnes se comparent par nom normalisé exact). Comparer : `Comparer.tsx:387/482` (`sansValeurLue` : « Aucune valeur lue pour : … », colonne sans cellule). Feuille Articles : `CarteArticle.tsx` `CarteClassee` (« X : non publié », `a.valeurs[p.carac.nom]` nom exact) et pastille « X non publié » de `CarteArticle` liste (l. 218). Cause commune : `comparer.ts` `valeurPropre` (nom normalisé identique, unité identique sinon `convertirLongueur`, jamais une température ni un volume) ; pas de source unique de « lu ».
- **R7 (colonne = critère, sinon ce qui distingue)** : `TableauCarnet.tsx` `colonnesCarnet` (1re mesure qui classe, sinon `mesures[0]` : la 1re colonne lue, ici « Tension » identique) ; `FeuilleCartes.tsx:17` (`colonnesCarnet(...).find(c => c.cle !== '__prix')`, reprend le même choix) ; `comparer.ts` `colonnesLues` (colonnes dans l'ordre de première lecture, sans tri par « distingue »). Le tableau du carnet et la feuille Articles partagent `colonnesCarnet` : un correctif là couvre les deux.
- **R8 (synonymes fusionnés, unité une fois)** : lecture : `functions/src/lienLibelles.ts` (`traduireValeurs`, `sansDoublonDeVolume` ne fusionne que Volume/Capacité/Contenu ; table `TABLE`), `lienValeurs.ts` (`UNITES_DE_NOM` : `l` minuscule ; `plage` ne fait que « bis/to » en °C). Affichage d'articles déjà rangés : `FicheArticle.tsx` (grille), `Comparer.tsx` (lignes `colonnesLues`), `TableauCarnet.tsx`. Unité doublée : `comparer.ts` `compromisDe` (`val` = `nombreTexte(v.valeur)` + `unite(k)` : « 242 l » + « L ») et `texteCellule` + unité de colonne.
- **R9 (même ordre d'une fiche à l'autre)** : `FicheArticle.tsx` `cases` (`Object.entries(a.valeurs)` : ordre de la page, seul `ordreHoublon` trie) ; `lienLibelles.ts` `prioriserValeurs` (rang 0/1/2, puis ordre de la page : deux pages différentes → deux ordres) ; `lienProduit.ts` plafond de lecture. Comparer a déjà un ordre de décision (`groupeDeLigne`, CRB-14) : non testé, déjà juste.
- **R10 (oui/non)** : `CarteArticle.tsx:81` `valeursLues` (`pas : ${nom}`), utilisé par `CarteArticle` liste (l. 213) et `complete` (l. 162). `ouvertCalculs.ts:77` (`nier`, `pas : ${t}`) ne se déclenche que sur un texte vide : pas de test (inatteignable). La fiche (« Induction non ») et Comparer disent déjà la valeur.
- **R11 (390 px)** : `CarteClassee` pied (`carnets.css:476` `.cn-classee-pied` sans `flex-wrap`, `.cn-chip-valeur` en `white-space: nowrap` : libellé long + valeur + « Veiller » + interrupteur de 64 px débordent) ; fiche, ligne Offre (`FicheArticle.tsx` l. 293-303 : quatre colonnes `cn-sp`, prix, « Poser le prix », « Relire », « Ouvrir » dans un `.cn-offre` sans retour à la ligne). Pied de `CarteArticle` (`cn-article-pied`, `flex-wrap: wrap`) et ligne veille de la fiche (libellé fixe court, `.cn-bascule { flex: none }`) : déjà justes, non testés.

## Fichiers écrits
- `tests/unit/c50Regles.test.tsx` (57 tests, jsdom, aucun réseau ni Gemini).
- `tests/fixtures/c50/chambres-froides.json` (deux jumelles de 14 caractéristiques, ordres de page différents, doublons de C50-3 : réécrit à la main, sans donnée personnelle).
- Ce dossier : `tests-rouge.log`, RESULTAT.md. Aucun fichier de `src/` ni de `functions/` modifié (`git status` : aucun ` M` sous ces chemins ; les `??` de src/ existaient avant la voie).

## Sortie décisive : `tests-rouge.log`
`Tests 50 failed | 7 passed (57)`. Rouges par règle : R6 11 ; R7 6 ; R8 16 ; R9 4 ; R10 5 ; R11 8. Chaque rouge a été lu : l'échec est celui de la règle, pas d'un outil (fiche : « non publié » dit ; Comparer : « Aucune valeur lue » ; colonne « Tension » [230 V, 230 V] ; « 242 l L » ; « pas : Induction » ; « en stock » coupable de se couper).
`tsc --noEmit -p .` : aucune erreur dans le fichier de test.

## Les 7 verts, justifiés
1. R6 capacité/volume, feuille Articles : elle montre déjà « 242 » et « 50 » (colonne Volume) ; le test garde cela quand R7 changera la colonne.
2. R6 volume en m³ pour un critère en L, fiche : la valeur est dite sous son nom (« Volume 4,06 m³ »), jamais « non publié » ; garde contre un correctif qui la cacherait. (Comparer, lui, est rouge.)
3. R7 critère « Volume » lu sous son nom exact : la colonne est déjà le critère.
4. R8 « Tension 230 V » et « Branchement électrique 400 V » : deux valeurs différentes restent deux (garde contre une fusion qui perdrait 400 V).
5. R10 booléen `false` : « Induction : non » déjà juste.
6. R11 libellé de la feuille Articles : peut déjà passer à la ligne (garde de C48-2).
7. R11 article avec prix : prix et disponibilité lisibles (garde).
Verts retirés après analyse : « carte complète » R10 et « tableau/feuille unité » R8, passés pour de mauvaises raisons (regex `\b` entre deux éléments collés ; cellule absente) : regex corrigée, présence de « 242 L » exigée.

## Essais
Trois lancements : (1) premier jet, 44 rouges, 13 verts dont 6 faux (regex `\bpas` collée au texte voisin, règles CSS génériques `.cn-mut` lues comme propres à l'élément, cellule absente donnant un vert vide) ; (2) corrections ; (3) lancement officiel (50 rouges). Un fichier de mise au point supprimé.

## Doutes et limites
- **Fusion des synonymes : où ?** Les tests exigent la fusion à la lecture (`traduireValeurs`, nouvelles lectures) ET à l'affichage (fiche, Comparer : articles déjà rangés avant le correctif, ceux du carnet de la lecture du 21.11). Un correctif seulement à la lecture laisse ces 3 tests d'affichage rouges : voulu, car les carnets existants gardent leurs noms.
- **Noms libres** : aucune règle ne fixe le nom fusionné ; les tests acceptent « Température » (préfixe), « Refroidissement » ou « Type de refroidissement », « Fluide frigorigène », « Type de réfrigérant » ou « Réfrigérant », « Tension », « Raccordement électrique » (une seule ligne par groupe).
- **Unité « L »** : le test d'affichage exige « 242 L » ; `UNITES_DE_NOM` écrit « l » : le correctif choisit lecture ou affichage. Si l'unité des colonnes se normalise à la lecture seule, les articles déjà rangés avec « l » restent rouges.
- **R9 à la lecture** : `prioriserValeurs` rouge exige le même ordre de noms pour deux pages au contenu semblable, quel que soit l'ordre de la page. Test volontairement strict ; si le correctif n'ordonne qu'à l'affichage, ce seul test se discute (pilote), pas se modifie par le correcteur.
- **R7** : le choix de « ce qui distingue » n'est pas fixé (volume, dimensions ou performance conviennent) ; seule contrainte testée : valeurs non identiques entre articles, critère d'abord s'il est lu. Quand le critère est lu sous un synonyme (R6), R7 exige la colonne « température » du carnet, donc R6 et R7 se corrigent ensemble.
- **R11 : structure seulement** (jsdom ne mesure rien). Tests : pied de `CarteClassee` capable de passer à la ligne (`flex-wrap: wrap`) ou libellé et valeur capables de rétrécir (`min-width: 0`, sans `nowrap`) ; « en stock » et « prix ? » insécables ou `nowrap` ; gestes de l'Offre regroupés dans un même parent ou ligne qui passe à la ligne. **Reste à voir en ligne à 390 px** : l'interrupteur « Veiller » entier avec le libellé « Dimensions intérieures (L x P x H) » et une valeur de 21 caractères ; la ligne Offre d'un article sans prix, avec et sans « Relire » (disponibilité sur une ligne, prix et gestes alignés). Un test vert ici ne prouve pas le rendu.
- **Pas rejoué** : la page réelle de ggmgastro (non disponible) ; les noms de la fixture viennent de BUGS.md (C50-3, C50-4).

## Hors voie, signalé
C50-5 (compromis) : non testé, comme demandé. Un test R8 sur « 242 l L » touche la phrase du compromis : il ne regarde que le doublon d'unité, pas le contenu de la phrase g01-8.

CONNAISSANCE : `textContent` d'un composant React colle le texte des éléments voisins sans espace (« g.testpas : Induction ») : un `\b` devant un mot attendu dans un rendu ne s'y trouve pas ; en jsdom, les règles CSS se lisent par classe propre de l'élément, jamais par `.cn-mut` ou `.cn-sp` (génériques, réglés dans d'autres contextes).
LEÇON PROPOSÉE : aucune
