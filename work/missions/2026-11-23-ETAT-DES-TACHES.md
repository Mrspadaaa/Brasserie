# État des tâches — 23.11, après le tour 24 (21bd69fd0, index-7UIfuot2.js)

## Reprise (23.11, ~14:30, contexte du pilote à 700 k)
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
