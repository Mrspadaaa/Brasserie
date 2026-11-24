OK — c66Regles 40/40 vert ; classement au kilo unique, paliers Brau, Annuler visible, Comparer v01 ; commit c97a3a4f3

# RESULTAT c66-fix

## Plan (par règle : endroit → correctif)
- R51 (C66-1) : `FeuilleCartes.tsx` — Retirer et Déplacer ferment la feuille avant d'écrire : le bandeau « Article retiré / Rangé dans … · Annuler » (monté par la page, `CarnetOuvert`, non touché) n'est plus sous le voile ; Annuler est visible et rend l'article.
- R52 (C66-2) : `tableauRegles.paliersDe` — le prix à l'unité (0,1044 CHF/g, 0,08 dès 1 000 g) et les offres publiées (5 kg, 20 kg) se complètent au lieu de s'exclure (les offres seules écartaient le palier de 1 kg). Carte, tableau, « Selon la quantité » et « je prends » (au gramme, 1 kg, 5 kg, 20 kg) lisent le même.
- R53 (C66-3, C65-5) : `tableauRegles.classerAuKilo` (fonction pure) : pour une matière pesée classée par le seul prix, les lignes passent au kilo rendu à la quantité d'achat, rangs refaits. Appelée par `FeuilleCartes`, `TableauCarnet`, `Comparer` : rang, colonne ①, vert, ✓, barres, compromis et bouton Choisir disent MotlerHops.
- R54 (C66-4) : `FicheArticle.tsx` — `prixCoche` : le bloc Offre, le bouton et « Part dans À venir » disent le prix de la ligne cochée (1 kg : 62,20 ; MotlerHops : ≈40 CHF rendu). Un prix donné à l'unité garde sa ligne R49.
- R55 (C66-5) : `Comparer.tsx` — une seule ligne égale se replie dans « 1 identique » pour un houblon ; α a son ✓ (le plus haut) ; la ligne « Conditionnement g 100 / 50 / ? » est remplacée par « vendu par 50 g à 1 kg » (`venduPar`, v01).
- C65-4 / C66-7 : `CarteArticle.tsx` — un prix lu avec son conditionnement (50 g) se dit en rendu (≈4), comme le tableau et son 73,80 CHF/kg ; sans conditionnement, le converti D447 reste (test carnetsPrixHorsFranc vert).
- C65-6 / C66-6 : `src/domain/carnets/doublonsLus.ts` (neuf), branché dans `valeursLuesDe` : une ligne par caractéristique (récolte, alpha, bêta, forme, pays, conditionnement) quand les valeurs sont égales ; deux valeurs qui se contredisent restent deux lignes ; « Ernte » seul se dit « Récolte ».
- C66-8 : `analyseLocale.analyserLigne` — une quantité seule ne fait un critère que si une grandeur mesurable en sort ; « Collier de serrage 25 mm : … » devient une note.

## Fichiers écrits
src/ui/carnets : FeuilleCartes, TableauCarnet, Comparer, FicheArticle, CarteArticle, tableauRegles.ts ; src/domain/carnets : analyseLocale.ts, comparer.ts (un import et un appel), doublonsLus.ts (neuf) ; BUGS.md (C66-1 à 8, C65-4 à 6 : « corrigé en local c97a3a4f3 »). Aucun fichier de la voie probleme (CarnetOuvert, RubriqueQuand, CriteresCarnet…) touché ; src/domain/stock et src/ui/stock non plus.

## Sorties décisives (tests.log)
- `c66Regles` : 40 passed (30 rouges au départ).
- c4x..c6x Regles, carnets*, virgule-transversale, proprietes : 77 fichiers, 1772 passed, 3 skipped.
- `npx tsc --noEmit` : 2 erreurs connues (seedData GanttTask, virtual:pwa-register) ; functions/ : aucune.
- `node scripts/agents/controle-bugs.mjs` : BUGS OK.

## Essais
Trois lots de tests. Premier passage : 5 rouges anciens (c64 R49, carnetsFix28Fiche, carnetsTour25Client, carnetsPrixHorsFranc, carnetsGreffeP2Cartes). Corrigés dans le code, sans toucher un test : R49 garde sa ligne, un nom allemand seul reste tel quel (« Erntejahr »), D447 garde le converti sans conditionnement, la règle « une ligne égale se replie » ne vaut que pour un houblon (carnetsGreffeP2Cartes : cuves, deux égaux au moins). Une regex mal copiée par le Bash (`\b` devenu un caractère de contrôle) a masqué le ✓ de l'α un tour ; refaite sans barre inverse.

## Doutes et limites
- R51 : choix de fermer la feuille au Retirer/Déplacer (jsdom juge « feuille fermée » = visible). Pour retirer plusieurs cartes à la suite, il faut rouvrir la feuille. Alternative non faite : bandeau propre dans la feuille (demande un Annuler passé par CarnetOuvert, voie probleme). La capture en ligne reste le juge.
- R54 : seule la fiche est corrigée. Le bouton ouvre l'écran Choisir, qui choisit le 1er du tableau (pas l'article de la fiche) et envoie à À venir le prix de l'article (`choisir` : `prixCentimes`, 6,70 pour Hopfenmarkt). La phrase de la fiche dit 62,20 ; À venir recevra encore 6,70 tant que le choix ne garde pas la quantité.
- R53 : le classement reste celui du domaine pour un carnet qui range par un critère avant le prix (`rangeParNoms`). `tableau()` du domaine n'a pas la quantité d'achat (état de session) : le reclassement vit dans la vue. L'écran Choisir (`ecransCarnet`, hors périmètre de test) lit toujours `tableau()` du domaine.
- ✓ de l'α : le plus haut, comme la maquette ; ce n'est pas une règle de goût (un houblon à 13,6 n'est pas « meilleur » pour toute recette).
- « Ernte » seul traduit, « Erntejahr » et « Total oil » non : deux tests existants (carnetsTour25Client, carnetsFix28Fiche) gardent ces intitulés.
- Aucune capture : preuve en ligne par le pilote et le critique (consigne de la voie).

DÉCISION À PRENDRE : Choisir depuis la fiche. Options : (a) garder (fiche dit 62,20, À venir prend 6,70) ; (b) `choisir` accepte la quantité cochée et son prix (champ `prixCentimes` du choix, lu par `prixChoisiCentimes`), et l'écran Choisir ouvre l'article de la fiche. Recommandation : (b), une voie dédiée (modele, operations, ecransCarnet).

CONNAISSANCE : aucune
LEÇON PROPOSÉE : Bash de ce poste : une regex écrite dans un script `node` lancé par heredoc perd ses barres inverses (`\b` devient U+0008) ; écrire le fichier avec Edit/Write, puis un test qui exerce la regex.
