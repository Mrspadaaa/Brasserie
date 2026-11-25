# Jouable passe 4 (2e voie), nuit du 25.11

Sa demande : « prends les meilleures ou les meilleures solutions de chaque vue … on prend pas forcément une vue telle quelle mais les mécanismes ou
les visuel les meilleures … Et ensuite tu fais la même chose, maquettes jouable, tu entre les exemples, critique, puis corrections ».
Juges du tour 2 (juge-critique-2.md, juge-personas-action-2.md, juge-personas-produit-2.md) : p4b-1 7–7,2 · p4b-2 7,5 · p4b-3 7–7,4 ; probant comme
direction. Lis la recette en fin de chacun ; elles convergent :

## Recette (écran → mécanisme → source)
- Liste : p4b-1 (garde le sous-domaine, perdu dans p4b-2/3) ; « Ranger dans… » d'un toucher, sans glisser.
- Organisé (problème) : base p4b-3 (jetons ronds, un mot par piste, « prix du joint ? Noter ») ; tuiles et face à face de p4b-2 avec les noms
  « toi / sanitaire X » ; « estimé » en pointillé (p4b-1) sur toute estimation ; UNE seule action pleine ; bascule Mes notes / Organisé pleine
  largeur en bas, sous le pouce (p4b-2).
- Organisé (achat) : p4b-1 avec la jauge « lu n · manque n » ; jamais de couronne face à un inconnu ; comparaison qui gagne quoi.
- Décider : p4b-2 (colonnes, Retenir sous le pouce), toast Annuler après chaque décision.
- À faire : ligne de temps de p4b-3 + décision sur place de p4b-2.
- Relecture « pourquoi » : p4b-3.
- IA en erreur / hors ligne : p4b-1 (cases lu / rien lu, « · IA » en creux), seul ce que lit analyseLocale.ts.
- Mémo : p4b-2, avec ses cases à cocher (0/3). L'assurance est une Échéance (compte à rebours), pas un mémo.
- Aide : Garder / Non merci sur chaque proposition (✓ check, ☐ tâche, 💡 suggestion).
- Feuille « Changé par l'IA » : atteignable, une case par changement ; montrer un cas où l'IA se trompe et sa correction.
- Liens « ta ligne N » : cible ≥ 44 px.
Règles dures : DEFAUTS-RECURRENTS § ORGANISE-TROP-TEXTUEL, FRISE-GENERIQUE, ENTETE-PEU-UTILE, CARNET-LISTE-COMPACTE ; aucune valeur absente de ses notes.

## Moteur (repris tel quel du jouable M4 b)
Base de code : work/missions/2026-11-25-carnet-document/jouable/m4b.html (Claude par la capacité sample, journal db, consigne et validation des
citations, lecture auto quand il arrête d'écrire, outil IA → Organisé, Organisé par défaut, « + », Aide, 14 exemples et « Recharger les exemples »,
Mes notes = vraie note). Copie-le et change l'interface selon la recette ; garde le moteur. Corrige au passage le défaut connu : les id d'éléments
ne croisent jamais les id des <symbol>.

## Puis : exemples, IA jouée, corrections
Pour chacun des 14 exemples (et les 5 cas fictifs de work/missions/2026-11-25-carnet-document/visuel/cas-fictifs.json, chargés comme exemples
« ZZ TEST — »), réponds TOI-MÊME à la consigne (window.__p4.consigneDe), rends par un window.claude simulé, capture Organisé, juge, corrige
consigne et rendu, rejoue. CAS.md : cas → OK / problème → corrigé, avec la capture.

## Contrat
Possède : work/missions/2026-11-25-carnet-passe4/jouable/ (p4.html, reponses/, cap/, CAS.md, RESULTAT.md). Rien d'autre.
Tests : aucun test unitaire ; la preuve est la vision.
Gestes : liste, ranger d'un toucher, ouvrir, Organisé de chaque exemple, toucher un élément → sa ligne, décider + Annuler, Aide garder / non merci,
« + », écrire depuis Organisé, IA en erreur, feuille Changé par l'IA.
Captures 390 : 390 × 844 (deviceScaleFactor 2), puppeteer-core connecté au Chrome de débug port 9222, ton propre onglet, page.close() puis
browser.disconnect(), jamais browser.close(). Captures 1280 : aucune.
Mesure par script mots au premier écran d'Organisé et px de la première info utile, par cas, dans RESULTAT.md.
Ouvre chaque capture. Commit local de tes seuls chemins (git add -f, git commit -- <chemins>). Ni push ni publication (le pilote publie, capacités :
sample, dictation, db rules journal admin/admin).
