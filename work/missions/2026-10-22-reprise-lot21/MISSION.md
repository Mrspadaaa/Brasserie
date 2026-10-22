# Mission 2026-10-22-reprise-lot21

## Objectif
Reprendre la refonte houblons au retour du brasseur sur le lot 21 (20.10). Les six actions du
registre deviennent des voies, ordonnées par le verdict du conseil du 22.10
(`cerveau/decisions/2026-10-22-carte-outils-houblons.md`) :
1. la carte des outils ;
2. le comparateur 1:1 ;
3. le « quand » (Dryhopper) ;
4. le coût de calcul ;
5. Nelson Sauvin et Motueka ;
6. le picto « épicé ».

« Fini » pour cette mission : le brasseur a vu, sur la page des fils de fer, la carte des outils, le
lot 22 (Comparer seul) et la planche du picto. Les choix ouverts y sont montrés en variantes, et il
choisit en regardant. Les contrôles sont écrits avant le lot. Aucun code de l'app avant la porte B
(#119).

Correction du 22.10, après « Pourquoi ça n'a pas produit les mini maquettes ? » : le premier plan
faisait attendre le lot 22 sur quatre questions fermées. C'était contraire à [[le-brasseur-choisit]]
(leçon L24). Les questions deviennent des axes de variantes ; plus rien n'attend le brasseur avant
de lui montrer.

## Décisions
| Décision | Options | Décideur | État |
|---|---|---|---|
| Carte des outils | verdict du conseil : un facteur libre par écran ; Suggérer, Comparer, Dryhopper, Levure depuis Ma bière | brasseur | ouverte : page de r1, montrée avec le lot 22 |
| Radar de Comparer | r2 ; r3 (lot 16) | brasseur | ouverte : les deux montrés en variantes au lot 22, sans le bloquer |
| Base de comparaison | dose égale ; effet égal sur l'arôme visé ; IBU égal | brasseur | ouverte : les trois montrées en variantes au lot 22 |
| Substituer | porte vers Comparer avec X épinglé ; outil propre (u4) | brasseur | ouverte : la porte « Je n'ai pas X » montrée dans des variantes du lot 22, à côté de u4 |
| Levure | dernière étape de Dryhopper ; outil propre | brasseur | ouverte : les deux montrées en variantes au lot 23 (Dryhopper) |
| Descripteurs hors familles, présentation | A : gooseberry et « groseille à maquereau » rangés dans Petits fruits ; B : part « autres » visible, plafonnée, mots génériques écartés (recommandé : A puis B ; [[descripteurs-hors-familles]]) | brasseur | ouverte : A et B montrés sur la fiche dans des variantes du lot 22. Pour B, liste de mots génériques, seuil et plafond proposés par le pilote et marqués « à corriger par le brasseur » ; r3 applique son choix ensuite |
| Descripteurs hors familles, moteur | C : partager la force avec « autres » (profil-simule.ts:283), seulement avec B | conseil | ouverte, après B vu sur la fiche du lot 22 (mode rapide) |
| Picto « épicé » | planche de r4 | brasseur | ouverte |
| Repli de calcul (dry hop et biotransformation seulement si trop lourd) | garder ; lever | pilote | **tranchée le 22.10 après r2 : levé pour les écrans** (une variante = 2 à 30 ms sur PC, en direct dans le navigateur, sans serveur) ; le balayage complet du catalogue (8 s) reste hors du direct (Suggestions en léger ou grille précalculée) ; à revoir si un vrai téléphone dépasse 100 ms par geste ([[cout-calcul-moteur]]) |
| Réglage dans la ligne de contexte (D98) : le conseil veut « la dose reste en contexte, réglable d'un toucher » pour Dryhopper | (a) strict : tout réglage en contexte est un facteur libre ; (b) un seul bouton d'édition par facteur, ouvert en feuille | pilote | tranchée le 22.10 : (a) pour r1 et r6 ; (b) entre dans `controle-une-question.mjs` avant r7, conforme au verdict du conseil |
| Acquis « à un toucher » (D99) | compter absent ; ouvrir avant de mesurer | pilote | tranchée le 22.10 : ouvrir avant de mesurer ; `controle-acquis.mjs` à ajuster avant r6 (les vraies valeurs de v1 y sont prévues sous un toucher) |
| Seuils des contrôles de r0 : contexte ≥ 2 facteurs fixés ; sans famille > 50 %, part « autres » ≥ 24 × 6 px grise ; ACQUIS : radar 150 px et 2 séries, chimie 3 composés dont 2 rattachés, OSU 120 px et 3 formes, 3 vraies valeurs sourcées | garder ; changer | pilote | gardés le 22.10 ; la liste des mots génériques et le plafond de la part restent au brasseur (option B) |
| D100 (part « autres ») dans les GATES | toujours ; seulement si l'option B est retenue | pilote | seulement avec B : l'imposer avant son choix trancherait à sa place |
| Mise à jour de la page des fils de fer (artefact privé) | — | pilote | à chaque lot montré, page à jour seulement |
| Push de la branche, PR | — | utilisateur | groupé, non bloquant |

## Voies
| Voie | Objectif | Niveau | Agent | Modèle | Plafond | Possède | Dépend de | Contrôles | Décideur |
|---|---|---|---|---|---|---|---|---|---|
| r0-controles | contrôles L10 (un seul groupe de sélecteurs libres, éléments admis par outil), L06 (radar, chimie, panel OSU, vraies valeurs présents) et L14 (part sans famille visible et plafonnée), chacun avec témoin négatif | jugement | auteur | sonnet | 80 | work/refonte-frontend/v4/tournoi/outils/controle-une-question.mjs, controle-acquis.mjs, controle-sans-famille.mjs, temoins/{une-question-ok,acquis-ok,sans-famille-ok}/etat.html | — | chaque contrôle échoue sur y1b et y3 (L10, L06) et sur l5f (L14), passe sur un témoin positif (`systeme.mjs echoue`) | pilote |
| r6e-entrees | vérifier moteur et profils (L08) ; extraire `fils22-comparer/donnees/comparer-stout.json` (stout 16D, Cascade, Idaho 7, Galaxy, Nelson Sauvin ; dose égale, effet égal, IBU égal ; options A et B) | mécanique | executant | haiku | 40 | work/refonte-frontend/v4/ecran-1/fils22-comparer/donnees/{extraire-comparer.mjs,comparer-stout.json,ENTREES.md}, voies/r6e-entrees/profils-regeneres.json.tmp | — | check:engine ; controle-entrees-lot22 (D102, recalcule tout, témoin --temoin) ; prototypes intact | pilote |
| r0b-controles-ajustes | D99 : acquis à un toucher et radar r3 en petits multiples ; D100 : `--seuil` (0,25 proposé pour B) ; témoins positifs et négatifs | jugement | auteur | sonnet | 60 | controle-acquis.mjs, controle-sans-famille.mjs, temoins/{acquis-toucher-ok,acquis-deux-touchers,sans-famille-seuil-ok,sans-famille-seuil-ko}/etat.html | r0-controles | témoins neufs, et G1 à G8 de r0 rejoués | pilote |
| r1-carte | page en fil de fer : la stout de l'étape Houblons à Dryhopper, un écran par outil, ligne de contexte et facteur libre marqués ; les choix ouverts montrés côte à côte, sans question fermée | conception | concepteur (type auteur, modèle opus, consignes de concepteur.md : type non chargé dans la session du pilote) | opus | 80 | work/refonte-frontend/v4/ecran-1/fils22-carte/** | r0-controles, r0b-controles-ajustes, r6e-entrees | controle-une-question par écran (facteur de la carte du conseil), controle-commun (sans fiche ni légende), captures 390 ouvertes | brasseur |
| r6a-colonnes | lot 22, Comparer : trois colonnes côte à côte (w2) ; radar r2, dose égale, sans porte, descripteurs A | conception | concepteur (type auteur, modèle opus, consignes de concepteur.md : type non chargé dans la session du pilote) | opus | 80 | work/refonte-frontend/v4/ecran-1/fils22-comparer/r6a/** | r6e-entrees, r0b-controles-ajustes | COMMUN (sans MOTS), MOTS ≤ 80, UNE-QUESTION (houblon), ACQUIS 4/4, ALPHA, captures, NOTE « Choix portés » | brasseur |
| r6b-trois-radars | lot 22 : un radar par houblon ; r3, dose égale, B | conception | concepteur (type auteur, modèle opus, consignes de concepteur.md : type non chargé dans la session du pilote) | opus | 80 | work/refonte-frontend/v4/ecran-1/fils22-comparer/r6b/** | r6e-entrees, r0b-controles-ajustes | idem r6a, plus SANS-FAMILLE --seuil=0.25 | brasseur |
| r6c-podium-agrumes | lot 22 : le podium des agrumes ; r2, effet égal (agrumes), A | conception | concepteur (type auteur, modèle opus, consignes de concepteur.md : type non chargé dans la session du pilote) | opus | 80 | work/refonte-frontend/v4/ecran-1/fils22-comparer/r6c/** | r6e-entrees, r0b-controles-ajustes | idem r6a | brasseur |
| r6d-meme-tropical | lot 22 : le même tropical ; r3, effet égal (tropical), B | conception | concepteur (type auteur, modèle opus, consignes de concepteur.md : type non chargé dans la session du pilote) | opus | 80 | work/refonte-frontend/v4/ecran-1/fils22-comparer/r6d/** | r6e-entrees, r0b-controles-ajustes | idem r6b | brasseur |
| r6f-meme-amertume | lot 22 : même amertume, quel arôme ; r2, IBU égal, B | conception | concepteur (type auteur, modèle opus, consignes de concepteur.md : type non chargé dans la session du pilote) | opus | 80 | work/refonte-frontend/v4/ecran-1/fils22-comparer/r6f/** | r6e-entrees, r0b-controles-ajustes | idem r6b | brasseur |
| r6g-trois-verres | lot 22 : trois verres à même amertume ; r3, IBU égal, A | conception | concepteur (type auteur, modèle opus, consignes de concepteur.md : type non chargé dans la session du pilote) | opus | 80 | work/refonte-frontend/v4/ecran-1/fils22-comparer/r6g/** | r6e-entrees, r0b-controles-ajustes | idem r6a | brasseur |
| r6h-sans-nelson-dose | lot 22 : je n'ai pas Nelson Sauvin ; r2, dose égale, porte, B | conception | concepteur (type auteur, modèle opus, consignes de concepteur.md : type non chargé dans la session du pilote) | opus | 80 | work/refonte-frontend/v4/ecran-1/fils22-comparer/r6h/** | r6e-entrees, r0b-controles-ajustes | idem r6b | brasseur |
| r6i-sans-nelson-effet | lot 22 : remplacer Nelson Sauvin à effet égal ; r3, effet égal (agrumes), porte, A | conception | concepteur (type auteur, modèle opus, consignes de concepteur.md : type non chargé dans la session du pilote) | opus | 80 | work/refonte-frontend/v4/ecran-1/fils22-comparer/r6i/** | r6e-entrees, r0b-controles-ajustes | idem r6a | brasseur |
| r6j-vraies-valeurs | lot 22 : les vraies valeurs d'abord ; r2, effet égal (agrumes), B | conception | concepteur (type auteur, modèle opus, consignes de concepteur.md : type non chargé dans la session du pilote) | opus | 80 | work/refonte-frontend/v4/ecran-1/fils22-comparer/r6j/** | r6e-entrees, r0b-controles-ajustes | idem r6b | brasseur |
| r6k-panel-d-abord | lot 22 : le panel d'abord ; r3, dose égale, A | conception | concepteur (type auteur, modèle opus, consignes de concepteur.md : type non chargé dans la session du pilote) | opus | 80 | work/refonte-frontend/v4/ecran-1/fils22-comparer/r6k/** | r6e-entrees, r0b-controles-ajustes | idem r6a | brasseur |
| r6l-cartes-glisser | lot 22 : des cartes à glisser ; r2, IBU égal, porte, A | conception | concepteur (type auteur, modèle opus, consignes de concepteur.md : type non chargé dans la session du pilote) | opus | 80 | work/refonte-frontend/v4/ecran-1/fils22-comparer/r6l/** | r6e-entrees, r0b-controles-ajustes | idem r6a | brasseur |
| r6m-la-phrase | lot 22 : la phrase et le radar ; r3, IBU égal, B | conception | concepteur (type auteur, modèle opus, consignes de concepteur.md : type non chargé dans la session du pilote) | opus | 80 | work/refonte-frontend/v4/ecran-1/fils22-comparer/r6m/** | r6e-entrees, r0b-controles-ajustes | idem r6b | brasseur |
| r4c-picto-epice-2 | nouvelle planche « épicé » après « Aucun me convient... » (22.10) : 6 à 8 propositions de cinq genres au moins, aucune idée ni aucun dessin déjà refusés | conception | concepteur (type auteur, modèle opus, consignes de concepteur.md : type non chargé dans la session du pilote) | opus | 80 | work/refonte-frontend/v4/ecran-1/fils22-picto-epice-2/** | — | controle-planche-picto --refuses --genres=5 (témoin : planche-r4-refusee), controle-pictos-trait, captures ouvertes | brasseur |
| r5-critique-carte | critique calibré de r1 : verdict prédit du brasseur | jugement | critique | fable | 30 | voies/r5-critique-carte/RESULTAT.md | r1-carte | captures ouvertes, phrase prédite par écran | pilote |
| r6r-critique-lot22 | critique calibré des 12 variantes : verdict prédit par variante, ★ sur trois ou quatre | jugement | critique | fable | 30 | voies/r6r-critique-lot22/RESULTAT.md | r6a-colonnes, r6b-trois-radars, r6c-podium-agrumes, r6d-meme-tropical, r6f-meme-amertume, r6g-trois-verres, r6h-sans-nelson-dose, r6i-sans-nelson-effet, r6j-vraies-valeurs, r6k-panel-d-abord, r6l-cartes-glisser, r6m-la-phrase | captures ouvertes, une ligne par variante | pilote |
| r4cr-critique-picto | critique calibré de r4c : la planche est-elle montrable après trois refus ? | jugement | critique | fable | 30 | voies/r4cr-critique-picto/RESULTAT.md | r4c-picto-epice-2 | captures ouvertes, chaque picto nommé à voix haute | pilote |
| r2-cout-calcul | chronométrer simulerCas léger et complet sur le cas stout et sur tout le catalogue, sans écrire dans le moteur ; note du cerveau | mécanique | executant | haiku | 40 | cerveau/metier/cout-calcul-moteur.md, voies/r2-cout-calcul/ANNEXE.md | — | note --exiger "Mesures,Conditions,Conclusion" ; npm run check:engine | pilote |
| r8-publication | captures et section lot 22 pour la page des fils de fer : carte, variantes de Comparer, planche « épicé » ; le pilote met ensuite l'artefact à jour lui-même | mécanique | executant | haiku | 40 | work/refonte-frontend/v4/outils/page-nuit/{faire-lot22.mjs,lot22.json,site/index.html,site/img/**} | r5-critique-carte, r6r-critique-lot22, r4cr-critique-picto | lot22.json (7 puces, 16 images existantes), section t119-lot22 en tête de la copie locale | pilote |
| r3-descripteurs | appliquer dans le prototype les options choisies par le brasseur (A table complémentaire mot → famille, B part « autres ») ; confronter Cascade, Idaho 7, Galaxy, Nelson Sauvin, Motueka à leur réputation | jugement | auteur | sonnet | 80 | prototypes/houblons-v4/data/descripteurs-complementaires.json, prototypes/houblons-v4/src/engine/hops.ts, prototypes/houblons-v4/tests/ (la table mot → famille d'origine vit dans hopExtrapolationBootstrap.json, ne pas la modifier) | brasseur (option choisie) | npm test et check:engine (prototypes/houblons-v4) ; controle-sans-famille | pilote |
| r7-dryhopper | lot 23 : Dryhopper, y1b sans sélecteur de houblon, moment par 5′, x3b réduit en fin de frise ; la levure en variantes (dernière étape ou outil propre) | conception | concepteur (type auteur, modèle opus, consignes de concepteur.md : type non chargé dans la session du pilote) | opus | 80 | work/refonte-frontend/v4/ecran-1/fils23-dryhopper/** | r6r-critique-lot22 | controle-commun, controle-une-question (D98 b : bouton d'édition en contexte), critique | brasseur |
| r0c-inventaire-controles | (1) `elements-notes.json` : chaque élément que le brasseur a noté bon ou intéressant, depuis le lot 18 (ses mots et leur date, la variante, la capture, le marqueur `data-element` attendu), y1b d'abord ; (2) D104 `controle-reprise.mjs` ; (3) D101 ter dans `controle-planche-picto.mjs` ; témoins : r6a actuelle et r4c en échec | conception | auteur | opus | 80 | work/refonte-frontend/v4/ecran-1/fils22-comparer/donnees/elements-notes.json, work/refonte-frontend/v4/tournoi/outils/controle-reprise.mjs, controle-planche-picto.mjs, temoins/reprise-*/ | — | chaque élément cité mot pour mot et retrouvé dans SPEC-BRASSEUR (check-spec) ; témoins r6a et r4c → ECHEC | pilote |
| r6n-reprise | lot 22 bis : r6a gardée telle qu'il l'aime, plus chaque élément de l'inventaire. Deux mini maquettes : r6n1, tout au premier écran ; r6n2, le premier écran de r6a et le reste à un toucher (d1, « tout ouvert », était « trop bordélique »). La NOTE classe chaque élément : repris, en contexte, en pont, ou écarté avec sa raison | conception | concepteur | opus | 80 | work/refonte-frontend/v4/ecran-1/fils22-comparer/r6n1/**, work/refonte-frontend/v4/ecran-1/fils22-comparer/r6n2/** | r0c-inventaire-controles | controle-commun, controle-une-question, controle-acquis, controle-reprise (D104), verifier-page | brasseur |
| r4d-picto-epice-3 | au moins 8 vraies propositions « épicé », au moins 6 genres, ni piment ni poivre, dans la grammaire des autres pictos (trait, ton Épicé), chacune à 12, 16 et 24 px et sur de vraies cartes ; sa piste « plutôt vanille, canelle ? » redessinée pour de bon (bâton roulé vu de bout, gousse fendue) parmi les autres | conception | concepteur | opus | 80 | work/refonte-frontend/v4/ecran-1/fils22-picto-epice-3/** | r0c-inventaire-controles | controle-planche-picto (D101 ter), verifier-page | brasseur |
| r6nc-critique | défauts vérifiables de r6n et r4d, sans trier ni écarter la diversité (L27 : critique non étalonné) | jugement | critique | fable | 30 | voies/r6nc-critique/RESULTAT.md | r6n-reprise, r4d-picto-epice-3 | captures ouvertes ; un REJET doit citer une règle de SPEC ou un défaut de DEFAUTS | pilote |

## Historique : voies d'interface terminées avant L25 (vague 1)
Conçues et relues avant la leçon L25 (22.10, soir) ; gardées ici pour la trace, hors du contrôle du plan.

| Voie | Objectif | Agent et modèle | État |
|---|---|---|---|
| r4-picto-epice | planche de 7 pictos « épicé » | auteur, sonnet | faite, relue (r4r, relecteur sonnet), puis **refusée par le brasseur** le 22.10 : « Aucun me convient... » |
| r4r-relecture | relecture de r4 | relecteur, sonnet | faite : « accepté », à tort (L25) |

## Ordre
- **Vague 1**, en parallèle et tout de suite : r0-controles, r2-cout-calcul, r4-picto-epice ; puis
  r4r-relecture au retour de r4 (décision du pilote, 22.10 : la planche ne doit pas attendre r1 pour
  être relue, r5 ne relit plus que r1).
- **Vague 2, tout de suite (corrigée le 22.10)** :
  - d'abord une voie Haiku « entrées », qui vérifie le moteur, profils-simules.json et les
    constantes (L08), et l'ajustement de `controle-acquis.mjs` pour un acquis « à un toucher » ;
  - puis, en parallèle, r1-carte et r6-lot22-comparer (sous-voies r6a… r6l, une mini maquette
    chacune).
- **Vague 3** : un relecteur pour r1 (r5) et un pour r6 ; puis r8-publication. Le pilote met
  l'artefact privé à jour lui-même, avec la planche « épicé » de la vague 1. Le brasseur choisit
  en regardant.
- **Vague 3 bis, retour du lot 22 (22.10, soir)** :
  - d'abord r0c-inventaire-controles ;
  - puis, en parallèle, r6n-reprise et r4d-picto-epice-3 ;
  - puis r6nc-critique, qui signale sans trier ;
  - puis la publication par le pilote : page « Lot 22 houblons », même adresse, version 3. Source de
    la page : `work/refonte-frontend/v4/outils/page-lot/index.html`. Elle passe `verifier-page.mjs`
    avant publication (PAGE OK), et ne montre en tête que r6n1, r6n2 et la nouvelle planche.
- **Vague 4**, après ses choix : r3-descripteurs applique l'option retenue, puis r7-dryhopper
  (lot 23, la levure en variantes).

## Retour du brasseur sur le lot 22 (22.10, soir)
- r6a choisie : « r6a est le meilleur mais reprendre trop peu d'éléments que j'avais noté bon ou intéressant des autres variante, notamment la meilleure » ; reprise en r6n (D104).
- r6c écartée : non retenue par le brasseur, qui a choisi r6a.
- r6d écartée : non retenue par le brasseur, qui a choisi r6a.
- r6f écartée : non retenue par le brasseur, qui a choisi r6a ; ses cartes sont à reprendre si l'inventaire les liste.
- r6g écartée : non retenue par le brasseur, qui a choisi r6a.
- r6k écartée : non retenue par le brasseur, qui a choisi r6a.
- Picto r4c refusé : « Les icônes épices ??? Il y a que 3 variante, qui sont toutes quasiment identique ??? » ; « Des vrais proposition surtout que un piment n'a rien à voir la dedans... » (D101 ter) ; refait en r4d.

## Boucle de retour
- **Courte** : chaque voie rejoue ses critères, avec 3 essais par critère.
- **Moyenne** : le pilote rejoue (`systeme.mjs voies work/missions/2026-10-22-reprise-lot21`). Un
  échec ou un rejet du relecteur repart au même agent par SendMessage, 2 relances au plus. Au-delà,
  le contrat est réécrit, ou le conseil est réuni en mode rapide.
- **Longue** : chaque remarque du brasseur sur la page de r1 ou la planche de r4 suit le même chemin :
  - ses mots dans SPEC-BRASSEUR ;
  - une ligne dans DEFAUTS-RECURRENTS, avec un contrôle qui échoue sur la version rejetée ;
  - ce contrôle entre dans les GATES de r6 et r7.
  Une erreur de méthode devient une leçon ; un savoir durable devient une note du cerveau.
- Les contrôles de r0 entrent dans les GATES de toutes les voies d'interface suivantes. Ainsi la
  confusion du lot 21 ne peut plus revenir sans échec.

## Budget
Usage au lancement de la vague 1 (22.10, ~11 h) : fenêtre de 5 h à 16 % (remise à 16 h), semaine
à 3 % ; contexte du pilote 238 k sur 1 M. Après la vague 1 (~13 h 20) : 5 h à 20 %, semaine à
4 %, contexte 324 k. Coût des quatre voies : environ 4 points de la fenêtre de 5 h (agents : r0
220 k, r4 96 k, r2 86 k, r4r 50 k jetons).
Plafonds par voie dans la table. Arrêt vers 95 % de la fenêtre de 5 h. Le lot 22 compte environ
12 variantes, pas 40 (L18).

## Sources
- `cerveau/decisions/2026-10-22-carte-outils-houblons.md`
- `cerveau/produit/outils-houblons.md`
- `cerveau/produit/acquis-valides.md`
- `work/refonte-frontend/v4/SPEC-BRASSEUR.md`
- `work/refonte-frontend/v4/DEFAUTS-RECURRENTS.md`
- `work/refonte-frontend/registre.md`
- `work/refonte-frontend/v4/tournoi/outils/controle-commun.mjs`
- `work/refonte-frontend/v4/outils/page-nuit/ajouter-lot.mjs`
- `prototypes/houblons-v4/src/engine/profil-simule.ts`
- `work/refonte-frontend/v4/ecran-1/fils21-choisir/captures/y1b-390.png`

## Signature
### Vague 1 (22.10, deuxième session du système d'agents)
Rejeu du pilote, `node scripts/agents/systeme.mjs voies work/missions/2026-10-22-reprise-lot21 --approuver` :
```
OK r0-controles (sonnet) — trois contrôles au rendu (UNE-QUESTION, ACQUIS, SANS-FAMILLE), huit critères tenus, témoin
OK r2-cout-calcul (haiku) — coût de simulerCas mesuré : léger et complet, catalogue, note et annexe écrites.
OK r4-picto-epice (sonnet) — Planche de 7 pictos « épicé » au trait, sans poivre, à 12/16/24 px et en contexte, capturé
OK r4r-relecture (sonnet) — accepté : 7 pictos « épicé » au trait, sans poivre, lisibles à 12/16/24 px, qui couvrent l
VOIES OK 4/4
```
- Types d'agents réels (`auteur`, `executant`, `relecteur`), plafonds maxTurns actifs, aucun repli
  `general-purpose`. Lancement : r0, r2 et r4 dans un seul message, en arrière-plan ; r4r au retour de r4.
- `git status --short` comparé aux « Possède » : rien hors périmètre ; `prototypes/` intact (G4 de r2).
- Captures de r4 ouvertes aussi par le pilote : `planche-390.png`, `contexte-390.png`.
- Décisions prises (pilote) : repli de calcul levé pour les écrans ; seuils de r0 gardés ; contexte
  strict jusqu'à r7 ; acquis « à un toucher » à admettre avant r6 ; D100 seulement avec l'option B.
  Les contrôles et les témoins passent dans `tournoi/outils/` et `tournoi/outils/temoins/`, versionnés
  (`.gitignore`).
- Ajouts du pilote : `systeme.mjs echoue` (témoin négatif dans un GATES) et le refus d'un critère
  ignoré par git (21 témoins tenus) ; `controle-planche-picto.mjs` (D101) et son témoin.
- DEFAUTS-RECURRENTS : D98 à D101. Leçons : M05 (L23) ajoutée ; L20 enrichie (proposée par r2) ;
  « Contrôle » de L06, L10 et L14 mis à jour. Notes : `cout-calcul-moteur` (r2, conclusion précisée
  par le pilote), `pictos-familles` (CONNAISSANCE de r4), `descripteurs-hors-familles` complétée
  (CONNAISSANCE de r0).
- Reste ouvert :
  - au brasseur : le picto « épicé » (planche r4) ; les quatre questions fermées du conseil ; A ou B
    pour Nelson Sauvin, avec la liste des mots génériques et le plafond ;
  - au pilote : ajuster D99 (« à un toucher ») avant r6, et D98 (b) avant r7 ;
  - mesurer sur un vrai téléphone ;
  - prochaine voie : **r1-carte**.

### Vague 2 (22.10, soir) : les mini maquettes
Rejeu du pilote, `node scripts/agents/systeme.mjs voies work/missions/2026-10-22-reprise-lot21 --approuver` :
`VOIES OK 24/24`. Toutes les lignes sont OK, de r0 à r8, y compris les voies de la vague 1.
- **Entrées** :
  - r6e (Haiku) : moteur, 4,75 % vol., grille identique à une régénération, et `comparer-stout.json`
    recalculé par D102. Le contrôle D102 du pilote comptait les groupes `{ source, mots[] }` au lieu
    des mots : erreur relevée par la voie, corrigée (M07) ;
  - r0b : D99 « à un toucher » et radar r3 ; D100 `--seuil`.
- **L25** (session voisine, commit 6f1a964, en cours de vague) : l'interface en Opus, la critique en
  Fable. Le type `concepteur` n'était pas chargé dans la session du pilote. Les 14 voies d'interface
  ont donc tourné en type `auteur`, forcé sur `opus`, avec la consigne « suis
  .claude/agents/concepteur.md ». Les trois critiques ont tourné dans le vrai type `critique`
  (Fable), chargé entre-temps. Aucun repli `general-purpose`.
- **Critiques et boucles moyennes** :
  - r4c rejetée, puis acceptée après relance 1 (contrat de G2 réécrit par le pilote) ;
  - r1 rejetée, puis acceptée après relance 1 ;
  - lot 22 accepté : ★ r6l, r6j, r6i, r6m ; r6b et r6h avec réserve ; r6a et r6f pour leur
    structure ; r6c, r6d, r6g et r6k rejetées.
- **Brasseur** : « Aucun me convient... » sur la planche r4. Ses mots sont dans SPEC ; D101 bis
  (`--refuses`, `--genres`, `--voisins`, rien sous 12 px), avec le témoin `planche-r4-refusee.html`.
- **Pilote** :
  - D98 réparé : ses deux `\b` étaient des 0x08 (relevé par r6i). `cablage` refuse désormais les
    caractères de contrôle (M10, 26 témoins) ;
  - D102 et D103 (prédit) versés dans DEFAUTS ;
  - `loupe.html` et `loupe.png`, écrits par r4c à la racine (L17), rangés dans
    `fils22-picto-epice-2/captures/travail/`.
- **Leçons** :
  - L26 : préfixer ses classes quand on reprend un socle (cinq variantes cassées en silence) ;
  - L08 devient M07, et L09 devient M08 ;
  - M09 : la planche de picto ;
  - M10 : les caractères de contrôle ;
  - L13, L14 et L17 enrichies ;
  - leçons proposées par les voies : traitées ou fusionnées ; les faits techniques (compteur de mots,
    iframes) vont dans la note `poste-windows-msix`.
- **Budget** : la fenêtre de 5 h est passée de 4 % à environ 80 %. Les 14 voies Opus ont consommé
  chacune 260 à 400 k jetons.
- **Publication** : la section « lot 22 » est prête en local (`outils/page-nuit/site/`). Elle n'est
  **pas publiée** : la page des fils de fer est introuvable depuis le compte connecté à la session du
  pilote. Ce geste revient à l'utilisateur ou à une session connectée au bon compte.
- **Publication (22.10, par la session de supervision)** : l'ancienne page étant inaccessible, le
  lot 22 est publié sur une page neuve, https://claude.ai/artifact/GzpfxNeKZLKXfkg4pz9kzv. Elle montre
  les 12 variantes dans un ordre neutre, la carte avec les deux formes de Substituer et de Levure,
  et la planche « épicé » r4c.
- **Rejets du critique en plan** : r6a, r6c, r6d, r6f, r6g et r6k, à relancer ou à écarter (M12).
  L'avis du critique est indicatif tant qu'il n'est pas étalonné (L27).
- **Reste** :
  - le choix du brasseur ;
  - r3, après A ou B ;
  - la correction du radar (D103) sur la variante choisie ;
  - r7 (lot 23).
