# L'entonnoir : un lot que le brasseur verra

Un lot de maquettes, de fils de fer ou de pictos s'ouvre large, puis se resserre :
- un vaste panel de concepts minimalistes, plus nombreux et plus divers : 48 au moins (60 visés) en 6 séries, dans
  trois chaleurs, la baseline toujours suivie ;
- un classement ;
- 5 candidates, enrichies de greffes prises partout, même dans les variantes les plus extravagantes ;
- des passes v2, v3… jusqu'à un résultat satisfaisant ;
- puis tout est montré.

Contrôlé par `systeme.mjs mission` (M13).

## Pourquoi

| | Lot 21 (20.10, dry hop) | Lot 22 (22.10, Comparer) |
|---|---|---|
| v0 | 44 variantes (41 jugées), 10 séries, 10 agents (3 à 6 variantes chacun) | 12 variantes, 12 agents (une chacun) |
| Brief v0 | « Obligatoire, et rien d'autre » : honnêteté, doigt, interdits | 7 obligations dès la v0 (D98, D99, 80 mots…) |
| Tri | critique par série, puis SYNTHESE : 5 candidates, une par question, greffes, retouches communes | ACCEPT / REJET et étoiles |
| Amélioration | passe 2 par les mêmes auteurs, 3 relances ciblées, passe 3 légère | aucune |
| Retour | « y1b est de mon point de vue semble meilleur », plus des avis précis sur y3, w2, v1, x3b, a2b et l5f | « r6a est le meilleur mais reprendre trop peu d'éléments que j'avais noté bon ou intéressant des autres variante » |

- Ce que le brasseur avait demandé (lot 21, `fils21-choisir/JURY.md`) : « Plus de mini maquettes que juste 11, fait
  en qqch comme 30 et prends les 5 meilleures version et améliore les ».
- Ce qu'en dit l'utilisateur (22.10) : « la manière de faire pour les mini maquettes dry hopping de base avec les 44
  variante puis les 5 meilleures était vraiment plus qualitatif ».
- Le lot 22 a été réduit à 12 variantes au nom de L18. Or L18 plafonne les agents et les tours, jamais les variantes.

## 0. Cadrer (pilote)
- La question du lot, en une ligne. Les entrées vérifiées avant l'éventail (M07). Les cas communs.
- Un brief commun `BRIEF-AUTEUR.md` dans le dossier du lot, en deux parties :
  - **Obligatoire, et rien d'autre** :
    - **la baseline**, suivie toujours, chaleur et série libre comprises : ses acquis forment une liste à cocher,
      et `controle-commun --sans=mots` passe (pour une planche de pictos, leur grammaire : `controle-pictos-trait`) ;
    - l'honnêteté des données ;
    - l'usage au doigt à 390 px ;
    - les interdits techniques ;
    - la question de l'outil.
  - **Indicatif** : les mots, la mise en page des exemples, les autres contrôles.
- La baseline est un plancher à enrichir, jamais un plafond (L07). On ne s'écarte d'un acquis que si l'idée le vaut
  (« y compris s'écarter de la baseline si l'idée le vaut. Extact »), un acquis à la fois, avec la raison écrite dans
  la NOTE (`--sans=x`). Jamais une page qui « suit rien du tout » (D26, D93).
- Le brief part de la question du brasseur et du geste. La grille du moteur est une matière, pas un cadre.

## 1. v0 — l'éventail : 60 concepts minimalistes visés, 48 au moins, en 6 séries au moins, un concepteur par série
- **Des concepts minimalistes** (« plus minimaliste des les concepts de base mais plus nombreux et diverse ») :
  - un concept par mini fil de fer, réduit à l'essentiel : la représentation qui répond à la question, le geste,
    une vraie valeur ;
  - des pages statiques, avec les vrais mots et les vrais chiffres, dans le vocabulaire de la baseline ;
  - on ose la couleur et la forme (pas de gris à un seul accent), sans le générateur complet ;
  - environ 5 tours par concept, ce qui permet d'en multiplier le nombre ([[fil-de-fer-d-abord]]).
  Le reste (fidélité, blocs secondaires, tous les acquis) vient en passes 2, 3…
