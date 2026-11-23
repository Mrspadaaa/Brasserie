# Voie r6e-entrees — les entrées du lot 22, vérifiées avant l'éventail

- Mission : 2026-10-22-reprise-lot21
- Agent : executant
- Modèle : haiku
- Niveau : mécanique
- Plafond : 40 tours ; 3 essais par critère
- Dépend de : —
- Décideur en cas de doute : pilote

## Objectif
Vérifier le moteur et les profils simulés (leçon L08), puis extraire dans un seul fichier de données,
au contrat ci-dessous, tout ce que les 12 variantes de Comparer liront : la stout 16D, Cascade,
Idaho 7, Galaxy, et Nelson Sauvin pour la porte « Je n'ai pas X ».

## Entrées
- `prototypes/houblons-v4/scripts/profil-simule-cas.ts` — régénère les profils simulés (lancer depuis `prototypes/houblons-v4` : `node_modules/.bin/vite-node scripts/profil-simule-cas.ts <sortie>`).
- `work/refonte-frontend/v4/ecran-1/fils21-choisir/donnees/profils-simules.json` — les profils versionnés : `ancre` (4,75 % vol.), `biere`, `style`, `echelle`, `familles`, `formatGrille`, `grille` (624 entrées : houblon × moment × dose × jours × levure, avec `apres` et `delta` par famille).
- `prototypes/houblons-v4/data/pack-fiches.json` — `fichesHoublons[]` : `key`, `name`, `alpha`, `beta`, `role`, `usage`, `huiles`, `aromes[].mots`, `motsSansFamille[].mot`, `ibuParGramme.moments[].ibuPerGram.value`.
- `prototypes/houblons-v4/data/composes-houblon.json` — `varietes[<key>]` (huile, composés, sources) ; `saturation` (le panel OSU de Cascade, échelle 0–15, H22).
- `work/refonte-frontend/v4/ecran-1/fils21-choisir/donnees/comparatifs-dryhop.json` — `etudes[]` avec `varietes` (Idaho 7 y est écrit « Idaho-7 »).
- `work/refonte-frontend/v4/tournoi/outils/controle-entrees-lot22.mjs` — le critère : lis-le, il recalcule tout ce que tu écris.

