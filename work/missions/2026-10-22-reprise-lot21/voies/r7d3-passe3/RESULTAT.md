OK — d8c sans vide : remplissage 0,52 → 0,617 (r6n2 0,704), 79 mots, tous critères verts

## Fichiers écrits (Possède)
`work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-d/passe3/` :
- `d8/etat.html` ;
- `generer.mjs` et `socle.mjs` (le socle passe la fiche à « d'après 1 fiche ») ;
- `captures.mjs` ;
- `NOTE.md` (`## Passe 3`, `## Baseline`) ;
- `captures/` ;
- `captures/travail/` : copies du générateur, `passe3.cjs`, `passe3b.cjs`.

La passe 2 et la v0 ne sont pas touchées ; rien à la racine.

## Remplissage avant → après
- Passe 2 : 0,52.
- Premier tour : 0,495. Fond blanc et blocs rapprochés, mais le bloc « contre ★ » restait vide au meilleur moment.
- Second tour : **0,617**. r6n2 est à 0,704. `PANEL OK`.

## Ajouté ou rapproché
- **Rapproché** : fond blanc, filets au lieu de cartes, rubans plus hauts.
- **Profil du floral au-dessus du rail, trait orangé « trop amer » dessous** (dock-profil, a1 et b4).
- **Loupe à mini-barres chiffrées** (e5).
- **Table d'IBU chiffrée par étape** (b4) : 162 et 75 en orangé, « 60+? ». La ligne de l'ébullition suit la
  minute du doigt.
- **« contre ★ actif 2 j »** : ce que ce moment change contre le meilleur, plus « trop amer ». Au meilleur, le
  bloc compare à l'après, avec « ★ ici ».
- **Mesure** : picto de famille d'abord, auteur et année (« McCabe 2023, au levurage »).
- **Un seul sens par trait** : hachuré = inconnu, emporté = contour, à cru = « ? », jours sans gain = pâles.
- **Fiche** : « d'après 1 fiche » une seule fois.

## Sorties décisives
- G1 : `COMMUN OK`
- G2 : `d8 79 mots` · `MOTS OK`
- G3 : `UNE-QUESTION OK (1 groupe libre : moment)` (avec `--edition`)
- G4 : `ACQUIS OK (4/4 : geste, frise, valeurs, levure)`
- G5 : `PAGE OK (0 images chargées, 390 px, sans erreur)`
- G6 : `2 captures · remplissage médian 0,70, 0 sous 0,55 · … PANEL OK` (d8 0,617 ; r6n2 0,704)
- Geste : actif · 3 j → 45′, 0 erreur, largeur 390.

## Captures ouvertes
Dans `serie-d/passe3/captures/` : d8-premier-ecran.png, d8-390.png, d8-toucher-390.png, d8-barres-390.png.
Le premier écran a été ouvert à côté de `fils22-comparer/captures/r6n2-premier-ecran.png`.

## Prédiction
« Là je vois où est le bon moment, le rail me montre le floral et le rouge trop amer, et à 45′ je vois ce que je
perds contre l'actif. Par contre, les boîtes vides au bout du ruban à 60′, c'est quoi ? »

CONNAISSANCE : le contrôle de panel prend pour fond la couleur la plus fréquente. Sur une page à cartes
blanches, le fond devient le blanc, et l'intérieur des cartes compte comme du vide. Des cartes aérées font donc
baisser la mesure autant qu'un écran vide. r6n2 est dense parce qu'il n'a ni cartes ni marges internes.

LEÇON PROPOSÉE : un bloc de comparaison doit garder du contenu à chacun de ses états, à commencer par l'état de
départ. Le 23.10, « contre ★ » était vide au moment de départ (actif · 3 j, à 0,01 du meilleur) et le
remplissage est retombé à 0,495. Avant de mesurer, il faut jouer la page au repos, au meilleur et au pire, et
donner à chaque bloc un repli qui apprend quelque chose (ici, la comparaison à l'après).
