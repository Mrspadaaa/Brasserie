# Reprise — 02.11, soir (lot g, son ticket Bauhaus, et le plateau)

## Objectif
Corriger tout ce qu'il a vu sur son ticket Bauhaus (D328 à D337). Refaire la vue détail d'une ligne sur mini maquettes (D345). Puis
redéployer, mais seulement après le rejeu de son ticket sur le nouveau code et le test d'écran du critique
(`node scripts/agents/controle-avant-deploiement.mjs <sha>` → AVANT-DEPLOIEMENT OK, D342).

## Règles nouvelles (ses mots dans SPEC-BRASSEUR, 02.11 soir)
- D343 : tester d'abord par la vision, sur de vraies pièces ; Vitest pour les règles de calcul seulement ; peu de fixtures.
- D344 : le test d'écran du critique se réduit à « combien et quels problèmes il y a ? », une liste numérotée par capture.
- D341 : retrait des tests inutiles accordé (fait, g5). D346 : c'est nous qui codons ; un port retire ce que sa maquette n'a pas (L03).
- D347 : « À 90% d'usage hebdo, terminé tes tâches ». Lu à 83 % vers 21 h. À 90 % : rien de neuf, état écrit, commit.
- D348 : la diversité du panel plateau se juge sur le plateau seul (liste p3c-3 imposée). D349 : « ✓ au centime », « ✓ 8 lignes » et la
  boîte cochée des rangées reliées restent (sa maquette p3c-3) ; « sûr = rien » ne vaut que pour les ✓ ajoutés.

## Commits locaux (aucun poussé)
ee5e973d, 9f01a55b, 34111348 (méthode, D328 à D347), c7069922 (code du lot g : 2 267 tests verts, tsc, build), 60a8c25f (sorties de tests
retirées de l'index, fichiers gardés sur le disque).

## État des voies
- g2a, g2b, g5 : finis, commités (c7069922). g3-ecarts : fini (`voies/g3-ecarts/ECARTS.md`).
- **g1-audit** : ECHEC partiel (plafond de tours), RESULTAT.md écrit. Sur b3ab392e, M1 à M13 KO comme attendu (M2, M7 non reproduits sur
  doc14). Existants : 122 OK, 4 KO (défauts en ligne : doc6 « Même achat » ne crée rien ; doc14 sans pastille TVA). ~15 captures sur 160
  ouvertes. Sorties : `deploy-hosting-qr/work/missions/2026-10-31-ecran-depense/voies/g1-audit/avant-G1..G4/`. CONNAISSANCE et LEÇON
  PROPOSÉE (mesurer après les animations ; un cas se pose sur le défaut de sa plainte) à traiter à la signature.
- **g6-rejeu** (Haiku) : en cours. `deploy-hosting-qr` détachée par le pilote sur **60a8c25f**, functions/lib reconstruit,
  `scripts/g-banc.mjs` copié. G1 à G4 « apres », puis existants A à D. Rend M1 à M13 avant | après.
- **Plateau** : 16 v0 rendues (pg, pa, pz, pu), tri pt (critique) : classement pu4, pz4, pu3… ; candidates pu4, pz2, pa1.
  Page v0 publiée : https://claude.ai/artifact/HxaxpDdzztLYPrCCnwnMAs (source `choix-plateau/index.html`, images `choix-plateau/img/`,
  non versionnées). Passe 2 rendue : `plateau/v1/pu4b`, `pz2b`, `pa1b`. Verdict du critique en cours → `plateau/critique/RESULTAT.md`.

## 21 h 30 : ses remarques sur pa1b (D350 à D352)
- « éviter les dropdown sur mobile, ça nécessite 2 actions » ; « Au centime, ça veut dire quoi ?? Ça ajoute rien, non ? » (« ✓ au centime »
  retiré quand le calcul tombe juste, remplace D349 sur ce point) ; « Unité pas aligné btw » (bande et rangées). SPEC, DEFAUTS, décisions faits.
- Contrôle `work/refonte-frontend/v4/tournoi/outils/controle-sans-menu.mjs <etat.html>` (menus, chevrons, « au centime », alignement au repos) :
  ECHEC sur pa1b, pu4b, pz2b (témoins). Heuristique : un faux positif possible est à montrer sur capture.
- Verdict passe 2 (critique) : pa1b ACCEPTÉ ; pu4b REJET (rangée ouverte sans sa mesure) ; pz2b REJET (mouture « Rattacher » absente).
- Passe 3 lancée chez les mêmes auteurs : `plateau/v2/pa1c`, `pu4c`, `pz2c`. Puis le critique, puis la page v1 (artefact neuf).
- À l'intégration : relever les menus déroulants, « ✓ au centime » et l'alignement des unités dans l'app (`src/ui/depense`), lecture étroite.

