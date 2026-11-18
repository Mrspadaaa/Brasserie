# Voie p2c — passe 2 de s2d : la conversation sur la frise du brassin

- Mission : 2026-11-14-compagnon
- Agent : concepteur
- Modèle : opus
- Niveau : conception
- Plafond : 60 tours ; 3 essais par critère
- Dépend de : c1
- Décideur en cas de doute : brasseur (par la page de choix) ; pilote pour le reste

## Objectif
La candidate s2d, enrichie et complète : une page `work/missions/2026-11-14-compagnon/voies/p2c/p2c/etat.html` de 12 cadres statiques (non jouables), capturée en clair et en cave, qui montre chaque vue et chaque état du compagnon dans sa forme.

## Entrées
- `work/missions/2026-11-14-compagnon/DOSSIER.md` — la question, la base, les exigences ; **sa section « Données » est remplacée par « Données de la passe 2 » ci-dessous**.
- `work/missions/2026-11-14-compagnon/voies/s2/s2d/etat.html`, `s2d-clair.png`, `s2d-cave.png`, `NOTE.md` — le point de départ, à copier dans ta voie puis enrichir (préfixe de classes `p2c-`).
- `work/missions/2026-11-14-compagnon/critique/SYNTHESE.md` — sections « ### s2d — retouches », « ## Greffes », les défauts de s2d (« ### s2d — … ») et « ## Défauts communs à corriger en passe 2 ». Seulement elles.
- `work/missions/2026-11-14-compagnon/analyse/cap/e11-390-clair.png`, `e12-390-clair.png`, `e14-390-clair.png`, `e16-390-clair.png`, `e17-390-clair.png` — ce qu'il a aujourd'hui pour les nouveaux cadres.

## Possède (seuls chemins où écrire, avec RESULTAT.md)
- `work/missions/2026-11-14-compagnon/voies/p2c`

