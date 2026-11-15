OK — passe 2 : 12 mini maquettes corrigées (frigo de p5b, rouge et pointillé réservés), MINIS OK

## Fichiers écrits (tous dans voies/m3)
- `fabrique.mjs` (écrit les 12 `etat.html` et `NOTE.md`, puis capture à 390 px, échelle 2) ; `planche.mjs` (planche de contrôle visuel) ;
  `tests.txt`.
- Par variante, `<id>/etat.html`, `<id>/<id>.png` (780 px de large) et `<id>/NOTE.md` (10 lignes au plus).

| id | genre | idée | image ouverte |
|---|---|---|---|
| m3pr-a | a tiède | PlanSheet rangé : bascule À payer / À recevoir, 8 puces de catégorie, répétition en segment, coût des brassins en 3 radios | oui |
| m3pr-b | b froide | nom, montant, date au-dessus du clavier décimal ; trois pastilles gardent les défauts | oui |
| m3pr-c | c chaude | frise des répétitions et marches p5b : fin janv. −892,66 → −1 028,66 | oui |
| m3pr-d | d libre | « Prévoir à nouveau » : recopier un paiement de novembre (v6a), le loyer déjà prévu grisé | oui |
| m3pm-a | a tiède | UpgradeSheet rangé, interrupteur « Dans mes prévisions », plis résumés | oui |
| m3pm-b | b froide | demi-feuille : nom, 750,00, janv. 2027, interrupteur ; le reste en une rangée | oui |
| m3pm-c | c chaude | budget en barre (pose « ? »), mois sur frise, fin de mois avec / sans (−892,66 / −142,66) | oui |
| m3pm-d | d libre | piste Idée → À étudier → Devis → Prêt → Acheté → En service, chaque champ à sa station | oui |
| m3im-a | a tiède | AssetSheet rangé : catégories AFC avec taux, méthode dite par son effet, départ confirmé groupé | oui |
| m3im-b | b froide | demi-feuille : « Elle perd en 2026 −288,00 », 1 440,00 → 1 152,00 | oui |
| m3im-c | c chaude | barres année par année, segment 20 % du reste / 10 % du prix, curseur part pro | oui |
| m3im-d | d libre | plaque rivée de la cuve, années en tickets poinçonnés, fin de vie visible | oui |

## Critères
- G1 : `node work/missions/2026-11-14-finances/outils/controle-minis.mjs work/missions/2026-11-14-finances/voies/m3 m3pr-a,…,m3im-d`
  → `MINIS OK (12 maquettes, 3 vues)` (exit 0, recopié dans `tests.txt`).
- `type="number"` : 0 fichier. Aucun appel réseau : polices système (Source Sans 3 / IBM Plex Mono si installées, sinon Segoe UI / Consolas).
- `git status` : rien d'écrit hors de `voies/m3`.

## Captures
`work/missions/2026-11-14-finances/voies/m3/<id>/<id>.png`, les 12 ouvertes (planches de 4 ; m3pm-a, m3pm-c, m3im-a et m3im-d
refaites après une première lecture : barre de janvier qui débordait, libellés coupés, ticket 2026 cassé).

## Données
Fixture et maquettes choisies : électricité 68,00 payée le 9 nov. (v6a), sorties et soldes de p5b (fin janv. −892,66, fermenteur
compris), fermenteur 700,00 + 50,00 (fixture), cuve 1 800,00, 20 % dégressif, départ 2026 1 440,00 (fixture et g6). L'inconnu reste
« ? » (pose, usure, mois hors des 90 jours). Aucune hachure (elle veut dire « à payer »).

Prédiction : « m3pr-d et m3pm-d, ça c'est malin ; la c du projet me dit enfin si je peux me payer le fermenteur en janvier. »

DÉCISION À PRENDRE : aucune (les choix se montrent au brasseur dans la page de choix du pilote).
CONNAISSANCE : aucune.
LEÇON PROPOSÉE : aucune.

## Passe 2 (14.11)
- Défauts du critique (SYNTHESE.md, lignes « | m3… ») corrigés dans les mêmes ids, sans changer de genre ni greffer ; régénérés par `fabrique.mjs` (planches par `planche.mjs`) ; v0 copiée hors dépôt avant retouche.
- Projet matériel (m3pm-a à d) : le projet est le frigo de p5b derrière (2 800,00 + livraison 200,00 = 3 000,00, payé le 15.11, pose ?, usure 5 ans = 600,00 par an comme sa fiche). Soldes recalculés sur les sorties de p5b : avec, fin nov. 664,18, déc. 257,34, janv. −892,66 ; sans, 3 664,18, 3 257,34, 2 107,34 (= « Sans frigo 2 107,34 » de p5b). m3pm-c montrable ; m3pm-d tient sur un écran.
- Rouge = en retard seulement, pointillé = sans pièce seulement, sur les 12 : `grep alerte|dashed|dasharray` dans `fabrique.mjs` ne trouve plus que la déclaration des jetons (le rouge de p5b derrière est sa maquette, intouchée).
- Prévision : m3pr-a « À payer » noir, Ventes / Apports grisés en trait plein, pied en une ligne ; m3pr-b montant noir ; m3pr-c « −68 » au-dessus des marches, « 31 janv. » dégagé, échelle 4 000 à −1 000, « Compte dans mon litre ? » ; m3pr-d vente « Ventes », dates en trait plein, « compte dans mon litre ? », sous-titre retiré.
- Bien amorti : m3im-a « Année · Valeur 1er janv. · Comptée », taux dit une fois (case « Taux % » retirée) ; m3im-c cadres « si 10 % » remplacés par un chiffre (−180,00 en 2026), « 1 440 » dégagé, « Valeur 1er janv. » ; m3im-d tickets sur toute la largeur, « 2027 et 2028 : prévues » ; m3im-b inchangée (aucun défaut).
- Chaque NOTE.md : une ligne « passe 2 : défauts corrigés » (6 à 7 lignes).
- Tests : `node work/missions/2026-11-14-finances/outils/controle-minis.mjs work/missions/2026-11-14-finances/voies/m3 m3pr-a,…,m3im-d > …/m3/tests.txt` → exit 0, `MINIS OK (12 maquettes, 3 vues)`. `type="number"` : 0 fichier. `git status` : rien hors de `voies/m3`.
- Images rouvertes : les 12 (m3pm-a à d en plein format, les autres en planches de 3) ; m3pm-c refaite une fois (« Avec frigo, fin janv. » tenait sur deux lignes).
- Prédiction : « Là, le frigo colle avec l'escalier derrière, et je vois ce qu'il me reste sans lui. »
- DÉCISION À PRENDRE : aucune. CONNAISSANCE : aucune. LEÇON PROPOSÉE : aucune.
