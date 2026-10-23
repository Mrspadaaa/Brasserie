OK — contrôle D107 et D114 (panel replié), sept témoins ; d332792c échoue sur les deux

## Fichiers écrits
- `work/refonte-frontend/v4/tournoi/outils/controle-comparer-etapes.mjs` : Chrome (puppeteer-core), 390 × 844 tactile puis 1280 × 800, page `<dossier>/comparer/<page>` au repos. Options `--page=`, `--largeur=`. Code 2 si la page manque.
- `work/refonte-frontend/v4/tournoi/outils/temoins/comparer-etapes-{ok,ok-houblon,un-moment,cache,sans-reference,trop-haut}/comparer/etat.html` : pages statiques, `window.__parcours` posé (Nugget). Capture de `-ok` à 390 px prise et ouverte : tableau de trois houblons + « Ta stout » en pointillé, 60′ / 10′ / dry hop, dock « Placer » en bas, rien de couvert.
- `portee-defauts.json` : ligne D107 ajoutée seule (relue avant écriture ; D1 à D106 intacts, D108 à D110 n'y étaient pas encore). `DEFAUTS-RECURRENTS.md` : colonnes « Contrôle » et « Témoin » de la seule ligne D107 (le contrôle n'était plus « à écrire »). `systeme.mjs defauts` rejoué : DEFAUTS-COURT OK.

