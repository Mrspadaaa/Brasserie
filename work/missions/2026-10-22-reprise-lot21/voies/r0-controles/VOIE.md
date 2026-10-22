# Voie r0-controles — trois contrôles nés des plaintes du lot 21

- Mission : 2026-10-22-reprise-lot21
- Agent : auteur
- Modèle : sonnet
- Niveau : jugement
- Plafond : 80 tours ; 3 essais par critère
- Dépend de : —
- Décideur en cas de doute : pilote (la convention de balisage que tu fixes sera imposée aux lots suivants : écris-la dans RESULTAT.md)

## Objectif
Écrire trois contrôles au rendu (puppeteer-core, 390 px), chacun en échec sur ses témoins négatifs
réels et en réussite sur un témoin positif. Ils entreront dans les GATES de toutes les voies
d'interface suivantes (r1, r6, r7) : la confusion du lot 21 ne doit plus pouvoir revenir sans échec.

1. **`controle-une-question.mjs` (leçon L10)** : un écran d'outil n'a qu'**un seul groupe de
   sélecteurs libres** (un seul facteur qui varie : houblon, ou dose, ou moment, ou levure…). Les
   autres facteurs sont fixés et affichés sur une ligne de contexte. Le titre de l'écran pose sa
   question. Témoins négatifs : y1b et y3 du lot 21, qui laissent libres houblon, dose et levure
   (verdict du conseil du 22.10).
2. **`controle-acquis.mjs` (leçon L06)** : un écran Comparer porte les quatre acquis validés : le
   **radar**, la **chimie** (huile, thiols, linalol… rattachés à leurs familles), le **panel OSU**
   (celui de y3) et les **vraies valeurs** (celles de v1 : nombres avec unité et source). Témoin
   négatif : y3, qui a le panel mais pas de radar.
3. **`controle-sans-famille.mjs` (leçon L14)** : tout houblon montré dont **plus de 50 %** des mots
   sont sans famille doit montrer une **part « autres » visible** (une forme dessinée, pas une ligne
   de texte en petit). Témoin négatif : l5f, où Nelson Sauvin (83 % sans famille) n'a que la ligne
   « sans famille : … ».

