# État de reprise : système d'agents (session de supervision, 23.10)

À lire en premier après une compaction ou dans une nouvelle session.
- Le système est décrit dans `docs/agents/systeme.md`.
- La méthode des lots est dans `.claude/skills/voies/references/entonnoir.md`.
- Rien n'est poussé : les commits sont locaux, sur la branche `claude/refonte-houblons-v4`.

## En place (commits du 22 au 23.10)

**Système** (du 22.10)
- c768f2c à e9b78bd :
  - le cerveau ;
  - les leçons, le conseil et les voies ;
  - les agents concepteur (Opus) et critique (Fable) ;
  - M12 (relance ou écart d'une variante rejetée, et publication) ;
  - `verifier-page.mjs`.

**Entonnoir (M13 et M14)**
- 6eb92d5 à c0e5769 :
  - au moins 48 concepts v0 minimalistes, en 6 séries ou plus de 4 à 12, un concepteur par série ;
  - trois chaleurs (D22), avec la baseline obligatoire ;
  - un tri par le critique : classement, 5 candidates, greffes « même les plus extravagantes » ;
  - des passes v2, v3… jusqu'au satisfaisant (4 au plus).
- 2353e356, fba0009c : un panel v0 se publie dès qu'il est fait (`data-voies` sur la page, vérifié par
  `systeme.mjs voies`).
- 4a6fd47b (M14) : `tournoi/outils/controle-panel.mjs`, qui mesure le remplissage et la diversité.
  - Étalonnage : le lot 21 v0 passe (PANEL OK, médiane 0,62, ressemblance 0,88). Le lot 23 v0 échoue (0,41 et
    0,92). r6n2 est à 0,72.
  - Minimaliste veut dire une idée sur un écran plein. La baseline est un vocabulaire, pas un gabarit. Ses
    exemples occupent un tiers du panel au plus.
  - Chaque tri mesure le panel, ce que vérifie `systeme.mjs mission`.

**Élagage**
- f924eee, a470821, 70b9e4c :
  - `systeme.mjs remplaces` : le registre `cerveau/REMPLACES.md` compte 9 consignes remplacées ;
  - `systeme.mjs charge` : 30 000 caractères au plus pour ce qui est chargé partout, rempli à ras ;
  - LECONS : 8 lignes mécanisées au plus, les plus anciennes passées dans `cerveau/agents/controles-mecanises.md` ;
  - SPEC : un § 0 « Ce qui vaut aujourd'hui » ;
  - `DEFAUTS-COURT.md`, générée par le hook ;
  - le registre est réduit, avec son archive.

**Défauts (L13)**
- 01e197bd, 28d10316, 596c211e : l'audit a1 (`voies/a1-audit-defauts/AUDIT.md`, `tournoi/outils/portee-defauts.json`)
  sur 119 défauts : 39 gardés, 69 à adapter, 6 caducs, 5 au jury.
- Seize scripts sortaient « OK 0/0 » : ils ont maintenant une garde, et `cablage` refuse que ça revienne.
- `systeme.mjs mission` : une voie d'écran pas encore contractée prévoit les contrôles « garde » de son sujet, ou
  « sans controle-x : raison ». La dette s'affiche à chaque passage.

**Étalonnage du critique (L27)**
- f5c6b258 à 2cdfa108, mission `work/missions/2026-10-23-etalonnage-critique/` :
  - un jeu de 60 verdicts mot pour mot (`work/refonte-frontend/v4/etalonnage/jeu.json`) ;
  - les commandes `systeme.mjs epreuve` et `systeme.mjs etalonnage [--moitie] [--reponses]`.
- Le portrait v1 était à 68 % et 68 %.
- **Le portrait v2** (`fils21-choisir/critique/PORTRAIT.md`, tiré de la moitié A) fait **88 % des paires et 75 % des
  classes sur la moitié B**. Le critique est déclaré étalonné, avec ses limites, dans `critique.md`.

**Picto « épicé »**
- 2353e356 : son choix, « cannelle et clou croisés » (f1 de la série F), est le symbole `p-spice` de
  `fils17-standard/v3/planche.html`, découpé sans masque.

**Une version, un artefact** (23.10, après-midi : « Problème avec les artefacts, c'est assez dur à lire et chaque
version devrait en créé des nouveaux »)
- `verifier-page.mjs --page-lot` contrôle la lisibilité à 390 et 1280 px : date au titre, `#a-choisir` au premier
  écran, captures ≥ 340 px, texte ≥ 14 px, blocs ≤ 45 mots. L'ancienne page échoue (74 captures à 277 px, texte à
  12,8 px). Sans l'option, rendu seul, comme l'appellent 23 GATES de maquettes : le premier durcissement les avait
  cassés (rejeu du lot 21 à 40/63) ; corrigé en 73ab9aa7, avec `systeme.mjs appels <script> --rejouer` et M15.
