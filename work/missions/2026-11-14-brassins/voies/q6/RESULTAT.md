ECHEC — G3 : 2 tests port-p7 (e2a) tombent sur `BatchDetailSheet.tsx:263` (hooks, voie q5 en cours), pas sur la liste ; tout le reste tenu.

# q6 — résultat (15.11)

## Défauts [B] (et non bloquants) corrigés
- [x] e6a n° 1 : période de départ « Nov. + en cours » (`CRITERES_VIDES.periode` = mois + les en cours, jamais cachés ; « Toutes » élargit ; ni l'un ni l'autre ne compte comme critère posé). Sans dupliquer `periode.ts` (`estEnCours`). Reste hors voie : voir DÉCISION.
- [x] e6c n° 1 : alcool provisoire du brassin en cuve, en pointillé, hors du décompte « sans valeur » (`abvDe` → `modeleFiche().alcool`, la fonction de la fiche gfc). Capture : « 1 sans valeur » (le planifié), NEIPA et Pils en pointillé.
- [x] e6a n° 2 : bouton à barres retiré de la ligne ; « Voir les analyses des brassins › » rangé dans la feuille de filtres.
- [x] e6a n° 3 : retard avant garde dans « À suivre d'abord » (tri stable sur `retardDe`).
- [x] e6a n° 4 : style abrégé en pastille sur la ligne du nom (`styleCourt` : NEIPA, APA, DIPA, IPA, ESB ; autre style tel quel, titre = nom complet).
- [x] e6a n° 5 : « 6,0 % » (`abvFr`, une décimale fixe).
- [x] e6a n° 6 : « fût 20 L » depuis le stock (`getStocks().kegs`, fût de la fixture) ; sinon « fût, taille non notée ».
- [x] e6a n° 7 : « Chercher dans Archives » sur une ligne (`nowrap`).
- [x] e6a n° 8 : icône boîte d'archive (`Archive`).
- [x] e6a n° 9 : puces en retour à la ligne à 1280.
- [x] e6c n° 2 : étendue des valeurs au milieu (« 5,3 – 6,0 »), bornes élargies d'un cran (4,0 / 7,0) ; poignées alignées sur les bouts de la piste (décalage de 12 px corrigé).
- [x] e6c n° 3 : bande des brassins sans « … » : nom entier s'il tient en 9 lettres, sinon le style abrégé (titre = nom).
- [x] e6c n° 4 : six tuiles sur deux rangées ; « Notes à compléter » sous « + autres critères » (déplié d'office si posée).
- [x] e6c n° 5 : styles abrégés dans les puces de la feuille.
- [x] e6c n° 6 : « 2 en cuve, sur 5 » (le filtre posé se nomme) ; vide : « pour Stout en cuve ».
- [x] e6c n° 7 : « Le Stout est conditionné : retire un critère » (`titreExclusion`, repli sur la phrase générale).
- [x] e6c n° 8 : boutons « Retirer » triés par nombre rendu, décroissant.
- [x] e6c n° 9 : anneau de focus du × seulement au clavier (classe `lst-ptr` posée à l'ouverture sans clavier).
- [x] e6c n° 10 : point « Terminés » plus clair en cave (`--lst-fin` : cave-400 en cave).

## Fichiers
`src/ui/production/liste/` (listeModel.ts, ListeBrassins.tsx, CarteBrassin.tsx, FeuilleFiltres.tsx, liste.css), `src/ui/production/ProductionCatalog.tsx` (kegs), `tests/unit/port-q6-liste.test.tsx` (15 tests), `tests/unit/port-q2-liste.test.tsx` et `tests/unit/port-p7-phrase-rebrasser.test.tsx` (adaptés : période « Toutes », phrase propre à la liste, analyses dans la feuille), `q6/banc.mjs`, `q6/captures/` (17 PNG, 390 clair tous états, cave et 1280 au repos), `q6/tests.txt`.

## Critères
- G1 : 18 lignes cochées pour 2 [B] (COCHE OK).
- G2 : `TSC OK` (une erreur de `BatchDetailSheet.tsx` vue en cours de route, disparue au dernier rejeu : voie q5).
- G3 : 190/192. Échecs : `port-p7` e2a ×2, « Rendered more hooks than during the previous render » dans `BatchDetailSheet` (`src/ui/BatchDetailSheet.tsx:263`, modifié par la voie q5), la fiche s'ouvre maintenant que le Saison reste visible. À rejouer quand q5 a fini ; rien à corriger côté liste.
- Banc : `BANC OK 17 captures`, aucun geste sans effet. Toutes ouvertes à côté de leur maquette (repos, repos-bas, vide, e6c repos/geste/vide/défile en 390 clair ; repos cave et 1280).
- Intégration `tests/integration/productionCatalog.test.tsx` : 4 échecs, tous dus au remplacement de la barre d'outils par la liste e6a (q2 : « Dossier des brassins » ; q6 : « Afficher les analyses » n'est plus sur la ligne). Ce fichier est hors de mon périmètre : à adapter par le pilote (ouvrir « Filtrer », « Voir les analyses des brassins »).

## Écarts vus (D344) : restants, non bloquants
1. La bande de la feuille montre le style abrégé pour un nom long ; deux brassins du même style y portent le même mot (le lot reste sous l'étiquette d'état dans la liste).
2. 1280 : l'en-tête de l'app garde son sélecteur « Tout l'historique » (hors voie).
3. Ordre des puces de style : par nombre puis alphabet (la maquette : ordre de saisie).
4. Fixtures du banc rapprochées d'aujourd'hui (Stout et Saison dans le mois) : la liste cache maintenant les terminés d'un autre mois, comme sa maquette l'annonce.

## DÉCISION À PRENDRE
`ProductionTab.tsx` (ligne 178 et 193, hors de ma voie) passe encore à la liste `brassinsListe` (déjà filtrée par la période de l'en-tête). Si l'en-tête dit autre chose que « Tout l'historique », « Toutes » de la feuille ne peut toujours pas élargir. Recommandé : `batches={batches}` à la place de `brassinsListe` pour `subTab === 'batches'` (une ligne) ; la liste applique alors seule sa période. Sans ce geste, le réglage reste visible deux fois (en-tête et liste).

CONNAISSANCE : `criteresPoses` ne compte plus la période de départ (mois, « Toutes ») comme critère ; seuls « Cette année » et « Dates » comptent. Le défaut « mois + en cours » masque un Terminé d'un autre mois sans le dire : la bande « n autres hors du filtre » ne le compte pas.
LEÇON PROPOSÉE : aucune
