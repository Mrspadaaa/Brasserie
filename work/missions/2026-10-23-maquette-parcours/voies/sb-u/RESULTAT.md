OK — huit concepts Substituer (série u), baseline suivie, PANEL OK, captures et NOTE par concept

## Concepts (une ligne chacun : chaleur, idée, ce qui tient, ce qui casse)
- sbu1 — chaleur froide — u4 au propre : classement chiffré, inconnu en plage hachurée, face-à-face à IBU égal — tient : son choix u4 sur thème blanc, α et dose par ligne — casse : plage calculée par la page, face-à-face sous le pli.
- sbu2 — chaleur froide — la carte de l'étape (v4.10) : Nugget barré dans sa carte, « par » le remplaçant, cartes d'ajout rapide, panneau des 12 familles — tient : son vocabulaire exact — casse : cité/marqué peu distincts dans la bande de 12.
- sbu3 — chaleur tiède — le diff de la recette : − Nugget, + remplaçant, puis la bière famille par famille (~83 → ~82) — tient : avant/après honnête, montre qu'à 60′ la bière bouge à peine — casse : registre de développeur.
- sbu4 — chaleur tiède — le miroir (papillon) : familles des fiches N/M des deux côtés, mots hors familles (vin blanc, groseille) — tient : ressemblance lisible, Nelson garde sa réputation — casse : citations, pas intensité ; à 60′ l'arôme pèse peu.
- sbu5 — chaleur tiède — la vitrine : grille 2 colonnes, silhouette du remplaçant sur le fantôme de Nugget, proximité en 3 parts — tient : inconnu visible (« ? ») — casse : « arôme 100 » à 60′ = rien d'étranger, contre-intuitif.
- sbu6 — chaleur chaude — le plan de ligne : Nugget terminus, lignes mixte et amérisant, stations par proximité, anneau en tirets si une part manque — tient : lu en 3 s — casse : espacement minimal qui déforme les écarts, étiquette de Nelson au bord.
- sbu7 — chaleur chaude — le nuancier : échantillons de peinture des familles, liseré de Nugget sur chacun, « autres 83 % » pour Nelson — tient : couleur osée, remplissage 0,77 — casse : rotation de l'éventail, noms tassés.
- sbu8 — chaleur chaude — l'équation : « 46 g Nugget = 62,5 g Nelson Sauvin » en affiche, perd/gagne, autres égalités — tient : « lequel et combien » d'un coup — casse : plus de 3 tailles de texte, peu d'arôme.

## Fichiers écrits
- `work/refonte-frontend/v4/ecran-1/fils24-substituer/sbu1/serie/` : `socle.mjs` (briques de la baseline, préfixe su-), `generer.mjs`, `capturer.mjs`, `deborde.mjs`, `extraire.ts` (lancé par vite-node depuis os.tmpdir), `donnees.json` (moteur du parcours : stout 16D, Nugget 46 g à 60′, 10 remplaçants, aussi 10′, whirlpool, dry hop)
- `sbu1` à `sbu8` : `concept.mjs`, `etat.html`, `NOTE.md`, `etats.json`
- `captures/sbuN-{premier-ecran,page,choix,fiche,legende}.png` (40 captures, 390 × 844, échelle 2)

## Critères (rejoués depuis la racine)
- G1 : SERIE-BIEN-8
- G2 : COMMUN OK (couleurs, au-style, survol, blocs, contraste, fiche, standard, trait, legende, parlant, brutes OK ; mots sauté par le contrat)
- G3 : NOTE OK

## Autres contrôles (une fois)
- controle-panel : PANEL OK, remplissage médian 0,57, 0 sous 0,50, ressemblance 0,89, 0/28 paires identiques
- controle-alpha : ALPHA OK ; controle-sans-famille : SANS-FAMILLE OK
- mots-premier-ecran (70) : MOTS ECHEC, 110 à 186 mots (indicatif, sauté par le contrat)
- controle-une-question : écarts (pas de ligne [data-role=contexte] imposée, sélecteurs sans data-libre, 3 titres sans « ? »)

## Captures (à regarder d'abord)
`work/refonte-frontend/v4/ecran-1/fils24-substituer/captures/sbu1-premier-ecran.png` … `sbu8-premier-ecran.png` ; états `-choix`, `-fiche`, `-legende`, `-page`.

## Prédiction
« sbu7 et sbu6 donnent vraiment bien, sbu2 c'est ma carte, mais à 60′ ça change rien à la bière : il faut le dire plus fort et montrer le tardif. »

DÉCISION À PRENDRE : à 60′, le remplaçant ne change presque rien au profil (~±1) et Résineux reste hors du style (dégusté) ; montrer en passe 2 le moment tardif (Target, Idaho 7 en tête à 10′) comme contexte modifiable, ou garder 60′ seul (un facteur libre).

CONNAISSANCE : à 60′, la proximité du moteur pèse arôme 0,2 / huiles 0,2 / amertume 0,6 et « arôme » y mesure l'absence d'arôme étranger, pas la ressemblance ; les silhouettes de fiches peuvent donc différer d'un remplaçant noté 99 (Magnat).

LEÇON PROPOSÉE : aucune
