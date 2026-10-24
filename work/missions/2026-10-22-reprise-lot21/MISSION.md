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
| Plafond de mots au premier écran | 70 (controle-commun, ancien) ; 80 (SPEC § 0) | pilote | tranchée le 23.10 : **80**, la limite de la SPEC ; les GATES jouent MOTS à 80 à part (`--sans=mots` dans controle-commun) |
| D96 (cumul, levure, biotransformation) sur Dryhopper | contrôler ; écart justifié | pilote | tranchée le 23.10 : sans controle-cumul-levure pour Dryhopper ; raison : la carte du 22.10 fait de la levure un outil à part, que Dryhopper montre en dernière étape ou en pont (acquis `levure` de `controle-acquis --outil=dryhopper`) |
| Défauts déjà en échec sur les pages retenues (audit du 23.10) : D94 lisible (r6n2 L5, g1 L2), D95 simulation (g1), D2 (g1 : cinq tailles de texte) | corriger maintenant ; à l'intégration de la variante choisie | pilote | tranchée le 23.10 : à corriger sur la variante qu'il gardera, pas avant (« Et ensuite on sera bon » ; r6n2 est sa référence de qualité, ne pas la dégrader) |
| Push de la branche, PR | — | utilisateur | groupé, non bloquant |

## Voies
| Voie | Objectif | Niveau | Agent | Modèle | Plafond | Possède | Dépend de | Contrôles | Décideur | Étape |
|---|---|---|---|---|---|---|---|---|---|---|
| r0-controles | contrôles L10 (un seul groupe de sélecteurs libres, éléments admis par outil), L06 (radar, chimie, panel OSU, vraies valeurs présents) et L14 (part sans famille visible et plafonnée), chacun avec témoin négatif | jugement | auteur | sonnet | 80 | work/refonte-frontend/v4/tournoi/outils/controle-une-question.mjs, controle-acquis.mjs, controle-sans-famille.mjs, temoins/{une-question-ok,acquis-ok,sans-famille-ok}/etat.html | — | chaque contrôle échoue sur y1b et y3 (L10, L06) et sur l5f (L14), passe sur un témoin positif (`systeme.mjs echoue`) | pilote | — |
| r6e-entrees | vérifier moteur et profils (L08) ; extraire `fils22-comparer/donnees/comparer-stout.json` (stout 16D, Cascade, Idaho 7, Galaxy, Nelson Sauvin ; dose égale, effet égal, IBU égal ; options A et B) | mécanique | executant | haiku | 40 | work/refonte-frontend/v4/ecran-1/fils22-comparer/donnees/{extraire-comparer.mjs,comparer-stout.json,ENTREES.md}, voies/r6e-entrees/profils-regeneres.json.tmp | — | check:engine ; controle-entrees-lot22 (D102, recalcule tout, témoin --temoin) ; prototypes intact | pilote | — |
| r0b-controles-ajustes | D99 : acquis à un toucher et radar r3 en petits multiples ; D100 : `--seuil` (0,25 proposé pour B) ; témoins positifs et négatifs | jugement | auteur | sonnet | 60 | controle-acquis.mjs, controle-sans-famille.mjs, temoins/{acquis-toucher-ok,acquis-deux-touchers,sans-famille-seuil-ok,sans-famille-seuil-ko}/etat.html | r0-controles | témoins neufs, et G1 à G8 de r0 rejoués | pilote | — |
| r1-carte | page en fil de fer : la stout de l'étape Houblons à Dryhopper, un écran par outil, ligne de contexte et facteur libre marqués ; les choix ouverts montrés côte à côte, sans question fermée | conception | concepteur (type auteur, modèle opus, consignes de concepteur.md : type non chargé dans la session du pilote) | opus | 80 | work/refonte-frontend/v4/ecran-1/fils22-carte/** | r0-controles, r0b-controles-ajustes, r6e-entrees | controle-une-question par écran (facteur de la carte du conseil), controle-commun (sans fiche ni légende), captures 390 ouvertes | brasseur | — |
| r6a-colonnes | lot 22, Comparer : trois colonnes côte à côte (w2) ; radar r2, dose égale, sans porte, descripteurs A | conception | concepteur (type auteur, modèle opus, consignes de concepteur.md : type non chargé dans la session du pilote) | opus | 80 | work/refonte-frontend/v4/ecran-1/fils22-comparer/r6a/** | r6e-entrees, r0b-controles-ajustes | COMMUN (sans MOTS), MOTS ≤ 80, UNE-QUESTION (houblon), ACQUIS 4/4, ALPHA, captures, NOTE « Choix portés » | brasseur | — |
| r6b-trois-radars | lot 22 : un radar par houblon ; r3, dose égale, B | conception | concepteur (type auteur, modèle opus, consignes de concepteur.md : type non chargé dans la session du pilote) | opus | 80 | work/refonte-frontend/v4/ecran-1/fils22-comparer/r6b/** | r6e-entrees, r0b-controles-ajustes | idem r6a, plus SANS-FAMILLE --seuil=0.25 | brasseur | — |
| r6c-podium-agrumes | lot 22 : le podium des agrumes ; r2, effet égal (agrumes), A | conception | concepteur (type auteur, modèle opus, consignes de concepteur.md : type non chargé dans la session du pilote) | opus | 80 | work/refonte-frontend/v4/ecran-1/fils22-comparer/r6c/** | r6e-entrees, r0b-controles-ajustes | idem r6a | brasseur | — |
| r6d-meme-tropical | lot 22 : le même tropical ; r3, effet égal (tropical), B | conception | concepteur (type auteur, modèle opus, consignes de concepteur.md : type non chargé dans la session du pilote) | opus | 80 | work/refonte-frontend/v4/ecran-1/fils22-comparer/r6d/** | r6e-entrees, r0b-controles-ajustes | idem r6b | brasseur | — |
| r6f-meme-amertume | lot 22 : même amertume, quel arôme ; r2, IBU égal, B | conception | concepteur (type auteur, modèle opus, consignes de concepteur.md : type non chargé dans la session du pilote) | opus | 80 | work/refonte-frontend/v4/ecran-1/fils22-comparer/r6f/** | r6e-entrees, r0b-controles-ajustes | idem r6b | brasseur | — |
| r6g-trois-verres | lot 22 : trois verres à même amertume ; r3, IBU égal, A | conception | concepteur (type auteur, modèle opus, consignes de concepteur.md : type non chargé dans la session du pilote) | opus | 80 | work/refonte-frontend/v4/ecran-1/fils22-comparer/r6g/** | r6e-entrees, r0b-controles-ajustes | idem r6a | brasseur | — |
| r6h-sans-nelson-dose | lot 22 : je n'ai pas Nelson Sauvin ; r2, dose égale, porte, B | conception | concepteur (type auteur, modèle opus, consignes de concepteur.md : type non chargé dans la session du pilote) | opus | 80 | work/refonte-frontend/v4/ecran-1/fils22-comparer/r6h/** | r6e-entrees, r0b-controles-ajustes | idem r6b | brasseur | — |
| r6i-sans-nelson-effet | lot 22 : remplacer Nelson Sauvin à effet égal ; r3, effet égal (agrumes), porte, A | conception | concepteur (type auteur, modèle opus, consignes de concepteur.md : type non chargé dans la session du pilote) | opus | 80 | work/refonte-frontend/v4/ecran-1/fils22-comparer/r6i/** | r6e-entrees, r0b-controles-ajustes | idem r6a | brasseur | — |
| r6j-vraies-valeurs | lot 22 : les vraies valeurs d'abord ; r2, effet égal (agrumes), B | conception | concepteur (type auteur, modèle opus, consignes de concepteur.md : type non chargé dans la session du pilote) | opus | 80 | work/refonte-frontend/v4/ecran-1/fils22-comparer/r6j/** | r6e-entrees, r0b-controles-ajustes | idem r6b | brasseur | — |
| r6k-panel-d-abord | lot 22 : le panel d'abord ; r3, dose égale, A | conception | concepteur (type auteur, modèle opus, consignes de concepteur.md : type non chargé dans la session du pilote) | opus | 80 | work/refonte-frontend/v4/ecran-1/fils22-comparer/r6k/** | r6e-entrees, r0b-controles-ajustes | idem r6a | brasseur | — |
| r6l-cartes-glisser | lot 22 : des cartes à glisser ; r2, IBU égal, porte, A | conception | concepteur (type auteur, modèle opus, consignes de concepteur.md : type non chargé dans la session du pilote) | opus | 80 | work/refonte-frontend/v4/ecran-1/fils22-comparer/r6l/** | r6e-entrees, r0b-controles-ajustes | idem r6a | brasseur | — |
| r6m-la-phrase | lot 22 : la phrase et le radar ; r3, IBU égal, B | conception | concepteur (type auteur, modèle opus, consignes de concepteur.md : type non chargé dans la session du pilote) | opus | 80 | work/refonte-frontend/v4/ecran-1/fils22-comparer/r6m/** | r6e-entrees, r0b-controles-ajustes | idem r6b | brasseur | — |
| r4c-picto-epice-2 | nouvelle planche « épicé » après « Aucun me convient... » (22.10) : 6 à 8 propositions de cinq genres au moins, aucune idée ni aucun dessin déjà refusés | conception | concepteur (type auteur, modèle opus, consignes de concepteur.md : type non chargé dans la session du pilote) | opus | 80 | work/refonte-frontend/v4/ecran-1/fils22-picto-epice-2/** | — | controle-planche-picto --refuses --genres=5 (témoin : planche-r4-refusee), controle-pictos-trait, captures ouvertes | brasseur | — |
| r5-critique-carte | critique calibré de r1 : verdict prédit du brasseur | jugement | critique | fable | 30 | voies/r5-critique-carte/RESULTAT.md | r1-carte | captures ouvertes, phrase prédite par écran | pilote | — |
| r6r-critique-lot22 | critique calibré des 12 variantes : verdict prédit par variante, ★ sur trois ou quatre | jugement | critique | fable | 30 | voies/r6r-critique-lot22/RESULTAT.md | r6a-colonnes, r6b-trois-radars, r6c-podium-agrumes, r6d-meme-tropical, r6f-meme-amertume, r6g-trois-verres, r6h-sans-nelson-dose, r6i-sans-nelson-effet, r6j-vraies-valeurs, r6k-panel-d-abord, r6l-cartes-glisser, r6m-la-phrase | captures ouvertes, une ligne par variante | pilote | — |
| r4cr-critique-picto | critique calibré de r4c : la planche est-elle montrable après trois refus ? | jugement | critique | fable | 30 | voies/r4cr-critique-picto/RESULTAT.md | r4c-picto-epice-2 | captures ouvertes, chaque picto nommé à voix haute | pilote | — |
| r2-cout-calcul | chronométrer simulerCas léger et complet sur le cas stout et sur tout le catalogue, sans écrire dans le moteur ; note du cerveau | mécanique | executant | haiku | 40 | cerveau/metier/cout-calcul-moteur.md, voies/r2-cout-calcul/ANNEXE.md | — | note --exiger "Mesures,Conditions,Conclusion" ; npm run check:engine | pilote | — |
| r8-publication | captures et section lot 22 pour la page des fils de fer : carte, variantes de Comparer, planche « épicé » ; le pilote met ensuite l'artefact à jour lui-même | mécanique | executant | haiku | 40 | work/refonte-frontend/v4/outils/page-nuit/{faire-lot22.mjs,lot22.json,site/index.html,site/img/**} | r5-critique-carte, r6r-critique-lot22, r4cr-critique-picto | lot22.json (7 puces, 16 images existantes), section t119-lot22 en tête de la copie locale | pilote | — |
| r3-descripteurs | appliquer dans le prototype les options choisies par le brasseur (A table complémentaire mot → famille, B part « autres ») ; confronter Cascade, Idaho 7, Galaxy, Nelson Sauvin, Motueka à leur réputation | jugement | auteur | sonnet | 80 | prototypes/houblons-v4/data/descripteurs-complementaires.json, prototypes/houblons-v4/src/engine/hops.ts, prototypes/houblons-v4/tests/ (la table mot → famille d'origine vit dans hopExtrapolationBootstrap.json, ne pas la modifier) | brasseur (option choisie) | npm test et check:engine (prototypes/houblons-v4) ; controle-sans-famille | pilote | — |
| r0c-inventaire-controles | (1) `elements-notes.json` : chaque élément que le brasseur a noté bon ou intéressant, depuis le lot 18 (ses mots et leur date, la variante, la capture, le marqueur `data-element` attendu), y1b d'abord ; (2) D104 `controle-reprise.mjs` ; (3) D101 ter dans `controle-planche-picto.mjs` ; témoins : r6a actuelle et r4c en échec | conception | auteur | opus | 80 | work/refonte-frontend/v4/ecran-1/fils22-comparer/donnees/elements-notes.json, work/refonte-frontend/v4/tournoi/outils/controle-reprise.mjs, controle-planche-picto.mjs, temoins/reprise-*/, temoins/planche-r4c-refusee.html, temoins/planche-ter-ok.html | — | chaque élément cité mot pour mot et retrouvé dans SPEC-BRASSEUR (check-spec) ; témoins r6a et r4c → ECHEC | pilote | — |
| r6n1-reprise-tout | lot 22 bis : r6a gardée telle qu'il l'aime, plus chaque élément de l'inventaire, **tout au premier écran** ; la NOTE classe chaque élément : repris, en contexte, en pont, ou écarté avec sa raison (un seul facteur libre : la variété) | conception | concepteur | opus | 80 | work/refonte-frontend/v4/ecran-1/fils22-comparer/r6n1/**, work/refonte-frontend/v4/ecran-1/fils22-comparer/captures/r6n1-*.png | r0c-inventaire-controles | controle-commun, MOTS ≤ 80, controle-une-question, controle-acquis, controle-alpha, controle-reprise --premier-ecran (D104), captures ouvertes | brasseur | reprise |
| r6n2-reprise-toucher | lot 22 bis : le premier écran de r6a gardé, chaque élément de l'inventaire **à un toucher** (d1, « tout ouvert », était « trop bordélique ») ; même NOTE de reprise | conception | concepteur | opus | 80 | work/refonte-frontend/v4/ecran-1/fils22-comparer/r6n2/**, work/refonte-frontend/v4/ecran-1/fils22-comparer/captures/r6n2-*.png | r0c-inventaire-controles | controle-commun, MOTS ≤ 80, controle-une-question, controle-acquis, controle-alpha, controle-reprise (D104), captures ouvertes | brasseur | reprise |
| r6nc-critique | défauts vérifiables de r6n1 et r6n2, sans trier ni écarter la diversité (L27 : critique non étalonné) ; les épices ont leur verdict à part (r4d-verdict), pour ne pas faire attendre la suite | jugement | critique | fable | 30 | voies/r6nc-critique/RESULTAT.md | r6n1-reprise-tout, r6n2-reprise-toucher | captures ouvertes ; un REJET doit citer une règle de SPEC ou un défaut de DEFAUTS | pilote | critique |
| r7a-dryhopper | lot 23, Dryhopper, v0 : 8 concepts minimalistes (la représentation qui répond, le geste, une vraie valeur ; fidélité et blocs secondaires en passe 2), approche « le geste d'abord » ; obligatoires : la question de l'outil, son seul facteur libre, y1b comme plancher à enrichir (L07) ; la baseline (y1b et les acquis) obligatoire, un écart acquis par acquis avec sa raison dans la NOTE ; le moment par 5′, x3b en fin de frise et la levure en variantes, à préciser en passe 2 ; le VOIE.md liste les approches des autres séries | conception | concepteur | opus | 120 | work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-a/** | r6r-critique-lot22 | baseline : controle-commun --sans=mots, et les acquis listés dans le VOIE.md (y1b plancher, écart acquis par acquis avec sa raison dans la NOTE) ; v0 : honnêteté, usage au doigt, interdits, question de l'outil obligatoires ; D98, D99, MOTS joués une fois et recopiés dans la NOTE | brasseur | v0 ×8 (2 froide, 6 tiède) |
| r7b-dryhopper | lot 23, Dryhopper, v0 : 8 concepts minimalistes (la représentation qui répond, le geste, une vraie valeur ; fidélité et blocs secondaires en passe 2), approche « la réponse d'abord » ; obligatoires : la question de l'outil, son seul facteur libre, y1b comme plancher à enrichir (L07) ; la baseline (y1b et les acquis) obligatoire, un écart acquis par acquis avec sa raison dans la NOTE ; le moment par 5′, x3b en fin de frise et la levure en variantes, à préciser en passe 2 ; le VOIE.md liste les approches des autres séries | conception | concepteur | opus | 120 | work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-b/** | r6r-critique-lot22 | baseline : controle-commun --sans=mots, et les acquis listés dans le VOIE.md (y1b plancher, écart acquis par acquis avec sa raison dans la NOTE) ; v0 : honnêteté, usage au doigt, interdits, question de l'outil obligatoires ; D98, D99, MOTS joués une fois et recopiés dans la NOTE | brasseur | v0 ×8 (2 froide, 6 tiède) |
| r7c-dryhopper | lot 23, Dryhopper, v0 : 8 concepts minimalistes (la représentation qui répond, le geste, une vraie valeur ; fidélité et blocs secondaires en passe 2), approche « les vraies valeurs d'abord » ; obligatoires : la question de l'outil, son seul facteur libre, y1b comme plancher à enrichir (L07) ; la baseline (y1b et les acquis) obligatoire, un écart acquis par acquis avec sa raison dans la NOTE ; le moment par 5′, x3b en fin de frise et la levure en variantes, à préciser en passe 2 ; le VOIE.md liste les approches des autres séries | conception | concepteur | opus | 120 | work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-c/** | r6r-critique-lot22 | baseline : controle-commun --sans=mots, et les acquis listés dans le VOIE.md (y1b plancher, écart acquis par acquis avec sa raison dans la NOTE) ; v0 : honnêteté, usage au doigt, interdits, question de l'outil obligatoires ; D98, D99, MOTS joués une fois et recopiés dans la NOTE | brasseur | v0 ×8 (2 froide, 6 tiède) |
| r7d-dryhopper | lot 23, Dryhopper, v0 : 8 concepts minimalistes (la représentation qui répond, le geste, une vraie valeur ; fidélité et blocs secondaires en passe 2), approche « le simulateur » ; obligatoires : la question de l'outil, son seul facteur libre, y1b comme plancher à enrichir (L07) ; la baseline (y1b et les acquis) obligatoire, un écart acquis par acquis avec sa raison dans la NOTE ; le moment par 5′, x3b en fin de frise et la levure en variantes, à préciser en passe 2 ; le VOIE.md liste les approches des autres séries | conception | concepteur | opus | 120 | work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-d/** | r6r-critique-lot22 | baseline : controle-commun --sans=mots, et les acquis listés dans le VOIE.md (y1b plancher, écart acquis par acquis avec sa raison dans la NOTE) ; v0 : honnêteté, usage au doigt, interdits, question de l'outil obligatoires ; D98, D99, MOTS joués une fois et recopiés dans la NOTE | brasseur | v0 ×8 (4 tiède, 4 chaude) |
| r7e-dryhopper | lot 23, Dryhopper, v0 : 8 concepts minimalistes (la représentation qui répond, le geste, une vraie valeur ; fidélité et blocs secondaires en passe 2), approche « la frise » ; obligatoires : la question de l'outil, son seul facteur libre, y1b comme plancher à enrichir (L07) ; la baseline (y1b et les acquis) obligatoire, un écart acquis par acquis avec sa raison dans la NOTE ; le moment par 5′, x3b en fin de frise et la levure en variantes, à préciser en passe 2 ; le VOIE.md liste les approches des autres séries | conception | concepteur | opus | 120 | work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-e/** | r6r-critique-lot22 | baseline : controle-commun --sans=mots, et les acquis listés dans le VOIE.md (y1b plancher, écart acquis par acquis avec sa raison dans la NOTE) ; v0 : honnêteté, usage au doigt, interdits, question de l'outil obligatoires ; D98, D99, MOTS joués une fois et recopiés dans la NOTE | brasseur | v0 ×8 (2 froide, 4 tiède, 2 chaude) |
| r7f-dryhopper | lot 23, Dryhopper, v0 : 8 concepts minimalistes (la représentation qui répond, le geste, une vraie valeur ; fidélité et blocs secondaires en passe 2), approche « créatif à fond » ; obligatoires : la question de l'outil, son seul facteur libre, y1b comme plancher à enrichir (L07) ; la baseline (y1b et les acquis) obligatoire, un écart acquis par acquis avec sa raison dans la NOTE ; le moment par 5′, x3b en fin de frise et la levure en variantes, à préciser en passe 2 ; le VOIE.md liste les approches des autres séries | conception | concepteur | fable | 120 | work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-f/** | r6r-critique-lot22 | baseline : controle-commun --sans=mots, et les acquis listés dans le VOIE.md (y1b plancher, écart acquis par acquis avec sa raison dans la NOTE) ; v0 : honnêteté, usage au doigt, interdits, question de l'outil obligatoires ; D98, D99, MOTS joués une fois et recopiés dans la NOTE | brasseur | v0 ×8 (8 chaude) |
| r7g-dryhopper | lot 23, Dryhopper, v0 : 8 concepts minimalistes (la représentation qui répond, le geste, une vraie valeur ; fidélité et blocs secondaires en passe 2), **série libre au brief minimal** (contrepoids M13, la série u du lot 21) : la question de l'outil, l'honnêteté et l'usage au doigt, rien d'autre | conception | concepteur | opus | 120 | work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-g/** | r6r-critique-lot22 | baseline : controle-commun --sans=mots, et les acquis listés dans le VOIE.md (y1b plancher, écart acquis par acquis avec sa raison dans la NOTE) ; v0 : honnêteté, usage au doigt, interdits, question de l'outil obligatoires ; D98, D99, MOTS joués une fois et recopiés dans la NOTE | brasseur | v0 ×8 (8 chaude) |
| r7-tri | tri des 56 concepts de Dryhopper : SYNTHESE en trois sections : `## Classement` (les 56, tout reste montré), `## Candidates` (5, une par approche), `## Greffes` (prises partout, même dans les plus extravagantes) ; aucun REJET de la diversité (L27) | jugement | critique | fable | 30 | work/refonte-frontend/v4/ecran-1/fils23-dryhopper/tri/**, voies/r7-tri/RESULTAT.md | r7a-dryhopper, r7b-dryhopper, r7c-dryhopper, r7d-dryhopper, r7e-dryhopper, r7f-dryhopper, r7g-dryhopper | captures ouvertes ; SYNTHESE (Classement, Candidates, Greffes) ; 5 candidates | pilote | tri |
| r0d-controles-dryhopper | contrôles de la passe 2 de Dryhopper : acquis propres à l'outil (`controle-acquis.mjs --outil=dryhopper` : geste du moment par 5′, x3b réduit en fin de frise, une vraie valeur sourcée, levure en étape ou en pont) ; D98 (b) dans `controle-une-question.mjs` (un seul bouton d'édition par facteur de contexte, ouvert en feuille) ; défaut relevé par r7a et r7e (`data-libre` posé sur le curseur lui-même compte 0 option) ; témoins positifs et négatifs | jugement | auteur | sonnet | 80 | work/refonte-frontend/v4/tournoi/outils/controle-acquis.mjs, work/refonte-frontend/v4/tournoi/outils/controle-une-question.mjs, work/refonte-frontend/v4/tournoi/outils/temoins/dryhopper-*/** | r7-tri | les témoins d'avant restent verts (D98, D99 sur Comparer) ; nouveaux témoins en échec et en réussite | pilote | — |
| r7a2-passe2 | lot 23, passe 2 de a1 (série A), retenue par r7-tri : ses greffes et retouches de la SYNTHESE, tous les contrôles obligatoires (baseline, D98 (b), acquis de Dryhopper, MOTS ≤ 80), avec le picto « épicé » choisi | conception | concepteur (l'agent de r7a, relancé par SendMessage) | opus | 60 | work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-a/passe2/** | r7-tri, r0d-controles-dryhopper | controle-commun, mots-premier-ecran --max=80, controle-une-question, controle-acquis --outil=dryhopper, verifier-page, captures ouvertes | brasseur | passe 2 |
| r7b2-passe2 | lot 23, passe 2 de b4 (série B), retenue par r7-tri : ses greffes et retouches de la SYNTHESE, tous les contrôles obligatoires (baseline, D98 (b), acquis de Dryhopper, MOTS ≤ 80), avec le picto « épicé » choisi | conception | concepteur (l'agent de r7b, relancé par SendMessage) | opus | 60 | work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-b/passe2/** | r7-tri, r0d-controles-dryhopper | controle-commun, mots-premier-ecran --max=80, controle-une-question, controle-acquis --outil=dryhopper, verifier-page, captures ouvertes | brasseur | passe 2 |
| r7d2-passe2 | lot 23, passe 2 de d8 (série D), retenue par r7-tri : ses greffes et retouches de la SYNTHESE, tous les contrôles obligatoires (baseline, D98 (b), acquis de Dryhopper, MOTS ≤ 80), avec le picto « épicé » choisi | conception | concepteur (l'agent de r7d, relancé par SendMessage) | opus | 60 | work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-d/passe2/** | r7-tri, r0d-controles-dryhopper | controle-commun, mots-premier-ecran --max=80, controle-une-question, controle-acquis --outil=dryhopper, verifier-page, captures ouvertes | brasseur | passe 2 |
| r7e2-passe2 | lot 23, passe 2 de e5 (série E), retenue par r7-tri : ses greffes et retouches de la SYNTHESE, tous les contrôles obligatoires (baseline, D98 (b), acquis de Dryhopper, MOTS ≤ 80), avec le picto « épicé » choisi | conception | concepteur (l'agent de r7e, relancé par SendMessage) | opus | 60 | work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-e/passe2/** | r7-tri, r0d-controles-dryhopper | controle-commun, mots-premier-ecran --max=80, controle-une-question, controle-acquis --outil=dryhopper, verifier-page, captures ouvertes | brasseur | passe 2 |
| r7g2-passe2 | lot 23, passe 2 de g1 (série G), retenue par r7-tri : ses greffes et retouches de la SYNTHESE, tous les contrôles obligatoires (baseline, D98 (b), acquis de Dryhopper, MOTS ≤ 80), avec le picto « épicé » choisi | conception | concepteur (l'agent de r7g, relancé par SendMessage) | opus | 60 | work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-g/passe2/** | r7-tri, r0d-controles-dryhopper | controle-commun, mots-premier-ecran --max=80, controle-une-question, controle-acquis --outil=dryhopper, verifier-page, captures ouvertes | brasseur | passe 2 |
| r7-verdict | après la passe 2 : reclasser les 5 candidates, regreffer, verdict satisfaisant (aucun REJET, contrôles verts, phrase prédite positive) ou passe 3 ; 4 passes au plus, arrêt sans gain | jugement | critique | fable | 30 | voies/r7-verdict/RESULTAT.md | r7a2-passe2, r7b2-passe2, r7d2-passe2, r7e2-passe2, r7g2-passe2 | captures ouvertes ; verdict au format du rejeu | pilote | verdict |
| r7a3-passe3 | lot 23, passe 3 de a1 : sans vide (remplissage 0,41 en passe 2, contre 0,72 pour r6n2 ; M14), les greffes pour remplir, pas du texte | conception | concepteur (l'agent de r7a, relancé par SendMessage) | opus | 60 | work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-a/passe3/** | r7-verdict | les critères de la passe 2, plus controle-panel (premier écran à 0,55 au moins) | brasseur | passe 3 |
| r7b3-passe3 | lot 23, passe 3 de b4 : sans vide (remplissage 0,35 en passe 2, contre 0,72 pour r6n2 ; M14), les greffes pour remplir, pas du texte | conception | concepteur (l'agent de r7b, relancé par SendMessage) | opus | 60 | work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-b/passe3/** | r7-verdict | les critères de la passe 2, plus controle-panel (premier écran à 0,55 au moins) | brasseur | passe 3 |
| r7d3-passe3 | lot 23, passe 3 de d8 : sans vide (remplissage 0,52 environ en passe 2, contre 0,72 pour r6n2 ; M14), les greffes pour remplir, pas du texte | conception | concepteur (l'agent de r7d, relancé par SendMessage) | opus | 60 | work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-d/passe3/** | r7-verdict | les critères de la passe 2, plus controle-panel (premier écran à 0,55 au moins) | brasseur | passe 3 |
| r7e3-passe3 | lot 23, passe 3 de e5 : sans vide (remplissage 0,39 en passe 2, contre 0,72 pour r6n2 ; M14), les greffes pour remplir, pas du texte | conception | concepteur (l'agent de r7e, relancé par SendMessage) | opus | 60 | work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-e/passe3/** | r7-verdict | les critères de la passe 2, plus controle-panel (premier écran à 0,55 au moins) | brasseur | passe 3 |
| r7-verdict3 | après la passe 3 : niveau d'abord (densité, idées), puis défauts ; satisfaisant ou passe 4 | jugement | critique | fable | 30 | voies/r7-verdict3/RESULTAT.md | r7a3-passe3, r7b3-passe3, r7d3-passe3, r7e3-passe3 | captures ouvertes ; verdict au format du rejeu | pilote | verdict |
| r6n1-passe2 | r6n1 corrigée des défauts de r6nc (le « 10′ » au premier plan, chevrons du radar, « Tire 20 » sur les barres, pont Levure muet, signes sans mot), avec le picto « épicé » choisi | conception | concepteur (l'agent de r6n1, relancé par SendMessage) | opus | 60 | work/refonte-frontend/v4/ecran-1/fils22-comparer/r6n1/**, work/refonte-frontend/v4/ecran-1/fils22-comparer/captures/r6n1-*.png | r6nc-critique | les critères de r6n1, rejoués | brasseur | passe 2 |
| r6n2-passe2 | r6n2 corrigée des défauts de r6nc (4ᵉ colonne qui coupe les noms, aperçus Souche et Frise vides), avec le picto « épicé » choisi | conception | concepteur (l'agent de r6n2, relancé par SendMessage) | opus | 60 | work/refonte-frontend/v4/ecran-1/fils22-comparer/r6n2/**, work/refonte-frontend/v4/ecran-1/fils22-comparer/captures/r6n2-*.png | r6nc-critique | les critères de r6n2, rejoués | brasseur | passe 2 |
| r6nc2-critique | après la passe 2 de r6n1 et r6n2 : défauts restants, verdict satisfaisant ou passe 3, sans trier (L27) | jugement | critique | fable | 30 | voies/r6nc2-critique/RESULTAT.md | r6n1-passe2, r6n2-passe2 | captures ouvertes ; un REJET cite une règle | pilote | verdict |
| r6p1-nettoyee | variante de r6n2, « r6n2 nettoyée » (chaleur froide) : r6n2 avec les meilleures idées retenues (restes des critiques, r6n1, greffes de Dryhopper) | conception | concepteur | opus | 120 | work/refonte-frontend/v4/ecran-1/fils22-comparer/r6p1/**, work/refonte-frontend/v4/ecran-1/fils22-comparer/captures/r6p1-*.png | r6nc2-critique | controle-commun, MOTS ≤ 80, controle-une-question, controle-acquis, controle-alpha, controle-reprise (D104), verifier-page, captures ouvertes | brasseur | reprise |
| r6p2-reponse | variante de r6n2, « La réponse d'abord » (chaleur tiède) : r6n2 avec les meilleures idées retenues (restes des critiques, r6n1, greffes de Dryhopper) | conception | concepteur | opus | 120 | work/refonte-frontend/v4/ecran-1/fils22-comparer/r6p2/**, work/refonte-frontend/v4/ecran-1/fils22-comparer/captures/r6p2-*.png | r6nc2-critique | controle-commun, MOTS ≤ 80, controle-une-question, controle-acquis, controle-alpha, controle-reprise (D104), verifier-page, captures ouvertes | brasseur | reprise |
| r6p3-defi | variante de r6n2, « Ton défi au premier écran » (chaleur tiède) : r6n2 avec les meilleures idées retenues (restes des critiques, r6n1, greffes de Dryhopper) | conception | concepteur | opus | 120 | work/refonte-frontend/v4/ecran-1/fils22-comparer/r6p3/**, work/refonte-frontend/v4/ecran-1/fils22-comparer/captures/r6p3-*.png | r6nc2-critique | controle-commun, MOTS ≤ 80, controle-une-question, controle-acquis, controle-alpha, controle-reprise (D104), verifier-page, captures ouvertes | brasseur | reprise |
| r6p4-gagne-paie | variante de r6n2, « On gagne, on paie » (chaleur chaude) : r6n2 avec les meilleures idées retenues (restes des critiques, r6n1, greffes de Dryhopper) | conception | concepteur | opus | 120 | work/refonte-frontend/v4/ecran-1/fils22-comparer/r6p4/**, work/refonte-frontend/v4/ecran-1/fils22-comparer/captures/r6p4-*.png | r6nc2-critique | controle-commun, MOTS ≤ 80, controle-une-question, controle-acquis, controle-alpha, controle-reprise (D104), verifier-page, captures ouvertes | brasseur | reprise |
| r6pc-critique | défauts vérifiables de r6p1 à r6p4, sans trier (L27) | jugement | critique | fable | 30 | voies/r6pc-critique/RESULTAT.md | r6p1-nettoyee, r6p2-reponse, r6p3-defi, r6p4-gagne-paie | captures ouvertes ; un REJET cite une règle | pilote | verdict |
| r6pc2-critique | contre-visite de r6p2 après la correction du chevauchement (D56) relevé par r6pc | jugement | critique | fable | 15 | voies/r6pc2-critique/RESULTAT.md | r6p2-reponse | captures de l'état corrigé ouvertes | pilote | verdict |

## Historique : « épicé » en entonnoir, clos par son choix (23.10)
Six séries v0 faites (48 propositions, dont 32 épices réelles), publiées sur la page ; le brasseur a choisi f1 le
23.10 avant le tri. Le tri, les passes 2 et le verdict n'ont pas tourné : leurs contrats sont rangés dans
`voies-ecartees/`, hors du rejeu. Les lignes du plan, telles qu'elles étaient :

| Voie | Objectif | Niveau | Agent | Modèle | Plafond | Possède | Dépend de | Contrôles | Décideur | Étape |
|---|---|---|---|---|---|---|---|---|---|---|
| r4d-a-douce | « épicé », v0 : 8 propositions, angle A, l'épice douce vue autrement : cannelle roulée vue de bout, gousse de vanille fendue (sa piste du lot 15), muscade, cardamome, fève tonka… | conception | concepteur | opus | 120 | work/refonte-frontend/v4/ecran-1/fils22-picto-epice-3/serie-a/v0/** | r0c-inventaire-controles | baseline : controle-pictos-trait (grammaire des pictos : trait, viewBox 24, ton Épicé, symboles pris) ; controle-planche-picto --ter --genres=2 --nombre=8-8 --voisins=herbal,green (D101 ter), controle-pictos-trait, verifier-page, captures ouvertes | brasseur | v0 ×8 (2 froide, 6 tiède) |
| r4d-b-sensation | « épicé », v0 : 8 propositions, angle B, la sensation : chaleur, picotement, parfum qui monte (sans flamme, déjà prise) | conception | concepteur | opus | 120 | work/refonte-frontend/v4/ecran-1/fils22-picto-epice-3/serie-b/v0/** | r0c-inventaire-controles | baseline : controle-pictos-trait (grammaire des pictos : trait, viewBox 24, ton Épicé, symboles pris) ; controle-planche-picto --ter --genres=2 --nombre=8-8 --voisins=herbal,green (D101 ter), controle-pictos-trait, verifier-page, captures ouvertes | brasseur | v0 ×8 (8 chaude) |
| r4d-c-signe | « épicé », v0 : 8 propositions, angle C, le signe : lettre, monogramme, géométrique | conception | concepteur | opus | 120 | work/refonte-frontend/v4/ecran-1/fils22-picto-epice-3/serie-c/v0/** | r0c-inventaire-controles | baseline : controle-pictos-trait (grammaire des pictos : trait, viewBox 24, ton Épicé, symboles pris) ; controle-planche-picto --ter --genres=2 --nombre=8-8 --voisins=herbal,green (D101 ter), controle-pictos-trait, verifier-page, captures ouvertes | brasseur | v0 ×8 (8 tiède) |
| r4d-d-libre | « épicé », v0 : 8 propositions, angle D, « créatif à fond », libre, brief minimal | conception | concepteur | fable | 120 | work/refonte-frontend/v4/ecran-1/fils22-picto-epice-3/serie-d/v0/** | r0c-inventaire-controles | baseline : controle-pictos-trait (grammaire des pictos : trait, viewBox 24, ton Épicé, symboles pris) ; controle-planche-picto --ter --genres=2 --nombre=8-8 --voisins=herbal,green (D101 ter), controle-pictos-trait, verifier-page, captures ouvertes | brasseur | v0 ×8 (8 chaude) |
| r4d-e-metaphore | « épicé », v0 : 8 propositions, angle E, l'épice entière au trait : huit épices réelles du houblon, une par proposition, hors celles de A (badiane, muscade, anis vert, réglisse, genièvre, carvi, coriandre, tonka…) ; D101 quater | conception | concepteur | opus | 120 | work/refonte-frontend/v4/ecran-1/fils22-picto-epice-3/serie-e/v0/** | r0c-inventaire-controles | baseline : controle-pictos-trait (grammaire des pictos : trait, viewBox 24, ton Épicé, symboles pris) ; controle-planche-picto --ter --genres=2 --nombre=8-8 --voisins=herbal,green (D101 ter), --epices=8, verifier-page, captures ouvertes | brasseur | v0 ×8 (8 tiède) |
| r4d-f-greffe | « épicé », v0 : 8 propositions, angle F, l'épice réelle cadrée librement : cannelle, vanille et clou de girofle (ses trois mots) et d'autres épices réelles, en gros plan, coupe, tas ou croisées ; D101 quater | conception | concepteur | opus | 120 | work/refonte-frontend/v4/ecran-1/fils22-picto-epice-3/serie-f/v0/** | r0c-inventaire-controles | baseline : controle-pictos-trait (grammaire des pictos : trait, viewBox 24, ton Épicé, symboles pris) ; controle-planche-picto --ter --genres=2 --nombre=8-8 --voisins=herbal,green (D101 ter), --epices=8, verifier-page, captures ouvertes | brasseur | v0 ×8 (8 chaude) |
| r4d-tri | tri des 48 propositions « épicé » : un fichier par série, puis SYNTHESE en trois sections : `## Classement` (les 48, une proposition de rang, tout reste montré), `## Candidates` (8, toutes des épices réelles, 6 épices différentes dont cannelle, vanille et clou de girofle, venues de 3 séries au moins ; D101 quater), `## Greffes` (prises partout, même dans les plus extravagantes) ; aucun REJET (L27) | jugement | critique | fable | 30 | work/refonte-frontend/v4/ecran-1/fils22-picto-epice-3/tri/**, voies/r4d-tri/RESULTAT.md | r4d-a-douce, r4d-b-sensation, r4d-c-signe, r4d-d-libre, r4d-e-metaphore, r4d-f-greffe | captures ouvertes ; SYNTHESE (Classement, Candidates, Greffes) ; 8 candidates en épices réelles, 6 épices, sans REJET | pilote | tri |
| r4d-a2-passe2 | « épicé », passe 2 de la série A : ses candidates retenues au tri, améliorées avec leurs greffes, à 12, 16 et 24 px et sur de vraies cartes | conception | concepteur (l'agent de r4d-a, relancé par SendMessage) | opus | 40 | work/refonte-frontend/v4/ecran-1/fils22-picto-epice-3/serie-a/passe2/** | r4d-tri | controle-planche-picto --ter (sur ses candidates), controle-pictos-trait, verifier-page, captures ouvertes | brasseur | passe 2 |
| r4d-d2-passe2 | « épicé », passe 2 de la série D : ses candidates retenues au tri, améliorées avec leurs greffes, à 12, 16 et 24 px et sur de vraies cartes | conception | concepteur (l'agent de r4d-d, relancé par SendMessage) | fable | 40 | work/refonte-frontend/v4/ecran-1/fils22-picto-epice-3/serie-d/passe2/** | r4d-tri | controle-planche-picto --ter (sur ses candidates), controle-pictos-trait, verifier-page, captures ouvertes | brasseur | passe 2 |
| r4d-e2-passe2 | « épicé », passe 2 de la série E : ses candidates retenues au tri, améliorées avec leurs greffes, à 12, 16 et 24 px et sur de vraies cartes ; le critique reclasse ensuite (r6nc), passe 3 si ce n'est pas satisfaisant | conception | concepteur (l'agent de la série, relancé par SendMessage) | opus | 40 | work/refonte-frontend/v4/ecran-1/fils22-picto-epice-3/serie-e/passe2/** | r4d-tri | controle-planche-picto --ter (sur ses candidates), controle-pictos-trait, verifier-page, captures ouvertes | brasseur | passe 2 |
| r4d-f2-passe2 | « épicé », passe 2 de la série F : ses candidates retenues au tri, améliorées avec leurs greffes, à 12, 16 et 24 px et sur de vraies cartes ; le critique reclasse ensuite (r6nc), passe 3 si ce n'est pas satisfaisant | conception | concepteur (l'agent de la série, relancé par SendMessage) | opus | 40 | work/refonte-frontend/v4/ecran-1/fils22-picto-epice-3/serie-f/passe2/** | r4d-tri | controle-planche-picto --ter (sur ses candidates), controle-pictos-trait, verifier-page, captures ouvertes | brasseur | passe 2 |
| r4d-verdict | verdict sur les épices améliorées : reclasser, regreffer, satisfaisant (aucun REJET, contrôles verts, phrase prédite positive) ou passe 3 ; 4 passes au plus, arrêt sans gain | jugement | critique | fable | 30 | voies/r4d-verdict/RESULTAT.md | r4d-a2-passe2, r4d-d2-passe2, r4d-e2-passe2, r4d-f2-passe2 | captures ouvertes ; verdict au format ; ensemble : 8 propositions, 6 épices réelles | pilote | verdict |

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
  - puis, en parallèle, r6n1-reprise-tout, r6n2-reprise-toucher (r6n coupée en deux voies par le
    pilote : deux maquettes indépendantes, en même temps) et les quatre séries « épicé » r4d-a à r4d-d ;
  - **« épicé » en entonnoir** (22.10, après « J'ai l'impression que la manière de faire pour les mini
    maquettes dry hopping de base avec les 44 variante puis les 5 meilleures était vraiment plus
    qualitatif. Regarde pour améliorer ça », relayé par la session de supervision ; M13) : v0 de
    32 propositions en quatre séries de 8, chacune avec son angle et son agent (A, B, C en Opus ; D en
    Fable, « créatif à fond ») ; r4d-tri (critique) retient 8 candidates, au moins une par série, 6 genres,
    cannelle et vanille comprises, sans REJET ; passe 2 par les mêmes agents (SendMessage), une voie par
    série. Un seul auteur convergeait : sept épices-objets en r4, trois piments en r4c ;
  - **« Pas attendre sur les épices pour faire la suite »** (l'utilisateur, 22.10, nuit, relayé par la session de
    supervision) : r6nc-critique ne juge plus que r6n1 et r6n2 ; les épices ont leur verdict à part (r4d-verdict,
    après leurs passes 2) ; la version 3 de la page sort dès que r6n et r6nc sont prêts, et les épices auront leur
    mise à jour de la page ensuite ;
  - **« Je veux un forme qui représente vraiment ce que c'est, genre canellle vanille, ou clou de girofle ect... »**
    (le brasseur, même nuit ; D101 quater) : les séries E et F dessinent des épices réelles ; le tri ne retient que
    des épices réelles (B, la sensation, et C, le signe, restent classées et montrées, sans passe 2) ;
  - publication par le pilote : page « Lot 22 houblons », même adresse, version 3. Source de la page :
    `work/refonte-frontend/v4/outils/page-lot/index.html`. Elle passe `verifier-page.mjs` avant publication (PAGE OK).
- **Lot 23, Dryhopper, lancé sans attendre** (22.10, nuit ; L24 : il ne dépend que de r6r, fini) : 56 concepts
  minimalistes en sept séries de 8 (r7a à r7g, chaleur déclarée, baseline obligatoire, r7f en Fable « créatif à
  fond », r7g libre au brief minimal), puis r7-tri (Classement, 5 Candidates, Greffes), passes 2, 3… jusqu'au
  satisfaisant, chaque passe publiée. r3-descripteurs, après le choix A ou B ; A et B sont portés en variantes par r7.

## Retour du brasseur sur le lot 22 (22.10, soir)
- r6a choisie : « r6a est le meilleur mais reprendre trop peu d'éléments que j'avais noté bon ou intéressant des autres variante, notamment la meilleure » ; reprise en r6n (D104).
- r6c écartée : non retenue par le brasseur, qui a choisi r6a.
- r6d écartée : non retenue par le brasseur, qui a choisi r6a.
- r6f écartée : non retenue par le brasseur, qui a choisi r6a ; ses cartes sont à reprendre si l'inventaire les liste.
- r6g écartée : non retenue par le brasseur, qui a choisi r6a.
- r6k écartée : non retenue par le brasseur, qui a choisi r6a.
- Picto r4c refusé : « Les icônes épices ??? Il y a que 3 variante, qui sont toutes quasiment identique ??? » ; « Des vrais proposition surtout que un piment n'a rien à voir la dedans... » (D101 ter) ; refait en r4d.

## Retour du brasseur, 23.10 (matin)
- f1-croises choisie : « Mon Picto préféré est cannelley clou croisé. Ça doit être changé dans la baseline ». Mis dans la baseline par la session de supervision (commit 2353e356, symbole `p-spice` de la planche standard).
- r4d-tri écartée : picto choisi le 23.10 (f1-croises).
- r4d-a2-passe2 écartée : picto choisi le 23.10 (f1-croises).
- r4d-d2-passe2 écartée : picto choisi le 23.10 (f1-croises).
- r4d-e2-passe2 écartée : picto choisi le 23.10 (f1-croises).
- r4d-f2-passe2 écartée : picto choisi le 23.10 (f1-croises) ; pas de reprise à 12 px : son rendu est vérifié de 12 à 48 px dans la baseline, et une retouche changerait ce qu'il a choisi.
- r4d-verdict écartée : picto choisi le 23.10 (f1-croises).
- Sur la page : « ??? Je les vois pas dans les artefacts ? ». Les 56 concepts de Dryhopper, finis à 0 h 30, n'étaient pas publiés et la page disait « classement en cours » (faute du pilote, arrêté à 95 % de la fenêtre sans mettre la page à jour). Publiés par la session de supervision (versions 5 et 6) ; règle M13 : une série rendue se publie sans attendre le tri.

## Retour du brasseur, 23.10 (fin de matinée)
- r6n2 choisie : « Fais mois quelques variantes de r6n2, avec les meilleures idées retenu. Et ensuite on sera bon ». Quatre variantes (r6p1 à r6p4), une chaleur chacune, puis le critique r6pc ; dernière ronde de Comparer.

## Retour du brasseur, 23.10 (après-midi)
- r6a choisie : « r6a reste le meilleur, tu peux ajouter ça, dans la vue interactive. Avec les quelques petites améliorations des autres versions ». Les variantes r6n2 et r6p1 à r6p4 ne sont pas retenues ; leurs petites améliorations entrent dans r6a, dans la maquette jouable (`work/missions/2026-10-23-maquette-parcours/`, voie p3-comparer).

## Pages
Une version, un artefact (`work/refonte-frontend/v4/outils/pages/PUBLIER.md`). L'ancienne page « Lot 22 houblons » (versions 1 à 11) reste l'archive.

| Sujet | Version | Adresse | Source |
|---|---|---|---|
| Lot 22 (archive) | versions 1 à 11 ; 22-23.10 | https://claude.ai/artifact/GzpfxNeKZLKXfkg4pz9kzv | `work/refonte-frontend/v4/outils/page-lot/index.html` |
| Comparer | r6n2 et r6p1 à r6p4 ; 23.10 | https://claude.ai/artifact/BRA2ufdNe3DshNfzBxB3g4 | `work/refonte-frontend/v4/outils/pages/2026-10-23-comparer/index.html` |
| Dryhopper | passes 2 et 3 (a1, b4, d8, e5, g1) ; 23.10 | https://claude.ai/artifact/HjWdF2rgUHDzY3QpgMWVV8 | `work/refonte-frontend/v4/outils/pages/2026-10-23-dryhopper/index.html` |
| Carte des outils | Substituer et Levure, choix ouverts ; 22.10 | https://claude.ai/artifact/9FrNPBUDv7ABeo5CsSFW7g | `work/refonte-frontend/v4/outils/pages/2026-10-22-carte/index.html` |
| Dryhopper | 56 concepts v0, classés ; 23.10 | https://claude.ai/artifact/HexW2XmnU4iUbJaRcPJNzW | `work/refonte-frontend/v4/outils/pages/2026-10-23-dryhopper-v0/index.html` |

Le 23.10, après-midi : « Je les vois pas dans les artefacts.. ». Les variantes étaient en ligne, mais au milieu de la page cumulée, sous un en-tête resté à « r6n1 ou r6n2 ». Elles ont chacune leur page datée.

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
Vague 3 bis (22.10, ~22 h 45) : r0c lancée à 89 % de la fenêtre de 5 h (remise à zéro à 23 h), semaine
à 18 %, Fable 6 % ; contexte du pilote 225 k.
Nouvelle fenêtre (23 h, remise à 4 h) : r6n1, r6n2 et les séries r4d A à D lancées à 1 % ; E et F, r6nc et les
sept séries r7 lancées vers 32 à 35 % ; 55 % à 23 h 45 avec neuf agents en vol. Arbitrage du pilote (23 h 45) : finir
les v0 de r7 et des épices, puis r7-tri si la marge le permet ; la passe de correction de r6n1 et r6n2 (défauts de
r6nc), r4d-tri et les passes des épices passent à la fenêtre suivante si la fenêtre dépasse 85 %.
**Page publiée** (22.10, ~23 h 45) : version 3 de https://claude.ai/artifact/GzpfxNeKZLKXfkg4pz9kzv (r6n1, r6n2, les
37 éléments notés, la carte des outils ; épices et Dryhopper annoncés en cours), PAGE OK et captures regardées.
Plafonds par voie dans la table. Arrêt vers 95 % de la fenêtre de 5 h. L18 plafonne les agents et leurs tours, pas les
variantes : un agent par série de 3 à 8 variantes, et non un par variante (M13 ; le lot 22 a donné 12 variantes
en 12 agents, sans passe d'amélioration, contre 41 en 11 agents au lot 21).

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

### Vague 3 bis (22.10, soir → 23.10, 0 h 50) : la reprise de r6a, l'« épicé » et Dryhopper en entonnoir
Rejeu du pilote, `node scripts/agents/systeme.mjs voies work/missions/2026-10-22-reprise-lot21 --approuver` :
`VOIES ECHEC 42/48`. Toutes les voies lancées sont OK. Les six en échec n'ont pas encore tourné : r4d-tri,
r4d-a2, r4d-d2, r4d-e2 et r4d-f2 (passes 2), r4d-verdict. Elles sont reportées à la fenêtre suivante, faute de
budget (« manque RESULTAT.md »).
- **Voies faites** :
  - r0c : inventaire de 37 éléments notés, D104 et D101 ter, témoins en échec sur r6a et r4c ;
  - r6n1 et r6n2 : 10 critères sur 10 chacune ; REPRISE 27 repris, 2 en contexte, 8 en pont, 0 écarté ;
  - r6nc (Fable) : les deux acceptées, avec 5 et 4 défauts vérifiables ;
  - épices, six séries v0 : 48 propositions, dont 32 épices réelles ;
  - Dryhopper, sept séries v0 : 56 concepts ;
  - r7-tri : 5 candidates (g1, e5, b4, a1, d8) ; les idées de C et F passent en greffes.
- **Méthode changée en cours de vague** (mots de l'utilisateur, relayés par la session de supervision) :
  - l'entonnoir (M13) ;
  - la chaleur, la baseline obligatoire, 48 concepts en 6 séries ;
  - « Pas attendre sur les épices pour faire la suite » : r6nc découplée des épices, r4d-verdict créée, r7
    lancé tout de suite.
  - Parole du brasseur : « Je veux un forme qui représente vraiment ce que c'est, genre canellle vanille, ou
    clou de girofle ect... » (SPEC ; D101 quater, `--epices=N`). Les séries E et F sont orientées vers les
    épices réelles, et D vers les épices réelles en cours de route.
- **Décisions du pilote** :
  - r6n coupée en deux voies ;
  - 8 candidates « épicé » et non 6 (« au moins 8 ») ;
  - B et C sans passe 2 (D101 quater) ;
  - girofle, badiane et coriandre sortent des idées refusées (leurs dessins de r4 restent refusés) ;
  - Substituer reste hors de Comparer (option (b) de r0c, choix ouvert sur la carte) ;
  - D99 ne vaut pas tel quel pour Dryhopper : une liste d'acquis propre sera écrite avant sa passe 2 ;
  - le G1 des séries r7 est coupé en deux, à cause du délai de 120 s de gate-check.
- **Publication** : https://claude.ai/artifact/GzpfxNeKZLKXfkg4pz9kzv, PAGE OK et captures regardées.
  - Version 3 : r6n1, r6n2, le tableau des 37 éléments, la carte.
  - Version 4 : les 48 propositions « épicé », épices réelles d'abord.
- **Pilote** : ma chaîne de remplacement contenait « $` », et String.replace a dupliqué LECONS.md (L26).
  Réparé par indices ; L26 le note.
- **Leçons** :
  - L26 : un nom par rôle, globales JS dans une fonction immédiate ;
  - M07 : calculer l'écart d'un aperçu avant de le dessiner ;
  - M09 : la lisibilité en vrais pixels, `--ter` et `--epices`.
  Les leçons proposées sur la loupe (A, D, E, F) vont dans M09 et `pictos-familles` ; celle de r0c est
  couverte par L17 ; celle de r7g et le délai de gate-check vont dans `poste-windows-msix`.
- **Notes** :
  - `dryhop-moment` (nouvelle) : le dry hop actif, meilleur compromis ; la grille sature à 2 j ;
  - `pictos-familles` : ce qui se lit à 12 px ;
  - `acquis-valides` : l'inventaire D104.
- **Budget** : fenêtre de 5 h de 1 % (23 h) à 95 % (0 h 30) ; arrêt. Semaine à 34 %, Fable 21 %.
- **Reste, fenêtre suivante (remise à 4 h)** :
  - r4d-tri, puis les passes 2 des épices (A, D, E, F) et r4d-verdict ;
  - les passes 2 de Dryhopper, une voie par candidate (g1, e5, b4, a1, d8), avec avant cela :
    - la liste d'acquis de Dryhopper ;
    - D98 (b) ;
    - le défaut de D98 relevé par r7a et r7e (`data-libre` sur le curseur lui-même compte 0 option) ;
  - la correction de r6n1 et r6n2 (défauts de r6nc) ;
  - le contrôle D103 à écrire.
- **Au brasseur** :
  - r6n1 ou r6n2 ;
  - Substituer et Levure (carte) ;
  - descripteurs A ou B ;
  - la visée des objectifs (« un cran », proposée par r6n1) ;
  - la couleur de Nelson Sauvin ;
  - l'IBU de la recette à ajouter aux entrées.
- **À l'utilisateur** : push et PR de la branche.

### 23.10 : son choix d'épicé, les passes, et les variantes de r6n2
Rejeu du pilote, `node scripts/agents/systeme.mjs voies work/missions/2026-10-22-reprise-lot21 --approuver` : `VOIES OK 63/63` (toutes les voies, de r0 aux variantes de r6n2).

**Ses mots du jour** (dans SPEC) :
- « Mon Picto préféré est cannelley clou croisé. Ça doit être changé dans la baseline ». f1 est mis dans la baseline par
  la session de supervision ; le tri, les passes et le verdict des épices sont écartés et rangés dans `voies-ecartees/` ;
- « ??? Je les vois pas dans les artefacts ? » : faute du pilote, qui s'est arrêté à 95 % de la fenêtre sans publier les
  56 concepts de Dryhopper. Ils ont été publiés par la supervision ; règle M13 : une série rendue se publie sans attendre ;
- « J'ai l'impression que les mini maquettes sont vraiment moins quali mais que r6n2 donne vraiment bien... Les icônes
  aussi était un peu cata [...] trop focus sur mes exemple » : M14 et `controle-panel.mjs`, par la supervision. Mes briefs
  E et F en sont la cause (ses exemples au lieu d'un panel large) ;
- « Fais mois quelques variantes de r6n2, avec les meilleures idées retenu. Et ensuite on sera bon ».

**Voies** :
- r0d (Sonnet) : `controle-acquis --outil=dryhopper`, D98 (b) `--edition`, `data-libre` sur le curseur ; 13 critères, 14 témoins ;
- r6n1 et r6n2, passe 2 (défauts de r6nc) ; r6nc2 : satisfaisant. D71 corrigé par le pilote dans le noyau partagé
  (`l8g/noyau.mjs` : « 1 seule fiche : <source> ») ;
- Dryhopper, passes 2 des cinq candidates (a1, b4, d8, e5, g1) ; r7-verdict : satisfaisant, mais `controle-panel` met b4,
  e5, a1 et d8 sous 0,55 de remplissage (le critique n'est pas étalonné, L27) ; passes 3 sans vide : a1 0,41 → 0,64,
  b4 0,35 → 0,65, d8 0,52 → 0,62, e5 0,39 → 0,61 ; r7-verdict3 : satisfaisant ;
- variantes de r6n2 : r6p1 (nettoyée), r6p2 (la réponse d'abord), r6p3 (son défi au premier écran), r6p4 (on gagne / on
  paie), toutes à la densité de r6n2 (0,70 à 0,72) ; r6pc : r6p1, r6p3, r6p4 acceptées, r6p2 rejetée pour un
  chevauchement (D56), corrigée par son agent ; r6pc2 : acceptée.

**Page** : https://claude.ai/artifact/GzpfxNeKZLKXfkg4pz9kzv, versions 7 à 11 (r6n passes 2, Dryhopper passes 2 et
3 avec les avis du critique, r6n2 et ses quatre variantes en tête de Comparer). PAGE OK à chaque version, captures regardées.

**Leçons** : L26 revenue quatre fois (classes qui servent à deux rôles), notée « à mécaniser » ; les autres proposées
(émoji jaune, hachure à sens unique, pont nommé depuis les données) sont des défauts de produit, signalés ci-dessous.

**Reste** :
- au brasseur : choisir parmi r6n2 et r6p1 à r6p4 ; Dryhopper parmi les cinq ; la carte (Substituer, Levure) ;
  descripteurs A ou B ; la visée des objectifs ; la couleur de Nelson Sauvin ;
- à mécaniser : L26 (une classe pour deux rôles) ; la hachure réservée à l'inconnu (quatre candidates de Dryhopper lui
  ont donné un autre sens, r7-verdict) ; pas d'émoji en couleur (D33, r7b2) ;
- étalonnage du critique (portrait v2, 88 % et 75 %, commit 2cdfa108) : ses prédictions sur r6p1 à r6p4 et sur a1, b4, d8, e5 sont dans les RESULTAT.md de r6pc, r6pc2 et r7-verdict3 ; le verdict du brasseur sur ces écrans entre dans `work/refonte-frontend/v4/etalonnage/jeu.json`, pour les comparer ;
- à l'utilisateur : push et PR.
