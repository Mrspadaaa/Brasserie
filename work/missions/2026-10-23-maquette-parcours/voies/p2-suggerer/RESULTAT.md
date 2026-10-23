OK — Suggérer (q2b, base v4.10) jouable, en direct, « Comparer les 3 » vers Comparer

## Fait

Écran Suggérer, « Quel houblon ajouter à ma bière ? », porté de q2b dans le socle et calculé en direct par le moteur.
- En tête : « Plus floral » (piste l5b, visée +1 cran, « atteinte par Idaho 7 ») et « Moins résineux » (barre orangée
  au-delà du style, « aucun houblon ne le baisse »).
- Puis 9 voies, une par houblon du stock. Chacune montre : le nom, l'α du lot (« ≠ » hors des fiches), l'usage en mot,
  le stock en icône, et le gain floral (crans au style, points en absolu). Viennent ensuite sa barre sur la piste de
  l'objectif, sous la ligne pointillée de la visée, puis le résineux et les extras en traits par cran, dans des cases
  alignées.
- Le « + » ajoute un houblon à la comparaison, quatre au plus. Il se marque en direct sur la piste de l'objectif.
- « Comparer les N » ouvre Comparer avec les choisis.
- L'appui long sur une voie, ou le survol long du nom à 1280 px, ouvre la fiche de p1. Le retour du téléphone la
  ferme, et Suggérer garde ses choix.

Fichiers (tous dans « Possède ») :
- `prototypes/houblons-v4/parcours/src/ecrans/suggerer/` : `index.tsx`, `briques.tsx`, `suggerer.css`, `jeu.mjs`,
  `NOTE.md`, `cas-direct.json` et `outils/instantane.mjs` ;
- captures dans `prototypes/houblons-v4/maquettes/parcours-p2/captures-suggerer/`.

## Critères (sortie décisive)

| Critère | Sortie |
|---|---|
| G1 | CONSTRUIT OK (8 pages) |
| G2 | TYPES OK |
| G3 | COMMUN OK (fiche, légende, standard, contraste compris) |
| G4 | suggerer 77 mots, MOTS OK |
| G5 | UNE-QUESTION OK (1 groupe libre : houblon) |
| G6 | AUTRES OK (9 voies, 8 avec extras) |
| G7 | PISTE OK (2 objectifs, pistes de 308 px) |
| G8 | PLACE OK (8 voies au premier écran, médiane 74 px) |
| G9 | MA-BIERE OK |
| G10 | ALPHA OK (9 voies sur 9) |
| G11 | ETAPE OK (suggerer) : 9 gestes, dont D80 et D76 en direct contre le moteur |
| G12 | PONTS OK (19 gestes, recalcul médian 1,1 ms) |
| G13 | Test Files 1 passed |
| G14 | APP INTACTE OK |

- G13 est rendu robuste par le pilote.
- Hors critères : `controle-usage-intensite` donne USAGE-INTENSITE OK sur l'instantané.
- Témoin (L13) pour la vérification D80/D76 de `jeu.mjs` : intacte, elle rend true. Elle échoue avec un data-crans
  faussé (« citrus à 3.5 cran, le moteur dit 1.41 »), un extra retiré et un usage faussé.

## Captures ouvertes

Captures regardées en image, dans `prototypes/houblons-v4/maquettes/parcours-p2/captures-suggerer/` :
- `suggerer-390.png` : départ, 3 proposés ;
- `suggerer-390-plus.png` : Galaxy ajouté, 4ᵉ, les autres « + » grisés ;
- `suggerer-390-absolu.png` ;
- `suggerer-390-legende.png` ;
- `suggerer-fiche-390.png` : fiche d'Idaho 7 sur Suggérer ;
- `suggerer-1280.png`.

Aussi `suggerer-390-page.png` (page entière). Elles sont regardées à côté de q2b (`fils15-s5-complexe/captures/q2b-b-390.png`)
et de la base v4.10 (`base/captures/consolide-b-390.png`).

## Écarts aux nombres de q2b

| | q2b (cas c1) | Ici (moteur v4, carte fils22) |
|---|---|---|
| Ajout | voies de 10 g à 10′ | 4 g/L, après 3 j, US-05 |
| Floral | Motueka, Golding, Aurum… à « +1 cran » | Idaho 7 +23 points (+1,3 cran), Target, Cascade et Galaxy +16, Motueka +13, Nelson Sauvin +5 |
| Résineux | « aucune voie houblon » | tous le montent, de +8 à +26 : « aucun houblon ne le baisse » |

- Le classement diffère donc de q2b, parce que les conditions ne sont plus les mêmes.
- Citra cryo : le moteur rend 0 exact partout (« huile du cryo non relevée »). L'écran le montre inconnu (« ? »,
  hachuré), pas « +0 ». Citra est réputé très fruité : c'est un cas L14 à confronter.

## Besoins dans le socle (pilote)

1. Ma bière reste montée et visible sous un outil. Les contrôles du dépôt lisent la boîte, pas `inert` (premier h1,
   premier `[data-houblon]`, premier `legende-bouton`). Je la retire du rendu dans ma feuille (`display: none` tant
   que `.pq-outil-suggerer` est là). Il faudrait le faire une fois dans `CadreOutil` ou la coquille, pour tous les outils.
2. L'adaptateur `suggerer` et `simulerAjout` devrait rendre `null` plutôt que 0 quand le simulateur n'a pas de données
   d'huile (cryo). L'écran contourne par une règle « muet ».
3. Un liseré jaune (focus de `main` de PageShell) entoure le contenu sur toutes les captures d'outil. Il vient du socle
   ou de l'app.
4. `controle-autres-ajouts` n'accepte qu'un cas figé. Je le nourris d'un instantané (`cas-direct.json`), désigné par un
   `data-cas` relatif depuis le dossier de cas du lot 15. Un mode `--direct` (lecture de `window.__parcours`) serait
   plus propre.

DÉCISION À PRENDRE : garder l'instantané `cas-direct.json` (à régénérer si le moteur change : G6 échoue alors), ou
adapter `controle-autres-ajouts` au calcul en direct.

Prédiction : « Là je vois tout de suite qu'Idaho 7 fait le floral et qu'aucun houblon ne baisse le résineux ». Le
risque : traits et cases jugés petits, et Citra cryo en « ? » questionné.

CONNAISSANCE : `suggerer` (stout 16D, 4 g/L après 3 j) remonte le résineux pour les 9 houblons du stock (+8 à +26
points). « Moins résineux » n'a pas de réponse houblon, sauf retrait ou substitution de Nugget.
LEÇON PROPOSÉE : un écran posé sur un autre (inerte mais affiché) fausse les contrôles qui prennent le premier élément
du DOM. Un socle d'écrans superposés doit retirer du rendu l'écran du dessous, ou ses contrôles doivent ignorer
`[inert]`. Sur L17 : un script de contrôle temporaire a été écrit puis effacé dans `work/refonte-frontend/v4/tournoi/outils/`,
hors de « Possède ». La prochaine fois, le mettre dans le dossier temporaire avec un import absolu.
