OK — c5 : retouche de c4, sept points corrigés, rien d'autre ; COEUR OK dans les deux thèmes

# c5 : retouche de c4 (16.11)

Base : `r3/c4/proto.src.html`, copiée puis retouchée par remplacements exacts, chacun trouvé une seule fois. Chaque
changement porte la marque `r3 · c5`. Rebâtir : `node work/missions/2026-11-16-carnet-decision/r3/c5/build.mjs`.

## Corrigé (seulement la liste du pilote)
1. **THEME-APP.** Les couleurs viennent des jetons de DESIGN.md : thème cave par défaut, clair par `?theme=clair`.
   - Plus de crème (`#fbf8f2`) ni de sarcelle (`#26695a`). Les gris secondaires reprennent `cave-400`.
   - Validé = hop, alerte = alert, attente = attention, IA = violet du jeton agenda.
   - Les fonds teintés mêlent un jeton au fond de page. Les statuts (idée, recherche, compare, choisi) sont en jetons.
   - En cave, les barres des articles écartés restent ternes, même pour le meilleur d'une table.
   - Zone du carnet : **Stocks › Matériel**, l'endroit où vit Matériel dans l'app (`StocksTab`, « Stocks › Matériel » du
     15.11). L'onglet actif est Stocks, en vert de zone, et l'en-tête du carnet est teinté de vert. Finances n'est plus actif.
2. **Le + ne cache aucune valeur.** Dans Comparer, sans champ en bas, une bande au-dessus des onglets porte le +. Elle
   indique « Classé par … », et la marge du bas la compte (`--dock`). Ailleurs, le + était déjà dans la bande du champ.
3. **Indication « Demander » entière.** Elle devient « Demander pourquoi ce choix » : 193 px pour 212 px de place,
   contre 46 caractères coupés en c4.
4. **Toasts.**
   - Le geste suivant efface le toast : changer d'écran, classer, ouvrir.
   - Le toast vit dans la bande du bas (champ ou bande du +), qui grandit d'autant. Il ne flotte que clavier ouvert ou
     feuille ouverte.
   - « Choix gardé… Envoyer dans À venir ? » porte deux boutons, « Envoyer » et « Non », et reste 8 s.
5. **Focus.** À l'ouverture de « Choisir celui-ci », le curseur est dans « Pourquoi », clavier ouvert, et le titre reste
   en vue.
6. **Ventilation.** La proposition de critère relie chaque partie : « Relié à « Débit » ; « zéro buée au plafond » à
   « Capte la buée à la source », ajoutée à Comparer. » Cette caractéristique (oui / non) est créée au « Oui, critère »
   et lue sur chaque lien : hottes oui, extracteur mural non.
7. **Bandeau « Ensuite ».** Tant que deux façons restent ouvertes, il dit « Ensuite : trancher entre Gravité et
   Isobarique ». Il dit aussi « le critère peut décider », ou « dites ce qui compte, en une phrase » s'il n'y a pas de
   critère. Il ne dit plus « coller des liens ».

## Sorties (rejouées sur c5)
- `node …/r3/c5/scenario.mjs` (cave, défaut) → **COEUR OK (59 étapes, 80 captures)**, **MASQUES 0** (`scenario.log`).
- `THEME=clair CAP=…/c5/captures/clair node …/scenario.mjs` → **COEUR OK (59 étapes, 80 captures)**, **MASQUES 0**
  (`captures/clair/scenario.log`).
- `node …/r3/c5/gestes-ra.mjs` → **GESTES OK**.
- `node …/r3/c5/masque-fab.mjs` → **FAB OK (27 vues balayées)**. Le + est sondé tous les 40 px de défilement sur
  9 états, et en trois réglages : défaut, `theme=clair`, `theme=cave`.
- `node …/r3/c5/controle-theme.mjs` → **THEME OK (2 thèmes × 8 états)**. Les couleurs calculées (texte, fond, bordure)
  sont des jetons à ΔE 3 près, ou un jeton teinté sur le fond ; l'onglet actif est Stocks.
- Témoins sur c4 (L13), mêmes scripts : le scénario échoue en E3 (« Ensuite » faux), E16 (pas de focus, toast sans
  bouton, toast qui suit), E17 (indication coupée), E20.3 (buée non reliée), avec **MASQUES 11**. FAB ECHEC (9 vues
  Comparer) ; THEME ECHEC (153).

Ajouts au scénario, sans retirer aucun contrôle de c4 :
- la sonde des masques, à chaque capture ;
- `THEME` ;
- les contrôles de E3, E16, E17 et E20.3 ;
- trois captures neuves : `E16a0-focus`, `E16d1-avenir`, `E20c0-critere-propose`.

## Captures
- Cave : `captures/c5-*.png`, 80 captures, et `planche-*.png`. Clair : `captures/clair/c5-*.png`.
- Côte à côte c4 | c5 cave | c5 clair (`comparer-c4.mjs`), toutes ouvertes : `captures/cote-*.png`.
  - E03 : « Ensuite » juste.
  - E13b : toast dans la bande.
  - E14a : bande « Classé par », sans toast.
  - E16a0 : focus dans « Pourquoi ».
  - E16d1 : toast avec ses boutons.
  - E16e, E17a, E19h, E21i : plus de toast qui suit, Stocks actif.
  - E17b : indication entière.
  - E20c0 : buée reliée.
  - E20e : barres des écartés ternes en cave.
- Rien d'autre ne bouge que le thème et ces sept points : mises en page, textes, gestes et données sont ceux de c4.

## Prédiction
« Là c'est l'app, en vert Stocks, le + ne mange plus mes chiffres et la question À venir a ses boutons. »

DÉCISION À PRENDRE :
- Le carnet est rangé sous Stocks › Matériel, d'après l'app. La question ouverte du CADRE (onglet propre ou sous le +)
  reste à montrer en variantes.
- DESIGN.md dit « clair par défaut », le CADRE THEME-APP dit « cave par défaut ». J'ai suivi le CADRE et le brief.
- Reste vu, hors liste, donc non touché : deux aplats d'action visibles ensemble, la flèche d'envoi et le +. Paille en
  cave, noir en clair : c'était déjà ainsi en c4. DESIGN demande une seule action principale par écran.

CONNAISSANCE :
- Un toast fixe recouvre toujours une carte. Logé dans la bande du bas, qui grandit avec la marge, il ne masque plus rien.
- Dans une vue sans champ en bas, le + a besoin de sa propre bande.

LEÇON PROPOSÉE : aucune
