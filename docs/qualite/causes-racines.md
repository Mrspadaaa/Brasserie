# Causes racines — houblons

Phase 3 de la mission #119, 18.10.2026. Deux questions du brief : pourquoi des
règles du brasseur ont-elles été ignorées ? Pourquoi des défauts majeurs d'UX
ont-ils passé des dizaines de revues ?

Méthode : 8 hypothèses du brief testées, pas admises. Preuves relevées par un
agent Haiku (102 preuves, `work/refonte-frontend/phase3/preuves.md`), les
décisives revérifiées par Opus, complétées par les mesures des phases 1 et 2.
Chaque citation ci-dessous se retrouve mot pour mot dans son fichier, à la
ligne dite (contrôle `work/refonte-frontend/checks/check-phase3.mjs`). Les
fichiers `work/` sont des dossiers de travail locaux, non versionnés.

## Mécanisme commun

À chaque relais, **les mots du brasseur ont été remplacés par un substitut écrit
par un agent**, puis **chaque contrôle a validé le substitut** :

| Relais | Ce qui remplaçait le besoin | Ce que le contrôle vérifiait |
|---|---|---|
| Brief de construction | « Aucun nouvelavis/corpus/historique à reconstituer » (sic) | que le lot respectait le brief |
| Critère d'acceptation | vocabulaire interne de l'épopée #21 | que le code répondait au critère |
| Revue UX | le corps des issues et le rapport de l'auteur | que l'issue était faite |
| Revue de code | les hunks du diff | que le diff était correct |
| Test automatique | ce que le code affiche à 320, 375, 430 et 1280 px | que l'écran ne casse pas |
| Données | des fixtures complètes, des valeurs simulées | que le calcul tournait |
| Mise en ligne | la page publique répond (HTTP 200) | que le déploiement a réussi |

Personne n'a mesuré **la tâche du brasseur, sur ses données, sur son téléphone**.
« Un clic, sans défiler, mes houblons classés pour ma stout » n'était écrit dans
aucun critère, aucun test, aucun verdict. Un défaut qui n'est écrit nulle part
ne peut bloquer nulle part : il passe toutes les portes, quelle que soit leur
rigueur.

## H1 — Critères rédigés par des agents en termes techniques

**Verdict : confirmée**

Le brief du lot V5.5 interdit de relire le corpus ; les briefs suivants ne
contiennent plus « stout », « un clic » ni « sans scroll ».

- `C:\Users\mrspa\Documents\Brasserie\work\houblons-v5-realisation-2026-09-29\claude-25-v55-brief.md`:3 — « Aucun nouvelavis/corpus/historique à reconstituer » — le constructeur de V5.5 travaille sans les demandes du brasseur.
- `C:\Users\mrspa\Documents\Brasserie\work\houblons-v5-realisation-2026-09-29\claude-10-brief.md`:40 — « Nugget en stout : évaluer trop/pas assez résineux » — un brief antérieur portait encore une question du brasseur ; elle disparaît des briefs 14, 16, 17 et 25 (recherche sans occurrence).
- `work/finalisation-tickets-2026-10-08/UX-PAGE/ux-verdict.md`:60 — « variety:hopsteiner-cas » — un identifiant interne affiché au brasseur est classé mineur.
- GitHub #21, premier critère de fermeture de l'épopée : « Application canonique, fraîche et rejouable sans duplication ». Aucun critère n'y demande le stock d'abord ni le clic unique.

**Garde-fou** : gabarit d'issue d'interface qui exige la question de la banque (Qnn) et la phrase du brasseur ; script qui refuse la clôture sans elles (phase 4).

## H2 — Revues jugées contre le ticket, pas contre le besoin

**Verdict : confirmée**

- `work/finalisation-tickets-2026-10-08/UX-WIZ/brief.md`:12 — « Issues #21, #28, #32, #33, #40, #48 (rendu recette) » — la revue UX de l'étape Houblons reçoit une liste d'issues comme critère.
- `work/finalisation-tickets-2026-10-08/UX-WIZ/ux-verdict.md`:64 — « Décisions produit (à trancher, pas des défauts de réalisation) » — section du verdict où va le point suivant.
- `work/finalisation-tickets-2026-10-08/UX-WIZ/ux-verdict.md`:67 — « Sélecteur de houblon en deux appuis sur mobile » — contraire à « en un click » (C002), classé décision produit au lieu d'écart au besoin.
- `work/finalisation-tickets-2026-10-08/UX-PAGE/ux-verdict.md`:83 — « hors hunks PAGE » — un défaut vu pendant le parcours est écarté parce qu'il est hors du diff.
- `work/finalisation-tickets-2026-10-08/REV-WIZ/v3-verdict.md`:4 — « Périmètre : les 27 hunks de » — la revue de code juge le diff ; son « aucun bloquant » ne couvre pas le parcours.

