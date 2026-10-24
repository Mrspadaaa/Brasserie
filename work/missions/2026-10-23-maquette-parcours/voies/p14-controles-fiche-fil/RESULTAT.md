OK — D115 (radar avant la liste) et D116 (vrai fil d'étapes) : deux contrôles, huit témoins, tous en échec sur d332792c

## Fichiers écrits
- `work/refonte-frontend/v4/tournoi/outils/controle-fiche-radar.mjs` (neuf : D115 ; `controle-fiche.mjs` n'est pas touché, ses appels restent intacts, M15)
- `work/refonte-frontend/v4/tournoi/outils/controle-stepper.mjs` (neuf : D116)
- Témoins : `temoins/fiche-radar-ok`, `fiche-radar-bas`, `fiche-radar-hors-ecran` (chacun `fiche/etat.html`) ; `temoins/stepper-ok`, `stepper-hypothese`, `stepper-hypothese-avec-fil`, `stepper-six-etapes`, `stepper-mauvaise-etape` (chacun `ma-biere/etat.html`). Pages statiques, générées depuis `os.tmpdir()`.
- `portee-defauts.json` : lignes D115 (portée `fiche`) et D116 (portée `ma-biere`), `tourne` oui, verdict `garde`. Fichier relu et réécrit en une seule commande Node (lecture, ajout, écriture) ; les lignes des autres voies sont intactes (aucune suppression dans le diff).

## D115 — `controle-fiche-radar.mjs`
Page `<dossier>/fiche/etat.html` à 390 × 844, conteneurs remis en haut. Convention de `controle-fiche.mjs` : fiche = `data-role="fiche"`, radar = `svg[data-radar][data-objet="fiche"]`, liste des familles = `data-role="fiche-arome"`. Règles : le haut du radar est au-dessus du haut de la liste ; le radar est entier dans 844 px ; il fait au moins 120 px de haut.
- d332792c : FICHE-RADAR ECHEC. Radar 603–944 px, liste dès 208 px ; deux lignes D115 (après la liste ; pas entier dans l'écran).
- fiche-radar-ok (radar 102–444, liste dès 452) : FICHE-RADAR OK.
- fiche-radar-bas (liste d'abord) : ECHEC (radar 464, liste 102).
- fiche-radar-hors-ecran (radar avant la liste mais finit à 1012 px) : ECHEC sur « pas entier ».
- Capture de fiche-radar-ok prise et ouverte (radar entier, liste dessous). La fiche de d332792c a été vue en capture : liste d'abord, radar coupé en bas.

## D116 — `controle-stepper.mjs`
Page `<dossier>/ma-biere/etat.html`, 390 × 844 puis 1280 × 800. Lu `src/ui/WizardStepBar.tsx` et `BrewWizard.tsx` (STEPS) : le fil se reconnaît par `nav[aria-label="Étapes"]` / `.wizard-step-rail` de 7 `button` dont l'`aria-label` est le nom de l'étape (Identité, Fermentescibles, Houblons, Levure, Paliers, Eau et sels, Récapitulatif), un seul `aria-current="step"` sur le 3e ; le nom « Houblons 3/7 » est lu sur le texte visible (le `sr-only` d'`aria-live` est écarté) ; aucun texte visible « hypothèse » au-dessus du bas du fil (130 px sans fil). Aucun marqueur que l'app n'a pas n'est exigé.
- d332792c : STEPPER ECHEC (4 lignes : fil absent, « hypothèse » visible, aux deux largeurs). Le nom « Houblons 3/7 » y est (rien n'est reproché à tort).
- stepper-ok : STEPPER OK 2/2 largeurs.
- stepper-hypothese (en-tête maison, sans fil) : ECHEC.
- stepper-hypothese-avec-fil (fil de l'app + pastille « 16D hypothèse ») : ECHEC sur « hypothèse » seule, donc cette règle tient seule.
- stepper-six-etapes : ECHEC (6 étapes) ; stepper-mauvaise-etape (2e active) : ECHEC.
- Captures de stepper-ok et stepper-hypothese-avec-fil prises et ouvertes.

## Critères GATES (depuis la racine)
- G1 `echoue "STEPPER ECHEC"` sur d332792c : `ECHOUE OK (STEPPER ECHEC, code 1)`.
- G2 stepper-ok : `STEPPER OK 2/2 largeurs`.
- G3 stepper-hypothese : `ECHOUE OK (STEPPER ECHEC, code 1)`.
- G5 : `PORTEE OK`.
- G6 : `TEMOINS OK`. `systeme.mjs cablage` : CABLAGE OK (pas de caractère de contrôle, M10).
- G4 : cette note (voir `--contient`).

## Appels rejoués (M15)
- `systeme.mjs appels controle-stepper.mjs --rejouer` : APPELS OK (3 critères rejoués : G1, G2, G3).
- `systeme.mjs appels controle-fiche-radar.mjs --rejouer` : APPELS OK (0 critère rejoué : aucun GATES ne l'appelle encore ; à brancher par le pilote dans les GATES de la voie qui refait la fiche).
- `systeme.mjs appels controle-fiche.mjs --rejouer` : APPELS OK (1 critère rejoué), script non modifié.

## Essais, doutes, limites
- Essais : un seul par critère, sauf la reconnaissance du nom « Houblons 3/7 » (3 itérations internes : `innerText` concaténait le `sr-only`, puis texte visible).
- Les témoins stepper-ok et fiche-radar-ok sont des pages statiques qui imitent le DOM rendu, pas la maquette construite : la première vraie preuve sera la maquette reconstruite avec `WizardStepName` et `WizardStepRail`.
- D115 : « premier écran » = bas du radar ≤ 844 px ; le pied fixe de la fiche (goût, Comparer, ~798–838 px) n'est pas soustrait. Si le radar finit derrière lui, le contrôle ne le voit pas.
- D115 : si la liste `fiche-arome` disparaît d'une future fiche, l'ordre est considéré tenu (seules restent les règles de présence et de position dans l'écran).
- D116 : « en-tête » = tout ce qui est visible au-dessus du bas du fil. Une pastille « hypothèse » plus bas (hors en-tête) n'est pas reprochée.

DÉCISION À PRENDRE : aucune.
CONNAISSANCE : aucune
LEÇON PROPOSÉE : aucune (note d'outil : l'outil Bash du harnais retire les antislashs des regex passées par heredoc Node ; écrire les contrôles avec Write/Edit, M10).
