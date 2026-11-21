# Bugs de la chaîne PRODUIRE (21.11, partiel : idée → recette → brassin)

Ce document ne remplace pas `work/missions/BUGS.md` : c'est le pilote qui y verse ces bugs.

**Banc.** Worktree `port-carnet`, HEAD d5a2f056c, avec les modifications non commitées d'une autre session. Vite de dev, `?dev-local`, 390×844 tactile, Chrome sans écran.

**Données.** Le seed redirigé vers `Documents/Brasserie/src/data/seedData.ts` reprend le banc du 20.11. Ce fichier contient la vraie comptabilité (voir l'en-tête de `seedData.example.ts`). Le banc a donc été abandonné en cours de route. Les captures restent hors dépôt, dans `%TEMP%/wf-produire/cap/`, et ne sont pas commitées. Chaque bug est à **rejouer sur la fixture simulée** (REPRISE-produire.md).

Statut : « vu » = observé au doigt sur ce banc ; « code » = cause lue dans le code, non prouvée sur la fixture.

| N° | Gravité | Type | Constat |
|---|---|---|---|
| WFR-1 | bloquant | intégration | « Enregistrer et préparer un brassin » refuse une recette **neuve** |
| WFR-2 | majeur | interaction | Le style ne se filtre pas en tapant : 315 styles par ordre alphabétique |
| WFR-3 | majeur | intégration | Le malt ajouté depuis le stock entre à 0 kg, puis bloque le lancement |
| WFR-4 | majeur | interaction | Le récap dit « Enregistrable · prêtes pour le brassin », mais le lancement renvoie corriger |
| WFR-5 | majeur | workflow | Après « Enregistrer la recette », retour au Bord : la chaîne vers le brassin est coupée |
| WFR-6 | mineur | visuel | Le bouton flottant « + » reste par-dessus l'assistant plein écran |
| WFR-7 | mineur | interaction | Échap dans le menu « Plus » du récap ferme tout l'assistant |
| WFR-8 | à mesurer | performance | Tâches longues de 560 à 810 ms aux étapes clés de l'assistant |
| WFR-9 | bloquant | donnée / intégration | Feuille Brasser : « Écran indisponible » dès qu'une levure a un nom (fixture ZZ TEST, build de test) |
| WFR-10 | à confirmer | workflow | Feuille Brasser d'un brassin prévu le 01.12 : « Commencer aujourd'hui » offert le jour même |

## WFR-1 — « Enregistrer et préparer un brassin » refuse une recette neuve (vu)

**Geste.** + → Recette → identité (le matériel affiche « Système 30L (Actuel) ») → malts → levure → Récap → « Enregistrer et préparer un brassin ».

**Effet.** Un bandeau rouge s'affiche (capture 16-feuille-brasser) :

> « Le matériel de cette recette n'est pas figé. Ouvre « Modifier la recette », puis choisis « Adapter à mon matériel actuel » avant de lancer un nouveau brassin. »

Le message renvoie à l'écran où il est déjà. Il n'y a aucun bouton « Adapter ».

**Code.** Le contrôle `recipeInstallationAdoptionIssue` (App.tsx l.889-891) lève l'erreur **avant** `saveRecipeConfirmed`. La recette n'est donc pas enregistrée ; seul le brouillon local reste.

**Cause probable.** BrewWizard.tsx l.1770 ne fige `brewhouse` que si `rig?.equipment`. Or `activeProfile.equipment` existe (le message choisit la branche « Adapter »). La forme exacte de la config peut venir de ce seed ancien : à prouver sur la fixture.

**Phrase prédite.** « Je viens de la créer, ma recette, c'est quoi ce matériel pas figé ? »

**Doit.** Une recette neuve, faite sur le matériel actuel, se fige d'elle-même et se lance en un toucher. Sinon, le bandeau porte le bouton qui règle le problème.

## WFR-2 — Le style ne se filtre pas en tapant (vu)

**Constat.** Le champ « NEIPA, Stout, Saison… » (`textarea[name^=filter]`, `inputMode=none`) ouvre une liste de **315 styles** par ordre alphabétique (capture 05). J'ai tapé « Dub » avec le focus posé : la valeur est restée vide et la liste n'a pas bougé.

Pour une Belgian Dubbel, il faut faire défiler environ 60 entrées au pouce. Nommer la règle (`inputMode=none` voulu « sans clavier » ? D230) avant de corriger.

**Phrase prédite.** « Je dois scroller toute la liste pour trouver Dubbel ? »

**Doit.** Rester sans clavier si c'est la règle, mais ouvrir près des styles récents ou du style deviné du nom, avec un index par famille.

## WFR-3 — Le malt du stock entre à 0 kg (vu ; déjà relevé par moins-de-gestes v04)

**Constat.** La pastille « Ajouter Caramünch Typ 2 : 600 g en stock » ajoute la ligne à **0 kg** (« 0 % du grain »). L'OG ne bouge pas. Au lancement, l'erreur « Quantité de Caramünch Typ 2 : à compléter » renvoie à l'étape Malts.

Ses mots, v04 : « l'ajout du malt suggère ajoute une quantité qui fait sens ». À porter avec v03, au passage de l'écran Recette.

## WFR-4 — Le récap se contredit au lancement (vu)

**Constat.** Le récap affichait « Enregistrable · À compléter · 2 repères avant brassin · enregistrement possible », sans signaler ce qui bloquait. Le toucher « Enregistrer et préparer » a ensuite renvoyé à l'étape 2, avec « 2 valeurs à corriger » (malt à 0 kg, aucune levure).

Une fois ces deux valeurs corrigées, le récap disait « Données prêtes pour le brassin », et WFR-1 a bloqué malgré tout.

**Cause.** Le récap ne prévient pas avec le même contrôle que celui du lancement.

**Doit.** Le récap annonce ce qui bloque le brassin avant le toucher, et le bouton dit pourquoi.

## WFR-5 — Après « Enregistrer la recette », la chaîne vers le brassin est coupée (vu)

**Constat.** L'enregistrement prend 2,5 s, dont une tâche longue de 807 ms, puis l'app revient au **Bord**. Aucune vue de la recette, ni « Brasser », ni date.

Pour la brasser, il faut ensuite passer par Brassins → Recettes → fiche → « Brasser » : 4 touchers mesurés le 20.11 (P2), plus la feuille de date.

## WFR-6 — Le « + » flottant recouvre l'assistant (vu)

**Constat.** Le bouton « Actions rapides » (56 px, en bas à droite) reste affiché sur l'assistant plein écran. Au récap, il cache la plage « 50–120 » de la ligne Eau (capture 16). À l'identité, il chevauche le bas de l'écran (capture 03).

**Doit.** Il est masqué dans un écran plein (assistant, compagnon).

## WFR-7 — Échap dans « Plus » ferme l'assistant (vu, ordinateur)

**Constat.** Avec le menu « Plus d'actions » du récap ouvert, Échap ferme **tout** l'assistant au lieu du seul menu. Le brouillon est repris à la réouverture. Au téléphone, c'est le geste de retour qui est à vérifier.

## WFR-8 — Lenteurs de l'assistant (à remesurer sur build)

| Geste | Tâche longue mesurée |
|---|---|
| Eau → Récap | 600 ms |
| Récap → Enregistrer | 807 ms (2,5 s jusqu'au Bord) |
| Enregistrer et préparer | 558 et 655 ms |
| Levure | 320 ms |

Ces mesures viennent d'un serveur Vite de dev (React de dev), qui majore les temps. Elles sont à remesurer sur le build de test (REPRISE). Ses mots du 21.11 : « Il y a beaucoup de lenteur sur les actions du calendrier... ».

## WFR-9 — Feuille Brasser : écran indisponible dès qu'une levure a un nom (vu sur la fixture, 21.11)

**Banc.** Build de test `distf` (config `produire/vite.produire.config.mjs`, seed redirigé vers `seedData.example.ts`), fixture « ZZ TEST » (`produire/fixture-produire.mjs`), 390 tactile. Brassin planifié « ZZ TEST IPA » : Brassins → « Brasser » → « Écran indisponible · Impossible de charger cet écran ».

**Constat.** Reproduit à 5 reprises avec `yeast: { name: 'ZZ TEST US-05', … }` sur la recette figée. Sans `name` (et avec `stockItemRef`), la feuille s'ouvre, sans erreur console : `captures/c2-cpu4/02-02-feuille-brasser.png`.

**Pile (build de test).** `TypeError: Cannot read properties of undefined (reading 'normalize')` à `yl` (chunk useLiveData), appelé par `Jp`, `ud`, puis `li` (BrewEquipmentSummary) ; `yl` = normalisation NFKD, donc un nom `undefined` passe dans la recherche de levure. Le chemin est `fermenterRecommendation` (`src/domain/fermenterPlanning.ts`, l.24-26) : `findRecipeYeastMatches(yeast.name, withDocumentedYeastNames(refs))`.

**Cause.** Non prouvée au code exact. Ce qui est établi : la branche « nom de levure sans `hopIndexId` » lève l'erreur, et l'ajout d'un `brewhouse` figé ne la supprime pas. Probable : une entrée du catalogue de levures sans nom, lue par `withDocumentedYeastNames`. À vérifier avant correction.

**Doit.** La feuille Brasser s'ouvre pour toute recette figée avec une levure nommée. Sinon, un message et un retour, non un écran vide.

**Contournement de banc (fixture seulement).** `stockItemRef` au lieu du nom. Le défaut reste ouvert dans l'app.

## WFR-10 — « Commencer aujourd'hui » sur un brassin prévu le 01.12 (à confirmer, 21.11)

**Constat.** Capture `captures/c2-cpu4/02-02-feuille-brasser.png` : en-tête « Prévu le 01.12.2026 · Changer la date », et le bouton principal « Commencer aujourd'hui » est actif, sans demande de confirmation ni de date. Le brassin peut donc démarrer un autre jour que celui qui est prévu.

**Pourquoi « à confirmer ».** Ce peut être voulu (brasser en avance). Son usage décide, pas la lecture seule. Ne pas corriger sans sa réponse ; c'est un choix de goût (L24).

## Non joué (REPRISE)

- Date du brassin : joué sur le planifié (2 touchers, WFR-10 ci-dessus).
- WFR-1 : **non rejoué dans cette passe** (le wizard de recette neuve, « + » → Recette, n'a pas été joué). Confirmé au 20.11, non confirmé ni infirmé sur la fixture.
- Calendrier (C4) : non joué.
- Jour de brassage (C5) : ouvert seulement (écran d'eau, relevé dû), pas d'étape jouée au-delà.
- Fermentation : densités (C6), non joué.
- Conditionnement : stock produit, fûts (C7), non joué.
- Coût dans Finances (C8), non joué.
