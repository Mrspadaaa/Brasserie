# État des tâches — 23.11 soir, après le tour 26 (b44b191d3, index-Bl2OF9G2.js)

## Reprise (23.11 soir, session pilote close à la demande du brasseur ; vérifié par git et fichiers, pas de mémoire)
- En ligne : hosting tour 26 = b44b191d3 (tag en-ligne/2026-11-23-tour26, index-Bl2OF9G2.js) ; aiTask déployée depuis b44b191d3. origin/main = b44b191d3.
  Copies : port-carnet = b44b191d3 (fusion + mise en ligne ici ; modifs NON commitées d'une autre session dans src/domain/stock/murDonnees.ts,
  src/ui/stock/EnteteRayon.tsx, MurStock.tsx, work/missions/2026-11-20-frise/REPRISE*.md : à préserver, jamais déployées car deploy-leger
  construit depuis un worktree propre). lecture-liens = 75b6393e3 (fusionné). fix-t25 = b44b191d3 (fusionné). Pilote Brasserie = 85f9592b6.
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
- SON CHOIX EST FAIT (D448) : work/missions/maquettes-carnet/CHOIX.md dit tout, sans l'artefact (écran par écran, images locales, ses remarques : plus dense, pas le TTC de v06, bouton « Escalader » sur l'échec). À porter par la prochaine session.
  https://claude.ai/artifact/M7FU5ad6NVhXD12Pjc9fBH (source work/missions/maquettes-carnet/page, commit 85f9592b6). En attente de son choix ;
  puis porter la version choisie (libellé « page bloquée, lue par Google » compris ; côté app, le type lit déjà etapes, TODO du flux).
- Dépense IA réelle (journal ia-journal.jsonl) : copie lecture-liens 1,647 CHF (278 lignes) ; copie Brasserie 0,425 CHF (129 lignes) ;
  les deux journaux se recoupent en partie : total réel ≈ 1,7 CHF sur les 5 CHF accordés (à réconcilier en fusionnant les journaux).
  Budget de comparaison des outils (1,5 CHF) épuisé et dépassé une fois (Gemini 0,99 pour 0,8) ; leçon L18 : coût réservé avant envoi.
- Accords en vigueur : mise à jour d'aiTask seule (23.11). Refusés : Diffbot (aucun compte), Claude/Anthropic pour lire les liens, Carbon
  (trop lent), Argon ; Neon coupé (10,7 s). Jamais de contournement de défi anti-robot (CAPTCHA, proxys).
- Ensuite, dans l'ordre : (1) T25-8 et T26-1..4 (mineurs) ; (2) son choix des étapes → port ; (3) Calendrier, reconstruction
  du cœur de la frise (D444, VOIE-LOT-CAL.md) ; (4) restes listés plus bas.

## Reprise précédente (23.11, ~14:30)
- Agent en cours : lecture des liens par méthode standard (copie `lecture-liens`, D446 : cascade schema.org → HTML → Flash-Lite → 3.8 Flash + url_context, banc permanent des 25 liens, rejeu en ligne, objectif prix et photo ≥ 90 %). À son « PRÊT À METTRE EN LIGNE <hash> » : fusionner dans port-carnet, deploy-leger.sh (T → tour25), aiTask seule si changée, puis lui envoyer « EN LIGNE ».
- Fait depuis le tour 22 : tour 23 (bande jamais vide, rangées compactes), tour 24 (lien reste dans le carnet ouvert, bandeau juste, ⋯ Retirer/Déplacer) ; aiTask 4edd21a15 (ordre des champs, URL entière) ; nettoyage de ses carnets fait (D445).
- Cette nuit : reconstruction du cœur de la frise (D444) ; contrat court : work/missions/2026-11-23-calendrier-en-ligne/VOIE-LOT-CAL.md.

## En attente de lui (fait : nettoyage D445 ; vitesse au bord « Ok »)
- Nettoyage de ses données (accord) : 4 articles de test dans « Frigo + congel » (Galaxus KS340L, Digitec Candy, 2 Brack),
  le frigo gastro-held dans « Chambre froide », le critère « 2,6 m³ » (CRIT-ffa36c63…) et le message ZZ de Chambre froide.
  Plus nos restes ZZ : carnet vide « ZZ TEST — fix liens 24 ».
- Q-4 du Calendrier : vitesse du défilement au bord (à essayer sur son téléphone).

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
- Accord du 23.11 : aiTask peut être mise à jour (seule) dès « PRÊT SERVEUR » de l'agent lecture des liens.
- Lecture IA : étapes visibles une à une, et si lente une barre repliable, lecture qui continue app fermée (IA-ETAPES-VISIBLES, ses mots du 23.11). Après le lot lecture des liens : mini maquettes dans le style de l'app, puis port.
- Page de choix publiée le 23.11 : https://claude.ai/artifact/M7FU5ad6NVhXD12Pjc9fBH (v01 à v06, work/missions/maquettes-carnet/page). En attente de son choix.
- Ses choix à porter : Q-1 A (le choix fait le prix), Q-1b B (budget en 1re pastille), Q-2 C (recherche articles et notes),
  Q-5 A (Quand et prix repliés), Q-6 A ; filtres par domaine (D437, puces Local/Brasserie/Meuble/Papiers/Outils, posés par l'IA).
- Banc de liens (BL-4 à BL-15) : prix convertis en CHF et « HT » signalé, caractéristiques (36 % justes), photos (Shopify,
  gastro-held), marque perdue (Galaxus, Digitec), landi et brewtools lus à tort comme injoignables, réponse coupée à 35 s.
- Lecture d'une photo par l'IA (L-24) ; CA13 moyens et mineurs ; FIX13-1 (prix de la liste ≠ plan), FIX13-2.
- Contre-épreuve du Carnet sur la vraie app après ces lots.

## Méthode et outillage
- Mise à jour de l'app : prend ~60 s au 1er chargement (service worker) ; à raccourcir.
- Découper CalendrierTab.tsx et domain/calendrier.ts (fait pour CarnetsVue) — inclus dans la reconstruction de la nuit.
- Remplacer définitivement le parcours figé par les règles (porte légère déjà en place).
- Copie anonymisée de ses données pour les tests locaux (D438, point 4).

## Ensuite (accordés le 23.11)
- CI GitHub Actions ; mesures de vitesse (web-vitals) ; remontée d'erreurs dans une collection Firestore ; tests des règles
  Firestore ; Stryker. (ADB refusé.)
- Puis REPRISE-GENERALE du 22.11 : Eau (alerte à 660), saisie v01s restants, Stock et Autres stocks (données manquantes),
  Matériel (`equipment/undefined`), workflows transverses, Ma levure, Malts/sucres, autres écrans « un à la fois ».
