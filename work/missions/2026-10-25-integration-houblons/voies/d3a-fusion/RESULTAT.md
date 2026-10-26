OK — 18 sources fusionnées en complements.json (251 variétés, 57 ko gzip, chunk à part), chargeur, 11 tests, B5 148,3 ko tenu

## Décision de l'utilisateur sur la diffusion (26.10), appliquée
« accord écrit pour la reproduction/affichage public — C'est pas plublic donc pas de problème ». La convention 5 de VOIE.md a changé :
- `complements.json` prend toutes les sources, `restreinte` comprises (Hopsteiner, John I. Haas) ;
- chaque source garde `diffusion` et ce qui a été lu de ses conditions (page, phrase clé), les deux restreintes portent en plus `decision` ;
- `complements-restreint.json` n'est pas produit ; le test « aucune valeur restreinte » n'existe plus (remplacé : les deux restreintes sont dans la table et utilisées).
- Diffusion lue : libre = HopDatabase et hops-json (MIT, LICENSE en cache), USDA (organisme fédéral, « no restrictions » sur Cascade) ; restreinte = Hopsteiner (/en/imprint § 3), John I. Haas (conditions du site) ; inconnue = les 13 autres (BHA : la page de conditions est un texte « Lorem ipsum » ; BarthHaas, Charles Faram : conditions non consultées par les collectes ; Hopslist : « All Rights Reserved »).

## Fichiers écrits
- `scripts/collecte-hop/fusion.mjs` (hors ligne, déterministe, `--sans-ecriture` pour contrôler).
- `src/data/hopV4/complements.json` (335 086 octets, 55 697 gzip ; 251 variétés sur 318 ; 8 705 valeurs).
- `src/data/hopV4/complements-non-rattachees.json` (63 ko, **fichier en plus de VOIE.md** : 366 fiches sans variété avec leurs candidats ; jamais importé).
- `src/domain/hopIndex/v4/complements.ts` : `chargerComplements()` (import dynamique), `valeursDe(id, champ)`, `enveloppeDe(id, champ)`, `lireComplements(brut)` pour un mini jeu.
- `tests/unit/hopIndexV4/complements.test.ts` : 11 tests.
- `work/missions/2026-10-25-integration-houblons/voies/d3a-fusion/rapport.md` et ce fichier.
- Pas de GATES.md dans le dossier de la voie : critères pris dans VOIE.md.

## Critères
- `node scripts/collecte-hop/fusion.mjs` deux fois : sha256 identiques (et identiques aux fichiers écrits, vérifié par le test) :
  - complements.json `44836427…ab71c` ; complements-non-rattachees.json `69a3c2e8…ad92b55` ; rapport.md `e522b239…15d2d26`.
- `npx vitest run tests/unit/hopIndexV4` : 44 fichiers, 346 tests verts, `moteurInchange` compris (mêmes empreintes). `tsc --noEmit` : aucune erreur sur complements.
- `npm run build` : « built in 20.71s », code 0.
- B5 : `node scripts/check-hop-budget.mjs --dist dist --chunk-outils profil-simule` → **B5 148,3 ko gzip, tenu (≤ 150 ko)**. B1 920 ko et B2 773 ko sont DÉPASSÉS, mais ils l'étaient avant (rien de ma voie n'est dans leur graphe) : hors de ma voie.
- Preuve du morceau à part : rien dans l'app n'importe encore `complements.ts` (voie d3b), donc le build normal n'émet pas le chunk. Build de preuve dans `os.tmpdir()` (config temporaire + une sonde qui appelle `chargerComplements()`) : chunk `complements-*.js` 334,7 ko (57,4 ko gzip), référencé seulement par la sonde ; B5 sur ce build : 148,3 ko, identique. Le test vérifie aussi qu'aucun autre fichier de `src/` ni de `functions/src/` n'importe `complements` ou `hopSources`.
- `git diff --stat -- src/ui src/data/hopV4/proto-data.json` : vide.

## Ce que la fusion apporte (catalogue seul → catalogue + complements.json, sur 318)
- linalol 64 → 121 ; géraniol 0 → 55 ; farnésène 249 → 268 ; β-pinène 0 → 0 (le seul β-pinène, l'avis USDA de Vera, est d'une variété hors catalogue) ; sélinène 0 → 10 ; cohumulone 287 → 288 ; thiols 0 → 20 (BarthHaas seul) ; polyphénols 0 → 52 ; xanthohumol 0 → 77 ; intensité d'arôme 0 → 30 (BHA seule dans l'enveloppe ; 105 valeurs Charles Faram gardées hors enveloppe, échelle non publiée).
- Sans Hopsteiner ni Haas : linalol 116, polyphénols 32, xanthohumol 3, arômes notés 0 : ce sont eux qui apportent xanthohumol, polyphénols et les 8 notes d'arôme. Le rapport donne les colonnes pour les 37 champs.
- Aucune valeur de Hopsteiner du catalogue n'est modifiée (statu quo) ; `complements.json` porte la liste Hopsteiner avec URL en plus.

