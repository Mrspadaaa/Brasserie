# Voie p15-controle-annuler — le contrôle D120 : « Annuler » à côté de l'action qui change la recette

- Mission : 2026-10-23-maquette-parcours (lire `../../MISSION.md` d'abord)
- Agent : auteur
- Modèle : sonnet
- Niveau : jugement (un contrôle, ses témoins)
- Plafond : 50 tours ; 3 essais par critère
- Dépend de : —
- Décideur en cas de doute : pilote ; aucune question bloquante, l'option prudente écrite dans RESULTAT.md

## Objectif
Le brasseur, sur le pied de Substituer (« Lequel à la place de Idaho 7 ? », « 10 g de Simcoe »), mot pour mot : « Pas
de bouton cancer » (SPEC-BRASSEUR § 1, « Annuler » ; D120). Substituer n'a que « Remplacer › » en pied.

## Le contrôle : `controle-annuler.mjs` (neuf)
Pages `<dossier>/<route>/etat.html` des outils qui proposent de changer la recette : `substituer`, `levure`,
`dryhopper` (liste par `--routes=`), 390 × 844 tactile, puis 1280 × 800.
1. Le pied (le dock sous le pouce, ou le dernier bloc d'action) porte un bouton dont le nom accessible ou le texte est
   « Annuler », à côté de l'action qui change la recette (« Remplacer », « Ajouter à ma bière », « Placer »…), visible
   au repos, de 44 px de haut au moins.
2. Un toucher sur « Annuler » ne change pas la recette : `window.__parcours.etat.recette` identique avant et après
   (JSON), et le brouillon (`etat.brouillon`) est abandonné ou nul ; l'outil se quitte (la route change).
Sortie : une ligne par route et largeur, puis `ANNULER OK (n routes × 2 largeurs)` ou `ANNULER ECHEC` et les lignes
`- D120 …` ; code 2 si une page manque.

## Entrées
- `work/refonte-frontend/v4/DEFAUTS-RECURRENTS.md` (D120) ; `work/refonte-frontend/v4/SPEC-BRASSEUR.md` § 1.
- `work/refonte-frontend/v4/tournoi/outils/controle-teinte.mjs` (en-tête, Chrome) ; le crochet de test
  `window.__parcours` : `prototypes/houblons-v4/parcours/ARCHITECTURE.md` (« ## Crochet de test »). Chrome :
  `C:/Program Files/Google/Chrome/Application/chrome.exe`, `puppeteer-core` du `package.json` de la racine.
- La version rejetée, construction d332792c : `prototypes/houblons-v4/maquettes/parcours-d332792c/`.

## Possède (seuls chemins où écrire, avec RESULTAT.md)
- `work/refonte-frontend/v4/tournoi/outils/controle-annuler.mjs`
- `work/refonte-frontend/v4/tournoi/outils/temoins/annuler-*/**`
- `work/refonte-frontend/v4/tournoi/outils/portee-defauts.json` : la ligne D120 seulement (relire juste avant, écrire en
  une commande, n'écraser rien)
- `work/missions/2026-10-23-maquette-parcours/voies/p15-controle-annuler/RESULTAT.md`
- Fichiers de travail dans `os.tmpdir()` (L17), jamais à la racine.

## Consignes
1. Témoins, pages statiques dans `temoins/annuler-<cas>/substituer/etat.html` (lancés avec `--routes=substituer`) :
   `annuler-ok` (Annuler à côté de Remplacer, sans effet sur la recette) → OK ; `annuler-absent` → ECHEC ;
   `annuler-qui-change` (Annuler qui applique quand même) → ECHEC. Ils posent un `window.__parcours` minimal.
2. d332792c → ECHEC.
3. La ligne D120 (portée `["substituer","levure","dryhopper"]`, `tourne` `oui`, verdict `garde`).
4. `node scripts/agents/systeme.mjs temoins` (TEMOINS OK).

## Exigences transversales (recopiées, L05)
- Le contrôle garde ses mots ; la forme est au concepteur. L26 ; M10.

## Critères
Dans `GATES.md`, même dossier. Ne pas le modifier. Lancer chaque `CHECK:` depuis la racine du dépôt.

## Rendre
`RESULTAT.md` : ce qui est fait ; les sorties sur d332792c et sur chaque témoin ; `LEÇON PROPOSÉE : …` s'il y a lieu.
Réponse finale au pilote : une ligne.
