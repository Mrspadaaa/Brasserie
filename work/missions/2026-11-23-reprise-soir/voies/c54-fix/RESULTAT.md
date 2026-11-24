OK — R19 à R22 corrigés (tests c54 : 155 verts sur 164, 8 rouges à tort, 1 sauté) ; PRÊT À METTRE EN LIGNE, avec 8 tests à corriger par leur auteur

# RESULTAT c54-fix

Commit du code : 2e1f921b1 (BUGS.md et ce fichier : commit suivant). Aucun appel Gemini, aucun déploiement, rien dans src/domain/stock, src/ui/stock ni src/ui/calendrier/cadre.

## Plan (règle → endroits → correctif)
- **R19 (C53-4)** : `TableauCarnet.tsx`. La cellule de la colonne prix ne dit plus que le prix (retrait du `<small>` « 50 L · 10,40 CHF/L »). La quantité et le prix unitaire passent sous le nom de l'article (colonne large), chaque morceau en `cn-nowrap`, replié entre eux. Cela garde `c53Regles` R17 (« un prix unitaire est dit dans le tableau, jamais coupé »). Feuille Articles, pastille, Comparer, fiche : inchangés.
- **R20 (C54-1)** : nouvelle fonction unique `src/ui/calendrier/entete/nomMarche.ts` (`nomDeMarche`, `formesDeMarche`, `formeCourteDeMarche`, `suiteDeMarche`). Utilisée par `Courbe.tsx` (`placerNoms` : les formes courtes gardent le nom : « <nom> + 1 autre », « <cœur du nom> +1 », « <premier mot> +1 », plus de « 2 mouvements »), par `EscalierSvg.tsx` (`texteLot` nomme la marche aussi quand les mots-clés diffèrent ; `texteLotCourt` nomme la tête, plus de « 2 sorties ») et par `analyse/Escalier.tsx` (`suiteDeMarche`). `LectureCourbe.tsx` non touché (chaque mouvement y a son nom).
- **R21 (C54-2)** : `functions/src/lienFusion.ts` : « étape » et « phase » entrent dans le rang de Tension ; nouveau repli par mots-clés (`rangParMotCle` : énergie, froid, dimensions, et unité de la valeur W/kW/kWh/V pour l'énergie) pour un nom que la liste ne connaît pas ; `rangDeDecision(nom, valeur)` et `trierParDecision` lisent la valeur et l'unité (accesseur `uniteDe`, ou champs `valeur`/`unite` de l'entrée). `lienLibelles.ts` : `prioriserValeurs` passe la valeur ; « Étape » devient « Branchement » quand sa valeur dit un branchement (1N~/PE, 3~, PE, monophasé…) : à la lecture (`lireLien`) et pour un article déjà rangé (`valeursEnFrancais` de `modele.ts`, qui passe aussi l'unité). Appelants : `FicheArticle.tsx`, `comparer.ts` (`valeursLuesOrdonnees`) passent l'unité ; `TableauCarnet` (rang de colonne) inchangé.
- **R22 (C54-3)** : `FicheArticle.tsx` `Piste` : petit à gauche, grand à droite ; « la plus haute » du côté du grand, « la plus basse » du côté du petit. Réglette de Choisir (g05-11) laissée telle quelle (décision du pilote) ; test sauté, resté sauté.
- **Registre** : C53-4, C54-1, C54-2, C54-3 en « corrigé en local 2e1f921b1 » ; `controle-bugs.mjs` : BUGS OK.

## Critères
- `npx vitest run tests/unit/c54Regles.test.tsx --reporter=dot` : `Tests 8 failed | 155 passed | 1 skipped (164)` (avant : 109 rouges). Les 8 rouges sont des tests faux, voir plus bas.
- Lot large (c48, c50, c52, c53Regles, c54Regles, carnets*, proprietes, pc117, lien*, courbe, calendrier, escalier, previsions, analyse, finance, k51, fiche, tableau ; `voies/c54-fix/tests-large.log`) : `Test Files 1 failed | 105 passed (106) ; Tests 8 failed | 1797 passed | 1 skipped`. c48, c50, c52, c53Regles verts ; carnets* et proprietes verts.
- `tsc --noEmit` racine : 2 erreurs connues seulement (seedData `GanttTask`, `virtual:pwa-register`) ; `functions/` : 0 erreur (`tsc-racine.log`, `tsc-functions.log`).
- Banc des liens sans IA (`npx tsx scripts/banc-liens.ts --etiquette c54`, `banc-c54.log`, mesure `work/missions/2026-11-23-carnet-en-ligne/banc-liens/mesures/c54.json`) : identique à c52 champ par champ (nom 58/63, prixAffiche 52/56, caractéristiques 35/48, livraisonCH 15/23…) ; `inventions: 0`.
- `node scripts/agents/controle-bugs.mjs` : `BUGS OK : 2242 bugs, 510 ouverts, 202 sources`.

## Tests qui me paraissent faux (à corriger par c54-tests)
Huit tests de R20 vérifient que l'étiquette contient le premier mot de `noms[0]`, qui est l'écriture la plus LÉGÈRE (−79,95), alors que la règle (et le test de parité, `ZZ TEST — achat rond + 1 autre`) nomme l'écriture la plus LOURDE (−80,00) :
- `Calendrier, en-tête (366/334/300 px), noms de matériel` et `noms à rallonge` (6 tests, ligne 198) : l'étiquette dit « Pompe de transfert +1 » ou « Détendeur +1 » ; le test attend « fermenteur » ou « remplacement ».
- `Prévisions, 390 px, noms de matériel` et `noms à rallonge` (2 tests, ligne 242) : même défaut.
Avec les noms courts (« achat » / « achat rond ») le premier mot est commun aux deux, donc le test passe. Correction proposée : comparer avec le premier mot du nom de `noms[1]` (le plus lourd). Aucun code honnête ne peut satisfaire ces huit-là sans nommer la mauvaise écriture.

## Test ancien modifié (hors c54)
`tests/unit/pc117Lot.test.ts`, le cas « des mots-clés différents restent « N sorties » (acquis de la revue du 10.11) » : R20 dit « jamais « 2 sorties » sans nom ». Attente changée en `Loyer de l’atelier + 1 autre −450, 08.12`. Si le brasseur tient à l'acquis du 10.11 pour des écritures sans rapport (Loyer, Assurance), à trancher ; la règle R20 du tour 54 est plus récente.

## Doutes et limites
- Rien vu à l'écran (consigne : pas de captures locales). À contrôler en ligne à 390 px : (1) le tableau du carnet, ligne « 50 L · 10,40 CHF/L » sous le nom (une ligne de plus possible quand pays, délai et veille s'y trouvent déjà) ; (2) l'étiquette « Pompe +1 » à 300 px sur la courbe du Calendrier ; (3) la jauge de la fiche (borne gauche 50, borne droite « 242 la plus haute des 2 »).
- jsdom ne mesure pas les largeurs : le choix de la forme posée (complète, cœur, « +1 ») dépend de la chasse estimée hors navigateur.
- Piste, valeurs toutes égales : les deux bornes disent la même valeur (comme avant).
- Piège de poste vécu : un script Bash avec `\b` a écrit des caractères de retour arrière dans `lienFusion.ts` ; repéré (grep, `od -c`) et réparé avant le test ; plus aucun octet 0x08 dans le fichier.

DÉCISION À PRENDRE : aucune (la réglette de Choisir reste, le test sauté reste sauté ; les 8 tests faux sont à rendre à c54-tests).
CONNAISSANCE : aucune
LEÇON PROPOSÉE : un test qui compare « le nom de la marche » doit nommer la même écriture que la règle (la plus lourde) ; un test écrit avant le code et jamais rendu vert par son auteur peut porter une faute de fixture (ici noms[0] pour noms[1]) : faire jouer le test sur une implémentation de référence (même naïve) avant de le déclarer « rouge pour la bonne cause ».
