OK — Comparer r6k « le panel d'abord » : panel par houblon, puis simulé, r3, réponse calculée

## Fichiers écrits
- `work/refonte-frontend/v4/ecran-1/fils22-comparer/r6k/generer.mjs` (écrit `etat.html` ; socle de `fils21-choisir/v1/socle.mjs`, lu seulement)
- `work/refonte-frontend/v4/ecran-1/fils22-comparer/r6k/etat.html`
- `work/refonte-frontend/v4/ecran-1/fils22-comparer/r6k/captures.mjs`
- `work/refonte-frontend/v4/ecran-1/fils22-comparer/r6k/NOTE.md`
- `work/refonte-frontend/v4/ecran-1/fils22-comparer/captures/r6k-390.png`, `r6k-premier-ecran.png`, `r6k-fiche-390.png`, `r6k-toucher-390.png`, `r6k-absolu-390.png`, `r6k-legende-390.png`

## Critères (rejoués depuis la racine, dernier passage)
- G1 : COMMUN OK (couleurs, au-style, survol, blocs, contraste, fiche, standard, trait, légende, parlant et brutes OK ; pire contraste 4,69:1) ; 2 essais (1er : CONTRASTE ECHEC, le « · » du contexte à 2,06:1 ; corrigé en séparateur CSS).
- G2 : `r6k 79 mots` puis MOTS OK ; 2 essais (1er : 125 mots ; radars remontés avant les pistes, légendes écrites retirées du premier écran).
- G3 : UNE-QUESTION OK (1 groupe libre : houblon) ; 1 essai.
- G4 : ACQUIS OK (4/4 : radar, chimie, osu, valeurs). Radar r3 et panel OSU au repos, chimie et valeurs à un toucher ; 1 essai.
- G5 : ALPHA OK (3 houblons, 3 avec leur α) ; 1 essai.
- G6 : EXISTENT OK 7 ; 1 essai.
- G7 : NOTE OK ; 1 essai.
- G8 : ce fichier.

## Captures ouvertes et jugées
- `r6k-premier-ecran.png` : on voit la question, le contexte, les trois colonnes (α, rôle, stock, pictos), le panel complet (courbe OSU de Cascade, cases d'Idaho 7, trou de Galaxy) et le haut des radars.
- `r6k-390.png` : la page entière. Le bloc « Pour ta stout » donne la réponse, puis vient le pont vers Dryhopper.
- `r6k-fiche-390.png` : l'appui long sur Galaxy ouvre la fiche g1 (α 17,2 % ≠ 11–16 %, sans famille : cannabis, dank).
- `r6k-toucher-390.png` : la chimie et les vraies valeurs, ouvertes d'un toucher, avec Galaxy mis en avant. Défaut corrigé : la classe `.vl` du socle l8g se superposait ; elle est renommée `.vv`.
- `r6k-absolu-390.png` et `r6k-legende-390.png` : la lentille en absolu, et la légende derrière « ? ».

Ma prédiction du brasseur : « Le panel en premier j'aime bien, on voit tout de suite qu'on ne sait presque rien pour Galaxy. Par contre les radars avec le résineux qui écrase tout, c'est pas lisible. »

## Doutes et limites
- 79 mots sur 80 : il n'y a plus de marge.
- Le résineux de la stout (83, dégustation) écrase les silhouettes des trois radars.
- Les « haut » simulés sont très larges, d'où un voile presque plein.
- La courbe OSU a été mesurée en blonde, cônes entiers, 24 h. La page dit « en blonde ; en stout ? », mais pas les autres écarts de conditions au premier écran.
- J'ai pris deux métadonnées hors de `comparer-stout.json` : les titres des sources et les liens composé → famille, tirés de `prototypes/houblons-v4/data/composes-houblon.json`. C'est la source déclarée du JSON ; aucune valeur n'en vient.
- Descripteurs A : invisible ici, car la porte est fermée et Nelson Sauvin absent. C'est écrit dans la NOTE.

DÉCISION À PRENDRE : faut-il relever les positions de la figure E09 (Sharp et Shellhammer 2018 : 12 variétés, 4 g/L, 3 j, soit exactement la base « dose égale ») ? Options : (a) une voie Haiku lit la figure et chiffre Galaxy et Cascade, avec « lu sur une figure » ; (b) laisser Galaxy « non relevé ». Je recommande (a) : c'est la seule source qui comble le trou principal de cette variante. Décideur : le pilote.

CONNAISSANCE : dans `comparer-stout.json`, seul Cascade a un panel chiffré (OSU, E04/H22, 0–15). Idaho 7 n'a que des présences CATA (E03 : tropical, citronnelle ; houblon au pitch, IPA trouble). Galaxy a été goûté à 4 g/L et 3 j dans E09, mais les valeurs ne sont pas relevées. À dose égale simulée, les trois ajoutent environ +1,9 cran de résineux : aucun dry hop ne baisse le résineux d'une stout. Idaho 7 est le plus floral (~+1,3 cran, confiance moyenne), et Galaxy sort de la 16D en tropicaux (~+3,9). Le socle l8g définit `.vl` en position absolue : une maquette qui le réutilise doit éviter ce nom de classe.

LEÇON PROPOSÉE : quand une maquette réutilise le CSS d'un socle, préfixer ses propres classes (ou relire les sélecteurs du socle) avant de capturer. Ici, `.vl` (ligne de visée l8g) s'est appliquée à mes lignes de valeurs, et seule la capture de l'état ouvert l'a montré. Les contrôles étaient tous verts.
