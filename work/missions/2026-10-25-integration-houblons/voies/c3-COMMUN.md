# Collecte des données houblons — règles communes des voies c3a à c3d (#180)

## Ses mots (26.10, matin), et son accord
- « Donner ton accord ou non pour collecter les fiches des fournisseurs […] Je donne mon accord pour les deux. »
- « Il faut récupérer un maximum de données. Toutes données sera bonne à prendre. Il faudra trié ensuite. Pour le moment
  récupère TOUT »

La voie **collecte tout**. Elle ne trie pas, ne fusionne rien dans le catalogue de l'app et ne touche pas au moteur. Le tri et la
fusion viendront dans une étape suivante, sur ce qu'elle aura rapporté.

## Ce qui existe déjà
- `src/data/hopV4/proto-data.json` : 318 variétés, avec ids, noms, alias, `url` Beer Maverick, `hopsteinerId` et `hs` (fiche
  Hopsteiner reliée), et les données Beer Maverick complètes depuis le 26.10 (D75).
- Le cache des pages publiques, en lecture et en ajout : `C:/Users/mrspa/Documents/Brasserie/.codex-remote-attachments/hop-index/public-sources/`.
  - On y lit déjà 319 pages Beer Maverick et deux pages BarthHaas.
  - Chaque fichier est nommé par le sha256 de son URL, avec un `.json` voisin : l'URL, la date de relevé et le sha256 du contenu.
- `scripts/hop-source-cache.mjs` : `readHopSource(url, { cache })`, la variable `HOP_SOURCE_CACHE` et le mode `--offline`.
  Réemploie-le : tout ce qui est téléchargé passe par lui et entre dans ce cache.
- La recherche du 19.10 sur les sources (`work/refonte-frontend/v4/sources-houblons/SOURCES.md`) dit ce qui était ouvert, ce
  qui rendait 403 ou 404, et ce que chaque source publie. Lis la section de tes fournisseurs avant de commencer.

## Règles de collecte
1. **Brut d'abord.** Chaque page, PDF ou fichier téléchargé entre dans le cache avec son reçu. On ne retélécharge jamais ce qui
   y est déjà.
2. **Poliment et dans les règles.**
   - Lis le `robots.txt` de chaque hôte avant tout et respecte ses `Disallow`.
   - Au plus 1 requête par seconde et par hôte, 2 en parallèle au plus.
   - L'agent utilisateur est celui du script existant ; seules les pages publiques sont lues, jamais de connexion.
   - Un 401, un 403, un 429, ou une page de défi anti-robot : arrête cet hôte, écris-le dans le rapport, ne contourne jamais.
     Pas d'en-têtes de navigateur imités, pas de proxy, pas de navigateur piloté pour passer une protection.
3. **Tout ce qui est publié, tel quel.** Pour chaque variété, prends :
   - chaque valeur numérique : α, β, cohumulone, colupulone, huile totale, et chaque composé de l'huile (myrcène, humulène,
     caryophyllène, farnésène, linalol, géraniol, β-pinène, sélinène, citronellol, nérol, et tout autre nommé) ;
   - les polyphénols, xanthohumol, thiols (4MMP, 3MH, 3SH…), indice de conservation, rendement, maturité, et tout autre champ ;
   - les listes : descripteurs d'arôme (mots courts), styles, substituts, accords, usage, origine, lignée, propriétaire ou marque,
     forme commerciale, années de récolte.

   Pour chaque valeur, garde :
   - le nom du champ tel qu'écrit ;
   - le texte brut ;
   - la plage ou la valeur lue, avec son unité et sa base (% des α, % de l'huile, mL/100 g, mg/kg, µg/kg) ;
   - l'URL ;
   - la date ou l'année publiée, si elle y est, et la date de relevé.

   Un « Unknown », un « - », un « 0-0 » ou une case vide : `null`, jamais 0.
4. **Pas de prose dans `src/`.** Les paragraphes de texte (histoire, description longue) restent dans le cache, hors du dépôt
   suivi. Dans `src/`, seulement des valeurs, des noms, des listes et des mots courts.
5. **Rattacher sans forcer.**
   - Pour chaque fiche, `varietyId` est l'id du catalogue quand le nom, un alias ou le code international se résout sans
     ambiguïté ; sinon `null`, avec le nom.
   - Une variété absente du catalogue est gardée : c'est une donnée de plus.
   - Écris les correspondances incertaines dans le rapport.
6. **Sortie.**
   - Le fichier `src/data/hopSources/<source>.json` porte :
     - `{ source: { nom, hote, type, licence ou conditions lues, releve } }` ;
     - `fiches: [{ nom, alias, varietyId, url, releve, publie, champs: { <champ>: { brut, valeur, min, max, unite, base } }, listes: { … } }]`.
   - Le fichier n'est importé par aucun code de l'app dans cette étape.
   - S'il dépasse 2 Mo, découpe-le par lettre.
7. **Script.** `scripts/collecte-hop/<source>.mjs` relance tout depuis le cache avec `--offline`, et rend le même JSON (sha256 égal).
   Un test unitaire du lecteur sur un petit HTML synthétique, qui imite la structure sans copier la page :
   `tests/unit/hopIndexV4/collecte<Source>.test.ts`.
8. **Rapport.** `voies/<id>/couverture.md` donne :
   - les hôtes tentés et leur réponse (200, 403, robots) ;
   - les pages lues ;
   - les variétés trouvées, rattachées et nouvelles ;
   - un tableau champ par champ (nombre de variétés), en mettant en avant le linalol, le géraniol, le farnésène, le β-pinène et
     le sélinène ;
   - les doutes.

## Critères de chaque voie
- La commande `node scripts/collecte-hop/<source>.mjs --offline` rend deux fois le même JSON (sha256 égal).
- `npx vitest run tests/unit/hopIndexV4` vert ; `npm run build` vert.
- `git diff --stat -- src/domain src/ui src/data/hopV4` est vide : rien n'est fusionné.

## Possède (chaque voie)
`scripts/collecte-hop/<ses sources>.mjs`, `src/data/hopSources/<ses sources>.json`, `tests/unit/hopIndexV4/collecte<Source>.test.ts`,
`work/missions/2026-10-25-integration-houblons/voies/<id>/`, et le cache, en ajout seulement.

`scripts/hop-source-cache.mjs` est partagé : n'y change rien. Si un changement y est nécessaire, écris-le dans RESULTAT.md. Pas de
`git mv`. Fichiers de travail dans `os.tmpdir()`.

Retour en une ligne ; RESULTAT.md avec la couverture, les hôtes bloqués et ce qui reste.
