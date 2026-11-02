OK — page de choix D312 : total corrigé et 3e lecture jamais arrivée, 2 × 4 options sur D

L3-CAS OK — 6 options — choix-cas-38/index.html

Voie l3-cas, 02.11, agent concepteur (Opus). Je n'ai touché ni au code de l'app ni aux données réelles. Aucun appel Gemini, aucun commit,
aucun serveur Vite. J'ai écrit seulement dans `choix-cas-38/`, plus deux captures de relecture dans le scratchpad de la session. J'ai chargé
`boosters-ux`, pas `impeccable` : la forme de la page est celle de `choix-lignes-38` et `choix-lenteur`, déjà acceptées. `VERDICT-l2-lignes.md`
n'existait pas à mon arrivée. J'ai repris les retouches de `VERDICT-c-lenteur.md` qui valent ici :
- l'avis porte sa raison et sa limite ;
- aucun texte de la page sous 14 px ;
- aucun cadre bleu neuf (seuls restent ceux de ses maquettes) ;
- aucune valeur de ses pièces.

## La base (règle n° 1)
`outils/gen.mjs` reprend le socle de `choix-lignes-38` (lui-même celui de `choix-lenteur`) : CSS, icônes, en-tête, à 700 px, la hauteur de ses
maquettes. Sa fonction `ecran()` écrit ses deux maquettes :
- `ecran()` rend `d-lue.html` octet pour octet ;
- `ecran({ prov: true })` rend `d-15.html` octet pour octet.

Rien de sa maquette n'a changé : fil, « Lectures ●●◌ », Confirmer gris avec sa roue, puce « ↻ N corrigées », fond bleu et ancienne valeur
barrée. On reste en vue Catégorie, sans les sous-groupes de D307.

`controle-choix` est sans objet : l'écran Dépense n'est pas dans `work/refonte-frontend/v4/choix/ecrans.json`
(`grep -ci "depense\|dépense"` → 0). La base vient de son choix D308 (d-lue, d-15).

## Les options
Les données sont fictives (Brauhaus Ouest, 21.10.2026) et les sommes tombent juste.

**Question 1 : le total corrigé.** Les lectures rapides lisent 46,40 ; la 3e lit 48,00. La ligne qui l'explique est le Malt de Munich : 4 Kg ×
1,80 = 7,20 lu vite, 4 Kg × 2,20 = 8,80 lu lentement, soit +1,60. Malts passe à 25,70. La rangée Munich est corrigée dans la langue de
d-lue : prix et montant en bleu, « 4 Kg × 1,80 · 7,20 » barré sous le nom. Le total compte une fois dans la puce, qui passe de « ↻ 3 » à
« ↻ 5 corrigées » (Munich et le total). « Somme = imprimé » vaut 48,00. Les options ne diffèrent que par la marque sur le total :
- A (référence, mon avis) : 48,00 sur fond bleu, 46,40 barré à côté de CHF ;
- B : le total sans fond ; à côté, « ↻ +1,60 » en bleu ;
- C : le total en bleu, souligné d'un pointillé bleu, comme les champs du haut d'aujourd'hui (pointillé jaune quand il faut contrôler,
  `Recap.tsx`) ; sans l'ancienne valeur ;
- D : rien sur le total ; seule la puce le compte. C'est la plus discrète.
- Vue sombre : A.

**Question 2 : la 3e lecture n'arrive jamais.** L'avant est commun aux quatre, montré une fois : c'est d-15, sa maquette, au pixel. Après, les
valeurs rapides restent avec leurs drapeaux (« 3 à remplir », 15 Kg, 30 ?, 50 ?), et Confirmer redevient noir (le même HTML que dans d-lue).
- A (référence) : l'app d'aujourd'hui après une 3.8 coupée, redessinée en reprise 1 (voir plus bas). Le fil part ; la rangée affiche
  « · Lectures 2 lectures », neutre ; la chip « ① Lecture coupée » est en pointillé jaune ; « 7 lignes » est en pointillé jaune. La phrase
  s'ouvre au toucher du point.
