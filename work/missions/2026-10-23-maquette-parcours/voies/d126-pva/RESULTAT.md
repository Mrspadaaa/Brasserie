OK — série pva : 4 concepts « ~ simulé » sur r6a (repères, curseur, ticket, envers du radar)

## Concepts (une ligne chacun)
- **pva1** — chaleur froide — idée : les repères ; le toucher voile l'écran et numérote ce que r6a montre déjà (① dose, ② moment, ③ levure, ④ fiches des têtes) ; ⑤ désigne « Chimie et vraies valeurs » et le panel OSU — tient : rien d'inventé, 10 mots, tout à sa place — casse : ne dit pas ce qui est mesuré ni pour qui ; le voile masque le reste.
- **pva2** — chaleur tiède — idée : le curseur « ~ simulé ↔ mesuré » ; on glisse la pastille, le radar du moteur s'efface, ne restent que les mesures en bière posées sur leur axe (linalol 56,9 / 38±13 / ?, panel OSU 10,4 et 7 sur 15) et « 4 mesures sur 36 » — tient : le geste dit la chose, et au milieu les deux se lisent ensemble — casse : linalol sur l'axe Floral peut passer pour un score floral ; les étiquettes couvrent l'intérieur pâli.
- **pva3** — chaleur chaude — idée : le ticket du calcul ; la pastille imprime le ticket du houblon retenu (fiches, dose, moment, levure, « = moteur ~ simulé », ✂ mesuré en bière), le radar se range à droite ; retenir une colonne réimprime — tient : simulé et mesuré séparés par le pointillé, houblon par houblon (Galaxy : rien) — casse : 37 mots, radar réduit, risque de gadget.
- **pva4** — chaleur chaude — idée : l'envers du radar ; le toucher retourne la carte ; au dos, un anneau par houblon, 12 cases : mesuré, fiches marquées, citées, rien — tient : une image franche, presque tout est déduit de fiches minces — casse : la clé est nécessaire, et il faut un toucher de plus pour lire les nombres.

## Fichiers écrits
- `work/refonte-frontend/v4/ecran-1/fils24-petits-choix/pva{1,2,3,4}/` : `etat.html` (copie de `fils22-comparer/r6a/etat.html` et deux lignes d'injection), `pvaN.js`, `pvaN.css`, `NOTE.md` ; `pva2/geste-pva2.json`.
- `work/refonte-frontend/v4/ecran-1/fils24-petits-choix/captures/` : `pva{1..4}-repos.png`, `pva{1..4}-toucher.png`, et en plus `pva2-milieu.png` et `pva3-cascade.png`.
- Scripts de travail : `C:\Users\mrspa\AppData\Local\Temp\d126-pva\` (capturer.mjs, geste.mjs, diff.mjs, copies pour controle-choix).

## Correction du pilote (D128) appliquée
Une première version était posée sur la Comparer de la maquette du jour. Les quatre concepts ont été refaits sur r6a, et l'ancien socle a été supprimé de mes dossiers. Au repos, les 4 captures ont 0 pixel différent de r6a nue (390 × 844, ×2).

## Critères
- G1 : `SERIE-BIEN-4`.
- G2 : `controle-commun.mjs … pva1 pva2 pva3 pva4 --page=etat.html --sans=mots` → `COMMUN OK` (couleurs, au-style, survol, blocs, contraste, fiche, standard, trait, legende, parlant, brutes).
- G3 : `systeme.mjs note … --contient "pva1,pva2,pva3,pva4,chaleur"` → `NOTE OK`.
- Contrôles indicatifs :
  - mots : 39 hors données, comme r6a.
  - UNE-QUESTION OK : houblon seul libre.
  - PANEL ECHEC (ressemblance 0,97, remplissage 0,72) : attendu, les quatre sont la même r6a où seule la pastille change.
  - CHOIX ECHEC, identique au témoin r6a nue (voir la décision ci-dessous).
- Gestes rejoués dans Chrome (390, tactile), sans erreur de page :
  - les quatre : `aria-expanded` passe de false à true, puis Échap referme ;
  - pva2 : glisser au milieu donne t = 0,5 et le plein du radar à 0,58 ;
  - pva3 : un toucher sur Cascade réimprime son ticket.
- Captures ouvertes et regardées.

## Prédiction
« pva4 c'est clair, on voit que presque rien n'est mesuré ; pva2 le slider j'aime bien ; le ticket c'est marrant mais ça prend de la place. »

DÉCISION À PRENDRE : `controle-choix.mjs --ecran=comparer` attend r6a avec D107 (étapes 60′ / 10′, marqueurs d'inventaire de la reprise). r6a seule, comme le demande D128, échoue donc à l'identique, concepts ou non. Il faut choisir : poser la pastille sur r6a + D107, ou rendre l'écart au registre explicite pour ce lot.
CONNAISSANCE : r6a (`fils22-comparer/r6a/etat.html`) est statique. Sa pastille est `.rad-h .simule`, le radar `svg[data-radar]` (centre 179,132, R 100), la ligne de contexte `[data-contexte=base|moment|levure]`, le mesuré `.tch` et `.osu-t`. Pas de dock. Le moment s'y lit (« après fermentation, 3 j »).
LEÇON PROPOSÉE : avant de poser un concept sur « l'écran rendu », vérifier dans le registre que cette page est bien sa maquette choisie (capture côte à côte), et non la construction du jour (D128 : une série refaite).