**Garde-fou** : protocole de revue UX qui juge contre la banque de questions et les règles U1 à U7 ; une question clé sans réponse bloque, même hors du diff (phase 4).

## H3 — Fixtures plutôt que données réelles

**Verdict : partielle**

Les fixtures étaient voulues et validées par le brasseur. Le défaut est ailleurs :
les fixtures étaient **plus riches** que la production, et rien ne contrôlait les
données réelles avant la mise en ligne.

- `CLAUDE.md`:10 — « Vérifier sur des fixtures ; pas de déploiement » — règle du projet : le choix des fixtures est voulu (contre-preuve).
- `tests/qa/hop-recipe/main.tsx`:38 — « seedQa({ hopVarieties: varieties, hopKnowledge: knowledge » — le banc QA remplit le catalogue avec tout le guide.
- `docs/besoins/parcours-cles.md`:55 — « la production n'a que 12 variétés et un stock non normalisé » — la production a beaucoup moins (#120).
- `work/finalisation-tickets-2026-10-08/REV-WIZ/v3-verdict.md`:105 — « le build QA résout seedData vers l'exemple public » — le relecteur joue l'exemple public.
- Phase 2 : toutes les maquettes V1 à V5.5 affichent des « valeurs simulées » ou des données de démonstration (9 à 22 houblons) ; aucune ne charge le catalogue réel.

**Garde-fou** : fixtures tirées d'un instantané en lecture seule de la production, et contrôles joués sur cet instantané (`scripts/hop-one-tap/stock-production.mjs`, phase 4).

## H4 — Relecteurs nourris du rapport de l'auteur

**Verdict : partielle**

L'alimentation est prouvée ; son effet sur les défauts manqués ne l'est pas.

- `work/finalisation-tickets-2026-10-08/UX-PAGE/brief.md`:13 — « Parcours et captures de l'auteur » — le relecteur part du rapport et des captures de l'auteur.
- `work/finalisation-tickets-2026-10-08/UX-PAGE/brief.md`:55 — « Déjà connu, à ne pas compter comme constat nouveau » — le relecteur reçoit la liste des défauts à ne pas recompter.
- `work/finalisation-tickets-2026-10-08/UX-PAGE/ux-verdict.md`:18 — « les bancs de l'auteur cliquent par le DOM et ne l'ont pas vu » — contre-preuve : le relecteur a trouvé un bloquant que l'auteur avait manqué.

**Garde-fou** : le relecteur reçoit l'app qui tourne et la banque de questions, jamais le rapport de l'auteur (phase 4).

## H5 — Aucun test de tâche chronométré

**Verdict : confirmée**

Aucun contrôle ne mesurait la tâche du brasseur. Les 17 contrôles houblons du
dépôt (`scripts/check-hop-*.mjs`, `check-recipe-*`) vérifient écritures, statuts
et persistance ; aucun ne cherche un houblon du stock à l'écran.

- `work/finalisation-tickets-2026-10-08/UX-WIZ/ux-verdict.md`:16 — « relecture du brouillon rouvert à 1,5 s / 8 s » — seules des durées de réouverture sont mesurées.
- `scripts/check-recipe-journey-ui.mjs`:173 — « [320, 375, 430, 1280] » — le contrôle de l'étape ne joue pas 390 px, la largeur du critère.
- `docs/besoins/corpus-demandes.md`:173 — « ça prenne pas plus que quelques secondes » — demande du 13.09, sans test associé jusqu'au 17.10.
- `docs/besoins/parcours-cles.md`:59 — « Mesure de l'existant : étape Houblons, 17.10.2026 » — la première mesure en touchers date du jour de la mise en ligne.

**Garde-fou** : `scripts/check-hop-one-tap.mjs` (un toucher, sans défiler, 390 × 844, stock réel) et un budget de temps mesuré ; témoin négatif sur l'app actuelle (phase 4).

## H6 — Aucune comparaison à la concurrence

**Verdict : confirmée**

- `C:\Users\mrspa\Documents\Brasserie\work\houblons-v5-cadrage-2026-09-29\demandes-utilisateur.md`:36 — « Faire une 5 et 6 en s'inspirant des meilleurs » — demande du 29.09.
- `C:\Users\mrspa\Documents\Brasserie\work\houblons-v5-cadrage-2026-09-29\references-lues.md`:63 — « Tu reçois les résumés et liens, pas un navigateur » — la seule consultation de la concurrence s'est faite sans navigateur.
- `C:\Users\mrspa\Documents\Brasserie\work\houblons-v5-cadrage-2026-09-29\references-lues.md`:26 — « Sabro et Bravo ont été sélectionnés » — et le comparateur ne s'est pas rempli ; aucune comparaison n'a été jouée.
- Aucun brief de construction ni de revue des dossiers V3, V4, V5, V5.5 et de la mission du 08.10 ne cite un concurrent (recherche « Maverick »).

**Garde-fou** : la revue UX joue les mêmes tâches dans un outil concurrent et note l'écart (phase 4) ; références relevées dans `work/refonte-frontend/phase2/concurrence.md`.

## H7 — Presque aucun test sur l'app déployée

**Verdict : confirmée**

- `work/finalisation-tickets-2026-10-08/validations/deploy-20261017/rapport-final.md`:19 — « l'agent ne se connecte jamais » — après la mise en ligne, le contrôle connecté est laissé à l'humain.
- `work/finalisation-tickets-2026-10-08/brief-audit-commun.md`:11 — « Fini = utilisable dans l'app sur W » — « fini » est défini sur la copie de travail, pas sur l'app en ligne.
- `docs/besoins/corpus-demandes.md`:195 — « Trop peu de tests ont été vraiment été effectué sur la vrai app » — le constat du brasseur.
- GitHub #25 « Qualifier la release V5.5 » reste ouverte ; la mise en ligne du 17.10 part sans elle.

**Garde-fou** : contrôle de la production en lecture seule après chaque déploiement, par la session Chrome QA de l'humain ou par l'humain lui-même, avec les mêmes tâches que sur fixtures (phase 4).

## H8 — Empilement des couches V3, V4, V5.5

**Verdict : confirmée**

- `work/finalisation-tickets-2026-10-08/brief-audit-commun.md`:10 — « une couche V3/V4/V5.5, un label » — le piège était nommé le 08.10 ; les couches ont continué.
- `docs/besoins/corpus-demandes.md`:55 — « les v5 et des versions de v5.5 semblait largement mieux que ce qu'il y a actuellement » — le brasseur juge que la version en ligne est en recul.
- Phase 2 : `src/services/hopV55/` compte environ 42 900 lignes d'archives et de codecs V1 à V6 ; 3 générations de conseil houblon coexistent dans `functions/src/`. Les réponses de 780 mots viennent de cette complexité exposée telle quelle.

**Garde-fou** : règle de soustraction : un écran neuf remplace l'ancien, il ne s'y ajoute pas ; chaque donnée affichée par défaut cite sa question (règle U2), le reste est à la demande (phase 4 et specs).

## A1 — Un test a acté la disparition d'une fonction

**Verdict : confirmée**

- `scripts/check-recipe-journey-ui.mjs`:396 — « The former comparison/simulation panel is no longer mounted » — l'assertion vérifie l'absence du panneau de comparaison.
- `scripts/check-recipe-journey-ui.mjs`:394 — « The native V5.5 hop workbench replaced the former comparison/simulation tools » — le commentaire justifie le retrait.
- Commit `4add7b51` (16.10, 289 fichiers, +56 862 lignes, « sauvegarde ») : le même commit retire le panneau du créateur et réécrit le test. Fusionné en production le 17.10 (PR #102).

**Garde-fou** : un test ne peut pas affirmer l'absence d'une fonction demandée par le brasseur sans citer son accord ; une suppression d'assertion ou de fonction visible passe en revue séparée (phase 4, hooks sur accord).

## A2 — Des issues fermées malgré un verdict bloquant

**Verdict : confirmée**

- `work/finalisation-tickets-2026-10-08/UX-PAGE/ux-verdict.md`:11 — « à corriger (bloquant) » — verdict du 12.10 sur #76 et #77.
- `docs/besoins/corpus-demandes.md`:198 — « une issue se ferme dès qu'elle est utilisable et prouvée, sans aucun bloquant » — la règle du brasseur, donnée le même jour.
- `docs/besoins/corpus-demandes.md`:219 — « Après 4 jours, aucune issue n'est fermée » — la pression de clôture, le même jour.
- GitHub : #76 et #77 fermées le 12.10 à 23:14 UTC ; la correction du bloquant date du 16.10 (`4add7b51`).

**Garde-fou** : script de clôture qui refuse une issue dont le dernier verdict porte un bloquant ouvert (phase 4).

## A3 — Consignes perdues entre deux briefs

**Verdict : confirmée**

- `work/finalisation-tickets-2026-10-08/brief-audit-commun.md`:4 — « Avertissement humain » — le brief renvoie à une section de la mission.
- `work/finalisation-tickets-2026-10-08/mission-historique-20261016.md`:25 — « Avertissement humain du 2026-10-08 — travaux inachevés et inutilisables » — cette section n'existe plus que dans l'historique ; la mission actuelle ne la contient plus.
- `C:\Users\mrspa\Documents\Brasserie\work\houblons-v5-realisation-2026-09-29\claude-25-v55-brief.md`:5 — « navigateur/terminal non fournis, pas tests/rendus inventés » — le constructeur V5.5 n'avait ni navigateur ni terminal : aucun rendu n'a pu être joué.

**Garde-fou** : les mots du brasseur vivent dans un seul fichier versionné (`docs/besoins/corpus-demandes.md`) ; chaque brief y renvoie par identifiant, sans résumé (phase 4).

## A4 — La surcharge validée dès les maquettes

**Verdict : confirmée**

L'exigence « pratique, pas surchargé » existait depuis le 05.09 ; aucune revue
ne l'a mesurée, et les maquettes V5.5 jouées en phase 2 la violent.

- `docs/besoins/corpus-demandes.md`:149 — « visuel sombre mais compact. pas d'info surplus en doublon ou inutile » — règle du brasseur du 05.09 (C084).
- `docs/besoins/corpus-demandes.md`:118 — « je veux que dans le 80% des cas où c'est, je sais déjà ce que je veux » — le cas courant doit être simple (C062).
- Phase 2, maquette V5.5 jouée : 7 menus déroulants avant la carte, liste à comparer à 1 664 px, réponse « Nugget » de 780 mots, panneau clair dans une app sombre.

**Garde-fou** : règles U1 à U7 de `docs/besoins/parcours-cles.md` transformées en contrôles (premier regard, seulement l'utile par défaut, une entrée par geste, mots du brasseur, un seul système visuel, rien ne couvre une commande, tâche réussie sans aide) (phase 4).

## A5 — Quota : profondeur de revue réduite

**Verdict : partielle**

- `work/finalisation-tickets-2026-10-08/UX-WIZ/ux-verdict.md`:4 — « aucun sous-agent d'évaluation (économie de quota, rôle fixé par le brief) » — la revue a été jouée dans un seul contexte.
- `work/finalisation-tickets-2026-10-08/UX-PAGE/brief.md`:58 — « Tu es la seule session lourde » — le relecteur UX porte seul le contrôle visuel.

**Garde-fou** : les contrôles automatiques U1 à U7 coûtent peu et tournent à chaque changement ; la revue humaine ou indépendante se concentre sur les tâches chronométrées (phase 4).

## Contre-preuves

- `work/finalisation-tickets-2026-10-08/mission-orchestrateur.md`:107 — « vrai rendu et preuve visuelle » — les règles de rendu existaient ; le défaut tient à leur objet, pas à leur absence.
- `work/finalisation-tickets-2026-10-08/UX-PAGE/ux-verdict.md`:16 — « Le même bloquant B1 ferme #76 et #77 » — les revues trouvaient de vrais défauts (contraste 1,01:1).
- `work/finalisation-tickets-2026-10-08/UX-WIZ/ux-verdict.md`:20 — « auteur 22/22 » — les captures de l'auteur ont été ouvertes.
- `docs/besoins/corpus-demandes.md`:197 — « au début, tous les tests se font en local (fixtures dans Chrome local, puis émulateurs Firebase) » — le brasseur a voulu les fixtures en première étape.

Ces contre-preuves confirment le mécanisme commun : les revues étaient sérieuses,
mais elles jugeaient un substitut du besoin.

## Ce qui n'est pas prouvé

- L'effet d'ancrage du rapport de l'auteur sur les défauts manqués (H4).
- L'effet du retrait des agents de contre-vérification OpenAI le 08.10 : la
  contre-vérification est passée à un relecteur Opus, sans preuve d'un effet.
- La date exacte à laquelle la section « Avertissement humain » a quitté la
  mission (après le 16.10, 15:58).
- L'auteur réel du commit `4add7b51` : l'auteur Git est le compte de l'humain,
  le message porte la mention Claude.
