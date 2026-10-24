# Voie r2-cout-calcul — chronométrer le moteur de simulation

- Mission : 2026-10-22-reprise-lot21
- Agent : executant
- Modèle : haiku
- Niveau : mécanique
- Plafond : 40 tours ; 3 essais par critère
- Dépend de : —
- Décideur en cas de doute : pilote

## Objectif
Mesurer le temps de `simulerCas` (prototypes/houblons-v4), en mode **léger** (`complet: false`) et
**complet** (`complet: true`), sur le cas stout et sur tout le catalogue, sans rien écrire dans le
moteur. Livrer la note du cerveau `cerveau/metier/cout-calcul-moteur.md` et une annexe avec le
script et les sorties brutes.

## Entrées
- `prototypes/houblons-v4/src/engine/profil-simule.ts` — `simulerCas(e: CasEntree)`, ligne 477 environ ; `complet` à la ligne 471.
- `prototypes/houblons-v4/scripts/profil-simule-cas.ts` — exemple d'appel complet : imports, `s1Recipe()`, `S1_TASTING`, `aj(…)`, levures. Le lancer se fait avec `node_modules/.bin/vite-node` depuis `prototypes/houblons-v4`.
- `prototypes/houblons-v4/src/pack/buildPack.ts` — `s1Recipe()` et `S1_TASTING` : **le cas stout** est la stout 16D S1 du lot 20 (Nugget 46 g à 60′, 20 L).
- `prototypes/houblons-v4/src/engine/index.ts` — exports (`CATALOGUE`, `STOCK`, `MOMENTS_SIMULES`, `simulerCas`…).
- `work/refonte-frontend/v4/ecran-1/fils21-choisir/donnees/PROFIL-SIMULE.md` — ce que calcule la grille (cas × moments × levures).
- `work/refonte-frontend/v4/ecran-1/fils21-choisir/donnees/profils-simules.json` — la grille actuelle (sa taille en octets compte dans la note).

## Possède (seuls chemins où écrire, avec RESULTAT.md)
- `cerveau/metier/cout-calcul-moteur.md`
- `work/missions/2026-10-22-reprise-lot21/voies/r2-cout-calcul/ANNEXE.md`
- `work/missions/2026-10-22-reprise-lot21/voies/r2-cout-calcul/bench.ts` (script de mesure ; il importe le moteur par chemin relatif)
- `work/missions/2026-10-22-reprise-lot21/voies/r2-cout-calcul/RESULTAT.md`

Rien dans `prototypes/` : ni script, ni donnée, ni cache. Le critère G4 le vérifie.

## Consignes
- **Mesures à faire** (avec `performance.now()`, après 5 appels de chauffe ; 30 répétitions au
  moins ; médiane, p95 et maximum, en millisecondes) :
  1. cas stout, un ajout (Citra 4 g/L, dry hop après fermentation, US-05), léger puis complet ;
  2. cas stout, deux ajouts (Citra puis Galaxy 2 g/L chacun, dry hop après fermentation), léger
     puis complet ;
  3. **tout le catalogue** : pour chaque houblon de `CATALOGUE`, un ajout de 4 g/L dans chaque
     moment de `MOMENTS_SIMULES`, levure US-05, d'abord en léger puis en complet. Donner le nombre
     de cas, le temps total, la médiane par cas, et les 5 houblons les plus lents ;
  4. le même balayage multiplié par 4 levures (US-05, Verdant, Pomona, Diamond), en léger : c'est
     le coût d'une grille complète.
- **Conditions** à noter : Node (`node --version`), processeur (`wmic cpu get name` ou
  `node -e "console.log(require('os').cpus()[0].model)"`), mémoire, nombre de répétitions, date.
- **Conclusion**, en faits seulement :
  - temps par cas ;
  - temps pour une variante d'écran (un houblon × 5 moments × 4 levures) ;
  - temps pour tout le catalogue ;
  - taille de profils-simules.json ;
  - et si le calcul tient dans le navigateur d'un téléphone. Hypothèse prudente : un téléphone est
    4 à 6 fois plus lent que ce PC. Écris-la comme hypothèse, et nomme ce qui reste à mesurer sur
    un vrai téléphone.

  Ne tranche pas le repli « dry hop et biotransformation seulement si trop lourd » : le pilote le
  fera avec ta note (leçon L20).
- **Note du cerveau** : format de `cerveau/INDEX.md`. En-tête : `name: cout-calcul-moteur`,
  `description`, `type: metier`, `maj: 2026-10-22`, `sources` (les fichiers lus et l'annexe). Le corps
  fait 50 lignes au plus, avec les parties `**Mesures**`, `**Conditions**` et `**Conclusion**`.
  Mets les tableaux complets dans ANNEXE.md. L'annexe contient aussi le script `bench.ts` recopié,
  dans un bloc de code, et la sortie brute.
- N'ajoute pas la note à INDEX.md : c'est le pilote qui l'ajoute.

## Exigences transversales et acquis
Honnêteté des données : chaque nombre vient d'une mesure de l'annexe. Une hypothèse est écrite
comme hypothèse. Inconnu ≠ 0.

## Critères
Dans `GATES.md`, même dossier. Ne pas le modifier. Lancer chaque `CHECK:` depuis la racine du dépôt.

## Rendre
`RESULTAT.md` au format de l'agent. Réponse finale au pilote : une ligne.
