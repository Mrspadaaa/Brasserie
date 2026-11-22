# Simplicité, passe 2 — brief commun aux voies (15.11)

Dépôt : `C:\Users\mrspa\Documents\Brasserie\.claude\worktrees\wonderful-elbakyan-d93ca6`. Lecture seule hors de ton fichier de sortie.

## Pourquoi une passe 2
La passe 1 (`maquettes.html` dans ce dossier, page https://claude.ai/artifact/Pcu4p1eL3xmgMrTEcyYjDV) proposait 7 parcours **supposés** (dépense, densité, fût, conditionner, stock, note, besoin) comptés depuis le code. Verdict du brasseur, 15.11, mot pour mot : « Pour le workflow, relancer avec plusieurs agent , , c'est mal target ». Il faut repartir de **ses vrais parcours et de ses mots**, pas de parcours supposés.

## Sa demande (SPEC, 15.11, mot pour mot)
- « j'ai créé cette app pour être efficace et facile pour maintenir à jour l'état de ma brasserie SIMPLEMENT et sans me prendre la tête. J'ai l'impression que certains points sont rendus plus complexe et contraignante … Je veux pas perdre en fonctionnalités ni en données mais bien rendre certains workflow beaucoup plus simple et rapide »
- « C'est plutôt, simplifier ou utiliser des petites "hack" pour faciliter certains workflow. Moins de touche. Moi d'info en une fois. Un peu dans l'idée de en un clic on a tout l'essentiel, ça s'autocomplete autocasse, autogéré et on a les infos essentielles avec le moins d'action possible »
- Effets en cascade : une action a des conséquences partout (laver un fût baisse le nettoyant, brasser baisse le Star San) ; « C'est juste des exemples, être générique et général, pas focus sur ces exemples !!! »

## Sources (lire les parties utiles, citer avec la date)
- SPEC à jour (copie) : `C:/Users/mrspa/AppData/Local/Temp/claude/18db0bcada5e703f/b6d9eb7d-ae6d-490c-aa77-62802e45100e/scratchpad/SPEC-26ca.md` — surtout lignes 1600 à 1767 (13 au 15.11) ; chercher aussi plus haut ses plaintes : « contraignant », « compliqué », « pas pratique », « trop de text », « pas intuitif », « ??? ».
- `work/refonte-frontend/v4/DEFAUTS-RECURRENTS.md` ; `work/missions/BUGS.md` (constats en ligne, dont « Recette en ligne 15.11 » RL-1 à RL-12).
- Portrait du brasseur : `work/refonte-frontend/v4/ecran-1/fils21-choisir/critique/PORTRAIT.md`.
- Ses choix : `work/refonte-frontend/v4/choix/ecrans.json` ; règle n° 1 : sa maquette choisie est la base, jamais remplacée.
- `PRODUCT.md` (règle : aucun chiffre inventé), `cerveau/brasseur/pas-de-cockpit.md`.
- Déjà pris par d'autres sessions (ne pas refaire, mais on peut s'y relier) : besoin d'équipement « dossier de solutions » (mission dédiée), planificateur par semaine (t1b2), Fûts (l1/l2, R1, F2), Finances (8 vues), Matériel za3, À venir kh1r/kyh1, + flottant contextuel (b1, ET-PLUS).

## Interdits
Rien de déployé, aucune donnée réelle, pas de Gemini réel, pas de Fable. Pas de code applicatif. Une voie n'écrit que son fichier de sortie (et ses captures dans `os.tmpdir()`).

## Retour
Une ligne au pilote : `OK <fichier>` ou `ÉCHEC <raison>`. Le fichier ≤ 900 mots, faits sourcés (date et mots, ou fichier:ligne), « estimé » marqué.