## 22 h : passe 3 rendue
- `plateau/v2/pa1c`, `pu4c`, `pz2c` : MENU OK rejoué par le pilote sur les trois ; pu4c-a regardée (unités alignées, Kg | g, Rattacher).
- pa1c signale : unité rare sans chemin (3e case « autre » ?) ; « 2 à contrôler » au récap contre « 2 à régler » au plateau.
- Verdict du critique lancé → `plateau/critique/RESULTAT-p3.md`. Ensuite : page v1 (artefact neuf, `choix-plateau-v1/`, les trois en
  passe 3 côte à côte avec pa1b et p3c-3, ses trois remarques en tête), `verifier-page.mjs --page-lot`, ligne « ## Pages ».
- Usage hebdo 85 % à 22 h. À 90 % : rien de neuf (D347).

## Prochaine action, dans l'ordre
1. Verdict passe 2 : relancer ou écarter chaque REJET (2 fois au plus) ; puis page v1, artefact neuf daté (`choix-plateau-v1/`),
   `verifier-page.mjs --page-lot`, ligne dans « ## Pages ». Lien à lui : il choisit.
2. Retour de g6 : rejouer `resumer-mesures.mjs` ; ouvrir moi-même les captures « après » des états touchés ; puis le critique en test
   d'écran (VERDICT.md dans `avant-deploiement/60a8c25f/`), « Pilote : vu », garde. Déployer seulement sur AVANT-DEPLOIEMENT OK
   (étapes de déploiement : summary de la conversation ; copie `deploy-hosting-qr`, `--only hosting` puis `--only functions:aiTask`).
3. Restes : l'écran vide de 18 h 04, D326 (3) à (8), le Malt Vienne, doc6 et doc14 (g1 § 4), la signature de la mission, les lignes
   LEÇON PROPOSÉE et CONNAISSANCE des RESULTAT (g1, pg, pu, pa, pz, pt).

## Risques ouverts
- Le visuel des corrections n'est prouvé qu'après g6 et le test d'écran du critique.
- La vue détail sera refaite après son choix : les corrections du plateau d'aujourd'hui sont provisoires.
- Le `.gitignore` des missions laisse passer les `.json` : les sorties de banc qui portent ses valeurs sont en `.json.txt` ; ne jamais
  `git add -f` un dossier de banc.

## Vers 20 h 30 (horloge du poste) : passe 4, page v1, rejeu, g7
- Ses remarques sur pu4c-a (D353 à D355) et sur le banc de 60a8c25f (D357, D358, et « Il manque les deux boutons ? », le segment Plié | Déplié
  caché sans sous-famille, question rendue) ; D356 : D347 relu, « à 90 %, aie fini tes tâches », tout mener au bout. L01 mise à jour.
- Contrôle `work/refonte-frontend/v4/tournoi/outils/controle-plateau-ligne.mjs` (pièce offerte, barré sans geste, autre ligne nommée) :
  LIGNE ECHEC sur pu4c, pa1c, pz2c (témoins).
- Passe 4 : `plateau/v3/pu4d`, `pa1d`, `pz2d`, MENU OK et LIGNE OK ; critique ACCEPTÉ les trois (`plateau/critique/RESULTAT-p4.md`) :
  pu4d, pa1d, pz2d dans cet ordre. **Page v1 publiée** : https://claude.ai/artifact/XeGBAqvwsAHgwuAtLSXGJH (source `choix-plateau-v1/`, PAGE OK,
  captures regardées). Il choisit ; ensuite le port de son choix dans `src/ui/depense` (D345), avec D350 à D355 dans l'app.
- g6-rejeu fini : M 10 sur 13 passées KO → OK ; restent M1 (2 rangées de matériel sans unité), M5 sombre sous filtre (texte 2,1 sur ambre,
  vu sur `apres-G4/390-18`), M11 (mise en place sans « à remplir ») ; existants 122 OK, 4 KO inchangés (doc6, doc14).