- `systeme.mjs voies` : table « ## Pages » de MISSION.md (Sujet, Version, Adresse, Source) ; deux versions sur une
  même adresse ou une même source échouent ; une mission d'écrans sans cette table aussi (témoins : 60, OK).
- Mode d'emploi : `work/refonte-frontend/v4/outils/pages/PUBLIER.md` ; consigne remplacée dans REMPLACES.md ;
  page-partagee.md, entonnoir.md § 4, skill voies § 6, gabarit MISSION, SPEC § 0 et § 7, M12.

## Pages en vigueur
- L'ancienne page « Lot 22 houblons » (https://claude.ai/artifact/GzpfxNeKZLKXfkg4pz9kzv, versions 1 à 9) reste en
  l'état, comme archive. Sa source `page-lot/index.html` n'est plus republiée.
- Pages datées, une par version (sources `work/refonte-frontend/v4/outils/pages/<date>-<sujet>/index.html`) :
  - « Comparer · 23.10 » (r6n2, r6p1 à r6p4), autre session : https://claude.ai/artifact/BRA2ufdNe3DshNfzBxB3g4 ;
  - « Dryhopper · 23.10 » (passes 2 et 3), autre session : https://claude.ai/artifact/HjWdF2rgUHDzY3QpgMWVV8 ;
  - « Dryhopper · 56 concepts · 23.10 » (v0 classés), ici : https://claude.ai/artifact/HexW2XmnU4iUbJaRcPJNzW ;
  - « Carte des outils · 22.10 » (Substituer, Levure), ici : https://claude.ai/artifact/9FrNPBUDv7ABeo5CsSFW7g.
  Les quatre passent `verifier-page.mjs` ; les deux dernières lignes sont envoyées à l'autre session pour sa table
  « ## Pages », avec le lien #suite de sa page Dryhopper à remplacer par le panel v0.
- `page-lot/PUBLIER.md` dit encore « garder le même lien » : à remplacer par un renvoi vers `pages/PUBLIER.md`
  quand l'autre session n'y travaille plus (hors du champ de `remplaces`).

## En cours ailleurs
La session « En attente » (local_6a42bfeb-1927-4a94-959c-c50362db1c88) travaille sur la mission
`work/missions/2026-10-22-reprise-lot21/MISSION.md` :
- les passes 3 de Dryhopper (b4, e5, a1, d8), dont les GATES exigent `controle-panel --plancher=0.55` ;
- les variantes r6p1 à r6p4 de r6n2, demandées par le brasseur (« Fais mois quelques variantes de r6n2… Et ensuite on
  sera bon »).

Elle est prévenue de l'audit, des faux verts, du portrait v2 et de la boucle d'étalonnage. Ne pas écrire dans ses
fichiers : commiter seulement mes propres chemins (`git commit -- <chemins>`).

## Revue de la maquette de bout en bout (23.10, fin d'après-midi)
Mission de l'autre session `work/missions/2026-10-23-maquette-parcours/` (React jouable, `prototypes/houblons-v4/parcours/`).
- Suit ses choix : r6a d'abord pour Comparer ; a1 (y1b) pour Dryhopper, choix encore ouvert ; base consolidée (l8,
  l5b, m4), fiche g1, f1.
- Écart signalé : p2 Suggérer partait de s5 et de p1 à p5 du lot 15, pas de q2b, son choix du 19.10. La ligne manquait
  à acquis-valides (ajoutée, bb6c8cd0). Aussi : « r6n2 choisie » et sa source à remplacer par r6a.
- Non gardé : D80 (intensité, usage), le rail (controle-rail à adapter) ; jouer-parcours.mjs doit au moins les vérifier.
- Verdict « r6a reste le meilleur » versé au jeu d'étalonnage (d0a26c14).

## Soir du 23.10, après la remise à zéro de la fenêtre de 5 h (~20 h, heure de Zurich)
- D106 (« thème pastel horrible ») : ses maquettes = page blanche `#FFFFFF`, surfaces `#F5F5F5`/`#EBEBEB`, texte
  `#111111` (mesure) ; le « clair » de `ecran/THEMES.md` est rejeté. `controle-teinte.mjs` (f615f314) le garde ;
  DESIGN.md, SPEC, #144 corrigés et poussés. La maquette a `parcours/src/theme-maquettes.css` (autre session).
