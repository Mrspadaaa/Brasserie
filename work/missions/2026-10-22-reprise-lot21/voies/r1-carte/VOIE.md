# Voie r1-carte — la carte des outils houblons, en fil de fer

- Mission : 2026-10-22-reprise-lot21
- Agent : concepteur
- Modèle : opus
- Niveau : conception
- Plafond : 80 tours ; 3 essais par critère
- Dépend de : r0-controles, r0b-controles-ajustes, r6e-entrees
- Décideur en cas de doute : brasseur (il choisit en regardant) ; pilote pour le contrat

## Objectif
Une page en fil de fer qui suit **la stout export 16D** de l'étape Houblons de Ma bière jusqu'à
Dryhopper, avec un écran par outil. Chaque écran pose sa question dans son titre et ne laisse libre
qu'un seul facteur ; les autres facteurs sont marqués sur une ligne de contexte. Les choix encore
ouverts sont montrés **côte à côte**, sans question fermée : le brasseur choisit en regardant (L24).

## La carte (verdict du conseil, `cerveau/decisions/2026-10-22-carte-outils-houblons.md`, « Recommandation »)
- **Ma bière, étape Houblons** : le point d'entrée (disposition l8, radars m4/h4). Chaque houblon,
  ajout ou levure ouvre son outil en plein écran.
- **Suggérer** : « Quel houblon ajouter à ma bière ? » (s5). Facteur libre : les candidats
  (houblon). Pont : « + » vers Comparer.
- **Comparer** : « Lequel pour ma stout : Cascade, Idaho 7 ou Galaxy ? ». Facteur libre : la
  variété (houblon). Pont : le gagnant ouvre Dryhopper. Ici, un fil de fer seulement : les variantes
  détaillées sont le lot 22, fait en parallèle par les voies r6a à r6m.
- **Substituer**, deux façons, côte à côte :
  - (1) une porte « Je n'ai pas X » qui ouvre Comparer avec X épinglé en colonne 1 ;
  - (2) un outil propre (u4, base v4.7).

  Facteur libre : houblon.
- **Dryhopper** : « Quand l'ajouter ? ». C'est y1b sans sélecteur de houblon, sans second houblon et
  sans levure. Facteur libre : le moment, par 5′. La dose est en contexte, fixée pour ce lot (D98
  strict jusqu'au lot 23). En fin de frise, x3b réduit : « ma bière → +1 → +2 dry hops ». Pont :
  vers Levure.
- **Levure**, deux façons, côte à côte :
  - (1) la dernière étape de Dryhopper ;
  - (2) un outil propre, « Que change ma levure ? » (a2b).

  Facteur libre : la levure.

## Entrées
- `cerveau/decisions/2026-10-22-carte-outils-houblons.md` (Verdict), `cerveau/produit/outils-houblons.md`, `cerveau/produit/acquis-valides.md`.
- `work/refonte-frontend/v4/SPEC-BRASSEUR.md` — « Le lot 21, son retour », et la baseline l8.
- `.claude/rules/affinee-frontend.md`, `DESIGN.md`, `docs/ui-compacte.md` — règles d'interface.
- Les écrans à reprendre en fil de fer :
  - `work/refonte-frontend/v4/ecran-1/base/consolide/biere.html` et `etat-b.html` (Ma bière) ;
  - `suggestions-radar.html` (Suggérer) ;
  - `comparer.html` (Comparer) ;
  - `substitution.html` (u4).

  Captures dans `base/captures/` (`consolide-*-390.png`).
- `work/refonte-frontend/v4/ecran-1/fils21-choisir/y1b/etat.html`, `x3b/etat.html`, `a2b/etat.html` et leurs captures dans `fils21-choisir/captures/` (`y1b-390.png`, `x3b-390.png`, `a2b-390.png`).
- `work/refonte-frontend/v4/ecran-1/fils22-comparer/donnees/comparer-stout.json` — la stout et ses houblons, vérifiés (ENTREES.md). Aucun chiffre inventé : une valeur montrée vient de là ou des pages de base.
- `work/refonte-frontend/v4/tournoi/outils/controle-une-question.mjs` — son en-tête dit le balisage (`data-libre`, `data-role="contexte"`, `data-contexte`, `data-lecture`).

## Possède (seuls chemins où écrire, avec RESULTAT.md)
- `work/refonte-frontend/v4/ecran-1/fils22-carte/**` :
  - `generer.mjs` ;
  - `carte.html` ;
  - un dossier par écran avec son `etat.html` : `ma-biere`, `suggerer`, `comparer`,
    `substituer-porte`, `substituer-outil`, `dryhopper`, `levure-etape`, `levure-outil` ;
  - `NOTE.md` ;
  - `captures/`.
- `work/missions/2026-10-22-reprise-lot21/voies/r1-carte/RESULTAT.md`

## Consignes
- **Chaque écran** est une page de 390 px, en fil de fer fidèle (formes, ordre, mots ; peu de
  couleur hors du code des arômes). Il porte :
  - le titre-question ;
  - un seul groupe `data-libre="<facteur>"` ;
  - une ligne `data-role="contexte"` d'au moins deux facteurs fixés, sans contrôle ;
  - son pont vers l'outil suivant, dans un `nav`.
- **`carte.html`** montre le parcours, de haut en bas, à 390 px : les écrans en vignettes (iframes
  réduites ou images), reliés par leurs ponts. Les deux façons de Substituer et de Levure sont côte à
  côte, sous une légende neutre (« deux façons, à toi de choisir en regardant »). Aucune question
  fermée.
- **Penser en brasseur** (L04) : α, rôle, arômes en couleur, moment et dose avant l'IBU.
- **Peu de texte** : 70 mots au plus par écran au premier écran.
- **Captures** : `fils22-carte/captures/carte-390.png` (la carte entière) et `<écran>-390.png` pour
  chaque écran. **Ouvre chacune en image** et juge-la (L12).
- `NOTE.md` : la carte en une table (écran, question, facteur libre, facteurs en contexte, pont,
  éléments admis), ce qui tient, ce qui casse, et pourquoi la fiche et la légende sont laissées aux
  lots d'outil (elles sont écartées de COMMUN par `--sans=fiche,legende`).

## Exigences transversales et acquis (recopiés, leçons L05 et L06)
- Un seul facteur libre par écran d'outil (D98) ; la question dans le titre.
- Code couleur des arômes ; barres de l5b ; disposition l8 ; radars m4 et h4 ; au style par défaut.
- α en tête, rôle en mot, stock en icône ; pictos au trait ; aucune valeur brute.
- Honnêteté des données ; la baseline est un plancher à enrichir (L07).

## Critères
Dans `GATES.md`, même dossier. Ne pas le modifier. Lancer chaque `CHECK:` depuis la racine du dépôt.

## Rendre
`RESULTAT.md` au format de l'agent. Y citer les captures ouvertes, et ajouter `CONNAISSANCE` et
`LEÇON PROPOSÉE`. Réponse finale au pilote : une ligne.