- **g7-reste** (auteur Sonnet, en cours) : M1, M5, M11, D354 dans l'app, D357 Regrouper discret, D358 l'arrondi en sa propre ligne (2e plainte
  après D261b, changement de genre, message envoyé à l'agent). Il ne commite pas.
- Le test d'écran se fera sur la version de g7, pas sur 60a8c25f (voie `t-ecran-g7`, VOIE à recibler sur le sha).

## Prochaine action, dans l'ordre (remplace la liste plus haut)
1. Retour de g7 : relire le diff et rejouer ses tests ; tsc, build, manifeste 21dd75b3 ; commit par chemins.
2. Copie `deploy-hosting-qr` : `git checkout --detach <sha g7>`, functions/lib, `scripts/g-banc.mjs` recopié. Puis rejeu G1, G3, G4 et A
   (Haiku, `lancer-g.sh`, un banc à la fois). Puis le pilote regarde les captures.
3. t-ecran-g7 (critique neuf) : `VERDICT.md` dans `avant-deploiement/<sha>/`, puis « Pilote : vu », puis
   `node scripts/agents/controle-avant-deploiement.mjs <sha>`. Sur AVANT-DEPLOIEMENT OK, déployer en deux temps : `--only hosting`, puis
   `--only functions:aiTask` si `functions/` a changé.
4. Restes : doc6 « Même achat », la pastille TVA de doc14, les menus déroulants de l'app (D350), l'écran vide de 18 h 04, D326 (3) à (8),
   le Malt Vienne, la signature de la mission, les lignes LEÇON PROPOSÉE et CONNAISSANCE (g1, g6, pg, pu, pa, pz, pt).
- Usage : 87 % à 20 h 30. D356 : tout finir d'ici 90 %.

## Vers 20 h 45 : g7 rendu, 7945555e
- g7-reste fini et commité (cd14101b, sorties neutres 7945555e) ; D359. Le script de banc reste hors Git (noms de cas de sa pièce).
- `deploy-hosting-qr` détachée sur **7945555e** (functions/ inchangé depuis 60a8c25f : hébergement seul à déployer), `g-banc.mjs` recopié.
  Tests depense + finance : 2 351 verts, 1 rouge environnemental (`enrichir/interrupteur.test.ts`, variable de build de la copie, fichier
  inchangé depuis 60a8c25f). Build et check-no-dev-auth : voir `scratchpad/verif-7945555e.txt`.
- Plateau : « Oui c'est très bien implémente ça », puis « Ah att il faut choisir » : il choisit sur la page v1 ; aucun port avant (D360).
- Suite : rejeu banc `apres2` (agent g6, G1 à G4 puis A à D), captures regardées, `t-ecran-g7` (VOIE prête), garde, `--only hosting`.

## Vers 21 h : son choix et le seuil (D361, D362)
- **pu4d choisie** (D361), greffe « article — · hors stock + Suivre au stock » de pa1d. Voie **p-port-pu4d** (auteur, agent a30ad96d517b27e36)
  en cours dans le worktree ; elle ne commite pas.
- **Rejeu 2** du banc sur 7945555e : agent g6 (a7be8260f1eb498de), préfixe `apres2`, G1 à G4 puis A à D ; section « Rejeu 2 » de son RESULTAT.
- D362 : jusqu'à 95 %, rien de neuf ; les restes attendent la semaine suivante. Usage 87 % à 21 h.
- Suite, dans l'ordre :
  1. Retour du rejeu 2 : le pilote ouvre les captures `apres2-*` (M5 sombre, Regrouper, arrondi, Tout valider). Puis la voie
     `t-ecran-g7`, avec un critique neuf (VOIE prête, 7945555e). Puis « Pilote : vu », la garde, et
     `npx firebase deploy --only hosting --project brasserie-l-affinee --non-interactive` depuis `deploy-hosting-qr`. Contrôle en ligne en
     lecture seule.
  2. Retour du port :
     - relire le diff et l'inventaire, puis commiter ;
     - détacher `deploy-hosting-qr` sur le nouveau sha, puis tests, build et check-no-dev-auth ;
     - rejouer G2 et G4 (plateaux), puis A à D ;
     - critique côte à côte avec pu4d ; `controle-plateau-ligne` sur pu4d au cas c ;
     - la garde, puis le déploiement de l'hébergement.
  3. À 95 % : l'état est écrit ici, le commit fait, le rapport rendu.

## Vers 21 h : déployé (D363 à D365)
- Ses mots : « Allège les test… », « Pas besoin de tout retester ou rien, intégre le tout et deploye ». Banc et critique levés pour ce lot.
- **En ligne : f6b29066** (hébergement). Ticket Bauhaus, port pu4d, famille d'une ligne sous « Famille » (D364). Page servie vérifiée.
- Restes, semaine suivante (D362) : réécrire les 46 anciens tests de la Dépense (liste dans `voies/p-port-pu4d/RESULTAT.md`) ;
  fiche matériel (créer ou lier un matériel) et libellé d'une ligne lue, retirés avec l'ancien formulaire : où les remettre ;
  la famille n'est pas écrite avec la dépense (le type d'achat suit) ; après « Regrouper », le panneau « à contrôler » nomme les anciennes
  lignes, avec des mots anglais (« equipment / other / stock ») ; doc6, doc14, D326 (3) à (8), les LEÇON PROPOSÉE et CONNAISSANCE des voies.

