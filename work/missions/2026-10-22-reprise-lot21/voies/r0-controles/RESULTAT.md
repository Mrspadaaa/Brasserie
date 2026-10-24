OK — trois contrôles au rendu (UNE-QUESTION, ACQUIS, SANS-FAMILLE), huit critères tenus, témoins positifs sourcés

## Fichiers écrits
- `work/refonte-frontend/v4/tournoi/outils/controle-une-question.mjs` (D98, L10)
- `work/refonte-frontend/v4/tournoi/outils/controle-acquis.mjs` (D99, L06)
- `work/refonte-frontend/v4/tournoi/outils/controle-sans-famille.mjs` (D100, L14)
- `work/refonte-frontend/v4/tournoi/outils/temoins/une-question-ok/etat.html`
- `work/refonte-frontend/v4/tournoi/outils/temoins/acquis-ok/etat.html`
- `work/refonte-frontend/v4/tournoi/outils/temoins/sans-famille-ok/etat.html`
- ce fichier.
Rien d'autre dans le dépôt (`git status` relu). Les pages témoins ont été générées par un script laissé hors dépôt (scratchpad) ; leurs valeurs viennent de `pack-fiches.json`, `composes-houblon.json` et `comparatifs-dryhop.json`, source citée dans la page.

## Sortie décisive de chaque critère (CHECK rejoués depuis la racine)
- G1 y1b : `ECHOUE OK (UNE-QUESTION ECHEC, code 1)` — 4 facteurs libres (houblon, dose, moment, levure), pas de [data-libre], pas de contexte.
- G2 y3 : `ECHOUE OK (UNE-QUESTION ECHEC, code 1)` — idem (dose, houblon, moment, levure).
- G3 : `UNE-QUESTION OK (1 groupe libre : houblon)`
- G4 y3 : `ECHOUE OK (ACQUIS ECHEC, code 1)` — « radar : absent » ; chimie, osu, valeurs présents mais non balisés.
- G5 y1b : `ECHOUE OK (ACQUIS ECHEC, code 1)` — 0/4 au repos.
- G6 : `ACQUIS OK (4/4 : radar, chimie, osu, valeurs)`
- G7 l5f : `ECHOUE OK (SANS-FAMILLE ECHEC, code 1)` — Nelson Sauvin 83 % (10 mots sur 12) et Hallertau Blanc 67 % sans part « autres ».
- G8 : `SANS-FAMILLE OK (2 houblon(s) au-dessus de 50 %, part « autres » visible)` (Nelson Sauvin, Hallertau Blanc).

Essais : 1 par critère à l'arrivée des contrôles ; 3 corrections de mes propres contrôles en cours de route (chemin de pack-fiches, titre d'une seule question, libellé « Moment de Citra »), sans critère en échec ensuite.

## Preuve que les contrôles ne se laissent pas tromper
- 27 mutations des témoins positifs rejouées (script hors dépôt) : toutes jugées comme attendu, 0 mal jugée. Échecs obtenus notamment avec : [data-libre] retiré, ligne de contexte retirée, titre sans « ? », groupe de dose libre ajouté (balisé ou non, y compris balisé à tort « houblon »), facteur libre repris dans le contexte, bouton dans le contexte, contexte menteur (« 4 g/L » déclaré moment) ; radar sans balise, une seule série, radar non balisé, chimie sans pictos, osu simulé, valeurs sans source ou sans unité ; part « autres » hachurée, orange (code des arômes), bleue, sans fond, minuscule, sans balise, data-part gonflée.
- Captures des trois témoins prises à 390 px et ouvertes (L12). Défaut vu et corrigé : les trois fiches de houblon s'affichaient ensemble (`[hidden]` écrasé par `display:flex`).

## Résultats pour information (v1, w2, l5f)
| page | UNE-QUESTION | ACQUIS | SANS-FAMILLE |
|---|---|---|---|
| v1 | ECHEC : 5 facteurs libres (houblon, dose, moment, levure, « inconnu » = les 12 familles-boutons) | ECHEC 0/4 : pas de radar ; chimie, osu, valeurs présents non balisés | ECHEC : Nelson Sauvin 83 % (cité dans la ligne en bière) sans part « autres » |
| w2 | ECHEC : titre « Trois plans » sans « ? », 5 facteurs libres | ECHEC 0/4 : ni radar, ni chimie, ni osu ; valeurs non balisées | OK, 0 houblon au-dessus de 50 % (« rien à montrer ») |
| l5f (etat-b.html) | ECHEC : pas de titre, onglets Ma bière / Suggestions / Comparer lus comme réglages, 4 facteurs | ECHEC 0/4 : pas de radar ; chimie non balisée | ECHEC : Nelson Sauvin 83 %, Hallertau Blanc 67 % |

Lecture : le contrôle n'est pas trop lâche (aucun témoin négatif ne passe). Il n'est pas trop strict pour les outils : le témoin positif tient en une page de 390 px. Il est strict avec les écrans « d'ensemble » (l5f, w2) qui ne sont pas des outils à une question : ne pas les lui soumettre.

