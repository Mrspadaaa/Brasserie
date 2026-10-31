# Mission 2026-10-31-systeme-ecrans — outiller la refonte écran par écran

## Objectif
Préparer le programme « refaire tous les écrans de l'app un à un comme houblons ». On reprend ce que le rapport des méthodes
(`work/missions/2026-10-31-methodes/RAPPORT.md`) retient, sans remplacer notre système.

## Ses mots (31.10)
- « Une fois terminé avec houblons on va refaire tout les écrans de l'app un à un comme houblons ».
- Sur les questions bloquantes de superpowers, mattpocock et addyosmani : « Alors ça non ou à adapter avec un jury ». Puis : « Le reste ok,
  on peut aussi faire des tests ! »
- « Pour le lint de DESIGN.md […] Oui ok met tout en place ».

## Règles de toute la mission
- Aucune question bloquante au brasseur. Une question devient une réponse du jury, ou une variante qu'on lui montre (L24).
- Le registre `work/refonte-frontend/v4/choix/ecrans.json` ne reçoit que ses choix (règle n° 1, D123). L'inventaire des écrans vit à part.
- Rien n'est installé dans le `node_modules` partagé. Un outil tiers a sa version épinglée, dans son propre dossier.
- Les serveurs Chrome de cette mission tournent dans `C:/Users/mrspa/AppData/Local/Temp/atelier-ecrans`, une copie au commit de production
  ae7c7a8d. Les voies houblons (k1, t3, h1, k2) tournent dans l'arbre principal.

## Voies
| Voie | Agent | Livrable | Étape |
|---|---|---|---|
| e1-baselines | auteur (Sonnet) | captures de référence des écrans validés, comparées dans Chrome | outil |
| e2-inventaire | auteur (Sonnet) | inventaire de tous les écrans de l'app, avec leurs états | inventaire |
| e3-glossaire | executant (Haiku), puis le pilote | candidats du glossaire tirés de SPEC ; la note est écrite par le pilote | savoir |
| e4-jury | general-purpose (Opus) | le skill « jury » : les questions des méthodes posées à un jury, puis un essai réel | méthode |
| e5-lint-design | auteur (Sonnet) | le lint de DESIGN.md, avec `@google/design.md` 0.4.0 épinglé | outil |

Ensuite, après e4 : e6, le test de nos skills à la manière de `skill-creator` (déclenchement, avec ou sans skill).

## Pages
| Sujet | Version | Adresse | Source |
|---|---|---|---|

## Reprise
- 31.10 : la mission est ouverte. Cinq voies.
