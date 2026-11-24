# État des tâches — 23.11 soir, après le tour 26 (b44b191d3, index-Bl2OF9G2.js)

## Reprise (24.11 nuit, session pilote f97e7359 ; mission work/missions/2026-11-23-reprise-soir/MISSION.md)
- En ligne : tour 44 (tag en-ligne/2026-11-23-tour44, index-Cz4Lt44o.js ; tours 27 à 44), aiTask mise à jour aux tours 28, 30, 34. deploy-leger.sh : ligne T sur tour44 → passer à tour45. Méthode (brasseur, 23.11) : « les seul vrai tests sont ceux sur la vrai app » : déployer chaque lot, puis test d'écran en ligne par un critique Opus sur ZZ TEST (Chrome de débug 9222, jamais fermé), soldes et période du Calendrier remis à l'identique.
- Fait et vérifié en ligne : étapes de lecture d'un lien (D448) ; T25-8, T26-1..4, BL-7, T28 (sauf restes), T30, frise : cœur reconstruit (d3, état unique ; 26 fonctions gardées, relecture), bord à bord et traits continus, menu +, saisie : coche sans justificatif, date en direct, avis de version en bas ; écritures : E35, E38, E40 en grande partie.
- Écritures : test en ligne du tour 44 : 0 bloquant ; E35, E38, E40, E41, E43 vérifiés en ligne ; restent E44-1 (dates annoncées d'une récurrente à payer), E44-2 (confirmation du retrait muette sur le remboursement lié), E44-3 (« N° de facture » sur un apport) ; bandeau d'erreur serveur en anglais (firestoreRepo.ts).
- Prochaine action : E44-1..3, puis le point (5) de la demande : reste de l'état des tâches (Carnet : Q-1..Q-6, filtres D437, L-24, CA13 ; Calendrier : CALP-6, CALP-13, bandeau « Enregistrement… », lenteur ; méthode : test de propriété instable, CI, web-vitals…).
- Test par modèle de la frise : vert 200 × 2 graines sur aadbb914f (voie modele2) ; build du banc à refaire avant chaque série (cause du faux rouge « An ≠ 21,9 sem. »).
- Décisions du pilote ce soir : période de l'app fixe (T32-1, son choix du 22.11) ; barre tenue au bord : la frise s'agrandit (son choix CAL-BARRE-BORD) ; Autres entrées à part des Ventes ; apport hors du total des Ventes, tirelire ; parcours Calendrier remplacé par e2e/calendrier (CALP-14). À lui montrer si besoin : rangée à part pour les apports.
- Ouverts notables : CALP-6, CALP-13 ; BL-13, BL-14 ; facture lue par l'IA, 1280 et thème sombre jamais testés ce soir ; dépense IA ≈ 0,5 CHF ce soir (journal ia-journal.jsonl).

## Reprise (23.11 soir, session pilote close à la demande du brasseur ; vérifié par git et fichiers, pas de mémoire)
- En ligne : hosting tour 26 = b44b191d3 (tag en-ligne/2026-11-23-tour26, index-Bl2OF9G2.js) ; aiTask déployée depuis b44b191d3. origin/main = 9e22f0e2a ou plus récent (= b44b191d3 + documents du pilote : CHOIX.md, D448, cet état, journal IA fusionné).
  Copies : port-carnet = b44b191d3 (fusion + mise en ligne ici ; modifs NON commitées d'une autre session dans src/domain/stock/murDonnees.ts,
  src/ui/stock/EnteteRayon.tsx, MurStock.tsx, work/missions/2026-11-20-frise/REPRISE*.md : à préserver, jamais déployées car deploy-leger
  construit depuis un worktree propre). lecture-liens = 75b6393e3 (fusionné). fix-t25 = b44b191d3 (fusionné). Pilote Brasserie = même commit que main.
- deploy-leger.sh : ligne T réglée sur tour26 → passer à tour27 au prochain envoi. REGLES (vitest tests/unit/proprietes) a échoué une fois
  puis passé au 2e essai sans changement : test de propriété instable, à trouver (graine à fixer).
- Lecture des liens (D446, D447, ses mots du 23.11 dans SPEC) : cascade plateforme → schema.org (htmlmetaparser) → HTML (htmlparser2)
  → markdown + Flash-Lite, Hydrogen en escalade ; page bloquée par défi : url_context Flash-Lite (lit la copie de Google ; google_search exclu,
  il invente ; Chrome sans écran non branché, lienNavigateur.ts présent, aiTask reste à 512 MiB). Étapes au fil de l'eau : champ etapes
  [{nom, statut trouve|absent|douteux, detail}], flux sendChunk + document lecturesLiens/{jeton}, reprise par {jeton, reprise:true}.
  Banc permanent 63 liens : npx tsx scripts/banc-liens.ts (lecture-liens, banc-liens/) ; avec IA : prix 96 %, sans JSON-LD 90,5 %,
  photo 95 %, caractéristiques 92 %, 0 invention (pages bloquées hors calcul ; avec url_context : prix 57/57, nom 61/63).
  Rapports : banc-liens/REPRISE-SERVEUR.md, bloquees/RESULTATS.md, outils/gemini/RESULTATS.md, lecture-liens-outils/RECHERCHE.md.
- Test en ligne tour 25 : 5/7 liens justes, défauts T25-1..9 (tour25/RAPPORT.md) ; corrigés 8,5/9 dans fix-t25 (REPRISE-FIX.md :
  T25-8 libellés Galaxus gardés en allemand ; T25-7 « non publié » ×3 devenu une phrase sous la grille = petit écart à la maquette h01-6 ;
  second collage relit encore la page, coûte un appel).
- Contre-épreuve en ligne du tour 26 FAITE (commit 8c02fae9e, tour26/RAPPORT.md, BUGS OK) : T25 corrigés en ligne 8/9 (T25-8 Galaxus :
  libellés allemands et volume non repris) ; page bloquée brouwland lue par Google (159,99 € TTC ≈ 147 CHF, nom juste, sans photo) ;
  défauts neufs T26-1 à T26-4, tous D (libellés Galaxus, « Non publié : Volume » hors sujet, pas de photo brouwland, ligne gardée pour le
  lien mort) ; ≈ 0,06 CHF ; carnet ZZ retiré (Carnets revenu à 15).
- SON CHOIX EST FAIT (D448) : work/missions/maquettes-carnet/CHOIX.md dit tout, sans l'artefact (écran par écran, images locales,
  ses remarques : plus dense, pas le TTC de v06, bouton « Escalader » sur l'échec ; libellé « page bloquée, lue par Google »).
  À porter ; côté app, le type lit déjà etapes, TODO du flux dans src/domain/carnets/. Ligne CARNET-ETAPES-DENSE à DEFAUTS-RECURRENTS.
- Dépense IA réelle (journal ia-journal.jsonl) : copie lecture-liens 1,647 CHF (278 lignes) ; copie Brasserie 0,425 CHF (129 lignes) ;
  les deux journaux se recoupent en partie : journaux fusionnés le 23.11 soir (303 lignes, dans main) : total réel ≈ 1,7 CHF sur les 5 CHF accordés.
  Budget de comparaison des outils (1,5 CHF) épuisé et dépassé une fois (Gemini 0,99 pour 0,8) ; leçon L18 : coût réservé avant envoi.
- Accords en vigueur : mise à jour d'aiTask seule (23.11). Refusés : Diffbot (aucun compte), Claude/Anthropic pour lire les liens, Carbon
  (trop lent), Argon ; Neon coupé (10,7 s). Jamais de contournement de défi anti-robot (CAPTCHA, proxys).
- Ensuite, dans l'ordre : (1) T25-8 et T26-1..4 (mineurs) ; (2) son choix des étapes → port ; (3) Calendrier, reconstruction
  du cœur de la frise (D444, VOIE-LOT-CAL.md) ; (4) restes listés plus bas.

## Reprise précédente (23.11, ~14:30)
- Agent en cours : lecture des liens par méthode standard (copie `lecture-liens`, D446 : cascade schema.org → HTML → Flash-Lite → 3.8 Flash + url_context, banc permanent des 25 liens, rejeu en ligne, objectif prix et photo ≥ 90 %). À son « PRÊT À METTRE EN LIGNE <hash> » : fusionner dans port-carnet, deploy-leger.sh (T → tour25), aiTask seule si changée, puis lui envoyer « EN LIGNE ».
- Fait depuis le tour 22 : tour 23 (bande jamais vide, rangées compactes), tour 24 (lien reste dans le carnet ouvert, bandeau juste, ⋯ Retirer/Déplacer) ; aiTask 4edd21a15 (ordre des champs, URL entière) ; nettoyage de ses carnets fait (D445).
- Cette nuit : reconstruction du cœur de la frise (D444) ; contrat court : work/missions/2026-11-23-calendrier-en-ligne/VOIE-LOT-CAL.md.

## En attente de lui
- Q-4 du Calendrier : vitesse du défilement au bord (à essayer sur son téléphone). (Nettoyage D445 : fait.)

## Registre des bugs (source de vérité)
- work/missions/BUGS.md : BUGS OK, 2101 bugs, 490 ouverts, 202 sources ; en tête, les 10 plus graves (DC-1, MV-9, BR-114, BR-115,
  AM-68, M9-1, LR3-1, LR1-6, AM-33, M-4). T25-1..7, 9 marqués corrigés le 23.11 soir (vérifiés en ligne au tour 26) ; T25-8 en cours.
- Ouverts du Calendrier : CALP-1 à CALP-14 (à revérifier contre les tours 19 à 23, plusieurs sont sans doute corrigés) et CA13-12, CA13-13.
- Ouverts du Carnet : CA13-1 à CA13-11, FIX13-1, GH-1 à GH-4, BL-1, BL-2, BL-4 à BL-15, T26-1 à T26-4 (T26-3 a un état « corrigé/clos » au registre :
  à vérifier). BL-1/2/3 ont été corrigés au tour 24 et GH, BL-4..15 en grande partie par la cascade (banc 63 liens) : à revérifier un
  à un et à marquer au registre ; aucun n'a encore son état mis à jour.

## Calendrier
- Cette nuit (D444) : reconstruire le cœur de la frise sur une échelle de temps standard (d3-scale / d3-time), un seul état
  (période, vue, cadre), affichage dérivé, test par modèle ; inventaire écrit de toutes les fonctions et gestes d'abord, aucun
  perdu ; écran inchangé (ses choix). Règle CAL-ETAT-COHERENT (« 24 sem. » pour 4 ans, rangées vides).
- Avant ou avec : toucher une semaine/un mois → cadre dessus (CAL-TOUCHER-GRADUATION) ; en jours, étiquette « S52 2026 – S1 2027 »
  (CAL-ETIQUETTE-GRAIN-AU-DESSUS) ; graduations rognées au bord ; « J A J O » sans année à 3 ans.
- Bandeau « Enregistrement sur le serveur… » qui reste et couvre la période (cause pas trouvée).
- « −1 663 » sous ± ; bouton de durée en retard pendant le tirage ; barre vidée au tirage à 10 sem.
- Lenteur : jamais mesurée en ligne.
- Preuves en ligne manquantes du tour 22 : jour exact à 3 sem., Ventes +5 695, vente → fiche.

## Carnet
- Accord en vigueur : aiTask peut être mise à jour (seule).
- Étapes visibles (IA-ETAPES-VISIBLES, D448) : à porter selon CHOIX.md, puis preuve en ligne (ZZ TEST, captures 390 regardées).
- Ses choix à porter : Q-1 A (le choix fait le prix), Q-1b B (budget en 1re pastille), Q-2 C (recherche articles et notes),
  Q-5 A (Quand et prix repliés), Q-6 A ; filtres par domaine (D437, puces Local/Brasserie/Meuble/Papiers/Outils, posés par l'IA).
- Lecture d'une photo par l'IA (L-24) ; CA13 moyens et mineurs ; FIX13-1 (prix de la liste ≠ plan), FIX13-2.
- Lecture des liens : T25-8, T26-1, T26-2, T26-4 (mineurs) ; second collage d'un même lien relit encore la page (un appel IA).
- Contre-épreuve complète du Carnet sur la vraie app après ces lots.

## Méthode et outillage
- Test de propriété instable (REGLES KO puis OK sans changement, 23.11 soir) : trouver lequel, fixer la graine.
- Mise à jour de l'app : prend ~60 s au 1er chargement (service worker) ; à raccourcir.
- Découper CalendrierTab.tsx et domain/calendrier.ts (fait pour CarnetsVue) — inclus dans la reconstruction de la nuit.
- Remplacer définitivement le parcours figé par les règles (porte légère déjà en place).
- Copie anonymisée de ses données pour les tests locaux (D438, point 4).

## Ensuite (accordés le 23.11)
- CI GitHub Actions ; mesures de vitesse (web-vitals) ; remontée d'erreurs dans une collection Firestore ; tests des règles
  Firestore ; Stryker. (ADB refusé.)
- Puis REPRISE-GENERALE du 22.11 : Eau (alerte à 660), saisie v01s restants, Stock et Autres stocks (données manquantes),
  Matériel (`equipment/undefined`), workflows transverses, Ma levure, Malts/sucres, autres écrans « un à la fois ».
