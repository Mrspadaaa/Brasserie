ECHEC — G5 : 106 mots au premier écran > 98 (sa p4b2f en a 106) ; G1 à G4 verts

Dryhopper est rendu en p4b2f, tous ses états relevés puis rendus sur le moteur en direct. La continuité D129 tient. Un seul
critère tombe, le compte de mots de G5 : son contrôle échoue sur sa maquette elle-même, et je n'ai pas retiré ses mots
(règle n° 1). Avec `--sans=mots` (forme prescrite par REPRISE-D124 et par la batterie), COMMUN OK, puis ANNULER OK.

## Fichiers écrits
- `prototypes/houblons-v4/parcours/src/ecrans/dryhopper/index.tsx` (réécrit en p4b2f), `dryhopper.css`, `frise.ts`
  (paramètre `jours`), `mesures.ts` (`dureeDeContact`, E10), `jeu.mjs` (gestes de p4b2f), `NOTE.md` (« Reprise D43 »)
- `work/refonte-frontend/v4/choix/etats/dryhopper.json` (24 états : 21 rejoués, 3 voulus)
- `work/refonte-frontend/v4/choix/etats/acquis.json`, entrée `etat-acquis-y1b-brassin-au-doigt` (verif sur p4b2f,
  `heritier`, `attend_choix` retiré ; déjà emportée par le commit d30e8402 du pilote)
- `work/refonte-frontend/v4/choix/etats/captures/etat-dryh-*-choisie.png`, `etat-dryh-*-construite.png`,
  `etat-dryh-acquis-y1b-construite.png`
- `prototypes/houblons-v4/maquettes/parcours-dryhopper/` (construction)

## Critères (rejoués depuis la racine)
- G1 : `CONSTRUIT OK (9 pages) → prototypes/houblons-v4/maquettes/parcours-dryhopper/`
- G2 : `ETATS OK (21/21) ; 3 voulu(s) non rejoué(s) sur ses maquettes choisies`
- G3 : `ETATS OK (21/21) ; 3 voulu(s) non rejoué(s)` puis `ETATS OK (1/1)` (acquis y1b)
- G4 : `RAIL OK 1/1` puis `CONTINUITE OK (6 écrans × 2 largeurs)`
- G5 : `COMMUN ECHEC 1 contrôle(s)` : `mots ECHEC`, `dryhopper 106 mots (> 70)`, `MOTS ECHEC 1/1 au-dessus de 98`. Les onze
  autres contrôles sont OK. `controle-annuler` seul : `ANNULER OK (3 routes × 2 largeurs)`. Sa page p4b2f passée au même
  compte : `p4b2f 106 mots (> 70)`.
- Contrat REPRISE : `controle-commun --sans=mots` → `COMMUN OK` ; `controle-teinte --ecran=dryhopper` → `TEINTE OK 1/1` ;
  `controle-choix --ecran=dryhopper` → `CHOIX OK (1 écran(s) conforme(s) à son choix ; 0 ouvert(s))`.
- En plus : `controle-une-question` → `UNE-QUESTION OK (1 groupe libre : moment)` ; `jouer-parcours --etape=dryhopper` →
  `ETAPE OK (dryhopper)` ; `parcours-complet` → `PARCOURS OK (29 gestes à 390, 29 à 1280)` ; `verifier-types` → `TYPES OK`.

## États rendus (ma capture ; la sienne est au même nom en `-choisie.png`, ouvertes côte à côte)
Dossier : `work/refonte-frontend/v4/choix/etats/captures/`
- repos : `etat-dryh-repos-construite.png`
- ★ : `etat-dryh-etoile-construite.png`
- bandeau des quatre chiffres : `etat-dryh-bandeau-construite.png`
- courbes et aire du floral : `etat-dryh-courbes-construite.png`
- bosse de levure : `etat-dryh-bosse-levure-construite.png`
- bande d'amertume : `etat-dryh-amertume-construite.png`
- moments mesurés sur l'axe : `etat-dryh-mesures-axe-construite.png`
- rail au repos : `etat-dryh-rail-construite.png`
- loupe (doigt tenu) : `etat-dryh-loupe-construite.png`
- étape ébullition : `etat-dryh-etape-ebullition-construite.png`
- étape WP : `etat-dryh-etape-wp-construite.png`
- étape après : `etat-dryh-etape-apres-construite.png`
- 1 j : `etat-dryh-jour-1-construite.png`
- 7 j : `etat-dryh-jour-7-construite.png`
- 12 barres : `etat-dryh-barres-construite.png`
- « ? → ~+21 » : `etat-dryh-avant-inconnu-construite.png`
- absolu : `etat-dryh-absolu-construite.png`
- légende : `etat-dryh-legende-construite.png`
- vraie valeur : `etat-dryh-mesure-construite.png`
- pont Levure (repos, toucher) : `etat-dryh-pont-levure-construite.png`, `etat-dryh-pont-levure-toucher-construite.png`
- voulus (capture seule) : `etat-dryh-fiche-construite.png` (D25), `etat-dryh-annuler-construite.png` (D120, D129) ; la
  croix (D109) n'a pas de déclencheur propre (tête commune)
