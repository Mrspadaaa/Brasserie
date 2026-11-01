# Voie f1-options — les options imprimées dans le nom : l'état du malt, traduit, hors du nom (D275)

Agent : `auteur` (Sonnet). Plafond : 70 tours. Pilote : Opus. Un seul temps (module pur, pas de plan relu). Aucun commit, aucun déploiement.
Relire `work/missions/2026-10-31-ecran-depense/voies/COMMUN.md` (exigences communes) : il vaut ici, sauf « Deux temps ».

## Ses mots (SPEC-BRASSEUR, 01.11 nuit, mot pour mot)
- « Il y a plein de problème sur cette vue, déjà pas de traduction. Ensuite le concassage n'est pas un produit mais un état du malt. C'est
  pas du tout compacte, comme demandé, et ça créé de base automatiquement un nouveau produit du ça arrive pas à lié à un stock. »
- D271 : « Langue utilisée pour les factures, allemand, anglais, français, italien. Ça traduits en français et fait le bon lien » ;
  « Italien possible aussi mais beaucoup plus rare ».
- D261a : un nom sans doublon (l'unité, l'α, la contenance ne se répètent pas dans le nom quand une colonne les montre).

## Le défaut, sur sa commande (doc14, lecture D272b)
La lecture rend `name` = « CARABELGE®, Kg » et `variant` = « Mischung: Einzelprodukt, Schrotung: geschrotet [+CHF 0.10] ».
`libelleDeLigne` (`src/ui/depense/etat.ts:128`) les colle : la ligne s'appelle « CARABELGE®, Kg · Mischung: Einzelprodukt, Schrotung:
geschrotet [+CHF 0.10] ». Ce libellé sert au nom affiché (trois lignes à 390), au rapprochement du stock (aucun article ne porte ces mots :
rien ne se relie) et au nom de l'article neuf (« Créer « CARABELGE· Mischung… » »). Idem « Premium Pilsner Malz, Kg » et « SPECIAL W®,
Gramm » (supplément « [+CHF 0.0001] » par gramme).

## À faire
1. Module pur `src/ui/depense/optionsDuNom.ts` (aucun React, aucun service, aucun réseau) :
   `lireOptions(nom: string, variante: string | undefined, unite: string): OptionsLues` avec au moins
   - `base` : le nom propre de la ligne, sans les options, sans le suffixe d'unité qui double la colonne (« , Kg », « , Gramm », « , 1 Kg »
     quand il dit la même chose que l'unité lue), sans l'espace ni la ponctuation qui restent ; la marque (« ® ») et le reste du nom
     restent tels qu'imprimés. C'est le libellé de la ligne : affichage, rapprochement, nom de l'article neuf.
   - `etat` : l'état du produit, en français, s'il est imprimé (`{ cle: 'concasse' | 'grain', texte: 'concassé' | 'grain entier' }`) ;
     « Schrotung: geschrotet », « geschrotet », « fein geschrotet », « gemahlen » ; « crushed », « milled » ; « concassé », « moulu » ;
     « macinato » → concassé. « ungeschrotet », « nicht geschrotet », « uncrushed », « whole », « non concassé », « grain entier »,
     « non macinato », « intero » → grain entier. Jamais un état deviné : absent si rien n'est imprimé.
   - `supplement` : le supplément par unité imprimé (« [+CHF 0.10] » → `{ montant: 0.10, devise: 'CHF' }`), pour l'option qui le porte ;
     il est déjà compris dans le prix unitaire lu (1,90 = 1,80 + 0,10) : le module ne recalcule aucun prix.
   - `options` : les autres options, traduites en français quand le mot est connu (`{ cle, texte }`) ; « Mischung: Einzelprodukt » (un
     produit seul, pas un mélange) ne dit rien au brasseur et ne donne aucune option ; « Mischung: <autre> » → « mélange : <autre> ».
   - `restes` : ce que le module ne comprend pas, tel qu'imprimé (rien ne se perd ; l'écran le montrera dans le détail de la ligne).
   Les quatre langues (allemand, anglais, français d'abord ; italien par les mots de base). Accents, majuscules, deux-points, virgules,
   crochets et « · » tolérés. Une variante qui n'est pas une liste d'options (une couleur, un poids : « 11g », « 500 g ») reste dans
   `restes` ou dans `base` comme aujourd'hui (`libelleDeLigne` la garde si le nom la contient déjà).
2. `libelleDeLigne` reste exporté et inchangé (il a des tests) ; la voie suivante (f3, l'écran) branchera `lireOptions`. Ne touche pas
   `ExpenseSheet.tsx`, `etat.ts`, `stockLineMatching.ts`.
3. Tests `tests/unit/depense/options/` : rouge d'abord sur le code d'aujourd'hui (un test qui montre que `libelleDeLigne` donne le libellé
   collé de la commande doc14 et qu'aucun module ne rend la base ; la sortie dans RESULTAT.md, « TEMOIN AVANT : »), puis :
   les trois malts de doc14 (`tests/unit/depense/banc-k6/piece.ts`, sa forme sans données personnelles) → bases « CARABELGE® »,
   « Premium Pilsner Malz », « SPECIAL W® », état concassé, suppléments 0,10 / 0,10 / 0,0001 ; chaque langue, avec et sans deux-points ;
   « ungeschrotet » ; une variante inconnue → `restes` ; un nom sans variante → base = nom (moins le suffixe d'unité) ; un nom de
   houblon « Styrian Goldings 4.5% » → base inchangée (l'α est l'affaire de `sansAlphaDoublon`).
4. Balayer toutes les variantes et tous les noms lus des 14 pièces du banc
   (`work/finalisation-tickets-2026-10-08/H13-reels/banc-d272b-hl/results.json`, `records[i].variants['Csv8+N'].result.items[]`, champs
   `name`, `variant`, `unit`) : compter ce que `lireOptions` comprend et ce qui reste en `restes`, sans recopier aucun nom d'achat privé
   (doc2, doc4, doc13 : ni dans les tests, ni dans RESULTAT.md). Rendre ce compte.

## Critères (rejoués par le pilote)
- `npx vitest run tests/unit/depense/options --maxWorkers=2` : tout vert ; témoin rouge noté avant.
- `npx vitest run tests/unit/depense --maxWorkers=2` : rien de cassé (seul `tests/unit/depense/fiche/ecran.test.tsx` échoue hors copie,
  faute de `zxing-wasm` dans ce dépôt : c'est connu, ne rien installer).
- `npx tsc --noEmit -p tsconfig.json` : aucune erreur dans tes fichiers.
- `git status --short` : rien hors de « Possède ».

## Possède
`src/ui/depense/optionsDuNom.ts`, `tests/unit/depense/options/**`, `work/missions/2026-10-31-ecran-depense/voies/f1-options/**`.

## Rendre
`RESULTAT.md` (ligne 1 `OK — …` ou `ECHEC — …`), selon COMMUN.md. Réponse au pilote : une ligne.
