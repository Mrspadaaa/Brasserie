# Archive du dossier work/ (nettoyage du 23.11.2026)

Le brasseur a accordé le nettoyage du dépôt (« Oui on doit faire du cleaning »). 17 228 fichiers de `work/` (environ 1 232 Mo) ont quitté Git : captures, essais, maquettes écartées et reçus de voies terminées, que ni un script, ni le code, ni ses choix (`v4/choix/`, SPEC, DEFAUTS) ne lisent plus.

## Où les retrouver

- Sauvegarde complète : `C:\Users\mrspa\Documents\Brasserie-sauvegarde-2026-11-23\` (bundle Git de tout l'historique, faite avant la compression de l'historique).
- Dans l'historique, tant qu'il existe : `git show dd2ef49e0:<chemin>` (dernier commit avant le nettoyage). Les chemins retirés sont dans le commit « work/ : archive ».
- Pour restaurer un dossier : `git clone <bundle> tmp`, puis copier `tmp/work/<dossier>`.

## Gardé

Tout ce que lit un script pendant son exécution (par exemple `scripts/collecte-hop/` lit les transcriptions de `2026-10-25-integration-houblons/voies/c3e-pdf-images/`), tout ce que citent le code et les tests gardés, `v4/choix/`, SPEC-BRASSEUR, DEFAUTS-RECURRENTS, `decisions.md`, `BUGS.md`, `outils-mise-en-ligne/`, et toutes les missions du 2026-11-20 et suivantes.

## Cas particuliers

- `2026-10-31-ecran-depense/avant-deploiement/` (137 Mo) : verdicts de déploiements passés. `scripts/agents/controle-avant-deploiement.mjs` ne lit que le dossier du `<sha>` à déployer ; les anciens ne servent plus. Le dossier se recrée à chaque verdict.
- `2026-10-31-ecran-fermentescibles/` (59 Mo) : seul un commentaire de `src/ui/fermentescibles/modele.ts` le citait ; corrigé.
- `2026-10-25-integration-houblons/voies/` (80 Mo) : sorties de bancs ; seuls les fichiers lus par `scripts/collecte-hop/` et `scripts/eval-hop/` sont restés.

## Ce qui est parti, par dossier

| Dossier | Mo | Fichiers |
|---|---:|---:|
| work/missions/2026-11-16-calendrier | 258.2 | 1921 |
| work/missions/2026-10-31-ecran-depense | 244.5 | 3247 |
| work/missions/2026-11-09-levure-port | 120.0 | 983 |
| work/missions/2026-11-14-finances | 97.7 | 1244 |
| work/missions/2026-11-19-bugs-ecrans | 88.0 | 1521 |
| work/missions/2026-10-25-integration-houblons | 80.8 | 1543 |
| work/missions/2026-11-17-carnet-retouches | 61.5 | 437 |
| work/missions/2026-10-31-ecran-fermentescibles | 58.9 | 715 |
| work/missions/2026-11-14-compagnon | 55.0 | 398 |
| work/missions/2026-11-19-ma-levure-maquettes | 40.2 | 401 |
| work/refonte-frontend | 24.7 | 1262 |
| work/missions/2026-10-31-ecran-identite | 19.9 | 484 |
| work/missions/2026-11-16-liens-app | 19.4 | 165 |
| work/missions/2026-11-18-choix-calendrier | 16.1 | 181 |
| work/missions/2026-11-01-renovation | 9.7 | 215 |
| work/missions/2026-11-16-carnet-decision | 7.9 | 114 |
| work/missions/2026-11-16-choix-ouverts | 6.9 | 90 |
| work/missions/2026-11-19-carnet-tour3 | 3.6 | 326 |
| work/missions/2026-11-10-brassin-mesures | 2.5 | 37 |
| work/missions/2026-11-14-brassins | 2.3 | 636 |
| work/missions/2026-11-09-ecran-levure | 2.2 | 81 |
| work/missions/2026-11-01-bascule-lecture | 2.2 | 64 |
| work/missions/2026-11-17-port-calendrier | 1.7 | 162 |
| work/missions/2026-11-09-compta-prix | 1.6 | 290 |
| work/missions/2026-11-10-lenteur | 1.2 | 34 |
| work/missions/2026-11-14-futs | 0.9 | 21 |
| work/missions/2026-11-10-onglet-finances | 0.8 | 29 |
| work/missions/2026-11-14-ecrans-transversaux | 0.5 | 109 |
| work/missions/2026-11-14-materiel | 0.4 | 116 |
| work/recipe-open-performance | 0.4 | 31 |
| work/missions/2026-11-09-depense-totaux | 0.4 | 37 |
| work/missions/2026-11-08-banc-tous-ecrans | 0.3 | 62 |
| work/missions/2026-11-10-parcours-complet | 0.3 | 33 |
| work/missions/2026-11-03-lecture-longue | 0.2 | 23 |
| work/missions/2026-11-08-defauts | 0.2 | 10 |
| work/missions/2026-11-15-embeddings | 0.1 | 6 |
| work/missions/2026-11-07-test-en-ligne | 0.1 | 28 |
| work/missions/2026-11-16-nuit-recette | 0.1 | 21 |
| work/missions/2026-11-19-ma-levure | 0.1 | 9 |
| work/missions/2026-11-09-levure-retours | 0.1 | 15 |
| work/missions/2026-11-19-tour3-correctifs | 0.1 | 22 |
| work/missions/2026-10-23-controles-parcours | 0.1 | 9 |
| work/missions/2026-11-07-banc-actionneurs | 0.1 | 8 |
| work/missions/2026-10-22-systeme-agents | 0.1 | 6 |
| work/missions/2026-11-16-vues-calendrier | 0.1 | 4 |

(et 21 autres dossiers ou fichiers plus petits.)
