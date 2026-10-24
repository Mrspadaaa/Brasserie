OK — huit concepts v0 de la liste de la fiche, série b (signature), baseline et panel verts

## Les concepts (une ligne chacun : chaleur, idée, ce qui tient, ce qui casse)

- **flb1** — chaleur froide — g1 telle quelle, une ligne « signe » encadrée en tête de liste (vin blanc 1er 2/2, raisin, groseille à maquereau) ; « 1er » une seule fois — tient : g1 reconnaissable, Nelson Sauvin n'est plus ordinaire — casse : la signature arrive à mi-écran, sous le grand radar.
- **flb2** — chaleur froide — g1, la liste rangée par mot du plus rare au plus commun, chaque mot avec ses fiches et « chez N des 318 houblons » — tient : vraies valeurs, ce qui signe remonte seul — casse : barre de rareté à apprendre.
- **flb3** — chaleur tiède — la signature en une phrase de ses seuls mots, très grande (« Vin blanc, raisin, groseille à maquereau. »), puis « puis », puis les familles en petit — tient : trois secondes, Motueka = « Citron vert, mojito. » — casse : peut se lire comme un texte écrit, peu de chiffres.
- **flb4** — chaleur tiède — tous ses mots sur une échelle commun · 318 → rare · lui seul, puis « aussi chez » (Hallertau Blanc à l'appui long) — tient : la rareté devient une forme — casse : échelle log non dite, étiquettes empilées.
- **flb5** — chaleur tiède — matrice : ses mots × lui et ses 4 remplaçants calculés ; « Lui seul dit vin blanc, raisin, groseille, sauvignon blanc », les remplaçants n'ont que agrumes et épicé (catégories) — tient : la preuve la plus nette de sa plainte — casse : touche à Substituer.
- **flb6** — chaleur chaude — carte d'identité : photo = radar, signes particuliers, nommé d'abord, thiols (classe forte, 13 sur 318), linalol, sosie (Hallertau Blanc), bande machine — tient : mémorable, faits jamais montrés — casse : radar de la photo sans étiquettes (grand radar étiqueté plus bas).
- **flb7** — chaleur chaude — pyramide de parfumeur : sommet (signature), cœur (une fiche), fond (ce que tous disent, catégories) ; sélecteur en dock bas — tient : hiérarchie d'un coup d'œil — casse : étiquettes d'étage à reprendre, cœur vide pour Citra cryo.
- **flb8** — chaleur chaude — l'orbite : radar au centre, mots sur le rayon de leur famille, mots hors familles flottant sur l'orbite (« 5/7 de ses mots sont hors du dessin ») — tient : dit littéralement ce que le radar ne dessine pas — casse : la place d'un mot flottant ne veut rien dire.

## Fichiers écrits

- `work/refonte-frontend/v4/ecran-1/fils24-fiche-liste/flb1/` à `flb8/` : `etat.html`, `generer.mjs`, `NOTE.md` (chaleur, idée, tient, casse, sorties des contrôles).
- Vocabulaire commun (pas un gabarit : chaque concept compose sa feuille) : `flb1/socle-flb.mjs`, données `flb1/donnees-flb.mjs` (pack-fiches, catalogue proto-data de 318 variétés, style-bands 16D), captures `flb1/capturer.mjs`.
- `work/refonte-frontend/v4/ecran-1/fils24-fiche-liste/captures/flbN-{premier-ecran,page,legende,motueka,fiche-courte}.png` (390 px, ×2).
- Rien dans `prototypes/`, `src/` ni `work/refonte-frontend/v4/choix/` ; scripts de travail dans `os.tmpdir()`.

## Sorties décisives

- G1 : `SERIE-BIEN-8`.
- G2 : `controle-commun … flb1…flb8 --page=etat.html --sans=mots` → couleurs, au-style, survol, blocs, contraste, fiche, standard, trait, legende, parlant, brutes OK → `COMMUN OK`.
- G3 : `systeme.mjs note … --contient "flb1,…,chaleur"` → `NOTE OK`.
- Panel : `controle-panel` sur les 8 premiers écrans → médiane 0,64, 1 sous 0,50, ressemblance 0,89, 0/28 doubles → `PANEL OK`.
- Indicatifs (recopiés dans chaque NOTE) : `controle-une-question` ECHEC (titre = nom du houblon, pas de `data-libre` ni de ligne de contexte : format d'outil, pas de fiche) ; `controle-sans-famille` ECHEC (pas de forme neutre `data-role="autres"` D100, les mots hors familles sont montrés en mots) ; `mots-premier-ecran --max=80 --sans-donnees` MOTS OK (54 à 78 mots).
- Captures regardées : premier écran et page de chacun, Motueka de flb8, fiche courte de flb1.

## Captures

`work/refonte-frontend/v4/ecran-1/fils24-fiche-liste/captures/flb1-premier-ecran.png` … `flb8-premier-ecran.png`, et `flbN-page.png`.

## Prédiction

« flb5 et flb3 c'est très bien, là on voit enfin que nelson c'est vin blanc, groseille ; flb6 sympa mais un peu gadget ; flb1 c'est la base, ok mais trop bas. »

DÉCISION À PRENDRE : la règle « signe » (fiches qui citent, place dans la fiche, rareté ≤ 12 sur 318, hors « fruité » et noms de famille) et la traduction qui fusionne « resiny » dans « résineux » sont des règles de maquette : à lui montrer comme telles. La convention D100 (`data-role="autres"`, forme neutre) n'est pas suivie : à greffer en passe 2 si le pilote la garde pour la liste.

CONNAISSANCE : sur les 5 houblons montrés, les « Agrumes » et « Épicé » de Nelson Sauvin et le « Fruité » de Motueka et de Cascade ne sont que des catégories Hopsteiner (ligne « Familles déclarées »), sans aucun mot de fiche ; « vin blanc » est nommé en premier par ses deux fiches (7 houblons sur 318 le disent) ; ses 4 remplaçants calculés (Boomerang, Herkules, Phoenix, Pacific Jade) ne disent ni vin blanc, ni raisin, ni groseille.

LEÇON PROPOSÉE : aucune

## Passe flb5

Ses mots, sur flb5 : « Ça j'aime beaucoup même si encore un peu fouillis et pas 100% clean ». Puis : « Le header est inutile, header type 10 ».
Les trois versions gardent l'idée de flb5 : sa signature prouvée face à ses 4 remplaçants calculés. Toutes prennent l'en-tête de flz4 tel quel, à la place de celui de flb5. Toutes sont capturées sur Nelson Sauvin, puis Motueka.

- **flb5b** — froide — la même matrice, nettoyée.
  - Le bandeau dit « Lui seul : … » et rien d'autre.
  - Grille à colonnes égales, la colonne « lui » entre deux règles noires.
  - Un seul gris pour les remplaçants : rond plein, ou case vide.
  - 74 mots visibles (Nelson Sauvin), 73 (Motueka) ; plus petit texte : 11 px.
- **flb5c** — tiède — dans la fiche g1, sous le radar, à la place de la liste.
  - Une ligne g1 par mot ; « lui seul » en pastille noire, ou « aussi chez … » dessous.
  - 81 mots visibles (Nelson Sauvin), 90 (Motueka) ; plus petit texte : 12 px.
- **flb5d** — chaude — deux cercles : lui, ses remplaçants.
  - Sa part seule en grand ; au milieu, ce qu'ils partagent, avec un point gris par remplaçant ; à droite, ce qu'eux seuls disent.
  - 72 mots visibles (Nelson Sauvin), 68 (Motueka) ; plus petit texte : 11 px.

Recompté sur les captures :
- Nelson Sauvin, lui seul : vin blanc, raisin et groseille à maquereau (2/2), sauvignon blanc (1/2). Agrumes (classé) est chez 3 des 4 remplaçants, épicé (classé) chez les 4.
- Motueka, lui seul : mojito (2/2) et zeste de citron (1/2). Citron vert est chez Shaddock et Cascade.

Contrôles :
- `controle-commun … flb5b flb5c flb5d --page=etat.html --sans=mots` → COMMUN OK. Le premier essai était en ECHEC couleurs, avec une seule teinte franche sur Nelson Sauvin. Corrigé par la ligne des familles non décrites, en pictos « ? » à leur couleur, sous le radar.
- `mots-premier-ecran --max=80` : 110, 120 et 110 mots en comptant l'étape et la bande des houblons, donc au-dessus de 80. Avec `--sans-donnees` : 67, 78 et 63, MOTS OK.

Captures, ouvertes à côté de flb5 et de g1 : `captures/flb5b-premier-ecran.png`, `flb5b-motueka.png`, `flb5c-premier-ecran.png`, `flb5c-motueka.png`, `flb5d-premier-ecran.png`, `flb5d-motueka.png`.

Écarts à flz4 : l'α est celui de g1 (Hopsteiner 2025) et le lot hors de ses fiches reste en orangé. Les cinq houblons passent dans une bande fixée en bas, en navigation de maquette.

Prédiction : « flb5b c'est propre là, flb5d les cercles on comprend direct ».
