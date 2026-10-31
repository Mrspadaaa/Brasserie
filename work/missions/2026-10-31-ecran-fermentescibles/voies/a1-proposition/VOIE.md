# Voie a1-proposition — les tuiles proposées à l'ouverture, choisies selon le style, comme pour les houblons

- Mission : 2026-10-31-ecran-fermentescibles
- Agent : auteur
- Modèle : sonnet
- Niveau : jugement (donnée, règle du moteur, code et tests)
- Plafond : 90 tours ; 3 essais par critère
- Décideur en cas de doute : pilote (`DÉCISION À PRENDRE : …` dans RESULTAT.md, option prudente et réversible)

## Ses mots (D222)
Il a choisi s1, la recherche sous le champ en tuiles (« Tuiles sur deux colonnes : étoile si épinglé, teinte en EBC, stock. »). Il
a dit : « C'est très bien avec algo de reconnaissance pour le style et autres comme pour les houblons ». Puis : « Dans le proposition ».
Puis, sur sa capture où il entoure les tuiles de l'ouverture (`choix-v7/sa-capture-s1-propositions.jpg`) : « Non je parle de ces
propositions ».

Portée (lecture du pilote, D222) : **les tuiles que le champ propose à l'ouverture, avant toute frappe**. La forme de la tuile ne
change pas. En tapant, la pertinence de la frappe prime toujours (D221).

## Objectif
Remplir `src/domain/fermentables/proposition.ts`. Le pilote y a posé le contrat (`EntreeProposition`, `Proposition`,
`proposerFermentables`, `PROPOSITION_RULE`) et une règle provisoire. **Ne change pas la signature** : le port de l'étape l'appelle en
même temps que toi. Si un champ te manque, ajoute-le en facultatif et dis-le.

Sur le modèle de l'ajout des houblons :
- `src/domain/hopIndex/v4/quickAdd.ts`, sa `QUICK_ADD_RULE` ;
- la typicité f9 : `src/domain/hopIndex/v4/typicite.ts`, `typicite-acces.ts` et `scripts/collecte-hop/typicite-styles.mjs`.

Le travail :
1. **La donnée** : la place de chaque fermentescible dans les recettes de chaque style, tirée de Beer Analytics (www.beer-analytics.com,
   CC BY-SA 4.0, robots.txt permis sauf `/wa/`).
   - Mesure d'abord ce que le site publie pour les fermentescibles : pages, graphiques et JSON publics, l'équivalent de
     « typical-styles-relative » des houblons. Dis-le dans RESULTAT.md.
   - Écris le script de collecte `scripts/collecte-malt/typicite-malts.mjs`, sur le modèle du script des houblons. Il range les
     relevés bruts dans `src/data/fermentableSources/` et la table dérivée dans `src/data/fermentables/typicite-styles.json`, avec la
     licence en tête. Il prend un mode `--verifier` qui recalcule depuis les relevés sans réseau et imprime `TYPICITE MALTS OK` ou
     `ECART`.
   - Requêtes polies : une à la fois, avec une pause, rien d'autre que ce site. Si le site ne publie pas cette donnée, n'invente rien.
     Écris `DÉCISION À PRENDRE` et garde la règle sans typicité : l'inconnu reste neutre, jamais 0.
2. **Les noms** : relier les noms du stock aux noms de Beer Analytics. Les noms du stock sont allemands ou de malterie, par exemple :
   - Pilsner Malz → Pilsner ;
   - Münchner Malz → Munich ;
   - Weizenmalz hell → Wheat ;
   - Haferflocken → Flaked Oats ;
   - Carapils → Carapils / Carafoam ;
   - Caramünch, Carahell, Carafa, Röstgerste…

   Une table courte et testée dans `src/domain/fermentables/noms.ts`. Elle sert aussi d'**alias de la frappe** de D220 : Munich →
   Münchner Malz, Pils → Pilsner Malz, Pale → Pale Ale Malz, Weizen / Wheat / Blé → Weizenmalz hell, Cara → Carapils,
   Avoine → Haferflocken. La maquette les a dans `v7/s1/commun-p7.mjs`. Exporte une fonction qui rend le nom canonique, ou `null`.
   Un nom inconnu reste inconnu.
3. **La règle** (`PROPOSITION_RULE` écrite, puis le code), un classement lexicographique comme pour les houblons :
   - les articles déjà dans la recette sont écartés ;
   - la typicité dans le style visé, par paliers : connue d'abord, inconnue ensuite, jamais 0 ;
   - « et autres » : la teinte, si `ebcVise` est connue (un malt qui éloigne la bière de la plage du style passe après), puis les
     disponibles avant les épuisés, les épinglés, le nom.

   Dis où vont les épinglés. Le pilote propose : la typicité d'abord, l'épinglé départage. Écris ton choix et ta raison, c'est
   réversible. Pour le sucre et le fruit, même règle quand la donnée existe, sinon la provisoire.
4. **Tests** dans `tests/unit/fermentables/`. Témoins, écrits rouges contre la règle provisoire avant ton code (L13) :
   - German Pils (5D) : Pilsner Malz avant Caramünch II ;
   - une stout (15B ou 16A) : un malt torréfié avant Carapils, s'il est au stock ;
   - un article sans donnée passe après ceux qui en ont une, et n'est jamais écarté ;
   - un épuisé passe après un disponible de même rang ;
   - « Munich » → Münchner Malz ; un nom inconnu → `null`.

## Possède (seuls chemins où écrire)
- `src/domain/fermentables/` (proposition.ts, noms.ts, et ce qu'il te faut)
- `src/data/fermentables/`, `src/data/fermentableSources/`
- `scripts/collecte-malt/`
- `tests/unit/fermentables/`
- `work/missions/2026-10-31-ecran-fermentescibles/voies/a1-proposition/`

Interdits :
- `src/pages/BrewWizard.tsx`, `src/ui/` : le port de l'étape est une autre voie, en même temps que toi ;
- `src/domain/hopIndex/` : en lecture seulement ;
- `functions/` ; `functions/.env` (ne pas le lire) ; le manifeste ; `.codex/`.

Aucun Gemini, aucun serveur dans `C:/Users/mrspa/Documents/Brasserie`, aucune installation, pas de `git stash`, aucun commit.

## D'abord
Écris `COMPRIS.md` dans ce dossier, avec ces parties : Objectif, Écrit dans, Fini quand, Ne fait pas, Doutes. Lance G1.

## Critères
`GATES.md`, même dossier. Ne pas le modifier. Lancer chaque `CHECK:` depuis la racine.

## Rendre
`RESULTAT.md` :
- ligne 1 : `OK — <n> styles, <n> fermentescibles, règle : <clés dans l'ordre>` ou `ECHEC — …` ;
- ce que publie Beer Analytics (adresses lues) ;
- la règle et ses raisons ;
- la table des noms ;
- `TEMOIN AVANT` (sortie rouge de la règle provisoire) ;
- `German Pils` et `Stout` avec leur ordre obtenu ;
- la licence (`CC BY-SA`) ;
- `LEÇON PROPOSÉE : …` ou `aucune`.

Puis une ligne au pilote.
