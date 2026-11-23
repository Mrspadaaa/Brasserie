OK — outil de captures base|maquette (12 états, 390 px) et page « Côte à côte · 24.10 », PAGE OK

## Fichiers écrits
- `prototypes/houblons-v4/parcours/outils/captures-cote-a-cote.mjs`
- `work/refonte-frontend/v4/outils/pages/2026-10-24-cote-a-cote/index.html` (écrite à la main) et `img/` (non versionné : 12 états, `etats.json`, plein, 3e colonnes)
- ce RESULTAT.md. Fichiers de travail dans le dossier temporaire de la session.

## Critères
- G1 : `COTE-A-COTE OK 12` (construction parcours-p3, 12 états des deux côtés, 0 échec ; rejoué en entier, ~60 s). Le CHECK ne passe pas `--plein` : les `-plein.png` produits à la main restent dans `img/`, mais `etats.json` écrit par le CHECK ne les liste plus. Pour le rejeu final, lancer avec `--plein`, car la page les appelle (« Voir la maquette en entier »).
- G2 : `PAGE OK (25 images chargées, lisible à 390 et 1280 px, sans erreur)`.
- G3 : `NOTE OK`.
- G4 : ce rapport. Essais : 1 par critère. Un seul correctif d'outil (le glisser, ci-dessous).

## L'outil
Usage : `node …/captures-cote-a-cote.mjs <dossier construit> --sortie=<dossier img> [--plein] [--etats=a,b]`. Chrome 390 × 844, tactile, `deviceScaleFactor` 2. Écrit `etats.json` (par état : source, geste, joué ou repris, fichiers, erreur éventuelle). Attention : `--etats=` réécrit `etats.json` avec ces seuls états ; rejouer l'ensemble ensuite.

## États joués ou repris d'une capture
Joués des deux côtés (base = page du dépôt `base/consolide/…`) : `etape`, `etape-glisser`, `etape-appui`, `fiche`, `biere`, `biere-visee`.
Base reprise d'une capture existante, recadrée au premier écran (780 × 1688) : `suggerer` (+ q2b en 3e colonne), `comparer` (+ x3b), `dryhopper`, `levure`, `substituer`. Maquette jouée (page chargée).
Maquette seule : `suggerer-toucher` (sa base n'avait pas ce geste ; dit sur la page).
Captures de référence de sa base, en lien « Voir » : `etape-glisser-base-ref.png`, `fiche-base-ref.png`.
Gestes : ceux des contrôles cités (D111 glisser, D112 appui, D108 visée, D110 traits), non modifiés. Sa base n'est pas balisée pour la visée : l'outil trouve le bouton « Tropicaux » (`.nom-f`) et « Augmenter ma visée de Fruits tropicaux » par leur texte.

## Captures ouvertes en image (L12)
Planches de travail 390 px, ouvertes : glisser (base, maquette, référence), appui, visée, suggestions (base, maquette, q2b), toucher + fiches, comparer (3 colonnes), dryhopper et levure, substituer. Ouverts seuls : `etape` base et maquette, `biere` base et maquette. Page : `page-haut.png` et `page-ordinateur.png` ouvertes ; `page-page.png` (390 × 24 294 px) ouverte mais illisible à cette échelle, donc non comptée comme vue.
Non ouverts : les `-plein.png` (leurs hauteurs seulement mesurées), `etape-glisser-base-ref.png` seul (vu dans la planche). Le pilote doit les ouvrir avant publication.

## Ce qui ne se joue pas, et pourquoi
- `--plein` : pas pour `etape-glisser`, `etape-appui`, `suggerer-toucher` (le doigt tenu ou le toucher se défait quand la fenêtre est agrandie) ; pour une base en capture, la « page entière » est le fichier existant (même hauteur que le premier écran, sauf q2b : 3376 px, non copié).
- `etape-appui` : capture à 250 ms ; la base ne remplit le nom qu'à 500 ms, donc aucun retour visible des deux côtés. C'est exact, pas un défaut de l'outil.
- `suggerer-toucher` : pas de base (la base n'avait pas ce geste).
- `levure` : la capture de base vient de la carte des outils (`fils22-carte`), pas d'une maquette qu'il a choisie : dit sur la page.
- `fiche` : pages qui s'ouvrent déjà sur la fiche, pas l'appui long rejoué (autorisé par la voie).
- Bases en capture (suggerer, comparer, dryhopper, levure, substituer) : captures de 19 à 22.10, non rejouées.

## Doutes et limites
- La page est mise au point sur parcours-p3 : les « Écarts voulus » sont ses mots (D107 à D121), pas un constat du rendu. Sur p3, plusieurs sont encore visibles : « 16D hypothèse » toujours là (D116), carte entière pendant le glisser (D111), en-tête qui change entre Ma bière et Suggestions (D119). À rejouer sur la construction finale, puis revoir les images.
- Glisser : sur la maquette, à 35′ la pastille de la poignée montre « 3 » puis un trait blanc à la place du « 5 », et les graduations 30′ à 5′ s'empilent sous la pastille : constaté sur la capture (zoom), à signaler au critique.
- Suggestions : base et q2b se ressemblent ; la maquette s'en éloigne clairement (titre et croix à la place des onglets de la base, « ? », « fixé », pictos sans cercle, « Comparer (2) »), ce qui confirme D117.
- Fiche : maquette ≠ base (α 9,5–16 en grand, liste « nommé en premier », radar sous le pli).
- La construction finale peut avoir une autre arborescence : le CHECK suppose `<dossier>/<écran>/etat.html` (`ma-biere`, `biere`, `fiche`, `suggerer`, `comparer`, `dryhopper`, `levure`, `substituer`).
- Les noms de décision (D1xx) viennent de DEFAUTS-RECURRENTS ; les citations de la page sont les siennes, tronquées avec « … » quand elles le sont.

DÉCISION À PRENDRE : aucune. Recommandation : le pilote lance l'outil avec `--plein` sur la construction finale, ouvre les `-plein.png` et la page, puis publie sans `url` (nouvel artefact) et ajoute la ligne à la table « Pages ».
CONNAISSANCE : aucune
LEÇON PROPOSÉE : aucune
