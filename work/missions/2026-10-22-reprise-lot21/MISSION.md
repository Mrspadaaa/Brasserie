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

« Fini » pour cette mission : le brasseur a vu la page de la carte, la planche du picto et les
options des descripteurs, et il a répondu aux questions fermées. Ensuite seulement le lot 22
(Comparer seul) part, avec les contrôles écrits avant lui. Aucun code de l'app avant la porte B (#119).

## Décisions
| Décision | Options | Décideur | État |
|---|---|---|---|
| Carte des outils | verdict du conseil : un facteur libre par écran ; Suggérer, Comparer, Dryhopper, Levure depuis Ma bière | brasseur | ouverte : page de r1 à lui montrer |
| Radar de Comparer | r2 ; r3 (lot 16) | brasseur | ouverte, bloque r6 |
| Base de comparaison | dose égale ; effet égal sur l'arôme visé ; IBU égal | brasseur | ouverte, bloque r6 |
| Substituer | porte vers Comparer avec X épinglé ; outil propre (u4) | brasseur | ouverte |
| Levure | dernière étape de Dryhopper ; outil propre | brasseur | ouverte, bloque r7 |
| Descripteurs hors familles, présentation | A : gooseberry et « groseille à maquereau » rangés dans Petits fruits ; B : part « autres » visible, plafonnée, mots génériques écartés (recommandé : A puis B ; [[descripteurs-hors-familles]]) | brasseur | ouverte, bloque r3 ; à lui demander aussi la liste des mots génériques, le seuil et le plafond |
| Descripteurs hors familles, moteur | C : partager la force avec « autres » (profil-simule.ts:283), seulement avec B | conseil | ouverte, après B vu sur la fiche du lot 22 (mode rapide) |
| Picto « épicé » | planche de r4 | brasseur | ouverte |
| Repli de calcul (dry hop et biotransformation seulement si trop lourd) | garder ; lever | pilote | après la mesure de r2 (L20) ; garde le repli jusque-là |
| Mise à jour de la page des fils de fer (artefact privé) | — | pilote | à chaque lot montré, page à jour seulement |
| Push de la branche, PR | — | utilisateur | groupé, non bloquant |

## Voies
| Voie | Objectif | Niveau | Agent | Modèle | Plafond | Possède | Dépend de | Contrôles | Décideur |
|---|---|---|---|---|---|---|---|---|---|
| r0-controles | contrôles L10 (un seul groupe de sélecteurs libres, éléments admis par outil), L06 (radar, chimie, panel OSU, vraies valeurs présents) et L14 (part sans famille visible et plafonnée), chacun avec témoin négatif | jugement | auteur | sonnet | 80 | work/refonte-frontend/v4/tournoi/outils/controle-une-question.mjs, controle-acquis.mjs, controle-sans-famille.mjs | — | chaque contrôle échoue sur y1b et y3 (L10) et sur une page sans radar (L06), passe sur un témoin positif | pilote |
| r1-carte | page en fil de fer : la stout de l'étape Houblons à Dryhopper, un écran par outil, ligne de contexte et facteur libre marqués, quatre questions fermées en tête | conception | auteur | opus | 80 | work/refonte-frontend/v4/ecran-1/fils22-carte/** | r0-controles | controle-commun (COMMUN OK), controle-une-question, captures 390 ouvertes | brasseur |
| r2-cout-calcul | chronométrer simulerCas léger et complet sur le cas stout et sur tout le catalogue, sans écrire dans le moteur ; note du cerveau | mécanique | executant | haiku | 40 | cerveau/metier/cout-calcul-moteur.md, voies/r2-cout-calcul/ANNEXE.md | — | note --exiger "Mesures,Conditions,Conclusion" ; npm run check:engine | pilote |
| r4-picto-epice | planche de 6 à 8 pictos « épicé » (poivre exclu : deux plaintes), au code couleur des arômes, à 390 px | jugement | auteur | sonnet | 60 | work/refonte-frontend/v4/ecran-1/fils22-picto-epice/** | — | controle-commun (PARLANT, PALETTE), captures ouvertes | brasseur |
| r5-relecture | relecture indépendante de r1 et r4 contre SPEC, acquis et leçons | jugement | relecteur | sonnet | 30 | voies/r5-relecture/RESULTAT.md | r1-carte, r4-picto-epice | questions fermées du relecteur, captures ouvertes | pilote |
| r8-publication | captures, section lot 22a pour la page des fils de fer (carte, picto, options des descripteurs) | mécanique | executant | haiku | 40 | work/refonte-frontend/v4/outils/page-nuit/lot22a.json | r5-relecture | ajouter-lot.mjs sans erreur, chaque image existe | pilote |
| r3-descripteurs | appliquer dans le prototype les options choisies par le brasseur (A table complémentaire mot → famille, B part « autres ») ; confronter Cascade, Idaho 7, Galaxy, Nelson Sauvin, Motueka à leur réputation | jugement | auteur | sonnet | 80 | prototypes/houblons-v4/data/descripteurs-complementaires.json, prototypes/houblons-v4/src/engine/hops.ts, prototypes/houblons-v4/tests/ (la table mot → famille d'origine vit dans hopExtrapolationBootstrap.json, ne pas la modifier) | brasseur (option choisie) | npm test et check:engine (prototypes/houblons-v4) ; controle-sans-famille | brasseur |
| r6-lot22-comparer | lot 22 : Comparer seul, stout 16 °P, Cascade, Idaho 7, Galaxy ; environ 12 variantes à partir de la base v4.9 (p06, radar choisi), chimie rattachée aux familles, vraies valeurs de v1 sous un toucher, manière de w2, panel OSU | jugement | auteur | sonnet | 80 | work/refonte-frontend/v4/ecran-1/fils22-comparer/** | r0-controles, r3-descripteurs, brasseur (radar, base de comparaison) | controle-commun, controle-une-question, controle-acquis, controle-sans-famille, relecteur | brasseur |
| r7-dryhopper | Dryhopper : y1b sans sélecteur de houblon ni levure, moment par 5′, x3b réduit en fin de frise | jugement | auteur | sonnet | 80 | work/refonte-frontend/v4/ecran-1/fils23-dryhopper/** | r6-lot22-comparer, brasseur (levure) | controle-commun, controle-une-question, relecteur | brasseur |

## Ordre
- **Vague 1**, en parallèle et tout de suite : r0-controles, r2-cout-calcul, r4-picto-epice.
- **Vague 2** : r1-carte, dès que r0 est vérifié.
- **Vague 3** : r5-relecture, puis r8-publication. Le pilote met la page à jour et pose au brasseur
  les questions fermées.
- **Vague 4**, après ses réponses : r3-descripteurs, puis r6-lot22-comparer (sous-voies
  r6a… r6l, une variante chacune, en parallèle), puis r7-dryhopper.
- Une voie Haiku « entrées » précède r6. Elle vérifie le moteur, profils-simules.json et les
  constantes (L08).

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
Usage avant la mission (22.10, fin du montage du système) : relevé au lancement de la vague 1.
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
(à remplir à la fin de la mission)
