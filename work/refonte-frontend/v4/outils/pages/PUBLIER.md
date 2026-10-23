# Pages montrées au brasseur : une version, un artefact

Le 23.10, l'utilisateur : « Problème avec les artefacts, c'est assez dur à lire et chaque version devrait en créé des
nouveaux ». La page « Lot 22 houblons » (`../page-lot/`, https://claude.ai/artifact/GzpfxNeKZLKXfkg4pz9kzv) était
republiée à la même adresse à chaque lot. Elle cumulait quatre sujets, l'historique et ~100 captures de 277 px, où le
texte de l'écran tombait à 7 px. Elle reste en l'état, comme archive de ses versions 1 à 9.

## La règle
- **Une page par sujet et par version**, dans un artefact neuf : « Dryhopper · passe 3 · 23.10 ». Elle ne montre que
  cette version, et renvoie par un lien à la page de la version d'avant.
- On ne republie une adresse que pour compléter ou corriger la même version (une image manquante, le classement
  ajouté au panel v0).
- La même règle vaut pour la page de la base jouable (« Houblons, base v4.x ») : une nouvelle base, un nouvel artefact.

## Lisible (contrôlé par `scripts/agents/verifier-page.mjs`)
- La date dans le `<title>` : la galerie de claude.ai range les pages par date, et le titre les distingue.
- `#a-choisir` en tête, dans le premier écran du téléphone : ce qu'il choisit, en une ou deux phrases.
- Captures à 340 px rendus au moins, à 390 et à 1280 px de large : trois colonnes au plus sur ordinateur, une au
  téléphone. À 277 px, le texte de l'écran capturé est illisible.
- Aucun texte sous 14 px ; aucun paragraphe, puce ou légende de plus de 45 mots.
- Des noms en mots du brasseur (« La réponse d'abord ») ; l'identifiant (`r6p2`) en petit à côté.

## Faire
1. Source : `work/refonte-frontend/v4/outils/pages/<date>-<sujet>/index.html`, écrite en HTML (jamais construite par
   un script : le 22.10, une apostrophe a cassé un script et caché les 12 variantes). Partir de la page la plus
   récente de ce dossier pour la feuille de style et la visionneuse.
2. Images à côté, dans un dossier de travail (`img/…`, non versionnées) ; puis
   `node scripts/agents/verifier-page.mjs <dossier>/index.html --captures <préfixe>` → PAGE OK, et ouvrir les trois
   captures (haut, page, ordinateur) avant de publier (L12).
3. Publier sans `url` : c'est un artefact neuf. Les images déjà publiées se copient côté serveur
   (`files: { "img/x.png": { "artifact": "<adresse>", "path": "img/x.png" } }`).
4. Ajouter sa ligne à la table « ## Pages » de MISSION.md (Sujet, Version, Adresse, Source). `systeme.mjs voies`
   refuse deux versions sur la même adresse ou la même source, et une mission d'écrans sans cette table.
5. Donner le lien à l'utilisateur.