## Entrées
- `cerveau/decisions/2026-10-22-carte-outils-houblons.md` — verdict du conseil : un facteur libre par écran, éléments admis par outil.
- `cerveau/produit/outils-houblons.md` et `cerveau/produit/acquis-valides.md` — carte des outils et acquis (radar, OSU, vraies valeurs, w2).
- `cerveau/metier/descripteurs-hors-familles.md` — Nelson Sauvin 83 %, cause, option B (« autres » neutre, ni hachurée ni aux couleurs d'arôme).
- `work/refonte-frontend/v4/DEFAUTS-RECURRENTS.md` — ligne « À contrôler, lot 21 », points 2, 3 et 5.
- `work/refonte-frontend/v4/SPEC-BRASSEUR.md` — section « Le lot 21, son retour » (mots exacts).
- `work/refonte-frontend/v4/ecran-1/fils21-choisir/y1b/etat.html` et `y1b/NOTE.md` — témoin négatif L10 et L06.
- `work/refonte-frontend/v4/ecran-1/fils21-choisir/y3/etat.html` et `y3/NOTE.md` — témoin négatif L10 et L06 ; son panel OSU.
- `work/refonte-frontend/v4/ecran-1/fils21-choisir/v1/etat.html` et `v1/NOTE.md` — les vraies valeurs.
- `work/refonte-frontend/v4/ecran-1/fils21-choisir/w2/etat.html` — la manière de comparer.
- `work/refonte-frontend/v4/ecran-1/fils16-radar-comparer/` — les radars de Comparer (r2, r3).
- `work/refonte-frontend/v4/ecran-1/fils18-baseline/l5f/etat-b.html` et `l5f/NOTE.md` — témoin négatif L14 (`?fiche=Nelson Sauvin` ouvre sa fiche).
- `prototypes/houblons-v4/data/pack-fiches.json` — `fichesHoublons[].aromes` et `.motsSansFamille` : la part sans famille se calcule ici.
- `work/refonte-frontend/v4/tournoi/outils/controle-legende.mjs`, `controle-valeurs-brutes.mjs`, `controle-radar.mjs` — modèles de contrôles au rendu (arguments, sortie, code de sortie).

Les pages `etat.html` ne sont pas versionnées mais sont présentes dans ce dossier de travail. Ne les
modifie pas.

## Possède (seuls chemins où écrire, avec RESULTAT.md)
- `work/refonte-frontend/v4/tournoi/outils/controle-une-question.mjs`
- `work/refonte-frontend/v4/tournoi/outils/controle-acquis.mjs`
- `work/refonte-frontend/v4/tournoi/outils/controle-sans-famille.mjs`
- `work/refonte-frontend/v4/tournoi/outils/temoins/une-question-ok/etat.html`
- `work/refonte-frontend/v4/tournoi/outils/temoins/acquis-ok/etat.html`
- `work/refonte-frontend/v4/tournoi/outils/temoins/sans-famille-ok/etat.html`
- `work/missions/2026-10-22-reprise-lot21/voies/r0-controles/RESULTAT.md`

## Consignes
- **Forme commune** (comme les contrôles voisins) : `node <controle>.mjs <dossier> <id> [id…]
  [--page=etat.html]` ; Chrome `C:/Program Files/Google/Chrome/Application/chrome.exe`, 390 × 844,
  tactile ; une ligne par page ; dernière ligne `<NOM> OK (…)` code 0, ou `<NOM> ECHEC n problème(s)`
  puis la liste, code 1. Noms : `UNE-QUESTION`, `ACQUIS`, `SANS-FAMILLE`. En-tête de commentaire :
  numéro (D98 L10, D99 L06, D100 L14), les mots du brasseur, la règle, l'usage, les témoins.
- **Formats de la ligne OK, imposés par les critères** :
  `UNE-QUESTION OK (1 groupe libre : <facteur>)` ; `ACQUIS OK (4/4 : radar, chimie, osu, valeurs)` ;
  `SANS-FAMILLE OK (<n> houblon(s) au-dessus de 50 %, part « autres » visible)` avec n ≥ 1 sur le témoin positif.
- **Ne pas se fier seulement à un balisage** : y1b et y3 n'ont pas de balise « libre ». Un sélecteur
  non balisé (role radiogroup, slider, select, input range, groupe de boutons aria-pressed,
  `data-role="reglage"`…) compte comme libre, rattaché à un facteur d'après ses libellés (noms de
  houblons, g/L, minutes ou jours, noms de levures…). Un contrôle qui passe sur une page sans balise
  est faux. Propose une convention de balisage pour les lots suivants (par exemple `data-libre`,
  `data-contexte`, `data-acquis`, `data-role="autres"`), et documente-la dans l'en-tête et dans
  RESULTAT.md.
- **Témoins positifs** : pages minimales mais réalistes, au style de la base (390 px). Celui de L10
  a un seul groupe libre d'au moins deux options et une ligne de contexte. Celui de L06 a les quatre
  acquis. Celui de L14 montre Nelson Sauvin avec sa part « autres » neutre. Aucun chiffre inventé :
  les valeurs viennent de `pack-fiches.json`, avec la source citée dans la page.
- Joue aussi chaque contrôle, pour information, sur v1, w2 et l5f, et note le résultat dans
  RESULTAT.md : il aide le pilote à juger s'il est trop strict ou trop lâche.

## Exigences transversales et acquis (recopiés, leçons L05 et L06)
- Honnêteté des données : source citée, simulé marqué, inconnu ≠ 0.
- Penser en brasseur (L04) : α, rôle, arômes en couleur, moment et dose avant l'IBU.
- Acquis : code couleur des arômes ; radars m4 et h4 sans légende écrite ; Comparer variante 3
  (barres et radar) ; panel OSU de y3 ; manière de w2 ; vraies valeurs de v1 ; y1b pour le « quand ».
- La part « autres » n'est ni hachurée (le hachuré veut dire « inconnu ») ni aux couleurs d'arôme.

## Critères
Dans `GATES.md`, même dossier. Ne pas le modifier. Lancer chaque `CHECK:` depuis la racine du dépôt.

## Rendre
`RESULTAT.md` au format de l'agent, avec : la convention de balisage proposée, les résultats sur
v1, w2 et l5f, et `DÉCISION À PRENDRE` pour tout seuil que tu as dû fixer. Réponse finale au pilote :
une ligne.
