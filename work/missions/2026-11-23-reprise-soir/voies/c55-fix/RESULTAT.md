OK — C55-1 à C55-4 corrigés en local : c55Regles 44 verts (1 sauté), c48 à c54 et carnets* verts, BUGS OK ; commit de code 797da4604

# RESULTAT c55-fix

## Plan (par règle : endroits, correctif)
- **R23 (C55-1)** : `tbody th` de Comparer (carnets-decider.css, plafond 74 px à 390). Les autres colonnes de libellés (`.cn-ecartes th`, `.cn-place th`, fiche `dt`) n'ont aucun plafond : rien à changer. Correctif : `aMotLong(libelle)` (Comparer.tsx, mot de 11 signes ou plus) pose `data-mot-long` sur le `th` ; `th[data-mot-long] { max-width: 100px }` à moins de 900 px. La colonne n'est élargie que si un libellé l'exige ; les libellés courts gardent 74 px (CRB-3 : trois articles à 390). Mot entier, jamais coupé (c48 R2).
- **R24 (C55-2)** : trois lectures de « la phrase est son propre critère » qui divergeaient : l'aperçu (`apercuCarnet.tsx`, comparait avec le préfixe `ZZ TEST`), l'écriture locale (`rangementCarnets.ts`, idem), `estTitreOuPhrase` (operations.ts, sans préfixe) : l'aperçu promettait, `ranger` jetait le critère parce qu'il égalait le titre. Correctif : une seule règle `estLaPhrase` (envoiRegles.ts) lue par l'aperçu, l'écriture locale et la réponse de l'IA ; `critereMesurable` (analyseLocale.ts) : un critère qui nomme une grandeur (volume, débit, puissance, poids, bruit, pression, température) reste un critère même égal au titre ; « Tuyau silicone 8 mm, 5 m » (critique 5, n° 24) reste le titre. `extraireCriteres` nomme la grandeur de l'unité quand les mots avant le nombre nomment un objet (« marmite de brassage 50 L » : caractéristique « volume », celle que les articles portent). `ecrireIA` (branche créer) : une IA qui ne rend que l'idée, ou pas la mesure promise, ne défait pas le critère local.
- **R25 (C55-3)** : en-tête `cn-cmp-gros` de Comparer (`texteEntete`, unité ajoutée si la valeur ne la porte pas) ; bornes de la jauge de la fiche (`Piste`, prop `unite`). Cellules, libellés de ligne, feuille Articles, tableau du carnet : déjà justes, non touchés. `Reglette` de Choisir (maquette g05-11) : non touchée, test sauté.
- **R26 (C55-4)** : `colonnesComparer` (Comparer.tsx) : offre (prix, ce qui classe, dispo, vendeur, pays) d'abord, puis les caractéristiques par `trierParDecision`, le même tri que la fiche. `groupeDeLigne` (comparer.ts) place la livraison au rang 2, avant les caractéristiques ; ses rangs 3 à 7 ne servent plus qu'à les séparer de l'offre. La ligne qui classe garde sa place (CRB-14). `CarteArticle` et `TableauCarnet` : déjà dans l'ordre de la fiche.

## Fichiers écrits
src/domain/carnets/analyseLocale.ts, comparer.ts, operations.ts ; src/ui/carnets/Comparer.tsx, FicheArticle.tsx, apercuCarnet.tsx, envoiRegles.ts, rangementCarnets.ts, carnets-decider.css ; tests/unit/carnetsComparerPrix.test.ts (voir test touché) ; BUGS.md (C55-1 à 4) ; ce dossier. Rien dans functions/ : banc des liens non rejoué (rien n'y a changé).

## Sorties décisives
- `npx vitest run tests/unit/c55Regles --reporter=dot` : `44 passed | 1 skipped` (tests.log).
- `tests/unit/c4 c5 carnets proprietes` : `60 files, 1224 passed | 2 skipped` (tests3.log) ; `tests/integration/carnets` : 17 verts.
- `npx tsc --noEmit -p .` : 2 erreurs connues seulement (seedData GanttTask, virtual:pwa-register) ; `functions/` : aucune.
- `node scripts/agents/controle-bugs.mjs` : `BUGS OK : 2246 bugs, 510 ouverts, 202 sources`.
- Essais : un passage par règle, 3 ajustements de R24 (voir doutes). Aucun Gemini, aucun déploiement, aucune capture locale (preuve en ligne par le pilote).

## Test touché (hors c48 à c55) : à valider par le pilote
`tests/unit/carnetsComparerPrix.test.ts`, « CRB-14 : l'ordre » : il fixait l'ordre rejeté par C55-4 (dispo, vendeur, pays entre la porte et Exécution). Contradiction directe avec R26 (offre ensemble, en tête) : une seule des deux pouvait rester. Attendu mis à jour : prix, dispo, vendeur, pays, Volume, Performance, Dimensions, Dimensions int., Hauteur de la porte, Largeur de la porte, Exécution, Épaisseur, Couleur (ordre de la fiche : l'énergie avant les dimensions, hauteur avant largeur par le nom). Aucun des tests c48 à c55 modifié. Hors de mon « Possède » : si le pilote refuse, revenir sur ce seul fichier.

## Doutes et limites
1. **R23 non mesuré au rendu.** Le test lit la cascade avec 6,4 px par signe ; « Branchement » = 85 px mesuré, plafond 100 px. Un mot de 11 signes et de lettres larges peut dépasser. À voir en ligne à 390 : « Branchement », « Type de refroidissement », « Mode de fonctionnement », « Quantité de frigorigène », et que trois articles tiennent encore (CRB-3). Le plafond 74 px de la maquette (cmp-a1) reste pour tout libellé court ; le test garde-fou qui lit « 74 » reste vert.
2. **R24, deux effets au-delà du test.** (a) Sans préfixe `ZZ TEST`, « marmite de brassage 50 L » promet maintenant « Ce qui compte · Marmite de brassage 50 L » et le crée (avant : ni promis ni créé, la mesure ne classait rien) ; (b) avec préfixe, « Tuyau silicone 8 mm, 5 m » ne promet plus un critère qu'on ne créait pas. L'IA réelle n'est pas rejouable : le test « idée seule » la représente ; le serveur (carnetIA.ts) n'est pas modifié.
3. **R24, grandeur nommée.** `critereMesurable` ne connaît que L, m³/h, kg/h, L/min, L/h, kW, W, dB, bar, kg, °C ; cm et mm restent sans nom sûr (« fond de bac 38 cm » reste nommé par ses mots). « Moulin à malt 150 kg/h » prend la caractéristique « débit » (avant : « moulin à malt »), la colonne que les articles portent.
4. **R25** : la réglette de Choisir reste sans unité à gauche (maquette g05-11, règle n° 1) : question en attente, voir DÉCISION.
5. Le classement par « plus » met toujours le frigo de 242 L avant la marmite de 50 L (sens « plus »), non touché.

DÉCISION À PRENDRE : la borne gauche de la réglette de Choisir (g05-11, test R25 sauté) prend-elle l'unité ? Options : oui / non, la maquette reste. Recommandation : la poser avec R22 en mini maquettes, comme c55-tests l'a dit.
CONNAISSANCE : trois lectures de « la phrase est son propre critère » vivaient en parallèle (aperçu, écriture locale, `estTitreOuPhrase`) ; elles lisent maintenant `estLaPhrase`. À noter : un plafond de largeur sur une cellule de tableau s'écrit par attribut (`data-mot-long`), pas par un plafond plus large pour tous : la colonne ne s'élargit que de ce qu'il faut.
LEÇON PROPOSÉE : aucune.
