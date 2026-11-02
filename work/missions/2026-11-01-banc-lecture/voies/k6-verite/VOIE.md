# Voie k6-verite — la vérité de sa pièce du 01.11 au soir (D261, D263)

Agents : lecteur A (Opus) et lecteur B (Sonnet), en parallèle, chacun seul. Plafond : 30 tours chacun. Pilote : Opus.

## Pourquoi
Sa commande en ligne Brau- und Rauchshop, lue dans l'app en ligne : « Ça semble pas être super juste ??? Et ça a pris vraiment beaucoup de
temps ». Puis : « non non c'est prio 1 ça » (D263). Elle entre au banc avec les 13 autres.

## La pièce (hors de Git)
| id | fichier | ce que c'est |
|---|---|---|
| doc14 | `work/finalisation-tickets-2026-10-08/H13-reels/doc14-commande-brau-ecran.jpg` | capture de téléphone de la page « Order Details » d'une commande en ligne B&R |

## À faire (chaque lecteur, seul)
Exactement les étapes 1 et 2 de `work/missions/2026-11-01-banc-lecture/voies/k3-verite/VOIE.md` (format, conventions des `notes`, valeurs
admises de `functions/src/invoiceScanCore.ts`, vérité **telle qu'imprimée**, `kind` de chaque ligne parmi `SCAN_KINDS`), avec en plus :
- le **genre de chaque ligne** (`kind`) est jugé ici : levure, malt, houblon, matériel de brassage, emballage, autre… choisis le `kind`
  le plus juste d'après le nom imprimé, et écris dans `notes` chaque ligne où deux `kind` se défendent ;
- le port (« Versand », « Porto », livraison) compte dans le total et **jamais comme une ligne** (D249) : ne l'écris pas dans `items`,
  dis son montant dans `notes` ;
- un nom de ligne et sa variante (mouture, conditionnement) : écris le nom **imprimé** une seule fois, la variante dans `notes` ;
- TVA : le taux et le montant imprimés ; un HT non imprimé reste `null` ; tout arrondi à 5 centimes imprimé (« Rundung ») dans `notes`.
Écrire **un seul fichier** : lecteur A → `H13-reels/cas-5-a.json`, lecteur B → `H13-reels/cas-5-b.json` (`{ "note": "...", "cases": [...] }`,
un seul cas, id `doc14`, `usage`/`level` comme les commandes en ligne de `cas-4.json`). Ne lis jamais le fichier de l'autre lecteur.
Contrôle : `node -e "const j=require('./work/finalisation-tickets-2026-10-08/H13-reels/cas-5-<a|b>.json');const c=j.cases;if(c.length!==1||c[0].id!=='doc14')throw 1;if(!Array.isArray(c[0].expected.items))throw 2;console.log('VERITE OK',c[0].expected.items.length)"` → `VERITE OK …`.

## Possède
Lecteur A : `…/H13-reels/cas-5-a.json` ; lecteur B : `…/H13-reels/cas-5-b.json`. Rien d'autre. Ces fichiers portent ses données : jamais
dans Git, un RESULTAT ni un message (aucune valeur dans le retour, seulement `VERITE OK n`). Ne touche jamais `.codex/hooks.json`,
`source4-portable-bundle-manifest-01.json`, `functions/.env`, `functions/.secret.local`. Aucun appel à Gemini, aucune installation, aucun commit.
