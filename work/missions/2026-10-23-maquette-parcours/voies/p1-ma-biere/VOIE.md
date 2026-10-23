# Voie p1-ma-biere — Ma bière, la fiche et Substituer, jouables

- Mission : 2026-10-23-maquette-parcours (lire `../../MISSION.md` d'abord)
- Agent : concepteur
- Modèle : opus
- Niveau : conception
- Plafond : 120 tours ; 3 essais par critère
- Dépend de : p0-socle (le socle, son `ARCHITECTURE.md` et son « ## Contrat d'un écran »)
- Décideur en cas de doute : brasseur, par ses mots et ses choix connus. Aucune question bloquante : l'option
  prudente, écrite dans la NOTE.

## Objectif
Trois écrans de la maquette jouable, en React, dans le socle, calculés en direct :
- **Ma bière, étape Houblons** : le point d'entrée du parcours ;
- **la fiche**, à l'appui long sur un houblon ;
- **Substituer en porte** : « Lequel à la place de Nugget ? ».

Ils ont l'air et le comportement de la vraie app, et tout geste qui change la recette se voit au retour.

## Entrées
- `prototypes/houblons-v4/parcours/ARCHITECTURE.md` : le contrat d'un écran, les crochets d'état, l'adaptateur du
  moteur, les composants communs. Ne pas les recopier dans ton dossier : les employer.
- Ma bière : `work/refonte-frontend/v4/ecran-1/fils22-carte/ma-biere/etat.html` (la carte : contenu admis, ponts)
  et `work/refonte-frontend/v4/ecran-1/base/consolide/biere.html` (la base v4.x : disposition l8, barres l5b au
  style, rail glissé par 5′, radar m4 en lentille). Leurs captures sont dans les dossiers `captures/` voisins.
- Fiche : `work/refonte-frontend/v4/ecran-1/base/consolide/fiche.html` (fiche g1) et la fiche courte de type Citra
  cryo (`cerveau/produit/acquis-valides.md`).
- Substituer : `work/refonte-frontend/v4/ecran-1/fils22-carte/substituer-porte/etat.html`, et
  `work/refonte-frontend/v4/ecran-1/base/consolide/substitution.html` (u4 : remplaçants, dose à IBU égal, perd et
  gagne).
- `cerveau/produit/acquis-valides.md`, `cerveau/brasseur/penser-brasseur.md`, `cerveau/brasseur/pas-de-cockpit.md`.
- `DESIGN.md`, `docs/ui-compacte.md`, `.claude/rules/affinee-frontend.md` : la densité utile est la règle
  principale.
- Les en-têtes des contrôles de tes GATES (`work/refonte-frontend/v4/tournoi/outils/<contrôle>.mjs`) : ils disent
  les marqueurs `data-…` attendus.

## Possède (seuls chemins où écrire, avec RESULTAT.md)
- `prototypes/houblons-v4/parcours/src/ecrans/ma-biere/**`
- `prototypes/houblons-v4/parcours/src/ecrans/fiche/**`
- `prototypes/houblons-v4/parcours/src/ecrans/substituer/**`
- sortie de construction : `prototypes/houblons-v4/maquettes/parcours-p1/` (ignorée par git)
- `work/missions/2026-10-23-maquette-parcours/voies/p1-ma-biere/RESULTAT.md`
- Un besoin dans le socle (un crochet, un composant commun, une action d'état) : le demander au pilote dans
  RESULTAT.md, ou le faire dans ton dossier. Ne pas écrire dans `src/commun/`, `src/etat/` ni `src/moteur/`.

## Consignes
1. **Ma bière, étape Houblons**, dans l'ordre de [[penser-brasseur]] :
   - en tête : IBU, OG et EBC de la recette, avec l'alerte de dégustation « trop résineuse » ;
   - puis les 12 familles en barres l5b au style, le radar m4 à un toucher (lentille) ;
   - puis chaque houblon de la recette : nom, α, rôle en mot, dose, moment glissé par 5′ (le geste de la base),
     IBU de l'ajout recalculé en direct ;
   - le stock en icône seule ;
   - les ponts : « + floral » → Suggérer ; Nugget → Substituer ; la ligne d'un houblon → Dryhopper ; la levure →
     l'étape Levure.
   Après le parcours, la ligne Idaho 7 ajoutée, le remplaçant de Nugget, l'IBU et les barres recalculés se voient,
   avec un repère discret de ce qui vient de changer.
2. **La fiche** : un appui long (650 ms) sur tout nom de houblon de la maquette l'ouvre, et un survol à
   l'ordinateur aussi. C'est la fiche g1, dans le langage de la page : mêmes pictos, α écrit comme sur les lignes,
   arômes et leurs sources, silhouette (radar), un geste « goût ». Elle se ferme par « × », par Échap et par
   « ‹ ». La fiche est un composant de ton dossier que les autres écrans importent : exporte-le, et décris son
   emploi dans ta NOTE.
3. **Substituer, la porte** : Nugget épinglé en colonne 1, les remplaçants du moteur classés (`substitutes`),
   dose à IBU égal, ce qu'on perd et ce qu'on gagne en familles. « Remplacer » inscrit le remplaçant dans la
   recette et revient à Ma bière ; « ‹ » abandonne.
4. **Comme la vraie app** : composants de `src/ui` et jetons de l'app, à travers le socle. Pas de `type="number"`.
   Le geste du moment se joue au doigt et à la souris.
5. **jeu.mjs** de chaque écran (format du socle) : les gestes et les attentes de ton étape. Par exemple, glisser
   le moment de Nugget change son IBU et l'IBU total ; l'appui long ouvre la bonne fiche ; « Remplacer » met le
   remplaçant à IBU égal (à 0,5 IBU près).
   Et D80 en direct (la règle de `controle-usage-intensite.mjs`, sur ce format) : chaque famille qu'un ajout fait
   bouger d'au moins 0,5 point montre son intensité (`data-famille` et `data-crans`, à 0,6 cran au plus du moteur),
   et chaque houblon son usage (`data-usage`, `data-source`, comme `hopRole`).
6. **NOTE.md** de chaque écran : `## Base` (d'où il vient, les captures regardées), `## Idées reprises`,
   `## Écarts` (ce qui diffère de la base et pourquoi), `## Pour l'app` (ce qu'il faudra brancher en vrai).
7. Te juger comme le brasseur sur tes captures (`jouer-parcours.mjs --captures`), à 390 px puis à 1280 px : les
   ouvrir en image avant de dire OK (L12).

## Exigences transversales et acquis (recopiés, leçons L05 et L06)
- Au style, l'absolu en option ; inconnu ≠ 0 (« ? » hachuré) ; simulé marqué « ~ » ; 80 mots au plus au premier
  écran ; légendes derrière « ? » ; stock en icône seule.
- Code couleur des arômes (la table commune) ; moment glissé par 5′ ; barres l5b ; disposition l8 ; radars m4 et
  h4 sans légende écrite ; fiche g1 et fiche courte ; picto « épicé » f1.
- L26 : préfixer les classes propres à l'écran ; aucun `String.replace` avec une chaîne qui contient `$`.

## Critères
Dans `GATES.md`, même dossier. Ne pas le modifier. Lancer chaque `CHECK:` depuis la racine du dépôt.

## Rendre
`RESULTAT.md` : ce qui est fait, les captures ouvertes (nommées), les écarts et leur raison, les besoins dans le
socle, `LEÇON PROPOSÉE : …` s'il y a lieu. Réponse finale au pilote : une ligne.

## Reprise D105 (23.10, soir) : ses maquettes, pas la carte

Le brasseur, sur la maquette jouable : « Mais ça semble pas du tout correspondre aux choix que j'ai fait de maquette
de base ??? » ; « Je confirme que "Bière" et "Suggérer" divergent nettement du design choisi. Oui c'est quoi ce
bordel ??? ». Sur la capture de l'onglet Ma bière de la base v4.10 : « Ça aussi » (c'est son choix). La faute est au
pilote : la carte en fil de fer (`fils22-carte/ma-biere`) était dans tes entrées ; **elle n'est pas une base**. Elle
ne donne que les ponts.

Ce que tu reprends, tel qu'il l'a vu, avec le moteur en direct :
1. **Étape Houblons** (route `ma-biere`, `src/ecrans/ma-biere/`) = `base/consolide/index.html`, capture
   `base/captures/consolide-390.png`. Inventaire : `work/refonte-frontend/v4/ecran-1/base/donnees/inventaire-etape.json`
   (7 éléments) :
   - « Houblons 3/7 » ;
   - la frise verticale du brassin (ébullition 60′ à post-fermentation), avec chaque ajout posé dessus et glissé
     par 5′ ;
   - la carte de l'ajout ;
   - la levure dans la frise ;
   - « Ajouter — houblon… » et les ajouts rapides ;
   - « Boisé et résineux trop marqué › » et les familles en deux colonnes.
2. **Onglet Ma bière** (route `biere`, nouveau dossier `src/ecrans/biere/`, ébauche posée par le pilote) =
   `base/consolide/biere.html`, capture `base/captures/consolide-biere-390.png`. Inventaire :
   `work/refonte-frontend/v4/ecran-1/base/donnees/inventaire-ma-biere.json` (11 éléments) :
   - les onglets : le composant commun `Onglets` (`src/commun/Onglets.tsx`, actif="biere") ;
   - la légende « dégusté · prévu · non situé » ;
   - « 6 au style · 5 non situées » ;
   - les barres au style avec « prévu » ;
   - « bannir · − · sans visée · + » sous la famille touchée ;
   - « + floral », « − résineux », « + … » (vers Suggérer) ;
   - « Prévu avec SafAle US-05 ».
3. Fiche et Substituer : inchangés.
4. NOTE de `ma-biere` et de `biere` : une section « ## Reprise » ; une ligne par élément de leur inventaire
   (repris, en contexte, en pont, ou écarté avec sa raison ; un quart au plus) ; et le marqueur `data-element` à
   l'écran (en-tête de `work/refonte-frontend/v4/tournoi/outils/controle-reprise.mjs`).
5. Socle du pilote, à employer :
   - la route `biere` et `aller({ ecran: 'biere' })` ;
   - `Onglets` ;
   - la liste de comparaison (`useComparaison()`, gestes `basculerComparaison` et `fixerComparaison`).
6. Te juger côte à côte : ta capture à 390 à côté de celle de la base. Il doit reconnaître son écran.

## Reprise D108 (23.10, nuit) — la visée de sa base, telle quelle

Agent : concepteur (Opus), plafond 120 tours. Dépend de : p10-controle-visee (le contrôle ; il s'écrit en même temps,
contre le même contrat de marqueurs, recopié plus bas). Cette section prime sur les consignes ci-dessus là où elles
diffèrent.

### Ses mots, mot pour mot
En commentaire sur la maquette publiée, posé sur « Tropicaux prévu » de Ma bière : « Aussi aucun impact sur je met plus,
moins bannir ect.. » (SPEC-BRASSEUR § 1, « La visée sans effet » ; DEFAUTS-RECURRENTS, D108). Sur la visée « en trait
creux » de sa base, le 18.10 : « Parfait » (SPEC, « Cible et visée »).

### Constat (supervision, joué dans Chrome)
Dans l'onglet Ma bière, « + » sur Tropicaux ne change rien sur la barre (HTML de la piste identique avant et après) ;
seul le mot « plus » change, et une puce « + tropicaux » apparaît en bas, hors de l'écran à 390 px. Même chose pour
« − » et « bannir ». Suggérer lit bien la visée (cartes « Plus tropicaux », « Sans agrumes »), mais « bannir agrumes »
exclut tout houblon qui cite les agrumes (règle V5.5) : 17 voies sur 18 disparaissent. Dans la base, bannir n'exclut
pas : c'est une visée à 0.

### Ce qu'il veut : la visée de sa base v4.10, reprise telle quelle (règle n° 1)
Source : `work/refonte-frontend/v4/ecran-1/base/consolide/biere.html`, fonctions `ligneFamille` et `viserAbs` (vers les
lignes 1380 à 1445), CSS `.visee-f`, `.lien-visee`, `.fam.bannie` (lignes 172 à 182) ; capture
`work/refonte-frontend/v4/ecran-1/base/captures/consolide-biere-390.png`. Ouvrir la base dans Chrome et jouer « + », « − »,
« × », « bannir » avant d'écrire.
1. La visée est posée **sur la piste** : un losange blanc à son niveau, relié au point de la bière par un trait pointillé.
2. « + » et « − » montent ou descendent **d'un palier**, sur l'échelle absolue 0 à 3 (faible 0,5 ; moyen 1,5 ;
   marqué 2,5), comme `viserAbs`.
3. Le palier est **nommé entre les boutons**, et « × » retire la visée.
4. « bannir », c'est **la visée à 0**, « visée absente » : le nom de la famille est barré et grisé, ligne refermée.
5. Les puces d'objectifs suivent les visées.
6. **Suggérer lit le palier en crans**, comme la base (l'écart entre la bière et la visée, en crans du style).
7. **Bannir suit la base** : une visée à 0, lue par Suggérer comme un objectif (faire baisser la famille), et non
   l'exclusion V5.5 de tout houblon qui la cite. Si une exclusion reste quelque part, elle est déclarée dans la NOTE
   (`## Écarts`) avec sa raison, et jamais 17 voies sur 18 écartées sans explication à l'écran.

### Contrat de marqueurs (le même que la voie p10 ; ne pas l'élargir sans le dire au pilote)
Page `<dossier>/biere/etat.html`, 390 × 844 tactile ; famille jouée Tropicaux (une famille « prévue ») :
- la ligne `[data-famille-ligne="<famille>"]` s'ouvre par son bouton `[aria-expanded]` ;
- gestes dans le groupe ouvert : `[data-visee="plus"]`, `[data-visee="moins"]`, `[data-visee="bannir"]`,
  `[data-visee="retirer"]` (le « × ») ;
- sur la piste : le point de la bière `[data-biere-point]`, le losange `[data-visee-marque]` avec `data-niveau` (0 à 3),
  le trait pointillé `[data-visee-lien]` qui relie le point au losange ;
- le palier nommé `[data-palier]`, entre les boutons ;
- la famille bannie : `[data-bannie]` sur la ligne, nom barré (`text-decoration: line-through`), visible ligne refermée.
Le contrôle vérifie : pas de losange au repos ; après « + », losange à droite du point, relié, palier nommé, « × »
visible ; après « − », à gauche ; « + » deux fois, un palier de plus (3 au plus) ; « × » retire ; « bannir » puis ligne
refermée, nom barré.

### Possède en plus, pour cette reprise
- `prototypes/houblons-v4/parcours/src/etat/**` : la visée seulement (son type, l'action, le geste). Changer le type en
  **une seule étape**, avec tous ses lecteurs, pour que la construction reste verte : d'autres voies (p2, p3) construisent
  en même temps depuis le même dossier.
- Les lecteurs de la visée : `prototypes/houblons-v4/parcours/src/ecrans/suggerer/voies.ts` (`objectifsDe`, `bannisDe`,
  `voiesDe` : la lecture de la visée et de bannir seulement ; le reste de `ecrans/suggerer/` est à la voie p2) ;
  `prototypes/houblons-v4/parcours/src/coquille/Coquille.tsx` (les lignes qui lisent la visée) ; la fiche
  (`ecrans/fiche/`, déjà à toi).
- Ta sortie de construction reste `prototypes/houblons-v4/maquettes/parcours-p1/`.

### Garder
- Les marqueurs du parcours et des contrôles : `data-famille-ligne`, `data-element` (dont `biere-bannir`,
  `biere-objectifs`), les `data-role="pont-…"` des puces d'objectifs (le parcours joue « + floral » → Suggérer).
- L'inventaire `inventaire-ma-biere.json` (sa base v4.10), la teinte (D106), la frise (D55, RAIL OK).

### Se juger
Captures de l'onglet Ma bière au repos, après « + », après « − », après « bannir » (ligne refermée), à 390 puis 1280,
ouvertes en image (L12), **côte à côte avec sa base v4.10 jouée dans Chrome** (règle n° 1). Puis Suggérer avec Tropicaux
« + » et agrumes bannis : combien de voies, lesquelles. Dans RESULTAT.md, une section `## Reprise D108` : ce qui est
fait, les captures ouvertes (nommées), le nombre de voies de Suggérer avec agrumes bannis avant et après.