- Publication de la maquette jouable : par moi, artefact neuf « Maquette houblons · 23.10 », enveloppe
  `scratchpad/publication-maquette/` (copier `maquettes/parcours/assets/*` à jour ; route de départ `ma-biere` = étape
  Houblons ; essai : `scratchpad/essai-maquette.mjs`). Conditions : D55 corrigé, batterie verte avec TEINTE OK 5/5 et
  CHOIX OK, verdict du critique p6 sans REJET. Dernier p6 : 4 REJET (étape D55 ; Ma bière « bannir » D32 ; fiche hors
  cadre à 1280 D10 ; Levure à moitié vide D4) ; fiche à refaire sur g1 (inventaire). L'autre session corrige, puis
  me prévient. Donner l'adresse à l'autre session pour sa table « ## Pages ».
- c1-rail passe 2 relancée (G13 à G19 : frise verticale, D64, D56, D61 bis, D45, D55). Puis : rejouer, signer
  `controles-parcours`, mettre à jour `portee-defauts.json` (verdicts du rail).
- theme-performance : t2-performance lancée ; t1-theme et t3-critique APRÈS la publication de la maquette (t1 touche
  `tailwind.config.js` et `src/index.css`, que la maquette étend ; commiter `src/` d'un bloc ; prévenir l'autre session).

## Fin de journée du 23.10
- Règle n° 1 (D105) : registre des choix `work/refonte-frontend/v4/choix/ecrans.json`, `controle-choix.mjs` (autre
  session) ; `systeme.mjs mission` exige controle-choix pour toute voie montrée au brasseur, `voies` rejoue le registre
  (c14cafdc).
- Mission `2026-10-23-controles-parcours` : c2-intensite finie (e887f57c) ; c1-rail passe 1 finie (ad4f1c6b), passe 2
  en cours (D45, D56, D61 bis, D64, frise verticale à plusieurs houblons ; G13 à G18). À signer ensuite, et
  `portee-defauts.json` à mettre à jour (verdicts du rail).
- Mission `2026-10-23-theme-performance` (b808cee2) : t1-theme, t2-performance, t3-critique, PAS ENCORE LANCÉES ; à lancer
  à la remise à zéro de la fenêtre de 5 h, en prévenant l'autre session (t1 touche `tailwind.config.js`).