## Sorties décisives
- G1, construction rejetée d332792c : `ECHOUE OK`. Sortie : `COMPARER-ETAPES ECHEC (13 manque(s))`, dont « D107 0 valeur d'étape (une seule : après, 3 j) pour … : Comparer ne compare pas les étapes 60′, 10′, dry hop », « pas de référence : ni houblon de base ni bière de base », un message par houblon (Cascade, Idaho 7, Galaxy) et par étape, « 60′ » et « 10′ » non nommées.
- G2 comparer-etapes-ok : `COMPARER-ETAPES OK (3 houblons + référence biere, étapes b10 b60 dryActive dryPost)` ; 12 valeurs visibles ensemble, écart vertical 110 px (844 et 800).
- G2b comparer-etapes-ok-houblon : `COMPARER-ETAPES OK (3 houblons + référence beermaverick-nugget, …)`.
- G3 comparer-etapes-un-moment : `ECHOUE OK` (0 valeur d'étape, « une seule : après, 3 j »).
- G4 comparer-etapes-cache : `ECHOUE OK` (« valeur à dry hop … caché au repos (<details> fermé) », 4 manques par largeur).
- G5 comparer-etapes-sans-reference : `ECHOUE OK` (« pas de référence … (aucun [data-reference]) »).
- G6 comparer-etapes-trop-haut : `ECHOUE OK` (« écart vertical 1314 px, fenêtre 844 px » et 800).
- G7 : `PORTEE OK`. G8 : `TEMOINS OK`. Mission : `MISSION OK` (la portée D107 voit le contrôle dans GATES de p3). `cablage` : CABLAGE OK.
- Essais : un par critère, aucun correctif nécessaire après la première exécution (une retouche de présentation : messages fusionnés par largeur).
- Épreuves hors témoins demandés, dans le dossier temporaire : un dock plein écran sur le témoin positif → « couvert (div.dock au point central) » ; un `[data-inconnu]` affichant « 0 » → « inconnu affiché « 0 » (l'inconnu n'est pas 0) ». Les deux échouent bien.
- `systeme.mjs appels controle-comparer-etapes.mjs --rejouer` rend APPELS ECHEC : seul le GATES de p3 est en cause, `prototypes/houblons-v4/maquettes/parcours-p3` n'existe pas encore (code 2, « page absente »). Normal tant que p3 n'a pas construit ; à rejouer après elle.

## Contrat : ce que j'ai ajouté ou précisé (sans l'élargir)
- Au moins deux houblons comparés (comparer = au moins deux).
- Texte d'une valeur : commence par un nombre (« ~ » permis) ou « ? » ; sinon échec.
- Ancêtre qui rogne (overflow non visible) : une valeur hors de son cadre au repos compte comme cachée.
- La référence ne porte pas `data-houblon-compare`. Référence « houblon » : sa clé doit être dans `window.__parcours.etat.recette.additions[].hopKey` (échec si `__parcours` manque).
- Couverture : l'élément est défilé au centre de l'écran avant le test du point central, comme dit au contrat ; un élément tout au bas du document, que le défilement ne peut pas remonter, est donc bien testé contre le dock.
- Pour p3 : le contrôle attend jusqu'à 6 s les marqueurs `[data-houblon-compare]` ou `[data-etape]` (rendu React), puis 0,7 s.

## Trous vus (non couverts par le contrat)
- Le contrôle prouve la forme, pas le sens : il ne vérifie pas que les nombres viennent du moteur ni qu'ils diffèrent d'un houblon à l'autre (un « ~20 » copié partout passerait).
- Rien n'exige que la référence soit reconnaissable (pointillé de x3b, nom « Ta stout ») : seul `[data-reference]` compte. Le jugement visuel reste celui de la capture regardée et du brasseur.
- Les étapes nommées sont cherchées dans tout le texte de la page, pas à côté des valeurs : un « 60′ » ailleurs suffirait.
- `b5` et `wp` ne sont pas exigés ; leur présence n'est pas vérifiée (texte valide) sauf s'ils sont exigés par erreur de marqueur.
- Le contrôle ne joue pas le toucher : une valeur utile après un toucher n'est pas acceptée (voulu : « au repos »).
- La fusion « aux deux largeurs » regroupe les messages identiques ; un manque à une seule largeur est dit « à 390 px » ou « à 1280 px ».

## Suite D114 (« Beaucoup trop mis en avant », panel OSU) : faite, option (a) du pilote
- `controle-comparer-etapes.mjs`, règle D114 à 390 × 844, au repos (en-tête à jour ; non jouée avec `--largeur=1280`). Panel repéré par `[data-element~="y3-panel-osu"]` ou `[data-acquis="osu"]` (marqueurs actuels de `comparer/index.tsx`), sinon par le titre « Panel OSU ». Lignes « - D114 … » pour : panel absent ; **panel OUVERT au repos** (tout élément visible du panel hors sa ligne de titre : graphique, notes, sources) ; panel replié sans titre ni déclencheur visible ; panel replié qui ne s'ouvre pas d'un toucher (toucher rejoué pour de vrai, page rechargée : aria-controls, data-ouvre-acquis/element « osu », ou <summary> d'un <details>) ; titre ou déclencheur dans les 844 premiers pixels ; titre plus gras ou plus grand que le plus fort des autres titres de bloc (h2 à h6, role=heading, summary, button[aria-controls] visibles, hors panel et h1 ; aucun → manque). « Visible au repos plus bas » n'est plus accepté.
- Témoins : `comparer-etapes-ok` et `-ok-houblon` gardent un panel replié (`<details>`, titre 600 / 14 px, haut à plus de 1000 px) et restent OK : « panel OSU : replié, titre ou déclencheur visible, s'ouvre d'un toucher ». `comparer-etapes-panel-haut` (ouvert, 224 px, titre 800 / 22 px) → ECHEC, quatre lignes D114 : ouvert au repos, premier écran, « plus gras (800 contre 600) », « plus grand (22 px contre 14 px) » (G10 : ECHOUE OK).
- Épreuves hors témoins (dossier temporaire) : panel derrière un bouton à aria-controls (titre dans le bouton) → OK ; bouton muet « Détail » → OK ; panel caché sans titre ni déclencheur → ECHEC ; panel absent → ECHEC.
- `portee-defauts.json` : ligne D114 (garde, comparer, oui, script `controle-comparer-etapes.mjs`), résultat mis à jour. `DEFAUTS-RECURRENTS.md` : colonne « Témoin » de la seule ligne D114 corrigée (« maquette d332792c → échoue (panel ouvert au repos, seul bloc détaillé déplié) »), puis `systeme.mjs defauts` : DEFAUTS-COURT OK. Lignes D115 à D121 de la supervision non touchées.

### d332792c échoue maintenant sur D114 (sous l'ÉCART du premier jet)
Premier jet (trois règles : position, un toucher, titre) : d332792c passait D114 (panel à 903 px, titre 700 / 14 px comme « Chimie et vraies valeurs » et « Égaler », panel ouvert de 267 px, ouvert au repos). Avec la 4e règle (replié au repos), sortie sur d332792c, 390 px :
`panel OSU (390x844 tactile) : OUVERT au repos (svg « 051015023,86816intensité », text « 0 », text « 5 »), haut à 912 px, titre 700 / 14 px, 2 autre(s) titre(s) de bloc`
`COMPARER-ETAPES ECHEC (5 manque(s))`
`- D114 panel OSU ouvert au repos, seul bloc détaillé déplié (contenu visible : svg … ) : trop mis en avant, le replier comme « Chimie et vraies valeurs » et « Égaler » (titre ou déclencheur seulement, contenu à un toucher)`
(plus quatre lignes D107 inchangées : « 0 valeur d'étape (une seule : après, 3 j) », pas de référence, 60′ et 10′ non nommées.)

### G8
`systeme.mjs temoins` : TEMOINS OK au rejeu (le témoin Dryhopper corrigé par le pilote ; la rougeur venait de D109, pas de mes lignes).

DÉCISION À PRENDRE : aucune.
CONNAISSANCE : aucune.
LEÇON PROPOSÉE : aucune.