- **4 à 12 concepts par série**, 8 à 10 en moyenne, toutes différentes entre elles et pas déclinées les unes des autres.
  Une série par approche. Chaque VOIE.md liste les approches des autres séries : au lot 21, quatre idées (duel, trois
  plans, frise, phrase) ont été faites dix fois.
- **Deux axes de diversité : l'approche, qui change d'une série à l'autre, et la chaleur, qui change à l'intérieur
  d'une série** (D22 : « 4 tiède, 5 chaude, 2 froide ») :
  - une variante **froide** reprend les idées déjà retenues (acquis, choix du brasseur) et les affine ;
  - une variante **tiède** suit une forme imposée par l'approche de la série ;
  - une variante **chaude** a une forme libre.
  Chaque série en porte en général les trois. Le lot a au moins 30 % de chaudes, et chaque variante écrit sa chaleur
  dans sa NOTE. **Toutes suivent la baseline**, les chaudes comprises : la chaleur porte sur la forme, pas sur les
  acquis.
- Les approches qui ont porté au lot 21, à adapter à la question :
  - le geste d'abord (y, la meilleure série : « son brief partait du geste ») ;
  - la réponse d'abord (w) ;
  - les vraies valeurs d'abord (v) ;
  - le simulateur (s) ;
  - des représentations distinctes (r) ;
  - des températures tiède, chaude ou froide (x, D22) ;
  - l'échelle de comparaison (e).
- Deux contrepoids obligatoires :
  - une série **créative à fond en Fable** (z) ;
  - une série **libre, au brief minimal** (u), qui suit la baseline comme les autres : au lot 21, les pages u sans les
    acquis ont dû être montrées avec la mention « série libre, sans la baseline ».
- Les autres contrôles du lot sont joués une fois, et leurs sorties sont recopiées dans la NOTE, sans chercher à les
  faire passer. En v0, seules pèsent lourd une faute d'honnêteté et une page qui ne suit pas la baseline.
- Chaque variante rend :
  - `etat.html` et son générateur ;
  - une `NOTE.md` : ce qui tient, ce qui casse, les sorties des contrôles ;
  - des captures : premier écran, page entière, chaque état qui compte ;
  - `geste-<v>.json` si elle a un geste (valeurs avant, pendant et après le geste).
- Le pilote note dans MISSION.md, section « Agents », l'identifiant de l'agent de chaque série : c'est lui qui fera
  la passe 2.

## 2. Tri — un critique, repris à chaque série
- Le critique est un agent Fable unique. Le pilote le relance par `SendMessage` à chaque série rendue, si bien qu'il
  garde tout le lot en tête.
- Il écrit `critique/<série>.md` : il joue un geste par page, ouvre les captures et lit les NOTE.
- Il écrit ensuite `critique/SYNTHESE.md`, avec trois sections que le GATES du tri vérifie
  (`systeme.mjs note … --contient "## Classement,## Candidates,## Greffes"`) :
  1. **`## Classement`** : toutes les variantes, de la meilleure à la moins bonne, chacune avec une ligne de
     raison. L'utilisateur le demande (« faire un vaste panel et ensuite ranking ») ; non étalonné (L27), c'est une
     proposition : rien n'est caché, et le brasseur voit tout le panel.
  2. **`## Candidates`** : les 5 à améliorer, prises en tête du classement mais une par question ou par approche, et
     dans plusieurs chaleurs (pas seulement des froides). Quand deux pages disent la même chose, il garde la
     meilleure, et la place revient à une autre approche. Pour chacune : 3 retouches concrètes et vérifiables.
  3. **`## Greffes`** : les bonnes idées à prendre partout, **même dans les variantes les plus extravagantes** et en
     bas du classement (« prendre et coller les bonnes idées même les plus extravagantes »). Chaque greffe cite
     l'idée, son id d'origine et la candidate qui la reçoit.
  Puis les retouches communes au lot, les relances ciblées et les fusions. Une page qui ne suit pas la baseline est
  signalée avant tout le reste.
- Au tri, aucun REJET : le classement ordonne, il n'écarte rien.
- Pendant ce temps, le pilote rejoue les contrôles (indicatifs), regarde les captures et peut corriger le tri au nom
  de la diversité.

