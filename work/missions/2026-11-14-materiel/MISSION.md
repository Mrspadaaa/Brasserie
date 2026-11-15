# Mission 2026-11-14-materiel

## Objectif
Ses mots (SPEC-BRASSEUR, 14.11) : « Lance des autres sous session pour les autres écrans important(sauf clients) pour des mini
maquettes. Notamment ces écran et d'autres et sauf l'écran principal ». Sa capture de Stocks › Matériel (390, en ligne) :
`work/missions/2026-11-14-materiel/brasseur/14-11-stocks-materiel.jpg` — une carte haute par équipement (nom, catégorie · EQ-xxx, état), peu d'information utile.
Et (14.11, par la session mère) : « J'ai l'impression que tout les écrans sous les boutons de ces Tabs ne sont pas traitées ??? » :
tableau de couverture exigé, une vue sans maquette = pas finie.

Fini ici veut dire :
1. chaque vue de Stocks › Matériel (liste, filtres, recherche, « Actions du matériel », fiche, Achat, Nouveau matériel,
   « Enregistrer un achat », vide) a des mini maquettes statiques (repos et après un geste), 12 variantes en 3 séries, défauts du
   critique (Opus) corrigés, dans un artefact privé neuf ; il choisit ;
2. son choix porté 1:1 dans l'app, testé (vision, 390 tactile et 1280, deux thèmes), build vert, déployé par un tag `en-ligne/*`,
   joué en ligne sur « ZZ TEST » retirées ensuite.

Hors portée : Atelier › Matériel › À venir / Réalisés / Archives (mission `2026-11-14-atelier`, page
https://claude.ai/artifact/C2Yge6F4EX44uDMohET59C) ; on s'y relie seulement (« Projets d'équipement »).

## Baseline
La version en ligne : tag en-ligne/2026-11-14-atelier-uv4 (8ba5a4ec). Banc dans une copie détachée
`C:/Users/mrspa/AppData/Local/Temp/materiel-banc` (`.env`, `seedData.ts` copiés, `node_modules` en jonction).
Fichiers : `src/ui/EquipmentList.tsx`, `src/ui/EquipmentSheet.tsx`, `src/ui/equipment-compact.css`,
`src/components/tabs/StocksTab.tsx` (sous-onglet `materiel`), `src/ui/EntityList.tsx`, `src/ui/finance/ExpenseSheet.tsx`
(intent `equipment`, lignes `equipment` et `maintenance` reliées à un matériel), `src/domain/finance/types.ts`
(`FinancialAsset.equipmentRef` : immobilisation et amortissement), `src/ui/finance/FinanceForms.tsx`.

## État de l'art
- Problème type : inventaire d'équipement avec maintenance préventive (CMMS : intervalle par date ou par usage, dernière
  intervention, prochaine échéance, historique, coût ; étalonnage des instruments de mesure à intervalle fixe ; immobilisation
  et amortissement dégressif/linéaire).
- Examiné : modèles CMMS courants (UpKeep, Fiix, MaintainX : « due / overdue », calendrier, historique d'interventions,
  liens aux bons d'achat) ; Brewfather / BeerSmith (profil d'équipement = volumes et pertes, pas d'entretien) ; l'app :
  `EquipmentItem` n'a ni date du dernier entretien, ni intervalle, ni historique ; le lien achat→matériel existe
  (`purchaseEntry.ts`), l'amortissement vit dans Finances (`FinancialAsset`).
- Décision : en maquette, les champs neufs (intervalle, dernier entretien, étalonnage, historique) se dessinent et sont
  marqués « champ neuf » ; au port, l'échéance se calcule (date + intervalle, en jours, `date-fns` déjà au paquet si présent,
  sinon `Date` natif) ; aucun algorithme non trivial.

