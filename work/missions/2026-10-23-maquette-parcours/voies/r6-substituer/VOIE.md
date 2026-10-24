# Voie r6-substituer — Substituer de u4, son choix du 19.10, tous ses états

- Mission : 2026-10-23-maquette-parcours ; contrat commun : `../REPRISE-D124.md` (à lire d'abord, en entier)
- Agent : concepteur
- Modèle : opus
- Niveau : conception
- Plafond : 110 tours ; 3 essais par critère
- Dépend de : p24 (le contrôle des états)
- Décideur en cas de doute : pilote ; aucune question bloquante

## Ses mots et la décision
« Substitution, ça serait plus du u4 » (19.10, SPEC-BRASSEUR l. 217 ; le jury mettait u3 devant) ; « Ajouter, vue ->
substituer à faire dans le git » (23.10, #145). Le conseil complet du 24.10 (`cerveau/decisions/2026-10-24-lot-d125-vues.md`,
D34) : u4 est son choix ; la « porte vers Comparer » du conseil du 22.10 était une carte mise à sa place (règle n° 1). Le
registre passe à « choisi u4 » (pilote). Ce n'est pas un fil de fer : c'est une reprise, comme r1 à r5.

## Sa maquette choisie
`work/refonte-frontend/v4/ecran-1/fils11-substitution/u4/vue.html` et sa `NOTE.md` ; capture
`work/refonte-frontend/v4/ecran-1/fils11-substitution/captures/u4-vue-390.png` ; brief du lot
`work/refonte-frontend/v4/ecran-1/fils11-substitution/BRIEF-AUTEUR.md`. L'écran actuel de la maquette (la porte) :
`prototypes/houblons-v4/parcours/src/ecrans/substituer/` et sa capture `work/refonte-frontend/v4/choix/commentaires/captures/p22-substituer-repos.png`.

## Ce que tu fais
1. **L'inventaire d'abord (L03)** : joue u4 dans Chrome, relève chacun de ses états et gestes (repos, chaque toucher,
   chaque réglage, chaque remplaçant ouvert), au format des relevés de p21a et p21b, avec `voulu` et `verif`
   (contrat de `work/refonte-frontend/v4/tournoi/outils/controle-etats.mjs`, voir son en-tête et
   `../p24-controle-etats/RESULTAT.md`) : `work/refonte-frontend/v4/choix/etats/substituer.json`, captures
   `work/refonte-frontend/v4/choix/etats/captures/etat-subst-*-choisie.png`. Joue aussi chaque état sur 5345f6ad
   (`prototypes/houblons-v4/maquettes/parcours-5345f6ad/substituer/etat.html`) et rends le verdict.
2. **La reprise** : l'écran Substituer de la maquette devient u4, telle qu'elle est, avec le moteur en direct (remplaçants
   classés, dose au même IBU, gagné et perdu ; ticket #126), plancher à enrichir (L07). On y entre depuis la carte de
   l'étape (« Sans Nugget › ») et depuis la fiche (« Substituts › », voie r3) : garde ces ponts.
3. **Corriger ce que le conseil a vu** sur la porte actuelle, si u4 le porte aussi : « arôme 100 » affiché pour un
   houblon qui « perd » six familles et n'en « gagne » aucune (honnêteté) ; une colonne coupée à 390 px ; à 60′, des
   arômes que l'ébullition fait disparaître (dire « à 60′, surtout l'amertume »).
4. Garde D120 (« Annuler » à côté de « Remplacer », sans effet sur la recette) et D109 (la croix).
5. La greffe « remplacer par un mélange » (avis Audacieux) : seulement si u4 la porte déjà ; sinon, écris-la dans
   RESULTAT.md comme proposition, sans la construire.

## Possède
- `prototypes/houblons-v4/parcours/src/ecrans/substituer/**`
- `prototypes/houblons-v4/maquettes/parcours-substituer/**`
- `work/refonte-frontend/v4/choix/etats/substituer.json`, `work/refonte-frontend/v4/choix/etats/captures/etat-subst-*`
- `work/missions/2026-10-23-maquette-parcours/voies/r6-substituer/RESULTAT.md`
`fiche/briques.tsx`, `fiche/FicheHoublon.tsx` (voie r3) et `ma-biere/Lentille.tsx`, `ma-biere/repere.ts` (voie r1) sont lus
par Substituer : ne les modifie pas.

## Critères
Dans `GATES.md`, même dossier. Ne pas le modifier. Lancer chaque `CHECK:` depuis la racine du dépôt.

## Rendre
RESULTAT.md (inventaire de u4, états rendus, captures côte à côte, décisions) ; réponse finale au pilote : une ligne.
