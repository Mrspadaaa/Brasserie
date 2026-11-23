# Relecture sans mémoire de 2026-11-22-REPRISE-GENERALE.md (22.11, 13:54)

Relu contre : BUGS.md (232 lignes « ouvert » ou « en cours » au total), decisions.md D400-D428, SPEC (21 et 22.11),
DEFAUTS-RECURRENTS (21-22.11), ETAT-PILOTE.md, REPRISE*.md de Brasserie et de port-carnet, `git status`, scratchpad.
Limite : relecture rapide (arrêt au plafond de tours). Les points marqués « à vérifier » sont des soupçons, pas des preuves.
Total : 19 manques, 6 faux. Puis une section « BUGS à requalifier ».

## A. Manques

1. **Travail non commité de la correction WFA-15, absent de la liste (tâche 8).** `git -C port-carnet status` : modifiés
   `src/ui/saisie/SaisieMain.tsx`, `src/ui/saisie/modele.ts` (fonction `achatPrevu`, champ `prevu`), `src/ui/saisie/saisie.css`,
   `tests/unit/saisie-main.test.ts`, `scripts/parcours/chaines.mjs` (CH-V1 passe par Écriture › Achat › « ✓ Solde l'achat prévu »),
   `src/ui/calendrier/entete/EnTete.tsx` (import `etiquetteRepos`), `source4-portable-bundle-manifest-01.json`, `work/missions/2026-11-20-frise/REPRISE.md`
   et `REPRISE-JOUR-2.md`. Non suivis : `scripts/parcours/stock-etapes/d7a.mjs`, `work/missions/2026-11-20-frise/REPRISE-CAL-2x/-30.md`,
   `REPRISE-PRIX*.md`, `2026-11-21-workflows-app/REPRISE-V-COUT.md`, `-V-LOT.md`, `-V-RECETTE-session7.md`, `2026-11-22-retour-passe/REPRISE*.md` (6 fichiers),
   `tsconfig*.tsbuildinfo`, `vite.config.js`, `vite.config.d.ts`, un fichier `1`, et une quarantaine de `*.cjs` à la racine (a2.cjs, cap-v0x.cjs, build-v0x.cjs…).
   Phrase à ajouter : « WFA-15 (achat qui solde l'achat prévu) est NON COMMITÉ dans port-carnet (SaisieMain.tsx, modele.ts, saisie.css, saisie-main.test.ts, chaines.mjs) : le commiter par chemins avant le tour 10, sinon il n'est pas dans le hash mis en ligne. HEAD de port-carnet = 434ea3ae4. »

2. **« Avant de couper » ne couvre pas le non-commité de Brasserie.** `git status` Brasserie : modifiés `CLAUDE.md`, `cerveau/LECONS.md`, `cerveau/REMPLACES.md`,
   `.claude/hooks/economie.mjs`, `.claude/launch.json`, `.codex/hooks.json`, `scripts/agents/controle-bugs.mjs`, `controle-bande-semaine.mjs`, `scripts/check-invoice-journey-emulator.mjs`,
   `work/missions/2026-11-14-compagnon/outils/controle-banc.mjs`, des PNG de `2026-10-31-ecran-fermentescibles` et `2026-11-21-workflows-app/acheter/captures` ;
   supprimé en index `2026-11-21-chasse-carnet/voies/v2/RESULTAT.md` ; non suivis (à qui ?) `src/asset`, `src/fermenter`, `src/finance`, `src/stock`, `_srcs.txt`, `_tab.txt`,
   `scripts/banc-t2b-taches.ts`, `tests/unit/banc-t2b-taches.test.ts`, `src/data/hopSources/beeranalytics-*.json`, plus environ 40 REPRISE/RESULTAT non suivis de `2026-11-20-*` à `2026-11-22-*`
   (`2026-11-20-moins-de-gestes/`, `2026-11-20-critique-tour4/`, `2026-11-21-chasse-*/voies/`, `2026-11-21-stock-maquettes/port-REPRISE*.md`, `autres-a-REPRISE-2/3.md`).
   Phrase : « Avant de couper, commiter par chemins : CLAUDE.md, LECONS.md, REMPLACES.md, economie.mjs (si volontaires), tous les REPRISE-*.md des dossiers 2026-11-2x ; ne rien supprimer sans copie (L17). »

3. **Les scripts de mise en ligne dépendent du scratchpad, pas seulement « recopiés ».** `work/missions/outils-mise-en-ligne/deploy-*.sh` existent déjà et sont identiques au scratchpad,
   mais `deploy-tour4.sh` fixe `S=C:/Users/mrspa/AppData/Local/Temp/claude/2574149e6fd34767/.../scratchpad` (ligne 3), écrit dans `$S/p3-<heure>` et lit la base `$S/f2.txt` (échecs vitest connus) ;
   la ligne 23 fixe `T=en-ligne/2026-11-22-tour10`. Hors dépôt et perdus à la coupure : `C:/tmp/rp/ep/ep.mjs` (outil d'épreuve au doigt de la frise, cité par retour-passe/REPRISE-6),
   `C:/tmp/rp/b-arbre` (build), `%TEMP%/menuplus-build-*`, `%TEMP%/port-a1b1` (captures A1/B1). Le dossier `Brasserie/work/missions/2026-11-22-frise-epreuve/` n'existe pas.
   Phrase : « Copier f2.txt et ep.mjs dans work/missions/outils-mise-en-ligne/ ; rendre S (dossier de travail) paramétrable ; le tag du script est tour10 : le changer pour tour11. »

4. **Tour 10 : la dernière parole du brasseur n'est pas citée.** SPEC (fin) : « C'est corrigé et en ligne, ça a déjà été joué en entier pas besoin de tout refaire. Juste corrigé ce qui a cassé »
   (mise en ligne du tour 10 ; WFA-15). `git tag` : aucun `en-ligne/2026-11-22-tour10`. La ligne « Tour 10 » dit « à compléter » sans dire si la mise en ligne a eu lieu.
   Phrase : « Vérifier d'abord `git tag -l en-ligne/2026-11-22-tour10` et l'asset en ligne ; si absent, le tour 10 n'est pas parti (le correctif WFA-15 n'est pas commité). »

5. **Épreuve au doigt de la frise jamais faite (sa priorité du 22.11) et défauts vus à l'œil non repris.** port-carnet `2026-11-22-retour-passe/REPRISE-5.md` « Limites » et `REPRISE-6.md` « Reste » :
   (a) échelle An 390×660 : « prévu nov. 26–nov. 27 » sur deux lignes, « 27 » seul ; (b) à 1 semaine, le picto du premier « Jhhh » déborde sous sa barre ; contrôle « une étiquette de rangée tient sur une ligne » à écrire rouge d'abord ;
   épreuve complète 390×660 puis 844×340 vers `work/missions/2026-11-22-frise-epreuve/EPREUVE.md` (non créé) ; calendrier.mjs étape 9 (G5) et rechargement ;
   `calPasseG3` : cause établie = le test passe `callbacks.periode` comme FONCTION, `fenetreDePeriode` reçoit une période sans genre (CalendrierTab l. 259) ; garde proposée : rendre `null` si `bornes(periode)` est indéfini ;
   `calendrierMenuV12 CHN-3` attend « S47 – S48 2026 » sans année.
   Phrase : « Frise : épreuve complète encore à faire ; défauts (a) et (b) ouverts ; calPasseG3 = garde `fenetreDePeriode` ; voir retour-passe/REPRISE-6.md. »

6. **Capture 38 (SPEC 22.11), points 6 et 7 sans trace de correction.** (6) fiche Jhhh : pastilles « 7 se… », « Com… », « J76 conditionnée » rognées ; (7) « Jhhh · coût à venir » écrit deux fois de suite.
   DEFAUTS CAL-AN-390 cite le point 6 ; aucune ligne BUGS ni phrase de la reprise ne cite le point 7 (à vérifier : grep « coût à venir » dans BUGS et le code).
   Phrase : « CAL-AN-390 points 6 et 7 : fiche rognée et « coût à venir » doublé — à rejouer en ligne ; point 7 sans ligne BUGS. »

7. **Menu du + : les deux KO ne sont pas nommés ; le reste de la voie non plus.** `2026-11-22-menu-plus/ACTIONS.md` l. 28 et 55 : « Entrer une facture » et « Facture » (Finances) = **non** aboutissent
   (« collections qui grandissent : aucune ») ; l. 13-15 : Travaux, Activité, Papier posés depuis la feuille d'ajout du Calendrier, « visible au Calendrier : non » (écrit dans financialPlans/creativeItems) —
   à confirmer, ce peut être un vrai défaut. `REPRISE.md` : (a) rejouer la phase `visible` (deux thèmes demandés avant la règle « un seul thème »), (e) commit de `navigation.css`, `menu-plus.mjs`, `menu-plus-actions.mjs`, (f) contrôle de PLUS-MENU-COUPE = `menu-plus.mjs --phase visible`.
   BUGS : PLUS-FACTURE-FINANCES, PLUS-TOAST-LIBELLE (« Travaux · S47ZZ TEST… »), PLUS-COMPAGNON-LOCAL (à jouer en ligne, HX-1).
   Phrase : « Menu du + : 62/64 ; KO = Finances Entrer une facture et Facture ; Travaux/Activité/Papier non visibles au Calendrier après pose (à confirmer) ; voir ACTIONS.md. »

8. **Workflows choisis et gains non listés.** D393 (A2 appui long 6·12·24, B1 reste à vendre, C1 date en horizons, D2 prix = dernier achat semblable) ; D396 (E2 densité « Comme prévu », F2 recompte rayon par rayon, G3 créé d'abord nommé après) ;
   les 11 gains de `2026-11-21-workflows-app/PORT.md`. `ETAT-PILOTE.md` (fin d'après-midi) « Reste : V-STOCK (F2), CAL-LENT, défauts du graphe de la fiche (REPRISE-V-LOT), geste restant » ; rien dans la reprise
   ne dit si A2, B1, D2, E2, F2 sont portés et jouables. WFR-3, WFR-5 restent ouverts.
   Phrase : « Workflows D393/D396 : état de port à relire dans PORT.md et ETAT-PILOTE.md ; F2 (recompte par rayon) et D2 non confirmés. »

9. **Tâche 17 sous-évalue les lignes ouvertes.** BUGS.md : 232 lignes « ouvert » ou « en cours ». Familles non nommées : WFA (13), WFV (8), WFX (16), WF2 (7), PCN (12) et PC (10), PNC (9), STM (13), STE (13), STG (7), STC (7+7 notes),
   CFP (7), CRU/CRB/CRW (12), T8 (3), CT4C (2), PORT-STOCK (4), AUTRES (4). Seules WX2, WFR, WFP, WFD sont citées.
   Phrase : « Lignes ouvertes de BUGS.md : voir « BUGS à requalifier » du fichier REPRISE-MANQUES ; ne pas les traiter avant de les avoir requalifiées. »

10. **Restes du pilote 21.11 jamais repris.** `ETAT-PILOTE.md` (18:00) : `TESTS-A-RETIRER.md` (D409, « à montrer au brasseur », rien supprimé) ; « registre controle-choix cassé (8 fautes) »
    (relu : `node work/refonte-frontend/v4/choix/controle-choix.mjs` depuis Brasserie sort `MODULE_NOT_FOUND`, à rejouer depuis son dossier) ; PD-5 (import camt, relevé bancaire) « au conseil avant toute maquette » ;
    PD-1/PD-4 côté Calendrier (WFD-5, WFD-8) ; « verser les CHASSE au registre ».
    Phrase : « Restes 21.11 : TESTS-A-RETIRER à montrer ; controle-choix à relancer ; PD-5 au conseil ; WFD-2 bloqué (aucun champ échéance au schéma). »

11. **Stock : « Fait » incomplet, tests rouges non nommés.** Non cité : filtres dynamiques (`src/domain/stock/filtresDynamiques.ts`, pastilles n > 0, 4 à 390 et 6 en large, « brassin » et « récents ») = demande 22.11 « plusieurs filtres dynamiques… sur une seule ligne » ;
    D422 (1) entrée du catalogue Houblons par le titre du rayon (à vérifier en ligne) ; D6 et Fûts d8b non choisis (l'existant reste) ; `stock-maquettes/port-REPRISE-3.md` et `-4.md` : vitest rouges `stockCompteursOnglet` (6), `compactStocks` (pastille ★ épinglés), tests STOCK-TRI-INUTILE.
    Phrase : « Stock : filtres dynamiques portés ; à jouer en ligne ; vitest stockCompteursOnglet/compactStocks à réécrire (port-REPRISE-4.md). »

12. **Carnet : le « reste » de port-carnet/REPRISE-2 n'est repris qu'en partie.** `2026-11-22-port-carnet/REPRISE-2.md` : banc `carnet.mjs --seulement d419` ; captures A1/B1 comparées à `cmp-captures/cmp-{a1,b1}-*.jpg` ;
    BUGS à mettre à jour (CRB-3, CRU-1, CRU-5, CRU-13, CRB-2, CRB-5, CRU-11, ids D419-A1, D419-B1, D419-PLACER) ; doutes : « devis » sans champ, port et frais sans champ d'article (toujours « ? »), lignes « Au sol », mini barre du volume et « CHF/m³ » non portées.
    Tâche 12 ne cite que CRU-3b et CRU-11. Reste ouvert côté maquette A1 : CRB-8 (volume).
    Phrase : « Carnet A1/B1/Placer commités (917a72999) ; banc d419 et captures à rouvrir ; lignes BUGS CRB/CRU à passer à « corrigé par A1 » seulement après le banc. »

13. **Eau › Sels : reste du port non cité.** `2026-11-22-eau-sels/REPRISE-2.md` : P5 (notice d'acide préfixée du nom, `WaterFeedback.tsx` l. 192), P7 (`readiness.ts` l. 9, phrase incohérente), tests `stoutSmoke.test.tsx:53` (interrupteur) ;
    le brasseur a demandé « Fait passer les critiques, avec les persona » : aucune trace qu'elles aient eu lieu après l'interrupteur et les étiquettes. Tâche 2 ne cite pas Eau › Sels. REPRISE-2 « Reste 2 » (retirer l'interrupteur) est CONTRAIRE à 3d2baef23 : ne pas l'appliquer.
    Phrase : « Eau › Sels : critiques à personas à faire ; P5, P7 et stoutSmoke à contrôler ; REPRISE-2 « retirer l'interrupteur » est périmé (3d2baef23). »

14. **Demande SPEC 22.11 sans trace : « Tableau des taches, test, %, éprouvé sur la vrai app ».** (saisie v01s, après D426). Aucun tableau tâches/tests/% dans `2026-11-22-saisie-main/` (NOTES.md, CRITIQUE-v01s-*.md) vu pendant la relecture (à vérifier).
    Phrase : « Saisie v01s : produire le tableau des tâches avec test, % et épreuve sur l'app en ligne, comme demandé. »

15. **« Entrée du clavier mobile confirme » (21.11, D396 G3) : lignes encore ouvertes.** T8-1 (Papiers : Entrée ferme seulement le clavier), T8-2, T8-3 (renommer : la fiche se ferme à Entrée), T8-NOTE-1 ; ETAT-PILOTE dit RENOMMER-EVT et G3 faits.
    Phrase : « Rejouer T8-1 à T8-3 au doigt : Entrée confirme le nom sur Papiers, Idée, Travaux, Activité. »

16. **Données ZZ d'autres sessions à retirer.** T9-NOTE-2 (Calendrier : « Vente 1 × ZZ TEST — parcours r2 vente… » 10 nov. ; « …parcours 10.11… ») ; PC-117 (en ligne : Prévisions nomme l'achat « TEST −12, 07.12 ») ;
    GESTE-MATERIEL-UNDEFINED (tâche 14 couvre le matériel seulement).
    Phrase : « Après le test en ligne, retirer aussi les ZZ de T9-NOTE-2 et PC-117 (lecture seule d'abord ; ne rien supprimer sans accord pour le matériel). »

17. **Leçons proposées non versées.** retour-passe/REPRISE-6 : « un doigt de banc « tenu » se joue immobile ET tremblant (±1 px à 8-16 ms) ; une étiquette qui ne change pas après un geste qui a changé la fenêtre est un défaut » ;
    REPRISE-5 : « un contrôle « texte rogné » doit écarter `.sr-only`, borner sa zone, mesurer par Range, pas `scrollWidth` d'un ancêtre ». Pas dans `cerveau/LECONS.md`. Aussi la correction du 22.11 « Pourquoi rien n'a été testé sur la vraie app ? » (test sans capture) : couverte par L12, à citer.
    Phrase : « Leçons à verser par le pilote : doigt tenu immobile et tremblant ; contrôle de rognage par Range. »

18. **Choix et questions ouverts plus larges que « TodoTimeline ».** Choix du brasseur en attente (BUGS) : PCN-77, PCN-111, PCN-117 (fil de chat / À venir, à dessiner), PCN-141 (note vrac rangée en Matériel) ; CT4C-10 (le + : marge basse ou gouttière) ;
    PNC-12 (étapes finies : « faites ou non ») ; STC-9 (sucres dans Malts : d7a l'a probablement tranché, à confirmer) ; CRB-NOTE-2 (« Performance » sans unité) ; Carnet C non pris (note C3 : « SI sur le calendrier au doigt je peux placer »).
    Phrase : « Accords/choix en attente : PCN-77/111/117/141, CT4C-10, PNC-12, CRB-NOTE-2 ; à montrer en mini maquettes (L24), pas en mots. »

19. **À vérifier : plafond des agents.** La reprise dit « plafond 400 k (hook economie.mjs) » ; CLAUDE.md de l'arbre dit « un agent s'arrête à 200 k (hook) ». `economie.mjs` et `CLAUDE.md` sont modifiés non commités.
    Phrase : « Plafond agents : relire economie.mjs avant de briefer ; commiter CLAUDE.md et economie.mjs s'ils sont cohérents. »

## B. Faux ou trompeur

20. **« Fusion dans main : accordée pour ce port » (tâche 3).** Aucune trace dans SPEC 21-22.11 ni dans decisions.md D400-D428 (grep fusion/merge/main/push : rien d'après D298). CLAUDE.md : push, PR et merge attendent l'accord de l'utilisateur.
    Correction : citer la date et les mots exacts, ou déplacer la ligne dans « Accords en attente ».

21. **Tâche 4 déforme la parole du brasseur.** Reprise : « ne pas tout rejouer avant la mise en ligne ; les jouer ensuite ». SPEC (fin) : « ça a déjà été joué en entier pas besoin de tout refaire. Juste corrigé ce qui a cassé ».
    Correction : « Ne pas rejouer les bancs ; rejouer seulement ce que les corrections ont cassé. Les bancs de la tâche 4 ne sont à rejouer que si un commit les touche. »

22. **« Avant de couper : recopier deploy-tour4.sh et deploy-seul.sh » est déjà fait** (copies identiques, suivies par git), et la ligne 11 renvoie encore au scratchpad.
    Correction : écrire « scripts dans work/missions/outils-mise-en-ligne/ ; reste à copier f2.txt et ep.mjs (manque 3) ».

23. **« port-carnet est poussé par le script ».** `git -C port-carnet rev-list @{u}..HEAD` : « no upstream configured for branch claude/port-carnet-1711 ». Le nombre de commits non poussés de port-carnet est inconnu.
    Correction : « vérifier que le script pousse la branche explicitement (git ls-remote) ».

24. **Tâche 5 : seul `Fenetre.tsx` est cité, mais `EnTete.tsx` est modifié avec lui** (import `etiquetteRepos`). Jeter Fenetre.tsx casse la compilation. De plus l'étiquette est utilisée au repos seulement (`etiquetteRepos`) : la décision touche CHN-3 et le doute de la tâche 6.
    Correction : « Fenetre.tsx + EnTete.tsx vont ensemble ; décider les deux ; rejouer tsc. »

25. **Tâche 15 « TodoTimeline : à lui demander ».** D425 (2) tranche déjà : TodoTimeline, ChiffreACommander, FriseArchives sont ses écrans ; seul le geste de CHOIX d'une date passe à la frise ; s'ils n'affichent que le temps, rien ne change. BUGS CAL-FICHE-FRISE-2 (ouvert) liste TodoTimeline (role=slider, onPointerDown).
    Correction : « TodoTimeline : appliquer D425 (2) ; ne demander que s'il n'y a plus aucune entrée à l'écran (à prouver). »

## C. BUGS à requalifier (id | état actuel | état juste | raison)

Légende : « corrigé » = un commit cité existe ; « remplacé » = le choix ou le port a changé l'écran ; « à rejouer » = non prouvé. Aucun écrit dans BUGS.md.

### Stock (D420 d1a, d2a, d3a/d3b, d5a, d7a, d8a ; D423/D424 Autres A ; tri retiré)
| id | état actuel | état juste | raison |
|---|---|---|---|
| STM-2, 5, 6, 7, 9, 12, 13, 15 ; STC-6, 7, 19 | en cours « V4 corrigé dans l'arbre, 22a5911f8 » | corrigé (22a5911f8), à rejouer sur la fiche d5a | commit existe ; b29e6ca4f « Banc stock : STM-9, STM-13, STC-19 suivent la fiche D5a » |
| STC-2, 17 ; STE-9, 10 ; STG-9 | en cours « V1 corrigé dans l'arbre » | corrigé, à rejouer sur d1a-recompter | commits STC-2 (b76b88853), recompter d1a (D422 2) |
| STG-1, 2, 3, 6 ; STG-NOTE-1 | en cours « V2 corrigé dans l'arbre » | remplacé par d2a / d3b (étagère) | l'étagère est refaite (D420) ; rejouer le banc mur |
| STG-4, T9-4, CT4C-3 (Légende 58×28 recouvre Levures) | ouvert | remplacé par d3b (390) / d3a (1280) | la légende est refaite ; rejouer à 390×660 |
| STG-8 (pastilles à zéro) | ouvert | remplacé | `filtresDynamiques.ts` : pastilles n > 0 seulement (port-REPRISE.md) |
| STE-7 (pastille ★ épinglés) | ouvert | remplacé / à rejouer | pastille `.sz-etoile` déplacée (port-REPRISE-4.md) |
| STE-6, STC-13, STC-NOTE-7 (« EBC non connu » ×N) | ouvert | à rejouer sur d2a/d3b ; reste dépendant des données | fixture sans EBC ; D423 « affiché seulement quand la donnée existe » |
| STC-9 (Dextrose rangé en Malts) | ouvert « décision du brasseur » | remplacé par d7a (sucres) | D420 : d7a choisi |
| STE-8, STC-NOTE-3 (Autres stocks : 4 cartes, Fûts cartes texte) | ouvert | STE-8 remplacé par Autres stocks A (D423) ; Fûts : toujours ouvert | d8b non choisi : « l'existant reste » (D420) |
| STE-9 à 12 (Recompter, Matériel) | ouvert | STE-12 remplacé par d8a ; STE-9 et 10 voir ci-dessus | D420 d8a |
| STE-13 (Fûts : 4 rangées d'outils) | ouvert | toujours ouvert | Fûts hors choix |
| STE-14 à 17, STM-1, 8, 10, 14, 16 (fiche d'un article) | ouvert | remplacé par d5a, à rejouer un par un | D420 d5a ; STM-16 (DDM trois fois) à relire sur d5a |
| STE-11, CT4C-1, WFA-1, WFX-8 (Courses) | ouvert | toujours ouvert | Courses non choisi ; CT4C-1 corrigé en partie (4e81cdd78) |
| STE-NOTE… STG-NOTE-2, STC-NOTE-2/4/5/8 | ouvert | à rejouer avec d5a | doutes 21.11 sur l'ancien écran |
| AUTRES-COMMANDER, -DERNIER-ACHAT, -BRASSINS, -DDM | ouvert « données manquantes » | toujours ouvert, non bloquant | D424 : affiché seulement quand la donnée existe ; reformuler « masqué sans donnée » |
| PORT-STOCK-PCK, -DATE-PRIX, -NPROJETS | ouvert | toujours ouvert | donnée absente du schéma ; aucun champ neuf sans accord (D428 pour la saisie ; à étendre ?) |
| PORT-STOCK-TE46 | ouvert « voie GESTE-DATE-PARTOUT » | à corriger côté test | D425 : DateField → frise ; le test attend un input date |

### Carnet (D417 à D421 : A1 Comparer, B1 prix, Placer)
| id | état actuel | état juste | raison |
|---|---|---|---|
| CRB-3, CRU-1, CRU-5, CRU-13, CRB-5, CRU-11 | en cours | corrigé par A1 (516b9b439, d3b3fbd6a) après le banc d419 | REPRISE-2 port-carnet : à passer ainsi après les bancs ; CRU-13 non reproduit : caduc probable |
| CRB-8 (volume enfoui, colonne coupée) | ouvert | en cours : partiellement remplacé par A1 | « mini barre du volume, CHF/m³ » non portées |
| CRB-6, CRB-NOTE-1, CRB-NOTE-2 | ouvert | toujours ouvert | IA / ruban de dates / unité |
| CRU-3 | en cours (a corrigée, b squelette non vérifié) | en cours | D417 ; b reste |
| CRW-2 (prix non saisissable) | ouvert | toujours ouvert | pas de `modifierArticle` ; B1 ne le crée pas |
| CRW-5 (« Commander » n'existe pas) | ouvert | remplacé en partie | D421 : Choisir crée l'achat prévu puis Placer ; l'état « commandé le… » manque |
| CRW-6 (facture ne retrouve pas le plan du carnet) | ouvert | à rejouer | achat prévu `PLAN-CARNET-<id>` (D421) + WFA-15 « Solde l'achat prévu » |
| PNC-5 (aucun prix sur la carte) | ouvert | à rejouer | B1 rend le prix |
| PNC-6 (« Coller un lien » sur chaque carte) | ouvert | à rejouer | D418 le retire ; `grep` : encore « Coller un lien » dans `src/ui/carnets/ListeCarnets.tsx` |
| PNC-2, 7, 8, 10, 12, 13, 14 | ouvert | à rejouer | critique du 20.11 d'avant D417-D419 ; PNC-12 est une question au brasseur |
| PCN-77, 111, 117, 141 | ouvert « à dessiner » | toujours ouvert (en attente de choix, D415) | fil de chat / À venir non choisis ; PCN-141 cité par 9318af936 : à vérifier |
| PCN-7, 8, 13, 15, 21, 24, 44, 50, PCN-NOTE-4 | ouvert « non vérifiable sans Gemini » | toujours ouvert | aucun envoi réel accordé |
| CRU-NOTE-1 | ouvert | toujours ouvert | IA lente/échec/hors ligne jamais jouée (simulé) |

### Calendrier, frise, geste (D404, D410, D412, D425 ; T9-1 à T9-3 ; CAL-PERIODE-APP-FIXE)
| id | état actuel | état juste | raison |
|---|---|---|---|
| T9-3 | ouvert | corrigé (a3d21c119, d52abb79d) | « 1 j » = Modifier ; commit cité |
| CFP-1, CFP-4, CFP-8 | ouvert | corrigé ? (aad2e248e) ; à confirmer par `geste.mjs` | commit cité, ligne jamais passée |
| CFP-2, 3, 5, 6, 7 | ouvert | remplacé par la frise B portée (D410) ; à rejouer | cadre de la courbe refait (T9-1, T9-2, CAL-PERIODE-APP-FIXE) |
| PC-14, 15, 16, 17, 20, 29, 40, 102, 105 | en cours « correction tour 4 en cours » | à rejouer (état périmé) | le « tour 4 » date du 20.11 ; PC-16 : D404/D425 (frise) ; PC-105 : + volant |
| PC-117 | en cours | ouvert : donnée ZZ à retirer | « TEST −12, 07.12 » en ligne |
| T8-1, 2, 3 | ouvert | à rejouer | Entrée confirme (21.11) ; G3 et RENOMMER-EVT déclarés faits |
| T8-NOTE-1, T9-5 | ouvert | toujours ouvert | cibles sous 44 px ; banc ne trouve plus « Atelier R&D » |
| T9-NOTE-1, 2, 3 | ouvert | NOTE-2 : donnée à retirer ; NOTE-3 : caduc (Chrome in Chrome revenu, mais à rejouer avec captures) | SPEC 22.11 |
| CAL-FICHE-FRISE-2 | ouvert | remplacé par GESTE-DATE-PARTOUT ; reste TodoTimeline, ChiffreACommander, FriseArchives selon D425 (2) | ≈ 50 champs portés, controle-geste-date vert |
| WFX-1 (43 `type="date"`) | ouvert | remplacé en grande partie par D425 ; à recompter | frise partout |
| WFX-13 (période doublée en texte) | ouvert | à rejouer | PERIODE-PARTOUT (FrisePeriode, 21.11) |
| WFX-16 (ordre de la feuille Ajouter) | ouvert | à rejouer | D404 refait la feuille |
| WFP-5 (puce S47 hors écran, carrousel) | ouvert | probablement caduc | carrousel remplacé par la frise Durée (D404) |
| WFX-2 (recette sans date) | ouvert | toujours ouvert | date de recette : r4-a « à dessiner » (D400) |
| WFV-2 (vente prévue non soldée) | en cours « la caisse solde… 92f9d870e » | corrigé (92f9d870e) à rejouer en ligne | commit cité |
| WFA-12, WFA-13, WFA-15 | corrigé | WFA-15 : corrigé SEULEMENT quand le correctif non commité l'est | manque 1 |
| WFD-2 (échéance facture non lue) | ouvert | toujours ouvert, bloqué par un accord de schéma | aucun champ échéance (D428 ne l'accorde pas) |
| WFX-3 (Acheter du matériel : 14 champs) | ouvert | remplacé / à rejouer | d8a Matériel ; saisie v01s |
| WFA-10 (TVA aberrante bloque Confirmer) | ouvert | toujours ouvert | concerne la facture, pas la saisie ; D428 : pas de champ TVA dans la saisie |

### Eau, saisie, menu du +
| id | état actuel | état juste | raison |
|---|---|---|---|
| EAU-SELS-UN-ECRAN | en cours : « interrupteur dans la feuille du sel » | texte FAUX : interrupteur de chaque sel dans la cellule (3d2baef23) ; reste critique personas et mise en ligne | SPEC « On peut plus désactiver les sels ??? » |
| EAU-SELS-ALERTE-660 | ouvert | toujours ouvert | tâche 10 |
| EAU-RADAR-ETIQUETTES, EAU-SELS-INTERRUPTEUR | corrigé sur port-carnet | corrigé après mise en ligne ; vérifier au doigt | non déployé |
| SAISIE-SENS-RECURRENT | en cours « non déployé » | en cours jusqu'au tour 10 ; ajouter WFA-15 | D426-D428 |
| PLUS-FACTURE-FINANCES | ouvert « non vérifiable au code » | ouvert, prouvé par ACTIONS.md l. 28 et 55 | « Confirmer » ne fait rien / aucune collection ne grandit |
| PLUS-TOAST-LIBELLE, PLUS-COMPAGNON-LOCAL | ouvert | toujours ouvert | PLUS-COMPAGNON-LOCAL se joue en ligne seulement |