- B : le fil part ; les trois points restent, le troisième devient une croix jaune « ●●× ». Aucun mot.
- C : le fil reste, figé en jaune, avec « non vérifiée » ; la rangée dit « 2/3 ».
- D (mon avis) : le fil part ; une puce jaune « non vérifiée » prend la place de « ↻ N corrigées » ; la rangée dit « 2/3 ». Un toucher sur la
  puce dirait la phrase (non dessiné).
- Vue sombre : D.

## Contrôles et sorties
1. `controle-page-choix.mjs … --min=3` :
   - `total-corrige : OK (3 variantes, 4 par rangée à 1280, 2 à 390)` ;
   - `lecture-jamais : OK (3 variantes, 4 par rangée à 1280, 2 à 390)` ;
   - `PAGE-CHOIX OK (2 choix)`.
2. `verifier-page.mjs … --page-lot --captures …/choix-cas-38/controle` → `PAGE OK (11 images chargées, lisible à 390 et 1280 px, sans erreur)`.
   Le premier passage avait échoué sur deux blocs de 46 mots (l'avis et le sous-titre de la question 1). Je les ai raccourcis, puis rejoué.
3. Mesure de A (L03) :
   - `node …/outils/gen.mjs --identite` → `d-lue : IDENTITE OK (15347 octets, HAUT=700)` et `d-15 : IDENTITE OK (15254 octets, HAUT=700)`.
   - `node …/outils/mesure-a.mjs` → `MESURE-A OK`. Il compare élément par élément (en-tête, fil, bandeau, cases de la preuve, puces, TVA,
     bandes, rangées, pied), chacun recadré à sa propre boîte ; un élément qui a seulement bougé reste donc comparable. Les cases de la
     preuve sont comparées sans leurs 4 px du bas, où déborde le cadre bleu de « Lectures ●●◌ » dans d-15. Il échoue si un élément hors du
     cas diffère (il l'a fait au premier passage, sur ce débord).
   - q1-a contre d-lue : seuls diffèrent, et ils sont nommés :
     - le total et « 7 lignes » (12 650 px) ;
     - la barre (672 px) ;
     - « Somme = imprimé » (46,40 → 48,00) ;
     - la puce (3 → 5 corrigées) ;
     - la bande Malts (24,10 → 25,70) ;
     - la rangée Malt de Munich (28 → 40 px de haut).
     Les 21 autres éléments sont identiques ; ceux qui sont sous Munich sont décalés de 12 px.
   - q2-avant contre d-15 : 27 éléments sur 27 identiques ; image entière contre `img/d-15.png` : identique.
   - q2-a contre d-15 : diffèrent seulement, et ils sont nommés :
     - le fil (parti) ;
     - la rangée Lectures (●●◌ → « · Lectures 2 lectures ») ;
     - la remarque (neuve) ;
     - Confirmer (133 → 124 px, la roue partie).
     Les 23 autres éléments sont identiques, décalés de −22 px (fil parti), puis de +13,2 px (sous la phrase).
4. `controle-choix` : sans objet, voir plus haut.
5. La page dit ce qu'on attend de lui : « Deux choix : réponds par une lettre pour chacun, par exemple « 1 A, 2 D ». » Sans code.

## Captures ouvertes (L12)
- Maquettes : `img/q1-a.png`, `q1-b.png`, `q1-c.png`, `q1-d.png`, `img/q2-a.png`, `q2-b.png`, `q2-c.png`, `q2-d.png`, `img/q1-a-sombre.png`,
  `q2-d-sombre.png`. `q2-avant.png` n'a pas été ouverte à part : je l'ai vue dans la page, et la mesure la trouve identique à `d-15.png`.
- Page : `controle-haut.png`, `controle-ordinateur.png` ; la section 2 à 390 et à 1280 px (scratchpad, `q2-390.png`, `q2-1280.png`).

## Boosters UX (boosters-ux)
- La puce « ↻ N corrigées » sert à suivre les corrections. En question 1, elle compte le total une fois, dans toutes les options. En 2 D,
  « non vérifiée » prend sa place : même famille, même endroit.
- « Somme = imprimé » sert à vérifier : à 48,00, c'est le chiffre qui donne raison à la 3e lecture (B8, honnête).
- B2 : une seule action noire (Confirmer) dans chaque vue. B3 : aucun paragraphe neuf. La seule phrase est celle de production, en A, qui
  est la référence. Les options ajoutent deux mots au plus (« non vérifiée ») ou un signe (« +1,60 », « × »). B6 : chiffres en IBM Plex Mono.

## Doutes
- Q2 A : « lectures » est en mono, comme dans l'app. L'icône de « 7 lignes » suit l'app depuis la reprise 2.
- Q2 B : même à 14 px, la croix peut être lue comme une erreur grave.
- Q2 C : un fil figé peut se lire comme « ça tourne encore ». Seuls le jaune et l'absence de roue disent le contraire.
- Q2 D : « non vérifiée » ne dit pas combien de valeurs n'ont pas été revues. La phrase au toucher n'est pas dessinée.
- Q1 D : la puce dit 5, mais seules 4 rangées montrent du bleu ; il ne trouvera pas la 5e.
- Les cadres bleus de ses maquettes (fil, Lectures, Confirmer, puce) restent sans légende sur la page, comme dans choix-lenteur (mineur de
  e-t11). Les enlever aurait cassé le pixel de la référence.

## Prédiction
« 1 A, logique, c'est comme les lignes. Pour la 2, D ou A ; la croix B je la vois pas, et le fil qui reste C on dirait que ça charge encore. »

DÉCISION À PRENDRE : aucune. Par défaut (D312), la voie E code A pour les deux questions ; elle suivra son choix s'il en prend un autre.

CONNAISSANCE : aucune.

LEÇON PROPOSÉE : pour mesurer une référence « au pixel hors du cas », comparer élément par élément, chacun recadré à sa boîte (nom et texte
en clé), plutôt que par bandes de lignes décalées. Un élément du cas qui ajoute ou retire de la hauteur (fil parti, phrase ajoutée) ne casse
plus la comparaison du reste. Il faut pourtant rogner les débords d'`outline` d'un voisin, ou les nommer.

## Reprise 1 (02.11, verdict e-t14, `critique/VERDICT-l3-cas.md`)
**Majeur levé : Q2 A est l'app telle qu'elle est aujourd'hui.** Je l'ai lue dans le code :
- `ExpenseSheet.tsx` l. 970 : un point de lecture qui pèse donne la rangée `{ok:false, texte:'Lectures', valeur:'2 lectures'}`. `Preuve` la rend
  « · », avec une valeur en `text-cave-50`, neutre.
- `ExpenseSheet.tsx` l. 692 : `remarques` retire toute phrase qui est le message d'un point. La phrase n'est donc pas à l'écran : elle est
  derrière la chip.
- `ChipsBar` (`Verdict.tsx`) affiche « ① Lecture coupée » : pointillé `attention`, fond `attention/5`, rond de 18 px pointillé, 14 px. Dans la
  maquette, elle suit « 3 à remplir » et passe à la ligne (la rangée est en `flex-wrap`, comme dans l'app).
- `confiance.ts` l. 282 : les lignes passent au niveau « repris », d'où « 7 lignes » en pointillé jaune (`Bandeau`, `border-dashed border-attention`).
- La tête de A dit maintenant : « La forme d'aujourd'hui : « 2 lectures », le point « Lecture coupée » en jaune ; la phrase au toucher du
  point. » A reste la référence ; il n'y a pas de 5e option.

**Mineurs corrigés.**
- q1-c : le soulignement devient un pointillé de 3 px, décalé de 4 px sous le chiffre (`text-underline-offset`). Il se voit à 390 et ne
  touche plus la barre. La barre n'a pas bougé.
- q2-b : le « · » de la rangée Lectures est revenu, et la croix fait 14 px.
- q2-d : la tête dit « Rien n'est corrigé : à la place de « ↻ N corrigées », une puce jaune « non vérifiée ». »
- Question 2, sous-titre : « 150 s après l'envoi (le temps que l'app attend déjà aujourd'hui) ». C'est `AI_CLIENT_TIMEOUT_MS = 150_000`,
  `functions/src/aiTaskDeadline.ts:27`, mais la page ne le cite pas.

**Rejoué.**
- `gen.mjs --identite` → `d-lue : IDENTITE OK (15347 octets)`, `d-15 : IDENTITE OK (15254 octets)`.
- `mesure-a.mjs` → `MESURE-A OK`. Le bandeau est maintenant mesuré en trois éléments : la rangée, le nombre du total et « 7 lignes ».
  - q2-a contre d-15, seuls diffèrent :
    - le fil (parti) ;
    - la rangée Lectures (●●◌ → « · Lectures 2 lectures ») ;
    - la chip « ① Lecture coupée » (neuve) ;
    - « 7 lignes » (946 px ; le nombre du total reste identique) ;
    - Confirmer (133 → 124 px).

    Tout le reste est identique, dont 11 éléments décalés de −22 px (fil parti) et 13 de +12 px (sous la chip).
  - q1-a et q2-avant sont inchangés (q2-avant = `d-15.png` à l'image entière).
- `controle-page-choix.mjs --min=3` → `total-corrige : OK`, `lecture-jamais : OK`, `PAGE-CHOIX OK (2 choix)`.
- `verifier-page.mjs --page-lot` → `PAGE OK (11 images chargées, lisible à 390 et 1280 px, sans erreur)`.

**Rouvertes (L12).** `img/q2-a.png`, `img/q1-c.png`, `img/q2-b.png`, `img/q2-d.png`, et la section 2 à 1280 px (scratchpad, `q2-1280.png`).

Pour le pilote, d'après le critique :
- 2 C garde le fil, comme le hors ligne de D310 (« réseau » dans son mot). Si le brasseur choisit C, deux états garderont le fil, distingués
  par un mot.
- 1 D est la plus discrète, et il la refusera probablement : le total y change sans marque.

## Reprise 2 (02.11, demande du pilote)
**L'icône de « 7 lignes » en q2-a est maintenant celle de l'app.**
- Dans le code, une 3.8 coupée rend la lecture `disputed` : `ajouterCoupure`, `invoiceVisionReview.ts`. `statutDeLecture` la garde ensuite
  (`invoicePoints.ts`), et `statutAffiche` donne le pire des deux statuts (`etat.ts`).
- `Bandeau` (`Recap.tsx`) rend ce statut par `AlertCircle size 14 text-attention`.
- `text-attention` vaut `--attention-texte` (`tailwind.config.js`, `textColor`) : rgb(127 91 16) en clair, le `--attT` de la maquette.
- q2-a reçoit donc un cercle d'alerte jaune de 14 px, au lieu du rouge de 16 px de sa maquette.

Les autres options ne prennent pas ce bouton dans le même état : seul A montre « 7 lignes » en pointillé jaune. B, C et D le gardent tel que
dans sa maquette. Ma lecture est étroite : la règle s'applique au bouton dans l'état « aujourd'hui ». Si le pilote veut l'icône jaune partout
où la lecture est « à confirmer », il faut changer `lignesIc` dans `q2-b`, `q2-c` et `q2-d` (`outils/gen.mjs`).

**Rejoué.**
- `gen.mjs --identite` → `d-lue : IDENTITE OK`, `d-15 : IDENTITE OK`.
- `mesure-a.mjs` → `MESURE-A OK`. En q2-a, « 7 lignes » passe de 88×28 à 86×28 (icône de 14 px) et la rangée du total diffère de 1 549 px ;
  le nombre du total reste identique. Le reste est inchangé.
- `controle-page-choix.mjs --min=3` → `PAGE-CHOIX OK (2 choix)`.
- `verifier-page.mjs --page-lot` → `PAGE OK (11 images chargées, lisible à 390 et 1280 px, sans erreur)`.
- `img/q2-a.png` rouverte : le cercle d'alerte et le pointillé de « 7 lignes » sont jaunes, comme « ① Lecture coupée ».
