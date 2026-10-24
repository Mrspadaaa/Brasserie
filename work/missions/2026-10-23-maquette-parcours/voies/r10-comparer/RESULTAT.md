OK — Comparer r6a, étapes en bande-sélecteur, ses mots (flb5) sous l'écran, 80 mots

## Fichiers écrits (Possède)
- `prototypes/houblons-v4/parcours/src/ecrans/comparer/index.tsx` : état `moment` (60′ · 10′ · dry hop) ; radar, têtes (~ dans / ~ hors) et rangées lues au moment choisi (`vue`) ; Défi et feuilles du dock restent au dry hop ; la bande des étapes posée sur les rangées ; la pastille du critère en tête de la bande (« Pourquoi ce classement › » en bas de sa liste) ; la réponse de y1b et « Placer <houblon> › » en conclusion, en bas (comme le « Doser … dans Dryhopper » de r6a) ; « ? » sur la ligne de la question ; légende mise à jour.
- `…/comparer/Etapes.tsx` : `BandeEtapes` remplace `AuxEtapes` : une ligne par étape, chacune un toucher (radio) ; à gauche l'étape et la valeur grise du Nugget ; par colonne le nombre (crans de la famille du critère), ★ au meilleur (écart ≥ 0,05 cran), barre fine et pointillé du Nugget.
- `…/comparer/calcul.ts` : `lireColonnes(…, quand?)` (le moteur pose chaque houblon au moment), `ValeurEtape.crans` (toutes les familles par étape).
- `…/comparer/Radar.tsx` (208 px, rayon 77), `comparer.css`, `Feuilles.tsx` (la dose « 4 g/L · réf. » d'Égaler marquée `fixe` et non `simule` : c'est la dose fixée, le jeu ETAPE la refusait), `NOTE.md` (11 lignes Reprise, D128).
- `prototypes/houblons-v4/maquettes/parcours-comparer/**` (construction, `captures-r10/`).

## Critères (rejoués depuis la racine, construction finale)
- G1 → `CONSTRUIT OK (9 pages)`
- G2 → `FAMILLES OK (9 rangées au premier écran : Floral, Herbacé, Terreux, Agrumes, Tropicaux, Noyau, Baies, Résineux, Épicé)` (avant : ECHEC, 0, la première à 872 px)
- G3 → `COMPARER-ETAPES OK (3 houblons + référence beermaverick-nugget, étapes b10 b60 dryPost)` ; écart vertical 68 px ; panel OSU replié.
- G4 → `ETATS OK (18/18) ; 1 voulu(s) non rejoué(s)` puis `ETATS OK (1/1)` : 80 mots au premier écran.
- G5 → `CHOIX OK (1 écran(s) conforme(s) à son choix ; 0 ouvert(s))` puis `COMMUN OK`.
- Hors GATES : `TEINTE OK 6/6`, `TYPES OK`, `jouer-parcours --etape=comparer` → `ETAPE OK (comparer)`.

## Captures (390 px, ouvertes en image) — `prototypes/houblons-v4/maquettes/parcours-comparer/captures-r10/`
- `cote-a-cote-r6a.png` : sa r6a (`fils22-comparer/captures/r6a-premier-ecran.png`) à côté de la nouvelle. Élément par élément : question et « ? » ✓, contexte ✓ (le moment en sort : il est dans la bande), « ~ simulé » ✓, Au style | Absolu ✓ (piste grise rendue, elle avait disparu), radar ✓ (plus petit : 77 contre ~100), Ta stout ✓ (flèches), têtes ✓ (nom, α, rôle, pictos, ~ dans / ~ hors), rangées ✓, écarts : résineux sur sa rangée, floral dans la bande juste au-dessus, « inconnus, pas zéro » ✓. Tout au-dessus du dock.
- `d128-repos.png` (dry hop), `d128-etape-60.png`, `d128-etape-10.png` (radar, rangées et verdicts suivent : Galaxy repasse « ~ dans » à 10′), `d128-critere-menu.png`, `d128-critere-moins-resineux.png` (la bande chiffre le résineux, ★ au plus bas), `d128-suite.png` (cuve, référence, Biotransformation, Enchaîner), `d128-bas.png` (réponse « ★ Idaho 7 devant Cascade ~+0,4 au dry hop », Placer), `d128-1280.png`.
- États de r5 (dock, feuilles, +, fiche) inchangés : ETATS OK 18/18 ; leurs captures restent dans `captures-r5/`.

