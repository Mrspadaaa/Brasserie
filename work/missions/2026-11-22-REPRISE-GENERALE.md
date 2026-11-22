# Reprise générale — 22.11.2026 (avant maintenance)

Pilote : Opus. Lire d'abord : CLAUDE.md, cerveau/LECONS.md, la fin de work/refonte-frontend/v4/SPEC-BRASSEUR.md
(paroles du 22.11), work/refonte-frontend/decisions.md (D411 à D428), work/missions/BUGS.md (lignes « ouvert »).

## Où vit quoi
- Code de l'app : worktree `C:/Users/mrspa/.codex/worktrees/openai-clean-start/port-carnet`, branche
  `claude/port-carnet-1711`. Commit par index temporaire (GIT_INDEX_FILE, read-tree HEAD, git add des seuls chemins,
  commit, puis `git reset -q HEAD -- <chemins>`), jamais `git add -A`.
- Pilotage (SPEC, DEFAUTS, décisions, BUGS, missions, cerveau) : worktree Brasserie, branche `claude/refonte-houblons-v4`.
- Script de mise en ligne : `<scratchpad>/deploy-tour4.sh` (toutes les portes) et `<scratchpad>/deploy-seul.sh` (build,
  types, parcours Calendrier, puis mise en ligne ; sans les autres bancs). `H_FORCE=<hash>` pour un commit précis ;
  `DEPLOYER=1` pour mettre en ligne. Le scratchpad est temporaire : recopier ces deux scripts avant de couper
  (voir « Avant de couper »).
- Règles de test (22.11) : un thème (clair) ; téléphone d'abord (390×660, 390×844, 844×340) ; 1280 en contrôle léger ;
  jamais iPhone (son téléphone : Android, Chrome, Gboard). Un rapport de test sans capture ouverte est refusé (L12).