## Ce que j'ai décidé en route (réversible)
- Bases déduites par les collectes (BarthHaas, Charles Faram, BHA, `baseLue:false`) : acceptées ; un % sans aucune base reste hors enveloppe. Les `baseImplicite` des collectes c3c (Crosby, BSG, Indie, USA Hops, Yakima, HPA) sont acceptées.
- Rattachements : écartés (non rattachés, avec candidats) quand l'origine annoncée par le nom ou par Hopslist contredit le catalogue : 21 fiches (Cascade UK/NZ, Fuggle US/NZ, Golding UK/SI/BC, Willamette et Cluster AUS, Hallertau et Tettnanger de Hopslist, Chinook NZ, Bor, Bullion, Southern Promise, etc.) et « Wai » de HopDatabase (son URL est celle de Wai-iti, pas de Waimea). Acceptés après relecture : heb, ssg, sul, East Kent Golding, Hallertauer Gold, Whitbread Golding, Feux-Coeur, Extra Styrian Dana. Liste complète dans le rapport.
- Erreurs de lecture des sources corrigées ou marquées dans ma voie : BSG « 2,200 – 2,400 lbs/acre » lu 2.2–2.4 par la collecte (corrigé × 1000 d'après le brut) ; Charles Faram a des artefacts de tableur (huile « 10.3 », β « 45050 », cohumulone « 41579 », myrcène « 0.42 ») : suspects marqués, 29 composés en fraction (`s-fraction`, règle ajoutée par moi : non convertis).
- lb/acre → kg/ha (× 1,12085) ; Brewer's Friend n'a aucune valeur chimique (index d'usage) : dans la table, rien dans les valeurs.
- Suspects : 143 (huile > 6 : 78, composés en fraction : 29, somme > 100 : 13, plage inversée : 12, % > 100 : 8, α > 25 : 3). Les bornes négatives de TerraFlux (BarthHaas) sont dans une fiche non rattachée.

## Doutes et limites
- Les valeurs de Charles Faram qui restent dans les seuils (« 0.7-1.3 ») ne se distinguent pas d'une valeur corrompue : à relire avant d'afficher une huile de cette source.
- HopDatabase (949 + 93 valeurs) et hops-json (423) : gardées hors enveloppe faute d'unité écrite. HopDatabase est un agrégat de fournisseurs déjà fusionnés ici (doublon probable).
- Les 105 intensités d'arôme Charles Faram (échelle non publiée) comptent peu dans l'enveloppe : si l'échelle est sur 10 comme la BHA, l'intensité passerait de 30 à plus de 130 variétés.
- Non fusionnés (listes, textes) : descripteurs, substituts, styles, accords, roses de BarthHaas, classe « Thiol impact », maturité, résistances, origine, lignée. Ils restent dans `src/data/hopSources/` pour d3b.
- Le script lit `proto-data.json` : si le catalogue change, relancer la fusion (le test de déterminisme compare au fichier écrit).
- Aucun fichier de `src/data/hopSources/` ni de script de collecte n'a été modifié ; le cache n'est pas touché. Un essai par critère, plus quatre corrections de contenu (somme/fraction/BSG/fiches sans valeur).

DÉCISION À PRENDRE : (1) règle « unité du README » pour HopDatabase et hops-json (α, β, cohumulone en %, huile en mL/100 g) : les compter dans l'enveloppe (+ ~1 400 valeurs, doublons de fournisseurs) ou les garder hors. Recommandation : hors, ce sont des copies. (2) Échelle de l'intensité d'arôme Charles Faram : la lire sur 10 ? Recommandation : non tant que la page ne le dit pas. (3) Vérifier les conditions de BarthHaas, Charles Faram, BHA (non lues) : sans effet sur l'app depuis la décision du 26.10, utile pour la trace.

CONNAISSANCE : Charles Faram (Hop Oracle) publie des valeurs corrompues par un tableur (dates Excel 45050 / 41579, huile « 10.3 » pour 1,3, composés en fractions 0,42) ; la BHA a une page de conditions vide (« Lorem ipsum »). Après fusion, le linalol couvre 121 variétés sur 318 et le géraniol 55 ; le β-pinène reste à 0 (seule Vera, hors catalogue, le publie).
LEÇON PROPOSÉE : un `sed` ou un script Python/Node passé par un heredoc du Bash de cet environnement perd les barres inverses des regex (`\d` devenu `d`) sans erreur : réécrire avec Edit et relancer `node --check` ET un test qui exerce la regex (déjà notée par c3c, revenue ici : à mécaniser).