## 3. Passes 2, 3… — améliorer jusqu'à un résultat satisfaisant
- **Passe 2** : `SendMessage` à l'agent de la série, qui a encore son contexte. Il applique les retouches, les
  greffes et les retouches communes, dans un nouveau dossier `<v>b`.
- **Tous les contrôles du lot deviennent obligatoires** : commun, une question (D98), acquis (D99), mots, et
  reprise (D104) s'il y a des éléments notés.
- Les relances ciblées partent avec un nouvel agent.
- **Après chaque passe, le critique reclasse et regreffe.** Il classe les améliorées entre elles, prend de nouvelles
  greffes (y compris dans les v0) et rend son verdict : des défauts vérifiables, chacun avec la règle qu'il
  enfreint. Un REJET est relancé ou écarté (M12). Puis passe 3 (`<v>c`), passe 4…
- **On s'arrête** dès que l'une de ces conditions est atteinte :
  - **satisfaisant** : tous les contrôles passent, aucun REJET, et la phrase prédite du brasseur est positive
    pour chaque candidate ;
  - **plus de gain** : le critique ne voit plus de progrès d'une passe à la suivante ;
  - **plafond de coût** : quatre passes, puis on montre et on attend son retour.
  Chaque passe est publiée sur la page du lot, sans attendre (L24). Le retour du brasseur relance la boucle
  (`reprise`, puis v suivante).

## 4. Montrer, sans attendre
- La page du lot montre la dernière passe d'abord, dans l'ordre des questions, puis **toutes les v0**, dans l'ordre
  du classement. Le brasseur choisit : « pourquoi j'ai pas eu mes variations ? ».
- La page passe `verifier-page.mjs` (PAGE OK) et son lien est écrit dans MISSION.md (M12).
- Le lot suivant peut se préparer sans attendre la réponse (L24).

## 5. Après son choix — la reprise
- La variante choisie (« <id> choisie : ses mots » dans MISSION.md), plus les éléments qu'il a notés ailleurs
  (`elements-notes.json`, D104).
- Ses verdicts nourrissent l'étalonnage du critique (L27).
- Un micro-correctif sur un écran choisi est aussi une `reprise`.

## Planche de picto
- Même entonnoir :
  - v0 : 6 séries au moins, de 8 propositions ou plus (48 au moins), chacune avec ses genres (par exemple l'objet
    vu autrement, la sensation, le signe, la métaphore, une série en Fable, une série libre), dans les trois
    chaleurs ;
  - tri : un classement, puis des candidates venant d'au moins 3 séries, et des greffes ;
  - passes 2, 3… : sur de vraies cartes, à 12, 16 et 24 px.
- D101 ter se joue sur la planche assemblée.

## Coût
- **Lot 22** : 12 agents Opus pour 12 variantes, sans passe d'amélioration.
- **Entonnoir** :
  - 6 à 8 agents de série pour 48 à 60 concepts minimalistes ;
  - un seul critique, repris à chaque série ;
  - 5 reprises par `SendMessage`, dont le contexte est en cache.
- Les deux coûtent à peu près pareil, mais l'entonnoir donne trois fois plus de choix, et une amélioration.
- Ce qui coûte sans servir : un agent par variante, des briefs qui recopient tout, un pilote qui lit les sorties
  brutes.
- Noter l'usage (`get_usage`) avant et après chaque étape, dans la section Budget de MISSION.md.

## Dans MISSION.md
La table des voies a une colonne **Étape**, avec ces valeurs : `v0 ×N (a tiède, b chaude, c froide)`, `tri`,
`passe 2`, `passe 3`, `passe 4`, `reprise` ou `—`. La colonne Contrôles d'une série v0 nomme sa baseline, par exemple
`baseline : controle-commun --sans=mots`.

`systeme.mjs mission` vérifie, sur les voies pas encore finies :
- chaque voie montrée au brasseur a pour étape `v0`, `passe` ou `reprise` ;
- une série porte de 4 à 12 concepts, déclare sa chaleur et nomme sa baseline dans ses contrôles ;
- chaque tri a les trois chaleurs, avec au moins 30 % de chaudes ;
- chaque série dépend d'une voie `tri`, confiée au critique ;
- chaque tri porte sur 48 variantes au moins, en 6 séries au moins, et une `passe 2` en dépend ;
- une `reprise` suppose une ligne « <id> choisie : ».