## Vers 21 h 30 : B rendu atteignable, Houblons rallumés (D366 à D368)
- **En ligne : d14ff6cf construit avec `VITE_HOP_V4=on`** (paquet `index-D_r8o4EC.js`, `flags` à `"on"`). Contient f6b29066 et D366.
- D366 : son choix B passait inaperçu (sélecteur d'un seul fichier ouvert d'office ; « Joindre un justificatif » seul en saisie). Corrigé, vu par
  le menu sur le banc (`leger-pages/390-01-pages-entree.png`). Dans Chrome en ligne, la page lue montre « Un document », « Plusieurs »,
  « Saisir sans justificatif » ; la capture Chrome bloque dès qu'un calque s'ouvre (fenêtre à 2560 px), non résolu.
- D368 : ses sept écrans Houblons étaient éteints en ligne depuis les déploiements de la Dépense ; rallumés. Garde
  `node scripts/check-build-flags.mjs dist` à lancer avant chaque déploiement, avec `check-no-dev-auth`. Construire par
  `VITE_HOP_V4=on npm run build`.
- Banc : `openInvoiceEntry` échoue désormais si un sélecteur s'ouvre seul (copie `g-banc.mjs` et script du worktree, non commité : noms de sa pièce).
- Audit `voies/a-entrees/RESULTAT.md` : 13 atteints, 7 éteints par le drapeau (rallumés), 2 sans choix, 5 douteux. Les douteux : lenteur D (quatre
  états, à jouer avec une vraie pièce en ligne) et p3c-2 (décision introuvable).
