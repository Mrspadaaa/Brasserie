# Voie c5 — le contrôle « à la volée » (D211), qui échoue sur r4d

- Mission : 2026-10-31-ecran-fermentescibles
- Agent : auteur
- Modèle : sonnet
- Niveau : jugement (contrôle Chrome)
- Plafond : 60 tours ; 3 essais par critère
- Dépend de : r4d (`v3/r4d/etat.html`)
- Décideur en cas de doute : pilote

## Objectif
Sa plainte sur r4d, mot pour mot : « Mais ça inclus pas les besoins que j'ai à la volée ??? ». Dans r4d, seule la masse se tape sur la
ligne ; le moment, la part du grain et la couleur « ? » demandent de toucher la ligne puis le plateau. Écrire le contrôle qui le refuse
(L13), prouver qu'il échoue sur r4d, et qu'il passe sur un petit témoin qui fait ces gestes sur la ligne.

## Le contrôle `controle-volee.mjs`
Chemin : `work/refonte-frontend/v4/tournoi/outils/controle-volee.mjs`. Appel : `node … <etat.html> [--etats=,x]`. Chrome sans écran
(`puppeteer-core`, `C:/Program Files/Google/Chrome/Application/chrome.exe`), à 390 px (tactile) et à 1280 px (souris et clavier). Pour
chaque largeur, depuis le repos, sur la **deuxième** ligne `[data-sel]` (une ligne qui n'est pas choisie au départ) :
1. **masse** : `[data-role="kg-ligne"]` ; « 2,5 » puis Entrée ; la ligne lit 2,5 kg ;
2. **part** : `[data-role="part-ligne"]` sur la ligne ; « 30 » (ou la barre tirée, si la cible est une barre) ; la part lue sur la ligne vaut
   30 % à ±1 point, et la masse de la ligne a changé ;
3. **moment** : `[data-role="moment-ligne"]` sur la ligne ; un toucher, puis au plus un choix `[data-role="moment-choix"][data-val="ebullition"]`
   (un menu ancré à la ligne, ou un cycle sans menu) ; le moment lu sur la ligne devient « ébullition » ;
4. **couleur** : sur une ligne qui montre « ? », `[data-role="couleur-ligne"]` ; « 8 » puis Entrée ; le « ? » de la ligne laisse place à une
   teinte et le compte « à renseigner » baisse de 1.
Pour chaque réglage : **deux gestes au plus** (un toucher ou clic, puis la saisie ou un choix) ; aucune cible dans le plateau
(`[data-role="bal"]`) ni dans le détail ; le détail ne s'ouvre pas. Un menu de moment compte comme « sur la ligne » s'il est un descendant de
la ligne ou s'il s'ouvre collé à elle (son haut à 8 px au plus du bas de la ligne). Une ligne `OK` ou `ECHEC <réglage> <largeur> : cause` par
contrôle, toutes imprimées (un premier échec n'arrête pas les suivants, M16), puis `VOLEE OK` ou `VOLEE ECHEC n`. Aucune erreur de page tolérée.
S'inspirer de `work/refonte-frontend/v4/tournoi/outils/controle-gestes-ligne.mjs` (même style, mêmes aides), sans le modifier.

## Le témoin positif
`voies/c5/temoin-ok.html` : une page minimale, autonome (trois lignes de grain, une avec « ? », un plateau factice `[data-role="bal"]`),
qui fait ces quatre gestes sur la ligne. Elle ne sert qu'à prouver que le contrôle peut passer ; elle n'est montrée à personne.

## Entrées (lire seulement ça)
- `work/missions/2026-10-31-ecran-fermentescibles/v3/r4d/etat.html` (sa structure : `[data-sel]`, rôles, plateau, détail) et `v3/r4d/capturer.mjs`.
- `work/refonte-frontend/v4/tournoi/outils/controle-gestes-ligne.mjs`.

## Possède (seuls chemins où écrire, un par ligne)
- `work/refonte-frontend/v4/tournoi/outils/controle-volee.mjs`
- `work/missions/2026-10-31-ecran-fermentescibles/voies/c5/`

Interdits : tout le reste (r4d compris), `ecrans.json`, `ecrans-app.json`, `src/`, `functions/`, `.codex/`, le manifeste. Pas de serveur dans
`C:/Users/mrspa/Documents/Brasserie`, pas de `git stash`, aucun commit, aucun code par heredoc ni par `node -e`.

## Critères
Dans `GATES.md`, même dossier. Ne pas le modifier. Lancer chaque `CHECK:` depuis la racine du dépôt.

## Rendre
`RESULTAT.md` : ligne 1 `OK — controle-volee : r4d ECHEC n, témoin OK` ou `ECHEC — …` ; la sortie complète sur r4d (« TEMOIN r4d : »)
et sur le témoin ; `LEÇON PROPOSÉE : …` ou `aucune`. Réponse au pilote : une ligne.