## Convention de balisage proposée (à imposer aux lots suivants)
- Un outil (écran à une question) :
  - `<h1>` ou `[data-role="titre"]` : le titre se termine par « ? ».
  - `data-libre="<facteur>"` sur le conteneur du seul groupe de sélecteurs libres ; facteur ∈ houblon | dose | moment | levure | base ; deux options au moins (ou un curseur / select).
  - `data-role="contexte"` sur la ligne de contexte, avec un `data-contexte="<facteur>"` par facteur fixé (deux au moins, jamais le facteur libre, texte non vide, aucun contrôle dedans).
  - `data-lecture` sur un groupe qui ne change que l'affichage (au style / absolu), exclu du compte.
- Comparer : `data-acquis="radar|chimie|osu|valeurs"` sur le conteneur de chaque acquis ; `data-compose="<composé>"` sur chaque ligne de chimie (picto `svg[data-famille]` dedans, sauf « huile ») ; radar au contrat de `controle-radar.mjs` (`svg[data-radar]`, `data-axes`, `[data-serie]` + `data-valeurs`) ; panel OSU et valeurs : `data-nature="mesure"` + `data-source`.
- Houblon à forte part sans famille : `data-houblon="<nom>"` sur la carte ou la fiche ; `data-role="autres"` sur la forme (fond plein gris, 24 × 6 px, nommée, ni hachurée ni aux couleurs d'arôme) ; `data-part` facultatif.
- Le contrôle ne se fie pas au seul balisage : les sélecteurs libres sont détectés par leur nature et leurs libellés ; tout sélecteur libre hors `[data-libre]`, ou dont le facteur détecté diffère du facteur déclaré, échoue. Un acquis présent mais non balisé échoue aussi.

## DÉCISION À PRENDRE (seuils que j'ai dû fixer)
1. Un réglage dans la ligne de contexte compte comme facteur libre (strict). Le conseil écrit pourtant « la dose reste en contexte, réglable d'un toucher » pour Dryhopper. Options : (a) garder strict (la dose réglable devient un second facteur libre, donc interdite) ; (b) admettre dans le contexte un seul bouton d'édition par facteur, à ouvrir en feuille. Recommandation : (a) au lot 22 (Comparer seul n'a pas ce cas) ; trancher (b) avant Dryhopper.
2. Contexte : deux facteurs fixés déclarés au minimum, pas les trois autres. Raison : Suggérer ou Comparer n'ont peut-être pas besoin des quatre. Recommandation : garder deux ; passer à « tous les facteurs hors libre » si le brasseur confond encore.
3. Seuil SANS-FAMILLE : plus de 50 % (mots rattachés + sans famille de `pack-fiches.json`, mots génériques non exclus du calcul). Une part « autres » est exigée en forme dessinée de 24 × 6 px au moins, grise (écart entre canaux ≤ 30). Ces deux valeurs sont à moi. La liste des mots génériques et le plafond de la part (option B de [[descripteurs-hors-familles]]) restent au brasseur : le contrôle accepte une part réelle ou plafonnée (`data-part` ≤ part réelle + 0,10).
4. Seuils ACQUIS : radar 150 px de large et 2 séries ; chimie 3 composés dont 2 rattachés à une famille ; panel OSU : graphique de 120 px et 3 formes ; valeurs : 3 mesures sourcées avec unité. Recommandation : garder.

## Doutes et limites
- Seuls les éléments visibles au repos comptent (les `<details>` sont ouverts) : un réglage caché derrière un toucher échappe à UNE-QUESTION, et les acquis cachés derrière un toucher (y1b : « Preuve ») comptent comme absents. Honnête pour y1b ; à relâcher si le brasseur veut un acquis « à un toucher » (ajouter une ouverture avant mesure).
- La détection des facteurs repose sur des libellés (noms de houblons du pack, g/L, ′, jours, levures). Une levure ou un houblon absent de ces listes passe en facteur « inconnu » (compté, donc visible), pas en silence.
- La base du témoin (stout 16 °P, 4 g/L, après fermentation 3 j, US-05) est le cas du lot 21 ; ce sont des réglages de scénario, pas des mesures. Idaho 7, 4MMP « < 10 » : à confirmer (source), dit dans la page.
- Le témoin SANS-FAMILLE affiche la part réelle (83 %) ; le plafonnement n'est pas dessiné.
- Hors du périmètre : brancher ces contrôles dans `controle-lot.mjs` / `controle-commun` (au pilote).

CONNAISSANCE : la part sans famille d'un houblon se calcule sur `pack-fiches.json` (mots de `motsSansFamille` / (mots de `aromes[].mots` + mots sans famille)) ; Hallertau Blanc (67 %) est le second houblon du pack au-dessus de 50 % après Nelson Sauvin (83 %), avec Marco Polo, Ultra (67 %) et Pahto (60 %). À ajouter à [[descripteurs-hors-familles]] : le test de L14 ne vise pas que Nelson Sauvin.

LEÇON PROPOSÉE : aucune
