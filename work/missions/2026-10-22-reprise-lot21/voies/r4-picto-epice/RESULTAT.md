OK — Planche de 7 pictos « épicé » au trait, sans poivre, à 12/16/24 px et en contexte, capturée à 390 px.

## Fichiers écrits
Dans `work/refonte-frontend/v4/ecran-1/fils22-picto-epice/` : `generer-planche.mjs` (générateur), `capturer.mjs` (captures puppeteer), `planche/etat.html` (généré, non versionné), `NOTE.md`, `captures/planche-390.png`, `captures/contexte-390.png`, `captures/gros-24.png` (outil de travail : pictos à 120 px). Plus ce fichier. Rien ailleurs (les autres fichiers non suivis du `git status` existaient déjà).

## Les 7 variantes
cannelle (bâton roulé), vanille (gousse), badiane, girofle, mortier et pilon, coriandre (graine), saupoudreur. Les deux lectures de la plainte du lot 15 sont couvertes : cannelle et vanille (« dessine plutôt ça »), cinq autres idées. Écartés : flamme (déjà l'icône d'ébullition), piment (trop près du poivre), feuille/brin (Herbacé, Végétal), cuillère-pincée (essayée : lue comme une loupe). Détails, idée et risque de confusion par variante : `NOTE.md`.

## Critères
- G1 : `ECHOUE OK (PLANCHE ECHEC, code 1)`
- G2 : `PLANCHE OK (7 variantes)` ; chaque variante 12/16/24 px, 4 voisins d'autres familles (Agrumes, Floral, Herbacé, Résineux, de la planche v3)
- G3 : `TRAIT OK` (61 pictos de famille, 0 faute)
- G4 : `EXISTENT OK 4`
- G5 : voir la ligne de vérification du pilote ; ce fichier cite `planche-390.png`, `contexte-390.png` et la `DÉCISION À PRENDRE` ci-dessous.

Essais : un par critère après la mise au point du dessin (quatre passes de dessin, jugées sur capture).

## Captures ouvertes en image (Read) et jugées
- `captures/planche-390.png` (planche entière, ×2) : pas de défilement, noms courts, le picto actuel et les voisins Herbacé, Végétal, Terreux, Résineux en tête pour comparer. Les 7 sont lisibles à 24 px ; à 12 px badiane, mortier et cannelle tiennent, girofle et saupoudreur sont fins.
- `captures/contexte-390.png` (lignes de contexte, ×4) : à 16 px, parmi Agrumes, Floral, Herbacé et Résineux, le brun se détache et aucune variante ne se confond avec une feuille ou le sapin. Vanille, girofle et coriandre demandent un second regard.
- `captures/gros-24.png` (pictos à 120 px, travail) : a servi à rejeter deux premiers jets (vanille en feuille avec nervure, cuillère en loupe).

## Doutes et limites
- Aucun picto n'est parfait : la vanille se lit comme un haricot ou une amande, le girofle comme une épingle. Ce sont des propositions à choisir, pas un classement.
- Le contexte est un gabarit (barre grise à la place du nom) : aucune donnée de houblon n'est inventée.
- Le trait de 2,571 sur 24 laisse peu de place aux détails : la spirale de la cannelle et les graines de la vanille ne se voient qu'à 24 px.
- Le disque pâle « duo » de la planche v3 est volontairement absent (D88). Pas de test sur l'app réelle : planche statique seulement.

DÉCISION À PRENDRE : lequel de ces pictos pour la famille Épicé ? Options : badiane (arôme anisé du houblon, la plus nette à 12 px), cannelle ou vanille (si « plutôt vanille, canelle ? » voulait ces épices), girofle, mortier (idée large), coriandre, saupoudreur. Recommandation : badiane ; cannelle si sa plainte du lot 15 demandait vraiment la cannelle. C'est au brasseur de trancher ; le pilote peut aussi demander une seconde passe sur les deux ou trois retenus.

CONNAISSANCE : le picto « grains de poivre » est rejeté deux fois ; flamme (ébullition) et feuille/brin (Herbacé, Végétal) sont déjà pris par d'autres pictos, donc à éviter pour Épicé.

LEÇON PROPOSÉE : aucune