## Inventaire des vues (couverture, exigence de la session mère)
| Vue | Code | Au lot |
|---|---|---|
| Liste (Tout) | `EquipmentList.tsx` | oui |
| Filtre « À traiter » (vide et non vide) | idem | oui |
| Recherche (résultat, aucun résultat) | `EntityList.tsx` | oui |
| « Actions du matériel » ouvert | `StocksTab.tsx` | oui |
| Fiche d'un équipement (repos, Achat déplié, Notes, Gestion › Supprimer) | `EquipmentSheet.tsx` | oui |
| Nouveau matériel (« Matériel déjà possédé ») | idem | oui |
| « Enregistrer un achat » (Dépense, intent equipment) | `ExpenseSheet.tsx` | entrée seule (écran Finances, autre session) |
| Inventaire vide | `EquipmentList.tsx` | oui |
| Parcours manquants : entretien dû, panne, étalonnage (densimètre, pH-mètre, réfractomètre), lien aux dépenses, valeur | — | oui (champs neufs) |

## Décisions
| Décision | Options | Décideur | État |
|---|---|---|---|
| Fable | critique en Fable ; en Opus | utilisateur | tranchée : Fable interdit (10.11) ; tout en Opus |
| Mini maquettes | jouables ; statiques | utilisateur | tranchée : statiques (« non jouable ») |
| Jury | jury complet ; cadrage du pilote dans le brief | pilote | tranchée : cadrage du pilote (un seul écran, quota D204) ; axes dans BRIEF-AUTEUR.md |
| Séries | 3 × 4 | utilisateur | tranchée : 12 variantes en 3 séries (r langue de l'app enrichie, z créative, u libre) |
| Choix de maquette | variantes | brasseur | ouverte |

## Voies
| Voie | Objectif | Niveau | Agent | Modèle | Plafond | Possède | Dépend de | Contrôles | Décideur | Étape |
|---|---|---|---|---|---|---|---|---|---|---|
| a0-banc | captures de chaque vue actuelle au banc local, 390 tactile et 1280, clair et cave | mécanique | executant | haiku | 40 | work/missions/2026-11-14-materiel/banc/** | — | GATES (BANC OK, VUES OK, NOTE OK) | pilote | — |
| a1-analyse | « combien et quels problèmes », trous et parcours manquants | jugement | critique | opus | 30 | work/missions/2026-11-14-materiel/analyse/** | a0-banc | NOTE OK | pilote | — |
| r-mat | série r : dans la langue de l'app, enrichie | conception | concepteur | opus | 60 | work/missions/2026-11-14-materiel/v0/r/** | a1-analyse | baseline : controle-commun --sans=mots ; controle-choix (écran hors d'ecrans.json, dit) ; captures ouvertes | brasseur | v0 ×4 (1 froide, 2 tiède, 1 chaude) |
| z-mat | série z : créative à fond (Opus) | conception | concepteur | opus | 60 | work/missions/2026-11-14-materiel/v0/z/** | a1-analyse | baseline : controle-commun --sans=mots ; controle-choix (écran hors d'ecrans.json, dit) ; captures ouvertes | brasseur | v0 ×4 (1 tiède, 3 chaude) |
| u-mat | série u : libre au brief minimal | conception | concepteur | opus | 60 | work/missions/2026-11-14-materiel/v0/u/** | a1-analyse | baseline : controle-commun --sans=mots ; controle-choix (écran hors d'ecrans.json, dit) ; captures ouvertes | brasseur | v0 ×4 (1 froide, 1 tiède, 2 chaude) |
| t-mat | tri : classement, défauts, greffes | jugement | critique | opus | 30 | work/missions/2026-11-14-materiel/critique/** | r-mat, z-mat, u-mat | controle-panel, captures ouvertes | pilote | tri |
| p2-r1 | passe 2 de rq1 et rq2 : défauts du critique corrigés, greffes, états traiter, ajout, vide, 1280 | conception | concepteur | opus | 60 | work/missions/2026-11-14-materiel/v1/r/rq1/**, work/missions/2026-11-14-materiel/v1/r/rq2/** | t-mat | baseline : controle-commun --sans=mots ; controle-choix (écran hors d'ecrans.json, dit) ; captures ouvertes | brasseur | passe 2 |
| p2-r2 | passe 2 de rq3 et rq4 : défauts du critique corrigés, greffes, états traiter, ajout, vide, 1280 | conception | concepteur | opus | 60 | work/missions/2026-11-14-materiel/v1/r/rq3/**, work/missions/2026-11-14-materiel/v1/r/rq4/** | t-mat | baseline : controle-commun --sans=mots ; controle-choix (écran hors d'ecrans.json, dit) ; captures ouvertes | brasseur | passe 2 |
| p2-z1 | passe 2 de zq1 et zq2 : défauts du critique corrigés, greffes, états traiter, ajout, vide, 1280 | conception | concepteur | opus | 60 | work/missions/2026-11-14-materiel/v1/z/zq1/**, work/missions/2026-11-14-materiel/v1/z/zq2/** | t-mat | baseline : controle-commun --sans=mots ; controle-choix (écran hors d'ecrans.json, dit) ; captures ouvertes | brasseur | passe 2 |
| p2-z2 | passe 2 de zq3 et zq4 : défauts du critique corrigés, greffes, états traiter, ajout, vide, 1280 | conception | concepteur | opus | 60 | work/missions/2026-11-14-materiel/v1/z/zq3/**, work/missions/2026-11-14-materiel/v1/z/zq4/** | t-mat | baseline : controle-commun --sans=mots ; controle-choix (écran hors d'ecrans.json, dit) ; captures ouvertes | brasseur | passe 2 |
| p2-u1 | passe 2 de uq1 et uq2 : défauts du critique corrigés, greffes, états traiter, ajout, vide, 1280 | conception | concepteur | opus | 60 | work/missions/2026-11-14-materiel/v1/u/uq1/**, work/missions/2026-11-14-materiel/v1/u/uq2/** | t-mat | baseline : controle-commun --sans=mots ; controle-choix (écran hors d'ecrans.json, dit) ; captures ouvertes | brasseur | passe 2 |
| p2-u2 | passe 2 de uq3 et uq4 : défauts du critique corrigés, greffes, états traiter, ajout, vide, 1280 | conception | concepteur | opus | 60 | work/missions/2026-11-14-materiel/v1/u/uq3/**, work/missions/2026-11-14-materiel/v1/u/uq4/** | t-mat | baseline : controle-commun --sans=mots ; controle-choix (écran hors d'ecrans.json, dit) ; captures ouvertes | brasseur | passe 2 |

## Agents
- a0-banc (haiku, 28 captures), a1-analyse (critique Opus : P28 dont 3 bloquants, M10), r/z/u-mat (concepteurs Opus, 12 v0), t-mat (tri : uq2, zq1, uq3), p2 ×6 + 6 reprises (contexte : deux variantes à six états dépassent un concepteur), t2-mat (verdict : 11 MONTRABLE, rq1 A REPRENDRE → corrigé par le pilote : bouton vide 44 px, toast).

## Couverture (exigence de la session mère, 14.11)
| Vue | Aujourd’hui (banc) | Maquettes (page, rangée) |
|---|---|---|
| Liste (Tout) 390 | liste-390-clair | 12 · Au repos |
| Fiche d’un équipement | fiche-390-clair | 12 · La fiche |
| Filtre « À traiter », après un geste | a-traiter-390-clair | 12 · À traiter |
| « Actions du matériel », nouveau, Enregistrer un achat (entrée) | actions, nouveau, achat | 12 · Ajouter |
| Inventaire vide | vide-390-clair | 12 · Inventaire vide |
| Thème cave | liste-390-cave | 12 · En cave |
| 1280 | liste-1280-clair | 12 · À l’ordinateur |
| Recherche (résultat, aucun) | recherche, recherche-vide | aucune maquette dédiée : la barre de recherche est dans chaque repos (reste ouvert, passe 3 si choisie) |
| Fiche › Achat, Gestion (vendu, réformé, supprimer) | fiche-achat, fiche-gestion | dans La fiche (dépenses reliées, Gestion) |
| Panne signalée depuis la ligne | — | dans À traiter (retour « Réparée ») ; geste « en panne » dessiné dans uq1 seulement |

## Pages
| Sujet | Version | Adresse | Source |
|---|---|---|---|
| Stocks · Matériel | passe 2 · 14.11 | https://claude.ai/artifact/Hj7pe5XK8nQYcj34VN5fZU | `work/missions/2026-11-14-materiel/choix/index.html` |
| Matériel apaisé (zq1) | variantes za1–za4 · 15.11 | https://claude.ai/artifact/GtTjLszM1jRHpnoZHYVpAn | `work/missions/2026-11-14-materiel/choix-apaise/index.html` |

## Reprise
- 14.11 : page de choix publiée (12 variantes, 7 états). Attend son choix ; puis port 1:1 dans un worktree propre (hors dossier partagé), tests, déploiement depuis le dernier tag en-ligne/*, jeu en ligne sur « ZZ TEST ».
- Banc : copie détachée C:/Users/mrspa/AppData/Local/Temp/materiel-banc (tag en-ligne/2026-11-14-atelier-uv4).

## Contrat réécrit — 15.11 (pilote), retour du brasseur
Mot pour mot : « zq1 Le fil du temps — J'aime bien mais un peu "stressant" c'est le plus pratique mais le plus anxiogène ».
Lecture du pilote : zq1 est retenue pour sa pratique ; il faut en garder la structure et en retirer l'anxiété (moins de rouge et d'alertes en avant, échéances calmes, ton rassurant, le « tout va bien » visible d'abord).
À faire : verser ses mots dans SPEC ; 3 ou 4 variantes de zq1 apaisées (mini maquettes, critique Opus), page neuve, lui montrer ; port 1:1 après son choix, dans un worktree propre ; tests, build, captures regardées ; mise en ligne selon la méthode.

### Avancement 15.11
- SPEC versée (ses mots sur zq1). BRIEF-APAISE.md ; za1 couleur, za2 ordre, za3 mots, za4 une chose à la fois (concepteurs Opus, une variante par agent). Verdict Opus (critique/VERDICT-V2.md) : za4 1re, za1 et za4 à reprendre → corrigées (rouge seul à la panne ; gestes 44 px). Page neuve publiée. Worktree de port prêt : C:/Users/mrspa/AppData/Local/Temp/materiel-port, branche claude/materiel-port, base en-ligne/2026-11-15-atelier-kckd (01d3de75). Attend son choix.
- Choix 15.11, mot pour mot : « za3 Une date, pas un compteur mieux ». Porter za3 1:1 (zq1 apaisée), tests, build, captures, mise en ligne.

### Reprise 15.11 (port za3) — état pour la session suivante
- Choix : za3 (SPEC versée). Inventaire et modèle : PORT.md. Voies d1 (domaine, 55 tests), d2a (liste), d2b (fiche), c1 (13 corrections du test d'écran ECRAN-PORT.md), c2 (ECRAN-PORT-2.md : P7, N1–N5), correctif pilote « janv. » sous la dernière ligne.
- Code : worktree C:/Users/mrspa/AppData/Local/Temp/materiel-port, branche claude/materiel-port, HEAD 059a8511 = port + fusion de en-ligne/2026-11-15-finances (dernier tag en ligne). Non poussée.
- Preuves : vitest complet 13 échecs, les mêmes 13 que la base en-ligne/2026-11-15-finances (rejoués dans C:/Users/mrspa/AppData/Local/Temp/materiel-base) ; tsc vert ; VITE_HOP_V4=on npm run build vert ; check-no-dev-auth OK ; check-build-flags OK ; check-firebase-config OK (script pris du dossier partagé, absent du tag). deploiement/vitest-complet.txt, deploiement/build.txt.
- En cours : exécutant Haiku → captures avant déploiement de 059a8511 dans avant-deploiement/059a8511/ (9 états × 390/1280 × clair/sombre, CAPTURES.md).
- Prochaine action : critique Opus écrit avant-deploiement/059a8511/VERDICT.md (format de scripts/agents/controle-avant-deploiement.mjs : Version, tableau capture|thème|largeur|état|problèmes|bloquants, Pilote : vu, Bloquants : 0) ; pilote regarde ; node scripts/agents/controle-avant-deploiement.mjs 059a8511 --dossier work/missions/2026-11-14-materiel/avant-deploiement → OK ; puis dans W : npx firebase deploy --only hosting --project brasserie-l-affinee ; ouvrir la page servie ; tag en-ligne/2026-11-15-materiel ; jouer en ligne sur un appareil « ZZ TEST — … » (Fait, Étalonné, Annuler, fiche), puis le supprimer ; note de déploiement dans le dossier de notes partagé ; commit des fichiers de mission par chemins.
- Ne jamais toucher .codex/hooks.json, functions/.env, firestore.rules.
