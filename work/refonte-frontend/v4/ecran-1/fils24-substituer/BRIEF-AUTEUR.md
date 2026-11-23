# Lot D125 — Substituer : fils de fer en entonnoir (24.10)

Méthode : `.claude/skills/voies/references/entonnoir.md` (à lire en entier). Décision : conseil complet du 24.10
(`cerveau/decisions/2026-10-24-lot-d125-vues.md`, D34, D35). v0 : six séries de huit concepts minimalistes (48), trois
chaleurs ; tri par le critique (classement, 5 candidates, greffes) ; passes 2, 3… ; tout lui est montré.

## La question de l'outil
« Lequel à la place de Nugget ? » — Facteur libre : le remplaçant ; le moment de l'ajout et la dose au même IBU sont en contexte, et changent la réponse (à 60′ surtout l'amertume ; tardif, l'arôme).

## Ses mots (mot pour mot)
- « Substitution, ça serait plus du u4 » (19.10 ; le jury mettait u3 devant) : u4 est son choix (conseil du 24.10, D34).
- « Ajouter, vue -> substituer à faire dans le git » (23.10, #145) ; « Pas de bouton cancer » (23.10, D120).
- « Notamment aussi sur la partie de substitution » (24.10, en lançant les fils de fer des vues).
- « nelson sauvin est un houbon ordinaire alors que c'est un un houbon incroyable » (20.10, L14).

## Le plancher
u4 : `work/refonte-frontend/v4/ecran-1/fils11-substitution/u4/vue.html` et sa `NOTE.md` (capture `work/refonte-frontend/v4/ecran-1/fils11-substitution/captures/u4-vue-390.png`), le brief du lot 11 `work/refonte-frontend/v4/ecran-1/fils11-substitution/BRIEF-AUTEUR.md` ; et ce que la maquette 24.10 montre : `work/refonte-frontend/v4/choix/commentaires/captures/p22-substituer-repos.png`. Ce que la porte actuelle fait mal (à ne pas refaire) : « arôme 100 » affiché pour Nelson Sauvin qui « perd » six familles et n'en « gagne » aucune ; une colonne coupée à 390 px ; à 60′, des arômes que l'ébullition fait disparaître ; une vue qui ressemble trop à Comparer (« confusion entre timing, comparaison, houbons side by side »).

## Les données
Le moteur v4 calcule les remplaçants (ticket #126 : remplaçants classés, dose au même IBU, gagné et perdu) : `prototypes/houblons-v4/src/` et `prototypes/houblons-v4/ENGINE.md` ; les fiches : `prototypes/houblons-v4/data/pack-fiches.json`. Cas : sa stout export 16D, Nugget 46 g à 60′ (et le même Nugget déplacé en whirlpool ou à froid, pour montrer que la réponse change).

## Obligatoire, et rien d'autre
- **La baseline**, suivie toujours, chaleur et série libre comprises : pictos de famille au trait (épicé : cannelle et clou
  croisés, `work/refonte-frontend/v4/ecran-1/fils17-standard/v3/planche.html`, symbole `p-spice`), couleurs des familles, α et rôle, usage en mot, au
  style par défaut (l'absolu à un toucher), stock en petit badge, thème blanc de ses maquettes (D106), la croix pour sortir
  (D109). `controle-commun.mjs --sans=mots` passe.
- **L'honnêteté** : un nombre simulé dit « ~ » ; l'inconnu n'est jamais zéro (« ? », hachures) ; on n'invente aucun mot ni
  aucune valeur ; chaque mot affiché vient d'une fiche.
- **Au doigt à 390 px**, la question lisible, un seul facteur libre.
- **Interdits** : rien de l'app (`src/`) ; pages statiques ; classes et scripts préfixés par l'id (L26).

## Indicatif
Les mots (80 au plus au premier écran), la mise en page de ses exemples, les autres contrôles (`controle-une-question.mjs`,
`controle-sans-famille.mjs`, `mots-premier-ecran.mjs --sans-donnees`) : joués une fois, sorties recopiées dans la NOTE.

## Minimaliste, mais plein (M14)
Une seule idée par concept, sur un premier écran rempli comme au lot 21 (pas un écran vide, pas un squelette commun) ; la
baseline est un vocabulaire, pas un gabarit ; ses exemples, un tiers du panel au plus. Environ dix tours par concept.

## Les chaleurs (D22)
froide : son choix (g1, u4) affiné, rien d'autre ; tiède : une forme imposée par l'approche de la série ; chaude : une forme
libre. Chaque NOTE écrit sa chaleur.

## Chaque concept rend
`<id>/etat.html`, `<id>/NOTE.md` (chaleur, idée, ce qui tient, ce qui casse, sorties des contrôles), et dans
`captures/` : `<id>-premier-ecran.png` et `<id>-page.png` (390 × 844), plus un état qui compte s'il y a un geste.
