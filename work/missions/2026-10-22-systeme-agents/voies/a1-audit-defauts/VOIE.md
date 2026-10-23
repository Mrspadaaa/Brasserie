# Voie a1-audit-defauts — Quels défauts du brasseur sont encore gardés ?

- Mission : 2026-10-22-systeme-agents (supervision du système d'agents)
- Agent : auteur
- Modèle : sonnet
- Niveau : jugement
- Plafond : 80 tours ; 3 essais par critère
- Dépend de : —
- Décideur en cas de doute : pilote

## Pourquoi
Le 23.10, les 56 concepts de Dryhopper sont sortis à moitié vides. Le brasseur avait pourtant écrit « pas assez dense »
et « voir un Max d'info au même endroit » dès le 18.10 (D4, seuil 0,80). Sa question : « Comment c'est possible ???
Qu'est-ce qui a été oublié ? Comment ne plus oublié ce genre de choses critique ? »

Le pilote a constaté :
- la règle 3 de `work/refonte-frontend/v4/DEFAUTS-RECURRENTS.md` (« Rien ne lui est montré sans LOT OK de
  `tournoi/outils/controle-lot.mjs` sur tous les contrôles de ce registre ») n'est plus appliquée : `controle-lot.mjs`
  ne figure dans aucun GATES des missions ;
- sur les 50 scripts cités par le registre, 31 n'ont jamais été joués dans la mission du 22-23.10, même en comptant
  ceux qu'appelle `controle-commun.mjs`.

Ta voie établit, défaut par défaut, ce qui est encore gardé, sur des pages au format actuel.

## Ce qu'il faut
Pour **chacune des 119 lignes D** de `work/refonte-frontend/v4/DEFAUTS-COURT.md`, la source détaillée étant
`DEFAUTS-RECURRENTS.md` :
1. **contrôle** : le script et ses arguments, ou « jury » s'il est non mesurable, ou « aucun » ;
2. **portée** : sur quels écrans le défaut s'applique, avec ces mots, plusieurs possibles : `tout-ecran`, `rail`
   (moment, loupe, glisser), `radar`, `comparer`, `fiche`, `carte-houblon`, `suggestions`, `recette`, `ma-biere`,
   `dryhopper`, `levure`, `picto`, `donnees` (moteur, JSON), `page-lot` ;
3. **tourne** : joue le script sur les pages actuelles qui relèvent de sa portée, et note `oui` (il donne un
   verdict OK ou ECHEC), `non` (il plante, ne trouve pas ses marqueurs ou attend un ancien format), `sans-script`
   ou `jury`. Pages actuelles :
   - Comparer : `work/refonte-frontend/v4/ecran-1/fils22-comparer/r6n2/etat.html` ;
   - Dryhopper : `work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-g/passe2/g1/etat.html` ;
   - baseline : `work/refonte-frontend/v4/ecran-1/fils18-baseline/l8g/etat-b.html`.

   Lis l'en-tête « Usage » de chaque script pour l'appeler. Un harnais qui joue tous les scripts d'un coup est
   bienvenu, à écrire dans `os.tmpdir()`.
4. **résultat** : la sortie décisive, une ligne, quand il tourne ;
5. **verdict** :
   - `garde` : il tourne et garde le défaut ;
   - `a-adapter` : le défaut vaut encore, mais le script ne tourne plus sur le format actuel ;
   - `caduc` : remplacé par un défaut ou une décision plus récents, à citer ;
   - `jury` : non mesurable.

## Entrées
- `work/refonte-frontend/v4/DEFAUTS-COURT.md` et `work/refonte-frontend/v4/DEFAUTS-RECURRENTS.md`.
- `work/refonte-frontend/v4/tournoi/outils/` : les scripts.
- `work/refonte-frontend/v4/SPEC-BRASSEUR.md`, § 0 : ce qui vaut aujourd'hui, pour juger un défaut caduc.

## Possède (seuls chemins où écrire, avec RESULTAT.md)
- `work/refonte-frontend/v4/tournoi/outils/portee-defauts.json` ;
- `work/missions/2026-10-22-systeme-agents/voies/a1-audit-defauts/AUDIT.md` ;
- `work/missions/2026-10-22-systeme-agents/voies/a1-audit-defauts/RESULTAT.md`.

Fichiers de travail dans `os.tmpdir()`, jamais à la racine (L17).

**Ne modifie aucun script de contrôle.** Une autre session les utilise en ce moment. Pas de git.

## Format de `portee-defauts.json`
`{ "maj": "AAAA-MM-JJ", "defauts": [ { "id": "D4", "mots": "<ses mots, courts>", "controle": "controle-lot.mjs --fill=0.8"
| "jury" | "aucun", "portee": ["tout-ecran"], "tourne": "oui|non|sans-script|jury", "resultat": "<sortie décisive ou raison>",
"verdict": "garde|a-adapter|caduc|jury", "remplace_par": "<Dxx ou décision, si caduc>" } ] }`. Une entrée par ligne D,
avec l'id exact de DEFAUTS-COURT.

## AUDIT.md
Ce fichier contient :
- une ligne de bilan : combien gardés, à adapter, caducs, jury ;
- `## À adapter` : par ordre d'importance pour les lots à venir, Dryhopper et Comparer d'abord. Pour chacun, pourquoi il
  ne tourne plus et ce qu'il faudrait pour qu'il tourne ;
- `## Caducs` : avec ce qui les remplace ;
- `## Portée par sujet` : pour chaque mot de portée, la liste des contrôles qui gardent ce sujet. C'est la liste qu'une
  voie de ce sujet devra jouer.

## Rendre
`RESULTAT.md` :
- ligne 1 : `OK — <bilan>` ou `ECHEC — <cause>` ;
- puis les sorties décisives des critères ;
- `CONNAISSANCE : …` ou `aucune` ;
- `LEÇON PROPOSÉE : …` ou `aucune`.

Réponse finale : une ligne.