## Décisions
- DÉCISION : les trois contraintes tiennent ensemble seulement si les étapes chiffrées sont au premier écran (G3 : le cadre défilant de PageShell rend « rogné » tout ce qui est sous 783 px), avec les rangées (G2) et 80 mots au plus (G4). La bande-sélecteur porte donc les nombres des étapes (12 valeurs) ; pour payer ses mots, quittent le premier écran : la ligne « Face à ta stout, par » (la pastille reste, en tête de la bande), la ligne de réponse (en conclusion, au-dessus de Placer ; la bande montre ★ et les nombres à chaque étape), « Placer Idaho 7 › » (en bas, comme r6a), les mots « trop / plus » de Ta stout (remplacés par ↓ / ↑, les flèches de ses rangées), l'écart chiffré floral sur la rangée Floral (le même nombre est dans la bande, juste au-dessus). Rien n'est supprimé.
- DÉCISION : la bande chiffre la famille de la pastille (floral au départ) ; le Défi et les feuilles du dock restent au dry hop (leur moment) ; le houblon retenu au départ reste celui du dry hop (pas de saut de colonne au changement d'étape).
- DÉCISION : 62 px vides sous « inconnus, pas zéro », avant la suite : rien de lisible sous le dock au repos (le compteur de mots compte ce qu'il cache).
- Données : 9 rangées, pas 10 comme r6a. Végétal (les trois) et Baies de Galaxy sont « non situées » : règle D40 point 6 (D65, D14 ; moteur `lu(…, decrite)`, déjà dans l'arbre avant cette voie) : aucune fiche ne les décrit. Écart de nombres avec sa capture, réglé à la source par sa propre règle (contrat § 8).
- Aucun retrait par DEFAUTS-COURT.

DÉCISION À PRENDRE : si le brasseur veut voir aussi la ligne de réponse et « Face à ta stout, par » au premier écran, le plafond de 80 mots (D40 bis) ne le permet pas à côté des rangées de r6a et des étapes chiffrées (D107). Il faut ouvrir le plafond pour Comparer ou trancher entre les deux.

Prédiction : « Là c'est ma r6a, et je vois les étapes d'un coup » ; risque : la bande à 12 nombres jugée « dur à lire », comme x3b.

## D128 bis — ses mots, à la manière de flb5
Ses mots, sur flb5 : « J'aime beaucoup le 9 car ont voit que c'est pas que du 16d, le houblon a vraiment beaucoup plus de subtilité. À montré aussi, notamment pour la comparaison ».
- Ce qui est rendu : **sous le premier écran** (il est à 80 mots, la règle tient ; c'est le premier bloc sous les rangées, après le filet). D'abord le bandeau noir de flb5 pour le houblon retenu (« **Idaho 7** seul dit **orange, papaye, abricot, thé noir** · face à Cascade et Galaxy, d'après ses fiches · en gras : ce que lui seul dit »), à la couleur du houblon. Ce bandeau suit le toucher d'une colonne. Puis, **sous chaque colonne**, ses mots : en gras ceux que lui seul dit face aux autres houblons comparés, en gris ceux qu'un autre dit aussi. Devant chaque mot, le picto de sa famille, ou ◇ s'il est hors des 12 familles. Au-delà de 6 mots, « +n ». Le détail (fiches, « aussi chez … », famille) est dans le title.
- Source : `familyWords` du moteur (les descripteurs de chaque fiche, rangés dans leur famille ou hors des 12), lu en direct (`sesMots` dans `calcul.ts`). Traduction D97 (white wine → vin blanc, gooseberry → groseille à maquereau, lime → citron vert, black currant → cassis…). Un nom de famille est retiré (« agrumes » redit le radar), de même que « fruité » (générique). Rien n'est inventé.
- Sur le cas : Cascade : **citron vert**, pamplemousse, cassis, pin. Idaho 7 : **orange, papaye, abricot, thé noir, résine**, pamplemousse (+2). Galaxy : **cannabis, dank, fruit de la passion, ananas, pêche**. Avec Nelson Sauvin en 4ᵉ (« + ») : « Nelson Sauvin seul dit **vin blanc, groseille à maquereau, raisin, sauvignon blanc** » ◇, les mots de flb5.
- DÉCISION : « ce que chaque houblon dit en plus de ses familles » est lu comme flb5 le montre : ses mots à lui, ceux d'une famille compris (flb5 : « Lui seul dit mojito, **zeste de citron** », en agrumes), et pas seulement les mots hors des 12. Seuls hors des 12, Cascade et Idaho 7 n'auraient rien (Cascade : « fruité » seulement, Idaho 7 : aucun mot). Le ◇ distingue les mots hors familles.
- Pas de signe au premier écran : chaque mot de plus y casse les 80 mots (D40 bis).
- Mots coupés à la française (césure douce « pample-mousse », « maque-reau ») : Chrome headless n'a pas de césure automatique pour le français.
- Fichiers : `index.tsx` (`SesMots`), `calcul.ts` (`sesMots`, `MotLu`), `comparer.css`, `NOTE.md` (« Idées reprises »). Les rangées d'étapes à 4 colonnes passent en court (« DH », le Nugget dessous) : à 30 px, « dry hop » se cassait.
- Captures : `captures-r10/cote-a-cote-flb5-r6a.png` (flb5, r6a, ses mots), `d128bis-ses-mots.png` (Idaho 7 retenu), `d128bis-galaxy.png`, `d128bis-nelson.png` (4 colonnes).
- Critères rejoués sur la construction finale : CONSTRUIT OK · FAMILLES OK (9) · COMPARER-ETAPES OK · ETATS OK (18/18) et ETATS OK (1/1), 80 mots · CHOIX OK · COMMUN OK · TEINTE OK 6/6 · TYPES OK · ETAPE OK (comparer).
- Prédiction : « Là on voit que Galaxy c'est pas que du tropical » ; risque : les mots partagés en gris jugés en trop.

CONNAISSANCE : sur un écran à CadreOutil, `controle-comparer-etapes` traite tout ce qui passe sous le bas du `main` défilant (783 px à 390 × 844) comme « rogné » : « visibles ensemble » veut dire au premier écran. Le compteur de 80 mots compte aussi ce qui passe sous le dock (jusqu'à 844 px).
Le contrôle de reprise refuse dans « ## Reprise » de NOTE.md toute ligne dont l'identifiant n'est pas dans l'inventaire. Une greffe hors inventaire va dans « Idées reprises ».
LEÇON PROPOSÉE : l'outil Edit et les heredocs Bash transforment l'échappement « ­ » en caractère invisible dans la source (même famille que M10). Pour un caractère spécial dans le code, écrire `String.fromCharCode(n)`.
