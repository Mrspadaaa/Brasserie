OK — 5 verdicts versés au jeu (70 items) ; épreuve rejouée : paires 92 %, classes 82 %, seuils tenus, mais non aveugle
(à refaire par le critique Fable).

## Fichiers écrits
- `work/refonte-frontend/v4/etalonnage/jeu.json` : 5 items ajoutés, rien d'autre changé (maj, une ligne d'amendement, 5 items ; mêmes
  indentation et fins de ligne, diff git de 76 lignes ajoutées et 2 modifiées).
- `work/refonte-frontend/v4/etalonnage/epreuve/2026-10-24/` : copie du jeu, `epreuve/` (70 items anonymes, ordre et A/B retirés au sort,
  44 captures ramenées au premier écran), `cle.json`, `reponses.json`. L'ancienne épreuve (`etalonnage/epreuve/`, `cle.json`,
  `reponses.json` du 23.10) est intacte : `cle.json` et `reponses.json` du dossier parent ne sont pas dans « Possède ».
- Ce fichier. Les planches de contact de lecture sont dans le dossier temporaire de la session.

## Verdicts versés (24.10, chacun avec une capture existante de ce qu'il a jugé)
| id | verdict | capture |
|---|---|---|
| c-l23-etape-v410 | aime : « Ça c'est le bon. Comment cette info a été perdu ??? » (23.10) | base v4.10, étape Houblons (`base/captures/consolide-390.png`) |
| c-l23-biere-v410 | aime : « Ça aussi » (23.10) | base v4.10, Ma bière (`consolide-biere-390.png`) |
| c-l23-q2b | aime : « Ça oui, c'est effectivement l'un de mes choix » (23.10) | q2b, lot 15 (`q2b-b-390.png`) |
| p-l23-x3b-comparer-v410 | préfère x3b au Comparer de la base v4.10 : « Non pas cette version, une version du dryhopping… » (23.10) | x3b-390 contre `consolide-comparer-390.png` |
| p-l24-rail-froid-base-maquette | préfère le rail de sa base v4.10 à celui de la maquette 24.10 : « Le rail c'est toujours n'importe quoi… » (24.10) | `consolide-nugget-p14-620-pendant.png` contre `p22-etape-froid-pendant-post.png` ; **hors_image** (geste ; capture b = rejeu de p22, sa capture de téléphone n'est pas archivée) |

Chaque capture a été ouverte en image (étape, Ma bière, q2b, comparer base, x3b, rail base, rail maquette). Les cinq paires r6a contre
r6n2, r6p1 à r6p4 étaient déjà au jeu (16:05 le 23.10) : pas de doublon.

## Verdicts non pris (faute de capture fidèle de ce qu'il a jugé ; le pilote peut les fournir)
- Tous ses fils du 23.10 au soir portent sur la maquette d332792c (artefact 52UBb4F7iME2k3ZzsAv4x1). Aucune capture de cette version
  n'est archivée sous un nom propre : les `p22-*` et `p5-parcours/captures` montrent 5345f6ad ou la maquette reprise, déjà corrigées
  (D107 à D121). Concerne : « cette vue suggestions n'est pas la bonne » et « Bière et Suggérer divergent nettement » (rejette),
  « Header qui change ??? », « Beaucoup trop mis en avant » (Panel OSU), « cette vue est vraiment pas terrible » (fiche, liste des familles),
  « Bouton retour… UI pas terribles » (pastille, hors des sources), « Dryhopper, j'aime bien mais à revoir » (mitige, a1).
  Piste : un seul rendu de `publie.html` de `outils/pages/2026-10-23-maquette/` à 390 px, hors de ma portée (hors « Possède »).
- « ~ simulé ????? » (24.10), « Pas de bouton cancer », « Seul bouton qui ouvre l'analyse », « petit bar » : un élément, pas un écran.
- Les fils du 19.10 mêlés de réserves (« Ça j'ai beaucoup! … AA pas affichés… », l5 « un poil gros ») : entre aime et mitige, non tranché
  (règle de JEU.md).

## Sortie décisive des critères
- G1 : `JEU-BIEN-70` (65 avant).
- G2 : voir la vérification de la note en bas.

## Épreuve et étalonnage rejoués (commande `systeme.mjs etalonnage …/epreuve/2026-10-24`, hors_image exclus : 10 items sur 70)
| | paires | classes |
|---|---|---|
| tout le jeu (60 notés) | 35/38 = 92 % | 18/22 = 82 % |
| moitié A | 19/20 = 95 % | 7/9 = 78 % |
| moitié B | 16/18 = 89 % | 11/13 = 85 % |
| seuils | 80 % | 70 % |
| 23.10 (portrait v2, 25 items inédits) | 88 % | 75 % |

Par rapport au seuil (80 % et 70 %), les deux moitiés restent au-dessus. Les moitiés A et B sont retirées au sort à chaque épreuve :
ce ne sont pas celles du 23.10 (la v2 du portrait a été écrite sur l'ancienne moitié A).
Items inédits (ajoutés après la rédaction du portrait v2 : 5 paires r6a, 3 classes, x3b ; 10 dont 3 hors score) : 7/7 sur les 7 notés.
Erreurs (7) : trois paires de radar tranchées sur la seule taille du radar (p05/p08, p03/p01, p06/p01), c-l16-radar (radar à
trois couleurs jugé « aime », au lieu de rejette), c-l4-comparer (« mitige » pour « rejette »), c-l5f (« aime » pour « mitige »),
c-l23-r6n2 (« mitige » pour « aime »).

## Doutes et limites (à lire avant de s'y fier)
1. **Ce replay n'est pas aveugle.** Je n'ai pas d'outil pour lancer le critique Fable ; j'ai répondu moi-même (Sonnet), avec le portrait v2
   et les captures, après avoir lu `JEU.md` (qui donne tous les verdicts du jeu, mot pour mot) et ajouté moi-même les 5 nouveaux items.
   Les taux ci-dessus sont donc un majorant, pas la mesure du critique. Ils ne se comparent pas aux 88 % et 75 % du 23.10 (faits à
   l'aveugle). Ils servent surtout à vérifier que le pipeline tourne (items valides, captures présentes, A/B tirés, clé qui note).
2. Échantillon petit : 38 paires, 22 classes ; trois items de plus ou de moins déplacent un taux de 4 à 5 points. Les cinq nouveaux items
   sont 3 classes « aime » (choix qu'il a confirmés) : ils ne testent pas la frontière mitige/rejette.
3. Les captures de l'épreuve sont lues en planches de contact réduites (4 panneaux de 380 px de large) : la structure et la densité se
   voient, pas le détail de chaque texte. L'épreuve du 23.10 lisait les images pleine taille.
4. Les paires de rail (e14, e29, e53, e54) et de geste restent lisibles en image seulement en partie ; trois sont hors score.

DÉCISION À PRENDRE : valider l'étalonnage d'avant le tri D125 ?
- Option A (recommandée) : lancer l'agent `critique` sur `etalonnage/epreuve/2026-10-24/epreuve/` (il ne lit que ce dossier et le
  portrait), lui faire écrire `reponses-critique.json` dans `…/2026-10-24/`, puis `node scripts/agents/systeme.mjs etalonnage
  work/refonte-frontend/v4/etalonnage/epreuve/2026-10-24 --reponses reponses-critique.json` (et `--moitie A`, `--moitie B`).
  Seul ce passage vaut étalonnage au sens de L27.
- Option B : accepter ce replay comme contrôle de bon fonctionnement seulement et trier avec le critique sous le régime actuel
  (« signale, ne rejette pas »). Moins sûr.

Portrait : aucun changement proposé. Les erreurs vues (radar jugé sur sa taille, radar multicolore trop bien noté) sont déjà dans
`critique.md` (« trop clément devant un radar à plusieurs couleurs ») ; si le replay aveugle les retrouve, ajouter alors au portrait
§ 6 : « Entre deux radars, la taille ne tranche pas : regarder ce que le radar dit (zone du style, inconnu hachuré, intervalles) ».
Pour mieux tester le portrait, verser aussi les verdicts du 23.10 soir dès qu'une capture de d332792c existe (surtout des rejets : ils
manquent au jeu, qui n'a que 8 classes « rejette » sur 28).

CONNAISSANCE : le jeu d'étalonnage ne contient aucune capture de la maquette d332792c (celle des 17 fils du 23.10 au soir) ni de sa
version 24.10 avant D123 : ses verdicts les plus récents sur des vues rejouées n'y entrent pas faute d'image fidèle.
LEÇON PROPOSÉE : un étalonnage ne peut pas être refait par l'agent qui a lu le jeu ou qui y a ajouté les items ; le pilote lance le
critique sur le dossier d'épreuve seul (cette voie n'avait pas l'outil pour le faire à l'aveugle).
