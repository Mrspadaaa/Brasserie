# Provenance de webapp-testing

Skill d'origine : `webapp-testing`, dépôt officiel `anthropics/skills`, branche `main`, téléchargé le **2026-10-25**.
Licence : Apache 2.0 (« Copyright 2026 Anthropic, PBC. »), `LICENSE.txt` conservé tel quel dans ce dossier.
Demandé par l'utilisateur le 2026-10-25 (« Fait un test avec ce skill et adapte »).

Fichiers téléchargés (tous lus en entier avant usage ; aucun script n'a été exécuté tel quel) :

| Fichier d'origine | URL |
|---|---|
| `SKILL.md` | https://raw.githubusercontent.com/anthropics/skills/main/skills/webapp-testing/SKILL.md |
| `LICENSE.txt` | https://raw.githubusercontent.com/anthropics/skills/main/skills/webapp-testing/LICENSE.txt |
| `scripts/with_server.py` | https://raw.githubusercontent.com/anthropics/skills/main/skills/webapp-testing/scripts/with_server.py |
| `examples/element_discovery.py` | https://raw.githubusercontent.com/anthropics/skills/main/skills/webapp-testing/examples/element_discovery.py |
| `examples/static_html_automation.py` | https://raw.githubusercontent.com/anthropics/skills/main/skills/webapp-testing/examples/static_html_automation.py |
| `examples/console_logging.py` | https://raw.githubusercontent.com/anthropics/skills/main/skills/webapp-testing/examples/console_logging.py |

Les sources Python ne sont pas gardées ici (Python n'est pas installé sur ce poste) ; leurs URL suffisent à les relire.

## Ce qui a été adapté (modifié par rapport à l'original)

- `SKILL.md` : réécrit pour ce dépôt, en français. Gardés : arbre de décision statique / dynamique, reconnaissance avant action,
  attendre le réseau calme, sélecteurs par texte, rôle ou data-*, scripts en boîte noire (`--help` d'abord). Playwright Python remplacé par puppeteer-core.
- `scripts/with_server.py` → `scripts/with_server.mjs` (à la racine du dépôt) : même rôle et mêmes options (`--server`, `--port`, `--`),
  plus `--env`, `--timeout`, `--reuse`, `--no-http`, arrêt de l'arbre de processus sous Windows, refus d'un port occupé, journaux dans `os.tmpdir()`.
- `examples/*.py` → `examples/*.mjs` : `element_discovery` et `console_logging` deviennent `reconnaissance.mjs` et `journal-console.mjs` ;
  `static_html_automation` devient `html-statique.mjs` ; `_lanceur.mjs` factorise Chrome, journaux et coupure du réseau externe (ajout).
