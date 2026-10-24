# Lot D125 — la liste de la fiche : fils de fer en entonnoir (24.10)

Méthode : `.claude/skills/voies/references/entonnoir.md` (à lire en entier). Décision : conseil complet du 24.10
(`cerveau/decisions/2026-10-24-lot-d125-vues.md`, D34, D35). v0 : six séries de huit concepts minimalistes (48), trois
chaleurs ; tri par le critique (classement, 5 candidates, greffes) ; passes 2, 3… ; tout lui est montré.

## La question de l'outil
« Que sent ce houblon, dit avec ses mots ? » — la liste sous le radar de la fiche g1 dit ce que le radar ne sait pas dessiner. Facteur libre : la façon de dire les arômes d'un houblon ; le houblon, sa fiche et le style sont en contexte.

## Ses mots (mot pour mot)
- « Mettre le radargraph avant, cette vue est vraiment pas terribles. À revoir... » (23.10, sur la liste de la fiche ; le radar d'abord est fait, D115).
- « nelson sauvin est un houbon ordinaire alors que c'est un un houbon incroyable » ; « là on a l'impression que motueka est ultra fruité » (20.10, L14).
- « la v1 est la meilleure » (g1, 19.10) ; sur la fiche courte de Citra cryo : « Ça c'est très bien ».
- « Il faudra aussi refaire des mini maquettes fils de fer sur les vue dont je suis pas convaincu » (24.10, D125).

## Le plancher
la fiche g1 de la base v4.10 : `work/refonte-frontend/v4/ecran-1/base/consolide/fiche.html` (joue-la ; sa capture `work/refonte-frontend/v4/ecran-1/base/captures/consolide-fiche-390.png`), et la liste de la maquette 24.10 : `work/refonte-frontend/v4/choix/commentaires/captures/p22-fiche-cascade-liste.png` (« Agrumes 2/2 · nommé en premier / pamplemousse, agrumes, lime », « Baies 1/2 / black currant »). Ce que la liste actuelle fait mal (à ne pas refaire) : elle redit le radar (« Floral 1/2 · floral ») ; « · nommé en premier » répété à chaque ligne ; des mots anglais ; les mots hors des 12 familles (vin blanc, groseille à maquereau) relégués en « sans famille » : Nelson Sauvin paraît ordinaire.

## Les données
Les fiches des houblons et leurs mots : `prototypes/houblons-v4/data/pack-fiches.json` ; le rattachement des mots aux 12 familles : `prototypes/houblons-v4/data/correspondance-familles.json` ; pourquoi 83 % des mots de Nelson Sauvin sortent du dessin : `cerveau/metier/descripteurs-hors-familles.md` (contrôle `controle-sans-famille.mjs`, D100). Houblons à montrer : Nugget (le houblon de sa stout), Nelson Sauvin, Citra cryo, Motueka, Cascade. Les mots en anglais des fiches se traduisent (« black currant » → cassis, D97).

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
