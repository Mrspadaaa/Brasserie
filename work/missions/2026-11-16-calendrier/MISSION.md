# Calendrier global : exploration créative (16.11, nuit)

Ses mots, dans SPEC-BRASSEUR, lignes du 15 et du 16.11 : « on est pas assez créatif avec ce calendrier global… utilise d'autres moyens d'afficher, interagir avec… c'est trop limité… on tiens un truc vraiment génial et central ».
Pas de session neuve possible, car l'app la refuse en Remote Control : c'est le pilote qui mène cette exploration, avec des agents.

## Bases (lecture seule)
- f1 et f1r : `C:\Users\mrspa\Documents\Brasserie\.claude\worktrees\infallible-grothendieck-129ed4\work\missions\2026-11-15-besoins\` (f/f1, f1r, voies/F1R.md, voies/NUIT.md, inventaire). On n'y écrit pas.
- L'outil de capture se copie depuis `socle/capt.mjs`.

## Contenu commun
- Tout ce qui se planifie : brassages, événements, achats, rénovations, activités sans budget.
- Pour chacun : une fenêtre en semaines, des jours actifs, l'argent mis de côté, l'effet sur la caisse.
- Un onglet « Calendrier » dans la barre du bas (Bord, Finances, Brassins, Stocks, Clients).
- Le + reste un bouton flottant, avec ses propres actions sur le calendrier.

## Séries v0 (8 concepts chacune)
| Série | Axe | Chaleur |
|---|---|---|
| s1 | autres formes du temps : spirale, anneau des saisons, rivière, horloge annuelle | froide |
| s2 | zoom continu (du jour à l'année, pincer), densité qui s'adapte | tiède |
| s3 | métaphores de brasserie : cuves, cave, tableau de tickets, cartes empilées | chaude |
| s4 | gestes : glisser pour planifier, déposer, + flottant contextuel, paysage plein écran | tiède |
| s5 | temps et argent liés : caisse en niveau d'eau, budget en réservoir qui se remplit, double axe | chaude |
| s6 | agenda malin : semaine, à faire, à venir ; charge (jours actifs contre disponibilité) ; créneaux suggérés | froide |

## Suite
Classement par une critique Opus (5 candidates et des greffes), passe 2, revues (brasseur, UX/UI, parcours, navigation), puis une page avec Choisir, Copier et les propositions côte à côte.

## Pages
| Sujet | Version | Adresse | Source |
|---|---|---|---|
| Calendrier global | passe 2 · 16.11 | https://claude.ai/artifact/KkTtnqzuRef5pXotpfPjE4 | `work/missions/2026-11-16-calendrier/page/index.html` |
| Calendrier global | passe 8 · 16.11 | https://claude.ai/artifact/KAZV8p46ETVRuTiuYGzjQK | `work/missions/2026-11-16-calendrier/page2/index.html` |
| Calendrier global, un geste | prototypes fb/fc/fa · 16.11 | https://claude.ai/artifact/Ho37S3SppXy2SJ7fEHdE3Z | `work/missions/2026-11-16-calendrier/page3/index.html` |
| Carnet de recherche et de décision | prototypes dc/da/db · 16.11 | https://claude.ai/artifact/793n3GJYxJHc52JH5ynw1h | `work/missions/2026-11-16-carnet-decision/page/index.html` |
| Liens de l'app | top 15 · 16.11 | https://claude.ai/artifact/BHEHrUTuHiJkGnE1MjUGe6 | `work/missions/2026-11-16-liens-app/page/index.html` |
| Calendrier par section, vues | exploration · 16.11 | https://claude.ai/artifact/TUrDFEM6Z5jywbS8yJsr3f | `work/missions/2026-11-16-vues-calendrier/page/index.html` |

## REPRISE pilote — 16.11, ~10 h
- **Workflows en cours** (pilote) :
  - `calendrier-fb-9` (run wf_d426e0fa-fea) : fb vers 9/10. Sorties dans `fb9/` (MANQUES.md, pN, page4). À publier : page4, puis l'ajouter à la table Pages.
  - `carnet-decision` (run wf_ff368cd5-005, dernier relancé ; script `carnet-decision-wf_553ee689-af0.js`) : sorties dans `work/missions/2026-11-16-carnet-decision/` (CADRE, da, db, dc, page). À publier.
- **Choix du brasseur** : calendrier fb (page3), à porter à 9/10. Carnet de recherche et de décision : générique, caractéristiques dynamiques, vue sans détails puis détail, aperçu de lien, veille « Surveiller » tous les 3 jours (stock, autres fournisseurs, baisse de prix ; tâche planifiée et recherche payante à soumettre à son accord), ultra simple.
- **Sessions** :
  - Besoins d'achat : calendrier seul, l'embouteilleuse est retirée.
  - Finances : corrige 20, 21, 33.
  - Atelier : corrige 31 et 12.
  - Menu : corrige 32 et 34.
  - Recette : corrige 36, 37, le + de l'assistant et 19 L.
  - Brassins : en ligne.
- **Reste** :
  - Constats Finances 17, 18, 22, 25, 26, 28 à 30 non rejoués en ligne.
  - Données ZZ non supprimables en ligne : idée de tarif, matériel, prévision, deux recettes ZZ.
  - Quota hebdomadaire autour de 91 % au matin.

## Leviers (16.11, « Tous »)
Les leviers L1 à L7 sont ajoutés à fb9/MANQUES.md et à carnet-decision/CADRE.md. Au retour des workflows, le pilote vérifie que chaque levier est traité ; sinon, il relance une passe. L7 : publier le prototype final jouable, avec 5 tâches chronométrées sur son téléphone.

## Carnet 9/10 (16.11)
- Workflow `carnet-9`, task wqn8lksgz, run wf_547f5490-9ff. Sorties dans `carnet-decision/f9/` : LISIBILITE.md, REFERENCES.md, FUSION.md, puis p1 à p5. Livrables : `page2/` et `jouable/`.
- Au retour : publier page2 et jouable, ajouter leurs lignes à Pages, commit, lien au brasseur.

## Liens de l'app (16.11, « tout a un lien avec tout »)
- Workflow `liens-app`, task w9zp0g7g1, run wf_d0b636f6-2aa. Sorties dans `work/missions/2026-11-16-liens-app/` : inventaires, ETAT-ART.md, LIENS-APP.md v2, `proto/`, `page/`.
- Le carnet (CADRE.md) et le calendrier (MANQUES.md) lisent LIENS-APP.md à chaque passe.
- Au retour : publier la page, ajouter sa ligne à Pages, commit, lien au brasseur.

## Critères 9,5-10 (16.11)
- Workflow `criteres-10`, task wbmq9a7qc, run wf_bc96b504-6b7. Sortie : `work/missions/2026-11-16-criteres-10/CRITERES-10.md`, ajoutée en fin de fb9/MANQUES.md et de carnet-decision/CADRE.md.
- Les boucles calendrier-fb-9 et carnet-9 s'arrêtent à 9. Ensuite : une boucle à 9,5 (deux passes de suite), partant de leur dernière passe, avec CRITERES-10.md.

## Mode autonome (16.11)
- Il ne faut pas attendre son retour. Une décision passe au conseil ou aux personas. Enchaînement prévu :
  1. carnet-9 et calendrier-fb-9 vont à 9 ;
  2. puis une boucle à 9,5 avec CRITERES-10.md ;
  3. puis les liens de l'app.
- Seuls les gestes irréversibles ou externes attendent son accord : déploiement, données réelles, Gemini facturé.

## Suite autonome (16.11)
- Workflow `suite-autonome`, task w6pd4nugf, run wf_67a37ba3-499. Sorties dans `suite/` : SESSIONS.md, CHOIX-OUVERTS.md, DECISIONS.md. Le PORTRAIT est recalé par l'étalonnage.
- Au retour, relancer les sessions qui ont des constats ouverts (message de 700 caractères au plus).
- Rejouer en ligne, sur ZZ TEST, les corrections taguées.
- Appliquer DECISIONS.md.

## Vues adaptées au calendrier global (16.11)
- Workflow `vues-calendrier`, task wdgi3y97z, run wf_fd0cc2ba-cf2. Sorties dans `work/missions/2026-11-16-vues-calendrier/` : INVENTAIRE.md, finance/m1 à m3, PLAN.md, page/.
- Au retour : publier la page et ajouter sa ligne à Pages. Faire choisir le mode finance par les personas, et le brasseur le verra.

## Thèmes comme le + (16.11)
- Workflow `themes-calendrier`, task wzn6vkgmr, run wf_8aa4818e-66e. Sortie : `vues-calendrier/themes/` (ta, tb, tc, CRITIQUE.md, page). Au retour : publier la page.

## Relances du 16.11 (après suite/SESSIONS.md)
- Relancées : Finances, Atelier, Menu, Recette, Fûts, Stock, Simplicité (vote du conseil) et Besoins (calendrier propre abandonné au profit de fb9).
- Non relancée : Matériel, qui attend un /compact du brasseur.
- À grouper pour lui : la vente réelle de 5 695,00 de l'Atelier (constat 12).
- vues-calendrier a repris (task w67d2yjw3) avec la lecture corrigée : un calendrier général et un calendrier par section.
- themes-calendrier est arrêté, sa lecture était fausse.

## Ordre (16.11, « attendre que le 9.5/10 soit terminé »)
1. fb9 atteint 9.
2. Une boucle à 9,5 avec CRITERES-10.md.
3. Ensuite seulement, les calendriers de section (Finances d'abord) sur cette base, en reprenant PLAN.md de vues-calendrier.
- Les maquettes finance m1 à m3 du 16.11 ne servent que d'exploration du contenu : ne pas les publier comme choix final.

## Méthode changée (16.11) : calendrier-85
- fb9 est arrêté après p3, qui tournait à vide : p1 à 6,9, p2 à 7,3, p3 à 7,2, toutes sous fb (8). p4 est resté inachevé.
- Workflow `calendrier-85`, task wv5b7urpi, run wf_41571955-632. Sortie dans `c85/` :
  - le repos de fb rendu lisible seul (r1 à r3, avec le paysage) ;
  - puis quatre lots ajoutés sous garde de lisibilité : gestes, ajout, trier, sources ;
  - puis trois juges, avec 8,5 pour cible.
- Livrables : page4/ et jouable/. La boucle à 9,5 est abandonnée, la cible devient 8,5.
