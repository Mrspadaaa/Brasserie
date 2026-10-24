# Voie r0d-controles-dryhopper — Les contrôles de la passe 2 de Dryhopper

- Mission : 2026-10-22-reprise-lot21
- Agent : auteur
- Modèle : sonnet
- Niveau : jugement
- Plafond : 80 tours ; 3 essais par critère
- Dépend de : r7-tri
- Décideur en cas de doute : pilote

## Lire d'abord
Dans `work/refonte-frontend/v4/SPEC-BRASSEUR.md`, le § 0 « Ce qui vaut aujourd'hui », puis seulement la section de ton
sujet. Au lieu de DEFAUTS-RECURRENTS.md en entier : `work/refonte-frontend/v4/DEFAUTS-COURT.md`.

## Objectif
Trois changements dans les contrôles, chacun avec un témoin qui réussit et un qui échoue, sans casser les témoins
d'avant :
1. **Les acquis de Dryhopper** : `controle-acquis.mjs --outil=dryhopper`. D99 vise Comparer (radar, chimie, panel OSU,
   vraies valeurs) et donne 0/4 sur Dryhopper. Pour Dryhopper, les acquis sont, balisés `data-acquis` :
   - `geste` : le moment se glisse au doigt par 5′ (« pouvoir glisser comme un slider le moment de l'ajout », 18.10 ;
     y1b) ; un curseur (`role="slider"` ou `input type=range`) dont les crans d'ébullition font 5 minutes, déclaré
     (`data-pas="5"`) ou mesuré sur au moins trois valeurs ;
   - `frise` : la frise du brassin avec, à son bout, les jours de contact (x3b réduit en fin de frise) ;
   - `valeurs` : au moins une vraie valeur `[data-nature="mesure"]` avec `data-source`, un nombre et une unité, sa source
     visible (la règle de D99, au minimum 1) ;
   - `levure` : la levure en dernière étape de Dryhopper ou en pont vers un outil Levure (un lien ou un bouton qui la
     nomme).
   Chaque acquis compte au repos ou à un toucher, avec la convention de D99 (un seul toucher sur un déclencheur déclaré).
   Sortie `ACQUIS OK (4/4 : geste, frise, valeurs, levure)`. Sans `--outil`, rien ne change.
2. **D98 (b)** dans `controle-une-question.mjs`, option `--edition` (décision du pilote du 22.10, conforme au verdict du
   conseil : « la dose reste en contexte, réglable d'un toucher ») : dans la ligne de contexte, chaque facteur fixé peut
   porter **un seul** bouton d'édition (`data-edite="<facteur>"`) qui ouvre une feuille fermée au repos
   (`aria-controls`) ; il ne compte pas comme groupe libre. Deux contrôles pour un même facteur, ou un contrôle qui
   change la valeur directement dans la ligne, échouent. Sans `--edition`, la règle stricte (a) reste.
3. **Le défaut relevé par r7a et r7e** : `data-libre` posé sur le curseur lui-même (`role="slider"`) donne
   « 0 option », car le contrôle ne cherche que dans les descendants. L'élément lui-même doit compter (ses crans par
   `aria-valuemin`, `aria-valuemax` et le pas, ou `data-options`).

## Entrées
- `work/refonte-frontend/v4/tournoi/outils/controle-acquis.mjs` et `work/refonte-frontend/v4/tournoi/outils/controle-une-question.mjs` : lis leurs en-têtes et leur code.
- `work/refonte-frontend/v4/ecran-1/fils23-dryhopper/BRIEF-SERIES.md` et `fils23-dryhopper/tri/SYNTHESE.md` : ce que
  les passes 2 vont faire.
- Les concepts `work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-a/a1/etat.html` (curseur, `data-libre`) et
  `serie-e/e5/etat.html` : lis leur balisage, sans les modifier.
- `work/refonte-frontend/v4/ecran-1/fils21-choisir/y1b/etat.html` : le geste de référence.

## Possède (seuls chemins où écrire, avec RESULTAT.md)
- `work/refonte-frontend/v4/tournoi/outils/controle-acquis.mjs`, `work/refonte-frontend/v4/tournoi/outils/controle-une-question.mjs`
- `work/refonte-frontend/v4/tournoi/outils/temoins/dryhopper-*/**` et `work/refonte-frontend/v4/tournoi/outils/temoins/une-question-edition-*/**` (pages témoins autonomes, `etat.html`)
- `work/missions/2026-10-22-reprise-lot21/voies/r0d-controles-dryhopper/RESULTAT.md`
Mets à jour les en-têtes des deux contrôles (règle, ses mots, témoins). Aucun caractère de contrôle dans les scripts
(M10) : écris les échappements avec soin. Fichiers de travail dans `os.tmpdir()`, jamais à la racine (L17).

## Critères
Dans `GATES.md`, même dossier. Ne pas le modifier. Lancer chaque `CHECK:` depuis la racine du dépôt.

## Rendre
`RESULTAT.md` au format de l'agent : ligne 1, les sorties décisives, `CONNAISSANCE : …` et `LEÇON PROPOSÉE : …`.
Réponse finale au pilote : une ligne.
