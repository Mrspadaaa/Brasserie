# Voie p14-controles-fiche-fil — les contrôles D115 (le radar d'abord) et D116 (le vrai fil d'étapes)

- Mission : 2026-10-23-maquette-parcours (lire `../../MISSION.md` d'abord)
- Agent : auteur
- Modèle : sonnet
- Niveau : jugement (deux contrôles, leurs témoins)
- Plafond : 70 tours ; 3 essais par critère
- Dépend de : —
- Décideur en cas de doute : pilote ; aucune question bloquante, l'option prudente écrite dans RESULTAT.md

## Objectif
Deux commentaires du brasseur sur la maquette publiée (23.10, soir), mot pour mot (SPEC-BRASSEUR § 1 ;
DEFAUTS-RECURRENTS, D115 et D116, à lire en entier) :
- D115, dans la fiche de Cascade, sur « · nommé en premier » : « Mettre le radargraph avant, cette vue est vraiment pas
  terribles. À revoir... ». Le radar passe avant la liste des familles ; la liste elle-même sera refaite en variantes
  montrées plus tard (L24) : hors de cette voie.
- D116, sur « 16D hypothèse » de l'étape Houblons : « Pourquoi ? Qu'est-ce que ce champs apporter ?? Il faudra
  remplacer tout ça par le vrai Stepper de la vrai app ». L'en-tête de l'étape doit être le fil d'étapes de l'app
  (`WizardStepName`, `WizardStepRail` de `src/ui/WizardStepBar.tsx`, 7 étapes, la 3ᵉ active) ; aucun « hypothèse ».

Leçon L13 : chaque contrôle s'écrit avant la correction et échoue sur la version rejetée.

## Les contrôles
1. **`controle-fiche.mjs` étendu (D115)**, ou `controle-fiche-radar.mjs` neuf si l'extension casse ses appels (M15 :
   `node scripts/agents/systeme.mjs appels controle-fiche.mjs --rejouer` doit rester vert, sauf les appels sur des pages
   que D115 doit faire échouer, à nommer). Page `<dossier>/fiche/etat.html` (la fiche ouverte), 390 × 844 : le haut du
   radar (le `svg` du radar de la fiche) est au-dessus du haut de la liste des familles, et le radar est entier dans le
   premier écran (844 px) sans défiler. Lignes `- D115 …`.
2. **`controle-stepper.mjs` (D116, neuf)**. Page `<dossier>/ma-biere/etat.html`, 390 × 844 puis 1280 × 800 :
   l'en-tête de l'étape rend le fil d'étapes de l'app. Lire `src/ui/WizardStepBar.tsx` (lecture seule) pour le
   reconnaître dans le DOM par sa structure ou ses classes, sans exiger un marqueur que l'app n'a pas : 7 étapes, la 3ᵉ
   (Houblons) active. Et aucun texte visible « hypothèse » dans l'en-tête. Sortie `STEPPER OK` / `STEPPER ECHEC`.

## Entrées
- `work/refonte-frontend/v4/DEFAUTS-RECURRENTS.md` (D115, D116) ; `work/refonte-frontend/v4/SPEC-BRASSEUR.md` § 1.
- `work/refonte-frontend/v4/tournoi/outils/controle-fiche.mjs`, `controle-teinte.mjs` (en-tête et Chrome). Chrome :
  `C:/Program Files/Google/Chrome/Application/chrome.exe`, `puppeteer-core` du `package.json` de la racine.
- `src/ui/WizardStepBar.tsx` et son emploi dans l'app (`src/pages/RecipePage.tsx` ou voisins), en lecture seule.
- La version rejetée, construction d332792c : `prototypes/houblons-v4/maquettes/parcours-d332792c/`.

## Possède (seuls chemins où écrire, avec RESULTAT.md)
- `work/refonte-frontend/v4/tournoi/outils/controle-fiche.mjs` (extension D115) ou `controle-fiche-radar.mjs` (neuf)
- `work/refonte-frontend/v4/tournoi/outils/controle-stepper.mjs` (neuf)
- `work/refonte-frontend/v4/tournoi/outils/temoins/fiche-radar-*/**`, `…/temoins/stepper-*/**`
- `work/refonte-frontend/v4/tournoi/outils/portee-defauts.json` : les lignes D115 et D116 seulement. D'autres voies
  écrivent en même temps : relire le fichier juste avant, écrire en une commande, n'écraser rien.
- `work/missions/2026-10-23-maquette-parcours/voies/p14-controles-fiche-fil/RESULTAT.md`
- Fichiers de travail dans `os.tmpdir()` (L17), jamais à la racine.

## Consignes
1. Témoins : d332792c → ECHEC pour les deux ; `fiche-radar-ok` (radar d'abord, dans l'écran) → OK, `fiche-radar-bas`
   (liste d'abord) → ECHEC ; `stepper-ok` (une page statique qui reproduit le DOM rendu de WizardStepBar, 7 étapes, la 3ᵉ
   active) → OK, `stepper-hypothese` (en-tête maison avec « hypothèse ») → ECHEC.
2. Les lignes D115 (portée `["fiche"]`) et D116 (portée `["ma-biere"]`) dans `portee-defauts.json`, `tourne` `oui`,
   verdict `garde`.
3. `node scripts/agents/systeme.mjs temoins` (TEMOINS OK) ; les appels rejoués pour un script existant modifié.

## Exigences transversales (recopiées, L05)
- Règle n° 1 : la fiche g1 reste sa base (son inventaire) ; seul l'ordre radar–liste change. L26 ; M10 ; M15.

## Critères
Dans `GATES.md`, même dossier. Ne pas le modifier. Lancer chaque `CHECK:` depuis la racine du dépôt.

## Rendre
`RESULTAT.md` : par contrôle, ce qui est fait, ses sorties sur d332792c et sur ses témoins ; les appels rejoués ;
`LEÇON PROPOSÉE : …` s'il y a lieu. Réponse finale au pilote : une ligne.