- Plafond des agents : 400 k (hook `~/.claude/hooks/economie.mjs`) ; maxTurns des agents : 120 (s'arrêtent avant).

## En ligne
- Avant ce jour : tour 9 (`en-ligne/2026-11-22-tour9`).
- Tour 10 : ÉTAT À COMPLÉTER À LA MISE EN LIGNE (hash, asset index-*.js, tag `en-ligne/2026-11-22-tour10`).

## Fait en local depuis le tour 9 (entre dans le tour 10)
- Frise du temps du Calendrier : passé libre (52 sem.), période de l'app fixe, fenêtre locale gardée au rechargement,
  étiquettes sans chevauchement, An à 390, T9-1 (barre hors cadre, doigt tremblant), T9-2 (doigt immobile au bord,
  « S47 »), T9-3 (« 1 j » fiche = Modifier). Parcours Calendrier vert. Commits 4bfa47018 … 4ce895e88, ea6e55060.
- Fiche du Calendrier v02 : date par la frise partagée (d8a606849).
- Frise au doigt PARTOUT (GESTE-DATE-PARTOUT) : ≈ 50 champs de date, 8 écrans joués au doigt, controle-geste-date vert ;
  plage [valeur ou −5 ans ; +5 ans] (D425) ; bug réparé : date du matériel écrite sous « undefined » (395213671).
- Carnet : A1, B1, prix rendu CHF, Placer dessine l'achat prévu au Calendrier (917a72999).
- Menu du + : pile défilante (5d55111f1) ; 64 actions jouées, 62 OK.
- Stock : d1a, d2a, d3a, d3b, d5a, d7a, d8a, récents, teinte Recompter, « Trié par » retiré ; vitest et bancs stock verts.
- Autres stocks A (D423, D424) : 8 blocs, couleur et forme par famille, seuil par ligne.
- Eau › Sels : un écran (radar, 9 sels, 2 acides), étiquettes au bout des axes, interrupteur de chaque sel remis
  (3d2baef23).
- Lenteurs : frise (mesures après peinture), PageShell (Recette 472 → 280 ms).
- Saisie à la main v01s (D426, D427, D428) portée : 56024db3e, 2c5e89616, + correctif WFA-15 (achat qui solde l'achat
  prévu) — À COMPLÉTER.

## Tâches à faire (toutes)
### Juste après la mise en ligne
1. Test en ligne au doigt dans son Chrome (Claude in Chrome connecté), 390, captures ouvertes, données « ZZ TEST — … »
   retirées ensuite : frise du temps en priorité (chaque geste, chaque échelle, passé, rechargement), puis menu du +
   (dont « Facture » depuis Finances : PLUS-FACTURE-FINANCES), saisie v01s (loyer récurrent, apport, abonnement, achat
   qui solde le prévu), Eau › Sels, Stock, Autres stocks, Carnet (vrai lien), dates au doigt.
2. Critiques à personas sur l'app en ligne (brasseur, UX mobile, métier) : « combien et quels problèmes ? ».
3. Pousser les branches (port-carnet est poussé par le script ; Brasserie : 322+ commits non poussés). Fusion dans main :
   accordée pour ce port, à faire après le test en ligne.

### Bancs à rejouer (pas encore joués sur le tour 10)
4. carnet, geste, stock, chaines-v2, chaines-calendrier-v8/v9/v12/v13, chaines-hors-ligne, parcours v3/v7/v10/v11.
   Le brasseur (22.11) : ne pas tout rejouer avant la mise en ligne ; les jouer ensuite, corriger ce qui casse.
5. CH-G7 : la modification NON COMMITÉE de `src/ui/calendrier/entete/Fenetre.tsx` (cadre d'une semaine en jours
   « 26 oct. – 1 nov. » au lieu de « S44 ») : décider (garder ou jeter), aligner CH-G7.
6. Doute à juger sur capture : au bout de l'horizon, échelle « An » mais cadre « nov. – nov. 2027 ».
7. vitest : ≈ 19 échecs dans 12 fichiers sur l'arbre (préexistants, hors porte D409) ; calendrierLotA (`--cave-100`),
   calendrierMenuV12 CHN-3, mobileDailyViews « Brassin du samedi » (MOBILE-DAILY-SAMEDI), calPasseG3.

### Fichiers non commités trouvés dans port-carnet (propriétaire à établir avant tout)
8. `src/domain/stock/murDonnees.ts`, `src/ui/stock/EnteteRayon.tsx`, `src/ui/stock/MurStock.tsx`,
   `src/ui/calendrier/frise/fiche.css` (MM), `tests/integration/calendrier-onglet.test.tsx` (MM),
   `tests/unit/calendrierPeriodeV8.test.ts`, `scripts/parcours/geste.mjs`, suppression indexée de
   `work/missions/2026-11-22-retour-passe/REPRISE-4.md`. Ne rien remettre à HEAD sans copie (L17).

### Lenteurs (CAL-LENT encore rouge, objectif INP ≤ 200 ms, CPU ×4)
9. Toucher une semaine ≈ 464 ms ; glisser la frise ≈ 416–544 ; Poser un brassin, Ajouter en, Noter 304–464 ms
   (recalcul de style de 966 éléments à l'insertion de la feuille Radix) ; Recette 280 ms.
   Suite : Brasserie work/missions/2026-11-22-lenteurs/REPRISE-3.md, MESURES.md.

### Écrans et défauts ouverts
10. Eau : alerte « HCO₃ épuisé » et ligne pH sous Retour/Suivant à 390×660 (EAU-SELS-ALERTE-660).
11. Saisie v01s restants (NOTES.md § v01s) : états erreur / hors ligne, trimestriel, remboursement d'une vente,
    fin et total sous le clavier à 660.
12. Carnet : « trou » en bas sur son téléphone (non reproduit) ; CRU-3b (squelette d'attente), CRU-11 (tailles de liste).
13. Stock / Autres stocks : données manquantes (Pck = 25 g, date du prix, N projets, Commander, dernier achat, DDM hors
    levures) — affichés seulement quand la donnée existe.
14. Matériel : vérifier en lecture seule s'il existe en ligne un document `equipment/undefined`
    (GESTE-MATERIEL-UNDEFINED-EN-LIGNE) ; rien à supprimer sans accord.
15. TodoTimeline : plus aucune entrée dans l'app (code mort ?) : à lui demander (choix d'écran).
16. Écriture et Facture ouvrent toutes deux la saisie : constaté (menu du +).
17. Workflows transverses : WX2, WFR, WFP, WFD (WFD-6 : ticket de soude qui n'entre pas en stock).
18. Ma levure, Malts/sucres, autres écrans du programme « un écran à la fois » : voir work/refonte-frontend/registre.md.

### Accords de l'utilisateur en attente
- Aucun champ neuf de schéma en cours (TVA : refusée, D428).
- Données réelles : rien touché ; recette Milk Stout abîmée (T3B-12) à corriger par son geste ou migration (accord).

## Règles de méthode retenues aujourd'hui
- Un chantier à la fois jusqu'à la mise en ligne (L18) ; les portes se lancent par script, sans attendre un agent.
- Une exigence transversale (frise au doigt) se contrôle partout dès son arrivée (L05).
- Un port garde tout ce que sa maquette a (L03 : interrupteur des sels).

## Avant de couper
- Recopier deploy-tour4.sh et deploy-seul.sh du scratchpad dans Brasserie work/missions/outils-mise-en-ligne/.
- Committer ce fichier et les lignes SPEC/DEFAUTS/décisions/BUGS du jour dans Brasserie.
- Aucun agent en cours (sinon : leurs REPRISE).