- acquis y1b : `etat-dryh-acquis-y1b-construite.png`

## Écarts à sa maquette (détail dans NOTE.md)
- DÉCISION : le rail reste sous l'axe du graphique (sa capture) ; « le rail au-dessus du pied » est tenu sans le déplacer.
- DÉCISION : sa page blanche des outils (D106, D129) au lieu de sa page grise ; ses deux blocs gardent leur blanc avec un
  filet. Pour tenir au-dessus du pied, « ? » et la lecture montent sur la fin de la ligne de contexte, et les espacements
  se resserrent (2 à 4 px chacun).
- DÉCISION : l'écran s'ouvre sur ★ (son rail s'ouvre ainsi) pour un ajout neuf seulement, une fois, dans le brouillon.
- DÉCISION : la mesure « 1 h ≈ 96 h au nez (Titus 2021) » porte sur Cascade ; la ligne le dit (« sur Cascade », L14).
- D35 : deux textes de la levure décalés (ils se chevauchaient sur sa page) ; D46 : le pouce suit le doigt ; D106 : aire
  du floral à 18 % (22) ; S4 : chevron à 12 px.
- Données : Végétal « ? » (sa grille « ~+5 », aucune source d'Idaho 7) ; IBU calculée à la minute (161 contre 162 à 60′).
- Sa page : le lien « Levure › » est cassé (chemin du socle passe 3 pris depuis la passe 4) ; son intention (ouvrir Levure)
  est rendue.
- Retraits par un refus plus récent (DEFAUTS-COURT) : aucun.

## Hors de mon périmètre (L17)
`parcours-complet.mjs` lancé sans `--sans-construire` a reconstruit la sortie par défaut
`prototypes/houblons-v4/maquettes/parcours/` (18:38). Elle est ignorée par git, et la batterie la reconstruit elle-même,
mais elle porte maintenant l'arbre de 18:38. Une capture `etat-acquis-y1b-brassin-au-doigt-construite.png`, écrite par
controle-etats, a été renommée `etat-dryh-acquis-y1b-construite.png`.

Prédiction : « C'est bien ma version, lisible » ; puis il regardera si le doigt sur le rail fait bouger le trait aussi bien
qu'il l'imaginait.

DÉCISION À PRENDRE : G5 compte 106 mots, comme sa p4b2f. Deux voies :
- (a) jouer G5 avec `--sans=mots`, comme REPRISE-D124 et la batterie. C'est la voie prudente, et elle est verte.
- (b) retirer 8 de ses mots. Candidats : « 1 h ≈ 96 h » sur l'axe (5 mots, une mesure de Cascade posée sur l'axe d'Idaho 7,
  doute L14), « possible, non chiffrée » (3 mots).
Autre décision : « Tire 20 bières », « Défi 2 sur 4 » et « Preuve » de y1b ne sont pas sur p4b2f. Je ne les ai pas réinventés.

CONNAISSANCE : p4b2f (24 crans, jours 1, 2, 3, 5, 7) tient sur `cransFrise` filtré ; ses nombres sortent du moteur à
l'identique de sa grille, sauf Végétal (non décrit pour Idaho 7) et l'IBU au degré près. Les liens « Levure › » des
variantes de la passe 4 (socle passe 3) sont cassés.

LEÇON PROPOSÉE : un outil de contrôle qui construit (parcours-complet sans `--sans-construire`) écrit la sortie par défaut ;
une voie le lance toujours avec `--sans-construire --dossier=<sa sortie>`, et le brief le dit.