## Possède (seuls chemins où écrire, avec RESULTAT.md)
- `work/refonte-frontend/v4/ecran-1/fils22-comparer/donnees/extraire-comparer.mjs` (le script d'extraction, versionné)
- `work/refonte-frontend/v4/ecran-1/fils22-comparer/donnees/comparer-stout.json` (sa sortie)
- `work/refonte-frontend/v4/ecran-1/fils22-comparer/donnees/ENTREES.md` (le rapport pour les auteurs)
- `work/missions/2026-10-22-reprise-lot21/voies/r6e-entrees/profils-regeneres.json.tmp`
- `work/missions/2026-10-22-reprise-lot21/voies/r6e-entrees/RESULTAT.md`

Rien dans `prototypes/` (G5).

## Consignes
1. `npm run check:engine` dans `prototypes/houblons-v4` (G1).
2. Écris `extraire-comparer.mjs` (Node, sans dépendance, chemins depuis la racine du dépôt) qui produit
   `comparer-stout.json` **exactement à ce contrat** (les valeurs « telles quelles » sont recopiées
   sans transformation) :
   - `version: "comparer-stout-v1"`, `date` (AAAA-MM-JJ), `simule` (= `mention` des profils) ;
   - `sources` : `profils` (le chemin relatif du fichier de profils, normalement celui de
     fils21-choisir), `fiches`, `composes`, `panels` (chemins relatifs) ;
   - `biere`, `style`, `echelle`, `familles`, `formatGrille` : tels quels depuis les profils ;
   - `houblons[]`, dans l'ordre Cascade, Idaho 7, Galaxy, Nelson Sauvin, chacun avec :
     - `key`, `nom` ;
     - `alpha`, `beta`, `role`, `usage`, `huiles`, `aromes`, `motsSansFamille`, `ibuParGramme` : tels
       quels depuis pack-fiches ;
     - `partSansFamille` = nb de `motsSansFamille` ÷ (nb de mots de `aromes[].mots` + nb de
       `motsSansFamille`), arrondi à 2 décimales ;
     - `composes` = `varietes[key]` de composes-houblon (tel quel ; `null` si absent) ;
     - `grille` = toutes les entrées de la grille des profils dont `houblon === key`, telles quelles,
       dans leur ordre ;
     - `panels` = les études de comparatifs-dryhop dont `varietes` cite le houblon (tel quel ; `[]`
       si aucune) ;
   - `panelOSU` = `saturation` de composes-houblon, tel quel ;
   - `egalites` :
     - `doseEgale` = `{ dose_gL: 4, moment: "dryPost", jours: 3, levure: "fermentis-us05" }` ;
     - `effetEgal` = deux objets, pour `citrus` (référence Cascade 4 g/L) et `tropical` (référence
       Galaxy 4 g/L), avec `famille`, `reference: { nom, dose_gL: 4 }`, `moment: "dryPost"`,
       `jours: 3`, `levure: "fermentis-us05"`, `cible` (le `delta[famille]` de la référence à 4 g/L)
       et `doses: { <nom>: dose }` pour les quatre houblons. La dose est obtenue par interpolation
       linéaire de `delta[famille]` entre les points (0, 0), (1, d1), (2, d2), (4, d4), (8, d8) :
       premier segment qui encadre la cible, arrondi à 0,1 g/L. Si le houblon n'atteint pas la
       cible à 8 g/L : `null`, et son nom dans `horsGrille: [...]` ;
     - `ibuEgal` = deux objets, `{ moment: "b10", ibu: 10, volumeL: 20, doses }` et
       `{ moment: "wp", ibu: 5, volumeL: 20, doses }`, où dose (g/L) = ibu ÷ `ibuPerGram.value` du
       moment ÷ 20, arrondie à 2 décimales ;
   - `descripteurs` :
     - `A` = `{ regle: "gooseberry et « groseille à maquereau » rangés dans Petits fruits", mots:
       ["gooseberry", "groseille à maquereau"], famille: "berries", effets: { <nom>: { deplaces:
       [les mots sans famille du houblon qui sont dans mots], partSansFamilleA } } }` ;
     - `B` = `{ generiques: ["fruité", "fruity", "noble", "doux", "mild", "sucré", "sweet"], seuil:
       0.25, plafond: 0.33, aCorriger: "proposés par le pilote, à corriger par le brasseur", parts: {
       <nom>: { concepts, part, visible, partDessinee } } }`. Ici, `concepts` = les mots sans famille
       en minuscules, dédoublonnés, hors génériques ; `part` = nb de concepts ÷ (mots rattachés +
       nb de concepts), arrondi à 2 décimales ; `visible` = part ≥ seuil ; `partDessinee` =
       min(part, plafond).
3. Régénère les profils dans `voies/r6e-entrees/profils-regeneres.json.tmp` et lance le contrôle
   (G2). S'il signale une clé qui diffère de la régénération, n'écris rien dans fils21-choisir :
   arrête-toi et écris ECHEC avec la clé, le pilote tranchera.
4. `ENTREES.md` (pour les auteurs du lot 22, 60 lignes au plus) :
   - ce qui a été vérifié (moteur, 4,75 % vol., grille identique à la régénération) ;
   - pour chaque houblon : α retenu, rôle, huile totale, nb de composés chiffrés, part sans famille,
     études de panel disponibles ;
   - les doses d'effet égal et d'IBU égal ;
   - les parts de l'option B ;
   - ce qui manque, écrit « inconnu », jamais 0.

## Exigences transversales et acquis
Honnêteté des données : chaque valeur vient d'un fichier cité ; une valeur absente reste `null`
avec sa raison, jamais 0.

## Critères
Dans `GATES.md`, même dossier. Ne pas le modifier. Lancer chaque `CHECK:` depuis la racine du dépôt.

## Rendre
`RESULTAT.md` au format de l'agent. Réponse finale au pilote : une ligne.
