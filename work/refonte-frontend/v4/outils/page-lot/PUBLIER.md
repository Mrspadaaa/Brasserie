# Page de lot : « Lot 22 houblons »

- **Adresse** : https://claude.ai/artifact/GzpfxNeKZLKXfkg4pz9kzv (artefact privé de l'utilisateur, version 2 au 22.10).
  Les anciennes pages (`2VTRQP7nLXhX5GqDaAGAyU`, `MoohEoyj…`) sont inaccessibles depuis ce compte.
- **Source** : `index.html` dans ce dossier. Le contenu (variantes, images) est écrit en HTML ; le
  script ne fait qu'agrandir une capture. Ne jamais construire le contenu par script (22.10 : une
  apostrophe a cassé le script et caché les 12 variantes).
- **Images** : publiées sous `img/…`, copiées depuis les captures des voies (non versionnées). La
  correspondance des chemins figure dans l'appel de publication (`files`) du 22.10 : `img/r6x.png` ←
  `ecran-1/fils22-comparer/captures/r6x-premier-ecran.png`, `img/carte.png` ←
  `ecran-1/fils22-carte/captures/carte-390.png`, `img/epice-*.png` ← `ecran-1/fils22-picto-epice-2/captures/`.
- **Avant de publier** : copier les images à côté de `index.html` dans un dossier de travail, puis
  `node scripts/agents/verifier-page.mjs <dossier>/index.html --captures <préfixe>` → PAGE OK, et
  ouvrir les captures (L12).
- **Publier** : depuis une autre conversation, lire d'abord l'artefact (`action: read`, `url`), puis
  publier avec `url` = l'adresse ci-dessus, pour garder le même lien. Une page à jour seulement :
  en tête, ce que le brasseur doit choisir maintenant. Le lien est écrit dans MISSION.md (M12).
