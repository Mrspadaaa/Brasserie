OK — série cmz : quatre Comparer jouables sur la base, le moment se choisit (brasserie, cadran, pellicule, échelle)

## Fichiers écrits (Possède)
- `work/refonte-frontend/v4/ecran-1/fils25-comparer/cmz1/etat.html`, `cmz1/NOTE.md`, `cmz1/donnees-moteur.ts` (lecture du
  moteur de la maquette par `npx vite-node`, écrit le JSON dans le dossier temporaire ; vite-node refuse un fichier hors du dépôt,
  d'où sa place dans le dossier possédé)
- `cmz2/etat.html`, `cmz2/NOTE.md` ; `cmz3/etat.html`, `cmz3/NOTE.md` ; `cmz4/etat.html`, `cmz4/NOTE.md`
- `captures/cmz<1-4>.png`, `cmz<1-4>-moment.png` (10′ touché), `cmz<1-4>-long.png`, `cmz<1-4>-nelson.png` (Motueka face à Nelson
  Sauvin, l'état de sa capture), `cmz<1-4>-plus.png` (＋ ouvert, recherche « nelson »)
- Scripts, hors dépôt : `C:\Users\mrspa\AppData\Local\Temp\claude\C--Users-mrspa--codex-worktrees-openai-clean-start-Brasserie\16fc09ec-4e69-48a9-9744-5912b6ef6552\scratchpad\gen.mjs`
  (générateur des quatre pages), `shot.mjs` (captures), `gestes.mjs` (× ⇄ ＋ recherche, 10′, appui long joués au doigt), `dump.ts`, `donnees.json`, `sprite.html`.
- `git status --short` sur le lot : seuls cmz1 à cmz4 et leurs captures viennent de cette voie (cma*, cmb* sont les séries voisines).

## Les quatre idées (une par page, base jouable intacte ; chaleurs : cmz1 tiède, cmz2 à cmz4 chaudes)
- cmz1 **la brasserie** : cuve + flamme (60′, 10′), whirlpool, fermenteur qui bulle (actif), fermenteur calme (après), au trait ; la
  station touchée se remplit de la couleur du retenu, un point dit qui mène le floral à chaque station.
- cmz2 **le cadran** : une couronne horaire des cinq moments autour du radar r2 ; le radar tourne au moment touché ; IBU du retenu sous le cadran.
- cmz3 **la pellicule** : cinq vignettes (une barre par houblon, famille choisie par la pastille, ★, ⚠), la vignette touchée devient l'écran.
- cmz4 **qui gagne quand** : cinq barreaux-réponses (meneur, écart, sortie de 16D, IBU min–max), le barreau touché déplie la base.
Dans les quatre : hors 16D en chip noir sous chaque tête (◇ = hors des 12 familles), huiles (goutte, barre 0–5 mL/100 g, plage), ⇄ × ＋ avec
recherche sur tout le catalogue, ton Nugget en pointillé au même moment, ≤ 100 mots.

## Critères (sorties décisives, depuis la racine)
- G1 `node work/refonte-frontend/v4/ecran-1/fils25-comparer/outils/variantes.mjs cmz1 cmz2 cmz3 cmz4` → **VARIANTES-CMP-4**
- G2 `controle-pictos-trait … cmz1 cmz2 cmz3 cmz4 --page=etat.html` → **TRAIT OK** (45 / 45 / 49 / 50 pictos, 0 faute)
- G3 `controle-quand-comparer … cmz1 cmz2 cmz3 cmz4 --page=etat.html` → **QUAND OK** (4 pages : « 4 moments (60′, 10′, wp′, dry hop), les valeurs changent d'un moment à l'autre »)
- Indicatifs, joués une fois : `mots-premier-ecran --max=100` 93 / 98 / 99 / 100, MOTS OK (base : 114) ; `controle-panel` sur les
  quatre premiers écrans : remplissage médian 0,65, ressemblance 0,89, 0 paire identique, PANEL OK ; `controle-hors-16d --min=3
  --premier-ecran` HORS-16D OK ×4 ; `controle-commun --sans=mots` : couleurs, au-style, survol, blocs, contraste, fiche, trait,
  légende, parlant, brutes OK ; standard ECHEC (S3 : un rayon de 10 px dans cmz1, 14 px ×5 dans cmz2, hors échelle 2/4/8) ;
  `controle-alpha` : OK cmz1, cmz2 ; cmz3, cmz4 « Nugget sans α » (la référence ; son α à l'appui long, comme la base, D40 bis).
- Gestes joués au doigt sur les quatre pages (`gestes.mjs`) : × retire Idaho 7, ⇄ remplace Cascade à la même place, ＋ puis « nelson »
  trouve et ajoute Nelson Sauvin, 10′ change les écarts floraux (1,3 → 0,7 pour Idaho 7), appui long ouvre la fiche : GESTES OK,
  largeur 390, 0 erreur de page. Toutes les captures ouvertes (L12) ; cmz2 recadrée après un débordement à 396 px.

## Captures
`work/refonte-frontend/v4/ecran-1/fils25-comparer/captures/cmz1.png`, `cmz1-moment.png`, `cmz1-long.png`, `cmz1-nelson.png`, `cmz1-plus.png`
(idem cmz2, cmz3, cmz4). À côté de la sienne : `captures/brasseur-base-reprise.jpg` → `cmz<id>-nelson.png` (Motueka face à Nelson Sauvin,
« ★ Motueka devant Nelson Sauvin ~+0,4 » comme sur sa capture).

## Prédiction
Il dira « pas mal, là on choisit quand » devant cmz4 et cmz3 (la réponse se lit sans toucher), gardera le cadran de cmz2 comme idée
(« joli mais whirlpool tourné ») et jugera la brasserie de cmz1 sur le dessin : si la cuve se reconnaît, « très bien », sinon « c'est quoi ces icônes ».

DÉCISION À PRENDRE : aucune hors contrat ; à noter, les feuilles du dock (Défi, Égaler, Valeurs, Preuve, Frise, Souche) sont présentes mais non
jouées dans ces mini maquettes (un toucher l'écrit), et le Défi n'affiche plus de score (il aurait été inventé).

CONNAISSANCE : le moteur de la maquette ne simule l'arôme qu'à 60′, 10′, whirlpool et dry hop (actif, après) ; 30′ et 0′ rendent 0 = non simulé,
à écrire « ? », jamais 0 (`controle-quand-comparer` reconnaît un dry hop par `data-moment` contenant « dryhop », pas « actif »/« apres »).
`npx vite-node` refuse un script hors du dépôt : un lecteur du moteur se met dans le dossier possédé, pas dans os.tmpdir().

LEÇON PROPOSÉE : aucune
