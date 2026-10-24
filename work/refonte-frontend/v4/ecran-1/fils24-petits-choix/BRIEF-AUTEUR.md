# Lot D126 — trois petits choix en entonnoir : la pastille « ~ simulé », le levier levure, l'entrée de l'analyse (24.10, soir)

Méthode : `.claude/skills/voies/references/entonnoir.md` (à lire en entier). Pourquoi ce lot : sur la page « Choix de vues ·
24.10 », le brasseur, mot pour mot : « Mais il y a très peu de mini maquettes ??? J'ai pratiquement aucun choix ?? Et j'ai pas
du coté à cote » (D126). Ces trois choix n'avaient que trois variantes chacun (jeux courts). Ses mots du lot 21 : « Plus de mini
maquettes que juste 11, fait en qqch comme 30 » ; « Il y a pas de limitation, pas de plafond de verre, il faut être créatif,
disrutif, trouver des solutions et des options ». Puis, ce soir : « Pas besoin d'autant, représente moi aussi les mini maquettes déjà faites pour ces vues. Je dirais 11 par vue ». v0 : par question, huit concepts neufs en deux séries de quatre, plus les trois déjà faits : onze par vue, trois chaleurs ;
critique avant de lui montrer ; tout lui est montré, sur une page par question, côte à côte avec sa référence.

## Question P — la pastille « ~ simulé » de Comparer (séries pva, pvz)
- **La question** : « Que veut dire ce nombre ? » — d'un toucher sur la pastille, il comprend que la valeur est calculée par le
  moteur (fiches, dose, moment, levure), pas mesurée dans une bière, et où sont les vraies valeurs. Facteur libre : la façon de
  le dire au toucher ; Comparer, ses houblons et sa stout sont en contexte.
- **Ses mots** : « ????? » (24.10, matin, sur la pastille, D122). Au repos, pas un mot de plus ; la pastille de r6a reste.
- **Plancher** : Comparer rendu (`prototypes/houblons-v4/maquettes/parcours/comparer/etat.html`, joue-le) ; les trois jeux courts
  déjà faits : `work/refonte-frontend/v4/ecran-1/fils24-pastille/{psa,psb,psc}/` et leurs captures (ne les refais pas).

## Question L — le levier levure dans Suggérer (séries lsa, lsz)
- **La question** : « Et si je changeais de levure ? » — ce que le groupe « Changer de levure » de q2b (LalBrew Verdant IPA,
  Pomona, chacune avec sa barre) lui apportait, sans faire de Suggérer un second facteur libre (L10 : Suggérer fait varier le
  houblon) ; Levure est un écran au choix ouvert. Facteur libre : la façon de lui offrir ce levier depuis Suggérer.
- **Ses mots** : q2b est son choix pour Suggérer (« Ça oui, c'est effectivement l'un de mes choix », 23.10) ; D35 : le groupe
  ne revient pas tel quel, il passe en variantes.
- **Plancher** : Suggérer rendu (`prototypes/houblons-v4/maquettes/parcours/suggerer/etat.html`) ; q2b et son groupe levure :
  `work/refonte-frontend/v4/ecran-1/fils15-s5-complexe/q2b/` ; les jeux courts : `work/refonte-frontend/v4/ecran-1/fils24-levure-suggerer/{lva,lvb,lvc}/`.
- **Données** : l'écart de levure se lit par `proposeVoies(…, { leviersLevure: true })` ; Verdant et Diamond ne changent rien
  pour Idaho 7 (inconnu, pas 0), Pomona ~+13 agrumes, confiance faible (`cerveau/metier/moteur-parcours-limites.md`).

## Question A — l'entrée de l'analyse depuis l'étape Houblons (séries ana, anz)
- **La question** : « Où je vois l'analyse de ma bière ? » — sur l'étape, le bloc du profil (l'alerte et les 12 familles) mène à
  l'onglet Ma bière ; l'entrée doit se voir et dire où elle mène. Facteur libre : la forme de cette entrée ; l'étape est en contexte.
- **Ses mots** : « Seul bouton qui ouvre vraiment l'analyse. Peut, être amélioré » (23.10, soir, sur le « › », D121).
- **Plancher** : l'étape rendue (`prototypes/houblons-v4/maquettes/parcours/ma-biere/etat.html`, variante A : tout le bloc
  ouvre l'analyse) ; les trois variantes A, B, C : `work/refonte-frontend/v4/outils/pages/2026-10-24-d121/` (images `img/`).

## Obligatoire, et rien d'autre
- **La baseline**, suivie toujours, chaleur et série libre comprises : pictos de famille au trait (épicé : cannelle et clou
  croisés, `work/refonte-frontend/v4/ecran-1/fils17-standard/v3/planche.html`, symbole `p-spice`), couleurs des familles, α et
  rôle, usage en mot, au style par défaut (l'absolu à un toucher), stock en petit badge, thème blanc de ses maquettes (D106),
  la croix pour sortir (D109). `controle-commun.mjs --sans=mots` passe.
- **Son écran autour, tel qu'il l'a choisi** : chaque concept est posé dans l'écran rendu (Comparer de r6a, Suggérer de q2b,
  l'étape de la base v4.10), copié dans ton dossier ; seul l'élément de la question change (règle n° 1).
- **L'honnêteté** : un nombre simulé dit « ~ » ; l'inconnu n'est jamais zéro (« ? », hachures) ; on n'invente aucune valeur.
- **Au doigt à 390 px**, la question lisible, un seul facteur libre.
- **Interdits** : rien de l'app (`src/`) ni de `prototypes/` ; pages statiques ; classes et scripts préfixés par l'id (L26).

## Indicatif
Les mots (80 au plus au premier écran), la mise en page de ses exemples, les autres contrôles (`controle-une-question.mjs`,
`mots-premier-ecran.mjs --sans-donnees`) : joués une fois, sorties recopiées dans la NOTE.

## Minimaliste, mais plein (M14)
Une seule idée par concept, sur un premier écran rempli comme au lot 21 ; la baseline est un vocabulaire, pas un gabarit ;
ses exemples (les jeux courts, q2b, A/B/C), un tiers du panel au plus. Environ dix tours par concept.

## Les chaleurs (D22)
froide : son choix (r6a, q2b, la base) affiné, rien d'autre ; tiède : une forme imposée par l'approche de la série ; chaude :
une forme libre. Chaque NOTE écrit sa chaleur.

## Chaque concept rend
`<id>/etat.html`, `<id>/NOTE.md` (chaleur, idée, ce qui tient, ce qui casse, sorties des contrôles), et dans `captures/` :
`<id>-repos.png` et `<id>-toucher.png` (390 × 844 ; l'état après le toucher de l'élément de la question). Ouvre-les (L12).
