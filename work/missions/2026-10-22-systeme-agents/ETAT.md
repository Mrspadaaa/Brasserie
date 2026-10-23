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
- `verifier-page.mjs` contrôle la lisibilité à 390 et 1280 px : date au titre, `#a-choisir` au premier écran, captures
  ≥ 340 px, texte ≥ 14 px, blocs ≤ 45 mots. L'ancienne page échoue (74 captures à 277 px, texte à 12,8 px).
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

## Ouvert, par priorité
1. **Dette des défauts** (AUDIT.md, « À adapter ») :
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
