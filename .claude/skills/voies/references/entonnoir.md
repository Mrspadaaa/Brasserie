# L'entonnoir : un lot que le brasseur verra

Un lot de maquettes, de fils de fer ou de pictos s'ouvre large et libre, puis se resserre : environ
40 variantes v0 en séries, 5 candidates choisies pour leur diversité, améliorées par leurs auteurs,
puis tout est montré. Contrôlé par `systeme.mjs mission` (M13).

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
  - **Obligatoire, et rien d'autre** : l'honnêteté des données, l'usage au doigt à 390 px, les interdits techniques
    et la question de l'outil ;
  - **Indicatif** : tout le reste (la baseline, les acquis, les contrôles, les exemples).
- Les acquis forment une liste à cocher, pas une mise en page à copier. La baseline est un plancher à enrichir (L07).
- Le brief part de la question du brasseur et du geste. La grille du moteur est une matière, pas un cadre.

## 1. v0 — l'éventail : 30 variantes au moins, un concepteur par série
- **3 à 8 variantes par série**, toutes différentes entre elles et pas déclinées les unes des autres. Une série par
  approche. Chaque VOIE.md liste les approches des autres séries : au lot 21, quatre idées (duel, trois plans,
  frise, phrase) ont été faites dix fois.
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
  - une série **libre, au brief minimal** (u).
- Les contrôles du lot sont joués une fois, et leurs sorties sont recopiées dans la NOTE, sans chercher à les faire
  passer. Seule une faute d'honnêteté pèse lourd en v0.
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
- Il écrit ensuite `critique/SYNTHESE.md` :
  1. **5 candidates, une par question ou par approche.** C'est la diversité utile : quand deux pages disent la même
     chose, il garde la meilleure, et la place libérée revient à une autre approche.
  2. Pour chaque candidate : **3 retouches** concrètes et vérifiables, et ses **greffes** (les idées à prendre dans
     d'autres variantes, citées par id).
  3. Les retouches communes au lot, les relances ciblées et les fusions.
- Au tri, il n'écrit **ni REJET ni étoile** : non étalonné (L27), il propose quoi affiner et ne cache rien.
- Pendant ce temps, le pilote rejoue les contrôles (indicatifs), regarde les captures et peut corriger le tri au nom
  de la diversité.

## 3. Passe 2 — les mêmes auteurs
- `SendMessage` à l'agent de la série, qui a encore son contexte. Il applique les retouches, les greffes et les
  retouches communes, dans un nouveau dossier `<v>b`.
- **Tous les contrôles du lot deviennent obligatoires** : commun, une question (D98), acquis (D99), mots, et
  reprise (D104) s'il y a des éléments notés.
- Les relances ciblées partent avec un nouvel agent.
- Le critique rend ensuite son verdict : des défauts vérifiables, chacun avec la règle qu'il enfreint. Un REJET est
  relancé ou écarté (M12). Une passe 3 légère s'il le faut.

## 4. Montrer, sans attendre
- La page du lot montre les améliorées d'abord, dans l'ordre des questions, puis **toutes les v0** rangées par
  question. Le brasseur choisit : « pourquoi j'ai pas eu mes variations ? ».
- La page passe `verifier-page.mjs` (PAGE OK) et son lien est écrit dans MISSION.md (M12).
- Le lot suivant peut se préparer sans attendre la réponse (L24).

## 5. Après son choix — la reprise
- La variante choisie (« <id> choisie : ses mots » dans MISSION.md), plus les éléments qu'il a notés ailleurs
  (`elements-notes.json`, D104).
- Ses verdicts nourrissent l'étalonnage du critique (L27).
- Un micro-correctif sur un écran choisi est aussi une `reprise`.

## Planche de picto
- Même entonnoir :
  - v0 : 4 séries de 8 propositions au moins, chacune avec ses genres (l'objet vu autrement, la sensation, le
    signe, une série libre en Fable) ;
  - tri : 6 candidates venant d'au moins 3 séries ;
  - passe 2 : sur de vraies cartes, à 12, 16 et 24 px.
- D101 ter se joue sur la planche assemblée.

## Coût
- **Lot 22** : 12 agents Opus pour 12 variantes, sans passe d'amélioration.
- **Entonnoir** :
  - 6 à 8 agents de série pour 30 à 40 variantes ;
  - un seul critique, repris à chaque série ;
  - 5 reprises par `SendMessage`, dont le contexte est en cache.
- Les deux coûtent à peu près pareil, mais l'entonnoir donne trois fois plus de choix, et une amélioration.
- Ce qui coûte sans servir : un agent par variante, des briefs qui recopient tout, un pilote qui lit les sorties
  brutes.
- Noter l'usage (`get_usage`) avant et après chaque étape, dans la section Budget de MISSION.md.

## Dans MISSION.md
La table des voies a une colonne **Étape**, avec ces valeurs : `v0 ×N`, `tri`, `passe 2`, `passe 3`, `reprise` ou `—`.

`systeme.mjs mission` vérifie, sur les voies pas encore finies :
- chaque voie montrée au brasseur a pour étape `v0`, `passe` ou `reprise` ;
- une série porte de 3 à 8 variantes ;
- chaque série dépend d'une voie `tri`, confiée au critique ;
- chaque tri porte sur 30 variantes au moins, et une `passe 2` en dépend ;
- une `reprise` suppose une ligne « <id> choisie : ».
