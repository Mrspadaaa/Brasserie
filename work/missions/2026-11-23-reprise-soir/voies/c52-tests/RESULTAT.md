OK — 65 tests R12..R15 écrits depuis les règles : 56 rouges, chaque règle rouge, rien de src/ touché

# RESULTAT c52-tests

## Endroits où chaque règle s'applique (grep, puis un test par endroit)
- **R12 (même ordre des caractéristiques)** : (1) grille de la fiche `FicheArticle.tsx` l.177-178 (`trierParDecision`) ; (2) résumé de la carte `CarteArticle.tsx` (`valeursLues(valeursLuesDe)`, ordre de la page) ; (3) lecture serveur `lireLien.ts` l.185 `enFrancais` → `lienLibelles.ts` `prioriserValeurs` ; (4) article déjà rangé : `lireCarnet` → `modele.ts` `valeursEnFrancais` (l.280, `prioriserValeurs` aussi) puis la fiche ; (5) `comparer.ts` `valeursLuesDe` (ordre de la page, base de tout). Comparer et le tableau n'ont qu'UN ordre (colonnes communes) : non testés.
- **R13 (jauge)** : un seul endroit la dessine à côté d'une valeur du critère : `CarteClassee` (`CarteArticle.tsx` l.295, `.cn-reglette`, `pos` nul quand la valeur n'est pas un nombre : plage « 0 à 8 °C », dimensions) dans la feuille Articles `FeuilleCartes.tsx`. Examinés, rien à tester : la réglette de `Choisir.tsx` (seulement pour une valeur chiffrée, `chiffree`) et la piste de la fiche (`heros.moi !== null`).
- **R14 (prix)** : (1) pastille `PrixPastille.tsx` l.64 (`<small data-quantite>` entre le montant et « CHF ») ; (2) colonne de prix du tableau `TableauCarnet.tsx` l.198 (`<small class="cn-tab-q">` : « 520 / 50 L ») ; (3) ligne Offre de la fiche (déjà juste, garde-fou) ; (4) Comparer dit « 50 L · 10,40 CHF/L » : juste, non testé.
- **R15 (vendeur / prix)** : un seul endroit : ligne Offre de `FicheArticle.tsx` l.283-314 (`.cn-offres > .cn-offre`, vendeur dans `<b>` d'un `.cn-sp`, prix `PrixMono` frère). Examiné, hors fiche : `Choisir.tsx` l.294-301 (autre écran, prix à sa ligne `.cn-offre-prix`), non testé.

## Pourquoi le correctif de c50-fix (R9) n'a pas tenu en ligne
- `functions/src/lienFusion.ts` `rangDeDecision` ne connaît que 14 familles de noms (`ORDRE`). Tout autre nom reçoit `RANG_INCONNU` et `trierParDecision` (fiche) comme `prioriserValeurs` (lecture, article rangé) le départagent par `x.i - y.i` : l'ORDRE DE LA PAGE. Or les noms observés en ligne ne sont pas dans `ORDRE` : « Hauteur de la porte » (le motif `porte` n'attrape que « Largeur de la porte »), « Épaisseur du matériel », « Épaisseur de l'isolation », « Largeur de l'unité », « Densité d'isolation », « Exécution », « Hauteur », « Largeur ». C'est exactement ce que le tour 52 relève (Hauteur de la porte 9e/15e, Épaisseur du matériel 13e/9e, densité d'isolation 5e/7e, Exécution 6e/5e, KS240L Largeur 7e/Hauteur 14e).
- Les tests de c50 (R9, `c50Regles.test.tsx` l.341-370) n'employaient que `tests/fixtures/c50/chambres-froides.json`, dont TOUS les noms sont connus de `ORDRE` : le test passait sur le cas qu'il avait vu, pas sur la règle. La règle dit « le même ordre » ; elle ne dit pas « pour les noms que nous connaissons ».
- Le chemin qui avait échappé est donc testé par `tests/fixtures/c52/caracteristiques.json` : 3 genres (cellule 22 lignes, carnet 15, KS240L 12) pleins de noms inconnus de `ORDRE`, 3 permutations de page (inversée, décalée de 7, impairs puis pairs).
- Piste de correction (pour qui corrigera, pas pour moi) : à rang inconnu aussi, départager par le nom normalisé (`cleDeNom`) dans `trierParDecision` ET `prioriserValeurs`, pas par l'ordre de la page.

## Fichiers écrits
- `tests/unit/c52Regles.test.tsx` (65 tests), `tests/fixtures/c52/caracteristiques.json`.
- Dans ce dossier : `tests-rouge.log` (brut, avec couleurs), `tests-rouge.txt` (même sortie sans couleurs), ce fichier.
- Aucun fichier de `src/` ni `functions/` modifié (`git status --short src functions | grep -v '^??'` = 0 ; les `??` d'`src/` étaient déjà là au début de la voie).

## Sortie décisive
`npx vitest run tests/unit/c52Regles --reporter=dot > tests-rouge.log` : **56 rouges sur 65, 9 verts**, 1 fichier, 2,3 s.
- R12 : 42 tests, 37 rouges (fiche × 3 genres × 3 permutations × sans / avec critère ; résumé de carte ; article déjà rangé ; lireLien ; lireLien puis fiche).
- R13 : 6 tests, 4 rouges (plage « 0 à 8 °C » / « 2 à 10 °C », même plage en deux bornes, dimensions, inconnu confondu avec lu : message « jauge vide à côté d'une valeur qui tient le critère »).
- R14 : 8 tests, 6 rouges (messages lus : « 520 50 L CHF HT », « 790 80 L » dans la colonne du tableau, « 7,25 100 g CHF HT », « 72,50 1 kg »).
- R15 : 9 tests, 9 rouges (« grossiste-exemple.chen stock2 987,51 CHFOuvrir », « grossiste-exemple.chprix ?Ouvrir » ; avec prix, sans prix, Relire, avec et sans disponibilité, pays, plusieurs offres).
- Les 9 verts, justifiés : 5 de R12 qui, sur la fixture « cellule » décalée de 7, gardent par hasard le même ordre (fiche sans / avec critère, article rangé, 2 tests lireLien) ; R13 « ne tient pas → pas pleine » et le garde-fou volume chiffré (déjà juste) ; R14 ligne Offre de la fiche (déjà juste, marmite et houblon). Chaque règle a au moins un rouge.
- Chaque rouge a été lu : il échoue pour la raison de la règle (ordre différent, jauge vide, quantité dans le prix, vendeur collé), pas pour un montage cassé.

## Limites et doutes
- jsdom ne mesure rien. R15 se lit dans le TEXTE de la ligne (espace, séparateur ou saut de ligne entre vendeur et ce qui suit, et avant le prix ; un élément de bloc compte comme un saut). Un correctif par le seul CSS ne le fait pas passer ; il faut une vraie séparation dans le texte (ce que lit aussi une aide de lecture) ET à voir en ligne à 390 px. R13 se lit dans le DOM de la jauge (`.cn-reglette-plein` à 100 %), pas dans la couleur.
- R13 : « pleine OU absente » est accepté pour une plage (le registre dit « ou pas de jauge ») ; « vide » (la piste grise nue) ne l'est jamais. Pour « on ne sait pas », la jauge ne doit pas ressembler à celle d'une valeur lue qui tient.
- R14 : le critère est le registre : « prix seul, ou prix unitaire entier ». Une quantité n'est admise que dans « 50 L · 10,40 CHF/L » ; l'acquis T28-6 « 1 kg · 72,50 CHF/kg » reste donc permis.
- lireLien : le plafond de lecture peut garder des lignes différentes d'une page à l'autre ; le test compare l'ORDRE sur les noms que les deux pages gardent.
- Observation hors règle : `lireLien` sur la page de test rend DEUX lignes « Température » (la phrase « Température de 0 °C à 8 °C » du bandeau et les deux bornes de la liste) ; à regarder par qui corrigera (C50-3 ?), non testé ici.
- Quatre jeux de permutations ne prouvent pas « tous » les ordres : la règle de correction (rang inconnu → nom) les couvre tous ; un tri par une autre clé que le nom serait aussi accepté.

DÉCISION À PRENDRE : aucune.
CONNAISSANCE : aucune (voir « Pourquoi le correctif de c50-fix n'a pas tenu » ; elle ira dans la voie de correction).
LEÇON PROPOSÉE : un test « même ordre » ou « jamais X » doit employer des données qui sortent de la table connue du code (noms inconnus, formes non vues) ; un cas tiré de la table testée prouve la table, pas la règle (c50 R9 : 14 familles connues, tour 52 : 8 noms hors liste).
