ECHEC — critère 1 (rejeu des cas existants après changement) non fait : arrêté au plafond de tours ; critères 2 et 3 tenus, critère 4 partiel (≈ 15 captures sur 160 ouvertes, ETATS.md non écrit)

Aucune valeur de ses pièces dans ce fichier : des comptes, des noms d'interface, des identifiants de défauts.

## 1. Ce qui est fait

- Banc g joué sur **b3ab392e** (l'app en ligne), depuis `C:/Users/mrspa/AppData/Local/Temp/deploy-hosting-qr` (détaché, node_modules et functions/lib présents), 390 tactile et 1280, thèmes clair et sombre (`data-theme='cave'`), par l'entrée de l'app (Actions rapides → Entrer une facture → importer le justificatif).
- 7 cas `g-*` : `g-repos`, `g-puces`, `g-plier`, `g-plateaux`, `g-remplir`, `g-regrouper`, `g-brassage` (doc14 : repos, puces, plier, rangée de malt et de houblon, puis la lecture lente avec corrections de la 3e lecture et la référence du bandeau B). Quatre groupes (G1 à G4), chacun sur une base émulée neuve, **0 ARRÊT** :

| groupe | cas | contrôles (b3ab392e) | captures |
|---|---|---|---|
| avant-G1 | g-repos, g-puces | 20 OK, 58 KO | 34 |
| avant-G2 | g-plier, g-plateaux | 68 OK, 30 KO | 40 |
| avant-G3 | g-remplir, g-regrouper | 10 OK, 12 KO | 24 |
| avant-G4 | g-brassage | 72 OK, 58 KO | 62 |

- 0 requête hors localhost : le banc a **bloqué** (abandonné) 44 requêtes sortantes sur les quatre groupes (polices Google, `accounts.google.com/gsi`, `identitytoolkit`), aucune n'est partie. 80 appels `aiTask` rejoués (tâche `scanInvoice` seulement), 0 appel Gemini, aucune clé.
- Sorties : `…/deploy-hosting-qr/work/missions/2026-10-31-ecran-depense/voies/g1-audit/avant-G1..G4/` ; copie dans le worktree : `voies/g1-audit/avant/G1..G4/` (captures `.png`, `console.log`, `report.json.txt` : les `.json` sont renommés en `.txt` parce que le `.gitignore` (l. 107) ne protège pas les `.json` d'une mission ; ils portent ses valeurs). Planches de 3 captures côte à côte : `avant-G1/planches/p1..p4.png` (côté deploy seulement).
- Sa pièce : manifeste hors Git `os.tmpdir()/bauhaus-0211/rejeu-bauhaus.json` (pièces de `rejeu-k6.json` + pièce `bauhaus` : sa photo, `final.json` servi en « Lecture déjà disponible », `finalSeul`) et `lenteur-bauhaus.json`. Fabriqués par `outils/fabriquer-manifeste.mjs` (chemins seulement).

## 2. Mesures M1 à M13 avant (b3ab392e) : chacune échoue comme attendu, sauf mention

Le verdict est le même aux 4 combinaisons largeur × thème, sauf mention. Comptes lus à 390 clair. Chaque mesure est une `c.check` du banc (KO = le défaut est là).

| M | défaut | cas | résultat sur b3ab392e |
|---|---|---|---|
| M1 | D328a rangées « à contrôler » sur ligne entière hors ingrédients | g-repos | **KO** : 14 rangées (puce « 14 à contrôler »), 14 entières hors ingrédients. doc14 : KO, 3 sur 5 (unité « Stk » déduite sur des rangées d'emballage) |
| M2 | D328b « ? » sur rangées hors stock / en-têtes | g-repos | **KO** : 2 rangées hors stock avec « ? », 3 en-têtes avec « ? ». doc14 : **OK** (ne se reproduit pas) |
| M3 | D328c « nouveau » hors familles d'ingrédients | g-repos | **KO** : 2 « nouveaux », 2 hors ingrédients. doc14 : KO 1 sur 7 (une rangée de matériel en « Ingrédient ») |
| M4 | D328c nature pressée / type d'achat / bande | g-repos, g-plateaux | **KO** : 2 rangées sur 17 incohérentes (bande Nettoyage, nature « Ingrédient », type d'achat « Ingrédients », « nouvel article »). Plateaux ouverts : 2 KO sur 6. doc14 : KO 1 rangée |
| M5 | D328d contraste < 4,5 | g-puces, g-remplir, g-brassage | **KO en clair sous filtre** : 1 texte sous 4,5, « ✕ Toutes les lignes » à **1,0** (blanc 255,255,255 sur blanc). **OK** au repos, plié, plateaux, regroupé. En sombre sous filtre : KO affiché mais **artefact du banc** (voir § 4) |
| M6 | D328e récap rogné avec un chiffre | tous | **KO à 390 seulement** (« Somme = impri… », valeur coupée) ; **OK à 1280** ; doc14 : 2 KO à 390 |
| M7 | D330 rangée inconnue sans rouge | g-repos | **KO** : 2 rangées « ? », 0 quantité en rouge, 3 en-têtes en rouge. doc14 : **OK** (ne se reproduit pas) |
| M8 | D331 puce active = puce au repos | g-puces, g-brassage | **KO** : 3 puces sur 3 (Bauhaus), 4 sur 4 (doc14) : fond, bord, ombre, contour, graisse identiques avant et après le toucher ; seul `aria-pressed` change |
| M9 | D332 retour après « Regrouper » | g-regrouper | **KO** : 17 lignes → 1, aucun geste de retour dans le pied ni ailleurs (24 boutons visibles listés, 0 retour) |
| M10 | D333 « Plié » plie | g-plier | **KO** : après « Plié », 3 corps visibles sur 3, 3 sous-familles ouvertes, et **les deux segments « Plié » et « Déplié » allumés**. OK : « Déplié » ouvre tout ; une en-tête touchée sur « Déplié » replie la seule sous-famille. KO : une en-tête touchée après « Plié » (2 corps visibles au lieu de 1). doc14 : le segment n'existe pas (pas de sous-familles) : noté, pas un KO |
| M11 | D334 champ à remplir marqué et nommé | g-remplir | **KO** : « 1 à remplir » n'ouvre aucune rangée (0 ouverte par le filtre) ; la rangée ouverte à la main n'a aucun champ vide marqué rouge, focus sur le sommaire, pas sur un champ. Mise en place nécessaire : sa pièce lue d'emblée n'a rien « à remplir » ; le cas touche « ⇄ Choisir un autre article » sur un nettoyant sans choisir (constat `g-remplir-mise-en-place`, puce « 1 à remplir » obtenue) |
| M12 | D329 bandeau B / « Tout valider » sur la 3e lecture | g-brassage (lecture lente) | **KO** : 8 lignes corrigées + 1 neuve, puce « 10 corrigées », **pas de bandeau B, pas de « Tout valider »**. La référence (lignes « pas retrouvées », simulé) montre le bandeau « 1/2 · Tout valider » : il n'existe que pour les lignes perdues |
| M13 | D335 un segment Nature pressé par rangée | g-repos, g-plateaux, g-brassage | **KO** : 3 rangées sur 17 sans aucun segment pressé (maintenance, other, packaging) ; plateaux ouverts : 3 KO sur 6. doc14 : 4 sur 17 sans segment (emballage, port) |

Sorties décisives : `…/avant-G*/console.log` (lignes `KO  <largeur> · Mn …`) et `report.json.txt` (`checks[].data`). Tableau agrégé : `node outils/resumer-mesures.mjs <DEP>/work/missions/2026-10-31-ecran-depense/voies/g1-audit avant` (a donné 34 lignes, « 0 ARRÊT »).

Autres constats posés (`c.finding`, pas des mesures) : touché sur la puce « Désaccord » (aucune rangée ouverte, défile de 28 px, focus sur la puce) ; segment « Plié | Déplié » absent sur doc14.

## 3. Écarts vus à l'œil (captures ouvertes : repos clair 1 et 2, plié sombre, puces clair « nouveaux » / « hors stock » / « à contrôler » liste, puces sombre « nouveaux » liste / « à contrôler » / « Désaccord », plateau d'un nettoyant, regroupé haut, « 1 à remplir » puces et liste)

1. Clair, filtre actif : la barre noire porte à droite une **pastille blanche vide** (le bouton « ✕ Toutes les lignes » blanc sur blanc) : exactement D328d ; en sombre le même bouton est lisible.
2. Les puces touchées (clair et sombre) ne changent pas d'aspect : seule la barre du filtre dit lequel est actif (« 14 à contrôler · 3 masquées »). D331 confirmé à l'œil.
3. « Plié » et « Déplié » sont allumés **en même temps** (jaune en sombre, noir en clair) et la liste reste dépliée.
4. Récap à 390 : « Somme = impri… » suivi du total coupé ; « 14 à contrôler », « 2 nouveaux », « 15 hors stock », « 2 Désaccord » (pluriel faux) tous là, comme sur ses captures.
5. Rangées à « 1 ? × » en gris, sous des en-têtes « 2 ? » et « 1 ? » en rouge : le rouge reste sur les en-têtes, pas sur la rangée (D330).
6. Plateau d'un nettoyant : bande Nettoyage mais segment « Ingrédient » pressé, « nouvel article » : D328c ; le segment Nature n'a que trois choix.
7. Regroupé : 17 lignes deviennent 1, le récap (liste des remarques, « 1 ligne ») reste, aucune marque de retour.
8. Sous « 1 à remplir » : seul le nom de la rangée est souligné en rouge ; le champ attendu n'apparaît pas, la rangée n'est pas ouverte.
9. Sombre, filtre actif : les rangées retenues sont entourées de jaune ; correct à l'œil.

**Limites** : environ 15 des 160 captures ont été ouvertes. Je n'ai **pas écrit `ETATS.md`** (une ligne par capture exigée) : à faire par le pilote ou le critique, planches possibles par `outils/montage.mjs`. Les captures 1280, les plateaux sombres, g-brassage (repos, plateaux, lecture lente, bandeau B de référence) restent non regardées.

## 4. Échecs dus au banc, séparés des KO attendus

Rejeu des cas **existants** sur b3ab392e, script d'origine inchangé (`banc-original.mjs`, empreinte `d3db7db5` = HEAD du dépôt de jeu), 4 groupes de `groupes-existants.sh` (sorties `base-A..E`) :

| groupe | cas | résultat (exit 1 partout sauf B essai 2 et C) |
|---|---|---|
| base-A | etats, doublon, doc5, finances, doc6 | 48 OK, 2 KO, 0 ARRÊT |
| base-B | autre-numero, rattacher, minuscules, doc1 | essai 2 : 10 OK, 0 KO (exit 0) |
| base-C | doc4, hors-ligne, doc3, doc2 | 14 OK, 0 KO (exit 0) |
| base-D | doc14 | essai 2 : 50 OK, 2 KO |
| base-E | drive-fond | **jamais terminé** : 4 essais, 17, 29, 0 puis 4 OK ; arrêt par la garde mémoire |

Total A à D : **122 OK, 4 KO**. Ces 4 KO sont des défauts **de l'app en ligne**, pas du banc : `doc6 : « Même achat » ne crée ni dépense ni écriture, la feuille se ferme` (390 et 1280) et `doc14 (c) : aucune pastille TVA sur une TVA juste par taux (D262a)` (390 et 1280).

Échecs **du banc lui-même** (pas des défauts de l'app) :
- **Garde mémoire** (`GARDE MÉMOIRE : 1,35 Go libres < 1,5 Go`) : la machine partagée n'a que 3,9 à 4,4 Go libres ; le banc lui-même en prend 2 à 2,5. Avec le plancher d'origine (2,2 Go) presque tous les essais s'arrêtaient dans la minute (premier lancement : 4 essais perdus). J'ai passé `--memory-floor 1.5` (le minimum permis) dans `outils/lancer-g.sh`. Ce sont les « exit 1 (0 OK) » du début de `bilan-g.txt` : des reprises, pas des KO. base-D essai 1 (1 OK), base-B essai 1 et base-E essais 1 à 4 en sont.
- **Un groupe trop gros** (les 15 cas d'un coup, `base-existants`) n'a jamais abouti : séparé en groupes (A à E, ceux de `e-emulateur/rejouer.sh`). `finances` dépend de `doc5` dans le même run : à ne pas séparer.
- **Artefact de mesure corrigé mais pas rejoué** : en sombre, sous filtre, M5 a rendu KO (contrastes de 2,1 à 3,9 sur la rangée visée) parce que la mesure tombe pendant l'éclair de 1,6 s (`.dp-p3c-garde`). Corrigé dans le script du worktree (`mesurerG` mène les animations à leur fin avant de mesurer) ; les sorties `avant-G*` ont l'ancienne mesure. Le KO **clair** (ratio 1,0 du bouton) est réel, il ne dépend pas de l'animation.
- Le statut « exit 1 » du lanceur vaut pour tout groupe qui compte un KO : ce n'est pas un échec du banc.

## 5. Critères (état)

1. **Non tenu** : les cas existants rejoués avant (122 OK, 4 KO, + drive-fond partiel) mais **pas après** le changement du script (le rejeu `apres` a été arrêté sur ordre ; `apres-A` partiel, à ignorer). Le changement du script est additif : `bauhaus` en pièce facultative, `libre` (ne pas comparer l'empreinte de la photo, que l'app allège avant l'envoi, D324), 7 cas `g-*`. Voir DEMANDE EXECUTANT.
2. **Tenu** : les 7 cas tournent jusqu'au bout aux 2 largeurs et 2 thèmes, 0 ARRÊT, 0 requête hors localhost, 0 appel Gemini.
3. **Tenu** pour M1, M3, M4, M5 (clair), M6 (390), M8, M9, M10, M11, M12, M13 sur sa pièce. **Le défaut ne se reproduit pas** : M2 et M7 sur doc14 (reproduits sur sa pièce) ; M5 hors filtre ; M6 à 1280 ; M10 sur doc14 (pas de segment).
4. **Partiel** (voir § 3).
5. `git status --short` : mes fichiers sont dans `scripts/check-invoice-journey-emulator.mjs` (modifié) et `voies/g1-audit/**` ; **le `.gitignore` des missions ignore tout sauf `.md` et `.json`** : `outils/*.mjs`, `outils/*.sh` et `avant/` sont donc invisibles à Git (à ajouter avec `git add -f` si on les garde). Le reste de `git status` (hooks, hopSources, fermentescibles…) est d'autres voies. Aucune valeur de ses pièces dans un fichier suivi.

## 6. Rejouer les mêmes cas sur un autre commit

Le banc calcule sa racine comme le dossier parent de son dossier `scripts/` : il lui faut `node_modules` (firebase-tools, vite, puppeteer-core, zxing-wasm), `functions/lib` et `functions/node_modules`. **Le script doit donc vivre dans `<copie du commit>/scripts/g-banc.mjs`**, copié depuis le worktree (`scripts/check-invoice-journey-emulator.mjs`), et la copie est détachée sur le commit à juger, jamais le worktree (g2a, g2b y écrivent).

1. Copie du commit à juger (modèle : `…/Temp/deploy-hosting-qr`, détaché sur b3ab392e, node_modules et functions/lib présents). Pour un autre commit : `git -C <copie> checkout --detach <commit>` (hors voie : c'est un geste du pilote), `functions/lib` reconstruit (`tsc` des Functions) si le commit les touche.
2. `cp <worktree>/scripts/check-invoice-journey-emulator.mjs <copie>/scripts/g-banc.mjs`.
3. `node <worktree>/work/missions/2026-10-31-ecran-depense/voies/g1-audit/outils/fabriquer-manifeste.mjs` (recrée `%TEMP%/bauhaus-0211/rejeu-bauhaus.json` à partir de `bauhaus-0211/final.json`, de sa photo et de `%TEMP%/affinee-lenteur/`).
4. Éditer `DEP=` en tête de `outils/lancer-g.sh` (chemin en dur : `C:/Users/mrspa/AppData/Local/Temp/deploy-hosting-qr`) si la copie change.
5. Les cas g, par groupes (chaque groupe : base neuve) : `bash outils/groupes-g.sh <préfixe> scripts/g-banc.mjs` (G1 : g-repos,g-puces ; G2 : g-plier,g-plateaux ; G3 : g-remplir,g-regrouper ; G4 : g-brassage ; largeurs 390,1280). Un cas seul : `bash outils/lancer-g.sh <nom> g-puces 390 "" scripts/g-banc.mjs`.
6. Les cas existants : `bash outils/groupes-existants.sh <préfixe> scripts/g-banc.mjs` (groupes A à E ; `base` = script d'origine, `apres` = script modifié).
7. Résumé : `node outils/resumer-mesures.mjs <copie>/work/missions/2026-10-31-ecran-depense/voies/g1-audit <préfixe>`. Sur la version **corrigée**, chaque `KO` de M1 à M13 doit passer à `OK` (sauf M2, M7 sur doc14, qui l'étaient déjà).
Un banc à la fois (ports fixes 9099, 8080, 5001, 4400, 4500, 5175) ; le plancher mémoire est dans `lancer-g.sh` (`--memory-floor 1.5`).

## DEMANDE EXECUTANT

À confier à un exécutant Haiku, depuis `…/g1-audit/` du worktree, **un banc à la fois** :
1. `bash outils/groupes-existants.sh apres scripts/g-banc.mjs` (copier d'abord le script modifié dans `deploy-hosting-qr/scripts/g-banc.mjs`). Attendu : A 48 OK 2 KO, B 10 OK, C 14 OK, D 50 OK 2 KO (mêmes nombres que `base-*`). Fichier de sortie : `bilan-g.txt` du dossier `deploy-hosting-qr/work/missions/2026-10-31-ecran-depense/voies/g1-audit/`.
2. `bash outils/groupes-existants.sh` ne rejoue pas `drive-fond` jusqu'au bout sous cette mémoire : le jouer seul, à une largeur : `bash outils/lancer-g.sh base-E drive-fond 1280 "" scripts/check-invoice-journey-emulator.mjs`, puis la même ligne avec `g-banc.mjs`.
3. Rejouer G1 à G4 avec la mesure corrigée (`bash outils/groupes-g.sh avant2 scripts/g-banc.mjs`) puis `node outils/resumer-mesures.mjs … avant2`, pour que M5 sombre ne porte plus l'artefact de l'éclair.
Captures à ouvrir par moi ensuite (L12) : toutes celles du § 3 en « limites ».

## Doutes et limites

- Sa pièce donne ici « 14 à contrôler » ; il en a vu 15 : la différence n'est pas expliquée (version de la lecture servie, ou la 15e vient d'un état de sa base de stock que le banc ne reproduit pas).
- « Plié » : les sous-familles de sa pièce sont « à vérifier » ou non ? Non établi ; la mesure dit seulement que rien ne se plie.
- D328f (pluriel de « Désaccord »), D328g et D328h ne sont pas dans M1 à M13 et ne sont pas mesurés ici (visibles à l'œil : « 2 Désaccord » ; « 9,50 » correct sur les captures vues).
- J'ai arrêté des processus par `taskkill` en filtrant les lignes de commande (banc, émulateurs Firebase, vite de `deploy-hosting-qr`) : si une autre voie jouait un banc au même moment, il a pu être interrompu.
- Le rejeu `base` d'origine tourne avec le plancher 1,5 Go : un run non arrêté par la garde ne prouve pas que la machine tenait.

CONNAISSANCE : le banc de ce poste ne tient pas plus de ~5 cas par run sous 4 Go libres ; le plancher mémoire 1,5 Go et des groupes de 2 à 5 cas règlent les arrêts ; `finances` exige `doc5` dans le même run ; le `.gitignore` des missions laisse passer les `.json` (valeurs de ses pièces) : renommer les sorties en `.json.txt`.
LEÇON PROPOSÉE : un banc de contrôles visuels mesure après les animations (`document.getAnimations()` terminées) : un contraste pris pendant un éclair de 1,6 s a donné de faux KO en sombre ; et un cas se pose sur sa pièce **et** sur le défaut de sa plainte (l'état « à remplir » n'existe pas à l'ouverture de sa pièce, il se fabrique par un geste de lui).
