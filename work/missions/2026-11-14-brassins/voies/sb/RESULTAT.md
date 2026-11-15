OK — d1b et c2a portés : banc, 11 captures ouvertes, écarts corrigés ; bug du jour figé réparé ; 1 test d'intégration à adapter.

## Fichiers écrits
- Neufs : `src/ui/production/brasser/` (cuveModel.ts, FeuilleBrasser.tsx, brasser.css), `src/ui/production/creer/` (creerModel.ts, ListeCreer.tsx, CarteApres.tsx, creer.css), `tests/unit/port-sb-brasser-creer.test.tsx` (22 tests).
- Câblage : `QuickActionModal.tsx`, `App.tsx`, `ProductionTab.tsx`. `src/ui/production/recettes/` non touché.
- Voie : `INVENTAIRE.md`, `banc.mjs` (horloge figée au sam. 14.11.2026, fermenteur 72 L, brassins ZZ qui occupent la cuve, dry hop dim. 15, Pils en bouteille mar. 17), `captures/` (11 PNG), `journal.json`, `tests.txt`.

## Critères
- G1 : TSC OK.
- G2 : TESTS OK (`npx vitest run port-sb`, 22/22).
- G3 : CAPTURES OK (11 captures, toutes ouvertes ; banc : « BANC OK 11 captures », aucun geste sans effet).
- G4 : HORS OK.
- Intégration rejouée (5 fichiers) : 23 verts sur 24, 1 échec (voir DÉCISION).

