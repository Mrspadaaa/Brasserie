# Voie p2-correctifs — le port d'Identité garde r4-a aussi quand il touche

- Mission : 2026-10-31-ecran-identite
- Agent : auteur
- Modèle : sonnet
- Niveau : jugement (code de l'app)
- Plafond : 90 tours ; 3 essais par critère
- Dépend de : p1-port (relance 2, IDENTITE OK) et le verdict du critique
- Décideur en cas de doute : pilote ; la règle est r4-a telle quelle

## Objectif
Corriger dans l'app les écarts du critique (`critique/VERDICT-port.md`, 11 écarts) : au repos, l'étape Identité est déjà r4-a ; dès
qu'il touche, l'ancien bloc revient (alertes redites, tableau de Matériel, deux boutons de repères). Après la voie, chaque état
ressemble à sa capture de r4-a, à 390 et à 1280.

## Son choix (règle n° 1)
Sur r4-a : « ça semble vraiment bien ». Et : « il faut que 7 · r4 · Chaque nombre est un curseur soit accessible en mode ordinateur ».
La base est `work/missions/2026-10-31-ecran-identite/v1/r4-a/etat.html`, ses captures et NOTE.md (24 éléments). Ce n'est pas une
interprétation libre.

## Entrées (lire seulement ça)
- `work/missions/2026-10-31-ecran-identite/critique/VERDICT-port.md` : les 11 écarts, chacun avec sa capture et la correction attendue.
- `work/missions/2026-10-31-ecran-identite/voies/p1-port/RESULTAT.md` : ce que le port a fait, ses fichiers, la commande de la série.
- `work/missions/2026-10-31-ecran-identite/voies/p1-port/capturer-identite.mjs` : la série Chrome, à copier dans ta voie.
- `work/missions/2026-10-31-ecran-identite/v1/r4-a/` : `etat.html`, `NOTE.md`, les captures `reperes-ouverts.png`,
  `g2-fermenteur-pendant.png`, `g2-fermenteur-apres.png`, `ordinateur-1280-ebullition-120.png`.
- `.claude/rules/affinee-frontend.md`, DESIGN.md (rayons 10, 16 et 24 px), `docs/ui-compacte.md`.

## Possède (seuls chemins où écrire, un par ligne)
- `src/pages/BrewWizard.tsx` (l'étape Identité, l'en-tête de l'assistant avec « Abandonner », le bandeau Grain / OG / IBU / EBC)
- `src/pages/recipe-wizard.css`
- `src/ui/identite/`
- `tests/unit/identite/`
- `work/missions/2026-10-31-ecran-identite/voies/p2-correctifs/`
- le fichier du composant du bandeau de l'assistant, s'il vit hors de `BrewWizard.tsx` : tu peux le modifier, pour le n° 4 seulement,
  et tu nommes ce fichier dans RESULTAT.md.

Interdits : `ecrans.json`, `ecrans-app.json`, `functions/`, `.codex/`, `source4-portable-bundle-manifest-01.json`, `functions/.env`
(ne pas le lire), et `voies/p1-port/`.

## Consignes
1. **D'abord les contrôles, qui échouent** (L13). Copie `voies/p1-port/capturer-identite.mjs` dans ta voie. Ajoute-lui ces contrôles, à 390
   et à 1280, chacun sur une ligne `OK` ou `ECHEC` comptée dans `IDENTITE OK` / `IDENTITE ECHEC n` :
   - entre la tuile Volume et la tuile Ébullition, une ligne `role="status"` au plus, dans tous les états ;
   - « Repères » ouverts : une seule ligne de source, et aucun bouton pleine largeur ;
   - fermenteur ouvert : le champ « Fermenteur [N] L » et « ↺ profil » visibles ; le résumé « Volumes et matériel » replié au repos ;
   - à 1280, le bandeau Grain / OG / IBU / EBC tient sur une ligne (une seule hauteur de rangée) ;
   - au focus d'un nombre tapable : pas de bordure ni de fond blanc ; un trait plein de 2 px dessous.
   Lance la série **avant toute correction** et copie la ligne `IDENTITE ECHEC n` dans RESULTAT.md, sous « TEMOIN AVANT : ».
2. **Corriger, dans l'ordre du verdict** :
   - **n° 1** : retirer du premier plan les alertes que le dessin dit déjà (fermenteur plein → « +N L de trop » sous le volume ; cuve →
     « +N L de trop » sur la barre). Le rinçage, que rien ne dessine, garde une seule ligne courte au premier plan (décision du pilote,
     par exemple « Rinçage : 28 L pour 24 L à chaud »), et reste aussi dans la tuile Matériel. Rien ne se perd : chaque alerte retirée du
     premier plan reste dite dans le dessin ou dans Matériel ;
   - **n° 2** : une ligne de source « 16D · BJCP 2021 · Lire la source » ; les deux propositions sur une ligne de liens discrets, sans la phrase ;
   - **n° 3** : au dépli du fermenteur, « Fermenteur [N] L » et « ↺ profil » ; les deux adaptations sur une ligne de liens ; « Volumes et
     matériel » replié par défaut sur une ligne (« Volumes · 34,7 / 35 L avant ébullition ⌄ »), ses alertes dedans ;
   - **n° 4** : le bandeau sur une ligne à 1280, comme à 390, pour les sept étapes ;
   - **n° 5** : le focus des nombres selon la retouche B de r4-a (fond transparent, trait plein de 2 px, caret seul) ; le champ
     « Fermenteur [N] L » garde son cadre ;
   - **n° 6** : mesure la colonne des autres étapes de l'assistant. Si elles sont à 560 px et Identité seule à 740, aligne Identité ; si toutes
     sont à 740, ne change rien et dis-le dans RESULTAT.md ;
   - **n° 7** : la ligne « Adopte ton installation… » devient le sous-titre de la demi-tuile Matériel (« Système 30 L · à adopter ») ;
   - **n° 8** : le code du style avant le chevron (« Foreign Extra Stout 16D ⌄ ») ;
   - **n° 9** : « cuve 35 L » (sans « utile ») ; le nom du profil reste tel qu'il a été saisi ;
   - **n° 10** : règle du volume = fermenteur + 5 L, dernier chiffre au fermenteur (« 60 › ») ; au-delà de 180 min d'ébullition, un chiffre
     tous les 60 min, le « › » sur le dernier. En fonctions pures, testées ;
   - **n° 11** : « Abandonner » sur la ligne du titre, à 1280 comme à 390 ; la page ne bouge plus quand la recette est modifiée.
3. **La série**, après correction, dans un dossier neuf `voies/p2-correctifs/captures/r3/`, avec la commande de G3. Ouvre en image
   (L12) au moins : vide, clavier après, repères ouverts, fermenteur 60, profil rendu, repos 1280, et le côte à côte avec r4-a.
4. **La baseline des autres étapes** :
   `node scripts/with_server.mjs --server "npm run dev -- --port 5614 --strictPort" --port 5614 --env VITE_HOP_V4=on --env VITE_FIREBASE_API_KEY=fake -- node scripts/agents/baseline-visuelle.mjs --comparer`.
   Avant la voie, 4 écarts existaient déjà (`suggerer/bannie-tropicaux`, `fiche/repos`, `fiche/bas`, `substituer/dry-hop`). Le bandeau
   (n° 4) et « Abandonner » (n° 11) changent le haut des autres étapes : chaque écart nouveau est nommé dans RESULTAT.md avec sa cause.
   Ne reprends aucune référence (`--prendre`) : le pilote le fera après avoir regardé.
5. **Toujours** : hors ligne ; fixtures seulement, aucune donnée réelle, aucun appel hors localhost ; pas de cockpit ; aucun texte sous
   12 px ; jamais `type="number"` ; rien n'est retiré ailleurs dans l'app. Pas de serveur dans `C:/Users/mrspa/Documents/Brasserie`. Aucun
   code par heredoc ni par `node -e`. Pas de `git stash`, aucun commit.

Les mesures exactes sont dans les captures et la NOTE de r4-a : la règle du volume dans `g2-fermenteur-apres.png` (0–65, « 60 › » pour
un fermenteur de 60 L), le focus dans la retouche B de `v1/r4-a/NOTE.md`. p1-port a rendu `IDENTITE OK` (99 contrôles) et `VOIES OK 2/2`
au rejeu du pilote : tu pars de cet état.

## Critères
Dans `GATES.md`, même dossier. Ne pas le modifier. Lancer chaque `CHECK:` depuis la racine du dépôt. Dans `--contient "a,b,c"`, les
virgules séparent des mots qui doivent **tous** être dans RESULTAT.md.

## Rendre
`RESULTAT.md`, écrit section par section dès le début (ligne 1 provisoire) :
- ligne 1 : `OK — correctifs du port : IDENTITE OK (n contrôles), 11 écarts traités` ou `ECHEC — <ce qui reste>` ;
- « TEMOIN AVANT : IDENTITE ECHEC n » ;
- par écart, ce qui est fait, avec la capture ouverte ;
- les fichiers écrits ; la baseline (écarts anciens, écarts nouveaux et leur cause) ;
- `LEÇON PROPOSÉE : …` ou `aucune`.
Réponse au pilote : une ligne.
