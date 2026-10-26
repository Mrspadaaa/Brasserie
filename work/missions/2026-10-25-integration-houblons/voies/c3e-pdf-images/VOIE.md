# Voie c3e-pdf-images — les fiches en image ou en PDF non lues (#180)

Agent : auteur (Sonnet). **Lis d'abord `voies/c3-COMMUN.md`** : les règles de collecte, de sortie et les critères communs.

## Pourquoi
Deux sources publiques n'ont pas été lues, sans aucun blocage, faute d'outil :
1. **NZ Hops** (voie c3c) : 20 fiches, mais les fiches PDF sont des images, illisibles par le lecteur de texte. Elles sont déjà
   dans le cache, en base64 avec un reçu `encoding: base64` (voir `voies/c3c-amerique-oceanie/RESULTAT.md` et `couverture.md`). Ce
   sont les houblons d'origine de Nelson Sauvin, Motueka, Riwaka, Nectaron… : ses houblons phares.
2. **IHPS Žalec** (voie c3b) : la « Opisna sortna lista za hmelj 2021 », un PDF sur gov.si. L'hôte n'a pas été sondé, ni son
   `robots.txt` lu.

## À faire
1. **NZ Hops.** Décode chaque PDF du cache dans `os.tmpdir()`, puis lis ses pages avec l'outil Read : il lit les PDF et les images
   (paramètre `pages`).
   - Transcris toutes les valeurs, selon les règles de c3-COMMUN § 3 : α, β, cohumulone, huile totale, chaque composé de l'huile
     (linalol, géraniol, farnésène, β-pinène, sélinène…), thiols, descripteurs, usage…
   - Relis chaque transcription une seconde fois, page en regard, et note `transcrit: "lecture visuelle"` dans chaque valeur.
   - Ajoute ces valeurs à `src/data/hopSources/nzhops.json`, en gardant ses fiches HTML, et son script (`scripts/collecte-hop/nzhops.mjs`)
     relit les transcriptions, mises dans un fichier versionné de cette voie.
2. **IHPS.** Lis le `robots.txt` de gov.si, puis télécharge le PDF par le cache s'il est permis.
   - Lis-le avec Read si c'est du texte ou des images.
   - Sortie : `src/data/hopSources/ihps.json`, un script, un test.
3. Rejoue la fusion sans écrire (`node scripts/collecte-hop/fusion.mjs --sans-ecriture`) et dis ce que ces sources ajoutent, pour
   le linalol, le géraniol et le farnésène, sur Nelson Sauvin, Motueka et Riwaka. Ne modifie ni `fusion.mjs` ni `complements.json` :
   le pilote les régénérera.

## Critères
Ceux de c3-COMMUN, plus : chaque valeur lue visuellement porte sa page et la mention de lecture visuelle. Une case illisible est
`null`, jamais devinée.

## Possède
- `scripts/collecte-hop/nzhops.mjs`, `scripts/collecte-hop/ihps.mjs`.
- `src/data/hopSources/nzhops.json`, `src/data/hopSources/ihps.json`.
- `tests/unit/hopIndexV4/collecteNzhops.test.ts`, `tests/unit/hopIndexV4/collecteIhps.test.ts`.
- `work/missions/2026-10-25-integration-houblons/voies/c3e-pdf-images/`.
- Le cache, en ajout seulement.

N'écris aucun code par heredoc ni par `node -e` : Write ou Edit seulement.

Écris RESULTAT.md tôt. Retour en une ligne.
