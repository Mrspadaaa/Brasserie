# Fil de fer gris — écran 1 (brief auteur, une page)

Tu dessines un **fil de fer basse fidélité** d'un écran mobile de L'Affinée (app de
micro-brasserie). Pas de visuel final : des gris, une seule couleur d'accent, une police
système. On juge la **structure** et la **hiérarchie**, pas la décoration. Écris en
français. Répertoire : C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie
(chemins absolus). Texte avec barres obliques inverses ou accents graves : outil Write,
jamais Bash. Fichiers de travail dans un sous-dossier à toi du scratchpad.

## Lis (et rien d'autre)

1. `work/refonte-frontend/v4/ecran-1/CADRAGE.md` : la question de l'écran, les récits.
2. `work/refonte-frontend/v4/ecran-1/PRIORITE.md` : **le contenu exact du plan 1, à ne
   pas changer**, ce qui va aux plans 2 et 3, les phrases canoniques.
3. `work/refonte-frontend/v4/reference/brasseur-2026-10-18/README.md`, puis avec Read les
   images `clyhealth-3.png`, `solaire-ia-1.png`, `stardog-2.png` : les apps que le brasseur
   trouve modernes. Prends-leur des motifs (carte-réponse en tête, rangée à mot d'état,
   barre de plage avec pastille, puces de suggestion), pas leurs couleurs.
4. Si besoin d'un chiffre : `prototypes/houblons-v4/data/pack-mini-protos.json`
   (`styles.16D`, `scenarios.S1.before`, `S1.direction`, les 3 premières `S1.voies`) ;
   extrais avec node, le fichier est gros.

## Livrable, pour chaque numéro que ton message te donne

`work/refonte-frontend/v4/ecran-1/fils/pNN/` :

- `index.html` : **état A** (à l'ouverture) ; `etat-b.html` : **état B** (après « + floral,
  − résineux », voies affichées). Pages autonomes, CSS en ligne (le script Tailwind Play
  CDN est permis), aucune image externe.
- `NOTE.md` : 3 lignes : le parti, ce qui est au plan 1, ce qui est replié.

## Règles du fil de fer

- Largeur 390 px. **Tout le plan 1 dans le premier écran (844 px de haut), et rien
  d'autre** : ni paragraphe, ni légende, ni note du moteur, ni source.
- **60 mots visibles au plus** au premier écran, dans chaque état.
- Gris de #111 à #f5f5f5 ; **un seul accent** pour l'action principale et pour les
  exceptions (« trop », « peu »). Police système. Trois tailles de texte au plus.
- La piste au style : bande nette (gris moyen), plage de la bière floue (dégradé), rien
  d'autre ; marque d'accent seulement si la famille sort de la bande.
- Les déclencheurs des plans 2 et 3 existent (chevron, « › », rangée touchable) ; leur
  contenu n'a pas besoin d'être construit.
- Cibles d'au moins 24 px de haut. Pas de texte anglais, pas de « (s) », virgule décimale.

## Contrôles, une fois chacun

1. `node work/refonte-frontend/v4/tournoi/outils/capture.mjs work/refonte-frontend/v4/ecran-1/fils pNN [pMM]`
   puis regarde `fils/captures/pNN-390.png`, `pNN-b-390.png` et `pNN-oeil.png` (premier
   écran réduit : ce qui s'y lit encore est ta hiérarchie).
2. `node work/refonte-frontend/v4/tournoi/outils/mots-premier-ecran.mjs work/refonte-frontend/v4/ecran-1/fils pNN [pMM] --max=60`
   et la même commande avec `--page=etat-b.html` : les deux doivent imprimer `MOTS OK`.

Corrige, recapture une fois, arrête-toi. Réponse finale : une ligne par fil de fer (parti,
mots en A et en B).
