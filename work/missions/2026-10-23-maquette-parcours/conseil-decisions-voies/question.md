# Avis croisé du 24.10 — les décisions remontées par les voies d'audit D124

Niveau « avis croisé » (skill `conseil`) : Brasseur (Fable) et Contradicteur (Opus) ; le pilote tranche. Ces décisions
règlent les contrats des reprises r1 à r6 (pas encore lancées). Règle n° 1 (CLAUDE.md) : « Sa maquette choisie est la base de
l'écran, reprise telle quelle ; jamais une carte ni une règle à sa place. » Ses mots : « Ça a bien avancé mais le rail par
exemple à perdu en fonctionnalités et certaines de mes choix ont été perdue » (D124).

Pour chaque décision : l'option du pilote (déjà écrite dans les contrats), les autres options, la source. Donne pour chacune
« tenir », « changer pour … » ou « montrer en variantes » (choix de goût : L24), en une ou deux phrases sourcées.

## 1. Le pied de la fiche g1 (Styles · Huiles · Sources · Substituts), perdu dans 5345f6ad
Source : `work/missions/2026-10-23-maquette-parcours/voies/p21a-etats-etape-biere-fiche/RESULTAT.md` (« DÉCISION À PRENDRE »),
captures `work/refonte-frontend/v4/choix/etats/captures/etat-fiche-bas-choisie.png` et `-5345f6ad.png`.
Options : (a) rendre les quatre, repliés, comme g1 ; (b) Sources et Huiles seulement, « Substituts » laissé au pont « Sans
Nugget › » ; (c) les laisser retirés. Pilote : **(a)**, contrat `voies/r3-fiche/VOIE.md` ; « Substituts › » ouvre la liste de g1,
et u4 est désormais son choix pour Substituer (D34). La voie p21a recommandait (b) quand Substituer passait pour ouvert.

## 2. Le pas de dose : 2 g (sa base) contre 1 g (5345f6ad) ; le filtre du champ « Ajouter » (nouveau)
Source : même RESULTAT (« DÉCISION À PRENDRE »). Pilote : **2 g comme sa base ; le filtre gardé** (amélioration qui ne contredit
rien), contrat `voies/r1-etape/VOIE.md`.

## 3. « Végétal » : « non situé » (hachuré) dans sa base, placé dans 5345f6ad (« 7 au style · 4 non situées » contre « 6 · 5 »)
Source : même RESULTAT (« Données à vérifier »). Pilote : **le moteur fait foi s'il calcule Végétal, sinon « non situé »**,
recoupé par r2 (contrat `voies/r2-biere/VOIE.md`).

## 4. Suggérer (q2b) et Comparer (r6a) : que rendre des éléments perdus ?
Source : `work/missions/2026-10-23-maquette-parcours/voies/p21b-etats-suggerer-comparer-acquis/RESULTAT.md` (« DÉCISION À
PRENDRE »). Options : (a) rétablir tout ce que ses maquettes choisies montraient (q2b : barres l5b sur l'axe central, groupes par
effet, « Changer de levure », IBU par voie, dry hop actif, remplacer à deux barres, mode Radar « ‹ 10′ › » et « Appliquer »,
menu exclure ; r6a : dock de r6n2 et ses éléments, colonne +, éléments notés) ; (b) rétablir seulement ce qu'il a validé en
toutes lettres, et poser le reste en variantes. Pilote : **(a)**, contrats `voies/r4-suggerer/VOIE.md`, `voies/r5-comparer/VOIE.md`
(« r6a reste le meilleur, tu peux ajouter ça, dans la vue interactive. Avec les quelques petites améliorations des autres
versions » ; « r6n2 donne vraiment bien »). La voie p21b recommandait (b).

## 5. Les ajouts de l'étape : une quantité visible pour chaque houblon (#122, #123) contre « stock en petit badge » (SPEC § 0)
Source : `work/missions/2026-10-23-maquette-parcours/voies/p23-tickets/RESULTAT.md` (« DÉCISION À PRENDRE »). Option prudente
écrite : badge sur la ligne, quantité à un toucher. Pilote : **la base v4.10 fait foi** (étape choisie), le ticket se met à jour.

## Sources que tu peux ouvrir
Les RESULTAT.md cités, leurs captures, `work/refonte-frontend/v4/SPEC-BRASSEUR.md`, `work/refonte-frontend/v4/choix/ecrans.json`,
`cerveau/produit/acquis-valides.md`, `work/refonte-frontend/v4/ecran-1/fils21-choisir/critique/PORTRAIT.md` (Brasseur).
