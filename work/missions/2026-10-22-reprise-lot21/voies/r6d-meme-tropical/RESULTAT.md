OK — Comparer « le même tropical » : grammes en barres, ce qui vient avec, radars r3, B

## Fichiers écrits
- `work/refonte-frontend/v4/ecran-1/fils22-comparer/r6d/generer.mjs` (lit seulement `donnees/comparer-stout.json` ; pictos de la baseline `fils18-baseline/l8g/noyau.mjs`)
- `work/refonte-frontend/v4/ecran-1/fils22-comparer/r6d/etat.html`
- `work/refonte-frontend/v4/ecran-1/fils22-comparer/r6d/NOTE.md` (section « Choix portés » recopiée mot pour mot ; ce que j'ai fait de l'angle)
- Les captures `fils22-comparer/captures/` :
  - `r6d-390.png` ;
  - `r6d-premier-ecran.png` ;
  - `r6d-fiche-390.png` ;
  - `r6d-toucher-390.png`.
- Ce RESULTAT.md. Rien d'autre (outil de capture temporaire dans le scratchpad, hors dépôt).

## Critères (sortie décisive, joués depuis la racine)
- **G1** `COMMUN OK` : couleurs, au style, survol, blocs, contraste, fiche, standard, trait, légende, parlant, valeurs brutes OK ; le compte des mots (MOTS) est sauté, comme le demande la commande.
- **G2** `r6d 80 mots` / `MOTS OK`.
- **G3** `UNE-QUESTION OK (1 groupe libre : houblon)`.
- **G4** `ACQUIS OK (4/4 : radar, chimie, osu, valeurs)` : radar r3, chimie et OSU au repos ; valeurs à un toucher.
- **G5** `ALPHA OK`.
- **G6** `SANS-FAMILLE OK (1 houblon(s) au-dessus de 25 %, part « autres » visible)` : Galaxy, 29 %.
- **G7** `EXISTENT OK 7`.
- **G8** `NOTE OK`.
- **G9** `NOTE OK` (joué sur ce fichier une fois écrit).

Essais : G2 au troisième (134, puis 105, puis 80 mots) ; tous les autres critères au premier.

## Captures ouvertes en image (L12)
- `r6d-premier-ecran.png` : en trois secondes, Galaxy a une barre courte et complète à 4 g/L ; Cascade et Idaho 7 ont une barre pleine jusqu'à 8 g/L, puis une queue hachurée, « >8 g/L » et ~70 % ; les pistes « Ce qui vient avec » commencent.
- `r6d-390.png` : page entière. On y voit :
  - les pistes au style ;
  - les radars r3 et la case « Ta 16D attend » ;
  - la chimie des thiols et le panel OSU ;
  - le pont vers Dryhopper.
- `r6d-fiche-390.png` : appui long sur Galaxy. La feuille montre :
  - α 17,2 % ≠ (fiches 11–16 %), mixte, stock ;
  - le radar silhouette et les familles en « 1 fiche » ;
  - la barre de mots avec la part grise « autres 29 % : cannabis, dank » et la phrase de l'option B « à corriger par le brasseur » ;
  - J'aime et J'exclus.
- `r6d-toucher-390.png` : « Vraies valeurs » ouvert d'un toucher, l'huile totale en barres-plages par source, avec un point par certificat de lot.
- Vérifiée aussi hors des captures du contrat : la vue absolu (0–120), qui départage le résineux (ta bière 83, Galaxy ~103, les autres ~112).

## Prédiction du brasseur
« Pas mal, on voit direct que Galaxy fait le tropical avec 2× moins, et que Cascade n'y arrivera pas même en mettant plus (le panel OSU le montre) ; mais les traits fins partout dans "ce qui vient avec", c'est quoi ? »

## Doutes et limites
- **80 mots pile au premier écran** : un mot de plus fait échouer G2. Pour tenir, l'explication « Cascade et Idaho 7 à 8 g/L, le plus haut connu » est passée dans la légende et dans le libellé des couloirs. Elle n'est plus visible au repos.
- **La référence de l'effet égal est l'un des candidats** (Galaxy à 4 g/L) : la comparaison ne départage vraiment que Cascade et Idaho 7, qui sont tous deux hors grille.
- **Les plages simulées** (bas–haut de la grille) sont presque toujours de 0 à ~60, à cause du haut partiel. Les traits fins chargent les pistes.
- **Le moteur et la chimie divergent sur Idaho 7** : classé « thiols forts » (H11), il reste à ~70 % dans le moteur. La page le dit (« à goûter ») ; je ne l'ai pas tranché.
- **Les libellés de source** (Schmidt 2024, Lafontaine 2018, Sharp 2018, Haas 2020…) sont recopiés de `composes-houblon.json` pour lire les clés H… du fichier de données. Aucune valeur ne vient d'ailleurs que de `comparer-stout.json`.
- **Le stock** : il est montré en icône pour les trois houblons, d'après l'origine de l'α (fiche de stock ou article). La quantité n'est pas dans les données.
- **Le picto « épicé »** est celui de la baseline (grains de poivre), refusé trois fois ; c'est l'affaire de la voie r4.

DÉCISION À PRENDRE : la base « effet égal tropical » prend Galaxy à la fois comme référence et comme candidat, et laisse Cascade et Idaho 7 hors grille (au-delà de 8 g/L). Options :
- (a) garder et étendre la grille à 12 et 16 g/L : un coût moteur à mesurer (L20) ;
- (b) prendre une cible plus basse (le tropical de Cascade ou d'Idaho 7 à 8 g/L), pour que les trois aient une dose connue ;
- (c) garder tel quel : l'inconnu dit lui-même « Cascade n'y arrive pas ».

Recommandation : (b) pour la lecture, (c) en attendant. C'est au pilote, puis au brasseur s'il retient cette base.

CONNAISSANCE : dans comparer-stout.json, pour la stout 16D (dry hop après fermentation, 3 j, US-05), le tropical de Galaxy à 4 g/L (+38,96) dépasse la bande de la 16D (0–30). Cascade et Idaho 7 n'en font que ~70 % à 8 g/L (+27,4 et +27,3). Au style, le résineux de la bière (83, dégusté) est déjà hors de l'échelle 0–45. Le compteur `mots-premier-ecran.mjs` compte chaque jeton séparé par une espace, signes compris (« : », « ? », « · », « ~ ») : coller « ~70% » ou « α 17,2% » économise des mots.

LEÇON PROPOSÉE : avant d'écrire une maquette sous le plafond de mots, lire comment le compteur découpe les mots. Il compte « : », « ? » et « · » comme des mots : ma première version faisait 134 mots au lieu des ~100 estimés, et il a fallu trois passes. Rôles : concepteur, auteur. Contrôle : aucun (le compteur existe déjà).