- Restes : écrans Houblons à regarder en ligne depuis le menu (étape Houblons d'une recette) ; les 46 anciens tests ; fiche matériel ; LEÇON
  PROPOSÉE de p-port-pu4d et a-entrees à traiter à la signature.
- Vérifié en ligne (02.11, vers 21 h 40, Chrome, lecture seule) : Brassins › Recettes › « Modifier » d'une recette › étape Houblons rend l'écran v4
  (`data-hop-v4-etape`, paquet `index-D_r8o4EC.js`) : rail Ébullition 60′ et 10′, whirlpool, J+3, cartes (nom, α, rôle, arômes, dose, IBU),
  « Sans … › », radar « Au style », « Ouvrir l'analyse de ma bière ». Fermé par « Fermer », sans dialogue ni écriture. Capture Chrome impossible
  (Page.captureScreenshot expire) : vu par le texte de la page, pas à l'image.

## Vers 22 h : D369, filtres et quantité d'un toucher (811db792, non déployé à l'écriture)
- Filtres, sur le banc par le menu (pièce Bauhaus, 390, d14ff6cf) : « à remplir » filtre (capture `d369-remplir/390-04`). « 2 à contrôler » ne fait
  rien de visible (M8 KO, filtre nul ; déjà KO sur 7945555e, `apres2-G*`) : ses points sont des désaccords du document, sur aucune rangée ; le toucher
  sautait à la preuve, déjà à l'écran. Sa pièce (une ligne) : « 1 à contrôler » idem ; « 1 à remplir » filtre une liste d'une ligne (rien ne change à l'œil).
- Correctif : « à contrôler » sans rangée allume la puce et éclaire 1,6 s le bandeau du pied où le désaccord se règle (Garder, Voir, Tout valider).
  Lecture étroite (L01) ; les ronds « Devise » et « Lecture coupée » (sans cible propre : la preuve) restent tels quels, à lui montrer s'il les visait.
- Quantité : « +1 +2 +3 +5 +10 » (pièce, sachet), « +1 +5 +10 +100 +500 » (g), « +1 +5 +10 +25 » (Kg), « +1 +5 +10 +20 » (L), sous `q × prix = montant`
  quand la quantité manque ou est rouge, et après un toucher ; « ✕ » remet à vide. Le champ qui manque se calcule des deux autres (`recalculer`),
  jamais par-dessus une valeur posée ; la quantité seulement si elle tombe juste. Au geste seulement, rien à l'ouverture de la pièce.
- Banc : cas `g-quantite` ajouté aux deux copies du script de banc (non commité).
- Suite : 15a3b508 (puce allumée jusqu'au second toucher), 5f83812f (bandeau cerné, sans éclair : M5 sombre). Banc `d369-apres`, 390, deux thèmes :
  13 OK, 0 KO (D369 ×6, M8, M5, M6). Témoin `d369-temoin` sur d14ff6cf : D369 KO. Captures regardées : « 11 pièce × 0,7727 = 8,50 » ; « 2 à contrôler » allumé.
- Déployé (hosting seul, functions inchangé) : 5f83812f, `index-Dc4foCCD.js` servi, `ExpenseSheet-Bg06CXh1.js` porte « Quantité en un toucher », drapeau
  Houblons « on ». En ligne, par le menu : la saisie à la main n'a pas le plateau pu4d (ancien formulaire) ; les boutons n'existent que sur une
  facture lue. Pas de lecture payante pour le voir en ligne : à voir sur sa prochaine pièce.
- Restent : à 390, avec trois unités et un prix à 4 décimales, `= montant` passe à la ligne ; les nombres changent si l'unité se déduit après
  le premier toucher (Kg → pièce) ; ronds « Devise » et « Lecture coupée » inchangés.

## Vers 22 h 45 : D370, le libellé d'une ligne ajoutée (c625a2c6, déployé)
- Plainte : une lettre seulement dans « Article ou prestation ». Causes : le champ n'existait que libellé vide, et la ligne changeait de bande
  ou de sous-groupe dès la première lettre (famille déduite des mots). Correctif : champ gardé, bande et sous-groupe figés pendant la frappe,
  rangés quand le champ est quitté.
- Témoins rouges sur 5f83812f : banc `d370-temoin` (D370 KO, deux thèmes), test `plateau.test.tsx` D370. Vert après : 90/90 Dépense.
- Sa demande : le correctif seul, un test unitaire, le déploiement. Banc après correctif non rejoué ; restes de D369 en attente.
- Déployé : `index-HV8VtptN.js` servi, drapeau Houblons « on », functions inchangé.

## Vers 23 h 15 : D371, unité face à l'article relié (27d12523, déployé)
- Alerte au plateau quand l'unité de la ligne reliée ne s'ajoute pas à l'article (`uniteHorsArticle`, `AlerteUnite`), « Compter en g ».
- « Suivre au stock » : repli sur le nom seul si l'unité bloque l'appariement (pas de doublon).
- Tests : `d371/liaison`, `d371/recherche`, `plateau.test.tsx` D371 (rouge sur c625a2c6). 96/96 Dépense. Servi : `index-BRPLnj3s.js`.
- Non fait : banc par la vision de l'alerte ; la ligne de la liste ne se marque pas en rouge ; « à remplir » ne la compte pas ; l'unité
  déduite « pièce » d'une ligne de houblon sans unité reste.

## Vers 23 h 45 — D372 déployé (ddbabbfc)
- Sa plainte : l'alerte de D371 n'est pas sa vue ; il attendait le face à face pu4d, générique. Fait : règle dans `confianceLigne`, vue « unité à remplir » de pu4d.
- Banc : cas `g-unite` ajouté (scripts/g-banc.mjs du banc et check-invoice-journey-emulator.mjs du worktree, non commités) ; 5 OK.
- Prochaine action : rien d'ouvert sur D372 ; restes connus listés dans D369 et D371.

## 03.11, vers 4 h 50 — D373, D374 déployés (27d63a46, index-xwDI-55z.js) ; ouverts : D375, D376, D377
- D375 TVA (« La TVA est pas compté dans le total? SI je click en ht, je peux plus revenir ? ») : sa pièce a des lignes TTC (Belegbetrag 191,95 + 69,70 = 261,65,
  dont 16,10 de TVA) ; l'écart du détail (218,65) vient des lignes non lues (« Plus de 35 lignes »). Bug : panneau TVA (ExpenseSheet ~l. 1092) sans valeur divergente
  (`tvaLues` vide) n'offre que « proposé · HT vide — », qui efface la TVA sans retour. À faire : toujours offrir la TVA lue ; « HT vide » neutre, jamais « proposé ».
- D376 sous-catégories (« Pourquoi j'ai plus ça, ni des sous catégories ??? », sa page D « Tout plier, déplier ») : à lire (groupes.ts, sousFamilleDeLigne ; ses captures
  sont filtrées « 1 à remplir · 34 masquées »).
- D377 (« Item en rouge mais pas total ?? ») : le total de bande ne porte pas le rouge d'un montant de ligne « inconnu » ; à faire dans bandes (Liste.tsx, LigneBande).
- Banc : cas g-unite, g-propose et D373 dans g-quantite (scripts du banc et du worktree, non commités).