## Consignes
Charger d'abord `boosters-ux`, `impeccable`, `ui-design-system`. Garder l'idée de s2d : c'est elle que le brasseur choisira ; prendre les greffes utiles d'ailleurs. Corriger tous ses défauts et les défauts communs. Pas de Fable, aucun sous-agent.
Cadres (`data-cadre`), tous dans la forme de s2d :
- `accueil` — depuis le jour de brassage, brassin 31, fermentation J+4 ; questions suggérées ; mode et limites compacts.
- `attente` — 2:29 en Approfondi, étapes, 2e question en file.
- `reponse` — réponse **attention** (question 2 ci-dessous) avec proposition applicable, prochain contrôle, détails repliés (« relu deux fois · calculs refaits · 3 sources »).
- `erreur` — hors ligne : envoi à confirmer, question gardée sur le téléphone ; et, en petit dessous ou à côté, l'erreur serveur relançable, distincte.
- `finances` — ouverte depuis Finances « Vérifier mes opérations » (teinte area-finances #86B9E6), question préremplie longue, l'accueil propre aux finances (Comprendre mes dépenses, Préparer un achat de matériel, Prévoir mes prochains paiements, Préparer l'année 2026).
- `conversations` — « Mes conversations » : New England IPA (réponse prête), Brassin 31 · Blonde de garde (en cours 0:40), Brassin 29 · Stout (échec, à relancer), Mes finances (réponse prête) ; supprimer à un toucher de plus, pas de corbeille rouge au premier plan.
- `plafond` — « Budget IA du mois atteint » (15,00 sur 15 CHF), sortie : régler les limites ; la question est gardée.
- `urgent` — « La cuve dépasse 24 °C : refroidis maintenant. » ; action « Ouvre la circulation de glycol et contrôle la température toutes les 30 min. » ; forme différente d'attention, lisible à 2 m.
- `fournisseurs` — question « Galaxy introuvable chez moi, je le remplace ? » ; Citra T90 pellets 100 g, Houblons Suisses SA, 9,50 CHF, annoncé en stock ; Galaxy T90 100 g, Brasserie Service Romand, 11,20 CHF, indisponible ; « annoncé », jamais confirmé ; aucun achat fait par l'app.
- `limites` — réglages ouverts : questions du jour 4 sur 120, budget du mois 2,10 sur 15 CHF, plafonds réglables, « Suspendre l'IA », notification à la réponse.
- `zero` — « Repartir à zéro ? » : les échanges s'effacent, recette et notes restent.
- `bureau` — un cadre 1280 × 760 : la réponse attention à l'ordinateur (panneau latéral ou feuille, au choix ; la largeur doit servir).

## Données de la passe 2 (remplacent le scénario « dry hop chargé », faux en brassage : 9,0 g/L est une dose usuelle de NEIPA)
- Question 1 (accueil, attente) : « La fermentation est à 19 °C depuis 36 h et la pression monte doucement : que faire ? » → réponse **info** : « Fermentation normale : laisse monter. » ; action « Garde 19 °C ; le Citra de J+2 se fait pendant cette activité. » ; prochain contrôle « Densité à J+4 : vers 1,020, passe à 20 °C pour finir. »
- Question 2 (reponse, bureau) : « Dégustation J+8 : ça sent l'herbe coupée, que faire ? » → réponse **attention** : « Herbacé : écourte le contact du dry hop. » ; action « Purge les pellets du Galaxy ce soir ; pour le Mosaic J+9, 2 jours de contact au lieu de 3. » ; pourquoi (replié) : contact long à 19 °C ; 9,0 g/L reste une dose usuelle de NEIPA, ce n'est pas la dose ; prochain contrôle « Goût à J+10, avant la garde : l'herbacé doit reculer. » (se garde au journal en un geste).
- Proposition (3 champs, cases, rien appliqué sans validation) : contact Mosaic J+9 3 → 2 j ; température du dry hop 19 → 17 °C ; Mosaic J+9 43 → 35 g (décochée par défaut, « facultatif ») ; dose totale 9,0 → 8,6 g/L si cochée.
- Brassin 31 · New England IPA, 19 L ; dry hop Citra J+2 85 g, Galaxy J+6 43 g, Mosaic J+9 43 g ; DF 1,012 relevée ; questions suggérées : « La pression monte : je purge ? », « DF 1,012 : la levure a fini ? », « Galaxy : je garde 43 g ? », « Combien de jours de garde ? ».

## Exigences transversales et acquis (recopiés, leçons L05 et L06)
- Aucun nom de modèle ni de fournisseur d'IA (ni Gemini, Google, Flash, Pro, Hydrogen, 3.8), ni « USD », ni lien externe de dépenses.
- Premier plan léger, détail à un toucher ; chrome compact ; le mode n'est jamais affiché pendant la lecture d'une réponse ; peu de texte ; verdict et geste d'abord, nombres et unités collés par une espace insécable ; mono pour les mesures seulement.
- Rien appliqué sans cases cochées puis validation ; hors ligne : question gardée ; trois modes ; questions suggérées ; remise à zéro confirmée ; « Mes conversations » ; notification ; limites réglables ; « Reformuler » et « Relancer ».
- Au doigt à 390 ; jamais type="number" ; virgule décimale ; deux thèmes (cave : l'ambre reste au niveau Attention, le primaire suit DESIGN.md) ; icônes au trait, pas d'emoji ; classes préfixées `p2c-` (L26) ; aucun appel réseau ; aucun bas de cadre vide de plus de 120 px.
- Plancher à enrichir (L07) ; une capture non regardée ne prouve rien (L12) : ouvrir **chaque** capture finale, clair et cave, avant de rendre.

## Critères
Dans `GATES.md`, même dossier. Ne pas le modifier. Lancer chaque `CHECK:` depuis la racine du dépôt.

## Rendre
- `RESULTAT.md` tenu au fil (un cadre par ligne : fait, ouvert en clair et en cave, défaut restant).
- Tests : aucun Vitest ; la ligne « Tests » est `node work/missions/2026-11-14-compagnon/outils/controle-serie.mjs work/missions/2026-11-14-compagnon/voies/p2c p2c --complet > work/missions/2026-11-14-compagnon/voies/p2c/tests.txt`.
- Captures `work/missions/2026-11-14-compagnon/voies/p2c/p2c/p2c-clair.png` et `p2c-cave.png`, toutes ouvertes.
Réponse finale au pilote : une ligne.
