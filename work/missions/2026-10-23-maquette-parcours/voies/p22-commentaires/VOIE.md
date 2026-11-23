# Voie p22-commentaires — chacun de ses commentaires, et ce qu'il est devenu

- Mission : 2026-10-23-maquette-parcours (lire `../../MISSION.md`, sections « Décisions » et « Suite (24.10, matin) »)
- Agent : auteur
- Modèle : sonnet
- Niveau : jugement (un relevé, des verdicts vérifiés)
- Plafond : 90 tours ; 3 essais par critère
- Dépend de : —
- Décideur en cas de doute : pilote ; aucune question bloquante, l'option prudente écrite dans RESULTAT.md

## Objectif
Le brasseur, 24.10, mot pour mot : « J'avais mis des commentaires, j'ai la nette impression que ils ont pas tous été pris
en compte aussi ». Puis : « Il faudra aussi refaire des mini maquettes fils de fer sur les vue dont je suis pas
convaincu » (SPEC-BRASSEUR § 1, « Ses commentaires » ; D125).

Ton travail : **relever chacun de ses commentaires sur les artefacts, dire ce qu'il est devenu, et dresser la liste des
vues dont il n'est pas convaincu.**

## Entrée
`work/refonte-frontend/v4/choix/commentaires/lectures-2026-10-24.json` : les lectures de commentaires relevées dans les
transcriptions des sessions (55 lectures, 5 artefacts : base v4.6, base v4.10, page des fils de fer 2VTRQ, maquette
23.10, maquette 24.10). Un même fil peut paraître dans plusieurs lectures : garde la plus récente, et complète un texte
« elided » par une lecture du fil seul. Seuls comptent les commentaires de « the user (owner) » ; les réponses de
Claude disent ce qui a été promis. Limite connue : les artefacts du 23 et du 24.10 sont sur un autre compte ; rien
après leur dernière lecture (`dernieres_lectures`). Écris-le en tête du rapport.

## Pour chaque fil (chaque commentaire du brasseur)
1. Ses mots exacts, l'artefact, la date, l'endroit (`[location]`, `[anchored at]`), ce que Claude a promis.
2. Sa trace : ses mots dans `work/refonte-frontend/v4/SPEC-BRASSEUR.md` (cherche-les) ; une ligne de
   `work/refonte-frontend/v4/DEFAUTS-RECURRENTS.md` (Dnn) ; un contrôle (script de `work/refonte-frontend/v4/tournoi/outils/`
   cité par la ligne, et la ligne de `portee-defauts.json`) ; un ticket (`gh issue view <n> --repo Mrspadaaa/Brasserie`,
   lecture seule) ; une décision (MISSION.md, `work/refonte-frontend/decisions.md`, `work/refonte-frontend/v4/choix/ecrans.json`).
3. Son effet dans la maquette 24.10 (`prototypes/houblons-v4/maquettes/parcours-5345f6ad/`, pages de route en
   `file://`, 390 × 844 tactile) : joue l'endroit, capture-le, ouvre la capture. Pour un fil des 17 au 19.10 sur un
   écran depuis remplacé, dis où sa demande vit maintenant et si elle est tenue.
4. Un verdict : `fait` (vu dans la maquette) ; `note-sans-controle` ; `controle-sans-correction` ; `promis-non-fait` ;
   `perdu` (ni noté, ni fait) ; `attend-son-choix` (il doit choisir ; dis entre quoi, et si des mini maquettes lui ont
   été montrées) ; `caduc` (remplacé par un choix plus récent : cite-le).
5. S'il exprime qu'il n'est pas convaincu d'une vue (« à revoir », « pas terribles », « dur à comprendre », « pas la
   bonne », « ????? », « UI pas terribles », etc.) : `vue_non_convaincante` = le nom de la vue.

## Livrables
1. `work/refonte-frontend/v4/choix/commentaires/fils-2026-10-24.json` : `{ "maj", "limite", "fils": [ … ] }`, une entrée
   par commentaire du brasseur : `id` (artefact court + fil court + rang), `artefact`, `fil`, `date`, `mots`, `endroit`,
   `promis`, `spec` (oui/non), `defaut` (Dnn ou « »), `controle` (script ou « »), `ticket` (#n ou « »), `verdict`,
   `preuve` (capture existante ou passage cité), `vue_non_convaincante` (ou « »).
2. Les captures : `work/refonte-frontend/v4/choix/commentaires/captures/`.
3. `work/refonte-frontend/v4/choix/commentaires/vues-a-revoir.md` : les vues dont il n'est pas convaincu, une par ligne,
   avec ses mots, la maquette qui la porte aujourd'hui, ce qu'il a déjà vu en variantes (artefact), et ce qui doit
   passer en fils de fer (D125).
4. `RESULTAT.md` : la table, **les fils perdus et promis non faits en tête**, puis le décompte par verdict.

## Possède (seuls chemins où écrire, avec RESULTAT.md)
- `work/refonte-frontend/v4/choix/commentaires/fils-2026-10-24.json`, `…/commentaires/vues-a-revoir.md`,
  `…/commentaires/captures/**`
- `work/missions/2026-10-23-maquette-parcours/voies/p22-commentaires/RESULTAT.md`
Tes scripts : `os.tmpdir()`, jamais à la racine (L17). Lecture seule sur GitHub : ni commentaire ni fermeture (la voie
p23 prépare les tickets). Les voies p19 à p21b jouent Chrome en parallèle : noms de fichiers temporaires à toi.

## Exigences transversales (recopiées, L05)
- Règle n° 1 : ses choix font foi ; rien d'un écran au choix ouvert. L03 : tout l'élément, chaque état. L12 : une capture
  se regarde. Ses mots se recopient mot pour mot, fautes comprises.

## Critères
Dans `GATES.md`, même dossier. Ne pas le modifier. Lancer chaque `CHECK:` depuis la racine du dépôt.

## Rendre
Réponse finale au pilote : une ligne (fils relevés, décompte par verdict, vues à revoir).