- Maquette jouable : publication par moi, dans un artefact neuf (enveloppe prête :
  scratchpad `publication-maquette/`), quand l'autre session annonce CHOIX OK et PARCOURS OK ; route de départ à
  vérifier (l'étape Houblons).
- Tickets : #143 (architecture de base avant implémentation, phase 1 = p8-portabilite), #144 (thème clair) ; #119 et
  #121 commentés. Branche poussée jusqu'à b808cee2.
- Mode `--url` des contrôles pour l'app : après p8 (forme du crochet dans ARCHITECTURE.md « ## Crochet de test »).

## Soirée du 23.10, après la maquette publiée (https://claude.ai/artifact/52UBb4F7iME2k3ZzsAv4x1)
- D107 (08e21447) : Comparer doit comparer aux étapes (60′, 10′, dry hop…) avec une référence (Nugget ou ta stout).
  L'utilisateur donne le prompt à « En attente » ; `controle-comparer-etapes.mjs` est à écrire avant la reprise.
- D108 (67a8b6a7), donné en commentaire sur l'artefact (fil 4204d431, ouvert) : la visée de Ma bière (bannir, −, +) ne
  dessine rien sur la barre. Dans la base v4.10 : losange, pointillé, paliers, ×, nom barré. Bannir agrumes écarte 17
  voies sur 18 dans Suggérer. Transmis à « En attente » (message 4d794a6c) ; `controle-visee.mjs` d'abord.
- D109 (bouton retour : 28 px, 16 px, gris) et D110 (traits de q2b non expliqués là où on les lit), c0039406, fils
  48b1d3c4 et 824a18bd ouverts ; transmis (message e69f7c3e) ; `controle-retour.mjs`, `controle-traits.mjs` d'abord.
- D111 (le geste de l'étape Houblons n'est pas celui de la base), D112 (appui long : pas de retour, texte sélectionnable ;
  effet attendu demandé dans le fil 12fdbdc0), D113 (pas de « ? » près de la carte de l'ajout ; fil 98024210).
- Piège (23.10) : `git commit -- SPEC` emporte les modifications non commitées de l'autre session dans ce fichier.
  c0039406 a emporté sa correction D107 (x3b, pas le Comparer v4.10). Avant de commiter un fichier partagé,
  lire `git diff -- <fichier>`.
- D109 bis (la pastille « ‹ Retour » refusée), D114 (panel OSU trop en avant), D115 (fiche : le radar d'abord, la liste à
  revoir), D116 (le vrai fil d'étapes de l'app : `src/ui/WizardStepBar.tsx`), D117 (Suggestions ne suit pas q2b ni la base
  v4.10 ; CHOIX OK aveugle, inventaire de q2b à compléter). Fils 2f687ce7, 2ef8663d, 00fbdef5 et 535c5505.
- L'artefact 52UB… a été republié par une réponse automatique (pastille « ‹ Retour » posée dans le fichier construit,
  hors des sources) : la version en ligne n'est plus d332792c. La prochaine version va dans un artefact neuf.
- Mon manque (L03) : publié sur CHOIX OK et critique ACCEPTÉ, sans captures côte à côte base | maquette pour chaque
  écran. Désormais, avant toute publication, une page côte à côte par écran, regardée par moi et publiée avec la
  version. L03 est à compléter dans LECONS.md après le commit de l'autre session (L03 y est en cours).
- DEFAUTS-RECURRENTS et DEFAUTS-COURT : mes lignes D114 à D117 ne sont pas commitées, à côté de la correction D107 de
  l'autre session ; elle les commite toutes, avec mon accord.
- D109 tranché par lui : une croix (« Juste une croix bien positionné, facile, dans le thème suffirait »). D118 (la croix
  ramène toujours à l'étape Houblons ; lecture dite dans le fil 0d919b2f), D119 (l'en-tête change d'un onglet à l'autre),
  D120 (Annuler en pied). SPEC 31a752af ; fils 0a142451, 0d919b2f, a3e4332b, c7854856 et 5410d51d.
- D121 (seul le « › » ouvre l'analyse ; le bloc du profil entier, en variantes), SPEC 7db53cb1, fil a0f0b6ef.
- **À faire quand « En attente » annonce la version D107 à D121** :
  1. rejouer CHOIX, TEINTE, controle-comparer-etapes, controle-visee, controle-retour,
     controle-traits, controle-geste-etape, controle-appui (A9),
     controle-legende, controle-fiche, controle-stepper ; page côte à côte par écran ;
  2. regarder les captures côte à côte avec la base v4.10 ;
  3. publier la nouvelle version dans un artefact neuf (enveloppe `outils/pages/2026-10-23-maquette/` à copier sous
     une nouvelle date) ;
  4. répondre dans les fils 4204d431, 48b1d3c4, 824a18bd, 12fdbdc0, 98024210, 2f687ce7, 2ef8663d,
     00fbdef5, 535c5505, 0a142451, 0d919b2f,
     a3e4332b, c7854856, 5410d51d et a0f0b6ef avec le lien, puis les résoudre.

## Ouvert, par priorité
1. **Dette des défauts** (AUDIT.md, « À adapter »), urgente pour la voie p4 du parcours :
   - `controle-rail.mjs` (22 défauts du rail, essentiels pour Dryhopper ; effort grand) ;
   - le contrat de Comparer (`controle-radar`, `controle-comparer`, `controle-fil6`) ;
   - D4 : l'ancien remplissage est trop clément, controle-panel le remplace mieux.
   Une mission de voies est à proposer à l'utilisateur.
2. **Défauts qui échouent sur les pages actuelles** : D94, D95 et D96 sur Dryhopper g1, D94 sur r6n2, D2 (5 tailles
   de texte sur g1). Le seuil de mots est incohérent : 70 dans controle-commun, 80 dans la SPEC. L'autre session est
   prévenue.
3. **La boucle d'étalonnage** : chaque nouveau verdict entre dans `jeu.json`, puis on rejoue l'épreuve. Il faut
   comparer la prédiction du critique au verdict sur r6p et Dryhopper. Le regard Brasserie du conseil passera la même
   épreuve.
4. **Petits restes** :
   - 4 citations de SPEC introuvables par `check-spec`, antérieures au 22.10 ;
   - decisions.md, non élagué ;
   - D26, jugé caduc par l'audit, à confirmer.
5. **Accords de l'utilisateur en attente** :
   - le push et la PR ;
   - l'archivage du pont Sol caduc ;
   - `pistes-l5f.png` à la racine.

## Pièges
- **Bash mange les barres obliques inverses**, dans les heredocs comme dans les chaînes `node -e` : passer par
  Edit ou Write.
- **Le rejeu `systeme.mjs voies` réécrit des empreintes de preuve** (r2, r6e) : annuler ces changements s'ils ne
  viennent que du rejeu.
- **Budget du savoir chargé partout** : toute ligne ajoutée à LECONS ou à INDEX impose d'en retirer une.
- **Épreuve d'étalonnage** : les items d'une moitié partagent des verdicts avec l'autre. Aucun portrait ne doit
  nommer une variante choisie.
