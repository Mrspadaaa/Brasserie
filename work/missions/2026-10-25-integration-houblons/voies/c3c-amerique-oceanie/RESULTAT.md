OK — 8 sources collectées (fiches, scripts --offline, tests), Yakima Chief bloquée (429), Freestyle Hops non lue (robots) ; build vert

## État de chaque source
| Source | État | Fiches | Script `--offline` (sha256 égal ×2) | Test |
|---|---|---|---|---|
| hpa (hops.com.au) | FAITE | 48 (9 pages AU, 39 fiches PDF d'import) | 0fa7fc04… | collecteHpa |
| crosbyhops | FAITE | 139 (56 variétés, 83 produits) | c5d15c30… | collecteCrosbyhops |
| indiehops | FAITE | 19 | c3061807… | collecteIndiehops |
| bsg (rahrbsg.com) | FAITE | 77 produits | 255f34c8… | collecteBsg |
| usahops | FAITE | 80 (77 Sensory Finder, Vera, Thora, Triumph) | c723d9ca… | collecteUsahops |
| nzhops | FAITE (partielle : fiches PDF en image, illisibles) | 20 | b6b80457… | collecteNzhops |
| hopsdirect | FAITE | 49 (une par lot) | 0abfc1f8… | collecteHopsdirect |
| yakimavalleyhops | FAITE | 133 | a1012f49… | collecteYakimavalleyhops |
| yakimachief.com | BLOQUÉE | 0 | — | — : `robots.txt` rend 429 + « Vercel Security Checkpoint », hôte arrêté |
| freestylehops.com | NON LUE (choix) | 0 | — | — : robots.txt interdit ClaudeBot, Claude-Web, anthropic-ai ; `ai-train=no` |

Total 565 fiches ; 144 variétés du catalogue touchées sur 318 (rattachement conservateur, voir `couverture.md`).

## Critères rejoués (fin de voie)
- `node scripts/collecte-hop/<source>.mjs --offline` deux fois, 8 sources : sha256 identique (sortie `source : N fiches, … sha256 …`).
- `npx vitest run tests/unit/hopIndexV4` : 43 fichiers, 335 tests verts.
- `npm run build` : exit 0.
- `git diff --stat -- src/domain src/ui src/data/hopV4` : vide. Aucun code de l'app n'importe `src/data/hopSources/*`.
- `couverture.md` écrit (généré par `faire-couverture.mjs`) : hôtes et réponses, variétés rattachées/nouvelles par source, champs avec linalol, géraniol, farnésène, β-pinène, sélinène en tête.
  - linalol 75 fiches, géraniol 14, farnésène 156, sélinène 12, **β-pinène 1** (seul l'avis USDA de Vera le publie).

## Fichiers écrits
- `scripts/collecte-hop/{c3c-commun,hpa,crosbyhops,indiehops,bsg,usahops,nzhops,hopsdirect,yakimavalleyhops}.mjs`
- `src/data/hopSources/{hpa,crosbyhops,indiehops,bsg,usahops,nzhops,hopsdirect,yakimavalleyhops}.json` (20 à 330 Ko chacun, sous 2 Mo)
- `tests/unit/hopIndexV4/collecte{Hpa,Crosbyhops,Indiehops,Bsg,Usahops,Nzhops,Hopsdirect,Yakimavalleyhops}.test.ts`
- dans la voie : `couverture.md`, `faire-couverture.mjs`, `journal-collecte.json`, ce fichier
- cache en ajout seulement (`…/hop-index/public-sources/`) : pages HTML, XML de plans de site, PDF (base64, reçu avec `encoding: base64`)

## Essais utilisés
Aucun critère n'a dépassé trois essais. Corrections en route : lignes `<title>` fondues au texte (3 lecteurs), regex perdues par le heredoc du Bash (réécrites avec Write/Edit), unités et bornes `>` / `<` / `(w/w)`, rattachement des noms à origine (« GR Perle » → « Perle (GR) »), substituts étalés sur plusieurs lignes (Hops Direct, Yakima Valley).

## Doutes et limites
- Hôtes : Yakima Chief 429 (défi Vercel) ; Freestyle Hops non lu par choix. Aucun 401/403 reçu ailleurs ; pas de contournement.
- `c3c-commun.mjs` est un fichier de plus dans `scripts/collecte-hop/` (outils de la voie) : à fusionner ou garder lors du tri.
- `scripts/hop-source-cache.mjs` non modifié. Il ne lit que du texte : les PDF sont écrits en base64 dans le même cache (reçu `encoding: base64`, sha256 du fichier du cache). Si le pilote veut un seul chemin, c'est un changement à faire dans ce fichier partagé.
- PDF lus avec `pdftotext` du poste (aucun paquet installé). PDF image (NZ Hops ×20, USDA Triumph) illisibles sans OCR : rien inventé.
- HPA : fiches PDF des variétés australiennes (3 Mo) non lues ; la page HTML porte les mêmes chiffres.
- Valeurs = plages de fournisseurs (analyses de récolte moyennes), pas des lots, sauf Hops Direct (α par lot et récolte). Bases d'huile non publiées → `base: null` + `baseImplicite`.
- Rattachements par variantes de nom ; le plus discutable : « NZ Cascade » → Cascade (US) ; « Saaz Us » → Saaz (US). Les ambigus restent `null`.
- Yakima Valley Hops : texte en prose, 23 fiches sans chiffre ; certains substituts absents quand la phrase est tournée autrement.
- Les paragraphes (histoire, description) restent dans le cache ; dans `src/` seulement valeurs, noms, listes, accroches ≤ 120 caractères (`profilCourt`).

DÉCISION À PRENDRE : freestylehops.com interdit nommément les agents Claude dans son robots.txt. Options : (a) ne rien lire (choix actuel) ; (b) lire avec l'agent du script (permis par `*`, contraire à l'intention du site) ; (c) demander les données au fournisseur. Recommandation : (a), puis (c). Même question pour Yakima Chief : son défi anti-robot interdit de lire ; seule une demande directe (ou le brasseur depuis son navigateur) ouvre ces fiches.
CONNAISSANCE : les fiches PDF d'import de HPA (Amarillo, Citra…) sont des fiches John I. Haas avec β, cohumulone, polyphénols, linalol, plus complètes que la page web HPA ; Crosby publie par variété ET par code produit (cohumulone et conservation seulement sur le produit) ; l'avis USDA de Vera (PDF) est la seule source de la voie avec β-pinène et géraniol chiffrés ; les fiches variété NZ Hops sont des images.
LEÇON PROPOSÉE : un fichier écrit par un heredoc du Bash de cet environnement perd la moitié des barres inverses (regex cassées sans erreur à l'écriture) ; écrire les fichiers de code avec Write ou Edit et lancer `node --check` aussitôt.