## Liste des écarts relevés (capture contre maquette) et suite
1. Titre de la feuille trop grand (18 px contre ~14 px) : corrigé (`text-sm` sur brew-batch).
2. Poignée de la feuille (maquette) absente : ajoutée sur mobile (`sm:hidden`).
3. Légende sans nom de brassin (maquette : « dry hop NEIPA », « Pils en bouteille ») : ajoutée, depuis les rendez-vous de la fenêtre.
4. Un « 20 » avec bouteille, absent de la maquette : fixture du banc (bottlingDate de la Pale Ale retirée), pas le port.
5. « Planifier » refusé dans le banc (matériel non figé, AM-47, comportement réel de l'app) : les recettes du banc portent l'installation figée (72 L).
6. Toast « LOT-001 préparé » sur la capture « après » : attente portée à 6,5 s.
7. Effets de la carte « après » : liste complète des ingrédients sur 3 lignes ; maquette « Malts, Citra 100 g, Verdant IPA » : malts regroupés en « Malts ».
8. c2a 1280 : deuxième colonne coupée dans la feuille (media query sur la fenêtre) : container query à 640 px, une colonne dans la feuille.
9. c2a vide : titre collé à la carte, aperçu sans pastilles ni ↶ : marge, trois rangées stock / achats / cuve avec pastille et ↶ (grisées), comme la maquette.
10. Non corrigés, dits en ACCORD : « F3 pleine (Pils) » devient « cuve pleine » (ACCORD 1) ; pas de ligne « F3 après la Pils · Conditionner › » (ACCORD 8) ; pas de ↶ par effet dans « après » (ACCORD 4) ; la carte « après » est au-dessus du titre de la liste e6a, pas dans la liste (la liste n'est pas dans mon OWNS) ; état « geste » de c2a = la feuille d1b ouverte depuis la liste (le brassin n'est créé qu'à « Planifier »).

## Bug du pilote (jour figé après confirmation non reçue) : corrigé
- Cause : `pendingBatch` est une ref ; la feuille ne savait pas que le brassin était déjà écrit.
- `QuickActionModal` garde `jourAttente` (la date du brassin en attente) et la passe à `FeuilleBrasser` (`jourFige`).
- Feuille : jours désactivés, jour choisi = jour écrit, « Prendre … le premier libre » masqué, phrase « Le brassin est déjà écrit pour <jour> : sa confirmation n'est pas reçue », bouton « Confirmer l'enregistrement » (rejoue la confirmation, même jour). Remise à zéro à l'ouverture, au refus confirmé et au choix d'une recette.
- Test ajouté : `port-sb-brasser-creer` « brassin déjà écrit… le jour est figé… ».

## DÉCISION À PRENDRE
- `tests/integration/batchScheduling.test.tsx > keeps a failed acknowledgement reviewable and retries without a duplicate` échoue : il cherche « Planifier dim. 27.09 » après l'échec ; le bouton dit maintenant « Confirmer l'enregistrement ». Je n'y ai pas touché (consigne du pilote). Recommandation : l'adapter (cliquer « Confirmer l'enregistrement » à la place de « Planifier dim. 27.09 »), c'est le comportement voulu.

## ACCORD (inchangés, de la reprise précédente)
1. Cuves F1, F2, F3 absentes des données : la cuve est « pleine » en litres sur `fermenterCapacityL`. 2. Volume de la recette (curseur retiré). 3. « À définir » retiré. 4. Pas de ↶ par effet. 5. Réservation par le brassin `planifie`. 6. Fin de cuve : `bottlingDate`, sinon plan, sinon dite non datée. 7. Date de la Pils fictive. 8. « Conditionner › » non porté. 9. Pastille « prévue » à la place de « réservée ». 10. Après « Planifier » : `CarteApres` au-dessus de la liste.

## Doutes
- Le chevauchement futur n'est pas contrôlé : seul le jour de départ est testé contre l'occupation.
- Non vus : 1280 de d1b en thème cave, 390 cave de c2a (seul d1b cave et 1280 clair vus). Le jour figé (bug) est testé en jsdom, pas rejoué dans Chrome.
- Build non lancé.

CONNAISSANCE : une recette sans `brewhouse.equipment` fige « Planifier » (AM-47) : tout banc de brassage doit la porter. Un module `@container` règle une grille dans une feuille ; une media query de fenêtre la casse.
LEÇON PROPOSÉE : un script Node de remplacement qui contient `\d` ou `\'` dans une chaîne perd la barre inverse (revenu dans cette voie : regex du jour figé) ; relire la ligne écrite et lancer `tsc`.

## Corrections ksb (15.11)

Preuves : G1 `TSC OK` ; G2 `TESTS OK` (27 tests port-sb, dont 5 neufs) ; G3 `CAPTURES OK` ; G4 `HORS OK` ; 5 fichiers d'intégration : 24 verts. Banc rejoué (11 captures de 22:43-22:44), ouvertes une à une.

c2a
- [x] 1 (bloquant) Pastille de style en couleur : `BeerStyleTag` + `styleCourt` (la pastille des cartes Brassins) sur chaque carte et sur la carte après (APA vert, Blonde jaune, NEIPA lime, Saison orange, Stout lavande, Pilsner jaune). Vu en capture 390 et 1280.
- [x] 2 (bloquant) 1280 : la feuille de la liste passe en `size="xl"` (`QuickActionModal`) ; la container query de 640 px donne deux colonnes, six cartes visibles, la « Brasser ZZ-021 » comprise. La feuille d1b reste en `lg`.
- [x] 3 Picto cuve de la maquette en tête de « La cuve est libre mer. 18.11 » (`PictoCuve`).
- [x] 4 Après : levure au nom seul (« Malts, ZZ Saaz 60 g, ZZ Levure US-05 »), une ligne à 390.
- [x] 5 Vide : les ↶ de l'aperçu sont retirés (l'après n'en a pas, ACCORD 4).
- [x] 6 Vide : picto « Cuve libre » = le picto cuve.

d1b
- [x] 1 Ligne du stock : les malts se regroupent en « malts » ; Saaz et levure gardent leur nom d'article. Reste sur deux lignes à 390 avec le nom fixture « ZZ Levure US-05 » (préfixe ZZ du banc ; la maquette dit « US-05 ») : écarté, c'est la fixture. Détail complet dans le stock déplié.
- [x] 2 Loin (28) : la raison ajoute l'événement de cave connu : « ZZ NEIPA est en garde depuis le 19 » (garde commencée avant le jour choisi, sans mise en bouteille datée entre-temps ; sinon rien). Sans article (« la ») : le nom du brassin n'a pas de genre connu.
- [x] 3 Sous-titre « 24 L · cuve de 72 L · le stock se réserve à la planification » : dans l'en-tête de la feuille (QuickActionModal), sous le titre, `text-xs` gris collé au titre. Retiré du corps de la feuille. Le test « capacité non renseignée » vérifie maintenant la raison « La capacité de la cuve n'est pas connue ».

Doutes de la critique
- Contenant de c2a : feuille « Nouveau brassin » par le + (non une page) : ACCORD, le pilote tranche. Recettes est pris par r2a, la feuille se défend ; à dire au brasseur.
- Chiffres du banc (6,6 % et 24 L partout, Blonde OG 1,048) : fixture, pas le port. Écarté ici (banc.mjs non repris) ; une fixture par recette reste à faire.
- Liste e6a « Tous 5 / 6 brassins » : hors OWNS (e6a). Écarté, à router vers la voie e6a.
- Bandeau « Compagnon hors connexion » sur la 2e carte : banc local. Écarté.
- Captures manquantes (c2a cave, d1b cave 1280, stock déplié, semaine suivante, ZZ-021 à 390) : non reprises ; à 1280 la carte « Brasser ZZ-021 » est visible. Capture cave d1b 390 refaite et ouverte.
