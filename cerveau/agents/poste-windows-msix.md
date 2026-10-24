---
name: poste-windows-msix
description: Pièges du PC Windows avec Claude Desktop (MSIX, WMI, tâches planifiées, barres obliques inverses dans Bash, accents graves).
type: agents
maj: 2026-10-24
sources: mémoire locale poste-claude-desktop-msix.md ; veille/relance-releve.ps1 ; veille/lancer-veille.ps1 ; veille-orchestrateur.ps1 (tous absents de ce worktree)
---

Constats du 12.10 au 16.10, sur le PC de l'utilisateur, en supervisant l'orchestrateur L'Affinée :
- **Claude Desktop est un paquet MSIX.** Ce qu'un processus de l'app écrit dans `%APPDATA%` part dans `…\AppData\Local\Packages\Claude_pzs8sxrjxfjjc\LocalCache\Roaming\`. Un outil connecté depuis une session Desktop n'est donc pas vu par les processus lancés hors de l'app. C'était le cas de `gh`, dont `hosts.yml` et `config.yml` ne contiennent aucun jeton : celui-ci est dans le trousseau Windows, visible de tous. Correctif : copier la configuration vers le vrai `%APPDATA%`, **depuis un processus hors de l'app**, par exemple une tâche planifiée.
- **Lancer hors de l'app** (pour que le processus ne soit ni tué avec l'app ni coupé par sa purge mémoire) : tâche planifiée ponctuelle, LogonType Interactive, ExecutionTimeLimit 0, supprimée en fin d'exécution. Ses enfants survivent à la fin de la tâche. WMI (`Win32_Process Create`) fonctionne aussi. Scripts prêts : `veille/relance-releve.ps1` et `veille/lancer-veille.ps1`.
- **L'outil Bash réduit les doubles barres obliques inverses** dans les heredocs et les scripts inline. Le 12.10, cela a cassé un chemin Windows et une regex de `veille-orchestrateur.ps1` sans erreur visible, et la récupération des leases mortes n'a jamais fonctionné. Pour tout fichier contenant `\`, passer par les outils Write ou Edit.
- **Accents graves dans une chaîne entre guillemets doubles de Bash** : ils sont exécutés comme commande. Le 18.10, un `node -e "…`chemin.md`…"` a lancé deux fichiers Markdown comme scripts (arrêtés sur une erreur de syntaxe, sans dégât) et vidé le texte inséré. Pour tout texte avec accents graves (Markdown, corps d'issue), écrire un fichier avec Write, puis `gh … --body-file`.
- **Edit et Write décodent des échappements** du texte écrit (22.10) : un « barre oblique inverse, u, 2014 » devient un tiret long, et un « barre oblique inverse, b » dans une regex est devenu un caractère 0x08 (D98, table morte). Pour un échappement voulu en clair (CHECK d'un GATES, regex d'un contrôle), le construire par script avec `String.fromCharCode(92)`, puis vérifier : `systeme.mjs cablage` refuse les caractères de contrôle.
- **Compteur de mots** (`mots-premier-ecran.mjs`) : « : », « ? » et « · » isolés comptent comme des mots (trois variantes du lot 22 l'ont appris trop tard) ; il compte aussi tout texte dont le haut est sous 844 px (même sous un dock fixe), et `{a}/{b}` en JSX fait deux mots (r5, 24.10). **Capture d'une page faite d'iframes** : fenêtre aussi haute que la page, sinon Chrome ne peint pas les iframes hors champ (cases vides, r1 du 22.10).
- **Pas de Python sur le poste** : une retouche en série s'écrit en Node, par `split/join` ou par indices (22.10, r7g ; et `String.replace` interprète `$` dans la chaîne de remplacement, L26). Copier un générateur non suivi par git avant de le retoucher par script.
- **gate-check coupe un critère à 120 s** : `controle-commun` sur huit pages le dépasse (22.10, séries r7). Découper le critère (quatre pages au plus).
- `veille-orchestrateur.ps1` doit rester **ASCII** et a des fins de ligne CRLF : PowerShell 5.1 le lit en ANSI.

Voir [[agents-sans-openai]].
